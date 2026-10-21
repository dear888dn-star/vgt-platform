// Talaba uchun mustaqil ish muddatlari: holatni hisoblash va eslatma kartasi (profil, bosh sahifa, Mustaqil ta'lim).
import { h } from "./ui.js";
import { api } from "./api.js";
import { TOPICS } from "../data/topics.js";
import { topicWindows, topicAccess, fmtDay } from "./schedule.js";

export async function loadDeadlines() {
  const d = await api.get("deadlines");
  // Server vaqti bilan farq (talaba qurilmasidagi soat noto'g'ri bo'lsa ham holat to'g'ri chiqadi)
  const skew = d.now ? Date.parse(d.now) - Date.now() : 0;
  const windows = topicWindows(d.schedule);
  return { ...d, windows, access: (topicId) => topicAccess(windows, topicId, d.ext?.[topicId], Date.now() + skew) };
}

/** Mavzu yonidagi holat belgisi. */
export function accessChip(a) {
  if (!a || a.state === "free") return null;
  if (a.state === "open") return h("span", { class: `chip dl-chip ${a.daysLeft <= 3 ? "warn" : "ok"}` }, `🟢 Ochiq · ${fmtDay(a.close)} gacha${a.daysLeft <= 3 ? ` (${a.daysLeft} kun)` : ""}`);
  if (a.state === "extended") return h("span", { class: "chip dl-chip ok" }, `🔓 O'qituvchi ruxsati · ${fmtDay(a.until)} gacha`);
  if (a.state === "upcoming") return h("span", { class: "chip dl-chip" }, `⏳ ${fmtDay(a.open)} da ochiladi`);
  return h("span", { class: "chip dl-chip err" }, `🔒 Muddat tugagan (${fmtDay(a.close)})`);
}

export const lockedText = (a) =>
  a.state === "upcoming"
    ? `Bu mavzuning mustaqil ishlari ${fmtDay(a.open)} da ochiladi (dars kunidan 1 hafta oldin).`
    : `Topshirish muddati ${fmtDay(a.close)} da tugagan. Endi faqat o'qituvchi ruxsat bersagina topshirish mumkin.`;

/** Eslatma kartasi. data berilmasa o'zi yuklaydi. */
export function deadlineNotice(data) {
  const box = h("div", { class: "card dl-notice" });
  const fill = ({ dl, subs }) => {
    const w = dl.schedule?.windowDays ?? 7;
    const rows = TOPICS.map((t) => ({ t, a: dl.access(t.id), left: t.selfStudy.filter((s) => !subs[s.id]).length })).filter((r) => r.a.state !== "free");
    if (!rows.length) return box.remove();
    const open = rows.filter((r) => r.a.state === "open" || r.a.state === "extended");
    const next = rows.filter((r) => r.a.state === "upcoming").sort((x, y) => x.a.open - y.a.open)[0];
    const missed = rows.filter((r) => r.a.state === "closed" && r.left > 0);
    const item = (r, extra) => h("li", {}, h("a", { href: `#/self-study?topic=${r.t.id}` }, `${r.t.num}-mavzu: ${r.t.title}`), " — ", extra);
    box.replaceChildren(...[
      h("div", { class: "eyebrow" }, "Eslatma · yangi tartib"),
      h("h3", {}, "📅 Mustaqil ishlarni topshirish muddatlari"),
      h("p", { class: "small" }, `Har bir mavzuning mustaqil ishlari dars jadvaliga bog'langan: dars kunidan ${w} kun oldin ochiladi va ${w} kun keyin yopiladi. Muddat o'tgach topshirish faqat o'qituvchi ruxsat bergandagina ochiladi.`),
      open.length
        ? h("div", {}, h("b", {}, "Hozir ochiq:"), h("ul", { class: "dl-list" }, open.map((r) => item(r, h("span", {}, r.a.state === "extended" ? `o'qituvchi ruxsati, ${fmtDay(r.a.until)} gacha` : `${fmtDay(r.a.close)} gacha (${r.a.daysLeft} kun qoldi)`, r.left ? h("b", { class: "dl-left" }, ` · ${r.left} ta topshirilmagan`) : " · ✅ topshirilgan")))))
        : h("p", { class: "small muted" }, "Hozircha ochiq mavzu yo'q."),
      next && h("p", { class: "small" }, h("b", {}, "Keyingisi: "), `${next.t.num}-mavzu — ${fmtDay(next.a.open)} da ochiladi (dars: ${next.a.dates.map((d) => d.split("-").reverse().join(".")).join(", ")}).`),
      missed.length > 0 && h("div", { class: "dl-missed" }, h("b", {}, "⚠️ Muddati o'tgan, topshirilmagan:"), h("ul", { class: "dl-list" }, missed.map((r) => item(r, `${r.left} ta ish · o'qituvchidan ruxsat so'rang`)))),
      h("a", { href: "#/self-study", class: "btn small" }, "Mustaqil ishlarga o'tish →"),
    ].filter(Boolean));
  };
  if (data) fill(data);
  else
    Promise.all([loadDeadlines(), api.get("self-study")])
      .then(([dl, list]) => fill({ dl, subs: Object.fromEntries(list.map((s) => [s.taskId, s])) }))
      .catch(() => box.remove());
  return box;
}
