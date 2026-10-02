// XP, daraja va seriya bo'yicha jonli rag'batlantirish: "+XP" uchuvchi belgisi, yangi daraja tantanasi.
import { h, toast } from "./ui.js";
import { confetti, reducedMotion } from "./motion.js";

let stack;
function xpPop(gain) {
  stack ||= document.body.appendChild(h("div", { class: "xp-stack", "aria-live": "polite" }));
  const pop = h("div", { class: "xp-pop" }, h("b", {}, `+${gain}`), " XP ⭐");
  stack.append(pop);
  setTimeout(() => pop.remove(), reducedMotion() ? 1800 : 2200);
}

function levelUp(level) {
  confetti();
  const close = () => overlay.remove();
  const overlay = h(
    "div",
    { class: "levelup-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Yangi daraja", onclick: (e) => e.target === overlay && close() },
    h(
      "div",
      { class: "levelup-card" },
      h("div", { class: "levelup-rays", "aria-hidden": "true" }),
      h("div", { class: "levelup-icon" }, level.icon),
      h("div", { class: "eyebrow" }, "Yangi daraja!"),
      h("h2", {}, level.name),
      h("p", { class: "muted" }, level.next ? `Keyingi daraja — ${level.next.icon} ${level.next.name}: yana ${level.toNext} XP` : "Siz eng yuqori darajaga erishdingiz!"),
      h("div", { class: "row center" }, h("a", { href: "#/passport", class: "btn", onclick: close }, "🛂 Pasportimni ko'rish"), h("button", { class: "btn ghost", onclick: close }, "Davom etish"))
    )
  );
  document.body.append(overlay);
  overlay.querySelector(".btn").focus();
  setTimeout(() => overlay.isConnected && close(), 9000);
}

export function initCelebrations() {
  window.addEventListener("vgt:xp", (e) => {
    xpPop(e.detail.gain);
    if (e.detail.levelUp) setTimeout(() => levelUp(e.detail.levelUp), 500);
  });
  window.addEventListener("vgt:streak", (e) => toast(`🔥 ${e.detail.streak} kunlik seriya! Shu ruhda davom eting.`, "ok"));
}
