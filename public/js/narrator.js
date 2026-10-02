// AI ovozi (Gemini TTS, serverda keshlanadi) — o'zbek tilida tabiiy ovoz. Ishlamasa, brauzer ovoziga qaytadi.
import { session } from "./api.js";

const PREF_KEY = "vgt.tts";
let info = null;
let defaultVoice = "Kore";
let downUntil = 0;
const urlCache = new Map();

export function ttsPrefs() {
  try {
    return { engine: "ai", ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch {
    return { engine: "ai" };
  }
}
/** O'qituvchi platforma ovozini o'zgartirganda keshni yangilash. */
export function resetTtsInfo() {
  info = null;
  urlCache.clear();
}
export function setTtsPrefs(patch) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...ttsPrefs(), ...patch }));
  } catch {}
  window.dispatchEvent(new Event("vgt:tts"));
}

export async function ttsInfo() {
  info ||= fetch("/api/tts")
    .then((r) => (r.ok ? r.json() : { enabled: false, voices: [] }))
    .then((d) => ((defaultVoice = d.defaultVoice || "Kore"), d))
    .catch(() => ({ enabled: false, voices: [] }));
  return info;
}

/** AI ovozidan foydalanish mumkinmi (sozlangan, foydalanuvchi o'chirmagan, vaqtincha xato bo'lmagan). */
export async function aiVoiceReady() {
  const i = await ttsInfo();
  return i.enabled && ttsPrefs().engine !== "browser" && Date.now() > downUntil;
}

/** Uzun matnni ~1200 belgili bo'laklarga (gap chegarasida) ajratadi. */
export function chunkText(text, max = 1200) {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Matn uchun MP3 manzilini oladi (server keshidan yoki yangi yaratib). */
export function audioUrl(text, opts = {}) {
  return audioInfo(text, opts).then((d) => d.url);
}

/** { url, cached } — server keshida bor edimi yoki yangi yaratildimi. */
export function audioInfo(text, { voice, style = "narrator" } = {}) {
  // Platformaning umumiy ovozi (o'qituvchi tanlaydi) — barcha o'quvchilar uchun bir xil, shuning uchun kesh umumiy.
  const v = voice || defaultVoice;
  const k = `${v}|${style}|${text}`;
  if (urlCache.has(k)) return urlCache.get(k);
  const p = fetch("/api/tts", {
    method: "POST",
    headers: { "content-type": "application/json", ...(session.token ? { authorization: `Bearer ${session.token}` } : {}) },
    body: JSON.stringify({ text, voice: v, style }),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = new Error(d.error || `AI ovozi xatosi (${r.status})`);
      err.status = r.status;
      throw err;
    }
    return d;
  });
  urlCache.set(k, p);
  p.catch(() => urlCache.delete(k));
  return p;
}

let audioCtx;
/**
 * Ovoz chiqaruvchi: speak(text) — AI ovozi bilan o'qiydi (bo'laklab, keyingisini oldindan yuklab),
 * ishlamasa fallback(text) chaqiriladi (brauzer ovozi). onLevel(0..1) — animatsiya uchun ovoz balandligi.
 */
export function createNarrator({ onLevel, onNotice, fallback } = {}) {
  const audio = new Audio();
  audio.preload = "auto";
  let analyser = null;
  let stopFn = () => {};
  let rate = 1;
  let token = 0;

  const ensureAnalyser = () => {
    if (analyser || !onLevel) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser).connect(audioCtx.destination);
    } catch {}
  };

  const playUrl = (url, my) =>
    new Promise((resolve, reject) => {
      ensureAnalyser();
      audioCtx?.resume?.();
      audio.src = url;
      audio.playbackRate = rate;
      let raf;
      const data = new Uint8Array(128);
      const loop = () => {
        if (analyser) {
          analyser.getByteFrequencyData(data);
          onLevel?.(Math.min(1, (data.reduce((s, x) => s + x, 0) / data.length / 255) * 2.4));
        }
        raf = requestAnimationFrame(loop);
      };
      const done = () => {
        cancelAnimationFrame(raf);
        onLevel?.(0);
        resolve();
      };
      audio.onended = done;
      audio.onerror = () => {
        cancelAnimationFrame(raf);
        reject(new Error("Audio ijro etilmadi"));
      };
      stopFn = () => {
        audio.pause();
        done();
      };
      if (my !== token) return done();
      audio.play().then(loop, (e) => (e?.name === "NotAllowedError" ? reject(Object.assign(new Error("Ovoz uchun sahifani bir marta bosing"), { autoplay: true })) : reject(e)));
    });

  async function speak(text, opts = {}) {
    const my = ++token;
    stopFn();
    if (!text?.trim()) return "none";
    if (await aiVoiceReady()) {
      try {
        const parts = chunkText(text);
        let next = audioUrl(parts[0], opts);
        for (let i = 0; i < parts.length; i++) {
          const url = await next;
          if (i + 1 < parts.length) next = audioUrl(parts[i + 1], opts);
          if (my !== token) return "stopped";
          await playUrl(url, my);
          if (my !== token) return "stopped";
        }
        return "ai";
      } catch (err) {
        if (my !== token) return "stopped";
        if (!err.autoplay) downUntil = Date.now() + (err.status === 429 ? 120_000 : 30_000);
        onNotice?.(err.autoplay ? err.message : `${err.message} Brauzer ovozi ishlatiladi.`);
      }
    }
    if (my !== token) return "stopped";
    if (fallback) {
      stopFn = () => fallback.stop?.();
      await fallback.speak(text);
      return "browser";
    }
    return "none";
  }

  return {
    speak,
    /** Keyingi matnni oldindan tayyorlab qo'yish (AI ovozi bo'lsa). */
    prefetch: async (text, opts) => (text && (await aiVoiceReady()) ? audioUrl(chunkText(text)[0], opts).catch(() => {}) : null),
    stop() {
      token++;
      stopFn();
      fallback?.stop?.();
    },
    setRate(r) {
      rate = r;
      audio.playbackRate = r;
    },
    get playing() {
      return !audio.paused;
    },
  };
}
