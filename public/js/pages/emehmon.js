// E-Mehmon o'quv simulyatori: alohida loyiha (eguestsimulyator), platformadan parolsiz (SSO) ochiladi.
import { h, mount, toast, loading, fmtDate } from "../ui.js";
import { api, session } from "../api.js";

const MODULES = [
  ["🧾", "Varaqalar", "Kelish va chiqish varaqalari, mustaqil sayyohlar, korrektirovka, erkin viza."],
  ["🛂", "Ro'yxatga olish", "Xorijiy fuqaro va O'zbekiston fuqarosini ro'yxatga olish, MRZ skanerlash, uzaytirish, xona almashtirish."],
  ["📅", "Shaxmatka", "Bron qilish jadvali: bo'sh xonalar, bronlar va ularni varaqaga aylantirish."],
  ["💰", "Turistik yig'im va depozit", "Stavkalar shkalasi, yig'imni hisoblash va byudjetga to'lash, abonent to'lovi."],
  ["📊", "Hisobotlar va dashboard", "19 ta E-Mehmon hisoboti, solishtirma dalolatnoma, KPI kartalari va grafiklar."],
  ["🏠", "Jismoniy shaxslar", "reg.emehmon.uz: OneID, kadastr, 4 bosqichli ariza, muddatlar va to'lov."],
];

/** Simulyatorni yangi oynada ochadi (oyna avval ochiladi — brauzer bloklamasin). */
export async function openSimulator(btn) {
  const win = window.open("", "_blank");
  if (btn) btn.disabled = true;
  try {
    const { url } = await api.post("emehmon/launch", {});
    if (win) win.location.href = url;
    else location.href = url;
  } catch (e) {
    win?.close();
    toast(e.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function resultsCard(mine, error) {
  if (error) return h("div", { class: "card" }, h("h3", {}, "📈 Mening natijalarim"), h("p", { class: "alert alert-warn small" }, `Natijalarni olib bo'lmadi: ${error}`));
  if (!mine) return h("div", { class: "card" }, h("h3", {}, "📈 Mening natijalarim"), h("p", { class: "muted" }, "Hali simulyatorga kirmagansiz. Birinchi kirishda sizga shaxsiy o'quv mehmonxonasi ochiladi — keyin “O'quv topshiriqlari” bo'limidagi 13 ta topshiriqni bajaring."));
  return h("div", { class: "card" },
    h("h3", {}, "📈 Mening natijalarim"),
    h("div", { class: "row wrap em-kpis" },
      h("div", {}, h("b", {}, `${mine.score} / ${mine.max}`), h("span", { class: "muted small" }, "ball")),
      h("div", {}, h("b", {}, `${mine.tasksDone} / ${mine.taskCount}`), h("span", { class: "muted small" }, "topshiriq bajarildi")),
      h("div", {}, h("b", {}, mine.guests), h("span", { class: "muted small" }, "mehmon ro'yxatga olingan"))),
    h("div", { class: "progress" }, h("div", { class: "progress-fill", style: { width: `${pct(mine.score, mine.max)}%` } })),
    h("p", { class: "small muted" }, `O'quv mehmonxonangiz: ${mine.hotelName || "—"}${mine.lastLogin ? ` · oxirgi kirish: ${fmtDate(mine.lastLogin)}` : ""}`),
    mine.tasks.length > 0 && h("div", { class: "table-wrap" }, h("table", { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Topshiriq"), h("th", {}, "Ball"), h("th", {}, "Sana"))),
      h("tbody", {}, mine.tasks.map((t) => h("tr", {}, h("td", {}, t.title), h("td", {}, h("b", { class: t.score >= t.max * 0.8 ? "score-high" : t.score >= t.max * 0.6 ? "score-mid" : "score-low" }, `${t.score}/${t.max}`)), h("td", { class: "small muted" }, fmtDate(t.at))))))));
}

export async function render(el) {
  mount(el, loading());
  const info = await api.get("emehmon").catch((e) => ({ enabled: false, error: e.message }));
  const teacher = session.user?.role === "teacher";
  const openBtn = h("button", { class: "btn lg", disabled: !info.enabled, onclick: () => openSimulator(openBtn) }, teacher ? "🏨 Simulyatorni o'qituvchi sifatida ochish" : "🏨 Simulyatorni ochish");
  mount(
    el,
    h("section", { class: "trainer-hero" },
      h("div", {},
        h("div", { class: "eyebrow" }, "Raqamli xizmatlar · o'quv simulyatori"),
        h("h1", {}, "E-Mehmon simulyatori"),
        h("p", { class: "lead" }, "emehmon.uz tizimida mehmonlarni ro'yxatga olish, turistik yig'imni hisoblash va hisobotlar bilan ishlashni xavfsiz o'quv muhitida mashq qiling. Haqiqiy tizim bilan bog'lanmaydi: barcha shaxslar va hujjatlar o'ylab topilgan."),
        h("div", { class: "row wrap" }, openBtn, teacher && h("a", { href: "#/teacher/emehmon", class: "btn ghost lg" }, "📊 Talabalar natijalari"))),
      h("div", { class: "trainer-steps" }, [
        "1. “Simulyatorni ochish” — platforma akkauntingiz bilan parolsiz kirasiz",
        "2. Birinchi kirishda sizga o'quv mehmonxonasi ochiladi",
        "3. Mehmonlarni ro'yxatga oling, yig'imni hisoblang, hisobot tuzing",
        "4. 13 ta o'quv topshirig'i avtomatik baholanadi (135 ball)",
      ].map((s) => h("div", { class: "trainer-step" }, s)))),
    !info.enabled && h("div", { class: "alert alert-warn" }, "⚠️ Simulyator hali ulanmagan. Administrator platforma sozlamalarida EMEHMON_URL va EMEHMON_SSO_SECRET ni, simulyatorda esa xuddi shu kalitni SSO_SECRET sifatida o'rnatishi kerak."),
    !teacher && info.enabled && resultsCard(info.mine, info.error),
    h("h2", { class: "section-title" }, "Simulyator bo'limlari"),
    h("div", { class: "grid cols-3" }, MODULES.map(([icon, title, text]) => h("div", { class: "card feature" }, h("div", { class: "feature-icon" }, icon), h("h3", {}, title), h("p", { class: "muted small" }, text)))),
    h("div", { class: "alert alert-info small" }, "Simulyatorga haqiqiy shaxsiy ma'lumotlarni (o'zingiz yoki tanishlaringizning pasporti) kiritmang — faqat topshiriqlardagi o'quv hujjatlaridan foydalaning.")
  );
}
