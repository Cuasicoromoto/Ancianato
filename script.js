// --- CONFIGURACIÓN DE LA API (GOOGLE SHEETS) ---
// Reemplaza esta URL con la que obtuviste al implementar tu Google Apps Script
const URL_API = "https://script.google.com/macros/s/AKfycbw9T9pd-XVhmhRP10dKrj0ZTdsv5Wj7TeWjIqDkSqkcOtmdulIQMLYpPPh9I718EQs21g/exec
";

// --- NAVEGACIÓN ENTRE PESTAÑAS ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// --- GESTIÓN DE ABUELOS ---
async function guardarAbuelo() {
    const nombre = document.getElementById('nombre-abuelo').value;
    const edad = document.getElementById('edad-abuelo').value;
    const diagnostico = document.getElementById('diagnostico-abuelo').value;

    if (!nombre || !edad) return alert("Por favor, llena los campos básicos.");

    const nuevoAbuelo = {
        tabla: "Abuelos",
        datos: [Date.now(), nombre, edad, diagnostico, new Date().toLocaleDateString()]
    };

    try {
        await fetch(URL_API, { method: 'POST', mode: 'no-cors', body: JSON.stringify(nuevoAbuelo) });
        alert("Abuelo guardado en la nube");
        document.getElementById('nombre-abuelo').value = '';
        document.getElementById('edad-abuelo').value = '';
        document.getElementById('diagnostico-abuelo').value = '';
        renderAbuelos();
    } catch (e) { alert("Error al conectar con la base de datos"); }
}

async function renderAbuelos() {
    const lista = document.getElementById('lista-abuelos');
    lista.innerHTML = '<p>Cargando datos...</p>';
    try {
        const res = await fetch(`${URL_API}?tabla=Abuelos`);
        const abuelos = await res.json();
        lista.innerHTML = '';
        abuelos.forEach(a => {
            lista.innerHTML += `
                <div class="item-lista card">
                    <p><strong>${a.nombre}</strong> (${a.edad} años)</p>
                    <p><small>${a.diagnostico}</small></p>
                </div>`;
        });
    } catch (e) { lista.innerHTML = '<p>Error al cargar abuelos.</p>'; }
}

// --- GESTIÓN DE MEDICINAS ---
async function guardarMedicina() {
    const abuelo = document.getElementById('med-abuelo').value;
    const medicina = document.getElementById('med-nombre').value;
    const dosis = document.getElementById('med-dosis').value;
    const hora = document.getElementById('med-hora').value;

    if (!abuelo || !medicina) return alert("Completa los datos de medicina.");

    const nuevaMed = {
        tabla: "Medicinas",
        datos: [Date.now(), abuelo, medicina, dosis, hora]
    };

    try {
        await fetch(URL_API, { method: 'POST', mode: 'no-cors', body: JSON.stringify(nuevaMed) });
        alert("Medicina registrada");
        renderMedicinas();
    } catch (e) { console.error(e); }
}

async function renderMedicinas() {
    const lista = document.getElementById('lista-medicinas');
    try {
        const res = await fetch(`${URL_API}?tabla=Medicinas`);
        const meds = await res.json();
        lista.innerHTML = '';
        meds.forEach(m => {
            lista.innerHTML += `
                <div class="item-lista card border-left-blue">
                    <p><strong>${m.nombreAbuelo}:</strong> ${m.medicamento}</p>
                    <p><small>Dosis: ${m.dosis} - Hora: ${m.horario}</small></p>
                </div>`;
        });
    } catch (e) { lista.innerHTML = '<p>Error al cargar medicinas.</p>'; }
}

// --- GESTIÓN DE FINANZAS ---
async function guardarFinanza() {
    const concepto = document.getElementById('fin-concepto').value;
    const monto = document.getElementById('fin-monto').value;
    const tipo = document.getElementById('fin-tipo').value;

    if (!concepto || !monto) return;

    const nuevaFinanza = {
        tabla: "Finanzas",
        datos: [Date.now(), new Date().toLocaleDateString(), concepto, monto, tipo]
    };

    try {
        await fetch(URL_API, { method: 'POST', mode: 'no-cors', body: JSON.stringify(nuevaFinanza) });
        alert("Movimiento financiero registrado");
        renderFinanzas();
    } catch (e) { console.error(e); }
}

async function renderFinanzas() {
    const lista = document.getElementById('lista-finanzas');
    try {
        const res = await fetch(`${URL_API}?tabla=Finanzas`);
        const fins = await res.json();
        lista.innerHTML = '';
        fins.forEach(f => {
            const color = f.tipo === 'Ingreso' ? 'text-green' : 'text-red';
            lista.innerHTML += `
                <div class="item-lista card">
                    <p><strong>${f.concepto}</strong></p>
                    <p class="${color}">$${f.monto} (${f.tipo})</p>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

// --- INICIALIZACIÓN ---
function renderAll() {
    renderAbuelos();
    renderMedicinas();
    renderFinanzas();
}

window.onload = renderAll;

// --- LÓGICA DE INSTALACIÓN PWA ---
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const closeBannerBtn = document.getElementById('pwa-close-banner');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.classList.add('show');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installBanner.classList.remove('show');
    }
});

closeBannerBtn.addEventListener('click', () => {
    installBanner.classList.remove('show');
});

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("Service Worker registrado"));
}
