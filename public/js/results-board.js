// Sayt pastidagi ochiq monitoring oynasi: texnikumlar kesimida T0 / T1 / T2 diagnostika natijalari.
// Faqat umumlashtirilgan ko'rsatkichlar (/api/public/results) ko'rsatiladi.
import { h } from "./ui.js";
import { api } from "./api.js";
import { reducedMotion, enhance } from "./motion.js";
import { ARCHIVE, ARCHIVE_LEVELS, codesFrom, levelMean, archiveCollegeOf, addLevels } from "../data/research-archive.js";
import { welchT, chiSquare } from "./stats.js";

const STAGE_KEYS = ["T0", "T1", "T2"];
const STAGE_LABEL = { T0: "Boshlang'ich (T0)", T1: "Oraliq (T1)", T2: "Yakuniy (T2)" };
const METRICS = {
  B: { label: "Integral ko'rsatkich (B)", short: "B", max: 5, ticks: [0, 1, 2, 3, 4, 5], fmt: (v) => v.toFixed(2).replace(".", ","), hint: "B = (M + KK + AR) / 3, 3–5 ballik shkala. Birlashgan va arxiv ko'rinishida — daraja kodlari (past 3, o'rta 4, yuqori 5) bo'yicha o'rtacha, dissertatsiya metodikasiga mos." },
  M: { label: "Motivatsiya (anketa, M)", short: "M", max: 5, ticks: [0, 1, 2, 3, 4, 5], fmt: (v) => v.toFixed(2).replace(".", ","), hint: "A-bo'lim anketasi: 15 fikr bo'yicha o'rtacha ball (1–5)." },
  T: { label: "Bilim testi (T, %)", short: "T", max: 100, ticks: [0, 25, 50, 75, 100], fmt: (v) => `${Math.round(v)}%`, hint: "B-bo'lim testi: to'g'ri javoblar ulushi." },
};
const LEVELS = [
  ["Past", "lv-low"],
  ["O'rta", "lv-mid"],
  ["Yuqori", "lv-high"],
];

let state = { data: null, metric: "B", focus: null, loadedAt: 0, source: "all", cohort: "all" };
const SOURCES = { all: "Birlashgan", archive: "Tajriba-sinov 2024–2026", platform: "Platforma (yangi)" };
const COHORT_LABEL = { all: "Barchasi", experimental: "TG", control: "NG" };

// ---------- Arxiv (dissertatsiya) + platforma ma'lumotlarini yagona ko'rinishga keltirish ----------
const toArr = (lv) => (Array.isArray(lv) ? lv : ARCHIVE_LEVELS.map((k) => lv?.[k] || 0));
const sumArr = (a) => a.reduce((x, y) => x + y, 0);

/** Platforma bosqichi: tanlangan guruh (TG/NG/barchasi) bo'yicha darajalar, B yig'indisi, M, T. */
function platformPart(st, cohort) {
  if (!st) return null;
  if (cohort === "all") return { levels: toArr(st.levels), Bsum: Number.isFinite(st.B) ? st.B * st.complete : 0, n: st.complete || 0, total: st.n || 0, M: st.M, T: st.T };
  const c = st.cohorts?.[cohort];
  return c ? { levels: c.levels, Bsum: c.Bsum, n: c.n, total: c.n, M: null, T: null } : null;
}
/** Arxiv bosqichi: to'liq darajalar yoki (T1 texnikumlar) faqat yuqori daraja soni. */
function archivePart(levels, cohort) {
  if (!levels) return null;
  const pick = (g) => levels[g];
  const parts = cohort === "all" ? [pick("experimental"), pick("control")] : [pick(cohort)];
  if (parts.some((x) => !Array.isArray(x))) return { partialHigh: parts.reduce((s, x) => s + (x?.Yuqori || 0), 0) };
  const lv = addLevels(...parts);
  return { levels: lv, n: sumArr(lv) };
}
function mergeStage(arch, plat, source) {
  const useA = source !== "platform" && arch;
  const useP = source !== "archive" && plat && plat.total > 0;
  if (useA && arch.partialHigh != null) {
    return { n: arch.partialHigh, complete: 0, levels: {}, partialHigh: arch.partialHigh, B: null, M: null, T: null };
  }
  const levels = addLevels(useA ? arch.levels : null, useP ? plat.levels : null);
  const complete = sumArr(levels);
  // Birlashgan va arxiv rejimida B — daraja kodlari (3/4/5) bo'yicha (dissertatsiya metodikasi); platformada — haqiqiy B.
  const B = source === "platform" ? (plat?.n ? plat.Bsum / plat.n : null) : levelMean(levels);
  return {
    n: (useA ? arch.n : 0) + (useP ? plat.total : 0),
    complete,
    levels: Object.fromEntries(ARCHIVE_LEVELS.map((k, i) => [k, levels[i]])),
    levelsArr: levels,
    B: Number.isFinite(B) ? B : null,
    M: useP ? plat.M : null,
    T: useP ? plat.T : null,
  };
}
function buildView(d, source, cohort) {
  const rows = new Map();
  const row = (name) => {
    if (!rows.has(name)) rows.set(name, { name, students: 0, arch: null, plat: [] });
    return rows.get(name);
  };
  if (source !== "platform") for (const a of ARCHIVE.colleges) row(a.name).arch = a;
  if (source !== "archive") for (const c of d?.colleges || []) {
    const a = archiveCollegeOf(c.name);
    const r = row(a && source !== "platform" ? a.name : c.name);
    r.plat.push(c);
  }
  const nOf = (n) => (cohort === "all" ? n.experimental + n.control : n[cohort]);
  const stages = (arch, plats) => Object.fromEntries(STAGE_KEYS.map((s) => {
    const parts = plats.map((p) => platformPart(p.stages[s], cohort)).filter(Boolean);
    const plat = parts.length ? { levels: addLevels(...parts.map((p) => p.levels)), Bsum: parts.reduce((x, p) => x + p.Bsum, 0), n: parts.reduce((x, p) => x + p.n, 0), total: parts.reduce((x, p) => x + p.total, 0), M: parts.length === 1 ? parts[0].M : null, T: parts.length === 1 ? parts[0].T : null } : null;
    return [s, mergeStage(arch ? archivePart(arch.levels[s], cohort) : null, plat, source)];
  }));
  const colleges = [...rows.values()].map((r) => ({
    name: r.name,
    students: (r.arch && source !== "platform" ? nOf(r.arch.n) : 0) + (source !== "archive" ? r.plat.reduce((x, c) => x + c.students, 0) : 0),
    archive: Boolean(r.arch && source !== "platform"),
    stages: stages(r.arch, r.plat),
  })).sort((a, b) => b.students - a.students);
  const total = {
    name: "Barcha texnikumlar",
    students: (source !== "platform" ? nOf(ARCHIVE.total.n) : 0) + (source !== "archive" ? d?.total.students || 0 : 0),
    stages: stages(source !== "platform" ? ARCHIVE.total : null, source !== "archive" && d ? [d.total] : []),
  };
  return { updatedAt: d?.updatedAt || new Date().toISOString(), colleges, total };
}
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
  if (!state.data && state.source === "platform") {
    root.replaceChildren(h("div", { class: "container rb-inner" }, header(null), sourceBar(), h("p", { class: "muted" }, "Natijalarni yuklab bo'lmadi.")));
    return;
  }
  const d = buildView(state.data, state.source, state.cohort);
  const metric = METRICS[state.metric];
  const rows = d.colleges.filter((c) => STAGE_KEYS.some((s) => hasValue(c.stages[s], state.metric)));
  const focus = d.colleges.find((c) => c.name === state.focus) || d.total;

  root.replaceChildren(
    h(
      "div",
      { class: "container rb-inner" },
      header(d),
      sourceBar(),
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
      cohortCard(),
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
    h("p", { class: "muted" }, "Kompleks diagnostikaning boshlang'ich, oraliq va yakuniy bosqichlari bo'yicha umumlashtirilgan natijalar. 2024–2026-yillardagi tajriba-sinov natijalari (dissertatsiya, III bob) platformadagi yangi diagnostikalar bilan yagona mezon — B indeksi darajalari bo'yicha birlashtiriladi. Shaxsiy ma'lumotlar ko'rsatilmaydi.", d && state.source !== "archive" && h("span", { class: "rb-updated" }, ` Yangilangan: ${new Date(d.updatedAt).toLocaleString("uz-UZ", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`))
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

function sourceBar() {
  const seg = (obj, key, aria) => h("div", { class: "segmented", role: "tablist", "aria-label": aria },
    Object.entries(obj).map(([k, label]) => h("button", { class: `seg ${state[key] === k ? "active" : ""}`, role: "tab", "aria-selected": String(state[key] === k), onclick: () => { state[key] = k; state.focus = null; render(); } }, label)));
  return h("div", { class: "rb-filters rb-source" },
    h("div", { class: "row wrap" }, h("span", { class: "muted small" }, "Manba:"), seg(SOURCES, "source", "Ma'lumotlar manbai"), h("span", { class: "muted small" }, "Guruh:"), seg(COHORT_LABEL, "cohort", "Tadqiqot guruhi")),
    state.source !== "platform" ? h("span", { class: "rb-archive-badge", title: ARCHIVE.design }, `📚 ${ARCHIVE.source} · n = ${ARCHIVE.total.n.experimental + ARCHIVE.total.n.control}`) : null);
}

/** TG va NG taqqoslash: har bir bosqichda darajalar, o'rtacha B va Styudent / χ² mezonlari. */
function cohortCard() {
  const tg = buildView(state.data, state.source, "experimental").total.stages;
  const ng = buildView(state.data, state.source, "control").total.stages;
  const f2 = (v) => (Number.isFinite(v) ? v.toFixed(2).replace(".", ",") : "—");
  const fp = (p) => (!Number.isFinite(p) ? "—" : p < 0.001 ? "p < 0,001" : `p = ${p.toFixed(3).replace(".", ",")}`);
  const rows = STAGE_KEYS.map((s) => {
    const a = tg[s], b = ng[s];
    if (!a?.complete || !b?.complete) return null;
    const t = welchT(codesFrom(a.levelsArr), codesFrom(b.levelsArr));
    const chi = chiSquare([a.levelsArr, b.levelsArr]);
    const sig = t && t.p < 0.05;
    const bar = (st, label) => h("div", { class: "rb-cmp-line" }, h("b", {}, label),
      h("div", { class: "rb-stack" }, LEVELS.map(([lv, cls]) => {
        const n = st.levels[lv] || 0;
        const pct = (n / st.complete) * 100;
        return n > 0 && h("div", { class: `rb-seg ${cls}`, style: { "--w": `${pct}%` }, tabindex: "0", "aria-label": `${label}, ${lv}: ${n} (${Math.round(pct)}%)`, onpointerenter: (e) => showTip(e, [`${label} — ${STAGE_LABEL[s]}`, `${lv} daraja`, `${n} nafar · ${pct.toFixed(1).replace(".", ",")}%`]), onpointermove: moveTip, onpointerleave: hideTip }, pct >= 12 ? `${Math.round(pct)}%` : "");
      })),
      h("span", { class: "rb-cmp-mean" }, `x̄ = ${f2(st.B)}`, h("small", {}, ` n=${st.complete}`)));
    return h("div", { class: "rb-cmp-stage" },
      h("div", { class: "rb-cmp-head" }, h("span", {}, h("i", { class: `rb-dot st-${s}` }), STAGE_LABEL[s]),
        t ? h("span", { class: `rb-cmp-stat ${sig ? "sig" : ""}` }, `t = ${f2(t.t)}; ${fp(t.p)}; d = ${f2(t.d)}${chi ? `; χ² = ${f2(chi.chi2)}` : ""}`, sig ? " ✓" : "") : null),
      bar(a, "TG"), bar(b, "NG"));
  }).filter(Boolean);
  if (!rows.length) return null;
  return h("div", { class: "rb-card rb-cmp" },
    h("h3", {}, "Tajriba (TG) va nazorat (NG) guruhlari: B indeksi darajalari"),
    h("p", { class: "muted small" }, "Welch t-mezoni, Koen d va Pirson χ² — daraja kodlari (3, 4, 5) bo'yicha. ✓ — farq statistik ahamiyatli (p < 0,05)."),
    rows,
    h("div", { class: "rb-legend levels" }, LEVELS.map(([lv, cls]) => h("span", {}, h("i", { class: `rb-swatch ${cls}` }), `${lv} daraja`))));
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
      if (st.partialHigh != null) {
        return h("div", { class: "rb-level-row" }, h("span", { class: "rb-level-stage" }, h("i", { class: `rb-dot st-${s}` }), STAGE_LABEL[s]), h("div", { class: "rb-stack empty" }, `Oraliq monitoring: yuqori daraja — ${st.partialHigh} nafar (to'liq taqsimot e'lon qilinmagan)`), h("span", { class: "rb-level-n" }, ""));
      }
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
  root.querySelectorAll(".rb-bars, .rb-levels, .rb-cmp").forEach((n) => io.observe(n));
}
