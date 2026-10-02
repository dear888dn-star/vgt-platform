import { h, mount, toast, progressBar } from "../ui.js";
import { api, session } from "../api.js";
import { slideViewer } from "../slides.js";
import { tutorDrawer } from "../tutor.js";
import { lessonPlayer } from "../lesson-player.js";
import { allVideos, videoCard } from "../media.js";
import { TOPICS, METHOD_INFO, COURSE, BOOK_INTRO, LITERATURE } from "../../data/topics.js";
import { loadProgress, topicState, updateTopic, topicCompletion, setNote } from "../progress.js";
import { renderMethod } from "../methods.js";
import { TOPIC_MAP } from "../../data/standard.js";
import { competencyChips } from "../competency.js";
import { confetti, shake } from "../motion.js";

export async function renderList(el) {
  const [, slideList] = await Promise.all([loadProgress(), api.get("slides").catch(() => ({ slides: [] }))]);
  const withSlides = new Set(slideList.slides.map((x) => x.topicId));
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
          { href: `#/topics/${t.id}`, class: "card topic-card tilt" },
          h("div", { class: "topic-thumb-wrap" }, t.image ? h("img", { class: "topic-thumb", src: t.image, alt: "", loading: "lazy" }) : h("div", { class: "topic-thumb placeholder", "aria-hidden": "true" }, t.icon), h("span", { class: "num-badge" }, `${t.num}-mavzu`), withSlides.has(t.id) && h("span", { class: "slides-badge" }, "🖥️ Taqdimot")),
          h("div", { class: "topic-num" }, t.icon, h("span", {}, `${t.num}-mavzu`)),
          h("h3", {}, t.title),
          h("p", { class: "muted small clamp" }, t.goal),
          h("div", { class: "chips" }, [...new Set(t.methods.map((m) => m.type))].map((type) => h("span", { class: "chip chip-soft" }, METHOD_INFO[type].icon, " ", METHOD_INFO[type].name))),
          h("div", { class: "row between small muted" }, h("span", {}, `📖 ${t.sections.length} bo'lim · 🃏 ${t.glossary.length} · ❓ ${t.questions.length} · ✅ ${t.quiz.length} test`), h("span", {}, pct ? `${pct}% bajarildi` : "Boshlanmagan")),
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

const CHAPTERS = [
  ["video", "🎬", "Animatsion dars"],
  ["videos", "📹", "Video darslar"],
  ["slides", "🖥️", "Taqdimot"],
  ["theory", "📖", "Nazariya"],
  ["glossary", "🃏", "Tushunchalar"],
  ["methods", "🧠", "Interaktiv metodlar"],
  ["questions", "❓", "Nazorat savollari"],
  ["quiz", "✅", "Test"],
  ["self", "🧩", "Mustaqil ish"],
];

const stripTags = (html) => html.replace(/<[^>]+>/g, " ");

export async function renderTopic(el, id) {
  await loadProgress();
  const idx = TOPICS.findIndex((t) => t.id === id);
  const topic = TOPICS[idx];
  if (!topic) throw new Error("Mavzu topilmadi");
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  const words = topic.sections.reduce((n, s) => n + stripTags(s.html).split(/\s+/).filter(Boolean).length, 0);
  const minutes = Math.max(1, Math.round(words / 160));
  const [slides, videoList] = await Promise.all([api.get(`slides/${topic.id}`).catch(() => null), allVideos()]);
  const videos = videoList.filter((v) => v.topicId === topic.id);
  const player = lessonPlayer(topic, { onComplete: () => updateTopic(topic.id, (s) => (s.watched = true)) });
  const viewer = slides && slideViewer(slides);
  const counts = { video: "▶", videos: videos.length, slides: slides?.pages || (slides ? "▶" : 0), theory: topic.sections.length, glossary: topic.glossary.length, methods: topic.methods.length, questions: topic.questions.length, quiz: topic.quiz.length, self: topic.selfStudy.length };

  // Progress halqasi
  const ring = h("div", { class: "hero-ring", style: { "--p": 0 } }, h("b", {}, "0%"), h("span", {}, "bajarildi"));
  const drawRing = () => {
    const pct = topicCompletion(topic);
    ring.style.setProperty("--p", pct);
    ring.querySelector("b").textContent = `${pct}%`;
  };
  drawRing();
  window.addEventListener("vgt:progress", drawRing);

  const body = h(
    "div",
    { class: "lesson-body" },
    chapter("video", "🎬", "Animatsion dars", "Mavzuning qisqa animatsion bayoni: ovozli hikoya, subtitrlar va jonli infografika", player),
    videos.length > 0 && chapter("videos", "📹", "Video darslar", `${videos.length} ta video — o'qituvchi tomonidan joylangan`, h("div", { class: "video-grid" }, videos.map((v) => videoCard(v)))),
    viewer && chapter("slides", "🖥️", "Taqdimot", slides.kind === "pdf" ? `${slides.pages ? `${slides.pages} ta slayd · ` : ""}strelkalar, svayp yoki ⛶ to'liq ekran` : slides.title, viewer),
    chapter("theory", "📖", "Nazariya", `${topic.sections.length} bo'lim · ~${minutes} daqiqa o'qish`, theoryBlock(topic)),
    chapter("glossary", "🃏", "Tayanch tushunchalar", `${topic.glossary.length} ta tushuncha — kartani bosing`, glossaryTab(topic)),
    chapter("methods", "🧠", "Interaktiv metodlar", `${topic.methods.length} ta topshiriq`, methodsTab(topic)),
    chapter("questions", "❓", "Nazorat savollari", `${topic.questions.length} ta savol (o'quv qo'llanmadan)`, questionsTab(topic)),
    chapter("quiz", "✅", "O'zingizni sinang", `${topic.quiz.length} ta test (o'quv qo'llanmadan)`, quizTab(topic)),
    chapter("self", "🧩", "Mustaqil ish", `${topic.selfStudy.length} ta topshiriq`, selfTab(topic))
  );

  const rail = h(
    "nav",
    { class: "lesson-rail", "aria-label": "Dars bo'limlari" },
    h("div", { class: "rail-title" }, `${topic.num}-mavzu`),
    CHAPTERS.filter(([key]) => (key !== "slides" || viewer) && (key !== "videos" || videos.length)).map(([key, icon, label]) => [
      h("a", { href: `#learn-${key}`, "data-key": key, onclick: (e) => { e.preventDefault(); document.getElementById(`learn-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); } }, h("span", { class: "rail-icon" }, icon), h("span", { class: "rail-label" }, label), h("span", { class: "rail-count" }, counts[key])),
      key === "theory" && h("div", { class: "rail-sub" }, topic.sections.filter((x) => x.title).map((x, i) => h("a", { href: `#sec-${i}`, "data-sec": i, onclick: (e) => { e.preventDefault(); document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); } }, x.title.replace(/^\d+\.\d+\.\s*/, "")))),
    ])
  );

  const notesBtn = notesDrawer(topic);
  const tutor = tutorDrawer(topic);

  mount(
    el,
    h("div", { class: "reading-progress", "aria-hidden": "true" }, h("div", { class: "reading-progress-fill" })),
    h("nav", { class: "crumbs" }, h("a", { href: "#/topics" }, "Mavzular"), " / ", `${topic.num}-mavzu`),
    h(
      "header",
      { class: `lesson-hero ${topic.image ? "" : "no-image"}` },
      topic.image && h("img", { class: "lesson-hero-img", src: topic.image, alt: topic.title, "data-zoom": `${topic.num}-mavzu. ${topic.title}` }),
      topic.image && h("button", { class: "lesson-hero-zoom", "aria-label": "Muqova rasmini kattalashtirish", onclick: (e) => e.currentTarget.parentElement.querySelector(".lesson-hero-img").click() }, "🔍"),
      h("div", { class: "lesson-hero-overlay" }),
      h(
        "div",
        { class: "lesson-hero-content" },
        h("div", { class: "lesson-hero-badge" }, h("span", { class: "hero-emoji" }, topic.icon), `${topic.num}-mavzu`),
        h("h1", { class: "lesson-title" }, topic.title),
        h("p", { class: "lesson-goal" }, topic.goal),
        h("div", { class: "lesson-stats" },
          [...(slides ? [["🖥️", slides.pages ? `${slides.pages} slayd` : "taqdimot"]] : []), ["📖", `${topic.sections.length} bo'lim`], ["⏱", `~${minutes} daq`], ["🃏", `${topic.glossary.length} tushuncha`], ["❓", `${topic.questions.length} savol`], ["✅", `${topic.quiz.length} test`]].map(([i, t]) => h("span", { class: "stat-pill" }, i, " ", t))),
        TOPIC_MAP[topic.id] && h("div", { class: "lesson-comps" }, competencyChips(TOPIC_MAP[topic.id]))
      ),
      ring
    ),
    h("div", { class: "lesson-layout" }, rail, body),
    h(
      "div",
      { class: "lesson-pager" },
      prev ? h("a", { href: `#/topics/${prev.id}`, class: "pager-card" }, h("small", {}, "← Oldingi mavzu"), h("b", {}, `${prev.num}. ${prev.title}`)) : h("span"),
      next ? h("a", { href: `#/topics/${next.id}`, class: "pager-card next" }, h("small", {}, "Keyingi mavzu →"), h("b", {}, `${next.num}. ${next.title}`)) : h("span")
    ),
    notesBtn,
    tutor
  );

  // Eski ?tab= havolalari: tegishli bo'limga o'tish
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const initial = params.get("tab");
  if (initial && initial !== "theory") setTimeout(() => document.getElementById(`learn-${initial}`)?.scrollIntoView({ block: "start" }), 120);
  if (params.has("sec")) setTimeout(() => document.getElementById(`sec-${params.get("sec")}`)?.scrollIntoView({ block: "start" }), 120);

  // Scrollspy va o'qish progressi
  const fill = el.querySelector(".reading-progress-fill");
  const onScroll = () => {
    const rect = body.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const pct = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
    fill.style.transform = `scaleX(${pct})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const key = e.target.dataset.chapter;
        const sec = e.target.dataset.sec;
        if (key) rail.querySelectorAll("a[data-key]").forEach((a) => a.classList.toggle("active", a.dataset.key === key));
        if (sec !== undefined) rail.querySelectorAll("a[data-sec]").forEach((a) => a.classList.toggle("active", a.dataset.sec === sec));
      }
    },
    { rootMargin: "-35% 0px -60% 0px" }
  );
  el.querySelectorAll("[data-chapter], .book-section[data-sec]").forEach((n) => spy.observe(n));

  return () => {
    window.removeEventListener("vgt:progress", drawRing);
    window.removeEventListener("scroll", onScroll);
    spy.disconnect();
    notesBtn.remove();
    tutor.destroy();
    player.destroy();
    viewer?.destroy?.();
  };
}

function chapter(key, icon, title, sub, content) {
  return h(
    "section",
    { class: "chapter", id: `learn-${key}`, "data-chapter": key },
    h("div", { class: "chapter-head reveal" }, h("span", { class: "chapter-icon" }, icon), h("div", {}, h("h2", {}, title), h("p", { class: "muted small" }, sub))),
    content
  );
}

function notesDrawer(topic) {
  const ta = h("textarea", { rows: 12, placeholder: "Mavzu bo'yicha qisqacha konspekt, savollaringiz..." });
  loadProgress().then((p) => (ta.value = p.notes[topic.id] || ""));
  ta.addEventListener("input", () => setNote(topic.id, ta.value));
  const panel = h(
    "aside",
    { class: "notes-drawer", "aria-label": "Konspekt" },
    h("div", { class: "row between" }, h("h3", {}, "📝 Konspekt"), h("button", { class: "icon-btn", "aria-label": "Yopish", onclick: () => wrap.classList.remove("open") }, "✕")),
    h("p", { class: "muted small" }, `${topic.num}-mavzu. Avtomatik saqlanadi.`),
    ta,
    topic.resources.length > 0 && h("div", {}, h("h4", {}, "🔗 Foydali resurslar"), h("ul", { class: "links" }, topic.resources.map((r) => h("li", {}, h("a", { href: r.url, target: "_blank", rel: "noopener" }, r.title))))),
    topic.trainer.length > 0 && h("div", {}, h("h4", {}, "🎙 Trenajyorda mashq qiling"), h("div", { class: "stack" }, topic.trainer.map((tid) => h("a", { href: `#/trainer/${tid}`, class: "btn small ghost" }, TRAINER_NAMES[tid] || tid))))
  );
  const wrap = h("div", { class: "notes-wrap" }, h("button", { class: "notes-fab", "aria-label": "Konspekt va resurslar", onclick: () => wrap.classList.toggle("open") }, "📝"), panel);
  return wrap;
}

function theoryBlock(topic) {
  const st = topicState(topic.id);
  const readBtn = h("button", { class: `btn lg ${st.read ? "ghost" : ""}`, onclick: () => {
    updateTopic(topic.id, (s) => (s.read = true));
    readBtn.textContent = "✓ O'qib chiqildi";
    readBtn.className = "btn lg ghost";
    changed();
    toast("Nazariy qism o'qildi deb belgilandi", "ok");
  } }, st.read ? "✓ O'qib chiqildi" : "O'qib chiqdim deb belgilash");
  let secIdx = -1;
  return h(
    "div",
    { class: "stack" },
    h("div", { class: "card plan-card reveal" }, h("h3", {}, "🗒 Dars rejasi"), h("ol", { class: "plan-steps" }, topic.plan.map((p) => h("li", {}, p.replace(/^\d+\.\d+\.\s*/, ""))))),
    topic.sections.map((s) => {
      if (s.title) secIdx++;
      return h("article", { class: "card book-section reveal", ...(s.title ? { id: `sec-${secIdx}`, "data-sec": String(secIdx) } : {}) }, s.title && h("h3", { class: "section-heading" }, s.title), h("div", { class: "book-text prose", html: s.html }));
    }),
    h("div", { class: "row between wrap reveal" }, h("p", { class: "muted small" }, "Manba: ", COURSE.source), readBtn)
  );
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
      if (!ok) setTimeout(() => shake(qs[i]), i * 60);
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
    const cls = score >= 80 ? "score-high" : score >= 60 ? "score-mid" : "score-low";
    result.replaceChildren(
      h(
        "div",
        { class: "card quiz-result" },
        h("div", { class: `score-ring ${cls}`, style: { "--pct": score } }, h("b", {}, `${score}%`), h("span", {}, `${correct}/${topic.quiz.length}`)),
        h("div", {}, h("h3", {}, score >= 80 ? "A'lo natija! 🏆" : score >= 60 ? "Yaxshi, mavzu o'zlashtirildi 👍" : "Yana bir urinib ko'ring 💪"), h("p", { class: "muted" }, score >= 60 ? "Natijangiz saqlandi. Keyingi bo'limga o'tishingiz mumkin." : "Nazariy qismni qayta o'qib, testni qayta topshiring. O'tish balli — 60%."), h("button", { class: "btn ghost", onclick: () => wrap.replaceWith(quizTab(topic)) }, "🔁 Qayta topshirish"))
      )
    );
    result.scrollIntoView({ behavior: "smooth", block: "center" });
    if (score >= 80) {
      const r = result.getBoundingClientRect();
      setTimeout(() => confetti(r.left + r.width / 2, r.top + 60), 350);
    }
  } }, "Javoblarni tekshirish");
  wrap.append(
    ...[
      st.quiz != null && h("div", { class: "alert alert-info" }, `Eng yaxshi natijangiz: ${st.quiz}% (urinishlar: ${st.quizAttempts || 1}). O'tish balli — 60%.`),
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
