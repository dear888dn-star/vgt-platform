// Ekskursiya studiyasi: o'quvchi o'z virtual ekskursiyasini yaratadi (bekatlar, manzara, gid matni, faktlar),
// AI ovozida tinglaydi, AI metodistdan baho oladi va havola orqali ulashadi.
import { h, mount, toast, loading, confirmDialog, fmtDate } from "../ui.js";
import { api } from "../api.js";
import { sceneSVG, mountScene, LANDMARK_NAMES } from "../landmarks.js";
import { playTour } from "./tour.js";
import { createNarrator, aiVoiceReady } from "../narrator.js";

const TIMES = [["day", "☀️ Kunduz"], ["sunset", "🌇 Shom"], ["night", "🌙 Tun"]];
const CITY_OF = { registan: "Samarqand", guramir: "Samarqand", shahizinda: "Samarqand", khiva: "Xiva", bukhara: "Buxoro", aksaray: "Shahrisabz", tashkent: "Toshkent" };
const words = (t) => String(t || "").split(/\s+/).filter(Boolean).length;
const secs = (t) => Math.round(words(t) / 2.2); // ~130 so'z/daqiqa

export async function renderList(el) {
  mount(el, loading());
  const tours = await api.get("studio");
  const create = async () => {
    const t = await api.post("studio", { title: "Mening ekskursiyam", stops: [{ landmark: "registan", time: "day", city: "Samarqand", title: "Registon maydoni", narration: "", facts: [] }] });
    location.hash = `#/studio/${t.id}`;
  };
  mount(
    el,
    h(
      "section",
      { class: "studio-hero" },
      h("div", { class: "studio-hero-bg", html: sceneSVG({ landmark: "khiva", time: "sunset" }) }),
      h("div", { class: "studio-hero-content" },
        h("div", { class: "eyebrow" }, "Ekskursiya studiyasi"),
        h("h1", {}, "🎬 O'z virtual ekskursiyangizni yarating"),
        h("p", { class: "lead" }, "Bekatlarni tanlang, gid matnini yozing, faktlar qo'shing — platforma uni manzaralar va o'zbekcha AI ovozi bilan “jonlantiradi”. AI metodist matningizni tahlil qilib, maslahat beradi. Tayyor ekskursiyani havola orqali ulashing."),
        h("button", { class: "btn lg", onclick: create }, "➕ Yangi ekskursiya"))
    ),
    h("h2", { class: "section-title" }, "Mening ekskursiyalarim"),
    tours.length
      ? h("div", { class: "studio-grid" }, tours.map((t) => h("a", { class: "studio-card tilt", href: `#/studio/${t.id}` },
          h("div", { class: "sc-thumb", html: sceneSVG({ landmark: t.stops[0]?.landmark || "registan", time: t.stops[0]?.time || "day", animated: false, caravan: false }) }),
          h("div", { class: "sc-body" }, h("b", {}, t.title), h("small", { class: "muted" }, `${t.stops.length} bekat · ~${Math.max(1, Math.round(t.stops.reduce((n, s) => n + secs(s.narration), 0) / 60))} daqiqa · ${fmtDate(t.updatedAt)}`), h("span", { class: `badge ${t.published ? "badge-ok" : ""}` }, t.published ? "🔗 Ulashilgan" : "Qoralama")))))
      : h("div", { class: "card empty" }, h("div", { class: "empty-icon" }, "🧭"), h("h3", {}, "Hali ekskursiya yo'q"), h("p", { class: "muted" }, "Birinchi virtual ekskursiyangizni yarating — bu gid sifatida raqamli mahsulot tayyorlash mashqi."), h("button", { class: "btn", onclick: create }, "➕ Yangi ekskursiya"))
  );
}

export async function renderEditor(el, id) {
  mount(el, loading());
  const tours = await api.get("studio");
  const tour = tours.find((t) => t.id === id);
  if (!tour) throw new Error("Ekskursiya topilmadi");
  let cur = 0;
  let saveTimer;
  const status = h("span", { class: "muted small" }, "Saqlangan");
  const save = () => {
    status.textContent = "Saqlanmoqda…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        Object.assign(tour, await api.put(`studio/${id}`, { title: tour.title, description: tour.description, stops: tour.stops, published: tour.published }));
        status.textContent = "✓ Saqlandi";
      } catch (e) {
        status.textContent = `⚠️ ${e.message}`;
      }
    }, 700);
  };

  const preview = h("div", { class: "studio-preview" });
  const stopList = h("ol", { class: "studio-stops" });
  const editor = h("div", { class: "card studio-editor" });
  const reviewBox = h("div");
  let narr = null;

  const drawPreview = () => {
    const s = tour.stops[cur];
    if (!s) return preview.replaceChildren();
    const host = h("div", { class: "sp-scene" });
    mountScene(host, { landmark: s.landmark, time: s.time });
    preview.replaceChildren(host, h("div", { class: "sp-overlay" }, h("span", { class: "tour-chip" }, `📍 ${s.city || "—"} · ${cur + 1}/${tour.stops.length}`), h("h2", {}, s.title || "Nomsiz bekat")), s.narration && h("div", { class: "sp-caption" }, s.narration));
  };

  const drawList = () => {
    stopList.replaceChildren(
      ...tour.stops.map((s, i) =>
        h("li", { class: i === cur ? "active" : "" },
          h("button", { class: "ss-main", onclick: () => ((cur = i), drawAll()) }, h("span", { class: "ts-num" }, i + 1), h("span", {}, h("b", {}, s.title || "Nomsiz bekat"), h("small", {}, `${LANDMARK_NAMES[s.landmark]} · ~${secs(s.narration)} s`))),
          h("div", { class: "ss-tools" },
            h("button", { class: "icon-btn", title: "Yuqoriga", disabled: i === 0, onclick: () => { [tour.stops[i - 1], tour.stops[i]] = [tour.stops[i], tour.stops[i - 1]]; cur = i - 1; drawAll(); save(); } }, "↑"),
            h("button", { class: "icon-btn", title: "Pastga", disabled: i === tour.stops.length - 1, onclick: () => { [tour.stops[i + 1], tour.stops[i]] = [tour.stops[i], tour.stops[i + 1]]; cur = i + 1; drawAll(); save(); } }, "↓"),
            h("button", { class: "icon-btn", title: "O'chirish", disabled: tour.stops.length === 1, onclick: () => { tour.stops.splice(i, 1); cur = Math.min(cur, tour.stops.length - 1); drawAll(); save(); } }, "✕")))
      ),
      tour.stops.length < 12 && h("li", {}, h("button", { class: "btn ghost block", onclick: () => { tour.stops.push({ landmark: "bukhara", time: "day", city: "Buxoro", title: "", narration: "", facts: [] }); cur = tour.stops.length - 1; drawAll(); save(); } }, "➕ Bekat qo'shish"))
    );
  };

  const drawEditor = () => {
    const s = tour.stops[cur];
    const counter = h("small", { class: "muted" });
    const updCounter = () => {
      const w = words(s.narration);
      counter.textContent = `${w} so'z · ~${secs(s.narration)} soniya ${w < 40 ? "· qisqa" : w > 220 ? "· juda uzun" : "· yaxshi hajm ✓"}`;
      counter.className = w < 40 || w > 220 ? "warn-text small" : "ok-text small";
    };
    const narration = h("textarea", { rows: 7, maxlength: 1500, placeholder: "Gid sifatida guruhga nima deysiz? Qiziqtiruvchi boshlanish, asosiy ma'lumot, qiziq rivoyat va guruhga savol…", oninput: (e) => { s.narration = e.target.value; updCounter(); drawPreview(); drawList(); save(); } });
    narration.value = s.narration;
    updCounter();
    const facts = h("textarea", { rows: 3, placeholder: "Har bir qatorda bitta fakt (masalan: Qurilgan yili — 1417–1420)", oninput: (e) => { s.facts = e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6); save(); } });
    facts.value = (s.facts || []).join("\n");
    const listenBtn = h("button", { class: "btn ghost", onclick: async () => {
      if (!s.narration.trim()) return toast("Avval gid matnini yozing", "warn");
      narr ||= createNarrator({ onNotice: (m) => toast(m, "warn") });
      listenBtn.disabled = true;
      listenBtn.textContent = "⏳ Ovoz tayyorlanmoqda…";
      const res = await narr.speak(s.narration, { style: "guide" });
      listenBtn.disabled = false;
      listenBtn.textContent = "🔊 AI ovozida tinglash";
      if (res === "none") toast("AI ovozi hozircha mavjud emas", "warn");
    } }, "🔊 AI ovozida tinglash");
    editor.replaceChildren(
      h("h3", {}, `${cur + 1}-bekat`),
      h("div", { class: "lm-picker" }, Object.keys(LANDMARK_NAMES).map((k) => h("button", { class: `lm-opt ${s.landmark === k ? "active" : ""}`, title: LANDMARK_NAMES[k], onclick: () => { if (!s.city || s.city === CITY_OF[s.landmark]) s.city = CITY_OF[k]; s.landmark = k; drawAll(); save(); } }, h("span", { html: sceneSVG({ landmark: k, time: s.time, animated: false, caravan: false }) }), h("small", {}, LANDMARK_NAMES[k])))),
      h("div", { class: "segmented time-seg" }, TIMES.map(([k, l]) => h("button", { class: `seg ${s.time === k ? "active" : ""}`, onclick: () => { s.time = k; drawAll(); save(); } }, l))),
      h("div", { class: "grid cols-2" },
        h("label", { class: "field" }, h("span", {}, "Bekat nomi"), h("input", { value: s.title, maxlength: 120, placeholder: "Masalan: Registon maydoni", oninput: (e) => { s.title = e.target.value; drawPreview(); drawList(); save(); } })),
        h("label", { class: "field" }, h("span", {}, "Shahar"), h("input", { value: s.city, maxlength: 60, oninput: (e) => { s.city = e.target.value; drawPreview(); save(); } }))),
      h("label", { class: "field" }, h("span", {}, "Gid matni (ovozli hikoya)"), narration, counter),
      h("label", { class: "field" }, h("span", {}, "Faktlar"), facts),
      h("div", { class: "row wrap" }, listenBtn)
    );
  };

  const drawAll = () => {
    drawList();
    drawEditor();
    drawPreview();
  };

  const reviewBtn = h("button", { class: "btn ghost", onclick: async () => {
    reviewBtn.disabled = true;
    reviewBox.replaceChildren(h("div", { class: "card" }, loading("🤖 AI metodist ekskursiyangizni tahlil qilmoqda…")));
    try {
      clearTimeout(saveTimer);
      await api.put(`studio/${id}`, { title: tour.title, description: tour.description, stops: tour.stops, published: tour.published });
      tour.review = await api.post(`studio/${id}/review`);
      drawReview();
    } catch (e) {
      reviewBox.replaceChildren(h("div", { class: "alert alert-error" }, e.message));
    }
    reviewBtn.disabled = false;
  } }, "🤖 AI metodist tahlili");
  const drawReview = () => tour.review && reviewBox.replaceChildren(h("div", { class: "card studio-review" }, h("h3", {}, "🤖 AI metodist xulosasi"), h("div", { class: "review-text" }, tour.review.text), h("small", { class: "muted" }, fmtDate(tour.review.at))));

  const shareUrl = `${location.origin}/#/studio/view/${id}`;
  const shareBtn = h("button", { class: `btn ${tour.published ? "ghost" : ""}`, onclick: async () => {
    tour.published = !tour.published;
    save();
    shareBtn.textContent = tour.published ? "🔗 Havolani nusxalash" : "🔗 Ulashish";
    if (tour.published) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast("Havola nusxalandi — istalgan kishi ekskursiyangizni ko'ra oladi", "ok");
      } catch {
        prompt("Havolani nusxalang:", shareUrl);
      }
    } else toast("Ulashish o'chirildi", "ok");
  } }, tour.published ? "🔗 Havolani nusxalash" : "🔗 Ulashish");

  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/studio" }, "Ekskursiya studiyasi"), " / ", tour.title),
    h("div", { class: "studio-head" },
      h("div", { class: "grow" },
        h("input", { class: "studio-title", value: tour.title, maxlength: 140, "aria-label": "Ekskursiya nomi", oninput: (e) => { tour.title = e.target.value; save(); } }),
        h("input", { class: "studio-desc", value: tour.description || "", maxlength: 600, placeholder: "Qisqa tavsif: kimlar uchun, qancha davom etadi…", "aria-label": "Tavsif", oninput: (e) => { tour.description = e.target.value; save(); } })),
      h("div", { class: "row wrap" }, status, h("a", { class: "btn", href: `#/studio/view/${id}` }, "▶ Ko'rish"), reviewBtn, shareBtn,
        h("button", { class: "btn ghost danger-text", onclick: async () => {
          if (!(await confirmDialog("Ekskursiyani o'chirasizmi?"))) return;
          await api.del(`studio/${id}`);
          location.hash = "#/studio";
        } }, "🗑"))),
    h("div", { class: "studio-layout" }, h("div", { class: "stack" }, preview, h("div", { class: "card" }, h("h3", {}, "🚏 Bekatlar"), stopList)), editor),
    reviewBox
  );
  drawAll();
  drawReview();
  aiVoiceReady();
  return () => {
    narr?.stop();
    clearTimeout(saveTimer);
  };
}

export async function renderView(el, id) {
  mount(el, loading());
  let tour;
  try {
    tour = await api.get(`studio/view/${id}`);
  } catch (e) {
    mount(el, h("div", { class: "card empty" }, h("div", { class: "empty-icon" }, "🔒"), h("h3", {}, "Ekskursiya ochilmadi"), h("p", { class: "muted" }, e.message)));
    return;
  }
  const playable = tour.stops.filter((s) => s.narration?.trim());
  if (!playable.length) {
    mount(el, h("div", { class: "card empty" }, h("div", { class: "empty-icon" }, "✍️"), h("h3", {}, "Ekskursiyada hali gid matni yo'q")));
    return;
  }
  return playTour(el, {
    stops: playable,
    hero: h(
      "section",
      { class: "tour-hero" },
      h("div", {}, h("div", { class: "eyebrow" }, `O'quvchi ekskursiyasi · ${tour.author}${tour.college ? `, ${tour.college}` : ""}`), h("h1", {}, `🧭 ${tour.title}`), tour.description && h("p", { class: "lead" }, tour.description), h("div", { class: "row wrap" }, h("a", { class: "btn ghost", href: "#/studio" }, "🎬 O'z ekskursiyamni yaratish"), h("a", { class: "btn ghost", href: "#/tour" }, "🧭 Namunaviy sayohat"))),
      h("div", { class: "tour-hero-stats" }, [[playable.length, "bekat"], [new Set(playable.map((s) => s.city)).size, "shahar"], [`~${Math.max(1, Math.round(playable.reduce((n, s) => n + secs(s.narration), 0) / 60))}`, "daqiqa"]].map(([n, l]) => h("div", {}, h("b", {}, n), h("span", {}, l))))
    ),
  });
}
