// Dissertatsiya III bobi (3.1–3.2-§) dagi tajriba-sinov natijalari: 2024–2026-yillar, 3 ta texnikum, n = 213.
// Darajalar soni [Past, O'rta, Yuqori] ko'rinishida. B indeksi daraja kodlari (3, 4, 5) bo'yicha hisoblanadi —
// platformaning yangi diagnostika natijalari ham shu darajalar orqali arxiv bilan birlashtiriladi.
// T1 (oraliq monitoring) da texnikumlar kesimida faqat yuqori daraja ulushi e'lon qilingan.

export const ARCHIVE_LEVELS = ["Past", "O'rta", "Yuqori"];
export const LEVEL_CODES = [3, 4, 5];

export const ARCHIVE = {
  id: "dissertatsiya-2024-2026",
  title: "Tajriba-sinov ishlari natijalari (2024–2026)",
  source: "Dissertatsiya, III bob: 3.1–3.15-jadvallar",
  design: "Pretest–posttest, teng bo'lmagan nazorat guruhlari tipidagi kvazi-eksperiment",
  periods: { T0: "Aniqlovchi bosqich (2024)", T1: "Shakllantiruvchi bosqich (2024–2025)", T2: "Yakunlovchi bosqich (2025–2026)" },
  colleges: [
    {
      name: "Shahrisabz turizm va madaniy meros texnikumi", short: "Shahrisabz TMMT", match: "shahrisabz", table: "3.9",
      n: { experimental: 34, control: 36 },
      levels: {
        T0: { experimental: [11, 15, 8], control: [13, 16, 7] },
        T1: { experimental: { Yuqori: 11 }, control: { Yuqori: 8 } },
        T2: { experimental: [3, 18, 13], control: [9, 17, 10] },
      },
      published: { T2: { mT: 4.29, mN: 4.03, diff: 0.27, ci: [-0.06, 0.59], t: 1.63, p: 0.108, d: 0.39, K: 1.07 } },
    },
    {
      name: "Samarqand turizm va madaniy meros texnikumi", short: "Samarqand TMMT", match: "samarqand", table: "3.10",
      n: { experimental: 24, control: 25 },
      levels: {
        T0: { experimental: [7, 11, 6], control: [9, 11, 5] },
        T1: { experimental: { Yuqori: 8 }, control: { Yuqori: 6 } },
        T2: { experimental: [2, 11, 11], control: [6, 12, 7] },
      },
      published: { T2: { mT: 4.38, mN: 4.04, diff: 0.33, ci: [-0.06, 0.73], t: 1.7, p: 0.097, d: 0.48, K: 1.08 } },
    },
    {
      name: "Zomin turizm va madaniy meros texnikumi", short: "Zomin TMMT", match: "zomin", table: "3.11",
      n: { experimental: 48, control: 46 },
      levels: {
        T0: { experimental: [16, 21, 11], control: [17, 19, 10] },
        T1: { experimental: { Yuqori: 15 }, control: { Yuqori: 11 } },
        T2: { experimental: [5, 25, 18], control: [12, 22, 12] },
      },
      published: { T2: { mT: 4.27, mN: 4.0, diff: 0.27, ci: [-0.01, 0.55], t: 1.9, p: 0.06, d: 0.39, K: 1.07 } },
    },
  ],
  // 3.12-jadval va 3.2-§ matni (T1 umumiy: yuqori 32,1 % / 23,4 %, past 17,9 % / 28,0 %)
  total: {
    n: { experimental: 106, control: 107 },
    levels: {
      T0: { experimental: [34, 47, 25], control: [39, 46, 22] },
      T1: { experimental: [19, 53, 34], control: [30, 52, 25] },
      T2: { experimental: [10, 54, 42], control: [27, 51, 29] },
    },
  },
  // 3.13–3.14-jadvallar (dissertatsiyada e'lon qilingan qiymatlar)
  published: {
    T0: { mT: 3.92, mN: 3.84, diff: 0.07, ci: [-0.13, 0.27], t: 0.73, p: 0.468, d: 0.1, U: 5977, pU: 0.465, chi2: 0.54, pChi: 0.763, K: 1.02 },
    T1: { mT: 4.14, mN: 3.95, diff: 0.19, ci: [-0.0, 0.38], t: 1.94, p: 0.054, d: 0.27, U: 6466, pU: 0.055, chi2: 3.85, pChi: 0.146 },
    T2: { mT: 4.3, mN: 4.02, diff: 0.28, ci: [0.1, 0.47], t: 3.03, p: 0.003, d: 0.41, U: 6855, pU: 0.004, chi2: 10.27, pChi: 0.006, K: 1.07, Kusb: 1.03, sdT: 0.64, sdN: 0.73 },
  },
};

/** Daraja sonlaridan [3,3,…,4,…,5] kodlar massivi (Styudent mezoni va boshqalar uchun). */
export const codesFrom = (levels) => (Array.isArray(levels) ? levels.flatMap((n, i) => Array(n).fill(LEVEL_CODES[i])) : []);
export const levelMean = (levels) => {
  const n = Array.isArray(levels) ? levels.reduce((a, b) => a + b, 0) : 0;
  return n ? levels.reduce((s, c, i) => s + c * LEVEL_CODES[i], 0) / n : null;
};
/** B indeksidan daraja (3,00–3,49 past; 3,50–4,49 o'rta; 4,50–5,00 yuqori). */
export const levelIndexOfB = (B) => (B >= 4.5 ? 2 : B >= 3.5 ? 1 : 0);
/** Platformadagi texnikum nomini arxivdagi texnikumga moslash. */
export const archiveCollegeOf = (name) => {
  const s = String(name || "").toLowerCase();
  return ARCHIVE.colleges.find((c) => s.includes(c.match)) || null;
};
export const addLevels = (...arrs) => [0, 1, 2].map((i) => arrs.reduce((s, a) => s + (Array.isArray(a) ? a[i] || 0 : 0), 0));
