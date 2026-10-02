import { h, mount } from "../ui.js";
import { session } from "../api.js";
import { COURSE, TOPICS } from "../../data/topics.js";
import { loadProgress, topicCompletion, loadGame } from "../progress.js";
import { dueCount } from "./review.js";

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

  const orbit = (cls, icons) =>
    h("div", { class: `orbit ${cls}` }, icons.map((ic, i) => {
      const a = (i / icons.length) * Math.PI * 2;
      return h("span", { class: "orbit-item", style: { left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%` } }, ic);
    }));

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
          h("a", { href: "#/trainer", class: "btn ghost lg" }, "🎙️ Trenajyorni sinash")
        ),
        h(
          "div",
          { class: "counter-row" },
          [[TOPICS.length, "mavzu"], [tests, "test savoli"], [questions, "nazorat savoli"], [10, "trenajyor ssenariysi"]].map(([n, l]) => h("div", { class: "counter" }, h("b", { "data-count": n }, "0"), h("span", {}, l)))
        )
      ),
      h(
        "div",
        { class: "hero-visual", "aria-hidden": "true" },
        orbit("o1", ["🕌", "✈️", "🗺️", "🏨", "📱", "🎧"]),
        orbit("o2", ["🤖", "☁️", "🔐", "📊"]),
        orbit("o3", ["🧭", "🎯", "📸"]),
        h("div", { class: "hero-core" }, "🧭")
      )
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
