// Mustaqil ish bosqichlari (milestone): mavzular soni ikkiga bo'linadi — 1-bosqich birinchi yarmi, 2-bosqich qolgani.
// Bosqichdagi barcha mustaqil ishlar topshirilgandagina bosqich yakunlanadi va PDF hisobot ochiladi.
import { TOPICS } from "../data/topics.js";

const half = Math.ceil(TOPICS.length / 2);
export const MILESTONES = [
  { n: 1, topics: TOPICS.slice(0, half) },
  { n: 2, topics: TOPICS.slice(half) },
].filter((m) => m.topics.length);

export const milestoneRange = (m) => `${m.topics[0].num}–${m.topics[m.topics.length - 1].num}`;
export const milestoneTasks = (m) => m.topics.flatMap((t) => (t.selfStudy || []).map((s) => ({ ...s, topic: t })));
export const milestoneEndingAt = (topicId) => MILESTONES.find((m) => m.topics[m.topics.length - 1].id === topicId) || null;

/** subs: { taskId: submission }. Topshirilgan = matn yoki havola bor. */
export function milestoneStatus(m, subs) {
  const tasks = milestoneTasks(m);
  const isDone = (t) => Boolean(subs[t.id] && (subs[t.id].text || subs[t.id].link));
  const done = tasks.filter(isDone).length;
  return { tasks, done, total: tasks.length, complete: tasks.length > 0 && done === tasks.length, missing: tasks.filter((t) => !isDone(t)) };
}
