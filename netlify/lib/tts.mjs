// Gemini TTS: o'zbekcha matnni AI ovoziga aylantirish, MP3 ga siqish va Netlify Blobs'da keshlash.
// Bir xil matn (ovoz + uslub bilan) faqat bir marta yaratiladi — keyin hamma uchun keshdan beriladi.
import crypto from "node:crypto";
import { Mp3Encoder } from "@breezystack/lamejs";

const API = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const FALLBACK_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts", "gemini-2.5-pro-preview-tts"];

// Gemini'ning tayyor ovozlari (jinsi va xarakteri)
export const VOICES = [
  { id: "Kore", gender: "female", label: "Kore — ayol, ishonchli" },
  { id: "Aoede", gender: "female", label: "Aoede — ayol, yengil" },
  { id: "Leda", gender: "female", label: "Leda — ayol, yosh" },
  { id: "Zephyr", gender: "female", label: "Zephyr — ayol, yorqin" },
  { id: "Sulafat", gender: "female", label: "Sulafat — ayol, iliq" },
  { id: "Charon", gender: "male", label: "Charon — erkak, bosiq" },
  { id: "Puck", gender: "male", label: "Puck — erkak, quvnoq" },
  { id: "Orus", gender: "male", label: "Orus — erkak, qat'iy" },
  { id: "Fenrir", gender: "male", label: "Fenrir — erkak, hayajonli" },
  { id: "Iapetus", gender: "male", label: "Iapetus — erkak, aniq" },
];
const VOICE_IDS = new Set(VOICES.map((v) => v.id));

// Uslub — "rejissyor izohi" sifatida beriladi va faqat TRANSCRIPT qismi o'qiladi (Gemini TTS tavsiya etgan tuzilma).
// Avval ko'rsatma matnning boshida turardi va model ba'zan uni ham ("Say the following line…") o'qib yuborardi.
export const STYLES = {
  narrator: "A warm, clear Uzbek teacher narrating a lesson. Natural, fluent Uzbek (Latin script) with correct Uzbek pronunciation; do not translate.",
  guide: "An enthusiastic professional Uzbek tour guide. Natural, fluent Uzbek with correct pronunciation; do not translate.",
  tourist: "A tourist talking to a tour guide, natural and expressive. Uzbek pronunciation; keep foreign words and names as they are; do not translate.",
  english: "A tourist speaking clear, natural English.",
};

/** Ovoz uchun so'rov: izohlar o'qilmaydi, faqat TRANSCRIPT ostidagi matn aytiladi. */
function buildPrompt(style, transcript, note = "") {
  return [
    "Generate speech for the TRANSCRIPT below.",
    "### DIRECTOR'S NOTES (instructions only — never speak them)",
    `Style: ${STYLES[style] || STYLES.narrator}`,
    note,
    "Speak ONLY the words of the transcript, exactly as written. Do not add, announce or describe anything, and do not read these notes, headings or speaker labels.",
    "### TRANSCRIPT",
    transcript,
  ]
    .filter(Boolean)
    .join("\n");
}

export const ttsEnabled = () => Boolean(process.env.GEMINI_API_KEY);

let modelCache = null;
/** Mavjud TTS modellarini API'dan aniqlaydi (nomlar o'zgarsa ham ishlashi uchun). */
export async function ttsModels() {
  if (process.env.GEMINI_TTS_MODEL) return process.env.GEMINI_TTS_MODEL.split(",").map((m) => m.trim()).filter(Boolean);
  if (modelCache && Date.now() - modelCache.at < 6 * 3600_000) return modelCache.list;
  let list = [];
  try {
    const r = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } });
    if (r.ok) {
      const d = await r.json();
      list = (d.models || [])
        .filter((m) => /tts/i.test(m.name) && (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""))
        // Flash — tezroq va bepul limiti kattaroq; yangi versiyalar oldinda.
        .sort((a, b) => (/flash/.test(b) - /flash/.test(a)) || b.localeCompare(a, undefined, { numeric: true }));
    }
  } catch {}
  if (!list.length) list = FALLBACK_MODELS;
  modelCache = { at: Date.now(), list };
  return list;
}

export function ttsKey(text, voice, style) {
  // v2: so'rov tuzilmasi o'zgardi — eski (ko'rsatma o'qilgan bo'lishi mumkin) yozuvlar qayta yaratiladi.
  return crypto.createHash("sha256").update(`v2|${voice}|${style}|${text}`).digest("hex").slice(0, 40);
}

/** WAV (PCM 16-bit, mono) — kodlashsiz, protsessor vaqtini talab qilmaydi (Cloudflare bepul rejasi uchun). */
function toWav(pcm, rate) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function toMp3(pcm, rate) {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
  const enc = new Mp3Encoder(1, rate, 64);
  const out = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const b = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (b.length) out.push(Buffer.from(b));
  }
  out.push(Buffer.from(enc.flush()));
  return Buffer.concat(out);
}

export class TtsError extends Error {
  constructor(message, status, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

/** Google xatosidan limit turi va kutish vaqtini ajratib oladi. */
function quotaInfo(raw) {
  let d = null;
  try {
    d = JSON.parse(raw);
  } catch {}
  const details = d?.error?.details || [];
  const violations = details.find((x) => String(x["@type"]).includes("QuotaFailure"))?.violations || [];
  const quotaId = violations.map((v) => v.quotaId).filter(Boolean).join(", ");
  const retry = details.find((x) => String(x["@type"]).includes("RetryInfo"))?.retryDelay;
  const daily = /PerDay/i.test(quotaId) || /per day|daily/i.test(d?.error?.message || "");
  return { quotaId, daily, retryAfter: retry ? Math.ceil(parseFloat(retry)) : null, message: d?.error?.message || raw.slice(0, 300) };
}

const VOICE_POOL = { female: ["Kore", "Aoede", "Leda", "Sulafat"], male: ["Charon", "Puck", "Orus", "Iapetus"] };

/**
 * Suhbat (bir nechta personaj) — bitta so'rovda ko'p so'zlovchili ovoz (Gemini 2 tagacha ovozni qo'llaydi).
 * Personajlar jinsiga qarab 2 ta "slot"ga taqsimlanadi. { text, speakers: [{label, voice}] } qaytaradi.
 */
export function dialogueScript(dialogue) {
  const order = [...new Map(dialogue.map((d) => [d.speaker, d.gender])).entries()];
  const first = order[0];
  const other = order.find(([, g]) => g !== first[1]);
  const slots = [{ label: "Speaker1", gender: first[1], voice: VOICE_POOL[first[1]][0] }];
  if (other) slots.push({ label: "Speaker2", gender: other[1], voice: VOICE_POOL[other[1]][0] });
  else if (order.length > 1) slots.push({ label: "Speaker2", gender: first[1], voice: VOICE_POOL[first[1]][1] });
  // Ikkala jins bo'lsa — jinsiga qarab; bitta jins bo'lsa — birinchi personaj 1-ovoz, qolganlari 2-ovoz.
  const slotOf = (speaker, gender) => (other ? slots.find((x) => x.gender === gender) : speaker === first[0] ? slots[0] : slots[slots.length - 1]);
  const lines = [];
  for (const seg of dialogue) {
    const label = slotOf(seg.speaker, seg.gender).label;
    if (lines.length && lines[lines.length - 1].label === label) lines[lines.length - 1].text += ` ${seg.text}`;
    else lines.push({ label, text: seg.text });
  }
  return { slots, lines };
}

async function callTts(model, prompt, speechConfig) {
  return fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig } }),
  });
}

/**
 * Matnni (yoki suhbatni) ovozga aylantiradi. MP3 (Buffer) va ishlatilgan modelni qaytaradi.
 * Har bir modelning limiti alohida — biri band bo'lsa, keyingisi sinab ko'riladi.
 */
export async function synthesize(text, { voice = "Kore", style = "narrator", dialogue = null } = {}) {
  if (!ttsEnabled()) throw new TtsError("AI ovozi sozlanmagan (GEMINI_API_KEY)", 503);
  let prompt;
  let speechConfig;
  if (dialogue?.length) {
    const { slots, lines } = dialogueScript(dialogue);
    if (slots.length < 2) {
      prompt = buildPrompt(style, lines.map((l) => l.text).join(" "));
      speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: slots[0].voice } } };
    } else {
      prompt = buildPrompt(style, lines.map((l) => `${l.label}: ${l.text}`).join("\n"), `This is a conversation between ${slots.map((x) => x.label).join(" and ")}; each transcript line starts with the speaker label.`);
      speechConfig = { multiSpeakerVoiceConfig: { speakerVoiceConfigs: slots.map((x) => ({ speaker: x.label, voiceConfig: { prebuiltVoiceConfig: { voiceName: x.voice } } })) } };
    }
  } else {
    prompt = buildPrompt(style, text);
    speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_IDS.has(voice) ? voice : "Kore" } } };
  }
  let last = null;
  let rateLimited = null;
  for (const model of await ttsModels()) {
    const r = await callTts(model, prompt, speechConfig);
    if (r.ok) {
      const d = await r.json();
      const part = (d?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
      if (!part) {
        last = new TtsError("AI ovoz qaytarmadi", 502);
        continue;
      }
      const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1]) || 24000;
      const pcm = Buffer.from(part.inlineData.data, "base64");
      const audio = process.env.TTS_FORMAT === "wav" ? toWav(pcm, rate) : toMp3(pcm, rate);
      return { audio, model, seconds: pcm.length / 2 / rate };
    }
    const raw = await r.text().catch(() => "");
    console.error(`Gemini TTS (${model}) ${r.status}:`, raw.slice(0, 600));
    if (r.status === 429) {
      const q = quotaInfo(raw);
      // Eng qisqa kutish vaqtini saqlaymiz; kunlik limit faqat barcha modellarda tugagan bo'lsa "kunlik" hisoblanadi.
      if (!rateLimited || (q.retryAfter ?? 999) < (rateLimited.retryAfter ?? 999) || (!q.daily && rateLimited.daily)) rateLimited = { ...q, model };
      continue;
    }
    last = new TtsError(r.status === 401 || r.status === 403 ? "Gemini API kaliti noto'g'ri yoki TTS ruxsati yo'q." : `AI ovozini yaratib bo'lmadi (${r.status})`, 502, { detail: quotaInfo(raw).message, model });
    if (r.status === 401 || r.status === 403) break;
  }
  if (rateLimited) {
    throw new TtsError(
      rateLimited.daily ? "Gemini AI ovozining bugungi limiti tugadi." : "Gemini AI ovozi band (daqiqalik limit).",
      429,
      { daily: rateLimited.daily, retryAfter: rateLimited.retryAfter ?? (rateLimited.daily ? null : 20), quotaId: rateLimited.quotaId, detail: rateLimited.message, model: rateLimited.model }
    );
  }
  throw last || new TtsError("TTS modeli topilmadi", 502);
}
