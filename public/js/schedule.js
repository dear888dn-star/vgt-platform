// Dars jadvali va mustaqil ish muddatlari (brauzer va server uchun umumiy).
// Har bir mavzuning mustaqil ishlari dars kunidan WINDOW kun oldin ochiladi va oxirgi dars kunidan WINDOW kun keyin yopiladi.
// Muddat tugagach topshirish faqat o'qituvchi ruxsati (muddat uzaytirish) bilan mumkin.
import { TOPICS } from "../data/topics.js";

// 2026–2027 o'quv yili, 7-semestr, "Turistik korxonalar faoliyati tahlili" (141-23 va 142-23 guruhlari, 22 ta dars)
export const DEFAULT_DATES = [
  "2026-09-16", "2026-09-23", "2026-10-05", "2026-10-07", "2026-10-09", "2026-10-12", "2026-10-14", "2026-10-19",
  "2026-10-21", "2026-10-28", "2026-11-02", "2026-11-04", "2026-11-11", "2026-11-16", "2026-11-18", "2026-11-25",
  "2026-11-30", "2026-12-02", "2026-12-09", "2026-12-14", "2026-12-16", "2026-12-23",
];
export const DEFAULT_WINDOW = 7;
const TZ_HOURS = 5; // Toshkent vaqti (UTC+5)
const DAY = 864e5;

/** Darslarni mavzularga teng taqsimlaydi: 22 dars / 15 mavzu → ba'zi mavzularga 2 tadan dars. */
export function defaultSchedule(dates = DEFAULT_DATES) {
  return {
    enabled: true,
    windowDays: DEFAULT_WINDOW,
    lessons: dates.map((date, i) => ({ date, topicId: TOPICS[Math.floor((i * TOPICS.length) / dates.length)].id })),
  };
}

/** "YYYY-MM-DD" kunining Toshkent vaqti bilan boshlanishi (ms). */
const dayStart = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - TZ_HOURS * 36e5;
};

/** { topicId: { dates: [...], open, close } } — open/close millisekundlarda. Jadvalda yo'q mavzu cheklanmaydi. */
export function topicWindows(schedule) {
  const out = {};
  if (!schedule?.enabled) return out;
  const w = Number(schedule.windowDays ?? DEFAULT_WINDOW);
  for (const l of schedule.lessons || []) {
    if (!l.topicId || !/^\d{4}-\d{2}-\d{2}$/.test(l.date || "")) continue;
    (out[l.topicId] ||= { dates: [] }).dates.push(l.date);
  }
  for (const win of Object.values(out)) {
    win.dates.sort();
    win.open = dayStart(win.dates[0]) - w * DAY;
    win.close = dayStart(win.dates[win.dates.length - 1]) + (w + 1) * DAY - 1;
  }
  return out;
}

/**
 * Mavzu bo'yicha topshirish holati.
 * state: "free" (cheklanmagan) | "open" | "upcoming" | "closed" | "extended" (o'qituvchi ruxsati)
 */
export function topicAccess(windows, topicId, extUntil, now = Date.now()) {
  const win = windows[topicId];
  if (!win) return { state: "free", allowed: true };
  const ext = extUntil ? Date.parse(extUntil) : 0;
  if (now >= win.open && now <= win.close) return { state: "open", allowed: true, ...win, daysLeft: Math.ceil((win.close - now) / DAY) };
  if (ext > now) return { state: "extended", allowed: true, ...win, until: ext };
  if (now < win.open) return { state: "upcoming", allowed: false, ...win, daysLeft: Math.ceil((win.open - now) / DAY) };
  return { state: "closed", allowed: false, ...win };
}

/** Toshkent vaqti bo'yicha "dd.mm.yyyy". */
export function fmtDay(ms) {
  const d = new Date(ms + TZ_HOURS * 36e5);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}
