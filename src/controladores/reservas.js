import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../utils/correo.js';
const client = new PrismaClient();


export async function crearReserva(req, res) {
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

    // 1. Si es empresa, buscar o crear empresa y crear solicitante
    if (tipoReserva === 'empresa') {
      if (!empresaInfo || !solicitanteInfo || !trabajadorInfo || !Array.isArray(trabajadorInfo)) {
        return res.status(400).json({ error: 'Para reserva empresa se requiere los datos de empresa, solicitante y al menos un trabajador' });
      }
      // Buscar si existe empresa por RUT
      empresa = await client.empresa.findUnique({ where: { rut: empresaInfo.rut } });
      if (!empresa) {
        empresa = await client.empresa.create({ data: empresaInfo });
      }
      solicitante = await client.solicitante.create({ data: solicitanteInfo });
    } else {
      if (!trabajadorInfo || Array.isArray(trabajadorInfo)) {
        return res.status(400).json({ error: 'Para reserva particular se requiere los datos del trabajador (solo uno)' });
      }
    }

    // 2. Crear la reserva principal
    const nuevaReserva = await client.reserva.create({
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

    // 3. Asociar trabajadores (empresa: array, particular: objeto)
    if (tipoReserva === 'empresa') {
      for (const tInfo of trabajadorInfo) {
        // Busca si ya existe el trabajador
        let trabajador = await client.trabajador.findUnique({ where: { rutPasaporte: tInfo.rutPasaporte } });
        if (!trabajador) {
          trabajador = await client.trabajador.create({
            data: { nombre: tInfo.nombre, rutPasaporte: tInfo.rutPasaporte }
          });
        }
        // Crea la relación intermedia con los datos de ESTA reserva
        await client.reservaTrabajador.create({
          data: {
            reservaId: nuevaReserva.id,
            trabajadorId: trabajador.id,
            cargo: tInfo.cargo,
            correo: tInfo.correo ?? null,
            edad: tInfo.edad
          }
        });
      }
    } else {
      // Caso particular: trabajadorInfo es un objeto
      let trabajador = await client.trabajador.findUnique({ where: { rutPasaporte: trabajadorInfo.rutPasaporte } });
      if (!trabajador) {
        trabajador = await client.trabajador.create({
          data: { nombre: trabajadorInfo.nombre, rutPasaporte: trabajadorInfo.rutPasaporte }
        });
      }
      await client.reservaTrabajador.create({
        data: {
          reservaId: nuevaReserva.id,
          trabajadorId: trabajador.id,
          cargo: trabajadorInfo.cargo,
          correo: trabajadorInfo.correo ?? null,
          edad: trabajadorInfo.edad
        }
      });
    }

    // 4. Devolver reserva con detalles
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

    // 5. Enviar correo al solicitante (solo si es empresa)
    try {
      const fechaFormateada = new Date(fechaHora).toLocaleString('es-CL', {
        dateStyle: 'full',
        timeStyle: 'short'
      });

      const sucursalNombre = reservaConDetalle.sucursal?.nombre || 'Sucursal no especificada';
      const reservaId = reservaConDetalle.id;

      if (tipoReserva === 'empresa' && solicitante?.correo) {
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

const mensaje = `Estimado/a ${solicitante.nombre}, tu reserva ha sido registrada correctamente.

🆔 ID de Reserva: ${reservaId}
🏢 Empresa: ${empresaNombre}
📍 Sucursal: ${sucursalNombre}
📅 Fecha y hora: ${fechaFormateada}
👥 Trabajadores incluidos en la reserva:
 ${trabajadoresTexto}

Gracias por agendar con nosotros.

Recuerda que puede modificar esta reserva desde nuestro sitio web.
        `;
        await sendConfirmationEmail(solicitante.correo, 'Confirmación de reserva', mensaje);
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

    res.status(201).json({ message: "Reserva registrada correctamente.", reserva: reservaConDetalle });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo crear la reserva' });
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
        reservasTrabajador: {      // <--- este es el include correcto
          include: {
            trabajador: true      // <--- así traes los datos del trabajador
          }
        }
      }
    });

    res.json(todas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar reservas" });
  }
}

export const obtenerReservaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const reserva = await client.reserva.findUnique({ where: { id: Number(id) },
    
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

    if (!reserva) {return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(reserva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar la reserva controlador' });
  }
};

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

    if (existente.estado === 'cancelada'){
      return res.status(400).json({ error: 'No se puede modificar una reserva cancelada' });
    }
    if (existente.modificacionCount >= 1)
      return res.status(400).json({ error: 'Solo una modificación permitida' });

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
    const cancelada = await client.reserva.update({
       where: { id: Number(id) }, 
       data: { estado: 'cancelada' } 
      });
    res.json(cancelada);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'Reserva no encontrada' });
  }
}
