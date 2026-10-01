import { h, mount, toast, loading, fmtDate, emptyState, progressBar } from "../ui.js";
import { api } from "../api.js";

const STAGES = [
  ["pre", "🔍 Diagnostik bosqich (tajriba boshida)"],
  ["any", "📋 Umumiy so'rovnomalar"],
  ["post", "🏁 Yakuniy bosqich (tajriba oxirida)"],
];

export const LIKERT_LABELS = ["Mutlaqo qo'shilmayman", "Qo'shilmayman", "Betaraf", "Qo'shilaman", "To'liq qo'shilaman"];

export async function renderList(el, { embedded = false } = {}) {
  mount(el, loading());
  const list = await api.get("surveys");
  const done = list.filter((s) => s.completed).length;
  mount(
    el,
    !embedded && h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "So'rovnomalar"), h("p", { class: "muted" }, "Javoblaringiz ilmiy tadqiqot maqsadida umumlashtirilgan holda tahlil qilinadi. Iltimos, samimiy javob bering."))),
    list.length
      ? [
          h("div", { class: "card" }, h("div", { class: "row between small" }, h("span", {}, "Topshirilgan so'rovnomalar"), h("b", {}, `${done} / ${list.length}`)), progressBar(done, list.length)),
          STAGES.map(([stage, title]) => {
            const items = list.filter((s) => s.stage === stage);
            if (!items.length) return null;
            return h(
              "section",
              {},
              h(embedded ? "h3" : "h2", { class: "section-title" }, title),
              h(
                "div",
                { class: "grid cols-2" },
                items.map((s) =>
                  h(
                    "a",
                    { href: `#/surveys/${s.id}`, class: `card survey-card ${s.completed ? "completed" : ""}` },
                    h("div", { class: "row between" }, h("h3", {}, s.title), s.completed ? h("span", { class: "badge badge-ok" }, "✓ Topshirilgan") : h("span", { class: "badge badge-warn" }, "Kutilmoqda")),
                    h("p", { class: "muted small clamp" }, s.description),
                    h("span", { class: "small muted" }, `${s.questionCount} ta savol`)
                  )
                )
              )
            );
          }),
        ]
      : emptyState("📝", "Faol so'rovnomalar yo'q", "O'qituvchingiz so'rovnoma e'lon qilganda shu yerda paydo bo'ladi.")
  );
}

export async function renderSurvey(el, id) {
  mount(el, loading());
  const { survey, previous } = await api.get(`surveys/${id}`);
  const answers = previous ? structuredClone(previous.answers) : {};
  const required = survey.questions.filter((q) => !q.optional);
  const counter = h("span", { class: "small muted" });
  const bar = h("div");
  const updateProgress = () => {
    const n = required.filter((q) => isAnswered(answers[q.id])).length;
    counter.textContent = `${n} / ${required.length} ta majburiy savolga javob berildi`;
    bar.replaceChildren(progressBar(n, required.length));
  };

  const set = (qid, value) => {
    answers[qid] = value;
    document.getElementById(`q-${qid}`)?.classList.remove("missing");
    updateProgress();
  };

  const questionEls = survey.questions.map((q, i) =>
    h("fieldset", { class: "card question", id: `q-${q.id}` }, h("legend", {}, h("span", { class: "q-num" }, i + 1), q.text, q.optional && h("span", { class: "muted small" }, " (ixtiyoriy)")), questionInput(q, answers[q.id], (v) => set(q.id, v)))
  );

  const submit = h("button", { class: "btn lg", onclick: async () => {
    const missing = required.filter((q) => !isAnswered(answers[q.id]));
    if (missing.length) {
      missing.forEach((q) => document.getElementById(`q-${q.id}`).classList.add("missing"));
      document.getElementById(`q-${missing[0].id}`).scrollIntoView({ behavior: "smooth", block: "center" });
      return toast(`${missing.length} ta savolga javob berilmagan`, "warn");
    }
    submit.disabled = true;
    try {
      const res = await api.post(`surveys/${id}/responses`, { answers });
      mount(
        el,
        h(
          "div",
          { class: "card center success" },
          h("div", { class: "empty-icon" }, "🎉"),
          h("h1", {}, "Rahmat! Javoblaringiz qabul qilindi."),
          res.testScore !== undefined && h("p", { class: "lead" }, "Test natijangiz: ", h("b", {}, `${res.testScore}%`)),
          h("p", { class: "muted" }, "Natijalar o'qituvchi panelida tadqiqot maqsadida umumlashtiriladi."),
          h("div", { class: "row center" }, h("a", { href: "#/diagnostics", class: "btn" }, "Diagnostika va so'rovnomalar"), h("a", { href: "#/", class: "btn ghost" }, "Bosh sahifa"))
        )
      );
    } catch (e) {
      toast(e.message, "error");
      submit.disabled = false;
    }
  } }, previous ? "Javoblarni yangilash" : "Yuborish");

  updateProgress();
  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/diagnostics" }, "Diagnostika"), " / ", survey.title),
    h("div", { class: "card survey-head" }, h("h1", {}, survey.title), h("p", {}, survey.description), previous && h("div", { class: "alert alert-info" }, `Siz bu so'rovnomani ${fmtDate(previous.submittedAt)} da topshirgansiz. Qayta yuborsangiz, javoblaringiz yangilanadi.`)),
    h("div", { class: "survey-progress" }, counter, bar),
    questionEls,
    h("div", { class: "row end" }, submit)
  );
}

const isAnswered = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

function questionInput(q, value, onChange) {
  switch (q.type) {
    case "likert":
      return h(
        "div",
        { class: "likert" },
        LIKERT_LABELS.map((label, i) =>
          h("label", { class: "likert-opt" }, h("input", { type: "radio", name: q.id, checked: value === i + 1, onchange: () => onChange(i + 1) }), h("span", { class: "likert-num" }, i + 1), h("span", { class: "likert-label" }, label))
        )
      );
    case "scale":
      return h(
        "div",
        {},
        h("div", { class: "scale" }, Array.from({ length: 11 }, (_, i) => h("label", { class: "scale-opt" }, h("input", { type: "radio", name: q.id, checked: value === i, onchange: () => onChange(i) }), h("span", {}, i)))),
        h("div", { class: "row between small muted" }, h("span", {}, "0 — umuman yo'q"), h("span", {}, "10 — albatta"))
      );
    case "single":
    case "test":
      return h("div", { class: "options" }, q.options.map((o, i) => h("label", { class: "option" }, h("input", { type: "radio", name: q.id, checked: value === i, onchange: () => onChange(i) }), h("span", {}, o))));
    case "multi": {
      const selected = new Set(Array.isArray(value) ? value : []);
      return h(
        "div",
        { class: "options" },
        h("p", { class: "small muted" }, "Bir nechta variantni tanlash mumkin"),
        q.options.map((o, i) =>
          h("label", { class: "option" }, h("input", { type: "checkbox", checked: selected.has(i), onchange: (e) => {
            e.target.checked ? selected.add(i) : selected.delete(i);
            onChange([...selected]);
          } }), h("span", {}, o))
        )
      );
    }
    case "text":
      return h("textarea", { rows: 4, maxlength: 3000, oninput: (e) => onChange(e.target.value) }, value || "");
    default:
      return h("p", { class: "muted" }, "Noma'lum savol turi");
  }
}
