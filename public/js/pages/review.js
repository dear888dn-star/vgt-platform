// Kunlik takrorlash: tayanch tushunchalarni oraliq takrorlash (Leitner tizimi) bilan yodlash.
// Quti: 0 — yangi, 1..5 — har to'g'ri javobda keyingi qutiga o'tadi, takrorlash oralig'i uzayadi.
import { h, mount } from "../ui.js";
import { TOPICS } from "../../data/topics.js";
import { loadProgress, progressState, updateSrs, topicCompletion } from "../progress.js";
import { confetti, shake } from "../motion.js";

const INTERVALS = [0, 1, 3, 7, 14, 30]; // kun
const NEW_PER_DAY = 10;
const SESSION = 20;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Barcha kartalar: boshlangan mavzulardagi tushunchalar (hech biri boshlanmagan bo'lsa — 1-mavzu). */
export function allCards() {
  const p = progressState();
  let topics = TOPICS.filter((t) => topicCompletion(t) > 0 || p?.topics?.[t.id]);
  if (!topics.length) topics = TOPICS.slice(0, 1);
  return topics.flatMap((t) => t.glossary.map((g, i) => ({ key: `${t.id}:${i}`, topic: t, term: g.term, def: g.def })));
}

/** Bugun takrorlanadigan kartalar soni (bosh sahifa va menyu uchun). */
export function dueCount() {
  const srs = progressState()?.srs || {};
  const cards = allCards();
  const due = cards.filter((c) => srs[c.key] && srs[c.key].due <= today()).length;
  const fresh = Math.min(NEW_PER_DAY, cards.filter((c) => !srs[c.key]).length);
  return Math.min(SESSION, due + fresh);
}

function buildQueue() {
  const srs = progressState().srs || {};
  const cards = allCards();
  const due = cards.filter((c) => srs[c.key] && srs[c.key].due <= today()).sort((a, b) => srs[a.key].box - srs[b.key].box);
  const fresh = cards.filter((c) => !srs[c.key]).slice(0, NEW_PER_DAY);
  return [...due, ...fresh].slice(0, SESSION);
}

export async function render(el) {
  await loadProgress();
  const queue = buildQueue();
  const total = queue.length;
  const result = { known: 0, again: 0 };
  const srs = progressState().srs || {};
  const boxes = [0, 1, 2, 3, 4, 5].map((b) => allCards().filter((c) => (srs[c.key]?.box ?? 0) === b).length);

  const header = h(
    "div",
    { class: "page-head" },
    h("div", {}, h("h1", {}, "🔁 Kunlik takrorlash"), h("p", { class: "muted" }, "Tayanch tushunchalarni oraliq takrorlash usulida yodlang: bilgan kartangiz kamroq, bilmaganingiz tez-tez qaytadi."))
  );
  const boxesView = h(
    "div",
    { class: "srs-boxes", "aria-label": "Leitner qutilari" },
    boxes.map((n, b) => h("div", { class: `srs-box b${b}` }, h("b", {}, n), h("small", {}, b === 0 ? "yangi" : b === 5 ? "yodlangan" : `${b}-quti · ${INTERVALS[b]} kun`)))
  );

  if (!total) {
    mount(el, header, boxesView, h("div", { class: "card empty" }, h("div", { class: "empty-icon" }, "🎉"), h("h3", {}, "Bugungi takrorlash tugadi!"), h("p", { class: "muted" }, "Ertaga yangi kartalar qaytadi. Yangi mavzularni o'qisangiz, ularning tushunchalari ham shu yerga qo'shiladi."), h("a", { href: "#/topics", class: "btn" }, "📚 Mavzularga o'tish")));
    return;
  }

  let i = 0;
  let flipped = false;
  const bar = h("div", { class: "srs-progress" }, h("i"));
  const counter = h("span", { class: "muted small" });
  const stage = h("div", { class: "srs-stage" });
  const actions = h("div", { class: "srs-actions" });

  const show = () => {
    const c = queue[i];
    flipped = false;
    counter.textContent = `${i + 1} / ${total}`;
    bar.firstChild.style.transform = `scaleX(${i / total})`;
    const card = h(
      "button",
      { class: "srs-card", "aria-label": "Kartani aylantirish", onclick: () => flip() },
      h("div", { class: "srs-face front" }, h("span", { class: "srs-topic" }, c.topic.icon, ` ${c.topic.num}-mavzu`), h("div", { class: "srs-term" }, c.term), h("span", { class: "srs-tap" }, "Ta'rifni eslang va kartani bosing (Probel)")),
      h("div", { class: "srs-face back" }, h("span", { class: "srs-topic" }, c.term), h("div", { class: "srs-def" }, c.def))
    );
    stage.replaceChildren(card);
    actions.replaceChildren(h("button", { class: "btn lg block", onclick: () => flip() }, "↻ Javobni ko'rish"));
  };

  const flip = () => {
    if (flipped) return;
    flipped = true;
    stage.querySelector(".srs-card").classList.add("flipped");
    actions.replaceChildren(
      h("button", { class: "btn lg ghost srs-again", onclick: () => answer(false) }, "😕 Bilmadim", h("kbd", {}, "1")),
      h("button", { class: "btn lg srs-good", onclick: () => answer(true) }, "😊 Bildim", h("kbd", {}, "2"))
    );
  };

  const answer = (ok) => {
    const c = queue[i];
    updateSrs((cards, stats) => {
      const box = cards[c.key]?.box ?? 0;
      const nb = ok ? Math.min(5, box + 1) : 1;
      cards[c.key] = { box: nb, due: ok ? addDays(INTERVALS[nb]) : today() };
      stats.reviews = (stats.reviews || 0) + 1;
      stats.lastReview = today();
    });
    const card = stage.querySelector(".srs-card");
    if (ok) {
      result.known++;
      card.classList.add("fly-right");
    } else {
      result.again++;
      shake(card);
      card.classList.add("fly-left");
      if (queue.filter((q) => q.key === c.key).length < 2) queue.push(c); // sessiya oxirida yana bir bor
    }
    setTimeout(() => {
      i++;
      if (i >= queue.length) return finish();
      show();
    }, 380);
  };

  const finish = () => {
    document.removeEventListener("keydown", onKey);
    bar.firstChild.style.transform = "scaleX(1)";
    const pct = Math.round((result.known / Math.max(1, result.known + result.again)) * 100);
    if (pct >= 70) confetti();
    stage.replaceChildren(h("div", { class: "card srs-done" }, h("div", { class: "empty-icon" }, pct >= 70 ? "🏆" : "💪"), h("h2", {}, "Takrorlash yakunlandi!"), h("p", {}, `Bildingiz: ${result.known} · Qayta ko'rildi: ${result.again} · Aniqlik: ${pct}%`), h("p", { class: "muted" }, "Har bir takrorlangan karta +1 XP beradi. Ertaga yana keling — seriyangizni uzmang! 🔥")));
    actions.replaceChildren(h("a", { href: "#/passport", class: "btn" }, "🛂 Pasportim"), h("a", { href: "#/topics", class: "btn ghost" }, "📚 Mavzular"));
    counter.textContent = "";
  };

  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === " " || e.key === "Enter") {
      if (!flipped) {
        e.preventDefault();
        flip();
      }
    } else if (flipped && e.key === "1") answer(false);
    else if (flipped && e.key === "2") answer(true);
  };
  document.addEventListener("keydown", onKey);

  mount(el, header, boxesView, h("div", { class: "srs-wrap" }, h("div", { class: "row between" }, h("b", {}, "Bugungi to'plam"), counter), bar, stage, actions));
  show();
  return () => document.removeEventListener("keydown", onKey);
}
