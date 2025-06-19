import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../utils/correo.js';
import { getReservaHtml } from '../utils/formatocorreo.js';




const client = new PrismaClient();



export async function crearReserva(req, res) {
  // Ya NO necesitas volver a validar aquí
  // Los datos ya están validados y parseados por el middleware
  // console.log("Datos validados y parseados en crearReserva:", req.body);

  const {
    tipoReserva,
    sucursalId,
    fechaHora,
    bateriaMedicaIds = [],
    examenAdicionalIds = [],
    pruebaDrogasIds = [],
    empresaInfo,
    solicitanteInfo,
    trabajadorInfo
  } = req.body;
  try {
    let empresa = null;
    let solicitante = null;
    let nuevaReserva = null;

    await client.$transaction(async (tx) => {
      // 1. Empresa y Solicitante (si corresponde)
      if (tipoReserva === 'empresa') {
        if (!empresaInfo || !solicitanteInfo || !trabajadorInfo || !Array.isArray(trabajadorInfo)) {
          throw new Error('Para reserva empresa se requiere los datos de empresa, solicitante y al menos un trabajador');
        }
        empresa = await tx.empresa.findUnique({ where: { rut: empresaInfo.rut } });
        if (!empresa) {
          empresa = await tx.empresa.create({ data: empresaInfo });
        }
        solicitante = await tx.solicitante.create({ data: solicitanteInfo });
      } else {
        if (!trabajadorInfo || Array.isArray(trabajadorInfo)) {
          throw new Error('Para reserva particular se requiere los datos del trabajador (solo uno)');
        }
      }

      // 2. Crear reserva
      nuevaReserva = await tx.reserva.create({
        data: {
          tipoReserva,
          sucursal: { connect: { id: Number(sucursalId) } },
          fechaHora: new Date(fechaHora),
          ...(empresa && { empresa: { connect: { id: empresa.id } } }),
          ...(solicitante && { solicitante: { connect: { id: solicitante.id } } }),
          bateriasMedicas: { connect: (bateriaMedicaIds || []).map(id => ({ id })) },
          examenesAdicionales: { connect: (examenAdicionalIds || []).map(id => ({ id })) },
          pruebasDrogas: { connect: (pruebaDrogasIds || []).map(id => ({ id })) }
        }
      });

      // 3. Trabajadores y relaciones
      if (tipoReserva === 'empresa') {
        await Promise.all(trabajadorInfo.map(async (tInfo) => {
          let trabajador = await tx.trabajador.findUnique({ where: { rutPasaporte: tInfo.rutPasaporte } });
          if (!trabajador) {
            trabajador = await tx.trabajador.create({
              data: { nombre: tInfo.nombreT, rutPasaporte: tInfo.rutPasaporte }
            });
          }
          await tx.reservaTrabajador.create({
            data: {
              reservaId: nuevaReserva.id,
              trabajadorId: trabajador.id,
              cargo: tInfo.cargo,
              correo: tInfo.correo ?? null,
              edad: tInfo.edad,
              estado: "pendiente"
            }
          });
        }));
      } else {
        let trabajador = await tx.trabajador.findUnique({ where: { rutPasaporte: trabajadorInfo.rutPasaporte } });
        if (!trabajador) {
          trabajador = await tx.trabajador.create({
            data: { nombre: trabajadorInfo.nombreT, rutPasaporte: trabajadorInfo.rutPasaporte }
          });
        }
        await tx.reservaTrabajador.create({
          data: {
            reservaId: nuevaReserva.id,
            trabajadorId: trabajador.id,
            cargo: trabajadorInfo.cargo,
            correo: trabajadorInfo.correo ?? null,
            edad: trabajadorInfo.edad
          }
        });
      }
    });

    // 4. Obtener reserva con detalle para mostrar/retornar
    const reservaConDetalle = await client.reserva.findUnique({
      where: { id: nuevaReserva.id },
      include: {
        sucursal: true,
        bateriasMedicas: true,
        examenesAdicionales: true,
        pruebasDrogas: true,
        empresa: true,
        solicitante: true,
        reservasTrabajador: {
          include: { trabajador: true }
        }
      }
    });

    // 5. Enviar respuesta al usuario de inmediato (sin esperar correo)
    res.status(201).json({ message: "Reserva registrada correctamente.", reserva: reservaConDetalle });

    // 6. Enviar correo de confirmación DESPUÉS, en "background"
    setImmediate(async () => {
      try {
        const fechaFormateada = new Date(fechaHora).toLocaleString('es-CL', {
          dateStyle: 'full',
          timeStyle: 'short'
        });
        const sucursalNombre = reservaConDetalle.sucursal?.nombre || 'Sucursal no especificada';
        const reservaId = reservaConDetalle.id;

        if (tipoReserva === 'empresa' && solicitanteInfo?.correo) {
          const empresaNombre = reservaConDetalle.empresa?.nombre || 'Empresa no registrada';
          const trabajadores = reservaConDetalle.reservasTrabajador.map(rt => ({
            nombre: rt.trabajador.nombre,
            rutPasaporte: rt.trabajador.rutPasaporte,
            cargo: rt.cargo,
            edad: rt.edad,
            correo: rt.correo
          }));
          const html = getReservaHtml({
            nombre: solicitanteInfo.nombre,
            reservaId,
            empresaNombre,
            sucursalNombre,
            fechaFormateada,
            trabajadores,
            tipoReserva: "empresa"
          });
          await sendConfirmationEmail(solicitanteInfo.correo, 'Confirmación de reserva', html);
        }
        if (tipoReserva === 'particular' && trabajadorInfo?.correo) {
          const html = getReservaHtml({
            nombre: trabajadorInfo.nombreT,
            reservaId,
            empresaNombre: "",
            sucursalNombre,
            fechaFormateada,
            trabajadores: [],
            tipoReserva: "particular"
          });
          await sendConfirmationEmail(trabajadorInfo.correo, 'Confirmación de reserva', html);
        }
      } catch (emailError) {
        console.error('Error al enviar el correo de confirmación:', emailError);
      }
    });

  } catch (error) {
    console.error(error);
    // Si el error fue por validación, muestra mensaje amigable
    res.status(500).json({ error: error.message || 'No se pudo crear la reserva' });
  }
}

export async function reagendarReservaCompleta(req, res) {
  const { reservaId } = req.params;
  const { nuevaFechaHora } = req.body;
  try {
    await client.reserva.update({
      where: { id: Number(reservaId) },
      data: { fechaHora: new Date(nuevaFechaHora) }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo reagendar la reserva" });
  }
}

export async function reagendarTrabajador(req, res) {
  const { reservaId, trabajadorId } = req.params;
  const { nuevaFechaHora } = req.body;
  try {
    if (new Date(nuevaFechaHora) < new Date()) {
      return res.status(400).json({ error: "La nueva fecha/hora debe ser futura." });
    }

    // Marca el trabajador original como 'reagendado'
    await client.reservaTrabajador.updateMany({
      where: { reservaId: Number(reservaId), trabajadorId: Number(trabajadorId) },
      data: { estado: 'reagendado' }
    });

    // Busca datos de la reserva original y del trabajador
    const reservaOriginal = await client.reserva.findUnique({
      where: { id: Number(reservaId) },
      include: {
        bateriasMedicas: true,
        examenesAdicionales: true,
        pruebasDrogas: true,
        empresa: true,
        solicitante: true,
        sucursal: true
      }
    });

    const rt = await client.reservaTrabajador.findFirst({
      where: { reservaId: Number(reservaId), trabajadorId: Number(trabajadorId) },
      include: { trabajador: true }
    });

    if (!rt || !reservaOriginal) {
      return res.status(404).json({ error: "Trabajador o reserva no encontrado" });
    }

    // Crea nueva reserva igual que la original, pero solo con el trabajador reagendado y la nueva fecha/hora
    await client.reserva.create({
      data: {
        tipoReserva: reservaOriginal.tipoReserva,
        fechaHora: new Date(nuevaFechaHora),
        sucursalId: reservaOriginal.sucursalId,
        empresaId: reservaOriginal.empresaId,
        solicitanteId: reservaOriginal.solicitanteId,
        bateriasMedicas: {
          connect: (reservaOriginal.bateriasMedicas || []).map(b => ({ id: b.id }))
        },
        examenesAdicionales: {
          connect: (reservaOriginal.examenesAdicionales || []).map(e => ({ id: e.id }))
        },
        pruebasDrogas: {
          connect: (reservaOriginal.pruebasDrogas || []).map(p => ({ id: p.id }))
        },
        reservasTrabajador: {
          create: [{
            trabajadorId: rt.trabajadorId,
            cargo: rt.cargo,
            correo: rt.correo,
            edad: rt.edad,
            estado: "pendiente"
          }]
        }
      }
    });

    await actualizarEstadoReservaSiCorresponde(reservaId);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error en reagendarTrabajador:", err);
    res.status(500).json({ error: "No se pudo reagendar el trabajador" });
  }
}



export async function listarReservas(req, res) {
  try {
    const todas = await client.reserva.findMany({
      include: {
        sucursal: true,
        bateriasMedicas: true,
        examenesAdicionales: true,
        pruebasDrogas: true,
        empresa: true,
        solicitante: true,
        reservasTrabajador: { include: { trabajador: true } }
      }
    });

    const ahora = new Date();
    for (const r of todas) {
      // 1. Actualiza trabajadores vencidos a "no asistio"
      for (const rt of r.reservasTrabajador) {
        if (
          rt.estado === "pendiente" &&
          new Date(r.fechaHora) < ahora &&
          r.estado !== "cancelada"
        ) {
          await client.reservaTrabajador.update({
            where: { id: rt.id },
            data: { estado: "no asistio" }
          });
          rt.estado = "no asistio";
        }
      }
      // 2. Si todos los trabajadores están en estado final, la reserva es "completado"
      const estadosFinales = ["asistio", "no asistio", "cancelado"];
      const todosFinal = r.reservasTrabajador.every(rt =>
        estadosFinales.includes(rt.estado)
      );
      if (
        todosFinal &&
        r.estado !== "completado" &&
        r.estado !== "cancelada"
      ) {
        await client.reserva.update({
          where: { id: r.id },
          data: { estado: "completado" }
        });
        r.estado = "completado";
      }
    }
    // Vuelve a consultar todo actualizado
    const resultado = await client.reserva.findMany({
      include: {
        sucursal: true,
        bateriasMedicas: true,
        examenesAdicionales: true,
        pruebasDrogas: true,
        empresa: true,
        solicitante: true,
        reservasTrabajador: { include: { trabajador: true } }
      }
    });
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar reservas" });
  }
}


export const obtenerReservaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const reserva = await client.reserva.findUnique({
      where: { id: Number(id) },

      include: {
        sucursal: true,
        solicitante: true,
        empresa: true,
        reservasTrabajador: {
          include: {
            trabajador: true
          }
        },
        examenesAdicionales: true,
        bateriasMedicas: true,
        pruebasDrogas: true

      }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(reserva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar la reserva controlador' });
  }
};



// Utilitario:
async function actualizarEstadoReservaSiCorresponde(reservaId) {
  const trabajadores = await client.reservaTrabajador.findMany({
    where: { reservaId: Number(reservaId) }
  });
  const estadosFinales = ["asistio", "no asistio", "cancelado", "reagendado"];
  const todosFinal = trabajadores.length > 0 && trabajadores.every(rt =>
    estadosFinales.includes(rt.estado)
  );
  if (todosFinal) {
    await client.reserva.update({
      where: { id: Number(reservaId) },
      data: { estado: "completado" }
    });
  }
}





export async function cancelarTrabajador(req, res) {
  const { reservaId, trabajadorId } = req.params;
  try {
    await client.reservaTrabajador.updateMany({
      where: {
        reservaId: Number(reservaId),
        trabajadorId: Number(trabajadorId)
      },
      data: { estado: "cancelado" }
    });

    await actualizarEstadoReservaSiCorresponde(reservaId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo cancelar el trabajador" });
  }
}



export async function modificarReserva(req, res) {
  const { id } = req.params;
  const {
    tipoReserva,
    fechaHora,
    bateriasMedicas = [],
    examenesAdicionales = [],
    pruebasDrogas = [],
    trabajadores = []
  } = req.body;

  try {
    const existente = await client.reserva.findUnique({
      where: { id: Number(id) },
      include: { reservasTrabajador: true }
    });

    if (!existente)
      return res.status(404).json({ error: 'Reserva no encontrada' });

    if (existente.estado === 'cancelada') {
      return res.status(400).json({ error: 'No se puede modificar una reserva cancelada' });
    }
    if (existente.estado === 'completado') {
      return res.status(400).json({ error: 'Esta reserva ya fue realizada' });
    }
    // Si NO hay usuario autenticado (visitante), solo permitir una edición
    if (!req.usuario && existente.modificacionCount >= 1) {
      return res.status(400).json({ error: 'Solo una modificación permitida' });
    }


    // Si hay usuario autenticado (req.user), permitir todas las modificaciones


    // Paso 1: Actualiza los datos de la reserva y relaciones
    const actualizada = await client.reserva.update({
      where: { id: Number(id) },
      data: {
        tipoReserva,
        fechaHora: new Date(fechaHora),
        modificacionCount: existente.modificacionCount + 1,
        bateriasMedicas: {
          set: bateriasMedicas.map(id => ({ id }))
        },
        examenesAdicionales: {
          set: examenesAdicionales.map(id => ({ id }))
        },
        pruebasDrogas: {
          set: pruebasDrogas.map(id => ({ id }))
        },
        reservasTrabajador: {
          deleteMany: {} // Borra los trabajadores previos
        }
      }
    });

    // Paso 2: Vuelve a crear los trabajadores asociados
    for (const t of trabajadores) {
      // Busca o crea al trabajador
      let trabajador = await client.trabajador.upsert({
        where: { rutPasaporte: t.rut },
        update: { nombre: t.nombre },
        create: { nombre: t.nombre, rutPasaporte: t.rut }
      });

      // Crea la relación con campos adicionales
      await client.reservaTrabajador.create({
        data: {
          reservaId: actualizada.id,
          trabajadorId: trabajador.id,
          edad: Number(t.edad),
          cargo: t.cargo,
          correo: t.correo ?? null
        }
      });
    }

    res.json({ ok: true, reserva: actualizada });

    // -- ENVÍO DE CORREO TRAS MODIFICAR RESERVA --
    try {
      const reservaConDetalle = await client.reserva.findUnique({
        where: { id: actualizada.id },
        include: {
          sucursal: true,
          empresa: true,
          solicitante: true,
          reservasTrabajador: { include: { trabajador: true } }
        }
      });

      const fechaFormateada = new Date(reservaConDetalle.fechaHora).toLocaleString('es-CL', {
        dateStyle: 'full',
        timeStyle: 'short'
      });

      // Personaliza el asunto y el mensaje interno
      const asunto = 'Reserva modificada';
      const html = getReservaHtml({
        nombre: reservaConDetalle.solicitante?.nombre || reservaConDetalle.reservasTrabajador[0]?.trabajador?.nombre,
        reservaId: reservaConDetalle.id,
        empresaNombre: reservaConDetalle.empresa?.nombre || '',
        sucursalNombre: reservaConDetalle.sucursal?.nombre || '',
        fechaFormateada,
        trabajadores: reservaConDetalle.reservasTrabajador.map(rt => ({
          nombre: rt.trabajador.nombre,
          rutPasaporte: rt.trabajador.rutPasaporte,
          cargo: rt.cargo,
          edad: rt.edad,
          correo: rt.correo
        })),
        tipoReserva: reservaConDetalle.tipoReserva,
        motivo: 'Reserva Modificada' // Nuevo parámetro si lo usas en la plantilla
      });

      const correoDestino = reservaConDetalle.solicitante?.correo || reservaConDetalle.reservasTrabajador[0]?.correo;
      if (correoDestino) {
        await sendConfirmationEmail(correoDestino, asunto, html);
      }
    } catch (err) {
      console.error("Error al enviar correo de reserva modificada:", err);
    }


  } catch (error) {
    console.error("Error al modificar reserva:", error);
    res.status(500).json({ error: 'Error al modificar la reserva' });
  }
}


export async function cancelarReserva(req, res) {
  const { id } = req.params;

  try {
    // Actualiza el estado de la reserva
    const cancelada = await client.reserva.update({
      where: { id: Number(id) },
      data: {
        estado: 'cancelada',
        reservasTrabajador: {
          updateMany: {
            where: { reservaId: Number(id) },
            data: { estado: 'cancelado' }
          }
        }
      },
      include: {
        reservasTrabajador: true
      }
    });

    res.json(cancelada);

    // -- ENVÍO DE CORREO TRAS CANCELAR RESERVA --
    try {
      const reservaConDetalle = await client.reserva.findUnique({
        where: { id: cancelada.id },
        include: {
          sucursal: true,
          empresa: true,
          solicitante: true,
          reservasTrabajador: { include: { trabajador: true } }
        }
      });

      const fechaFormateada = new Date(reservaConDetalle.fechaHora).toLocaleString('es-CL', {
        dateStyle: 'full',
        timeStyle: 'short'
      });

      // Personaliza el asunto y el mensaje interno
      const asunto = 'Reserva cancelada';
      const html = getReservaHtml({
        nombre: reservaConDetalle.solicitante?.nombre || reservaConDetalle.reservasTrabajador[0]?.trabajador?.nombre,
        reservaId: reservaConDetalle.id,
        empresaNombre: reservaConDetalle.empresa?.nombre || '',
        sucursalNombre: reservaConDetalle.sucursal?.nombre || '',
        fechaFormateada,
        trabajadores: reservaConDetalle.reservasTrabajador.map(rt => ({
          nombre: rt.trabajador.nombre,
          rutPasaporte: rt.trabajador.rutPasaporte,
          cargo: rt.cargo,
          edad: rt.edad,
          correo: rt.correo
        })),
        tipoReserva: reservaConDetalle.tipoReserva,
        motivo: 'Reserva Cancelada' // Nuevo parámetro si lo usas en la plantilla
      });

      const correoDestino = reservaConDetalle.solicitante?.correo || reservaConDetalle.reservasTrabajador[0]?.correo;
      if (correoDestino) {
        await sendConfirmationEmail(correoDestino, asunto, html);
      }
    } catch (err) {
      console.error("Error al enviar correo de reserva cancelada:", err);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
}


export async function marcarAsistenciaTrabajador(req, res) {
  const { reservaId, trabajadorId } = req.params;
  try {
    await client.reservaTrabajador.updateMany({
      where: {
        reservaId: Number(reservaId),
        trabajadorId: Number(trabajadorId)
      },
      data: { estado: "asistio" }
    });

    await actualizarEstadoReservaSiCorresponde(reservaId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo marcar asistencia" });
  }
}

