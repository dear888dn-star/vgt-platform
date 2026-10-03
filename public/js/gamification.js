// "Safar pasporti": XP ballari, darajalar, mavzu muhrlari, nishonlar va kunlik seriya.
// Bu modul DOM'ga bog'liq emas — brauzerda ham, serverda (reyting, sertifikat) ham bir xil hisoblaydi.
import { TOPICS } from "../data/topics.js";

export const LEVELS = [
  { min: 0, name: "Sayyoh", icon: "🎒" },
  { min: 120, name: "Yo'lovchi", icon: "🧳" },
  { min: 320, name: "Kashfiyotchi", icon: "🧭" },
  { min: 650, name: "Ekskursovod", icon: "🗺️" },
  { min: 1050, name: "Gid", icon: "🎙️" },
  { min: 1600, name: "Tajribali gid", icon: "🏛️" },
  { min: 2300, name: "Gid-tarjimon", icon: "🌍" },
  { min: 3200, name: "Safar ustasi", icon: "👑" },
];

export const XP_RULES = [
  ["Mavzu nazariyasini o'qish", 20],
  ["Mavzu testidan o'tish (≥60%)", 30],
  ["Testda 100% natija", 20],
  ["Tushunchalar kartalarini ko'rib chiqish", 10],
  ["Animatsion darsni oxirigacha ko'rish", 10],
  ["Interaktiv metodni bajarish", 15],
  ["Mustaqil ish bahosi", "baho × 10"],
  ["Trenajyor mashg'uloti", "15 + eng yaxshi ball / 2"],
  ["Marshrut loyihasi bahosi", "ball / 2"],
  ["Diagnostika bo'limini topshirish", 10],
  ["Kunlik takrorlashdagi har bir karta", 1],
  ["Ketma-ket faol kun (seriya)", 5],
  ["Ulashilgan virtual ekskursiya (3+ bekat)", 40],
  ["Geo-sayohat o'yini (20 tagacha)", "5 + eng yaxshi natija / 200"],
];

const dayKey = (d) => d.toISOString().slice(0, 10);

/** Ketma-ket faol kunlar soni (bugun yoki kechadan boshlab). */
export function streakOf(activity = {}, today = new Date()) {
  const days = new Set(Object.keys(activity).filter((k) => activity[k] > 0));
  const d = new Date(today);
  if (!days.has(dayKey(d))) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export function longestStreak(activity = {}) {
  const days = Object.keys(activity).filter((k) => activity[k] > 0).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of days) {
    const t = Date.parse(k);
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

function topicPart(t, topic) {
  if (!t) return { xp: 0, pct: 0 };
  const methodsDone = topic.methods.filter((m) => t.methods?.[m.id]?.done).length;
  const quizPass = t.quiz !== null && t.quiz !== undefined && t.quiz >= 60;
  const xp = (t.read ? 20 : 0) + (quizPass ? 30 : 0) + (t.quiz === 100 ? 20 : 0) + (t.flashcards ? 10 : 0) + (t.watched ? 10 : 0) + methodsDone * 15;
  const parts = [t.read, quizPass, t.flashcards, ...topic.methods.map((m) => Boolean(t.methods?.[m.id]?.done))];
  return { xp, pct: Math.round((parts.filter(Boolean).length / parts.length) * 100), quiz: t.quiz ?? null, methodsDone };
}

export function levelOf(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] || null;
  return { index: i, ...cur, next, toNext: next ? next.min - xp : 0, pct: next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100 };
}

/**
 * Barcha ko'rsatkichlar. evidence: { progress, selfStudy, trainer, routes, diag }.
 * Faqat progress berilsa (mehmon yoki tezkor hisob), qolgan qismlar 0 deb olinadi.
 */
export function computeGame(evidence = {}, today = new Date()) {
  const progress = evidence.progress || {};
  const topics = TOPICS.map((topic) => ({ id: topic.id, num: topic.num, title: topic.title, icon: topic.icon, ...topicPart(progress.topics?.[topic.id], topic) }));
  const bySource = { topics: topics.reduce((s, t) => s + t.xp, 0) };

  const graded = (evidence.selfStudy || []).filter((x) => Number.isFinite(x.grade));
  bySource.selfStudy = graded.reduce((s, x) => s + x.grade * 10, 0);

  const bestByScenario = {};
  for (const s of evidence.trainer || []) bestByScenario[s.scenarioId] = Math.max(bestByScenario[s.scenarioId] ?? 0, s.total || 0);
  const sessions = (evidence.trainer || []).length;
  bySource.trainer = Math.min(sessions, 30) * 15 + Object.values(bestByScenario).reduce((s, v) => s + Math.round(v / 2), 0);

  bySource.routes = (evidence.routes || []).reduce((s, r) => s + Math.round((r.total || 0) / 2), 0);
  const diagSections = (evidence.diag || []).reduce((s, d) => s + (d.sections || 0), 0);
  bySource.diagnostics = diagSections * 10;

  const tours = (evidence.studio || []).filter((t) => t.published && t.stops >= 3);
  bySource.studio = Math.min(tours.length, 3) * 40 + (evidence.studio || []).filter((t) => t.reviewed).length * 5;
  const reviews = Math.min(progress.srsStats?.reviews || 0, 600);
  bySource.review = reviews;
  const geo = progress.geo || {};
  bySource.geo = Math.min(geo.plays || 0, 20) * 5 + Math.round(Math.min(geo.best || 0, 8000) / 200);
  const streak = streakOf(progress.activity, today);
  const longest = longestStreak(progress.activity);
  bySource.streak = Math.min(longest, 60) * 5;

  const xp = Object.values(bySource).reduce((s, v) => s + v, 0);
  const stats = {
    topicsStarted: topics.filter((t) => t.pct > 0).length,
    topicsDone: topics.filter((t) => t.pct === 100).length,
    perfectQuizzes: topics.filter((t) => t.quiz === 100).length,
    methodsDone: topics.reduce((s, t) => s + (t.methodsDone || 0), 0),
    sessions,
    bestTrainer: Math.max(0, ...Object.values(bestByScenario)),
    scenariosTried: Object.keys(bestByScenario).length,
    voiceSessions: (evidence.trainer || []).filter((s) => s.voice).length,
    routesGraded: (evidence.routes || []).length,
    bestRoute: Math.max(0, ...(evidence.routes || []).map((r) => r.total || 0)),
    selfStudyGraded: graded.length,
    excellentSelfStudy: graded.filter((x) => x.grade === 5).length,
    diagStages: (evidence.diag || []).filter((d) => d.sections >= 4).length,
    reviews,
    mastered: Object.values(progress.srs || {}).filter((c) => c.box >= 4).length,
    toursPublished: tours.length,
    streak,
    longest,
    activeDays: Object.keys(progress.activity || {}).length,
    geoBest: geo.best || 0,
  };
  const badges = BADGES.map((b) => ({ ...b, earned: b.test(stats), progress: b.progress ? Math.min(1, b.progress(stats)) : null }));
  return { xp, level: levelOf(xp), bySource, topics, stats, badges };
}

export const BADGES = [
  { id: "first-step", icon: "👣", title: "Birinchi qadam", text: "Birinchi mavzuni boshlang", test: (s) => s.topicsStarted >= 1 },
  { id: "five-topics", icon: "🗂️", title: "Yo'l xaritasi", text: "5 ta mavzuni to'liq o'zlashtiring", test: (s) => s.topicsDone >= 5, progress: (s) => s.topicsDone / 5 },
  { id: "all-topics", icon: "🏆", title: "Butun yo'nalish", text: "15 ta mavzuning barchasini o'zlashtiring", test: (s) => s.topicsDone >= 15, progress: (s) => s.topicsDone / 15 },
  { id: "perfect", icon: "💯", title: "Bilimdon", text: "Testda 100% natija oling", test: (s) => s.perfectQuizzes >= 1 },
  { id: "perfect5", icon: "🧠", title: "Mutaxassis", text: "5 ta testda 100% natija", test: (s) => s.perfectQuizzes >= 5, progress: (s) => s.perfectQuizzes / 5 },
  { id: "methods", icon: "🧩", title: "Metodist", text: "15 ta interaktiv metodni bajaring", test: (s) => s.methodsDone >= 15, progress: (s) => s.methodsDone / 15 },
  { id: "trainer", icon: "🎙️", title: "Birinchi ekskursiya", text: "Trenajyorda birinchi mashg'ulot", test: (s) => s.sessions >= 1 },
  { id: "trainer80", icon: "🌟", title: "Mohir gid", text: "Trenajyorda 80+ ball oling", test: (s) => s.bestTrainer >= 80, progress: (s) => s.bestTrainer / 80 },
  { id: "scenarios", icon: "🎭", title: "Har qanday vaziyatda", text: "5 xil ssenariyni sinab ko'ring", test: (s) => s.scenariosTried >= 5, progress: (s) => s.scenariosTried / 5 },
  { id: "voice", icon: "🗣️", title: "Jonli ovoz", text: "Ovozli rejimda mashg'ulot o'tkazing", test: (s) => s.voiceSessions >= 1 },
  { id: "route", icon: "🗺️", title: "Marshrut me'mori", text: "Marshrut loyihasi baholansin", test: (s) => s.routesGraded >= 1 },
  { id: "route86", icon: "🧭", title: "Yo'l ustasi", text: "Marshrut loyihasi 86+ ball", test: (s) => s.bestRoute >= 86, progress: (s) => s.bestRoute / 86 },
  { id: "selfstudy", icon: "📓", title: "Mustaqil izlanuvchi", text: "Mustaqil ishdan “5” baho oling", test: (s) => s.excellentSelfStudy >= 1 },
  { id: "diag", icon: "🧪", title: "O'zini bilgan", text: "Diagnostika bosqichini to'liq topshiring", test: (s) => s.diagStages >= 1 },
  { id: "review", icon: "🔁", title: "Xotira chempioni", text: "100 ta kartani takrorlang", test: (s) => s.reviews >= 100, progress: (s) => s.reviews / 100 },
  { id: "mastered", icon: "💎", title: "Lug'at boyligi", text: "30 ta tushunchani to'liq yodlang", test: (s) => s.mastered >= 30, progress: (s) => s.mastered / 30 },
  { id: "studio", icon: "🎬", title: "Ekskursiya muallifi", text: "3+ bekatli virtual ekskursiya yarating va ulashing", test: (s) => s.toursPublished >= 1 },
  { id: "geo", icon: "🌍", title: "Geograf gid", text: "Geo-sayohatda 6000+ ball to'plang", test: (s) => s.geoBest >= 6000, progress: (s) => s.geoBest / 6000 },
  { id: "streak3", icon: "🔥", title: "Uch kunlik safar", text: "3 kun ketma-ket o'qing", test: (s) => s.longest >= 3, progress: (s) => s.longest / 3 },
  { id: "streak7", icon: "⚡", title: "Haftalik marafon", text: "7 kun ketma-ket o'qing", test: (s) => s.longest >= 7, progress: (s) => s.longest / 7 },
];

/** Sertifikat olish shartlari. */
export function certificateStatus(game) {
  const req = [
    ["15 ta mavzudan kamida 12 tasi to'liq o'zlashtirilgan", game.stats.topicsDone >= 12, `${game.stats.topicsDone}/12`],
    ["Trenajyorda kamida 3 ta ssenariy, eng yaxshi natija 60+", game.stats.scenariosTried >= 3 && game.stats.bestTrainer >= 60, `${game.stats.scenariosTried} ssenariy, ${game.stats.bestTrainer} ball`],
    ["“Ekskursovod” darajasiga erishilgan", game.level.index >= 3, game.level.name],
  ];
  return { eligible: req.every((r) => r[1]), req };
}
