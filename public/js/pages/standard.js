// Kasb standarti: Gid tarjimon kvalifikatsiyasi bo'yicha mehnat funksiyalari, kompetensiyalar,
// ularni shakllantiruvchi platforma faoliyatlari va o'quvchining kompetensiya xaritasi.
import { h, mount, loading } from "../ui.js";
import { api, session } from "../api.js";
import { STANDARD, UK, KK, FUNCTIONS, MODULES, TOPIC_MAP, SCENARIO_MAP, ROUTE_LAB_MAP } from "../../data/standard.js";
import { TOPICS } from "../../data/topics.js";
import { mapFromEvidence, competencyTable, competencyChips } from "../competency.js";

const SCENARIO_NAMES = {
  "registon-tour": "Registon ansambli bo'ylab ekskursiya",
  "lost-tourist": "Buxoroda adashgan turist",
  overbooking: "Mehmonxonada overbooking",
  "double-payment": "Onlayn to'lovda ikki marta pul yechilishi",
  "khiva-virtual": "Ichan qal'a: onlayn virtual ekskursiya",
  "foreign-arrival": "Xorijiy turistni kutib olish",
  "negative-review": "Salbiy onlayn sharhga javob",
  "accessible-tour": "Imkoniyati cheklangan turist uchun tur",
  "itinerary-design": "Individual tur dasturini tuzish",
  "heat-emergency": "Issiq urishi: tibbiy favqulodda vaziyat",
};

/** Kompetensiyani shakllantiruvchi platforma faoliyatlari. */
function activitiesFor(code) {
  const topics = TOPICS.filter((t) => TOPIC_MAP[t.id]?.includes(code));
  const scenarios = Object.entries(SCENARIO_MAP).filter(([, m]) => m.kk.includes(code)).map(([id]) => id);
  const route = ROUTE_LAB_MAP.kk.includes(code);
  return h(
    "div",
    { class: "activities small" },
    topics.length > 0 && h("div", {}, "📚 ", topics.map((t, i) => [i ? ", " : "", h("a", { href: `#/topics/${t.id}` }, `${t.num}-mavzu`)])),
    scenarios.length > 0 && h("div", {}, "🎙 ", scenarios.map((id, i) => [i ? ", " : "", h("a", { href: `#/trainer/${id}` }, SCENARIO_NAMES[id] || id)])),
    route && h("div", {}, "🗺 ", h("a", { href: "#/route-lab" }, "Marshrut laboratoriyasi"))
  );
}

function competencyCard(c, focus) {
  return h(
    "div",
    { class: `card comp-card ${focus ? "focus" : ""}`, id: `c-${c.code}` },
    h("div", { class: "row between wrap" }, h("h3", {}, h("span", { class: c.kind === "KK" ? "chip chip-kk" : "chip chip-soft" }, c.code), " ", c.title), c.module && h("span", { class: "badge" }, c.module)),
    c.knowledge && h("div", { class: "grid cols-2" }, h("div", {}, h("h4", {}, "Bilim"), h("ul", { class: "small" }, c.knowledge.map((k) => h("li", {}, k)))), h("div", {}, h("h4", {}, "Ko'nikma"), h("ul", { class: "small" }, c.skills.map((k) => h("li", {}, k))))),
    h("h4", {}, "Platformada shakllantiriladi"),
    activitiesFor(c.code)
  );
}

export async function render(el) {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const focus = params.get("c");
  const tab = params.get("tab") || (focus ? "competencies" : session.user?.role === "student" ? "map" : "functions");
  const content = h("div", {}, loading());
  const tabs = [
    ...(session.user?.role === "student" ? [["map", "🧭 Mening kompetensiya xaritam"]] : []),
    ["functions", "🛠 Mehnat funksiyalari"],
    ["competencies", "🎯 Kompetensiyalar"],
    ["modules", "📦 Modullar"],
  ];
  mount(
    el,
    h(
      "section",
      { class: "trainer-hero" },
      h("div", {}, h("div", { class: "eyebrow" }, STANDARD.specialty), h("h1", {}, `Kasb standarti: ${STANDARD.qualification}`), h("p", { class: "lead" }, STANDARD.activity), h("p", { class: "small muted" }, "Asos: ", STANDARD.basis, ". Manba: ", STANDARD.source, ".")),
      h("div", { class: "stack" },
        h("div", { class: "card stat-card" }, h("b", {}, FUNCTIONS.length), h("span", { class: "muted small" }, "mehnat funksiyasi (A/01.5–A/07.5)")),
        h("div", { class: "card stat-card" }, h("b", {}, `${KK.length} + ${UK.length}`), h("span", { class: "muted small" }, "kasbiy (KK) va umumiy (UK) kompetensiya")))
    ),
    h("nav", { class: "tabs" }, tabs.map(([k, l]) => h("a", { href: `#/standard?tab=${k}`, class: tab === k ? "active" : "" }, l))),
    content
  );

  if (tab === "map") {
    const ev = await api.get("evidence");
    const map = mapFromEvidence(ev);
    const kk = map.filter((c) => c.kind === "KK");
    const formed = map.filter((c) => c.level === "Shakllangan").length;
    mount(
      content,
      h("div", { class: "alert alert-info" }, "Xarita sizning platformadagi faoliyatingiz asosida hisoblanadi: mavzularni o'zlashtirish, o'qituvchi baholagan mustaqil ishlar, trenajyor mashg'ulotlari (har bir ssenariy bo'yicha eng yaxshi natija) va baholangan marshrut loyihalari. 70% va undan yuqori — shakllangan, 40–69% — rivojlanmoqda."),
      h("div", { class: "grid cols-3" },
        h("div", { class: "card stat-card" }, h("b", {}, `${formed} / ${map.length}`), h("span", { class: "muted small" }, "kompetensiya shakllangan")),
        h("div", { class: "card stat-card" }, h("b", {}, `${kk.filter((c) => c.count).length} / ${kk.length}`), h("span", { class: "muted small" }, "kasbiy kompetensiya bo'yicha dalil bor")),
        h("div", { class: "card stat-card" }, h("b", {}, ev.trainer.length), h("span", { class: "muted small" }, "trenajyor mashg'uloti"))),
      h("div", { class: "card" }, h("h3", {}, "Kasbiy kompetensiyalar (Gid tarjimon)"), competencyTable(kk)),
      h("div", { class: "card" }, h("h3", {}, "Umumiy kompetensiyalar"), competencyTable(map.filter((c) => c.kind === "UK")))
    );
  } else if (tab === "functions") {
    mount(
      content,
      h("p", { class: "muted" }, "Kasb standartining funksional tahlili: har bir mehnat funksiyasi uchun mehnat harakatlari va ularga mos kasbiy kompetensiyalar."),
      FUNCTIONS.map((f) =>
        h(
          "div",
          { class: "card" },
          h("div", { class: "row between wrap" }, h("h3", {}, h("span", { class: "chip chip-kk" }, f.code), " ", f.title), competencyChips(f.kk)),
          h("h4", {}, "Mehnat harakatlari"),
          h("ul", { class: "small" }, f.actions.map((a) => h("li", {}, a))),
          h("h4", {}, "Trenajyor ssenariylari"),
          h("div", { class: "small" }, Object.entries(SCENARIO_MAP).filter(([, m]) => m.functions.includes(f.code)).map(([id], i) => [i ? " · " : "", h("a", { href: `#/trainer/${id}` }, SCENARIO_NAMES[id])]) , ROUTE_LAB_MAP.functions.includes(f.code) && [" · ", h("a", { href: "#/route-lab" }, "Marshrut laboratoriyasi")])
        )
      )
    );
  } else if (tab === "competencies") {
    mount(content, h("h2", { class: "section-title" }, "Kasbiy kompetensiyalar — Gid tarjimon"), KK.map((c) => competencyCard(c, c.code === focus)), h("h2", { class: "section-title" }, "Umumiy kompetensiyalar"), UK.map((c) => competencyCard(c, c.code === focus)));
    if (focus) setTimeout(() => document.getElementById(`c-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  } else {
    mount(
      content,
      h("div", { class: "card table-wrap" }, h("table", { class: "table" }, h("thead", {}, h("tr", {}, ["Kod", "Modul kodi", "Modul nomi", "Kredit"].map((t) => h("th", {}, t)))), h("tbody", {}, MODULES.map((m) => h("tr", {}, h("td", {}, m.code), h("td", {}, m.id), h("td", {}, m.title), h("td", {}, m.credits)))))),
      h(
        "div",
        { class: "card table-wrap" },
        h("h3", {}, "“Turizmda raqamli texnologiyalar” — modul darslari (o'quv qo'llanma asosida)"),
        h("p", { class: "small muted" }, "Darslar mazmuni “Turizmda raqamli texnologiyalar” o'quv qo'llanmasidan (Jizzax, 2025) olingan; har bir dars kasb standarti kompetensiyalari bilan bog'langan."),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, ["№", "Mavzu (dars)", "Reja", "Kompetensiyalar"].map((t) => h("th", {}, t)))),
          h("tbody", {}, TOPICS.map((t) => h("tr", {}, h("td", {}, t.num), h("td", {}, h("a", { href: `#/topics/${t.id}` }, t.title)), h("td", { class: "small" }, t.plan.map((x) => h("div", {}, x))), h("td", {}, competencyChips(TOPIC_MAP[t.id] || [])))))
        )
      ),
      h("p", { class: "small muted" }, "“Turizmda raqamli texnologiyalar” fani mutaxassislik moduli 5PM0399 “Iqtisodiyotda axborot-kommunikatsiya texnologiyalari va tizimlari” hamda UK-7, UK-8 umumiy kompetensiyalari bilan bevosita bog'liq; professional modullardagi raqamli talablar (axborot texnologiyalaridan foydalanish, SMM/SMO, raqamli xavfsizlik, ma'lumotlar bazasi) KK-2.3, KK-2.4, KK-2.5 orqali qamrab olinadi.")
    );
  }
}
