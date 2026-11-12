// Foydalanuvchining shaxsiy AI kaliti (Gemini yoki Claude): trenajyor va boshqa AI imkoniyatlari shu kalit bilan ishlaydi.
// Kalit serverda shifrlangan holda saqlanadi va brauzerga qaytarilmaydi (faqat oxirgi 4 belgisi ko'rsatiladi).
import { h, toast } from "./ui.js";
import { api } from "./api.js";

const PROVIDER = { gemini: "Google Gemini", claude: "Anthropic Claude" };

/** Kalit kartasi. onChange(status) — saqlangan/o'chirilgandan keyin chaqiriladi. */
export function aiKeyCard({ onChange, compact = false } = {}) {
  const box = h("div", { class: `card ai-key-card ${compact ? "compact" : ""}` });
  let status = null;

  const draw = () => {
    const input = h("input", { type: "password", autocomplete: "off", spellcheck: "false", placeholder: "AIza… (Gemini) yoki sk-ant-… (Claude)", maxlength: 300 });
    const save = h("button", { class: "btn", type: "submit" }, status?.has ? "Kalitni almashtirish" : "Saqlash va tekshirish");
    const form = h("form", { class: "row wrap ai-key-form", onsubmit: async (e) => {
      e.preventDefault();
      if (!input.value.trim()) return toast("API kalitini kiriting", "warn");
      save.disabled = true;
      save.textContent = "Tekshirilmoqda…";
      try {
        status = await api.put("me/ai-key", { apiKey: input.value.trim() });
        toast(`Kalit saqlandi (${PROVIDER[status.provider]})`, "ok");
        draw();
        onChange?.(status);
      } catch (ex) {
        toast(ex.message, "error");
        save.disabled = false;
        save.textContent = status?.has ? "Kalitni almashtirish" : "Saqlash va tekshirish";
      }
    } }, input, save);
    const remove = status?.has && h("button", { class: "btn ghost", type: "button", onclick: async () => {
      if (!confirm("Saqlangan API kalitingiz o'chirilsinmi?")) return;
      try {
        status = await api.del("me/ai-key");
        toast("Kalit o'chirildi", "ok");
        draw();
        onChange?.(status);
      } catch (ex) {
        toast(ex.message, "error");
      }
    } }, "O'chirish");

    box.replaceChildren(...[
      h("h3", {}, "🔑 API kalitim"),
      status?.has
        ? h("p", { class: "ai-key-state ok" }, `✅ ${PROVIDER[status.provider] || status.provider} kaliti saqlangan (…${status.last4}). Trenajyor va AI imkoniyatlari shu kalit bilan ishlaydi.`)
        : status?.owner
          ? h("p", { class: "ai-key-state ok" }, "✅ Siz platforma egasisiz: sayt kaliti siz uchun ishlaydi. Xohlasangiz, o'z kalitingizni ham kiritishingiz mumkin.")
          : h("p", { class: "ai-key-state warn" }, "Virtual trenajyordan foydalanish uchun o'z AI kalitingiz kerak. Platformaning kaliti faqat uning egasi uchun."),
      form,
      remove,
      !compact && h("details", { class: "small" },
        h("summary", {}, "Bepul Gemini kalitini qanday olish mumkin?"),
        h("ol", {},
          h("li", {}, "Google hisobingiz bilan ", h("a", { href: "https://aistudio.google.com/apikey", target: "_blank", rel: "noopener" }, "aistudio.google.com/apikey"), " sahifasini oching."),
          h("li", {}, "“Create API key” tugmasini bosing va kalitni nusxalang (u AIza… bilan boshlanadi)."),
          h("li", {}, "Kalitni shu yerga qo'ying va “Saqlash va tekshirish” ni bosing."))),
      h("p", { class: "muted small" }, "Kalit serverda shifrlangan holda saqlanadi, sahifada ko'rsatilmaydi va faqat sizning so'rovlaringiz uchun ishlatiladi. Kalitni boshqalarga bermang."),
    ].filter(Boolean));
  };

  box.append(h("p", { class: "muted small" }, "Yuklanmoqda…"));
  api.get("me/ai-key").then((s) => { status = s; draw(); }).catch(() => box.remove());
  return box;
}
