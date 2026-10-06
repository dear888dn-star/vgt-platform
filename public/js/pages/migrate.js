// Ma'lumotlarni eski saytdan (Netlify) yangi saytga (Cloudflare) ko'chirish sahifasi: #/migrate
// Brauzer eski saytdan sahifalab oladi (/api/migrate/export) va shu saytga yozadi (/api/migrate/import).
import { h, mount, toast } from "../ui.js";

const STATE_KEY = "vgt.migrate";
const fmtMB = (n) => `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

function saved() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
  } catch {
    return {};
  }
}
function save(s) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {}
}

export function render(el) {
  const st = saved();
  const source = h("input", { type: "url", required: true, placeholder: "https://eski-sayt.netlify.app", value: st.source || "" });
  const code = h("input", { type: "password", required: true, autocomplete: "off", placeholder: "TEACHER_CODE" });
  const bar = h("div", { class: "mg-bar" }, h("i"));
  const status = h("div", { class: "mg-status muted" }, st.after ? `Oldingi ko'chirish to'xtagan joydan davom etadi (${st.count || 0} ta yozuv ko'chirilgan).` : "");
  const log = h("ol", { class: "mg-log" });
  let running = false;

  const btn = h("button", { class: "btn lg", type: "submit" }, st.after ? "▶ Davom ettirish" : "🚚 Ko'chirishni boshlash");
  const reset = h("button", { class: "btn ghost", type: "button", onclick: () => {
    save({});
    toast("Ko'chirish holati tozalandi — boshidan boshlanadi", "ok");
    render(el);
  } }, "↺ Boshidan");

  const form = h("form", { class: "card stack mg-card", onsubmit: async (e) => {
    e.preventDefault();
    if (running) return;
    const origin = source.value.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(origin)) return toast("Eski sayt manzilini to'liq kiriting (https://…)", "warn");
    if (origin === location.origin) return toast("Eski sayt manzili shu saytning o'zi bo'lishi mumkin emas", "warn");
    running = true;
    btn.disabled = true;
    const headers = { "x-teacher-code": code.value };
    let s = saved().source === origin ? saved() : { source: origin, after: "", count: 0, bytes: 0 };
    save(s);
    try {
      for (;;) {
        const r = await fetch(`${origin}/api/migrate/export?after=${encodeURIComponent(s.after || "")}`, { headers });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `Eski sayt javob bermadi (${r.status}). Unda platformaning yangi versiyasi joylanganini tekshiring.`);
        if (d.items.length) {
          const w = await fetch("/api/migrate/import", { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ items: d.items }) });
          const wd = await w.json().catch(() => ({}));
          if (!w.ok) throw new Error(wd.error || `Yangi saytga yozib bo'lmadi (${w.status})`);
          s.count += wd.imported;
          s.bytes += d.items.reduce((n, it) => n + (it.b64 ? it.b64.length * 0.75 : JSON.stringify(it.v).length), 0);
        }
        s.after = d.next ?? s.after;
        save(s);
        const pct = d.total ? Math.min(100, (d.done / d.total) * 100) : 100;
        bar.firstChild.style.width = `${pct}%`;
        status.textContent = `${s.count} ta yozuv · ${fmtMB(s.bytes)} · ${Math.round(pct)}%`;
        if (d.items.length) log.prepend(h("li", {}, `${d.items.length} ta: ${d.items[0].k} … ${d.items[d.items.length - 1].k}`));
        if (d.next === null) break;
      }
      save({ source: origin, finished: new Date().toISOString(), count: s.count, bytes: s.bytes });
      status.replaceChildren(h("b", {}, `✅ Tayyor! ${s.count} ta yozuv (${fmtMB(s.bytes)}) ko'chirildi. `), h("a", { href: "#/login" }, "Endi eski login va parol bilan kiring →"));
      toast("Ma'lumotlar ko'chirildi", "ok");
    } catch (err) {
      status.replaceChildren(h("span", { class: "err-text" }, `⚠️ ${err.message} `), "Qayta bosing — ko'chirish to'xtagan joydan davom etadi.");
    } finally {
      running = false;
      btn.disabled = false;
      btn.textContent = "▶ Davom ettirish";
    }
  } },
    h("h1", {}, "🚚 Ma'lumotlarni ko'chirish"),
    h("p", { class: "muted" }, "Eski saytdagi (Netlify) barcha ma'lumotlar — o'quvchilar, parollar, diagnostika, so'rovnomalar, natijalar, taqdimotlar, videolar va AI ovozlari — shu saytga ko'chiriladi. Eski saytdagi ma'lumotlar o'chirilmaydi."),
    h("ol", { class: "small" },
      h("li", {}, "Ikkala saytda ham bir xil TEACHER_CODE o'rnatilgan bo'lsin."),
      h("li", {}, "Eski saytga platformaning yangi versiyasi joylangan bo'lsin (unda ko'chirish funksiyasi bor)."),
      h("li", {}, "Ko'chirish tugaguncha sahifani yopmang. Uzilib qolsa — qayta bosing, to'xtagan joydan davom etadi.")),
    h("label", { class: "field" }, h("span", {}, "Eski sayt manzili"), source),
    h("label", { class: "field" }, h("span", {}, "O'qituvchi kodi (TEACHER_CODE)"), code),
    h("div", { class: "row wrap" }, btn, reset),
    bar,
    status,
    log);
  mount(el, h("div", { class: "auth-wrap" }, form));
}
