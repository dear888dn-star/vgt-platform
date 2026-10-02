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

export const STYLES = {
  narrator: "Read the following Uzbek text aloud in natural, fluent Uzbek language (O'zbek tili, Latin script) with correct Uzbek pronunciation, as a warm and clear teacher narrating a lesson. Do not translate:",
  guide: "Read the following Uzbek text aloud in natural, fluent Uzbek language (O'zbek tili) with correct Uzbek pronunciation, as an enthusiastic professional tour guide. Do not translate:",
  tourist: "Say the following line in Uzbek exactly as written, naturally and expressively, as a tourist talking to a guide. Keep foreign words as they are:",
  english: "Say the following in clear, natural English:",
};

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
  return crypto.createHash("sha256").update(`${voice}|${style}|${text}`).digest("hex").slice(0, 40);
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
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Matnni ovozga aylantiradi. MP3 (Buffer) va ishlatilgan modelni qaytaradi. */
export async function synthesize(text, { voice = "Kore", style = "narrator" } = {}) {
  if (!ttsEnabled()) throw new TtsError("AI ovozi sozlanmagan (GEMINI_API_KEY)", 503);
  const v = VOICE_IDS.has(voice) ? voice : "Kore";
  const prompt = `${STYLES[style] || STYLES.narrator}\n\n${text}`;
  let last = null;
  for (const model of await ttsModels()) {
    const r = await fetch(`${API}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: v } } } },
      }),
    });
    if (r.ok) {
      const d = await r.json();
      const part = (d?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
      if (!part) {
        last = new TtsError("AI ovoz qaytarmadi", 502);
        continue;
      }
      const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1]) || 24000;
      const pcm = Buffer.from(part.inlineData.data, "base64");
      return { audio: toMp3(pcm, rate), model, seconds: pcm.length / 2 / rate };
    }
    const detail = (await r.text().catch(() => "")).slice(0, 400);
    console.error(`Gemini TTS (${model}) ${r.status}:`, detail);
    last = new TtsError(
      r.status === 429 ? "AI ovozi uchun so'rovlar limiti tugadi (bepul tarif). Birozdan so'ng urinib ko'ring." : r.status === 401 || r.status === 403 ? "Gemini API kaliti noto'g'ri yoki TTS ruxsati yo'q." : `AI ovozini yaratib bo'lmadi (${r.status})`,
      r.status === 429 ? 429 : 502
    );
    if (![404, 400, 500, 503].includes(r.status)) break; // 429/403 — boshqa modelda ham bir xil
  }
  throw last || new TtsError("TTS modeli topilmadi", 502);
}
