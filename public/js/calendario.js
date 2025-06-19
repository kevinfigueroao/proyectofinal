const apiUrl = "/api";


let reservas = [];
let reservasPorId = {};
let calendar = null;
let sucursales = [];
let sucursalActualId = null;

if (!sessionStorage.getItem('token')) window.location.href = 'login.html';

document.getElementById('btnLogout').onclick = function () {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
};

function obtenerUsuarioActual() {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        if (decoded.exp && (Date.now() / 1000) > decoded.exp) {
            sessionStorage.removeItem('token');
            return null;
        }
        return decoded;
    } catch (e) {
        return null;
    }
}

function actualizarTituloCalendario(nombreSucursal) {
    document.getElementById('tituloCalendario').textContent = `Calendario de ${nombreSucursal}`;
}

async function fetchSucursales() {
    const token = sessionStorage.getItem('token');
    const res = await fetch(apiUrl + "/catalogos/sucursales", {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    sucursales = await res.json();
    const select = document.getElementById('sucursalFiltro');
    select.innerHTML = '<option value="">Seleccione...</option>' +
        sucursales.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
}

async function fetchReservas(sucursalId) {
    const token = sessionStorage.getItem('token');
    const res = await fetch(apiUrl + '/reservas', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    if (res.status === 401) {
        alert("Tu sesión ha expirado. Debes iniciar sesión nuevamente.");
        sessionStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    reservas = data.filter(r => String(r.sucursalId) === String(sucursalId));
    reservasPorId = {};
    for (const r of reservas) reservasPorId[r.id] = r;
}

// Buscador de reservas por RUT, nombre trabajador o empresa
document.getElementById('buscadorReservas').addEventListener('input', function () {
    const filtro = this.value.trim().toLowerCase();
    let filtradas = reservas;

    if (filtro.length > 0) {
        filtradas = reservas.filter(r => {
            // Buscar en empresa
            const empresaNombre = r.empresa?.nombre?.toLowerCase() || '';
            const empresaRut = r.empresa?.rut?.toLowerCase() || '';
            // Buscar en todos los trabajadores
            const trabajadores = (r.reservasTrabajador || []).map(rt => ({
                nombre: rt.trabajador?.nombre?.toLowerCase() || '',
                rut: rt.trabajador?.rutPasaporte?.toLowerCase() || ''
            }));
            // Si coincide con empresa
            if (empresaNombre.includes(filtro) || empresaRut.includes(filtro)) return true;
            // Si coincide con algún trabajador
            for (const t of trabajadores) {
                if (t.nombre.includes(filtro) || t.rut.includes(filtro)) return true;
            }
            return false;
        });
    }

    // Renderiza el calendario solo con las reservas filtradas
    renderCalendarFiltrado(filtradas);
});

// Versión de render solo con el listado filtrado
function renderCalendarFiltrado(lista) {
    const eventos = lista.map(r => ({
        id: String(r.id),
        title: (r.tipoReserva === 'empresa' && r.empresa?.nombre) ?
            r.empresa.nombre :
            (r.tipoReserva === 'particular' && r.reservasTrabajador?.[0]?.trabajador?.nombre) ?
                r.reservasTrabajador[0].trabajador.nombre :
                'Reserva',
        start: r.fechaHora,
        classNames: [classReserva(r)]
    }));

    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';

    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: 'dayGridMonth',
        events: eventos,
        eventClick: function (info) {
            mostrarDetalleReserva(reservasPorId[info.event.id]);
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        buttonText: {
            today: 'hoy',
            month: 'mes',
            week: 'semana',
            list: 'lista'
        },
        eventDidMount: function (info) {
            info.el.title = "Click para ver detalle";
        }
    });
    calendar.render();
}


function classReserva(reserva) {
    if (reserva.estado === 'completado') return 'fc-event-completado';
    if (reserva.estado === 'cancelado' || reserva.estado === 'cancelada') return 'fc-event-cancelado';
    return 'fc-event-pendiente';
}

function renderCalendar(sucursalId, nombreSucursal) {
    sucursalActualId = sucursalId;
    const eventos = reservas.map(r => ({
        id: String(r.id),
        title: (r.tipoReserva === 'empresa' && r.empresa?.nombre) ?
            r.empresa.nombre :
            (r.tipoReserva === 'particular' && r.reservasTrabajador?.[0]?.trabajador?.nombre) ?
                r.reservasTrabajador[0].trabajador.nombre :
                'Reserva',
        start: r.fechaHora,
        classNames: [classReserva(r)]
    }));

    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';

    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: 'dayGridMonth',
        events: eventos,
        eventClick: function (info) {
            mostrarDetalleReserva(reservasPorId[info.event.id]);
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        buttonText: {
            today: 'hoy',
            month: 'mes',
            week: 'semana',
            list: 'lista'
        },
        eventDidMount: function (info) {
            info.el.title = "Click para ver detalle";
        }
    });

    calendar.render();
    actualizarTituloCalendario(nombreSucursal);
}

function mostrarDetalleReserva(reserva) {
    let html = `<h3>Reserva #${reserva.id}</h3>
    <b>Tipo:</b> ${reserva.tipoReserva}<br>
    <b>Sucursal:</b> ${reserva.sucursal?.nombre || ''}<br>
    <b>Fecha:</b> ${new Date(reserva.fechaHora).toLocaleString()}<br>
    <hr>`;

    if (reserva.tipoReserva === 'empresa') {
        html += `<b>Trabajadores:</b>
<ul style="padding-left:1.2em;">
${(reserva.reservasTrabajador || []).map(rt => {
            // Badge de estado
            let badge = '';
            if (rt.estado === 'asistio') {
                badge = '<span class="badge bg-success ms-2" style="font-size:0.98em;">Asistió</span>';
            } else if (rt.estado === 'no asistio') {
                badge = '<span class="badge bg-naranja ms-2" style="font-size:0.98em;">No asistió</span>';
            } else if (rt.estado === 'cancelado') {
                badge = '<span class="badge bg-danger ms-2" style="font-size:0.98em;">Cancelado</span>';
            } else if (rt.estado === 'reagendado') {
                badge = '<span class="badge bg-info ms-2" style="font-size:0.98em;">Reagendado</span>';
            } else {
                badge = '<span class="badge bg-secondary ms-2" style="font-size:0.98em;">Pendiente</span>';
            }

            // Botones (asistencia/cancelar solo si está pendiente)
            let botones = '';
            const soloUnTrabajador = (reserva.reservasTrabajador.length === 1);

            if (rt.estado === "pendiente" && !soloUnTrabajador && reserva.estado !== "cancelada" && reserva.estado !== "completado") {
                botones += `
        <button class="btn btn-sm btn-outline-success ms-2" onclick="marcarAsistencia(${reserva.id},${rt.trabajadorId},this)">
          <span style="font-size:1em;"><b>✔</b></span> Marcar asistencia
        </button>
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="cancelarTrabajador(${reserva.id},${rt.trabajadorId},this)">
          <span style="font-size:1em;"><b>🗑️</b></span> Cancelar trabajador
        </button>
      `;
            } else if (rt.estado === "pendiente" && soloUnTrabajador && reserva.estado !== "cancelada" && reserva.estado !== "completado") {
                botones += `
        <button class="btn btn-sm btn-outline-success ms-2" onclick="marcarAsistencia(${reserva.id},${rt.trabajadorId},this)">
          <span style="font-size:1em;"><b>✔</b></span> Marcar asistencia
        </button>
      `;
            }

            // Botón reagendar trabajador (siempre mostrar si no está completado/cancelado)
            let btnReagendar = '';
            if (
                (rt.estado === "pendiente" || rt.estado === "no asistio" || rt.estado === "cancelado") &&
                reserva.estado !== "cancelada" && reserva.estado !== "completado"
            ) {
                btnReagendar = `
        <button class="btn btn-sm btn-outline-warning ms-2" onclick="abrirModalReagendar(${reserva.id},${rt.trabajadorId})">
          <span style="font-size:1em;"><b>↻</b></span> Reagendar
        </button>
      `;
            }

            // Botón modificar (siempre)
            let btnModificar = `
      <button class="btn btn-sm btn-outline-primary ms-2" onclick="modificarReserva(${reserva.id})">
        <span style="font-size:1em;"><b>✏️</b></span> Modificar
      </button>
    `;

            return (
                `<li style="margin-bottom:7px;">
        <b>Nombre:</b> ${rt.trabajador?.nombre || ''} -
        <b>RUT/Pasaporte:</b> ${rt.trabajador?.rutPasaporte || ''} -
        <b>Cargo:</b> ${rt.cargo}
        <b>Edad:</b> ${rt.edad}
        ${badge}
        ${botones}
        ${btnReagendar}        
      </li>`
            );
        }).join('')
            }
</ul>
<hr>`;
    }


    if (reserva.tipoReserva === 'particular') {
        const t = reserva.reservasTrabajador && reserva.reservasTrabajador[0];
        html += `<b>Datos:</b><br>`;
        if (t) {
            let badge = '';
            if (t.estado === 'asistio') {
                badge = '<span class="badge bg-success ms-2" style="font-size:0.98em;">Asistió</span>';
            } else if (t.estado === 'no asistio') {
                badge = '<span class="badge bg-naranja ms-2" style="font-size:0.98em;">No asistió</span>';
            } else if (t.estado === 'cancelado') {
                badge = '<span class="badge bg-danger ms-2" style="font-size:0.98em;">Cancelado</span>';
            } else if (t.estado === 'reagendado') {
                badge = '<span class="badge bg-info ms-2" style="font-size:0.98em;">Reagendado</span>';
            } else {
                badge = '<span class="badge bg-secondary ms-2" style="font-size:0.98em;">Pendiente</span>';
            }

            let btnAsistencia = '';
            if (
                t.estado === 'pendiente' &&
                reserva.estado !== 'cancelada' &&
                reserva.estado !== 'completado'
            ) {
                btnAsistencia = `
                        <button class="btn btn-sm btn-outline-success ms-2" onclick="marcarAsistencia(${reserva.id},${t.trabajadorId},this)">
                            <span style="font-size:1em;"><b>✔</b></span> Marcar asistencia
                        </button>
                    `;
            }

            let btnReagendar = '';
            if (
                (t.estado === "pendiente" || t.estado === "no asistio" || t.estado === "cancelado") &&
                reserva.estado !== "cancelada" && reserva.estado !== "completado"
            ) {
                btnReagendar = `
                    <button class="btn btn-sm btn-outline-warning ms-2" onclick="abrirModalReagendar(${reserva.id},${t.trabajadorId})">
                      <span style="font-size:1em;"><b>↻</b></span> Reagendar
                    </button>
                  `;
            }

            let btnModificar = `
                    <button class="btn btn-sm btn-outline-primary ms-2" onclick="modificarReserva(${reserva.id})">
                        <span style="font-size:1em;"><b>✏️</b></span> Modificar
                    </button>
                `;

            html += `
                    <strong>Nombre:</strong> ${t.trabajador?.nombre ?? ''}<br>
                    <strong>RUT/Pasaporte:</strong> ${t.trabajador?.rutPasaporte ?? ''}<br>
                    <strong>Edad:</strong> ${t.edad ?? '-'}<br>
                    <strong>Cargo:</strong> ${t.cargo ?? '-'}<br>
                    ${t.correo ? '<strong>Correo:</strong> ' + t.correo + '<br>' : ''}
                    ${badge}
                    ${btnAsistencia}                    
                   
                `;
        }
        html += `<hr>`;
    }


    html += `<b>Estado de la reserva:</b> <span style="font-weight:bold;color:#222;">${reserva.estado}</span>`;

    if (reserva.tipoReserva === 'empresa') {
        html += `<hr>
        <strong>Empresa:</strong> ${reserva.empresa?.nombre || '-'}<br>
        <strong>RUT:</strong> ${reserva.empresa?.rut || '-'}<br>
        <strong>Dirección:</strong> ${reserva.empresa?.direccion || '-'}<br>
        <strong>Giro:</strong> ${reserva.empresa?.giro || '-'}<br><br>
        <strong>Solicitante:</strong> ${reserva.solicitante?.nombre || '-'}<br>
        <strong>Cargo:</strong> ${reserva.solicitante?.cargo || '-'}<br>
        <strong>Teléfono:</strong> ${reserva.solicitante?.telefono || '-'}<br>
        <strong>Correo:</strong> ${reserva.solicitante?.correo || '-'}<br><br>
        `;
    }
    if (reserva.bateriasMedicas?.length) {
        html += `<br><strong>Baterías Médicas:</strong> ${reserva.bateriasMedicas.map(b => b.nombre).join(', ')}`;
    }
    if (reserva.examenesAdicionales?.length) {
        html += `<br><strong>Exámenes Adicionales:</strong> ${reserva.examenesAdicionales.map(e => e.nombre).join(', ')}`;
    }
    if (reserva.pruebasDrogas?.length) {
        html += `<br><strong>Pruebas de Drogas:</strong> ${reserva.pruebasDrogas.map(p => p.nombre).join(', ')}`;
    }



    // Agrega los botones solo si NO está completada ni cancelada
    if (reserva.estado !== "completado" && reserva.estado !== "cancelado" && reserva.estado !== "cancelada") {
        html += `
           <div style="margin-top:18px;" class="d-flex justify-content-end gap-2">
    <a class="btn btn-outline-primary" href="editar-reserva.html?id=${reserva.id}">
        ✏️ Modificar
    </a>
    <button class="btn btn-outline-warning" onclick="abrirModalReagendar(${reserva.id})">
        ↻ Reagendar reserva
    </button>
    <button class="btn btn-outline-danger" onclick="cancelarReserva(${reserva.id})">
        🗑️ Cancelar
    </button>
</div>

        `;
    }


    document.getElementById('modalDetalleBody').innerHTML = html;
    document.getElementById('modalReserva').style.display = "block";
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('cerrarModalReserva').onclick = function () {
        document.getElementById('modalReserva').style.display = "none";
    };
});

async function cancelarReserva(reservaId) {
    if (!confirm("¿Estás seguro que deseas cancelar esta reserva?")) return;
    const token = sessionStorage.getItem('token');
    const res = await fetch(`${apiUrl}/reservas/${reservaId}/cancelar`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    if (res.ok) {
        alert("Reserva cancelada correctamente.");
        document.getElementById('modalReserva').style.display = "none";
        await fetchReservas(sucursalActualId);
        const nombreSucursal = sucursales.find(s => String(s.id) === String(sucursalActualId))?.nombre || '';
        renderCalendar(sucursalActualId, nombreSucursal);
    } else {
        alert("No se pudo cancelar la reserva.");
    }
}
window.cancelarReserva = cancelarReserva;


function abrirModalReagendar(reservaId, trabajadorId = null) {
    let html = `
        <h4>Reagendar ${trabajadorId ? "trabajador" : "reserva completa"}</h4>
        <label>Nueva fecha y hora:</label>
        <input type="text" id="nuevaFechaHoraReagendar" class="form-control mb-2" readonly>
        <button class="btn btn-success" onclick="confirmarReagendar(${reservaId}, ${trabajadorId !== null ? trabajadorId : 'null'})">Confirmar</button>
        <button class="btn btn-secondary ms-2" onclick="cerrarModalEditarReserva()">Cancelar</button>
    `;
    document.getElementById('modalEditarBody').innerHTML = html;
    document.getElementById('modalEditarReserva').style.display = "block";
    setTimeout(() => {
        flatpickr("#nuevaFechaHoraReagendar", {
            enableTime: true,
            time_24hr: true,
            minDate: "today",
            dateFormat: "Y-m-d H:i",
            minTime: "07:30",
            maxTime: "17:00",
            minuteIncrement: 30,
            // Elimina esto si NO quieres bloquear fines de semana
            disable: [date => (date.getDay() === 0 || date.getDay() === 6)],
            position: "auto center"
        });
    }, 100);
}
window.abrirModalReagendar = abrirModalReagendar;


function cerrarModalEditarReserva() {
    document.getElementById('modalEditarReserva').style.display = "none";
}
window.cerrarModalEditarReserva = cerrarModalEditarReserva;





async function confirmarReagendar(reservaId, trabajadorId) {
    const nuevaFechaHora = document.getElementById('nuevaFechaHoraReagendar').value;
    if (!nuevaFechaHora) return alert('Debes seleccionar una nueva fecha y hora.');
    const token = sessionStorage.getItem('token');
    let url, body;
    if (trabajadorId && trabajadorId !== 'null') {
        url = `/api/reservas/${reservaId}/trabajadores/${trabajadorId}/reagendar`;
        body = JSON.stringify({ nuevaFechaHora });
    } else {
        url = `/api/reservas/${reservaId}/reagendar`;
        body = JSON.stringify({ nuevaFechaHora });
    }
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body
    });
    if (res.ok) {
        alert("Reagendamiento realizado correctamente.");
        cerrarModalEditarReserva();

        // 👇 **AQUÍ refresca el detalle de la reserva y vuelve a abrir el modal**
        const detalle = await fetch(`${apiUrl}/reservas/${reservaId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(r => r.json());
        mostrarDetalleReserva(detalle);

        // 👇 Además refresca reservas y calendario
        await fetchReservas(sucursalActualId);
        const nombreSucursal = sucursales.find(s => String(s.id) === String(sucursalActualId))?.nombre || '';
        renderCalendar(sucursalActualId, nombreSucursal);
    } else {
        alert("No se pudo reagendar.");
    }
}

window.confirmarReagendar = confirmarReagendar;


document.getElementById('cerrarModalEditarReserva').onclick = function () {
    document.getElementById('modalEditarReserva').style.display = "none";
};

function abrirModalExportar() {
    document.getElementById('modalExportar').style.display = "block";
}

function cerrarModalExportar() {
    document.getElementById('modalExportar').style.display = "none";
}

async function exportarExcel() {
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;
    const token = sessionStorage.getItem('token');

    if (!desde || !hasta) {
        alert("Selecciona un rango de fechas.");
        return;
    }

    const url = `${apiUrl}/exportar?desde=${desde}&hasta=${hasta}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reservas.xlsx';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    // Adjuntar token de autenticación usando fetch para obtener el blob
    const res = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    if (!res.ok) {
        alert("Error al exportar. Verifica tus permisos o el rango de fechas.");
        return;
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);


    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';

    cerrarModalExportar();
}


async function marcarAsistencia(reservaId, trabajadorId, btn) {


    const token = sessionStorage.getItem('token');
    const res = await fetch(`${apiUrl}/reservas/${reservaId}/trabajadores/${trabajadorId}/asistio`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    if (res.ok) {
        btn.outerHTML = '<span class="badge bg-success ms-2">Asistió</span>';
        const detalle = await fetch(`${apiUrl}/reservas/${reservaId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(r => r.json());
        mostrarDetalleReserva(detalle);
        await fetchReservas(sucursalActualId);
        const nombreSucursal = sucursales.find(s => String(s.id) === String(sucursalActualId))?.nombre || '';
        renderCalendar(sucursalActualId, nombreSucursal);
    }
}
window.marcarAsistencia = marcarAsistencia;

async function cancelarTrabajador(reservaId, trabajadorId, btn) {
    if (!confirm("¿Seguro que deseas cancelar solo a este trabajador?")) return;
    const token = sessionStorage.getItem('token');
    const res = await fetch(`${apiUrl}/reservas/${reservaId}/trabajadores/${trabajadorId}/cancelar`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    if (res.ok) {
        btn.outerHTML = '<span class="badge bg-danger ms-2">Cancelado</span>';
        const detalle = await fetch(`${apiUrl}/reservas/${reservaId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(r => r.json());
        mostrarDetalleReserva(detalle);
        await fetchReservas(sucursalActualId);
        const nombreSucursal = sucursales.find(s => String(s.id) === String(sucursalActualId))?.nombre || '';
        renderCalendar(sucursalActualId, nombreSucursal);
    } else {
        alert("No se pudo cancelar el trabajador.");
    }
}
window.cancelarTrabajador = cancelarTrabajador;


document.addEventListener('DOMContentLoaded', async function () {
    const user = obtenerUsuarioActual();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    await fetchSucursales();

    if (user.rol === 'admin') {
        document.getElementById('filtroSucursalBarra').style.display = '';
        document.getElementById('verCalendarioBtn').addEventListener('click', async () => {
            const sucursalId = document.getElementById('sucursalFiltro').value;
            if (!sucursalId) {
                alert("Selecciona una sucursal para ver el calendario.");
                return;
            }
            const sucursalNombre = document.getElementById('sucursalFiltro').selectedOptions[0].textContent;
            await fetchReservas(sucursalId);
            renderCalendar(sucursalId, sucursalNombre);
        });
    } else {
        const sucursalId = user.sucursalId;
        const sucursal = sucursales.find(s => String(s.id) === String(sucursalId));
        const nombreSucursal = sucursal ? sucursal.nombre : 'Sucursal';
        await fetchReservas(sucursalId);
        renderCalendar(sucursalId, nombreSucursal);
    }
});

