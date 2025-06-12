
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();


// GET /api/baterias-medicas
export const obtenerTodasBateriasMedicas = async (req, res) => {
  try {
    const baterias = await client.bateriaMedica.findMany();
    res.json(baterias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las baterías médicas" });
  }
};

// GET /api/pruebas-drogas
export const obtenerTodasPruebasDrogas = async (req, res) => {
  try {
    const pruebas = await client.pruebaDrogas.findMany();
    res.json(pruebas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las pruebas de drogas" });
  }
};

// GET /api/examenes-adicionales
export const obtenerTodosExamenesAdicionales = async (req, res) => {
  try {
    const examenes = await client.examenAdicional.findMany();
    res.json(examenes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los exámenes adicionales" });
  }
};
