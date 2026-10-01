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

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return { salt, hash };
}

export async function verifyPassword(password, salt, hash) {
  const candidate = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function createToken(user) {
  const payload = b64(JSON.stringify({ uid: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS }));
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
