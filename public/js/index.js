const apiUrl = 'http://localhost:3000/api';

// Cargar catálogos
async function fetchCatalogos() {
    const [suc, bat, exa, pru] = await Promise.all([
        fetch(`${apiUrl}/catalogos/sucursales`).then(r => r.json()),
        fetch(`${apiUrl}/catalogos/baterias`).then(r => r.json()),
        fetch(`${apiUrl}/catalogos/examenes`).then(r => r.json()),
        fetch(`${apiUrl}/catalogos/pruebas`).then(r => r.json())
    ]);
    document.getElementById('sucursalId').innerHTML = suc.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');
    const mkCheckboxes = (id, items, name) => {
        document.getElementById(id).innerHTML = items.map(i =>
            `<div class="form-check col-md-6"><input class="form-check-input" type="checkbox" name="${name}" value="${i.id}" id="${name}_${i.id}">
            <label class="form-check-label" for="${name}_${i.id}">${i.nombre}</label></div>`
        ).join('');
    };
    mkCheckboxes('bateriasList', bat, 'bateriaMedicaIds');
    mkCheckboxes('examenesList', exa, 'examenAdicionalIds');
    mkCheckboxes('pruebasList', pru, 'pruebaDrogasIds');
}

function generarHoras() {
    const horaInicio = 7 * 60 + 30; // 7:30 en minutos
    const horaFin = 17 * 60; // 17:00 en minutos
    const select = document.getElementById('horaReserva');
    select.innerHTML = '';
    for (let min = horaInicio; min <= horaFin; min += 30) {
        const h = String(Math.floor(min / 60)).padStart(2, '0');
        const m = String(min % 60).padStart(2, '0');
        select.innerHTML += `<option value="${h}:${m}">${h}:${m}</option>`;
    }
}

function configurarFecha() {
    const fechaInput = document.getElementById('fechaReserva');
    const hoy = new Date();
    fechaInput.min = hoy.toISOString().split('T')[0];
    fechaInput.addEventListener('change', function () {
        // SOLO VALIDAR SI HAY UN VALOR CORRECTO
        if (this.value) {
            // yyyy-mm-dd
            const [anio, mes, dia] = this.value.split('-');
            if (anio && mes && dia) {
                // Usar Date en local (sin zona UTC porque aquí sí es confiable para fechas sin hora)
                const fecha = new Date(anio, mes - 1, dia);
                const diaSemana = fecha.getDay();
                if (diaSemana === 0 || diaSemana === 6) {
                    alert("No se pueden seleccionar sábados ni domingos.");
                    this.value = '';
                }
            }
        }
    });
}


// Buscar empresa por RUT y autocompletar
document.getElementById('buscarEmpresaBtn').addEventListener('click', async function () {
    const rut = document.getElementById('empRUT').value.trim();
    if (!rut) {
        alert("Ingrese un RUT para buscar");
        return;
    }
    try {
        const res = await fetch(`${apiUrl}/empresas/buscar?rut=${encodeURIComponent(rut)}`);
        if (res.ok) {
            const empresa = await res.json();
            if (empresa && empresa.nombre) {
                document.getElementById('empNombre').value = empresa.nombre;
                document.getElementById('empDireccion').value = empresa.direccion;
                document.getElementById('empGiro').value = empresa.giro;
            } else {
                alert("Empresa no encontrada");
                document.getElementById('empNombre').value = '';
                document.getElementById('empDireccion').value = '';
                document.getElementById('empGiro').value = '';
            }
        } else {
            alert("Empresa no encontrada");
            document.getElementById('empNombre').value = '';
            document.getElementById('empDireccion').value = '';
            document.getElementById('empGiro').value = '';
        }
    } catch (error) {
        alert("Error buscando empresa");
    }
});

// Trabajadores Dinámicos (Empresa)
function createTrabajadorRow() {
    const row = document.createElement('div');
    row.className = 'row row-trabajador align-items-end g-2';
    row.innerHTML = `
          <div class="col"><input type="text" class="form-control" placeholder="Nombre" required></div>
          <div class="col"><input type="text" class="form-control" placeholder="RUT/Pasaporte" required></div>
          <div class="col"><input type="number" class="form-control" placeholder="Edad" min="0" required></div>
          <div class="col"><input type="text" class="form-control" placeholder="Cargo" required></div>
          <div class="col-auto d-flex align-items-center">
            <button type="button" class="btn btn-danger remove-btn" style="height:38px; width:100%;">-</button>
          </div>
        `;
    row.querySelector('.remove-btn').onclick = function () {
        const container = document.getElementById('trabajadoresContainer');
        if (container.children.length > 1) row.remove();
    };
    return row;
}

function toggleSections() {
    const tipo = document.getElementById('tipoReserva').value;
    document.getElementById('empresaFieldset').style.display = (tipo === 'empresa') ? 'block' : 'none';
    document.getElementById('trabajadoresFieldsetEmpresa').style.display = (tipo === 'empresa') ? 'block' : 'none';
    document.getElementById('trabajadorFieldsetParticular').classList.toggle('d-none', tipo !== 'particular');
    const container = document.getElementById('trabajadoresContainer');
    container.innerHTML = '';
    if (tipo === 'empresa' && container.children.length === 0) {
        container.appendChild(createTrabajadorRow());
    }
    const inputCorreo = document.getElementById('trabCorreo');
    if (tipo === 'particular') {
        inputCorreo.setAttribute('required', 'required');
    } else {
        inputCorreo.removeAttribute('required');
    }
}

document.getElementById('tipoReserva').addEventListener('change', toggleSections);
document.getElementById('addTrabajadorBtn').addEventListener('click', () => {
    document.getElementById('trabajadoresContainer').appendChild(createTrabajadorRow());
});

// Validación y envío del formulario
document.getElementById('reservaForm').addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true; // Bloquear para evitar múltiples envíos

    const tipo = document.getElementById('tipoReserva').value;
    const getValue = id => document.getElementById(id).value.trim();

    // Validaciones generales (todos obligatorios menos exámenes y drogas)
    if (!getValue('sucursalId') || !getValue('fechaReserva') || !getValue('horaReserva')) {
        alert("Debes completar todos los campos obligatorios.");
        submitBtn.disabled = false;
        return;
    }

    // Validación de baterías médicas seleccionadas
    const getChecked = name => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => Number(i.value));
    const bateriasSeleccionadas = getChecked('bateriaMedicaIds');
    if (bateriasSeleccionadas.length === 0) {
        alert("Debes seleccionar al menos una batería médica.");
        submitBtn.disabled = false;
        return;
    }

    if (tipo === 'empresa') {
        // Valida empresa
        if (!getValue('empRUT') || !getValue('empNombre') || !getValue('empDireccion') || !getValue('empGiro')) {
            alert("Debes completar todos los datos de la empresa.");
            submitBtn.disabled = false;
            return;
        }
        // Valida solicitante
        if (!getValue('solNombre') || !getValue('solCargo') || !getValue('solTelefono') || !getValue('solCorreo')) {
            alert("Debes completar todos los datos del solicitante.");
            submitBtn.disabled = false;
            return;
        }
        // Valida al menos un trabajador
        const rows = document.querySelectorAll('#trabajadoresContainer .row');
        if (rows.length === 0) {
            alert("Debes agregar al menos un trabajador.");
            submitBtn.disabled = false;
            return;
        }
        let errorTrab = false;
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (![0, 1, 2, 3].every(i => inputs[i] && inputs[i].value.trim())) errorTrab = true;
        });
        if (errorTrab) {
            alert("Debes completar todos los datos de los trabajadores.");
            submitBtn.disabled = false;
            return;
        }
    } else {
        // Validar todos los campos de particular
        if (!getValue('trabNombre') || !getValue('trabRut') || !getValue('trabEdad') || !getValue('trabCargo') || !getValue('trabCorreo')) {
            alert("Debes completar todos los datos del trabajador.");
            submitBtn.disabled = false;
            return;
        }
    }

    const fecha = getValue('fechaReserva');
    const hora = getValue('horaReserva');
    const fechaHora = new Date(`${fecha}T${hora}:00`).toISOString();
    const payload = {
        tipoReserva: tipo,
        sucursalId: Number(getValue('sucursalId')),
        fechaHora,
        bateriaMedicaIds: bateriasSeleccionadas,
        examenAdicionalIds: getChecked('examenAdicionalIds'),
        pruebaDrogasIds: getChecked('pruebaDrogasIds')
    };

    if (tipo === 'empresa') {
        payload.empresaInfo = {
            nombre: getValue('empNombre'),
            rut: getValue('empRUT'),
            direccion: getValue('empDireccion'),
            giro: getValue('empGiro')
        };
        payload.solicitanteInfo = {
            nombre: getValue('solNombre'),
            cargo: getValue('solCargo'),
            telefono: getValue('solTelefono'),
            correo: getValue('solCorreo')
        };
        // Trabajadores
        const trabajadores = [];
        const rows = document.querySelectorAll('#trabajadoresContainer .row');
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            trabajadores.push({
                nombre: inputs[0].value,
                rutPasaporte: inputs[1].value,
                edad: Number(inputs[2].value),
                cargo: inputs[3].value
            });
        });
        payload.trabajadorInfo = trabajadores;
    } else {
        payload.trabajadorInfo = {
            nombre: getValue('trabNombre'),
            rutPasaporte: getValue('trabRut'),
            edad: Number(getValue('trabEdad')),
            cargo: getValue('trabCargo'),
            correo: getValue('trabCorreo')
        };
    }
    try {
        const res = await fetch(`${apiUrl}/reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.error) {
            alert(json.error);
            submitBtn.disabled = false;
            return;
        }
        mostrarModalReserva(json, submitBtn);
    } catch (err) {
        alert("Ocurrió un error al crear la reserva.");
        submitBtn.disabled = false;
    }
});

// Mostrar modal y limpiar form correctamente
function esUsuarioRegistrado() {
    return sessionStorage.getItem('token') !== null;
}

function mostrarModalReserva(respuesta, submitBtn) {
    let html = `<div class="alert alert-success"><b>${respuesta.message || 'Reserva creada correctamente.'}</b></div>`;
    if (respuesta.reserva) {
        html += `<hr><b>ID de la reserva:</b> <span class="text-primary">${respuesta.reserva.id}</span><br>`;
        html += `<hr><b>En caso de modificaciones futuras o cancelaciones de esta reserva se solicitará el ID de la reserva</b><br> `;
        html += `<b>Tipo:</b> ${respuesta.reserva.tipoReserva}<br>`;
        html += `<b>Sucursal:</b> ${respuesta.reserva.sucursal?.nombre || '-'}<br>`;
        html += `<b>Fecha y Hora:</b> ${new Date(respuesta.reserva.fechaHora).toLocaleString('es-CL')}<br>`;
        if (respuesta.reserva.empresa) {
            html += `<hr><b>Empresa:</b> ${respuesta.reserva.empresa.nombre}<br>
                <b>RUT:</b> ${respuesta.reserva.empresa.rut}<br>
                <b>Dirección:</b> ${respuesta.reserva.empresa.direccion}<br>
                <b>Giro:</b> ${respuesta.reserva.empresa.giro}<br>`;
        }
        if (respuesta.reserva.solicitante) {
            html += `<hr><b>Solicitante:</b> ${respuesta.reserva.solicitante.nombre}<br>
                <b>Cargo:</b> ${respuesta.reserva.solicitante.cargo}<br>
                <b>Teléfono:</b> ${respuesta.reserva.solicitante.telefono}<br>
                <b>Correo:</b> ${respuesta.reserva.solicitante.correo}<br>`;
        }
        if (respuesta.reserva.bateriasMedicas?.length) {
            html += `<b>Baterías Médicas:</b> ${respuesta.reserva.bateriasMedicas.map(b => b.nombre).join(', ')}<br>`;
        }
        if (respuesta.reserva.examenesAdicionales?.length) {
            html += `<b>Exámenes Adicionales:</b> ${respuesta.reserva.examenesAdicionales.map(e => e.nombre).join(', ')}<br>`;
        }
        if (respuesta.reserva.pruebasDrogas?.length) {
            html += `<b>Pruebas de Drogas:</b> ${respuesta.reserva.pruebasDrogas.map(p => p.nombre).join(', ')}<br>`;
        }
        if (respuesta.reserva.reservasTrabajador?.length) {
            html += `<hr><b>Trabajadores:</b><ul>`;
            html += respuesta.reserva.reservasTrabajador.map(rt =>
                `<li>${rt.trabajador?.nombre ?? ''} (${rt.trabajador?.rutPasaporte ?? ''}) - ${rt.cargo}, Edad: ${rt.edad}</li>`
            ).join('');
            html += `</ul>`;
        }
    }

    document.getElementById('modalReservaBody').innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('modalReservaCreada'));
    modal.show();

    document.getElementById('okModalBtn').onclick = function () {
        document.getElementById('reservaForm').reset();
        toggleSections();
        if (document.getElementById('tipoReserva').value === 'empresa') {
            const container = document.getElementById('trabajadoresContainer');
            container.innerHTML = '';
            container.appendChild(createTrabajadorRow());
        }
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.focus();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Redirigir si es usuario registrado
        if (esUsuarioRegistrado()) {
            window.location.href = "calendario-reservas.html";
        }
    };
}



document.getElementById('verCalendarioBtn').addEventListener('click', () => {
    window.location.href = 'calendario-reservas.html';
});

document.addEventListener('DOMContentLoaded', () => {
    fetchCatalogos();
    generarHoras();
    configurarFecha();
    toggleSections();
});


async function buscarReservaPorId() {
    const reservaId = document.getElementById("reservaId").value.trim();
    if (!reservaId) {
        alert("Ingrese un ID válido.");
        return;
    }

    try {
        const res = await fetch(`/api/reservas/${reservaId}`);
        const data = await res.json();

        if (res.ok) {
            // Validar estado de la reserva antes de redirigir
            if (data.estado === "cancelada") {
                alert("Esta reserva ya fue cancelada y no puede ser modificada.");
                return;
            }
            if (typeof data.modificacionCount !== 'undefined' && data.modificacionCount >= 1) {
                alert("Esta reserva ya fue modificada anteriormente y no puede volver a modificarse.");
                return;
            }
            // Si pasa validación, redirige normalmente
            window.location.href = `/editar-reserva.html?id=${reservaId}`;
        } else {
            alert(data.error || 'No se encontró la reserva.');
        }
    } catch (error) {
        alert("Error al buscar la reserva.");
    }
}


async function validarReservaParaCancelar() {
    const reservaId = document.getElementById("reservaIdCancelar").value.trim();
    const mensaje = document.getElementById("mensajeConfirmacion");
    const btnConfirmar = document.getElementById("btnConfirmarCancelar");

    mensaje.classList.add("d-none");
    btnConfirmar.style.display = "none";

    if (!reservaId) {
        alert("Ingrese un ID válido.");
        return;
    }

    try {
        const res = await fetch(`/api/reservas/${reservaId}`);
        const data = await res.json();

        if (res.ok) {

            if (data.estado === "cancelada") {
                mensaje.textContent = "Esta reserva ya se encuentra cancelada.";
                mensaje.classList.remove("d-none");
            } else {
                mensaje.textContent = "¿Está seguro que desea cancelar esta reserva?";
                mensaje.classList.remove("d-none");
                btnConfirmar.style.display = "inline-block";
                btnConfirmar.onclick = () => cancelarReserva(reservaId);
            }
        } else {
            alert(data.error || 'No se encontró la reserva.');
        }
    } catch (error) {
        alert("Error al buscar la reserva.");
    }
}

async function cancelarReserva(reservaId) {
    try {
        const res = await fetch(`/api/reservas/${reservaId}/cancelar`, {
            method: "PATCH",
        });

        const data = await res.json();
        if (res.ok) {
            alert("Reserva cancelada exitosamente.");
            window.location.reload();
        } else {
            alert(data.error || "Error al cancelar la reserva.");
        }
    } catch (err) {
        console.error(err);
        alert("Error al procesar la cancelación.");
    }
}