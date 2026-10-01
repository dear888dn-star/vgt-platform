const express = require('express');
const { db, json } = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();
const JSON_FIELDS = ['objectives', 'keywords', 'methods', 'quiz', 'practice', 'resources'];

function hydrate(t, { hideAnswers } = {}) {
  if (!t) return t;
  const out = { ...t };
  for (const f of JSON_FIELDS) out[f] = json.parse(t[f], []);
  if (hideAnswers) {
    out.quiz = out.quiz.map(({ answer, explanation, ...q }) => q);
  }
  return out;
}

router.get('/', requireAuth, (req, res) => {
  const staff = req.user.role !== 'student';
  const rows = db.prepare(`SELECT t.id, t.slug, t.module, t.order_no, t.title, t.hours, t.summary, t.is_published,
      p.status, p.quiz_best, p.quiz_attempts
    FROM topics t LEFT JOIN topic_progress p ON p.topic_id = t.id AND p.user_id = ?
    ${staff ? '' : 'WHERE t.is_published = 1'}
    ORDER BY t.order_no, t.id`).all(req.user.id);
  res.json({ topics: rows });
});

router.get('/:id', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM topics WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
  if (!t || (!t.is_published && req.user.role === 'student')) return res.status(404).json({ error: 'Mavzu topilmadi' });
  const staff = req.user.role !== 'student';
  db.prepare(`INSERT OR IGNORE INTO topic_progress (user_id, topic_id) VALUES (?, ?)`).run(req.user.id, t.id);
  const progress = db.prepare('SELECT * FROM topic_progress WHERE user_id = ? AND topic_id = ?').get(req.user.id, t.id);
  const responses = db.prepare('SELECT method_key, response, score FROM method_responses WHERE user_id = ? AND topic_id = ?')
    .all(req.user.id, t.id).map(r => ({ ...r, response: json.parse(r.response, null) }));
  const note = db.prepare('SELECT text FROM notes WHERE user_id = ? AND topic_id = ?').get(req.user.id, t.id);
  const assignments = db.prepare(`SELECT a.*, s.status AS sub_status, s.score AS sub_score
    FROM assignments a LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = ?
    WHERE a.topic_id = ?`).all(req.user.id, t.id);
  const nav = db.prepare(`SELECT id, title, order_no FROM topics WHERE is_published = 1 ORDER BY order_no, id`).all();
  const idx = nav.findIndex(n => n.id === t.id);
  res.json({
    topic: hydrate(t, { hideAnswers: !staff }),
    progress,
    responses,
    note: note?.text || '',
    assignments,
    prev: nav[idx - 1] || null,
    next: nav[idx + 1] || null,
  });
});

router.post('/:id/quiz', requireAuth, (req, res) => {
  const t = db.prepare('SELECT id, quiz FROM topics WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Mavzu topilmadi' });
  const quiz = json.parse(t.quiz, []);
  const answers = req.body?.answers || {};
  let correct = 0;
  const details = quiz.map((q, i) => {
    const given = answers[i];
    const ok = Array.isArray(q.answer)
      ? Array.isArray(given) && given.length === q.answer.length && q.answer.every(a => given.includes(a))
      : given === q.answer;
    if (ok) correct++;
    return { index: i, correct: ok, answer: q.answer, explanation: q.explanation || '' };
  });
  const score = quiz.length ? Math.round((correct / quiz.length) * 100) : 0;
  db.prepare(`INSERT INTO topic_progress (user_id, topic_id, status, quiz_score, quiz_best, quiz_attempts)
      VALUES (?, ?, 'started', ?, ?, 1)
      ON CONFLICT(user_id, topic_id) DO UPDATE SET quiz_score = excluded.quiz_score,
        quiz_best = MAX(COALESCE(quiz_best, 0), excluded.quiz_score), quiz_attempts = quiz_attempts + 1`)
    .run(req.user.id, t.id, score, score);
  res.json({ score, correct, total: quiz.length, details });
});

router.post('/:id/method', requireAuth, (req, res) => {
  const { method_key, method_type, response, score } = req.body || {};
  if (!method_key || !method_type) return res.status(400).json({ error: 'method_key kerak' });
  db.prepare(`INSERT INTO method_responses (user_id, topic_id, method_key, method_type, response, score)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, topic_id, method_key) DO UPDATE SET response = excluded.response, score = excluded.score, created_at = datetime('now')`)
    .run(req.user.id, req.params.id, method_key, method_type, JSON.stringify(response ?? null), score ?? null);
  res.json({ ok: true });
});

router.post('/:id/complete', requireAuth, (req, res) => {
  db.prepare(`INSERT INTO topic_progress (user_id, topic_id, status, completed_at) VALUES (?, ?, 'completed', datetime('now'))
    ON CONFLICT(user_id, topic_id) DO UPDATE SET status = 'completed', completed_at = COALESCE(completed_at, datetime('now'))`)
    .run(req.user.id, req.params.id);
  res.json({ ok: true });
});

router.post('/:id/time', requireAuth, (req, res) => {
  const sec = Math.max(0, Math.min(3600, Number(req.body?.seconds) || 0));
  db.prepare(`UPDATE topic_progress SET time_spent_sec = time_spent_sec + ? WHERE user_id = ? AND topic_id = ?`)
    .run(sec, req.user.id, req.params.id);
  res.json({ ok: true });
});

router.put('/:id/note', requireAuth, (req, res) => {
  db.prepare(`INSERT INTO notes (user_id, topic_id, text) VALUES (?, ?, ?)
    ON CONFLICT(user_id, topic_id) DO UPDATE SET text = excluded.text, updated_at = datetime('now')`)
    .run(req.user.id, req.params.id, String(req.body?.text || '').slice(0, 20000));
  res.json({ ok: true });
});

// ---- O'qituvchi/admin: mavzularni tahrirlash (o'quv qo'llanma matnini joylash uchun) ----
function topicPayload(b) {
  const p = {
    module: b.module || 'Umumiy',
    title: b.title,
    hours: b.hours ? Number(b.hours) : 2,
    summary: b.summary || '',
    content: b.content || '',
    is_published: b.is_published === false || b.is_published === 0 ? 0 : 1,
  };
  for (const f of JSON_FIELDS) p[f] = JSON.stringify(Array.isArray(b[f]) ? b[f] : []);
  return p;
}

router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ error: 'Sarlavha kerak' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_no), 0) AS m FROM topics').get().m;
  const p = topicPayload(b);
  const slug = (b.slug || b.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  const info = db.prepare(`INSERT INTO topics (slug, module, order_no, title, hours, summary, objectives, content, keywords, methods, quiz, practice, resources, is_published)
    VALUES (@slug, @module, @order_no, @title, @hours, @summary, @objectives, @content, @keywords, @methods, @quiz, @practice, @resources, @is_published)`)
    .run({ ...p, slug, order_no: b.order_no ? Number(b.order_no) : maxOrder + 1 });
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ error: 'Sarlavha kerak' });
  const p = topicPayload(b);
  db.prepare(`UPDATE topics SET module=@module, title=@title, hours=@hours, summary=@summary, objectives=@objectives, content=@content,
      keywords=@keywords, methods=@methods, quiz=@quiz, practice=@practice, resources=@resources, is_published=@is_published,
      order_no=COALESCE(@order_no, order_no), updated_at=datetime('now') WHERE id=@id`)
    .run({ ...p, order_no: b.order_no ? Number(b.order_no) : null, id: req.params.id });
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
