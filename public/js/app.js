// Ilova marshrutizatori va navigatsiya.
import { h, mount, errorBox } from "./ui.js";
import { session } from "./api.js";
import { watch, transition, initTopbar } from "./motion.js";
import { initResultsBoard } from "./results-board.js";
import { initCelebrations } from "./celebrate.js";
import { initTools } from "./search.js";
import { initLightbox } from "./media.js";
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
import * as passport from "./pages/passport.js";
import * as review from "./pages/review.js";
import * as cert from "./pages/cert.js";
import * as tour from "./pages/tour.js";
import * as media from "./pages/media.js";
import * as studio from "./pages/studio.js";
import * as live from "./pages/live.js";
import * as geo from "./pages/geo.js";
import * as migrate from "./pages/migrate.js";

const routes = [
  [/^\/?$/, home.render],
  [/^\/login$/, auth.renderLogin],
  [/^\/register$/, auth.renderRegister],
  [/^\/forgot$/, auth.renderForgot],
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
  [/^\/passport$/, passport.render, { auth: true }],
  [/^\/review$/, review.render],
  [/^\/tour$/, tour.render],
  [/^\/geo$/, geo.render],
  [/^\/migrate$/, migrate.render],
  [/^\/media$/, media.render],
  [/^\/live$/, live.renderJoin],
  [/^\/live\/play\/(\d{6})$/, live.renderPlay],
  [/^\/live\/host\/(\d{6})$/, live.renderHost, { teacher: true }],
  [/^\/studio$/, studio.renderList, { auth: true }],
  [/^\/studio\/view\/([\w-]+)$/, studio.renderView],
  [/^\/studio\/([\w-]+)$/, studio.renderEditor, { auth: true }],
  [/^\/cert\/([\w-]+)$/, cert.render],
];

const NAV = [
  ["#/topics", "Mavzular", "📚"],
  ["#/media", "Mediateka", "🎬"],
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
  else if (user) items.push(["#/passport", "Pasport", "🛂"]);
  const active = (href) => (href === "#/" ? path === "#/" || path === "" : path.startsWith(href));
  mount(
    nav,
    items.map(([href, label, icon]) => h("a", { href, class: active(href) ? "active" : "" }, h("span", { class: "nav-icon" }, icon), label)),
    user
      ? h("a", { href: "#/profile", class: `nav-user ${active("#/profile") ? "active" : ""}` }, h("span", { class: "avatar" }, user.name.slice(0, 1).toUpperCase()), h("span", { class: "nav-user-name" }, user.name.split(" ")[0]))
      : h("a", { href: "#/login", class: "btn small" }, "Kirish")
  );
}

/** Brauzer yorlig'i va tarix uchun sahifa nomi: birinchi sarlavhadan (bosh sahifada — sayt nomi). */
function setTitle(path) {
  const base = "Safar akademiya";
  const h1 = path === "/" || path === "" ? null : main.querySelector("h1, h2");
  const t = h1?.textContent.replace(/\s+/g, " ").trim().replace(/^[^\p{L}\p{N}]+/u, "").slice(0, 70);
  document.title = t ? `${t} — ${base}` : `${base} — Turizmda raqamli texnologiyalar`;
}

async function route() {
  if (cleanup) {
    try { cleanup(); } catch {}
    cleanup = null;
  }
  const path = (location.hash || "#/").slice(1).split("?")[0];
  document.body.classList.remove("nav-open");
  // Jonli viktorina — to'liq ekranli o'yin rejimi (menyu va pastki panelsiz)
  document.body.classList.toggle("live-mode", /^\/live(\/|$)/.test(path));
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
    await transition(() => {
      main.replaceChildren();
      window.scrollTo(0, 0);
    });
    try {
      cleanup = (await fn(main, ...m.slice(1))) || null;
    } catch (e) {
      console.error(e);
      mount(main, errorBox(e));
    }
    main.focus({ preventScroll: true });
    setTitle(path);
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
main.setAttribute("tabindex", "-1");
initTopbar();
initTools();
initCelebrations();
initLightbox();
initResultsBoard();
watch(main);
route();

// ---------- Ilova (PWA): o'rnatish va internetsiz rejim ----------
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
const offlineBar = h("div", { class: "offline-bar", role: "status" }, "📴 Internet aloqasi yo'q — oldin ochilgan mavzular va taqdimotlar oflayn ishlaydi. Natijalar aloqa tiklangach saqlanadi.");
const syncOnline = () => (navigator.onLine ? offlineBar.remove() : document.body.append(offlineBar));
window.addEventListener("online", syncOnline);
window.addEventListener("offline", syncOnline);
syncOnline();
let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  if (document.querySelector(".install-btn")) return;
  const btn = h("button", { class: "icon-btn tool-btn install-btn", title: "Ilovani o'rnatish", "aria-label": "Ilovani o'rnatish", onclick: async () => {
    installEvent?.prompt();
    await installEvent?.userChoice;
    installEvent = null;
    btn.remove();
  } }, "📲");
  document.querySelector(".topbar-tools")?.prepend(btn);
});
