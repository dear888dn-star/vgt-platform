// Virtual sayohat: Buyuk ipak yo'li bo'ylab namunaviy ekskursiya — obida manzarasi, ovozli hikoya,
// faktlar, gid uchun metodik maslahat va jonli sxematik marshrut xaritasi.
import { h, mount } from "../ui.js";
import { mountScene } from "../landmarks.js";
import { createVoice } from "../voice.js";
import { reducedMotion } from "../motion.js";

const TOUR = [
  {
    city: "Toshkent", landmark: "tashkent", time: "day", title: "Hazrati Imom majmuasi", lat: 41.3386, lng: 69.2405,
    narration: "Sayohatimizni poytaxt Toshkentdan boshlaymiz. Hazrati Imom majmuasi shaharning eng muhim ziyoratgohlaridan biri. Majmuadagi Muyi Muborak kutubxonasida qadimiy Usmon Qur'oni saqlanadi.",
    facts: ["Toshkent — O'zbekiston poytaxti", "Majmua: masjid, madrasa, maqbara va kutubxona", "Mehmonlar uchun eng qulay boshlang'ich nuqta"],
    tip: "Ekskursiyani salomlashish, o'zingizni tanishtirish va kun rejasini qisqa aytishdan boshlang: guruh nimani, qachon va qancha vaqt ko'rishini bilsin.",
    trainer: "foreign-arrival",
  },
  {
    city: "Samarqand", landmark: "registan", time: "day", title: "Registon maydoni", lat: 39.6547, lng: 66.9758,
    narration: "Samarqand qalbi — Registon maydoni. Uni uchta madrasa o'rab turadi: Ulug'bek madrasasi o'n beshinchi asr boshida, Sherdor va Tillakori esa o'n yettinchi asrda qurilgan. Samarqand 2001-yilda YuNESKO Butunjahon merosi ro'yxatiga kiritilgan.",
    facts: ["Ulug'bek madrasasi — 1417–1420", "Sherdor — 1619–1636", "Tillakori — 1646–1660", "YuNESKO ro'yxatida: 2001"],
    tip: "Guruhni maydon markaziga olib chiqing va peshtoqlarni chapdan o'ngga, vaqt ketma-ketligida tanishtiring. Sherdor peshtog'idagi sher va quyosh tasviriga e'tibor qarating — bu savollarga sabab bo'ladi.",
    trainer: "registon-tour",
  },
  {
    city: "Samarqand", landmark: "guramir", time: "night", title: "Go'ri Amir maqbarasi", lat: 39.6487, lng: 66.969,
    narration: "Go'ri Amir — Amir Temur va temuriylar maqbarasi. U o'n beshinchi asr boshida qurilgan. Qovurg'asimon moviy gumbazi Samarqandning eng tanish ramzlaridan biri, kechki yoritishda ayniqsa go'zal ko'rinadi.",
    facts: ["Amir Temur sulolasi maqbarasi", "Qovurg'asimon moviy gumbaz", "Kechki ekskursiyalar uchun mashhur"],
    tip: "Tarixiy shaxslar haqida gapirganda sana va faktlarni aniq ayting, rivoyatlarni esa “aytishlaricha…” deb ajrating — bu gidning ishonchliligini oshiradi.",
    trainer: "registon-tour",
  },
  {
    city: "Samarqand", landmark: "shahizinda", time: "day", title: "Shohi Zinda ansambli", lat: 39.663, lng: 66.9877,
    narration: "Shohi Zinda — tepalik bo'ylab ketma-ket joylashgan maqbaralar ansambli. Bu yerdagi inshootlar o'n birinchi asrdan o'n to'qqizinchi asrgacha bo'lgan davrni qamraydi. Ko'k koshinlar va naqshlar sharq me'morchiligining nodir namunasidir.",
    facts: ["XI–XIX asrlarga oid maqbaralar", "Moviy koshinkorlik namunalari", "Zinapoyali “ko'cha” ko'rinishidagi ansambl"],
    tip: "Ziyoratgohlarda guruhga odob-axloq qoidalarini oldindan eslatib qo'ying: kiyinish, ovoz balandligi, suratga olish tartibi.",
    trainer: "accessible-tour",
  },
  {
    city: "Shahrisabz", landmark: "aksaray", time: "sunset", title: "Oqsaroy qoldiqlari", lat: 39.0614, lng: 66.8304,
    narration: "Shahrisabz — Amir Temurning vatani. Oqsaroy saroyi o'n to'rtinchi asr oxiri va o'n beshinchi asr boshida qurilgan. Bugun uning ulkan peshtoq qoldiqlari saroyning qanchalik mahobatli bo'lganidan dalolat beradi. Shahrisabz tarixiy markazi 2000-yilda YuNESKO ro'yxatiga kiritilgan.",
    facts: ["Amir Temur saroyi (1380–1404)", "Ulkan peshtoq qoldiqlari", "YuNESKO ro'yxatida: 2000"],
    tip: "Saqlanib qolmagan obidani tasvirlashda raqamli vositalardan foydalaning: rekonstruksiya rasmi, AR ilova yoki 3D model guruhga yo'qolgan qismlarni ko'rishga yordam beradi.",
    trainer: "itinerary-design",
  },
  {
    city: "Buxoro", landmark: "bukhara", time: "day", title: "Poi Kalon ansambli", lat: 39.7759, lng: 64.4147,
    narration: "Buxorodagi Poi Kalon ansamblining markazida Minorai Kalon turadi. U 1127-yilda qurilgan va balandligi qirq besh metrdan oshadi. Minora Kalon masjidi va Mir Arab madrasasi bilan birga yaxlit ansambl hosil qiladi. Buxoro tarixiy markazi 1993-yildan YuNESKO ro'yxatida.",
    facts: ["Minorai Kalon — 1127-yil", "Balandligi 45 metrdan ortiq", "YuNESKO ro'yxatida: 1993"],
    tip: "Issiq kunlarda guruhni soyada to'xtatib gapiring, suv va dam olish tanaffuslarini rejalashtiring — mehmonlar xavfsizligi gidning birinchi vazifasi.",
    trainer: "heat-emergency",
  },
  {
    city: "Xiva", landmark: "khiva", time: "sunset", title: "Ichan qal'a", lat: 41.3783, lng: 60.3597,
    narration: "Sayohatimiz Xivada yakunlanadi. Ichan qal'a — devor bilan o'ralgan ichki shahar, 1990-yilda O'zbekistondan YuNESKO ro'yxatiga kiritilgan birinchi obyekt. Firuza koshinli Kalta minor o'n to'qqizinchi asr o'rtalarida qurila boshlangan, lekin yakunlanmay qolgan.",
    facts: ["YuNESKO ro'yxatida: 1990", "Kalta minor — XIX asr, yakunlanmagan", "Ochiq osmon ostidagi muzey-shahar"],
    tip: "Ekskursiyani xulosa, minnatdorchilik va fikr-mulohaza so'rash bilan yakunlang: QR-kod orqali onlayn so'rovnoma yoki sharh qoldirishni taklif qiling.",
    trainer: "khiva-virtual",
  },
];

// Sxematik xarita proyeksiyasi (taxminiy)
const proj = (lat, lng) => [((lng - 59.4) / (70.2 - 59.4)) * 960 + 20, ((42.2 - lat) / (42.2 - 38.4)) * 360 + 30];

function routeMap() {
  const pts = TOUR.map((s) => proj(s.lat, s.lng));
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const cities = [...new Map(TOUR.map((s, i) => [s.city, i])).entries()];
  return `<svg viewBox="0 0 1000 420" class="tour-map-svg" role="img" aria-label="Sayohat marshruti sxemasi">
    <defs><linearGradient id="tmg" x1="0" x2="1"><stop offset="0" stop-color="#e9d3a4"/><stop offset="1" stop-color="#d9bf8a"/></linearGradient>
    <pattern id="dunes" width="40" height="16" patternUnits="userSpaceOnUse"><path d="M0 12 q10 -8 20 0 t20 0" stroke="#c8a76d" fill="none" opacity=".5"/></pattern></defs>
    <rect width="1000" height="420" rx="18" fill="url(#tmg)"/><rect width="1000" height="420" rx="18" fill="url(#dunes)"/>
    <path d="M120 40 C 60 120, 80 200, 40 260" stroke="#7fb6c9" stroke-width="10" fill="none" opacity=".55"/>
    <text x="52" y="300" font-size="15" fill="#4f7d8c" font-style="italic">Amudaryo</text>
    <path class="tm-route-bg" d="${d}" stroke="#8a6a3c" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" fill="none"/>
    <path class="tm-route" d="${d}" stroke="#0e7c86" stroke-width="5" stroke-linecap="round" fill="none"/>
    ${cities.map(([city, i]) => { const [x, y] = pts[i]; return `<g class="tm-city"><circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#0e7c86" stroke-width="4"/><text x="${x}" y="${y - 18}" text-anchor="middle" font-size="18" font-weight="700" fill="#2b2015">${city}</text></g>`; }).join("")}
    <g class="tm-traveler"><circle r="16" fill="#c8912a"/><text text-anchor="middle" dy="6" font-size="18">🚌</text></g>
    <text x="980" y="408" text-anchor="end" font-size="12" fill="#6a5a3a">Sxematik xarita (masshtabsiz)</text>
  </svg>`;
}

export async function render(el) {
  let idx = 0;
  let playing = false;
  let muted = false;
  let timer;
  let token = 0;
  const voice = window.speechSynthesis ? createVoice({ id: "tour", language: "o'zbek", speakers: { Gid: "female" } }, { engine: "browser", persist: false }) : null;

  const stage = h("div", { class: "tour-stage" });
  const overlayTitle = h("div", { class: "tour-overlay" });
  const caption = h("div", { class: "tour-caption", "aria-live": "polite" });
  const bars = h("div", { class: "lp-bars" }, TOUR.map((s, i) => h("button", { class: "lp-bar", "aria-label": s.title, onclick: () => go(i) }, h("i"))));
  const playBtn = h("button", { class: "lp-btn lp-play", "aria-label": "Ijro etish", onclick: () => toggle() }, "▶");
  const muteBtn = h("button", { class: "lp-btn", "aria-label": "Ovoz", onclick: () => { muted = !muted; muteBtn.textContent = muted ? "🔇" : "🔊"; if (muted) voice?.cancelSpeech(); } }, "🔊");
  const factsBox = h("div", { class: "card tour-facts" });
  const mapBox = h("div", { class: "card tour-map", html: routeMap() });
  const stopsList = h("ol", { class: "tour-stops" }, TOUR.map((s, i) => h("li", {}, h("button", { onclick: () => go(i) }, h("span", { class: "ts-num" }, i + 1), h("span", {}, h("b", {}, s.title), h("small", {}, s.city))))));
  const player = h(
    "div",
    { class: "tour-player lesson-player" },
    h("div", { class: "tour-screen" }, stage, overlayTitle, caption),
    bars,
    h("div", { class: "lp-controls" },
      h("button", { class: "lp-btn", "aria-label": "Oldingi bekat", onclick: () => go(idx - 1) }, "⏮"),
      playBtn,
      h("button", { class: "lp-btn", "aria-label": "Keyingi bekat", onclick: () => go(idx + 1) }, "⏭"),
      h("span", { class: "lp-count tour-count" }),
      h("span", { class: "lp-spacer" }),
      muteBtn,
      h("button", { class: "lp-btn", "aria-label": "To'liq ekran", onclick: () => (document.fullscreenElement ? document.exitFullscreen() : player.requestFullscreen?.().catch(() => {})) }, "⛶"))
  );

  mount(
    el,
    h(
      "section",
      { class: "tour-hero" },
      h("div", {}, h("div", { class: "eyebrow" }, "Namunaviy virtual ekskursiya"), h("h1", {}, "🧭 Buyuk ipak yo'li bo'ylab"), h("p", { class: "lead" }, "Toshkentdan Xivagacha 7 bekat. Har bir bekatda obida manzarasi, ovozli gid hikoyasi, asosiy faktlar va bo'lajak gid uchun metodik maslahat bor. Tomosha qiling, keyin trenajyorda o'zingiz gid bo'lib ko'ring.")),
      h("div", { class: "tour-hero-stats" }, [["7", "bekat"], ["5", "shahar"], ["4", "YuNESKO obyekti"]].map(([n, l]) => h("div", {}, h("b", {}, n), h("span", {}, l))))
    ),
    player,
    h("div", { class: "tour-grid" }, factsBox, h("div", { class: "stack" }, mapBox, h("div", { class: "card" }, h("h3", {}, "🚏 Bekatlar"), stopsList)))
  );

  const traveler = mapBox.querySelector(".tm-traveler");
  const routePath = mapBox.querySelector(".tm-route");
  const total = routePath.getTotalLength();
  const segLen = TOUR.map((s, i) => {
    if (!i) return 0;
    const [x0, y0] = proj(TOUR[i - 1].lat, TOUR[i - 1].lng);
    const [x1, y1] = proj(s.lat, s.lng);
    return Math.hypot(x1 - x0, y1 - y0);
  });
  const cum = segLen.map((_, i) => segLen.slice(0, i + 1).reduce((a, b) => a + b, 0));
  routePath.style.strokeDasharray = `${total}`;
  routePath.style.strokeDashoffset = `${total}`;
  let travelerAt = 0;
  const moveTraveler = (to) => {
    const from = travelerAt;
    const target = cum[to];
    const t0 = performance.now();
    const dur = reducedMotion() ? 0 : 1600;
    const step = (now) => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - k, 3);
      const len = from + (target - from) * e;
      const p = routePath.getPointAtLength(Math.max(0, Math.min(total, len)));
      traveler.setAttribute("transform", `translate(${p.x} ${p.y})`);
      routePath.style.strokeDashoffset = `${total - len}`;
      if (k < 1) requestAnimationFrame(step);
      else travelerAt = target;
    };
    requestAnimationFrame(step);
  };

  function show(i, dir) {
    const s = TOUR[i];
    const layer = h("div", { class: `tour-layer ${dir >= 0 ? "enter-next" : "enter-prev"}` });
    mountScene(layer, { landmark: s.landmark, time: s.time });
    stage.append(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove("enter-next", "enter-prev")));
    [...stage.children].slice(0, -1).forEach((o) => {
      o.classList.add("leaving");
      setTimeout(() => o.remove(), 1200);
    });
    overlayTitle.replaceChildren(h("span", { class: "tour-chip" }, `📍 ${s.city} · ${i + 1}/${TOUR.length}`), h("h2", {}, s.title));
    caption.replaceChildren(...s.narration.split(/\s+/).map((w, k) => h("span", { style: { "--k": k } }, `${w} `)));
    player.querySelector(".tour-count").textContent = `${i + 1} / ${TOUR.length}`;
    factsBox.replaceChildren(
      h("div", { class: "row between wrap" }, h("h3", {}, `${s.title}`), h("a", { class: "btn small ghost", href: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`, target: "_blank", rel: "noopener" }, "📍 Xaritada ochish")),
      h("ul", { class: "tour-fact-list" }, s.facts.map((f, k) => h("li", { style: { "--k": k } }, "✦ ", f))),
      h("div", { class: "tour-tip" }, h("b", {}, "🎓 Gid uchun maslahat"), h("p", {}, s.tip)),
      h("a", { class: "btn", href: `#/trainer/${s.trainer}` }, "🎙️ Trenajyorda shunga o'xshash vaziyatni mashq qilish")
    );
    stopsList.querySelectorAll("li").forEach((li, k) => li.classList.toggle("active", k === i));
    bars.querySelectorAll(".lp-bar").forEach((b, k) => {
      b.classList.toggle("done", k < i);
      b.classList.toggle("current", k === i);
      b.firstChild.style.transition = "none";
      b.firstChild.style.transform = `scaleX(${k < i ? 1 : 0})`;
    });
    moveTraveler(i);
  }

  async function go(i, restart = false) {
    if (i < 0 || i >= TOUR.length) return;
    if (i === idx && !restart && stage.children.length) return;
    const dir = i - idx;
    idx = i;
    const my = ++token;
    clearTimeout(timer);
    voice?.cancelSpeech();
    show(i, dir);
    if (!playing) return;
    const s = TOUR[i];
    const est = Math.max(7000, s.narration.split(/\s+/).length * 430);
    const fill = bars.children[i].firstChild;
    void fill.offsetWidth;
    fill.style.transition = `transform ${est}ms linear`;
    fill.style.transform = "scaleX(1)";
    caption.classList.add("reading");
    caption.style.setProperty("--dur", `${est}ms`);
    const t0 = Date.now();
    if (voice && !muted) {
      try {
        await voice.speak(s.narration);
      } catch {}
    }
    if (my !== token || !playing) return;
    timer = setTimeout(() => {
      if (my !== token || !playing) return;
      if (idx < TOUR.length - 1) go(idx + 1);
      else toggle();
    }, Math.max(Date.now() - t0 > 1500 ? 1500 : est - (Date.now() - t0), 400)); // ovoz bo'lmasa — taxminiy vaqt
  }

  function toggle() {
    playing = !playing;
    playBtn.textContent = playing ? "⏸" : "▶";
    player.classList.toggle("playing", playing);
    if (playing) go(idx === TOUR.length - 1 && caption.classList.contains("reading") ? 0 : idx, true);
    else {
      clearTimeout(timer);
      voice?.cancelSpeech();
      caption.classList.remove("reading");
    }
  }

  show(0, 1);
  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === " ") toggle();
    else if (e.key === "ArrowRight") go(idx + 1);
    else if (e.key === "ArrowLeft") go(idx - 1);
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey);
  return () => {
    playing = false;
    clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
    voice?.destroy();
  };
}
