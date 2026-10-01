// Kompleks diagnostika (1-ilova): o'quvchi A, B, C, D bo'limlarini faol bosqich (T0/T1/T2) uchun topshiradi.
import { h, mount, toast, loading, fmtDate, confirmDialog, progressBar } from "../ui.js";
import { api } from "../api.js";
import { renderList as renderSurveyList } from "./surveys.js";

const SECTIONS = [
  ["A", "📋", "Anketa", "Motivatsion-qadriyatli mezon · 15 band"],
  ["B", "⏱", "Diagnostik test", "Kognitiv-kommunikativ mezon · 20 savol · 25 daqiqa"],
  ["C", "🛠", "Amaliy topshiriqlar", "Amaliy-refleksiv mezon · 3 topshiriq · 90 daqiqa"],
  ["D", "🪞", "Refleksiya varaqasi", "Amaliy-refleksiv mezon · 5 savol · 8–10 daqiqa"],
];

export const RESULT_ROWS = [
  ["M", "M — motivatsion", (r) => (r.Mraw != null ? `${r.Mraw} / 75 (o'rtacha ${r.Mavg.toFixed(2)})` : "—"), "A-bo'lim"],
  ["T", "T — bilim testi", (r) => (r.Traw != null ? `${r.Traw} / 20 (${Math.round(r.Tpct)}%)` : "—"), "B-bo'lim"],
  ["KQ", "KQ — bilimni qo'llash va muloqot", (r) => (r.KQavg != null ? r.KQavg.toFixed(2) : "—"), "C-bo'lim, 1-, 3-, 4-indikator"],
  ["KK", "KK — kognitiv-kommunikativ", () => "0,60×T + 0,40×KQ", "Formula"],
  ["P", "P — amaliy topshiriq", (r) => (r.Pavg != null ? r.Pavg.toFixed(2) : "—"), "C-bo'lim, 6 indikator"],
  ["R", "R — refleksiya", (r) => (r.Ravg != null ? r.Ravg.toFixed(2) : "—"), "D-bo'lim, 5 indikator"],
  ["AR", "AR — amaliy-refleksiv", () => "0,70×P + 0,30×R", "Formula"],
  ["B", "B — umumiy tayyorgarlik", () => "(M+KK+AR)/3", "Yakuniy natija"],
];

export function resultSheet(result, meta = {}) {
  return h(
    "div",
    { class: "diag-sheet" },
    h("h3", {}, "Individual diagnostika varaqasi"),
    h(
      "div",
      { class: "table-scroll" },
      h(
        "table",
        { class: "book-table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Respondent kodi"), h("th", {}, "Guruh"), h("th", {}, "Bosqich"), h("th", {}, "Sana"))),
        h("tbody", {}, h("tr", {}, h("td", {}, meta.code || "—"), h("td", {}, meta.group || "—"), h("td", {}, meta.stage || "—"), h("td", {}, meta.date ? new Date(meta.date).toLocaleDateString("uz-UZ") : "—")))
      )
    ),
    h(
      "div",
      { class: "table-scroll" },
      h(
        "table",
        { class: "book-table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Ko'rsatkich"), h("th", {}, "Xom natija"), h("th", {}, "3–5 baho"), h("th", {}, "Hisoblash manbasi"))),
        h(
          "tbody",
          {},
          RESULT_ROWS.map(([key, title, raw, src]) =>
            h(
              "tr",
              { class: key === "B" ? "total-row" : "" },
              h("td", {}, title),
              h("td", {}, raw(result)),
              h("td", {}, key === "B" ? (result.B != null ? `${result.B.toFixed(2)} — ${result.level}` : "—") : result[key] != null ? h("b", { class: `grade-${result[key]}` }, result[key]) : "—"),
              h("td", { class: "muted small" }, src)
            )
          )
        )
      )
    )
  );
}

export async function render(el) {
  mount(el, loading());
  const data = await api.get("diagnostics");
  const { instrument, activeStage, records, code } = data;

  const stageCards = Object.entries(instrument.stages).map(([st, name]) => {
    const rec = records[st];
    const done = SECTIONS.filter(([k]) => rec?.[k]?.submittedAt).length;
    return h(
      "div",
      { class: `card stage-card ${st === activeStage ? "active" : ""}` },
      h("div", { class: "row between" }, h("b", {}, name), st === activeStage ? h("span", { class: "badge badge-ok" }, "Faol") : h("span", { class: "badge" }, "Yopiq")),
      h("div", { class: "small muted" }, `${done} / 4 bo'lim topshirilgan`),
      progressBar(done, 4),
      rec?.graded && h("div", { class: "small" }, "Umumiy natija: ", h("b", {}, `${rec.result.B.toFixed(2)} — ${rec.result.level}`))
    );
  });

  const body = h("div", { class: "stack" });
  mount(
    el,
    h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "Kompleks diagnostika"), h("p", { class: "muted" }, "Raqamli texnologiyalar asosida kasbiy faoliyatga tayyorgarlikni motivatsion-qadriyatli, kognitiv-kommunikativ va amaliy-refleksiv mezonlar bo'yicha aniqlash (1-ilova).")), h("div", { class: "code-badge" }, "Anonim kodingiz: ", h("b", {}, code || "—"))),
    h("div", { class: "grid cols-3" }, stageCards),
    body,
    h("h2", { class: "section-title" }, "📝 Qo'shimcha so'rovnomalar"),
    h("div", { id: "survey-list" })
  );
  renderSurveyList(el.querySelector("#survey-list"), { embedded: true }).catch(() => {});

  if (!activeStage) {
    body.append(h("div", { class: "alert alert-info" }, "Hozir faol diagnostika bosqichi yo'q. O'qituvchi bosqichni ochganda shu yerda topshiriqlar paydo bo'ladi."));
    for (const [st, rec] of Object.entries(records)) if (rec?.graded) body.append(h("div", { class: "card" }, h("h3", {}, instrument.stages[st]), resultSheet(rec.result, { code, group: rec.user?.group, stage: st, date: rec.updatedAt })));
    return;
  }
  const rec = records[activeStage] || {};
  const reload = () => (location.hash === "#/diagnostics" ? render(el) : (location.hash = "#/diagnostics"));
  const open = new URLSearchParams(location.hash.split("?")[1] || "").get("section");
  if (open && SECTIONS.some(([k]) => k === open)) return openSection(el, open, instrument, activeStage, rec, reload);
  body.append(
    h("h2", { class: "section-title" }, instrument.stages[activeStage]),
    h("div", { class: "alert alert-info" }, "Bo'limlarni ketma-ket bajaring. Har bir bo'lim topshirilgandan keyin javoblarni o'zgartirib bo'lmaydi — natijalar T0 va T2 bosqichlarida bir xil vositalar bilan solishtiriladi. Javobni samimiy bering."),
    h(
      "div",
      { class: "grid cols-4" },
      SECTIONS.map(([key, icon, title, sub]) => {
        const submitted = rec[key]?.submittedAt;
        return h(
          "button",
          { class: `card section-card ${submitted ? "done" : ""}`, onclick: () => (location.hash = `#/diagnostics?section=${key}`) },
          h("div", { class: "section-icon" }, icon),
          h("div", { class: "eyebrow" }, `${key}-bo'lim`),
          h("h3", {}, title),
          h("p", { class: "small muted" }, sub),
          submitted ? h("span", { class: "badge badge-ok" }, `✓ ${fmtDate(submitted)}`) : key === "C" && rec.C?.savedAt ? h("span", { class: "badge badge-warn" }, "Qoralama saqlangan") : h("span", { class: "badge" }, "Bajarilmagan")
        );
      })
    ),
    rec.graded
      ? h("div", { class: "card" }, resultSheet(rec.result, { code, group: rec.user?.group, stage: activeStage, date: rec.updatedAt }))
      : SECTIONS.every(([k]) => rec[k]?.submittedAt) && h("div", { class: "alert alert-ok" }, "✅ Barcha bo'limlar topshirildi. O'qituvchi C va D bo'limlarini rubrika asosida baholagach, individual diagnostika varaqangiz shu yerda ko'rinadi.")
  );
}

function openSection(el, key, ins, stage, rec, reload) {
  const back = h("a", { class: "btn ghost small", href: "#/diagnostics" }, "← Diagnostikaga qaytish");
  const views = { A: sectionA, B: sectionB, C: sectionC, D: sectionD };
  const cleanup = views[key](ins, stage, rec, reload);
  mount(el, h("div", { class: "row" }, back), cleanup.node);
  window.scrollTo(0, 0);
}

function submittedNote(rec, key) {
  return rec[key]?.submittedAt && h("div", { class: "alert alert-ok" }, `Bu bo'lim ${fmtDate(rec[key].submittedAt)} da topshirilgan. Javoblarni o'zgartirib bo'lmaydi.`);
}

function sectionA(ins, stage, rec, reload) {
  const A = ins.A;
  const answers = rec.A?.answers ? [...rec.A.answers] : Array(15).fill(null);
  const locked = Boolean(rec.A?.submittedAt);
  const rows = A.items.map((item, i) =>
    h(
      "fieldset",
      { class: "card question", id: `a-${i}` },
      h("legend", {}, h("span", { class: "q-num" }, i + 1), item),
      h(
        "div",
        { class: "likert" },
        ins.likert.map((label, j) =>
          h("label", { class: "likert-opt" }, h("input", { type: "radio", name: `a${i}`, checked: answers[i] === j + 1, disabled: locked, onchange: () => { answers[i] = j + 1; document.getElementById(`a-${i}`).classList.remove("missing"); } }), h("span", { class: "likert-num" }, j + 1), h("span", { class: "likert-label" }, label))
        )
      )
    )
  );
  const submit = h("button", { class: "btn lg", onclick: async () => {
    const missing = answers.findIndex((x) => x == null);
    if (missing >= 0) {
      document.getElementById(`a-${missing}`).classList.add("missing");
      document.getElementById(`a-${missing}`).scrollIntoView({ behavior: "smooth", block: "center" });
      return toast("Barcha fikrlarga javob bering", "warn");
    }
    if (!(await confirmDialog("Anketani topshirasizmi? Topshirilgandan keyin javoblarni o'zgartirib bo'lmaydi."))) return;
    try {
      await api.put(`diagnostics/${stage}/A`, { answers });
      toast("A-bo'lim topshirildi", "ok");
      reload();
    } catch (e) {
      toast(e.message, "error");
    }
  } }, "Anketani topshirish");
  return { node: h("div", { class: "stack" }, h("div", { class: "card survey-head" }, h("h1", {}, A.title), h("p", {}, A.instruction)), submittedNote(rec, "A"), rows, !locked && h("div", { class: "row end" }, submit)) };
}

function sectionB(ins, stage, rec, reload) {
  const B = ins.B;
  const storeKey = `vgt.diagB.${stage}`;
  if (rec.B?.submittedAt) {
    return { node: h("div", { class: "stack" }, h("div", { class: "card survey-head" }, h("h1", {}, B.title)), submittedNote(rec, "B"), h("p", { class: "muted" }, "Test natijasi o'qituvchi barcha bo'limlarni baholagandan keyin individual diagnostika varaqasida ko'rsatiladi.")) };
  }
  const wrap = h("div", { class: "stack" });
  const start = h("button", { class: "btn lg", onclick: async () => {
    if (!rec.B?.startedAt && !(await confirmDialog(`Test boshlangach ${B.minutes} daqiqalik vaqt hisoblanadi va to'xtatib bo'lmaydi. Boshlaysizmi?`))) return;
    try {
      const updated = await api.post(`diagnostics/${stage}/B-start`, {});
      runTest(updated.B.startedAt);
    } catch (e) {
      toast(e.message, "error");
    }
  } }, rec.B?.startedAt ? "Testni davom ettirish" : "Testni boshlash");
  wrap.append(h("div", { class: "card survey-head" }, h("h1", {}, B.title), h("p", {}, B.instruction), h("p", { class: "small muted" }, "Vaqt tugaganda javoblar avtomatik yuboriladi.")), h("div", { class: "row" }, start));

  function runTest(startedAt) {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(storeKey) || "[]");
    } catch {}
    const answers = Array.from({ length: 20 }, (_, i) => (Number.isInteger(saved[i]) ? saved[i] : null));
    const persist = () => {
      try {
        localStorage.setItem(storeKey, JSON.stringify(answers));
      } catch {}
    };
    const deadline = Date.parse(startedAt) + B.minutes * 60 * 1000;
    const timer = h("span", { class: "timer" });
    const counter = h("span", { class: "small muted" });
    const drawCounter = () => (counter.textContent = `${answers.filter((x) => x != null).length} / 20 javob`);
    let sent = false;
    const send = async (auto) => {
      if (sent) return;
      if (!auto && answers.some((x) => x == null) && !(await confirmDialog("Ayrim savollarga javob berilmagan (0 ball). Baribir yuborasizmi?"))) return;
      sent = true;
      clearInterval(tick);
      try {
        await api.put(`diagnostics/${stage}/B`, { answers });
        try {
          localStorage.removeItem(storeKey);
        } catch {}
        toast(auto ? "Vaqt tugadi — javoblar yuborildi" : "Test topshirildi", "ok");
        reload();
      } catch (e) {
        sent = false;
        toast(e.message, "error");
      }
    };
    const tick = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      timer.textContent = `⏱ ${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
      timer.classList.toggle("over", left < 120);
      if (left === 0) send(true);
    }, 500);
    window.addEventListener("hashchange", () => clearInterval(tick), { once: true });
    drawCounter();
    wrap.replaceChildren(
      h("div", { class: "survey-progress row between" }, h("b", {}, B.title), h("div", { class: "row" }, counter, timer)),
      ...B.questions.map((q, i) =>
        h(
          "fieldset",
          { class: "card quiz-q" },
          h("legend", {}, `${i + 1}. ${q.q}`),
          q.options.map((o, j) => h("label", { class: "option" }, h("input", { type: "radio", name: `b${i}`, checked: answers[i] === j, onchange: () => { answers[i] = j; persist(); drawCounter(); } }), h("span", {}, `${"ABCD"[j]}) ${o}`)))
        )
      ),
      h("div", { class: "row end" }, h("button", { class: "btn lg", onclick: () => send(false) }, "Testni yakunlash"))
    );
  }
  if (rec.B?.startedAt) runTest(rec.B.startedAt);
  return { node: wrap };
}

function wordCount(s) {
  return (s.trim().match(/\S+/g) || []).length;
}

function sectionC(ins, stage, rec, reload) {
  const C = ins.C;
  const locked = Boolean(rec.C?.submittedAt);
  const tasks = C.tasks.map((t, i) => ({ ...(rec.C?.tasks?.[i] || {}) }));
  const startedAt = rec.C?.startedAt;
  const save = async (final) => {
    try {
      if (final && !(await confirmDialog("C-bo'limni yakuniy topshirasizmi? Keyin o'zgartirib bo'lmaydi."))) return;
      await api.put(`diagnostics/${stage}/C`, { tasks, final });
      toast(final ? "C-bo'lim topshirildi" : "Qoralama saqlandi", "ok");
      if (final) reload();
    } catch (e) {
      toast(e.message, "error");
    }
  };
  return {
    node: h(
      "div",
      { class: "stack" },
      h("div", { class: "card survey-head" }, h("h1", {}, C.title), h("p", {}, C.instruction), startedAt && !locked && h("p", { class: "small muted" }, `Boshlangan: ${fmtDate(startedAt)}. Tavsiya etilgan vaqt — ${C.minutes} daqiqa.`)),
      submittedNote(rec, "C"),
      C.tasks.map((t, i) =>
        h(
          "div",
          { class: "card" },
          h("h3", {}, t.title),
          h("p", {}, t.text),
          i === 0 && !locked && h("p", { class: "small" }, "💡 Marshrutni ", h("a", { href: "#/route-lab", target: "_blank" }, "Marshrut laboratoriyasi"), " yoki Google Maps'da tuzib, havolasini qo'yishingiz mumkin."),
          t.fields.map((f) => {
            const input =
              f.type === "textarea"
                ? h("textarea", { rows: 6, disabled: locked }, tasks[i][f.key] || "")
                : h("input", { type: "url", placeholder: "https://...", value: tasks[i][f.key] || "", disabled: locked });
            const wc = f.words && h("span", { class: "small muted" });
            const upd = () => {
              tasks[i][f.key] = input.value;
              if (wc) {
                const n = wordCount(input.value);
                wc.textContent = `${n} so'z (talab: ${f.words[0]}–${f.words[1]})`;
                wc.className = `small ${n >= f.words[0] && n <= f.words[1] ? "text-ok" : "muted"}`;
              }
            };
            input.addEventListener("input", upd);
            upd();
            return h("label", { class: "field" }, h("span", {}, f.label, f.optional ? " (ixtiyoriy)" : ""), input, wc);
          })
        )
      ),
      !locked && h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => save(false) }, "💾 Qoralamani saqlash"), h("button", { class: "btn lg", onclick: () => save(true) }, "Yakuniy topshirish"))
    ),
  };
}

function sectionD(ins, stage, rec, reload) {
  const D = ins.D;
  const locked = Boolean(rec.D?.submittedAt);
  const answers = rec.D?.answers ? [...rec.D.answers] : Array(5).fill("");
  return {
    node: h(
      "div",
      { class: "stack" },
      h("div", { class: "card survey-head" }, h("h1", {}, D.title), h("p", {}, D.instruction)),
      !rec.C?.submittedAt && !locked && h("div", { class: "alert alert-warn" }, "Refleksiya varaqasi amaliy topshiriqlar (C-bo'lim) bajarilgandan so'ng to'ldiriladi."),
      submittedNote(rec, "D"),
      D.questions.map((q, i) => h("label", { class: "card field" }, h("span", {}, `${i + 1}. ${q}`), h("textarea", { rows: 4, disabled: locked, oninput: (e) => (answers[i] = e.target.value) }, answers[i]))),
      !locked &&
        h("div", { class: "row end" }, h("button", { class: "btn lg", onclick: async () => {
          if (answers.some((a) => a.trim().length < 3)) return toast("Barcha savollarga javob yozing", "warn");
          if (!(await confirmDialog("Refleksiya varaqasini topshirasizmi?"))) return;
          try {
            await api.put(`diagnostics/${stage}/D`, { answers });
            toast("D-bo'lim topshirildi", "ok");
            reload();
          } catch (e) {
            toast(e.message, "error");
          }
        } }, "Topshirish"))
    ),
  };
}
