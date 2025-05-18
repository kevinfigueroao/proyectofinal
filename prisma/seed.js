import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Sucursales
  await prisma.sucursal.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Concepción' } });
  await prisma.sucursal.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Santiago' } });
  await prisma.sucursal.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Antofagasta' } });
  await prisma.sucursal.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Viña del Mar' } });

  // Baterías médicas
  await prisma.bateriaMedica.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Altura Física' } });
  await prisma.bateriaMedica.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Espacios Confinados' } });
  await prisma.bateriaMedica.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Conductor' } });
  await prisma.bateriaMedica.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Operador' } });
  await prisma.bateriaMedica.upsert({ where: { id: 5 }, update: {}, create: { nombre: 'Basico' } });

  // Exámenes adicionales
  await prisma.examenAdicional.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'RX Tórax' } });
  await prisma.examenAdicional.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Glicemia' } });
  await prisma.examenAdicional.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Creatinina' } });

  // Pruebas de drogas
  await prisma.pruebaDrogas.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Marihuana' } });
  await prisma.pruebaDrogas.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Cocaína' } });
  await prisma.pruebaDrogas.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Anfetamina' } });
  await prisma.pruebaDrogas.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Alcohol' } });
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect(); });