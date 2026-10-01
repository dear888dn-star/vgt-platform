// Mavzu taqdimotlari: PDF slaydlarni ko'rsatuvchi (pdf.js), PowerPoint Online va Google Slides/Canva havolalari.
import { h, toast } from "./ui.js";
import { api, session } from "./api.js";
import { reducedMotion } from "./motion.js";

const PDFJS = "/vendor/pdfjs/pdf.min.mjs";
let pdfjsPromise;
function loadPdfJs() {
  pdfjsPromise ||= import(PDFJS).then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
    return lib;
  });
  return pdfjsPromise;
}

const fileCache = new Map(); // uploadId -> Promise<Uint8Array>

/** Faylni bo'laklab yuklab oladi (har bir bo'lak brauzer keshida saqlanadi). */
function fetchFile(meta, onProgress) {
  if (fileCache.has(meta.uploadId)) return fileCache.get(meta.uploadId);
  const p = (async () => {
    let done = 0;
    const parts = await Promise.all(
      Array.from({ length: meta.chunks }, async (_, i) => {
        const res = await fetch(`/api/slides/${meta.topicId}/chunk/${meta.uploadId}/${i}`);
        if (!res.ok) throw new Error("Taqdimot faylini yuklab bo'lmadi");
        const buf = new Uint8Array(await res.arrayBuffer());
        onProgress?.(++done / meta.chunks);
        return buf;
      })
    );
    const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
    let off = 0;
    for (const b of parts) {
      out.set(b, off);
      off += b.length;
    }
    return out;
  })();
  fileCache.set(meta.uploadId, p);
  p.catch(() => fileCache.delete(meta.uploadId));
  return p;
}

export const fileUrl = (meta, download = false) => `/api/slides/${meta.topicId}/file?v=${meta.uploadId}${download ? "&download" : ""}`;
export const fmtSize = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Mavzu uchun taqdimot ko'ruvchisi. meta — /api/slides/:id javobi. */
export function slideViewer(meta) {
  if (meta.kind === "pdf") return pdfViewer(meta);
  if (meta.kind === "pptx") return pptxViewer(meta);
  return linkViewer(meta);
}

function frameViewer(src, title, extra) {
  return h(
    "div",
    { class: "slide-viewer frame" },
    h("div", { class: "sv-stage frame" }, h("iframe", { src, title, loading: "lazy", allowfullscreen: true, allow: "fullscreen; autoplay", referrerpolicy: "no-referrer-when-downgrade" })),
    h("div", { class: "sv-bar" }, h("span", { class: "sv-title" }, "🖥️ ", title), h("span", { class: "sv-spacer" }), extra)
  );
}

function linkViewer(meta) {
  return frameViewer(meta.embedUrl || meta.url, meta.title, h("a", { class: "btn small ghost", href: meta.url, target: "_blank", rel: "noopener" }, "↗ Yangi oynada ochish"));
}

function pptxViewer(meta) {
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  const absolute = new URL(fileUrl(meta), location.origin).href;
  const download = h("a", { class: "btn small ghost", href: fileUrl(meta, true) }, "⬇ Yuklab olish (.pptx)");
  if (local)
    return h("div", { class: "slide-viewer" }, h("div", { class: "alert alert-info" }, "PowerPoint fayli Microsoft PowerPoint Online orqali ko'rsatiladi — bu faqat Internetdagi (Netlify) saytda ishlaydi."), h("div", { class: "sv-bar" }, h("span", { class: "sv-title" }, "🖥️ ", meta.title), h("span", { class: "sv-spacer" }), download));
  return frameViewer(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolute)}`, meta.title, download);
}

function pdfViewer(meta) {
  let pdf;
  let page = 1;
  let total = meta.pages || 0;
  let ratio = 16 / 9;
  let auto;
  let busy = false;
  let pending = null;

  const loader = h("div", { class: "sv-loading" }, h("div", { class: "sv-spinner" }), h("span", {}, "Taqdimot yuklanmoqda…"), h("div", { class: "sv-load-bar" }, h("i")));
  const stage = h("div", { class: "sv-stage", tabindex: "0", "aria-label": `${meta.title} taqdimoti. Chap va o'ng strelkalar bilan varaqlang.` }, loader);
  const counter = h("span", { class: "sv-count" }, "— / —");
  const progress = h("div", { class: "sv-progress" }, h("i"));
  const thumbs = h("div", { class: "sv-thumbs", role: "tablist", "aria-label": "Slaydlar" });
  const autoBtn = h("button", { class: "sv-btn", title: "Avtomatik ko'rsatish", onclick: () => toggleAuto() }, "▶");
  const prevBtn = h("button", { class: "sv-nav prev", "aria-label": "Oldingi slayd", onclick: () => go(page - 1) }, "‹");
  const nextBtn = h("button", { class: "sv-nav next", "aria-label": "Keyingi slayd", onclick: () => go(page + 1) }, "›");
  stage.append(prevBtn, nextBtn);

  const viewer = h(
    "div",
    { class: "slide-viewer" },
    stage,
    progress,
    h(
      "div",
      { class: "sv-bar" },
      h("button", { class: "sv-btn", "aria-label": "Oldingi", onclick: () => go(page - 1) }, "◀"),
      counter,
      h("button", { class: "sv-btn", "aria-label": "Keyingi", onclick: () => go(page + 1) }, "▶"),
      h("span", { class: "sv-title" }, meta.title),
      h("span", { class: "sv-spacer" }),
      autoBtn,
      h("button", { class: "sv-btn", title: "Slaydlar ro'yxati", onclick: () => viewer.classList.toggle("show-thumbs") }, "▦"),
      h("a", { class: "sv-btn", href: fileUrl(meta, true), title: "Yuklab olish" }, "⬇"),
      h("button", { class: "sv-btn", title: "To'liq ekran (F)", onclick: () => fullscreen() }, "⛶")
    ),
    thumbs
  );

  async function renderPage(n, dir) {
    const p = await pdf.getPage(n);
    const base = p.getViewport({ scale: 1 });
    ratio = base.width / base.height;
    stage.style.aspectRatio = `${base.width} / ${base.height}`;
    const width = stage.clientWidth || 800;
    const height = document.fullscreenElement === viewer ? stage.clientHeight : width / ratio;
    const cssScale = Math.min(width / base.width, height / base.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = p.getViewport({ scale: cssScale * dpr });
    const canvas = h("canvas", { class: "sv-canvas", width: Math.floor(vp.width), height: Math.floor(vp.height), role: "img", "aria-label": `${n}-slayd` });
    await p.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    const old = stage.querySelectorAll(".sv-canvas");
    if (dir && !reducedMotion()) {
      canvas.classList.add(dir > 0 ? "in-next" : "in-prev");
      old.forEach((c) => {
        c.classList.add(dir > 0 ? "out-next" : "out-prev");
        c.addEventListener("animationend", () => c.remove(), { once: true });
        setTimeout(() => c.remove(), 900);
      });
    } else old.forEach((c) => c.remove());
    stage.insertBefore(canvas, prevBtn);
  }

  function updateUi() {
    counter.textContent = `${page} / ${total}`;
    progress.firstChild.style.transform = `scaleX(${total ? page / total : 0})`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= total;
    thumbs.querySelectorAll("button").forEach((b, i) => {
      const on = i + 1 === page;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
      if (on && viewer.classList.contains("show-thumbs")) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }

  async function go(n, force = false) {
    if (!pdf) return;
    n = Math.max(1, Math.min(total, n));
    if (n === page && !force) return;
    if (busy) {
      pending = n;
      return;
    }
    busy = true;
    const dir = force ? 0 : Math.sign(n - page);
    page = n;
    updateUi();
    try {
      await renderPage(n, dir);
    } finally {
      busy = false;
    }
    if (pending !== null) {
      const p = pending;
      pending = null;
      go(p);
    }
  }

  function toggleAuto() {
    if (auto) {
      clearInterval(auto);
      auto = null;
      autoBtn.textContent = "▶";
      autoBtn.classList.remove("on");
      return;
    }
    autoBtn.textContent = "⏸";
    autoBtn.classList.add("on");
    auto = setInterval(() => (page >= total ? toggleAuto() : go(page + 1)), 6000);
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else viewer.requestFullscreen?.().catch(() => toast("To'liq ekran rejimi qo'llab-quvvatlanmaydi", "error"));
  }

  async function buildThumbs() {
    const io = new IntersectionObserver(async (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const n = Number(e.target.dataset.page);
        const p = await pdf.getPage(n);
        const vp0 = p.getViewport({ scale: 1 });
        const vp = p.getViewport({ scale: 220 / vp0.width });
        const c = h("canvas", { width: Math.floor(vp.width), height: Math.floor(vp.height) });
        await p.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        e.target.prepend(c);
      }
    }, { root: thumbs, rootMargin: "0px 300px" });
    for (let i = 1; i <= total; i++) {
      const b = h("button", { role: "tab", "data-page": i, onclick: () => go(i) }, h("span", {}, i));
      thumbs.append(b);
      io.observe(b);
    }
  }

  // Klaviatura, svayp, o'lcham o'zgarishi
  const onKey = (e) => {
    if (!pdf) return;
    const inViewer = viewer.contains(document.activeElement) || document.fullscreenElement === viewer;
    if (!inViewer) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) go(page + 1);
    else if (["ArrowLeft", "PageUp"].includes(e.key)) go(page - 1);
    else if (e.key === "Home") go(1);
    else if (e.key === "End") go(total);
    else if (e.key.toLowerCase() === "f") fullscreen();
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey);
  let x0 = null;
  stage.addEventListener("pointerdown", (e) => (x0 = e.clientX));
  stage.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) go(page + (dx < 0 ? 1 : -1));
  });
  let rt;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => pdf && go(page, true), 200);
  };
  const ro = new ResizeObserver(onResize);
  document.addEventListener("fullscreenchange", onResize);

  (async () => {
    try {
      const bar = loader.querySelector(".sv-load-bar i");
      const [lib, data] = await Promise.all([loadPdfJs(), fetchFile(meta, (f) => (bar.style.transform = `scaleX(${f})`))]);
      pdf = await lib.getDocument({ data: data.slice() }).promise;
      total = pdf.numPages;
      loader.remove();
      page = 1;
      updateUi();
      await renderPage(1, 0);
      buildThumbs();
      ro.observe(stage);
    } catch (err) {
      loader.replaceChildren(h("span", {}, `⚠️ ${err.message || "Taqdimotni ochib bo'lmadi"}`));
    }
  })();

  viewer.destroy = () => {
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("fullscreenchange", onResize);
    ro.disconnect();
    if (auto) clearInterval(auto);
    pdf?.destroy();
  };
  return viewer;
}

/** PDF fayldagi sahifalar sonini aniqlaydi (yuklashdan oldin, o'qituvchi uchun). */
export async function countPdfPages(file) {
  try {
    const lib = await loadPdfJs();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const n = doc.numPages;
    doc.destroy();
    return n;
  } catch {
    return undefined;
  }
}

/** Faylni bo'laklab serverga yuklash. onProgress(0..1). */
export async function uploadSlides(topicId, file, { title, onProgress } = {}) {
  if (!session.isTeacher) throw new Error("Faqat o'qituvchi yuklay oladi");
  const mime = file.type;
  const init = await api.post(`admin/slides/${topicId}/init`, { name: file.name, size: file.size, mime });
  const pages = init.kind === "pdf" ? await countPdfPages(file) : undefined;
  let done = 0;
  const queue = Array.from({ length: init.chunks }, (_, i) => i);
  const worker = async () => {
    while (queue.length) {
      const i = queue.shift();
      const part = file.slice(i * init.chunkSize, (i + 1) * init.chunkSize);
      let attempt = 0;
      for (;;) {
        try {
          await api.putBinary(`admin/slides/${topicId}/chunk/${init.uploadId}/${i}`, part);
          break;
        } catch (err) {
          if (++attempt >= 3) throw err;
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
      onProgress?.(++done / init.chunks);
    }
  };
  await Promise.all([worker(), worker()]);
  return api.post(`admin/slides/${topicId}/commit`, { uploadId: init.uploadId, name: file.name, size: file.size, mime, title, pages });
}
