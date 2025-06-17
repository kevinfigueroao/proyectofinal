import { PrismaClient } from '@prisma/client';
import { generarExcelReservas } from '../utils/exportarReserva.js';

const prisma = new PrismaClient();

export const exportarReservas = async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const rol = payload.rol;
    const sucursalId = payload.sucursalId;

    const filtros = {
      fechaHora: {
        gte: new Date(desde),
        lte: new Date(hasta),
      },
    };

    if (rol !== 'admin') {
      filtros.sucursalId = sucursalId;
    }

    const reservas = await prisma.reserva.findMany({
      where: filtros,
      include: {
        empresa: true,
        sucursal: true,
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
