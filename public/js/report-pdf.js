// Mustaqil ish bosqichi (milestone) bo'yicha PDF hisobot: titul varag'i + barcha topshiriqlar, talaba javoblari,
// AI tahlili va o'qituvchi bahosi + yakuniy jadval. Brauzerda pdfmake bilan yaratiladi.
// Shrift: Liberation Serif — Times New Roman bilan harf o'lchamlari bir xil (SIL OFL 1.1).
import { milestoneRange, milestoneTasks } from "./milestones.js";

let loader = null;
function loadPdfMake() {
  loader ||= new Promise((resolve, reject) => {
    if (window.pdfMake) return resolve(window.pdfMake);
    const s = document.createElement("script");
    s.src = "/vendor/pdfmake/pdfmake.min.js";
    s.onload = () => resolve(window.pdfMake);
    s.onerror = () => {
      loader = null;
      reject(new Error("PDF kutubxonasini yuklab bo'lmadi. Internet aloqasini tekshiring."));
    };
    document.head.append(s);
  });
  return loader.then((pm) => {
    const f = (name) => `${location.origin}/vendor/pdfmake/fonts/LiberationSerif-${name}.ttf`;
    pm.fonts = { TimesNewRoman: { normal: f("Regular"), bold: f("Bold"), italics: f("Italic"), bolditalics: f("BoldItalic") } };
    return pm;
  });
}

const GRADE_WORD = { 5: "a’lo", 4: "yaxshi", 3: "qoniqarli", 2: "qoniqarsiz" };
const gradeText = (g) => (g ? `${g} (${GRADE_WORD[g]})` : "—");
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
const up = (s) => String(s || "").toLocaleUpperCase("uz");
// Talaba ismi qaratqich kelishigida: "Aliyev Vali" → "Aliyev Valining"
const genitive = (name) => (name ? `${name.trim()}ning` : "__________________ning");
const paras = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((t) => ({ text: t, margin: [0, 0, 0, 4], alignment: "justify" }));
const bullets = (label, list) => (list?.length ? [{ text: label, bold: true, margin: [0, 4, 0, 2] }, { ul: list.map((x) => ({ text: x, alignment: "justify" })), margin: [10, 0, 0, 2] }] : []);

function titlePage({ settings, user, milestone }) {
  return [
    { text: up(settings.country), bold: true, alignment: "center", fontSize: 14 },
    { text: up(settings.ministry), bold: true, alignment: "center", fontSize: 14, margin: [0, 2, 0, 0] },
    { text: up(settings.university), bold: true, alignment: "center", fontSize: 14, margin: [0, 2, 0, 0] },
    { text: up(settings.faculty), bold: true, alignment: "center", fontSize: 14, margin: [0, 2, 0, 0] },
    { text: "", margin: [0, 120, 0, 0] },
    { text: `${user.group || "______"}-guruh talabasi`, alignment: "center", fontSize: 14 },
    { text: genitive(user.name), alignment: "center", fontSize: 16, bold: true, margin: [0, 6, 0, 0] },
    { text: `“${settings.subject}” fanidan bajargan`, alignment: "center", fontSize: 14, margin: [0, 6, 0, 0] },
    { text: "MUSTAQIL ISHI", alignment: "center", fontSize: 22, bold: true, margin: [0, 18, 0, 6] },
    { text: `${milestone.n}-bosqich (${milestoneRange(milestone)}-mavzular)`, alignment: "center", fontSize: 14, italics: true },
    { text: "", margin: [0, 110, 0, 0] },
    {
      columns: [
        { width: "*", text: "" },
        {
          width: 250,
          stack: [
            { text: [{ text: "Bajardi: ", bold: true }, user.name || "____________________"], margin: [0, 0, 0, 6] },
            { text: [{ text: "Tekshirdi: ", bold: true }, settings.teacher || "____________________"] },
          ],
        },
      ],
      fontSize: 14,
    },
  ];
}

function taskBlock(task, sub, index) {
  const ai = sub?.ai;
  const out = [
    { text: `${index}-topshiriq. ${task.title}`, bold: true, fontSize: 13, margin: [0, 12, 0, 2] },
    { text: [{ text: "Turi: ", italics: true }, task.type || "Mustaqil ish", "   ", { text: "Topshirilgan sana: ", italics: true }, fmtDate(sub?.submittedAt)], fontSize: 11, color: "#333", margin: [0, 0, 0, 4] },
    { text: "Topshiriq sharti:", bold: true },
    { text: task.description || "", italics: true, alignment: "justify", margin: [0, 0, 0, 6] },
    { text: "Talabaning javobi:", bold: true },
    ...paras(sub?.text),
  ];
  if (sub?.link) out.push({ text: [{ text: "Biriktirilgan havola: ", italics: true }, { text: sub.link, color: "#1a4fa0", link: sub.link }], margin: [0, 2, 0, 4] });
  const review = [
    { text: "Sun’iy intellekt tahlili", bold: true, fontSize: 12.5, margin: [0, 0, 0, 3] },
    ai
      ? { text: [{ text: "Baho: ", bold: true }, gradeText(ai.grade), ai.estimated ? " — taxminiy (AI xizmati ulanmagan)" : ""], margin: [0, 0, 0, 3] }
      : { text: "AI tahlili mavjud emas.", italics: true },
    ...(ai?.summary ? [{ text: ai.summary, alignment: "justify", margin: [0, 0, 0, 2] }] : []),
    ...bullets("Kuchli tomonlari:", ai?.strengths),
    ...bullets("Kamchiliklar:", ai?.improvements),
    ...bullets("Tavsiyalar:", ai?.recommendations),
  ];
  if (sub?.grade != null && !sub.resubmitted) {
    review.push({ text: [{ text: "O‘qituvchi bahosi: ", bold: true }, gradeText(sub.grade)], margin: [0, 6, 0, 0] });
    if (sub.feedback) review.push({ text: [{ text: "O‘qituvchi izohi: ", bold: true }, sub.feedback], alignment: "justify" });
  }
  out.push({
    table: { widths: ["*"], body: [[{ stack: review, fontSize: 11.5, margin: [6, 5, 6, 6] }]] },
    layout: { hLineColor: () => "#9aa5a8", vLineColor: () => "#9aa5a8", fillColor: () => "#f3f6f6" },
    margin: [0, 6, 0, 4],
  });
  return out;
}

function summaryTable(rows) {
  const ai = rows.map((r) => r.sub?.ai?.grade).filter(Boolean);
  const tg = rows.map((r) => (r.sub?.resubmitted ? null : r.sub?.grade)).filter((g) => g != null);
  const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2).replace(".", ",") : "—");
  return [
    { text: "YAKUNIY NATIJALAR", bold: true, fontSize: 14, alignment: "center", margin: [0, 0, 0, 10], pageBreak: "before" },
    {
      table: {
        headerRows: 1,
        widths: [22, "*", 60, 70],
        body: [
          ["№", "Mavzu va topshiriq", "AI bahosi", "O‘qituvchi bahosi"].map((t) => ({ text: t, bold: true, alignment: "center", fillColor: "#e7eeee" })),
          ...rows.map((r, i) => [
            { text: String(i + 1), alignment: "center" },
            { text: [{ text: `${r.task.topic.num}-mavzu. `, bold: true }, r.task.title] },
            { text: r.sub?.ai?.grade ? String(r.sub.ai.grade) : "—", alignment: "center" },
            { text: r.sub?.grade != null && !r.sub.resubmitted ? String(r.sub.grade) : "—", alignment: "center" },
          ]),
          [{ text: "", border: [true, true, false, true] }, { text: "O‘rtacha", bold: true }, { text: avg(ai), bold: true, alignment: "center" }, { text: avg(tg), bold: true, alignment: "center" }],
        ],
      },
      fontSize: 11.5,
    },
    { text: `Bajarilgan topshiriqlar: ${rows.length} / ${rows.length}`, margin: [0, 10, 0, 0] },
    { text: `Hisobot yaratilgan sana: ${fmtDate(new Date().toISOString())}`, margin: [0, 2, 0, 0] },
  ];
}

/** Bosqich PDF'ini yaratib, yuklab beradi. subs: { taskId: submission }. */
export async function downloadMilestonePdf({ milestone, user, subs, settings }) {
  const pm = await loadPdfMake();
  const tasks = milestoneTasks(milestone);
  const rows = tasks.map((task) => ({ task, sub: subs[task.id] }));
  const content = [...titlePage({ settings, user, milestone })];
  content.push({ text: "MUNDARIJA", bold: true, fontSize: 14, alignment: "center", margin: [0, 0, 0, 10], pageBreak: "before" });
  content.push({ ol: milestone.topics.map((t) => ({ text: `${t.num}-mavzu. ${t.title}`, margin: [0, 0, 0, 3] })), margin: [10, 0, 0, 0] });
  for (const topic of milestone.topics) {
    content.push({ text: `${topic.num}-MAVZU. ${up(topic.title)}`, bold: true, fontSize: 14, alignment: "center", margin: [0, 0, 0, 4], pageBreak: "before" });
    rows.filter((r) => r.task.topic.id === topic.id).forEach((r, i) => content.push(...taskBlock(r.task, r.sub, i + 1)));
  }
  content.push(...summaryTable(rows));
  const doc = {
    pageSize: "A4",
    pageMargins: [85, 57, 42, 57], // chap 30 mm, yuqori/past 20 mm, o'ng 15 mm
    info: { title: `Mustaqil ish — ${milestone.n}-bosqich — ${user.name || ""}`, author: user.name || "", subject: settings.subject },
    defaultStyle: { font: "TimesNewRoman", fontSize: 12, lineHeight: 1.2 },
    // Titul varag'ining pastida shahar va yil, qolgan betlarda bet raqami
    footer: (page) =>
      page === 1
        ? { text: `${settings.city || ""} — ${new Date().getFullYear()}`, alignment: "center", fontSize: 14, bold: true, margin: [0, 14, 0, 0] }
        : { text: `${page}`, alignment: "center", fontSize: 11, margin: [0, 20, 0, 0] },
    content,
  };
  const safe = (user.name || "talaba").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  await new Promise((resolve, reject) => {
    try {
      pm.createPdf(doc).download(`Mustaqil-ish_${milestone.n}-bosqich_${safe}.pdf`, resolve);
    } catch (e) {
      reject(e);
    }
  });
}
