// "Geo-sayohat": O'zbekiston xaritasida turistik obyekt qayerdaligini topish o'yini (GeoGuessr uslubida).
// Topishmoq va manzara ko'rsatiladi, o'quvchi xaritada nuqtani belgilaydi — masofaga qarab ball oladi.
import { h, mount, toast } from "../ui.js";
import { GEO_PLACES, GEO_ROUNDS, GEO_MAX, distanceKm, roundScore } from "../../data/geo.js";
import { loadLeaflet } from "../route-geo.js";
import { sceneSVG } from "../landmarks.js";
import { loadProgress, progressState, recordGeo } from "../progress.js";
import { confetti } from "../motion.js";
import { sfx } from "../sfx.js";

const UZ_BOUNDS = [[37.1, 55.9], [45.6, 73.2]];
const RANKS = [
  [0.85, "🌍", "Geograf gid"],
  [0.65, "🧭", "Tajribali sayyoh"],
  [0.4, "🎒", "Kashfiyotchi"],
  [0, "🧳", "Yo'lovchi"],
];

const today = () => new Date().toISOString().slice(0, 10);
function seeded(seedText) {
  let a = [...seedText].reduce((s, c) => (Math.imul(s ^ c.charCodeAt(0), 2654435761) >>> 0), 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickPlaces(daily) {
  const rnd = daily ? seeded(`safar-geo-${today()}`) : Math.random;
  const pool = [...GEO_PLACES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, GEO_ROUNDS);
}

const fmtKm = (km) => (km < 1 ? "1 km dan kam" : `${Math.round(km).toLocaleString("uz")} km`);
const isDark = () => document.documentElement.dataset.theme === "dark" || (document.documentElement.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);

function illustration(place) {
  if (place.scene) return h("div", { class: "geo-art", html: sceneSVG({ landmark: place.scene, time: "day", caravan: false }) });
  return h("div", { class: "geo-art geo-emoji", style: { "--hue": place.hue ?? 190 } }, h("span", {}, place.emoji), h("i"), h("i"), h("i"));
}

/** Nomsiz xarita (CARTO). Agar tarmoq uni bloklasa — OpenStreetMap'ga o'tadi. */
function baseTiles(L, map, kind) {
  let errors = 0;
  const carto = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${isDark() ? "dark" : "light"}_${kind}/{z}/{x}/{y}{r}.png`, {
    maxZoom: 12,
    subdomains: "abcd",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);
  carto.on("tileerror", () => {
    if (++errors !== 4) return;
    map.removeLayer(carto);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 12, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  });
}

function pinIcon(L, cls, label) {
  return L.divIcon({ className: `geo-pin ${cls}`, html: `<span>${label}</span>`, iconSize: [34, 42], iconAnchor: [17, 40] });
}

export async function render(el) {
  await loadProgress();
  const st = progressState().geo || { best: 0, plays: 0 };
  const hero = h("div", { class: "geo-hero-art", html: sceneSVG({ landmark: "khiva", time: "sunset" }) });
  const start = (daily) => play(el, daily);
  mount(
    el,
    h("section", { class: "geo-intro" },
      h("div", { class: "geo-intro-text" },
        h("span", { class: "hero-chip" }, h("span", { class: "dot" }), "Yangi o'yin"),
        h("h1", {}, "🌍 Geo-sayohat"),
        h("p", { class: "lead" }, `Gid o'z yurtini xaritadek bilishi kerak. Topishmoq va manzarani o'qing, so'ng O'zbekiston xaritasida obyekt qayerdaligini belgilang. ${GEO_ROUNDS} ta raund, har biri 1000 ballgacha — qanchalik yaqin bo'lsangiz, shuncha ko'p ball.`),
        h("div", { class: "geo-steps" },
          [["🧩", "Topishmoqni o'qing"], ["📍", "Xaritada belgilang"], ["📏", "Masofa = ball"]].map(([i, t], n) => h("div", { class: "geo-step", style: { "--i": n } }, h("span", {}, i), h("b", {}, t)))),
        h("div", { class: "row wrap" },
          h("button", { class: "btn lg", onclick: () => start(true) }, "📅 Kun sayohati"),
          h("button", { class: "btn ghost lg", onclick: () => start(false) }, "🎲 Erkin o'yin")),
        h("p", { class: "muted small" }, "Kun sayohatida bugungi 8 ta manzil hamma uchun bir xil — natijangizni sinfdoshlaringiz bilan solishtiring."),
        st.plays ? h("div", { class: "geo-best" }, h("span", {}, "🏅 Eng yaxshi natija: ", h("b", {}, `${st.best} / ${GEO_MAX}`)), h("span", {}, `🎮 O'yinlar: ${st.plays}`)) : null),
      hero)
  );
}

async function play(el, daily) {
  const places = pickPlaces(daily);
  const results = [];
  let round = 0;
  let guess = null;
  let hinted = false;
  let L;
  try {
    L = await loadLeaflet();
  } catch (e) {
    return toast(e.message, "error");
  }

  const art = h("div", { class: "geo-art-wrap" });
  const roundLbl = h("span", { class: "geo-round" });
  const totalLbl = h("span", { class: "geo-total" });
  const clue = h("p", { class: "geo-clue" });
  const hintBox = h("div", { class: "geo-hint" });
  const hintBtn = h("button", { class: "btn ghost small", onclick: () => {
    hinted = true;
    hintBtn.disabled = true;
    hintBox.replaceChildren(h("span", {}, "💡 ", h("b", {}, places[round].region)), h("small", { class: "muted" }, " (bu raund bali ×0,7)"));
  } }, "💡 Yordam: viloyat");
  let action = () => reveal();
  const confirmBtn = h("button", { class: "btn lg block", disabled: true, onclick: () => action() }, "📍 Javobni tasdiqlash");
  const resultBox = h("div", { class: "geo-result" });
  const progressDots = h("div", { class: "geo-dots" }, places.map(() => h("i")));
  const mapEl = h("div", { class: "geo-map" });
  const side = h("div", { class: "geo-side card" },
    h("div", { class: "row between" }, roundLbl, totalLbl),
    progressDots,
    art,
    clue,
    h("div", { class: "row wrap" }, hintBtn),
    hintBox,
    resultBox,
    confirmBtn);
  mount(el, h("div", { class: "geo-play" }, side, h("div", { class: "geo-map-wrap" }, mapEl, h("div", { class: "geo-map-tip" }, "Xaritani bosib, obyekt joyini belgilang"))));

  const map = L.map(mapEl, { zoomControl: true, minZoom: 5, maxBounds: [[33, 50], [49, 78]], worldCopyJump: false }).fitBounds(UZ_BOUNDS);
  baseTiles(L, map, "nolabels");
  const layer = L.layerGroup().addTo(map);
  let guessMarker = null;
  let locked = false;

  map.on("click", (e) => {
    if (locked) return;
    guess = { lat: e.latlng.lat, lng: e.latlng.lng };
    if (guessMarker) guessMarker.setLatLng(e.latlng);
    else guessMarker = L.marker(e.latlng, { icon: pinIcon(L, "guess", "📍"), draggable: true }).addTo(layer).on("dragend", (ev) => (guess = ev.target.getLatLng()));
    confirmBtn.disabled = false;
    sfx.tick();
  });

  const keyHandler = (e) => {
    if (!document.body.contains(mapEl)) return window.removeEventListener("keydown", keyHandler);
    if (e.key === "Enter" && !confirmBtn.disabled) confirmBtn.click();
  };
  window.addEventListener("keydown", keyHandler);

  function showRound() {
    const p = places[round];
    locked = false;
    guess = null;
    hinted = false;
    guessMarker = null;
    layer.clearLayers();
    map.flyToBounds(UZ_BOUNDS, { duration: 0.6 });
    roundLbl.textContent = `Raund ${round + 1} / ${places.length}`;
    totalLbl.textContent = `⭐ ${results.reduce((s, r) => s + r.score, 0)}`;
    progressDots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("now", i === round));
    art.replaceChildren(illustration(p));
    clue.textContent = p.clue;
    hintBox.replaceChildren();
    hintBtn.disabled = false;
    resultBox.replaceChildren();
    confirmBtn.disabled = true;
    confirmBtn.textContent = "📍 Javobni tasdiqlash";
    action = () => reveal();
  }

  function reveal() {
    if (!guess || locked) return;
    locked = true;
    const p = places[round];
    const km = distanceKm(guess, p);
    const score = roundScore(km, hinted);
    results.push({ place: p, guess, km, score, hinted });
    guessMarker?.dragging?.disable();
    L.marker([p.lat, p.lng], { icon: pinIcon(L, "target", "🏁") }).addTo(layer);
    L.polyline([[guess.lat, guess.lng], [p.lat, p.lng]], { color: "#e8a33d", weight: 3, dashArray: "6 8" }).addTo(layer);
    map.flyToBounds(L.latLngBounds([[guess.lat, guess.lng], [p.lat, p.lng]]).pad(0.5), { maxZoom: 9, duration: 0.9 });
    score >= 700 ? sfx.correct() : score < 200 ? sfx.wrong() : sfx.reveal();
    const dot = progressDots.querySelectorAll("i")[round];
    dot.classList.remove("now");
    dot.classList.add(score >= 700 ? "great" : score >= 300 ? "ok" : "far");
    const pts = h("b", { class: "geo-pts" }, "+0");
    resultBox.replaceChildren(
      h("div", { class: "geo-answer" },
        h("div", { class: "geo-answer-head" }, h("span", { class: "geo-answer-name" }, p.name), h("span", { class: "muted" }, ` · ${p.city}`)),
        h("div", { class: "geo-score-row" }, h("span", {}, "📏 ", fmtKm(km)), pts),
        h("div", { class: "geo-bar" }, h("i", { style: { "--w": `${score / 10}%` } })),
        h("p", { class: "geo-fact" }, "💡 ", p.fact))
    );
    countUp(pts, score);
    totalLbl.textContent = `⭐ ${results.reduce((s, r) => s + r.score, 0)}`;
    hintBtn.disabled = true;
    const last = round + 1 >= places.length;
    confirmBtn.disabled = false;
    confirmBtn.textContent = last ? "🏁 Natijalar" : "Keyingi raund →";
    action = () => (last ? finish() : (round++, showRound()));
  }

  function finish() {
    window.removeEventListener("keydown", keyHandler);
    const total = results.reduce((s, r) => s + r.score, 0);
    const prevBest = progressState().geo?.best || 0;
    recordGeo(total);
    const [, icon, title] = RANKS.find(([min]) => total / GEO_MAX >= min);
    const newBest = total > prevBest;
    if (newBest || total / GEO_MAX >= 0.65) {
      confetti();
      sfx.win();
    }
    const recapMap = h("div", { class: "geo-map recap" });
    mount(
      el,
      h("div", { class: "geo-final" },
        h("div", { class: "geo-final-head card" },
          h("div", { class: "geo-rank" }, h("span", { class: "geo-rank-icon" }, icon), h("div", {}, h("small", { class: "muted" }, daily ? `Kun sayohati · ${today()}` : "Erkin o'yin"), h("h1", {}, title))),
          h("div", { class: "geo-final-score" }, h("b", { "data-final": total }, total), h("span", {}, ` / ${GEO_MAX}`)),
          newBest ? h("div", { class: "badge badge-ok" }, "🏅 Yangi shaxsiy rekord!") : h("div", { class: "muted small" }, `Eng yaxshi natijangiz: ${Math.max(prevBest, total)}`),
          h("div", { class: "row wrap" },
            h("button", { class: "btn", onclick: () => play(el, false) }, "🎲 Yana o'ynash"),
            h("a", { class: "btn ghost", href: "#/tour" }, "🧭 Virtual sayohat"),
            h("a", { class: "btn ghost", href: "#/passport" }, "🛂 Pasport"))),
        h("div", { class: "geo-final-body" },
          recapMap,
          h("ol", { class: "geo-recap card" }, results.map((r) =>
            h("li", { class: r.score >= 700 ? "great" : r.score >= 300 ? "ok" : "far" },
              h("span", { class: "geo-recap-emoji" }, r.place.emoji),
              h("div", {}, h("b", {}, r.place.name), h("small", { class: "muted" }, ` ${r.place.city} · ${fmtKm(r.km)}${r.hinted ? " · 💡" : ""}`)),
              h("b", { class: "geo-recap-pts" }, r.score))))))
    );
    const m2 = L.map(recapMap, { scrollWheelZoom: false }).fitBounds(UZ_BOUNDS);
    baseTiles(L, m2, "all");
    for (const r of results) {
      L.polyline([[r.guess.lat, r.guess.lng], [r.place.lat, r.place.lng]], { color: "#e8a33d", weight: 2, dashArray: "4 6" }).addTo(m2);
      L.circleMarker([r.guess.lat, r.guess.lng], { radius: 5, color: "#e8a33d", fillOpacity: 1 }).addTo(m2);
      L.marker([r.place.lat, r.place.lng], { icon: pinIcon(L, "target small", r.place.emoji) }).addTo(m2).bindTooltip(`${r.place.name} — ${r.score} ball`);
    }
  }

  showRound();
}

function countUp(el, to) {
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 900);
    el.textContent = `+${Math.round(to * (1 - (1 - k) ** 3))}`;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
