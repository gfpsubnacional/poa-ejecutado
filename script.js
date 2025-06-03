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
    { key: "participantes", label: "N. participantes" },
    { key: "hombres", label: "Hombres" },
    { key: "mujeres", label: "Mujeres" },
    { key: "autoridades", label: "Autoridades presentes" },
    { key: "detalleMeta", label: "Observaciones" }
];


document.addEventListener("DOMContentLoaded", function() {
//////////// BARRA LATERAL

    const sidebar = document.getElementById("sidebar");
    // const contentContainer = document.getElementById("content-container");
    const toggleButton = document.getElementById("sidebar-toggle");

    toggleButton.addEventListener("click", function() {
        sidebar.classList.toggle("hidden");
        // contentContainer.classList.toggle("expanded");
    });


//////////// FUNCIONES

///// Acomodar header y footer para ventanas pequeñas

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



async function login() {
    // 🔵 Mostrar loader antes de cualquier proceso
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
    loader.style.zIndex = "9999";
    loader.innerText = "Cargando...";
    document.body.appendChild(loader);

    usuarioActual = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('POA 2025_bd.xlsx');
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        datosConsultores = XLSX.utils.sheet_to_json(workbook.Sheets['Consultores']);
        const userData = datosConsultores.find(row =>
            row.Usuario?.toString() === usuarioActual &&
            row.Password?.toString() === password
        );

        if (!userData) {
            alert('Credenciales incorrectas');
            loader.remove();  // 🔴 Quitar loader si hay error
            return;
        }

        localStorage.setItem("usuarioDatos", JSON.stringify(userData));
        console.log("Datos de consultor en LS:", userData);

        datosPOA = XLSX.utils.sheet_to_json(workbook.Sheets['POA2025_ej']);
        localStorage.setItem("POADatos", JSON.stringify(datosPOA));
        console.log("Datos POA en LS:", JSON.parse(localStorage.getItem("POADatos")));

        varios = XLSX.utils.sheet_to_json(workbook.Sheets['varios']);
        localStorage.setItem("varios", JSON.stringify(varios));
        console.log("Datos varios en LS:", JSON.parse(localStorage.getItem("varios")));

        await cargarEnviosYMisEnvios();  // 🔄 Asegura que esto también termine

        mostrarMenu(userData);  // 🔚 Aquí recién cambia la vista
    } catch (error) {
        console.error("Error en el login:", error);
        alert('No se pudo cargar la base de datos.');
    } finally {
        // 🔽 Siempre quitar el loader al final (con éxito o error)
        const loaderPopup = document.getElementById("loaderPopup");
        if (loaderPopup) loaderPopup.remove();
    }
}


////// Mostrar menú después de login
function mostrarMenu(userData) {
    let buttons = "";
    const opcionesPorTipo = {
        admin: [
            { id: "boton1", texto: "Registro POA", archivo: "contenido1.html" },
            { id: "boton2", texto: "Envíos", archivo: "contenido2.html" },
            { id: "boton3", texto: "POA 2025", archivo: "contenido4.html" },
            { id: "boton4", texto: "Manual de uso", archivo: "contenido5.html" }
        ],
        usuario: [
            { id: "boton1", texto: "Registro POA", archivo: "contenido1.html" },
            { id: "boton2", texto: "Mis envíos", archivo: "contenido2.html" },
            { id: "boton3", texto: "Mi POA 2025", archivo: "contenido3.html" },
            { id: "boton4", texto: "POA 2025", archivo: "contenido4.html" },
            { id: "boton5", texto: "Manual de uso", archivo: "contenido5.html" }
        ]
    };

    const tipo = userData.Tipo === 'admin' ? 'admin' : 'usuario';
    const opciones = opcionesPorTipo[tipo];

    // Generar botones manualmente
    buttons = opciones.map(op =>
        `<button id="${op.id}" class="menu-btn">${op.texto}</button>`
    ).join('');

    // Mostrar datos del consultor
    const camposConsultor = ["Consultor", "Usuario", "Área de especialidad", "Entidad", "Resultado", "Componente"];
    let userInfoHTML = `<h4>Datos del consultor</h4><table border="1">`;
    camposConsultor.forEach(key => {
        if (userData[key] !== undefined) {
            userInfoHTML += `<tr><td><strong>${key}</strong></td><td>${userData[key]}</td></tr>`;
        }
    });
    userInfoHTML += `</table>`;

    // Mostrar UI
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('sidebar').innerHTML = userInfoHTML + buttons;
    document.getElementById('sidebar').classList.remove('hidden');
    document.querySelector('.logout').classList.remove('hidden');
    document.querySelector('.sidebar-toggle').classList.remove('hidden');
    document.getElementById('content').innerHTML = `<p id="welcome-message">Bienvenid@, ${userData.Consultor}</p>`;

    // Cargar todos los contenidos correspondientes
    opciones.forEach(op => {
        fetch(op.archivo)
            .then(res => res.ok ? res.text() : Promise.reject("No se pudo cargar"))
            .then(html => {
                const div = document.createElement("div");
                div.classList.add("dynamic-content", "hidden");
                div.innerHTML = html;
                document.getElementById("content").appendChild(div);
                storedContents[op.id] = div;
            })
            .catch(err => {
                console.error(`Error al cargar ${op.archivo}:`, err);
            });
    });

    // Asignar eventos a los botones
    opciones.forEach(op => {
        document.getElementById(op.id).addEventListener("click", function () {
            showContent(op.id, this);
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

    // Oculta todos los contenidos dinámicos
    document.querySelectorAll(".dynamic-content").forEach(el => el.classList.add("hidden"));

    // Muestra solo el contenido correspondiente
    if (storedContents[fileName]) {
        storedContents[fileName].classList.remove("hidden");
    }

    // Actualiza botón activo
    document.querySelectorAll(".sidebar button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
}


//// Consultar Envios y MisEnvios

async function cargarEnviosYMisEnvios() {
    if (localStorage.getItem("Envios") && localStorage.getItem("misEnvios")) {
        console.log("Los datos ya están en localStorage.");
        return;
    }

    try {
        const q = query(collection(db, "metas"));
        const snapshot = await getDocs(q);
        const todosLosEnvios = [];
        const misEnvios = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            todosLosEnvios.push(data);

            const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos") || "{}");

            if (usuarioDatos.Tipo === "admin" || data.usuario === usuarioActual) {
                misEnvios.push(data);
            }
        });

        localStorage.setItem("Envios", JSON.stringify(todosLosEnvios));
        localStorage.setItem("misEnvios", JSON.stringify(misEnvios));

        console.log("✔ Todos los envíos guardados en localStorage['Envios']", JSON.parse(localStorage.getItem("Envios")));
        console.log("✔ Mis envíos guardados en localStorage['misEnvios']", JSON.parse(localStorage.getItem("misEnvios")));

    } catch (error) {
        console.error("Error al consultar la base de datos:", error);
    }
}


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
        const elemento = document.getElementById(id);

        if (elemento) {
            callback(elemento);
            if (onComplete) onComplete();
            return;
        }

        const observer = new MutationObserver(() => {
            const el = document.getElementById(id);
            if (el) {
                observer.disconnect();
                callback(el);
                if (onComplete) onComplete();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // function cargarOpciones(select, nombre) {
    //     let datosVarios = JSON.parse(localStorage.getItem("varios"));
    //     let opcionesGrupo = datosVarios?.find(grupo => grupo.nombre === nombre);
    //     if (opcionesGrupo) {
    //         Object.keys(opcionesGrupo).forEach(key => {
    //             if (key.startsWith("opcion")) {
    //                 let option = document.createElement("option");
    //                 option.value = opcionesGrupo[key];
    //                 option.textContent = opcionesGrupo[key];
    //                 select.appendChild(option);
    //             }
    //         });
    //     }
    // }

    function filtrarActividades(actividadesDropdown) {
        const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};
        const POADatos = JSON.parse(localStorage.getItem("POADatos")) || [];

        const criteriosResultados = (usuarioDatos.Resultado || "")
            .split(',')
            .map(criterio => criterio.trim());

        const actividadesFiltradas = POADatos.filter(item =>
            criteriosResultados.some(criterio => item.Actividad_cod.startsWith(criterio))
        );

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

function inicializarCargaDeOpciones() {
    let totalCargas = 3;
    let cargasCompletadas = 0;
    function verificarCargaCompleta() {
        cargasCompletadas++;
        if (cargasCompletadas === totalCargas) {
            inicializarEventosMetas();
        }
    }

    esperarElementoYAplicar("entidadopciones-1", agregarOpcionesEntidad1, verificarCargaCompleta);
    esperarElementoYAplicar("ambitoopciones-1", agregarOpcionesAmbito1, verificarCargaCompleta);
    esperarElementoYAplicar("actividad-1", filtrarActividades, verificarCargaCompleta);
    // esperarElementoYAplicar("variosConsultores-1", select => cargarOpciones(select, "masdeunconsultor"), verificarCargaCompleta);
    // esperarElementoYAplicar("metaNueva-1", select => cargarOpciones(select, "sino"), verificarCargaCompleta);
    // esperarElementoYAplicar("estadoMeta-1", select => cargarOpciones(select, "etapa"), verificarCargaCompleta);
    // esperarElementoYAplicar("estadoMeta-1", select => cargarOpciones(select, "estado"), verificarCargaCompleta);
}

inicializarCargaDeOpciones()


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
            borrarTodoRegistro(true);

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

    async function borrarTodoRegistro(forzar = false) {
        if (forzar || confirm("¿Está seguro de borrar todos los campos del formulario?")) {
            const div = document.querySelector(".dynamic-content:not(.hidden)");
            if (div) {
                try {
                    const respuesta = await fetch("contenido1.html");
                    const html = await respuesta.text();
                    div.innerHTML = html;
                    inicializarCargaDeOpciones();
                } catch (error) {
                    console.error("Error al cargar el contenido:", error);
                }
            }
        }
    }

    async function guardarExcelRegistro() {
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
        if (event.target.closest(".minimize-meta")) {
            minimizarMeta(event);
        }

        if (event.target.closest(".delete-meta")) {
            eliminarMeta(event);
        }

        if (event.target.closest("#submitButtonRegistro")) {
            enviarDatos();
        }

        if (event.target.closest("#borrarTodoRegistro")) {
            borrarTodoRegistro();
        }

        if (event.target.closest("#guardarExcelRegistro")) {
            guardarExcelRegistro();
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
// Función que activa la exportación cuando el botón aparece
function activarDescargaExcelCuandoAparezca() {
  const observer = new MutationObserver((mutationsList, observer) => {
    const boton = document.getElementById("guardarExcelEnvios");
    if (boton) {
      observer.disconnect(); // Deja de observar

      boton.addEventListener("click", function () {
        const tabla = document.getElementById("submissions-table");
        if (!tabla) {
          alert("No se encontró la tabla de envíos.");
          return;
        }

        // Extraer encabezados personalizados
        const headers = Array.from(tabla.querySelectorAll("thead th")).map(th => {
          const firstDiv = th.querySelector("div");
          const span = firstDiv?.querySelector("span");
          return span?.textContent.trim() || ""; // Solo toma el texto del primer span dentro del primer div
        });

        // Extraer los datos del cuerpo
        const rows = Array.from(tabla.querySelectorAll("tbody tr")).map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim())
        );

        // Crear una matriz completa para exportar
        const datos = [headers, ...rows];

        // Usar SheetJS para generar Excel
        const worksheet = XLSX.utils.aoa_to_sheet(datos);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
        XLSX.writeFile(workbook, "envios.xlsx");
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

activarDescargaExcelCuandoAparezca();


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

function construirTablaConHeaders(headers, datos, incluirEncabezadoSiVacio = false) {
    let html = "";
    if (datos.length > 0 || incluirEncabezadoSiVacio) {
        html += "<thead><tr>";
        headers.forEach(({ label }) => {
            html += `<th>${label}</th>`;
        });
        html += "</tr></thead>";
    }

    html += "<tbody>";
    if (datos.length > 0) {
        datos.forEach(row => {
            html += "<tr>";
            headers.forEach(({ key }) => {
                html += `<td>${row[key] || ""}</td>`;
            });
            html += "</tr>";
        });
    } else {
        html += `<tr><td colspan="${headers.length}">No hay registros disponibles.</td></tr>`;
    }
    html += "</tbody>";
    return html;
}

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

    const columnasLlenas = filtrarColumnasLlenas(headers, datos);
    tabla.innerHTML = construirTablaConHeaders(columnasLlenas, datos);
}

function filtrarColumnasLlenas(headers, datos) {
    return headers.filter(({ key }) =>
        datos.some(row => row[key] !== "" && row[key] !== null && row[key] !== "-" && row[key] !== undefined)
    );
}


////// FILTROS

function inicializarFiltrosYOrdenParaTablas(claseTabla) {
    const tablasProcesadas = new Set();
    const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let contenedorFiltroAbierto = null;

    const aplicarFiltrosYOrden = (table) => {
        const activeFilters = {};
        let ordenActivo = { colIndex: null, asc: true };

        const thead = table.querySelector("thead tr");
        const tbody = table.querySelector("tbody");
        if (!thead || !tbody || thead.parentNode.querySelector(".filter-row")) return;

        Array.from(thead.children).forEach((th, colIndex) => {
            const originalText = th.textContent;
            th.textContent = "";

            const wrapper = document.createElement("div");
            wrapper.className = "filter-cell";
            wrapper.style.position = "relative";
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.justifyContent = "space-between";

            const labelSpan = document.createElement("span");
            labelSpan.textContent = originalText;

            const controlGroup = document.createElement("div");
            controlGroup.className = "control-buttons";
            controlGroup.style.display = "flex";
            controlGroup.style.alignItems = "center";
            controlGroup.style.gap = "4px";

            const sortButton = document.createElement("button");
            sortButton.textContent = "↕";
            Object.assign(sortButton.style, {
                fontSize: "16px",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: "0 4px"
            });

            const filterButton = document.createElement("button");
            filterButton.textContent = "≡";
            Object.assign(filterButton.style, {
                fontSize: "16px",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: "0 4px"
            });

            const checkboxContainer = document.createElement("div");
            checkboxContainer.className = "checkbox-container";
            Object.assign(checkboxContainer.style, {
                display: "none",
                position: "absolute",
                top: "100%",
                left: "0",
                backgroundColor: "white",
                border: "1px solid #ccc",
                zIndex: "1000",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                maxHeight: "250px",
                overflowY: "auto",
                overflowX: "hidden",
                color: "black",
                padding: "10px",
                textAlign: "left",
                maxWidth: "300px",
                width: "max-content",
                zIndex: "99999999999999999999",
            });

            const valueMap = new Map();
            Array.from(tbody.rows).forEach(row => {
                const raw = row.cells[colIndex]?.textContent?.trim();
                if (raw) valueMap.set(raw.toLowerCase(), raw);
            });

            const sortedKeys = [...valueMap.keys()].sort();

            const selectAllLabel = document.createElement("label");
            selectAllLabel.style.display = "block";
            const selectAllCheckbox = document.createElement("input");
            selectAllCheckbox.type = "checkbox";
            selectAllCheckbox.checked = true;
            selectAllCheckbox.className = "select-all-checkbox";
            selectAllLabel.appendChild(selectAllCheckbox);
            selectAllLabel.append(" Todos");
            checkboxContainer.appendChild(selectAllLabel);

            sortedKeys.forEach(key => {
                const label = document.createElement("label");
                label.style.display = "block";
                label.style.fontWeight = "normal";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = key;
                checkbox.className = "filter-checkbox";
                checkbox.checked = true;
                const checkboxLabel = document.createElement("span");
                checkboxLabel.textContent = valueMap.get(key);
                checkboxLabel.style.marginLeft = "5px";
                checkboxLabel.style.fontWeight = "normal";
                label.appendChild(checkbox);
                label.appendChild(checkboxLabel);
                checkboxContainer.appendChild(label);
            });

            const aplicarFiltros = () => {
                const seleccionados = new Set(
                    Array.from(checkboxContainer.querySelectorAll(".filter-checkbox:checked")).map(cb => cb.value)
                );
                activeFilters[colIndex] = seleccionados;

                const total = checkboxContainer.querySelectorAll(".filter-checkbox").length;
                const checked = checkboxContainer.querySelectorAll(".filter-checkbox:checked").length;
                filterButton.style.backgroundColor = (checked < total) ? "rgba(255,255,255,0.6)" : "transparent";

                Array.from(tbody.rows).forEach(row => {
                    let mostrar = true;
                    for (const [idx, setSeleccionado] of Object.entries(activeFilters)) {
                        const celda = row.cells[idx]?.textContent?.trim().toLowerCase();
                        if (!setSeleccionado.has(celda)) {
                            mostrar = false;
                            break;
                        }
                    }
                    row.style.display = mostrar ? "" : "none";
                });
            };

            const aplicarOrden = () => {
                const filas = Array.from(tbody.rows);
                const valores = filas.map(row => row.cells[colIndex]?.textContent?.trim());
                const tipo = detectarTipoDeDato(valores);

                filas.sort((a, b) => {
                    let valA = a.cells[colIndex]?.textContent?.trim();
                    let valB = b.cells[colIndex]?.textContent?.trim();

                    if (tipo === "numero") {
                        valA = parseFloat(valA.replace(",", ""));
                        valB = parseFloat(valB.replace(",", ""));
                    } else if (tipo === "fecha") {
                        valA = new Date(valA);
                        valB = new Date(valB);
                    } else if (tipo === "mes") {
                        valA = MESES.indexOf(valA.toLowerCase());
                        valB = MESES.indexOf(valB.toLowerCase());
                    }

                    if (valA < valB) return ordenActivo.asc ? -1 : 1;
                    if (valA > valB) return ordenActivo.asc ? 1 : -1;
                    return 0;
                });

                filas.forEach(row => tbody.appendChild(row));
            };

            const actualizarFlechaOrden = () => {
                if (ordenActivo.colIndex === colIndex) {
                    sortButton.textContent = ordenActivo.asc ? "↑" : "↓";
                    sortButton.style.backgroundColor = "#eee";
                } else {
                    sortButton.textContent = "↕";
                    sortButton.style.backgroundColor = "transparent";
                }
            };

            selectAllCheckbox.addEventListener("change", () => {
                const todos = checkboxContainer.querySelectorAll(".filter-checkbox");
                todos.forEach(cb => cb.checked = selectAllCheckbox.checked);
                aplicarFiltros();
            });

            checkboxContainer.addEventListener("change", (event) => {
                if (event.target.classList.contains("filter-checkbox")) {
                    const todos = checkboxContainer.querySelectorAll(".filter-checkbox");
                    const marcados = checkboxContainer.querySelectorAll(".filter-checkbox:checked");
                    if (marcados.length === 0) {
                        event.target.checked = true;
                        return;
                    }
                    selectAllCheckbox.checked = (marcados.length === todos.length);
                    aplicarFiltros();
                }
            });

            filterButton.addEventListener("click", (e) => {
                e.stopPropagation();

                if (contenedorFiltroAbierto && contenedorFiltroAbierto !== checkboxContainer) {
                    contenedorFiltroAbierto.style.display = "none";
                }

                const estabaCerrado = checkboxContainer.style.display === "none";
                checkboxContainer.style.display = estabaCerrado ? "block" : "none";
                contenedorFiltroAbierto = estabaCerrado ? checkboxContainer : null;
            });

            sortButton.addEventListener("click", () => {
                const mismaCol = ordenActivo.colIndex === colIndex;
                ordenActivo.colIndex = colIndex;
                ordenActivo.asc = mismaCol ? !ordenActivo.asc : true;
                aplicarOrden();
                actualizarFlechaOrden();

                // Resetear otros botones
                table.querySelectorAll(".filter-cell button").forEach(btn => {
                    if (btn !== sortButton && ["↑", "↓", "↕"].includes(btn.textContent)) {
                        btn.textContent = "↕";
                        btn.style.backgroundColor = "transparent";
                    }
                });
            });

            controlGroup.appendChild(sortButton);
            controlGroup.appendChild(filterButton);
            wrapper.appendChild(labelSpan);
            wrapper.appendChild(controlGroup);
            wrapper.appendChild(checkboxContainer);
            th.appendChild(wrapper);
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".filter-cell")) {
                document.querySelectorAll(".checkbox-container").forEach(c => c.style.display = "none");
                contenedorFiltroAbierto = null;
            }
        });
    };

    const detectarTipoDeDato = (valores) => {
        const todosFechas = valores.every(v => !isNaN(Date.parse(v)));
        if (todosFechas) return "fecha";

        const todosNumeros = valores.every(v => !isNaN(parseFloat(v.replace(",", ""))));
        if (todosNumeros) return "numero";

        const todosMeses = valores.every(v => MESES.includes(v.toLowerCase()));
        if (todosMeses) return "mes";

        return "texto";
    };

    const observarYAplicar = () => {
        document.querySelectorAll(`table.${claseTabla}`).forEach(table => {
            if (!tablasProcesadas.has(table)) {
                const thead = table.querySelector("thead");
                const tbody = table.querySelector("tbody");
                if (thead && tbody) {
                    tablasProcesadas.add(table);
                    aplicarFiltrosYOrden(table);
                }
            }
        });
    };

    new MutationObserver(observarYAplicar).observe(document.body, {
        childList: true,
        subtree: true
    });

    document.addEventListener("DOMContentLoaded", observarYAplicar);
}

inicializarFiltrosYOrdenParaTablas("tablasPOA-envios");


//////////////// CONTENIDO3 y CONTENIDO4/////////////////


function inicializarBotonFiltroEjecutadosPOA() {

    let filtroActivo = false;

    const aplicarFiltro = () => {
        const tabla = document.getElementById("tablaPOA");
        if (!tabla) return;

        const filas = tabla.querySelectorAll("tbody tr");
        const todasLasFilas = tabla.querySelectorAll("tr");

        filas.forEach((fila) => {
            const esSubtituloResultado = fila.classList.contains("tablaPOA-subtitulo") && fila.classList.contains("tablaPOA-Resultado");

            if (esSubtituloResultado) {
                fila.style.display = "table-row"; // Siempre visible
                fila.querySelectorAll("td").forEach(celda => celda.style.display = "table-cell");
                return; // Salta el resto del filtro
            }

            const celda = fila.querySelector('td[data-month="total"][data-type="ejecutado"]');
            if (!celda) {
                fila.style.display = "none";
                return;
            }

            const planned = parseFloat(celda.dataset.plannedValue || "0");
            const acum = parseFloat(celda.dataset.plannedValueAcum || "0");
            const executed = parseFloat(celda.dataset.executedValue || "0");

            const ratio1 = planned > 0 ? (executed / planned) * 100 : 0;
            const ratio2 = acum > 0 ? (executed / acum) * 100 : 0;

            let cumple = false;

            if (!acum && !executed) {
                cumple = false;
            } else if (ratio2 < 65 && acum) {
                cumple = true;
            } else if (ratio1 > 100 && planned) {
                cumple = true;
            }

            fila.style.display = filtroActivo && !cumple ? "none" : "table-row";

            fila.querySelectorAll("td").forEach((celda, i) => {
                const esTotal = celda.dataset?.month === "total";
                const esAcum = celda.dataset?.month === "acum";
                celda.style.display = (!filtroActivo || i < 5 || esTotal || esAcum) ? "table-cell" : "none";
            });
        });

        todasLasFilas.forEach(fila => {
            fila.querySelectorAll("th").forEach(th => {
                const esTotal = th.dataset?.month === "total";
                const esAcum = th.dataset?.month === "acum";
                const estaEnEncabezado1 = fila.id === "tablaPOA-encabezado1";
                th.style.display = (!filtroActivo || estaEnEncabezado1 || esTotal || esAcum) ? "" : "none";
            });
        });

        // Eliminar el style anterior si ya existe
        const estiloPrevio = document.getElementById("tablaPOA-style-planificado");
        if (estiloPrevio) estiloPrevio.remove();

        // Crear nuevo bloque de estilos
        const style = document.createElement("style");
        style.id = "tablaPOA-style-planificado";

        if (filtroActivo) {
            style.textContent = `
                #tablaPOA th:nth-child(6) {
                    width: 100px !important;
                }
                #tablaPOA th:nth-child(7) {
                    width: 50px !important;
                }
            `;
        } else {
            style.textContent = `
                #tablaPOA th:nth-child(n+6):nth-child(-n+7) {
                    width: 500px !important;
                }
            `;

            // Desocultar todo: filas y celdas
            document.querySelectorAll("#tablaPOA tr").forEach(fila => {
                fila.style.display = "table-row";
            });
            document.querySelectorAll("#tablaPOA th, #tablaPOA td").forEach(celda => {
                celda.style.display = "table-cell";
            });

        }

        // Insertar el nuevo <style> en el <head>
        document.head.appendChild(style);

        // Cambiar colspan de los subtítulos de resultado
        document.querySelectorAll("tr.tablaPOA-subtitulo.tablaPOA-Resultado td").forEach(td => {
            td.colSpan = filtroActivo ? 8 : 32;
        });
    };

    const observer = new MutationObserver(() => {
        const tabla = document.getElementById("tablaPOA");
        if (!tabla) return;

        const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos"));

        if (usuarioDatos.Tipo !== "admin") {
            // console.log(`${usuarioDatos.Tipo}`)
            return 
        }

        if (!document.getElementById("btnFiltrarEjecutadosPOA")) {
            const boton = document.createElement("button");
            boton.id = "btnFiltrarEjecutadosPOA";
            boton.textContent = "Filtrar Totales Críticos";
            Object.assign(boton.style, {
                backgroundColor: "#1C4574",
                color: "white",
                border: "none",
                padding: "10px 20px",
                margin: "10px 0",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            });

            const contenedor = tabla.parentElement;
            contenedor.insertBefore(boton, tabla);

            boton.addEventListener("click", () => {
                boton.textContent = filtroActivo ? "Filtrar Totales Críticos" : "Volver a vista normal";
                filtroActivo = !filtroActivo;
                boton.dataset.activo = filtroActivo ? "true" : "false";
                aplicarFiltro();
                asignarClickASubtitulos(document.getElementById("tablaPOA")); 
            });
        }

        const boton = document.getElementById("btnFiltrarEjecutadosPOA");
        if (boton && boton.dataset.activo === "true") {
            aplicarFiltro();
        }
    });

    observer.observe(document.getElementById("tablaPOA")?.parentElement || document.body, {
        childList: true,
        subtree: true
    });

    
}

inicializarBotonFiltroEjecutadosPOA();

// Constantes y funciones auxiliares
const TABLA_POA_MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
const TABLA_POA_MESES_CORTE = ["ene", "feb", "mar", "abr"];
const TABLA_POA_MES_MAP = {
    "ene": "Enero",
    "feb": "Febrero",
    "mar": "Marzo",
    "abr": "Abril",
    "may": "Mayo",
    "jun": "Junio",
    "jul": "Julio",
    "ago": "Agosto",
    "set": "Setiembre",
    "oct": "Octubre",
    "nov": "Noviembre",
    "dic": "Diciembre"
};


/**
 * Crea un elemento <th> (table header) con el texto y atributos dados.
 * @param {string} texto - El texto del encabezado.
 * @param {object} atributos - Un objeto de atributos para el elemento <th>.
 * @returns {HTMLTableCellElement} El elemento <th> creado.
 */
function crearTH(texto, atributos = {}) {
    const th = document.createElement("th");
    th.textContent = texto;
    Object.assign(th, atributos);
    return th;
}

/**
 * Escapa nombres de clase para asegurar que sean válidos en CSS.
 * @param {string} name - El nombre a escapar.
 * @returns {string} El nombre escapado.
*/
function escapeClassName(name) {
    return name.replace(/\W/g, "_");
}

/**
 * Espera a que un elemento aparezca en el DOM.
 * @param {string} selector - El selector CSS del elemento a esperar.
 * @param {function(Element): void} callback - La función a ejecutar cuando el elemento es encontrado.
 */
function waitForElement(selector, callback) {
    const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
            obs.disconnect();
            callback(element);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Espera a que un item del localStorage esté disponible.
 * @param {string} key - La clave del item en localStorage.
 * @param {function(*): void} callback - La función a ejecutar cuando el item es encontrado.
 */
function waitForLocalStorageItem(key, callback) {
    const checkInterval = setInterval(() => {
        const item = localStorage.getItem(key);
        if (item) {
            clearInterval(checkInterval);
            try {
                callback(JSON.parse(item));
            } catch (e) {
                console.error(`[waitForLocalStorageItem] Error parsing localStorage item ${key}:`, e);
                callback(null); // Pass null if parsing fails
            }
        } else {
        }
    }, 1000);
}

/**
 * Calcula y actualiza las sumas en las columnas 'Total' de una fila específica.
 * @param {HTMLTableRowElement} row - La fila de la tabla cuya suma total debe ser calculada.
 */
function calcularSumaFilaPOA(row) {
    const planAcumCell = row.querySelector('[data-month="acum"][data-type="planificado"]');
    const planTotalCell = row.querySelector('[data-month="total"][data-type="planificado"]');
    const ejecutadoTotalCell = row.querySelector('[data-month="total"][data-type="ejecutado"]');
    let sumAcumPlan = 0;
    let sumTotalPlan = 0;
    let sumTotalEjecutado = 0;

    row.querySelectorAll('[data-month]').forEach(cell => {
        const mesAttr = cell.getAttribute('data-month');
        const tipoDato = cell.getAttribute('data-type');
        if (tipoDato !== 'planificado' && tipoDato !== 'ejecutado') return;

        // Buscar el valor excluyendo el tooltip
        const clone = cell.cloneNode(true);
        const tooltip = clone.querySelector('.tablasPOA-tooltip-container');
        tooltip?.remove();
        const value = parseFloat(clone.textContent.trim());

        if (!isNaN(value)) {
            if (TABLA_POA_MESES.includes(mesAttr) && tipoDato ==='planificado') {
                sumTotalPlan += value;
            }

            if (TABLA_POA_MESES_CORTE.includes(mesAttr) && tipoDato === 'planificado') {
                sumAcumPlan += value;
            }

            if (TABLA_POA_MESES_CORTE.includes(mesAttr) && tipoDato === 'ejecutado') {
                sumTotalEjecutado += value;
            }
        }
    });

    if (planAcumCell) {
        planAcumCell.textContent = Math.floor(sumAcumPlan);
    }
    if (planTotalCell) {
        planTotalCell.textContent = Math.floor(sumTotalPlan);
    }
    if (ejecutadoTotalCell) { 
        const tooltipDiv = ejecutadoTotalCell.querySelector('.tablasPOA-tooltip-container');
        const valorEjecutado = Math.floor(sumTotalEjecutado);
        // Si existe un div con tooltip, lo dejamos y actualizamos el resto
        if (tooltipDiv) {
            ejecutadoTotalCell.innerHTML = '';
            ejecutadoTotalCell.appendChild(tooltipDiv);
            ejecutadoTotalCell.insertAdjacentText('beforeend', valorEjecutado);
        } else {
            ejecutadoTotalCell.textContent = valorEjecutado;
        }
    }

}

/**
 * Recorre todas las filas de las tablas POA y recalcula sus sumas totales.
 */
function recalcularTodasLasSumasPOA() {
    document.querySelectorAll('#tablaPOA tbody tr.tablaPOA-normal, #mitablaPOA tbody tr.tablaPOA-normal').forEach(row => {
        calcularSumaFilaPOA(row);
    });
}

/**
 * Inicializa una tabla POA cargando datos de Excel y construyendo su estructura.
 * @param {string} tablaId - El ID de la tabla HTML.
 * @returns {boolean} True si la tabla se inicializó, false si no se encontró el elemento.
 */
function inicializarTablaPOA(tablaId) {
    const tablaElement = document.getElementById(tablaId);
    if (!tablaElement) {
        return false;
    }

    const config = {
        subtitulos: ["Resultado", "Producto"],
        columnasFijas: ["Actividad", "Indicador", "Unidad de medida", "Medio de verificación", "Logro Esperado"],
        meses: TABLA_POA_MESES,
        datos: []
    };
    config.datos = [
        ...config.columnasFijas.map(name => ({ name: name, type: "fixed" })),
        ...config.meses.map(m => ({ name: m + "_pl", mes: m, tipo: "planificado" })),
        { name: "Pl_acum", mes: "acum", tipo: "planificado" },
        { name: "Pl_total", mes: "total", tipo: "planificado" },
        ...config.meses.map(m => ({ name: m + "_ej", mes: m, tipo: "ejecutado" })),
        { name: "Ej_total", mes: "total", tipo: "ejecutado" }
    ];

const crearEncabezado = () => {
    const encabezado1 = document.getElementById(`${tablaId}-encabezado1`);
    const encabezado2 = document.getElementById(`${tablaId}-encabezado2`);

    if (!encabezado1 || !encabezado2) {
        return;
    }
    encabezado1.innerHTML = "";
    encabezado2.innerHTML = "";

    config.columnasFijas.forEach(dato => encabezado1.appendChild(crearTH(dato, { rowSpan: 2 })));

    // Crear los encabezados principales con colSpan inicial
    const thPlanificado = crearTH("Planificado");
    const thEjecutado = crearTH("Ejecutado");
    encabezado1.appendChild(thPlanificado);
    encabezado1.appendChild(thEjecutado);

    // Subencabezados planificados
    config.meses.forEach(mes => {
        const th = crearTH(mes);
        th.setAttribute("data-month", mes);
        th.setAttribute("data-type", "planificado");
        encabezado2.appendChild(th);
    });
    const thAcumPl = crearTH("Acum");
    thAcumPl.setAttribute("data-month", "acum");
    thAcumPl.setAttribute("data-type", "planificado");
    encabezado2.appendChild(thAcumPl);

    const thTotalPl = crearTH("Total");
    thTotalPl.setAttribute("data-month", "total");
    thTotalPl.setAttribute("data-type", "planificado");
    encabezado2.appendChild(thTotalPl);

    // Subencabezados ejecutados
    config.meses.forEach(mes => {
        const th = crearTH(mes);
        th.setAttribute("data-month", mes);
        th.setAttribute("data-type", "ejecutado");
        encabezado2.appendChild(th);
    });
    const thTotalEj = crearTH("Total");
    thTotalEj.setAttribute("data-month", "total");
    thTotalEj.setAttribute("data-type", "ejecutado");
    encabezado2.appendChild(thTotalEj);

    // Función para actualizar dinámicamente los colSpan
    function actualizarColSpan() {
        const visibles = selector => Array.from(encabezado2.querySelectorAll(selector))
            .filter(th => th.style.display !== 'none').length;

        const thPlanificados = visibles('th[data-type="planificado"]');
        const thEjecutados = visibles('th[data-type="ejecutado"]');

        if (thPlanificado) thPlanificado.colSpan = thPlanificados;
        if (thEjecutado) thEjecutado.colSpan = thEjecutados;
    }

    // Observer que detecta cualquier cambio en los subencabezados
    const observer123 = new MutationObserver(() => actualizarColSpan());
    observer123.observe(encabezado2, {
        childList: true,
        subtree: true,
        attributes: true,         // ⬅️ importante si cambias el display con JS/CSS
        attributeFilter: ['style'] // ⬅️ optimiza el rendimiento
    });

    // Inicializar colSpan una vez
    actualizarColSpan();
};

    const agregarFila = (tabla, filaData, clasesSubtitulos) => {
        const nuevaFila = tabla.insertRow();
        nuevaFila.classList.add("tablaPOA-normal");
        nuevaFila.setAttribute("data-tipo", "dato");
        nuevaFila.setAttribute("subtitulos-superiores", JSON.stringify(clasesSubtitulos.map(escapeClassName)));

        clasesSubtitulos.forEach(sub => {
            if (sub) nuevaFila.classList.add(`tablaPOA-sub-${escapeClassName(sub)}`);
        });

        config.datos.forEach(datoConfig => {
            const celda = nuevaFila.insertCell();
            const div = document.createElement("div");
            div.classList.add("tablaPOA-scrollable");

            if (datoConfig.type === "fixed") { // Fixed columns
                div.textContent = filaData[datoConfig.name] || "";
            } else { // Monthly or total cells
                celda.setAttribute("data-month", datoConfig.mes);
                celda.setAttribute("data-type", datoConfig.tipo);

                if (datoConfig.mes === "total") {
                    celda.classList.add("tablaPOA-total"); // AQUI PUEDE SER
                    div.textContent = "0"; // Initialize total as 0
                } else if (datoConfig.mes === "acum") {
                    celda.classList.add("tablaPOA-acum");
                    div.textContent = "0"; // Initialize total as 0
                } else { // This is a monthly cell (planificado or ejecutado)
                    const initialValue = filaData[datoConfig.name];
                    div.textContent = (initialValue !== undefined && initialValue !== 0) ? initialValue : '';

                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (const mutation of mutationsList) {
                            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                                calcularSumaFilaPOA(nuevaFila);
                                break;
                            }
                        }
                    });
                    observer.observe(div, { characterData: true, subtree: true, childList: true });
                }
            }
            celda.appendChild(div);
        });
    };

    const agregarSubtitulo = (tabla, subtitulo, claseSub, nivel, clasesSuperiores) => {
        if (!subtitulo) return;
        const fila = tabla.insertRow();
        fila.classList.add("tablaPOA-subtitulo", `tablaPOA-${claseSub}`);
        fila.setAttribute("data-tipo", "subtitulo");
        fila.setAttribute("subtitulo-nivel", nivel);
        fila.setAttribute("subtitulo-nombre", escapeClassName(subtitulo));
        fila.setAttribute("subtitulos-superiores", JSON.stringify(clasesSuperiores.map(escapeClassName)));

        const subtituloNombreEscaped = escapeClassName(subtitulo);
        const subtitulosSuperioresNombres = clasesSuperiores.map(escapeClassName);
        const subtitulosSuperioresNombresConActual = [...subtitulosSuperioresNombres, subtituloNombreEscaped];
        fila.setAttribute("filas-inferiores-subsup", JSON.stringify(subtitulosSuperioresNombresConActual));

        const celda = fila.insertCell();
        celda.textContent = subtitulo;
        celda.colSpan = config.datos.length;

        const icono = document.createElement("span");
        icono.classList.add("tablaPOA-triangulo");
        icono.textContent = "▼";
        celda.appendChild(icono);
    };


    const crearTabla = (POAdatos) => {
        const tbody = tablaElement.getElementsByTagName('tbody')[0];
        if (!tbody) {
            console.error(`[crearTabla] Tbody not found for table: ${tablaId}`);
            return;
        }
        tbody.innerHTML = ""; // Clear existing rows

        let ultimosSubtitulos = {};
        POAdatos.forEach(fila => {
            let clasesSubtitulos = [];
            config.subtitulos.forEach((sub, index) => {
                if (fila[sub] !== ultimosSubtitulos[sub]) {
                    agregarSubtitulo(tbody, fila[sub], sub, index + 1, clasesSubtitulos);
                    ultimosSubtitulos[sub] = fila[sub];
                }
                clasesSubtitulos.push(fila[sub] || "");
            });
            agregarFila(tbody, fila, clasesSubtitulos);
        });
        recalcularTodasLasSumasPOA();
        asignarClickASubtitulos(tablaElement);

    };

    const leerExcel = (url) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                const libro = XLSX.read(buffer, { type: 'array' });
                const nombreHoja = libro.SheetNames[0];
                const hoja = libro.Sheets[nombreHoja];
                const POAdatos = XLSX.utils.sheet_to_json(hoja);
                crearEncabezado();
                crearTabla(POAdatos);
            })
            .catch(error => {
                console.error("[leerExcel] Error reading Excel file:", error);
            });
    };

    leerExcel("POA 2025_bd.xlsx");
    return true;
}


function alternarVisibilidad(subsup, icono, tablaId) {
    subsup = JSON.parse(subsup);
    const filas = document.querySelectorAll(`#${tablaId} tbody [subtitulos-superiores]`);
    const matchingRows = [];

    filas.forEach(fila => {
        let attrValue = fila.getAttribute("subtitulos-superiores");
        let cleanValue = attrValue.replace(/&quot;/g, '"');
        let parsedValue = JSON.parse(cleanValue);
        if (Array.isArray(parsedValue) && subsup.every(value => parsedValue.includes(value))) {
            matchingRows.push(fila);
        }
    });

    const shouldHide = icono.textContent === "▼";
    matchingRows.forEach(fila => fila.classList.toggle("tablaPOA-oculto", shouldHide));
    icono.textContent = shouldHide ? "▶" : "▼";
}


function asignarClickASubtitulos(tabla) {
    const filasSubtitulo = tabla.querySelectorAll("tr.tablaPOA-subtitulo");

    filasSubtitulo.forEach(fila => {
        if (!fila.dataset.clickAsignado) {
            let icono = fila.querySelector(".tablaPOA-triangulo");

            // Crear ícono si no existe
            if (!icono) {
                icono = document.createElement("span");
                icono.classList.add("tablaPOA-triangulo");
                icono.textContent = "▼";
                const primerTd = fila.querySelector("td");
                if (primerTd) primerTd.appendChild(icono);
            }

            fila.addEventListener("click", () => {
                const subsup = fila.getAttribute("filas-inferiores-subsup");
                if (subsup && icono) {
                    alternarVisibilidad(subsup, icono, tabla.id); // Pasa el id como referencia
                }
            });

            fila.dataset.clickAsignado = "true";
        }
    });
}


function observarSubtitulosPOA(tablaId) {
    const esperarYObservar = () => {
        const tabla = document.getElementById(tablaId);
        if (!tabla || !tabla.querySelector("tbody")) return;

        asignarClickASubtitulos(tabla);

        const observer = new MutationObserver(() => {
            asignarClickASubtitulos(tabla);
        });

        observer.observe(tabla.querySelector("tbody"), {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });
    };

    const domObserver = new MutationObserver(() => {
        if (document.getElementById(tablaId)) {
            domObserver.disconnect();
            esperarYObservar();
        }
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
    esperarYObservar();
}

// Llamadas
observarSubtitulosPOA("tablaPOA");
observarSubtitulosPOA("mitablaPOA");




/**
 * Filtra las filas de una tabla basándose en un criterio de búsqueda.
 * @param {HTMLTableElement} tabla - La tabla a filtrar.
 * @param {string[]} criteriosFiltro - Un array de cadenas para filtrar.
 */
function filtrarFilas(tabla, criteriosFiltro) {
    if (!tabla) {
        console.warn("[filtrarFilas] Table element is null, cannot filter.");
        return;
    }
    tabla.querySelectorAll("tbody tr").forEach(fila => {
        const primeraColumna = fila.querySelector("td");
        if (primeraColumna) {
            const textoColumna = primeraColumna.textContent;
            const shouldDisplay = criteriosFiltro.some(criterio => textoColumna.startsWith(criterio));
            fila.style.display = shouldDisplay ? "" : "none";
        }
    });
}

/**
 * Crea un observador para una tabla que filtra sus filas cuando se detectan cambios.
 * @param {HTMLTableElement} tabla - La tabla a observar.
 * @param {string} localStorageKey - La clave de localStorage para obtener los datos del usuario.
*/
function crearObserverParaTabla(tabla, localStorageKey) {
    const observerTabla = new MutationObserver(() => {
        const usuarioDatos = JSON.parse(localStorage.getItem(localStorageKey)) || {};
        const criterioFiltro = (usuarioDatos.Resultado || '')
            .split(',')
            .map(criterio => criterio.trim())
            .filter(c => c !== '');
        filtrarFilas(tabla, criterioFiltro);
    });
    observerTabla.observe(tabla, { childList: true, subtree: true });
}

/**
 * Rellena las celdas de "ejecutado" de una tabla con datos de envíos del LocalStorage,
 * esperando a que la tabla exista y tenga al menos 10 filas.
 * @param {string} tablaId - El ID de la tabla HTML.
 * @param {string} localStorageKey - La clave de localStorage donde se encuentran los envíos.
 */
function fillTableWithEnvios(tablaId, localStorageKey, callback) {
    let intervalId;

    const checkTableAndFill = () => {
        const tableElement = document.getElementById(tablaId);
        if (tableElement) {
            const normalRows = tableElement.querySelectorAll('tbody tr.tablaPOA-normal');

            if (normalRows.length > 10 || (tablaId === 'mitablaPOA' && normalRows.length > 0)) {
                clearInterval(intervalId);

                waitForLocalStorageItem(localStorageKey, (envios) => {
                    if (!envios || envios.length === 0) {
                        console.warn(`[fillTableWithEnvios - ${tablaId}] No envios data found in localStorage for key: ${localStorageKey}. Skipping fill.`);
                        recalcularTodasLasSumasPOA();
                        if (callback) callback(); // <--- Llamar callback incluso si no hay datos
                        return;
                    }

                    const enviosAgrupados = {};
                    envios.forEach(envio => {
                        const actividad = envio.actividad;
                        const mesReporte = envio.mesReporte;
                        const mesLower = mesReporte ? mesReporte.toLowerCase().substring(0, 3) : '';
                        const numeroMetas = parseInt(envio.numerometas, 10);

                        if (actividad && mesLower && TABLA_POA_MESES.includes(mesLower) && !isNaN(numeroMetas)) {
                            if (!enviosAgrupados[actividad]) {
                                enviosAgrupados[actividad] = {};
                            }
                            if (!enviosAgrupados[actividad][mesLower]) {
                                enviosAgrupados[actividad][mesLower] = 0;
                            }
                            enviosAgrupados[actividad][mesLower] += numeroMetas;
                        } else {
                            console.warn(`[fillTableWithEnvios - ${tablaId}] Skipping invalid envio data:`, envio);
                        }
                    });

                    normalRows.forEach(row => {
                        const actividadCell = row.querySelector('td:first-child .tablaPOA-scrollable');
                        if (actividadCell) {
                            const actividadTabla = actividadCell.textContent;
                            const enviosParaActividad = enviosAgrupados[actividadTabla];

                            if (enviosParaActividad) {
                                TABLA_POA_MESES.forEach(mes => {
                                    const valueToFill = enviosParaActividad[mes];
                                    if (valueToFill !== undefined) {
                                        const executedCellDiv = row.querySelector(`[data-month="${mes}"][data-type="ejecutado"] .tablaPOA-scrollable`);
                                        if (executedCellDiv) {
                                            executedCellDiv.textContent = valueToFill;
                                        }
                                    }
                                });
                            }
                        }
                    });

                    recalcularTodasLasSumasPOA();
                    if (callback) callback(); // ✅ Ejecutar callback al final
                });
            }
        }
    };

    intervalId = setInterval(checkTableAndFill, 1000);
}

// Tooltips a leyenda

const legTooltips = {
    "leg-explicacion": "Corresponde a lo planificado hasta la fecha (abril).",
    "leg-rojo": "Respecto al planificado a la fecha.",
    "leg-amarillo": "Respecto al planificado a la fecha.",
    "leg-verde": "Respecto al planificado a la fecha.",
    "leg-extra": "Respecto al planificado total anual."
  };

  const appliedElements = new WeakSet();

  function applyTooltips() {
    Object.entries(legTooltips).forEach(([className, tooltipText]) => {
      document.querySelectorAll(`.${className}`).forEach(el => {
        if (!appliedElements.has(el)) {
          const wrapper = document.createElement("span");
          wrapper.className = "leg-tooltip-container";
          el.parentNode.insertBefore(wrapper, el);
          wrapper.appendChild(el);

          const tooltip = document.createElement("div");
          tooltip.className = "leg-tooltip";
          tooltip.innerText = tooltipText;
          wrapper.appendChild(tooltip);

          appliedElements.add(el);
        }
      });
    });
  }

  const observer100 = new MutationObserver(applyTooltips);

  observer100.observe(document.body, {
    childList: true,
    subtree: true
  });

  document.addEventListener("DOMContentLoaded", applyTooltips);

// --- Parte 2: Dar propiedades a celdas (hover, círculos, modal) ---

const SEMAFORO_ROJO     = 'rgb(255, 100, 120)'; // < 65%
const SEMAFORO_AMARILLO = 'rgb(255, 240, 100)'; // 65-90%
const SEMAFORO_VERDE    = 'rgb(140, 243, 138)'; // 90-100%
const SEMAFORO_EXTRA    = 'rgb(105, 173, 255)'; // > 100%


/**
 * Genera un color degradado suave de rojo a amarillo a verde.
 * @param {number} percentage
 * @returns {string} Color RGB (en formato suave)
 */
function tablasPOAGetPercentageColor(percentage, usarAzulExtra = false) {
    if (percentage < 65) {
        return SEMAFORO_ROJO;
    }

    if (percentage >= 65 && percentage < 90) {
        return SEMAFORO_AMARILLO;
    }

    if (percentage >= 90 && percentage <= 100) {
        return SEMAFORO_VERDE;
    }

    if (percentage > 100) {
        return usarAzulExtra ? SEMAFORO_EXTRA : SEMAFORO_VERDE;
    }

    // Por si acaso no cae en ningún rango (aunque no debería)
    return SEMAFORO_ROJO;
}


/**
 * Genera el SVG con círculos concéntricos para representar el porcentaje.
 * @param {number} percentage - El porcentaje total.
 * @param {string} mode - 'tooltip' o 'modal' para ajustar el tamaño.
 * @param {string} fillColor - El color de relleno para el progreso.
 * @returns {string} HTML string con el SVG.
 */
function tablasPOAGetConcentricCirclesSVG(percentage, mode = 'tooltip', fillColor = '#fff') {
    let viewBoxSize, baseRadius, strokeWidth, gap;

    if (mode === 'tooltip') {
        viewBoxSize = 30;
        baseRadius = 12;
        strokeWidth = 2;
        gap = 3;
    } else { // 'modal'
        viewBoxSize = 60;
        baseRadius = 25;
        strokeWidth = 6;
        gap = 5;
    }

    const centerX = viewBoxSize / 2;
    const centerY = viewBoxSize / 2;
    let svgElements = '';
    let currentPercentage = percentage;
    let radius = baseRadius;
    let circleIndex = 0;

    while ((circleIndex === 0 || currentPercentage > 0) && circleIndex < 2) {
        const progressInThisCircle = Math.min(currentPercentage, 100);
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference * (1 - (progressInThisCircle / 100));

        svgElements += `
            <circle class="tablasPOA-circle-bg" cx="${centerX}" cy="${centerY}" r="${radius}" stroke-width="${strokeWidth}"></circle>
            <circle class="tablasPOA-circle-progress" cx="${centerX}" cy="${centerY}" r="${radius}" stroke-width="${strokeWidth}"
                stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                transform="rotate(-90 ${centerX} ${centerY})" style="stroke:${fillColor};"></circle>
        `;

        currentPercentage -= 100;
        radius -= (strokeWidth + gap);
        circleIndex++;
    }

    // Mostrar signo "+" si hay más porcentaje pendiente
    if (currentPercentage > 0) {
        svgElements += `<text x="${centerX}" y="${centerY + (mode === 'tooltip' ? 4 : 6)}"
            font-family="Arial" font-size="${mode === 'tooltip' ? 10 : 16}"
            fill="${mode === 'tooltip' ? 'white' : '#333'}"
            text-anchor="middle">+</text>`;
    }

    return `
        <div class="tablasPOA-percentage-circle-svg-wrapper">
            <svg class="tablasPOA-percentage-circle-svg" width="${viewBoxSize}" height="${viewBoxSize}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
                ${svgElements}
            </svg>
        </div>
    `;
}

function tablasPOASetActivityNameAttributes(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`No se encontró la tabla con ID '${tableId}'.`);
        return;
    }

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const firstCell = row.querySelector('td:first-child .tablaPOA-scrollable');
        if (!firstCell) return;

        const activityName = firstCell.textContent;
        const cells = row.querySelectorAll('td');

        cells.forEach(cell => {
            cell.setAttribute('data-activity-name', activityName);
        });
    });
}


/**
 * Aplica los estilos y funcionalidades de interacción (hover, click) a las celdas de ejecución.
 * @param {string} tableId - El ID de la tabla principal.
 * @param {string} localStorageKey - La clave usada para obtener los datos de 'Envios' de localStorage.
 */
function tablasPOAApplyCellProperties(tableId, localStorageKey) {
    const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos"));

    tablasPOASetActivityNameAttributes(tableId);

    const mainTable = document.getElementById(tableId);
    if (!mainTable) {
        console.error(`Table with ID '${tableId}' not found.`);
        return;
    }

    // Get all cells with data-type="ejecutado"
    const allExecutedCells = [...mainTable.querySelectorAll('td[data-type="ejecutado"]')];

    // Cells that fall within the cut-off months or are "total"
    const executedCellsCorte = allExecutedCells.filter(cell => {
        const month = cell.getAttribute('data-month');
        return TABLA_POA_MESES_CORTE.includes(month) && month !== "total";
    });

    // Cells that are NOT within the cut-off months and are NOT "total"
    const executedCellsNoCorte = allExecutedCells.filter(cell => {
        const month = cell.getAttribute('data-month');
        return !TABLA_POA_MESES_CORTE.includes(month) && month !== "total";
    });

    const executedCellsTotal = allExecutedCells.filter(cell => {
        const month = cell.getAttribute('data-month');
        return month === "total";
    });



    // Retrieve Envios data from localStorage
    let currentEnviosData = [];
    const storedEnvios = localStorage.getItem(localStorageKey);
    if (storedEnvios) {
        try {
            currentEnviosData = JSON.parse(storedEnvios);
        } catch (e) {
            console.error(`Error parsing ${localStorageKey} from localStorage:`, e);
        }
    }

    executedCellsCorte.forEach(cell => {
        const activityName = cell.dataset.activityName;
        const monthName = cell.dataset.month;

        let planCell; // Declare planCell here using 'let'

        planCell = mainTable.querySelector(
            `[data-activity-name="${activityName}"][data-month=${monthName}][data-type="planificado"]`
        );

        if (!planCell) {
            console.warn(`No planned cell found for activity: ${activityName}, month: ${monthName}`);
            return;
        }

        const plannedVal = parseFloat(planCell.textContent);

        let details;

        const nombreMesReporte = TABLA_POA_MES_MAP[monthName] || "(desconocido)";
        details = currentEnviosData.filter(envio => {
            const matchActividad = envio.actividad === activityName;
            const matchMes = envio.mesReporte === nombreMesReporte;
            return matchActividad && matchMes;
        });


        // Set the detailed data attributes here for modal to use
        cell.dataset.plannedValue = plannedVal;
        cell.dataset.executedValue = cell.textContent || 0;
        const executedVal = (cell.textContent) ;
        cell.dataset.details = JSON.stringify(details);

        let percentage = 0;
        let cellColor = '';
        let tooltipText = '';
        let circlesSVG = '';
        let showCirclesInTooltip = false;


        if (!plannedVal && executedVal > 0) {
            // Caso de ejecución sin planificación
            percentage = 201;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `Ejecutado: ${executedVal} (Planificado: 0)`;
            showCirclesInTooltip = true;
        }

        if (plannedVal > 0 && !executedVal) {
            // Caso de planificación sin ejecución
            percentage = 0;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `${percentage.toFixed(1)}% (0/${plannedVal})`;
            showCirclesInTooltip = true;
        }

        if (!plannedVal && !executedVal) {
            // Ambos son cero o falsy
            percentage = 0;
            cellColor = '';
            tooltipText = '';
            showCirclesInTooltip = false;
        }
        if (plannedVal > 0 && executedVal > 0)  {
            // Cálculo normal
            percentage = (executedVal / plannedVal) * 100;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `${percentage.toFixed(1)}% (${executedVal}/${plannedVal})`;
            showCirclesInTooltip = true;
        }


        if (usuarioDatos.Tipo !== "admin") {
            cellColor = '';
        }

        // Apply the background color to the cell
        cell.style.backgroundColor = cellColor;

        // Generate and add the content of the tooltip
        if (showCirclesInTooltip) {
            circlesSVG = tablasPOAGetConcentricCirclesSVG(percentage, 'tooltip');
        }

        // Reconstruir html de la celda con tooltip
        if (tooltipText !== '') {
            cell.innerHTML = `
                <div class="tablasPOA-tooltip-container">
                    <span>${tooltipText}</span>
                    ${circlesSVG}
                </div>
                ${executedVal}
            `;
        }

        // Add listener for the modal 
        if (plannedVal > 0 || executedVal > 0) {
            cell.style.cursor = 'pointer'; // Ensure cursor is pointer if clickable
            cell.addEventListener('click', tablasPOAHandleExecutedCellClick);
        } else {
            cell.style.cursor = 'default';
            // Remove existing click listener if any
            cell.removeEventListener('click', tablasPOAHandleExecutedCellClick);
        }
    });


    executedCellsNoCorte.forEach(cell => {
        const activityName = cell.dataset.activityName;
        const monthName = cell.dataset.month;

        let planCell; // Declare planCell here using 'let'

        planCell = mainTable.querySelector(
            `[data-activity-name="${activityName}"][data-month=${monthName}][data-type="planificado"]`
        );

        if (!planCell) {
            console.warn(`No planned cell found for activity: ${activityName}, month: ${monthName}`);
            return;
        }

        const plannedVal = parseFloat(planCell.textContent);

        let details;

        const nombreMesReporte = TABLA_POA_MES_MAP[monthName] || "(desconocido)";
        details = currentEnviosData.filter(envio => {
            const matchActividad = envio.actividad === activityName;
            const matchMes = envio.mesReporte === nombreMesReporte;
            return matchActividad && matchMes;
        });


        // Set the detailed data attributes here for modal to use
        cell.dataset.plannedValue = plannedVal;
        cell.dataset.executedValue = cell.textContent || 0;
        const executedVal = (cell.textContent) ;
        cell.dataset.details = JSON.stringify(details);

        let percentage = 0;
        let cellColor = '';
        let tooltipText = '';
        let circlesSVG = '';
        let showCirclesInTooltip = false;
        let showCirclesInModal = false;

        if (!plannedVal && executedVal > 0) {
            // Caso de ejecución sin planificación
            percentage = 201;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `Ejecutado: ${executedVal} (Planificado: 0)`;
            showCirclesInTooltip = true;
        }

        if (plannedVal > 0 && executedVal > 0)  {
            // Cálculo normal
            percentage = (executedVal / plannedVal) * 100;
            tooltipText = `${percentage.toFixed(1)}% (${executedVal}/${plannedVal})`;
            showCirclesInTooltip = true;
        }


        // Generate and add the content of the tooltip
        if (showCirclesInTooltip) {
            circlesSVG = tablasPOAGetConcentricCirclesSVG(percentage, 'tooltip');
        }

        // Reconstruir html de la celda con tooltip
        if (tooltipText !== '') {
            cell.innerHTML = `
                <div class="tablasPOA-tooltip-container">
                    <span>${tooltipText}</span>
                    ${circlesSVG}
                </div>
                ${executedVal}
            `;
        }

        // Add listener for the modal if there's data to show
        if (executedVal > 0) {
            cell.style.cursor = 'pointer'; // Ensure cursor is pointer if clickable
            cell.addEventListener('click', tablasPOAHandleExecutedCellClick);
        } else {
            cell.style.cursor = 'default';
            // Remove existing click listener if any
            cell.removeEventListener('click', tablasPOAHandleExecutedCellClick);
        }
    });

    executedCellsTotal.forEach(cell => {
        const activityName = cell.dataset.activityName;
        const monthName = cell.dataset.month;

        let planCell; 
        let planCellAcum; 

        planCellAcum = mainTable.querySelector(
            `[data-activity-name="${activityName}"][data-month="acum"][data-type="planificado"]`
        );

        planCell = mainTable.querySelector(
            `[data-activity-name="${activityName}"][data-month="total"][data-type="planificado"]`
        );


        if (!planCell || !planCellAcum) {
            console.warn(`No planned cell found for activity: ${activityName}, month: ${monthName}`);
            return;
        }

        const plannedVal = parseFloat(planCell.textContent);
        const plannedValAcum = parseFloat(planCellAcum.textContent);

        let details;

        details = currentEnviosData.filter(envio => {
            const matchActividad = envio.actividad === activityName;
            return matchActividad;
        });

        // Set the detailed data attributes here for modal to use
        cell.dataset.plannedValue = plannedVal;
        cell.dataset.plannedValueAcum = plannedValAcum;
        cell.dataset.executedValue = cell.textContent || 0;
        const executedVal = parseFloat(cell.textContent) ;
        cell.dataset.details = JSON.stringify(details);

        let percentage = 0;
        let percentagesobreanual = 0;
        let cellColor = '';
        let cellColorTotal = '';
        let tooltipText = '';
        let circlesSVG = '';
        let showCirclesInTooltip = false;
        let showCirclesInModal = false;


        if ((!plannedValAcum || plannedValAcum===0) && executedVal > 0) {
            // Caso de ejecución sin planificación
            percentage = 100;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `Ejecutado: ${executedVal} (Planificado: 0)`;
            showCirclesInTooltip = false;
            showCirclesInModal = false;
        }

        if (plannedValAcum > 0 && (!executedVal || executedVal === 0)) {
            // Caso de planificación sin ejecución
            percentage = 0;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `${percentage.toFixed(1)}% (0/${plannedValAcum})`;
            showCirclesInTooltip = true;
            showCirclesInModal = true;
        }

        if ((!plannedValAcum || plannedValAcum===0) && (!executedVal || executedVal === 0)) {
            // Ambos son cero o falsy
            percentage = 0;
            cellColor = '';
            tooltipText = '';
            showCirclesInTooltip = false;
            showCirclesInModal = false;
        }
        if (plannedValAcum > 0 && executedVal > 0)  {
            // Cálculo normal
            percentage = (executedVal / plannedValAcum) * 100;
            cellColor = tablasPOAGetPercentageColor(percentage);
            tooltipText = `${percentage.toFixed(1)}% (${executedVal}/${plannedValAcum})`;
            showCirclesInTooltip = true;
            showCirclesInModal = true;
        }

        if (executedVal > plannedVal)  {
            // Reemplazar cellColor si ya se excedió el anual!
            cellColor = SEMAFORO_EXTRA;
        }

        if (plannedVal > 0 && executedVal>0) {
            // Color del circulo sobre planificado anual 
            percentagesobreanual = (executedVal / plannedVal) * 100;

            if (percentagesobreanual > 100) {
                cellColorTotal = SEMAFORO_EXTRA; // color celeste para sobre-ejecución
            } else {
                cellColorTotal = tablasPOAGetPercentageColor(percentagesobreanual);
            }
        }


        // Apply the background color to the cell
        cell.style.backgroundColor = cellColor;
        cell.style.backgroundColorTotal = cellColorTotal;

        // Generate and add the content of the tooltip
        if (showCirclesInTooltip) {
            circlesSVG = tablasPOAGetConcentricCirclesSVG(percentage, 'tooltip');
            // console.log("SVG generado para", activityName, percentage, "es:", circlesSVG);
        }

        // Reconstruir html de la celda con tooltip
        if (tooltipText !== '') {
            cell.classList.add('tooltip-right');

            cell.innerHTML = `
                <div class="tablasPOA-tooltip-container">
                    <span>${tooltipText}</span>
                    ${circlesSVG}
                </div>
                ${executedVal}
            `;
            // console.log("cell.innerHTML: ", cell.innerHTML);
        }

        cell.style.cursor = 'pointer'; // Ensure cursor is pointer if clickable
        cell.addEventListener('click', tablasPOAHandleExecutedCellClick);

    });


}

/**
 * Maneja el click en una celda ejecutada para abrir el modal de detalles.
 * @param {Event} event - El evento de click.
 */
function tablasPOAHandleExecutedCellClick(event) {
    const currentCell = event.currentTarget;
    const activityName = currentCell.dataset.activityName;
    const monthName = currentCell.dataset.month;
    let plannedVal;
    let plannedValTotal;

    if (monthName === "total") {
        plannedVal = parseFloat(currentCell.dataset.plannedValueAcum) || 0;
        plannedValTotal = parseFloat(currentCell.dataset.plannedValue) || 0;
    } else {
        plannedVal = parseFloat(currentCell.dataset.plannedValue) || 0;
    }

    const executedVal = parseFloat(currentCell.dataset.executedValue) || 0;
    const cellColor = currentCell.style.backgroundColor;
    const cellColorTotal = currentCell.style.backgroundColorTotal;
    const details = JSON.parse(currentCell.dataset.details || '[]');

    const tablasPOADETAIL_MODAL = document.createElement('div');
    tablasPOADETAIL_MODAL.id = 'tablasPOADetailModal';
    tablasPOADETAIL_MODAL.className = 'tablasPOA-modal';
    tablasPOADETAIL_MODAL.style.display = 'flex';

    tablasPOADETAIL_MODAL.innerHTML = `
        <div class="tablasPOA-modal-content">
            <span class="tablasPOA-close-button" id="tablasPOACloseModalBtn">&times;</span>
            <h3>Detalle de Ejecución</h3>
            <div class="tablasPOA-modal-header-info">
                <div id="tablasPOAModalPercentageDisplay" class="tablasPOA-percentage-indicators"></div>
                <p>Actividad: <strong id="tablasPOAModalActivityName"></strong></p>
                <p>Mes del Reporte: <strong id="tablasPOAModalMonthReport"></strong></p>
            </div>
            <div class="tablasPOA-modal-scrollable-content">
                <table id="tablasPOADetailTable" class="tablasPOA-envios">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(tablasPOADETAIL_MODAL);

    const tablasPOAMODAL_ACTIVITY_NAME = tablasPOADETAIL_MODAL.querySelector('#tablasPOAModalActivityName');
    const tablasPOAMODAL_MONTH_REPORT = tablasPOADETAIL_MODAL.querySelector('#tablasPOAModalMonthReport');
    const tablasPOAMODAL_PERCENTAGE_DISPLAY = tablasPOADETAIL_MODAL.querySelector('#tablasPOAModalPercentageDisplay');
    const tablasPOADETAIL_TABLE = tablasPOADETAIL_MODAL.querySelector('#tablasPOADetailTable');
    const tablasPOADETAIL_TABLE_HEAD = tablasPOADETAIL_TABLE.querySelector('thead');
    const tablasPOADETAIL_TABLE_BODY = tablasPOADETAIL_TABLE.querySelector('tbody');
    const tablasPOACLOSE_MODAL_BTN = tablasPOADETAIL_MODAL.querySelector('#tablasPOACloseModalBtn');

    tablasPOAMODAL_ACTIVITY_NAME.textContent = activityName;
    tablasPOAMODAL_MONTH_REPORT.textContent = monthName === 'total' ? 'A la fecha' : (monthName.charAt(0).toUpperCase() + monthName.slice(1));

    function getCircleData(ejecutado, planificado) {
        let pct = 0;
        let txt = '';
        if (planificado === 0 && ejecutado === 0) {
            txt = "0% (0/0)";
        } else if (planificado === 0) {
            pct = 1000;
            txt = `Ejecutado: ${ejecutado} (Planificado: 0)`;
        } else if (ejecutado === 0) {
            txt = `0% (0/${planificado})`;
        } else {
            pct = (ejecutado / planificado) * 100;
            txt = `${pct.toFixed(1)}% (${ejecutado}/${planificado})`;
        }
        return { pct, txt };
    }

    if (monthName === "total") {
        const mensual = getCircleData(executedVal, plannedVal);
        const anual = getCircleData(executedVal, plannedValTotal);

        tablasPOAMODAL_PERCENTAGE_DISPLAY.innerHTML = `
            <div class="tablasPOA-percentage-indicator">
                ${tablasPOAGetConcentricCirclesSVG(mensual.pct, 'modal', cellColor)}
                <p class="tablasPOA-percentage-label">Respecto al planificado a la fecha</p>
                <span>${mensual.txt}</span>
            </div>
            <div class="tablasPOA-percentage-indicator">
                ${tablasPOAGetConcentricCirclesSVG(anual.pct, 'modal', cellColorTotal)}
                <p class="tablasPOA-percentage-label">Respecto al planificado anual</p>
                <span>${anual.txt}</span>
            </div>
        `;
    } else {
        const mensual = getCircleData(executedVal, plannedVal);

        tablasPOAMODAL_PERCENTAGE_DISPLAY.innerHTML = `
            <div class="tablasPOA-percentage-indicator">
                ${tablasPOAGetConcentricCirclesSVG(mensual.pct, 'modal', cellColor)}
                <p class="tablasPOA-percentage-label">Respecto al planificado mensual</p>
                <span>${mensual.txt}</span>
            </div>
        `;
    }

    const columnasLlenas = filtrarColumnasLlenas(headers, details);
    tablasPOADETAIL_TABLE.innerHTML = construirTablaConHeaders(columnasLlenas, details);

    tablasPOACLOSE_MODAL_BTN.addEventListener('click', () => {
        tablasPOADETAIL_MODAL.remove();
    });

    tablasPOADETAIL_MODAL.addEventListener('click', (event) => {
        if (event.target === tablasPOADETAIL_MODAL) {
            tablasPOADETAIL_MODAL.remove();
        }
    });
}


// Carga e Inicialización de Tablas
document.addEventListener("DOMContentLoaded", function () {

    // --- Inicializar tablaPOA ---
    const observerPOA = new MutationObserver((mutations, obs) => {
        if (inicializarTablaPOA("tablaPOA")) {
            obs.disconnect(); // Disconnect self
            fillTableWithEnvios('tablaPOA', 'Envios', () => {
                tablasPOAApplyCellProperties('tablaPOA', 'Envios');
            });
        }
    });
    observerPOA.observe(document.body, { childList: true, subtree: true });
    // Try to initialize immediately in case the table already exists
    inicializarTablaPOA("tablaPOA");

    // --- Inicializar mitablaPOA con filtro de usuario ---
    let datosUsuarioProcesados = false;
    let intervaloVerificacionMiTabla; // Declare outside to be accessible for clearInterval

    const verificarYFiltrarMiTabla = () => {
        const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos"));

        if (usuarioDatos && !datosUsuarioProcesados) {
            const criterioFiltro = (usuarioDatos.Resultado || '')
                .split(',')
                .map(criterio => criterio.trim())
                .filter(c => c !== '');

            const tablaMiPOA = document.getElementById("mitablaPOA");
            if (tablaMiPOA) {
                if (inicializarTablaPOA("mitablaPOA")) {
                    crearObserverParaTabla(tablaMiPOA, "usuarioDatos"); // Observe for filtering
                    filtrarFilas(tablaMiPOA, criterioFiltro); // Filter initially
                    fillTableWithEnvios('mitablaPOA', 'misEnvios', () => {
                        tablasPOAApplyCellProperties('mitablaPOA', 'misEnvios');
                    });
                    datosUsuarioProcesados = true;
                    clearInterval(intervaloVerificacionMiTabla); // Stop interval once processed
                }
            }
        } else if (datosUsuarioProcesados) {
            clearInterval(intervaloVerificacionMiTabla);
        }
    };
    intervaloVerificacionMiTabla = setInterval(verificarYFiltrarMiTabla, 1000);

});


// MANUAL

document.addEventListener('DOMContentLoaded', function () {
    window.manualShowSection = function(id) {
        document.querySelectorAll('.manual-section').forEach(sec => sec.classList.remove('manual-active'));
        const target = document.getElementById(id);
        target.classList.add('manual-active');
        }
})