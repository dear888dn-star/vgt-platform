// Kasb standarti bo'yicha kompetensiya xaritasini hisoblash va ko'rsatish.
import { h } from "./ui.js";
import { TOPICS } from "../data/topics.js";
import { competencyMap, COMPETENCY } from "../data/standard.js";
import { completionFrom } from "./progress.js";

/** Serverdan kelgan dalillarni competencyMap formatiga o'tkazadi. */
export function mapFromEvidence(ev) {
  const topics = Object.fromEntries(TOPICS.map((t) => [t.id, completionFrom(ev.progress, t)]));
  const selfStudy = (ev.selfStudy || []).map((s) => ({ topicId: s.taskId.split("-")[0], grade: s.grade }));
  return competencyMap({ topics, selfStudy, trainer: ev.trainer, routes: ev.routes });
}

const LEVEL_CLASS = { Shakllangan: "badge-ok", Rivojlanmoqda: "badge-warn", "Boshlang'ich": "lvl-3", "Dalil yo'q": "" };

export function competencyChips(codes) {
  return h("div", { class: "chips" }, codes.map((c) => h("a", { href: `#/standard?c=${encodeURIComponent(c)}`, class: `chip ${c.startsWith("KK") ? "chip-kk" : "chip-soft"}`, title: COMPETENCY[c]?.title || c }, c)));
}

export function competencyTable(map, { onlyWithEvidence = false } = {}) {
  const rows = map.filter((c) => !onlyWithEvidence || c.count);
  return h(
    "div",
    { class: "comp-map" },
    rows.map((c) =>
      h(
        "div",
        { class: "comp-row" },
        h("div", { class: "comp-title" }, h("b", {}, c.code), " ", h("span", { class: "small" }, c.title)),
        h("div", { class: "comp-bar" }, h("div", { class: "progress" }, h("div", { class: "progress-fill", style: { width: `${c.value ?? 0}%` } })), h("span", { class: "small muted" }, c.value == null ? "—" : `${Math.round(c.value)}%`)),
        h("div", {}, h("span", { class: `badge ${LEVEL_CLASS[c.level]}` }, c.level), c.count > 0 && h("div", { class: "small muted" }, `${c.count} ta dalil: ${c.sources.join(", ")}`))
      )
    )
  );
}
