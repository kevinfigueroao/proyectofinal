export function getReservaHtml({ nombre, reservaId, empresaNombre, sucursalNombre, fechaFormateada, trabajadores, tipoReserva, motivo }) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #222; max-width: 550px; margin: auto; border:1px solid #eee; border-radius:16px; box-shadow:0 4px 24px #ccc2; background: #fff;">
      <div style="background: #2460A7; color: #fff; padding: 18px 24px 12px; border-radius: 16px 16px 0 0;">
        <h2 style="margin:0;">${motivo || 'Confirmación de Reserva'}</h2>
        <p style="margin:4px 0 0 0; font-size: 15px;">¡Hola, <strong>${nombre}</strong>!</p>
      </div>
      <div style="padding:24px;">
        <p>Tu reserva ha sido <strong>${motivo ? motivo.toLowerCase() : 'registrada correctamente'}</strong>.<br>
        A continuación los detalles:</p>
  
        <table style="width:100%; margin-top: 16px; font-size: 15px;">
          <tr><td style="padding: 5px 0;"><b>🆔 ID de Reserva:</b></td><td>${reservaId}</td></tr>
          ${tipoReserva === "empresa" ? `<tr><td style="padding: 5px 0;"><b>🏢 Empresa:</b></td><td>${empresaNombre}</td></tr>` : ""}
          <tr><td style="padding: 5px 0;"><b>📍 Sucursal:</b></td><td>${sucursalNombre}</td></tr>
          <tr><td style="padding: 5px 0;"><b>📅 Fecha y hora:</b></td><td>${fechaFormateada}</td></tr>
        </table>
  
        ${tipoReserva === "empresa" ? `
        <h3 style="margin-top: 24px; font-size: 17px; color: #2460A7;">👥 Trabajadores incluidos</h3>
        <div style="margin-bottom: 18px;">
          ${trabajadores.map((trab, i) => `
            <div style="background: #f7f8fa; border-radius: 9px; padding: 12px 15px; margin-bottom:10px;">
              <b>👤 Trabajador ${i + 1}</b><br>
              <b>Nombre:</b> ${trab.nombre}<br>
              <b>RUT/Pasaporte:</b> ${trab.rutPasaporte}<br>
              <b>Cargo:</b> ${trab.cargo}<br>
              <b>Edad:</b> ${trab.edad}<br>
              <b>Correo:</b> ${trab.correo || 'No informado'}
            </div>
          `).join("")}
        </div>
        ` : ""}
  
        <p style="margin-top:20px;">Gracias por agendar con nosotros.</p>
        <p style="margin:0; font-size:13px; color:#888;">
          Puedes agendar, modificar o cancelar esta reserva desde nuestro sitio web.<br>
          <a href="http://localhost:3000/" style="color:#2460A7; text-decoration:underline;">Ir a Reservas</a>
        </p>
      </div>
      <div style="background:#f2f3f6; color:#aaa; text-align:center; border-radius:0 0 16px 16px; font-size:13px; padding:9px;">
        © ${new Date().getFullYear()} CESO SPA. Todos los derechos reservados.
      </div>
    </div>
    `;
}
