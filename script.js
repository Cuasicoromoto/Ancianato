// --- BASE DE DATOS LOCAL ---
        let db = JSON.parse(localStorage.getItem('ancianatoDB_v3')) || {
            abuelos: [], medicinas: [], empleados: [], gastos: [], aportes: [], ingresos: []
        };
        if (!db.ingresos) db.ingresos = []; // Compatibilidad para base de datos ya existente

        let editId = null;
        let aporteFaltaActual = 0;

        const genId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
        const hoy = new Date();
        const hoyIso = hoy.toISOString().split('T')[0];
        const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('mes-control').value = mesActual;

        function saveDB() {
            localStorage.setItem('ancianatoDB_v3', JSON.stringify(db));
            renderAll();
        }

        function calcularEdad(fechaNac) {
            const h = new Date(); const c = new Date(fechaNac);
            let e = h.getFullYear() - c.getFullYear();
            const m = h.getMonth() - c.getMonth();
            if (m < 0 || (m === 0 && h.getDate() < c.getDate())) e--;
            return e;
        }
        function formatoFecha(isoDate) {
            if (!isoDate) return "N/A";
            const [y, m, d] = isoDate.split('-');
            return `${d}/${m}/${y}`;
        }

        // --- FUNCION COPIAR AL PORTAPAPELES ---
        function copiarAlPortapapeles(idElemento, boton) {
            const texto = document.getElementById(idElemento).innerText;
            if (!texto || texto === 'N/A') return;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(texto).then(() => animarBotonCopia(boton));
            } else {
                const inputTemp = document.createElement("textarea");
                inputTemp.value = texto;
                document.body.appendChild(inputTemp);
                inputTemp.select();
                try {
                    document.execCommand('copy');
                    animarBotonCopia(boton);
                } catch (err) {
                    console.error('Error copiando texto', err);
                }
                document.body.removeChild(inputTemp);
            }
        }

        function animarBotonCopia(boton) {
            const iconoOriginal = boton.innerText;
            boton.innerText = '✅';
            setTimeout(() => { boton.innerText = iconoOriginal; }, 1500);
        }

        // --- NAVEGACIÓN Y MODALES ---
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + tabId).classList.add('active');
            document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function abrirModalNuevo(id) {
            editId = null;
            document.querySelector(`#${id} form`).reset();

            if (id === 'modal-gasto') document.getElementById('gas-fecha').value = hoyIso;
            if (id === 'modal-ingreso') document.getElementById('ing-fecha').value = hoyIso;
            if (id === 'modal-medicina') {
                actualizarSugerenciasMedicinas();
                checkMedicinaSelect();
            }

            document.getElementById(id).classList.add('active');
        }

        function closeModal(id) { document.getElementById(id).classList.remove('active'); }

        function eliminarItem(id, tipo) {
            if (!confirm("¿Confirmas eliminar este registro?")) return;
            if (tipo === 'abuelo') {
                db.abuelos = db.abuelos.filter(a => a.id !== id);
                db.medicinas = db.medicinas.filter(m => m.idAbuelo !== id);
                db.aportes = db.aportes.filter(ap => ap.idAbuelo !== id);
            } else if (tipo === 'medicina') db.medicinas = db.medicinas.filter(x => x.id !== id);
            else if (tipo === 'empleado') db.empleados = db.empleados.filter(x => x.id !== id);
            else if (tipo === 'gasto') db.gastos = db.gastos.filter(x => x.id !== id);
            else if (tipo === 'ingreso') db.ingresos = db.ingresos.filter(x => x.id !== id);
            saveDB();
        }

        function editarItem(id, tipo) {
            editId = id;
            if (tipo === 'abuelo') {
                const item = db.abuelos.find(x => x.id === id);
                document.getElementById('ab-nombre').value = item.nombre;
                document.getElementById('ab-cedula').value = item.cedula || '';
                document.getElementById('ab-fecha').value = item.fechaNacimiento;
                document.getElementById('ab-genero').value = item.genero || 'Femenino';
                document.getElementById('ab-familiar').value = item.familiar || '';
                document.getElementById('ab-telefono').value = item.telefono || '';
                document.getElementById('ab-cuota').value = item.cuota;
                document.getElementById('modal-abuelo').classList.add('active');
            } else if (tipo === 'medicina') {
                const item = db.medicinas.find(x => x.id === id);
                document.getElementById('med-abuelo').value = item.idAbuelo;

                actualizarSugerenciasMedicinas();
                const select = document.getElementById('med-nombre-select');

                if ([...select.options].some(o => o.value === item.nombre)) {
                    select.value = item.nombre;
                } else {
                    select.value = 'NUEVA';
                    document.getElementById('med-nombre-input').value = item.nombre;
                }
                checkMedicinaSelect();

                document.getElementById('med-hora').value = item.hora || 'Mañana';
                document.getElementById('modal-medicina').classList.add('active');
            } else if (tipo === 'empleado') {
                const item = db.empleados.find(x => x.id === id);
                document.getElementById('emp-nombre').value = item.nombre;
                document.getElementById('emp-cedula').value = item.cedula || '';
                document.getElementById('emp-telefono').value = item.telefono || '';
                document.getElementById('emp-banco').value = item.banco || '';
                document.getElementById('emp-rol').value = item.rol;
                document.getElementById('emp-pago').value = item.pagoQuincenal;
                document.getElementById('modal-empleado').classList.add('active');
            } else if (tipo === 'gasto') {
                const item = db.gastos.find(x => x.id === id);
                document.getElementById('gas-desc').value = item.descripcion;
                document.getElementById('gas-fecha').value = item.fecha || hoyIso;
                document.getElementById('gas-monto').value = item.monto;
                document.getElementById('modal-gasto').classList.add('active');
            } else if (tipo === 'ingreso') {
                const item = db.ingresos.find(x => x.id === id);
                document.getElementById('ing-desc').value = item.descripcion;
                document.getElementById('ing-fecha').value = item.fecha || hoyIso;
                document.getElementById('ing-monto').value = item.monto;
                document.getElementById('modal-ingreso').classList.add('active');
            }
        }

        // --- APERTURA DE MODALES DE INFO ---
        function abrirInfoAbuelo(id) {
            const ab = db.abuelos.find(x => x.id === id);
            if (!ab) return;

            document.getElementById('info-ab-nombre').innerText = ab.nombre;
            document.getElementById('info-ab-cedula').innerText = ab.cedula || 'N/A';
            document.getElementById('info-ab-genero').innerText = ab.genero || 'N/A';
            document.getElementById('info-ab-edad').innerText = 'Edad: ' + calcularEdad(ab.fechaNacimiento) + ' años';
            document.getElementById('info-ab-familiar').innerText = ab.familiar || 'N/A';
            document.getElementById('info-ab-telefono').innerText = ab.telefono || 'N/A';
            document.getElementById('info-ab-cuota').innerText = ab.cuota.toFixed(2).replace('.', ',') + '$';
            document.getElementById('info-ab-fecha').innerText = formatoFecha(ab.fechaNacimiento);

            document.getElementById('btn-info-ab-editar').onclick = function () {
                closeModal('modal-info-abuelo');
                editarItem(id, 'abuelo');
            };
            document.getElementById('btn-info-ab-eliminar').onclick = function () {
                closeModal('modal-info-abuelo');
                eliminarItem(id, 'abuelo');
            };

            document.getElementById('modal-info-abuelo').classList.add('active');
        }

        function abrirInfoMedicina(id) {
            const med = db.medicinas.find(x => x.id === id);
            if (!med) return;

            const ab = db.abuelos.find(a => a.id === med.idAbuelo);

            document.getElementById('info-med-nombre').innerText = med.nombre;
            document.getElementById('info-med-hora').innerText = 'Turno: ' + med.hora;
            document.getElementById('info-med-abuelo').innerText = ab ? ab.nombre : 'Desconocido';

            document.getElementById('btn-info-med-editar').onclick = function () {
                closeModal('modal-info-medicina');
                editarItem(id, 'medicina');
            };
            document.getElementById('btn-info-med-eliminar').onclick = function () {
                closeModal('modal-info-medicina');
                eliminarItem(id, 'medicina');
            };

            document.getElementById('modal-info-medicina').classList.add('active');
        }

        function abrirInfoEmpleado(id) {
            const em = db.empleados.find(x => x.id === id);
            if (!em) return;

            document.getElementById('info-emp-nombre').innerText = em.nombre;
            document.getElementById('info-emp-rol').innerText = em.rol;

            document.getElementById('info-emp-cedula').innerText = em.cedula || 'N/A';
            document.getElementById('info-emp-telefono').innerText = em.telefono || 'N/A';
            document.getElementById('info-emp-banco').innerText = em.banco || 'N/A';

            document.getElementById('btn-info-editar').onclick = function () {
                closeModal('modal-info-empleado');
                editarItem(id, 'empleado');
            };

            document.getElementById('btn-info-eliminar').onclick = function () {
                closeModal('modal-info-empleado');
                eliminarItem(id, 'empleado');
            };

            document.getElementById('modal-info-empleado').classList.add('active');
        }

        function abrirInfoGasto(id) {
            const gas = db.gastos.find(x => x.id === id);
            if (!gas) return;

            document.getElementById('info-gas-desc').innerText = gas.descripcion;
            document.getElementById('info-gas-fecha').innerText = 'Fecha: ' + formatoFecha(gas.fecha);
            document.getElementById('info-gas-monto').innerText = gas.monto.toFixed(2).replace('.', ',') + '$';

            document.getElementById('btn-info-gas-editar').onclick = function () {
                closeModal('modal-info-gasto');
                editarItem(id, 'gasto');
            };
            document.getElementById('btn-info-gas-eliminar').onclick = function () {
                closeModal('modal-info-gasto');
                eliminarItem(id, 'gasto');
            };

            document.getElementById('modal-info-gasto').classList.add('active');
        }

        function abrirInfoIngreso(id) {
            const ing = db.ingresos.find(x => x.id === id);
            if (!ing) return;

            document.getElementById('info-ing-desc').innerText = ing.descripcion;
            document.getElementById('info-ing-fecha').innerText = 'Fecha: ' + formatoFecha(ing.fecha);
            document.getElementById('info-ing-monto').innerText = ing.monto.toFixed(2).replace('.', ',') + '$';

            document.getElementById('btn-info-ing-editar').onclick = function () {
                closeModal('modal-info-ingreso');
                editarItem(id, 'ingreso');
            };
            document.getElementById('btn-info-ing-eliminar').onclick = function () {
                closeModal('modal-info-ingreso');
                eliminarItem(id, 'ingreso');
            };

            document.getElementById('modal-info-ingreso').classList.add('active');
        }

        // --- LÓGICA ABUELOS ---
        function guardarAbuelo(e) {
            e.preventDefault();
            const data = {
                id: editId || genId(),
                nombre: document.getElementById('ab-nombre').value,
                cedula: document.getElementById('ab-cedula').value,
                fechaNacimiento: document.getElementById('ab-fecha').value,
                genero: document.getElementById('ab-genero').value,
                familiar: document.getElementById('ab-familiar').value,
                telefono: document.getElementById('ab-telefono').value,
                cuota: parseFloat(document.getElementById('ab-cuota').value)
            };
            editId ? db.abuelos[db.abuelos.findIndex(a => a.id === editId)] = data : db.abuelos.push(data);
            closeModal('modal-abuelo'); saveDB();
        }

        function renderAbuelos() {
            const list = document.getElementById('lista-abuelos'); list.innerHTML = '';
            document.getElementById('total-abuelos').innerText = db.abuelos.length;
            const selectMed = document.getElementById('med-abuelo');
            selectMed.innerHTML = '<option value="">Seleccione...</option>';

            if (db.abuelos.length === 0) return list.innerHTML = '<p class="text-sm">No hay abuelos registrados.</p>';

            let order = document.getElementById('sort-abuelos') ? document.getElementById('sort-abuelos').value : 'alfabetico';
            let listSorted = [...db.abuelos];

            listSorted.sort((a, b) => {
                if (order === 'alfabetico') return a.nombre.localeCompare(b.nombre);
                if (order === 'edad') return calcularEdad(a.fechaNacimiento) - calcularEdad(b.fechaNacimiento);
                if (order === 'genero') return (a.genero || '').localeCompare(b.genero || '');
                if (order === 'cumpleanos') {
                    const mA = a.fechaNacimiento ? a.fechaNacimiento.substring(5) : '99-99';
                    const mB = b.fechaNacimiento ? b.fechaNacimiento.substring(5) : '99-99';
                    return mA.localeCompare(mB);
                }
                return 0;
            });

            listSorted.forEach(a => {
                let iconoGen = a.genero === 'Femenino' ? '🔴' : (a.genero === 'Masculino' ? '🔵' : '👤');

                list.innerHTML += `
                    <div class="card flex-between" style="align-items: center;">
                        <div style="flex:1;">
                            <h3>${iconoGen} ${a.nombre}</h3>
                            <p class="text-sm">Edad: ${calcularEdad(a.fechaNacimiento)} años</p>
                        </div>
                        <button class="btn-icon btn-dots" onclick="abrirInfoAbuelo('${a.id}')">⋮</button>
                    </div>
                `;
                selectMed.innerHTML += `<option value="${a.id}">${a.nombre}</option>`;
            });
        }

        // --- LÓGICA MEDICINAS ---
        function actualizarSugerenciasMedicinas() {
            const select = document.getElementById('med-nombre-select');
            const unicas = [...new Set(db.medicinas.map(m => m.nombre.trim()))].sort();

            select.innerHTML = '<option value="">Seleccione...</option>';
            unicas.forEach(n => { select.innerHTML += `<option value="${n}">${n}</option>`; });
            select.innerHTML += '<option value="NUEVA">➕ Añadir nueva medicina...</option>';
        }

        function checkMedicinaSelect() {
            const select = document.getElementById('med-nombre-select');
            const input = document.getElementById('med-nombre-input');
            if (select.value === 'NUEVA') {
                input.style.display = 'block';
                input.required = true;
            } else {
                input.style.display = 'none';
                input.required = false;
            }
        }

        function guardarMedicina(e) {
            e.preventDefault();
            let nombreMedicina = document.getElementById('med-nombre-select').value;
            if (nombreMedicina === 'NUEVA') {
                nombreMedicina = document.getElementById('med-nombre-input').value;
            }

            const data = {
                id: editId || genId(),
                idAbuelo: document.getElementById('med-abuelo').value,
                nombre: nombreMedicina,
                hora: document.getElementById('med-hora').value
            };
            editId ? db.medicinas[db.medicinas.findIndex(m => m.id === editId)] = data : db.medicinas.push(data);
            closeModal('modal-medicina'); saveDB();
        }

        function renderMedicinas() {
            const list = document.getElementById('lista-medicinas'); list.innerHTML = '';

            const totalUnicas = new Set(db.medicinas.map(m => m.nombre.trim())).size;
            document.getElementById('total-medicinas').innerText = totalUnicas;

            if (db.medicinas.length === 0) return list.innerHTML = '<p class="text-sm">No hay medicinas programadas.</p>';

            const vista = document.getElementById('vista-medicinas') ? document.getElementById('vista-medicinas').value : 'actual';

            if (vista === 'actual') {
                // VISTA: Lista General
                const ordenHorario = { "Mañana": 1, "Tarde": 2, "Noche": 3 };
                let medsOrdenadas = [...db.medicinas].sort((a, b) => {
                    let valA = ordenHorario[a.hora] || 99;
                    let valB = ordenHorario[b.hora] || 99;
                    if (valA === valB) return a.nombre.localeCompare(b.nombre);
                    return valA - valB;
                });

                medsOrdenadas.forEach(m => {
                    const ab = db.abuelos.find(a => a.id === m.idAbuelo);
                    list.innerHTML += `
                        <div class="card flex-between" style="align-items: center;">
                            <div class="flex-center" style="flex:1;">
                                <div class="medicine-time">${m.hora}</div>
                                <div style="margin-left: 10px; flex:1;">
                                    <h3>${m.nombre}</h3>
                                    <p class="text-sm">${ab ? ab.nombre : 'Desconocido'}</p>
                                </div>
                            </div>
                            <button class="btn-icon btn-dots" onclick="abrirInfoMedicina('${m.id}')">⋮</button>
                        </div>
                    `;
                });
            } else if (vista === 'agrupada') {
                // VISTA: Agrupada por Medicinas
                let agrupado = {};
                db.medicinas.forEach(m => {
                    if (!agrupado[m.nombre]) agrupado[m.nombre] = {};
                    if (!agrupado[m.nombre][m.idAbuelo]) agrupado[m.nombre][m.idAbuelo] = [];
                    agrupado[m.nombre][m.idAbuelo].push(m.hora);
                });

                let html = '';
                const nombresMeds = Object.keys(agrupado).sort();
                nombresMeds.forEach(nom => {
                    html += `<div class="card" style="margin-bottom: 1rem;">
                        <h3 style="color:var(--primary-dark); margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem;">💊 ${nom}</h3>
                        <div style="padding-top: 0.2rem;">`;

                    const abuelosMeds = Object.keys(agrupado[nom]);

                    if (abuelosMeds.length === 0) {
                        html += `<p class="text-sm">Sin registros</p>`;
                    } else {
                        let listaAbuelosMed = abuelosMeds.map(idAb => {
                            return { id: idAb, horas: agrupado[nom][idAb] };
                        });

                        listaAbuelosMed.forEach(item => {
                            const ab = db.abuelos.find(a => a.id === item.id);
                            let nombreAbuelo = ab ? ab.nombre : 'Desconocido';

                            const ordenHorario = { "Mañana": 1, "Tarde": 2, "Noche": 3 };
                            item.horas.sort((a, b) => (ordenHorario[a] || 99) - (ordenHorario[b] || 99));
                            const horariosStr = item.horas.join(', ');

                            html += `
                                <div class="flex-between" style="padding: 0.5rem 0; border-bottom: 1px dashed var(--border);">
                                    <div style="flex:1;">
                                        <strong style="font-size: 0.95rem;">${nombreAbuelo}</strong>
                                    </div>
                                    <div class="text-sm" style="color: var(--primary); font-weight: 600; text-align: right; min-width: 80px;">
                                        ${horariosStr}
                                    </div>
                                </div>
                            `;
                        });
                    }
                    html += `</div></div>`;
                });
                list.innerHTML = html;
            } else if (vista === 'franja') {
                // VISTA: Por Franja Horaria
                let agrupadoFranja = { "Mañana": [], "Tarde": [], "Noche": [] };
                db.medicinas.forEach(m => {
                    const ab = db.abuelos.find(a => a.id === m.idAbuelo);
                    const nombreAbuelo = ab ? ab.nombre : 'Desconocido';
                    if (!agrupadoFranja[m.hora]) agrupadoFranja[m.hora] = [];
                    agrupadoFranja[m.hora].push({ medId: m.id, medNombre: m.nombre, abuelo: nombreAbuelo });
                });

                let html = '';
                const periodos = [
                    { id: 'Mañana', icon: '🌅' },
                    { id: 'Tarde', icon: '☀️' },
                    { id: 'Noche', icon: '🌙' }
                ];

                periodos.forEach(p => {
                    const items = agrupadoFranja[p.id];
                    if (items && items.length > 0) {
                        items.sort((a, b) => a.medNombre.localeCompare(b.medNombre));

                        html += `<div class="card" style="margin-bottom: 1rem;">
                            <h3 style="color:var(--primary-dark); margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem;">${p.icon} ${p.id}</h3>
                            <div style="padding-top: 0.2rem;">`;

                        items.forEach(item => {
                            html += `
                                <div class="flex-between" style="padding: 0.5rem 0; border-bottom: 1px dashed var(--border);">
                                    <div style="flex:1;">
                                        <strong style="font-size: 0.95rem;">${item.medNombre}</strong>
                                        <div class="text-sm" style="color: var(--text-light); margin-top: 0.1rem;">${item.abuelo}</div>
                                    </div>
                                    <button class="btn-icon btn-dots" onclick="abrirInfoMedicina('${item.medId}')">⋮</button>
                                </div>
                            `;
                        });
                        html += `</div></div>`;
                    }
                });

                if (html === '') html = '<p class="text-sm" style="text-align:center;">No hay medicinas programadas en franjas conocidas.</p>';
                list.innerHTML = html;
            }
        }

        // --- LÓGICA EMPLEADOS Y GASTOS E INGRESOS ---
        function guardarEmpleado(e) {
            e.preventDefault();
            const data = {
                id: editId || genId(),
                nombre: document.getElementById('emp-nombre').value,
                cedula: document.getElementById('emp-cedula').value,
                telefono: document.getElementById('emp-telefono').value,
                banco: document.getElementById('emp-banco').value,
                rol: document.getElementById('emp-rol').value,
                pagoQuincenal: parseFloat(document.getElementById('emp-pago').value)
            };
            editId ? db.empleados[db.empleados.findIndex(em => em.id === editId)] = data : db.empleados.push(data);
            closeModal('modal-empleado'); saveDB();
        }

        function guardarGasto(e) {
            e.preventDefault();
            const data = {
                id: editId || genId(),
                mes: editId ? db.gastos.find(g => g.id === editId).mes : document.getElementById('mes-control').value,
                fecha: document.getElementById('gas-fecha').value,
                descripcion: document.getElementById('gas-desc').value,
                monto: parseFloat(document.getElementById('gas-monto').value)
            };
            editId ? db.gastos[db.gastos.findIndex(g => g.id === editId)] = data : db.gastos.push(data);
            closeModal('modal-gasto'); saveDB();
        }

        function guardarIngreso(e) {
            e.preventDefault();
            const data = {
                id: editId || genId(),
                mes: editId ? db.ingresos.find(g => g.id === editId).mes : document.getElementById('mes-control').value,
                fecha: document.getElementById('ing-fecha').value,
                descripcion: document.getElementById('ing-desc').value,
                monto: parseFloat(document.getElementById('ing-monto').value)
            };
            editId ? db.ingresos[db.ingresos.findIndex(g => g.id === editId)] = data : db.ingresos.push(data);
            closeModal('modal-ingreso'); saveDB();
        }

        // --- APORTES ---
        function abrirModalAporte(idAbuelo, deuda) {
            document.getElementById('form-aporte').reset();
            document.getElementById('aporte-id-abuelo').value = idAbuelo;
            document.getElementById('aporte-fecha').value = hoyIso;

            aporteFaltaActual = deuda > 0 ? deuda : 0;
            const selectTipo = document.getElementById('aporte-tipo');
            selectTipo.value = deuda > 0 ? 'completo' : 'fraccionado';
            cambiarTipoAporte();

            document.getElementById('modal-aporte').classList.add('active');
        }

        function cambiarTipoAporte() {
            const tipo = document.getElementById('aporte-tipo').value;
            const inputMonto = document.getElementById('aporte-monto');

            if (tipo === 'completo') {
                inputMonto.value = aporteFaltaActual.toFixed(2);
                inputMonto.readOnly = true;
            } else {
                inputMonto.value = '';
                inputMonto.readOnly = false;
            }
        }

        function guardarAporte(e) {
            e.preventDefault();
            db.aportes.push({
                id: genId(),
                idAbuelo: document.getElementById('aporte-id-abuelo').value,
                mes: document.getElementById('mes-control').value,
                fecha: document.getElementById('aporte-fecha').value,
                monto: parseFloat(document.getElementById('aporte-monto').value)
            });
            closeModal('modal-aporte'); saveDB();
        }

        function eliminarAporteFraccionado(id) {
            if (confirm("¿Eliminar este pago?")) {
                db.aportes = db.aportes.filter(ap => ap.id !== id);
                saveDB();
            }
        }

        // --- RENDER FINANZAS ---
        function renderFinanzas() {
            const mesControl = document.getElementById('mes-control').value;
            let totalIngresos = 0; let totalEgresos = 0;
            let totalFaltaAportes = 0; let totalNominaMensual = 0;
            let totalGastosMensual = 0;

            // 1. Aportes
            const listAportes = document.getElementById('lista-aportes'); listAportes.innerHTML = '';
            //if(db.abuelos.length === 0) listAportes.innerHTML = '<p class="text-sm">Agregue abuelos.</p>';

            db.abuelos.forEach(a => {
                if (Number(a.cuota) === 0) return;
                const pagos = db.aportes.filter(ap => ap.idAbuelo === a.id && ap.mes === mesControl);
                const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
                const falta = a.cuota - totalPagado;

                totalIngresos += totalPagado;
                if (falta > 0) totalFaltaAportes += falta;

                let badge = '';
                if (falta <= 0) {
                    badge = `<span class="badge badge-success badge-fixed clickable" onclick="abrirModalAporte('${a.id}', ${falta})">Aporte: ${totalPagado.toFixed(2).replace('.', ',')}$</span>`;
                } else {
                    badge = `<span class="badge badge-warning badge-fixed clickable" onclick="abrirModalAporte('${a.id}', ${falta})">Falta ${falta.toFixed(2).replace('.', ',')}$</span>`;
                }

                let htmlPagos = pagos.map(p => `
                    <div class="pago-item">
                        <span>📅 ${formatoFecha(p.fecha)}: <strong>${p.monto.toFixed(2).replace('.', ',')}$</strong></span>
                        <button onclick="eliminarAporteFraccionado('${p.id}')">✕</button>
                    </div>
                `).join('');

                listAportes.innerHTML += `
                    <div class="list-item">
                        <div class="flex-between">
                            <div style="flex:1;">
                                <strong>${a.nombre}</strong>
                                <p class="text-sm">Aporte: ${a.cuota.toFixed(2).replace('.', ',')}$</p>
                            </div>
                            <div style="text-align: right;"><div>${badge}</div></div>
                        </div>
                        ${pagos.length > 0 ? `<div class="lista-pagos text-sm">${htmlPagos}</div>` : ''}
                    </div>
                `;
            });

            document.getElementById('total-aportado').innerText = totalIngresos.toFixed(2).replace('.', ',');
            document.getElementById('total-falta-aportes').innerText = totalFaltaAportes.toFixed(2).replace('.', ',');

            // 1.5 Otros Ingresos
            const listIngresos = document.getElementById('lista-ingresos'); listIngresos.innerHTML = '';
            const ingresosMes = db.ingresos.filter(g => g.mes === mesControl);
            let totalOtrosIngresos = 0;
            ingresosMes.forEach(g => {
                totalIngresos += g.monto;
                totalOtrosIngresos += g.monto;
                listIngresos.innerHTML += `
                    <div class="list-item flex-between" style="align-items: center;">
                        <div style="flex:1;">
                            <strong>${g.descripcion}</strong>
                            <p class="text-sm">📅 ${formatoFecha(g.fecha)} | Ingreso: ${g.monto.toFixed(2).replace('.', ',')}$</p>
                        </div>
                        <button class="btn-icon btn-dots" onclick="abrirInfoIngreso('${g.id}')">⋮</button>
                    </div>
                `;
            });

            document.getElementById('total-ingresos-mes').innerText = totalOtrosIngresos.toFixed(2).replace('.', ',');
            //if(ingresosMes.length === 0) listIngresos.innerHTML = '<p class="text-sm">Sin otros ingresos en este mes.</p>';


            // 2. Personal (Empleados)
            const listEmpleados = document.getElementById('lista-empleados'); listEmpleados.innerHTML = '';
            db.empleados.forEach(em => {
                const pagoMensual = em.pagoQuincenal * 2;
                totalEgresos += pagoMensual;
                totalNominaMensual += pagoMensual;

                listEmpleados.innerHTML += `
                    <div class="list-item flex-between" style="align-items: center;">
                        <div style="flex:1;">
                            <strong>${em.nombre}</strong>
                            <p class="text-sm" style="text-transform: uppercase; margin: 0.1rem 0; font-weight: bold;">${em.rol}</p>
                            <p class="text-sm">Quincena: ${em.pagoQuincenal.toFixed(2).replace('.', ',')}$ | Mes: ${pagoMensual.toFixed(2).replace('.', ',')}$</p>
                        </div>
                        <button class="btn-icon btn-dots" onclick="abrirInfoEmpleado('${em.id}')">⋮</button>
                    </div>
                `;
            });

            document.getElementById('total-nomina-mes').innerText = totalNominaMensual.toFixed(2).replace('.', ',');

            // 3. Gastos
            const listGastos = document.getElementById('lista-gastos'); listGastos.innerHTML = '';
            const gastosMes = db.gastos.filter(g => g.mes === mesControl);
            gastosMes.forEach(g => {
                totalEgresos += g.monto;
                totalGastosMensual += g.monto;
                listGastos.innerHTML += `
                    <div class="list-item flex-between" style="align-items: center;">
                        <div style="flex:1;">
                            <strong>${g.descripcion}</strong>
                            <p class="text-sm">📅 ${formatoFecha(g.fecha)} | Gasto: ${g.monto.toFixed(2).replace('.', ',')}$</p>
                        </div>
                        <button class="btn-icon btn-dots" onclick="abrirInfoGasto('${g.id}')">⋮</button>
                    </div>
                `;
            });

            document.getElementById('total-gastos-mes').innerText = totalGastosMensual.toFixed(2).replace('.', ',');
            //if(gastosMes.length === 0) listGastos.innerHTML = '<p class="text-sm">Sin gastos en este mes.</p>';

            // 4. Balance Final
            const balance = totalIngresos - totalEgresos;
            document.getElementById('balance-total').innerText = `${balance.toFixed(2).replace('.', ',')}$`;
            document.getElementById('balance-ingresos').innerText = `${totalIngresos.toFixed(2).replace('.', ',')}$`;
            document.getElementById('balance-gastos').innerText = `${totalEgresos.toFixed(2).replace('.', ',')}$`;
            const box = document.getElementById('caja-balance');
            box.style.background = balance < 0 ? 'var(--danger)' : (balance > 0 ? 'var(--success)' : 'var(--primary)');

            // Igualar ancho de las etiquetas de finanzas (omitiendo las que ya tienen ancho fijo)
            setTimeout(() => {
                const badges = document.querySelectorAll('#tab-finanzas .badge:not(.badge-fixed)');
                badges.forEach(b => b.style.width = 'auto'); // Reset para medir el ancho natural
                let maxW = 0;
                badges.forEach(b => {
                    const rect = b.getBoundingClientRect();
                    if (rect.width > maxW) maxW = rect.width;
                });
                if (maxW > 0) {
                    badges.forEach(b => b.style.width = Math.ceil(maxW) + 'px');
                }
            }, 0);
        }

        function renderAll() { renderAbuelos(); renderMedicinas(); renderFinanzas(); }
        renderAll();

// --- LOGICA DE INSTALACION PWA ---
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const closeBannerBtn = document.getElementById('pwa-close-banner');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir minimodal por defecto en m�viles
    e.preventDefault();
    // Guardar el evento para dispararlo luego
    deferredPrompt = e;
    // Mostrar nuestro banner custom
    installBanner.classList.add('show');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Usuario acept� instalar la PWA');
        } else {
            console.log('Usuario rechaz� instalar la PWA');
        }
        deferredPrompt = null;
        installBanner.classList.remove('show');
    }
});

closeBannerBtn.addEventListener('click', () => {
    installBanner.classList.remove('show');
});
