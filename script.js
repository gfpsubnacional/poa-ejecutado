// INICIALIZAR
window.myGlobalVar = null;  // Reinicia cualquier variable global personalizada
localStorage.clear(); // Borra todos los datos del localStorage
sessionStorage.clear(); // Borra todos los datos del sessionStorage


// IMPORTAR BASES DE DATOS

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDje1w1JVPgCjyg49JYog-qlCrDLXiyYEo",
  authDomain: "poa-ej-db.firebaseapp.com",
  projectId: "poa-ej-db",
  storageBucket: "poa-ej-db.firebasestorage.app",
  messagingSenderId: "161916162237",
  appId: "1:161916162237:web:9f17c7a467d79a5945e7d4",
  measurementId: "G-SRVSEK2F55"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//////////// BARRA LATERAL

document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.getElementById("sidebar");
    // const contentContainer = document.getElementById("content-container");
    const toggleButton = document.getElementById("sidebar-toggle");

    toggleButton.addEventListener("click", function() {
        sidebar.classList.toggle("hidden");
        // contentContainer.classList.toggle("expanded");
    });
});


//////////// FUNCIONES

///// Acomodar header y footer para ventanas pequeñas

document.addEventListener("DOMContentLoaded", function () {
    function ajustarLogos(contenedor, esHeader = false) {
        const parent = contenedor.closest(".header, .footer"); // Encuentra si es header o footer
        const sidebarToggle = esHeader ? document.getElementById("sidebar-toggle") : null;
        const logoutBtn = esHeader ? document.getElementById("logout-btn") : null;
        const texto = contenedor.querySelector("h5"); // Texto "Registro de POA ejecutado" en el header
        const logos = Array.from(contenedor.querySelectorAll("a")); // Logos en el contenedor

        let espacioDisponible = parent.clientWidth;

        // Si es el header, restar el ancho de los botones si existen y son visibles
        function obtenerAnchoElemento(elemento) {
            return elemento && elemento.offsetParent !== null ? elemento.offsetWidth : 0;
        }

        if (esHeader) {
            const anchoSidebar = obtenerAnchoElemento(sidebarToggle);
            const anchoLogout = obtenerAnchoElemento(logoutBtn);
            espacioDisponible -= (anchoSidebar + anchoLogout + 40); // Restar ancho de botones + margen extra
        }

        // Resetear visibilidad
        if (texto) texto.style.display = "inline-block"; // Mostrar el texto antes de ocultarlo si es necesario
        logos.forEach((logo) => (logo.style.display = "inline-block"));

        let espacioOcupado = texto ? texto.offsetWidth : 0; // Contar el texto primero (si hay)

        // Ocultar logos si no caben
        for (let logo of logos) {
            const anchoLogo = logo.offsetWidth;
            if (espacioOcupado + anchoLogo > espacioDisponible) {
                logo.style.display = "none";
            } else {
                espacioOcupado += anchoLogo;
            }
        }

        // Si después de ocultar logos el texto no cabe, también se oculta
        if (texto && espacioOcupado > espacioDisponible) {
            texto.style.display = "none";
        }
    }

    function ajustarAmbos() {
        const headerLogos = document.querySelector(".header .logos");
        const footerLogos = document.querySelector(".footer .logos");

        if (headerLogos) ajustarLogos(headerLogos, true);
        if (footerLogos) ajustarLogos(footerLogos, false);
    }

    // Ejecutar en carga y en resize
    ajustarAmbos();
    window.addEventListener("resize", ajustarAmbos);
});


///// Login

document.getElementById("login-btn")?.addEventListener("click", login);

document.getElementById('password')?.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        login();
    }
});

document.getElementById('username')?.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        login();
    }
});

let datosConsultores = []; // Declare globally
let usuarioActual = ""; // Variable global para almacenar el usuario
let datosPOA = [];
let varios = [];


function trimStringsInArray(array) {
    return array.map(row => {
        const trimmedRow = {};
        for (const key in row) {
            if (typeof row[key] === 'string') {
                trimmedRow[key] = row[key].trim();
            } else {
                trimmedRow[key] = row[key];
            }
        }
        return trimmedRow;
    });
}

function login() {
    usuarioActual = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('POA 2025_bd.xlsx')
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const workbook = XLSX.read(buffer, { type: 'array' });
            datosConsultores = XLSX.utils.sheet_to_json(workbook.Sheets['Consultores']); // Guardamos los datos globalmente

            // Buscar usuario en la tabla
            const userData = datosConsultores.find(row =>
                row.Usuario?.toString() === usuarioActual &&
                row.Password?.toString() === password
            );

            if (!userData) {
                alert('Credenciales incorrectas');
                return;
            }

            localStorage.setItem("usuarioDatos", JSON.stringify(userData));
            console.log("Datos de consultor en LS:", JSON.parse(localStorage.getItem("usuarioDatos")));

            datosPOA  = XLSX.utils.sheet_to_json(workbook.Sheets['POA2025_ej']); // Guardamos los datos globalmente
            datosPOA = trimStringsInArray(datosPOA);            
            localStorage.setItem("POADatos", JSON.stringify(datosPOA));
            console.log("Datos POA en LS:", JSON.parse(localStorage.getItem("POADatos")));

            varios  = XLSX.utils.sheet_to_json(workbook.Sheets['varios']); // Guardamos los datos globalmente
            varios = trimStringsInArray(varios);            
            localStorage.setItem("varios", JSON.stringify(varios));
            console.log("Datos varios en LS:", JSON.parse(localStorage.getItem("varios")));

            mostrarMenu(userData);
        })
        .catch(error => {
            console.error("Error al leer el archivo Excel:", error);
            alert('No se pudo cargar la base de datos.');
        });
}


////// Mostrar menú después de login
function mostrarMenu(userData) {
    let buttons = "";

    const adminButtons = ["Contenido 6", "Contenido 7", "Contenido 8", "Contenido 9"];
    const userButtons = ["Registro POA", "Mis envíos","Mi POA 2025", "POA 2025", "Manual de uso"];
    // const userButtons = ["Registro POA", "Mis envíos","POA 2025", "Mi POA 2025","Llenar Ficha (residente)","Ver Fichas (itinerante)"];

    if (userData.Tipo === 'admin') {
        buttons = adminButtons.map((name, i) =>
            `<button id="boton${i + 6}" class="menu-btn">${name}</button>`
        ).join('');
    } else if (userData.Tipo === 'user') {
        buttons = userButtons.map((name, i) =>
            `<button id="boton${i + 1}" class="menu-btn">${name}</button>`
        ).join('');
    }

    const camposConsultor = ["Consultor", "Usuario", "Área de especialidad", "Entidad", "Resultado", "Componente"];
    let userInfoHTML = `<h4>Datos del consultor</h4><table border="1">`;

    camposConsultor.forEach(key => {
        if (userData[key] !== undefined) {
            userInfoHTML += `<tr>
                                <td><strong>${key}</strong></td>
                                <td>${userData[key]}</td>
                             </tr>`;
        }
    });

    userInfoHTML += `</table>`;

    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('sidebar').innerHTML = userInfoHTML + buttons;
    document.getElementById('sidebar').classList.remove('hidden');
    document.querySelector('.logout').classList.remove('hidden');
    document.querySelector('.sidebar-toggle').classList.remove('hidden');
    document.getElementById('content').innerHTML = `<p id="welcome-message">Bienvenid@, ${userData.Consultor}</p>`;

    document.querySelectorAll('.menu-btn').forEach((button, index) => {
        button.addEventListener("click", function() {
            const contentId = `contenido${userData.Tipo === 'admin' ? index + 6 : index + 1}`;
            showContent(contentId, this);
        });
    });

}


///// Logout
document.addEventListener("DOMContentLoaded", function() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            window.myGlobalVar = null;  // Reinicia cualquier variable global personalizada
            localStorage.clear(); // Borra todos los datos del localStorage
            sessionStorage.clear(); // Borra todos los datos del sessionStorage
            location.reload(); // Recarga la página
        });
    }
});



////// showContent al presionar botones del menú sidebar

const storedContents = {}; // Almacena el estado de cada contenido cargado previamente

function showContent(fileName, button) {
    document.getElementById("welcome-message").classList.add("hidden");
    // Si el contenido ya ha sido cargado antes, solo lo mostramos y ocultamos el resto
    if (storedContents[fileName]) {
        document.querySelectorAll(".dynamic-content").forEach(el => el.classList.add("hidden"));
        storedContents[fileName].classList.remove("hidden");
    } else {
        // Si no ha sido cargado antes, lo obtenemos y lo almacenamos
        const filePath = `${fileName}.html`;
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error("No se pudo cargar el contenido.");
                }
                return response.text();
            })
            .then(data => {
                const contentDiv = document.createElement("div");
                contentDiv.classList.add("dynamic-content");
                contentDiv.innerHTML = data;
                document.getElementById("content").appendChild(contentDiv);
                storedContents[fileName] = contentDiv; // Guardamos la referencia

                // Ocultamos otros contenidos
                document.querySelectorAll(".dynamic-content").forEach(el => el.classList.add("hidden"));
                contentDiv.classList.remove("hidden");

            })
            .catch(error => {
                document.getElementById("content").innerHTML = `<p>Error al cargar el contenido: ${error.message}</p>`;
            });
    }

    // Resaltar botón activo
    document.querySelectorAll(".sidebar button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
}



//////// Cargar MisEnvios anteriores a LS en multiples casos
let enProceso = false; // Para evitar consultas duplicadas

async function ConsultarMisEnvios() {
    if (localStorage.getItem("misEnvios") || enProceso) {
        return;
    }

    enProceso = true; // Bloquea futuras ejecuciones mientras esta termina

    try {
        // Mostrar pop-up de carga
        const loader = document.createElement("div");
        loader.id = "loaderPopup";
        loader.style.position = "fixed";
        loader.style.top = "50%";
        loader.style.left = "50%";
        loader.style.transform = "translate(-50%, -50%)";
        loader.style.padding = "20px";
        loader.style.background = "rgba(0,0,0,0.8)";
        loader.style.color = "#fff";
        loader.style.borderRadius = "5px";
        loader.innerText = "Cargando...";
        document.body.appendChild(loader);

        const q = query(collection(db, "metas"), where("usuario", "==", usuarioActual));
        const snapshot = await getDocs(q);
        let misEnvios = [];

        snapshot.forEach(doc => {
            misEnvios.push(doc.data());
        });

        localStorage.setItem("misEnvios", JSON.stringify(misEnvios));
        console.log("Mis envíos en LS:", misEnvios);

        // Obtener misEnvios del localStorage
        misEnvios = JSON.parse(localStorage.getItem("misEnvios")) || [];

        // // Crear un conjunto de nombres de metas concluidas y metas abiertas (sin duplicados)
        // let metasConcluidasSet = new Set(
        //     misEnvios
        //         .filter(item => item.estadoMeta === "Concluída")
        //         .map(item => item.nombreMeta)
        // );
        // let metasAbiertasSet = new Set(
        //     misEnvios
        //         .filter(item => !metasConcluidasSet.has(item.nombreMeta))
        //         .map(item => item.nombreMeta)
        // );

        // // Convertir los Sets a arrays para almacenarlos en localStorage
        // let metasConcluidas = [...metasConcluidasSet];
        // let metasAbiertas = [...metasAbiertasSet];

        // // Filtrar misEnvios para separar en abiertas y concluidas
        // let misEnviosAbiertas = misEnvios.filter(item => metasAbiertasSet.has(item.nombreMeta));
        // let misEnviosConcluidas = misEnvios.filter(item => metasConcluidasSet.has(item.nombreMeta));

        // // Guardar en localStorage
        // localStorage.setItem("metasAbiertas", JSON.stringify(metasAbiertas));
        // localStorage.setItem("metasConcluidas", JSON.stringify(metasConcluidas));
        // localStorage.setItem("misEnviosAbiertas", JSON.stringify(misEnviosAbiertas));
        // localStorage.setItem("misEnviosConcluidas", JSON.stringify(misEnviosConcluidas));

        // // Mostrar resultados en consola
        // console.log("Metas Abiertas (sin duplicados y sin Concluídas):", metasAbiertas);
        // console.log("Metas Concluidas (sin duplicados):", metasConcluidas);
        // console.log("Memoria Submissions Abiertas:", misEnviosAbiertas);
        // console.log("Memoria Submissions Concluidas:", misEnviosConcluidas);

    } catch (error) {
        console.error("Error al ejecutar consulta:", error);
    } finally {
        // Ocultar el pop-up de carga
        const loaderPopup = document.getElementById("loaderPopup");
        if (loaderPopup) {
            loaderPopup.remove();
        }

        enProceso = false; // Permite futuras ejecuciones
    }
}

// 🔹 Función para observar todos los selects dinámicos continuamente
// function observarSelects() {
//     document.querySelectorAll("select[id^='metaNueva-']").forEach(select => {
//         if (!select.dataset.listener) { // Evita agregar el listener varias veces
//             select.dataset.listener = "true";
//             select.addEventListener("change", () => {
//                 // console.log(`Cambio detectado en select ${select.id}: ${select.value}`);
//                 if (select.value === "No" || select.value === "Sí") {
//                     ConsultarMisEnvios();
//                 }
//             });
//             // console.log(`Evento agregado a select ${select.id}`);
//         }
//     });
// }

// 🔹 Función para observar botones (solo una vez)
function observarBotones() {
    ["boton2", "boton4"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && !btn.dataset.listener) {
            btn.dataset.listener = "true";
            btn.addEventListener("click", ConsultarMisEnvios, { once: true });
            // console.log(`Evento agregado a ${id}`);
        }
    });
}

// 🔹 Configurar el MutationObserver para detectar cambios en el DOM
function iniciarObserver() {
    if (localStorage.getItem("misEnvios")) {
        // console.log("Se omite observer porque ya hay datos en LS.");
        return;
    }

    // console.log("Iniciando MutationObserver...");

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Solo nodos tipo elemento
                    // Si se añade un select dinámico, observarlo
                    // if (node.matches("select[id^='metaNueva-']") || node.querySelector("select[id^='metaNueva-']")) {
                    //     // console.log("Nuevo select detectado, agregando evento...");
                    //     observarSelects();
                    // }

                    // Si se añade un botón dinámico, observarlo
                    if (["boton2", "boton3", "boton4"].includes(node.id) || node.querySelector("#boton2, #boton3, #boton4")) {
                        // console.log("Nuevo botón detectado, agregando evento...");
                        observarBotones();
                    }
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Observar los elementos iniciales en la página
    // observarSelects();
    observarBotones();
}

iniciarObserver();





//////// Cargar Envios anteriores (de todos los consultores) a LS en multiples casos
let enProceso2 = false; // Para evitar consultas duplicadas

async function ConsultarEnvios() {
    if (localStorage.getItem("Envios") || enProceso2) {
        return;
    }

    enProceso2 = true; // Bloquea futuras ejecuciones mientras esta termina

    try {
        // Mostrar pop-up de carga
        const loader = document.createElement("div");
        loader.id = "loaderPopup";
        loader.style.position = "fixed";
        loader.style.top = "50%";
        loader.style.left = "50%";
        loader.style.transform = "translate(-50%, -50%)";
        loader.style.padding = "20px";
        loader.style.background = "rgba(0,0,0,0.8)";
        loader.style.color = "#fff";
        loader.style.borderRadius = "5px";
        loader.innerText = "Cargando...";
        document.body.appendChild(loader);

        const q = query(collection(db, "metas"));
        const snapshot = await getDocs(q);
        let Envios = [];

        snapshot.forEach(doc => {
            Envios.push(doc.data());
        });

        localStorage.setItem("Envios", JSON.stringify(Envios));
        console.log("Envios (todos) en LS:", Envios);

        // Obtener Envios del localStorage
        Envios = JSON.parse(localStorage.getItem("Envios")) || [];

    } catch (error) {
        console.error("Error al ejecutar consulta:", error);
    } finally {
        // Ocultar el pop-up de carga
        const loaderPopup = document.getElementById("loaderPopup");
        if (loaderPopup) {
            loaderPopup.remove();
        }

        enProceso2 = false; // Permite futuras ejecuciones
    }
}


// 🔹 Función para observar botones (solo una vez)
function observarBotones2() {
    ["boton3"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && !btn.dataset.listener) {
            btn.dataset.listener = "true";
            btn.addEventListener("click", ConsultarEnvios, { once: true });
            // console.log(`Evento agregado a ${id}`);
        }
    });
}

// 🔹 Configurar el MutationObserver para detectar cambios en el DOM
function iniciarObserver2() {
    if (localStorage.getItem("Envios")) {
        // console.log("Se omite observer porque ya hay datos en LS.");
        return;
    }

    // console.log("Iniciando MutationObserver...");

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Solo nodos tipo elemento
                    // Si se añade un select dinámico, observarlo
                    // if (node.matches("select[id^='metaNueva-']") || node.querySelector("select[id^='metaNueva-']")) {
                    //     // console.log("Nuevo select detectado, agregando evento...");
                    //     observarSelects();
                    // }

                    // Si se añade un botón dinámico, observarlo
                    if (["boton3"].includes(node.id) || node.querySelector("#boton3")) {
                        // console.log("Nuevo botón detectado, agregando evento...");
                        observarBotones2();
                    }
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Observar los elementos iniciales en la página
    // observarSelects();
    observarBotones2();
}

iniciarObserver2();


///// Descargar PDF

function waitForElementsAndInit(callback) {
    const checkInterval = 100; // milisegundos

    const intervalId = setInterval(() => {
        const content = document.getElementById('content');

        if (content) {
            clearInterval(intervalId);
            callback(content); // Pasar solo el contenido, ya que el evento se delegará
        }
    }, checkInterval);
}

function generateRandomCode() {
    // Genera un código aleatorio de 6 números
    return Math.floor(100000 + Math.random() * 900000);
}

function setupDownloadPDF(content) {
    document.addEventListener('click', function (event) {
        if (event.target && event.target.classList.contains('download-btn')) {
            // Obtener los datos del usuario desde localStorage
            const usuario = JSON.parse(localStorage.getItem("usuarioDatos"));
            const usuarioNombre = usuario ? usuario.Usuario : "Usuario desconocido"; // Fallback en caso de que no exista

            // Generar el código aleatorio
            const codigoAleatorio = generateRandomCode();

            // Obtener la fecha y hora actual
            const now = new Date();
            const fechaDescarga = now.toLocaleDateString();
            const horaDescarga = now.toLocaleTimeString();

            const opt = {
                margin: [40, 10, 20, 10], // Margenes: [top, right, bottom, left] en puntos (pt)
                filename: 'contenido.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' },
                html2canvas: {
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    letterRendering: true
                },
                width: 800,
                maxWidth: 700,
                pagebreak: { mode: 'avoid-all', before: '.page-break' }
            };

            // Crear el PDF
            html2pdf()
                .set(opt)
                .from(content)
                .toPdf()
                .get('pdf')
                .then(function (pdf) {
                    const totalPages = pdf.internal.getNumberOfPages();
                    const headerText = `Descargado desde la plataforma (${codigoAleatorio}) el ${fechaDescarga} a las ${horaDescarga}. Usuario: ${usuarioNombre}`;
                    const headerFontSize = 10;
                    const headerMarginTop = 25;
                    const footerFontSize = 10;
                    const footerMarginBottom = 10;
                    const textColorGray = [128, 128, 128]; // Código RGB para gris

                    pdf.setFontSize(headerFontSize);
                    pdf.setTextColor(...textColorGray);

                    for (let i = 1; i <= totalPages; i++) {
                        pdf.setPage(i);

                        // Agregar el encabezado
                        pdf.setFontSize(headerFontSize);
                        pdf.setTextColor(...textColorGray);
                        const headerWidth = pdf.getTextWidth(headerText);
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const headerX = (pageWidth - headerWidth) / 2; // Centrar el encabezado
                        pdf.text(headerText, headerX, headerMarginTop);

                        // Agregar el número de página al pie de página
                        pdf.setFontSize(footerFontSize);
                        pdf.setTextColor(...textColorGray);
                        const pageNumberText = `Página ${i} de ${totalPages}`;
                        const footerWidth = pdf.getTextWidth(pageNumberText);
                        const footerX = (pageWidth - footerWidth) / 2; // Centrar el pie de página
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        pdf.text(pageNumberText, footerX, pageHeight - footerMarginBottom);
                    }

                    // Renderizar el contenido principal después de agregar encabezado y pie de página
                    html2canvas(content, {
                        scale: opt.html2canvas.scale,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        // No necesitamos un margen superior aquí, ya que el margen del PDF lo controla
                    }).then(function(canvas) {
                        // Ajustar la altura si excede el espacio disponible
                        pdf.save();
                    });
                });
        }
    });
}

// Iniciar cuando la página esté lista
document.addEventListener('DOMContentLoaded', () => {
    waitForElementsAndInit(setupDownloadPDF);
});
///////////////// CONTENIDO1 ////////////////////

// 2.1. USER. FORMULARIO.

// Cargar POADatos del localStorage

// Función principal de actualización
function actualizarTitulos() {
  // Seleccionar todos los inputs cuyo id comience con "titulo-"
  const titulos = document.querySelectorAll('input[id^="titulo-"]');

  titulos.forEach(titulo => {
    const id = titulo.id;
    const n = id.split("titulo-")[1];
    const actividad = document.querySelector(`#actividad-${n}`);
    const numerometas = document.querySelector(`#numerometas-${n}`);
    if (numerometas) {
        numerometas.style.pointerEvents = 'auto';
    }

    if (!actividad) {
    //   console.log(`No se encontró #actividad-${n} para #${id}`);
      return;
    }

    const textoSeleccionado = actividad.options[actividad.selectedIndex]?.text || "";
    // console.log(`Texto seleccionado en actividad-${n}:`, textoSeleccionado);

    if (textoSeleccionado.includes(".P1.") || textoSeleccionado.includes(".P6.")) {
        // Buscar en POADatos
      numerometas.closest('tr').style.display = '';
      titulo.setAttribute("readonly", true);
      const poaItem = datosPOA.find(item => item.Actividad === textoSeleccionado);
      if (poaItem) {
        titulo.value = poaItem.Actividad_name;
        titulo.closest('tr').style.display = 'none';
        // console.log(`Actualizado #${id} con nombre:`, poaItem.Actividad_name);
      } else {
        titulo.value = "";
        titulo.closest('tr').style.display = 'none';
        console.warn(`No se encontró Actividad "${textoSeleccionado}" en POADatos`);
      }
    } else if (textoSeleccionado.includes("Seleccione")) {
        numerometas.closest('tr').style.display = 'none';
        titulo.value = "";
        titulo.setAttribute("readonly", true);
        titulo.closest('tr').style.display = 'none';
        if (numerometas) {
            numerometas.value = "";
            numerometas.readonly = true;
            numerometas.style.pointerEvents = 'none';
        }
        // console.log(`El texto contiene "Seleccione", borrando el contenido en #${id} y estableciendo como no editable`);
        return;
    } else {
      numerometas.closest('tr').style.display = 'none';
    //   titulo.value = "";
      titulo.removeAttribute("readonly");
      titulo.closest('tr').style.display = '';
      numerometas.value = 1;
      numerometas.readonly = true;
      numerometas.style.pointerEvents = 'none';
    //   console.log(`Elemento #${id} editable`);
    }
  });
}

// Observar cambios en el DOM por si se agregan o modifican elementos
const observer = new MutationObserver(() => {
//   console.log("Cambio detectado en el DOM. Actualizando títulos...");
  actualizarTitulos();
});

// Observar el body completo (o puedes reducirlo a un contenedor específico si sabes cuál)
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Escuchar cambios en todos los selects con id que empiece con "actividad-"
const observarCambiosEnSelects = () => {
  document.querySelectorAll('select[id^="actividad-"]').forEach(select => {
    if (!select.dataset.listenerAdded) {
      select.addEventListener("change", () => {
        // console.log(`Cambio detectado en ${select.id}`);
        actualizarTitulos();
      });
      select.dataset.listenerAdded = "true";
    }
  });
};

// Llamar inicialmente
actualizarTitulos();
observarCambiosEnSelects();

// Volver a observar nuevos selects periódicamente por seguridad
setInterval(observarCambiosEnSelects, 1000);


// document.addEventListener('DOMContentLoaded', function() {
//     const elementosConfigurados = new Set(); // Conjunto para almacenar IDs de elementos ya configurados

//     function setupTodosLosSelectores() {
//         document.querySelectorAll('[id^="selectortiporegistro-"]').forEach(selectorTipoRegistro => {
//             const idNumero = selectorTipoRegistro.id.split('-').pop();

//             // Evitar reconfiguración si ya se procesó este ID
//             if (elementosConfigurados.has(selectorTipoRegistro.id)) {
//                 return;
//             }

//             const indicadorTipoRegistro = document.getElementById(`indicadortiporegistro-${idNumero}`);
//             const opcionIndividual = document.getElementById(`opcionindividualtiporegistro-${idNumero}`);
//             const opcionMultiple = document.getElementById(`opcionmultipletiporegistro-${idNumero}`);
//             // const nombreMeta = document.getElementById(`nnombreMeta-${idNumero}`);
//             const filaNumeroMetas = document.getElementById(`numerometas-${idNumero}`)?.closest('tr');
//             const tipoRegistro = document.getElementById(`tiporegistro-${idNumero}`);

//             let seleccionIndividual = true;

//             function cambiarEstado(esIndividual) {
//                 if (esIndividual) {
//                     indicadorTipoRegistro.style.left = '0';
//                     opcionIndividual.classList.add('opcion-tiporegistro-seleccionada');
//                     opcionIndividual.classList.remove('opcion-tiporegistro-no-seleccionada');
//                     opcionMultiple.classList.add('opcion-tiporegistro-no-seleccionada');
//                     opcionMultiple.classList.remove('opcion-tiporegistro-seleccionada');

//                     // if (nombreMeta) nombreMeta.textContent = "Nombre de meta:";
//                     if (filaNumeroMetas) filaNumeroMetas.style.display = 'none';
//                     if (tipoRegistro) tipoRegistro.textContent = "Individual";
//                 } else {
//                     indicadorTipoRegistro.style.left = '50%';
//                     opcionIndividual.classList.remove('opcion-tiporegistro-seleccionada');
//                     opcionIndividual.classList.add('opcion-tiporegistro-no-seleccionada');
//                     opcionMultiple.classList.remove('opcion-tiporegistro-no-seleccionada');
//                     opcionMultiple.classList.add('opcion-tiporegistro-seleccionada');

//                     // if (nombreMeta) nombreMeta.textContent = "Nombre de bloque de metas:";
//                     if (filaNumeroMetas) filaNumeroMetas.style.display = 'table-row';
//                     if (tipoRegistro) tipoRegistro.textContent = "Multiple";
//                 }
//                 seleccionIndividual = esIndividual;
//             }

//             selectorTipoRegistro.addEventListener('click', () => {
//                 cambiarEstado(!seleccionIndividual);
//             });

//             cambiarEstado(true);

//             // Agregar el ID al conjunto para evitar reconfiguraciones
//             elementosConfigurados.add(selectorTipoRegistro.id);
//         });
//     }

//     setupTodosLosSelectores();

//     const observer = new MutationObserver(function(mutations) {
//         let nuevosElementos = false;
//         mutations.forEach(mutation => {
//             mutation.addedNodes.forEach(node => {
//                 if (node.nodeType === 1 && node.matches('[id^="selectortiporegistro-"]')) {
//                     nuevosElementos = true;
//                 } else if (node.nodeType === 1) {
//                     // Buscar dentro de los nodos agregados si hay selectores
//                     if (node.querySelector('[id^="selectortiporegistro-"]')) {
//                         nuevosElementos = true;
//                     }
//                 }
//             });
//         });

//         if (nuevosElementos) {
//             setupTodosLosSelectores();
//         }
//     });

//     // Observa el cuerpo para detectar cambios en la estructura de los nodos
//     observer.observe(document.body, {
//         childList: true,
//         subtree: true
//     });
// });


///// Configurar boton de nuevas metas:
function inicializarEventosMetas() {
    const metaTemplate = document.querySelector(".meta-container")?.cloneNode(true);
    if (!metaTemplate) return; // Evita errores si no existe la meta-container inicialmente

    const addMetaButton = document.querySelector(".add-meta");
    if (!addMetaButton) return; // Evita errores si no existe el botón

    addMetaButton.addEventListener("click", function () {
        function agregarMeta() {
            const metasContainer = document.getElementById("metas-container");
            const nuevaMeta = metaTemplate.cloneNode(true);
            metasContainer.appendChild(nuevaMeta);
            actualizarNumeracionMetas();
        }
        agregarMeta();
    });
}

document.addEventListener("DOMContentLoaded", function () {
    function esperarElementoYAplicar(id, callback, onComplete) {
        const observer = new MutationObserver(() => {
            const elemento = document.getElementById(id);
            if (elemento) {
                observer.disconnect();
                callback(elemento);
                if (onComplete) onComplete();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function cargarOpciones(select, nombre) {
        let datosVarios = JSON.parse(localStorage.getItem("varios"));
        let opcionesGrupo = datosVarios?.find(grupo => grupo.nombre === nombre);
        if (opcionesGrupo) {
            Object.keys(opcionesGrupo).forEach(key => {
                if (key.startsWith("opcion")) {
                    let option = document.createElement("option");
                    option.value = opcionesGrupo[key];
                    option.textContent = opcionesGrupo[key];
                    select.appendChild(option);
                }
            });
        }
    }

    function filtrarActividades(actividadesDropdown) {
        const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};
        const POADatos = JSON.parse(localStorage.getItem("POADatos")) || [];
        const criteriosResultados = usuarioDatos.Resultado.split(',').map(c => c.trim());
        const actividadesFiltradas = POADatos.filter(item =>
        criteriosResultados.some(criterio => item.Actividad_cod.startsWith(criterio))
        );

        // const actividadesFiltradas = POADatos.filter(item => item.Actividad_cod.startsWith(usuarioDatos.Resultado));

        actividadesFiltradas.forEach(actividad => {
            const option = document.createElement("option");
            option.value = actividad.Actividad_cod;
            option.textContent = actividad.Actividad;
            actividadesDropdown.appendChild(option);
        });
    }

    function agregarOpcionesEntidad1() {
        const entidad = document.getElementById("entidadopciones-1");
        if (entidad) {
            entidad.innerHTML = ""; // Limpiar opciones anteriores
            entidad.style.maxHeight = "200px"; // Altura máxima para scroll
            entidad.style.overflowY = "auto"; // Habilitar scroll vertical

            let datosVarios = JSON.parse(localStorage.getItem("varios"));
            let opcionesGrupo = datosVarios?.find(grupo => grupo.nombre === "entidades");
            if (opcionesGrupo) {
                Object.keys(opcionesGrupo).forEach(key => {
                    if (key.startsWith("opcion")) {
                        const li = document.createElement("li");
                        const label = document.createElement("label");
                        const input = document.createElement("input");

                        input.type = "checkbox";
                        input.value = opcionesGrupo[key];
                        label.appendChild(input);
                        label.appendChild(document.createTextNode(` ${opcionesGrupo[key]}`));

                        li.appendChild(label);
                        entidad.appendChild(li);
                    }
                });
            }
        }
    }

    function agregarOpcionesAmbito1() {
        const ambito = document.getElementById("ambitoopciones-1");
        if (ambito) {
            ambito.innerHTML = ""; // Limpiar opciones anteriores
            ambito.style.maxHeight = "200px"; // Altura máxima para scroll
            ambito.style.overflowY = "auto"; // Habilitar scroll vertical

            let datosVarios = JSON.parse(localStorage.getItem("varios"));
            let opcionesGrupo = datosVarios?.find(grupo => grupo.nombre === "ambitos");
            if (opcionesGrupo) {
                Object.keys(opcionesGrupo).forEach(key => {
                    if (key.startsWith("opcion")) {
                        const li = document.createElement("li");
                        const label = document.createElement("label");
                        const input = document.createElement("input");

                        input.type = "checkbox";
                        input.value = opcionesGrupo[key];
                        label.appendChild(input);
                        label.appendChild(document.createTextNode(` ${opcionesGrupo[key]}`));

                        li.appendChild(label);
                        ambito.appendChild(li);
                    }
                });
            }
        }
    }

    let totalCargas = 3;
    let cargasCompletadas = 0;

    function verificarCargaCompleta() {
        cargasCompletadas++;
        if (cargasCompletadas === totalCargas) {
            inicializarEventosMetas(); // Se inicializa después de cargar los selects
        }
    }

    // esperarElementoYAplicar("estadoMeta-1", select => cargarOpciones(select, "estado"), verificarCargaCompleta);
    esperarElementoYAplicar("entidadopciones-1", agregarOpcionesEntidad1, verificarCargaCompleta);
    esperarElementoYAplicar("ambitoopciones-1", agregarOpcionesAmbito1, verificarCargaCompleta);
    // esperarElementoYAplicar("variosConsultores-1", select => cargarOpciones(select, "masdeunconsultor"), verificarCargaCompleta);
    // esperarElementoYAplicar("metaNueva-1", select => cargarOpciones(select, "sino"), verificarCargaCompleta);
    // esperarElementoYAplicar("estadoMeta-1", select => cargarOpciones(select, "etapa"), verificarCargaCompleta);
    esperarElementoYAplicar("actividad-1", filtrarActividades, verificarCargaCompleta);

    /*
    function activarScriptFecha() {
        // const fechaInicioInput = document.getElementById("fecha-inicio");
        // const fechaFinInput = document.getElementById("fecha-fin");
        const mesReporteInput = document.getElementById("mes-reporte");

        function actualizarMes() {
            const fechaInicio = new Date(fechaInicioInput.value);
            const fechaFin = new Date(fechaFinInput.value);

            if (isNaN(fechaInicio) || isNaN(fechaFin)) {
                mesReporteInput.value = "";
                return;
            }

            // Validar máximo 40 días de diferencia
            const diferenciaDias = (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24);
            if (diferenciaDias < 0) {
                alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
                fechaFinInput.value = "";
                mesReporteInput.value = "";
                return;
            } else if (diferenciaDias > 40) {
                alert("El intervalo no puede superar los 40 días.");
                fechaFinInput.value = "";
                mesReporteInput.value = "";
                return;
            }

            // Calcular el mes con más días en el rango
            const mesesConteo = {};
            let fechaIter = new Date(fechaInicio);

            while (fechaIter <= fechaFin) {
                const mes = fechaIter.getMonth();
                mesesConteo[mes] = (mesesConteo[mes] || 0) + 1;
                fechaIter.setDate(fechaIter.getDate() + 1);
            }

            const mesMaximo = Object.keys(mesesConteo).reduce((a, b) =>
                mesesConteo[a] > mesesConteo[b] ? a : b
            );

            const nombresMeses = [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
            ]

            mesReporteInput.value = nombresMeses[mesMaximo];
        }

        fechaInicioInput.addEventListener("blur", actualizarMes);
        fechaFinInput.addEventListener("blur", actualizarMes);
    }

    // Observar cambios en el DOM
    const observer4 = new MutationObserver((mutations, obs) => {
        if (document.querySelector(".table-formulario")) {
            obs.disconnect(); // Dejar de observar una vez encontrada la tabla
            activarScriptFecha();
        }
    });

    observer4.observe(document.body, { childList: true, subtree: true });
    */

    function toggleRows(selectElement) {
        const metaContainer = selectElement.closest(".meta-container");
        if (!metaContainer) return;
        const filasExtras = metaContainer.querySelectorAll("table tr:nth-last-child(n+2):nth-last-child(-n+5)");
        // const filasExtras = metaContainer.querySelectorAll("table tr:nth-last-child(-n+4)");
        const shouldShow = selectElement.value.includes(".P2.");

        filasExtras.forEach(row => {
            row.style.display = shouldShow ? "table-row" : "none";
        });
    }

    function attachListeners() {
        document.querySelectorAll("[id^='actividad-']").forEach(select => {
            select.addEventListener("change", () => toggleRows(select));
            toggleRows(select);
        });
    }

    function observeSelects() {
        const observer = new MutationObserver(() => {
            attachListeners();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        attachListeners();
    }

    observeSelects();


    window.actualizarNumeracionMetas = actualizarNumeracionMetas
    function actualizarNumeracionMetas() {
        document.querySelectorAll(".meta-container").forEach((meta, index) => {
            // Actualizar el título de la meta
            meta.querySelector(".meta-title").textContent = `Registro ${index + 1}`;
            meta.dataset.index = index + 1;

            // Actualizar el ID del contenedor .meta-container (si sigue el formato esperado)
            const metaIdPartes = meta.id.split("-");
            if (metaIdPartes.length > 1 && !isNaN(metaIdPartes.pop())) {
                meta.id = `${metaIdPartes.join("-")}-${index + 1}`;
            }

            // Actualizar los IDs de los elementos dentro del meta-container
            meta.querySelectorAll("[id]").forEach(input => {
                const partes = input.id.split("-");
                if (partes.length < 2) return; // Ignorar elementos con IDs no esperados

                const idActual = partes.pop(); // Último segmento del ID
                const baseId = partes.join("-"); // Resto del ID sin el número

                // Solo actualizar si el ID termina en un número diferente al nuevo índice
                if (!isNaN(idActual) && parseInt(idActual) !== index + 1) {
                    input.id = `${baseId}-${index + 1}`;
                }
            });
        });
    }

    function minimizarMeta(event) {
        const metaContainer = event.target.closest(".meta-container");
        const tableContainer = metaContainer.querySelector(".table-container");
        const minimizeButton = metaContainer.querySelector(".minimize-meta");

        if (tableContainer.style.display === "none") {
            tableContainer.style.display = "block";
            minimizeButton.textContent = "−";
        } else {
            tableContainer.style.display = "none";
            minimizeButton.textContent = "+";
        }
    }

    function eliminarMeta(event) {
        const metas = document.querySelectorAll(".meta-container");
        if (metas.length === 1) {
            alert("No es posible eliminar la única meta disponible.");
            return;
        }
        if (confirm("¿Está seguro de eliminar esta meta?")) {
            event.target.closest(".meta-container").remove();
            actualizarNumeracionMetas();
        }
    }



    // Función auxiliar para obtener el texto de un <select>
    const getSelectText = (id) => {
        const select = document.getElementById(id);
        if (!select) throw new Error(`Elemento no encontrado: ${id}`);
        return select.options[select.selectedIndex].text;
    };

    // Función para obtener el valor de un input o textarea
    const getElementValue = (id) => {
        const element = document.getElementById(id);
        if (!element) throw new Error(`Elemento no encontrado: ${id}`);
        return element.value;
    };

    // Función para obtener el texto de un elemento (ej: <td>)
    const getElementText = (id) => {
        const element = document.getElementById(id);
        if (!element) throw new Error(`Elemento no encontrado: ${id}`);
        return element.textContent;
    };


    async function enviarDatos() {
        try {
            // Mostrar pop-up de carga
            const loader = document.createElement("div");
            loader.id = "loaderPopup";
            loader.style.position = "fixed";
            loader.style.top = "50%";
            loader.style.left = "50%";
            loader.style.transform = "translate(-50%, -50%)";
            loader.style.padding = "20px";
            loader.style.background = "rgba(0,0,0,0.8)";
            loader.style.color = "#fff";
            loader.style.borderRadius = "5px";
            loader.innerText = "Enviando...";
            document.body.appendChild(loader);



            let formularioValido = true;
            let camposInvalidos = [];

            const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};
            const user = usuarioDatos["Usuario"];
            const fechaHora = new Date().toLocaleDateString('es-PE') + " " + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
            // const fechaInicioGlobal = getElementValue("fecha-inicio");
            // const fechaFinGlobal = getElementValue("fecha-fin");
            const mesReporteGlobal = getElementValue("mes-reporte");
            const metas = document.querySelectorAll(".meta-container");

            // Restablecer los bordes de la segunda columna antes de validar
            document.querySelectorAll(".table-formulario td:nth-child(2)").forEach(td => {
                // if (!td.querySelector("#mes-reporte")) {
                    td.style.border = "2px solid black";
                    td.style.borderRadius = "10px";
                // }
            });

            function esElementoVisible(elemento) {
                while (elemento) {
                    if (window.getComputedStyle(elemento).display === "none") {
                        return false;
                    }
                    elemento = elemento.parentElement;
                }
                return true;
            }

            // Función para validar si un elemento es visible y tiene un valor válido
            function validarCampo(id, esSelect = false, esEditable = false) {
                let elemento = document.getElementById(id);
                if (!elemento || !esElementoVisible(elemento)) {
                    return; // No validar si el elemento o uno de sus ancestros está oculto
                }

                let tdPadre = elemento.closest("td");
                let valor = "";

                if (esSelect) {
                    valor = elemento.options[elemento.selectedIndex].text;
                } else if (esEditable) {
                    valor = elemento.textContent;
                } else {
                    valor = elemento.value;
                }

                if (valor === "" || valor === "-- Seleccione --") {
                    tdPadre.style.border = "2px solid red";
                    camposInvalidos.push(tdPadre);
                    formularioValido = false;
                }
            }

            // Validar campos generales

            // validarCampo("fecha-inicio");
            // validarCampo("fecha-fin");
            validarCampo("mes-reporte");

            // Validar cada meta visible
            for (const meta of metas) {
                const index = meta.dataset.index;

                // Validar solo si cada campo está visible
                validarCampo(`actividad-${index}`, true);
                // validarCampo(`nombreMeta-${index}`, false, true);
                validarCampo(`numerometas-${index}`);
                validarCampo(`ambito-${index}`, false, true);
                validarCampo(`entidad-${index}`, false, true);
                // validarCampo(`metaNueva-${index}`, true);
                // validarCampo(`estadoMeta-${index}`, true);
                // validarCampo(`fechaInicio-${index}`);
                // validarCampo(`fechaFin-${index}`);
                // validarCampo(`variosConsultores-${index}`, true);
                validarCampo(`participantes-${index}`);
                validarCampo(`hombres-${index}`);
                validarCampo(`mujeres-${index}`);
                validarCampo(`autoridades-${index}`, false, true);
                validarCampo(`detalleMeta-${index}`, false, true);
            }

            // Si hay errores, marcar en rojo y mostrar mensaje emergente
            if (!formularioValido) {
                console.log("Campos obligatorios no llenados:", camposInvalidos.map(td => td.querySelector("input, select, div")?.id).filter(id => id));
                setTimeout(() => {
                    alert("⚠️ Complete los campos obligatorios marcados en rojo.");
                }, 100);
                return;
            }

            if (!confirm("¿Está seguro de enviar este reporte?")) {
                return; // El usuario canceló → detener ejecución
            }
    
            // Envío de datos si la validación pasa
            for (const meta of metas) {
                if (window.getComputedStyle(meta)) { 
                    const index = meta.dataset.index;
                    const metaData = {
                        usuario: user,
                        timestamp: fechaHora,
                        // fechaInicio: fechaInicioGlobal,
                        // fechaFin: fechaFinGlobal,
                        mesReporte: mesReporteGlobal,
                        actividad: getSelectText(`actividad-${index}`),
                        titulo: document.getElementById(`titulo-${index}`).value,
                        // tipoRegistro: document.getElementById(`tiporegistro-${index}`).innerText,
                        numerometas: getElementValue(`numerometas-${index}`) || 1,
                        // metaNueva: getSelectText(`metaNueva-${index}`),
                        // nombreMeta: getElementText(`nombreMeta-${index}`),
                        // estadoMeta: getSelectText(`estadoMeta-${index}`),
                        // fechaInicio: getElementValue(`fechaInicio-${index}`),
                        // fechaFin: getElementValue(`fechaFin-${index}`),
                        ambito: getElementText(`ambito-${index}`),
                        entidad: getElementText(`entidad-${index}`),
                        // variosConsultores: getSelectText(`variosConsultores-${index}`),
                        participantes: getElementValue(`participantes-${index}`),
                        hombres: getElementValue(`hombres-${index}`),
                        mujeres: getElementValue(`mujeres-${index}`),
                        autoridades: getElementText(`autoridades-${index}`),
                        detalleMeta: getElementText(`detalleMeta-${index}`)
                    };
                    console.log(metaData)
                    await addDoc(collection(db, "metas"), metaData);
                }
            }

            alert("✅ La información se registró satisfactoriamente.");
            
        } catch (error) {
            alert(`❌ Error: ${error.message}\nPor favor, descargue su registro como Excel e informe a Seguimiento y Evaluación.`);
            console.error("Error al enviar datos:", error);
        } finally {
            // Ocultar el pop-up de carga
            const loaderPopup = document.getElementById("loaderPopup");
            if (loaderPopup) {
                loaderPopup.remove();
            }
        }

    }

    async function borrarTodo() {
        if (confirm("¿Está seguro de borrar todos los campos del formulario?")) {
            const div = document.querySelector(".dynamic-content:not(.hidden)");
            if (div) {
                try {
                    const respuesta = await fetch("contenido1.html");
                    const html = await respuesta.text();
                    div.innerHTML = html;
                    inicializarEventosMetas();
                } catch (error) {
                    console.error("Error al cargar el contenido:", error);
                }
            }
        }
    }

    async function guardarExcel() {
        try {
            const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};
            const user = usuarioDatos["Usuario"];
            const fechaHora = new Date().toISOString(); // formato técnico
            const mesReporteGlobal = getElementValue("mes-reporte");
            const metas = document.querySelectorAll(".meta-container");

            const datosExcel = [];

            for (const meta of metas) {
                if (window.getComputedStyle(meta).display !== "none") {
                    const index = meta.dataset.index;
                    const metaData = {
                        usuario: user,
                        timestamp: fechaHora,
                        mesReporte: mesReporteGlobal,
                        actividad: getSelectText(`actividad-${index}`),
                        titulo: document.getElementById(`titulo-${index}`).value,
                        numerometas: getElementValue(`numerometas-${index}`) || 1,
                        ambito: getElementText(`ambito-${index}`),
                        entidad: getElementText(`entidad-${index}`),
                        participantes: getElementValue(`participantes-${index}`),
                        hombres: getElementValue(`hombres-${index}`),
                        mujeres: getElementValue(`mujeres-${index}`),
                        autoridades: getElementText(`autoridades-${index}`),
                        detalleMeta: getElementText(`detalleMeta-${index}`)
                    };
                    datosExcel.push(metaData);
                }
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datosExcel);
            XLSX.utils.book_append_sheet(wb, ws, "Reporte");

            const nombreArchivo = `reporte_${new Date().toISOString().slice(0,10)}.xlsx`;
            XLSX.writeFile(wb, nombreArchivo);

            alert("✅ Datos guardados en un archivo Excel.");
        } catch (error) {
            alert(`❌ Error al guardar Excel: ${error.message}`);
            console.error("Error al guardar Excel:", error);
        }
    }



    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("minimize-meta")) {
            minimizarMeta(event);
        }
        if (event.target.classList.contains("delete-meta")) {
            eliminarMeta(event);
        }
        if (event.target.id === "submitButton") {
            enviarDatos();
        }
        if (event.target.id === "borrarTodo") {
            borrarTodo();
        }
        if (event.target.id === "guardarExcel") {
            guardarExcel();
        }

    });





});

document.addEventListener("DOMContentLoaded", () => {
    function setupMultipleSelect(multipleSelectBoton, multipleSelectLista, multipleSelectSeleccionadas) {
        if (!multipleSelectBoton || !multipleSelectLista || !multipleSelectSeleccionadas) return;

        multipleSelectBoton.addEventListener("click", (event) => {
            event.stopPropagation();
            let rect = multipleSelectBoton.getBoundingClientRect();
            let espacioAbajo = window.innerHeight - rect.bottom - 60;
            let espacioArriba = rect.top;

            multipleSelectLista.style.display = multipleSelectLista.style.display === "block" ? "none" : "block";

            if (espacioAbajo < multipleSelectLista.offsetHeight && espacioArriba > espacioAbajo) {
                multipleSelectLista.style.bottom = "100%";
                multipleSelectLista.style.top = "auto";
            } else {
                multipleSelectLista.style.top = "100%";
                multipleSelectLista.style.bottom = "auto";
            }
        });

        function updateMultipleSelect(seleccionadasElement) { // Recibe el elemento de visualización
            const multipleSelectCheckboxes = multipleSelectLista.querySelectorAll("input[type=checkbox]");
            let seleccionados = Array.from(multipleSelectCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value)
                .join(", ");
            seleccionadasElement.innerText = seleccionados || "-- Seleccione --"; // Actualiza el elemento correcto
        }

        multipleSelectLista.addEventListener("change", (event) => {
            if (event.target.matches("input[type=checkbox]")) {
                updateMultipleSelect(multipleSelectSeleccionadas); // Pasa el elemento correcto
            }
        });

        document.addEventListener("click", (event) => {
            if (!multipleSelectBoton.contains(event.target) && !multipleSelectLista.contains(event.target)) {
                multipleSelectLista.style.display = "none";
            }
        });
    }

    function initMultipleSelect() {
        document.querySelectorAll(".multipleSelect-container").forEach(container => {
            const multipleSelectBoton = container.querySelector(".multipleSelect-boton");
            const multipleSelectLista = container.querySelector(".multipleSelect-opciones");
            const multipleSelectSeleccionadas = container.querySelector("[id^='entidad-'], [id^='ambito']"); // Ahora esperamos UN elemento dentro del contenedor

            if (multipleSelectBoton && multipleSelectLista && multipleSelectSeleccionadas && !container.dataset.initialized) {
                setupMultipleSelect(multipleSelectBoton, multipleSelectLista, multipleSelectSeleccionadas);
                container.dataset.initialized = "true";
            }
        });
    }

    initMultipleSelect();

    const observer = new MutationObserver(() => {
        initMultipleSelect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
});


//////////////////////////// CONTENIDO2 //////////////////////////////
window.actualizarTabla = actualizarTabla;

function esperarMisEnvios() {
    const limiteTiempo = 60000; // 60 segundos
    let intervalo;

    // Temporizador para mostrar error solo después de 60 segundos
    const timeout = setTimeout(() => {
        clearInterval(intervalo);
        mostrarErrorCarga();
    }, limiteTiempo);

    // Intervalo para verificar cada 500ms si ya existe misEnvios
    intervalo = setInterval(() => {
        if (localStorage.getItem("misEnvios")) {
            clearTimeout(timeout); // Detener el error programado
            clearInterval(intervalo); // Detener la espera
            actualizarTabla(); // Llamar a la función de actualización
        }
    }, 500);
}

const observer3 = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            const table = document.getElementById("submissions-table");
            if (table) {
                observer.disconnect(); // Deja de observar una vez que encuentra el elemento
                esperarMisEnvios(); // Esperar hasta que haya datos en localStorage
                break;
            }
        }
    }
});
observer3.observe(document.body, { childList: true, subtree: true });

async function actualizarTabla() {
    try {
        let misEnvios = JSON.parse(localStorage.getItem("misEnvios"));
        if (misEnvios) {
            renderizarTabla(misEnvios);
        } else {
            mostrarErrorCarga();
        }
    } catch (error) {
        console.error("Error al recuperar los datos:", error);
        mostrarErrorCarga();
    }
}

function mostrarErrorCarga() {
    const tabla = document.getElementById("submissions-table");
    tabla.innerHTML = "<tr><td colspan='15'>❌ Error: No se encontraron datos en 60 segundos.</td></tr>";
}

window.renderizarTabla = renderizarTabla;
function renderizarTabla(datos) {
    datos.sort((a, b) => {
        const parseFecha = (timestamp) => {
            const [fecha, hora] = timestamp.split(" ");
            const [dia, mes, año] = fecha.split("/").map(Number);
            const [horas, minutos] = hora.split(":").map(Number);
            return new Date(año, mes - 1, dia, horas, minutos);
        };
        return parseFecha(b.timestamp) - parseFecha(a.timestamp);
    });

    const tabla = document.getElementById("submissions-table");

    if (datos.length === 0) {
        tabla.innerHTML = "<tr><td colspan='15'>No hay registros disponibles.</td></tr>";
        return;
    }

    const headers = [
        { key: "usuario", label: "Usuario" },
        { key: "timestamp", label: "R - timestamp" },
        // { key: "fechaInicio", label: "R - fecha inicio" },
        // { key: "fechaFin", label: "R - fecha fin" },
        { key: "mesReporte", label: "R - mes" },
        // { key: "tipoRegistro", label: "Tipo de Registro" },
        { key: "numerometas", label: "Número de metas" },
        { key: "actividad", label: "Actividad POA" },
        { key: "titulo", label: "Título" },
        // { key: "metaNueva", label: "Meta nueva" },
        // { key: "nombreMeta", label: "Título de la meta" },
        // { key: "estadoMeta", label: "Estado de la meta" },
        { key: "ambito", label: "Ambito" },
        { key: "entidad", label: "Entidad" },
        // { key: "fechaInicio", label: "Fecha inicio" },
        // { key: "fechaFin", label: "Fecha fin" },
        // { key: "variosConsultores", label: "Intervino más de un consultor" },
        { key: "participantes", label: "Número de participantes" },
        { key: "hombres", label: "Hombres" },
        { key: "mujeres", label: "Mujeres" },
        { key: "autoridades", label: "Autoridades presentes" },
        { key: "detalleMeta", label: "Observaciones" }
    ];

    const columnasLlenas = headers.filter(({ key }) =>
        datos.some(row => row[key] !== "" && row[key] !== null && row[key] !== "-" && row[key] !== undefined)
    );

    let html = "<thead><tr>";
    columnasLlenas.forEach(({ label }) => {
        html += `<th>${label}</th>`;
    });
    html += "</tr></thead><tbody>";

    datos.forEach(row => {
        html += "<tr>";
        columnasLlenas.forEach(({ key }) => {
            html += `<td>${row[key] || ""}</td>`;
        });
        html += "</tr>";
    });

    html += "</tbody>";
    tabla.innerHTML = html;
}


////// FILTROS

document.addEventListener("DOMContentLoaded", () => {
    const tableId = "submissions-table";
    const activeFilters = {}; // clave: colIndex, valor: Set con valores seleccionados

    const addFilters = (table) => {
        // console.log("[addFilters] Ejecutando addFilters...");

        const thead = table.querySelector("thead tr");
        const tbody = table.querySelector("tbody");

        if (!thead || !tbody) {
            console.warn("[addFilters] Faltan <thead> o <tbody>");
            return;
        }

        if (thead.parentNode.querySelector(".filter-row")) return;

        const headers = Array.from(thead.children);
        const filterRow = document.createElement("tr");
        filterRow.className = "filter-row";

        headers.forEach((th, colIndex) => {
            const originalText = th.textContent;
            th.textContent = ""; // Limpiar contenido

            // Crear contenedor para el filtro
            const wrapper = document.createElement("div");
            wrapper.className = "filter-cell";
            wrapper.style.position = "relative"; // Necesario para posicionar el desplegable

            const labelSpan = document.createElement("span");
            labelSpan.textContent = originalText;

            // Crear botón de embudo para desplegar el filtro
            const filterButton = document.createElement("button");
            filterButton.className = "filter-button";
            filterButton.addEventListener("click", (event) => {
                event.stopPropagation(); // Evitar que el clic se propague al documento
                checkboxContainer.style.display = checkboxContainer.style.display === "none" ? "block" : "none";
            });
            filterButton.style.backgroundColor = "transparent"; // color neutro por defecto

            const checkboxContainer = document.createElement("div");
            checkboxContainer.className = "checkbox-container";
            checkboxContainer.style.display = "none"; // Inicialmente oculto
            checkboxContainer.style.position = "fixed"; // Para que se muestre por encima de todo
            checkboxContainer.style.backgroundColor = "white";
            checkboxContainer.style.border = "1px solid #ccc";
            checkboxContainer.style.zIndex = "1000"; // Asegurar que esté por encima de otros elementos
            checkboxContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            // Establecer una anchura máxima para evitar que se salga de la pantalla
            checkboxContainer.style.maxWidth = "calc(100vw - 20px)";
            checkboxContainer.style.maxHeight = "calc(100vh - 20px)";
            checkboxContainer.style.overflowY = "auto"; // Permitir scroll si es necesario
            checkboxContainer.style.color = "black"; // Establecer el color del texto a negro
            checkboxContainer.style.padding = "10px"; // Añadir un poco de espacio interno

            const optionsSet = new Set();

            // Recopilar valores únicos de las filas de la tabla
            Array.from(tbody.rows).forEach(row => {
                const cellValue = row.cells[colIndex]?.textContent?.trim();
                if (cellValue !== undefined) optionsSet.add(cellValue);
            });

            const sortedOptions = [...optionsSet].sort();

            // Opción "Seleccionar todo" al principio
            const selectAllLabel = document.createElement("label");
            selectAllLabel.style.display = "block"; // Cada opción en una nueva fila
            const selectAllCheckbox = document.createElement("input");
            selectAllCheckbox.type = "checkbox";
            selectAllCheckbox.checked = true; // Por defecto está seleccionado
            selectAllCheckbox.className = "select-all-checkbox";
            selectAllLabel.appendChild(selectAllCheckbox);
            selectAllLabel.appendChild(document.createTextNode(" Todos"));
            selectAllLabel.style.fontWeight = "normal"; // Establece el peso de la fuente como normal
            checkboxContainer.appendChild(selectAllLabel);

            // Crear una casilla de verificación para cada valor único
            sortedOptions.forEach(value => {
                const label = document.createElement("label");
                label.style.display = "block"; // Cada opción en una nueva fila
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = value;
                checkbox.className = "filter-checkbox";
                checkbox.checked = true; // Por defecto todas las opciones están seleccionadas

                const checkboxLabel = document.createElement("span");
                checkboxLabel.textContent = value;
                checkboxLabel.style.marginLeft = "5px"; // Añadir un poco de espacio entre el checkbox y el texto
                checkboxLabel.style.fontWeight = "normal"; // Quitar negrita

                label.appendChild(checkbox);
                label.appendChild(checkboxLabel);
                checkboxContainer.appendChild(label);
            });

            checkboxContainer.style.textAlign = "left"; // Alinea todos los elementos dentro del contenedor a la izquierda

            // Función para aplicar los filtros
            const applyFilters = () => {
                // Actualizar el estado global del filtro de esta columna
                const selectedValues = new Set(
                    Array.from(checkboxContainer.querySelectorAll(".filter-checkbox:checked"))
                        .map(checkbox => checkbox.value)
                );
                activeFilters[colIndex] = selectedValues;
                // Estilizar botón si hay filtros activos
                const totalCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox").length;
                const selectedCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox:checked").length;

                if (selectedCheckboxes < totalCheckboxes) {
                    filterButton.style.backgroundColor = "rgba(255, 255, 255, 0.6)"; // amarillo claro (indicador de filtro activo)
                } else {
                    filterButton.style.backgroundColor = "transparent"; // sin filtro activo
                }

                // Filtrar las filas de la tabla considerando TODAS las columnas con filtros activos
                Array.from(tbody.rows).forEach(row => {
                    let show = true;

                    for (const [filterColIndex, selectedSet] of Object.entries(activeFilters)) {
                        const cellValue = row.cells[filterColIndex]?.textContent?.trim();
                        if (!selectedSet.has(cellValue)) {
                            show = false;
                            break;
                        }
                    }

                    row.style.display = show ? "" : "none";
                });
            };


            // Manejar el cambio en el checkbox "Seleccionar todo"
            selectAllCheckbox.addEventListener("change", () => {
                const allCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox");
                const shouldCheckAll = selectAllCheckbox.checked;

                allCheckboxes.forEach(checkbox => {
                    checkbox.checked = shouldCheckAll;
                });

                applyFilters(); // Aplica el filtro después de marcar/desmarcar
            });

            // Manejar el cambio en las casillas de verificación individuales
            checkboxContainer.addEventListener("change", (event) => {
                if (event.target.classList.contains("filter-checkbox")) {
                    const checkedCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox:checked");
                    const allCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox");

                    // Evitar desmarcar la última casilla
                    if (checkedCheckboxes.length === 0) {
                        event.target.checked = true; // Re-marca la casilla que se intentó desmarcar
                        return;
                    }

                    // Actualizar el estado del "Seleccionar todo"
                    selectAllCheckbox.checked = checkedCheckboxes.length === allCheckboxes.length;
                    applyFilters();
                }
            });

            wrapper.appendChild(labelSpan);
            wrapper.appendChild(filterButton);
            wrapper.appendChild(checkboxContainer);
            th.appendChild(wrapper);
        });

        // console.log("[addFilters] Filtros agregados.");

        // Cerrar el desplegable al hacer clic fuera de él
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".filter-cell")) {
                const allCheckboxContainers = document.querySelectorAll(".checkbox-container");

                allCheckboxContainers.forEach(container => {
                    container.style.display = "none";

                    const colIndex = [...container.closest("th").parentElement.children].indexOf(container.closest("th"));
                    const checkboxes = container.querySelectorAll(".filter-checkbox");
                    const checked = container.querySelectorAll(".filter-checkbox:checked");

                    // Si todos los checkboxes están desmarcados, restaurar todos
                    if (checked.length === 0) {
                        checkboxes.forEach(cb => cb.checked = true);

                        // Actualizar estado global
                        const restoredSet = new Set(Array.from(checkboxes).map(cb => cb.value));
                        activeFilters[colIndex] = restoredSet;

                        // Marcar "Seleccionar todo"
                        const selectAll = container.querySelector(".select-all-checkbox");
                        if (selectAll) selectAll.checked = true;

                        // Reaplicar filtros cruzados
                        applyFilters();
                    }
                });
            }
        });
    };

    const addFiltersSafely = (table) => {
        const tryAdd = () => {
            const thead = table.querySelector("thead tr");
            const tbody = table.querySelector("tbody");

            if (thead && tbody) {
                addFilters(table);
            } else {
                setTimeout(tryAdd, 100);
            }
        };
        tryAdd();
    };

    const observer = new MutationObserver(() => {
        const table = document.getElementById(tableId);
        if (table) {
            observer.disconnect();
            addFiltersSafely(table);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});





document.addEventListener("DOMContentLoaded", () => {
    const tableId = "submissions-table-ficha";
    const activeFilters = {}; // clave: colIndex, valor: Set con valores seleccionados

    const addFilters = (table) => {
        // console.log("[addFilters] Ejecutando addFilters...");

        const thead = table.querySelector("thead tr");
        const tbody = table.querySelector("tbody");

        if (!thead || !tbody) {
            console.warn("[addFilters] Faltan <thead> o <tbody>");
            return;
        }

        if (thead.parentNode.querySelector(".filter-row")) return;

        const headers = Array.from(thead.children);
        const filterRow = document.createElement("tr");
        filterRow.className = "filter-row";

        headers.forEach((th, colIndex) => {
            const originalText = th.textContent;
            th.textContent = ""; // Limpiar contenido

            // Crear contenedor para el filtro
            const wrapper = document.createElement("div");
            wrapper.className = "filter-cell";
            wrapper.style.position = "relative"; // Necesario para posicionar el desplegable

            const labelSpan = document.createElement("span");
            labelSpan.textContent = originalText;

            // Crear botón de embudo para desplegar el filtro
            const filterButton = document.createElement("button");
            filterButton.className = "filter-button";
            filterButton.addEventListener("click", (event) => {
                event.stopPropagation(); // Evitar que el clic se propague al documento
                checkboxContainer.style.display = checkboxContainer.style.display === "none" ? "block" : "none";
            });
            filterButton.style.backgroundColor = "transparent"; // color neutro por defecto

            const checkboxContainer = document.createElement("div");
            checkboxContainer.className = "checkbox-container";
            checkboxContainer.style.display = "none"; // Inicialmente oculto
            checkboxContainer.style.position = "fixed"; // Para que se muestre por encima de todo
            checkboxContainer.style.backgroundColor = "white";
            checkboxContainer.style.border = "1px solid #ccc";
            checkboxContainer.style.zIndex = "1000"; // Asegurar que esté por encima de otros elementos
            checkboxContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            // Establecer una anchura máxima para evitar que se salga de la pantalla
            checkboxContainer.style.maxWidth = "calc(100vw - 20px)";
            checkboxContainer.style.maxHeight = "calc(100vh - 20px)";
            checkboxContainer.style.overflowY = "auto"; // Permitir scroll si es necesario
            checkboxContainer.style.color = "black"; // Establecer el color del texto a negro
            checkboxContainer.style.padding = "10px"; // Añadir un poco de espacio interno

            const optionsSet = new Set();

            // Recopilar valores únicos de las filas de la tabla
            Array.from(tbody.rows).forEach(row => {
                const cellValue = row.cells[colIndex]?.textContent?.trim();
                if (cellValue !== undefined) optionsSet.add(cellValue);
            });

            const sortedOptions = [...optionsSet].sort();

            // Opción "Seleccionar todo" al principio
            const selectAllLabel = document.createElement("label");
            selectAllLabel.style.display = "block"; // Cada opción en una nueva fila
            const selectAllCheckbox = document.createElement("input");
            selectAllCheckbox.type = "checkbox";
            selectAllCheckbox.checked = true; // Por defecto está seleccionado
            selectAllCheckbox.className = "select-all-checkbox";
            selectAllLabel.appendChild(selectAllCheckbox);
            selectAllLabel.appendChild(document.createTextNode(" Todos"));
            selectAllLabel.style.fontWeight = "normal"; // Establece el peso de la fuente como normal
            checkboxContainer.appendChild(selectAllLabel);

            // Crear una casilla de verificación para cada valor único
            sortedOptions.forEach(value => {
                const label = document.createElement("label");
                label.style.display = "block"; // Cada opción en una nueva fila
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = value;
                checkbox.className = "filter-checkbox";
                checkbox.checked = true; // Por defecto todas las opciones están seleccionadas

                const checkboxLabel = document.createElement("span");
                checkboxLabel.textContent = value;
                checkboxLabel.style.marginLeft = "5px"; // Añadir un poco de espacio entre el checkbox y el texto
                checkboxLabel.style.fontWeight = "normal"; // Quitar negrita

                label.appendChild(checkbox);
                label.appendChild(checkboxLabel);
                checkboxContainer.appendChild(label);
            });

            checkboxContainer.style.textAlign = "left"; // Alinea todos los elementos dentro del contenedor a la izquierda

            // Función para aplicar los filtros
            const applyFilters = () => {
                // Actualizar el estado global del filtro de esta columna
                const selectedValues = new Set(
                    Array.from(checkboxContainer.querySelectorAll(".filter-checkbox:checked"))
                        .map(checkbox => checkbox.value)
                );
                activeFilters[colIndex] = selectedValues;
                // Estilizar botón si hay filtros activos
                const totalCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox").length;
                const selectedCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox:checked").length;

                if (selectedCheckboxes < totalCheckboxes) {
                    filterButton.style.backgroundColor = "rgba(255, 255, 255, 0.6)"; // amarillo claro (indicador de filtro activo)
                } else {
                    filterButton.style.backgroundColor = "transparent"; // sin filtro activo
                }

                // Filtrar las filas de la tabla considerando TODAS las columnas con filtros activos
                Array.from(tbody.rows).forEach(row => {
                    let show = true;

                    for (const [filterColIndex, selectedSet] of Object.entries(activeFilters)) {
                        const cellValue = row.cells[filterColIndex]?.textContent?.trim();
                        if (!selectedSet.has(cellValue)) {
                            show = false;
                            break;
                        }
                    }

                    row.style.display = show ? "" : "none";
                });
            };


            // Manejar el cambio en el checkbox "Seleccionar todo"
            selectAllCheckbox.addEventListener("change", () => {
                const allCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox");
                const shouldCheckAll = selectAllCheckbox.checked;

                allCheckboxes.forEach(checkbox => {
                    checkbox.checked = shouldCheckAll;
                });

                applyFilters(); // Aplica el filtro después de marcar/desmarcar
            });

            // Manejar el cambio en las casillas de verificación individuales
            checkboxContainer.addEventListener("change", (event) => {
                if (event.target.classList.contains("filter-checkbox")) {
                    const checkedCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox:checked");
                    const allCheckboxes = checkboxContainer.querySelectorAll(".filter-checkbox");

                    // Evitar desmarcar la última casilla
                    if (checkedCheckboxes.length === 0) {
                        event.target.checked = true; // Re-marca la casilla que se intentó desmarcar
                        return;
                    }

                    // Actualizar el estado del "Seleccionar todo"
                    selectAllCheckbox.checked = checkedCheckboxes.length === allCheckboxes.length;
                    applyFilters();
                }
            });

            wrapper.appendChild(labelSpan);
            wrapper.appendChild(filterButton);
            wrapper.appendChild(checkboxContainer);
            th.appendChild(wrapper);
        });

        // console.log("[addFilters] Filtros agregados.");

        // Cerrar el desplegable al hacer clic fuera de él
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".filter-cell")) {
                const allCheckboxContainers = document.querySelectorAll(".checkbox-container");

                allCheckboxContainers.forEach(container => {
                    container.style.display = "none";

                    const colIndex = [...container.closest("th").parentElement.children].indexOf(container.closest("th"));
                    const checkboxes = container.querySelectorAll(".filter-checkbox");
                    const checked = container.querySelectorAll(".filter-checkbox:checked");

                    // Si todos los checkboxes están desmarcados, restaurar todos
                    if (checked.length === 0) {
                        checkboxes.forEach(cb => cb.checked = true);

                        // Actualizar estado global
                        const restoredSet = new Set(Array.from(checkboxes).map(cb => cb.value));
                        activeFilters[colIndex] = restoredSet;

                        // Marcar "Seleccionar todo"
                        const selectAll = container.querySelector(".select-all-checkbox");
                        if (selectAll) selectAll.checked = true;

                        // Reaplicar filtros cruzados
                        applyFilters();
                    }
                });
            }
        });
    };

    const addFiltersSafely = (table) => {
        const tryAdd = () => {
            const thead = table.querySelector("thead tr");
            const tbody = table.querySelector("tbody");

            if (thead && tbody) {
                addFilters(table);
            } else {
                setTimeout(tryAdd, 100);
            }
        };
        tryAdd();
    };

    const observer = new MutationObserver(() => {
        const table = document.getElementById(tableId);
        if (table) {
            observer.disconnect();
            addFiltersSafely(table);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

//////////////// CONTENIDO3 y CONTENIDO4/////////////////


// Funcion para cargar tablaPOA y mitablaPOA
document.addEventListener("DOMContentLoaded", function () {
    window.inicializarTablaPOA = inicializarTablaPOA;

    function inicializarTablaPOA(tablaId, meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]) {
        const tablaElement = document.getElementById(tablaId);
        if (!tablaElement) {
            return false;
        }

        window[`tablaPOA_subtitulos_${tablaId}`] = ["Resultado", "Producto"];
        window[`tablaPOA_columnasFijas_${tablaId}`] = ["Actividad", "Indicador", "Unidad de medida", "Medio de verificación", "Logro Esperado"];
        window[`tablaPOA_meses_${tablaId}`] = meses;  // Aquí pasas los meses como argumento
        window[`tablaPOA_datos_${tablaId}`] = [...window[`tablaPOA_columnasFijas_${tablaId}`], ...window[`tablaPOA_meses_${tablaId}`].map(m => m + "_pl"), "Pl_total", ...window[`tablaPOA_meses_${tablaId}`].map(m => m + "_ej"), "Ej_total"];

        window[`tablaPOA_leerExcel_${tablaId}`] = function (url) {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    const libro = XLSX.read(buffer, { type: 'array' });
                    const nombreHoja = libro.SheetNames[0];
                    const hoja = libro.Sheets[nombreHoja];
                    const POAdatos = XLSX.utils.sheet_to_json(hoja);
                    window[`tablaPOA_crearEncabezado_${tablaId}`]();
                    window[`tablaPOA_crearTabla_${tablaId}`](POAdatos);
                });
        };

        window[`tablaPOA_crearEncabezado_${tablaId}`] = function () {
            const encabezado1 = document.getElementById(`${tablaId}-encabezado1`);
            const encabezado2 = document.getElementById(`${tablaId}-encabezado2`);

            if (!encabezado1 || !encabezado2) return;
            encabezado1.innerHTML = "";
            encabezado2.innerHTML = "";

            window[`tablaPOA_columnasFijas_${tablaId}`].forEach(dato => encabezado1.appendChild(crearTH(dato, { rowSpan: 2 })));

            ["Planificado", "Ejecutado"].forEach(seccion => {
                encabezado1.appendChild(crearTH(seccion, { colSpan: window[`tablaPOA_meses_${tablaId}`].length + 1 }));
                window[`tablaPOA_meses_${tablaId}`].forEach(mes => encabezado2.appendChild(crearTH(mes)));
                encabezado2.appendChild(crearTH("Total"));
            });
        };

        window.crearTH = function (texto, atributos = {}) {
            let th = document.createElement("th");
            th.textContent = texto;
            Object.assign(th, atributos);
            return th;
        };

        window[`tablaPOA_crearTabla_${tablaId}`] = function (POAdatos) {
            const tabla = document.getElementById(tablaId)?.getElementsByTagName('tbody')[0];
            if (!tabla) return;

            let ultimosSubtitulos = {};
            POAdatos.forEach(fila => {
                let clasesSubtitulos = [];
                window[`tablaPOA_subtitulos_${tablaId}`].forEach((sub, index) => {
                    if (fila[sub] !== ultimosSubtitulos[sub]) {
                        window[`tablaPOA_agregarSubtitulo_${tablaId}`](tabla, fila[sub], sub, index + 1, clasesSubtitulos);
                        ultimosSubtitulos[sub] = fila[sub];
                    }
                    clasesSubtitulos.push(fila[sub] || "");
                });
                window[`tablaPOA_agregarFila_${tablaId}`](tabla, fila, clasesSubtitulos);
            });
        };

        window[`tablaPOA_escapeClassName_${tablaId}`] = function (name) {
            return name.replace(/\W/g, "_");
        };

        window[`tablaPOA_agregarFila_${tablaId}`] = function (tabla, fila, clasesSubtitulos) {
            const nuevaFila = tabla.insertRow();
            nuevaFila.classList.add("tablaPOA-normal");
            nuevaFila.setAttribute("data-tipo", "dato");
            nuevaFila.setAttribute("subtitulos-superiores", JSON.stringify(clasesSubtitulos.map(window[`tablaPOA_escapeClassName_${tablaId}`])));

            clasesSubtitulos.forEach(sub => {
                if (sub) nuevaFila.classList.add(`tablaPOA-sub-${window[`tablaPOA_escapeClassName_${tablaId}`](sub)}`);
            });

            window[`tablaPOA_datos_${tablaId}`].forEach(dato => {
                let celda = nuevaFila.insertCell();
                let div = document.createElement("div");
                div.classList.add("tablaPOA-scrollable");
                div.textContent = fila[dato] || "";
                celda.appendChild(div);
                if (dato === "Pl_total" || dato === "Ej_total") {
                    celda.classList.add("tablaPOA-total");
                }
            });
        };

        window[`tablaPOA_agregarSubtitulo_${tablaId}`] = function (tabla, subtitulo, claseSub, nivel, clasesSuperiores) {
            if (!subtitulo) return;
            const fila = tabla.insertRow();
            fila.classList.add("tablaPOA-subtitulo", `tablaPOA-${claseSub}`);
            fila.setAttribute("data-tipo", "subtitulo");
            fila.setAttribute("subtitulo-nivel", nivel);
            fila.setAttribute("subtitulo-nombre", window[`tablaPOA_escapeClassName_${tablaId}`](subtitulo));
            fila.setAttribute("subtitulos-superiores", JSON.stringify(clasesSuperiores.map(window[`tablaPOA_escapeClassName_${tablaId}`])));

            const subtituloNombreEscaped = window[`tablaPOA_escapeClassName_${tablaId}`](subtitulo);
            const subtitulosSuperioresNombres = clasesSuperiores.map(window[`tablaPOA_escapeClassName_${tablaId}`]);
            const subtitulosSuperioresNombresConActual = [...subtitulosSuperioresNombres, subtituloNombreEscaped];
            fila.setAttribute("filas-inferiores-subsup", JSON.stringify(subtitulosSuperioresNombresConActual));

            let celda = fila.insertCell();
            celda.textContent = subtitulo;
            celda.colSpan = window[`tablaPOA_datos_${tablaId}`].length;

            let icono = document.createElement("span");
            icono.classList.add("tablaPOA-triangulo");
            icono.textContent = "▼";
            celda.appendChild(icono);

            fila.addEventListener("click", function () {
                window[`tablaPOA_alternarVisibilidad_${tablaId}`](fila.getAttribute("filas-inferiores-subsup"), icono);
            });
        };

        window[`tablaPOA_alternarVisibilidad_${tablaId}`] = function (subsup, icono) {
            subsup = JSON.parse(subsup);
            let filas = document.querySelectorAll(`#${tablaId} tbody [subtitulos-superiores]`);
            let matchingRows = [];

            filas.forEach(fila => {
                let attrValue = fila.getAttribute("subtitulos-superiores");
                let cleanValue = attrValue.replace(/&quot;/g, '"');
                let parsedValue = JSON.parse(cleanValue);
                if (Array.isArray(parsedValue) && subsup.every(value => parsedValue.includes(value))) {
                    matchingRows.push(fila);
                }
            });

            let shouldHide = icono.textContent === "▼";
            matchingRows.forEach(fila => fila.classList.toggle("tablaPOA-oculto", shouldHide));
            icono.textContent = shouldHide ? "▶" : "▼";
        };

        window[`tablaPOA_leerExcel_${tablaId}`]("POA 2025_bd.xlsx");
        return true;
    }
});


// Cargar tablaPOA
document.addEventListener("DOMContentLoaded", function () {

    // Crear un observador para esperar a que la tabla deseada aparezca en el DOM
    const observer2 = new MutationObserver(() => {
        if (inicializarTablaPOA("tablaPOA")) {
            observer2.disconnect();
        }
    });
    observer2.observe(document.body, { childList: true, subtree: true });
    // Intentar ejecutar directamente si la tabla ya existe
    inicializarTablaPOA("tablaPOA");

});


// Cargar mitablaPOA
document.addEventListener("DOMContentLoaded", function () {
    // console.log("DOM completamente cargado y parseado");

    // Variable para controlar si los datos ya fueron procesados
    let datosProcesados = false;

    // Función para verificar si los datos del usuario están en el localStorage
    function verificarYFiltrar() {
        const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || null;

        if (usuarioDatos && !datosProcesados) {
            // console.log("Datos de usuario encontrados:", usuarioDatos);

            const criterioFiltro = (usuarioDatos.Resultado || 'Criterio no definido')
            .split(',')
            .map(c => c.trim());

            // const criterioFiltro = usuarioDatos.Resultado || 'Criterio no definido';
            // console.log("Criterio de filtro:", criterioFiltro);

            // Crear un observador para esperar a que la tabla deseada aparezca en el DOM
            const observer5 = new MutationObserver(() => {
                const tabla = document.getElementById("mitablaPOA");
                if (tabla) {
                    // console.log("Tabla 'mitablaPOA' encontrada. Inicializando...");
                    if (inicializarTablaPOA("mitablaPOA")) {
                        // console.log("Tabla inicializada correctamente.");
                        observer5.disconnect();
                        // Luego de inicializar la tabla, podemos configurar el observador para las filas.
                        crearObserverParaTabla(tabla);
                        // Llamamos a la función de filtrado para asegurar que la tabla esté filtrada desde el inicio
                        filtrarFilas(tabla, criterioFiltro);
                    }
                } else {
                    // console.log("La tabla 'mitablaPOA' no se encontró aún.");
                }
            });

            observer5.observe(document.body, { childList: true, subtree: true });

            // Intentar ejecutar directamente si la tabla ya existe
            const tablaExistente = document.getElementById("mitablaPOA");
            if (tablaExistente) {
                // console.log("La tabla 'mitablaPOA' ya estaba presente en el DOM.");
                inicializarTablaPOA("mitablaPOA");
                crearObserverParaTabla(tablaExistente);
                filtrarFilas(tablaExistente, criterioFiltro);
            } else {
                // console.log("La tabla 'mitablaPOA' no está presente al inicio.");
            }

            // Marcar como procesado para evitar futuras comprobaciones
            datosProcesados = true;

            // Detener el intervalo una vez que se han procesado los datos
            clearInterval(intervalo);
        } else {
            // console.log("Esperando a que los datos del usuario estén disponibles en localStorage...");
        }
    }

    // Esperar a que el localStorage tenga los datos del usuario antes de continuar
    const intervalo = setInterval(function () {
        verificarYFiltrar();
    }, 1000); // Comprobar cada segundo

    // Función para filtrar las filas de la tabla
    function filtrarFilas(tabla, criterioFiltro) {
        if (!tabla) {
            // console.log("No se proporcionó una tabla para filtrar.");
            return;
        }

        const filas = tabla.querySelectorAll("tr"); // Seleccionar todas las filas de la tabla
        // console.log("Número de filas en la tabla:", filas.length);

        // Verificar si la tabla tiene filas
        if (filas.length > 0) {
            // Filtrar filas donde el primer elemento de la fila (primera columna) empiece con usuarioDatos.Resultado
            filas.forEach(fila => {
                const primeraColumna = fila.querySelector("td");
                if (primeraColumna) {
                    const textoColumna = primeraColumna.textContent.trim();
                    // console.log("Texto de la primera columna:", textoColumna);
                    if (criterioFiltro.some(criterio => textoColumna.startsWith(criterio))) {
                        fila.style.display = "";
                    } else {
                        fila.style.display = "none";
                    }

                    // if (textoColumna.startsWith(criterioFiltro)) {
                    //     // console.log("La fila coincide con el criterio. Mostrando fila.");
                    //     fila.style.display = ""; // Mostrar la fila si coincide
                    // } else {
                    //     // console.log("La fila NO coincide con el criterio. Ocultando fila.");
                    //     fila.style.display = "none"; // Ocultar la fila si no coincide
                    // }
                }
            });
        } else {
            // console.log("No hay filas en la tabla para filtrar.");
        }
    }

    // Función para crear el observador de la tabla
    function crearObserverParaTabla(tabla) {
        // console.log("Creando un observador para la tabla...");
        const observerTabla = new MutationObserver(() => {
            // console.log("Cambio detectado en la tabla. Filtrando filas...");
            
            const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};

            const criterioFiltro = (usuarioDatos.Resultado || 'Criterio no definido')
            .split(',')
            .map(c => c.trim());

            filtrarFilas(tabla, criterioFiltro);
        });

        observerTabla.observe(tabla, { childList: true, subtree: true });
        // console.log("Observador de la tabla creado.");
    }
});





///// Cargar mitablaPOA, Filtros mitablaPOA

function waitForButton() {
    const dropdownBtn = document.getElementById('dropdownBtn');
    if (dropdownBtn) {
      initializeDropdown();
    } else {
      setTimeout(waitForButton, 1000);
    }
  }

  function initializeDropdown() {
    const dropdownBtn = document.getElementById('dropdownBtn');
    const selectAll = document.getElementById('selectAll');
    const months = document.querySelectorAll('.month');
    const dropdownContent = document.querySelector('.dropdownmeses-content');
    const localStorageKey = 'selectedMonths';

    function getSelectedMonths() {
      const selected = [];
      months.forEach(m => {
        if (m.checked) selected.push(m.dataset.month);
      });
      return selected;
    }

    function updateStorageAndLog() {
      const selected = getSelectedMonths();
      if (selected.length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(selected));
        console.log(JSON.parse(localStorage.getItem('selectedMonths')));
      }
    }

    function loadSelection() {
      const saved = JSON.parse(localStorage.getItem(localStorageKey)) || [];
      if (saved.length === 0) {
        months.forEach(m => m.checked = true);
      } else {
        months.forEach(m => m.checked = saved.includes(m.dataset.month));
      }
      updateSelectAllState();
    }

    function updateSelectAllState() {
      const allSelected = getSelectedMonths().length === months.length;
      selectAll.checked = allSelected;
    }

    selectAll.addEventListener('change', () => {
      const checked = selectAll.checked;
      months.forEach(m => m.checked = checked);
      updateSelectAllState();
      updateStorageAndLog();
    });

    months.forEach(m => {
      m.addEventListener('change', () => {
        updateSelectAllState();
        updateStorageAndLog();
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdownmeses')) {
        const selected = getSelectedMonths();
        if (selected.length === 0) {
          months.forEach(m => m.checked = true);
          updateSelectAllState();
        }
        updateStorageAndLog();
        dropdownContent.style.display = 'none';
      }
    });

    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    loadSelection();
    updateStorageAndLog();
  }

  waitForButton();

/////////////// Cargar ejecutado

function waitForElement(selector, callback) {
    // console.log(`Esperando elemento: ${selector}`);
    const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
            // console.log(`Elemento encontrado: ${selector}`);
            obs.disconnect();
            callback(element);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function waitForLocalStorageItem(key, callback) {
    // console.log(`Esperando LocalStorage item: ${key}`);
    const checkInterval = setInterval(() => {
        const item = localStorage.getItem(key);
        if (item) {
            // console.log(`Item encontrado en LocalStorage: ${key}`);
            clearInterval(checkInterval);
            callback(JSON.parse(item));
        }
    }, 1000);
}

function createPopupTable(details) {
    let popup = document.getElementById("popupTable");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupTable";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.backgroundColor = "white";
        popup.style.border = "1px solid black";
        popup.style.padding = "10px";
        popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";
        popup.style.zIndex = "1000";
        document.body.appendChild(popup);
    }

    const keys = Object.keys(details[0]).filter(key => details.some(d => d[key] && d[key] !== ""));

    popup.innerHTML = `<button onclick='document.getElementById("popupTable").style.display="none"' style='float:right;'>✖</button>` +
        `<table border='1'><tr>${keys.map(key => `<th>${key}</th>`).join("")}</tr>` +
        details.map(d => `<tr>${keys.map(key => `<td>${d[key]}</td>`).join("")}</tr>`).join("") + "</table>";

    popup.style.display = "block";
}



function calcularSumasTablaPOA() {
    console.log("Ejecutando calcularSumasTablaPOA");
    const tablas = document.querySelectorAll('#tablaPOA, #mitablaPOA');

    tablas.forEach(tabla => {
        const elementosTotal = tabla.querySelectorAll('.tablaPOA-total');

        elementosTotal.forEach(celdaTotal => {
            console.log("Encontrado elemento total:", celdaTotal);
            const fila = celdaTotal.parentNode;
            let suma = 0;
            let columnaActual = celdaTotal.cellIndex - 1;
            let contadorCeldas = 0;

            while (columnaActual >= 0) {
                const celdaIzquierda = fila.cells[columnaActual];

                if (celdaIzquierda && !celdaIzquierda.classList.contains('tablaPOA-total')) {
                    const textoCelda = celdaIzquierda.textContent.trim();
                    const esNumerico = /^[0-9.]+$/.test(textoCelda);

                    if (!textoCelda || esNumerico) {
                        if (textoCelda) {
                            const valor = parseFloat(textoCelda);
                            if (!isNaN(valor)) {
                                console.log(`  Celda [${columnaActual}]: "${textoCelda}" - Sumando ${valor}`);
                                suma += valor;
                            }
                        } else {
                            console.log(`  Celda [${columnaActual}]: "${textoCelda}" - Celda vacía, continuando`);
                        }
                        contadorCeldas++;
                        columnaActual--;
                        // Aquí puedes añadir una condición para limitar el número de celdas a considerar (las 'n' primeras)
                        // Por ejemplo: if (contadorCeldas >= n) break;
                    } else {
                        console.log(`  Celda [${columnaActual}]: "${textoCelda}" - Contiene texto no numérico, deteniendo suma`);
                        break;
                    }
                } else {
                    console.log("  Encontrada celda total o límite de fila, deteniendo suma");
                    break;
                }
            }
            console.log(`  Suma calculada: ${suma}`);
            celdaTotal.textContent = Math.floor(suma);
        });
    });
    console.log("Función calcularSumasTablaPOA finalizada.");
}

function fillTableWithEnvios(tablaId, localStorageKey) {
    // console.log(`Esperando a que aparezcan filas en la tabla con ID: ${tablaId}`);

    waitForElement(`#${tablaId} tbody tr`, () => {
        // console.log("✅ Filas de la tabla detectadas");

        waitForLocalStorageItem(localStorageKey, (misEnvios) => {
            // console.log("📦 Datos obtenidos de localStorage:", misEnvios);

            document.querySelectorAll(`#${tablaId} tbody tr`).forEach(row => {
                const firstCellText = row.cells[0]?.innerText;
                // console.log("🔍 Procesando fila con texto en primera celda:", firstCellText);
                if (!firstCellText) return;

                const monthIndexMap = {
                    "Enero": 18,
                    "Febrero": 19,
                    "Marzo": 20,
                    "Abril": 21,
                    "Mayo": 22,
                    "Junio": 23,
                    "Julio": 24,
                    "Agosto": 25,
                    "Setiembre": 26,
                    "Octubre": 27,
                    "Noviembre": 28,
                    "Diciembre": 29
                };

                const monthDetails = {};
                misEnvios.forEach(entry => {
                    if (entry.actividad === firstCellText) {
                        const monthIndex = monthIndexMap[entry.mesReporte];
                        if (monthIndex !== undefined) {
                            if (!monthDetails[monthIndex]) monthDetails[monthIndex] = [];
                            monthDetails[monthIndex].push(entry);
                            // console.log(`📅 Agregado envío a mes ${entry.mesReporte} (columna ${monthIndex}) para actividad "${entry.actividad}"`);
                        }
                    }
                });

                Object.keys(monthDetails).forEach(index => {
                    if (row.cells[index]) {
                        const total = monthDetails[index].reduce((sum, entry) => sum + (parseInt(entry.numerometas) || 0), 0);
                        // console.log(`📊 Total metas en columna ${index} para actividad "${firstCellText}":`, total);

                        row.cells[index].innerText = total;
                        row.cells[index].style.cursor = "pointer";
                        row.cells[index].addEventListener("click", () => {
                            // console.log(`🖱️ Click en celda [${firstCellText}, columna ${index}]`);
                            createPopupTable(monthDetails[index]);
                        });
                    }
                });
            });

            // Llamar a la función para calcular las sumas después de que la tabla se haya llenado
            calcularSumasTablaPOA();
        });
    });
}




// Cargar ejecutado mitablaPOA
fillTableWithEnvios('mitablaPOA', 'misEnvios');
fillTableWithEnvios('tablaPOA', 'Envios');

// MANUAL 

document.addEventListener('DOMContentLoaded', function () {
    window.manualShowSection = function(id) {
        document.querySelectorAll('.manual-section').forEach(sec => sec.classList.remove('manual-active'));
        const target = document.getElementById(id);
        target.classList.add('manual-active');
        }
})