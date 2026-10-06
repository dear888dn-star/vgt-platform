// Parollarni scrypt bilan xeshlash va HMAC imzoli tokenlar.
import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 kun

let generatedSecret = null;

/** JWT_SECRET o'rnatilmagan bo'lsa, omborda saqlangan avtomatik kalit ishlatiladi (api.mjs: ensureSecret). */
export function setGeneratedSecret(s) {
  generatedSecret = s;
}

function secret() {
  const s = process.env.JWT_SECRET || generatedSecret;
  if (s) return s;
  if (process.env.VGT_LOCAL_DATA) return "local-dev-secret";
  throw new Error("JWT_SECRET muhit o'zgaruvchisi o'rnatilmagan");
}

// Yangi parollar: PBKDF2-SHA256 (Web Crypto, 100 000 iteratsiya) — Cloudflare Workers'da ham tez ishlaydi.
// Eski (scrypt) xeshlar ham tekshiriladi; kirishda avtomatik PBKDF2 ga yangilanadi (needsRehash).
const PBKDF2_ITER = 100_000;

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.webcrypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations }, key, 256);
  return Buffer.from(bits);
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await pbkdf2(password, salt, PBKDF2_ITER)).toString("hex");
  return { salt, hash, algo: "pbkdf2", iter: PBKDF2_ITER };
}

/** user — { salt, hash, algo?, iter? } (algo bo'lmasa — eski scrypt xesh). */
export async function verifyPassword(password, user) {
  if (!user?.salt || !user?.hash) return false;
  const candidate = user.algo === "pbkdf2" ? await pbkdf2(password, user.salt, user.iter || PBKDF2_ITER) : await scrypt(password, user.salt, 64);
  const expected = Buffer.from(user.hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

export const needsRehash = (user) => user.algo !== "pbkdf2" || (user.iter || 0) < PBKDF2_ITER;

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function createToken(user) {
  const payload = b64(JSON.stringify({ uid: user.id, role: user.role, pv: user.pwdV || 0, exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function readToken(token) {
  if (!token || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export const newId = () => crypto.randomUUID();
