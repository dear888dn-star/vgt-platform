// E-Mehmon o'quv simulyatori (alohida loyiha: dear888dn-star/eguestsimulyator) bilan bog'lanish.
// Platforma EMEHMON_SSO_SECRET bilan imzolangan qisqa muddatli token yaratadi:
//   - "launch": foydalanuvchi simulyatorga parolsiz kiradi (birinchi kirishda unga o'quv mehmonxonasi ochiladi);
//   - "results": server simulyatordan talabalarning o'quv topshiriqlari natijalarini oladi.
// Ikkala tomonda bir xil maxfiy kalit bo'lishi kerak: bu yerda EMEHMON_SSO_SECRET, simulyatorda SSO_SECRET.
import crypto from "node:crypto";

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const emehmonUrl = () => (process.env.EMEHMON_URL || "").trim().replace(/\/+$/, "");
export const emehmonEnabled = () => Boolean(emehmonUrl() && process.env.EMEHMON_SSO_SECRET);

export function signToken(payload, ttlSec = 300) {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + ttlSec * 1000 }));
  const sig = b64url(crypto.createHmac("sha256", process.env.EMEHMON_SSO_SECRET).update(body).digest());
  return `${body}.${sig}`;
}

/** Simulyatorga kirish havolasi (5 daqiqa, bir martalik). */
export function launchUrl(user) {
  const t = signToken({
    aud: "launch",
    sub: user.id,
    name: user.name,
    group: user.group || "",
    role: user.role === "teacher" ? "teacher" : "student",
    nonce: crypto.randomBytes(12).toString("hex"),
  });
  return `${emehmonUrl()}/api/sso?t=${encodeURIComponent(t)}`;
}

/** Simulyatordagi natijalar. sub berilsa — faqat shu foydalanuvchiniki. */
export async function fetchResults(sub) {
  const t = signToken({ aud: "results", ...(sub ? { sub } : {}) }, 60);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${emehmonUrl()}/api/sso/results?t=${encodeURIComponent(t)}`, { signal: ctrl.signal });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Simulyator javob bermadi (${r.status})`);
    return d.items || [];
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "Simulyator javob bermadi (vaqt tugadi)" : e.message);
  } finally {
    clearTimeout(timer);
  }
}
