// O'qituvchi / admin paneli: foydalanuvchilar, guruhlar, umumiy statistika
const express = require('express');
const bcrypt = require('bcryptjs');
const { db, json } = require('../db');
const { requireRole, publicUser } = require('../auth');

const router = express.Router();

router.get('/dashboard', requireRole('teacher', 'admin'), (req, res) => {
  const count = sql => db.prepare(sql).get().c;
  res.json({
    students: count(`SELECT COUNT(*) AS c FROM users WHERE role = 'student'`),
    teachers: count(`SELECT COUNT(*) AS c FROM users WHERE role != 'student'`),
    topics: count('SELECT COUNT(*) AS c FROM topics'),
    surveyResponses: count('SELECT COUNT(*) AS c FROM survey_responses'),
    trainerSessions: count(`SELECT COUNT(*) AS c FROM trainer_sessions WHERE status = 'finished'`),
    pendingSubmissions: count(`SELECT COUNT(*) AS c FROM submissions WHERE status = 'submitted'`),
    groups: db.prepare(`SELECT group_name, COUNT(*) AS c FROM users WHERE role = 'student' GROUP BY group_name ORDER BY group_name`).all(),
    recent: db.prepare(`SELECT 'survey' AS kind, u.full_name, s.title AS what, r.created_at AS at FROM survey_responses r
        JOIN users u ON u.id = r.user_id JOIN surveys s ON s.id = r.survey_id
      UNION ALL SELECT 'trainer', u.full_name, t.scenario_id, t.finished_at FROM trainer_sessions t JOIN users u ON u.id = t.user_id WHERE t.status = 'finished'
      UNION ALL SELECT 'submission', u.full_name, a.title, s.submitted_at FROM submissions s JOIN users u ON u.id = s.user_id JOIN assignments a ON a.id = s.assignment_id
      ORDER BY at DESC LIMIT 15`).all(),
  });
});

router.get('/students', requireRole('teacher', 'admin'), (req, res) => {
  const group = req.query.group || '';
  const rows = db.prepare(`SELECT u.id, u.full_name, u.email, u.group_name, u.college, u.course, u.created_at,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.user_id = u.id AND p.status = 'completed') AS topics_done,
      (SELECT ROUND(AVG(quiz_best)) FROM topic_progress p WHERE p.user_id = u.id AND quiz_best IS NOT NULL) AS quiz_avg,
      (SELECT COUNT(*) FROM trainer_sessions t WHERE t.user_id = u.id AND t.status = 'finished') AS trainer_count,
      (SELECT ROUND(AVG(score_total)) FROM trainer_sessions t WHERE t.user_id = u.id AND t.status = 'finished') AS trainer_avg,
      (SELECT COUNT(*) FROM survey_responses r WHERE r.user_id = u.id) AS surveys_done,
      (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) AS submissions
    FROM users u WHERE u.role = 'student' AND (? = '' OR u.group_name = ?) ORDER BY u.group_name, u.full_name`).all(group, group);
  res.json({ students: rows });
});

router.get('/students/:id', requireRole('teacher', 'admin'), (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Topilmadi' });
  res.json({
    user: publicUser(u),
    progress: db.prepare(`SELECT p.*, t.title FROM topic_progress p JOIN topics t ON t.id = p.topic_id WHERE p.user_id = ? ORDER BY t.order_no`).all(u.id),
    methods: db.prepare(`SELECT m.method_key, m.method_type, m.response, m.score, m.created_at, t.title AS topic_title
      FROM method_responses m JOIN topics t ON t.id = m.topic_id WHERE m.user_id = ? ORDER BY m.created_at DESC`).all(u.id)
      .map(m => ({ ...m, response: json.parse(m.response, null) })),
    trainer: db.prepare(`SELECT id, scenario_id, score_total, finished_at, hints_used, mode FROM trainer_sessions WHERE user_id = ? AND status = 'finished' ORDER BY id`).all(u.id),
    surveys: db.prepare(`SELECT r.id, r.survey_id, s.title, r.created_at FROM survey_responses r JOIN surveys s ON s.id = r.survey_id WHERE r.user_id = ?`).all(u.id),
    submissions: db.prepare(`SELECT s.*, a.title, a.max_score FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.user_id = ?`).all(u.id),
  });
});

// Foydalanuvchilarni boshqarish (faqat admin)
router.get('/users', requireRole('admin'), (_req, res) => {
  res.json({ users: db.prepare('SELECT id, email, full_name, role, college, group_name, course, created_at FROM users ORDER BY role, full_name').all() });
});

router.post('/users', requireRole('admin'), (req, res) => {
  const { email, password, full_name, role, college, group_name } = req.body || {};
  if (!email || !password || password.length < 6 || !full_name) return res.status(400).json({ error: 'Email, F.I.Sh. va parol (≥6) kerak' });
  if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ error: 'Rol noto\'g\'ri' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'Email band' });
  const info = db.prepare(`INSERT INTO users (email, password_hash, full_name, role, college, group_name) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(email.trim(), bcrypt.hashSync(password, 10), full_name, role, college || null, group_name || null);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/users/:id', requireRole('admin'), (req, res) => {
  const { role, password } = req.body || {};
  if (role) {
    if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ error: 'Rol noto\'g\'ri' });
    if (Number(req.params.id) === req.user.id && role !== 'admin') return res.status(400).json({ error: 'O\'zingizni admin rolidan chiqara olmaysiz' });
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Parol kamida 6 belgi' });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  }
  res.json({ ok: true });
});

router.delete('/users/:id', requireRole('admin'), (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'O\'zingizni o\'chira olmaysiz' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
