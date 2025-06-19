import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Crear usuario
export async function crearUsuario(req, res) {
  const { username, password, rol, sucursalId } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.usuario.create({
      data: { username, passwordHash, rol, sucursalId }
    });
    res.status(201).json({ id: user.id, username: user.username, rol: user.rol, sucursalId: user.sucursalId });
  } catch (error) {
    res.status(400).json({ error: 'No se pudo crear el usuario (¿Username ya existe?)' });
  }
}

// Listar usuarios (solo admin)
export async function listarUsuarios(req, res) {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, username: true, rol: true, sucursalId: true }
  });
  res.json(usuarios);
}

// Otros endpoints: editar, eliminar, etc., puedes agregarlos similarmente
