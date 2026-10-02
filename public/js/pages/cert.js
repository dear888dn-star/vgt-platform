// Kurs sertifikati: ochiq havola orqali haqiqiyligini tekshirish va chop etish (A4, albom).
import { h, mount, toast, loading, fmtLongDate } from "../ui.js";
import { api } from "../api.js";
import { confetti } from "../motion.js";

export async function render(el, code) {
  mount(el, loading());
  let cert;
  try {
    cert = await api.get(`certificate/${code}`);
  } catch (e) {
    mount(el, h("div", { class: "card empty" }, h("div", { class: "empty-icon" }, "❌"), h("h3", {}, "Sertifikat topilmadi"), h("p", { class: "muted" }, `“${code}” raqamli sertifikat ro'yxatda yo'q. Raqamni tekshirib, qayta urinib ko'ring.`)));
    return;
  }
  const url = `${location.origin}/#/cert/${cert.code}`;
  const date = fmtLongDate(cert.issuedAt);
  mount(
    el,
    h("div", { class: "alert alert-ok cert-verified no-print" }, "✅ Bu sertifikat haqiqiy: “Safar akademiya” platformasi ro'yxatida mavjud."),
    h(
      "article",
      { class: "certificate" },
      h("div", { class: "cert-border", "aria-hidden": "true" }),
      h("div", { class: "cert-corner tl", "aria-hidden": "true" }), h("div", { class: "cert-corner tr", "aria-hidden": "true" }), h("div", { class: "cert-corner bl", "aria-hidden": "true" }), h("div", { class: "cert-corner br", "aria-hidden": "true" }),
      h("div", { class: "cert-brand" }, h("span", {}, "🧭"), "SAFAR AKADEMIYA"),
      h("h1", { class: "cert-title" }, "SERTIFIKAT"),
      h("p", { class: "cert-lead" }, "Ushbu sertifikat"),
      h("div", { class: "cert-name" }, cert.name),
      h("p", { class: "cert-org" }, [cert.college, cert.group && `${cert.group} guruhi`].filter(Boolean).join(", ")),
      h("p", { class: "cert-text" }, "“", h("b", {}, cert.course), "” fani bo'yicha raqamli ta'lim kursini, virtual gidlik trenajyori mashg'ulotlarini va amaliy topshiriqlarni muvaffaqiyatli yakunlaganligini tasdiqlaydi."),
      h(
        "div",
        { class: "cert-stats" },
        [
          [cert.stats.topicsDone, "mavzu o'zlashtirildi"],
          [cert.stats.bestTrainer, "trenajyordagi eng yaxshi ball"],
          [cert.stats.scenarios, "kasbiy ssenariy"],
          [cert.stats.xp, "XP"],
        ].map(([v, l]) => h("div", {}, h("b", {}, v), h("span", {}, l)))
      ),
      h("div", { class: "cert-level" }, cert.stats.levelIcon, " Daraja: ", h("b", {}, cert.stats.level)),
      h(
        "div",
        { class: "cert-foot" },
        h("div", {}, h("span", {}, "Berilgan sana"), h("b", {}, date)),
        h("div", { class: "cert-seal", "aria-hidden": "true" }, h("span", {}, "SAFAR"), h("b", {}, "🧭"), h("span", {}, "AKADEMIYA")),
        h("div", {}, h("span", {}, "Sertifikat raqami"), h("b", {}, cert.code))
      ),
      h("p", { class: "cert-verify" }, `Haqiqiyligini tekshirish: ${url}`)
    ),
    h(
      "div",
      { class: "row center wrap no-print cert-actions" },
      h("button", { class: "btn", onclick: () => window.print() }, "🖨 Chop etish / PDF"),
      h("button", { class: "btn ghost", onclick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast("Havola nusxalandi", "ok");
        } catch {
          prompt("Havolani nusxalang:", url);
        }
      } }, "🔗 Havolani nusxalash")
    )
  );
  if (sessionStorage.getItem(`vgt.cert.${cert.code}`) !== "1") {
    setTimeout(confetti, 400);
    try {
      sessionStorage.setItem(`vgt.cert.${cert.code}`, "1");
    } catch {}
  }
}
