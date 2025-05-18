import { PrismaClient } from '@prisma/client';
const clientDb = new PrismaClient();
export async function getDashboard(req, res) {
  const porEstado = await clientDb.reserva.groupBy({ by: ['estado'], _count: { id: true } });
  const porSucursal = await clientDb.reserva.groupBy({ by: ['sucursalId'], _count: { id: true } });
  res.json({ porEstado, porSucursal });
}