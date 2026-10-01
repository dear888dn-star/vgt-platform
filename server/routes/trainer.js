// Virtual gidlik trenajyori — platformaning asosiy yadrosi
const express = require('express');
const { db, json } = require('../db');
const { requireAuth, requireRole } = require('../auth');
const ai = require('../ai');
const { scenarios, CRITERIA, LANGUAGES } = require('../../data/scenarios');
const offline = require('../trainer-offline');

const router = express.Router();
const byId = Object.fromEntries(scenarios.map(s => [s.id, s]));
const MOOD_RE = /<<kayfiyat:\s*(\d)\s*>>/gi;

function publicScenario(s) {
  const { facts, events, offline: _o, persona, ...rest } = s;
  return { ...rest, events_count: events.length };
}

function rolePlaySystem(s, lang) {
  const L = LANGUAGES[lang] || LANGUAGES.uz;
  return `Siz "Virtual gidlik trenajyori"ning sun'iy intellekt qismisiz. Turizm va madaniy meros texnikumi o'quvchisi (bo'lajak gid / turizm mutaxassisi) real vaziyatda mashq qilmoqda. Siz u bilan ishlayotgan TURIST(LAR) va atrof-muhit rolini o'ynaysiz.

VAZIYAT: ${s.title}
Joy: ${s.location}
Qiyinlik darajasi: ${s.level}
Tavsif: ${s.situation}

SIZNING ROLINGIZ (persona):
${s.persona}

TEKSHIRILADIGAN FAKTLAR (gid xato gapirsa, turist sifatida tabiiy ravishda shubha bildiring yoki aniqlik so'rang, lekin to'g'ri javobni o'zingiz aytib bermang):
${s.facts.map(f => '- ' + f).join('\n')}

O'YIN QOIDALARI:
1. Faqat turist(lar) va zarur bo'lsa atrof-muhit (masalan, mehmonxona xodimi, politsiya, ob-havo) nomidan gapiring. Atrofdagi hodisalarni *yulduzcha ichida* qisqa tasvirlang.
2. Muloqot tili: ${L.name}. Turist shu tilda gapiradi. ${L.note}
3. Javoblaringiz qisqa va jonli bo'lsin (1–4 gap), real turistdek savol bering, his-tuyg'u bildiring, ba'zan e'tiroz qiling.
4. Gidga hech qachon maslahat bermang va "to'g'ri javob"ni o'rgatmang — bu trenajyor. Siz faqat turistsiz.
5. Gidning xushmuomalaligi, aniqligi va tezkorligiga qarab kayfiyatingiz o'zgarsin. Agar gid yaxshi ishlasa — mamnun bo'ling; qo'pol, noaniq yoki befarq bo'lsa — norozilik bildiring.
6. Agar gid raqamli vositalardan (navigatsiya, onlayn bron, tarjimon ilova, QR-gid, AR/VR, onlayn to'lov va h.k.) o'rinli foydalansa, bunga ijobiy munosabat bildiring.
7. Tizim sizga "KUTILMAGAN VAZIYAT" haqida xabar bersa, uni darhol tabiiy ravishda sahnaga kiriting.
8. Har bir javobingiz oxirida alohida qatorda turistning hozirgi kayfiyatini quyidagi formatda yozing: <<kayfiyat:N>> (N — 1 dan 5 gacha; 1 = juda norozi, 5 = juda mamnun). Bu belgi o'quvchiga ko'rinmaydi.
9. Rolni hech qachon tark etmang, o'zingizni sun'iy intellekt deb tanishtirmang.`;
}

function apiMessages(session, scenario) {
  const msgs = [{ role: 'user', content: `[Trenajyor boshlandi. Gid ${scenario.location}da turist(lar) bilan uchrashdi.]` }];
  for (const m of json.parse(session.messages, [])) {
    const prev = msgs[msgs.length - 1];
    if (m.role === 'event') {
      // Ketma-ket bir nechta vaziyat bitta tizim xabariga birlashtiriladi (tizim xabari foydalanuvchi xabaridan keyin turishi shart)
      if (prev.role === 'system') prev.content += `\nKUTILMAGAN VAZIYAT: ${m.content}`;
      else msgs.push({ role: 'system', content: `KUTILMAGAN VAZIYAT: ${m.content}` });
    } else msgs.push({ role: m.role, content: m.content });
  }
  return msgs;
}

function elapsedSec(session) {
  return Math.round((Date.now() - new Date(session.started_at + 'Z').getTime()) / 1000);
}

router.get('/scenarios', requireAuth, (req, res) => {
  const stats = db.prepare(`SELECT scenario_id, COUNT(*) AS attempts, MAX(score_total) AS best
    FROM trainer_sessions WHERE user_id = ? AND status = 'finished' GROUP BY scenario_id`).all(req.user.id);
  const map = Object.fromEntries(stats.map(s => [s.scenario_id, s]));
  res.json({
    aiEnabled: ai.AI_ENABLED,
    criteria: CRITERIA,
    languages: Object.entries(LANGUAGES).map(([code, l]) => ({ code, name: l.name })),
    scenarios: scenarios.map(s => ({ ...publicScenario(s), attempts: map[s.id]?.attempts || 0, best: map[s.id]?.best ?? null })),
  });
});

router.post('/sessions', requireAuth, (req, res) => {
  const s = byId[req.body?.scenario_id];
  if (!s) return res.status(404).json({ error: 'Ssenariy topilmadi' });
  const lang = LANGUAGES[req.body?.language] ? req.body.language : 'uz';
  const opening = s.opening[lang] || s.opening.uz;
  const info = db.prepare(`INSERT INTO trainer_sessions (user_id, scenario_id, language, mode, messages) VALUES (?, ?, ?, ?, ?)`)
    .run(req.user.id, s.id, lang, ai.AI_ENABLED ? 'ai' : 'offline', JSON.stringify([{ role: 'assistant', content: opening }]));
  res.json({ id: info.lastInsertRowid });
});

function loadSession(req, res) {
  const row = db.prepare('SELECT * FROM trainer_sessions WHERE id = ?').get(req.params.id);
  if (!row || (row.user_id !== req.user.id && req.user.role === 'student')) {
    res.status(404).json({ error: 'Mashg\'ulot topilmadi' });
    return null;
  }
  return row;
}

function sessionView(row) {
  const s = byId[row.scenario_id];
  return {
    ...row,
    messages: json.parse(row.messages, []),
    events_fired: json.parse(row.events_fired, []),
    scores: json.parse(row.scores, null),
    feedback: json.parse(row.feedback, null),
    elapsed_sec: row.status === 'active' ? elapsedSec(row) : row.duration_sec,
    scenario: s ? publicScenario(s) : null,
  };
}

router.get('/sessions', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT id, scenario_id, language, mode, status, score_total, hints_used, started_at, finished_at, duration_sec
    FROM trainer_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 100`).all(req.user.id);
  res.json({ sessions: rows.map(r => ({ ...r, scenario_title: byId[r.scenario_id]?.title })) });
});

router.get('/sessions/:id', requireAuth, (req, res) => {
  const row = loadSession(req, res);
  if (row) res.json({ session: sessionView(row), criteria: CRITERIA });
});

// Navbatdagi kutilmagan vaziyatni aniqlash (navbat raqami yoki o'tgan vaqt bo'yicha)
function dueEvent(s, row, turn) {
  const fired = json.parse(row.events_fired, []);
  const el = elapsedSec(row);
  return s.events.find((e, i) => !fired.includes(i) && (turn >= e.at_turn || (e.at_sec && el >= e.at_sec)));
}

router.post('/sessions/:id/message', requireAuth, async (req, res) => {
  const row = loadSession(req, res);
  if (!row) return;
  if (row.status !== 'active') return res.status(400).json({ error: 'Mashg\'ulot yakunlangan' });
  const text = String(req.body?.text || '').trim().slice(0, 4000);
  if (!text) return res.status(400).json({ error: 'Xabar bo\'sh' });
  const s = byId[row.scenario_id];
  const messages = json.parse(row.messages, []);
  messages.push({ role: 'user', content: text, t: elapsedSec(row) });
  const turn = messages.filter(m => m.role === 'user').length;

  const fired = json.parse(row.events_fired, []);
  const ev = dueEvent(s, row, turn);
  let eventText = null;
  if (ev) {
    fired.push(s.events.indexOf(ev));
    eventText = ev.text;
    messages.push({ role: 'event', content: ev.text });
  }
  if (elapsedSec(row) > s.duration_min * 60 && !messages.some(m => m.role === 'event' && m.timeup)) {
    messages.push({ role: 'event', content: 'Ajratilgan vaqt tugadi. Turist(lar) vaqt cho\'zilib ketganidan biroz xavotirda — buni bildiring.', timeup: true });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  const send = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  if (eventText) send('event', { text: eventText });

  const save = reply => {
    messages.push({ role: 'assistant', content: reply, t: elapsedSec(row) });
    db.prepare('UPDATE trainer_sessions SET messages = ?, events_fired = ? WHERE id = ?')
      .run(JSON.stringify(messages), JSON.stringify(fired), row.id);
  };

  try {
    let reply;
    if (row.mode === 'ai' && ai.AI_ENABLED) {
      const msgs = apiMessages({ messages: JSON.stringify(messages) }, s);
      reply = await ai.streamRolePlay({
        system: rolePlaySystem(s, row.language),
        messages: msgs,
        onText: delta => send('delta', { text: delta }),
      });
    } else {
      reply = offline.reply(s, row.language, messages, eventText);
      send('delta', { text: reply });
    }
    save(reply);
    const mood = [...reply.matchAll(MOOD_RE)].pop();
    send('done', { mood: mood ? Number(mood[1]) : null });
  } catch (e) {
    console.error('[trainer] AI xatosi:', e?.message);
    send('error', { error: ai.describeError(e) });
  }
  res.end();
});

const COACH_SYSTEM = `Siz tajribali gid-metodist va murabbiysiz. Turizm texnikumi o'quvchisi trenajyorda turist bilan muloqot qilmoqda. Suhbat tarixini ko'rib, o'quvchiga HOZIR nima qilish kerakligi haqida 2–3 ta qisqa, amaliy maslahat bering (o'zbek tilida, tayyor javob matnini yozib bermang — yo'nalish ko'rsating). Kerak bo'lsa qaysi raqamli vositadan foydalanish mumkinligini ham ayting.`;

function transcript(session, scenario) {
  const lines = [];
  for (const m of json.parse(session.messages, [])) {
    const c = String(m.content).replace(MOOD_RE, '').trim();
    if (m.role === 'user') lines.push(`GID (o'quvchi): ${c}`);
    else if (m.role === 'assistant') lines.push(`TURIST: ${c}`);
    else lines.push(`[KUTILMAGAN VAZIYAT: ${c}]`);
  }
  return `Ssenariy: ${scenario.title} (${scenario.location})\nVaziyat: ${scenario.situation}\nKutilgan ko'nikmalar: ${scenario.goals.join('; ')}\n\nSUHBAT:\n${lines.join('\n')}`;
}

router.post('/sessions/:id/hint', requireAuth, async (req, res) => {
  const row = loadSession(req, res);
  if (!row) return;
  const s = byId[row.scenario_id];
  db.prepare('UPDATE trainer_sessions SET hints_used = hints_used + 1 WHERE id = ?').run(row.id);
  if (row.mode !== 'ai' || !ai.AI_ENABLED) return res.json({ hint: offline.hint(s, json.parse(row.messages, [])) });
  try {
    const hint = await ai.complete({ system: COACH_SYSTEM, messages: [{ role: 'user', content: transcript(row, s) }], effort: 'low' });
    res.json({ hint });
  } catch (e) {
    res.status(502).json({ error: ai.describeError(e) });
  }
});

const EVAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['criteria', 'strengths', 'improvements', 'recommendations', 'summary', 'mistakes'],
  properties: {
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'score', 'comment'],
        properties: {
          key: { type: 'string', enum: CRITERIA.map(c => c.key) },
          score: { type: 'integer', enum: [1, 2, 3, 4, 5] },
          comment: { type: 'string' },
        },
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
    mistakes: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
};

function evalSystem() {
  return `Siz turizm ta'limi bo'yicha ekspert-baholovchisiz. Virtual gidlik trenajyoridagi suhbat asosida o'quvchining (bo'lajak gidning) kasbiy faoliyatini xolis baholang. Faqat o'quvchi (GID) xabarlarini baholang.

Mezonlar (har biri 1–5 ball):
${CRITERIA.map(c => `- ${c.key} — ${c.name}: ${c.description}\n  1 ball: ${c.low}\n  5 ball: ${c.high}`).join('\n')}

Qoidalar:
- Har bir mezon uchun bitta baho va 1–2 gaplik asoslangan izoh yozing (suhbatdan misol keltiring).
- "mistakes" — faktik yoki kasbiy xatolar ro'yxati (bo'lmasa bo'sh ro'yxat).
- "strengths", "improvements", "recommendations" — har biri 2–4 band, aniq va amaliy.
- O'quvchi juda kam yozgan bo'lsa yoki vaziyatni hal qilmagan bo'lsa, shunga mos past baho qo'ying.
- Barcha matnlar o'zbek tilida (lotin yozuvida) bo'lsin.`;
}

router.post('/sessions/:id/finish', requireAuth, async (req, res) => {
  const row = loadSession(req, res);
  if (!row) return;
  if (row.status === 'finished') return res.json({ session: sessionView(row) });
  const s = byId[row.scenario_id];
  const msgs = json.parse(row.messages, []);
  const duration = elapsedSec(row);
  let result;
  try {
    if (row.mode === 'ai' && ai.AI_ENABLED && msgs.some(m => m.role === 'user')) {
      result = await ai.complete({
        system: evalSystem(),
        messages: [{ role: 'user', content: `${transcript(row, s)}\n\nQo'shimcha: o'quvchi ${row.hints_used} marta maslahat so'radi; mashg'ulot davomiyligi ${Math.round(duration / 60)} daqiqa (reja: ${s.duration_min} daqiqa).` }],
        effort: 'medium',
        schema: EVAL_SCHEMA,
      });
      result.mode = 'ai';
    } else {
      result = offline.evaluate(s, msgs, row.hints_used, CRITERIA);
    }
  } catch (e) {
    console.error('[trainer] baholash xatosi:', e?.message);
    result = offline.evaluate(s, msgs, row.hints_used, CRITERIA);
    result.note = `AI baholash amalga oshmadi (${ai.describeError(e)}). Taxminiy oflayn baholash ko'rsatildi.`;
  }
  const byKey = Object.fromEntries(result.criteria.map(c => [c.key, c]));
  const criteria = CRITERIA.map(c => byKey[c.key] || { key: c.key, score: 1, comment: 'Baholanmadi' });
  const weightSum = CRITERIA.reduce((a, c) => a + c.weight, 0);
  const weighted = CRITERIA.reduce((a, c, i) => a + c.weight * criteria[i].score, 0) / weightSum;
  const total = Math.max(0, Math.round(((weighted - 1) / 4) * 100) - Math.min(row.hints_used, 5) * 2);
  db.prepare(`UPDATE trainer_sessions SET status = 'finished', finished_at = datetime('now'), duration_sec = ?, scores = ?, score_total = ?, feedback = ? WHERE id = ?`)
    .run(duration, JSON.stringify(criteria), total, JSON.stringify(result), row.id);
  res.json({ session: sessionView(db.prepare('SELECT * FROM trainer_sessions WHERE id = ?').get(row.id)), criteria: CRITERIA });
});

// ---- O'qituvchi uchun: barcha o'quvchilar natijalari ----
router.get('/report', requireRole('teacher', 'admin'), (req, res) => {
  const group = req.query.group || '';
  const rows = db.prepare(`SELECT t.id, t.user_id, t.scenario_id, t.language, t.mode, t.score_total, t.scores, t.hints_used, t.duration_sec, t.finished_at,
      u.full_name, u.group_name, u.email
    FROM trainer_sessions t JOIN users u ON u.id = t.user_id
    WHERE t.status = 'finished' AND (? = '' OR u.group_name = ?) ORDER BY t.id DESC`).all(group, group);
  const perCriterion = Object.fromEntries(CRITERIA.map(c => [c.key, []]));
  const perScenario = {};
  for (const r of rows) {
    for (const c of json.parse(r.scores, [])) perCriterion[c.key]?.push(c.score);
    (perScenario[r.scenario_id] ||= []).push(r.score_total);
  }
  const avg = a => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100 : null);
  // Har bir o'quvchi uchun birinchi va oxirgi urinish (trenajyor samaradorligi dinamikasi)
  const byUser = {};
  for (const r of [...rows].reverse()) (byUser[r.user_id] ||= { full_name: r.full_name, group_name: r.group_name, scores: [] }).scores.push(r.score_total);
  const S = require('../stats');
  const firsts = [], lasts = [];
  for (const u of Object.values(byUser)) if (u.scores.length >= 2) { firsts.push(u.scores[0]); lasts.push(u.scores[u.scores.length - 1]); }
  res.json({
    criteria: CRITERIA,
    total: rows.length,
    avgScore: avg(rows.map(r => r.score_total)),
    perCriterion: CRITERIA.map(c => ({ key: c.key, name: c.name, mean: avg(perCriterion[c.key]), n: perCriterion[c.key].length })),
    perScenario: Object.entries(perScenario).map(([id, arr]) => ({ id, title: byId[id]?.title || id, n: arr.length, mean: avg(arr) })),
    students: Object.entries(byUser).map(([id, u]) => ({ id: Number(id), ...u, attempts: u.scores.length, first: u.scores[0], last: u.scores[u.scores.length - 1], best: Math.max(...u.scores) })),
    dynamics: S.pairedTTest(firsts, lasts),
    sessions: rows.slice(0, 300).map(r => ({ ...r, scores: json.parse(r.scores, []), scenario_title: byId[r.scenario_id]?.title })),
  });
});

module.exports = router;
