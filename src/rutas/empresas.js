import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const client = new PrismaClient();

const router = Router();

// Ruta para buscar empresa por RUT
router.get('/buscar', async (req, res) => {
  const rut = req.query.rut;
  if (!rut) return res.status(400).json({ error: "Falta el RUT" });

  try {
    const empresa = await client.empresa.findUnique({ where: { rut } });
    if (empresa) return res.json(empresa);
    res.json({});
  } catch (e) {
    res.status(500).json({ error: "Error al buscar empresa" });
  }
});

export default router;
