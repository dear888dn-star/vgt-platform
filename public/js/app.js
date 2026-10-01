// Ilova marshrutizatori va navigatsiya.
import { h, mount, errorBox } from "./ui.js";
import { session } from "./api.js";
import * as home from "./pages/home.js";
import * as auth from "./pages/auth.js";
import * as topics from "./pages/topics.js";
import * as selfStudy from "./pages/selfstudy.js";
import * as trainer from "./pages/trainer.js";
import * as surveys from "./pages/surveys.js";
import * as teacher from "./pages/teacher.js";
import * as profile from "./pages/profile.js";
import * as diagnostics from "./pages/diagnostics.js";
import * as routeLab from "./pages/route-lab.js";
import * as standard from "./pages/standard.js";

const routes = [
  [/^\/?$/, home.render],
  [/^\/login$/, auth.renderLogin],
  [/^\/register$/, auth.renderRegister],
  [/^\/topics$/, topics.renderList],
  [/^\/topics\/([\w-]+)$/, topics.renderTopic],
  [/^\/self-study$/, selfStudy.render, { auth: true }],
  [/^\/trainer$/, trainer.renderList, { auth: true }],
  [/^\/trainer\/([\w-]+)$/, trainer.renderSession, { auth: true }],
  [/^\/surveys$/, diagnostics.render, { auth: true }],
  [/^\/diagnostics$/, diagnostics.render, { auth: true }],
  [/^\/standard$/, standard.render],
  [/^\/route-lab$/, routeLab.renderList, { auth: true }],
  [/^\/route-lab\/([\w-]+)$/, routeLab.renderProject, { auth: true }],
  [/^\/surveys\/([\w-]+)$/, surveys.renderSurvey, { auth: true }],
  [/^\/teacher(?:\/([\w-]+))?(?:\/([\w-]+))?$/, teacher.render, { teacher: true }],
  [/^\/profile$/, profile.render, { auth: true }],
];

const NAV = [
  ["#/topics", "Mavzular", "📚"],
  ["#/self-study", "Mustaqil ta'lim", "🧩"],
  ["#/route-lab", "Marshrut", "🗺️"],
  ["#/trainer", "Trenajyor", "🎙️"],
  ["#/diagnostics", "Diagnostika", "📝"],
  ["#/standard", "Standart", "🎯"],
];

const main = document.getElementById("main");
const nav = document.getElementById("nav");
const toggle = document.querySelector(".menu-toggle");
let cleanup = null;

function renderNav() {
  const path = location.hash || "#/";
  const user = session.user;
  const items = [...NAV];
  if (user?.role === "teacher") items.push(["#/teacher", "Panel", "📊"]);
  const active = (href) => (href === "#/" ? path === "#/" || path === "" : path.startsWith(href));
  mount(
    nav,
    items.map(([href, label, icon]) => h("a", { href, class: active(href) ? "active" : "" }, h("span", { class: "nav-icon" }, icon), label)),
    user
      ? h("a", { href: "#/profile", class: `nav-user ${active("#/profile") ? "active" : ""}` }, h("span", { class: "avatar" }, user.name.slice(0, 1).toUpperCase()), h("span", { class: "nav-user-name" }, user.name.split(" ")[0]))
      : h("a", { href: "#/login", class: "btn small" }, "Kirish")
  );
}

async function route() {
  if (cleanup) {
    try { cleanup(); } catch {}
    cleanup = null;
  }
  const path = (location.hash || "#/").slice(1).split("?")[0];
  document.body.classList.remove("nav-open");
  document.querySelectorAll(".modal-overlay").forEach((m) => m.remove());
  toggle.setAttribute("aria-expanded", "false");
  renderNav();
  for (const [pattern, fn, opts = {}] of routes) {
    const m = path.match(pattern);
    if (!m) continue;
    if ((opts.auth || opts.teacher) && !session.user) {
      sessionStorage.setItem("vgt.after-login", location.hash);
      location.hash = "#/login";
      return;
    }
    if (opts.teacher && session.user.role !== "teacher") {
      mount(main, errorBox(new Error("Bu bo'lim faqat o'qituvchilar uchun.")));
      return;
    }
    main.replaceChildren();
    window.scrollTo(0, 0);
    try {
      cleanup = (await fn(main, ...m.slice(1))) || null;
    } catch (e) {
      console.error(e);
      mount(main, errorBox(e));
    }
    main.focus({ preventScroll: true });
    return;
  }
  mount(main, h("div", { class: "empty" }, h("div", { class: "empty-icon" }, "🧭"), h("h3", {}, "Sahifa topilmadi"), h("a", { href: "#/", class: "btn" }, "Bosh sahifaga")));
}

toggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  toggle.setAttribute("aria-expanded", String(open));
});
window.addEventListener("hashchange", route);
window.addEventListener("vgt:auth", renderNav);
document.getElementById("year").textContent = new Date().getFullYear();
main.setAttribute("tabindex", "-1");
route();
