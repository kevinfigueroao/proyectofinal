import { PrismaClient } from '@prisma/client';
import { generarExcelReservas } from '../utils/exportarReserva.js';

const prisma = new PrismaClient();

export const exportarReservas = async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const reservas = await prisma.reserva.findMany({
      where: {
        fechaHora: {
          gte: new Date(desde),
          lte: new Date(hasta),
        },
      },
      include: {
        empresa: true,
        sucursal: true,
        solicitante: true,
        reservasTrabajador: {
          include: { trabajador: true },
        },
        bateriasMedicas: true,
        examenesAdicionales: true,
        pruebasDrogas: true,
      },
    });

    await generarExcelReservas(reservas, res);
  } catch (error) {
    console.error('Error exportando reservas:', error);
    res.status(500).send('Error al exportar reservas');
  }
};


const obtenerReservasConDetalles = async () => {
  return await prisma.reserva.findMany({
    include: {
      empresa: true,
      sucursal: true,
      solicitante: true,
    },
  });
};


