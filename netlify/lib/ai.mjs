// AI provayderlari: Claude API (ANTHROPIC_API_KEY) yoki Google Gemini API (GEMINI_API_KEY).
// Ikkalasi bir xil interfeysga ega: streamText (oqimli javob) va completeText (to'liq javob).
// Ikkala kalit ham bo'lsa, Claude ishlatiladi; hech biri bo'lmasa, trenajyor demo-rejimda ishlaydi.
import Anthropic from "@anthropic-ai/sdk";

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
// Vergul bilan ajratilgan modellar zanjiri: birinchisi band yoki mavjud bo'lmasa, keyingisi sinab ko'riladi.
const GEMINI_MODELS = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-lite-latest")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export const provider = () => (process.env.ANTHROPIC_API_KEY ? "claude" : process.env.GEMINI_API_KEY ? "gemini" : null);
export const aiEnabled = () => provider() !== null;
export const modelName = () => (provider() === "claude" ? CLAUDE_MODEL : provider() === "gemini" ? GEMINI_MODELS[0] : "demo");

// Eski importlar uchun (sessiya yozuvida qaysi model ishlatilgani saqlanadi).
export const MODEL = CLAUDE_MODEL;

const REFUSAL_TEXT = "\n\n[Trenajyor bu xabarga javob bera olmadi. Iltimos, vaziyat doirasida boshqacha ifodalab ko'ring.]";
const encoder = new TextEncoder();

function errorMessage(status) {
  return status === 401 || status === 403
    ? "API kaliti noto'g'ri yoki ruxsat yo'q."
    : status === 429
      ? "So'rovlar soni chegaradan oshdi, birozdan so'ng urinib ko'ring."
      : "AI xizmati bilan bog'lanishda xatolik yuz berdi.";
}

// ---------------- Claude ----------------

const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);
let client;
function claudeClient() {
  if (!client) client = new Anthropic({ maxRetries: 1 });
  return client;
}

function claudeParams({ system, messages, maxTokens, effort, format }) {
  const params = { model: CLAUDE_MODEL, max_tokens: maxTokens, system, messages };
  if (!/haiku/.test(CLAUDE_MODEL)) params.output_config = { effort };
  if (format) params.output_config = { ...(params.output_config || {}), format };
  if (FALLBACK_MODELS.has(CLAUDE_MODEL)) {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }
  return params;
}

function claudeStream(opts) {
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = claudeClient().beta.messages.stream(claudeParams(opts));
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(encoder.encode(event.delta.text));
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode(REFUSAL_TEXT));
      } catch (err) {
        console.error("Claude API xatosi:", err);
        controller.enqueue(encoder.encode(`\n\n[[XATO]] ${errorMessage(err instanceof Anthropic.APIError ? err.status : 0)}`));
      } finally {
        controller.close();
      }
    },
  });
}

async function claudeComplete(opts) {
  const response = await claudeClient().beta.messages.create(claudeParams(opts));
  if (response.stop_reason === "refusal") return "";
  return response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

// ---------------- Gemini ----------------

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRYABLE = new Set([404, 429, 500, 503]);

function geminiBody({ system, messages, maxTokens, format }) {
  const body = {
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (format?.schema) {
    body.generationConfig.responseMimeType = "application/json";
    body.generationConfig.responseJsonSchema = format.schema;
  }
  return JSON.stringify(body);
}

/** Modellar zanjiri bo'yicha so'rov yuboradi; band/mavjud bo'lmagan model o'tkazib yuboriladi. */
async function geminiFetch(method, opts) {
  let last;
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_URL}/${model}:${method}${method === "streamGenerateContent" ? "?alt=sse" : ""}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: geminiBody(opts),
    });
    if (res.ok) return res;
    last = res;
    const detail = await res.text().catch(() => "");
    console.error(`Gemini (${model}) xatosi ${res.status}:`, detail.slice(0, 300));
    if (!RETRYABLE.has(res.status)) break;
  }
  const err = new Error(errorMessage(last?.status));
  err.status = last?.status;
  throw err;
}

const partsText = (data) => (data?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
const blocked = (data) => ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "RECITATION"].includes(data?.candidates?.[0]?.finishReason) || Boolean(data?.promptFeedback?.blockReason);

function geminiStream(opts) {
  return new ReadableStream({
    async start(controller) {
      try {
        const res = await geminiFetch("streamGenerateContent", opts);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let refused = false;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          // SSE hodisalari bo'sh qator bilan ajratiladi (Gemini \r\n\r\n ishlatadi).
          buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
          let idx;
          while ((idx = buf.indexOf("\n\n")) >= 0) {
            const chunk = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data:")) continue;
              try {
                const data = JSON.parse(line.slice(5).trim());
                const text = partsText(data);
                if (text) controller.enqueue(encoder.encode(text));
                if (blocked(data)) refused = true;
              } catch {}
            }
          }
        }
        if (refused) controller.enqueue(encoder.encode(REFUSAL_TEXT));
      } catch (err) {
        console.error("Gemini API xatosi:", err);
        controller.enqueue(encoder.encode(`\n\n[[XATO]] ${err.message}`));
      } finally {
        controller.close();
      }
    },
  });
}

async function geminiComplete(opts) {
  const res = await geminiFetch("generateContent", opts);
  const data = await res.json();
  if (blocked(data)) return "";
  return partsText(data);
}

// ---------------- Umumiy interfeys ----------------

/** Javob matnini bo'laklab uzatuvchi ReadableStream qaytaradi. */
export function streamText({ system, messages, maxTokens = 2000, effort = "low", format }) {
  const opts = { system, messages, maxTokens, effort, format };
  return provider() === "gemini" ? geminiStream(opts) : claudeStream(opts);
}

export async function completeText({ system, messages, maxTokens = 1000, effort = "low", format }) {
  const opts = { system, messages, maxTokens, effort, format };
  return provider() === "gemini" ? geminiComplete(opts) : claudeComplete(opts);
}

// ---------------- Ovoz: nutq sintezi (TTS) va nutqni matnga aylantirish (STT) — Gemini ----------------
// Trenajyorning ovozli rejimi asosan brauzerning o'z ovozidan foydalanadi; GEMINI_API_KEY bo'lsa,
// AI ovozi (tabiiyroq) va brauzerda nutqni tanish bo'lmaganda server orqali tanish ishlaydi.

const TTS_MODELS = (process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts,gemini-2.5-flash-tts")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const VOICES = { female: ["Kore", "Aoede", "Leda", "Zephyr"], male: ["Charon", "Puck", "Orus", "Fenrir"] };

export const voiceEnabled = () => Boolean(process.env.GEMINI_API_KEY);

async function geminiRaw(models, body) {
  let last;
  for (const model of models) {
    const res = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    last = res;
    console.error(`Gemini (${model}) ovoz xatosi ${res.status}:`, (await res.text().catch(() => "")).slice(0, 300));
    if (!RETRYABLE.has(res.status)) break;
  }
  const err = new Error(errorMessage(last?.status));
  err.status = last?.status || 502;
  throw err;
}

/** 16-bit PCM (mono) ma'lumotiga WAV sarlavhasini qo'shadi. */
function pcmToWav(pcm, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Matnni ovozga aylantiradi. segments: [{ speaker, gender, text }]. Ikki va undan kam so'zlovchi bo'lsa,
 * har biri o'z ovozi bilan gapiradi. WAV (Buffer) qaytaradi.
 */
export async function synthesizeSpeech(segments, { language = "o'zbek" } = {}) {
  const speakers = [...new Map(segments.map((s) => [s.speaker || "Turist", s.gender || "female"])).entries()];
  const used = { female: 0, male: 0 };
  const voiceOf = Object.fromEntries(speakers.map(([name, g]) => [name, VOICES[g][used[g]++ % VOICES[g].length]]));
  const lang = language === "ingliz" ? "English" : "Uzbek (Latin script)";
  const multi = speakers.length === 2;
  const text = multi
    ? `Read this ${lang} dialogue naturally, with emotion that matches the situation:\n${segments.map((s) => `${s.speaker}: ${s.text}`).join("\n")}`
    : `Read aloud in ${lang}, naturally and expressively:\n${segments.map((s) => s.text).join(" ")}`;
  const speechConfig = multi
    ? { multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakers.map(([name]) => ({ speaker: name, voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceOf[name] } } })) } }
    : { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceOf[speakers[0]?.[0]] || "Kore" } } };
  const data = await geminiRaw(TTS_MODELS, { contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig } });
  const part = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!part) throw Object.assign(new Error("Ovoz yaratilmadi"), { status: 502 });
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1]) || 24000;
  const pcm = Buffer.from(part.inlineData.data, "base64");
  return /wav|mpeg|ogg/.test(part.inlineData.mimeType || "") ? pcm : pcmToWav(pcm, rate);
}

/** Yozib olingan nutqni matnga aylantiradi (brauzerda nutqni tanish imkoni bo'lmaganda). */
export async function transcribeAudio(base64, mimeType, { language = "o'zbek" } = {}) {
  const lang = language === "ingliz" ? "English" : "Uzbek (write in Uzbek Latin script)";
  const data = await geminiRaw(GEMINI_MODELS, {
    contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: `Transcribe this speech exactly as spoken. Language: ${lang}. Return only the transcript text, without quotes or comments. If there is no speech, return an empty string.` }] }],
    generationConfig: { maxOutputTokens: 800 },
  });
  return partsText(data).trim();
}
