import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient();
export async function getSucursales(req, res) { res.json(await prisma.sucursal.findMany()); }
export async function getBaterias(req, res) { res.json(await prisma.bateriaMedica.findMany()); }
export async function getExamenes(req, res) { res.json(await prisma.examenAdicional.findMany()); }
export async function getPruebas(req, res) { res.json(await prisma.pruebaDrogas.findMany()); }