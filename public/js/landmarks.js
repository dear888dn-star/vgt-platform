// O'zbekiston obidalarining original SVG illyustratsiyalari (stilizatsiya qilingan) va jonli osmon.
// sceneSVG({ landmark, time, animated }) — to'liq manzara; har bir qatlam parallaks uchun alohida guruhda.

const P = {
  dome: ["#5fd0d8", "#1aa3b0", "#0d6f7c"],
  domeNight: ["#3a9aa5", "#1b6d78", "#0b3f47"],
  brick: "#d9b47e",
  brickDark: "#b88b52",
  brickShade: "#a3763f",
  tile: "#1f5fa8",
  tileLight: "#3a8fd6",
  turq: "#22b5bf",
  gold: "#e9b949",
  white: "#f4efe3",
};

const SKY = {
  day: { top: "#7cc8e8", mid: "#bfe6f2", bottom: "#fbe9c6", sun: "#fff3b0", ground: "#e8c98f", far: "#d8b783", hill: "#c9a46b" },
  sunset: { top: "#3b4a8a", mid: "#e0768a", bottom: "#ffc27a", sun: "#ffd27a", ground: "#c98d5a", far: "#9a6a52", hill: "#7d5444" },
  night: { top: "#071526", mid: "#16304f", bottom: "#2c4a6b", sun: "#f3f0d8", ground: "#2a3346", far: "#1f2a3d", hill: "#18202f" },
};

let uid = 0;

// ---------- Primitivlar ----------

function domeShape(cx, baseY, w, h, id, ribs = 7, colors = P.dome) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const path = `M${x0} ${baseY} C ${x0 - w * 0.06} ${baseY - h * 0.55}, ${cx - w * 0.28} ${baseY - h * 0.98}, ${cx} ${baseY - h} C ${cx + w * 0.28} ${baseY - h * 0.98}, ${x1 + w * 0.06} ${baseY - h * 0.55}, ${x1} ${baseY} Z`;
  let rib = "";
  for (let i = 1; i < ribs; i++) {
    const t = i / ribs;
    const x = x0 + w * t;
    const bend = (t - 0.5) * w * 0.35;
    rib += `<path d="M${x} ${baseY} Q ${x + bend * 0.2} ${baseY - h * 0.7}, ${cx + bend * 0.15} ${baseY - h * 0.97}" stroke="rgba(10,60,70,.35)" stroke-width="${Math.max(1, w / 90)}" fill="none"/>`;
  }
  return `<defs><linearGradient id="dg${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${colors[2]}"/><stop offset=".35" stop-color="${colors[0]}"/><stop offset=".7" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient></defs>
  <path d="${path}" fill="url(#dg${id})"/>${rib}
  <rect x="${cx - w * 0.015}" y="${baseY - h - h * 0.16}" width="${w * 0.03}" height="${h * 0.16}" fill="${P.gold}"/>
  <circle cx="${cx}" cy="${baseY - h - h * 0.18}" r="${Math.max(2, w * 0.025)}" fill="${P.gold}"/>`;
}

function drum(cx, baseY, w, h) {
  return `<rect x="${cx - w / 2}" y="${baseY - h}" width="${w}" height="${h}" fill="${P.brick}"/>
  <rect x="${cx - w / 2}" y="${baseY - h}" width="${w}" height="${h * 0.42}" fill="${P.tile}"/>
  <rect x="${cx - w / 2}" y="${baseY - h + h * 0.12}" width="${w}" height="${h * 0.18}" fill="${P.tileLight}" opacity=".7"/>
  <rect x="${cx - w / 2}" y="${baseY - h * 0.08}" width="${w}" height="${h * 0.08}" fill="${P.brickDark}"/>`;
}

function archPath(x, y, w, h) {
  // Uchli (sharqona) ravoq
  return `M${x} ${y + h} L${x} ${y + h * 0.45} Q${x} ${y + h * 0.08}, ${x + w / 2} ${y} Q${x + w} ${y + h * 0.08}, ${x + w} ${y + h * 0.45} L${x + w} ${y + h} Z`;
}

function portal(cx, baseY, w, h, { niche = "#123a5c", accent = P.tile } = {}) {
  const x = cx - w / 2;
  const nw = w * 0.56;
  const nh = h * 0.72;
  const nx = cx - nw / 2;
  const ny = baseY - nh;
  return `<rect x="${x}" y="${baseY - h}" width="${w}" height="${h}" fill="${P.brick}"/>
  <rect x="${x}" y="${baseY - h}" width="${w}" height="${h * 0.07}" fill="${accent}"/>
  <rect x="${x + w * 0.06}" y="${baseY - h + h * 0.1}" width="${w * 0.88}" height="${h * 0.9}" fill="none" stroke="${accent}" stroke-width="${w * 0.035}"/>
  <path d="${archPath(nx - w * 0.04, ny - h * 0.04, nw + w * 0.08, nh + h * 0.04)}" fill="${P.tileLight}" opacity=".85"/>
  <path d="${archPath(nx, ny, nw, nh)}" fill="${niche}"/>
  <path d="${archPath(nx + nw * 0.25, ny + nh * 0.42, nw * 0.5, nh * 0.58)}" fill="#0b2740" opacity=".9"/>
  <g fill="${P.gold}" opacity=".85">${[0.2, 0.5, 0.8].map((t) => `<circle cx="${x + w * t}" cy="${baseY - h + h * 0.035}" r="${w * 0.012}"/>`).join("")}</g>`;
}

function minaret(cx, baseY, w, h, { tiled = 0.5, lantern = true, bands = 4 } = {}) {
  const top = baseY - h;
  const tw = w * 0.78;
  let out = `<path d="M${cx - w / 2} ${baseY} L${cx - tw / 2} ${top} L${cx + tw / 2} ${top} L${cx + w / 2} ${baseY} Z" fill="${P.brick}"/>`;
  out += `<path d="M${cx} ${baseY} L${cx} ${top}" stroke="${P.brickShade}" stroke-width="${w * 0.08}" opacity=".35"/>`;
  for (let i = 0; i < bands; i++) {
    const y = top + h * (0.12 + (i * (tiled * 0.9)) / bands);
    const bw = tw + (w - tw) * ((y - top) / h);
    out += `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${h * 0.035}" fill="${i % 2 ? P.turq : P.tile}"/>`;
  }
  if (lantern) {
    out += `<rect x="${cx - tw * 0.62}" y="${top - h * 0.05}" width="${tw * 1.24}" height="${h * 0.05}" fill="${P.brickDark}"/>
    <rect x="${cx - tw * 0.5}" y="${top - h * 0.12}" width="${tw}" height="${h * 0.07}" fill="${P.tile}"/>
    <path d="M${cx - tw * 0.55} ${top - h * 0.12} Q${cx} ${top - h * 0.2}, ${cx + tw * 0.55} ${top - h * 0.12} Z" fill="${P.turq}"/>`;
  }
  return out;
}

function arcade(x, baseY, w, h, n, color = "#7a5a36") {
  let out = `<rect x="${x}" y="${baseY - h}" width="${w}" height="${h}" fill="${P.brick}"/>
  <rect x="${x}" y="${baseY - h}" width="${w}" height="${h * 0.08}" fill="${P.tile}" opacity=".8"/>`;
  const aw = (w / n) * 0.62;
  for (let i = 0; i < n; i++) {
    const ax = x + (w / n) * i + (w / n - aw) / 2;
    out += `<path d="${archPath(ax, baseY - h * 0.78, aw, h * 0.62)}" fill="${color}" opacity=".85"/>`;
  }
  return out;
}

function tree(x, baseY, s = 1) {
  return `<g class="sway" style="transform-origin:${x}px ${baseY}px"><rect x="${x - 2 * s}" y="${baseY - 22 * s}" width="${4 * s}" height="${22 * s}" fill="#6b4a2b"/>
  <ellipse cx="${x}" cy="${baseY - 48 * s}" rx="${11 * s}" ry="${34 * s}" fill="#4f8a4a"/>
  <ellipse cx="${x - 3 * s}" cy="${baseY - 52 * s}" rx="${6 * s}" ry="${24 * s}" fill="#6aa65e" opacity=".8"/></g>`;
}

function camel(x, y, s = 1, delay = 0) {
  return `<g class="camel" style="animation-delay:${delay}s" transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 0 q6 -18 18 -14 q8 -12 16 0 q6 -10 14 2 l10 -8 q6 -2 6 4 l-4 4 q-4 6 -10 10 l0 16 h-4 v-14 h-26 v14 h-4 v-16 q-12 -2 -16 -2 z" fill="#5a3e28"/>
  <rect x="14" y="-18" width="22" height="5" rx="2" fill="#c0392b"/></g>`;
}

function stars(count = 60) {
  let out = "";
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < count; i++) out += `<circle class="star" style="animation-delay:${(rnd() * 3).toFixed(2)}s" cx="${(rnd() * 1200).toFixed(0)}" cy="${(rnd() * 300).toFixed(0)}" r="${(0.6 + rnd() * 1.4).toFixed(1)}" fill="#fff"/>`;
  return out;
}

function cloud(x, y, s, cls) {
  return `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="60" ry="18" fill="#fff" opacity=".85"/><ellipse cx="-24" cy="-10" rx="30" ry="18" fill="#fff" opacity=".9"/><ellipse cx="18" cy="-14" rx="34" ry="22" fill="#fff" opacity=".9"/></g>`;
}

function birds() {
  return [0, 1, 2]
    .map((i) => `<g class="bird" style="animation-delay:${i * 1.8}s"><path class="wing" d="M0 0 q8 -8 16 0 q8 -8 16 0" stroke="#2b3a4a" stroke-width="2.4" fill="none" transform="translate(${i * 26} ${i * 12})"/></g>`)
    .join("");
}

// ---------- Obidalar ----------

const LANDMARKS = {
  registan: () => {
    const b = 470;
    return `${arcade(170, b, 860, 120, 14)}
    ${minaret(200, b, 34, 260)}${minaret(420, b, 34, 260)}
    ${portal(310, b, 200, 230)}
    ${drum(560, b - 120, 110, 40)}${domeShape(560, b - 160, 120, 110, "r1", 9)}
    ${portal(600, b, 210, 210, { accent: P.turq })}
    ${drum(835, b - 200, 66, 24)}${domeShape(835, b - 224, 76, 76, "r2", 7)}
    ${drum(945, b - 200, 66, 24)}${domeShape(945, b - 224, 76, 76, "r3", 7)}
    ${minaret(780, b, 34, 260)}${minaret(1000, b, 34, 260)}
    ${portal(890, b, 200, 230)}
    <g opacity=".9"><circle cx="890" cy="${b - 185}" r="12" fill="${P.gold}"/><path d="M866 ${b - 160} q24 -14 48 0" stroke="${P.gold}" stroke-width="5" fill="none"/></g>`;
  },
  khiva: () => {
    const b = 470;
    let wall = `<rect x="80" y="${b - 90}" width="1040" height="90" fill="${P.brickDark}"/>`;
    for (let x = 80; x < 1120; x += 36) wall += `<path d="M${x} ${b - 90} q18 -26 36 0 z" fill="${P.brickDark}"/>`;
    const cyl = (cx, w, h) => {
      let out = `<rect x="${cx - w / 2}" y="${b - h}" width="${w}" height="${h}" fill="${P.turq}"/>`;
      const colors = [P.tile, P.turq, "#2e9e6a", P.white, P.tile, "#2e9e6a", P.turq];
      for (let i = 0; i < 14; i++) out += `<rect x="${cx - w / 2}" y="${b - h + (h / 14) * i}" width="${w}" height="${h / 28}" fill="${colors[i % colors.length]}"/>`;
      out += `<rect x="${cx - w / 2}" y="${b - h}" width="${w * 0.25}" height="${h}" fill="#000" opacity=".12"/><rect x="${cx + w * 0.25}" y="${b - h}" width="${w * 0.25}" height="${h}" fill="#fff" opacity=".1"/>`;
      return out;
    };
    return `${wall}${arcade(260, b, 680, 110, 10)}
    ${cyl(420, 120, 210)}
    ${minaret(820, b, 48, 360, { bands: 9, tiled: 0.95 })}
    ${drum(620, b - 110, 120, 34)}${domeShape(620, b - 144, 130, 96, "k1", 9, ["#7ad8c0", "#2ea78a", "#16705c"])}
    ${tree(150, b, 1)}${tree(1060, b, 1.1)}`;
  },
  bukhara: () => {
    const b = 470;
    return `${arcade(140, b, 920, 110, 15)}
    ${minaret(470, b, 74, 380, { bands: 7, tiled: 0.9 })}
    ${drum(720, b - 110, 140, 40)}${domeShape(720, b - 150, 160, 130, "b1", 11)}
    ${portal(260, b, 180, 200)}
    ${drum(940, b - 110, 100, 34)}${domeShape(940, b - 144, 110, 96, "b2", 9)}
    ${drum(1040, b - 110, 80, 28)}${domeShape(1040, b - 138, 90, 80, "b3", 7)}
    ${tree(110, b)}`;
  },
  shahizinda: () => {
    let out = "";
    const steps = [[180, 470], [330, 450], [480, 430], [630, 410], [780, 390], [930, 372]];
    steps.forEach(([x, y], i) => {
      out += `<rect x="${x - 70}" y="${y - 90}" width="140" height="${480 - y + 90}" fill="${P.brick}"/>`;
      out += portal(x, y, 110, 120, { accent: i % 2 ? P.turq : P.tile });
      out += drum(x + 40, y - 120, 50, 18) + domeShape(x + 40, y - 138, 58, 54, `s${i}`, 6);
    });
    return out + tree(1080, 470, 1.1);
  },
  aksaray: () => {
    const b = 470;
    const pylon = (x, w, h) => `<path d="M${x} ${b} L${x + w * 0.06} ${b - h} L${x + w * 0.94} ${b - h + 18} L${x + w} ${b} Z" fill="${P.brick}"/>
      <rect x="${x + w * 0.1}" y="${b - h + 30}" width="${w * 0.8}" height="${h * 0.35}" fill="${P.tile}" opacity=".85"/>
      <rect x="${x + w * 0.16}" y="${b - h + 46}" width="${w * 0.68}" height="${h * 0.08}" fill="${P.white}" opacity=".9"/>
      <rect x="${x + w * 0.16}" y="${b - h + 46 + h * 0.12}" width="${w * 0.68}" height="${h * 0.05}" fill="${P.gold}" opacity=".9"/>`;
    return `${arcade(140, b, 920, 80, 14, "#6d5130")}
    ${pylon(380, 150, 360)}${pylon(670, 150, 340)}
    <path d="M530 ${b} L530 ${b - 200} Q600 ${b - 300} 670 ${b - 200} L670 ${b} Z" fill="#9fd6e6" opacity=".25"/>
    <g class="statue" transform="translate(600 ${b})"><rect x="-8" y="-90" width="16" height="70" fill="#8a8f96"/><circle cx="0" cy="-100" r="11" fill="#8a8f96"/><rect x="-26" y="-20" width="52" height="20" fill="#6d737a"/></g>
    ${tree(200, b, 1.1)}${tree(980, b)}${tree(1040, b, 0.9)}`;
  },
  guramir: () => {
    const b = 470;
    const ribbed = (cx, base, w, h) => {
      let out = domeShape(cx, base, w, h, "g1", 16);
      for (let i = 1; i < 16; i++) {
        const x = cx - w / 2 + (w / 16) * i;
        out += `<path d="M${x} ${base} Q${x} ${base - h * 0.5}, ${cx + (x - cx) * 0.3} ${base - h * 0.95}" stroke="rgba(255,255,255,.25)" stroke-width="2" fill="none"/>`;
      }
      return out;
    };
    return `${arcade(220, b, 760, 100, 12)}
    ${minaret(330, b, 40, 300, { bands: 6 })}${minaret(870, b, 40, 300, { bands: 6 })}
    <rect x="500" y="${b - 200}" width="200" height="200" fill="${P.brick}"/>
    ${portal(600, b, 150, 170)}
    ${drum(600, b - 200, 170, 90)}
    <text x="600" y="${b - 245}" text-anchor="middle" font-size="20" fill="${P.white}" opacity=".8" font-family="serif" letter-spacing="6">❖ ❖ ❖ ❖ ❖</text>
    ${ribbed(600, b - 290, 190, 170)}`;
  },
  tashkent: () => {
    const b = 470;
    return `${arcade(160, b, 880, 100, 14)}
    ${minaret(260, b, 40, 300)}${minaret(940, b, 40, 300)}
    ${portal(600, b, 240, 230)}
    ${drum(420, b - 110, 110, 36)}${domeShape(420, b - 146, 120, 104, "t1", 9)}
    ${drum(780, b - 110, 110, 36)}${domeShape(780, b - 146, 120, 104, "t2", 9)}
    <rect x="1040" y="${b - 260}" width="40" height="260" fill="#9aa7b4"/><rect x="1030" y="${b - 280}" width="60" height="22" fill="#7d8b99"/>`;
  },
};

export const LANDMARK_NAMES = { registan: "Registon", khiva: "Ichan qal'a", bukhara: "Poi Kalon", shahizinda: "Shohi Zinda", aksaray: "Oqsaroy", guramir: "Go'ri Amir", tashkent: "Hazrati Imom" };

/** To'liq manzara SVG satri. */
export function sceneSVG({ landmark = "registan", time = "day", animated = true, caravan = true, label = false } = {}) {
  const id = `sc${uid++}`;
  const c = SKY[time] || SKY.day;
  const body = (LANDMARKS[landmark] || LANDMARKS.registan)();
  const sunY = time === "sunset" ? 330 : time === "night" ? 110 : 130;
  const sunX = time === "night" ? 980 : time === "sunset" ? 860 : 960;
  return `<svg class="scene ${animated ? "animated" : ""} t-${time}" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LANDMARK_NAMES[landmark] || ""}">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset=".55" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.bottom}"/></linearGradient>
    <radialGradient id="${id}sun"><stop offset="0" stop-color="${c.sun}" stop-opacity="${time === "night" ? 0.35 : 1}"/><stop offset=".4" stop-color="${c.sun}" stop-opacity="${time === "night" ? 0.18 : 0.55}"/><stop offset="1" stop-color="${c.sun}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.ground}"/><stop offset="1" stop-color="${c.hill}"/></linearGradient>
  </defs>
  <style>
    .scene.animated .cl1{animation:scDrift 60s linear infinite}
    .scene.animated .cl2{animation:scDrift 90s linear infinite reverse}
    .scene.animated .sunglow{animation:scGlow 6s ease-in-out infinite;transform-origin:${sunX}px ${sunY}px}
    .scene.animated .bird{animation:scFly 18s linear infinite}
    .scene.animated .wing{animation:scFlap .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
    .scene.animated .star{animation:scTwinkle 3s ease-in-out infinite}
    .scene.animated .camel{animation:scWalk 40s linear infinite}
    .scene.animated .sway{animation:scSway 5s ease-in-out infinite alternate}
    .scene.animated .lights rect{animation:scTwinkle 4s ease-in-out infinite}
    @keyframes scDrift{from{transform:translateX(-200px)}to{transform:translateX(1400px)}}
    @keyframes scGlow{50%{transform:scale(1.12);opacity:.85}}
    @keyframes scFly{from{transform:translate(-120px,150px)}to{transform:translate(1320px,60px)}}
    @keyframes scFlap{to{transform:scaleY(.4)}}
    @keyframes scTwinkle{50%{opacity:.25}}
    @keyframes scWalk{from{transform:translateX(-160px)}to{transform:translateX(1360px)}}
    @keyframes scSway{to{transform:rotate(2.5deg)}}
    @media (prefers-reduced-motion: reduce){.scene.animated *{animation:none!important}}
  </style>
  <rect width="1200" height="600" fill="url(#${id}sky)"/>
  ${time === "night" ? `<g>${stars(70)}</g>` : ""}
  <g class="layer l-sky"><circle class="sunglow" cx="${sunX}" cy="${sunY}" r="120" fill="url(#${id}sun)"/>${time === "night" ? `<mask id="${id}moon"><rect width="1200" height="600" fill="#fff"/><circle cx="${sunX + 12}" cy="${sunY - 8}" r="24" fill="#000"/></mask><circle cx="${sunX}" cy="${sunY}" r="26" fill="${c.sun}" mask="url(#${id}moon)"/>` : `<circle cx="${sunX}" cy="${sunY}" r="38" fill="${c.sun}"/>`}</g>
  ${time !== "night" ? `<g class="layer l-clouds">${cloud(200, 120, 1, "cl1")}${cloud(700, 80, 0.7, "cl2")}${cloud(1000, 170, 0.8, "cl1")}</g>` : ""}
  <g class="layer l-far"><path d="M0 430 Q150 360 320 410 T640 400 T980 390 T1200 410 V600 H0Z" fill="${c.far}" opacity=".7"/></g>
  <g class="layer l-main">${body}${time === "night" ? `<g class="lights" fill="#ffd77a" opacity=".85">${[260, 330, 610, 900, 960].map((x, i) => `<rect x="${x}" y="${430 - (i % 2) * 20}" width="10" height="16" style="animation-delay:${i * 0.7}s"/>`).join("")}</g>` : ""}</g>
  <g class="layer l-ground"><path d="M0 470 H1200 V600 H0Z" fill="url(#${id}gr)"/><path d="M0 500 Q300 480 600 505 T1200 495 V600 H0Z" fill="${c.hill}" opacity=".6"/>
  ${caravan ? `${camel(0, 524, 1.35, 0)}${camel(-90, 528, 1.2, 0)}${camel(-170, 526, 1.1, 0)}` : ""}</g>
  ${time !== "night" && animated ? `<g class="layer l-birds">${birds()}</g>` : ""}
  ${label ? `<text x="40" y="70" font-family="Unbounded, Inter, sans-serif" font-size="34" font-weight="700" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="1">${LANDMARK_NAMES[landmark]}</text>` : ""}
</svg>`;
}

/** Element ichiga manzara qo'yadi va sichqoncha bilan parallaks harakatini yoqadi. */
export function mountScene(el, opts) {
  el.innerHTML = sceneSVG(opts);
  const svg = el.querySelector("svg");
  const layers = [...svg.querySelectorAll(".layer")];
  const depth = { "l-sky": 6, "l-clouds": 12, "l-far": 10, "l-main": 18, "l-ground": 26, "l-birds": 14 };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return svg;
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    for (const l of layers) {
      const d = depth[[...l.classList].find((c) => c.startsWith("l-"))] || 10;
      l.style.transform = `translate(${(-x * d).toFixed(1)}px, ${(-y * d * 0.4).toFixed(1)}px)`;
    }
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", () => layers.forEach((l) => (l.style.transform = "")));
  return svg;
}
