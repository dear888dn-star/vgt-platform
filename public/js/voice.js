// Trenajyorning ovozli rejimi: personaj javobini ovoz chiqarib o'qish (TTS) va o'quvchi nutqini tanish (STT).
// 1) Brauzer ovozi (Web Speech API) — bepul va tez. O'zbekcha ovoz bo'lmasa, turkcha ovoz moslashtirilgan matn bilan o'qiydi.
// 2) AI ovozi (Gemini TTS, serverda GEMINI_API_KEY bo'lsa) — tabiiyroq; limit tugasa, brauzer ovoziga qaytadi.
// Nutqni tanish: brauzerning SpeechRecognition'i, u bo'lmasa — yozib olish va server orqali tanish.
import { api } from "./api.js";
import { createNarrator } from "./narrator.js";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const LANGS = { "o'zbek": "uz-UZ", ingliz: "en-US", rus: "ru-RU" };
const FEMALE = /madina|female|ayol|emel|seda|yelda|filiz|zira|aria|jenny|samantha|karen|victoria|susan|hazel|libby|sonia|natasha|svetlana|dariya|milena|google uk english female|google us english/i;
const MALE = /sardor|\bmale\b|erkak|ahmet|tolga|david|mark|guy|daniel|alex|george|ryan|dmitry|pavel|google uk english male/i;

export const voiceSupport = {
  tts: Boolean(synth),
  stt: Boolean(SR) || Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia),
  nativeStt: Boolean(SR),
};

function loadVoices() {
  return new Promise((resolve) => {
    if (!synth) return resolve([]);
    const v = synth.getVoices();
    if (v.length) return resolve(v);
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

/** O'zbekcha lotin matnini turkcha ovoz to'g'riroq o'qishi uchun moslashtiradi. */
function uzForTurkish(t) {
  return t
    .replace(/([oO])[ʻ'‘’`]/g, "$1")
    .replace(/([gG])[ʻ'‘’`]/g, "$1")
    .replace(/Sh/g, "Ş").replace(/sh/g, "ş").replace(/SH/g, "Ş")
    .replace(/Ch/g, "Ç").replace(/ch/g, "ç").replace(/CH/g, "Ç")
    .replace(/q/g, "k").replace(/Q/g, "K")
    .replace(/x/g, "h").replace(/X/g, "H")
    .replace(/j/g, "c").replace(/J/g, "C")
    .replace(/[ʻ'‘’`]/g, "");
}

/** Javobni so'zlovchilar bo'yicha bo'laklarga ajratadi va sahna izohlarini olib tashlaydi. */
export function speakerSegments(text, scenario) {
  const speakers = scenario.speakers || {};
  const names = Object.keys(speakers);
  const main = names[0] || "Turist";
  const segs = [];
  for (const raw of text.split(/\n+/)) {
    let line = raw.trim();
    if (!line) continue;
    let speaker = segs.at(-1)?.speaker || main;
    const m = line.match(/^([A-ZА-ЯЁʻ'’][\p{L}ʻ'’ .-]{0,28}?)(?:\s*\([^)]*\))?\s*:\s+(.*)$/u);
    if (m && m[1].split(" ").length <= 3) {
      speaker = m[1].trim();
      line = m[2];
    }
    line = line
      .replace(/\([^)]*\)/g, " ")
      .replace(/\*[^*]*\*/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
      .replace(/https?:\/\/\S+/g, "havola")
      .replace(/\s+/g, " ")
      .trim();
    if (!line) continue;
    const known = names.find((n) => n.toLowerCase() === speaker.toLowerCase() || speaker.toLowerCase().startsWith(n.toLowerCase().split(" ")[0]));
    const gender = known ? speakers[known] : /a$|opa|xonim|helga|anna|emily/i.test(speaker) ? "female" : "male";
    const prev = segs.at(-1);
    if (prev && prev.speaker === speaker) prev.text += ` ${line}`;
    else segs.push({ speaker, gender, text: line });
  }
  return segs;
}

const sentences = (t) => t.match(/[^.!?…]+[.!?…]*\s*/g)?.map((s) => s.trim()).filter(Boolean) || [t];

export function createVoice(scenario, { onState, engine, persist = true } = {}) {
  const lang = LANGS[scenario.language] || "uz-UZ";
  const prefs = (() => {
    try {
      return JSON.parse(localStorage.getItem("vgt.voice") || "{}");
    } catch {
      return {};
    }
  })();
  const state = { engine: engine || prefs.engine || "auto", rate: prefs.rate || 1, autoListen: prefs.autoListen ?? true, speaking: false, listening: false };
  let voices = [];
  let voicePlan = null;
  let audioCtx;
  let cancelSpeak = () => {};
  let stopListen = () => {};
  const set = (patch) => {
    Object.assign(state, patch);
    onState?.(state);
  };
  const savePrefs = () => {
    if (!persist) return;
    try {
      localStorage.setItem("vgt.voice", JSON.stringify({ engine: state.engine, rate: state.rate, autoListen: state.autoListen }));
    } catch {}
  };

  async function plan() {
    if (voicePlan) return voicePlan;
    voices = await loadVoices();
    const base = lang.slice(0, 2);
    let pool = voices.filter((v) => v.lang?.toLowerCase().startsWith(base));
    let mode = "native";
    if (!pool.length && base === "uz") {
      pool = voices.filter((v) => v.lang?.toLowerCase().startsWith("tr"));
      mode = pool.length ? "turkish" : "fallback";
    }
    if (!pool.length) pool = voices.filter((v) => v.default).concat(voices).slice(0, 4);
    // Tabiiy (Natural/Online/Google) ovozlar birinchi.
    pool.sort((a, b) => (/natural|online|neural|google/i.test(b.name) ? 1 : 0) - (/natural|online|neural|google/i.test(a.name) ? 1 : 0));
    voicePlan = {
      mode,
      female: pool.find((v) => FEMALE.test(v.name)) || pool[0],
      male: pool.find((v) => MALE.test(v.name)) || pool.find((v) => !FEMALE.test(v.name)) || pool[0],
    };
    return voicePlan;
  }

  // Brauzerlar o'zbekcha gapira olmaydi, shuning uchun AI ovozi (bo'lsa) doim birinchi.
  const useAI = () => state.engine !== "browser" && scenario.voiceAI;

  function browserSpeak(segments) {
    return new Promise((resolve) => {
      if (!synth) return resolve();
      synth.cancel();
      const queue = [];
      for (const seg of segments) {
        const v = voicePlan[seg.gender] || voicePlan.female;
        const text = voicePlan.mode === "turkish" ? uzForTurkish(seg.text) : seg.text;
        for (const part of sentences(text)) {
          const u = new SpeechSynthesisUtterance(part);
          if (v) u.voice = v;
          u.lang = v?.lang || lang;
          u.rate = state.rate;
          // Bir xil ovozdagi personajlarni ohang balandligi bilan farqlaymiz.
          u.pitch = voicePlan.female === voicePlan.male ? (seg.gender === "male" ? 0.8 : 1.15) : 1;
          u.onboundary = () => onState?.({ ...state, pulse: Math.random() });
          queue.push(u);
        }
      }
      let i = 0;
      let cancelled = false;
      // Chrome uzun matnni ~15 soniyadan keyin to'xtatib qo'yadi — gaplarni navbat bilan o'qiymiz.
      const keepAlive = setInterval(() => synth.speaking && !synth.paused && (synth.pause(), synth.resume()), 10000);
      const finish = () => {
        clearInterval(keepAlive);
        resolve();
      };
      const next = () => {
        if (cancelled || i >= queue.length) return finish();
        const u = queue[i++];
        u.onend = next;
        u.onerror = next;
        synth.speak(u);
      };
      cancelSpeak = () => {
        cancelled = true;
        synth.cancel();
        finish();
      };
      next();
    });
  }

  // AI ovozi (Gemini TTS): butun javob BITTA so'rovda (ko'p so'zlovchili ovoz — har bir personaj jinsiga qarab
  // o'z ovozida). Avval har bir gap alohida so'ralar edi va bepul tarifning daqiqalik limiti darhol tugardi.
  let narr = null;
  async function aiSpeak(segments) {
    const style = scenario.language === "ingliz" ? "english" : "tourist";
    narr ||= createNarrator({
      onLevel: (level) => onState?.({ ...state, level }),
      onNotice: (notice) => onState?.({ ...state, notice }),
      onWait: (waiting) => onState?.({ ...state, waiting }),
    });
    cancelSpeak = () => narr.stop();
    set({ speaker: [...new Set(segments.map((x) => x.speaker))].join(", ") });
    const r = await narr.speak(null, { dialogue: segments.map(({ speaker, gender, text }) => ({ speaker, gender, text })), style });
    if (r === "none") throw new Error("AI ovozi ishlamadi");
  }

  /** Personaj javobini ovoz chiqarib o'qiydi. Tugaganda resolve bo'ladi. */
  async function speak(text) {
    stop();
    const segments = speakerSegments(text, scenario);
    if (!segments.length) return;
    await plan();
    set({ speaking: true, speaker: segments[0].speaker });
    try {
      if (useAI()) {
        try {
          await aiSpeak(segments);
          return;
        } catch {
          // Narrator sababni o'zi ko'rsatadi. Brauzer ovoziga faqat u shu tilda haqiqiy ovozga ega bo'lsa o'tamiz
          // (Chrome o'zbekcha gapira olmaydi — buzuq talaffuzdan ko'ra matnni o'qish yaxshiroq).
          if (voicePlan?.mode !== "native") return;
        }
      }
      await browserSpeak(segments);
    } finally {
      set({ speaking: false, level: 0 });
    }
  }

  // ---------- Tinglash ----------

  async function meter(onLevel) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume();
      const src = audioCtx.createMediaStreamSource(stream);
      const an = audioCtx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const data = new Uint8Array(an.fftSize);
      let raf;
      const loop = () => {
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (const x of data) sum += ((x - 128) / 128) ** 2;
        onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        raf = requestAnimationFrame(loop);
      };
      loop();
      return { stream, stop: () => (cancelAnimationFrame(raf), src.disconnect(), stream.getTracks().forEach((t) => t.stop())) };
    } catch {
      return null;
    }
  }

  /** O'quvchi nutqini tinglaydi. onText(interim) — oraliq matn. Yakuniy matn bilan resolve bo'ladi. */
  function listen({ onText } = {}) {
    stop();
    if (SR) return nativeListen(onText);
    return recordListen(onText);
  }

  function nativeListen(onText) {
    return new Promise((resolve, reject) => {
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      let finalText = "";
      let silence;
      let m;
      let ended = false;
      const end = () => {
        if (ended) return;
        ended = true;
        clearTimeout(silence);
        m?.stop();
        set({ listening: false, level: 0 });
        resolve(finalText.trim());
      };
      const bumpSilence = () => {
        clearTimeout(silence);
        silence = setTimeout(() => rec.stop(), 2200);
      };
      rec.onresult = (e) => {
        let interim = "";
        finalText = "";
        for (const r of e.results) (r.isFinal ? (finalText += r[0].transcript + " ") : (interim += r[0].transcript));
        onText?.((finalText + interim).trim());
        bumpSilence();
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          ended = true;
          m?.stop();
          set({ listening: false, level: 0 });
          reject(new Error("Mikrofonga ruxsat berilmagan. Brauzer manzil satridagi 🔒 belgisidan ruxsat bering."));
        } else if (e.error === "language-not-supported") {
          ended = true;
          m?.stop();
          set({ listening: false, level: 0 });
          reject(new Error("Brauzer bu tilda nutqni taniy olmaydi. Chrome yoki Edge brauzeridan foydalaning."));
        }
      };
      rec.onend = end;
      stopListen = () => rec.stop();
      try {
        rec.start();
      } catch (err) {
        return reject(err);
      }
      set({ listening: true });
      silence = setTimeout(() => rec.stop(), 8000); // umuman gapirmasa
      meter((level) => onState?.({ ...state, level })).then((x) => (ended ? x?.stop() : (m = x)));
    });
  }

  async function recordListen(onText) {
    if (!scenario.voiceAI) throw new Error("Bu brauzerda nutqni tanish ishlamaydi. Chrome yoki Edge brauzeridan foydalaning.");
    let lastVoice = Date.now() + 1500;
    const mt = await meter((level) => {
      onState?.({ ...state, level });
      if (level > 0.08) lastVoice = Date.now();
    });
    if (!mt) throw new Error("Mikrofonga ruxsat berilmagan.");
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
    const rec = new MediaRecorder(mt.stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    set({ listening: true });
    onText?.("🎙 Yozib olinmoqda… gapirib bo'lgach, tugmani bosing yoki jim turing.");
    const started = Date.now();
    await new Promise((resolve) => {
      const iv = setInterval(() => {
        if (Date.now() - lastVoice > 2200 || Date.now() - started > 110000) rec.state === "recording" && rec.stop();
      }, 200);
      rec.onstop = () => (clearInterval(iv), resolve());
      stopListen = () => rec.state === "recording" && rec.stop();
      rec.start(250);
    });
    mt.stop();
    set({ listening: false, level: 0 });
    if (Date.now() - started < 900 || !chunks.length) return "";
    onText?.("⏳ Nutq matnga aylantirilmoqda…");
    const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    const b64 = await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(String(fr.result).split(",")[1] || "");
      fr.readAsDataURL(blob);
    });
    const { text } = await api.post("trainer/transcribe", { scenarioId: scenario.id, audio: b64, mime: blob.type });
    return text;
  }

  function stop() {
    cancelSpeak();
    cancelSpeak = () => {};
    stopListen();
    stopListen = () => {};
  }

  return {
    state,
    speak,
    listen,
    stop,
    stopListening: () => stopListen(),
    cancelSpeech: () => cancelSpeak(),
    async info() {
      const p = await plan();
      return { mode: p.mode, voice: p.female?.name, lang };
    },
    setEngine(e) {
      state.engine = e;
      savePrefs();
    },
    setRate(r) {
      state.rate = r;
      savePrefs();
    },
    setAutoListen(v) {
      state.autoListen = v;
      savePrefs();
    },
    destroy() {
      stop();
      audioCtx?.close?.();
    },
  };
}
