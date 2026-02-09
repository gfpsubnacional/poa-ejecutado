// INICIALIZAR
window.myGlobalVar = null;  // Reinicia cualquier variable global personalizada
localStorage.clear(); // Borra todos los datos del localStorage
sessionStorage.clear(); // Borra todos los datos del sessionStorage

// IMPORTAR BASES DE DATOS

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection, addDoc, getDocs, query, where,
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
    { key: "numerometas", label: "N° metas" },
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
    { key: "participantes", label: "N° participantes" },
    { key: "hombres", label: "Hombres" },
    { key: "mujeres", label: "Mujeres" },
    { key: "autoridades", label: "Autoridades" },
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
        const response = await fetch('POA 2026_bd.xlsx');
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

        await cargarMesCorteDesdeFirestore();

        datosPOA = XLSX.utils.sheet_to_json(workbook.Sheets['POA2026_ej']);
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
    admin: (() => {
        const ops = [];

        ops.push({ texto: "Registro POA", archivo: "contenido1.html" });
        ops.push({ texto: "Envíos", archivo: "contenido2.html" });
        ops.push({ texto: "POA 2026", archivo: "contenido4.html" });

        // Reportes (según config)
        if (POA_REPORTES_CONFIG?.semestral) {
        ops.push({ texto: "Informe semestral", archivo: "contenido6.html" });
        }
        if (POA_REPORTES_CONFIG?.anual) {
        ops.push({ texto: "Informe anual", archivo: "contenido7.html" });
        }

        ops.push({ texto: "Manual de uso", archivo: "contenido5.html" });
        ops.push({ texto: "Configurar página", archivo: "contenido8.html" }); 

        // asignar ids correlativos sin huecos
        return ops.map((o, i) => ({ id: `boton${i + 1}`, ...o }));
    })(),

    usuario: (() => {
        const ops = [];

        ops.push({ texto: "Registro POA", archivo: "contenido1.html" });
        ops.push({ texto: "Mis envíos", archivo: "contenido2.html" });
        ops.push({ texto: "Mi POA 2026", archivo: "contenido3.html" });
        ops.push({ texto: "POA 2026", archivo: "contenido4.html" });

        // Reportes (según config)
        if (POA_REPORTES_CONFIG?.semestral) {
        ops.push({ texto: "Informe semestral", archivo: "contenido6.html" });
        }
        if (POA_REPORTES_CONFIG?.anual) {
        ops.push({ texto: "Informe anual", archivo: "contenido7.html" });
        }

        ops.push({ texto: "Manual de uso", archivo: "contenido5.html" });

        // ids correlativos sin huecos
        return ops.map((o, i) => ({ id: `boton${i + 1}`, ...o }));
    })()
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
                div.dataset.archivo = op.archivo; // ✅ importante
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

    const shown = storedContents[fileName];
    if (shown?.dataset?.archivo === "contenido8.html") {
    initContenido8MesCorte();
    }


    // Actualiza botón activo
    document.querySelectorAll(".sidebar button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
}



///// Logica de actualizar mes de corte 

function initContenido8MesCorte() {
  const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos") || "{}");
  if (usuarioDatos.Tipo !== "admin") return;

  const container = document.getElementById("poaMesCorteAdmin");
  if (!container) return;

  const checks = container.querySelector("#poaMesCorteChecks");
  const estado = container.querySelector("#poaMesCorteEstado");
  const cbSem = container.querySelector("#poaCfgSemestral");
  const cbAnu = container.querySelector("#poaCfgAnual");
  const btnGuardar = container.querySelector("#poaMesCorteGuardar");

  if (!checks || !estado || !cbSem || !cbAnu || !btnGuardar) return;

  // Si te llaman varias veces, evita duplicar listeners.
  if (container.dataset.poaMesCorteBound === "1") {
    // igual re-hidrata estado visual por si cambió config global
  } else {
    container.dataset.poaMesCorteBound = "1";
  }

  const mesesBonitos = {
    ene: "Enero", feb: "Febrero", mar: "Marzo", abr: "Abril", may: "Mayo", jun: "Junio",
    jul: "Julio", ago: "Agosto", set: "Setiembre", oct: "Octubre", nov: "Noviembre", dic: "Diciembre",
  };

  // ====== 1) Hidratar UI desde estado actual ======
  const ultimoActual = TABLA_POA_MESES_CORTE[TABLA_POA_MESES_CORTE.length - 1] || "ene";
  const idxActual = TABLA_POA_MESES.indexOf(ultimoActual);
  const safeIdx = idxActual >= 0 ? idxActual : 0;
  let _poaIdxCorteActual = safeIdx;


  // toggles
  cbSem.checked = !!(POA_REPORTES_CONFIG?.semestral);
  cbAnu.checked = !!(POA_REPORTES_CONFIG?.anual);

  // render de checks (acá sí se crea DOM, pero no con template/innerHTML)
    checks.replaceChildren();
    TABLA_POA_MESES.forEach((m, i) => {
    const label = document.createElement("label");
    label.className = "poa-mes-pill";
    label.dataset.idx = String(i);
    label.style.position = "relative";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.mes = m;
    input.checked = i <= safeIdx;

    const check = document.createElement("span");
    check.className = "poa-check";
    check.textContent = "✓";

    const name = document.createElement("span");
    name.className = "poa-mes-name";
    name.textContent = mesesBonitos[m] || m;

    label.appendChild(input);
    label.appendChild(check);
    label.appendChild(name);

    checks.appendChild(label);
    });

    function aplicarCorteDesdeIndice(idx) {
    _poaIdxCorteActual = idx;

    checks.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        const mes = cb.dataset.mes;
        const i = TABLA_POA_MESES.indexOf(mes);
        cb.checked = i <= idx;
    });

    _pintarRango(idx);
    }

  function _pintarRango(ultimoIdx) {
    const pills = checks.querySelectorAll(".poa-mes-pill");
    pills.forEach((pill) => {
        const i = Number(pill.dataset.idx || "0");
        pill.classList.toggle("is-in-range", i <= ultimoIdx);
        pill.classList.toggle("is-cutoff", i === ultimoIdx);
    });
  }

    function _pintarPreview(previewIdx) {
    const pills = checks.querySelectorAll(".poa-mes-pill");
    pills.forEach((pill) => {
        const i = Number(pill.dataset.idx || "0");
        pill.classList.toggle("is-preview", previewIdx >= 0 && i <= previewIdx);
    });
    }

    _pintarRango(safeIdx);


    if (checks.dataset.boundHover !== "1") {
    checks.dataset.boundHover = "1";

    checks.addEventListener("pointerover", (e) => {
        const pill = e.target?.closest?.(".poa-mes-pill");
        if (!pill) return;
        const idx = Number(pill.dataset.idx || "0");
        checks.classList.add("is-previewing");
        _pintarPreview(idx);
    });

    checks.addEventListener("pointerleave", () => {
        checks.classList.remove("is-previewing");
        _pintarPreview(-1);
    });

    // Click en el pill: equivale a “set corte en ese mes”
    checks.addEventListener("click", (e) => {
        const pill = e.target?.closest?.(".poa-mes-pill");
        if (!pill) return;

        const idx = Number(pill.dataset.idx || "0");
        aplicarCorteDesdeIndice(Math.max(0, idx));
    });
    }


  // ====== 3) Guardar en Firestore ======
  if (btnGuardar.dataset.boundClick !== "1") {
    btnGuardar.dataset.boundClick = "1";
    btnGuardar.addEventListener("click", async () => {
      try {
        estado.textContent = "Guardando...";

        const ultimoMes = TABLA_POA_MESES[Math.max(0, _poaIdxCorteActual)] || "ene";
        const meses = _poaMesesHasta(ultimoMes);

        const semestral = !!cbSem.checked;
        const anual = !!cbAnu.checked;

        const ref = doc(db, "config2026", "tablasPOA");
        await setDoc(
          ref,
          {
            ultimoMes,
            mesesCorte: meses,
            reportes: { semestral, anual },
            updatedAt: serverTimestamp(),
            updatedBy: usuarioActual || "",
          },
          { merge: true }
        );

        estado.textContent = "Guardado. Se aplicará en el siguiente login (de cualquier usuario). Por favor, actualice la página.";
      } catch (err) {
        console.error(err);
        estado.textContent = "Error al guardar. Revisa consola / permisos.";
        alert("No se pudo guardar la configuración en Firestore.");
      }
    });
  }
}


//// Consultar Envios y MisEnvios

async function cargarEnviosYMisEnvios() {
    if (localStorage.getItem("Envios") && localStorage.getItem("misEnvios")) {
        console.log("Los datos ya están en localStorage.");
        return;
    }

    try {
        const q = query(collection(db, "metas2026"));
        const snapshot = await getDocs(q);
        const todosLosEnvios = [];
        const misEnvios = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            todosLosEnvios.push(data);

            const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos") || "{}");

            if (usuarioDatos.Tipo === "admin" || data.usuario === usuarioActual) {
                  misEnvios.push({
                        ...data,
                        __docId: doc.id   // 👈 guardamos el id real
                    });
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



// PDF 


function waitForElementsAndInit(callback) {
    const checkInterval = 100;
    const intervalId = setInterval(() => {
        const table = document.getElementById('submissions-table');
        if (table && table.rows.length > 0) {
            clearInterval(intervalId);
            callback(table);
        }
    }, checkInterval);
}


function setupDownloadPDF(jsPDFClass, tableElement) {
    // 1. Obtener el botón directamente por su ID
    const button = document.getElementById('guardarPdfEnvios');

    // 2. Verificar si el botón existe antes de intentar añadir un listener
    if (button) {
        // No necesitamos un MutationObserver ni el atributo data-listener-attached
        // porque estamos apuntando a un elemento específico y se asume que
        // esta función se llamará una vez para configurarlo.

        button.addEventListener('click', () => {
            const doc = new jsPDFClass({ orientation: "landscape", unit: "pt", format: "a4" });

            if (typeof doc.autoTable !== "function") {
                console.error("❌ autoTable no está disponible.");
                return;
            }

            const thead = tableElement.querySelector('thead');
            const head = [
                [...thead.querySelectorAll('th')].map(th =>
                    (th.querySelector('span') || th).textContent
                )
            ];

            const tbody = tableElement.querySelector('tbody');
            const visibleRows = [...tbody.querySelectorAll('tr')].filter(
                tr => window.getComputedStyle(tr).display !== 'none'
            );

            const body = visibleRows.map(tr =>
                [...tr.querySelectorAll('td')].map(td => td.textContent)
            );

            // Asegúrate de que generateRandomCode() esté definida en tu ámbito.
            // Por ejemplo:
            // function generateRandomCode() {
            //     return Math.random().toString(36).substring(2, 8).toUpperCase();
            // }

            const usuario = JSON.parse(localStorage.getItem("usuarioDatos"));
            const usuarioNombre = usuario?.Usuario || "Usuario desconocido";
            const codigo = typeof generateRandomCode === 'function' ? generateRandomCode() : 'N/A'; // Manejo si generateRandomCode no existe
            const now = new Date();
            const fecha = now.toLocaleDateString();
            const hora = now.toLocaleTimeString();

            doc.setFontSize(10);
            doc.setTextColor(80);
            doc.text(
                `Descargado desde la plataforma (${codigo}) el ${fecha} a las ${hora}. Usuario: ${usuarioNombre}`,
                doc.internal.pageSize.getWidth() / 2,
                30,
                { align: 'center' }
            );

            doc.setFontSize(14);
            doc.setTextColor('#1C4574');
            doc.setFont(undefined, 'bold');
            doc.text("Envíos", 40, 50);

            doc.autoTable({
                head,
                body,
                startY: 65,
                showHead: 'everyPage',
                theme: 'grid',
                useCss: true,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    textColor: 0,
                    lineColor: 0,
                    lineWidth: 0.3,
                    overflow: 'linebreak',
                    valign: 'middle'
                },
                headStyles: {
                    fillColor: [28, 69, 116],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle'
                },
                didDrawPage: function () {
                    const str = `Página ${doc.internal.getNumberOfPages()}`;
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    doc.text(
                        str,
                        doc.internal.pageSize.getWidth() / 2,
                        doc.internal.pageSize.getHeight() - 10,
                        { align: 'center' }
                    );
                }
            });

            doc.save("envios.pdf");
        });
    } else {
        console.warn("⚠️ Botón 'guardarPdfEnvios' no encontrado. No se pudo configurar la descarga del PDF.");
    }
    // El observer.observe() ya no es necesario aquí.
}

document.addEventListener("DOMContentLoaded", () => {
    waitForJsPDFandInit(jsPDF => {
        waitForElementsAndInit(table => {
            setupDownloadPDF(jsPDF, table);
        });
    });
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
                    await addDoc(collection(db, "metas2026"), metaData);
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
// Exportar Excel
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
          return span?.textContent || ""; // Solo toma el texto del primer span dentro del primer div
        });

        // Extraer solo las filas visibles del cuerpo
        const rows = Array.from(tabla.querySelectorAll("tbody tr"))
          .filter(tr => tr.offsetParent !== null) // Solo visibles
          .map(tr =>
            Array.from(tr.querySelectorAll("td")).map(td => td.textContent)
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



// LLENAR MIS ENVIOS 
window.actualizarTabla = actualizarTabla;

// Espera hasta 60s a que misEnvios esté disponible en localStorage y luego actualiza la tabla
function esperarMisEnvios() {
    const limiteTiempo = 60000; // 60 segundos
    let intervalo;

    // Muestra error si pasa el tiempo límite
    const timeout = setTimeout(() => {
        clearInterval(intervalo);
        mostrarErrorCarga();
    }, limiteTiempo);

    // Verifica cada 500ms si misEnvios ya está disponible
    intervalo = setInterval(() => {
        if (localStorage.getItem("misEnvios")) {
            clearTimeout(timeout);
            clearInterval(intervalo);
            actualizarTabla();
        }
    }, 500);
}

// Observa el DOM y espera a que aparezca la tabla para iniciar el flujo
const observer3 = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            const table = document.getElementById("submissions-table");
            if (table) {
                observer.disconnect();
                esperarMisEnvios();
                break;
            }
        }
    }
});
observer3.observe(document.body, { childList: true, subtree: true });

// Intenta obtener misEnvios del localStorage y renderizar la tabla
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

// Muestra mensaje de error si no hay datos disponibles
function mostrarErrorCarga() {
    const tabla = document.getElementById("submissions-table");
    tabla.innerHTML = "<tr><td colspan='15'>❌ Error: No se encontraron datos en 60 segundos.</td></tr>";
}

// Construye el HTML de la tabla con encabezados y filas
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
            const val = row[key] ?? "";

// 👇 si es la columna timestamp (R-timestamp)
if (key === "timestamp") {
  const codigo = row.__docId;
  const safeVal = String(val);

  html += `
    <td>
      <div class="tablasPOA-envios-scrollable enviosTimestampCell">
        <button
          type="button"
          class="enviosCodigoBtn"
          title="ver código"
          data-codigo="${codigo}">
          !
        </button>
        <span class="enviosTimestampText">${safeVal}</span>
      </div>
    </td>
  `;
} else {
  html += `<td><div class="tablasPOA-envios-scrollable">${val}</div></td>`;
}
            });
            html += "</tr>";
        });
    } else {
        html += `<tr><td colspan="${headers.length}">No hay registros disponibles.</td></tr>`;
    }
    html += "</tbody>";
    return html;
}



function abrirModalCodigoRegistro(codigo) {
  const wrap = document.createElement("div");

  const p1 = document.createElement("p");
  p1.style.margin = "0 0 8px 0";
  p1.textContent = "Este es el código único de registro que se debe reportar para solicitar a ";

  const mail = document.createElement("a");
  mail.href = "mailto:joaquin.rivadeneyra@gfpsubnacional.pe";
  mail.textContent = "Evaluación y Seguimiento";
  mail.style.fontWeight = "700";

  const p2 = document.createElement("p");
  p2.style.margin = "0 0 12px 0";
  p2.appendChild(document.createTextNode(" cualquier corrección o eliminación de este reporte de meta cumplida."));

  p1.appendChild(mail);
  p1.appendChild(p2);

    const codeWrap = document.createElement("div");
    codeWrap.className = "enviosCodigoWrap";

    const codeBox = document.createElement("div");
    codeBox.className = "enviosCodigoCode";
    codeBox.textContent = codigo;

    const btnCopy = document.createElement("button");
    btnCopy.className = "enviosCodigoCopyBtn";
    btnCopy.textContent = "Copiar";

    const aviso = document.createElement("span");
    aviso.className = "enviosCodigoAviso";
    aviso.textContent = "Código copiado";
    aviso.style.display = "none";

    btnCopy.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(codigo);
        aviso.style.display = "inline";
        setTimeout(() => aviso.style.display = "none", 1500);
    } catch (e) {
        console.error("No se pudo copiar el código", e);
    }
    });

    codeWrap.appendChild(codeBox);
    codeWrap.appendChild(btnCopy);
    codeWrap.appendChild(aviso);

    wrap.appendChild(p1);
    wrap.appendChild(codeWrap);

  // reutiliza tu modal existente :contentReference[oaicite:1]{index=1}
  mostrarModal("Código único de registro", wrap);
}

function initCodigoRegistroEnviosDelegation() {
  if (window.__enviosCodigoInit) return;
  window.__enviosCodigoInit = true;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".enviosCodigoBtn");
    if (!btn) return;

    const codigo = btn.getAttribute("data-codigo") || "N/A";
    abrirModalCodigoRegistro(codigo);
  });
}

// 🔥 llama una vez
initCodigoRegistroEnviosDelegation();


// Ordena los datos y renderiza la tabla con columnas no vacías
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

// Devuelve solo las columnas que tengan al menos un valor significativo
function filtrarColumnasLlenas(headers, datos) {
    return headers.filter(({ key }) =>
        datos.some(row => row[key] !== "" && row[key] !== null && row[key] !== "-" && row[key] !== undefined)
    );
}


////// FILTROS

function inicializarFiltrosYOrdenParaTablas(claseTabla) {
    const tablasProcesadas = new Set();
    const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];

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
                        function parseFechaHoraEuropea(str) {
                            const [fecha, hora] = str.split(" ");
                            const [d, m, a] = fecha.split("/");
                            return new Date(`${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hora || "00:00"}`);
                        }
                        valA = parseFechaHoraEuropea(valA);
                        valB = parseFechaHoraEuropea(valB);
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
        const formatoFechaValido = v => {
            if (!v) return false;
            const [fecha, hora] = v.split(" ");
            const partes = fecha?.split("/");
            if (partes?.length !== 3) return false;
            const [d, m, a] = partes;
            const iso = `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hora || "00:00"}`;
            return !isNaN(Date.parse(iso));
        };

        const todosFechas = valores.every(formatoFechaValido);
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

// ⚠️ ahora es dinámico (se carga en login desde Firestore)
let TABLA_POA_MESES_CORTE = ["ene"]; // fallback por si Firestore aún no tiene config

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


function _poaMesesHasta(ultimoMes) {
  const idx = TABLA_POA_MESES.indexOf((ultimoMes || "ene").toLowerCase().trim());
  const safeIdx = idx >= 0 ? idx : 0;
  return TABLA_POA_MESES.slice(0, safeIdx + 1);
}

// Flags globales (fallback por si Firestore no tiene nada aún)
let POA_REPORTES_CONFIG = { semestral: false, anual: true }; // cambia defaults si quieres

async function cargarMesCorteDesdeFirestore() {
  try {
    const ref = doc(db, "config2026", "tablasPOA");
    const snap = await getDoc(ref);

    // Defaults
    let ultimoMes = "ene";
    let meses = ["ene"];
    let semestral = POA_REPORTES_CONFIG.semestral;
    let anual = POA_REPORTES_CONFIG.anual;

    if (!snap.exists()) {
      // Si no existe, lo creamos con defaults
      meses = _poaMesesHasta(ultimoMes);

      await setDoc(ref, {
        ultimoMes,
        mesesCorte: meses,
        reportes: { semestral, anual },
        updatedAt: serverTimestamp(),
        updatedBy: usuarioActual || ""
      });

      TABLA_POA_MESES_CORTE = meses;
      POA_REPORTES_CONFIG = { semestral, anual };
      return;
    }

    const data = snap.data() || {};

    // ---- Mes de corte ----
    if (Array.isArray(data.mesesCorte) && data.mesesCorte.length) {
      const set = new Set(data.mesesCorte.map(m => String(m).toLowerCase().trim()));
      meses = TABLA_POA_MESES.filter(m => set.has(m));
    } else {
      ultimoMes = String(data.ultimoMes || "ene").toLowerCase().trim();
      meses = _poaMesesHasta(ultimoMes);
    }
    if (!meses.length) meses = ["ene"];
    TABLA_POA_MESES_CORTE = meses;

    // ---- Reportes semestral/anual ----
    const rep = data.reportes || {};
    semestral = !!rep.semestral;
    anual = !!rep.anual;

    POA_REPORTES_CONFIG = { semestral, anual };

  } catch (e) {
    console.warn("No se pudo cargar config desde Firestore. Se usan fallbacks:", e);

    TABLA_POA_MESES_CORTE = (TABLA_POA_MESES_CORTE?.length ? TABLA_POA_MESES_CORTE : ["ene"]);
    POA_REPORTES_CONFIG = (POA_REPORTES_CONFIG || { semestral: false, anual: true });
  }
}




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
        poaFixSubtitulosSticky();
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

    leerExcel("POA 2026_bd.xlsx");

    function poaFixSubtitulosSticky() {
    const tabla = document.getElementById("tablaPOA");
    if (!tabla) return;

    const tds = tabla.querySelectorAll("tr.tablaPOA-subtitulo > td");
    tds.forEach(td => {
        // evita doble wrap
        if (td.querySelector(":scope > .tablaPOA-subtituloWrap")) return;

        // 1) saca el triangulito si existe (ya lo agregas tú)
        const tri = td.querySelector(":scope > .tablaPOA-triangulo");

        // 2) obtén el texto “plano” del td (sin el tri)
        //    (si tienes nodos raros, esto igual funciona: reconstruimos)
        const texto = (td.childNodes[0]?.nodeType === Node.TEXT_NODE)
        ? td.childNodes[0].textContent
        : td.textContent;

        const textoLimpio = (tri ? texto.replace(tri.textContent, "") : texto).trim();

        // 3) limpia el td
        td.innerHTML = "";

        // 4) arma wrapper + sticky izquierdo (texto) + sticky derecho (tri)
        const wrap = document.createElement("div");
        wrap.className = "tablaPOA-subtituloWrap";

        const elTexto = document.createElement("span");
        elTexto.className = "tablaPOA-subtituloTexto";
        elTexto.textContent = textoLimpio;
        elTexto.style.display = "flex";
        elTexto.style.alignItems = "center";


        const elTri = document.createElement("span");
        elTri.className = "tablaPOA-subtituloTri tablaPOA-triangulo";
        elTri.textContent = tri ? tri.textContent : "▼";
        elTri.setAttribute("aria-hidden", "true");
        elTri.style.display = "flex";
        elTri.style.alignItems = "center";
        elTri.style.justifyContent = "center";
        elTri.style.lineHeight = "1";


        wrap.appendChild(elTexto);
        wrap.appendChild(elTri);
        td.appendChild(wrap);
    });
    }

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

            if (normalRows.length > 10 || ((tablaId === 'mitablaPOA') && normalRows.length > 0)) {
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
                    fillTableWithEnvios('mitablaPOA', 'Envios', () => {
                        tablasPOAApplyCellProperties('mitablaPOA', 'Envios');
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



// CONTENIDO5 MANUAL
document.addEventListener('DOMContentLoaded', function () {
    window.manualShowSection = function(id) {
        document.querySelectorAll('.manual-section').forEach(sec => sec.classList.remove('manual-active'));
        const target = document.getElementById(id);
        target.classList.add('manual-active');
        }
})



// CONTENIDO6 Y CONTENIDO7 (SEMESTRAL Y ANUAL)

function getConfigPOAPeriodo() {
    const periodo =
    (
        document.getElementById("tablasPOASemestral")?.getAttribute("data-poa-periodo") ||
        document.body?.getAttribute("data-poa-periodo") ||
        "semestral"
    )
    .trim()
    .toLowerCase();

    const meses = {
        semestral: {
            mesesPOA: ["ene_pl", "feb_pl", "mar_pl", "abr_pl", "may_pl", "jun_pl"],
            mesesBonitosPOA: {
                "ene_pl": "Enero", "feb_pl": "Febrero", "mar_pl": "Marzo",
                "abr_pl": "Abril", "may_pl": "Mayo", "jun_pl": "Junio"
            },
            ordenMesesEjecutado: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
            pdfTitulo: "Tablas para reporte semestral",
            pdfNombre: "POA_Semestral.pdf"
        },
        anual: {
            mesesPOA: ["ene_pl","feb_pl","mar_pl","abr_pl","may_pl","jun_pl","jul_pl","ago_pl","set_pl","oct_pl","nov_pl","dic_pl"],
            mesesBonitosPOA: {
                "ene_pl": "Enero","feb_pl": "Febrero","mar_pl": "Marzo","abr_pl": "Abril","may_pl": "Mayo","jun_pl": "Junio",
                "jul_pl": "Julio","ago_pl": "Agosto","set_pl": "Setiembre","oct_pl": "Octubre","nov_pl": "Noviembre","dic_pl": "Diciembre"
            },
            ordenMesesEjecutado: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],
            pdfTitulo: "Tablas para reporte anual",
            pdfNombre: "POA_Anual.pdf"
        }
    };

    return meses[periodo] || meses.semestral;
}


document.addEventListener("DOMContentLoaded", () => {
    const esperarDatos = () => {
        const contenedor = document.getElementById("tablasPOASemestral");
        const POADatos = JSON.parse(localStorage.getItem("POADatos") || "null");
        const Envios = JSON.parse(localStorage.getItem("Envios") || "null");

        if (!contenedor || !POADatos || !Envios) {
            setTimeout(esperarDatos, 300);
            return;
        }

        const poaConsolidadoPorActividad = {};
        const cfgPOA = getConfigPOAPeriodo();
        const mesesPOA = cfgPOA.mesesPOA;
        const columnasAgrupacionPOA = [
            "Resultado_cod", "Resultado", "Producto_cod", "Producto"
        ];

        POADatos.forEach((item, index) => {
            let actividad = item.Actividad ? String(item.Actividad).trim() : `Actividad Desconocida POA ${index}`;
            if (actividad === "") {
                actividad = `Actividad Vacía POA ${index}`;
            }

            if (!poaConsolidadoPorActividad[actividad]) {
                poaConsolidadoPorActividad[actividad] = {
                    actividad: actividad,
                    Planificado: 0,
                    detallesPlanificadoMensual: {}
                };
                mesesPOA.forEach(mes => {
                    poaConsolidadoPorActividad[actividad].detallesPlanificadoMensual[mes] = 0;
                });
                columnasAgrupacionPOA.forEach(col => {
                    poaConsolidadoPorActividad[actividad][col] = item[col] ?? "";
                });
            }

            mesesPOA.forEach(mes => {
                const mesValue = parseFloat(item[mes]) || 0;
                poaConsolidadoPorActividad[actividad].detallesPlanificadoMensual[mes] += mesValue;
                poaConsolidadoPorActividad[actividad].Planificado += mesValue;
            });
        });

        const enviosAgrupados = {};

        Envios.forEach(item => {
            let actividad = item.actividad ? String(item.actividad).trim() : `Actividad Desconocida Envios`;
            if (actividad === "") {
                actividad = `Actividad Vacía Envios`;
            }

            if (!enviosAgrupados[actividad]) {
                enviosAgrupados[actividad] = {
                    actividad: actividad,
                    ambito: new Set(),
                    entidad: new Set(),
                    participantes: 0,
                    Ejecutado: 0,
                    hombres: 0,
                    mujeres: 0,
                    detallesEnviosOriginales: []
                };
            }

            if (item.ambito && typeof item.ambito === 'string') {
                item.ambito.split(',').forEach(a => enviosAgrupados[actividad].ambito.add(a.trim()));
            }
            if (item.entidad && typeof item.entidad === 'string') {
                item.entidad.split(',').forEach(e => enviosAgrupados[actividad].entidad.add(e.trim()));
            }

            enviosAgrupados[actividad].participantes += parseFloat(item.participantes) || 0;
            enviosAgrupados[actividad].Ejecutado += parseFloat(item.numerometas) || 0;
            enviosAgrupados[actividad].hombres += parseFloat(item.hombres) || 0;
            enviosAgrupados[actividad].mujeres += parseFloat(item.mujeres) || 0;
            enviosAgrupados[actividad].detallesEnviosOriginales.push(item);
        });

        const datosUnidosPorActividad = {};

        Object.values(poaConsolidadoPorActividad).forEach(poaItem => {
            const actividad = poaItem.actividad;
            datosUnidosPorActividad[actividad] = {
                actividad: actividad,
                Planificado: poaItem.Planificado,
                detallesPlanificadoMensual: poaItem.detallesPlanificadoMensual,
                ...Object.fromEntries(columnasAgrupacionPOA.map(col => [col, poaItem[col]])),
                ambito: "",
                entidad: "",
                participantes: 0,
                Ejecutado: "",
                hombres: 0,
                mujeres: 0,
                detallesEnviosOriginales: []
            };
        });

        Object.values(enviosAgrupados).forEach(enviosItem => {
            const actividad = enviosItem.actividad;
            if (!datosUnidosPorActividad[actividad]) {
                datosUnidosPorActividad[actividad] = {
                    actividad: actividad,
                    Planificado: "",
                    detallesPlanificadoMensual: {},
                    ...Object.fromEntries(columnasAgrupacionPOA.map(col => [col, ""])),
                };
            }
            
            // Procesamiento y ordenamiento para 'ambito'
            let ambitoArray = Array.from(enviosItem.ambito);
            if (ambitoArray.includes("Todas las regiones")) {
                ambitoArray = ambitoArray.filter(item => !item.includes("Región") || item === "Todas las regiones");
            }
            if (ambitoArray.includes("Todas las provincias")) {
                ambitoArray = ambitoArray.filter(item => !item.includes("Provincia") || item === "Todas las provincias");
            }
            ambitoArray = ambitoArray.filter(item => item !== "Ninguna"); // Elimina "Ninguna"
            ambitoArray.sort((a, b) => a.localeCompare(b));
            datosUnidosPorActividad[actividad].ambito = ambitoArray.join(', ');

            // Procesamiento y ordenamiento para 'entidad'
            let entidadArray = Array.from(enviosItem.entidad);
            if (entidadArray.includes("Todas las regiones")) {
                entidadArray = entidadArray.filter(item => !item.includes("Región") || item === "Todas las regiones");
            }
            if (entidadArray.includes("Todas las provincias")) {
                entidadArray = entidadArray.filter(item => !item.includes("Provincia") || item === "Todas las provincias");
            }
            entidadArray = entidadArray.filter(item => item !== "Ninguna"); // Elimina "Ninguna"
            entidadArray.sort((a, b) => a.localeCompare(b));
            datosUnidosPorActividad[actividad].entidad = entidadArray.join(', ');

            datosUnidosPorActividad[actividad].participantes = enviosItem.participantes;
            datosUnidosPorActividad[actividad].hombres = enviosItem.hombres;
            datosUnidosPorActividad[actividad].mujeres = enviosItem.mujeres;
            datosUnidosPorActividad[actividad].Ejecutado = enviosItem.Ejecutado;
            datosUnidosPorActividad[actividad].detallesEnviosOriginales = enviosItem.detallesEnviosOriginales;
        });

        const todosLosDatosFormateados = Object.values(datosUnidosPorActividad)
            .map(item => {
                const planificadoNum = parseFloat(item.Planificado) || 0;
                const ejecutadoNum = parseFloat(item.Ejecutado) || 0;

                let avancePorcentaje = 0;
                let avanceDisplay = "";

                if (planificadoNum > 0) {
                    avancePorcentaje = (ejecutadoNum / planificadoNum) * 100;
                    avanceDisplay = avancePorcentaje.toFixed(0) + "%";
                } else if (ejecutadoNum > 0 && planificadoNum === 0) {
                    avanceDisplay = "-";
                } else {
                    avanceDisplay = "";
                }

                return {
                    actividad: item.actividad,
                    Resultado_cod: item.Resultado_cod ?? "",
                    Resultado: item.Resultado ?? "",
                    Producto_cod: item.Producto_cod ?? "",
                    Producto: item.Producto ?? "",
                    ambito: item.ambito,
                    entidad: item.entidad,
                    participantes: item.participantes,
                    hombres: item.hombres,
                    mujeres: item.mujeres,
                    Planificado: planificadoNum,
                    Ejecutado: ejecutadoNum,
                    Avance: avanceDisplay,
                    _avanceNumerico: avancePorcentaje,
                    detallesPlanificadoMensual: item.detallesPlanificadoMensual,
                    detallesEnviosOriginales: item.detallesEnviosOriginales
                };
            })
            .filter(item => !(item.Planificado === 0 && item.Ejecutado === 0));

        const datosAgrupadosPorProductoResultado = {};

        todosLosDatosFormateados.forEach(item => {
            const key = `${item.Resultado_cod}|${item.Resultado}|${item.Producto_cod}|${item.Producto}`;
            if (!datosAgrupadosPorProductoResultado[key]) {
                datosAgrupadosPorProductoResultado[key] = {
                    metadata: {
                        Resultado_cod: item.Resultado_cod,
                        Resultado: item.Resultado,
                        Producto_cod: item.Producto_cod,
                        Producto: item.Producto
                    },
                    actividades: []
                };
            }
            datosAgrupadosPorProductoResultado[key].actividades.push(item);
        });

        contenedor.innerHTML = '';
        contenedor.classList.add("centrarContenido");

        // 🔵 Obtener criterios de resultado del usuario
        const usuarioDatos = JSON.parse(localStorage.getItem("usuarioDatos") || "{}");
        const resultadosAutorizados = (usuarioDatos.Resultado || "")
            .split(",")
            .map(r => r.trim())
            .filter(r => r); // Elimina vacíos

        // 🔵 Mostrar solo tablas cuyo Resultado_cod empiece con alguno de los asignados
        Object.values(datosAgrupadosPorProductoResultado).forEach(grupo => {
            const codigoResultado = grupo.metadata.Resultado_cod || "";

            const resultadoCoincide = resultadosAutorizados.some(autorizado =>
                codigoResultado.startsWith(autorizado)
            );

            if (grupo.actividades.length > 0 && resultadoCoincide) {
                const tituloTabla = `Actividades del producto "${grupo.metadata.Producto}" en el resultado "${grupo.metadata.Resultado_cod}"`;
                crearTablaUnificada(tituloTabla, grupo.actividades, contenedor, cfgPOA);
            }
        });

        if (Object.keys(datosAgrupadosPorProductoResultado).length === 0 || todosLosDatosFormateados.length === 0) {
            contenedor.innerHTML = '<p class="mensaje-centradoSemestral">No hay datos disponibles para generar el reporte o todas las actividades tienen Planificado=0 y Ejecutado=0.</p>';
        }
    };

    esperarDatos();
});

function formatNumberForDisplayForPlanificadoEjecutado(value) {
    const num = parseFloat(value);
    if (isNaN(num) || value === null || value === undefined || value === "") {
        return 0;
    }
    return Math.round(num);
}

function crearTablaUnificada(titulo, datos, contenedor, cfgPOA) {
    if (!Array.isArray(datos) || datos.length === 0) {
        return;
    }

    const mesesBonitosPOA = cfgPOA.mesesBonitosPOA;
    const ordenMesesEjecutado = cfgPOA.ordenMesesEjecutado;


    const encabezadosMapa = {
        "actividad": "Actividad",
        "ambito": "Beneficiarios",
        "participantes": "Participantes",
        "hombres": "Hombres",
        "mujeres": "Mujeres",
        "Planificado": "Planificado",
        "Ejecutado": "Ejecutado",
        "Avance": "Avance"
    };

    const clavesInternasBase = [
        "actividad", "ambito",
        "participantes", "hombres", "mujeres",
        "Planificado", "Ejecutado", "Avance"
    ];

    const columnasNumericasOpcionales = ["participantes", "hombres", "mujeres"];
    const columnasTextoOpcionales = ["ambito", "entidad"];

    const clavesVisiblesParaEstaTabla = clavesInternasBase.filter(clave => {
        if (clave === "actividad" || clave === "Planificado" || clave === "Ejecutado" || clave === "Avance") {
            return true;
        }

        if (columnasNumericasOpcionales.includes(clave)) {
            return datos.some(row => {
                const value = parseFloat(row[clave]);
                return !isNaN(value) && value !== 0;
            });
        }

        if (columnasTextoOpcionales.includes(clave)) {
            return datos.some(row => {
                const value = row[clave];
                return typeof value === 'string' && value.trim() !== '';
            });
        }
        return false;
    });

    const anchosFijos = {
        "actividad": "250px",
        "ambito": "180px",
        "participantes": "100px",
        "hombres": "80px",
        "mujeres": "80px",
        "Planificado": "100px",
        "Ejecutado": "100px",
        "Avance": "80px"
    };

    const divTabla = document.createElement("div");
    divTabla.className = "contenedorTablaSemestral";
    divTabla.classList.add("tabla-centrada");

    const tituloElem = document.createElement("h3");
    tituloElem.className = "tituloTablaSemestral";
    tituloElem.textContent = titulo;
    divTabla.appendChild(tituloElem);

    const tabla = document.createElement("table");
    tabla.className = "tablaSemestral";

    const colgroup = document.createElement("colgroup");
    clavesVisiblesParaEstaTabla.forEach(clave => {
        const col = document.createElement("col");
        col.style.width = anchosFijos[clave] || "auto";
        colgroup.appendChild(col);
    });
    tabla.appendChild(colgroup);

    const thead = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");

    clavesVisiblesParaEstaTabla.forEach(clave => {
        const th = document.createElement("th");
        th.textContent = encabezadosMapa[clave] || clave;
        th.className = "celdaEncabezadoSemestral";
        filaEncabezado.appendChild(th);
    });
    thead.appendChild(filaEncabezado);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    datos.forEach(obj => {
        const tr = document.createElement("tr");

        clavesVisiblesParaEstaTabla.forEach(clave => {
            const td = document.createElement("td");
            td.className = "celdaDatoSemestral";

            if (clave === "Planificado") {
                td.textContent = formatNumberForDisplayForPlanificadoEjecutado(obj.Planificado);
                td.style.cursor = "pointer";
                td.addEventListener("click", () => {
                    const detallesPlanificado = obj.detallesPlanificadoMensual || {};
                    const mesesPOAKeys = cfgPOA.mesesPOA;

                    const tablaModalPlanificado = document.createElement("table");
                    tablaModalPlanificado.className = "tablaSemestralModal";
                    tablaModalPlanificado.style.tableLayout = "fixed";
                    const colgroupModalPlanificado = document.createElement("colgroup");
                    mesesPOAKeys.forEach(() => {
                        const col = document.createElement("col");
                        col.style.width = "80px";
                        colgroupModalPlanificado.appendChild(col);
                    });
                    tablaModalPlanificado.appendChild(colgroupModalPlanificado);

                    const theadModalPlanificado = document.createElement("thead");
                    const trHeadModalPlanificado = document.createElement("tr");
                    mesesPOAKeys.forEach(mesKey => {
                        let th = document.createElement("th");
                        th.textContent = mesesBonitosPOA[mesKey];
                        trHeadModalPlanificado.appendChild(th);
                    });
                    theadModalPlanificado.appendChild(trHeadModalPlanificado);
                    tablaModalPlanificado.appendChild(theadModalPlanificado);

                    const tbodyModalPlanificado = document.createElement("tbody");
                    const trBody = document.createElement("tr");
                    mesesPOAKeys.forEach(mesKey => {
                        let tdValor = document.createElement("td");
                        tdValor.textContent = formatNumberForDisplayForPlanificadoEjecutado(detallesPlanificado[mesKey] || 0);
                        trBody.appendChild(tdValor);
                    });
                    tbodyModalPlanificado.appendChild(trBody);
                    tablaModalPlanificado.appendChild(tbodyModalPlanificado);

                    const contenidoModalPlanificadoDiv = document.createElement("div");
                    contenidoModalPlanificadoDiv.appendChild(tablaModalPlanificado);

                    mostrarModal(`Detalle Planificado Mensual: "${obj.actividad || 'N/A'}"`, contenidoModalPlanificadoDiv);
                });
            } else if (clave === "Ejecutado") {
                td.textContent = formatNumberForDisplayForPlanificadoEjecutado(obj.Ejecutado);
                td.style.cursor = "pointer";
                td.addEventListener("click", () => {
                    const detallesOriginalesEnvios = obj.detallesEnviosOriginales || [];

                    detallesOriginalesEnvios.sort((a, b) => {
                        const indiceMesA = ordenMesesEjecutado.indexOf(a.mesReporte);
                        const indiceMesB = ordenMesesEjecutado.indexOf(b.mesReporte);

                        return indiceMesA - indiceMesB;
                    });

                    const sumaEjecutadoPorMes = {};
                    ordenMesesEjecutado.forEach(mes => {
                        sumaEjecutadoPorMes[mes] = 0;
                    });

                    detallesOriginalesEnvios.forEach(item => {
                        if (ordenMesesEjecutado.includes(item.mesReporte)) {
                             sumaEjecutadoPorMes[item.mesReporte] += (parseFloat(item.numerometas) || 0);
                        }
                    });

                    const tablaSumaMeses = document.createElement("table");
                    tablaSumaMeses.className = "tablaSemestralModal";
                    tablaSumaMeses.style.tableLayout = "fixed";

                    const colgroupSuma = document.createElement("colgroup");
                    ordenMesesEjecutado.forEach(() => {
                        const col = document.createElement("col");
                        col.style.width = "80px";
                        colgroupSuma.appendChild(col);
                    });
                    tablaSumaMeses.appendChild(colgroupSuma);

                    const theadSuma = document.createElement("thead");
                    const trHeadSuma = document.createElement("tr");
                    ordenMesesEjecutado.forEach(mes => {
                        let th = document.createElement("th");
                        th.textContent = mes;
                        trHeadSuma.appendChild(th);
                    });
                    theadSuma.appendChild(trHeadSuma);
                    tablaSumaMeses.appendChild(theadSuma);

                    const tbodySuma = document.createElement("tbody");
                    const trBodySuma = document.createElement("tr");
                    ordenMesesEjecutado.forEach(mes => {
                        let tdSuma = document.createElement("td");
                        tdSuma.textContent = formatNumberForDisplayForPlanificadoEjecutado(sumaEjecutadoPorMes[mes]);
                        trBodySuma.appendChild(tdSuma);
                    });
                    tbodySuma.appendChild(trBodySuma);
                    tablaSumaMeses.appendChild(tbodySuma);

                    const contenidoModalEnviosDiv = document.createElement("div");
                    let h4Suma = document.createElement("h4");
                    h4Suma.textContent = `Ejecutado por mes`;
                    contenidoModalEnviosDiv.appendChild(h4Suma);
                    contenidoModalEnviosDiv.appendChild(tablaSumaMeses);

                    const anchosFijosModalEjecutadoDetalle = {
                        "Mes Reporte": "100px",
                        "Ejecutado": "90px",
                        "Título": "250px",
                        "Usuario": "120px",
                        "Timestamp": "150px",
                        "Entidad": "180px",
                        "Participantes": "100px",
                        "Hombres": "80px",
                        "Mujeres": "80px",
                        "Autoridades": "150px",
                        "Detalle Meta": "300px"
                    };

                    const headersDetalle = ["Mes Reporte", "Ejecutado", "Título", "Usuario", "Timestamp", "Entidad", "Participantes", "Hombres", "Mujeres", "Autoridades", "Detalle Meta"];
                    const keysDetalle = ["mesReporte", "numerometas", "titulo", "usuario", "timestamp", "entidad", "participantes", "hombres", "mujeres", "autoridades", "detalleMeta"];

                    const columnasVisiblesDetalle = [];
                    headersDetalle.forEach((header, index) => {
                        const key = keysDetalle[index];
                        const tieneDatos = detallesOriginalesEnvios.some(item => {
                            const value = item[key];
                            if (typeof value === 'string') {
                                return value.trim() !== '';
                            }
                            if (typeof value === 'number') {
                                return value !== 0;
                            }
                            return value !== null && value !== undefined;
                        });
                        if (tieneDatos) {
                            columnasVisiblesDetalle.push({ header: header, key: key });
                        }
                    });

                    if (columnasVisiblesDetalle.length > 0 && detallesOriginalesEnvios.length > 0) {
                        const tablaDetalleCompleto = document.createElement("table");
                        tablaDetalleCompleto.className = "tablaSemestralModal";
                        tablaDetalleCompleto.style.tableLayout = "fixed";

                        const colgroupDetalle = document.createElement("colgroup");
                        columnasVisiblesDetalle.forEach(colInfo => {
                            const col = document.createElement("col");
                            col.style.width = anchosFijosModalEjecutadoDetalle[colInfo.header] || "auto";
                            colgroupDetalle.appendChild(col);
                        });
                        tablaDetalleCompleto.appendChild(colgroupDetalle);

                        const theadDetalle = document.createElement("thead");
                        const trHeadDetalle = document.createElement("tr");
                        columnasVisiblesDetalle.forEach(colInfo => {
                            let th = document.createElement("th");
                            th.textContent = colInfo.header;
                            trHeadDetalle.appendChild(th);
                        });
                        theadDetalle.appendChild(trHeadDetalle);
                        tablaDetalleCompleto.appendChild(theadDetalle);

                        const tbodyDetalle = document.createElement("tbody");
                        detallesOriginalesEnvios.forEach(item => {
                            const trBody = document.createElement("tr");
                            columnasVisiblesDetalle.forEach(colInfo => {
                                const td = document.createElement("td");
                                let displayValue = item[colInfo.key] ?? '';

                                if (["numerometas", "participantes", "hombres", "mujeres"].includes(colInfo.key)) {
                                    displayValue = formatNumberForDisplayForPlanificadoEjecutado(displayValue);
                                }

                                td.textContent = displayValue;
                                trBody.appendChild(td);
                            });
                            tbodyDetalle.appendChild(trBody);
                        });
                        tablaDetalleCompleto.appendChild(tbodyDetalle);

                        let h4Detalle = document.createElement("h4");
                        h4Detalle.textContent = `Detalle`;
                        contenidoModalEnviosDiv.appendChild(h4Detalle);
                        contenidoModalEnviosDiv.appendChild(tablaDetalleCompleto);
                    }

                    if (contenidoModalEnviosDiv.children.length === 0) {
                        contenidoModalEnviosDiv.textContent = "No hay datos de ejecución detallados disponibles para esta actividad.";
                    }
                    mostrarModal(`Detalle de Ejecutado: "${obj.actividad || 'N/A'}"`, contenidoModalEnviosDiv);
                });
            } else if (clave === "Avance") {
                td.textContent = obj.Avance;
                const avanceNumerico = obj._avanceNumerico;

                if (obj.Avance === "-") {
                    td.style.backgroundColor = "#ccffcc";
                    td.style.color = "#006400";
                    td.style.fontWeight = "bold";
                } else if (typeof avanceNumerico === 'number' && !isNaN(avanceNumerico)) {
                    if (avanceNumerico < 65) {
                        td.style.backgroundColor = "#ffcccc";
                        td.style.color = "#cc0000";
                        td.style.fontWeight = "bold";
                    } else if (avanceNumerico >= 65 && avanceNumerico <= 90) {
                        td.style.backgroundColor = "#fffacd";
                        td.style.color = "#b8860b";
                        td.style.fontWeight = "bold";
                    } else if (avanceNumerico > 90) {
                        td.style.backgroundColor = "#ccffcc";
                        td.style.color = "#006400";
                        td.style.fontWeight = "bold";
                    }
                }
            } else if (clave === "ambito" || clave === "entidad") {
                let displayText = obj[clave] ?? "";
                if (typeof displayText === 'string' && displayText.trim() !== '') {
                    let items = displayText.split(',')
                                            .map(item => item.trim())
                                            .filter(item => item !== '' && item !== 'Ninguna'); // Elimina "Ninguna" aquí también

                    items = Array.from(new Set(items)).sort((a, b) => a.localeCompare(b));
                    displayText = items.join(', ');
                }
                td.textContent = displayText;

            } else if (columnasNumericasOpcionales.includes(clave)) {
                const numValue = parseFloat(obj[clave]);
                td.textContent = (isNaN(numValue) || numValue === 0) ? "" : Math.round(numValue);
            } else {
                td.textContent = obj[clave] ?? "";
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    tabla.appendChild(tbody);
    divTabla.appendChild(tabla);
    contenedor.appendChild(divTabla);
}

function mostrarModal(titulo, contenidoDOMElement) {
    let fondo = document.createElement("div");
    fondo.className = "modalSemestralFondo";

    let modal = document.createElement("div");
    modal.className = "modalSemestral";

    let h4Titulo = document.createElement("h3");
    h4Titulo.textContent = titulo;
    modal.appendChild(h4Titulo);

    let contenidoDiv = document.createElement("div");
    contenidoDiv.className = "modalSemestralContenido";
    contenidoDiv.appendChild(contenidoDOMElement);
    modal.appendChild(contenidoDiv);

    let botonCerrar = document.createElement("button");
    botonCerrar.className = "cerrarModalBtn";
    botonCerrar.textContent = "X";
    modal.appendChild(botonCerrar);

    fondo.appendChild(modal);
    document.body.appendChild(fondo);

    botonCerrar.addEventListener("click", () => {
        document.body.removeChild(fondo);
    });
}


// BOTON PDF SEMESTRAL 
function waitForJsPDFandInit(callback) {
    const checkInterval = 100;
    const intervalId = setInterval(() => {
        if (window.jspdf?.jsPDF) {
            clearInterval(intervalId);
            callback(window.jspdf.jsPDF);
        }
    }, checkInterval);
}

function waitForMyPdfTablesContainer(callback) {
    const checkInterval = 100;
    const intervalId = setInterval(() => {
        const container = document.getElementById('tablasPOASemestral');
        if (container) {
            clearInterval(intervalId);
            callback(container);
        }
    }, checkInterval);
}

function generateRandomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function setupMyPdfDownload(jsPDFClass, tablesContainer) {
    const button = document.getElementById('guardarPdfSemestrales');

    if (!button) {
        console.warn("⚠️ Botón 'guardarPdfSemestrales' no encontrado.");
        return;
    }

    button.addEventListener('click', () => {
        const cfgPOA = getConfigPOAPeriodo();
        const doc = new jsPDFClass({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        if (typeof doc.autoTable !== "function") {
            console.error("❌ autoTable no está disponible.");
            return;
        }

        const anchosFijos = {
            "Actividad": 180,
            "Beneficiarios": 140,
            "Participantes": 80,
            "Hombres": 60,
            "Mujeres": 60,
            "Planificado": 80,
            "Ejecutado": 80,
            "Avance": 60
        };

        const getFontSize = size => size;

        doc.setFont('helvetica', 'normal');

        const margin = 40;
        let yOffset = margin;

        // Título general
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(cfgPOA.pdfTitulo, doc.internal.pageSize.width / 2, yOffset, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text("Basel Institute on Governance - GFP Subnacional", doc.internal.pageSize.width / 2, yOffset + 20, { align: 'center' });
        yOffset += 50;

        const elements = [
            ...tablesContainer.querySelectorAll('h3, table.tablaSemestral')
        ];

        if (elements.length === 0) {
            alert('No hay contenido (tablas o títulos) para generar el PDF.');
            return;
        }

        for (let i = 0; i < elements.length; i++) {
            if (elements[i].tagName === 'H3' && elements[i + 1]?.tagName === 'TABLE') {
                const h3 = elements[i];
                const table = elements[i + 1];
                i++; // Saltar tabla

                // Título multilínea centrado
                const titleText = h3.innerText;
                const maxWidth = doc.internal.pageSize.width - 2 * margin;
                const splitTitle = doc.splitTextToSize(titleText, maxWidth);
                const titleHeight = splitTitle.length * getFontSize(10) + 10;

                const rowsCount = table.querySelectorAll('tbody tr').length;
                const estimatedTableHeight = rowsCount * (getFontSize(10) + 6) + 30;
                const espacioTotal = titleHeight + estimatedTableHeight;

                if (yOffset + espacioTotal > doc.internal.pageSize.height - margin) {
                    doc.addPage();
                    yOffset = margin;
                }

                doc.setFontSize(getFontSize(10));
                doc.setFont(undefined, 'bold');
                doc.text(splitTitle, margin, yOffset);
                doc.setFont(undefined, 'normal');
                yOffset += titleHeight;

                // Procesar tabla
                const headers = Array.from(table.querySelector('thead tr').children).map(th => th.innerText);
                const rows = Array.from(table.querySelector('tbody').children).map(tr =>
                    Array.from(tr.children).map(td => td.innerText)
                );

                const filteredHeaders = headers.filter(h => anchosFijos[h]);
                const columnWidths = filteredHeaders.map(h => anchosFijos[h]);
                const headerIndexMap = new Map(headers.map((h, i) => [h, i]));

                const tableData = [
                    filteredHeaders,
                    ...rows.map(row =>
                        filteredHeaders.map(header => row[headerIndexMap.get(header)] || '')
                    )
                ];

                doc.setFontSize(getFontSize(10));

                const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
                const xStart = (doc.internal.pageSize.width - tableWidth) / 2;

                doc.autoTable({
                    startY: yOffset,
                    head: [tableData[0]],
                    body: tableData.slice(1),
                    showHead: 'everyPage',
                    theme: 'grid',
                    styles: {
                        font: 'helvetica',
                        fontSize: getFontSize(10),
                        cellPadding: 5,
                        lineColor: 0,
                        lineWidth: 0.5,
                        textColor: 0,
                        valign: 'middle',
                        overflow: 'linebreak'
                    },
                    headStyles: {
                        fillColor: [28, 69, 116],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: columnWidths.reduce((acc, width, idx) => {
                        acc[idx] = {
                            cellWidth: width,
                            halign: ['Hombres', 'Mujeres', 'Planificado', 'Ejecutado', 'Avance'].includes(filteredHeaders[idx]) ? 'center' : 'left'
                        };
                        return acc;
                    }, {}),
                    margin: { left: xStart, right: xStart },
                    didDrawPage: function () {
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        doc.setTextColor(150); // gris

                        let usuarioNombre = "Usuario desconocido";
                        try {
                            const usuario = JSON.parse(localStorage.getItem("usuarioDatos"));
                            if (usuario?.Usuario) usuarioNombre = usuario.Usuario;
                        } catch { }

                        const encabezado = `${cfgPOA.pdfTitulo}. Usuario: ${usuarioNombre}`;
                        const pageStr = `Página ${doc.internal.getCurrentPageInfo().pageNumber}`;

                        const rightEdge = doc.internal.pageSize.width - margin;

                        doc.text(encabezado, rightEdge, 20, { align: 'right' });
                        doc.text(pageStr, rightEdge, doc.internal.pageSize.height - 10, { align: 'right' });
                    }
                });

                yOffset = doc.autoTable.previous.finalY + getFontSize(25);
            }
        }

        // Pie de página final
        let usuarioNombre = "Usuario desconocido";
        try {
            const usuario = JSON.parse(localStorage.getItem("usuarioDatos"));
            if (usuario?.Usuario) usuarioNombre = usuario.Usuario;
        } catch (err) {
            console.warn("⚠️ Error al leer usuarioDatos:", err);
        }

        const now = new Date();
        const fecha = now.toLocaleDateString();
        const hora = now.toLocaleTimeString();
        const codigo = generateRandomCode();

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(
            `Generado el ${fecha} a las ${hora}. Usuario: ${usuarioNombre} (Código: ${codigo})`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 20,
            { align: 'center' }
        );

        doc.save(cfgPOA.pdfNombre);
        console.log('✅ PDF generado y guardado.');
    });
}

document.addEventListener("DOMContentLoaded", () => {
    waitForJsPDFandInit(jsPDF => {
        waitForMyPdfTablesContainer(container => {
            setupMyPdfDownload(jsPDF, container);
        });
    });
});
