// Marshrut laboratoriyasi uchun geo-hisob-kitoblar, xarita yuklash va marshrutni optimallashtirish.

export const CITIES = {
  Samarqand: [39.6542, 66.9597],
  Toshkent: [41.3111, 69.2797],
  Buxoro: [39.7747, 64.4286],
  Xiva: [41.3783, 60.3639],
  Shahrisabz: [39.0578, 66.8342],
  Jizzax: [40.1158, 67.8422],
  Termiz: [37.2242, 67.2783],
  "Qo'qon": [40.5286, 70.9425],
  Namangan: [40.9983, 71.6726],
  Andijon: [40.7821, 72.3442],
  "Farg'ona": [40.3864, 71.7864],
  Nukus: [42.46, 59.61],
  Qarshi: [38.8606, 65.7891],
  Navoiy: [40.0844, 65.3792],
  Guliston: [40.4897, 68.7842],
};

export const OBJECT_TYPES = [
  ["historic", "Tarixiy obyekt", "#8e5b2c"],
  ["cultural", "Madaniy obyekt", "#7b4fa0"],
  ["architecture", "Arxitektura yodgorligi", "#b8860b"],
  ["museum", "Muzey", "#1f6fb2"],
  ["nature", "Tabiiy obyekt", "#2e8b57"],
  ["pilgrimage", "Ziyorat obyekti", "#0e7c86"],
  ["leisure", "Ko'ngilochar obyekt", "#d1495b"],
  ["food", "Ovqatlanish obyekti", "#e07b39"],
  ["lodging", "Joylashtirish vositasi", "#5a6772"],
  ["transport", "Transport obyekti", "#333f48"],
];
export const TYPE_NAME = Object.fromEntries(OBJECT_TYPES.map(([k, n]) => [k, n]));
export const TYPE_COLOR = Object.fromEntries(OBJECT_TYPES.map(([k, , c]) => [k, c]));
export const SERVICE_TYPES = new Set(["food", "lodging", "transport"]);

// Harakatlanish turlari: to'g'ri chiziqli masofa yo'l egriligi koeffitsiyenti bilan ko'paytiriladi.
export const MODES = {
  walk: { name: "Piyoda", speed: 4.5, detour: 1.25 },
  bus: { name: "Avtobus (guruh transporti)", speed: 25, detour: 1.4 },
  car: { name: "Avtomobil / taksi", speed: 30, detour: 1.4 },
};

export function haversine(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const hasCoords = (o) => Number.isFinite(o?.lat) && Number.isFinite(o?.lng);

/** Variant bo'yicha segmentlar va jami ko'rsatkichlar. overrides — o'quvchi kiritgan haqiqiy masofa/vaqt. */
export function computeVariant(variant, objects) {
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  const seq = (variant.order || []).map((id) => byId[id]).filter(Boolean);
  const mode = MODES[variant.mode] || MODES.walk;
  const segments = [];
  for (let i = 0; i < seq.length - 1; i++) {
    const a = seq[i], b = seq[i + 1];
    const key = `${a.id}>${b.id}`;
    const est = hasCoords(a) && hasCoords(b) ? haversine(a, b) * mode.detour : null;
    const ov = variant.overrides?.[key] || {};
    const km = Number.isFinite(ov.km) ? ov.km : est;
    const min = Number.isFinite(ov.min) ? ov.min : km != null ? (km / mode.speed) * 60 : null;
    segments.push({ key, from: a, to: b, estKm: est, km, min, manual: Number.isFinite(ov.km) || Number.isFinite(ov.min) });
  }
  const travelKm = segments.reduce((s, x) => s + (x.km || 0), 0);
  const travelMin = segments.reduce((s, x) => s + (x.min || 0), 0);
  const visitMin = seq.reduce((s, o) => s + (Number(o.visit) || 0), 0);
  return {
    seq,
    segments,
    travelKm,
    travelMin,
    visitMin,
    totalMin: travelMin + visitMin,
    objectCount: seq.filter((o) => !SERVICE_TYPES.has(o.type)).length,
    serviceCount: seq.filter((o) => SERVICE_TYPES.has(o.type)).length,
    missingCoords: seq.filter((o) => !hasCoords(o)).length,
  };
}

/** Eng qisqa tartib (birinchi va oxirgi nuqta joyida qoladi): kichik marshrutda to'liq saralash, kattasida 2-opt. */
export function optimizeOrder(ids, objects) {
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  const pts = ids.map((id) => byId[id]);
  if (pts.length < 4 || pts.some((p) => !hasCoords(p))) return ids;
  const d = (i, j) => haversine(pts[i], pts[j]);
  const n = pts.length;
  const length = (ord) => ord.reduce((s, x, k) => (k ? s + d(ord[k - 1], x) : 0), 0);
  let best = [...Array(n).keys()];
  if (n - 2 <= 7) {
    const middle = best.slice(1, -1);
    let bestLen = Infinity;
    const permute = (arr, l) => {
      if (l === arr.length) {
        const ord = [0, ...arr, n - 1];
        const len = length(ord);
        if (len < bestLen) (bestLen = len), (best = ord);
        return;
      }
      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        permute(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    };
    permute(middle, 0);
  } else {
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < n - 2; i++)
        for (let k = i + 1; k < n - 1; k++) {
          const cand = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
          if (length(cand) + 1e-9 < length(best)) (best = cand), (improved = true);
        }
    }
  }
  return best.map((i) => ids[i]);
}

export function googleMapsUrl(seq, mode) {
  const pts = seq.filter(hasCoords).map((o) => `${o.lat.toFixed(6)},${o.lng.toFixed(6)}`);
  if (pts.length < 2) return null;
  const travelmode = mode === "walk" ? "walking" : "driving";
  const origin = pts[0], destination = pts[pts.length - 1];
  const waypoints = pts.slice(1, -1).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=${travelmode}`;
}

export const fmtKm = (km) => (km == null ? "—" : `${km.toFixed(2).replace(".", ",")} km`);
export function fmtMin(min) {
  if (min == null) return "—";
  const m = Math.round(min);
  return m >= 60 ? `${Math.floor(m / 60)} soat ${m % 60} daq` : `${m} daq`;
}

let leafletPromise;
export function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  leafletPromise ||= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/leaflet/leaflet.css";
    document.head.append(css);
    const s = document.createElement("script");
    s.src = "/vendor/leaflet/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error("Xarita kutubxonasini yuklab bo'lmadi. Internet aloqasini tekshiring."));
    document.head.append(s);
  });
  return leafletPromise;
}

export function makeMap(container, center = CITIES.Samarqand, zoom = 13) {
  const L = window.L;
  const map = L.map(container).setView(center, zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> mualliflari',
  }).addTo(map);
  return map;
}

export function numberedIcon(label, color) {
  return window.L.divIcon({
    className: "route-marker",
    html: `<span style="background:${color}">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function geojson(project) {
  return {
    type: "FeatureCollection",
    features: [
      ...project.objects.filter(hasCoords).map((o) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [o.lng, o.lat] },
        properties: { id: o.id, name: o.name, type: TYPE_NAME[o.type], visit_min: o.visit, services: o.services, source: o.source },
      })),
      ...(project.variants || []).map((v) => {
        const c = computeVariant(v, project.objects);
        return {
          type: "Feature",
          geometry: { type: "LineString", coordinates: c.seq.filter(hasCoords).map((o) => [o.lng, o.lat]) },
          properties: { name: v.name, mode: MODES[v.mode]?.name, distance_km: +c.travelKm.toFixed(2), total_min: Math.round(c.totalMin) },
        };
      }),
    ],
  };
}
