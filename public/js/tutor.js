// "AI Ustoz" paneli: mavzu bo'yicha savol-javob, tayyor savollar, matnni belgilab tushuntirish so'rash.
import { h, toast } from "./ui.js";
import { api, session } from "./api.js";

const KEY = (id) => `vgt.tutor.${id}`;

export function tutorDrawer(topic) {
  let history = [];
  try {
    history = JSON.parse(sessionStorage.getItem(KEY(topic.id)) || "[]");
  } catch {}
  let busy = false;
  const save = () => {
    try {
      sessionStorage.setItem(KEY(topic.id), JSON.stringify(history.slice(-20)));
    } catch {}
  };

  const log = h("div", { class: "tutor-log", "aria-live": "polite" });
  const input = h("textarea", { rows: 2, maxlength: 1500, placeholder: "Mavzu bo'yicha savolingizni yozing…" });
  const sendBtn = h("button", { class: "btn", onclick: () => ask() }, "➤");
  const suggestions = [
    `${topic.glossary[0]?.term || topic.title} nima? Oddiy misol bilan tushuntiring`,
    "Bu mavzuning asosiy g'oyasini 5 ta band bilan qisqacha aytib bering",
    "Bu bilimlar gid yoki turagent ishida qanday qo'llaniladi?",
    topic.questions[0] && `Nazorat savoliga tayyorlanishda yordam bering: ${topic.questions[0]}`,
  ].filter(Boolean);
  const chips = h("div", { class: "tutor-chips" }, suggestions.map((q) => h("button", { class: "chip", onclick: () => ask(q) }, q.length > 70 ? `${q.slice(0, 68)}…` : q)));

  const bubble = (role, text) => {
    const b = h("div", { class: `tutor-msg ${role}` }, h("div", { class: "tutor-text" }, text));
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b.firstChild;
  };
  const drawHistory = () => {
    log.replaceChildren(bubble("assistant", `Salom! Men AI Ustozman 🤖 ${topic.num}-mavzu — “${topic.title}” bo'yicha savollaringizga o'quv qo'llanma asosida javob beraman. Matndagi istalgan parchani belgilab, “Tushuntirib ber” tugmasini bossangiz ham bo'ladi.`).parentNode);
    for (const m of history) bubble(m.role, m.content);
    chips.classList.toggle("hidden", history.length > 0);
  };

  async function ask(text = input.value.trim()) {
    if (!text || busy) return;
    if (!session.user) {
      toast("AI Ustozdan foydalanish uchun tizimga kiring", "warn");
      location.hash = "#/login";
      return;
    }
    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    chips.classList.add("hidden");
    history.push({ role: "user", content: text });
    bubble("user", text);
    const target = bubble("assistant", "");
    target.parentNode.classList.add("typing");
    let reply = "";
    try {
      const res = await api.stream(`topics/${topic.id}/ask`, { messages: history });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      target.parentNode.classList.remove("typing");
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += dec.decode(value, { stream: true });
        target.textContent = reply.replace(/\[\[XATO\]\].*/s, "");
        log.scrollTop = log.scrollHeight;
      }
    } catch (e) {
      reply = `[[XATO]] ${e.message}`;
    }
    if (reply.includes("[[XATO]]") || !reply.trim()) {
      history.pop();
      target.parentNode.remove();
      toast(reply.split("[[XATO]]")[1]?.trim() || "Javob olinmadi", "error");
      input.value = text;
    } else {
      history.push({ role: "assistant", content: reply.trim() });
      save();
    }
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  });

  const panel = h(
    "aside",
    { class: "tutor-panel", "aria-label": "AI Ustoz" },
    h(
      "div",
      { class: "tutor-head" },
      h("div", { class: "tutor-avatar" }, "🤖"),
      h("div", {}, h("b", {}, "AI Ustoz"), h("small", {}, `${topic.num}-mavzu bo'yicha yordamchi`)),
      h("button", { class: "icon-btn", title: "Suhbatni tozalash", "aria-label": "Suhbatni tozalash", onclick: () => ((history = []), save(), drawHistory()) }, "🗑"),
      h("button", { class: "icon-btn", "aria-label": "Yopish", onclick: () => wrap.classList.remove("open") }, "✕")
    ),
    log,
    chips,
    h("div", { class: "tutor-input" }, input, sendBtn)
  );
  const fab = h("button", { class: "tutor-fab", "aria-label": "AI Ustoz", title: "AI Ustoz — mavzu bo'yicha savol bering", onclick: () => {
    wrap.classList.toggle("open");
    if (wrap.classList.contains("open")) setTimeout(() => input.focus(), 200);
  } }, h("span", {}, "🤖"));
  const wrap = h("div", { class: "tutor-wrap" }, fab, panel);
  drawHistory();

  // Matnni belgilash → "Tushuntirib ber"
  const selBtn = h("button", { class: "explain-btn", onmousedown: (e) => e.preventDefault(), onclick: () => {
    const text = String(window.getSelection()).trim().slice(0, 900);
    selBtn.classList.remove("show");
    if (!text) return;
    wrap.classList.add("open");
    ask(`Qo'llanmadagi quyidagi parchani soddaroq tushuntirib bering va misol keltiring:\n«${text}»`);
  } }, "🤖 Tushuntirib ber");
  document.body.append(selBtn);
  const onSel = () => {
    const sel = window.getSelection();
    const text = String(sel).trim();
    const inBook = sel.rangeCount && sel.anchorNode && sel.anchorNode.parentElement?.closest(".book-text, .prose");
    if (!text || text.length < 12 || !inBook) return selBtn.classList.remove("show");
    const r = sel.getRangeAt(0).getBoundingClientRect();
    selBtn.style.left = `${Math.min(window.innerWidth - 190, Math.max(8, r.left + r.width / 2 - 85))}px`;
    selBtn.style.top = `${Math.max(70, r.top - 46)}px`;
    selBtn.classList.add("show");
  };
  const hide = () => selBtn.classList.remove("show");
  document.addEventListener("selectionchange", onSel);
  window.addEventListener("scroll", hide, { passive: true });

  wrap.destroy = () => {
    document.removeEventListener("selectionchange", onSel);
    window.removeEventListener("scroll", hide);
    selBtn.remove();
    wrap.remove();
  };
  return wrap;
}
