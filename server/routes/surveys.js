const express = require('express');
const { db, json } = require('../db');
const { requireAuth, requireRole } = require('../auth');
const S = require('../stats');

const router = express.Router();
const TYPES = ['likert', 'single', 'multiple', 'scale', 'text', 'number', 'matrix'];
const DEFAULT_LIKERT = ['Mutlaqo qo\'shilmayman', 'Qo\'shilmayman', 'Betarafman', 'Qo\'shilaman', 'To\'liq qo\'shilaman'];

function audienceFor(user) { return user.role === 'student' ? 'student' : 'teacher'; }

function hydrate(s) {
  return { ...s, questions: json.parse(s.questions, []) };
}

router.get('/', requireAuth, (req, res) => {
  const staff = req.user.role !== 'student';
  const rows = db.prepare(`SELECT s.id, s.slug, s.title, s.description, s.kind, s.audience, s.is_active, s.allow_multiple, s.pair_slug,
      json_array_length(s.questions) AS question_count,
      (SELECT COUNT(*) FROM survey_responses r WHERE r.survey_id = s.id AND r.user_id = ?) AS my_count,
      (SELECT COUNT(*) FROM survey_responses r WHERE r.survey_id = s.id) AS total_count
    FROM surveys s ORDER BY s.id`).all(req.user.id);
  const visible = staff && req.query.all ? rows : rows.filter(s => s.is_active && (s.audience === 'all' || s.audience === audienceFor(req.user)));
  res.json({ surveys: visible.map(s => (staff ? s : { ...s, total_count: undefined })) });
});

router.get('/:id', requireAuth, (req, res) => {
  const s = db.prepare('SELECT * FROM surveys WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
  if (!s) return res.status(404).json({ error: 'So\'rovnoma topilmadi' });
  const mine = db.prepare('SELECT id, created_at FROM survey_responses WHERE survey_id = ? AND user_id = ? ORDER BY id DESC').all(s.id, req.user.id);
  res.json({ survey: hydrate(s), myResponses: mine });
});

function validateAnswers(questions, answers) {
  for (const q of questions) {
    const v = answers[q.id];
    const empty = v == null || v === '' || (Array.isArray(v) && !v.length) ||
      (q.type === 'matrix' && (typeof v !== 'object' || (q.rows || []).some((_, i) => v[i] == null)));
    if (q.required !== false && q.type !== 'text' && empty) return `Javob berilmagan: "${q.text}"`;
  }
  return null;
}

router.post('/:id/respond', requireAuth, (req, res) => {
  const s = db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
  if (!s || !s.is_active) return res.status(404).json({ error: 'So\'rovnoma faol emas' });
  if (s.audience !== 'all' && s.audience !== audienceFor(req.user) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu so\'rovnoma siz uchun emas' });
  }
  if (!s.allow_multiple && db.prepare('SELECT 1 FROM survey_responses WHERE survey_id = ? AND user_id = ?').get(s.id, req.user.id)) {
    return res.status(409).json({ error: 'Siz bu so\'rovnomadan o\'tgansiz' });
  }
  const questions = json.parse(s.questions, []);
  const answers = req.body?.answers || {};
  const err = validateAnswers(questions, answers);
  if (err) return res.status(400).json({ error: err });
  const clean = {};
  for (const q of questions) if (answers[q.id] !== undefined) clean[q.id] = answers[q.id];
  db.prepare('INSERT INTO survey_responses (survey_id, user_id, answers) VALUES (?, ?, ?)').run(s.id, req.user.id, JSON.stringify(clean));
  res.json({ ok: true });
});

// ----------- Natijalar (o'qituvchi / admin) -----------

function loadResponses(surveyId, filters = {}) {
  const rows = db.prepare(`SELECT r.id, r.user_id, r.answers, r.created_at, u.full_name, u.email, u.group_name, u.college, u.course, u.role
    FROM survey_responses r JOIN users u ON u.id = r.user_id
    WHERE r.survey_id = ? AND (? = '' OR u.group_name = ?) AND (? = '' OR u.college = ?)
    ORDER BY r.id`).all(surveyId, filters.group || '', filters.group || '', filters.college || '', filters.college || '');
  return rows.map(r => ({ ...r, answers: json.parse(r.answers, {}) }));
}

function numeric(q, v) {
  if (v == null || v === '') return null;
  if (q.type === 'likert' || q.type === 'scale' || q.type === 'number') return Number(v);
  if (q.type === 'single' && q.scores) {
    const i = (q.options || []).indexOf(v);
    return i >= 0 ? q.scores[i] : null;
  }
  return null;
}

// Har bir respondent uchun yo'nalish (dimension) bo'yicha o'rtacha ball
function dimensionScores(questions, answers) {
  const acc = {};
  const add = (dim, x) => {
    if (!dim || x == null || Number.isNaN(x)) return;
    (acc[dim] ||= []).push(x);
  };
  for (const q of questions) {
    const v = answers[q.id];
    if (q.type === 'matrix') {
      const max = (q.columns || DEFAULT_LIKERT).length;
      (q.rows || []).forEach((row, i) => {
        const dim = typeof row === 'object' ? row.dimension : q.dimension;
        if (v && v[i] != null) add(dim || q.dimension, row.reverse ? max + 1 - Number(v[i]) : Number(v[i]));
      });
    } else {
      const x = numeric(q, v);
      add(q.dimension, x != null && q.reverse ? (q.options || DEFAULT_LIKERT).length + 1 - x : x);
    }
  }
  const out = {};
  for (const [k, arr] of Object.entries(acc)) out[k] = S.mean(arr);
  return out;
}

function levelOf(m, max) {
  if (m == null) return null;
  const pct = (m - 1) / ((max || 5) - 1);
  return pct < 0.4 ? 'past' : pct < 0.7 ? 'o\'rta' : 'yuqori';
}

function aggregate(survey, responses) {
  const questions = survey.questions;
  const perQuestion = questions.map(q => {
    const vals = responses.map(r => r.answers[q.id]).filter(v => v != null && v !== '');
    const base = { id: q.id, text: q.text, type: q.type, section: q.section || null, dimension: q.dimension || null, n: vals.length };
    if (q.type === 'single' || q.type === 'multiple') {
      const counts = Object.fromEntries((q.options || []).map(o => [o, 0]));
      let other = 0;
      for (const v of vals) for (const x of [].concat(v)) {
        if (x in counts) counts[x]++; else other++;
      }
      const nums = vals.map(v => numeric(q, v)).filter(x => x != null);
      return { ...base, counts, other, mean: S.round(S.mean(nums)) };
    }
    if (q.type === 'likert' || q.type === 'scale' || q.type === 'number') {
      const nums = vals.map(Number).filter(x => !Number.isNaN(x));
      const dist = {};
      const lo = q.type === 'likert' ? 1 : (q.min ?? 1);
      const hi = q.type === 'likert' ? (q.options || DEFAULT_LIKERT).length : (q.max ?? 10);
      if (q.type !== 'number') for (let i = lo; i <= hi; i++) dist[i] = 0;
      for (const x of nums) dist[x] = (dist[x] || 0) + 1;
      return { ...base, mean: S.round(S.mean(nums)), sd: S.round(S.sd(nums)), dist, labels: q.type === 'likert' ? (q.options || DEFAULT_LIKERT) : null };
    }
    if (q.type === 'matrix') {
      const cols = q.columns || DEFAULT_LIKERT;
      const rows = (q.rows || []).map((row, i) => {
        const nums = responses.map(r => r.answers[q.id]?.[i]).filter(x => x != null).map(Number);
        const dist = {};
        for (let c = 1; c <= cols.length; c++) dist[c] = 0;
        for (const x of nums) dist[x] = (dist[x] || 0) + 1;
        return { text: typeof row === 'object' ? row.text : row, n: nums.length, mean: S.round(S.mean(nums)), sd: S.round(S.sd(nums)), dist };
      });
      const alpha = S.cronbachAlpha((q.rows || []).map((_, i) => responses
        .filter(r => (q.rows || []).every((__, j) => r.answers[q.id]?.[j] != null))
        .map(r => {
          const x = Number(r.answers[q.id][i]);
          return q.rows[i]?.reverse ? cols.length + 1 - x : x;
        })));
      return { ...base, n: responses.filter(r => r.answers[q.id]).length, columns: cols, rows, cronbachAlpha: alpha };
    }
    return { ...base, texts: vals.slice(-200).map(String) };
  });

  const dims = {};
  for (const r of responses) {
    for (const [k, v] of Object.entries(dimensionScores(questions, r.answers))) (dims[k] ||= []).push(v);
  }
  const dimensions = Object.entries(dims).map(([name, arr]) => {
    const m = S.mean(arr);
    const levels = { past: 0, "o'rta": 0, yuqori: 0 };
    for (const x of arr) levels[levelOf(x, 5)]++;
    return { name, n: arr.length, mean: S.round(m), sd: S.round(S.sd(arr)), level: levelOf(m, 5), levels };
  });

  const byGroup = {};
  for (const r of responses) (byGroup[r.group_name || '—'] ||= 0), byGroup[r.group_name || '—']++;

  return { total: responses.length, byGroup, perQuestion, dimensions };
}

router.get('/:id/results', requireRole('teacher', 'admin'), (req, res) => {
  const s = db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Topilmadi' });
  const survey = hydrate(s);
  const responses = loadResponses(s.id, req.query);
  const groups = db.prepare(`SELECT DISTINCT u.group_name FROM survey_responses r JOIN users u ON u.id = r.user_id
    WHERE r.survey_id = ? AND u.group_name IS NOT NULL ORDER BY 1`).all(s.id).map(g => g.group_name);
  res.json({
    survey,
    groups,
    ...aggregate(survey, responses),
    respondents: responses.map(r => ({ id: r.id, full_name: r.full_name, email: r.email, group_name: r.group_name, created_at: r.created_at })),
  });
});

router.get('/:id/responses/:rid', requireRole('teacher', 'admin'), (req, res) => {
  const r = db.prepare(`SELECT r.*, u.full_name, u.email, u.group_name FROM survey_responses r JOIN users u ON u.id = r.user_id
    WHERE r.id = ? AND r.survey_id = ?`).get(req.params.rid, req.params.id);
  if (!r) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ response: { ...r, answers: json.parse(r.answers, {}) } });
});

// Oldin/keyin (pre-test / post-test) taqqoslash: juftlashgan t-test har bir yo'nalish bo'yicha
router.get('/:id/compare', requireRole('teacher', 'admin'), (req, res) => {
  const pre = db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
  if (!pre || !pre.pair_slug) return res.status(400).json({ error: 'Bu so\'rovnoma uchun juft (yakuniy) so\'rovnoma belgilanmagan' });
  const post = db.prepare('SELECT * FROM surveys WHERE slug = ?').get(pre.pair_slug);
  if (!post) return res.status(404).json({ error: 'Juft so\'rovnoma topilmadi' });
  const preS = hydrate(pre), postS = hydrate(post);
  const lastByUser = (survey, rows) => {
    const m = new Map();
    for (const r of rows) m.set(r.user_id, dimensionScores(survey.questions, r.answers));
    return m;
  };
  const preMap = lastByUser(preS, loadResponses(pre.id, req.query));
  const postMap = lastByUser(postS, loadResponses(post.id, req.query));
  const dimNames = new Set();
  for (const m of [preMap, postMap]) for (const v of m.values()) Object.keys(v).forEach(k => dimNames.add(k));
  const dimensions = [...dimNames].map(name => {
    const pairedPre = [], pairedPost = [];
    for (const [uid, d] of preMap) {
      const p2 = postMap.get(uid);
      if (d[name] != null && p2?.[name] != null) { pairedPre.push(d[name]); pairedPost.push(p2[name]); }
    }
    const allPre = [...preMap.values()].map(d => d[name]).filter(x => x != null);
    const allPost = [...postMap.values()].map(d => d[name]).filter(x => x != null);
    return {
      name,
      preMean: S.round(S.mean(allPre)), postMean: S.round(S.mean(allPost)),
      preN: allPre.length, postN: allPost.length,
      paired: S.pairedTTest(pairedPre, pairedPost),
    };
  });
  res.json({ pre: { id: pre.id, title: pre.title }, post: { id: post.id, title: post.title }, dimensions });
});

function csvCell(v) {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

router.get('/:id/export.csv', requireRole('teacher', 'admin'), (req, res) => {
  const s = db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).end();
  const survey = hydrate(s);
  const responses = loadResponses(s.id, req.query);
  const headers = ['#', 'F.I.Sh.', 'Email', 'Texnikum', 'Guruh', 'Kurs', 'Sana'];
  const cols = [];
  for (const q of survey.questions) {
    if (q.type === 'matrix') (q.rows || []).forEach((row, i) => { headers.push(`${q.id}.${i + 1} ${typeof row === 'object' ? row.text : row}`); cols.push([q.id, i]); });
    else { headers.push(`${q.id} ${q.text}`); cols.push([q.id, null]); }
  }
  const dimNames = [...new Set(survey.questions.flatMap(q => q.type === 'matrix'
    ? (q.rows || []).map(r => (typeof r === 'object' && r.dimension) || q.dimension) : [q.dimension]).filter(Boolean))];
  headers.push(...dimNames.map(d => `[Indeks] ${d}`));
  const lines = [headers.map(csvCell).join(';')];
  responses.forEach((r, n) => {
    const row = [n + 1, r.full_name, r.email, r.college, r.group_name, r.course, r.created_at];
    for (const [qid, i] of cols) row.push(i == null ? r.answers[qid] : r.answers[qid]?.[i]);
    const ds = dimensionScores(survey.questions, r.answers);
    row.push(...dimNames.map(d => S.round(ds[d])));
    lines.push(row.map(csvCell).join(';'));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${s.slug}-natijalar.csv"`);
  res.send('﻿' + lines.join('\r\n'));
});

// ----------- So'rovnoma konstruktori -----------
function validateSurvey(b) {
  if (!b.title) return 'Sarlavha kerak';
  if (!Array.isArray(b.questions) || !b.questions.length) return 'Kamida bitta savol kerak';
  const ids = new Set();
  for (const q of b.questions) {
    if (!q.id || !q.text) return 'Har bir savolda id va matn bo\'lishi kerak';
    if (ids.has(q.id)) return `Takroriy savol id: ${q.id}`;
    ids.add(q.id);
    if (!TYPES.includes(q.type)) return `Noma\'lum savol turi: ${q.type}`;
    if ((q.type === 'single' || q.type === 'multiple') && !(q.options || []).length) return `"${q.text}" uchun variantlar kerak`;
    if (q.type === 'matrix' && !(q.rows || []).length) return `"${q.text}" uchun qatorlar kerak`;
  }
  return null;
}

router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const b = req.body || {};
  const err = validateSurvey(b);
  if (err) return res.status(400).json({ error: err });
  const slug = (b.slug || 'sorovnoma') .toLowerCase().replace(/[^a-z0-9-]+/g, '-') + '-' + Date.now().toString(36);
  const info = db.prepare(`INSERT INTO surveys (slug, title, description, kind, audience, questions, is_active, allow_multiple, pair_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, b.title, b.description || '', b.kind || 'other', b.audience || 'student',
    JSON.stringify(b.questions), b.is_active === false ? 0 : 1, b.allow_multiple ? 1 : 0, b.pair_slug || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const b = req.body || {};
  const err = validateSurvey(b);
  if (err) return res.status(400).json({ error: err });
  db.prepare(`UPDATE surveys SET title=?, description=?, kind=?, audience=?, questions=?, is_active=?, allow_multiple=?, pair_slug=?, updated_at=datetime('now') WHERE id=?`)
    .run(b.title, b.description || '', b.kind || 'other', b.audience || 'student', JSON.stringify(b.questions),
      b.is_active === false ? 0 : 1, b.allow_multiple ? 1 : 0, b.pair_slug || null, req.params.id);
  res.json({ ok: true });
});

router.patch('/:id/active', requireRole('teacher', 'admin'), (req, res) => {
  db.prepare('UPDATE surveys SET is_active = ? WHERE id = ?').run(req.body?.is_active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM surveys WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
module.exports.aggregate = aggregate;
module.exports.dimensionScores = dimensionScores;
