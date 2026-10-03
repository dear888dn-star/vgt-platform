// Test tahlili (klassik test nazariyasi): qiyinlik indeksi p, ajrata olish indeksi D (yuqori/past 27%),
// tuzatilgan savol–umumiy ball korrelyatsiyasi r, distraktorlar tahlili va testning ishonchliligi KR-20.

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const variance = (a) => {
  const m = mean(a);
  return a.length > 1 ? a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length : 0;
};
function pearson(x, y) {
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

/**
 * responses: [[tanlangan variant indekslari]] — har bir o'quvchi uchun bitta qator.
 * quiz: [{ q, options, correct }].
 */
export function itemAnalysis(quiz, responses) {
  const k = quiz.length;
  const rows = responses.filter((r) => Array.isArray(r) && r.length === k);
  const n = rows.length;
  const scored = rows.map((r) => r.map((c, i) => (c === quiz[i].correct ? 1 : 0)));
  const totals = scored.map((r) => r.reduce((a, b) => a + b, 0));
  // Yuqori va past guruhlar: 27% (n kichik bo'lsa — yarmi)
  const order = totals.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]);
  const g = n >= 10 ? Math.max(1, Math.round(n * 0.27)) : Math.max(1, Math.floor(n / 2));
  const upper = order.slice(0, g).map(([, i]) => i);
  const lower = order.slice(-g).map(([, i]) => i);

  const items = quiz.map((q, j) => {
    const col = scored.map((r) => r[j]);
    const p = n ? mean(col) : null;
    const D = n >= 2 ? mean(upper.map((i) => scored[i][j])) - mean(lower.map((i) => scored[i][j])) : null;
    const rest = totals.map((t, i) => t - scored[i][j]);
    const r = n >= 3 ? pearson(col, rest) : null;
    const counts = q.options.map((_, o) => rows.filter((row) => row[j] === o).length);
    const upperCounts = q.options.map((_, o) => upper.filter((i) => rows[i][j] === o).length);
    const flags = [];
    if (n >= 5) {
      if (D !== null && D < 0) flags.push({ level: "critical", text: "Salbiy ajratish: kuchli o'quvchilar ko'proq xato qilgan — javob kalitini tekshiring" });
      else if (D !== null && D < 0.2) flags.push({ level: "warn", text: "Past ajratish qobiliyati — savolni qayta ko'rib chiqing" });
      if (p > 0.9) flags.push({ level: "info", text: "Juda oson savol" });
      if (p < 0.2) flags.push({ level: "warn", text: "Juda qiyin savol" });
      const strongWrong = upperCounts.findIndex((c, o) => o !== q.correct && c > upperCounts[q.correct]);
      if (strongWrong >= 0) flags.push({ level: "critical", text: `Kuchli o'quvchilar ko'proq “${"ABCDEF"[strongWrong]}” variantini tanlagan — kalit noto'g'ri bo'lishi mumkin` });
      const dead = counts.map((c, o) => (o !== q.correct && c / n < 0.05 ? "ABCDEF"[o] : null)).filter(Boolean);
      if (dead.length) flags.push({ level: "info", text: `Ishlamayotgan distraktor(lar): ${dead.join(", ")} (5% dan kam tanlangan)` });
    }
    return { index: j, q: q.q, options: q.options, correct: q.correct, p, D, r, counts, flags };
  });

  // KR-20 ishonchlilik koeffitsienti
  const varTotal = variance(totals);
  const sumPQ = items.reduce((s, it) => s + (it.p ?? 0) * (1 - (it.p ?? 0)), 0);
  const kr20 = n >= 5 && k > 1 && varTotal > 0 ? (k / (k - 1)) * (1 - sumPQ / varTotal) : null;
  return {
    n,
    k,
    mean: n ? mean(totals) : null,
    sd: n ? Math.sqrt(varTotal) : null,
    meanPct: n ? (mean(totals) / k) * 100 : null,
    kr20,
    groupSize: g,
    distribution: Array.from({ length: k + 1 }, (_, s) => totals.filter((t) => t === s).length),
    items,
  };
}
