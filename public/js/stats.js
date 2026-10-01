// Tadqiqot natijalarini statistik qayta ishlash: o'rtacha, standart chetlanish, darajalar,
// Styudent (Welch va juftlangan) t-mezoni, Pirson χ² mezoni, Koen d, samaradorlik koeffitsiyenti, SUS.

export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
export function sd(a) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
export const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

/** Bitta javobning ballari: umumiy ko'rsatkich, komponentlar bo'yicha va daraja. */
export function scoreResponse(survey, answers) {
  const method = survey.scoring?.method || "likert";
  const comps = {};
  for (const c of survey.scoring?.components || []) {
    const vals = survey.questions.filter((q) => q.type === "likert" && q.component === c.key && Number.isFinite(answers[q.id])).map((q) => answers[q.id]);
    comps[c.key] = vals.length ? mean(vals) : NaN;
  }
  let overall;
  if (method === "test") {
    const tests = survey.questions.filter((q) => q.type === "test");
    overall = tests.length ? (tests.filter((q) => answers[q.id] === q.correct).length / tests.length) * 100 : NaN;
  } else if (method === "sus" && Array.isArray(survey.scoring.susItems)) {
    overall = susScore(survey.scoring.susItems.map((id) => answers[id]));
  } else {
    const vals = survey.questions.filter((q) => q.type === "likert" && Number.isFinite(answers[q.id])).map((q) => answers[q.id]);
    overall = vals.length ? mean(vals) : NaN;
  }
  return { overall, components: comps, level: levelOf(survey, overall) };
}

export function overallScale(survey) {
  const method = survey.scoring?.method || "likert";
  if (method === "test") return { label: "Natija, %", max: 100 };
  if (method === "sus") return { label: "SUS indeksi (0–100)", max: 100 };
  return { label: "O'rtacha ball (1–5)", max: 5 };
}

export function levelOf(survey, value) {
  if (!Number.isFinite(value)) return null;
  if (survey.scoring?.method === "sus") return value >= 80.3 ? "A'lo" : value >= 68 ? "Yaxshi" : value >= 51 ? "Qoniqarli" : "Past";
  const levels = survey.scoring?.levels || [];
  const found = levels.find((l) => value >= l.min && value <= l.max + 1e-9);
  return found ? found.label : levels.length ? (value < levels[0].min ? levels[0].label : levels[levels.length - 1].label) : null;
}

export function levelNames(survey) {
  if (survey.scoring?.method === "sus") return ["Past", "Qoniqarli", "Yaxshi", "A'lo"];
  return (survey.scoring?.levels || []).map((l) => l.label);
}

/** SUS (System Usability Scale): toq bandlar (a−1), juft bandlar (5−a), yig'indi × 2.5. */
export function susScore(items) {
  if (items.some((x) => !Number.isFinite(x))) return NaN;
  return items.reduce((s, a, i) => s + (i % 2 === 0 ? a - 1 : 5 - a), 0) * 2.5;
}

// ---------- Maxsus funksiyalar (Numerical Recipes asosida) ----------

function gammaln(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let hh = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; hh *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    hh *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return hh;
}

function ibeta(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Ikki tomonlama p-qiymat, Styudent taqsimoti. */
export const tPValue = (t, df) => (Number.isFinite(t) && df > 0 ? ibeta(df / 2, 0.5, df / (df + t * t)) : NaN);

function gammaincQ(a, x) {
  // Yuqori regulyarlashtirilgan to'liqmas gamma funksiya Q(a, x)
  if (x <= 0) return 1;
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 0; n < 500; n++) {
      ap++; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 3e-14) break;
    }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - gammaln(a));
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, hh = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    hh *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return Math.exp(-x + a * Math.log(x) - gammaln(a)) * hh;
}

export const chiPValue = (chi2, df) => (Number.isFinite(chi2) && df > 0 ? gammaincQ(df / 2, chi2 / 2) : NaN);

// ---------- Mezonlar ----------

/** Mustaqil tanlanmalar uchun Welch t-mezoni. */
export function welchT(a, b) {
  if (a.length < 2 || b.length < 2) return null;
  const va = sd(a) ** 2 / a.length, vb = sd(b) ** 2 / b.length;
  if (va + vb === 0) return null;
  const t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  const pooled = Math.sqrt(((a.length - 1) * sd(a) ** 2 + (b.length - 1) * sd(b) ** 2) / (a.length + b.length - 2));
  return { t, df, p: tPValue(t, df), d: pooled ? (mean(a) - mean(b)) / pooled : NaN };
}

/** Juftlangan (bir xil o'quvchilar, oldin/keyin) t-mezoni. */
export function pairedT(before, after) {
  const diffs = after.map((x, i) => x - before[i]);
  if (diffs.length < 2) return null;
  const s = sd(diffs);
  if (!s) return null;
  const t = mean(diffs) / (s / Math.sqrt(diffs.length));
  const df = diffs.length - 1;
  return { t, df, p: tPValue(t, df), d: mean(diffs) / s, meanDiff: mean(diffs) };
}

/** Pirson χ² mezoni: guruhlar × darajalar jadvali (table[guruh][daraja]). */
export function chiSquare(table) {
  const rows = table.filter((r) => r.some((x) => x > 0));
  if (rows.length < 2) return null;
  const colTotals = rows[0].map((_, j) => rows.reduce((s, r) => s + r[j], 0));
  const keep = colTotals.map((t) => t > 0);
  const t2 = rows.map((r) => r.filter((_, j) => keep[j]));
  const cols = t2[0].length;
  if (cols < 2) return null;
  const rowT = t2.map((r) => r.reduce((a, b) => a + b, 0));
  const colT = t2[0].map((_, j) => t2.reduce((s, r) => s + r[j], 0));
  const N = rowT.reduce((a, b) => a + b, 0);
  let chi2 = 0;
  t2.forEach((r, i) => r.forEach((o, j) => {
    const e = (rowT[i] * colT[j]) / N;
    chi2 += (o - e) ** 2 / e;
  }));
  const df = (t2.length - 1) * (cols - 1);
  return { chi2, df, p: chiPValue(chi2, df) };
}

export const significance = (p) => (!Number.isFinite(p) ? "—" : p < 0.001 ? "p < 0,001 (juda ahamiyatli)" : p < 0.01 ? `p = ${p.toFixed(3)} (ahamiyatli, p < 0,01)` : p < 0.05 ? `p = ${p.toFixed(3)} (ahamiyatli, p < 0,05)` : `p = ${p.toFixed(3)} (ahamiyatsiz)`);

/** CSV (Excel uchun BOM va nuqta-vergul ajratgich bilan). */
export function toCSV(rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
}
