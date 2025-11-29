// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'AUTH_TOKEN_REQUIRED' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // aquí guardamos info del usuario autenticado
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'INVALID_OR_EXPIRED_TOKEN' });
  }
}

// 👇 MUY IMPORTANTE: exportar como objeto con la clave authMiddleware
module.exports = { authMiddleware };