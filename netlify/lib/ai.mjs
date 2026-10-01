// Claude API bilan ishlash: trenajyor personaji (oqimli javob), ustoz maslahati va yakuniy baholash.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

// Server tomonidagi zaxira model (refusal fallback) va effort faqat shu modellarda qo'llab-quvvatlanadi.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);
const supportsEffort = !/haiku/.test(MODEL);

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client;
function getClient() {
  if (!client) client = new Anthropic({ maxRetries: 1 });
  return client;
}

function baseParams(effort) {
  const params = { model: MODEL };
  if (supportsEffort) params.output_config = { effort };
  if (FALLBACK_MODELS.has(MODEL)) {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }
  return params;
}

const REFUSAL_TEXT = "\n\n[Trenajyor bu xabarga javob bera olmadi. Iltimos, vaziyat doirasida boshqacha ifodalab ko'ring.]";

/** Javob matnini bo'laklab uzatuvchi ReadableStream qaytaradi. */
export function streamText({ system, messages, maxTokens = 2000, effort = "low", format }) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        const params = { ...baseParams(effort), max_tokens: maxTokens, system, messages };
        if (format) params.output_config = { ...(params.output_config || {}), format };
        const stream = getClient().beta.messages.stream(params);
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode(REFUSAL_TEXT));
      } catch (err) {
        console.error("Claude API xatosi:", err);
        const status = err instanceof Anthropic.APIError ? err.status : undefined;
        const msg =
          status === 401
            ? "API kaliti noto'g'ri (ANTHROPIC_API_KEY)."
            : status === 429
              ? "So'rovlar soni chegaradan oshdi, birozdan so'ng urinib ko'ring."
              : "AI xizmati bilan bog'lanishda xatolik yuz berdi.";
        controller.enqueue(encoder.encode(`\n\n[[XATO]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });
}

export async function completeText({ system, messages, maxTokens = 1000, effort = "low", format }) {
  const params = { ...baseParams(effort), max_tokens: maxTokens, system, messages };
  if (format) params.output_config = { ...(params.output_config || {}), format };
  const response = await getClient().beta.messages.create(params);
  if (response.stop_reason === "refusal") return "";
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}
