// Video: pleyer oynasi (fayl, YouTube, Vimeo), video kartalari, o'qituvchi uchun bo'laklab yuklash.
import { h } from "./ui.js";
import { api, session } from "./api.js";

const blobCache = new Map(); // uploadId -> Promise<objectURL>

export const fmtDuration = (sec) => (Number.isFinite(sec) ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}` : "");

/** Yuklangan video bo'laklarini yig'ib, brauzer uchun manzil (blob URL) yaratadi. */
function fileUrl(v, onProgress) {
  if (blobCache.has(v.uploadId)) return blobCache.get(v.uploadId);
  const p = (async () => {
    let done = 0;
    const parts = await Promise.all(
      Array.from({ length: v.chunks }, async (_, i) => {
        const r = await fetch(`/api/videos/${v.topicId}/${v.id}/chunk/${v.uploadId}/${i}`);
        if (!r.ok) throw new Error("Videoni yuklab bo'lmadi");
        const b = await r.blob();
        onProgress?.(++done / v.chunks);
        return b;
      })
    );
    return URL.createObjectURL(new Blob(parts, { type: v.mime || "video/mp4" }));
  })();
  blobCache.set(v.uploadId, p);
  p.catch(() => blobCache.delete(v.uploadId));
  return p;
}

/** Video pleyer oynasi. */
export function videoModal(v) {
  const close = () => {
    overlay.classList.add("closing");
    document.removeEventListener("keydown", onKey);
    stage.querySelector("video")?.pause();
    setTimeout(() => overlay.remove(), 250);
  };
  const onKey = (e) => e.key === "Escape" && close();
  const stage = h("div", { class: "vm-stage" });
  const overlay = h(
    "div",
    { class: "vm-overlay", onclick: (e) => e.target === overlay && close() },
    h(
      "div",
      { class: "vm", role: "dialog", "aria-modal": "true", "aria-label": v.title },
      h("div", { class: "vm-head" }, h("b", {}, "🎬 ", v.title), h("button", { class: "icon-btn", "aria-label": "Yopish", onclick: close }, "✕")),
      stage,
      v.description && h("p", { class: "vm-desc" }, v.description)
    )
  );
  document.body.append(overlay);
  document.addEventListener("keydown", onKey);

  const playFile = (src) => {
    const sources = v.sources || [{ src }];
    const video = h("video", { controls: true, autoplay: true, playsinline: true, poster: v.poster || undefined, preload: "auto" }, sources.map((x) => h("source", { src: x.src, type: x.type })));
    stage.replaceChildren(video);
    video.play?.().catch(() => {});
  };
  if (v.kind === "youtube" || v.kind === "vimeo" || v.kind === "link") {
    const src = v.kind === "youtube" ? `${v.embedUrl}&autoplay=1` : v.embedUrl;
    stage.replaceChildren(h("iframe", { src, title: v.title, allow: "autoplay; fullscreen; picture-in-picture; encrypted-media", allowfullscreen: true, referrerpolicy: "strict-origin-when-cross-origin" }));
    if (v.kind === "link") stage.append(h("a", { class: "btn small ghost vm-open", href: v.url, target: "_blank", rel: "noopener" }, "↗ Yangi oynada ochish"));
  } else if (v.kind === "file") {
    const bar = h("div", { class: "vm-load" }, h("div", { class: "sv-spinner" }), h("span", {}, "Video yuklanmoqda… 0%"));
    stage.replaceChildren(bar);
    fileUrl(v, (f) => (bar.lastChild.textContent = `Video yuklanmoqda… ${Math.round(f * 100)}%`))
      .then((url) => overlay.isConnected && playFile(url))
      .catch((e) => bar.replaceChildren(h("span", {}, `⚠️ ${e.message}`)));
  } else playFile(v.src || v.embedUrl || v.sources?.[0]?.src);
  return close;
}

/** Platforma haqida qisqa video (platformaning o'zida yaratilgan animatsiya). */
export function introVideo() {
  videoModal({ kind: "src", sources: [{ src: "/media/safar-intro.webm", type: "video/webm" }, { src: "/media/safar-intro.mp4", type: "video/mp4" }], poster: "/media/safar-intro.jpg", title: "Safar akademiya — platforma haqida", description: "“Safar akademiya” imkoniyatlari: interaktiv mavzular, AI virtual gid trenajyori, marshrut laboratoriyasi, Safar pasporti va virtual sayohat." });
}

/** Video kartasi (muqova, davomiyligi, o'ynatish tugmasi). */
export function videoCard(v, extra) {
  const thumb = v.poster || v.thumb;
  return h(
    "div",
    { class: "video-card" },
    h(
      "button",
      { class: "vc-thumb", "aria-label": `${v.title} — videoni ko'rish`, onclick: () => videoModal(v) },
      h("div", { class: "vc-ph" }, v.kind === "youtube" ? "▶" : "🎬"),
      thumb && h("img", { src: thumb, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }),
      h("span", { class: "vc-play" }, "▶"),
      v.duration && h("span", { class: "vc-time" }, fmtDuration(v.duration)),
      h("span", { class: "vc-kind" }, { youtube: "YouTube", vimeo: "Vimeo", file: "Video", url: "Video", link: "Havola" }[v.kind] || "Video")
    ),
    h("div", { class: "vc-body" }, h("b", {}, v.title), v.description && h("small", { class: "muted" }, v.description)),
    extra
  );
}

/** Video fayldan muqova rasmi va davomiylikni olish (yuklashdan oldin). */
export function videoPoster(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    video.src = url;
    const done = (poster) => {
      URL.revokeObjectURL(url);
      resolve({ poster, duration: Number.isFinite(video.duration) ? video.duration : undefined });
    };
    video.onloadedmetadata = () => (video.currentTime = Math.min(2, (video.duration || 4) / 3));
    video.onseeked = () => {
      try {
        const c = document.createElement("canvas");
        const w = 480;
        c.width = w;
        c.height = Math.round((video.videoHeight / video.videoWidth) * w) || 270;
        c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
        done(c.toDataURL("image/jpeg", 0.72));
      } catch {
        done(undefined);
      }
    };
    video.onerror = () => done(undefined);
    setTimeout(() => done(undefined), 8000);
  });
}

/** O'qituvchi: video faylni bo'laklab yuklash. */
export async function uploadVideo(topicId, file, { title, description, onProgress } = {}) {
  if (!session.isTeacher) throw new Error("Faqat o'qituvchi yuklay oladi");
  const init = await api.post(`admin/videos/${topicId}/init`, { name: file.name, size: file.size, mime: file.type });
  const { poster, duration } = await videoPoster(file);
  let done = 0;
  const queue = Array.from({ length: init.chunks }, (_, i) => i);
  const worker = async () => {
    while (queue.length) {
      const i = queue.shift();
      const part = file.slice(i * init.chunkSize, (i + 1) * init.chunkSize);
      for (let attempt = 1; ; attempt++) {
        try {
          await api.putBinary(`admin/videos/${topicId}/chunk/${init.uploadId}/${i}`, part);
          break;
        } catch (err) {
          if (attempt >= 3) throw err;
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
      onProgress?.(++done / init.chunks);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return api.post(`admin/videos/${topicId}/commit`, { uploadId: init.uploadId, name: file.name, size: file.size, mime: file.type, title, description, poster, duration });
}

let videosCache = null;
export async function allVideos({ fresh = false } = {}) {
  if (!videosCache || fresh) videosCache = api.get("videos").then((d) => d.videos).catch(() => []);
  return videosCache;
}
export const invalidateVideos = () => (videosCache = null);


/** Rasmlarni kattalashtirish: [data-zoom] elementini bosganda rasm (yoki SVG) to'liq ekranda ochiladi. */
export function initLightbox() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-zoom]");
    if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const img = el.tagName === "IMG" ? el : el.querySelector("img");
    const content = img ? h("img", { class: "lb-img", src: img.currentSrc || img.src, alt: img.alt || "" }) : h("div", { class: "lb-img lb-svg", html: el.querySelector("svg")?.outerHTML || "" });
    const overlay = h("div", { class: "lb-overlay", role: "dialog", "aria-modal": "true", "aria-label": el.dataset.zoom || "Rasm", onclick: () => close() }, content, el.dataset.zoom && h("div", { class: "lb-caption" }, el.dataset.zoom));
    document.body.append(overlay);
    // FLIP: kichik rasmdan kattasiga silliq o'tish
    requestAnimationFrame(() => {
      const t = content.getBoundingClientRect();
      content.style.transition = "none";
      content.style.transform = `translate(${r.left - t.left}px, ${r.top - t.top}px) scale(${r.width / t.width}, ${r.height / t.height})`;
      content.style.transformOrigin = "top left";
      requestAnimationFrame(() => {
        content.style.transition = "";
        content.style.transform = "";
        overlay.classList.add("open");
      });
    });
    const onKey = (ev) => ev.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    function close() {
      document.removeEventListener("keydown", onKey);
      overlay.classList.remove("open");
      const t = content.getBoundingClientRect();
      const now = el.getBoundingClientRect();
      content.style.transform = `translate(${now.left - t.left}px, ${now.top - t.top}px) scale(${now.width / t.width}, ${now.height / t.height})`;
      setTimeout(() => overlay.remove(), 420);
    }
  });
}
