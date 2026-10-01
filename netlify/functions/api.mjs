// Platformaning yagona API funksiyasi: /api/* so'rovlarini marshrutlaydi.
import { db, getMany } from "../lib/store.mjs";
import { hashPassword, verifyPassword, createToken, readToken, newId } from "../lib/auth.mjs";
import { SEED_SURVEYS, SEED_VERSION } from "../lib/seed-surveys.mjs";
import {
  SCENARIOS,
  CRITERIA,
  publicScenario,
  personaSystemPrompt,
  evaluationPrompt,
  hintPrompt,
  EVALUATION_SCHEMA,
} from "../lib/scenarios.mjs";
import { aiEnabled, streamText, completeText, MODEL } from "../lib/ai.mjs";
import { demoReply, demoEvaluation } from "../lib/demo.mjs";

const MAX_TURNS = 40;
const TEST_LEVELS = [
  { min: 0, max: 54.9, label: "Past" },
  { min: 55, max: 79.9, label: "O'rta" },
  { min: 80, max: 100, label: "Yuqori" },
];
const MAX_MESSAGE_CHARS = 2000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const textStream = (stream) =>
  new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" } });

const emailKey = (email) => `user-email/${email.toLowerCase()}`;
const userKey = (id) => `user/${id}`;

function publicUser(u) {
  const { salt, hash, ...rest } = u;
  return rest;
}

async function body(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  }
}

async function currentUser(req) {
  const auth = req.headers.get("authorization") || "";
  const data = readToken(auth.replace(/^Bearer\s+/i, ""));
  if (!data) return null;
  return db().get(userKey(data.uid));
}

async function requireUser(req) {
  const user = await currentUser(req);
  if (!user) throw new HttpError(401, "Tizimga kiring");
  return user;
}

async function requireTeacher(req) {
  const user = await requireUser(req);
  if (user.role !== "teacher") throw new HttpError(403, "Bu bo'lim faqat o'qituvchilar uchun");
  return user;
}

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ---------- Auth ----------

async function register(req) {
  const b = await body(req);
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const name = str(b.name, 120);
  const role = b.role === "teacher" ? "teacher" : "student";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email noto'g'ri kiritilgan");
  if (password.length < 6) throw new HttpError(400, "Parol kamida 6 belgidan iborat bo'lishi kerak");
  if (!name) throw new HttpError(400, "Ism-familiyani kiriting");
  if (role === "teacher") {
    const code = process.env.TEACHER_CODE;
    if (!code) throw new HttpError(403, "O'qituvchi ro'yxatdan o'tishi hali sozlanmagan (TEACHER_CODE)");
    if (str(b.teacherCode) !== code) throw new HttpError(403, "O'qituvchi kodi noto'g'ri");
  }
  const store = db();
  if (await store.get(emailKey(email))) throw new HttpError(409, "Bu email bilan foydalanuvchi allaqachon mavjud");

  const user = {
    id: newId(),
    email,
    name,
    role,
    group: str(b.group, 60),
    college: str(b.college, 160),
    cohort: role === "student" ? "unassigned" : undefined,
    createdAt: new Date().toISOString(),
    ...(await hashPassword(password)),
  };
  await store.set(userKey(user.id), user);
  await store.set(emailKey(email), { id: user.id });
  return json({ token: createToken(user), user: publicUser(user) }, 201);
}

async function login(req) {
  const b = await body(req);
  const email = str(b.email, 120).toLowerCase();
  const ref = await db().get(emailKey(email));
  const user = ref && (await db().get(userKey(ref.id)));
  if (!user || !(await verifyPassword(String(b.password || ""), user.salt, user.hash))) {
    throw new HttpError(401, "Email yoki parol noto'g'ri");
  }
  return json({ token: createToken(user), user: publicUser(user) });
}

async function updateMe(req) {
  const user = await requireUser(req);
  const b = await body(req);
  if (b.name !== undefined) user.name = str(b.name, 120) || user.name;
  if (b.group !== undefined) user.group = str(b.group, 60);
  if (b.college !== undefined) user.college = str(b.college, 160);
  if (b.newPassword) {
    if (!(await verifyPassword(String(b.password || ""), user.salt, user.hash))) throw new HttpError(400, "Joriy parol noto'g'ri");
    if (String(b.newPassword).length < 6) throw new HttpError(400, "Yangi parol kamida 6 belgi bo'lsin");
    Object.assign(user, await hashPassword(String(b.newPassword)));
  }
  await db().set(userKey(user.id), user);
  return json({ user: publicUser(user) });
}

// ---------- Surveys ----------

async function ensureSeeded() {
  const store = db();
  const meta = await store.get("meta/seed");
  if (meta && meta.version >= SEED_VERSION) return;
  for (const survey of SEED_SURVEYS) {
    if (!(await store.get(`survey/${survey.id}`))) {
      await store.set(`survey/${survey.id}`, { ...survey, createdAt: new Date().toISOString(), seed: true });
    }
  }
  await store.set("meta/seed", { version: SEED_VERSION, at: new Date().toISOString() });
}

async function allSurveys() {
  await ensureSeeded();
  const surveys = await getMany("survey/");
  return surveys.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

function stripAnswers(survey) {
  return { ...survey, questions: survey.questions.map(({ correct, ...q }) => q) };
}

const visibleTo = (survey, user) => survey.active && (survey.audience === "all" || survey.audience === user.role);

async function listSurveys(req) {
  const user = await requireUser(req);
  const surveys = (await allSurveys()).filter((s) => visibleTo(s, user));
  const done = new Set((await db().list(`resp-by-user/${user.id}/`)).map((k) => k.split("/").pop()));
  return json(
    surveys.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      stage: s.stage,
      questionCount: s.questions.length,
      completed: done.has(s.id),
    }))
  );
}

async function getSurvey(req, id) {
  const user = await requireUser(req);
  const survey = await db().get(`survey/${id}`);
  if (!survey || !visibleTo(survey, user)) throw new HttpError(404, "So'rovnoma topilmadi");
  const previous = await db().get(`response/${id}/${user.id}`);
  return json({ survey: stripAnswers(survey), previous: previous ? { answers: previous.answers, submittedAt: previous.submittedAt } : null });
}

function validateAnswers(survey, answers) {
  const clean = {};
  for (const q of survey.questions) {
    const a = answers?.[q.id];
    const missing = a === undefined || a === null || a === "" || (Array.isArray(a) && a.length === 0);
    if (missing) {
      if (!q.optional) throw new HttpError(400, `Javob berilmagan savol: "${q.text}"`);
      continue;
    }
    switch (q.type) {
      case "likert":
        if (![1, 2, 3, 4, 5].includes(a)) throw new HttpError(400, `Noto'g'ri qiymat: ${q.text}`);
        clean[q.id] = a;
        break;
      case "scale":
        if (!Number.isInteger(a) || a < 0 || a > 10) throw new HttpError(400, `Noto'g'ri qiymat: ${q.text}`);
        clean[q.id] = a;
        break;
      case "single":
      case "test":
        if (!Number.isInteger(a) || a < 0 || a >= q.options.length) throw new HttpError(400, `Noto'g'ri variant: ${q.text}`);
        clean[q.id] = a;
        break;
      case "multi":
        if (!Array.isArray(a) || a.some((x) => !Number.isInteger(x) || x < 0 || x >= q.options.length)) {
          throw new HttpError(400, `Noto'g'ri variant: ${q.text}`);
        }
        clean[q.id] = [...new Set(a)].sort();
        break;
      case "text":
        clean[q.id] = str(a, 3000);
        break;
    }
  }
  return clean;
}

async function submitSurvey(req, id) {
  const user = await requireUser(req);
  const store = db();
  const survey = await store.get(`survey/${id}`);
  if (!survey || !visibleTo(survey, user)) throw new HttpError(404, "So'rovnoma topilmadi");
  const b = await body(req);
  const answers = validateAnswers(survey, b.answers);
  const response = {
    surveyId: id,
    userId: user.id,
    user: { name: user.name, email: user.email, group: user.group, college: user.college, cohort: user.cohort, role: user.role },
    answers,
    submittedAt: new Date().toISOString(),
  };
  if (survey.questions.some((q) => q.type === "test")) {
    const tests = survey.questions.filter((q) => q.type === "test");
    const correct = tests.filter((q) => answers[q.id] === q.correct).length;
    response.testScore = Math.round((correct / tests.length) * 100);
  }
  await store.set(`response/${id}/${user.id}`, response);
  await store.set(`resp-by-user/${user.id}/${id}`, { at: response.submittedAt });
  return json({ ok: true, testScore: response.testScore });
}

// ---------- Teacher: surveys, students, results ----------

async function adminSurveys(req) {
  await requireTeacher(req);
  const surveys = await allSurveys();
  const counts = await Promise.all(surveys.map((s) => db().list(`response/${s.id}/`)));
  return json(surveys.map((s, i) => ({ ...s, responseCount: counts[i].length })));
}

function sanitizeSurvey(b, existing) {
  const id = existing?.id || str(b.id, 60).toLowerCase().replace(/[^a-z0-9-]/g, "-") || newId().slice(0, 8);
  const title = str(b.title, 200);
  if (!title) throw new HttpError(400, "So'rovnoma nomini kiriting");
  if (!Array.isArray(b.questions) || b.questions.length === 0) throw new HttpError(400, "Kamida bitta savol qo'shing");
  const types = new Set(["likert", "single", "multi", "text", "scale", "test"]);
  const ids = new Set();
  const questions = b.questions.map((q, i) => {
    if (!types.has(q.type)) throw new HttpError(400, `${i + 1}-savol turi noto'g'ri`);
    const text = str(q.text, 500);
    if (!text) throw new HttpError(400, `${i + 1}-savol matni bo'sh`);
    let qid = str(q.id, 40) || `q${i + 1}`;
    while (ids.has(qid)) qid += "_";
    ids.add(qid);
    const out = { id: qid, type: q.type, text };
    if (q.component) out.component = str(q.component, 40);
    if (q.optional) out.optional = true;
    if (["single", "multi", "test"].includes(q.type)) {
      out.options = (q.options || []).map((o) => str(o, 300)).filter(Boolean);
      if (out.options.length < 2) throw new HttpError(400, `${i + 1}-savolda kamida 2 ta variant bo'lsin`);
    }
    if (q.type === "test") {
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= out.options.length) {
        throw new HttpError(400, `${i + 1}-test savolining to'g'ri javobini belgilang`);
      }
      out.correct = q.correct;
    }
    return out;
  });
  const components = Array.isArray(b.scoring?.components)
    ? b.scoring.components.map((c) => ({ key: str(c.key, 40), title: str(c.title, 120) })).filter((c) => c.key && c.title)
    : [];
  const method = questions.some((q) => q.type === "test") ? "test" : b.scoring?.method === "sus" ? "sus" : "likert";
  const defaultLevels = method === "test" ? TEST_LEVELS : SEED_SURVEYS[0].scoring.levels;
  const sameMethod = existing?.scoring?.method === method;
  const susItems = Array.isArray(b.scoring?.susItems) ? b.scoring.susItems.map((x) => str(x, 40)) : existing?.scoring?.susItems;
  return {
    ...(existing || {}),
    id,
    title,
    description: str(b.description, 2000),
    audience: ["student", "teacher", "all"].includes(b.audience) ? b.audience : "student",
    stage: ["pre", "post", "any"].includes(b.stage) ? b.stage : "any",
    active: b.active !== false,
    order: Number.isFinite(b.order) ? b.order : existing?.order ?? 50,
    scoring: {
      method,
      components,
      levels: (sameMethod && existing.scoring.levels) || (Array.isArray(b.scoring?.levels) ? b.scoring.levels : defaultLevels),
      ...(method === "sus" && susItems ? { susItems } : {}),
    },
    questions,
    updatedAt: new Date().toISOString(),
  };
}

async function saveSurvey(req, id) {
  const teacher = await requireTeacher(req);
  const store = db();
  const existing = id ? await store.get(`survey/${id}`) : null;
  if (id && !existing) throw new HttpError(404, "So'rovnoma topilmadi");
  const b = await body(req);
  const survey = sanitizeSurvey(b, existing);
  if (!existing) {
    if (await store.get(`survey/${survey.id}`)) throw new HttpError(409, "Bu identifikatorli so'rovnoma mavjud");
    survey.createdAt = new Date().toISOString();
    survey.createdBy = teacher.name;
  }
  await store.set(`survey/${survey.id}`, survey);
  return json(survey, existing ? 200 : 201);
}

async function deleteSurvey(req, id) {
  await requireTeacher(req);
  const store = db();
  const keys = await store.list(`response/${id}/`);
  if (keys.length) throw new HttpError(409, "Bu so'rovnomada javoblar bor. Uni o'chirish o'rniga nofaol qiling.");
  await store.del(`survey/${id}`);
  return json({ ok: true });
}

async function surveyResults(req, id) {
  await requireTeacher(req);
  const survey = await db().get(`survey/${id}`);
  if (!survey) throw new HttpError(404, "So'rovnoma topilmadi");
  const responses = await getMany(`response/${id}/`);
  // Talabaning joriy guruh/kogortasi bilan yangilash (javobdan keyin o'zgargan bo'lishi mumkin).
  const users = await Promise.all(responses.map((r) => db().get(userKey(r.userId))));
  responses.forEach((r, i) => {
    if (users[i]) r.user = { ...r.user, group: users[i].group, cohort: users[i].cohort, name: users[i].name };
  });
  responses.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  return json({ survey, responses });
}

async function deleteResponse(req, id, userId) {
  await requireTeacher(req);
  await db().del(`response/${id}/${userId}`);
  await db().del(`resp-by-user/${userId}/${id}`);
  return json({ ok: true });
}

async function listStudents(req) {
  await requireTeacher(req);
  const users = (await getMany("user/")).map(publicUser).sort((a, b) => a.name.localeCompare(b.name));
  return json(users);
}

async function updateStudent(req, id) {
  await requireTeacher(req);
  const user = await db().get(userKey(id));
  if (!user) throw new HttpError(404, "Foydalanuvchi topilmadi");
  const b = await body(req);
  if (["experimental", "control", "unassigned"].includes(b.cohort)) user.cohort = b.cohort;
  if (b.group !== undefined) user.group = str(b.group, 60);
  await db().set(userKey(id), user);
  return json(publicUser(user));
}

async function overview(req) {
  await requireTeacher(req);
  const store = db();
  const [users, surveys, responses, sessions, submissions] = await Promise.all([
    getMany("user/"),
    allSurveys(),
    store.list("response/"),
    getMany("trainer/"),
    getMany("selfstudy/"),
  ]);
  const students = users.filter((u) => u.role === "student");
  return json({
    students: students.length,
    teachers: users.length - students.length,
    cohorts: {
      experimental: students.filter((u) => u.cohort === "experimental").length,
      control: students.filter((u) => u.cohort === "control").length,
    },
    surveys: surveys.length,
    responses: responses.length,
    trainerSessions: sessions.length,
    avgTrainerScore: sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.total || 0), 0) / sessions.length) : null,
    selfStudySubmissions: submissions.length,
    ungraded: submissions.filter((s) => s.grade == null).length,
    aiEnabled: aiEnabled(),
  });
}

// ---------- Progress & self-study ----------

async function getProgress(req) {
  const user = await requireUser(req);
  return json((await db().get(`progress/${user.id}`)) || { topics: {}, plan: [], notes: {} });
}

async function saveProgress(req) {
  const user = await requireUser(req);
  const b = await body(req);
  const progress = {
    topics: typeof b.topics === "object" && b.topics ? b.topics : {},
    plan: Array.isArray(b.plan) ? b.plan.slice(0, 200) : [],
    notes: typeof b.notes === "object" && b.notes ? b.notes : {},
    updatedAt: new Date().toISOString(),
  };
  if (JSON.stringify(progress).length > 200_000) throw new HttpError(413, "Ma'lumot hajmi juda katta");
  await db().set(`progress/${user.id}`, progress);
  return json(progress);
}

async function mySelfStudy(req) {
  const user = await requireUser(req);
  return json(await getMany(`selfstudy/${user.id}/`));
}

async function submitSelfStudy(req, taskId) {
  const user = await requireUser(req);
  const b = await body(req);
  const text = str(b.text, 10000);
  const link = str(b.link, 500);
  if (!text && !link) throw new HttpError(400, "Javob matni yoki havolani kiriting");
  if (link && !/^https?:\/\//i.test(link)) throw new HttpError(400, "Havola http:// yoki https:// bilan boshlanishi kerak");
  const key = `selfstudy/${user.id}/${taskId}`;
  const prev = await db().get(key);
  const item = {
    taskId: str(taskId, 80),
    taskTitle: str(b.taskTitle, 300),
    topicTitle: str(b.topicTitle, 300),
    userId: user.id,
    user: { name: user.name, group: user.group, email: user.email },
    text,
    link,
    submittedAt: new Date().toISOString(),
    // Qayta topshirilganda oldingi baho saqlanadi, ammo "qayta ko'rib chiqish" belgisi qo'yiladi.
    grade: prev?.grade ?? null,
    feedback: prev?.feedback ?? "",
    resubmitted: Boolean(prev),
  };
  await db().set(key, item);
  return json(item);
}

async function allSelfStudy(req) {
  await requireTeacher(req);
  const items = await getMany("selfstudy/");
  return json(items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
}

async function gradeSelfStudy(req, userId, taskId) {
  const teacher = await requireTeacher(req);
  const key = `selfstudy/${userId}/${taskId}`;
  const item = await db().get(key);
  if (!item) throw new HttpError(404, "Topshiriq topilmadi");
  const b = await body(req);
  const grade = Number(b.grade);
  if (!Number.isInteger(grade) || grade < 2 || grade > 5) throw new HttpError(400, "Baho 2 dan 5 gacha bo'lishi kerak");
  Object.assign(item, { grade, feedback: str(b.feedback, 3000), gradedBy: teacher.name, gradedAt: new Date().toISOString(), resubmitted: false });
  await db().set(key, item);
  return json(item);
}

// ---------- Trainer ----------

function findScenario(id) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new HttpError(404, "Ssenariy topilmadi");
  return s;
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) throw new HttpError(400, "Suhbat tarixi noto'g'ri");
  if (raw.length > MAX_TURNS * 2) throw new HttpError(400, "Mashg'ulot juda uzun. Yakunlab, baholashga o'ting.");
  const msgs = raw.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: str(m.content, MAX_MESSAGE_CHARS) }));
  msgs.forEach((m, i) => {
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (m.role !== expected || !m.content) throw new HttpError(400, "Suhbat tarixi ketma-ketligi buzilgan");
  });
  return msgs;
}

// Personaj suhbatni o'zi boshlaydi, shuning uchun tarix boshiga kirish xabari va ochilish replikasi qo'shiladi.
const withOpening = (s, history) => [
  { role: "user", content: "[Mashg'ulot boshlandi. Personaj sifatida birinchi bo'lib gapiring.]" },
  { role: "assistant", content: s.opening },
  ...history,
];

function transcriptOf(s, history) {
  return [`TURIST/PERSONAJ: ${s.opening}`, ...history.map((m) => `${m.role === "user" ? "GID (o'quvchi)" : "TURIST/PERSONAJ"}: ${m.content}`)].join("\n\n");
}

async function trainerChat(req) {
  await requireUser(req);
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const history = cleanHistory(b.messages);
  if (!history.length || history[history.length - 1].role !== "user") throw new HttpError(400, "Oxirgi xabar o'quvchiniki bo'lishi kerak");
  if (!aiEnabled()) {
    const encoder = new TextEncoder();
    const reply = demoReply(s, history);
    return textStream(new ReadableStream({ start(c) { c.enqueue(encoder.encode(reply)); c.close(); } }));
  }
  return textStream(streamText({ system: personaSystemPrompt(s), messages: withOpening(s, history), maxTokens: 1500, effort: "low" }));
}

async function trainerHint(req) {
  await requireUser(req);
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const history = Array.isArray(b.messages) && b.messages.length ? cleanHistory(b.messages) : [];
  if (!aiEnabled()) {
    const idx = Math.min(history.filter((m) => m.role === "user").length, s.objectives.length - 1);
    return json({ hint: `Maqsadga e'tibor bering: ${s.objectives[idx]}.`, demo: true });
  }
  const hint = await completeText({
    system: hintPrompt(s),
    messages: [{ role: "user", content: `Suhbat hozirgacha:\n\n${transcriptOf(s, history)}\n\nMenga keyingi qadam uchun maslahat bering.` }],
    maxTokens: 800,
  });
  return json({ hint: hint || "Maqsadlarni qayta ko'rib chiqing va turistning so'nggi savoliga aniq javob bering." });
}

async function trainerEvaluate(req) {
  const user = await requireUser(req);
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const history = cleanHistory(b.messages);
  const meta = {
    hintsUsed: Math.max(0, Math.min(50, Number(b.hintsUsed) || 0)),
    durationMin: Math.max(0, Math.round((Number(b.durationSec) || 0) / 60)),
  };
  if (history.filter((m) => m.role === "user").length < 2) throw new HttpError(400, "Baholash uchun kamida 2 ta javob yozing");

  let evaluation;
  if (!aiEnabled()) {
    evaluation = demoEvaluation(s, history, meta);
  } else {
    const raw = await completeText({
      system: "Sen pedagogik baholovchi ekspertsan. Javobni faqat berilgan JSON sxemasiga mos holda qaytar.",
      messages: [{ role: "user", content: evaluationPrompt(s, transcriptOf(s, history), meta) }],
      maxTokens: 4000,
      effort: "low",
      format: { type: "json_schema", schema: EVALUATION_SCHEMA },
    }).catch((e) => {
      console.error(e);
      throw new HttpError(502, "AI baholash xizmati javob bermadi, qayta urinib ko'ring");
    });
    try {
      evaluation = JSON.parse(raw);
    } catch {
      throw new HttpError(502, "AI baholash natijasini o'qib bo'lmadi, qayta urinib ko'ring");
    }
  }
  for (const c of CRITERIA) evaluation.scores[c.key] = Math.max(0, Math.min(c.max, Math.round(evaluation.scores[c.key] || 0)));
  const total = CRITERIA.reduce((sum, c) => sum + evaluation.scores[c.key], 0);

  const session = {
    id: newId(),
    userId: user.id,
    user: { name: user.name, group: user.group, cohort: user.cohort },
    scenarioId: s.id,
    scenarioTitle: s.title,
    messages: history,
    opening: s.opening,
    hintsUsed: meta.hintsUsed,
    durationSec: Number(b.durationSec) || 0,
    evaluation,
    total,
    model: aiEnabled() ? MODEL : "demo",
    createdAt: new Date().toISOString(),
  };
  await db().set(`trainer/${user.id}/${session.id}`, session);
  return json(session);
}

async function mySessions(req) {
  const user = await requireUser(req);
  const sessions = await getMany(`trainer/${user.id}/`);
  return json(sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

async function allSessions(req) {
  await requireTeacher(req);
  const sessions = await getMany("trainer/");
  return json(sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

// ---------- Router ----------

const routes = [
  ["POST", /^auth\/register$/, register],
  ["POST", /^auth\/login$/, login],
  ["GET", /^me$/, async (req) => json(publicUser(await requireUser(req)))],
  ["PUT", /^me$/, updateMe],
  ["GET", /^config$/, async () => json({ aiEnabled: aiEnabled(), teacherSignup: Boolean(process.env.TEACHER_CODE) })],

  ["GET", /^surveys$/, listSurveys],
  ["GET", /^surveys\/([\w-]+)$/, getSurvey],
  ["POST", /^surveys\/([\w-]+)\/responses$/, submitSurvey],

  ["GET", /^progress$/, getProgress],
  ["PUT", /^progress$/, saveProgress],
  ["GET", /^self-study$/, mySelfStudy],
  ["POST", /^self-study\/([\w-]+)$/, submitSelfStudy],

  ["GET", /^trainer\/scenarios$/, async () => json({ scenarios: SCENARIOS.map(publicScenario), criteria: CRITERIA, aiEnabled: aiEnabled() })],
  ["POST", /^trainer\/chat$/, trainerChat],
  ["POST", /^trainer\/hint$/, trainerHint],
  ["POST", /^trainer\/evaluate$/, trainerEvaluate],
  ["GET", /^trainer\/sessions$/, mySessions],

  ["GET", /^admin\/overview$/, overview],
  ["GET", /^admin\/surveys$/, adminSurveys],
  ["POST", /^admin\/surveys$/, (req) => saveSurvey(req, null)],
  ["PUT", /^admin\/surveys\/([\w-]+)$/, saveSurvey],
  ["DELETE", /^admin\/surveys\/([\w-]+)$/, deleteSurvey],
  ["GET", /^admin\/surveys\/([\w-]+)\/results$/, surveyResults],
  ["DELETE", /^admin\/surveys\/([\w-]+)\/responses\/([\w-]+)$/, deleteResponse],
  ["GET", /^admin\/students$/, listStudents],
  ["PUT", /^admin\/students\/([\w-]+)$/, updateStudent],
  ["GET", /^admin\/trainer-sessions$/, allSessions],
  ["GET", /^admin\/self-study$/, allSelfStudy],
  ["PUT", /^admin\/self-study\/([\w-]+)\/([\w-]+)$/, gradeSelfStudy],
];

export default async function handler(req) {
  const path = new URL(req.url).pathname.replace(/^\/(\.netlify\/functions\/api|api)\/?/, "").replace(/\/$/, "");
  try {
    for (const [method, pattern, fn] of routes) {
      const m = path.match(pattern);
      if (m && req.method === method) return await fn(req, ...m.slice(1).map(decodeURIComponent));
    }
    throw new HttpError(404, "Topilmadi");
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Serverda kutilmagan xatolik yuz berdi" }, 500);
  }
}

export const config = { path: "/api/*" };
