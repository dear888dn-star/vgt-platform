const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[auth] JWT_SECRET o\'rnatilmagan — vaqtinchalik kalit ishlatilmoqda (qayta ishga tushganda sessiyalar bekor bo\'ladi).');
  return crypto.randomBytes(32).toString('hex');
})();
const COOKIE = 'vgt_token';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

function issue(res, user) {
  const token = jwt.sign({ uid: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 3600 * 1000,
  });
}

function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { uid } = jwt.verify(token, JWT_SECRET);
      req.user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(uid));
    } catch { /* yaroqsiz token — mehmon sifatida davom etamiz */ }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Tizimga kiring' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Tizimga kiring' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
    next();
  };
}

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password, full_name, college, group_name, course, specialty } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email noto\'g\'ri' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Parol kamida 6 belgidan iborat bo\'lsin' });
  if (!full_name || full_name.trim().length < 3) return res.status(400).json({ error: 'F.I.Sh. kiriting' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Bu email bilan foydalanuvchi mavjud' });
  }
  const info = db.prepare(`INSERT INTO users (email, password_hash, full_name, role, college, group_name, course, specialty)
    VALUES (?, ?, ?, 'student', ?, ?, ?, ?)`).run(
    email.trim(), bcrypt.hashSync(password, 10), full_name.trim(),
    college || null, group_name ? group_name.trim() : null, course ? Number(course) : null, specialty || null,
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  issue(res, user);
  res.json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = email && db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
  }
  issue(res, user);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

router.get('/me', (req, res) => res.json({ user: req.user || null }));

router.put('/me', requireAuth, (req, res) => {
  const { full_name, college, group_name, course, specialty, password, current_password } = req.body || {};
  if (password) {
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(current_password || '', row.password_hash)) {
      return res.status(400).json({ error: 'Joriy parol noto\'g\'ri' });
    }
    if (password.length < 6) return res.status(400).json({ error: 'Yangi parol kamida 6 belgi' });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.user.id);
  }
  db.prepare(`UPDATE users SET full_name = COALESCE(?, full_name), college = ?, group_name = ?, course = ?, specialty = ? WHERE id = ?`)
    .run(full_name || null, college || null, group_name || null, course ? Number(course) : null, specialty || null, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

module.exports = { router, loadUser, requireAuth, requireRole, publicUser };
