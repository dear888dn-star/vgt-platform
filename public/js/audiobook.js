// Audiokitob: o'quv qo'llanma matnini AI ovozi (Gemini TTS, o'zbekcha) bilan xatboshilab o'qish,
// joriy xatboshini belgilash va unga aylantirish, pastki mini-pleyer, keyingi xatboshini oldindan tayyorlash.
import { h, toast } from "./ui.js";
import { createNarrator, aiVoiceReady } from "./narrator.js";
import { createVoice } from "./voice.js";

const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();
const READABLE = "p, li, h3, h4, blockquote";

/** Mavzu matnidan o'qiladigan xatboshilar (DOM'siz — oldindan ovoz tayyorlash uchun ham). */
export function bookParagraphs(topic) {
  const out = [];
  const parser = new DOMParser();
  topic.sections.forEach((s, si) => {
    if (s.title) out.push({ si, text: clean(s.title) });
    const doc = parser.parseFromString(`<div>${s.html}</div>`, "text/html");
    doc.querySelectorAll(READABLE).forEach((el) => {
      if (el.closest("table") || (el.tagName === "LI" && el.querySelector("p"))) return;
      const text = clean(el.textContent);
      if (text.length >= 25) out.push({ si, text });
    });
  });
  return out;
}

/** Sahifadagi (render qilingan) bo'limlardan o'qish ro'yxati: matn + DOM element. */
function domPlaylist(root) {
  const items = [];
  root.querySelectorAll(".book-section").forEach((sec) => {
    const head = sec.querySelector(".section-heading");
    if (head) items.push({ el: head, text: clean(head.textContent.replace(/🎧.*$/, "")), sec });
    sec.querySelectorAll(`.book-text ${READABLE.split(", ").join(", .book-text ")}`).forEach((el) => {
      if (el.closest("table") || (el.tagName === "LI" && el.querySelector("p"))) return;
      const text = clean(el.textContent);
      if (text.length >= 25) items.push({ el, text, sec });
    });
  });
  return items;
}

export function audiobook(topic, root) {
  let items = [];
  let idx = -1;
  let playing = false;
  let rate = 1;
  let autoscroll = true;
  let my = 0;
  const bvoice = window.speechSynthesis ? createVoice({ id: "book", language: "o'zbek", speakers: { Ustoz: "female" } }, { engine: "browser", persist: false }) : null;
  let noticed = false;
  const narr = createNarrator({
    onLevel: (l) => bar.style.setProperty("--lvl", l.toFixed(3)),
    onNotice: (m) => !noticed && ((noticed = true), toast(m, "warn")),
    fallback: bvoice && { speak: (t) => bvoice.speak(t), stop: () => bvoice.cancelSpeech() },
  });

  const title = h("b", { class: "ab-title" });
  const count = h("small", { class: "ab-count" });
  const playBtn = h("button", { class: "ab-btn ab-play", "aria-label": "Ijro / pauza", onclick: () => (playing ? pause() : resume()) }, "▶");
  const progress = h("div", { class: "ab-progress" }, h("i"));
  const engineTag = h("span", { class: "ab-engine" });
  const bar = h(
    "div",
    { class: "ab-bar", role: "region", "aria-label": "Audiokitob pleyeri" },
    progress,
    h("div", { class: "ab-eq", "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("i"), h("i")),
    h("div", { class: "ab-info" }, h("small", {}, `🎧 ${topic.num}-mavzu · audiokitob `, engineTag), title, count),
    h("div", { class: "ab-controls" },
      h("button", { class: "ab-btn", "aria-label": "Oldingi xatboshi", onclick: () => go(idx - 1) }, "⏮"),
      playBtn,
      h("button", { class: "ab-btn", "aria-label": "Keyingi xatboshi", onclick: () => go(idx + 1) }, "⏭"),
      h("button", { class: "ab-btn ab-rate", title: "Tezlik", onclick: (e) => {
        rate = rate === 1 ? 1.2 : rate === 1.2 ? 1.4 : rate === 1.4 ? 0.85 : 1;
        e.currentTarget.textContent = `×${String(rate).replace(".", ",")}`;
        narr.setRate(rate);
        bvoice?.setRate(rate);
      } }, "×1"),
      h("button", { class: "ab-btn on", title: "Matn bo'ylab avtomatik aylantirish", onclick: (e) => {
        autoscroll = !autoscroll;
        e.currentTarget.classList.toggle("on", autoscroll);
      } }, "⇅"),
      h("button", { class: "ab-btn", "aria-label": "Yopish", onclick: () => close() }, "✕"))
  );

  function mark() {
    root.querySelectorAll(".ab-reading").forEach((e) => e.classList.remove("ab-reading"));
    const it = items[idx];
    if (!it) return;
    it.el.classList.add("ab-reading");
    title.textContent = clean(it.sec.querySelector(".section-heading")?.textContent.replace(/🎧.*$/, "") || topic.title);
    count.textContent = `${idx + 1} / ${items.length}`;
    progress.firstChild.style.transform = `scaleX(${(idx + 1) / items.length})`;
    if (autoscroll) it.el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function go(i) {
    if (i < 0) i = 0;
    if (i >= items.length) return finish();
    idx = i;
    const me = ++my;
    narr.stop();
    mark();
    if (!playing) return;
    narr.prefetch(items[i + 1]?.text);
    narr.prefetch(items[i + 2]?.text);
    const res = await narr.speak(items[i].text);
    engineTag.textContent = res === "ai" ? "· AI ovoz" : res === "browser" ? "· brauzer ovozi" : "";
    if (me !== my || !playing) return;
    setTimeout(() => me === my && playing && go(idx + 1), 250);
  }

  function finish() {
    playing = false;
    bar.classList.remove("playing");
    playBtn.textContent = "▶";
    root.querySelectorAll(".ab-reading").forEach((e) => e.classList.remove("ab-reading"));
    toast("🎧 Mavzu matni oxirigacha tinglandi!", "ok");
    root.dispatchEvent(new CustomEvent("audiobook:done"));
    idx = -1;
  }

  function resume() {
    playing = true;
    bar.classList.add("playing");
    playBtn.textContent = "⏸";
    go(Math.max(0, idx));
  }

  function pause() {
    playing = false;
    my++;
    narr.stop();
    bar.classList.remove("playing");
    playBtn.textContent = "▶";
  }

  function close() {
    pause();
    root.querySelectorAll(".ab-reading").forEach((e) => e.classList.remove("ab-reading"));
    bar.classList.remove("open");
  }

  /** Belgilangan bo'limdan (yoki boshidan) tinglashni boshlash. */
  async function start(section) {
    items = domPlaylist(root);
    if (!items.length) return;
    document.body.append(bar);
    requestAnimationFrame(() => bar.classList.add("open"));
    if (!(await aiVoiceReady())) toast("AI ovozi ulanmagan — brauzer ovozi ishlatiladi (o'zbekcha talaffuz to'liq bo'lmasligi mumkin).", "warn");
    const from = section ? items.findIndex((it) => it.sec === section) : 0;
    idx = Math.max(0, from);
    playing = true;
    bar.classList.add("playing");
    playBtn.textContent = "⏸";
    go(idx);
  }

  // Xatboshini ikki marta bosish — shu joydan tinglash
  const onDbl = (e) => {
    if (!bar.classList.contains("open")) return;
    const el = e.target.closest(READABLE);
    const i = items.findIndex((it) => it.el === el || it.el.contains(e.target));
    if (i >= 0) {
      playing = true;
      bar.classList.add("playing");
      playBtn.textContent = "⏸";
      go(i);
    }
  };
  root.addEventListener("dblclick", onDbl);

  return {
    start,
    destroy() {
      pause();
      bar.remove();
      bvoice?.destroy();
      root.removeEventListener("dblclick", onDbl);
    },
  };
}
