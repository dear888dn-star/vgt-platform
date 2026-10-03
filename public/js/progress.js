// O'quvchi progressi: mavzular, metodlar natijalari, o'quv rejasi va eslatmalar.
// Tizimga kirgan foydalanuvchida server bilan sinxronlanadi, aks holda brauzerda saqlanadi.
import { api, session } from "./api.js";
import { computeGame, levelOf, streakOf } from "./gamification.js";

const LOCAL_KEY = "vgt.progress.guest";
let state = null;
let loadedFor = null;
let saveTimer = null;

const empty = () => ({ topics: {}, plan: [], notes: {}, activity: {}, srs: {}, srsStats: { reviews: 0 } });
const today = () => new Date().toISOString().slice(0, 10);

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || empty();
  } catch {
    return empty();
  }
}

export async function loadProgress() {
  const uid = session.user?.id || "guest";
  if (state && loadedFor === uid) return state;
  if (session.user) {
    try {
      state = { ...empty(), ...(await api.get("progress")) };
    } catch {
      state = empty();
    }
  } else {
    state = readLocal();
  }
  loadedFor = uid;
  return state;
}

window.addEventListener("vgt:auth", () => {
  state = null;
  loadedFor = null;
  evidenceCache = null;
});

// ---------- XP va darajalar ----------
// Serverdagi dalillar (trenajyor, marshrut, mustaqil ish, diagnostika) keshlanadi; mahalliy o'zgarishlar
// (mavzu, takrorlash, seriya) darhol hisoblanadi va "+XP" animatsiyasi chiqadi.
let evidenceCache = null;

export async function loadGame({ fresh = false } = {}) {
  await loadProgress();
  if (session.user && (fresh || !evidenceCache)) {
    try {
      evidenceCache = await api.get("evidence");
    } catch {
      evidenceCache = null;
    }
  }
  return computeGame({ ...(evidenceCache || {}), progress: state });
}

const localXp = () => {
  const g = computeGame({ progress: state });
  return g.bySource.topics + g.bySource.review + g.bySource.streak + g.bySource.geo;
};
const otherXp = () => (evidenceCache ? computeGame({ ...evidenceCache, progress: {} }).xp - computeGame({ progress: {} }).xp : 0);

function trackXp(fn) {
  const before = localXp();
  const firstToday = !state.activity?.[today()];
  fn();
  state.activity ||= {};
  state.activity[today()] = (state.activity[today()] || 0) + 1;
  const after = localXp();
  const gain = after - before;
  if (gain > 0) {
    const other = otherXp();
    const lvBefore = levelOf(other + before);
    const lvAfter = levelOf(other + after);
    window.dispatchEvent(new CustomEvent("vgt:xp", { detail: { gain, total: other + after, levelUp: lvAfter.index > lvBefore.index ? lvAfter : null } }));
  }
  if (firstToday) {
    const streak = streakOf(state.activity);
    if (streak >= 2) window.dispatchEvent(new CustomEvent("vgt:streak", { detail: { streak } }));
  }
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (session.user) {
      try {
        if (!navigator.onLine) return;
        await api.put("progress", state);
      } catch (e) {
        console.warn("Progress saqlanmadi:", e);
      }
    } else {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
      } catch {}
    }
  }, 600);
}

export function topicState(topicId) {
  state.topics[topicId] ||= { read: false, quiz: null, methods: {}, flashcards: false };
  return state.topics[topicId];
}

export function updateTopic(topicId, fn) {
  trackXp(() => fn(topicState(topicId)));
  persist();
}

/** Kunlik takrorlash kartalari (Leitner tizimi). */
export function updateSrs(fn) {
  state.srs ||= {};
  state.srsStats ||= { reviews: 0 };
  trackXp(() => fn(state.srs, state.srsStats));
  persist();
}

export const progressState = () => state;

/** Geo-sayohat o'yini natijasi: eng yaxshi ball, o'yinlar soni, oxirgi natijalar. */
export function recordGeo(score) {
  trackXp(() => {
    const g = (state.geo ||= { best: 0, plays: 0, history: [] });
    g.best = Math.max(g.best || 0, score);
    g.plays = (g.plays || 0) + 1;
    g.history = [{ score, at: new Date().toISOString().slice(0, 10) }, ...(g.history || [])].slice(0, 10);
  });
  persist();
}

// Internet qaytganda oflayn paytdagi o'zgarishlarni serverga yuboramiz.
window.addEventListener("online", () => state && session.user && persist());

export function updatePlan(fn) {
  fn(state.plan);
  persist();
}

export function setNote(key, text) {
  state.notes[key] = text;
  persist();
}

export function topicCompletion(topic) {
  return completionFrom(state, topic);
}

/** Berilgan progress obyektidan mavzu bajarilish foizi (o'qituvchi paneli uchun ham). */
export function completionFrom(progress, topic) {
  const t = progress?.topics?.[topic.id];
  if (!t) return 0;
  const parts = [t.read, t.quiz !== null && t.quiz >= 60, t.flashcards, ...topic.methods.map((m) => Boolean(t.methods?.[m.id]?.done))];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}
