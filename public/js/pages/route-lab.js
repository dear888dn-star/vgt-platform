// Marshrut laboratoriyasi: "Turistik marshrutni raqamli modellashtirish" topshirig'i.
// Metodik model: kasbiy maqsad → hudud → obyektlar → ma'lumotlar bazasi → xarita → variantlar →
// masofa va vaqt → optimallashtirish → xarita va pasport → baholash → taqdimot → refleksiya → portfolio.
import { h, mount, toast, loading, fmtDate, confirmDialog, emptyState, downloadFile } from "../ui.js";
import { api } from "../api.js";
import { toCSV } from "../stats.js";
import { ROUTE_LAB_MAP, FUNCTIONS } from "../../data/standard.js";
import { competencyChips } from "../competency.js";
import {
  CITIES, OBJECT_TYPES, TYPE_NAME, TYPE_COLOR, SERVICE_TYPES, MODES,
  computeVariant, optimizeOrder, googleMapsUrl, fmtKm, fmtMin, hasCoords, loadLeaflet, makeMap, numberedIcon, geojson,
} from "../route-geo.js";

export const LEVELS = [
  { n: 1, name: "Bazaviy", text: "Turistik obyektlar va marshrut nuqtalari tayyor holda beriladi. Ularni raqamli xaritaga joylashtirish talab qilinadi." },
  { n: 2, name: "Amaliy", text: "O'quvchi obyektlarni mustaqil tanlaydi va ular asosida marshrut tuzadi." },
  { n: 3, name: "Konstruktiv", text: "O'quvchi ikki xil marshrut ishlab chiqib, ularni mezonlar asosida taqqoslaydi va optimal variantni tanlaydi." },
  { n: 4, name: "Tadqiqotchilik", text: "O'quvchi turistik hududni mustaqil tahlil qiladi, ma'lumotlar bazasini yaratadi, marshrutni modellashtiradi, optimallashtiradi va o'z yechimini iqtisodiy, turistik hamda geofazoviy asosda himoya qiladi." },
];

const TASK_TEXT = "Belgilangan turistik hudud uchun maqsadli turistlar guruhiga mos raqamli turistik marshrut ishlab chiqing. Marshrut tarkibiga kamida 5–7 ta turistik obyektni kiriting, ularning joylashuvini raqamli xaritada belgilang, obyektlar o'rtasidagi harakat yo'nalishini asoslang, umumiy masofa va vaqtni hisoblang hamda tayyor marshrutni raqamli xarita va qisqacha analitik hisobot shaklida taqdim eting.";

const SAMARKAND_CASE = "Turistik kompaniya Samarqand shahri bo'ylab bir kunlik madaniy-tarixiy ekskursiya marshrutini ishlab chiqishi kerak. Guruhda 10–15 nafar turist mavjud. Marshrut cheklangan vaqtda bir nechta muhim turistik obyektlarni qamrab olishi, harakatlanishni qulay tashkil etishi va turistlarning dam olish hamda ovqatlanish ehtiyojlarini hisobga olishi lozim. O'quvchi raqamli xarita asosida kamida ikki marshrut variantini ishlab chiqib, ulardan birini tanlashi va tanlovini asoslashi kerak.";

// Bazaviy daraja uchun tayyor obyektlar ro'yxati (koordinatalarni o'quvchi xaritada o'zi belgilaydi).
const SAMARKAND_OBJECTS = [
  ["Registon ansambli", "architecture", 60],
  ["Go'ri Amir maqbarasi", "historic", 40],
  ["Bibixonim masjidi", "architecture", 40],
  ["Siyob bozori", "cultural", 30],
  ["Shohi Zinda majmuasi", "pilgrimage", 50],
  ["Ulug'bek rasadxonasi", "museum", 45],
  ["Afrosiyob muzeyi", "museum", 45],
  ["Milliy taomlar restorani (tushlik)", "food", 60],
];

const REGION_CRITERIA = ["Turistik salohiyat", "Obyektlar konsentratsiyasi", "Transport qulayligi", "Turistlar uchun qiziqarlilik", "Vaqt cheklovlari", "Xavfsizlik", "Mavjud raqamli ma'lumotlar"];
const COMPARE_RATED = ["Transport qulayligi", "Turistik jozibadorlik", "Xizmatlar qamrovi", "Xavfsizlik"];
const EVAL_QUESTIONS = [
  "Marshrut maqsadli turistlar guruhiga mosmi?",
  "Tanlangan obyektlar bir-biri bilan mazmunan bog'langanmi?",
  "Marshrut davomiyligi maqbulmi?",
  "Harakatlanish sharoiti qulaymi?",
  "Dam olish uchun yetarli vaqt ajratilganmi?",
  "Xizmat ko'rsatish obyektlari mavjudmi?",
  "Marshrutda xavfsizlik masalalari hisobga olinganmi?",
  "Raqamli xarita tushunarlimi?",
  "Manbalar ishonchlimi?",
  "Marshrutni real turistik mahsulotga aylantirish mumkinmi?",
];
const REFLECTION = [
  "Marshrutni ishlab chiqishda qaysi raqamli vositadan foydalandingiz?",
  "Nima sababdan aynan shu vositani tanladingiz?",
  "Qaysi ma'lumotlar eng muhim bo'ldi?",
  "Marshrutning eng maqbul qismi qaysi?",
  "Qaysi bosqichda qiyinchilikka duch keldingiz?",
  "Qanday xatolar aniqlandi?",
  "Agar marshrutni qayta ishlab chiqsangiz, nimani o'zgartirar edingiz?",
  "Raqamli texnologiya marshrut sifatini qay tarzda yaxshiladi?",
];
const ROUTE_TYPES = ["Madaniy", "Tarixiy", "Ekologik", "Aralash"];
const STATUS = { draft: ["Qoralama", ""], submitted: ["Topshirilgan", "badge-warn"], graded: ["Baholangan", "badge-ok"] };

const uid = () => Math.random().toString(36).slice(2, 10);

function newProject(level, useCase) {
  const objects = useCase && level === 1 ? SAMARKAND_OBJECTS.map(([name, type, visit]) => ({ id: uid(), name, type, visit, lat: null, lng: null, services: "", source: "", note: "" })) : [];
  return {
    title: useCase ? "Samarqand: bir kunlik madaniy-tarixiy ekskursiya" : "Yangi turistik marshrut",
    level,
    caseText: useCase ? SAMARKAND_CASE : "",
    region: useCase ? "Samarqand" : "",
    center: useCase ? CITIES.Samarqand : null,
    routeType: useCase ? "Tarixiy" : "Aralash",
    audience: useCase ? "10–15 nafar turist, madaniy-tarixiy turizm ishqibozlari" : "",
    groupSize: useCase ? "10–15" : "",
    timeLimit: useCase ? "1 kun (8 soat)" : "",
    regionCriteria: {},
    objects,
    variants: [
      { id: uid(), name: "1-variant: qisqa masofali marshrut", mode: "walk", order: [], overrides: {}, ratings: {} },
      { id: uid(), name: "2-variant: ko'proq obyektni qamrab olgan marshrut", mode: "walk", order: [], overrides: {}, ratings: {} },
    ],
    chosen: null,
    justification: "",
    passport: { mapLink: "" },
    evaluation: {},
    report: "",
    presentationLink: "",
    portfolioLink: "",
    reflection: [],
  };
}

// ---------------- Ro'yxat ----------------

export async function renderList(el) {
  mount(el, loading());
  const { projects } = await api.get("routes");
  const levelSel = h("select", {}, LEVELS.map((l) => h("option", { value: l.n }, `${l.n}-daraja — ${l.name}`)));
  const useCase = h("input", { type: "checkbox", checked: true });
  const create = async () => {
    const id = uid();
    try {
      await api.put(`routes/${id}`, newProject(Number(levelSel.value), useCase.checked));
      location.hash = `#/route-lab/${id}`;
    } catch (e) {
      toast(e.message, "error");
    }
  };
  mount(
    el,
    h(
      "section",
      { class: "trainer-hero" },
      h("div", {}, h("div", { class: "eyebrow" }, "Amaliy-loyihaviy topshiriq"), h("h1", {}, "Marshrut laboratoriyasi"), h("p", { class: "lead" }, "Turistik marshrutni raqamli modellashtirish: hududni tanlash, obyektlar ma'lumotlar bazasi, raqamli xarita, masofa va vaqt hisobi, variantlarni taqqoslash, optimallashtirish va marshrut pasporti."), h("p", { class: "small" }, TASK_TEXT)),
      h(
        "div",
        { class: "card stack" },
        h("h3", {}, "Yangi loyiha"),
        h("label", { class: "field" }, h("span", {}, "Murakkablik darajasi"), levelSel),
        h("label", { class: "check" }, useCase, "Samarqand keysi asosida (bir kunlik madaniy-tarixiy ekskursiya)"),
        h("button", { class: "btn", onclick: create }, "➕ Loyihani boshlash")
      )
    ),
    h("div", { class: "grid cols-4" }, LEVELS.map((l) => h("div", { class: "card mini info" }, h("h4", {}, `${l.n}-daraja — ${l.name}`), h("p", { class: "small" }, l.text)))),
    h("h2", { class: "section-title" }, "Mening loyihalarim"),
    projects.length
      ? h(
          "div",
          { class: "grid cols-3" },
          projects.map((p) =>
            h(
              "a",
              { href: `#/route-lab/${p.id}`, class: "card" },
              h("div", { class: "row between" }, h("span", { class: "chip chip-soft" }, `${p.level}-daraja`), h("span", { class: `badge ${STATUS[p.status][1]}` }, STATUS[p.status][0])),
              h("h3", {}, p.title),
              h("p", { class: "small muted" }, `${p.region || "Hudud tanlanmagan"} · ${p.objects?.length || 0} ta obyekt`),
              p.grade && h("p", {}, "Baho: ", h("b", {}, `${p.grade.total}/100 — ${p.grade.level}`)),
              h("p", { class: "small muted" }, `Yangilangan: ${fmtDate(p.updatedAt)}`)
            )
          )
        )
      : emptyState("🗺️", "Hali loyiha yo'q", "Darajani tanlab, yangi marshrut loyihasini boshlang.")
  );
}

// ---------------- Loyiha ish maydoni ----------------

const STEPS = [
  ["task", "1. Vazifa va hudud"],
  ["objects", "2. Obyektlar bazasi"],
  ["map", "3. Raqamli xarita"],
  ["variants", "4. Variantlar va hisob"],
  ["compare", "5. Taqqoslash"],
  ["passport", "6. Marshrut pasporti"],
  ["report", "7. Baholash va hisobot"],
  ["reflection", "8. Refleksiya"],
];

export async function renderProject(el, id) {
  mount(el, loading());
  const { projects, rubric } = await api.get("routes");
  const p = projects.find((x) => x.id === id);
  if (!p) throw new Error("Loyiha topilmadi");
  const readOnly = false;
  let saveTimer;
  const status = h("span", { class: "small muted" }, "Saqlangan");
  const save = (immediate) => {
    status.textContent = "Saqlanmoqda...";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        const res = await api.put(`routes/${p.id}`, p);
        p.status = res.status;
        status.textContent = `Saqlandi ${new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}`;
      } catch (e) {
        status.textContent = "Saqlanmadi!";
        toast(e.message, "error");
      }
    }, immediate ? 0 : 1200);
  };
  window.addEventListener("hashchange", () => clearTimeout(saveTimer), { once: true });

  const content = h("div");
  const tabs = h("nav", { class: "tabs" });
  let current = new URLSearchParams(location.hash.split("?")[1] || "").get("step") || "task";
  const ctx = { p, save, readOnly, rerender: () => select(current) };
  const select = (key) => {
    current = key;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.key === key));
    history.replaceState(null, "", `#/route-lab/${p.id}?step=${key}`);
    content.replaceChildren(STEP_VIEWS[key](ctx));
  };
  STEPS.forEach(([key, label]) => tabs.append(h("button", { "data-key": key, onclick: () => select(key) }, label)));

  const submitBtn = h("button", { class: "btn", onclick: async () => {
    if (!(await confirmDialog("Loyihani o'qituvchiga topshirasizmi? Topshirilgandan keyin ham o'zgartirish kiritishingiz mumkin, ammo o'qituvchi buni ko'radi."))) return;
    try {
      clearTimeout(saveTimer);
      await api.put(`routes/${p.id}`, p);
      const res = await api.post(`routes/${p.id}/submit`, {});
      Object.assign(p, res);
      toast("Loyiha topshirildi", "ok");
      renderProject(el, id);
    } catch (e) {
      toast(e.message, "error");
    }
  } }, p.status === "draft" ? "📤 O'qituvchiga topshirish" : "📤 Qayta topshirish");

  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/route-lab" }, "Marshrut laboratoriyasi"), " / ", p.title),
    h(
      "div",
      { class: "row between wrap session-head" },
      h("div", {}, h("div", { class: "eyebrow" }, `${p.level}-daraja — ${LEVELS[p.level - 1].name}`), h("h2", {}, p.title)),
      h("div", { class: "row wrap" }, h("span", { class: `badge ${STATUS[p.status][1]}` }, STATUS[p.status][0]), status, submitBtn)
    ),
    p.grade && gradeCard(p.grade, rubric),
    tabs,
    content
  );
  select(STEPS.some(([k]) => k === current) ? current : "task");
}

export function gradeCard(grade, rubric) {
  return h(
    "div",
    { class: "card accent" },
    h("h3", {}, `O'qituvchi bahosi: ${grade.total}/100 — ${grade.level} daraja`),
    h("div", { class: "criteria" }, rubric.map((c, i) => h("div", { class: "criterion" }, h("div", { class: "row between small" }, h("span", {}, c.title), h("b", {}, `${grade.scores[i]}/${c.max}`)), h("div", { class: "progress" }, h("div", { class: "progress-fill", style: { width: `${(grade.scores[i] / c.max) * 100}%` } }))))),
    grade.feedback && h("p", {}, h("b", {}, "Izoh: "), grade.feedback)
  );
}

const bind = (obj, key, save, attrs = {}) => {
  const tag = attrs.tag || "input";
  const el = h(tag, { ...attrs, tag: undefined, value: tag === "input" ? obj[key] ?? "" : undefined }, tag === "textarea" ? obj[key] ?? "" : null);
  el.addEventListener("input", () => {
    obj[key] = attrs.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value;
    save();
  });
  return el;
};

const field = (label, input, hint) => h("label", { class: "field" }, h("span", {}, label), input, hint && h("small", { class: "muted" }, hint));

const STEP_VIEWS = {
  task({ p, save }) {
    const level = LEVELS[p.level - 1];
    const regionSel = h("select", {}, h("option", { value: "" }, "— Shahar / hudud —"), Object.keys(CITIES).map((c) => h("option", { value: c, selected: p.region === c }, c)), h("option", { value: "__other", selected: p.region && !CITIES[p.region] }, "Boshqa hudud"));
    const other = h("input", { placeholder: "Hudud nomi", value: p.region && !CITIES[p.region] ? p.region : "", class: p.region && !CITIES[p.region] ? "" : "hidden" });
    regionSel.addEventListener("change", () => {
      other.classList.toggle("hidden", regionSel.value !== "__other");
      if (regionSel.value !== "__other") {
        p.region = regionSel.value;
        p.center = CITIES[regionSel.value] || null;
      }
      save();
    });
    other.addEventListener("input", () => ((p.region = other.value), save()));
    return h(
      "div",
      { class: "grid cols-2" },
      h(
        "div",
        { class: "card stack" },
        h("h3", {}, "Topshiriq"),
        h("p", {}, TASK_TEXT),
        p.caseText && h("div", { class: "case-text" }, h("b", {}, "Keys: "), p.caseText),
        h("div", { class: "alert alert-info small" }, h("b", {}, `${level.n}-daraja — ${level.name}: `), level.text),
        h("div", { class: "small" }, h("b", {}, "Kasb standarti: "), FUNCTIONS.filter((f) => ROUTE_LAB_MAP.functions.includes(f.code)).map((f) => `${f.code} ${f.title}`).join("; "), competencyChips(ROUTE_LAB_MAP.kk)),
        h("p", { class: "small muted" }, "Aniq obyektlar, masofalar va vaqtlar siz tanlagan hudud va foydalanilgan ishonchli ma'lumotlar asosida aniqlanadi. Real marshrutda obyektlarning joriy ish rejimi va yo'l holati alohida tekshiriladi.")
      ),
      h(
        "div",
        { class: "card stack" },
        h("h3", {}, "Boshlang'ich ma'lumotlar"),
        field("Loyiha (marshrut) nomi", bind(p, "title", save)),
        field("Turistik hudud", h("div", { class: "stack" }, regionSel, other)),
        h("div", { class: "grid cols-2" },
          field("Marshrut turi", h("select", { onchange: (e) => ((p.routeType = e.target.value), save()) }, ROUTE_TYPES.map((t) => h("option", { selected: p.routeType === t }, t)))),
          field("Guruh soni", bind(p, "groupSize", save, { placeholder: "masalan: 10–15" }))),
        field("Maqsadli turistlar guruhi va xususiyatlari", bind(p, "audience", save, { tag: "textarea", rows: 2, placeholder: "yoshi, qiziqishlari, jismoniy imkoniyatlari, tili..." })),
        field("Tashrif uchun ajratilgan vaqt", bind(p, "timeLimit", save, { placeholder: "masalan: 1 kun (8 soat)" })),
        field("Xavfsizlik bilan bog'liq cheklovlar", bind(p, "safety", save, { tag: "textarea", rows: 2 }))
      ),
      h(
        "div",
        { class: "card stack span-2" },
        h("h3", {}, "Hududni tanlash mezonlari"),
        h("p", { class: "small muted" }, "Har bir mezon bo'yicha hududni 1–5 ballda baholang va qisqa izoh yozing."),
        REGION_CRITERIA.map((c) => {
          p.regionCriteria[c] ||= { score: null, note: "" };
          const rc = p.regionCriteria[c];
          return h(
            "div",
            { class: "crit-row" },
            h("b", {}, c),
            h("div", { class: "segmented" }, [1, 2, 3, 4, 5].map((n) => h("button", { class: `seg ${rc.score === n ? "active" : ""}`, onclick: (e) => { rc.score = n; [...e.target.parentNode.children].forEach((b) => b.classList.toggle("active", b === e.target)); save(); } }, n))),
            bind(rc, "note", save, { placeholder: "Izoh" })
          );
        })
      )
    );
  },

  objects(ctx) {
    const { p, save, rerender } = ctx;
    const table = h("tbody");
    const draw = () => {
      table.replaceChildren(
        ...p.objects.map((o, i) =>
          h(
            "tr",
            {},
            h("td", {}, i + 1),
            h("td", {}, bind(o, "name", save)),
            h("td", {}, h("select", { onchange: (e) => ((o.type = e.target.value), save()) }, OBJECT_TYPES.map(([k, n]) => h("option", { value: k, selected: o.type === k }, n)))),
            h("td", { class: "nowrap" }, hasCoords(o) ? `${o.lat.toFixed(5)}, ${o.lng.toFixed(5)}` : h("button", { class: "btn small ghost", onclick: () => { ctx.placeId = o.id; document.querySelector('[data-key="map"]').click(); } }, "📍 Xaritada joylash")),
            h("td", {}, bind(o, "visit", save, { type: "number", min: 0, class: "w-xs" })),
            h("td", {}, bind(o, "services", save, { placeholder: "hojatxona, kafe..." })),
            h("td", {}, bind(o, "source", save, { placeholder: "https://... yoki manba nomi" })),
            h("td", {}, h("button", { class: "icon-btn", title: "O'chirish", onclick: async () => {
              if (!(await confirmDialog(`"${o.name}" obyektini o'chirasizmi?`))) return;
              p.objects.splice(i, 1);
              p.variants.forEach((v) => (v.order = v.order.filter((x) => x !== o.id)));
              save();
              draw();
            } }, "🗑"))
          )
        )
      );
      if (!p.objects.length) table.append(h("tr", {}, h("td", { colspan: 8, class: "center muted" }, "Obyektlar yo'q. Quyidagi forma yoki xarita orqali qo'shing.")));
    };
    draw();
    const nf = { name: "", type: "historic", coords: "", visit: 30 };
    const coordsInput = bind(nf, "coords", () => {}, { placeholder: "39.6547, 66.9758 (ixtiyoriy)" });
    return h(
      "div",
      { class: "stack" },
      h("div", { class: "alert alert-info small" }, "Asosiy vazifa — obyektlarning maksimal sonini yig'ish emas, balki marshrut maqsadiga eng mos obyektlarni tanlash. Har bir obyekt uchun ishonchli manbani ko'rsating: GIS'da xaritaning o'zi yetarli emas, obyektni tavsiflovchi atributiv ma'lumotlar ham zarur."),
      h(
        "div",
        { class: "card table-wrap" },
        h("table", { class: "table obj-table" }, h("thead", {}, h("tr", {}, ["ID", "Nomi", "Turi", "Koordinata", "Tashrif (daq)", "Xizmatlar", "Manba", ""].map((t) => h("th", {}, t)))), table)
      ),
      h(
        "div",
        { class: "card" },
        h("h3", {}, "Obyekt qo'shish"),
        h("div", { class: "grid cols-4" },
          field("Nomi", bind(nf, "name", () => {})),
          field("Turi", h("select", { onchange: (e) => (nf.type = e.target.value) }, OBJECT_TYPES.map(([k, n]) => h("option", { value: k }, n)))),
          field("Koordinata (kenglik, uzunlik)", coordsInput, "Google Maps'da nuqtani o'ng tugma bilan bosib nusxalash mumkin"),
          field("Tashrif vaqti (daq)", bind(nf, "visit", () => {}, { type: "number", min: 0 }))),
        h("div", { class: "row wrap" },
          h("button", { class: "btn", onclick: () => {
            if (!nf.name.trim()) return toast("Obyekt nomini kiriting", "warn");
            let lat = null, lng = null;
            if (nf.coords.trim()) {
              const m = nf.coords.match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);
              if (!m) return toast("Koordinata formati: 39.6547, 66.9758", "warn");
              [lat, lng] = [Number(m[1]), Number(m[2])];
            }
            p.objects.push({ id: uid(), name: nf.name.trim(), type: nf.type, lat, lng, visit: Number(nf.visit) || 0, services: "", source: "", note: "" });
            save();
            rerender();
          } }, "Qo'shish"),
          h("button", { class: "btn ghost", onclick: () => document.querySelector('[data-key="map"]').click() }, "🗺 Xaritada bosib qo'shish"),
          h("button", { class: "btn ghost", onclick: () => downloadFile(`${p.title}-obyektlar.csv`, toCSV([["ID", "Nomi", "Turi", "Kenglik", "Uzunlik", "Tashrif vaqti (daq)", "Xizmatlar", "Manba"], ...p.objects.map((o, i) => [i + 1, o.name, TYPE_NAME[o.type], o.lat ?? "", o.lng ?? "", o.visit, o.services, o.source])])) }, "⬇ Ma'lumotlar bazasi (CSV)"))
      )
    );
  },

  map(ctx) {
    const { p, save, rerender } = ctx;
    const box = h("div", { class: "map-box" }, h("div", { class: "loading" }, h("span", { class: "spinner" }), "Xarita yuklanmoqda..."));
    const variantSel = h("select", {}, h("option", { value: "" }, "Faqat obyektlar"), p.variants.map((v, i) => h("option", { value: i }, v.name)));
    const addMode = h("input", { type: "checkbox", checked: Boolean(ctx.placeId) });
    const hint = h("div", { class: "small" });
    const legend = h("div", { class: "legend" }, OBJECT_TYPES.map(([k, n, c]) => h("span", {}, h("i", { style: { background: c } }), n)));
    const placing = () => p.objects.find((o) => o.id === ctx.placeId);
    const drawHint = () => {
      const o = placing();
      hint.replaceChildren(o ? h("div", { class: "alert alert-warn" }, `📍 “${o.name}” obyektining joylashuvini xaritada bosib belgilang.`) : addMode.checked ? h("div", { class: "alert alert-info" }, "Xaritada bosing — o'sha nuqtada yangi obyekt yaratiladi.") : "");
    };
    drawHint();
    addMode.addEventListener("change", drawHint);
    loadLeaflet()
      .then((L) => {
        box.replaceChildren();
        const withCoords = p.objects.filter(hasCoords);
        const map = makeMap(box, p.center || (withCoords[0] ? [withCoords[0].lat, withCoords[0].lng] : CITIES.Samarqand), 14);
        const layer = L.layerGroup().addTo(map);
        const draw = (fit) => {
          layer.clearLayers();
          const vi = variantSel.value;
          const v = vi === "" ? null : p.variants[vi];
          const seqIdx = v ? Object.fromEntries(v.order.map((id, k) => [id, k + 1])) : {};
          for (const o of p.objects.filter(hasCoords)) {
            const label = v ? seqIdx[o.id] || "·" : p.objects.indexOf(o) + 1;
            const m = L.marker([o.lat, o.lng], { icon: numberedIcon(label, TYPE_COLOR[o.type] || "#555"), draggable: true }).addTo(layer);
            m.bindPopup(`<b>${o.name.replace(/</g, "&lt;")}</b><br>${TYPE_NAME[o.type]}<br>Tashrif: ${o.visit || 0} daq`);
            m.on("dragend", () => {
              const ll = m.getLatLng();
              o.lat = +ll.lat.toFixed(6);
              o.lng = +ll.lng.toFixed(6);
              save();
              draw();
            });
          }
          if (v) {
            const c = computeVariant(v, p.objects);
            const pts = c.seq.filter(hasCoords).map((o) => [o.lat, o.lng]);
            if (pts.length > 1) L.polyline(pts, { color: "#0e7c86", weight: 4, opacity: 0.8, dashArray: v.mode === "walk" ? "6 8" : null }).addTo(layer);
          }
          const all = p.objects.filter(hasCoords).map((o) => [o.lat, o.lng]);
          if (fit && all.length > 1) map.fitBounds(all, { padding: [30, 30] });
        };
        map.on("click", (e) => {
          const o = placing();
          if (o) {
            o.lat = +e.latlng.lat.toFixed(6);
            o.lng = +e.latlng.lng.toFixed(6);
            ctx.placeId = null;
            save();
            drawHint();
            draw();
            toast(`“${o.name}” joylashtirildi`, "ok");
            const next = p.objects.find((x) => !hasCoords(x));
            if (next) {
              ctx.placeId = next.id;
              drawHint();
            }
            return;
          }
          if (!addMode.checked) return;
          const name = prompt("Yangi obyekt nomi:");
          if (!name) return;
          p.objects.push({ id: uid(), name: name.trim(), type: "historic", lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6), visit: 30, services: "", source: "", note: "" });
          save();
          draw();
          toast("Obyekt qo'shildi. Turini va manbasini “Obyektlar bazasi” bo'limida aniqlang.", "ok");
        });
        variantSel.addEventListener("change", () => draw(false));
        draw(true);
        setTimeout(() => map.invalidateSize(), 50);
      })
      .catch((e) => box.replaceChildren(h("div", { class: "alert alert-error" }, e.message)));
    const unplaced = p.objects.filter((o) => !hasCoords(o));
    return h(
      "div",
      { class: "stack" },
      h("div", { class: "card row wrap filter-bar" }, field("Ko'rsatish", variantSel), h("label", { class: "check" }, addMode, "Xaritada bosib obyekt qo'shish"), unplaced.length > 0 && h("button", { class: "btn small", onclick: () => { ctx.placeId = unplaced[0].id; drawHint(); } }, `📍 Joylashtirilmagan obyektlar: ${unplaced.length}`)),
      hint,
      box,
      legend,
      h("p", { class: "small muted" }, "Markerlarni sudrab joyini aniqlashtirishingiz mumkin. Raqamli xarita faqat chiroyli vizual material emas, balki marshrutning fazoviy mantig'ini tushuntiruvchi kasbiy hujjat vazifasini bajarishi kerak.")
    );
  },

  variants({ p, save, rerender }) {
    return h(
      "div",
      { class: "stack" },
      h("div", { class: "alert alert-info small" }, "Birinchi variant har doim ham eng maqbul bo'lmasligi mumkin, shuning uchun kamida ikki variant ishlab chiqing. Masofa va vaqt to'g'ri chiziqli masofa × yo'l egriligi koeffitsiyenti asosida taxminan hisoblanadi; Google Maps'dagi haqiqiy qiymatlarni segment jadvaliga kiritib aniqlashtiring."),
      p.variants.map((v, vi) => variantCard(p, v, vi, save, rerender)),
      h("button", { class: "btn ghost", onclick: () => { p.variants.push({ id: uid(), name: `${p.variants.length + 1}-variant`, mode: "walk", order: [], overrides: {}, ratings: {} }); save(); rerender(); } }, "+ Yana variant qo'shish")
    );
  },

  compare({ p, save }) {
    const calc = p.variants.map((v) => computeVariant(v, p.objects));
    const rows = [
      ["Umumiy masofa", (i) => fmtKm(calc[i].travelKm)],
      ["Umumiy vaqt", (i) => fmtMin(calc[i].totalMin)],
      ["Obyektlar soni", (i) => calc[i].objectCount],
    ];
    const ratingCell = (v, crit) => {
      v.ratings ||= {};
      return h("div", { class: "segmented small-seg" }, [1, 2, 3, 4, 5].map((n) => h("button", { class: `seg ${v.ratings[crit] === n ? "active" : ""}`, onclick: (e) => { v.ratings[crit] = n; [...e.target.parentNode.children].forEach((b) => b.classList.toggle("active", b === e.target)); save(); } }, n)));
    };
    return h(
      "div",
      { class: "stack" },
      h(
        "div",
        { class: "card table-wrap" },
        h("h3", {}, "Variantlarni mezonlar bo'yicha taqqoslash"),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Mezon"), p.variants.map((v) => h("th", {}, v.name)))),
          h("tbody", {},
            rows.map(([t, f]) => h("tr", {}, h("td", {}, t), p.variants.map((_, i) => h("td", {}, h("b", {}, f(i)))))),
            COMPARE_RATED.map((c) => h("tr", {}, h("td", {}, c, h("div", { class: "small muted" }, "1–5 ball")), p.variants.map((v) => h("td", {}, ratingCell(v, c))))))
        )
      ),
      h(
        "div",
        { class: "card stack" },
        h("h3", {}, "Optimal variant va asoslash"),
        h("div", { class: "row wrap" }, p.variants.map((v) => h("label", { class: "check" }, h("input", { type: "radio", name: "chosen", checked: p.chosen === v.id, onchange: () => ((p.chosen = v.id), save()) }), v.name))),
        field("Tanlovingizni dalillar bilan asoslang", bind(p, "justification", save, { tag: "textarea", rows: 5, placeholder: "Nima uchun aynan shu variant maqsadli guruh, vaqt, xavfsizlik va turistik jozibadorlik nuqtai nazaridan maqbul?" }))
      )
    );
  },

  passport({ p, save }) {
    const v = p.variants.find((x) => x.id === p.chosen) || p.variants[0];
    const c = v ? computeVariant(v, p.objects) : null;
    const gm = c && googleMapsUrl(c.seq, v.mode);
    const rows = [
      ["Marshrut nomi", p.title],
      ["Hudud", p.region || "—"],
      ["Marshrut turi", p.routeType],
      ["Boshlang'ich nuqta", c?.seq[0]?.name || "—"],
      ["Yakuniy nuqta", c?.seq[c.seq.length - 1]?.name || "—"],
      ["Obyektlar soni", c ? c.objectCount : "—"],
      ["Umumiy masofa", c ? fmtKm(c.travelKm) : "—"],
      ["Taxminiy davomiylik", c ? `${fmtMin(c.totalMin)} (harakat ${fmtMin(c.travelMin)} + tashrif ${fmtMin(c.visitMin)})` : "—"],
      ["Harakatlanish turi", v ? MODES[v.mode].name : "—"],
      ["Maqsadli turistlar guruhi", p.audience || "—"],
      ["Asosiy turistik resurslar", c ? c.seq.filter((o) => !SERVICE_TYPES.has(o.type)).map((o) => o.name).join(", ") : "—"],
      ["Xizmat ko'rsatish nuqtalari", c ? c.seq.filter((o) => SERVICE_TYPES.has(o.type)).map((o) => o.name).join(", ") || "—" : "—"],
      ["Ma'lumot manbalari", [...new Set(p.objects.map((o) => o.source).filter(Boolean))].join("; ") || "—"],
    ];
    return h(
      "div",
      { class: "stack" },
      h(
        "div",
        { class: "card passport", id: "passport" },
        h("div", { class: "row between" }, h("h2", {}, "Raqamli marshrut pasporti"), h("span", { class: "muted small" }, v ? `Asos: ${v.name}` : "")),
        h("table", { class: "book-table" }, h("tbody", {}, rows.map(([k, val]) => h("tr", {}, h("th", {}, k), h("td", {}, val))), h("tr", {}, h("th", {}, "Raqamli xarita"), h("td", {}, bind(p.passport, "mapLink", save, { placeholder: "Google My Maps yoki boshqa xarita havolasi" }), gm && h("div", { class: "small" }, "Avtomatik: ", h("a", { href: gm, target: "_blank", rel: "noopener" }, "Google Maps'da marshrut")))))),
        !p.chosen && h("p", { class: "small muted" }, "Pasport “Taqqoslash” bo'limida tanlangan optimal variant asosida to'ldiriladi.")
      ),
      h("div", { class: "row wrap" },
        h("button", { class: "btn ghost", onclick: () => window.print() }, "🖨 Chop etish"),
        h("button", { class: "btn ghost", onclick: () => downloadFile(`${p.title}.geojson`, JSON.stringify(geojson(p), null, 2), "application/geo+json") }, "⬇ GeoJSON (GIS uchun)"))
    );
  },

  report({ p, save }) {
    p.evaluation ||= {};
    return h(
      "div",
      { class: "grid cols-2" },
      h(
        "div",
        { class: "card stack" },
        h("h3", {}, "Marshrutni o'z-o'zini baholash"),
        h("p", { class: "small muted" }, "Marshrut texnik jihatdan to'g'ri tuzilgani uning turistik jihatdan samarali ekanini anglatmaydi."),
        EVAL_QUESTIONS.map((q, i) => {
          p.evaluation[i] ||= { ok: null, note: "" };
          const e = p.evaluation[i];
          return h(
            "div",
            { class: "eval-row" },
            h("span", {}, `${i + 1}. ${q}`),
            h("div", { class: "segmented" }, [["Ha", true], ["Qisman", "partly"], ["Yo'q", false]].map(([l, val]) => h("button", { class: `seg ${e.ok === val ? "active" : ""}`, onclick: (ev) => { e.ok = val; [...ev.target.parentNode.children].forEach((b) => b.classList.toggle("active", b === ev.target)); save(); } }, l)))
          );
        })
      ),
      h(
        "div",
        { class: "card stack" },
        h("h3", {}, "Yakuniy mahsulotlar"),
        field("Qisqacha analitik hisobot", bind(p, "report", save, { tag: "textarea", rows: 10, placeholder: "Hudud tahlili, obyektlar tanlovi sababi, variantlar taqqoslanishi, optimal variant, xavfsizlik va xizmatlar, tavsiyalar..." })),
        field("Marshrut taqdimoti havolasi", bind(p, "presentationLink", save, { type: "url", placeholder: "https://..." })),
        field("Elektron portfolio havolasi", bind(p, "portfolioLink", save, { type: "url", placeholder: "https://..." }))
      )
    );
  },

  reflection({ p, save }) {
    p.reflection ||= [];
    return h(
      "div",
      { class: "stack" },
      h("div", { class: "alert alert-info small" }, "Topshiriq yakunida quyidagi savollarga yozma javob bering. Refleksiya o'z kasbiy faoliyatingizni tahlil qilish va o'z-o'zini baholash ko'nikmasini rivojlantiradi."),
      REFLECTION.map((q, i) => {
        const ta = h("textarea", { rows: 3 }, p.reflection[i] || "");
        ta.addEventListener("input", () => ((p.reflection[i] = ta.value), save()));
        return h("label", { class: "card field" }, h("span", {}, `${i + 1}. ${q}`), ta);
      })
    );
  },
};

function variantCard(p, v, vi, save, rerender) {
  const c = computeVariant(v, p.objects);
  const available = p.objects.filter((o) => !v.order.includes(o.id));
  const addSel = h("select", {}, h("option", { value: "" }, "+ Obyekt qo'shish"), available.map((o) => h("option", { value: o.id }, o.name)));
  addSel.addEventListener("change", () => {
    if (!addSel.value) return;
    v.order.push(addSel.value);
    save();
    rerender();
  });
  const move = (i, d) => {
    [v.order[i], v.order[i + d]] = [v.order[i + d], v.order[i]];
    save();
    rerender();
  };
  const gm = googleMapsUrl(c.seq, v.mode);
  return h(
    "div",
    { class: "card stack" },
    h("div", { class: "row between wrap" }, bind(v, "name", save, { class: "variant-name" }), h("div", { class: "row" },
      h("select", { onchange: (e) => ((v.mode = e.target.value), save(), rerender()) }, Object.entries(MODES).map(([k, m]) => h("option", { value: k, selected: v.mode === k }, m.name))),
      p.variants.length > 2 && h("button", { class: "icon-btn", title: "Variantni o'chirish", onclick: () => { p.variants.splice(vi, 1); save(); rerender(); } }, "🗑"))),
    h(
      "div",
      { class: "grid cols-2" },
      h(
        "div",
        {},
        h("h4", {}, "Obyektlar ketma-ketligi"),
        h("ol", { class: "order-list" }, c.seq.map((o, i) =>
          h("li", { class: "order-item" }, h("span", {}, h("i", { class: "type-dot", style: { background: TYPE_COLOR[o.type] } }), o.name, !hasCoords(o) && h("span", { class: "badge badge-warn" }, "koordinata yo'q")),
            h("span", { class: "order-btns" },
              h("button", { class: "icon-btn", disabled: i === 0, onclick: () => move(i, -1) }, "▲"),
              h("button", { class: "icon-btn", disabled: i === c.seq.length - 1, onclick: () => move(i, 1) }, "▼"),
              h("button", { class: "icon-btn", onclick: () => { v.order.splice(i, 1); save(); rerender(); } }, "✕"))))),
        h("div", { class: "row wrap" }, addSel,
          h("button", { class: "btn small ghost", title: "Birinchi va oxirgi nuqta joyida qoladi", onclick: () => {
            if (c.missingCoords) return toast("Avval barcha obyektlarni xaritada joylashtiring", "warn");
            if (v.order.length < 4) return toast("Optimallashtirish uchun kamida 4 ta nuqta kerak", "warn");
            const before = c.travelKm;
            v.order = optimizeOrder(v.order, p.objects);
            const after = computeVariant(v, p.objects).travelKm;
            save();
            rerender();
            toast(after < before - 0.01 ? `Marshrut qisqardi: ${fmtKm(before)} → ${fmtKm(after)}` : "Joriy tartib allaqachon eng qisqa", "ok");
          } }, "⚡ Optimallashtirish"),
          gm && h("a", { class: "btn small ghost", href: gm, target: "_blank", rel: "noopener" }, "Google Maps'da ochish ↗"))
      ),
      h(
        "div",
        {},
        h("h4", {}, "Masofa va vaqt hisob-kitobi"),
        h(
          "div",
          { class: "table-scroll" },
          h(
            "table",
            { class: "book-table seg-table" },
            h("thead", {}, h("tr", {}, h("th", {}, "Segment"), h("th", {}, "Masofa, km"), h("th", {}, "Vaqt, daq"))),
            h("tbody", {}, c.segments.map((s) => {
              v.overrides ||= {};
              const ov = (v.overrides[s.key] ||= {});
              const km = h("input", { type: "number", step: "0.01", min: 0, placeholder: s.estKm != null ? s.estKm.toFixed(2) : "", value: Number.isFinite(ov.km) ? ov.km : "" });
              const mn = h("input", { type: "number", step: "1", min: 0, placeholder: s.min != null && !Number.isFinite(ov.min) ? Math.round(s.min) : "", value: Number.isFinite(ov.min) ? ov.min : "" });
              const upd = () => { ov.km = km.value === "" ? undefined : Number(km.value); ov.min = mn.value === "" ? undefined : Number(mn.value); save(); };
              km.addEventListener("change", () => (upd(), rerender()));
              mn.addEventListener("change", () => (upd(), rerender()));
              return h("tr", {}, h("td", { class: "small" }, `${s.from.name} → ${s.to.name}`), h("td", {}, km), h("td", {}, mn));
            }))
          )
        ),
        h("div", { class: "totals" },
          h("div", {}, h("span", {}, "Harakat masofasi"), h("b", {}, fmtKm(c.travelKm))),
          h("div", {}, h("span", {}, "Harakat vaqti"), h("b", {}, fmtMin(c.travelMin))),
          h("div", {}, h("span", {}, "Tashrif vaqti"), h("b", {}, fmtMin(c.visitMin))),
          h("div", {}, h("span", {}, "Jami davomiylik"), h("b", {}, fmtMin(c.totalMin)))),
        h("p", { class: "small muted" }, "Bo'sh katakdagi kulrang qiymat — taxminiy hisob. Haqiqiy qiymatni kiritsangiz, u hisobga olinadi.")
      )
    )
  );
}

/** O'qituvchi uchun loyiha ko'rinishi (faqat o'qish). */
export function projectSummary(p) {
  const mapBox = h("div", { class: "map-box small-map" });
  const chosen = p.variants?.find((x) => x.id === p.chosen) || p.variants?.[0];
  loadLeaflet()
    .then((L) => {
      const pts = p.objects.filter(hasCoords);
      const map = makeMap(mapBox, pts[0] ? [pts[0].lat, pts[0].lng] : p.center || CITIES.Samarqand, 14);
      const seqIdx = chosen ? Object.fromEntries(chosen.order.map((id, k) => [id, k + 1])) : {};
      pts.forEach((o) => L.marker([o.lat, o.lng], { icon: numberedIcon(seqIdx[o.id] || "·", TYPE_COLOR[o.type]) }).bindPopup(o.name).addTo(map));
      if (chosen) {
        const line = computeVariant(chosen, p.objects).seq.filter(hasCoords).map((o) => [o.lat, o.lng]);
        if (line.length > 1) L.polyline(line, { color: "#0e7c86", weight: 4 }).addTo(map);
      }
      if (pts.length > 1) map.fitBounds(pts.map((o) => [o.lat, o.lng]), { padding: [20, 20] });
      setTimeout(() => map.invalidateSize(), 50);
    })
    .catch(() => mapBox.replaceChildren(h("p", { class: "muted" }, "Xarita yuklanmadi")));
  const calc = (p.variants || []).map((v) => [v, computeVariant(v, p.objects)]);
  const evalLabel = { true: "Ha", partly: "Qisman", false: "Yo'q" };
  return h(
    "div",
    { class: "stack" },
    h("p", { class: "muted small" }, `${p.level}-daraja · ${p.region || "—"} · ${p.routeType} · guruh: ${p.audience || "—"}`),
    mapBox,
    h("h4", {}, `Obyektlar bazasi (${p.objects.length})`),
    h("div", { class: "table-scroll" }, h("table", { class: "book-table" }, h("thead", {}, h("tr", {}, ["#", "Nomi", "Turi", "Koordinata", "Tashrif", "Manba"].map((t) => h("th", {}, t)))), h("tbody", {}, p.objects.map((o, i) => h("tr", {}, h("td", {}, i + 1), h("td", {}, o.name), h("td", {}, TYPE_NAME[o.type]), h("td", { class: "nowrap" }, hasCoords(o) ? `${o.lat.toFixed(4)}, ${o.lng.toFixed(4)}` : "—"), h("td", {}, `${o.visit || 0} daq`), h("td", { class: "small" }, o.source || "—")))))),
    h("h4", {}, "Variantlar"),
    h("div", { class: "table-scroll" }, h("table", { class: "book-table" }, h("thead", {}, h("tr", {}, ["Variant", "Ketma-ketlik", "Masofa", "Davomiylik", ...COMPARE_RATED].map((t) => h("th", {}, t)))), h("tbody", {}, calc.map(([v, c]) => h("tr", { class: v.id === p.chosen ? "total-row" : "" }, h("td", {}, v.name, v.id === p.chosen ? " ✓" : ""), h("td", { class: "small" }, c.seq.map((o) => o.name).join(" → ")), h("td", {}, fmtKm(c.travelKm)), h("td", {}, fmtMin(c.totalMin)), COMPARE_RATED.map((k) => h("td", {}, v.ratings?.[k] ?? "—"))))))),
    p.justification && [h("h4", {}, "Tanlovni asoslash"), h("p", { class: "pre-wrap" }, p.justification)],
    h("h4", {}, "O'z-o'zini baholash"),
    h("ul", { class: "small" }, EVAL_QUESTIONS.map((q, i) => h("li", {}, q, " — ", h("b", {}, evalLabel[String(p.evaluation?.[i]?.ok)] ?? "—")))),
    p.report && [h("h4", {}, "Analitik hisobot"), h("p", { class: "pre-wrap" }, p.report)],
    h("p", { class: "small" }, [["Xarita", p.passport?.mapLink], ["Taqdimot", p.presentationLink], ["Portfolio", p.portfolioLink]].filter(([, u]) => u).map(([t, u]) => h("span", {}, `${t}: `, h("a", { href: u, target: "_blank", rel: "noopener noreferrer" }, u), " · "))),
    (p.reflection || []).some(Boolean) && [h("h4", {}, "Refleksiya"), h("dl", { class: "answers" }, REFLECTION.map((q, i) => [h("dt", {}, q), h("dd", {}, p.reflection[i] || "—")]))]
  );
}
