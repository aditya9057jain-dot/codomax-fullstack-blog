const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
