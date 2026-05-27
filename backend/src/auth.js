import jwt from 'jsonwebtoken';

export function makeToken(player) {
  return jwt.sign({ id: player.id, name: player.name, role: player.role }, process.env.JWT_SECRET, { expiresIn: '14d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sisselogimine puudub' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sessioon on aegunud' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admini õigused puuduvad' });
  next();
}
