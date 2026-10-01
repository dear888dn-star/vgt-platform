process.env.DB_FILE = ':memory:';
process.env.AI_MODE = 'offline';
process.env.JWT_SECRET = 'test-secret';

const test = require('node:test');
const assert = require('node:assert');
const app = require('../server/index');
const S = require('../server/stats');

let server, base;
test.before(() => new Promise(r => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}/api`; r(); }); }));
test.after(() => server.close());

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + path, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
  });
  const setCookie = res.headers.get('set-cookie');
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, cookie: setCookie ? setCookie.split(';')[0] : cookie };
}

async function register(email, group = 'T-1') {
  return (await call('/auth/register', { method: 'POST', body: { email, password: 'secret1', full_name: 'Test ' + email, group_name: group } })).cookie;
}

test('statistika: juftlashgan t-test va Kronbax alfa', () => {
  const r = S.pairedTTest([2, 3, 2, 3, 2], [4, 4, 3, 5, 4]);
  assert.strictEqual(r.n, 5);
  assert.ok(r.t > 0 && r.p < 0.05);
  assert.strictEqual(S.pairedTTest([1], [2]), null);
  assert.ok(Math.abs(S.tPValue(2.228, 10) - 0.05) < 0.002);
  const alpha = S.cronbachAlpha([[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [2, 2, 3, 4, 4]]);
  assert.ok(alpha > 0.9);
});

test('ro\'yxatdan o\'tish, kirish va ruxsatlar', async () => {
  const c = await register('a@t.uz');
  assert.ok(c);
  const dup = await call('/auth/register', { method: 'POST', body: { email: 'a@t.uz', password: 'secret1', full_name: 'Abc' } });
  assert.strictEqual(dup.status, 409);
  const bad = await call('/auth/login', { method: 'POST', body: { email: 'a@t.uz', password: 'wrong' } });
  assert.strictEqual(bad.status, 401);
  assert.strictEqual((await call('/topics')).status, 401);
  assert.strictEqual((await call('/admin/dashboard', { cookie: c })).status, 403);
  assert.strictEqual((await call('/surveys/1/results', { cookie: c })).status, 403);
});

test('mavzu: test javoblari o\'quvchiga ko\'rinmaydi va baholanadi', async () => {
  const c = await register('b@t.uz');
  const { data } = await call('/topics/1', { cookie: c });
  assert.ok(data.topic.quiz.length > 0);
  assert.strictEqual(data.topic.quiz[0].answer, undefined);
  const r = await call('/topics/1/quiz', { method: 'POST', cookie: c, body: { answers: { 0: 1 } } });
  assert.strictEqual(r.status, 200);
  assert.ok(r.data.score >= 0 && r.data.score <= 100);
});

test('so\'rovnoma: bir marta to\'ldirish va o\'qituvchi natijalari', async () => {
  const c = await register('c@t.uz');
  const { data } = await call('/surveys/4', { cookie: c });
  const q = data.survey.questions[0];
  const answers = { [q.id]: Object.fromEntries(q.rows.map((_, i) => [i, 4])) };
  assert.strictEqual((await call('/surveys/4/respond', { method: 'POST', cookie: c, body: { answers: {} } })).status, 400);
  assert.strictEqual((await call('/surveys/4/respond', { method: 'POST', cookie: c, body: { answers } })).status, 200);
  assert.strictEqual((await call('/surveys/4/respond', { method: 'POST', cookie: c, body: { answers } })).status, 409);
  const admin = (await call('/auth/login', { method: 'POST', body: { email: 'admin@vgt.uz', password: 'admin12345' } })).cookie;
  const res = await call('/surveys/4/results', { cookie: admin });
  assert.strictEqual(res.data.total, 1);
  // SUS: teskari bandlar qayta hisoblanadi — hammasiga 4 berilganda indeks (5×4 + 5×2)/10 = 3
  assert.strictEqual(res.data.dimensions[0].mean, 3);
  const csv = await fetch(base + '/surveys/4/export.csv', { headers: { cookie: admin } });
  assert.match(await csv.text(), /F\.I\.Sh\./);
});

test('trenajyor (oflayn): mashg\'ulot, kutilmagan vaziyat va baholash', async () => {
  const c = await register('d@t.uz');
  const { data } = await call('/trainer/sessions', { method: 'POST', cookie: c, body: { scenario_id: 'registon', language: 'uz' } });
  let sawEvent = false;
  for (let i = 0; i < 3; i++) {
    const r = await call(`/trainer/sessions/${data.id}/message`, { method: 'POST', cookie: c, body: { text: 'Assalomu alaykum, iltimos, Ulug\'bek madrasasi 1417-yilda qurilgan.' } });
    if (r.data.includes('event: event')) sawEvent = true;
    assert.match(r.data, /event: done/);
  }
  assert.ok(sawEvent, '3-navbatda kutilmagan vaziyat kiritilishi kerak');
  const fin = await call(`/trainer/sessions/${data.id}/finish`, { method: 'POST', cookie: c });
  assert.strictEqual(fin.data.session.status, 'finished');
  assert.strictEqual(fin.data.session.scores.length, 6);
  const other = await register('e@t.uz');
  assert.strictEqual((await call(`/trainer/sessions/${data.id}`, { cookie: other })).status, 404);
});
