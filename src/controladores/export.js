import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';
const clientEx = new PrismaClient();
export async function exportarCSV(req, res) {
  const datos = await clientEx.reserva.findMany();
  const fields = ['id','tipoReserva','fechaHora','estado','sucursalId','bateriaMedicaId','examenAdicionalId','pruebaDrogasId','solicitanteId','empresaId','trabajadorId','createdAt'];
  const parser = new Parser({ fields });
  const csv = parser.parse(datos);
  res.header('Content-Type','text/csv');
  res.attachment('reporte_reservas.csv');
  res.send(csv);
}