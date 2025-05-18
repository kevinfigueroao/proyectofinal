import { PrismaClient } from '@prisma/client';
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

    // 1. Si es empresa, crear empresa y solicitante
    if (tipoReserva === 'empresa') {
      if (!empresaInfo || !solicitanteInfo || !trabajadorInfo || !Array.isArray(trabajadorInfo)) {
        return res.status(400).json({ error: 'Para reserva empresa se requiere los datos de empresa, solicitante y al menos un trabajador' });
      }
      empresa = await client.empresa.create({ data: empresaInfo });
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

    res.status(201).json(reservaConDetalle);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo crear la reserva' });
  }
}


// Enviar email de confirmación
/* const destinatario =
   tipoReserva === 'empresa'
     ? solicitanteInfo.correo
     : trabajadorInfo.correo;
 
 await transporter.sendMail({
   from: process.env.EMAIL_FROM,
   to: destinatario,
   subject: 'Confirmación de Reserva',
   text: `Su reserva (ID ${nueva.id}) ha sido confirmada para ${nueva.fechaHora.toISOString()}`
 });*/


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


export async function modificarReserva(req, res) {
  const { id } = req.params;
  try {
    const existente = await client.reserva.findUnique({ where: { id: Number(id) } });
    if (!existente) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (existente.modificacionCount >= 1) return res.status(400).json({ error: 'Solo una modificación permitida' });
    const actualizada = await client.reserva.update({
      where: { id: Number(id) },
      data: { ...req.body, modificacionCount: existente.modificacionCount + 1 }
    });
    res.json(actualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al modificar la reserva' });
  }
}

export async function cancelarReserva(req, res) {
  const { id } = req.params;
  try {
    const cancelada = await client.reserva.update({ where: { id: Number(id) }, data: { estado: 'cancelada' } });
    res.json(cancelada);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'Reserva no encontrada' });
  }
}
