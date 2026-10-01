// O'quvchi progressi: mavzular, metodlar natijalari, o'quv rejasi va eslatmalar.
// Tizimga kirgan foydalanuvchida server bilan sinxronlanadi, aks holda brauzerda saqlanadi.
import { api, session } from "./api.js";

const LOCAL_KEY = "vgt.progress.guest";
let state = null;
let loadedFor = null;
let saveTimer = null;

const empty = () => ({ topics: {}, plan: [], notes: {} });

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
});

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (session.user) {
      try {
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
  fn(topicState(topicId));
  persist();
}

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
