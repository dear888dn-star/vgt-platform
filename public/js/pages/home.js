import { h, mount } from "../ui.js";
import { session } from "../api.js";
import { COURSE, TOPICS } from "../../data/topics.js";
import { loadProgress, topicCompletion, loadGame } from "../progress.js";
import { dueCount } from "./review.js";
import { mountScene, LANDMARK_NAMES } from "../landmarks.js";
import { introVideo } from "../media.js";

const SHOWCASE = [
  ["registan", "Samarqand"],
  ["khiva", "Xiva"],
  ["bukhara", "Buxoro"],
  ["guramir", "Samarqand"],
  ["shahizinda", "Samarqand"],
  ["aksaray", "Shahrisabz"],
];
const timeOfDay = () => {
  const hr = new Date().getHours();
  return hr >= 19 || hr < 6 ? "night" : hr >= 17 ? "sunset" : "day";
};

/** Bosh sahifa manzarasi: obidalar navbat bilan almashadi, sichqoncha bilan parallaks. */
function heroScene() {
  let i = 0;
  const time = timeOfDay();
  const stage = h("div", { class: "scene-stage" });
  const caption = h("div", { class: "scene-caption" });
  const dots = h("div", { class: "scene-dots", role: "tablist", "aria-label": "Obidalar" });
  let timer;
  const show = (n) => {
    i = (n + SHOWCASE.length) % SHOWCASE.length;
    const [key, city] = SHOWCASE[i];
    const layer = h("div", { class: "scene-layer entering" });
    mountScene(layer, { landmark: key, time });
    stage.append(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove("entering")));
    const old = [...stage.children].slice(0, -1);
    setTimeout(() => old.forEach((o) => o.remove()), 1300);
    caption.replaceChildren(h("b", {}, LANDMARK_NAMES[key]), h("span", {}, `📍 ${city}`));
    dots.querySelectorAll("button").forEach((d, k) => d.classList.toggle("active", k === i));
    clearInterval(timer);
    timer = setInterval(() => (stage.isConnected ? show(i + 1) : clearInterval(timer)), 7000);
  };
  SHOWCASE.forEach(([key], k) => dots.append(h("button", { "aria-label": LANDMARK_NAMES[key], onclick: () => show(k) })));
  const wrap = h(
    "div",
    { class: "hero-visual scene-frame" },
    stage,
    h("div", { class: "scene-vignette", "aria-hidden": "true" }),
    caption,
    dots,
    h("a", { href: "#/tour", class: "scene-cta" }, "🧭 Virtual sayohatga chiqish"),
    h("span", { class: "float-chip c1", "aria-hidden": "true" }, "🎙️ AI gid"),
    h("span", { class: "float-chip c2", "aria-hidden": "true" }, "🗺️ Marshrut"),
    h("span", { class: "float-chip c3", "aria-hidden": "true" }, "📱 Raqamli turizm")
  );
  show(0);
  return wrap;
}

export async function render(el) {
  const user = session.user;
  await loadProgress();
  const game = user?.role === "student" ? await loadGame() : null;
  const due = user?.role === "student" ? dueCount() : 0;
  const done = TOPICS.filter((t) => topicCompletion(t) === 100).length;
  const tests = TOPICS.reduce((s, t) => s + t.quiz.length, 0);
  const questions = TOPICS.reduce((s, t) => s + t.questions.length, 0);

  const features = [
    ["📚", "Interaktiv mavzular", `${TOPICS.length} ta mavzu: o'quv qo'llanma matni, rasmlar, tushunchalar, nazorat savollari, testlar va 9 xil interaktiv metod.`, "#/topics"],
    ["🎙️", "Virtual gidlik trenajyori", "Sun'iy intellekt turist rolini o'ynaydi va sizni real vaqt rejimida kasbiy vaziyatlarga soladi.", "#/trainer"],
    ["🗺️", "Marshrut laboratoriyasi", "Turistik marshrutni raqamli xaritada modellashtirish: obyektlar bazasi, masofa va vaqt, marshrut pasporti.", "#/route-lab"],
    ["🧩", "Mustaqil ta'lim", "Shaxsiy o'quv rejasi, mustaqil ish topshiriqlari, o'qituvchi bahosi va refleksiv kundalik.", "#/self-study"],
    ["📝", "Kompleks diagnostika", "T0–T2 bosqichlarida anketa, test, amaliy topshiriqlar va refleksiya — natijalar avtomatik hisoblanadi.", "#/diagnostics"],
    ["🎯", "Kasb standarti", "Gid tarjimon kasb standarti: mehnat funksiyalari, kompetensiyalar va shaxsiy kompetensiya xaritangiz.", "#/standard"],
  ];

  mount(
    el,
    h(
      "section",
      { class: "hero-xl" },
      h(
        "div",
        {},
        h("span", { class: "hero-chip" }, h("span", { class: "dot" }), COURSE.audience),
        h("h1", {}, h("span", { class: "gradient-text" }, "Turizmda raqamli"), h("br"), "texnologiyalar"),
        h("p", { class: "lead" }, COURSE.description),
        h(
          "div",
          { class: "row wrap" },
          h("a", { href: "#/topics", class: "btn lg" }, "📚 O'qishni boshlash"),
          h("a", { href: "#/trainer", class: "btn ghost lg" }, "🎙️ Trenajyorni sinash"),
          h("button", { class: "btn ghost lg play-btn", onclick: introVideo }, h("span", { class: "play-ring" }, "▶"), "Platforma haqida video")
        ),
        h(
          "div",
          { class: "counter-row" },
          [[TOPICS.length, "mavzu"], [tests, "test savoli"], [questions, "nazorat savoli"], [10, "trenajyor ssenariysi"]].map(([n, l]) => h("div", { class: "counter" }, h("b", { "data-count": n }, "0"), h("span", {}, l)))
        )
      ),
      heroScene()
    ),
    user &&
      h(
        "div",
        { class: "card hero-card accent" },
        h("div", { class: "row between wrap" },
          h("div", { class: "row home-me" },
            game && h("a", { href: "#/passport", class: "home-level", title: "Safar pasporti", style: { "--p": game.level.pct } }, h("span", {}, game.level.icon)),
            h("div", {}, h("div", { class: "eyebrow" }, "Shaxsiy kabinet"), h("h3", {}, `Xush kelibsiz, ${user.name.split(" ")[0]}!`), h("p", { class: "muted small" }, game ? `${game.level.name} · ${game.xp} XP · 🔥 ${game.stats.streak} kunlik seriya · ${done}/${TOPICS.length} mavzu` : `${done} / ${TOPICS.length} mavzu to'liq o'zlashtirildi`))),
          h("div", { class: "row wrap" },
            game && h("a", { href: "#/review", class: `btn ${due ? "" : "ghost"}` }, `🔁 Takrorlash${due ? ` (${due})` : ""}`),
            h("a", { href: user.role === "teacher" ? "#/teacher" : "#/self-study", class: "btn" }, user.role === "teacher" ? "O'qituvchi paneli" : "O'quv rejam"),
            user.role === "student" && h("a", { href: "#/standard", class: "btn ghost" }, "🎯 Kompetensiya xaritam")))
      ),
    !user &&
      h("div", { class: "card hero-card accent" }, h("div", { class: "row between wrap" }, h("div", {}, h("h3", {}, "Profilingizni yarating"), h("p", { class: "muted small" }, "Email va parol orqali ro'yxatdan o'ting: progressingiz saqlanadi, trenajyor, diagnostika va marshrut laboratoriyasi ochiladi.")), h("div", { class: "row" }, h("a", { href: "#/register", class: "btn" }, "Ro'yxatdan o'tish"), h("a", { href: "#/login", class: "btn ghost" }, "Kirish")))),
    h("h2", { class: "section-title" }, "Platforma imkoniyatlari"),
    h("section", { class: "grid cols-3" }, features.map(([icon, title, text, href]) => h("a", { href, class: "card feature tilt" }, h("div", { class: "feature-icon" }, icon), h("h3", {}, title), h("p", { class: "muted small" }, text)))),
    h(
      "section",
      { class: "card how" },
      h("h2", {}, "Platformada qanday o'qiladi?"),
      h(
        "ol",
        { class: "timeline" },
        [
          ["Diagnostika", "Aniqlovchi bosqich (T0): anketa, test, amaliy topshiriqlar va refleksiya."],
          ["Nazariya va metodlar", "Har bir mavzuni o'qing, interaktiv metodlarni bajaring, tushunchalar, nazorat savollari va test bilan mustahkamlang."],
          ["Marshrut laboratoriyasi", "Turistik marshrutni raqamli xaritada modellashtirib, loyihani o'qituvchiga topshiring."],
          ["Trenajyor", "Virtual gidlik trenajyorida real vaziyatlarni mashq qiling, AI bahosi asosida o'sing."],
          ["Yakuniy baholash", "Yakunlovchi diagnostika (T2) — o'sishingizni va kompetensiya xaritangizni ko'ring."],
        ].map(([t, d], i) => h("li", { class: "reveal" }, h("span", { class: "t-num" }, i + 1), h("b", {}, t), h("p", { class: "muted small" }, d)))
      )
    )
  );
}
