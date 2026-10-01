// Ilmiy tahlil uchun statistik yordamchi funksiyalar

function mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; }

function sd(a) {
  if (a.length < 2) return null;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}

function round(x, d = 2) { return x == null || Number.isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d; }

// Lanczos log-gamma
function lgamma(x) {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// Regularized incomplete beta (continued fraction, Numerical Recipes)
function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}

// Ikki tomonlama p-qiymat, Student t-taqsimoti
function tPValue(t, df) {
  if (!Number.isFinite(t) || df <= 0) return null;
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

// Juftlashgan t-test (bir xil o'quvchilarning oldin/keyin natijalari)
function pairedTTest(pre, post) {
  const n = Math.min(pre.length, post.length);
  if (n < 2) return null;
  const diffs = [];
  for (let i = 0; i < n; i++) diffs.push(post[i] - pre[i]);
  const md = mean(diffs), sdd = sd(diffs);
  if (!sdd) return { n, meanDiff: round(md), t: null, df: n - 1, p: null, cohenD: null };
  const t = md / (sdd / Math.sqrt(n));
  return { n, meanDiff: round(md, 3), t: round(t, 3), df: n - 1, p: round(tPValue(t, n - 1), 4), cohenD: round(md / sdd, 3) };
}

// Mustaqil tanlamalar uchun Welch t-testi (masalan, tajriba va nazorat guruhlari)
function welchTTest(a, b) {
  if (a.length < 2 || b.length < 2) return null;
  const ma = mean(a), mb = mean(b), va = sd(a) ** 2, vb = sd(b) ** 2;
  const se = Math.sqrt(va / a.length + vb / b.length);
  if (!se) return null;
  const t = (mb - ma) / se;
  const df = (va / a.length + vb / b.length) ** 2 /
    ((va / a.length) ** 2 / (a.length - 1) + (vb / b.length) ** 2 / (b.length - 1));
  const pooled = Math.sqrt(((a.length - 1) * va + (b.length - 1) * vb) / (a.length + b.length - 2));
  return { t: round(t, 3), df: round(df, 1), p: round(tPValue(t, df), 4), cohenD: pooled ? round((mb - ma) / pooled, 3) : null };
}

// Kronbax alfa (ichki izchillik) — items: [[javoblar respondentlar bo'yicha], ...]
function cronbachAlpha(items) {
  const k = items.length;
  if (k < 2) return null;
  const n = Math.min(...items.map(i => i.length));
  if (n < 3) return null;
  const itemVars = items.map(i => sd(i.slice(0, n)) ** 2);
  const totals = Array.from({ length: n }, (_, r) => items.reduce((s, i) => s + i[r], 0));
  const totalVar = sd(totals) ** 2;
  if (!totalVar) return null;
  return round((k / (k - 1)) * (1 - itemVars.reduce((s, v) => s + v, 0) / totalVar), 3);
}

module.exports = { mean, sd, round, pairedTTest, welchTTest, cronbachAlpha, tPValue };
