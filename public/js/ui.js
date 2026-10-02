// DOM yordamchilari: xavfsiz element yaratish, bildirishnomalar, modal oynalar.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v; // faqat ishonchli (platforma ichidagi) matn uchun
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "style" && typeof v === "object") for (const [prop, val] of Object.entries(v)) prop.startsWith("--") ? el.style.setProperty(prop, val) : (el.style[prop] = val);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function mount(container, ...children) {
  container.replaceChildren();
  append(container, children);
}

let toastBox;
export function toast(message, type = "info") {
  if (!toastBox) {
    toastBox = h("div", { class: "toasts", role: "status", "aria-live": "polite" });
    document.body.append(toastBox);
  }
  const t = h("div", { class: `toast toast-${type}` }, message);
  toastBox.append(t);
  setTimeout(() => t.classList.add("hide"), 3200);
  setTimeout(() => t.remove(), 3700);
}

export function modal(title, content, { wide = false } = {}) {
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  const overlay = h(
    "div",
    { class: "modal-overlay", onclick: (e) => e.target === overlay && close() },
    h(
      "div",
      { class: `modal ${wide ? "modal-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": title },
      h("div", { class: "modal-head" }, h("h3", {}, title), h("button", { class: "icon-btn", "aria-label": "Yopish", onclick: close }, "✕")),
      h("div", { class: "modal-body" }, content)
    )
  );
  document.addEventListener("keydown", onKey);
  document.body.append(overlay);
  return close;
}

export function confirmDialog(message) {
  return new Promise((resolve) => {
    let close;
    const done = (v) => {
      close();
      resolve(v);
    };
    close = modal(
      "Tasdiqlash",
      h("div", {}, h("p", {}, message), h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => done(false) }, "Bekor qilish"), h("button", { class: "btn danger", onclick: () => done(true) }, "Ha, davom etish")))
    );
  });
}

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export function loading(text = "Yuklanmoqda...") {
  return h("div", { class: "loading" }, h("span", { class: "spinner" }), text);
}

export function errorBox(err) {
  return h("div", { class: "alert alert-error" }, err?.message || String(err));
}

export function emptyState(icon, title, text, action) {
  return h("div", { class: "empty" }, h("div", { class: "empty-icon" }, icon), h("h3", {}, title), text && h("p", {}, text), action);
}

export function downloadFile(name, content, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const a = h("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 500);
}

export function progressBar(value, max = 100, label) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return h("div", { class: "progress", title: label || `${pct}%` }, h("div", { class: "progress-fill", style: { width: `${Math.min(100, pct)}%` } }));
}

const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
/** "2-oktabr, 2026-yil" (brauzerlar o'zbekcha oy nomlarini har xil chiqaradi). */
export function fmtLongDate(d, { year = true } = {}) {
  const x = new Date(d);
  return `${x.getDate()}-${UZ_MONTHS[x.getMonth()]}${year ? `, ${x.getFullYear()}-yil` : ""}`;
}
