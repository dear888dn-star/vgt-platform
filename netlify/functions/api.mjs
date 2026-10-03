// Platformaning yagona API funksiyasi: /api/* so'rovlarini marshrutlaydi.
import { db, getMany } from "../lib/store.mjs";
import { hashPassword, verifyPassword, createToken, readToken, newId, setGeneratedSecret } from "../lib/auth.mjs";
import crypto from "node:crypto";
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
import { aiEnabled, streamText, completeText, modelName, provider, voiceEnabled, transcribeAudio } from "../lib/ai.mjs";
import { demoReply, demoEvaluation } from "../lib/demo.mjs";
import { STAGES, SECTION_C, publicInstrument, computeResult } from "../lib/diagnostics.mjs";
import { computeGame, certificateStatus } from "../../public/js/gamification.js";
import { findTopic, tutorSystem, searchAnswer } from "../lib/tutor.mjs";
import { TOPICS } from "../../public/data/topics.js";
import { itemAnalysis } from "../lib/itemstats.mjs";
import { synthesize, ttsEnabled, ttsModels, ttsKey, VOICES, STYLES } from "../lib/tts.mjs";
import { ROUTE_RUBRIC, ROUTE_LEVELS, routeLevel } from "../lib/route-task.mjs";

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
  if (role === "student" && !["experimental", "control"].includes(b.cohort)) throw new HttpError(400, "Tadqiqot guruhingizni tanlang: tajriba yoki nazorat guruhi");
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
    cohort: role === "student" ? (["experimental", "control"].includes(b.cohort) ? b.cohort : "unassigned") : undefined,
    cohortSource: role === "student" && ["experimental", "control"].includes(b.cohort) ? "self" : undefined,
    createdAt: new Date().toISOString(),
    ...(await hashPassword(password)),
  };
  if (role === "student") user.code = await nextCode();
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
  if (b.hideFromRating !== undefined) user.hideFromRating = Boolean(b.hideFromRating);
  // O'quvchi guruhini faqat hali belgilanmagan bo'lsa o'zi tanlaydi; keyin uni o'qituvchi o'zgartiradi.
  if (user.role === "student" && (user.cohort || "unassigned") === "unassigned" && ["experimental", "control"].includes(b.cohort)) {
    user.cohort = b.cohort;
    user.cohortSource = "self";
  }
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
  const all = await getMany("user/");
  for (const u of all) await ensureCode(u);
  const users = all.map(publicUser).sort((a, b) => a.name.localeCompare(b.name));
  return json(users);
}

async function updateStudent(req, id) {
  await requireTeacher(req);
  const user = await db().get(userKey(id));
  if (!user) throw new HttpError(404, "Foydalanuvchi topilmadi");
  const b = await body(req);
  if (["experimental", "control", "unassigned"].includes(b.cohort) && b.cohort !== user.cohort) {
    user.cohort = b.cohort;
    user.cohortSource = "teacher";
  }
  if (b.group !== undefined) user.group = str(b.group, 60);
  await db().set(userKey(id), user);
  return json(publicUser(user));
}

async function overview(req) {
  await requireTeacher(req);
  const store = db();
  const [users, surveys, responses, sessions, submissions, diag, routesAll, settings] = await Promise.all([
    getMany("user/"),
    allSurveys(),
    store.list("response/"),
    getMany("trainer/"),
    getMany("selfstudy/"),
    getMany("diag/"),
    getMany("route/"),
    diagSettings(),
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
    aiProvider: provider(),
    aiModel: modelName(),
    diag: {
      activeStage: settings.activeStage,
      records: diag.length,
      toGrade: diag.filter((r) => (r.C?.submittedAt && !r.grading?.C) || (r.D?.submittedAt && !r.grading?.D)).length,
      complete: diag.filter((r) => r.result?.B).length,
    },
    routes: {
      submitted: routesAll.filter((p) => p.status === "submitted").length,
      graded: routesAll.filter((p) => p.status === "graded").length,
    },
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
  const obj = (v) => (typeof v === "object" && v && !Array.isArray(v) ? v : {});
  const activity = Object.fromEntries(
    Object.entries(obj(b.activity))
      .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v))
      .sort(([a], [c]) => c.localeCompare(a))
      .slice(0, 400)
      .map(([k, v]) => [k, Math.max(0, Math.min(10000, Math.round(v)))])
  );
  const srs = Object.fromEntries(
    Object.entries(obj(b.srs))
      .slice(0, 3000)
      .filter(([k, v]) => k.length <= 120 && Number.isInteger(v?.box) && typeof v?.due === "string")
      .map(([k, v]) => [k, { box: Math.max(0, Math.min(5, v.box)), due: v.due.slice(0, 10) }])
  );
  const st = obj(b.srsStats);
  const progress = {
    topics: obj(b.topics),
    plan: Array.isArray(b.plan) ? b.plan.slice(0, 200) : [],
    notes: obj(b.notes),
    activity,
    srs,
    srsStats: { reviews: Math.max(0, Math.min(100000, Number(st.reviews) || 0)), lastReview: str(st.lastReview, 10) },
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

// ---------- AI baholash javobini ishonchli o'qish ----------
// Model ballarni turli shaklda qaytarishi mumkin: boshqa kalit nomi, "16/20" matni, {score: 16} obyekti,
// 0–1 yoki 0–100 shkala, ```json``` ichida. Avval bularning barchasi jimgina 0 ga aylanib qolardi.

const CRIT_ALIASES = {
  communication: ["communication", "muloqot", "nutq", "communic"],
  knowledge: ["knowledge", "bilim", "fakt", "kasbiy bilim"],
  problem: ["problem", "muammo", "qaror"],
  digital: ["digital", "raqamli", "texnolog"],
  service: ["service", "mijoz", "etika", "xizmat"],
};

function toScore(v, max = 20) {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "object") return toScore(v.score ?? v.ball ?? v.value ?? v.points ?? v.baho, max);
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const str2 = String(v).replace(",", ".");
  const frac = str2.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (frac) return (Number(frac[1]) / Number(frac[2])) * max;
  const n = str2.match(/-?\d+(?:\.\d+)?/);
  return n ? Number(n[0]) : undefined;
}

export function parseEvaluation(raw) {
  let text = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  let obj = null;
  try {
    obj = JSON.parse(text);
  } catch {
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        obj = JSON.parse(text.slice(a, b + 1));
      } catch {}
    }
  }
  if (!obj || typeof obj !== "object") return { found: 0, complete: false, scores: {}, text: null };
  let src = obj.scores ?? obj.ballar ?? obj.baholar ?? obj.criteria ?? obj.mezonlar ?? obj;
  // Massiv ko'rinishi: [{key|criterion|name, score}]
  if (Array.isArray(src)) src = Object.fromEntries(src.map((x) => [String(x.key ?? x.criterion ?? x.name ?? x.mezon ?? ""), x]));
  const entries = Object.entries(src || {});
  const scores = {};
  for (const c of CRITERIA) {
    let v = src?.[c.key];
    if (v === undefined) {
      const hit = entries.find(([k]) => {
        const kk = k.toLowerCase();
        return kk.includes(c.title.toLowerCase().slice(0, 10)) || CRIT_ALIASES[c.key].some((a) => kk.includes(a));
      });
      v = hit?.[1];
    }
    scores[c.key] = toScore(v, c.max);
  }
  const vals = Object.values(scores).filter((v) => Number.isFinite(v));
  // Shkalani moslashtirish: 0–1 (ulush) yoki 0–100 (foiz) bo'lsa — 0–20 ga o'tkazamiz.
  if (vals.length && vals.every((v) => v <= 1) && vals.some((v) => v > 0)) for (const k in scores) if (Number.isFinite(scores[k])) scores[k] *= 20;
  if (vals.some((v) => v > 20) && vals.every((v) => v <= 100)) for (const k in scores) if (Number.isFinite(scores[k])) scores[k] = (scores[k] / 100) * 20;
  const found = Object.values(scores).filter((v) => Number.isFinite(v)).length;
  const pickArr = (...keys) => {
    for (const k of keys) if (obj[k] !== undefined) return Array.isArray(obj[k]) ? obj[k].map(String) : [String(obj[k])];
    return [];
  };
  return {
    found,
    complete: found === CRITERIA.length,
    scores,
    text: {
      summary: String(obj.summary ?? obj.xulosa ?? obj.umumiy ?? ""),
      standard: String(obj.standard ?? obj.standart ?? ""),
      strengths: pickArr("strengths", "kuchli_tomonlar"),
      improvements: pickArr("improvements", "kamchiliklar"),
      recommendations: pickArr("recommendations", "tavsiyalar"),
    },
  };
}

function transcriptOf(s, history) {
  return [`TURIST/PERSONAJ: ${s.opening}`, ...history.map((m) => `${m.role === "user" ? "GID (o'quvchi)" : "TURIST/PERSONAJ"}: ${m.content}`)].join("\n\n");
}

// ---------- Ovozli rejim ----------

async function trainerTranscribe(req) {
  await requireUser(req);
  if (!voiceEnabled()) throw new HttpError(503, "Nutqni tanish sozlanmagan (GEMINI_API_KEY)");
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const audio = typeof b.audio === "string" ? b.audio : "";
  const mime = /^audio\/[\w.+-]+(;.*)?$/.test(String(b.mime)) ? String(b.mime).split(";")[0] : "audio/webm";
  if (!audio || audio.length > 4_000_000) throw new HttpError(400, "Audio yozuv bo'sh yoki juda uzun (eng ko'pi ~2 daqiqa)");
  try {
    return json({ text: await transcribeAudio(audio, mime, { language: s.language }) });
  } catch (err) {
    throw new HttpError(err.status === 429 ? 429 : 502, err.status === 429 ? "So'rovlar limiti tugadi, birozdan so'ng urinib ko'ring" : "Nutqni tanib bo'lmadi");
  }
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
  let evalDebug;
  if (!aiEnabled()) {
    evaluation = demoEvaluation(s, history, meta);
  } else {
    const ask = (strict) =>
      completeText({
        system: "Sen pedagogik baholovchi ekspertsan. Javobni faqat berilgan JSON sxemasiga mos holda qaytar. Ballar butun son (0–20) bo'lsin.",
        messages: [{ role: "user", content: evaluationPrompt(s, transcriptOf(s, history), meta) + (strict ? `\n\nMUHIM: javob FAQAT JSON obyekt bo'lsin, hech qanday izohsiz. "scores" ichida aynan shu kalitlar bo'lsin: ${CRITERIA.map((c) => c.key).join(", ")} — har biri 0 dan 20 gacha butun son. Namuna: {"scores":{${CRITERIA.map((c) => `"${c.key}":14`).join(",")}},"summary":"...","standard":"...","strengths":["..."],"improvements":["..."],"recommendations":["..."]}` : "") }],
        maxTokens: 6000,
        effort: "low",
        format: { type: "json_schema", schema: EVALUATION_SCHEMA },
      });
    let raw = "";
    let parsed = null;
    let failures = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
      let r;
      try {
        r = await ask(attempt > 0);
      } catch (e) {
        console.error("AI baholash xatosi:", e);
        failures++;
        continue;
      }
      raw = r;
      const p2 = parseEvaluation(r);
      if (!parsed || p2.found > parsed.found) parsed = p2;
      if (parsed.complete) break;
      console.error(`AI baholash: ballar to'liq emas (${attempt + 1}-urinish):`, String(r).slice(0, 800));
    }
    if (failures === 2) throw new HttpError(502, "AI baholash xizmati javob bermadi, qayta urinib ko'ring");
    if (!parsed || parsed.found === 0) {
      // AI ballarni umuman qaytarmadi — 0 qo'ymaymiz: taxminiy ball + AI matni (bo'lsa) va ochiq belgi.
      const demo = demoEvaluation(s, history, meta);
      const t = parsed?.text || {};
      const pick = (k) => (Array.isArray(t[k]) ? t[k].length : t[k]) ? t[k] : demo[k];
      evaluation = {
        scores: demo.scores,
        summary: `${pick("summary") === demo.summary ? "" : `${t.summary} `}(AI ballarni qaytarmadi — ballar javoblaringiz asosida taxminiy hisoblandi.)`.trim(),
        standard: pick("standard"),
        strengths: pick("strengths"),
        improvements: pick("improvements"),
        recommendations: pick("recommendations"),
        estimated: true,
      };
      evalDebug = String(raw).slice(0, 1500);
    } else {
      evaluation = { ...parsed.text, scores: parsed.scores };
      if (!parsed.complete) {
        // Yetishmagan mezonlar — mavjudlarining o'rtachasi bilan to'ldiriladi.
        const vals = Object.values(parsed.scores).filter((v) => Number.isFinite(v));
        const avgV = vals.reduce((a, b) => a + b, 0) / vals.length;
        for (const c of CRITERIA) if (!Number.isFinite(evaluation.scores[c.key])) evaluation.scores[c.key] = Math.round(avgV);
        evaluation.estimated = true;
        evalDebug = String(raw).slice(0, 1500);
      }
    }
  }
  for (const c of CRITERIA) evaluation.scores[c.key] = Math.max(0, Math.min(c.max, Math.round(Number(evaluation.scores[c.key]) || 0)));
  for (const k of ["strengths", "improvements", "recommendations"]) if (!Array.isArray(evaluation[k])) evaluation[k] = evaluation[k] ? [String(evaluation[k])] : [];
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
    voice: b.voice === true,
    evaluation,
    total,
    ...(evalDebug ? { evalDebug } : {}),
    model: modelName(),
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

// ---------- Anonim kod ----------

async function nextCode() {
  const store = db();
  const counter = (await store.get("meta/code-counter")) || { n: 0 };
  counter.n += 1;
  await store.set("meta/code-counter", counter);
  return `TM-${String(counter.n).padStart(3, "0")}`;
}

async function ensureCode(user) {
  if (user.role !== "student" || user.code) return user;
  user.code = await nextCode();
  await db().set(userKey(user.id), user);
  return user;
}

// ---------- Kompleks diagnostika (1-ilova) ----------

const diagKey = (stage, uid) => `diag/${stage}/${uid}`;

async function diagSettings() {
  return (await db().get("meta/diag-settings")) || { activeStage: null };
}

function checkStage(stage) {
  if (!STAGES[stage]) throw new HttpError(400, "Bosqich noto'g'ri");
}

function studentView(rec) {
  if (!rec) return null;
  // O'quvchiga test kaliti va o'qituvchi baholari ko'rsatilmaydi; natija faqat to'liq baholangandan keyin.
  const { grading, result, ...rest } = rec;
  return { ...rest, graded: Boolean(result?.B), result: result?.B ? result : null };
}

async function myDiagnostics(req) {
  const user = await ensureCode(await requireUser(req));
  const settings = await diagSettings();
  const records = {};
  for (const st of Object.keys(STAGES)) records[st] = studentView(await db().get(diagKey(st, user.id)));
  return json({ instrument: publicInstrument(), activeStage: settings.activeStage, records, code: user.code });
}

async function loadActiveRecord(user, stage) {
  checkStage(stage);
  const settings = await diagSettings();
  if (settings.activeStage !== stage) throw new HttpError(403, "Bu bosqich hozir faol emas. O'qituvchi bosqichni ochishini kuting.");
  const rec = (await db().get(diagKey(stage, user.id))) || { stage, userId: user.id, createdAt: new Date().toISOString() };
  rec.user = { name: user.name, group: user.group, cohort: user.cohort, code: user.code };
  return rec;
}

async function saveRecord(rec) {
  rec.result = computeResult(rec);
  rec.updatedAt = new Date().toISOString();
  await db().set(diagKey(rec.stage, rec.userId), rec);
  return json(studentView(rec));
}

async function diagSection(req, stage, section) {
  const user = await ensureCode(await requireUser(req));
  if (user.role !== "student") throw new HttpError(403, "Diagnostika faqat o'quvchilar uchun");
  const rec = await loadActiveRecord(user, stage);
  const b = await body(req);
  const now = new Date().toISOString();

  if (section === "A") {
    if (rec.A?.submittedAt) throw new HttpError(409, "A-bo'lim allaqachon topshirilgan");
    const a = b.answers;
    if (!Array.isArray(a) || a.length !== 15 || a.some((x) => ![1, 2, 3, 4, 5].includes(x))) throw new HttpError(400, "Barcha 15 ta fikrga javob bering");
    rec.A = { answers: a, submittedAt: now };
  } else if (section === "B-start") {
    if (rec.B?.submittedAt) throw new HttpError(409, "Test allaqachon topshirilgan");
    rec.B = rec.B?.startedAt ? rec.B : { startedAt: now };
  } else if (section === "B") {
    if (!rec.B?.startedAt) throw new HttpError(400, "Test boshlanmagan");
    if (rec.B.submittedAt) throw new HttpError(409, "Test allaqachon topshirilgan");
    const a = Array.isArray(b.answers) ? b.answers.slice(0, 20) : [];
    const clean = Array.from({ length: 20 }, (_, i) => ([0, 1, 2, 3].includes(a[i]) ? a[i] : null));
    const seconds = Math.round((Date.now() - Date.parse(rec.B.startedAt)) / 1000);
    rec.B = { ...rec.B, answers: clean, submittedAt: now, seconds, overtime: seconds > 25 * 60 + 30 };
  } else if (section === "C") {
    if (rec.C?.submittedAt) throw new HttpError(409, "C-bo'lim allaqachon topshirilgan");
    const tasks = SECTION_C.tasks.map((t, i) => {
      const src = (Array.isArray(b.tasks) && b.tasks[i]) || {};
      const out = {};
      for (const f of t.fields) {
        const v = str(src[f.key], f.type === "url" ? 500 : 8000);
        if (f.type === "url" && v && !/^https?:\/\//i.test(v)) throw new HttpError(400, `${i + 1}-topshiriq: havola http(s):// bilan boshlanishi kerak`);
        out[f.key] = v;
      }
      return out;
    });
    rec.C = { ...(rec.C || {}), tasks, startedAt: rec.C?.startedAt || now, savedAt: now };
    if (b.final) {
      const missing = SECTION_C.tasks.some((t, i) => t.fields.some((f) => !f.optional && !tasks[i][f.key]));
      if (missing) throw new HttpError(400, "Barcha topshiriqlarning majburiy maydonlarini to'ldiring");
      rec.C.submittedAt = now;
    }
  } else if (section === "D") {
    if (rec.D?.submittedAt) throw new HttpError(409, "D-bo'lim allaqachon topshirilgan");
    const a = Array.isArray(b.answers) ? b.answers.map((x) => str(x, 3000)) : [];
    if (a.length !== 5 || a.some((x) => x.length < 3)) throw new HttpError(400, "Barcha 5 ta savolga javob yozing");
    rec.D = { answers: a, submittedAt: now };
  } else {
    throw new HttpError(404, "Bo'lim topilmadi");
  }
  return saveRecord(rec);
}

async function adminDiagnostics(req) {
  await requireTeacher(req);
  const [records, users, settings] = await Promise.all([getMany("diag/"), getMany("user/"), diagSettings()]);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  for (const r of records) {
    const u = byId[r.userId];
    if (u) r.user = { name: u.name, group: u.group, cohort: u.cohort || "unassigned", code: u.code, email: u.email };
  }
  return json({ instrument: { ...publicInstrument() }, settings, records });
}

async function setDiagSettings(req) {
  await requireTeacher(req);
  const b = await body(req);
  const activeStage = b.activeStage && STAGES[b.activeStage] ? b.activeStage : null;
  await db().set("meta/diag-settings", { activeStage, updatedAt: new Date().toISOString() });
  return json({ activeStage });
}

async function gradeDiagnostics(req, stage, userId) {
  const teacher = await requireTeacher(req);
  checkStage(stage);
  const rec = await db().get(diagKey(stage, userId));
  if (!rec) throw new HttpError(404, "Yozuv topilmadi");
  const b = await body(req);
  const ok = (g) => [3, 4, 5].includes(g);
  const grading = { ...(rec.grading || {}) };
  if (b.C !== undefined) {
    if (!Array.isArray(b.C) || b.C.length !== 3 || b.C.some((t) => !Array.isArray(t) || t.length !== 6 || !t.every(ok))) throw new HttpError(400, "C-bo'lim: har bir topshiriq uchun 6 ta indikatorni 3–5 baho bilan baholang");
    grading.C = b.C;
  }
  if (b.D !== undefined) {
    if (!Array.isArray(b.D) || b.D.length !== 5 || !b.D.every(ok)) throw new HttpError(400, "D-bo'lim: 5 ta indikatorni 3–5 baho bilan baholang");
    grading.D = b.D;
  }
  grading.by = teacher.name;
  grading.at = new Date().toISOString();
  if (b.note !== undefined) grading.note = str(b.note, 2000);
  rec.grading = grading;
  rec.result = computeResult(rec);
  await db().set(diagKey(stage, userId), rec);
  return json(rec);
}

async function resetDiagnostics(req, stage, userId, section) {
  await requireTeacher(req);
  checkStage(stage);
  const key = diagKey(stage, userId);
  const rec = await db().get(key);
  if (!rec) throw new HttpError(404, "Yozuv topilmadi");
  if (section === "all") await db().del(key);
  else {
    if (!["A", "B", "C", "D"].includes(section)) throw new HttpError(400, "Bo'lim noto'g'ri");
    delete rec[section];
    if (section === "C" && rec.grading) delete rec.grading.C;
    if (section === "D" && rec.grading) delete rec.grading.D;
    rec.result = computeResult(rec);
    await db().set(key, rec);
  }
  return json({ ok: true });
}

// ---------- Marshrut laboratoriyasi ----------

const routeKey = (uid, id) => `route/${uid}/${id}`;

async function myRoutes(req) {
  const user = await requireUser(req);
  const items = await getMany(`route/${user.id}/`);
  return json({ projects: items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")), rubric: ROUTE_RUBRIC, levels: ROUTE_LEVELS });
}

async function saveRoute(req, id) {
  const user = await requireUser(req);
  const b = await body(req);
  if (JSON.stringify(b).length > 300_000) throw new HttpError(413, "Loyiha hajmi juda katta");
  const key = routeKey(user.id, id);
  const prev = await db().get(key);
  const project = {
    ...b,
    id,
    userId: user.id,
    user: { name: user.name, group: user.group, code: user.code, cohort: user.cohort },
    title: str(b.title, 200) || "Nomsiz marshrut",
    status: prev?.status === "graded" || prev?.status === "submitted" ? prev.status : "draft",
    grade: prev?.grade,
    submittedAt: prev?.submittedAt,
    createdAt: prev?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (prev?.status === "graded" || prev?.status === "submitted") project.changedAfterSubmit = true;
  await db().set(key, project);
  return json(project);
}

async function submitRoute(req, id) {
  const user = await requireUser(req);
  const key = routeKey(user.id, id);
  const p = await db().get(key);
  if (!p) throw new HttpError(404, "Loyiha topilmadi");
  if (!Array.isArray(p.objects) || p.objects.length < 3) throw new HttpError(400, "Marshrutga kamida 3 ta obyekt kiriting");
  Object.assign(p, { status: "submitted", submittedAt: new Date().toISOString(), changedAfterSubmit: false });
  await db().set(key, p);
  return json(p);
}

async function deleteRoute(req, id) {
  const user = await requireUser(req);
  const p = await db().get(routeKey(user.id, id));
  if (p && p.status !== "draft") throw new HttpError(409, "Topshirilgan loyihani o'chirib bo'lmaydi");
  await db().del(routeKey(user.id, id));
  return json({ ok: true });
}

async function adminRoutes(req) {
  await requireTeacher(req);
  const items = await getMany("route/");
  return json({ projects: items.filter((p) => p.status !== "draft").sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || "")), rubric: ROUTE_RUBRIC, levels: ROUTE_LEVELS });
}

async function gradeRoute(req, userId, id) {
  const teacher = await requireTeacher(req);
  const key = routeKey(userId, id);
  const p = await db().get(key);
  if (!p) throw new HttpError(404, "Loyiha topilmadi");
  const b = await body(req);
  const scores = ROUTE_RUBRIC.map((c, i) => {
    const v = Number(b.scores?.[i]);
    if (!Number.isFinite(v) || v < 0 || v > c.max) throw new HttpError(400, `"${c.title}" mezoni 0–${c.max} oralig'ida bo'lishi kerak`);
    return Math.round(v);
  });
  const total = scores.reduce((a, x) => a + x, 0);
  p.grade = { scores, total, level: routeLevel(total), feedback: str(b.feedback, 3000), by: teacher.name, at: new Date().toISOString() };
  p.status = "graded";
  await db().set(key, p);
  return json(p);
}

// ---------- Kompetensiya dalillari (kasb standarti xaritasi uchun) ----------

async function evidenceFor(uid) {
  const [progress, selfStudy, trainer, routesList, diag, studio] = await Promise.all([
    db().get(`progress/${uid}`),
    getMany(`selfstudy/${uid}/`),
    getMany(`trainer/${uid}/`),
    getMany(`route/${uid}/`),
    Promise.all(Object.keys(STAGES).map((st) => db().get(diagKey(st, uid)))),
    getMany(`mytour/${uid}/`),
  ]);
  return {
    progress: progress || { topics: {} },
    selfStudy: selfStudy.map((x) => ({ taskId: x.taskId, grade: x.resubmitted ? null : x.grade })),
    trainer: trainer.map((x) => ({ scenarioId: x.scenarioId, total: x.total, createdAt: x.createdAt, voice: Boolean(x.voice) })),
    routes: routesList.filter((r) => r.grade).map((r) => ({ id: r.id, total: r.grade.total })),
    diag: diag.filter(Boolean).map((d) => ({ stage: d.stage, sections: ["A", "B", "C", "D"].filter((k) => d[k]?.submittedAt).length })),
    studio: studio.map((t) => ({ stops: t.stops.filter((x) => x.narration?.trim()).length, published: Boolean(t.published), reviewed: Boolean(t.review) })),
  };
}

async function myEvidence(req) {
  const user = await requireUser(req);
  return json(await evidenceFor(user.id));
}

async function allEvidence(req) {
  await requireTeacher(req);
  const users = (await getMany("user/")).filter((u) => u.role === "student");
  const items = await Promise.all(users.map(async (u) => ({ user: publicUser(u), evidence: await evidenceFor(u.id) })));
  return json(items);
}

// ---------- AI ovozi (Gemini TTS) ----------
// Har bir (matn, ovoz, uslub) bir marta yaratiladi va MP3 sifatida keshlanadi; keyin hamma uchun keshdan beriladi.

const TTS_DAILY = { student: 300, teacher: 3000 };
const ttsMetaKey = (k) => `ttsmeta/${k}`;
const ttsBinKey = (k) => `ttsbin/${k}`;
const ttsUrl = (k) => `/api/tts/audio/${k}.mp3`;

async function ttsSpeak(req) {
  const b = await body(req);
  const style = STYLES[b.style] ? b.style : "narrator";
  let text = "";
  let dialogue = null;
  let voice = VOICES.some((v) => v.id === b.voice) ? b.voice : "Kore";
  if (Array.isArray(b.dialogue) && b.dialogue.length) {
    // Suhbat: bir nechta personaj — bitta so'rovda (limitni tejash uchun).
    dialogue = b.dialogue
      .slice(0, 12)
      .map((x) => ({ speaker: str(x?.speaker, 40) || "Turist", gender: x?.gender === "male" ? "male" : "female", text: str(x?.text, 1500).replace(/\s+/g, " ").trim() }))
      .filter((x) => x.text);
    if (!dialogue.length) throw new HttpError(400, "Matn bo'sh");
    if (dialogue.reduce((n, x) => n + x.text.length, 0) > 2400) throw new HttpError(400, "Matn juda uzun");
    text = JSON.stringify(dialogue.map((x) => [x.speaker, x.gender, x.text]));
    voice = "dialogue";
  } else {
    text = str(b.text, 1800).replace(/\s+/g, " ").trim();
    if (!text) throw new HttpError(400, "Matn bo'sh");
  }
  const key = ttsKey(text, voice, style);
  const meta = await db().get(ttsMetaKey(key));
  if (meta) return json({ url: ttsUrl(key), cached: true, seconds: meta.seconds });
  if (!ttsEnabled()) throw new HttpError(503, "AI ovozi sozlanmagan (GEMINI_API_KEY)");
  // Yangi ovoz yaratish faqat tizimga kirganlar uchun (bepul limitni himoya qilish).
  const user = await requireUser(req);
  const day = new Date().toISOString().slice(0, 10);
  const qKey = `ttsq/${day}/${user.id}`;
  const used = (await db().get(qKey))?.n || 0;
  if (used >= (TTS_DAILY[user.role] || 300)) throw new HttpError(429, "Bugungi AI ovozi limiti tugadi. Ertaga qayta urinib ko'ring.");
  try {
    const out = await synthesize(text, { voice, style, dialogue });
    await db().setBinary(ttsBinKey(key), out.audio);
    await db().set(ttsMetaKey(key), { seconds: Math.round(out.seconds * 10) / 10, model: out.model, voice, style, chars: text.length, bytes: out.audio.length, createdAt: new Date().toISOString() });
    await db().set(qKey, { n: used + 1 });
    return json({ url: ttsUrl(key), cached: false, seconds: out.seconds });
  } catch (err) {
    const status = err.status === 429 ? 429 : err.status === 503 ? 503 : 502;
    await db().set("meta/tts-last-error", { at: new Date().toISOString(), status, message: err.message, detail: err.detail || "", quotaId: err.quotaId || "", daily: Boolean(err.daily), model: err.model || "" }).catch(() => {});
    return json({ error: err.message || "AI ovozini yaratib bo'lmadi", retryAfter: err.retryAfter ?? null, daily: Boolean(err.daily) }, status);
  }
}

async function ttsAudio(req, key) {
  const data = await db().getBinary(ttsBinKey(key));
  if (!data) throw new HttpError(404, "Audio topilmadi");
  return new Response(data, { headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" } });
}

async function ttsSettings() {
  return (await db().get("meta/tts-settings")) || { voice: "Kore" };
}

async function ttsInfo() {
  const st = await ttsSettings();
  return json({ enabled: ttsEnabled(), voices: VOICES, defaultVoice: st.voice });
}

async function setTtsSettings(req) {
  await requireTeacher(req);
  const b = await body(req);
  if (!VOICES.some((v) => v.id === b.voice)) throw new HttpError(400, "Ovoz noto'g'ri");
  await db().set("meta/tts-settings", { voice: b.voice, updatedAt: new Date().toISOString() });
  return json({ voice: b.voice });
}

async function adminTts(req) {
  await requireTeacher(req);
  const metas = await getMany("ttsmeta/");
  let models = [];
  if (ttsEnabled()) models = await ttsModels();
  return json({
    enabled: ttsEnabled(),
    models,
    voices: VOICES,
    defaultVoice: (await ttsSettings()).voice,
    lastError: await db().get("meta/tts-last-error"),
    cached: metas.length,
    seconds: Math.round(metas.reduce((n, m) => n + (m.seconds || 0), 0)),
    bytes: metas.reduce((n, m) => n + (m.bytes || 0), 0),
  });
}

// ---------- Test tahlili (item-analiz) ----------

async function adminItems(req) {
  await requireTeacher(req);
  const url = new URL(req.url);
  const cohort = url.searchParams.get("cohort") || "all";
  const topicId = url.searchParams.get("topic");
  const users = (await getMany("user/")).filter((u) => u.role === "student" && (cohort === "all" || (u.cohort || "unassigned") === cohort));
  const progress = await Promise.all(users.map((u) => db().get(`progress/${u.id}`)));
  const responsesOf = (t) => progress.map((p) => p?.topics?.[t.id]?.quizFirst).filter((r) => Array.isArray(r) && r.length === t.quiz.length && r.every((x) => Number.isInteger(x)));
  if (topicId) {
    const t = TOPICS.find((x) => x.id === topicId);
    if (!t) throw new HttpError(404, "Mavzu topilmadi");
    return json({ topic: { id: t.id, num: t.num, title: t.title }, ...itemAnalysis(t.quiz, responsesOf(t)) });
  }
  return json({
    topics: TOPICS.map((t) => {
      const a = itemAnalysis(t.quiz, responsesOf(t));
      return { id: t.id, num: t.num, title: t.title, n: a.n, meanPct: a.meanPct, kr20: a.kr20, critical: a.items.filter((it) => it.flags.some((f) => f.level === "critical")).length, warn: a.items.filter((it) => it.flags.some((f) => f.level === "warn")).length };
    }),
  });
}

// ---------- Safar Live: jonli sinf viktorinasi ----------
// O'yin hujjatiga faqat o'qituvchi yozadi; o'yinchilar va javoblar — alohida yozuvlar (bir vaqtda yozishda
// bir-birini o'chirmaslik uchun). Reyting javoblar ochilganda hisoblanib, o'yin hujjatiga saqlanadi.

const liveKey = (pin) => `live/${pin}`;
const livePlayerKey = (pin, pid) => `liveplayer/${pin}/${pid}`;
const liveAnsKey = (pin, pid, q) => `liveans/${pin}/${pid}/${q}`;
const AVATARS = ["🐪", "🦁", "🐯", "🦅", "🐬", "🦊", "🐼", "🐸", "🦉", "🐝", "🦄", "🐢", "🐧", "🐨", "🦋", "🐙"];
const liveCache = new Map(); // o'zgarmas yozuvlar (o'yinchi, javob) keshi

async function cachedDoc(key) {
  if (liveCache.has(key)) return liveCache.get(key);
  const d = await db().get(key);
  if (d) liveCache.set(key, d);
  if (liveCache.size > 5000) liveCache.clear();
  return d;
}

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

async function loadGame(pin) {
  if (!/^\d{6}$/.test(pin)) throw new HttpError(404, "O'yin topilmadi");
  const g = await db().get(liveKey(pin));
  if (!g || Date.now() - Date.parse(g.createdAt) > 24 * 3600_000) throw new HttpError(404, "Bunday PIN bilan o'yin topilmadi");
  return g;
}

const timeLeftOf = (g) => (g.state === "question" ? Math.max(0, g.duration * 1000 - (Date.now() - Date.parse(g.qStartedAt))) : 0);

async function liveCreate(req) {
  const teacher = await requireTeacher(req);
  const b = await body(req);
  const ids = Array.isArray(b.topicIds) && b.topicIds.length ? b.topicIds : TOPICS.map((t) => t.id);
  const pool = TOPICS.filter((t) => ids.includes(t.id)).flatMap((t) => t.quiz.map((q) => ({ ...q, topic: t.num })));
  if (!pool.length) throw new HttpError(400, "Tanlangan mavzularda test savollari yo'q");
  const count = Math.max(3, Math.min(30, Number(b.count) || 10));
  const questions = shuffle(pool)
    .slice(0, count)
    .map((q) => {
      const order = shuffle(q.options.map((_, i) => i)).slice(0, 4);
      if (!order.includes(q.correct)) order[0] = q.correct;
      const opts = shuffle(order);
      return { q: q.q, options: opts.map((i) => q.options[i]), correct: opts.indexOf(q.correct), topic: q.topic };
    });
  let pin;
  for (let i = 0; i < 20; i++) {
    pin = String(Math.floor(100000 + Math.random() * 900000));
    if (!(await db().get(liveKey(pin)))) break;
  }
  const game = {
    pin, hostId: teacher.id, hostName: teacher.name,
    title: str(b.title, 100) || "Safar Live viktorinasi",
    duration: Math.max(10, Math.min(90, Number(b.duration) || 20)),
    readAloud: Boolean(b.readAloud),
    questions, state: "lobby", qIndex: -1, qStartedAt: null, board: {}, dist: null, prevRanks: {},
    createdAt: new Date().toISOString(),
  };
  await db().set(liveKey(pin), game);
  return json({ pin }, 201);
}

async function livePlayers(pin) {
  const keys = await db().list(`liveplayer/${pin}/`);
  return (await Promise.all(keys.map(cachedDoc))).filter(Boolean).map(({ key, ...p }) => p);
}

async function liveHost(req, pin) {
  const user = await requireTeacher(req);
  const g = await loadGame(pin);
  if (g.hostId !== user.id) throw new HttpError(403, "Bu o'yin sizga tegishli emas");
  const players = await livePlayers(pin);
  let answered = 0;
  if (g.state === "question") answered = (await db().list(`liveans/${pin}/`)).filter((k) => k.endsWith(`/${g.qIndex}`)).length;
  return json({ ...g, players, answered, timeLeft: timeLeftOf(g), serverNow: Date.now() });
}

async function liveControl(req, pin) {
  const user = await requireTeacher(req);
  const g = await loadGame(pin);
  if (g.hostId !== user.id) throw new HttpError(403, "Bu o'yin sizga tegishli emas");
  const { action } = await body(req);
  if (action === "start" || action === "next") {
    if (g.state === "question") throw new HttpError(409, "Avval javoblarni oching");
    const nextQ = g.qIndex + 1;
    if (nextQ >= g.questions.length) g.state = "final";
    else Object.assign(g, { state: "question", qIndex: nextQ, qStartedAt: new Date().toISOString(), dist: null });
  } else if (action === "reveal") {
    if (g.state !== "question") return json(g);
    const players = await livePlayers(pin);
    const answers = (await Promise.all(players.map((p) => cachedDoc(liveAnsKey(pin, p.pid, g.qIndex))))).filter(Boolean);
    const dist = g.questions[g.qIndex].options.map(() => 0);
    const ranked = (b) => Object.entries(b).sort((a, c) => c[1].total - a[1].total).map(([pid], i) => [pid, i + 1]);
    g.prevRanks = Object.fromEntries(ranked(g.board));
    for (const p of players) {
      const prev = g.board[p.pid] || { name: p.name, avatar: p.avatar, total: 0, correct: 0, streak: 0 };
      const a = answers.find((x) => x.pid === p.pid);
      if (a) dist[a.choice] = (dist[a.choice] || 0) + 1;
      g.board[p.pid] = {
        name: p.name, avatar: p.avatar,
        total: prev.total + (a?.points || 0),
        last: a?.points || 0,
        correct: prev.correct + (a?.correct ? 1 : 0),
        streak: a?.correct ? prev.streak + 1 : 0,
        choice: a ? a.choice : null,
      };
    }
    Object.assign(g, { state: "reveal", dist });
  } else if (action === "end") {
    g.state = "final";
  } else throw new HttpError(400, "Noma'lum amal");
  await db().set(liveKey(pin), g);
  return json({ ok: true, state: g.state, qIndex: g.qIndex });
}

async function liveJoin(req, pin) {
  const g = await loadGame(pin);
  if (g.state === "final") throw new HttpError(409, "O'yin allaqachon tugagan");
  const b = await body(req);
  const name = str(b.name, 24).replace(/\s+/g, " ").trim();
  if (name.length < 2) throw new HttpError(400, "Ismingizni kiriting");
  const players = await livePlayers(pin);
  if (players.length >= 120) throw new HttpError(409, "O'yinda joy qolmadi");
  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new HttpError(409, "Bu ism band — boshqasini tanlang");
  const pid = newId().slice(0, 12);
  const key = crypto.randomBytes(12).toString("hex");
  await db().set(livePlayerKey(pin, pid), { pid, key, name, avatar: AVATARS.includes(b.avatar) ? b.avatar : AVATARS[players.length % AVATARS.length], joinedAt: new Date().toISOString() });
  return json({ pid, key, title: g.title }, 201);
}

async function livePlayer(pin, pid, key) {
  const p = await cachedDoc(livePlayerKey(pin, pid));
  if (!p || p.key !== key) throw new HttpError(403, "O'yinchi topilmadi — qaytadan qo'shiling");
  return p;
}

async function liveAnswer(req, pin) {
  const b = await body(req);
  const g = await loadGame(pin);
  const p = await livePlayer(pin, str(b.pid, 40), str(b.key, 60));
  const q = Number(b.q);
  if (g.state !== "question" || q !== g.qIndex) throw new HttpError(409, "Bu savol uchun vaqt tugagan");
  const elapsed = Date.now() - Date.parse(g.qStartedAt);
  if (elapsed > g.duration * 1000 + 1500) throw new HttpError(409, "Vaqt tugadi");
  if (await db().get(liveAnsKey(pin, p.pid, q))) throw new HttpError(409, "Javob allaqachon qabul qilingan");
  const choice = Number(b.choice);
  if (!Number.isInteger(choice) || choice < 0 || choice >= g.questions[q].options.length) throw new HttpError(400, "Variant noto'g'ri");
  const correct = choice === g.questions[q].correct;
  // Ball: to'g'ri javob 500 + tezlik uchun 500 gacha + seriya bonusi (ketma-ket to'g'ri javoblar)
  const prevStreak = g.board[p.pid]?.streak || 0;
  const speed = Math.max(0, 1 - elapsed / (g.duration * 1000));
  const points = correct ? Math.round(500 + 500 * speed + Math.min(prevStreak, 3) * 100) : 0;
  const ans = { pid: p.pid, q, choice, correct, points, ms: elapsed, at: new Date().toISOString() };
  await db().set(liveAnsKey(pin, p.pid, q), ans);
  return json({ ok: true });
}

async function livePlay(req, pin) {
  const url = new URL(req.url);
  const g = await loadGame(pin);
  const p = await livePlayer(pin, url.searchParams.get("pid") || "", url.searchParams.get("key") || "");
  const out = { title: g.title, state: g.state, qIndex: g.qIndex, total: g.questions.length, me: { name: p.name, avatar: p.avatar }, duration: g.duration };
  const ranks = Object.entries(g.board).sort((a, b) => b[1].total - a[1].total);
  const rankOf = (pid) => ranks.findIndex(([x]) => x === pid) + 1;
  if (g.state === "question") {
    const cur = g.questions[g.qIndex];
    out.question = { q: cur.q, options: cur.options };
    out.timeLeft = timeLeftOf(g);
    out.answered = Boolean(await db().get(liveAnsKey(pin, p.pid, g.qIndex)));
  }
  if (g.state === "reveal" || g.state === "final") {
    const b2 = g.board[p.pid] || { total: 0, last: 0, streak: 0, correct: 0, choice: null };
    out.result = { total: b2.total, last: b2.last, streak: b2.streak, correctCount: b2.correct, rank: rankOf(p.pid) || ranks.length + 1, players: Math.max(ranks.length, 1) };
    if (g.state === "reveal") {
      const cur = g.questions[g.qIndex];
      out.question = { q: cur.q, options: cur.options };
      out.result.correctOption = cur.correct;
      out.result.myChoice = b2.choice;
    }
    if (g.state === "final") out.podium = ranks.slice(0, 3).map(([, v]) => ({ name: v.name, avatar: v.avatar, total: v.total }));
  }
  return json(out);
}

// ---------- Ekskursiya studiyasi (o'quvchi yaratgan virtual ekskursiyalar) ----------

const LANDMARK_KEYS = new Set(["registan", "khiva", "bukhara", "shahizinda", "aksaray", "guramir", "tashkent"]);
const TIMES = new Set(["day", "sunset", "night"]);
const studioKey = (uid, id) => `mytour/${uid}/${id}`;

function cleanStudio(b, prev = {}) {
  const stops = (Array.isArray(b.stops) ? b.stops : prev.stops || []).slice(0, 12).map((x) => ({
    landmark: LANDMARK_KEYS.has(x?.landmark) ? x.landmark : "registan",
    time: TIMES.has(x?.time) ? x.time : "day",
    city: str(x?.city, 60),
    title: str(x?.title, 120),
    narration: str(x?.narration, 1500),
    facts: (Array.isArray(x?.facts) ? x.facts : []).map((f) => str(f, 140)).filter(Boolean).slice(0, 6),
  }));
  return { title: str(b.title ?? prev.title, 140) || "Mening ekskursiyam", description: str(b.description ?? prev.description, 600), stops, published: b.published === undefined ? Boolean(prev.published) : Boolean(b.published) };
}

async function myStudio(req) {
  const user = await requireUser(req);
  const list = await getMany(`mytour/${user.id}/`);
  return json(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

async function createStudio(req) {
  const user = await requireUser(req);
  const b = await body(req);
  const now = new Date().toISOString();
  const tour = { id: newId(), userId: user.id, author: shortName(user.name), college: user.college || "", ...cleanStudio(b), createdAt: now, updatedAt: now };
  await db().set(studioKey(user.id, tour.id), tour);
  await db().set(`mytourref/${tour.id}`, { uid: user.id });
  return json(tour, 201);
}

async function loadStudio(id) {
  const ref = await db().get(`mytourref/${id}`);
  return ref ? db().get(studioKey(ref.uid, id)) : null;
}

async function updateStudio(req, id) {
  const user = await requireUser(req);
  const tour = await db().get(studioKey(user.id, id));
  if (!tour) throw new HttpError(404, "Ekskursiya topilmadi");
  Object.assign(tour, cleanStudio(await body(req), tour), { updatedAt: new Date().toISOString() });
  await db().set(studioKey(user.id, id), tour);
  return json(tour);
}

async function deleteStudio(req, id) {
  const user = await requireUser(req);
  await db().del(studioKey(user.id, id));
  await db().del(`mytourref/${id}`);
  return json({ ok: true });
}

async function viewStudio(req, id) {
  const tour = await loadStudio(id);
  if (!tour) throw new HttpError(404, "Ekskursiya topilmadi");
  if (!tour.published) {
    const user = await requireUser(req).catch(() => null);
    if (!user || (user.id !== tour.userId && user.role !== "teacher")) throw new HttpError(403, "Muallif bu ekskursiyani hali ulashmagan");
  }
  const { userId, ...pub } = tour;
  return json(pub);
}

function demoReview(tour, reason = "AI kaliti ulanmagan") {
  const lines = [`“${tour.title}” ekskursiyasi bo'yicha avtomatik tahlil (${reason}):`];
  tour.stops.forEach((s, i) => {
    const words = s.narration.split(/\s+/).filter(Boolean).length;
    const tips = [];
    if (words < 40) tips.push("matn juda qisqa — kamida 60–120 so'z (taxminan 1 daqiqa) yozing");
    if (words > 220) tips.push("matn uzun — guruh diqqatini ushlab turish uchun 2 daqiqadan oshirmang");
    if (!/\d/.test(s.narration)) tips.push("aniq sana yoki raqam qo'shing");
    if (!/\?/.test(s.narration)) tips.push("guruhga savol bering — interaktivlik oshadi");
    if (!s.facts.length) tips.push("2–3 ta qisqa fakt qo'shing");
    lines.push(`${i + 1}) ${s.title || "Nomsiz bekat"}: ${words} so'z. ${tips.length ? `Tavsiya: ${tips.join("; ")}.` : "Yaxshi tuzilgan!"}`);
  });
  lines.push("Umumiy: ekskursiyani salomlashish va reja bilan boshlang, oxirida xulosa va minnatdorchilik bildiring.");
  return lines.join("\n");
}

async function reviewStudio(req, id) {
  const user = await requireUser(req);
  const tour = await db().get(studioKey(user.id, id));
  if (!tour) throw new HttpError(404, "Ekskursiya topilmadi");
  if (!tour.stops.length) throw new HttpError(400, "Avval kamida bitta bekat qo'shing");
  let text;
  if (!aiEnabled()) text = demoReview(tour);
  else {
    const content = tour.stops.map((s, i) => `${i + 1}-bekat: ${s.title} (${s.city})\nGid matni: ${s.narration}\nFaktlar: ${s.facts.join("; ")}`).join("\n\n");
    text = await completeText({
      system: "Sen tajribali gid-metodist va O'zbekiston tarixi bo'yicha mutaxassissan. Turizm texnikumi o'quvchisi tayyorlagan virtual ekskursiya matnini o'zbek tilida (lotin) tahlil qil. Markdown belgilari (*, #) ishlatma. Tuzilma: 1) Umumiy baho (10 ballik) va bir gapda xulosa; 2) Har bir bekat bo'yicha: faktlar aniqligi (shubhali yoki noto'g'ri faktlarni aniq ko'rsat), hikoya tuzilmasi (qiziqtiruvchi boshlanish, asosiy ma'lumot, rivoyat yoki qiziq detal, guruh bilan muloqot), til va uslub, davomiyligi; 3) Uchta eng muhim tavsiya. Qisqa va aniq yoz.",
      messages: [{ role: "user", content: `Ekskursiya: ${tour.title}\n${tour.description}\n\n${content}` }],
      maxTokens: 1400,
    }).catch(() => "");
    if (!text) text = demoReview(tour, "AI xizmati hozir javob bermadi");
  }
  tour.review = { text, at: new Date().toISOString() };
  await db().set(studioKey(user.id, id), tour);
  return json(tour.review);
}

async function adminStudio(req) {
  await requireTeacher(req);
  const list = await getMany("mytour/");
  return json(list.map(({ userId, ...t }) => t).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

// ---------- AI Ustoz (mavzu bo'yicha yordamchi) ----------

async function topicAsk(req, topicId) {
  await requireUser(req);
  const topic = findTopic(topicId);
  if (!topic) throw new HttpError(404, "Mavzu topilmadi");
  const b = await body(req);
  let raw = Array.isArray(b.messages) ? b.messages.slice(-11) : [];
  if (raw[0]?.role === "assistant") raw = raw.slice(1);
  const history = cleanHistory(raw);
  if (!history.length || history[history.length - 1].role !== "user") throw new HttpError(400, "Savol bo'sh");
  if (!aiEnabled()) {
    return new Response(searchAnswer(topic, history[history.length - 1].content), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const stream = streamText({ system: tutorSystem(topic), messages: history, maxTokens: 900, effort: "low" });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

// ---------- Reyting va sertifikat ----------

const shortName = (name) => {
  const [first, ...rest] = String(name || "").trim().split(/\s+/);
  return rest.length ? `${first} ${rest[0][0]}.` : first || "O'quvchi";
};
let ratingCache = { at: 0, rows: null };

async function ratingRows() {
  if (ratingCache.rows && Date.now() - ratingCache.at < 5 * 60_000) return ratingCache.rows;
  const users = (await getMany("user/")).filter((u) => u.role === "student");
  const rows = await Promise.all(
    users.map(async (u) => {
      const game = computeGame(await evidenceFor(u.id));
      return { id: u.id, name: shortName(u.name), group: u.group || "", college: u.college || "", collegeKey: normCollege(u.college), hidden: Boolean(u.hideFromRating), xp: game.xp, level: game.level.name, icon: game.level.icon, streak: game.stats.streak, badges: game.badges.filter((b) => b.earned).length };
    })
  );
  ratingCache = { at: Date.now(), rows };
  return rows;
}

async function leaderboard(req) {
  const user = await requireUser(req);
  const rows = await ratingRows();
  const pick = (filter) => {
    const list = rows.filter(filter).sort((a, b) => b.xp - a.xp);
    const meIdx = list.findIndex((r) => r.id === user.id);
    const view = list.map((r, i) => ({ rank: i + 1, me: r.id === user.id, name: r.hidden && r.id !== user.id ? "Yashirin ishtirokchi" : r.name, group: r.group, xp: r.xp, level: r.level, icon: r.icon, streak: r.streak, badges: r.badges }));
    return { total: list.length, top: view.slice(0, 20), me: meIdx >= 20 ? view[meIdx] : null };
  };
  const mine = rows.find((r) => r.id === user.id);
  return json({
    group: user.group ? pick((r) => r.group && r.group.toLowerCase() === String(user.group).toLowerCase() && r.collegeKey === normCollege(user.college)) : null,
    college: pick((r) => r.collegeKey === normCollege(user.college)),
    all: pick(() => true),
    myGroup: user.group || "",
    myCollege: user.college || "",
    hidden: Boolean(mine?.hidden),
  });
}

async function issueCertificate(req) {
  const user = await requireUser(req);
  if (user.role !== "student") throw new HttpError(403, "Sertifikat faqat o'quvchilarga beriladi");
  const existing = await db().get(`certuser/${user.id}`);
  if (existing) return json(await db().get(`cert/${existing.code}`));
  const game = computeGame(await evidenceFor(user.id));
  const status = certificateStatus(game);
  if (!status.eligible) throw new HttpError(400, "Sertifikat shartlari hali bajarilmagan");
  const code = `SA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const cert = {
    code,
    name: user.name,
    college: user.college || "",
    group: user.group || "",
    course: "Turizmda raqamli texnologiyalar",
    issuedAt: new Date().toISOString(),
    stats: { xp: game.xp, level: game.level.name, levelIcon: game.level.icon, topicsDone: game.stats.topicsDone, bestTrainer: game.stats.bestTrainer, scenarios: game.stats.scenariosTried, bestRoute: game.stats.bestRoute, badges: game.badges.filter((b) => b.earned).length },
  };
  await db().set(`cert/${code}`, cert);
  await db().set(`certuser/${user.id}`, { code });
  return json(cert, 201);
}

async function getCertificate(req, code) {
  const cert = await db().get(`cert/${String(code).toUpperCase()}`);
  if (!cert) throw new HttpError(404, "Bunday sertifikat topilmadi");
  return json(cert);
}

async function myCertificate(req) {
  const user = await requireUser(req);
  const ref = await db().get(`certuser/${user.id}`);
  return json(ref ? await db().get(`cert/${ref.code}`) : null);
}

// ---------- Sozlamalar va diagnostika ----------

let secretReady = false;
async function ensureSecret() {
  if (secretReady || process.env.JWT_SECRET || process.env.VGT_LOCAL_DATA) return;
  const store = db();
  let meta = await store.get("meta/secret");
  if (!meta?.value) {
    meta = { value: crypto.randomBytes(48).toString("base64url"), createdAt: new Date().toISOString() };
    await store.set("meta/secret", meta);
  }
  setGeneratedSecret(meta.value);
  secretReady = true;
}

function describeError(err) {
  const name = err?.name || "";
  const msg = String(err?.message || err);
  if (name === "MissingBlobsEnvironmentError" || /Netlify Blobs/i.test(msg)) return "Ma'lumotlar ombori (Netlify Blobs) ulanmagan. /api/health sahifasini tekshiring.";
  if (/JWT_SECRET/.test(msg)) return "JWT_SECRET sozlanmagan.";
  return `Serverda kutilmagan xatolik yuz berdi (${name || "Error"}: ${msg.slice(0, 160)})`;
}

async function health() {
  const checks = { blobs: "tekshirilmoqda", jwtSecret: process.env.JWT_SECRET ? "o'rnatilgan" : "avtomatik (omborda)", teacherCode: process.env.TEACHER_CODE ? "o'rnatilgan" : "o'rnatilmagan", ai: provider() ? `${provider()} (${modelName()})` : "demo-rejim", node: process.version };
  checks.tts = ttsEnabled() ? `gemini (${(await ttsModels().catch(() => []))[0] || "model topilmadi"})` : "o'chiq (brauzer ovozi)";
  try {
    await db().set("meta/health", { at: new Date().toISOString() });
    await db().get("meta/health");
    checks.blobs = "ishlayapti";
  } catch (err) {
    checks.blobs = `XATO: ${err?.name || ""} ${String(err?.message || err).slice(0, 200)}`;
  }
  return json(checks, checks.blobs === "ishlayapti" ? 200 : 500);
}

// ---------- Mavzu taqdimotlari (slaydlar) ----------
// Fayl 3 MB li bo'laklarda yuklanadi va saqlanadi: Netlify funksiyasining so'rov/javob chegarasi (6 MB) oshmaydi.

const SLIDE_CHUNK = 3 * 1024 * 1024;
const SLIDE_LIMITS = { pdf: 60 * 1024 * 1024, pptx: 20 * 1024 * 1024 };
const slideKey = (topicId) => `slides/${topicId}`;
const slideBin = (topicId, uploadId, i) => `slidebin/${topicId}/${uploadId}/${i}`;
const topicIdOk = (id) => /^[\w-]{1,40}$/.test(id);

function slideKind(name, mime) {
  if (/\.pdf$/i.test(name) || mime === "application/pdf") return "pdf";
  if (/\.pptx$/i.test(name) || mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "pptx";
  return null;
}

/** Google Slides, Canva, OneDrive/PowerPoint Online havolalarini joylashtiriladigan ko'rinishga keltiradi. */
function embedUrlFor(url) {
  const u = new URL(url);
  const g = url.match(/docs\.google\.com\/presentation\/d\/(e\/)?([\w-]+)/);
  if (g) return g[1] ? `https://docs.google.com/presentation/d/e/${g[2]}/embed?start=false&loop=false&delayms=5000` : `https://docs.google.com/presentation/d/${g[2]}/embed?start=false&loop=false&delayms=5000`;
  if (/canva\.com$/.test(u.hostname) || u.hostname.endsWith(".canva.com")) {
    const m = url.match(/canva\.com\/design\/([\w-]+)\/([\w-]+)/);
    if (m) return `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`;
  }
  return url;
}

async function listSlides() {
  const items = await getMany("slides/");
  return json({ slides: items.map(({ by, ...rest }) => rest) });
}

async function getSlides(req, topicId) {
  const meta = await db().get(slideKey(topicId));
  if (!meta) throw new HttpError(404, "Bu mavzu uchun taqdimot joylanmagan");
  const { by, ...rest } = meta;
  return json(rest);
}

async function slideChunk(req, topicId, uploadId, i) {
  const meta = await db().get(slideKey(topicId));
  if (!meta || meta.uploadId !== uploadId || Number(i) >= meta.chunks) throw new HttpError(404, "Fayl topilmadi");
  const data = await db().getBinary(slideBin(topicId, uploadId, i));
  if (!data) throw new HttpError(404, "Fayl bo'lagi topilmadi");
  return new Response(data, { headers: { "content-type": "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
}

/** To'liq fayl (PowerPoint Online ko'ruvchisi va yuklab olish uchun) — oqim bilan uzatiladi. */
async function slideFile(req, topicId) {
  const meta = await db().get(slideKey(topicId));
  if (!meta || meta.kind === "link") throw new HttpError(404, "Fayl topilmadi");
  const store = db();
  let i = 0;
  const stream = new ReadableStream({
    async pull(controller) {
      if (i >= meta.chunks) return controller.close();
      const part = await store.getBinary(slideBin(topicId, meta.uploadId, i++));
      if (!part) return controller.error(new Error("Fayl bo'lagi topilmadi"));
      controller.enqueue(new Uint8Array(part));
    },
  });
  const type = meta.kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const ascii = meta.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(stream, {
    headers: {
      "content-type": type,
      "content-length": String(meta.size),
      "content-disposition": `${new URL(req.url).searchParams.has("download") ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      "cache-control": "public, max-age=300",
    },
  });
}

async function slidesInit(req, topicId) {
  await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const name = str(b.name, 200);
  const size = Number(b.size);
  const kind = slideKind(name, b.mime);
  if (!kind) throw new HttpError(400, "Faqat PDF (.pdf) yoki PowerPoint (.pptx) fayl yuklash mumkin");
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(400, "Fayl bo'sh");
  if (size > SLIDE_LIMITS[kind]) throw new HttpError(413, `Fayl juda katta: ${kind.toUpperCase()} uchun eng ko'pi ${SLIDE_LIMITS[kind] / 1024 / 1024} MB`);
  return json({ uploadId: newId(), chunkSize: SLIDE_CHUNK, chunks: Math.ceil(size / SLIDE_CHUNK), kind });
}

async function slidesPutChunk(req, topicId, uploadId, i) {
  await requireTeacher(req);
  if (!topicIdOk(topicId) || !/^[\w-]{6,64}$/.test(uploadId) || !/^\d{1,3}$/.test(i)) throw new HttpError(400, "So'rov noto'g'ri");
  const data = await req.arrayBuffer();
  if (!data.byteLength || data.byteLength > SLIDE_CHUNK) throw new HttpError(400, "Fayl bo'lagi hajmi noto'g'ri");
  await db().setBinary(slideBin(topicId, uploadId, i), data);
  return json({ ok: true, size: data.byteLength });
}

async function deleteSlideFiles(meta) {
  if (!meta?.uploadId) return;
  const keys = await db().list(`slidebin/${meta.topicId}/${meta.uploadId}/`);
  await Promise.all(keys.map((k) => db().del(k)));
}

async function slidesCommit(req, topicId) {
  const teacher = await requireTeacher(req);
  const b = await body(req);
  const name = str(b.name, 200);
  const size = Number(b.size);
  const kind = slideKind(name, b.mime);
  const uploadId = str(b.uploadId, 64);
  if (!topicIdOk(topicId) || !kind || !uploadId) throw new HttpError(400, "So'rov noto'g'ri");
  const chunks = Math.ceil(size / SLIDE_CHUNK);
  const keys = new Set(await db().list(`slidebin/${topicId}/${uploadId}/`));
  for (let i = 0; i < chunks; i++) if (!keys.has(slideBin(topicId, uploadId, i))) throw new HttpError(400, `Fayl to'liq yuklanmadi (${i + 1}-bo'lak yo'q). Qayta urinib ko'ring.`);
  const old = await db().get(slideKey(topicId));
  const meta = {
    topicId, kind, name, size, chunks, uploadId,
    title: str(b.title, 200) || name.replace(/\.(pdf|pptx)$/i, ""),
    pages: Number.isInteger(b.pages) && b.pages > 0 ? b.pages : undefined,
    uploadedAt: new Date().toISOString(),
    by: teacher.name,
  };
  await db().set(slideKey(topicId), meta);
  if (old && old.uploadId !== uploadId) await deleteSlideFiles(old);
  return json(meta);
}

async function slidesLink(req, topicId) {
  const teacher = await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const url = str(b.url, 1000);
  if (!/^https:\/\//i.test(url)) throw new HttpError(400, "Havola https:// bilan boshlanishi kerak");
  let embed;
  try {
    embed = embedUrlFor(url);
  } catch {
    throw new HttpError(400, "Havola noto'g'ri");
  }
  const old = await db().get(slideKey(topicId));
  const meta = { topicId, kind: "link", url, embedUrl: embed, title: str(b.title, 200) || "Taqdimot", uploadedAt: new Date().toISOString(), by: teacher.name };
  await db().set(slideKey(topicId), meta);
  if (old) await deleteSlideFiles(old);
  return json(meta);
}

async function slidesDelete(req, topicId) {
  await requireTeacher(req);
  const old = await db().get(slideKey(topicId));
  if (old) {
    await deleteSlideFiles(old);
    await db().del(slideKey(topicId));
  }
  return json({ ok: true });
}

// ---------- Video darslar ----------
// O'qituvchi har bir mavzuga bir nechta video qo'shadi: YouTube/Vimeo havolasi yoki fayl (MP4/WebM, 80 MB gacha).

const VIDEO_LIMIT = 80 * 1024 * 1024;
const videoKey = (topicId, id) => `video/${topicId}/${id}`;
const videoBin = (topicId, uploadId, i) => `mediabin/${topicId}/${uploadId}/${i}`;

function videoLink(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`, thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { kind: "url", embedUrl: url };
  return { kind: "link", embedUrl: url };
}

async function listVideos() {
  const items = await getMany("video/");
  return json({ videos: items.map(({ by, ...rest }) => rest).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
}

async function videoChunk(req, topicId, id, uploadId, i) {
  const meta = await db().get(videoKey(topicId, id));
  if (!meta || meta.uploadId !== uploadId || Number(i) >= meta.chunks) throw new HttpError(404, "Video topilmadi");
  const data = await db().getBinary(videoBin(topicId, uploadId, i));
  if (!data) throw new HttpError(404, "Video bo'lagi topilmadi");
  return new Response(data, { headers: { "content-type": "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
}

async function videoAddLink(req, topicId) {
  const teacher = await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const url = str(b.url, 1000);
  if (!/^https:\/\//i.test(url)) throw new HttpError(400, "Havola https:// bilan boshlanishi kerak");
  const meta = { id: newId(), topicId, ...videoLink(url), url, title: str(b.title, 200) || "Video dars", description: str(b.description, 1000), createdAt: new Date().toISOString(), by: teacher.name };
  await db().set(videoKey(topicId, meta.id), meta);
  return json(meta, 201);
}

async function videoInit(req, topicId) {
  await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const size = Number(b.size);
  if (!/^video\/(mp4|webm|ogg|quicktime)$/.test(String(b.mime)) && !/\.(mp4|webm|ogv|mov)$/i.test(String(b.name))) throw new HttpError(400, "Faqat video fayl (MP4, WebM) yuklash mumkin");
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(400, "Fayl bo'sh");
  if (size > VIDEO_LIMIT) throw new HttpError(413, "Video juda katta: eng ko'pi 80 MB. Kattaroq videolarni YouTube'ga joylab, havolasini qo'shing.");
  return json({ uploadId: newId(), chunkSize: SLIDE_CHUNK, chunks: Math.ceil(size / SLIDE_CHUNK) });
}

async function videoPutChunk(req, topicId, uploadId, i) {
  await requireTeacher(req);
  if (!topicIdOk(topicId) || !/^[\w-]{6,64}$/.test(uploadId) || !/^\d{1,3}$/.test(i)) throw new HttpError(400, "So'rov noto'g'ri");
  const data = await req.arrayBuffer();
  if (!data.byteLength || data.byteLength > SLIDE_CHUNK) throw new HttpError(400, "Fayl bo'lagi hajmi noto'g'ri");
  await db().setBinary(videoBin(topicId, uploadId, i), data);
  return json({ ok: true });
}

async function videoCommit(req, topicId) {
  const teacher = await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const uploadId = str(b.uploadId, 64);
  const size = Number(b.size);
  const chunks = Math.ceil(size / SLIDE_CHUNK);
  const keys = new Set(await db().list(`mediabin/${topicId}/${uploadId}/`));
  for (let i = 0; i < chunks; i++) if (!keys.has(videoBin(topicId, uploadId, i))) throw new HttpError(400, `Video to'liq yuklanmadi (${i + 1}-bo'lak yo'q)`);
  const poster = typeof b.poster === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(b.poster) && b.poster.length < 200_000 ? b.poster : undefined;
  const meta = {
    id: newId(), topicId, kind: "file", uploadId, chunks, size,
    mime: /^video\/[\w.+-]+$/.test(String(b.mime)) ? String(b.mime) : "video/mp4",
    name: str(b.name, 200),
    title: str(b.title, 200) || str(b.name, 200).replace(/\.\w+$/, ""),
    description: str(b.description, 1000),
    duration: Number.isFinite(b.duration) ? Math.round(b.duration) : undefined,
    poster,
    createdAt: new Date().toISOString(),
    by: teacher.name,
  };
  await db().set(videoKey(topicId, meta.id), meta);
  return json(meta, 201);
}

async function videoUpdate(req, topicId, id) {
  await requireTeacher(req);
  const meta = await db().get(videoKey(topicId, id));
  if (!meta) throw new HttpError(404, "Video topilmadi");
  const b = await body(req);
  if (b.title !== undefined) meta.title = str(b.title, 200) || meta.title;
  if (b.description !== undefined) meta.description = str(b.description, 1000);
  await db().set(videoKey(topicId, id), meta);
  return json(meta);
}

async function videoDelete(req, topicId, id) {
  await requireTeacher(req);
  const meta = await db().get(videoKey(topicId, id));
  if (meta?.uploadId) {
    const keys = await db().list(`mediabin/${topicId}/${meta.uploadId}/`);
    await Promise.all(keys.map((k) => db().del(k)));
  }
  await db().del(videoKey(topicId, id));
  return json({ ok: true });
}

// ---------- Ommaviy natijalar (texnikumlar kesimida) ----------

const normCollege = (name) => String(name || "").toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, " ").trim();
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const round2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
let publicCache = { at: 0, data: null };

/** Faqat umumlashtirilgan ko'rsatkichlar: shaxsiy ma'lumotlar chiqmaydi. 60 soniya keshlanadi. */
async function publicSnapshot() {
  if (publicCache.data && Date.now() - publicCache.at < 60_000) return publicCache.data;
  const [users, records] = await Promise.all([getMany("user/"), getMany("diag/")]);
  const students = users.filter((u) => u.role === "student");
  const groups = new Map();
  const groupOf = (u) => {
    const key = normCollege(u.college) || "—";
    if (!groups.has(key)) groups.set(key, { key, spellings: new Map(), students: 0, recs: [] });
    const g = groups.get(key);
    const label = String(u.college || "").trim() || "Muassasa ko'rsatilmagan";
    g.spellings.set(label, (g.spellings.get(label) || 0) + 1);
    return g;
  };
  const byId = new Map();
  for (const u of students) {
    const g = groupOf(u);
    g.students++;
    byId.set(u.id, g);
  }
  for (const r of records) byId.get(r.userId)?.recs.push(r);

  const summarize = (recs) =>
    Object.fromEntries(
      Object.keys(STAGES).map((st) => {
        const list = recs.filter((r) => r.stage === st).map((r) => r.result || computeResult(r));
        const pick = (k) => list.map((x) => x[k]).filter((v) => Number.isFinite(v));
        const complete = list.filter((x) => Number.isFinite(x.B));
        const levels = { Past: 0, "O'rta": 0, Yuqori: 0 };
        for (const x of complete) levels[x.level]++;
        return [st, { n: list.length, complete: complete.length, B: round2(mean(pick("B"))), M: round2(mean(pick("Mavg"))), T: round2(mean(pick("Tpct"))), levels }];
      })
    );

  const colleges = [...groups.values()]
    .map((g) => ({ name: [...g.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0], students: g.students, stages: summarize(g.recs) }))
    .sort((a, b) => b.students - a.students);
  const data = {
    updatedAt: new Date().toISOString(),
    stages: STAGES,
    total: { name: "Barcha texnikumlar", students: students.length, stages: summarize(records.filter((r) => byId.has(r.userId))) },
    colleges,
  };
  publicCache = { at: Date.now(), data };
  return data;
}

async function knownColleges() {
  try {
    return (await publicSnapshot()).colleges.filter((c) => c.name !== "Muassasa ko'rsatilmagan").map((c) => c.name).slice(0, 50);
  } catch {
    return [];
  }
}

// ---------- Router ----------

const routes = [
  ["POST", /^auth\/register$/, register],
  ["POST", /^auth\/login$/, login],
  ["GET", /^me$/, async (req) => json(publicUser(await requireUser(req)))],
  ["PUT", /^me$/, updateMe],
  ["GET", /^health$/, health],
  ["GET", /^public\/results$/, async () => json(await publicSnapshot())],
  ["GET", /^config$/, async () => json({ aiEnabled: aiEnabled(), teacherSignup: Boolean(process.env.TEACHER_CODE), colleges: await knownColleges() })],

  ["GET", /^slides$/, listSlides],
  ["GET", /^slides\/([\w-]+)$/, getSlides],
  ["GET", /^slides\/([\w-]+)\/file$/, slideFile],
  ["GET", /^slides\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, slideChunk],
  ["POST", /^admin\/slides\/([\w-]+)\/init$/, slidesInit],
  ["PUT", /^admin\/slides\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, slidesPutChunk],
  ["POST", /^admin\/slides\/([\w-]+)\/commit$/, slidesCommit],
  ["PUT", /^admin\/slides\/([\w-]+)\/link$/, slidesLink],
  ["DELETE", /^admin\/slides\/([\w-]+)$/, slidesDelete],

  ["GET", /^videos$/, listVideos],
  ["GET", /^videos\/([\w-]+)\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, videoChunk],
  ["POST", /^admin\/videos\/([\w-]+)\/link$/, videoAddLink],
  ["POST", /^admin\/videos\/([\w-]+)\/init$/, videoInit],
  ["PUT", /^admin\/videos\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, videoPutChunk],
  ["POST", /^admin\/videos\/([\w-]+)\/commit$/, videoCommit],
  ["PUT", /^admin\/videos\/([\w-]+)\/([\w-]+)$/, videoUpdate],
  ["DELETE", /^admin\/videos\/([\w-]+)\/([\w-]+)$/, videoDelete],

  ["GET", /^surveys$/, listSurveys],
  ["GET", /^surveys\/([\w-]+)$/, getSurvey],
  ["POST", /^surveys\/([\w-]+)\/responses$/, submitSurvey],

  ["GET", /^progress$/, getProgress],
  ["PUT", /^progress$/, saveProgress],
  ["GET", /^self-study$/, mySelfStudy],
  ["POST", /^self-study\/([\w-]+)$/, submitSelfStudy],

  ["GET", /^trainer\/scenarios$/, async () => json({ scenarios: SCENARIOS.map(publicScenario), criteria: CRITERIA, aiEnabled: aiEnabled(), voiceAI: voiceEnabled() })],
  ["POST", /^trainer\/chat$/, trainerChat],
  ["POST", /^trainer\/transcribe$/, trainerTranscribe],
  ["POST", /^trainer\/hint$/, trainerHint],
  ["POST", /^trainer\/evaluate$/, trainerEvaluate],
  ["GET", /^trainer\/sessions$/, mySessions],

  ["GET", /^diagnostics$/, myDiagnostics],
  ["PUT", /^diagnostics\/(T[012])\/(A|B|C|D)$/, diagSection],
  ["POST", /^diagnostics\/(T[012])\/(B-start)$/, diagSection],
  ["GET", /^admin\/diagnostics$/, adminDiagnostics],
  ["PUT", /^admin\/diagnostics\/settings$/, setDiagSettings],
  ["PUT", /^admin\/diagnostics\/(T[012])\/([\w-]+)\/grade$/, gradeDiagnostics],
  ["DELETE", /^admin\/diagnostics\/(T[012])\/([\w-]+)\/(A|B|C|D|all)$/, resetDiagnostics],

  ["GET", /^routes$/, myRoutes],
  ["PUT", /^routes\/([\w-]+)$/, saveRoute],
  ["POST", /^routes\/([\w-]+)\/submit$/, submitRoute],
  ["DELETE", /^routes\/([\w-]+)$/, deleteRoute],
  ["GET", /^admin\/routes$/, adminRoutes],
  ["PUT", /^admin\/routes\/([\w-]+)\/([\w-]+)\/grade$/, gradeRoute],

  ["GET", /^evidence$/, myEvidence],
  ["GET", /^leaderboard$/, leaderboard],
  ["GET", /^admin\/items$/, adminItems],
  ["POST", /^live$/, liveCreate],
  ["GET", /^live\/(\d{6})\/host$/, liveHost],
  ["POST", /^live\/(\d{6})\/control$/, liveControl],
  ["POST", /^live\/(\d{6})\/join$/, liveJoin],
  ["POST", /^live\/(\d{6})\/answer$/, liveAnswer],
  ["GET", /^live\/(\d{6})\/play$/, livePlay],
  ["GET", /^studio$/, myStudio],
  ["POST", /^studio$/, createStudio],
  ["GET", /^studio\/view\/([\w-]+)$/, viewStudio],
  ["PUT", /^studio\/([\w-]+)$/, updateStudio],
  ["DELETE", /^studio\/([\w-]+)$/, deleteStudio],
  ["POST", /^studio\/([\w-]+)\/review$/, reviewStudio],
  ["GET", /^admin\/studio$/, adminStudio],
  ["POST", /^tts$/, ttsSpeak],
  ["GET", /^tts$/, ttsInfo],
  ["GET", /^tts\/audio\/([0-9a-f]{40})\.mp3$/, ttsAudio],
  ["GET", /^admin\/tts$/, adminTts],
  ["PUT", /^admin\/tts$/, setTtsSettings],
  ["POST", /^topics\/([\w-]+)\/ask$/, topicAsk],
  ["GET", /^certificate$/, myCertificate],
  ["POST", /^certificate$/, issueCertificate],
  ["GET", /^certificate\/(SA-[0-9A-Fa-f]{8})$/, getCertificate],
  ["GET", /^admin\/evidence$/, allEvidence],
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
    if (path !== "health") await ensureSecret();
    for (const [method, pattern, fn] of routes) {
      const m = path.match(pattern);
      if (m && req.method === method) return await fn(req, ...m.slice(1).map(decodeURIComponent));
    }
    throw new HttpError(404, "Topilmadi");
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: describeError(err) }, 500);
  }
}

export const config = { path: "/api/*" };
