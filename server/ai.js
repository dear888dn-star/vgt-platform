// Claude API bilan ishlash: virtual turist roli, maslahatchi va baholovchi
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const hasCredentials = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const AI_ENABLED = process.env.AI_MODE !== 'offline' && hasCredentials;
const client = AI_ENABLED ? new Anthropic() : null;

// Xavfsizlik klassifikatori so'rovni rad etsa, server tomonida tavsiya etilgan modelga o'tkaziladi
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

function textOf(message) {
  return message.content.filter(b => b.type === 'text').map(b => b.text).join('');
}

/**
 * Turist javobini oqim (stream) ko'rinishida olish.
 * onText — har bir matn bo'lagi kelganda chaqiriladi.
 */
async function streamRolePlay({ system, messages, onText }) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    system,
    messages,
    ...FALLBACK,
  });
  stream.on('text', onText);
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') {
    const err = new Error('refusal');
    err.code = 'refusal';
    throw err;
  }
  return textOf(final);
}

async function complete({ system, messages, effort = 'low', schema }) {
  const params = {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
    system,
    messages,
    ...FALLBACK,
  };
  const msg = await client.beta.messages.create(params);
  if (msg.stop_reason === 'refusal') {
    const err = new Error('refusal');
    err.code = 'refusal';
    throw err;
  }
  const text = textOf(msg);
  return schema ? JSON.parse(text) : text;
}

function describeError(e) {
  if (e?.code === 'refusal') return 'AI bu so\'rovga javob bera olmadi. Boshqacha ifodalab ko\'ring.';
  if (e instanceof Anthropic.AuthenticationError) return 'AI kaliti noto\'g\'ri (ANTHROPIC_API_KEY).';
  if (e instanceof Anthropic.RateLimitError) return 'AI xizmati band. Birozdan so\'ng qayta urinib ko\'ring.';
  if (e instanceof Anthropic.APIConnectionError) return 'AI xizmatiga ulanib bo\'lmadi. Internetni tekshiring.';
  if (e instanceof Anthropic.APIError) return `AI xizmati xatosi (${e.status}).`;
  return 'Kutilmagan xato yuz berdi.';
}

module.exports = { AI_ENABLED, MODEL, streamRolePlay, complete, describeError };
