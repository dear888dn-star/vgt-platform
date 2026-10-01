// Sayt pastidagi ochiq monitoring oynasi: texnikumlar kesimida T0 / T1 / T2 diagnostika natijalari.
// Faqat umumlashtirilgan ko'rsatkichlar (/api/public/results) ko'rsatiladi.
import { h } from "./ui.js";
import { api } from "./api.js";
import { reducedMotion, enhance } from "./motion.js";

const STAGE_KEYS = ["T0", "T1", "T2"];
const STAGE_LABEL = { T0: "Boshlang'ich (T0)", T1: "Oraliq (T1)", T2: "Yakuniy (T2)" };
const METRICS = {
  B: { label: "Integral ko'rsatkich (B)", short: "B", max: 5, ticks: [0, 1, 2, 3, 4, 5], fmt: (v) => v.toFixed(2).replace(".", ","), hint: "B = (M + KK + AR) / 3, 3–5 ballik shkala. Faqat to'liq baholangan o'quvchilar." },
  M: { label: "Motivatsiya (anketa, M)", short: "M", max: 5, ticks: [0, 1, 2, 3, 4, 5], fmt: (v) => v.toFixed(2).replace(".", ","), hint: "A-bo'lim anketasi: 15 fikr bo'yicha o'rtacha ball (1–5)." },
  T: { label: "Bilim testi (T, %)", short: "T", max: 100, ticks: [0, 25, 50, 75, 100], fmt: (v) => `${Math.round(v)}%`, hint: "B-bo'lim testi: to'g'ri javoblar ulushi." },
};
const LEVELS = [
  ["Past", "lv-low"],
  ["O'rta", "lv-mid"],
  ["Yuqori", "lv-high"],
];

let state = { data: null, metric: "B", focus: null, loadedAt: 0 };
let root;
let tip;

export function initResultsBoard() {
  root = document.getElementById("results-board");
  if (!root) return;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      if (!state.data || Date.now() - state.loadedAt > 120_000) load();
    },
    { rootMargin: "300px 0px" }
  );
  io.observe(root);
}

async function load() {
  state.loadedAt = Date.now();
  try {
    state.data = await api.get("public/results");
  } catch {
    state.data = state.data || null;
  }
  render();
}

function hasValue(stage, metric) {
  return Number.isFinite(stage?.[metric]);
}

function render() {
  const d = state.data;
  if (!d) {
    root.replaceChildren(h("div", { class: "container rb-inner" }, header(null), h("p", { class: "muted" }, "Natijalarni yuklab bo'lmadi.")));
    return;
  }
  const metric = METRICS[state.metric];
  const rows = d.colleges.filter((c) => STAGE_KEYS.some((s) => hasValue(c.stages[s], state.metric)));
  const focus = d.colleges.find((c) => c.name === state.focus) || d.total;

  root.replaceChildren(
    h(
      "div",
      { class: "container rb-inner" },
      header(d),
      tiles(d),
      h(
        "div",
        { class: "rb-filters" },
        h("div", { class: "segmented", role: "tablist", "aria-label": "Ko'rsatkich" },
          Object.entries(METRICS).map(([k, m]) => h("button", { class: `seg ${state.metric === k ? "active" : ""}`, role: "tab", "aria-selected": String(state.metric === k), onclick: () => { state.metric = k; render(); } }, m.label))),
        legend()
      ),
      h(
        "div",
        { class: "rb-grid" },
        h(
          "div",
          { class: "rb-card" },
          h("h3", {}, `${metric.label}: texnikumlar bo'yicha o'rtacha`),
          h("p", { class: "muted small" }, metric.hint),
          rows.length ? barChart(rows, metric) : emptyState()
        ),
        h(
          "div",
          { class: "rb-card" },
          h("h3", {}, "Darajalar taqsimoti"),
          h("p", { class: "muted small" }, focus === d.total ? "Barcha texnikumlar. Chap diagrammadagi texnikum nomini bosib, uning taqsimotini ko'ring." : focus.name, focus !== d.total && h("button", { class: "linklike", onclick: () => { state.focus = null; render(); } }, " · barchasi")),
          levelChart(focus)
        )
      ),
      tableView(d)
    )
  );
  animateIn();
  enhance(root);
}

function header(d) {
  return h(
    "div",
    { class: "rb-head" },
    h("span", { class: "eyebrow" }, "Ochiq monitoring"),
    h("h2", {}, "Texnikumlar kesimida diagnostika natijalari"),
    h("p", { class: "muted" }, "Kompleks diagnostikaning boshlang'ich, oraliq va yakuniy bosqichlari bo'yicha umumlashtirilgan natijalar. Shaxsiy ma'lumotlar ko'rsatilmaydi.", d && h("span", { class: "rb-updated" }, ` Yangilangan: ${new Date(d.updatedAt).toLocaleString("uz-UZ", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`))
  );
}

function tiles(d) {
  const t = d.total.stages;
  const b0 = t.T0?.B;
  const b2 = t.T2?.B;
  const delta = Number.isFinite(b0) && Number.isFinite(b2) ? b2 - b0 : null;
  const tile = (value, label, extra) => h("div", { class: "rb-tile" }, value, h("span", {}, label), extra);
  return h(
    "div",
    { class: "rb-tiles" },
    tile(h("b", { "data-count": d.colleges.filter((c) => c.name !== "Muassasa ko'rsatilmagan").length }, "0"), "texnikum"),
    tile(h("b", { "data-count": d.total.students }, "0"), "ro'yxatdan o'tgan o'quvchi"),
    STAGE_KEYS.map((s) => tile(h("b", { "data-count": t[s]?.n || 0 }, "0"), `${STAGE_LABEL[s]} ishtirokchisi`, h("i", { class: `rb-dot st-${s}`, "aria-hidden": "true" }))),
    tile(h("b", {}, delta == null ? "—" : `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(2).replace(".", ",")}`), "B ko'rsatkichi o'sishi (T0 → T2)")
  );
}

function legend() {
  return h("div", { class: "rb-legend", "aria-label": "Bosqichlar" }, STAGE_KEYS.map((s) => h("span", {}, h("i", { class: `rb-swatch st-${s}` }), STAGE_LABEL[s])));
}

function emptyState() {
  return h("div", { class: "rb-empty" }, h("div", { class: "rb-empty-bars", "aria-hidden": "true" }, [62, 78, 90, 45, 70].map((w) => h("i", { style: { width: `${w}%` } }))), h("p", {}, "Hali natijalar yo'q. O'quvchilar diagnostikani topshirib, o'qituvchi baholagach, diagramma shu yerda paydo bo'ladi."));
}

function barChart(rows, metric) {
  return h(
    "div",
    { class: "rb-bars", role: "list" },
    h("div", { class: "rb-axis", "aria-hidden": "true" }, metric.ticks.map((t) => h("span", { style: { left: `${(t / metric.max) * 100}%` } }, metric.short === "T" ? `${t}%` : t))),
    rows.map((c) =>
      h(
        "div",
        { class: `rb-row ${state.focus === c.name ? "focused" : ""}`, role: "listitem" },
        h("button", { class: "rb-name", title: c.name, onclick: () => { state.focus = state.focus === c.name ? null : c.name; render(); } }, h("span", {}, c.name), h("small", {}, `${c.students} o'quvchi`)),
        h(
          "div",
          { class: "rb-track" },
          metric.ticks.map((t) => h("i", { class: "rb-grid-line", style: { left: `${(t / metric.max) * 100}%` }, "aria-hidden": "true" })),
          STAGE_KEYS.map((s) => {
            const st = c.stages[s];
            const v = st?.[state.metric];
            const ok = Number.isFinite(v);
            const n = state.metric === "B" ? st?.complete : st?.n;
            return h(
              "div",
              { class: "rb-bar-line" },
              h("div", {
                class: `rb-bar st-${s} ${ok ? "" : "none"}`,
                style: { "--w": ok ? `${Math.max(1.5, (v / metric.max) * 100)}%` : "0%" },
                tabindex: ok ? "0" : "-1",
                "aria-label": `${c.name}, ${STAGE_LABEL[s]}: ${ok ? metric.fmt(v) : "ma'lumot yo'q"}`,
                onpointerenter: (e) => ok && showTip(e, [c.name, `${STAGE_LABEL[s]}`, `${metric.short}: ${metric.fmt(v)}`, `${n} nafar o'quvchi`]),
                onpointermove: moveTip,
                onpointerleave: hideTip,
                onfocus: (e) => ok && showTip(e, [c.name, STAGE_LABEL[s], `${metric.short}: ${metric.fmt(v)}`, `${n} nafar o'quvchi`]),
                onblur: hideTip,
              }),
              h("span", { class: "rb-val" }, ok ? metric.fmt(v) : "—")
            );
          })
        )
      )
    )
  );
}

function levelChart(c) {
  return h(
    "div",
    { class: "rb-levels" },
    STAGE_KEYS.map((s) => {
      const st = c.stages[s] || { levels: {}, complete: 0 };
      const total = st.complete || 0;
      return h(
        "div",
        { class: "rb-level-row" },
        h("span", { class: "rb-level-stage" }, h("i", { class: `rb-dot st-${s}` }), STAGE_LABEL[s]),
        total
          ? h(
              "div",
              { class: "rb-stack" },
              LEVELS.map(([lv, cls]) => {
                const n = st.levels[lv] || 0;
                const pct = (n / total) * 100;
                return (
                  n > 0 &&
                  h("div", {
                    class: `rb-seg ${cls}`,
                    style: { "--w": `${pct}%` },
                    tabindex: "0",
                    "aria-label": `${STAGE_LABEL[s]}, ${lv} daraja: ${n} nafar (${Math.round(pct)}%)`,
                    onpointerenter: (e) => showTip(e, [STAGE_LABEL[s], `${lv} daraja`, `${n} nafar · ${Math.round(pct)}%`]),
                    onpointermove: moveTip,
                    onpointerleave: hideTip,
                    onfocus: (e) => showTip(e, [STAGE_LABEL[s], `${lv} daraja`, `${n} nafar · ${Math.round(pct)}%`]),
                    onblur: hideTip,
                  }, pct >= 14 ? `${Math.round(pct)}%` : "")
                );
              })
            )
          : h("div", { class: "rb-stack empty" }, "baholangan natija yo'q"),
        h("span", { class: "rb-level-n" }, total ? `n = ${total}` : "")
      );
    }),
    h("div", { class: "rb-legend levels" }, LEVELS.map(([lv, cls]) => h("span", {}, h("i", { class: `rb-swatch ${cls}` }), `${lv} daraja`)))
  );
}

function tableView(d) {
  const fmt = (v, m) => (Number.isFinite(v) ? METRICS[m].fmt(v) : "—");
  const rows = [d.total, ...d.colleges];
  return h(
    "details",
    { class: "rb-table" },
    h("summary", {}, "Jadval ko'rinishi"),
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Texnikum"), h("th", {}, "O'quvchi"), STAGE_KEYS.map((s) => h("th", {}, `${s}: n / M / T / B`)))),
        h("tbody", {}, rows.map((c) => h("tr", { class: c === d.total ? "total" : "" }, h("td", {}, c.name), h("td", {}, c.students), STAGE_KEYS.map((s) => { const st = c.stages[s] || {}; return h("td", {}, `${st.n || 0} / ${fmt(st.M, "M")} / ${fmt(st.T, "T")} / ${fmt(st.B, "B")}`); }))))
      )
    )
  );
}

// ---------- Tooltip ----------
function showTip(e, lines) {
  tip ||= document.body.appendChild(h("div", { class: "rb-tip", role: "tooltip" }));
  tip.replaceChildren(...lines.map((l, i) => (i === 0 ? h("b", {}, l) : h("div", {}, l))));
  tip.classList.add("show");
  moveTip(e);
}
function moveTip(e) {
  if (!tip) return;
  const r = e.target.getBoundingClientRect();
  const x = e.clientX ?? r.left + r.width / 2;
  const y = e.clientY ?? r.top;
  const w = tip.offsetWidth;
  tip.style.left = `${Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2))}px`;
  tip.style.top = `${Math.max(8, y - tip.offsetHeight - 14)}px`;
}
function hideTip() {
  tip?.classList.remove("show");
}

// ---------- Animatsiya: ustunlar ko'ringanda o'sib chiqadi ----------
function animateIn() {
  const bars = root.querySelectorAll(".rb-bar, .rb-seg");
  if (reducedMotion()) {
    bars.forEach((b) => b.classList.add("grown"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const items = e.target.querySelectorAll(".rb-bar, .rb-seg");
        items.forEach((b, i) => {
          b.style.transitionDelay = `${Math.min(i, 24) * 45}ms`;
          requestAnimationFrame(() => b.classList.add("grown"));
        });
        io.unobserve(e.target);
      }
    },
    { threshold: 0.15 }
  );
  root.querySelectorAll(".rb-bars, .rb-levels").forEach((n) => io.observe(n));
}
