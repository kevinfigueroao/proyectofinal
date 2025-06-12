import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../utils/correo.js';
import { ReservaSchema } from '../validaciones/reservaSchema.js'; // (Ruta según tu estructura)
import { safeParse } from 'valibot';


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
              data: { nombre: tInfo.nombre, rutPasaporte: tInfo.rutPasaporte }
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
            data: { nombre: trabajadorInfo.nombre, rutPasaporte: trabajadorInfo.rutPasaporte }
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
          const trabajadoresTexto = reservaConDetalle.reservasTrabajador.map((rt, index) => {
            const trabajador = rt.trabajador;
            return `👤 Trabajador ${index + 1}:
    - Nombre: ${trabajador.nombre}
    - RUT/Pasaporte: ${trabajador.rutPasaporte}
    - Cargo: ${rt.cargo}
    - Edad: ${rt.edad}
    - Correo: ${rt.correo || 'No informado'}`;
          }).join('\n\n');
          const mensaje = `Estimado/a ${solicitanteInfo.nombre}, tu reserva ha sido registrada correctamente.

🆔 ID de Reserva: ${reservaId}
🏢 Empresa: ${empresaNombre}
📍 Sucursal: ${sucursalNombre}
📅 Fecha y hora: ${fechaFormateada}
👥 Trabajadores incluidos en la reserva:
${trabajadoresTexto}

Gracias por agendar con nosotros.

Recuerda que puede modificar esta reserva desde nuestro sitio web.`;
          await sendConfirmationEmail(solicitanteInfo.correo, 'Confirmación de reserva', mensaje);
        }
        if (tipoReserva === 'particular' && trabajadorInfo?.correo) {
          const mensaje = `
Estimado/a ${trabajadorInfo.nombre}, tu reserva ha sido registrada correctamente.

🆔 ID de Reserva: ${reservaId}
📍 Sucursal: ${sucursalNombre}
📅 Fecha y hora: ${fechaFormateada}

Gracias por agendar con nosotros.
Recuerda que puede modificar o cancelar esta reserva desde nuestro sitio web.
          `;
          await sendConfirmationEmail(trabajadorInfo.correo, 'Confirmación de reserva', mensaje);
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
//cancelar trabajador
// PATCH /api/reservas/:reservaId/trabajadores/:trabajadorId/cancelar
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
        estado: 'modificada',
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

    // Verifica si todos asistieron y actualiza la reserva a 'completado'
    const trabajadores = await client.reservaTrabajador.findMany({
      where: { reservaId: Number(reservaId) }
    });

    const todosAsistieron = trabajadores.length > 0 && trabajadores.every(t => t.asistio);

    if (todosAsistieron) {
      await client.reserva.update({
        where: { id: Number(reservaId) },
        data: { estado: "completado" }
      });
    }
    res.json({ ok: true, completado: todosAsistieron });
  } catch (err) {
    res.status(500).json({ error: "No se pudo marcar asistencia" });
  }

}