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
    const contentContainer = document.getElementById("content-container");
    const toggleButton = document.getElementById("sidebar-toggle");

    toggleButton.addEventListener("click", function() {
        sidebar.classList.toggle("hidden");
        contentContainer.classList.toggle("expanded");
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


function login() {
    usuarioActual = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    fetch('POA 2025_bd.xlsx')
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const workbook = XLSX.read(buffer, { type: 'array' });
            datosConsultores = XLSX.utils.sheet_to_json(workbook.Sheets['Consultores']); // Guardamos los datos globalmente

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
            console.log("Datos de consultor en LS:", JSON.parse(localStorage.getItem("usuarioDatos")));

            datosPOA  = XLSX.utils.sheet_to_json(workbook.Sheets['POA2025_ej']); // Guardamos los datos globalmente
            localStorage.setItem("POADatos", JSON.stringify(datosPOA));
            console.log("Datos POA en LS:", JSON.parse(localStorage.getItem("POADatos")));

            varios  = XLSX.utils.sheet_to_json(workbook.Sheets['varios']); // Guardamos los datos globalmente
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


//////// Cargar envios anteriores a LS en multiples casos
let enProceso = false; // Para evitar consultas duplicadas

async function ejecutarConsulta() {
    if (localStorage.getItem("memoriaSubmissions") || enProceso) {
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
        let memoriaSubmissions = [];

        snapshot.forEach(doc => {
            memoriaSubmissions.push(doc.data());
        });

        localStorage.setItem("memoriaSubmissions", JSON.stringify(memoriaSubmissions));
        console.log("Consultado Mis envíos en LS:", memoriaSubmissions);

        // Obtener memoriaSubmissions del localStorage
        memoriaSubmissions = JSON.parse(localStorage.getItem("memoriaSubmissions")) || [];

        // Crear un conjunto de nombres de metas concluidas y metas abiertas (sin duplicados)
        let metasConcluidasSet = new Set(
            memoriaSubmissions
                .filter(item => item.estadoMeta === "Concluída")
                .map(item => item.nombreMeta)
        );
        let metasAbiertasSet = new Set(
            memoriaSubmissions
                .filter(item => !metasConcluidasSet.has(item.nombreMeta))
                .map(item => item.nombreMeta)
        );

        // Convertir los Sets a arrays para almacenarlos en localStorage
        let metasConcluidas = [...metasConcluidasSet];
        let metasAbiertas = [...metasAbiertasSet];

        // Filtrar memoriaSubmissions para separar en abiertas y concluidas
        let memoriaSubmissionsAbiertas = memoriaSubmissions.filter(item => metasAbiertasSet.has(item.nombreMeta));
        let memoriaSubmissionsConcluidas = memoriaSubmissions.filter(item => metasConcluidasSet.has(item.nombreMeta));

        // Guardar en localStorage
        localStorage.setItem("metasAbiertas", JSON.stringify(metasAbiertas));
        localStorage.setItem("metasConcluidas", JSON.stringify(metasConcluidas));
        localStorage.setItem("memoriaSubmissionsAbiertas", JSON.stringify(memoriaSubmissionsAbiertas));
        localStorage.setItem("memoriaSubmissionsConcluidas", JSON.stringify(memoriaSubmissionsConcluidas));

        // Mostrar resultados en consola
        console.log("Metas Abiertas (sin duplicados y sin Concluídas):", metasAbiertas);
        console.log("Metas Concluidas (sin duplicados):", metasConcluidas);
        console.log("Memoria Submissions Abiertas:", memoriaSubmissionsAbiertas);
        console.log("Memoria Submissions Concluidas:", memoriaSubmissionsConcluidas);

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
function observarSelects() {
    document.querySelectorAll("select[id^='metaNueva-']").forEach(select => {
        if (!select.dataset.listener) { // Evita agregar el listener varias veces
            select.dataset.listener = "true";
            select.addEventListener("change", () => {
                // console.log(`Cambio detectado en select ${select.id}: ${select.value}`);
                if (select.value === "No" || select.value === "Sí") {
                    ejecutarConsulta();
                }
            });
            // console.log(`Evento agregado a select ${select.id}`);
        }
    });
}

// 🔹 Función para observar botones (solo una vez)
function observarBotones() {
    ["boton3", "boton4", "boton5"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && !btn.dataset.listener) {
            btn.dataset.listener = "true";
            btn.addEventListener("click", ejecutarConsulta, { once: true });
            // console.log(`Evento agregado a ${id}`);
        }
    });
}

// 🔹 Configurar el MutationObserver para detectar cambios en el DOM
function iniciarObserver() {
    if (localStorage.getItem("memoriaSubmissions")) {
        // console.log("Se omite observer porque ya hay datos en LS.");
        return;
    }

    // console.log("Iniciando MutationObserver...");

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Solo nodos tipo elemento
                    // Si se añade un select dinámico, observarlo
                    if (node.matches("select[id^='metaNueva-']") || node.querySelector("select[id^='metaNueva-']")) {
                        // console.log("Nuevo select detectado, agregando evento...");
                        observarSelects();
                    }

                    // Si se añade un botón dinámico, observarlo
                    if (["boton3", "boton4", "boton5"].includes(node.id) || node.querySelector("#boton3, #boton4, #boton5")) {
                        // console.log("Nuevo botón detectado, agregando evento...");
                        observarBotones();
                    }
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Observar los elementos iniciales en la página
    observarSelects();
    observarBotones();
}

iniciarObserver();

///////////////// CONTENIDO1 ////////////////////

// 2.1. USER. FORMULARIO.

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

        const actividadesFiltradas = POADatos.filter(item => item.Resultado_cod.startsWith(usuarioDatos.Resultado));

        actividadesFiltradas.forEach(actividad => {
            const option = document.createElement("option");
            option.value = actividad.Actividad_cod;
            option.textContent = actividad.Actividad;
            actividadesDropdown.appendChild(option);
        });
    }

    function agregarOpcionesEntidad1() {
        const entidad = document.getElementById("entidad-1-opciones");
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

    let totalCargas = 4;
    let cargasCompletadas = 0;

    function verificarCargaCompleta() {
        cargasCompletadas++;
        if (cargasCompletadas === totalCargas) {
            inicializarEventosMetas(); // Se inicializa después de cargar los selects
        }
    }

    esperarElementoYAplicar("estadoMeta-1", select => cargarOpciones(select, "estado"), verificarCargaCompleta);
    esperarElementoYAplicar("entidad-1-opciones", agregarOpcionesEntidad1, verificarCargaCompleta);
    // esperarElementoYAplicar("variosConsultores-1", select => cargarOpciones(select, "masdeunconsultor"), verificarCargaCompleta);
    esperarElementoYAplicar("metaNueva-1", select => cargarOpciones(select, "sino"), verificarCargaCompleta);
    esperarElementoYAplicar("actividad-1", filtrarActividades, verificarCargaCompleta);

    function activarScriptFecha() {
        const fechaInicioInput = document.getElementById("fecha-inicio");
        const fechaFinInput = document.getElementById("fecha-fin");
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
                "ene", "feb", "mar", "abr", "may", "jun",
                "jul", "ago", "sep", "oct", "nov", "dic"
            ];
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


    function toggleRows(selectElement) {
        const metaContainer = selectElement.closest(".meta-container");
        if (!metaContainer) return;

        const filasExtras = metaContainer.querySelectorAll("table tr:nth-last-child(-n+4)");
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

    const metasContainer = document.getElementById("metas-container");
    const addMetaButton = document.querySelector(".add-meta");
    const submitButton = document.getElementById("submitButton");

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
            let formularioValido = true;
            let camposInvalidos = [];

            const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos")) || {};
            const user = usuarioDatos["Usuario"];
            const fechaHora = new Date().toLocaleDateString('es-PE') + " " + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
            const fechaInicioGlobal = getElementValue("fecha-inicio");
            const fechaFinGlobal = getElementValue("fecha-fin");
            const mesReporteGlobal = getElementValue("mes-reporte");
            const metas = document.querySelectorAll(".meta-container");

            // Restablecer los bordes de la segunda columna antes de validar
            document.querySelectorAll(".table-formulario td:nth-child(2)").forEach(td => {
                if (!td.querySelector("#mes-reporte")) {
                    td.style.border = "2px solid black";
                    td.style.borderRadius = "10px";
                }
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
                    valor = elemento.textContent.trim();
                } else {
                    valor = elemento.value.trim();
                }

                if (valor === "" || valor === "-- Seleccione --") {
                    tdPadre.style.border = "2px solid red";
                    camposInvalidos.push(tdPadre);
                    formularioValido = false;
                }
            }

            // Validar campos generales
            validarCampo("fecha-inicio");
            validarCampo("fecha-fin");

            // Validar cada meta visible
            for (const meta of metas) {
                const index = meta.dataset.index;

                // Validar solo si cada campo está visible
                validarCampo(`nombreMeta-${index}`, false, true);
                validarCampo(`actividad-${index}`, true);
                validarCampo(`metaNueva-${index}`, true);
                validarCampo(`estadoMeta-${index}`, true);
                validarCampo(`detalleMeta-${index}`, false, true);
                validarCampo(`fechaInicio-${index}`);
                validarCampo(`fechaFin-${index}`);
                validarCampo(`entidad-${index}`, false, true);
                // validarCampo(`variosConsultores-${index}`, true);
                validarCampo(`participantes-${index}`);
                validarCampo(`hombres-${index}`);
                validarCampo(`mujeres-${index}`);
                validarCampo(`autoridades-${index}`, false, true);
            }

            // Si hay errores, marcar en rojo y mostrar mensaje emergente
            if (!formularioValido) {
                console.log("Campos obligatorios no llenados:", camposInvalidos.map(td => td.querySelector("input, select, div")?.id).filter(id => id));
                setTimeout(() => {
                    alert("⚠️ Complete los campos obligatorios marcados en rojo.");
                }, 100);
                return;
            }

            // Envío de datos si la validación pasa
            for (const meta of metas) {
                if (window.getComputedStyle(meta).display !== "none") { // Solo enviar si está visible
                    const index = meta.dataset.index;
                    const metaData = {
                        usuario: user,
                        timestamp: fechaHora,
                        fechaInicio: fechaInicioGlobal,
                        fechaFin: fechaFinGlobal,
                        mesReporte: mesReporteGlobal,
                        actividad: getSelectText(`actividad-${index}`),
                        metaNueva: getSelectText(`metaNueva-${index}`),
                        nombreMeta: getElementText(`nombreMeta-${index}`),
                        estadoMeta: getSelectText(`estadoMeta-${index}`),
                        detalleMeta: getElementText(`detalleMeta-${index}`),
                        fechaInicio: getElementValue(`fechaInicio-${index}`),
                        fechaFin: getElementValue(`fechaFin-${index}`),
                        entidad: getElementText(`entidad-${index}`),
                        // variosConsultores: getSelectText(`variosConsultores-${index}`),
                        participantes: getElementValue(`participantes-${index}`),
                        hombres: getElementValue(`hombres-${index}`),
                        mujeres: getElementValue(`mujeres-${index}`),
                        autoridades: getElementText(`autoridades-${index}`)
                    };
                    await addDoc(collection(db, "metas"), metaData);
                }
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

        function updateMultipleSelect() {
            const multipleSelectCheckboxes = multipleSelectLista.querySelectorAll("input[type=checkbox]");
            let seleccionados = Array.from(multipleSelectCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value)
                .join(", ");
            multipleSelectSeleccionadas.innerText = seleccionados || "-- Seleccione --";
        }

        multipleSelectLista.addEventListener("change", (event) => {
            if (event.target.matches("input[type=checkbox]")) {
                updateMultipleSelect();
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
            const multipleSelectSeleccionadas = container.querySelector("#entidad-1");

            if (!container.dataset.initialized) {
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
                    const POAdatos = XLSX.utils.sheet_to_json(hoja);
                    window.tablaPOA_crearEncabezado();
                    window.tablaPOA_crearTabla(POAdatos);
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

        window.tablaPOA_crearTabla = function (POAdatos) {
            const tabla = document.getElementById("tablaPOA")?.getElementsByTagName('tbody')[0];
            if (!tabla) return;

            let ultimosSubtitulos = {};
            POAdatos.forEach(fila => {
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

        window.tablaPOA_agregarFila = function (tabla, fila, clasesSubtitulos) {
            const nuevaFila = tabla.insertRow();
            nuevaFila.classList.add("tablaPOA-normal");
            nuevaFila.setAttribute("data-tipo", "dato");
            nuevaFila.setAttribute("subtitulos-superiores", JSON.stringify(clasesSubtitulos.map(window.tablaPOA_escapeClassName)));

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


        window.tablaPOA_agregarSubtitulo = function (tabla, subtitulo, claseSub, nivel, clasesSuperiores) {
            if (!subtitulo) return;
            const fila = tabla.insertRow();
            fila.classList.add("tablaPOA-subtitulo", `tablaPOA-${claseSub}`);
            fila.setAttribute("data-tipo", "subtitulo");
            fila.setAttribute("subtitulo-nivel", nivel);
            fila.setAttribute("subtitulo-nombre", window.tablaPOA_escapeClassName(subtitulo));
            fila.setAttribute("subtitulos-superiores", JSON.stringify(clasesSuperiores.map(window.tablaPOA_escapeClassName)));
            // Crear el nuevo atributo subtitulo-superiores-nombre
            const subtituloNombreEscaped = window.tablaPOA_escapeClassName(subtitulo);
            const subtitulosSuperioresNombres = clasesSuperiores.map(window.tablaPOA_escapeClassName);
            const subtitulosSuperioresNombresConActual = [...subtitulosSuperioresNombres, subtituloNombreEscaped];
            fila.setAttribute("filas-inferiores-subsup", JSON.stringify(subtitulosSuperioresNombresConActual));

            let celda = fila.insertCell();
            celda.textContent = subtitulo;
            celda.colSpan = window.tablaPOA_datos.length;

            let icono = document.createElement("span");
            icono.classList.add("tablaPOA-triangulo");
            icono.textContent = "▼";
            celda.appendChild(icono);

            fila.addEventListener("click", function () {
                window.tablaPOA_alternarVisibilidad(fila.getAttribute("filas-inferiores-subsup"), icono);
            });
        };

        window.tablaPOA_alternarVisibilidad = function (subsup, icono) {
            subsup = JSON.parse(subsup);
            let filas = document.querySelectorAll("[subtitulos-superiores]"); // Get all elements with the attribute
            let matchingRows = [];

            filas.forEach(fila => {
                let attrValue = fila.getAttribute("subtitulos-superiores");
                let cleanValue = attrValue.replace(/&quot;/g, '"').trim(); // Convert HTML entities to quotes
                let parsedValue = JSON.parse(cleanValue); // Convert to an array
                // Check if ALL elements in `subsup` exist in `parsedValue` (atribute)
                if (Array.isArray(parsedValue) && subsup.every(value => parsedValue.includes(value))) {
                    matchingRows.push(fila); // Add matching row to array
                }
            });

            let shouldHide = icono.textContent === "▼"; // If currently visible (▼), we will hide all
            matchingRows.forEach(fila => fila.classList.toggle("tablaPOA-oculto", shouldHide));
            icono.textContent = shouldHide ? "▶" : "▼";
        };

        window.tablaPOA_leerExcel("POA 2025_bd.xlsx");
        return true;
    }

    // Crear un observador para esperar a que #tablaPOA aparezca en el DOM
    const observer2 = new MutationObserver(() => {
        if (inicializarTablaPOA()) {
            observer2.disconnect(); // Detener el observador una vez que la tabla esté lista
        }
    });

    observer2.observe(document.body, { childList: true, subtree: true });

    // Intentar ejecutar directamente si la tabla ya existe
    inicializarTablaPOA();
});


//////////////////////////// CONTENIDO3 //////////////////////////////
window.actualizarTabla = actualizarTabla;

function esperarMemoriaSubmissions() {
    const limiteTiempo = 60000; // 60 segundos
    let intervalo;

    // Temporizador para mostrar error solo después de 60 segundos
    const timeout = setTimeout(() => {
        clearInterval(intervalo);
        mostrarErrorCarga();
    }, limiteTiempo);

    // Intervalo para verificar cada 500ms si ya existe memoriaSubmissions
    intervalo = setInterval(() => {
        if (localStorage.getItem("memoriaSubmissions")) {
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
                esperarMemoriaSubmissions(); // Esperar hasta que haya datos en localStorage
                break;
            }
        }
    }
});
observer3.observe(document.body, { childList: true, subtree: true });

async function actualizarTabla() {
    try {
        let memoriaSubmissions = JSON.parse(localStorage.getItem("memoriaSubmissions"));
        if (memoriaSubmissions) {
            renderizarTabla(memoriaSubmissions);
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
        { key: "timestamp", label: "R-timestamp" },
        { key: "fechaInicio", label: "R-inicio" },
        { key: "fechaFin", label: "R-fin" },
        { key: "mesReporte", label: "R-mes" },
        { key: "actividad", label: "Actividad POA" },
        { key: "metaNueva", label: "Meta nueva" },
        { key: "nombreMeta", label: "Título de la meta" },
        { key: "estadoMeta", label: "Estado de la meta" },
        { key: "detalleMeta", label: "Detalle de la meta" },
        { key: "entidad", label: "Entidad" },
        { key: "fechaInicio", label: "Fecha inicio" },
        { key: "fechaFin", label: "Fecha fin" },
        // { key: "variosConsultores", label: "Intervino más de un consultor" },
        { key: "participantes", label: "Número de participantes" },
        { key: "hombres", label: "Hombres" },
        { key: "mujeres", label: "Mujeres" },
        { key: "autoridades", label: "Autoridades presentes" }
    ];

    const columnasLlenas = headers.filter(({ key }) =>
        datos.some(row => row[key] !== "" && row[key] !== null)
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
document.addEventListener("DOMContentLoaded", function () {
    let currentFilterMenu = null;

    function waitForTable() {
        const table = document.querySelector("#submissions-table");
        if (!table) {
            setTimeout(waitForTable, 500);
        } else {
            restructureTableHeaders(table);
            addFilterButtons(table);
            observeTableChanges(table);
        }
    }

    function restructureTableHeaders(table) {
        const thead = table.querySelector("thead");
        if (!thead) return

        thead.querySelectorAll("tr").forEach(row => {
            row.querySelectorAll("th").forEach(th => {
                if (!th.classList.contains("has-filter-btn")) {
                    th.classList.add("has-filter-btn");

                    const wrapper = document.createElement("div");
                    wrapper.style.display = "flex";
                    wrapper.style.justifyContent = "space-between";
                    wrapper.style.alignItems = "center";

                    const textSpan = document.createElement("span");
                    textSpan.innerHTML = th.innerHTML;

                    const buttonWrapper = document.createElement("div");
                    buttonWrapper.style.flexShrink = "0";

                    th.innerHTML = "";
                    wrapper.appendChild(textSpan);
                    wrapper.appendChild(buttonWrapper);
                    th.appendChild(wrapper);
                }
            });
        });
    }

    function addFilterButtons(table) {
        const thead = table.querySelector("thead");
        if (!thead) return;

        thead.querySelectorAll("th").forEach((th, colIndex) => {
            const buttonWrapper = th.querySelector("div:last-child");
            if (!buttonWrapper.querySelector(".filter-btn")) {
                const btn = document.createElement("button");
                btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18l-7 10v4l-4 2v-6z"/></svg>`;
                btn.classList.add("filter-btn");
                Object.assign(btn.style, {
                    marginLeft: "5px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "5px",
                    borderRadius: "3px",
                });

                btn.onclick = (event) => {
                    event.stopPropagation();

                    if (currentFilterMenu) {
                        currentFilterMenu.remove();
                        currentFilterMenu = null;
                    } else {
                        showFilterMenu(colIndex, table, btn);
                    }
                };
                buttonWrapper.appendChild(btn);
            }
        });
    }

    function showFilterMenu(colIndex, table, button) {
        if (currentFilterMenu) currentFilterMenu.remove();


        const filterMenu = document.createElement("div");
        filterMenu.classList.add("filter-menu");
        filterMenu.dataset.colIndex = colIndex; // Guardamos el índice de la columna

        Object.assign(filterMenu.style, {
            position: "absolute",
            background: "white",
            border: "none",
            padding: "10px",
            zIndex: "1000",
            top: `${button.getBoundingClientRect().bottom + window.scrollY}px`,
            left: `${button.getBoundingClientRect().left}px`,
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            borderRadius: "5px"
        });

        const uniqueValues = new Set();
        table.querySelectorAll("tbody tr").forEach(row => {
            const cell = row.cells[colIndex];
            if (cell) uniqueValues.add(cell.textContent.trim());
        });


        const allCheckbox = document.createElement("input");
        allCheckbox.type = "checkbox";
        allCheckbox.checked = true;
        allCheckbox.id = `select-all-${colIndex}`; // Aseguramos un ID único

        allCheckbox.onchange = () => {
            const checkboxes = filterMenu.querySelectorAll(`input[type='checkbox']:not(#select-all-${colIndex})`);
            checkboxes.forEach(cb => cb.checked = allCheckbox.checked);
            applyFilters(table);
            updateFilterButtonState(button, checkboxes);
        };

        const allLabel = document.createElement("label");
        allLabel.appendChild(allCheckbox);
        allLabel.appendChild(document.createTextNode("Todos"));
        filterMenu.appendChild(allLabel);
        filterMenu.appendChild(document.createElement("br"));

        uniqueValues.forEach(value => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = value;
            checkbox.checked = true;

            checkbox.onchange = () => {
                applyFilters(table);
                updateFilterButtonState(button, filterMenu.querySelectorAll(`input[type='checkbox']:not(#select-all-${colIndex})`));
                allCheckbox.checked = [...filterMenu.querySelectorAll(`input[type='checkbox']:not(#select-all-${colIndex})`)].every(cb => cb.checked);
            };

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(value));
            filterMenu.appendChild(label);
            filterMenu.appendChild(document.createElement("br"));
        });

        document.body.appendChild(filterMenu);
        currentFilterMenu = filterMenu;

        filterMenu.addEventListener("click", (e) => e.stopPropagation());

        setTimeout(() => {
            document.addEventListener("click", function hideMenu(e) {
                if (currentFilterMenu && !currentFilterMenu.contains(e.target)) {
                    currentFilterMenu.remove();
                    currentFilterMenu = null;
                }
            }, { once: true });
        }, 0);
    }

    function applyFilters(table) {

        const activeFilters = {};
        document.querySelectorAll(".filter-menu").forEach(menu => {
            const colIndex = menu.dataset.colIndex;
            const checkedValues = Array.from(menu.querySelectorAll("input[type='checkbox']:checked:not(#select-all)"))
                .map(cb => cb.value);

            // Solo guardamos filtros activos
            if (checkedValues.length > 0) {
                activeFilters[colIndex] = new Set(checkedValues);
            }
        });

        table.querySelectorAll("tbody tr").forEach(row => {
            let show = true;

            // Aplicar filtro por cada columna con filtros activos
            Object.keys(activeFilters).forEach(colIndex => {
                const cell = row.cells[colIndex];
                if (cell) {
                    const value = cell.textContent.trim();
                    if (!activeFilters[colIndex].has(value)) {
                        show = false;
                    }
                }
            });

            row.style.display = show ? "" : "none";
        });
    }

    function updateFilterButtonState(button, checkboxes) {
        const allChecked = [...checkboxes].every(cb => cb.checked);
        button.style.backgroundColor = allChecked ? "transparent" : "#ddd"; // Gris si hay filtros activos
    }

    function observeTableChanges(table) {
        const observer = new MutationObserver(() => {
            restructureTableHeaders(table);
            addFilterButtons(table);
        });
        observer.observe(table, { childList: true, subtree: true });
    }

    waitForTable();
});
