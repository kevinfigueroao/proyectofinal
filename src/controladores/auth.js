import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

export async function login(req, res)  {
  const { username, contrasena } = req.body;
  if (!username || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  }
  // Buscar usuario por username
  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario) {
    return res.status(401).json({ error: 'Usuario no encontrado.' });
  }
  // Verificar contraseña
  const match = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!match) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  // Generar token JWT
  const token = jwt.sign(
    {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId || null
    },
    SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token, usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol, sucursalId: usuario.sucursalId } });
}
