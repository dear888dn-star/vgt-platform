// Cloudflare Workers kirish nuqtasi: /api/* — platforma API (netlify/functions/api.mjs bilan bir xil kod),
// qolgan barcha so'rovlar — public/ papkasidagi statik fayllar (Workers Static Assets).
import api from "../netlify/functions/api.mjs";
import { useStore } from "../netlify/lib/store.mjs";
import { cloudflareStore } from "./store.mjs";

let configured = false;

function configure(env) {
  if (configured) return;
  // Kod process.env dan o'qiydi: Cloudflare'dagi o'zgaruvchilar va maxfiy kalitlarni (secrets) shu yerga ko'chiramiz.
  for (const [k, v] of Object.entries(env)) if (typeof v === "string" && process.env[k] === undefined) process.env[k] = v;
  // Bepul rejada protsessor vaqti 10 ms — MP3 kodlash sig'maydi, shuning uchun ovoz WAV sifatida saqlanadi.
  // Workers Paid rejasida TTS_FORMAT=mp3 o'rnatish mumkin (fayllar ~6 marta kichik).
  process.env.TTS_FORMAT ||= "wav";
  process.env.PLATFORM ||= "cloudflare";
  useStore(cloudflareStore(env));
  configured = true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      configure(env);
      return api(request);
    }
    return env.ASSETS.fetch(request);
  },
};
