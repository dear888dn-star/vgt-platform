// Vizual effektlar: scroll-reveal, sanoq animatsiyasi, sahifa o'tishlari, 3D qiyalik, konfetti.
// Foydalanuvchi "harakatni kamaytirish" sozlamasini yoqqan bo'lsa, animatsiyalar o'chiriladi.

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AUTO_REVEAL = ".card, .feature, .page-head, .section-title, .chapter-head, .stat-pill, .lesson-pager > a, .trainer-hero, .hero-card, .scenario-card, .topic-card";

let revealObserver;
function observeReveal(root) {
  if (reducedMotion()) return;
  revealObserver ||= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
  );
  const nodes = [...root.querySelectorAll(`${AUTO_REVEAL}, .reveal`)].filter((n) => !n.classList.contains("in") && !n.closest(".modal"));
  // Bir vaqtda ko'ringan elementlar ketma-ket (stagger) chiqadi.
  const groups = new Map();
  for (const n of nodes) {
    n.classList.add("reveal");
    const parent = n.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    n.style.setProperty("--stagger", `${Math.min(i, 8) * 60}ms`);
    revealObserver.observe(n);
  }
}

function animateCounters(root) {
  for (const el of root.querySelectorAll("[data-count]")) {
    if (el.dataset.counted) continue;
    el.dataset.counted = "1";
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reducedMotion() || !Number.isFinite(target)) {
      el.textContent = `${target}${suffix}`;
      continue;
    }
    const start = performance.now();
    const dur = 1100;
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

function attachTilt(root) {
  if (reducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
  for (const el of root.querySelectorAll(".tilt")) {
    if (el.dataset.tilt) continue;
    el.dataset.tilt = "1";
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  }
}

/** Yangi kontentga barcha effektlarni qo'llaydi. */
export function enhance(root = document) {
  observeReveal(root);
  animateCounters(root);
  attachTilt(root);
}

// Dinamik qo'shilgan elementlar (tablar, modal, ro'yxatlar) uchun ham avtomatik ishlaydi.
let mo;
export function watch(root) {
  enhance(root);
  mo?.disconnect();
  let scheduled = false;
  mo = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance(root);
    });
  });
  mo.observe(root, { childList: true, subtree: true });
}

/** Sahifa almashinuvi: View Transitions API bo'lsa — silliq o'tish, bo'lmasa oddiy fade. */
export function transition(update) {
  if (document.startViewTransition && !reducedMotion()) return document.startViewTransition(update).finished.catch(() => {});
  return Promise.resolve(update());
}

/** Topbar: sahifa pastga aylantirilganda ixchamlashadi. */
export function initTopbar() {
  const bar = document.querySelector(".topbar");
  const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/** Konfetti — yaxshi natija uchun. */
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 3) {
  if (reducedMotion()) return;
  const colors = ["#0e7c86", "#5fc4cc", "#c8912a", "#ecc77b", "#7b4fa0", "#2e8b57"];
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.append(layer);
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 260;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * dist - 120}px`);
    p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    p.style.animationDelay = `${Math.random() * 120}ms`;
    layer.append(p);
  }
  setTimeout(() => layer.remove(), 1800);
}

/** Elementni silkitish (noto'g'ri javob). */
export function shake(el) {
  if (reducedMotion()) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}
