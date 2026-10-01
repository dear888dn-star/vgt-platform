// Mustaqil ta'lim: topshiriqlar, javoblar, shaxsiy reja, eslatmalar, shaxsiy statistika
const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/overview', requireAuth, (req, res) => {
  const uid = req.user.id;
  const totalTopics = db.prepare('SELECT COUNT(*) AS c FROM topics WHERE is_published = 1').get().c;
  const completed = db.prepare(`SELECT COUNT(*) AS c FROM topic_progress WHERE user_id = ? AND status = 'completed'`).get(uid).c;
  const quizAvg = db.prepare('SELECT AVG(quiz_best) AS a FROM topic_progress WHERE user_id = ? AND quiz_best IS NOT NULL').get(uid).a;
  const timeSpent = db.prepare('SELECT COALESCE(SUM(time_spent_sec),0) AS s FROM topic_progress WHERE user_id = ?').get(uid).s;
  const trainer = db.prepare(`SELECT COUNT(*) AS c, AVG(score_total) AS a, MAX(score_total) AS m
    FROM trainer_sessions WHERE user_id = ? AND status = 'finished'`).get(uid);
  const methods = db.prepare('SELECT COUNT(*) AS c FROM method_responses WHERE user_id = ?').get(uid).c;
  const subs = db.prepare(`SELECT COUNT(*) AS c, AVG(CASE WHEN s.score IS NOT NULL THEN s.score * 100.0 / a.max_score END) AS a
    FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.user_id = ?`).get(uid);
  const surveysPending = db.prepare(`SELECT COUNT(*) AS c FROM surveys sv WHERE sv.is_active = 1
    AND sv.audience IN ('all', ?) AND NOT EXISTS (SELECT 1 FROM survey_responses r WHERE r.survey_id = sv.id AND r.user_id = ?)`)
    .get(req.user.role === 'student' ? 'student' : 'teacher', uid).c;
  const trainerHistory = db.prepare(`SELECT id, scenario_id, score_total, finished_at FROM trainer_sessions
    WHERE user_id = ? AND status = 'finished' ORDER BY id`).all(uid);
  res.json({
    totalTopics, completed,
    quizAvg: quizAvg == null ? null : Math.round(quizAvg),
    timeSpentMin: Math.round(timeSpent / 60),
    trainerCount: trainer.c, trainerAvg: trainer.a == null ? null : Math.round(trainer.a), trainerBest: trainer.m,
    methodsDone: methods,
    submissions: subs.c, submissionsAvg: subs.a == null ? null : Math.round(subs.a),
    surveysPending,
    trainerHistory,
  });
});

// ---- Topshiriqlar ----
router.get('/assignments', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT a.*, t.title AS topic_title, t.order_no AS topic_order,
      s.id AS sub_id, s.status AS sub_status, s.score AS sub_score, s.feedback AS sub_feedback, s.answer_text, s.link, s.submitted_at
    FROM assignments a
    LEFT JOIN topics t ON t.id = a.topic_id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = ?
    WHERE a.group_name IS NULL OR a.group_name = '' OR a.group_name = ? OR ? != 'student'
    ORDER BY COALESCE(t.order_no, 9999), a.id`).all(req.user.id, req.user.group_name || '', req.user.role);
  res.json({ assignments: rows });
});

router.post('/assignments/:id/submit', requireAuth, (req, res) => {
  const a = db.prepare('SELECT id FROM assignments WHERE id = ?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Topshiriq topilmadi' });
  const { answer_text, link } = req.body || {};
  if (!answer_text && !link) return res.status(400).json({ error: 'Javob matni yoki havola kiriting' });
  const existing = db.prepare('SELECT status FROM submissions WHERE assignment_id = ? AND user_id = ?').get(a.id, req.user.id);
  if (existing?.status === 'graded') return res.status(400).json({ error: 'Topshiriq baholangan, qayta yuborib bo\'lmaydi' });
  db.prepare(`INSERT INTO submissions (assignment_id, user_id, answer_text, link) VALUES (?, ?, ?, ?)
    ON CONFLICT(assignment_id, user_id) DO UPDATE SET answer_text = excluded.answer_text, link = excluded.link,
      status = 'submitted', submitted_at = datetime('now')`)
    .run(a.id, req.user.id, String(answer_text || '').slice(0, 50000), link || null);
  res.json({ ok: true });
});

router.post('/assignments', requireRole('teacher', 'admin'), (req, res) => {
  const { title, description, topic_id, group_name, due_date, max_score, kind } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'Sarlavha va tavsif kerak' });
  const info = db.prepare(`INSERT INTO assignments (topic_id, title, description, kind, group_name, due_date, max_score, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(topic_id || null, title, description, kind || 'mustaqil', group_name || null,
    due_date || null, Number(max_score) || 10, req.user.id);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/assignments/:id', requireRole('teacher', 'admin'), (req, res) => {
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/submissions', requireRole('teacher', 'admin'), (req, res) => {
  const rows = db.prepare(`SELECT s.*, a.title AS assignment_title, a.max_score, u.full_name, u.group_name, u.email
    FROM submissions s JOIN assignments a ON a.id = s.assignment_id JOIN users u ON u.id = s.user_id
    WHERE (? = '' OR s.status = ?) ORDER BY s.submitted_at DESC`).all(req.query.status || '', req.query.status || '');
  res.json({ submissions: rows });
});

router.post('/submissions/:id/grade', requireRole('teacher', 'admin'), (req, res) => {
  const { score, feedback } = req.body || {};
  db.prepare(`UPDATE submissions SET score = ?, feedback = ?, status = 'graded', graded_at = datetime('now') WHERE id = ?`)
    .run(score == null || score === '' ? null : Number(score), feedback || '', req.params.id);
  res.json({ ok: true });
});

// ---- Shaxsiy o'quv reja ----
router.get('/plan', requireAuth, (req, res) => {
  res.json({ items: db.prepare(`SELECT p.*, t.title AS topic_title FROM study_plan p LEFT JOIN topics t ON t.id = p.topic_id
    WHERE p.user_id = ? ORDER BY p.done, COALESCE(p.due_date, '9999'), p.id`).all(req.user.id) });
});

router.post('/plan', requireAuth, (req, res) => {
  const { title, topic_id, due_date } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Reja bandini kiriting' });
  db.prepare('INSERT INTO study_plan (user_id, title, topic_id, due_date) VALUES (?, ?, ?, ?)')
    .run(req.user.id, title, topic_id || null, due_date || null);
  res.json({ ok: true });
});

router.patch('/plan/:id', requireAuth, (req, res) => {
  db.prepare('UPDATE study_plan SET done = ? WHERE id = ? AND user_id = ?').run(req.body?.done ? 1 : 0, req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/plan/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM study_plan WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

router.get('/notes', requireAuth, (req, res) => {
  res.json({ notes: db.prepare(`SELECT n.*, t.title AS topic_title FROM notes n JOIN topics t ON t.id = n.topic_id
    WHERE n.user_id = ? AND n.text != '' ORDER BY n.updated_at DESC`).all(req.user.id) });
});

// Glossariy: barcha mavzulardagi kalit so'zlar
router.get('/glossary', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT id, title, keywords FROM topics WHERE is_published = 1 ORDER BY order_no').all();
  const terms = [];
  for (const r of rows) {
    for (const k of JSON.parse(r.keywords || '[]')) terms.push({ ...k, topic_id: r.id, topic_title: r.title });
  }
  terms.sort((a, b) => a.term.localeCompare(b.term, 'uz'));
  res.json({ terms });
});

module.exports = router;
