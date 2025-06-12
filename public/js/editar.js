const apiUrl = "http://localhost:3000/api";
const params = new URLSearchParams(window.location.search);
const idReserva = params.get('id');

document.addEventListener("DOMContentLoaded", () => {
    const reservaId = new URLSearchParams(window.location.search).get("id");
    if (!reservaId) return alert("ID de reserva no especificado.");

    function generarHorasOptions(select, valorActual = null) {
        select.innerHTML = "";
        const horaInicio = 7 * 60 + 30; // 7:30
        const horaFin = 17 * 60; // 17:00
        let optionMarcada = false;
        for (let min = horaInicio; min <= horaFin; min += 30) {
            const h = String(Math.floor(min / 60)).padStart(2, '0');
            const m = String(min % 60).padStart(2, '0');
            const value = `${h}:${m}`;
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            if (valorActual && value === valorActual) {
                option.selected = true;
                optionMarcada = true;
            }
            select.appendChild(option);
        }
        if (valorActual && !optionMarcada && select.options.length > 0) {
            select.options[0].selected = true;
        }
    }

    async function cargarCheckboxes(url, contenedor, seleccionados = []) {
        const res = await fetch(url);
        const items = await res.json();
        contenedor.innerHTML = "";
        items.forEach(item => {
            const check = document.createElement("div");
            check.className = "form-check";
            check.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${item.id}" id="${url}_${item.id}">
        <label class="form-check-label" for="${url}_${item.id}">${item.nombre}</label>
      `;
            if (seleccionados.some(sel => sel.id === item.id)) check.querySelector('input').checked = true;
            contenedor.appendChild(check);
        });
    }

    function getCheckedValues(container) {
        return Array.from(container.querySelectorAll("input[type='checkbox']:checked")).map(i => Number(i.value));
    }

    function renderTrabajadores(tipo, reservasTrabajador) {
        const cont = document.querySelector(`#datos${tipo} .trabajadoresContainer`);
        cont.innerHTML = "";
        if (tipo === "Empresa") {
            reservasTrabajador.forEach((rt, idx) => {
                const div = document.createElement("div");
                div.className = "mb-3 trabajador-item border p-3";
                div.innerHTML = `
          <div class="row g-2 align-items-end">
            <div class="col">
              <label>Nombre</label>
              <input type="text" class="form-control" name="nombreTrabajador" value="${rt.trabajador.nombre}" required>
            </div>
            <div class="col">
              <label>RUT/Pasaporte</label>
              <input type="text" class="form-control" name="rutTrabajador" value="${rt.trabajador.rutPasaporte}" required>
            </div>
            <div class="col">
              <label>Cargo</label>
              <input type="text" class="form-control" name="cargoTrabajador" value="${rt.cargo}" required>
            </div>
            <div class="col">
              <label>Edad</label>
              <input type="number" class="form-control" name="edadTrabajador" value="${rt.edad}" required>
            </div>
            <div class="col-auto">
              <button type="button" class="btn btn-danger btn-sm remove-trabajador" title="Eliminar trabajador">X</button>
            </div>
          </div>
        `;
                div.querySelector('.remove-trabajador').onclick = function() {
                    if (cont.children.length > 1) div.remove();
                };
                cont.appendChild(div);
            });
            document.getElementById("btnAgregarTrabajador").style.display = "block";
        } else {
            const rt = reservasTrabajador[0];
            const div = document.createElement("div");
            div.className = "mb-3 trabajador-item border p-3";
            div.innerHTML = `
        <div class="row g-2">
          <div class="col">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombreTrabajador" value="${rt.trabajador.nombre}" required>
          </div>
          <div class="col">
            <label>RUT/Pasaporte</label>
            <input type="text" class="form-control" name="rutTrabajador" value="${rt.trabajador.rutPasaporte}" required>
          </div>
          <div class="col">
            <label>Cargo</label>
            <input type="text" class="form-control" name="cargoTrabajador" value="${rt.cargo}" required>
          </div>
          <div class="col">
            <label>Edad</label>
            <input type="number" class="form-control" name="edadTrabajador" value="${rt.edad}" required>
          </div>
          <div class="col">
            <label>Correo</label>
            <input type="email" class="form-control" name="correoTrabajador" value="${rt.correo ?? ""}">
          </div>
        </div>
      `;
            cont.appendChild(div);
            document.getElementById("btnAgregarTrabajador").style.display = "none";
        }
    }

    async function cargarDatosReserva() {
        try {
            const res = await fetch(`/api/reservas/${reservaId}`);
            if (!res.ok) throw new Error("No se pudo obtener la reserva");
            const reserva = await res.json();

            if (reserva.estado === "cancelada") {
                alert("Esta reserva ya está cancelada y no se puede modificar.");
                window.location.href = "/";
                return;
            }
            if (reserva.tipoReserva === "particular") {
                document.getElementById("datosParticular").style.display = "block";
                document.getElementById("datosEmpresa").style.display = "none";
                // Habilita campos de particular, deshabilita los de empresa
                document.querySelectorAll("#datosParticular input, #datosParticular select, #datosParticular textarea").forEach(el => el.disabled = false);
                document.querySelectorAll("#datosEmpresa input, #datosEmpresa select, #datosEmpresa textarea").forEach(el => el.disabled = true);
            } else {
                document.getElementById("datosEmpresa").style.display = "block";
                document.getElementById("datosParticular").style.display = "none";
                // Habilita campos de empresa, deshabilita los de particular
                document.querySelectorAll("#datosEmpresa input, #datosEmpresa select, #datosEmpresa textarea").forEach(el => el.disabled = false);
                document.querySelectorAll("#datosParticular input, #datosParticular select, #datosParticular textarea").forEach(el => el.disabled = true);
            }
            const tipo = reserva.tipoReserva === "particular" ? "Particular" : "Empresa";

            function getCampo(clase) {
                return document.querySelector(`#datos${tipo} .${clase}`);
            }
            getCampo("fechaHora").value = new Date(reserva.fechaHora).toISOString().split("T")[0];
            const horaAgendada = new Date(reserva.fechaHora).toTimeString().slice(0, 5);
            generarHorasOptions(getCampo("hora"), horaAgendada);

            renderTrabajadores(tipo, reserva.reservasTrabajador);

            // Agregar trabajador solo para empresa
            if (tipo === "Empresa") {
                document.getElementById("btnAgregarTrabajador").onclick = function() {
                    const cont = document.querySelector("#datosEmpresa .trabajadoresContainer");
                    const div = document.createElement("div");
                    div.className = "mb-3 trabajador-item border p-3";
                    div.innerHTML = `
            <div class="row g-2 align-items-end">
              <div class="col">
                <label>Nombre</label>
                <input type="text" class="form-control" name="nombreTrabajador" required>
              </div>
              <div class="col">
                <label>RUT/Pasaporte</label>
                <input type="text" class="form-control" name="rutTrabajador" required>
              </div>
              <div class="col">
                <label>Cargo</label>
                <input type="text" class="form-control" name="cargoTrabajador" required>
              </div>
              <div class="col">
                <label>Edad</label>
                <input type="number" class="form-control" name="edadTrabajador" required>
              </div>
              <div class="col-auto">
                <button type="button" class="btn btn-danger btn-sm remove-trabajador" title="Eliminar trabajador">X</button>
              </div>
            </div>
          `;
                    div.querySelector('.remove-trabajador').onclick = function() {
                        if (cont.children.length > 1) div.remove();
                    };
                    cont.appendChild(div);
                };
            }

            // Cargar los checkboxes para cada grupo
            if (tipo === "Empresa") {
                await cargarCheckboxes("/api/baterias-medicas", document.getElementById("bateriasCheckboxes"), reserva.bateriasMedicas);
                await cargarCheckboxes("/api/examenes-adicionales", document.getElementById("examenesCheckboxes"), reserva.examenesAdicionales);
                await cargarCheckboxes("/api/pruebas-drogas", document.getElementById("pruebasCheckboxes"), reserva.pruebasDrogas);
            } else {
                await cargarCheckboxes("/api/baterias-medicas", document.getElementById("bateriasCheckboxesPart"), reserva.bateriasMedicas);
                await cargarCheckboxes("/api/examenes-adicionales", document.getElementById("examenesCheckboxesPart"), reserva.examenesAdicionales);
                await cargarCheckboxes("/api/pruebas-drogas", document.getElementById("pruebasCheckboxesPart"), reserva.pruebasDrogas);
            }
            // Validar días (no fines de semana)
            getCampo("fechaHora").addEventListener("input", function() {
                const fecha = new Date(this.value + "T00:00:00");
                if (fecha.getDay() === 6 || fecha.getDay() === 0) {
                    alert("No se pueden seleccionar sábados ni domingos.");
                    this.value = '';
                }
            });
        } catch (err) {
            alert("Error al cargar la reserva");
            console.error(err);
        }
    }

    function esUsuarioRegistrado() {
        return !!sessionStorage.getItem('token');
    }
    document.getElementById("formEditarReserva").addEventListener("submit", async (e) => {
        e.preventDefault();

        // Ya NO necesitas deshabilitar nada aquí
        const isEmpresa = document.getElementById("datosEmpresa").style.display !== "none";
        const cont = isEmpresa ? document.getElementById("datosEmpresa") : document.getElementById("datosParticular");
        const fecha = cont.querySelector(".fechaHora").value;
        const hora = cont.querySelector(".hora").value;
        const trabajadores = Array.from(cont.querySelectorAll(".trabajador-item")).map(div => ({
            nombre: div.querySelector('[name="nombreTrabajador"]').value,
            rut: div.querySelector('[name="rutTrabajador"]').value,
            edad: div.querySelector('[name="edadTrabajador"]').value,
            cargo: div.querySelector('[name="cargoTrabajador"]').value,
            ...(isEmpresa ? {} : {
                correo: div.querySelector('[name="correoTrabajador"]').value
            })
        }));

        if (!fecha || !hora || trabajadores.some(t => !t.nombre || !t.rut || !t.edad || !t.cargo)) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        const getChecked = id => getCheckedValues(document.getElementById(id));
        const bateriasMedicas = isEmpresa ? getChecked("bateriasCheckboxes") : getChecked("bateriasCheckboxesPart");
        const examenesAdicionales = isEmpresa ? getChecked("examenesCheckboxes") : getChecked("examenesCheckboxesPart");
        const pruebasDrogas = isEmpresa ? getChecked("pruebasCheckboxes") : getChecked("pruebasCheckboxesPart");

        if (bateriasMedicas.length === 0) {
            alert("Debes seleccionar al menos una batería médica.");
            return;
        }
        const payload = {
            tipoReserva: isEmpresa ? "empresa" : "particular",
            fechaHora: `${fecha}T${hora}`,
            bateriasMedicas,
            examenesAdicionales,
            pruebasDrogas,
            trabajadores
        };
        try {

            const token = sessionStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            const res = await fetch(`${apiUrl}/reservas/${idReserva}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                alert("Reserva actualizada correctamente.");
                if (esUsuarioRegistrado()) {
                    window.location.href = "calendario-reservas.html";
                } else {
                    window.location.href = "/";
                }
            } else {
                alert(data.error || "Error al actualizar");
            }
        } catch (err) {
            alert("Error al enviar los datos");
            console.error(err);
        }
    });

    document.getElementById("btnCancelar").addEventListener("click", () => {
        if (esUsuarioRegistrado()) {
            window.location.href = "calendario-reservas.html";
        } else {
            window.location.href = "index.html";
        }
    });

    cargarDatosReserva();
});