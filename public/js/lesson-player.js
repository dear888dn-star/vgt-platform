// "Animatsion dars": mavzu o'quv qo'llanmadan avtomatik sahnalarga ajratiladi va video kabi ijro etiladi —
// jonli piktogrammalar, so'zma-so'z chiquvchi matn, subtitrlar va ovozli hikoya (brauzer ovozi).
import { h } from "./ui.js";
import { createVoice } from "./voice.js";
import { createNarrator, aiVoiceReady } from "./narrator.js";
import { toast } from "./ui.js";
import { confetti, reducedMotion } from "./motion.js";
import { sceneSVG } from "./landmarks.js";

const ICONS = [
  [/mehmonxona|hotel|joylashtir/i, "🏨"], [/bron|rezerv/i, "📅"], [/turist|sayyoh|mijoz|mehmon/i, "🧳"], [/gid|ekskursiya/i, "🧭"],
  [/internet|veb|sayt|onlayn/i, "🌐"], [/tarmoq|wi-?fi|router|lokal/i, "🛜"], [/mobil|smartfon|ilova/i, "📱"], [/kompyuter|noutbuk|server/i, "💻"],
  [/printer|nusxa/i, "🖨️"], [/skaner/i, "📠"], [/proyektor|ekran|displey/i, "📽️"], [/video|kamera|multimedia/i, "🎬"],
  [/to'lov|to‘lov|karta|pos|humo|uzcard|pul/i, "💳"], [/xavfsiz|himoya|parol|shifr/i, "🔐"], [/virus|hujum|firibgar/i, "🛡️"],
  [/ma'lumot|ma’lumot|ma‘lumot|baza|sql/i, "🗄️"], [/jadval|excel|hisob|diagramma|statist/i, "📊"], [/matn|word|hujjat/i, "📝"],
  [/taqdimot|slayd|powerpoint/i, "🎞️"], [/bulut|cloud/i, "☁️"], [/blokcheyn|blockchain|kripto/i, "⛓️"], [/sun'iy intellekt|sun’iy intellekt|ai\b|chatbot/i, "🤖"],
  [/virtual|vr\b|ar\b|360/i, "🥽"], [/xarita|gps|geo/i, "🗺️"], [/elektron hukumat|davlat xizmat|my\.gov/i, "🏛️"], [/savdo|tijorat|marketpleys|do'kon/i, "🛒"],
  [/marketing|reklama|ijtimoiy tarmoq/i, "📣"], [/pochta|e-mail|email/i, "✉️"], [/axborot tizim/i, "🧩"], [/samarqand|buxoro|xiva|toshkent|meros/i, "🕌"],
];

const strip = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const sentences = (t) => (t.match(/[^.!?]+[.!?]+/g) || [t]).map((s) => s.trim()).filter((s) => s.length > 20);

function iconsFor(text, fallback) {
  const out = [];
  for (const [re, icon] of ICONS) if (re.test(text) && !out.includes(icon)) out.push(icon);
  return (out.length ? out : [fallback]).slice(0, 6);
}

export function buildScenes(topic) {
  const scenes = [{ type: "intro", title: topic.title, kicker: `${topic.num}-mavzu`, text: topic.goal, narration: `${topic.num}-mavzu. ${topic.title}. ${topic.goal}` }];
  const titled = topic.sections.filter((s) => s.title).slice(0, 8);
  titled.forEach((s, i) => {
    const plain = strip(s.html);
    const sum = sentences(plain).slice(0, 2).join(" ").slice(0, 320);
    const terms = topic.glossary.filter((g) => plain.toLowerCase().includes(g.term.toLowerCase().slice(0, Math.max(5, g.term.length - 2)))).slice(0, 4).map((g) => g.term);
    const title = s.title.replace(/^\d+\.\d+\.\s*/, "");
    scenes.push({ type: "section", kicker: `${i + 1}-bo'lim`, title, text: sum || title, terms, icons: iconsFor(`${title} ${plain.slice(0, 3000)}`, topic.icon), narration: `${title}. ${sum}` });
  });
  const gl = topic.glossary.slice(0, 4).map((g) => ({ term: g.term, def: (sentences(g.def)[0] || g.def).slice(0, 150) }));
  if (gl.length) scenes.push({ type: "glossary", kicker: "Tayanch tushunchalar", title: "Eslab qoling", items: gl, narration: `Asosiy tushunchalar: ${gl.map((g) => g.term).join(", ")}.` });
  scenes.push({ type: "outro", kicker: "Dars yakunlandi", title: "Ajoyib! Endi bilimingizni sinab ko'ring", text: `${topic.quiz.length} ta test, ${topic.questions.length} ta nazorat savoli va AI Ustoz sizni kutmoqda.`, narration: "Ajoyib! Dars yakunlandi. Endi bilimingizni testda sinab ko'ring." });
  return scenes;
}

const words = (t) => t.split(/\s+/).filter(Boolean);

export function lessonPlayer(topic, { onComplete } = {}) {
  const scenes = buildScenes(topic);
  let idx = 0;
  let playing = false;
  let muted = (() => {
    try {
      return localStorage.getItem("vgt.lesson.muted") === "1";
    } catch {
      return false;
    }
  })();
  let captions = true;
  let rate = 1;
  let timer = null;
  let token = 0;
  let started = false;
  const bvoice = window.speechSynthesis ? createVoice({ id: "lesson", language: "o'zbek", speakers: { Ustoz: "female" } }, { engine: "browser", persist: false }) : null;
  let noticed = false;
  // AI ovozi (Gemini, o'zbekcha) — asosiy; ishlamasa brauzer ovozi.
  const voice = createNarrator({
    onLevel: (l) => player?.style.setProperty("--lvl", l.toFixed(3)),
    onNotice: (m) => !noticed && ((noticed = true), toast(m, "warn")),
    fallback: bvoice && { speak: (t) => bvoice.speak(t), stop: () => bvoice.cancelSpeech() },
  });
  const voiceOpts = { style: "narrator" };

  const stage = h("div", { class: "lp-stage", tabindex: "0", "aria-label": `${topic.title} — animatsion dars` });
  const caption = h("div", { class: "lp-caption", "aria-live": "polite" });
  const bars = h("div", { class: "lp-bars" }, scenes.map((_, i) => h("button", { class: "lp-bar", "aria-label": `${i + 1}-sahna`, onclick: () => go(i) }, h("i"))));
  const playBtn = h("button", { class: "lp-btn lp-play", "aria-label": "Ijro etish", onclick: () => toggle() }, "▶");
  const muteBtn = h("button", { class: "lp-btn", title: "Ovoz", "aria-label": "Ovozni yoqish/o'chirish", onclick: () => setMuted(!muted) }, muted ? "🔇" : "🔊");
  const ccBtn = h("button", { class: "lp-btn on", title: "Subtitrlar", "aria-label": "Subtitrlar", onclick: () => { captions = !captions; ccBtn.classList.toggle("on", captions); caption.classList.toggle("hidden", !captions); } }, "CC");
  const rateBtn = h("button", { class: "lp-btn", title: "Tezlik", onclick: () => { rate = rate === 1 ? 1.25 : rate === 1.25 ? 0.85 : 1; rateBtn.textContent = `×${String(rate).replace(".", ",")}`; voice.setRate(rate); bvoice?.setRate(rate); } }, "×1");
  const counter = h("span", { class: "lp-count" });
  const voiceBadge = h("span", { class: "lp-voice-badge hidden", title: "Gemini AI ovozi — o'zbek tilida" }, "🔊 AI ovoz");
  aiVoiceReady().then((ok) => voiceBadge.classList.toggle("hidden", !ok));
  const poster = h(
    "button",
    { class: "lp-poster", "aria-label": "Animatsion darsni boshlash", onclick: () => toggle() },
    h("span", { class: "lp-poster-play" }, "▶"),
    h("b", {}, "Animatsion dars"),
    h("small", {}, `${scenes.length} sahna · ~${Math.max(2, Math.round(scenes.reduce((n, s) => n + words(s.narration).length, 0) / 130))} daqiqa · ovoz va subtitrlar bilan`)
  );

  const player = h(
    "div",
    { class: "lesson-player" },
    h("div", { class: "lp-screen" }, stage, caption, poster),
    bars,
    h("div", { class: "lp-controls" },
      h("button", { class: "lp-btn", "aria-label": "Oldingi sahna", onclick: () => go(idx - 1) }, "⏮"),
      playBtn,
      h("button", { class: "lp-btn", "aria-label": "Keyingi sahna", onclick: () => go(idx + 1) }, "⏭"),
      counter,
      h("span", { class: "lp-spacer" }),
      voiceBadge, muteBtn, ccBtn, rateBtn,
      h("button", { class: "lp-btn", title: "To'liq ekran", "aria-label": "To'liq ekran", onclick: () => (document.fullscreenElement ? document.exitFullscreen() : player.requestFullscreen?.().catch(() => {})) }, "⛶"))
  );

  function setMuted(m) {
    muted = m;
    muteBtn.textContent = muted ? "🔇" : "🔊";
    try {
      localStorage.setItem("vgt.lesson.muted", muted ? "1" : "0");
    } catch {}
    if (muted) voice.stop();
    if (playing) go(idx, true);
  }

  function renderScene(s, i) {
    const wrap = h("div", { class: `lp-scene lp-${s.type}` });
    const bgImg = topic.image && (s.type === "intro" || s.type === "outro") && h("img", { class: "lp-bg-img", src: topic.image, alt: "" });
    const bgScene = !topic.image && (s.type === "intro" || s.type === "outro") && h("div", { class: "lp-bg-scene", html: sceneSVG({ landmark: ["registan", "khiva", "bukhara", "guramir"][topic.num % 4], time: s.type === "outro" ? "sunset" : "day" }) });
    wrap.append(h("div", { class: "lp-blobs", "aria-hidden": "true" }, h("i"), h("i"), h("i")));
    if (bgImg) wrap.append(bgImg);
    if (bgScene) wrap.append(bgScene);
    const titleEl = h("h3", { class: `lp-title ${s.title.length > 38 ? "long" : ""}` }, words(s.title).map((w, k) => [h("span", { style: { "--k": k } }, w), " "]));
    if (s.type === "intro" || s.type === "outro") {
      wrap.append(
        h(
          "div",
          { class: "lp-center" },
          h("div", { class: "lp-emoji" }, s.type === "outro" ? "🏆" : topic.icon),
          h("div", { class: "lp-kicker" }, s.kicker),
          titleEl,
          h("p", { class: "lp-text" }, s.text),
          s.type === "outro" &&
            h("div", { class: "lp-actions" },
              h("a", { class: "btn", href: `#/topics/${topic.id}?tab=quiz`, onclick: () => setTimeout(() => document.getElementById("learn-quiz")?.scrollIntoView({ behavior: "smooth" }), 50) }, "✅ Testni boshlash"),
              h("button", { class: "btn ghost", onclick: () => go(0) }, "🔁 Qayta ko'rish"))
        )
      );
    } else if (s.type === "section") {
      const n = s.icons.length;
      const orbit = h(
        "div",
        { class: "lp-orbit" },
        h("svg", { class: "lp-lines", viewBox: "0 0 200 200", "aria-hidden": "true", html: s.icons.map((_, k) => { const a = (k / n) * Math.PI * 2 - Math.PI / 2; return `<line x1="100" y1="100" x2="${100 + Math.cos(a) * 78}" y2="${100 + Math.sin(a) * 78}" style="--k:${k}"/>`; }).join("") }),
        h("div", { class: "lp-core" }, topic.icon),
        s.icons.map((ic, k) => {
          const a = (k / n) * Math.PI * 2 - Math.PI / 2;
          return h("span", { class: "lp-node", style: { left: `${50 + Math.cos(a) * 39}%`, top: `${50 + Math.sin(a) * 39}%`, "--k": k } }, ic);
        })
      );
      wrap.append(
        h("div", { class: "lp-split" },
          orbit,
          h("div", { class: "lp-card" },
            h("div", { class: "lp-kicker" }, s.kicker),
            titleEl,
            h("p", { class: "lp-text typewriter" }, words(s.text).map((w, k) => [h("span", { style: { "--k": k } }, w), " "])),
            s.terms.length > 0 && h("div", { class: "lp-terms" }, s.terms.map((t, k) => h("span", { style: { "--k": k } }, "🔑 ", t)))))
      );
    } else if (s.type === "glossary") {
      wrap.append(
        h("div", { class: "lp-gloss" },
          h("div", { class: "lp-kicker" }, s.kicker),
          titleEl,
          h("div", { class: "lp-gloss-grid" }, s.items.map((g, k) => h("div", { class: "lp-gcard", style: { "--k": k } }, h("b", {}, g.term), h("small", {}, g.def)))))
      );
    }
    wrap.dataset.index = i;
    return wrap;
  }

  function sceneDuration(s) {
    return Math.max(5200, (words(s.narration).length * 420) / rate);
  }

  function setBars() {
    bars.querySelectorAll(".lp-bar").forEach((b, k) => {
      b.classList.toggle("done", k < idx);
      b.classList.toggle("current", k === idx);
      const fill = b.firstChild;
      fill.style.transition = "none";
      fill.style.transform = `scaleX(${k < idx ? 1 : 0})`;
    });
  }

  function fillCurrent(ms) {
    const fill = bars.children[idx]?.firstChild;
    if (!fill) return;
    void fill.offsetWidth;
    fill.style.transition = `transform ${ms}ms linear`;
    fill.style.transform = "scaleX(1)";
  }

  async function go(i, restart = false) {
    if (i < 0 || i >= scenes.length) return;
    if (i === idx && !restart && started) return;
    started = true;
    poster.classList.add("hidden");
    const dir = i >= idx ? 1 : -1;
    idx = i;
    const my = ++token;
    clearTimeout(timer);
    voice.stop();
    const s = scenes[i];
    if (!muted) voice.prefetch(scenes[i + 1]?.narration, voiceOpts);
    const old = [...stage.children];
    const el = renderScene(s, i);
    el.classList.add(dir > 0 ? "enter-next" : "enter-prev");
    stage.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("enter-next", "enter-prev")));
    old.forEach((o) => {
      o.classList.add(dir > 0 ? "leave-next" : "leave-prev");
      setTimeout(() => o.remove(), 700);
    });
    counter.textContent = `${i + 1} / ${scenes.length}`;
    caption.replaceChildren(h("span", {}, s.narration));
    setBars();
    if (s.type === "outro") {
      confetti();
      onComplete?.();
    }
    if (!playing) return;
    await playScene(s, my);
  }

  async function playScene(s, my) {
    const est = sceneDuration(s);
    fillCurrent(est);
    const startT = Date.now();
    if (!muted) {
      try {
        await voice.speak(s.narration, voiceOpts);
      } catch {}
    }
    if (my !== token || !playing) return;
    // Ovoz haqiqatan yangragan bo'lsa — qisqa pauza; brauzerda ovoz bo'lmasa — taxminiy vaqt.
    const spoke = Date.now() - startT > 1500;
    const remain = Math.max(spoke ? 900 : est - (Date.now() - startT), 400);
    timer = setTimeout(() => {
      if (my !== token || !playing) return;
      if (idx < scenes.length - 1) go(idx + 1);
      else {
        playing = false;
        playBtn.textContent = "▶";
      }
    }, remain);
  }

  function toggle() {
    playing = !playing;
    playBtn.textContent = playing ? "⏸" : "▶";
    playBtn.setAttribute("aria-label", playing ? "Pauza" : "Ijro etish");
    player.classList.toggle("playing", playing);
    if (playing) {
      go(!started || idx === scenes.length - 1 ? 0 : idx, true);
    } else {
      clearTimeout(timer);
      voice.stop();
      const fill = bars.children[idx]?.firstChild;
      if (fill) {
        const w = fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width;
        fill.style.transition = "none";
        fill.style.transform = `scaleX(${w})`;
      }
    }
  }

  const onKey = (e) => {
    if (!player.contains(document.activeElement) && document.fullscreenElement !== player) return;
    if (e.key === " " || e.key === "k") toggle();
    else if (e.key === "ArrowRight") go(idx + 1);
    else if (e.key === "ArrowLeft") go(idx - 1);
    else if (e.key === "m") setMuted(!muted);
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey);

  // Muqova: birinchi sahna fon sifatida
  stage.append(renderScene(scenes[0], 0));
  counter.textContent = `1 / ${scenes.length}`;
  caption.textContent = "";
  if (reducedMotion()) player.classList.add("reduced");

  player.destroy = () => {
    playing = false;
    clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
    voice.stop();
    bvoice?.destroy();
  };
  return player;
}
