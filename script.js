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
    const contentContainer = document.getElementById("content-container");
    const toggleButton = document.getElementById("sidebar-toggle");

    toggleButton.addEventListener("click", function() {
        sidebar.classList.toggle("hidden");
        contentContainer.classList.toggle("expanded");
    });
});


//////////// FUNCIONES


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




document.getElementById("login-btn")?.addEventListener("click", login);

let datosConsultores = []; // Declare globally
let usuarioActual = ""; // Variable global para almacenar el usuario

function login() {
    usuarioActual = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    fetch('POA 2025_bd.xlsx')
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheet = workbook.Sheets['Consultores']; 
            datosConsultores = XLSX.utils.sheet_to_json(sheet); // Guardamos los datos globalmente

            console.log("Datos del Excel cargados:", datosConsultores);

            // Buscar usuario en la tabla
            const userData = datosConsultores.find(row => 
                row.Usuario?.toString().trim() === usuarioActual && 
                row.Password?.toString().trim() === password
            );

            if (!userData) {
                alert('Credenciales incorrectas');
                return;
            }

            localStorage.setItem("usuarioDatos", JSON.stringify(userData));
            mostrarMenu(userData);
        })
        .catch(error => {
            console.error("Error al leer el archivo Excel:", error);
            alert('No se pudo cargar la base de datos.');
        });
}

function mostrarMenu(userData) {
    let buttons = "";
    
    const adminButtons = ["Contenido 6", "Contenido 7", "Contenido 8", "Contenido 9"];
    const userButtons = ["Registro POA", "Ver POA 2025", "Mis envíos", "Contenido 4", "Contenido 5"];

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

document.addEventListener("DOMContentLoaded", function() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            location.reload(); // Recarga la página
        });
    }
});


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
                
                setTimeout(() => {
                    inicializarEventosMetas();
                }, 100);
            })
            .catch(error => {
                document.getElementById("content").innerHTML = `<p>Error al cargar el contenido: ${error.message}</p>`;
            });
    }

    // Resaltar botón activo
    document.querySelectorAll(".sidebar button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
}

// 🔹 Función para inicializar eventos después de que se cargue el HTML dinámico
function inicializarEventosMetas() {
    const metasContainer = document.getElementById("metas-container");
    const addMetaButton = document.querySelector(".add-meta");

    if (!metasContainer || !addMetaButton) {
        return;
    }

    const metaTemplate = document.querySelector(".meta-container")?.cloneNode(true);
    if (!metaTemplate) {
        return;
    }

    addMetaButton.addEventListener("click", function () {
        function agregarMeta() {
            const nuevaMeta = metaTemplate.cloneNode(true);
            metasContainer.appendChild(nuevaMeta);
            actualizarNumeracionMetas();
        }
        agregarMeta()    
    });
}


///////////////// CONTENIDO1 ////////////////////

// IMPORTAR DE LOCAL STORAGE DATOS DEL USUARIO 

const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};

console.log("Datos del usuario:", usuarioDatos);

// Ahora puedes acceder directamente a cualquier campo, por ejemplo:
console.log("Entidad del usuario:", usuarioDatos["Entidad"]);


// 2.1. USER. FORMULARIO.

document.addEventListener("DOMContentLoaded", function () {
    const metasContainer = document.getElementById("metas-container");
    const addMetaButton = document.querySelector(".add-meta");
    const submitButton = document.getElementById("submitButton");
    const metaTemplate = document.querySelector(".meta-container")?.cloneNode(true);
    
    window.actualizarNumeracionMetas = actualizarNumeracionMetas
    function actualizarNumeracionMetas() {
        document.querySelectorAll(".meta-container").forEach((meta, index) => {
            meta.querySelector(".meta-title").textContent = `Registrar Meta ${index + 1}`;
            meta.dataset.index = index + 1;
            meta.querySelectorAll("input, select, td[contenteditable]").forEach(input => {
                if (input.id) {
                    const baseId = input.id.split("-")[0];
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
            const user = usuarioDatos["Usuario"];            ;
            const fechaHora = new Date().toLocaleDateString('es-PE') + " " + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
            const fechaInicioGlobal = getElementValue("fecha-inicio");
            const fechaFinGlobal = getElementValue("fecha-fin");
            const mesReporteGlobal = getElementValue("mes-reporte");
            const metas = document.querySelectorAll(".meta-container");

            for (const meta of metas) {
                const index = meta.dataset.index;
                const metaData = {
                    usuario: user,
                    timestamp: fechaHora,
                    fechaInicio: fechaInicioGlobal, 
                    fechaFin: fechaFinGlobal,
                    mesReporte: mesReporteGlobal,
                    titulo: getElementText(`nombreMeta-${index}`),
                    actividad: getSelectText(`actividad-${index}`),
                    metaNueva: getSelectText(`metaNueva-${index}`),
                    nombreMeta: getElementText(`nombreMeta-${index}`),
                    estadoMeta: getSelectText(`estadoMeta-${index}`),
                    detalleMeta: getElementText(`detalleMeta-${index}`),
                    fechaInicio: getElementValue(`fechaInicio-${index}`),
                    fechaFin: getElementValue(`fechaFin-${index}`),
                    entidad: getSelectText(`entidad-${index}`),
                    variosConsultores: getSelectText(`variosConsultores-${index}`),
                    participantes: getElementValue(`participantes-${index}`),
                    hombres: getElementValue(`hombres-${index}`),
                    mujeres: getElementValue(`mujeres-${index}`),
                    autoridades: getElementText(`autoridades-${index}`)
                };
                await addDoc(collection(db, "metas"), metaData);
            }
            alert("✅ La información se registró satisfactoriamente.");
        } catch (error) {
            alert(`❌ Error: ${error.message}\nPor favor, no pierda su registro, tome nota del error e informe a Seguimiento y Evaluación.`);
            console.error("Error al enviar datos:", error);
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
    });

});

//////////////// CONTENIDO2 /////////////////

document.addEventListener("DOMContentLoaded", function () {

    function inicializarTablaPOA() {
        if (!document.getElementById("tablaPOA")) {
            return false;
        }

        window.tablaPOA_subtitulos = ["Resultado", "Producto"];
        window.tablaPOA_columnasFijas = ["Actividad", "Indicador", "Unidad de medida", "Medio de verificación", "Logro Esperado"];
        window.tablaPOA_meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
        window.tablaPOA_datos = [...window.tablaPOA_columnasFijas, ...window.tablaPOA_meses.map(m => m + "_pl"), "Pl_total", ...window.tablaPOA_meses.map(m => m + "_ej"), "Ej_total"];

        window.tablaPOA_leerExcel = function (url) {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    const libro = XLSX.read(buffer, { type: 'array' });
                    const nombreHoja = libro.SheetNames[0];
                    const hoja = libro.Sheets[nombreHoja];
                    const datosExcel = XLSX.utils.sheet_to_json(hoja);
                    window.tablaPOA_crearEncabezado();
                    window.tablaPOA_crearTabla(datosExcel);
                });
        };

        window.tablaPOA_crearEncabezado = function () {
            const encabezado1 = document.getElementById("tablaPOA-encabezado1");
            const encabezado2 = document.getElementById("tablaPOA-encabezado2");

            if (!encabezado1 || !encabezado2) return;
            encabezado1.innerHTML = "";
            encabezado2.innerHTML = "";

            window.tablaPOA_columnasFijas.forEach(dato => encabezado1.appendChild(crearTH(dato, { rowSpan: 2 })));

            ["Planificado", "Ejecutado"].forEach(seccion => {
                encabezado1.appendChild(crearTH(seccion, { colSpan: window.tablaPOA_meses.length + 1 }));
                window.tablaPOA_meses.forEach(mes => encabezado2.appendChild(crearTH(mes)));
                encabezado2.appendChild(crearTH("Total"));
            });
        };

        window.crearTH = function (texto, atributos = {}) {
            let th = document.createElement("th");
            th.textContent = texto;
            Object.assign(th, atributos);
            return th;
        };

        window.tablaPOA_crearTabla = function (datosExcel) {
            const tabla = document.getElementById("tablaPOA")?.getElementsByTagName('tbody')[0];
            if (!tabla) return;

            let ultimosSubtitulos = {};
            datosExcel.forEach(fila => {
                let clasesSubtitulos = [];
                window.tablaPOA_subtitulos.forEach((sub, index) => {
                    if (fila[sub] !== ultimosSubtitulos[sub]) {
                        window.tablaPOA_agregarSubtitulo(tabla, fila[sub], sub, index + 1, clasesSubtitulos);
                        ultimosSubtitulos[sub] = fila[sub];
                    }
                    clasesSubtitulos.push(fila[sub] || "");
                });
                window.tablaPOA_agregarFila(tabla, fila, clasesSubtitulos);
            });
        };

        window.tablaPOA_escapeClassName = function (name) {
            return name.replace(/\W/g, "_");
        };

        window.tablaPOA_agregarSubtitulo = function (tabla, subtitulo, claseSub, nivel, clasesSuperiores) {
            if (!subtitulo) return;
            const fila = tabla.insertRow();
            fila.classList.add("tablaPOA-subtitulo", `tablaPOA-${claseSub}`);
            fila.setAttribute("data-nivel", nivel);
            fila.setAttribute("data-subtitulo", window.tablaPOA_escapeClassName(subtitulo));
            fila.setAttribute("data-subtitulos", JSON.stringify(clasesSuperiores.map(window.tablaPOA_escapeClassName)));

            let celda = fila.insertCell();
            celda.textContent = subtitulo;
            celda.colSpan = window.tablaPOA_datos.length;

            let icono = document.createElement("span");
            icono.classList.add("tablaPOA-triangulo");
            icono.textContent = "▼";
            celda.appendChild(icono);

            fila.addEventListener("click", function () {
                window.tablaPOA_alternarVisibilidad(window.tablaPOA_escapeClassName(subtitulo), icono);
            });
        };

        window.tablaPOA_agregarFila = function (tabla, fila, clasesSubtitulos) {
            const nuevaFila = tabla.insertRow();
            nuevaFila.classList.add("tablaPOA-normal");
            nuevaFila.setAttribute("data-tipo", "dato");
            nuevaFila.setAttribute("data-subtitulos", JSON.stringify(clasesSubtitulos.map(window.tablaPOA_escapeClassName)));

            clasesSubtitulos.forEach(sub => {
                if (sub) nuevaFila.classList.add(`tablaPOA-sub-${window.tablaPOA_escapeClassName(sub)}`);
            });

            window.tablaPOA_datos.forEach(dato => {
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

        window.tablaPOA_alternarVisibilidad = function (subtitulo, icono) {
            let filas = document.querySelectorAll(`.tablaPOA-sub-${subtitulo}, [data-subtitulos*='"${subtitulo}"']`);
            let ocultar = Array.from(filas).some(fila => !fila.classList.contains("tablaPOA-oculto"));
            filas.forEach(fila => fila.classList.toggle("tablaPOA-oculto", ocultar));
            icono.textContent = ocultar ? "▶" : "▼";
        };

        window.tablaPOA_leerExcel("POA 2025_bd.xlsx");
        return true;
    }

    // Crear un observador para esperar a que #tablaPOA aparezca en el DOM
    const observer = new MutationObserver(() => {
        if (inicializarTablaPOA()) {
            observer.disconnect(); // Detener el observador una vez que la tabla esté lista
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Intentar ejecutar directamente si la tabla ya existe
    inicializarTablaPOA();
});


//////////////////////////// CONTENIDO3 //////////////////////////////

const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            const table = document.getElementById("submissions-table");
            if (table) {
                actualizarTabla();
                observer.disconnect(); // Deja de observar una vez que encuentra el elemento
                break;
            }
        }
    }
});

// Observar cambios en el body o un contenedor específico
observer.observe(document.body, { childList: true, subtree: true });

let memoriaSubmissions = null;

window.actualizarTabla = actualizarTabla 
async function actualizarTabla() {
    const tabla = document.getElementById("submissions-table");
        
    // Si ya hay datos en memoria, usa esos en lugar de Firestore
    if (memoriaSubmissions !== null) {
        renderizarTabla(memoriaSubmissions);
        return;
    }

    tabla.innerHTML = "<tr><td colspan='15'>Cargando datos...</td></tr>";

    try {
        const q = query(collection(db, "metas"), where("usuario", "==", usuarioActual));
        const snapshot = await getDocs(q);
        memoriaSubmissions = [];

        snapshot.forEach((doc) => {
            memoriaSubmissions.push(doc.data());
        });

        renderizarTabla(memoriaSubmissions);

    } catch (error) {
        console.error("Error al recuperar los datos:", error);
        tabla.innerHTML = "<tr><td colspan='15'>❌ Error al cargar los datos.</td></tr>";
    }
}

window.renderizarTabla = renderizarTabla 
function renderizarTabla(datos) {
    // Convertir timestamp a un formato ordenable
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

    // Encabezados correctos
    const headers = [
        { key: "usuario", label: "Usuario" },
        { key: "timestamp", label: "timestamp" },
        { key: "actividad", label: "Actividad POA" },
        { key: "metaNueva", label: "Meta nueva" },
        { key: "nombreMeta", label: "Título de la meta" },
        { key: "estadoMeta", label: "Estado de la meta" },
        { key: "detalleMeta", label: "Detalle de la meta" },
        { key: "entidad", label: "Entidad" },
        { key: "fechaInicio", label: "Fecha inicio" },
        { key: "fechaFin", label: "Fecha fin" },
        { key: "variosConsultores", label: "Intervino más de un consultor" },
        { key: "participantes", label: "Número de participantes" },
        { key: "hombres", label: "Hombres" },
        { key: "mujeres", label: "Mujeres" },
        { key: "autoridades", label: "Autoridades presentes" }
    ];

    // Identificar columnas no vacías
    const columnasLlenas = headers.filter(({ key }) => 
        datos.some(row => row[key] !== "" && row[key] !== null)
    );

    // Construir la tabla dinámicamente
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
