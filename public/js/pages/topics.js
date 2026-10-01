import { h, mount, toast, progressBar } from "../ui.js";
import { session } from "../api.js";
import { TOPICS, METHOD_INFO, COURSE, BOOK_INTRO, LITERATURE } from "../../data/topics.js";
import { loadProgress, topicState, updateTopic, topicCompletion, setNote } from "../progress.js";
import { renderMethod } from "../methods.js";

export async function renderList(el) {
  await loadProgress();
  const search = h("input", { type: "search", placeholder: "Mavzu yoki tushuncha bo'yicha qidirish...", class: "search" });
  const grid = h("div", { class: "grid cols-2" });
  const draw = () => {
    const q = search.value.trim().toLowerCase();
    const list = TOPICS.filter((t) => !q || [t.title, t.goal, ...t.glossary.map((g) => g.term)].join(" ").toLowerCase().includes(q));
    grid.replaceChildren(
      ...list.map((t) => {
        const pct = topicCompletion(t);
        return h(
          "a",
          { href: `#/topics/${t.id}`, class: "card topic-card" },
          t.image ? h("img", { class: "topic-thumb", src: t.image, alt: "", loading: "lazy" }) : h("div", { class: "topic-thumb placeholder", "aria-hidden": "true" }, t.icon),
          h("div", { class: "topic-num" }, t.icon, h("span", {}, `${t.num}-mavzu`)),
          h("h3", {}, t.title),
          h("p", { class: "muted small clamp" }, t.goal),
          h("div", { class: "chips" }, [...new Set(t.methods.map((m) => m.type))].map((type) => h("span", { class: "chip chip-soft" }, METHOD_INFO[type].icon, " ", METHOD_INFO[type].name))),
          h("div", { class: "row between small muted" }, h("span", {}, `${t.sections.length} bo'lim · ${t.quiz.length} test`), h("span", {}, pct ? `${pct}% bajarildi` : "Boshlanmagan")),
          progressBar(pct)
        );
      })
    );
    if (!list.length) grid.append(h("p", { class: "muted" }, "Hech narsa topilmadi."));
  };
  search.addEventListener("input", draw);
  draw();
  mount(
    el,
    h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "Fan mavzulari"), h("p", { class: "muted" }, `${TOPICS.length} ta mavzu · manba: ${COURSE.source}`)), search),
    BOOK_INTRO && h("details", { class: "card" }, h("summary", {}, h("b", {}, "📘 O'quv qo'llanma haqida (Kirish)")), h("div", { class: "prose", html: BOOK_INTRO })),
    !session.user && h("div", { class: "alert alert-info" }, "Siz mehmon sifatida o'qiyapsiz — progress faqat shu brauzerda saqlanadi. ", h("a", { href: "#/register" }, "Ro'yxatdan o'ting"), " va natijalaringiz profilingizda saqlansin."),
    grid,
    LITERATURE.length > 0 && h("details", { class: "card" }, h("summary", {}, h("b", {}, `📚 Foydalanilgan adabiyotlar (${LITERATURE.length})`)), h("ol", { class: "literature" }, LITERATURE.map((l) => h("li", {}, l.replace(/^\d+\.\s*/, "")))))
  );
}

export async function renderTopic(el, id) {
  await loadProgress();
  const idx = TOPICS.findIndex((t) => t.id === id);
  const topic = TOPICS[idx];
  if (!topic) throw new Error("Mavzu topilmadi");
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];

  const tabs = [
    ["theory", "📖 Nazariya", () => theoryTab(topic)],
    ["glossary", "🃏 Tushunchalar", () => glossaryTab(topic)],
    ["methods", `🧠 Interaktiv metodlar (${topic.methods.length})`, () => methodsTab(topic)],
    ["questions", `❓ Nazorat savollari (${topic.questions.length})`, () => questionsTab(topic)],
    ["quiz", `✅ Test (${topic.quiz.length})`, () => quizTab(topic)],
    ["self", "🧩 Mustaqil ish", () => selfTab(topic)],
  ];
  const bar = h("div", { class: "progress-line" });
  const drawBar = () => {
    const pct = topicCompletion(topic);
    bar.replaceChildren(h("span", { class: "small muted" }, `Mavzu bo'yicha progress: ${pct}%`), progressBar(pct));
  };
  drawBar();
  window.addEventListener("vgt:progress", drawBar);

  const content = h("div", { class: "tab-content" });
  const tabBar = h("div", { class: "tabs", role: "tablist" });
  const select = (key) => {
    tabBar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.key === key));
    const tab = tabs.find((t) => t[0] === key);
    content.replaceChildren(tab[2]());
    history.replaceState(null, "", `#/topics/${topic.id}?tab=${key}`);
  };
  tabs.forEach(([key, label]) => tabBar.append(h("button", { role: "tab", "data-key": key, onclick: () => select(key) }, label)));
  const initial = new URLSearchParams(location.hash.split("?")[1] || "").get("tab") || "theory";

  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/topics" }, "Mavzular"), " / ", `${topic.num}-mavzu`),
    h(
      "header",
      { class: "topic-hero" },
      topic.image ? h("img", { class: "topic-hero-img", src: topic.image, alt: topic.title }) : h("div", { class: "topic-hero-icon" }, topic.icon),
      h("div", {}, h("div", { class: "eyebrow" }, `${topic.num}-mavzu`), h("h1", {}, topic.title), h("p", { class: "lead" }, h("b", {}, "Maqsad: "), topic.goal), bar)
    ),
    tabBar,
    content,
    h(
      "div",
      { class: "row between pager" },
      prev ? h("a", { href: `#/topics/${prev.id}`, class: "btn ghost" }, "← ", prev.title.slice(0, 40), "…") : h("span"),
      next ? h("a", { href: `#/topics/${next.id}`, class: "btn ghost" }, next.title.slice(0, 40), "… →") : h("span")
    )
  );
  select(tabs.some((t) => t[0] === initial) ? initial : "theory");
  return () => window.removeEventListener("vgt:progress", drawBar);
}

const TRAINER_NAMES = {
  "khiva-virtual": "🏰 Ichan qal'a: onlayn virtual ekskursiya",
  "registon-tour": "🕌 Registon ansambli bo'ylab ekskursiya",
  "foreign-arrival": "✈️ Xorijiy turistni kutib olish",
  overbooking: "🏨 Mehmonxonada overbooking",
  "double-payment": "💳 Onlayn to'lovda ikki marta pul yechilishi",
  "negative-review": "⭐ Salbiy onlayn sharhga javob",
};

const changed = () => window.dispatchEvent(new Event("vgt:progress"));

function theoryTab(topic) {
  const st = topicState(topic.id);
  const readBtn = h("button", { class: `btn ${st.read ? "ghost" : ""}`, onclick: () => {
    updateTopic(topic.id, (s) => (s.read = true));
    readBtn.textContent = "✓ O'qib chiqildi";
    readBtn.className = "btn ghost";
    changed();
    toast("Nazariy qism o'qildi deb belgilandi", "ok");
  } }, st.read ? "✓ O'qib chiqildi" : "O'qib chiqdim deb belgilash");
  const notes = h("textarea", { rows: 6, placeholder: "Mavzu bo'yicha qisqacha konspekt, savollaringiz..." });
  loadProgress().then((p) => (notes.value = p.notes[topic.id] || ""));
  notes.addEventListener("input", () => setNote(topic.id, notes.value));

  return h(
    "div",
    { class: "grid cols-3-1" },
    h(
      "article",
      { class: "card prose" },
      topic.sections.map((s) => h("section", {}, s.title && h("h2", {}, s.title), h("div", { class: "book-text", html: s.html }))),
      h("p", { class: "muted small" }, "Manba: ", COURSE.source),
      h("div", { class: "row end" }, readBtn)
    ),
    h(
      "aside",
      { class: "stack" },
      h("div", { class: "card" }, h("h3", {}, "🗒 Reja"), h("ol", { class: "plan-mini" }, topic.plan.map((p) => h("li", {}, p.replace(/^\d+\.\d+\.\s*/, ""))))),
      h("div", { class: "card" }, h("h3", {}, "📝 Konspekt"), notes, h("p", { class: "muted small" }, "Avtomatik saqlanadi.")),
      topic.trainer.length > 0 &&
        h("div", { class: "card accent" }, h("h3", {}, "🎙 Trenajyorda mashq qiling"), h("p", { class: "small" }, "Mavzu bo'yicha bilimlarni real kasbiy vaziyatda sinab ko'ring:"), h("div", { class: "stack" }, topic.trainer.map((id) => h("a", { href: `#/trainer/${id}`, class: "btn small ghost" }, TRAINER_NAMES[id] || id)))),
      topic.resources.length > 0 &&
        h("div", { class: "card" }, h("h3", {}, "🔗 Foydali resurslar"), h("ul", { class: "links" }, topic.resources.map((r) => h("li", {}, h("a", { href: r.url, target: "_blank", rel: "noopener" }, r.title)))))
    )
  );
}

function glossaryTab(topic) {
  const st = topicState(topic.id);
  const seen = new Set();
  const status = h("p", { class: "muted small" });
  const drawStatus = () => (status.textContent = `${seen.size} / ${topic.glossary.length} ta karta ochildi`);
  drawStatus();
  const cards = topic.glossary.map((g, i) =>
    h(
      "button",
      { class: "flashcard", "aria-label": `Karta: ${g.term}`, onclick: (e) => {
        e.currentTarget.classList.toggle("flipped");
        seen.add(i);
        drawStatus();
        if (seen.size === topic.glossary.length && !st.flashcards) {
          updateTopic(topic.id, (s) => (s.flashcards = true));
          changed();
          toast("Barcha tushunchalar ko'rib chiqildi!", "ok");
        }
      } },
      h("div", { class: "flash-inner" }, h("div", { class: "flash-front" }, g.term), h("div", { class: "flash-back" }, g.def))
    )
  );
  return h(
    "div",
    {},
    h("div", { class: "row between" }, h("p", {}, "Kartani bosing — ta'rifi ochiladi. Avval o'zingiz eslashga harakat qiling!"), st.flashcards && h("span", { class: "badge badge-ok" }, "✓ Bajarilgan")),
    status,
    h("div", { class: "flash-grid" }, cards),
    h("div", { class: "card" }, h("h3", {}, "Tayanch tushunchalar lug'ati"), h("dl", { class: "glossary" }, topic.glossary.map((g) => [h("dt", {}, g.term), h("dd", {}, g.def)])))
  );
}

function methodsTab(topic) {
  const st = topicState(topic.id);
  return h(
    "div",
    { class: "stack" },
    topic.methods.map((m) =>
      renderMethod(m, st.methods?.[m.id], (data, done) => {
        updateTopic(topic.id, (s) => {
          s.methods ||= {};
          s.methods[m.id] = { data, done: done || Boolean(s.methods[m.id]?.done), at: new Date().toISOString() };
        });
        changed();
      })
    )
  );
}

function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function quizTab(topic) {
  const st = topicState(topic.id);
  const answers = {};
  const result = h("div");
  const wrap = h("div", { class: "stack" });
  // Variantlar har safar aralashtiriladi: o'quvchi javob joylashuvini emas, mazmunini eslab qolsin.
  const orders = topic.quiz.map((q) => shuffled(q.options.length));
  const qs = topic.quiz.map((q, i) =>
    h(
      "fieldset",
      { class: "quiz-q card" },
      h("legend", {}, `${i + 1}. ${q.q}`),
      orders[i].map((j, pos) => h("label", { class: "option" }, h("input", { type: "radio", name: `q${i}`, onchange: () => (answers[i] = j) }), h("span", {}, `${"ABCDEF"[pos]}) ${q.options[j]}`))),
      h("div", { class: "quiz-explain hidden" })
    )
  );
  const submit = h("button", { class: "btn lg", onclick: () => {
    if (Object.keys(answers).length < topic.quiz.length) return toast("Barcha savollarga javob bering", "warn");
    let correct = 0;
    topic.quiz.forEach((q, i) => {
      const ok = answers[i] === q.correct;
      if (ok) correct++;
      qs[i].classList.add(ok ? "ok" : "bad");
      const ex = qs[i].querySelector(".quiz-explain");
      ex.classList.remove("hidden");
      ex.textContent = ok ? "✓ To'g'ri." : `✗ To'g'ri javob: ${q.options[q.correct]}`;
      qs[i].querySelectorAll("input").forEach((inp) => (inp.disabled = true));
    });
    const score = Math.round((correct / topic.quiz.length) * 100);
    updateTopic(topic.id, (s) => {
      s.quiz = Math.max(s.quiz ?? 0, score);
      s.quizAttempts = (s.quizAttempts || 0) + 1;
    });
    changed();
    submit.disabled = true;
    result.replaceChildren(
      h("div", { class: `alert ${score >= 60 ? "alert-ok" : "alert-warn"}` }, h("b", {}, `Natija: ${correct}/${topic.quiz.length} (${score}%). `), score >= 80 ? "A'lo natija!" : score >= 60 ? "Yaxshi, mavzu o'zlashtirildi." : "Nazariy qismni qayta o'qib, testni qayta topshiring."),
      h("button", { class: "btn ghost", onclick: () => wrap.replaceWith(quizTab(topic)) }, "Qayta topshirish")
    );
  } }, "Javoblarni tekshirish");
  wrap.append(
    ...[
      st.quiz !== null && h("div", { class: "alert alert-info" }, `Eng yaxshi natijangiz: ${st.quiz}% (urinishlar: ${st.quizAttempts || 1}). O'tish balli — 60%.`),
      h("p", { class: "muted small" }, "Test savollari o'quv qo'llanmadan olingan. Variantlar tartibi har safar aralashtiriladi."),
      ...qs,
      submit,
      result,
    ].filter(Boolean)
  );
  return wrap;
}

function questionsTab(topic) {
  const answers = h("div", { class: "stack" });
  loadProgress().then((p) => {
    answers.replaceChildren(
      ...topic.questions.map((q, i) => {
        const key = `${topic.id}:q${i}`;
        const ta = h("textarea", { rows: 3, placeholder: "Javobingizni qisqacha yozing (ixtiyoriy, faqat sizga ko'rinadi)..." }, p.notes[key] || "");
        ta.addEventListener("input", () => setNote(key, ta.value));
        return h("div", { class: "card question" }, h("div", { class: "row" }, h("span", { class: "q-num" }, i + 1), h("b", {}, q)), ta);
      })
    );
  });
  return h(
    "div",
    { class: "stack" },
    h("div", { class: "alert alert-info" }, "Nazorat savollari o'quv qo'llanmadan olingan. Ularga yozma javob tayyorlab, seminar mashg'ulotiga tayyorlaning. Javoblaringiz avtomatik saqlanadi."),
    answers
  );
}

function selfTab(topic) {
  return h(
    "div",
    { class: "stack" },
    h("p", {}, "Mustaqil ish topshiriqlarini bajaring va ", h("a", { href: "#/self-study" }, "Mustaqil ta'lim"), " bo'limi orqali o'qituvchiga yuboring."),
    topic.selfStudy.map((s) =>
      h("div", { class: "card" }, h("div", { class: "row between" }, h("h3", {}, s.title), h("span", { class: "badge" }, s.type)), h("p", {}, s.description), h("a", { href: `#/self-study?task=${s.id}`, class: "btn small" }, "Topshirish →"))
    )
  );
}
