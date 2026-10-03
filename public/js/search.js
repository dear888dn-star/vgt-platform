// Tezkor qidiruv (Ctrl+K yoki "/"): sahifalar, mavzular, bo'limlar, tushunchalar va trenajyor ssenariylari.
import { h } from "./ui.js";
import { api, session } from "./api.js";
import { TOPICS } from "../data/topics.js";

const norm = (s) => String(s).toLowerCase().replace(/[ʻ'‘’`ʼ]/g, "").replace(/\s+/g, " ").trim();

const PAGES = [
  ["🏠", "Bosh sahifa", "#/"],
  ["📚", "Mavzular", "#/topics"],
  ["🎬", "Mediateka — animatsion darslar, videolar, taqdimotlar", "#/media"],
  ["🧭", "Virtual sayohat — Buyuk ipak yo'li bo'ylab", "#/tour"],
  ["🎮", "Safar Live — jonli viktorinaga qo'shilish (PIN)", "#/live"],
  ["🎬", "Ekskursiya studiyasi — o'z virtual ekskursiyangizni yarating", "#/studio", true],
  ["🛂", "Safar pasporti — XP, nishonlar, reyting", "#/passport", true],
  ["🔁", "Kunlik takrorlash — tushunchalar kartalari", "#/review"],
  ["🎙️", "Virtual gidlik trenajyori", "#/trainer", true],
  ["🗺️", "Marshrut laboratoriyasi", "#/route-lab", true],
  ["🧩", "Mustaqil ta'lim", "#/self-study", true],
  ["📝", "Kompleks diagnostika", "#/diagnostics", true],
  ["🎯", "Kasb standarti va kompetensiyalar", "#/standard"],
  ["👤", "Profil", "#/profile", true],
];

let index = null;
let scenarios = null;

function buildIndex() {
  const items = PAGES.filter(([, , , auth]) => !auth || session.user).map(([icon, title, href]) => ({ icon, title, sub: "Sahifa", href, w: 3 }));
  if (session.user?.role === "teacher") items.push({ icon: "📊", title: "O'qituvchi paneli", sub: "Sahifa", href: "#/teacher", w: 3 }, { icon: "🖥️", title: "Taqdimotlarni joylash", sub: "O'qituvchi paneli", href: "#/teacher/slides", w: 2 });
  for (const t of TOPICS) {
    items.push({ icon: t.icon, title: `${t.num}. ${t.title}`, sub: "Mavzu", href: `#/topics/${t.id}`, w: 2.5 });
    t.sections.forEach((s, i) => s.title && items.push({ icon: "📖", title: s.title, sub: `${t.num}-mavzu · bo'lim`, href: `#/topics/${t.id}?sec=${t.sections.slice(0, i + 1).filter((x) => x.title).length - 1}`, w: 1.5 }));
    for (const g of t.glossary) items.push({ icon: "🃏", title: g.term, sub: `${t.num}-mavzu · tushuncha`, text: g.def, href: `#/topics/${t.id}?tab=glossary`, w: 1.2 });
  }
  for (const s of scenarios || []) items.push({ icon: s.icon, title: s.title, sub: `Trenajyor · ${s.category}`, href: `#/trainer/${s.id}`, w: 2 });
  for (const it of items) it.key = norm(`${it.title} ${it.sub}`);
  return items;
}

function search(q) {
  const words = norm(q).split(" ").filter(Boolean);
  if (!words.length) return index.filter((i) => i.sub === "Sahifa").slice(0, 10);
  const scored = [];
  for (const it of index) {
    const title = norm(it.title);
    if (!words.every((w) => it.key.includes(w) || (it.text && norm(it.text).includes(w)))) continue;
    let score = it.w;
    if (title.startsWith(words[0])) score += 3;
    if (words.every((w) => title.includes(w))) score += 2;
    scored.push([score, it]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 30).map((x) => x[1]);
}

function highlight(text, q) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return text;
  const lower = text.toLowerCase();
  const marks = [];
  for (const w of words) {
    const i = lower.indexOf(w);
    if (i >= 0) marks.push([i, i + w.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  const out = [];
  let pos = 0;
  for (const [s0, e0] of marks) {
    if (s0 < pos) continue;
    out.push(text.slice(pos, s0), h("mark", {}, text.slice(s0, e0)));
    pos = e0;
  }
  out.push(text.slice(pos));
  return out;
}

export function openSearch() {
  if (document.querySelector(".cmdk-overlay")) return;
  index = buildIndex();
  if (!scenarios)
    api.get("trainer/scenarios").then((d) => {
      scenarios = d.scenarios;
      index = buildIndex();
      draw();
    }).catch(() => {});
  let sel = 0;
  let results = [];
  const input = h("input", { type: "search", placeholder: "Mavzu, bo'lim, tushuncha yoki ssenariyni qidiring…", "aria-label": "Qidiruv", autocomplete: "off" });
  const list = h("ul", { class: "cmdk-list", role: "listbox" });
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
  };
  const go = (it) => {
    close();
    location.hash = it.href;
  };
  const draw = () => {
    results = search(input.value);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.replaceChildren(
      ...(results.length
        ? results.map((it, i) =>
            h("li", { class: `cmdk-item ${i === sel ? "sel" : ""}`, role: "option", "aria-selected": String(i === sel), onmousemove: () => { if (sel !== i) { sel = i; mark(); } }, onclick: () => go(it) },
              h("span", { class: "cmdk-icon" }, it.icon),
              h("span", { class: "cmdk-text" }, h("b", {}, highlight(it.title, input.value)), h("small", {}, it.sub)),
              h("kbd", {}, "↵")))
        : [h("li", { class: "cmdk-empty" }, "Hech narsa topilmadi")])
    );
  };
  const mark = () => {
    list.querySelectorAll(".cmdk-item").forEach((li, i) => {
      li.classList.toggle("sel", i === sel);
      li.setAttribute("aria-selected", String(i === sel));
    });
    list.children[sel]?.scrollIntoView({ block: "nearest" });
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      sel = Math.min(results.length - 1, sel + 1);
      mark();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sel = Math.max(0, sel - 1);
      mark();
    } else if (e.key === "Enter" && results[sel]) {
      e.preventDefault();
      go(results[sel]);
    }
  };
  input.addEventListener("input", () => {
    sel = 0;
    draw();
  });
  const overlay = h(
    "div",
    { class: "cmdk-overlay", onclick: (e) => e.target === overlay && close() },
    h("div", { class: "cmdk", role: "dialog", "aria-modal": "true", "aria-label": "Qidiruv" }, h("div", { class: "cmdk-input" }, h("span", {}, "🔍"), input, h("kbd", {}, "Esc")), list, h("div", { class: "cmdk-foot" }, h("span", {}, h("kbd", {}, "↑"), h("kbd", {}, "↓"), " tanlash"), h("span", {}, h("kbd", {}, "↵"), " ochish"), h("span", {}, h("kbd", {}, "Ctrl"), "+", h("kbd", {}, "K"), " istalgan joydan")))
  );
  document.body.append(overlay);
  document.addEventListener("keydown", onKey, true);
  draw();
  input.focus();
}

// ---------- Mavzu (yorug' / qorong'i) ----------
const THEMES = ["auto", "light", "dark"];
const THEME_ICON = { auto: "🌗", light: "☀️", dark: "🌙" };
const THEME_LABEL = { auto: "Mavzu: avtomatik", light: "Mavzu: yorug'", dark: "Mavzu: qorong'i" };

function applyTheme(t) {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export function initTools() {
  const tools = document.querySelector(".topbar-tools");
  let theme = "auto";
  try {
    theme = localStorage.getItem("vgt.theme") || "auto";
  } catch {}
  applyTheme(theme);
  const themeBtn = h("button", { class: "icon-btn tool-btn", "aria-label": THEME_LABEL[theme], title: THEME_LABEL[theme], onclick: () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    applyTheme(theme);
    try {
      localStorage.setItem("vgt.theme", theme);
    } catch {}
    themeBtn.textContent = THEME_ICON[theme];
    themeBtn.title = THEME_LABEL[theme];
    themeBtn.setAttribute("aria-label", THEME_LABEL[theme]);
  } }, THEME_ICON[theme]);
  const searchBtn = h("button", { class: "tool-search", "aria-label": "Qidiruv (Ctrl+K)", title: "Qidiruv (Ctrl+K)", onclick: openSearch }, h("span", {}, "🔍"), h("span", { class: "tool-search-label" }, "Qidiruv"), h("kbd", {}, "Ctrl K"));
  tools?.replaceChildren(searchBtn, themeBtn);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    } else if (e.key === "/" && !e.target.closest("input, textarea, select, [contenteditable]")) {
      e.preventDefault();
      openSearch();
    }
  });
}
