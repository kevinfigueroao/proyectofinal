import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Middleware para verificar JWT
export function autenticarJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function autenticarJWTopcional(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // No hay token, sigue como usuario no autenticado
    return next();
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded;
  } catch (err) {
    // Token inválido, pero sigue como no autenticado
    req.usuario = null;
  }
  next();
}






// Middleware para permitir solo administradores
export function soloAdmin(req, res, next) {
  // req.usuario debe tener el campo 'rol'
  if (req.usuario && req.usuario.rol === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Solo para administradores' });
}
