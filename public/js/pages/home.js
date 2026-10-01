import { h, mount } from "../ui.js";
import { session } from "../api.js";
import { COURSE, TOPICS } from "../../data/topics.js";
import { loadProgress, topicCompletion } from "../progress.js";

export async function render(el) {
  const user = session.user;
  const progress = await loadProgress();
  const done = TOPICS.filter((t) => topicCompletion(t) === 100).length;
  const started = TOPICS.filter((t) => progress.topics[t.id]).length;

  const features = [
    ["📚", "Interaktiv mavzular", `${TOPICS.length} ta mavzu: nazariya, tayanch tushunchalar, flesh-kartalar, testlar va 9 xil interaktiv metod.`, "#/topics"],
    ["🧩", "Mustaqil ta'lim", "Shaxsiy o'quv rejasi, mustaqil ish topshiriqlari, o'qituvchi bahosi va refleksiv kundalik.", "#/self-study"],
    ["🎙️", "Virtual gidlik trenajyori", "Sun'iy intellekt turist rolini o'ynaydi va sizni real vaqt rejimida kasbiy vaziyatlarga soladi.", "#/trainer"],
    ["🗺️", "Marshrut laboratoriyasi", "Turistik marshrutni raqamli xaritada modellashtirish: obyektlar bazasi, masofa va vaqt hisobi, variantlarni taqqoslash, marshrut pasporti.", "#/route-lab"],
    ["📝", "Kompleks diagnostika", "T0–T2 bosqichlarida anketa, test, amaliy topshiriqlar va refleksiya: natijalar o'qituvchi paneliga avtomatik yig'iladi.", "#/diagnostics"],
  ];

  mount(
    el,
    h(
      "section",
      { class: "hero" },
      h(
        "div",
        { class: "hero-text" },
        h("div", { class: "eyebrow" }, COURSE.audience),
        h("h1", {}, COURSE.title),
        h("p", { class: "lead" }, COURSE.description),
        h(
          "div",
          { class: "row wrap" },
          h("a", { href: "#/trainer", class: "btn lg" }, "🎙️ Trenajyorni boshlash"),
          h("a", { href: "#/topics", class: "btn ghost lg" }, "Mavzularni o'rganish")
        )
      ),
      h(
        "div",
        { class: "hero-card card" },
        user
          ? [
              h("div", { class: "eyebrow" }, "Shaxsiy kabinet"),
              h("h3", {}, `Xush kelibsiz, ${user.name.split(" ")[0]}!`),
              h("div", { class: "stat-row" },
                h("div", { class: "stat" }, h("b", {}, `${done}/${TOPICS.length}`), h("span", {}, "mavzu tugallandi")),
                h("div", { class: "stat" }, h("b", {}, started), h("span", {}, "mavzu boshlangan"))),
              h("a", { href: user.role === "teacher" ? "#/teacher" : "#/self-study", class: "btn block" }, user.role === "teacher" ? "O'qituvchi paneli" : "O'quv rejamga o'tish"),
            ]
          : [
              h("div", { class: "eyebrow" }, "Boshlash"),
              h("h3", {}, "Profilingizni yarating"),
              h("p", { class: "muted" }, "Email va parol orqali ro'yxatdan o'ting: progressingiz saqlanadi, trenajyor va so'rovnomalar ochiladi."),
              h("a", { href: "#/register", class: "btn block" }, "Ro'yxatdan o'tish"),
              h("a", { href: "#/login", class: "btn ghost block" }, "Kirish"),
            ]
      )
    ),
    h("section", { class: "grid cols-3" }, features.map(([icon, title, text, href]) => h("a", { href, class: "card feature" }, h("div", { class: "feature-icon" }, icon), h("h3", {}, title), h("p", { class: "muted" }, text)))),
    h(
      "section",
      { class: "card how" },
      h("h2", {}, "Platformada qanday o'qiladi?"),
      h(
        "ol",
        { class: "steps" },
        h("li", {}, h("b", {}, "Diagnostika. "), "Diagnostika bo'limida aniqlovchi bosqich (T0): anketa, test, amaliy topshiriqlar va refleksiya."),
        h("li", {}, h("b", {}, "Nazariya va metodlar. "), "Har bir mavzuni o'qing, interaktiv metodlarni bajaring, flesh-kartalar va test bilan mustahkamlang."),
        h("li", {}, h("b", {}, "Marshrut laboratoriyasi. "), "Turistik marshrutni raqamli xaritada modellashtirib, loyihani o'qituvchiga topshiring."),
        h("li", {}, h("b", {}, "Mustaqil ta'lim. "), "O'quv rejangizni tuzing, mustaqil ishlarni topshiring va o'qituvchi fikrini oling."),
        h("li", {}, h("b", {}, "Trenajyor. "), "Virtual gidlik trenajyorida real vaziyatlarni mashq qiling, AI bahosi asosida o'sing."),
        h("li", {}, h("b", {}, "Yakuniy baholash. "), "Yakunlovchi diagnostika (T2) va marshrut loyihasini himoya qilish — natijalaringiz o'sishini ko'ring.")
      )
    )
  );
}
