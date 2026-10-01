// Kasb standarti va ta'lim dasturi talablari: 51010304 — Turizm mutaxassisligi, "Gid tarjimon" kvalifikatsiyasi.
// Manba: O'rta maxsus kasbiy ta'lim darajasi ta'lim dasturi (Professional ta'limni rivojlantirish instituti, Toshkent, 2025),
// Gid tarjimon kasbining NO1.232.1901/Б-22 (23.08.2022) tasdiqlangan kasbiy standarti asosida.
// Platforma faoliyatlari (mavzular, trenajyor, marshrut laboratoriyasi) bilan bog'lanishlar shu faylning oxirida.

export const STANDARD = {
  specialty: "51010304 — Turizm",
  qualification: "Gid tarjimon",
  level: "O'rta maxsus kasbiy ta'lim (5-malaka darajasi)",
  basis: "Gid tarjimon kasbiy standarti NO1.232.1901/Б-22 (23.08.2022)",
  source: "51010304-Turizm mutaxassisligi ta'lim dasturi. Professional ta'limni rivojlantirish instituti, Toshkent, 2025",
  activity: "Turistik mahsulotni shakllantirish, ilgari surish va sotish, majmuaviy turizm xizmatlarini tashkil etish ishlarini mehnat muhofazasi qoidalariga amal qilgan holda bajarish.",
};

// 5.4. Umumiy kompetensiyalar
export const UK = [
  ["UK-1", "Kasbiy faoliyat doirasida vujudga keladigan turli masalalar yechimini topish usullarini tanlay olish"],
  ["UK-2", "Rahbar tomonidan belgilangan maqsadga erishish uchun jamoada ishlay olish"],
  ["UK-3", "O'zining kasbiy malakasini va shaxsiy kamolotini takomillashtirib borish"],
  ["UK-4", "Jamoada va ma'lum vazifani bajarishga yo'naltirilgan guruhda ishlash, hamkasblar, rahbarlar va mijozlar bilan samimiy, xushmuomala hamda samarali muloqot qilish"],
  ["UK-5", "Ta'lim olgan tilida fikrini og'zaki va yozma ravishda ravon bayon qilish"],
  ["UK-6", "Umuminsoniy fazilatlarga ega bo'lish, o'z millatini va Vatanini sevish, u bilan faxrlanish, milliy urf-odatlar, qadriyatlarni hurmat qilish"],
  ["UK-7", "Professional vazifalarni samarali bajarish uchun zarur bo'ladigan ma'lumotlarni qidirish"],
  ["UK-8", "Kasbiy faoliyatida axborot-kommunikatsiya texnologiyalarini qo'llash"],
  ["UK-9", "Kasbga doir hujjatlar bilan ishlash"],
  ["UK-10", "Kasbiy faoliyatda xavfsizlik texnikasi va mehnat muhofazasi qoidalariga amal qilish ko'nikmalariga ega bo'lish"],
  ["UK-11", "Sanoat va nosanoat tashkilotlarda vujudga keladigan chiqindilarni atrof-muhitga zarar yetkazmaslik choralarini ko'rish va utilizatsiya qilish"],
  ["UK-12", "Sohaga oid ekologik madaniyatga rioya qilgan holda faoliyat olib borish"],
].map(([code, title]) => ({ code, title, kind: "UK" }));

// 5.5.2. Gid tarjimon kvalifikatsiyasi bo'yicha kasbiy kompetensiyalar
export const KK = [
  {
    code: "KK-2.1",
    title: "Turizm va ekskursiya bozorida taklif etilayotgan ekskursiyalarning mavjudligi va ekskursiya xizmatlariga bo'lgan ehtiyojni o'rganish va tahlil qilish",
    knowledge: ["Turizm sohasini tartibga soluvchi qonunchilik va me'yoriy-huquqiy hujjatlarning asosiy qoidalari", "O'zbekistonda turizmni rivojlantirishning ustuvor yo'nalishlari", "Turistik va ekskursiya bozorining rivojlanish tendensiyalari, kon'yunkturasi va xususiyatlari", "Turistik yo'nalishlarning infratuzilmasi va ekskursiya marshrutlari"],
    skills: ["Ekskursiya xizmatlari bozorini o'rganishga kompleks tizimli yondashuvni qo'llash", "Ekskursiya xizmatlari bozori kon'yunkturasi va rivojlanish tendensiyalarini tahlil qilish", "Bozordagi mavjud takliflarning qiyosiy tahlilini o'tkazish"],
    module: "PM-1",
  },
  {
    code: "KK-2.2",
    title: "Yangi ekskursiya loyihasi kontseptsiyasini ishlab chiqish",
    knowledge: ["Davlat standartlari va standartlashtirilgan hujjatlar", "Kasbiy standart talablari, ish tavsifi va ichki mehnat qoidalari", "Ekskursiyalarni tashkil etish va o'tkazish uchun zarur texnik hujjatlar"],
    skills: ["Ekskursiyaning maqsadi, vazifalari va mavzusini aniqlash", "Ekskursiya obyektlarini tanlash, o'rganish va ularning pasportini ishlab chiqish", "Marshrutni chizish, ekskursiya matnlari va “Gid portfeli”ni tayyorlash", "Ekskursiyaning texnologik xaritasini tuzish"],
    module: "PM-1, PM-3",
  },
  {
    code: "KK-2.3",
    title: "Ekskursiya va so'rovlar asosida ekskursiya dasturini ishlab chiqish va narxini hisoblash",
    knowledge: ["Asosiy va qo'shimcha ekskursiya xizmatlari uchun narx siyosati", "Mijozlar bilan hisob-kitob shakllari, shu jumladan to'lov kartalari", "Turistik va ekskursiya faoliyatida zamonaviy axborot texnologiyalari"],
    skills: ["Mijozlar ehtiyojlarini tahlil qilish", "Ekskursiya dasturi sxemasi va yo'l xaritasini tuzish", "Ekskursiyalarni ishlab chiqishda axborot texnologiyalaridan foydalanish", "Ekskursiya dasturining narxini hisoblash, dasturlar reyestrini yuritish"],
    module: "PM-1, PM-3",
  },
  {
    code: "KK-2.4",
    title: "Ekskursiya dasturini amalga oshirishga yordam beruvchi reklama kampaniyasini o'tkazish",
    knowledge: ["Aloqaning zamonaviy texnik vositalaridan foydalanib axborotni qayta ishlash usullari, raqamli xavfsizlik", "Kasbiy etika va nutq madaniyati", "Muzokaralar texnikasi va qoidalari"],
    skills: ["Ekskursiya dasturlarini shakllantirishda axborot texnologiyalaridan foydalanish", "SMM va SMO texnologiyalari (ijtimoiy platformalar, forumlar, professional jamoalar) bilan ishlash", "Xizmat yetkazib beruvchilar bilan hamkorlik qilish va shartnomalar tuzish"],
    module: "PM-1",
  },
  {
    code: "KK-2.5",
    title: "Asosiy ekskursiya xizmatlarini bron qilish",
    knowledge: ["Asosiy va qo'shimcha ekskursiya xizmatlarini yetkazib beruvchilar bilan ishlash sxemasi", "Ekskursiya dasturini qabul qilish va buyurtma berish tartibi"],
    skills: ["Qabul qilingan buyurtmalarga muvofiq ekskursiya guruhlarini shakllantirish", "Tegishli tashkilotlarga buyurtma yuborish va hujjatlarni saqlash", "Qabul qilingan va bajarilgan buyurtmalar ma'lumotlar bazasini yuritish"],
    module: "PM-1, PM-2",
  },
  {
    code: "KK-2.6",
    title: "Ekskursiya davomida sayyohlar yoki ekskursiyachilarning ekskursiya marshrutiga rioya qilishini va xavfsizlikni ta'minlash",
    knowledge: ["Iste'molchilar huquqlarini himoya qilish to'g'risidagi qonun hujjatlari", "Turli toifadagi sayyohlarga, shu jumladan nogironlarga xizmat ko'rsatish tamoyillari va qoidalari", "Mehnatni muhofaza qilish, yong'in xavfsizligi va birinchi tibbiy yordam ko'rsatish qoidalari", "Psixologiya, konfliktologiya va madaniyatlararo muloqot asoslari"],
    skills: ["Sayyohlarni ekskursiya obyektlari bilan tanishtirish, mavzu bo'yicha ketma-ket hikoya qilish", "“Ekskursiya portfeli”ning vizual materiallaridan foydalanish", "Ekskursiya vaqtida xavfsizlikni ta'minlash, xavfsizlik brifinglarini o'tkazish, birinchi yordam ko'rsatish", "Kutilmagan vaziyatlarda marshrutni sozlash, ziddiyatli vaziyatlarning oldini olish"],
    module: "PM-2",
  },
  {
    code: "KK-2.7",
    title: "Bo'lajak ekskursiya (ekskursiya dasturi) va o'tkazish shartlari haqida ma'lumot to'plash",
    knowledge: ["Rasmiy va ishonchli manbalardan mamlakat tarixi, madaniyati, geografiyasi, etnografiyasi, dini, iqtisodiyoti", "Muzeylar, madaniyat va ko'rgazma markazlarining ekspozitsiya materiallari", "Madaniyatlararo muloqot nazariyasi va amaliyoti"],
    skills: ["Manbalar bilan ishlash, ma'lumot to'plash va tahlil qilish, bibliografiya tuzish", "Hujjatlar va ekskursiya materiallarining turistlar tiliga tarjimasini tayyorlash, mahalliy tematik lug'at tuzish", "Turistlar tilida ekskursiya, axborot va xavfsizlik brifinglarini o'tkazish"],
    module: "PM-2",
  },
  {
    code: "KK-2.8",
    title: "Ko'rsatilayotgan ekskursiya xizmatlarining sifati bo'yicha shikoyat va da'volarni ko'rib chiqish, ularni tahlil qilish",
    knowledge: ["Shikoyatlar bilan ishlash algoritmi va xususiyatlari", "Sayyohlar uchun ekskursiya xizmatlarini ko'rsatish qoidalari", "Shaxslararo va biznes aloqalari nazariyasi, kasbiy etika"],
    skills: ["Shikoyat va da'volarning sabablarini o'rganish, tahlil qilish va bashorat qilish", "Xarakterli va takroriy shikoyatlarni aniqlash, ularning oldini olish choralarini ishlab chiqish", "Da'vo bo'yicha qabul qilingan qaror haqida turistga javob berish"],
    module: "PM-2",
  },
].map((k) => ({ ...k, kind: "KK" }));

// 5.6. Kasb standartining funksional tahlili (mehnat funksiyalari va mehnat harakatlari)
export const FUNCTIONS = [
  {
    code: "A/01.5",
    title: "Yangi ekskursiya loyihasini ishlab chiqish",
    kk: ["KK-2.1", "KK-2.2"],
    actions: [
      "Turizm va ekskursiya bozorida taklif etilayotgan ekskursiyalar va ehtiyojlarni monitoring qilish, olingan ma'lumotlarni qayta ishlash va tahlil qilish",
      "Yangi ekskursiyaning maqsadi, vazifalari va mavzusini aniqlash; mavzuni o'rganish va ma'lumot to'plash; manbalarni tanlash va bibliografiyani tuzish",
      "Ekskursiya obyektlarini tanlash, o'rganish va ularga pasport ishlab chiqish",
      "Marshrutni chizish va aylanib chiqish; ekskursiya matnlarini (nazorat, individual) tayyorlash; “Yo'riqchi-yo'lboshchi portfeli”ni tayyorlash",
      "Ekskursiyani o'tkazishning uslubiy usullari va texnikasini aniqlash; ekskursiyaning texnologik xaritasini tuzish",
      "Ekskursiya hujjatlari to'plamini (matnlar, gid portfeli, texnologik xarita, obyekt pasporti) shakllantirish",
    ],
  },
  {
    code: "A/02.5",
    title: "Ekskursiya dasturlarini shakllantirish",
    kk: ["KK-2.3"],
    actions: ["Ekskursiya dasturlariga bo'lgan ehtiyojlar, qiziqishlar va so'rovlarni aniqlash", "Ekskursiya va so'rovlar asosida ekskursiya dasturini ishlab chiqish", "Dastur asosida ekskursiya o'tkazish sxemasi va usullarini ishlab chiqish", "Ekskursiya dasturining narxini hisoblash; ekskursiya dasturlari reyestrini yuritish"],
  },
  {
    code: "A/03.5",
    title: "Ekskursiya jarayonini tashkil etish",
    kk: ["KK-2.4", "KK-2.5"],
    actions: ["Ekskursiya dasturini amalga oshirishga yordam beruvchi reklama kampaniyasini o'tkazish", "Qabul qilingan buyurtmalarga muvofiq turistik yoki ekskursiya guruhlarini tashkil etish", "Asosiy va qo'shimcha ekskursiya xizmatlarini bron qilish", "Xizmatlar provayderlari bilan shartnomalar tuzish"],
  },
  {
    code: "A/04.5",
    title: "Ekskursiya xizmatlariga buyurtmalarni qabul qilish va qayta ishlash",
    kk: ["KK-2.4", "KK-2.5"],
    actions: ["Buyurtmani qabul qilish va bajarishning barcha bosqichlarida sayyohlarga maslahat berish va axborot yordamini ko'rsatish", "Buyurtma va tijorat hujjatlarini rasmiylashtirish, shartnoma tuzish", "Naqd yoki naqd pulsiz to'lovlarni qabul qilish", "Qabul qilingan va bajarilgan buyurtmalar ma'lumotlar bazasini yuritish"],
  },
  {
    code: "A/05.5",
    title: "Ekskursiya o'tkazish",
    kk: ["KK-2.6"],
    actions: ["Sayyohlarni ekskursiya obyektida joylashtirish va obyektlar bilan tanishtirish", "Ekskursiyaning tematik yo'nalishi va kontseptsiyasiga ko'ra ketma-ket hikoya qilish; “Ekskursiya portfeli”ning vizual materiallaridan foydalanish", "Sayyohlarning marshrutga rioya qilishi va xavfsizligini ta'minlash; xavfsizlik brifinglarini o'tkazish", "Turistlarga barcha qiziqtirgan masalalar bo'yicha maslahat berish", "Turli guruhlarga tabaqalashtirilgan yondashuv bilan ziddiyatli vaziyatlarning oldini olish", "Kutilmagan vaziyatlarda ekskursiya marshrutini sozlash"],
  },
  {
    code: "A/06.5",
    title: "Turistlar tilida ekskursiya va tarjima xizmatlarini ko'rsatish",
    kk: ["KK-2.7"],
    actions: ["Turizm, madaniyat, tarix, san'at sohalaridagi terminologiyani o'rganish va unifikatsiya qilish", "Hujjatlar va ekskursiya materiallarining turistlar tiliga tarjimalarini tayyorlash; mahalliy tematikaga oid lug'at tuzish", "Tarjimalarning leksik, stilistik va semantik aniqligini ta'minlash", "Turistlar tilida tushuntirishlar, hikoyalar va xavfsizlik brifinglarini o'tkazish"],
  },
  {
    code: "A/07.5",
    title: "Buyurtmalarni bajarish bo'yicha ishlarni nazorat qilish",
    kk: ["KK-2.8"],
    actions: ["Ekskursiya xizmatlari sifati yuzasidan shikoyat va da'volar sabablarini tahlil qilish", "Xarakterli va takroriy shikoyatlarni aniqlash, ularni bartaraf etish va oldini olish usullarini izlash", "Da'vo bo'yicha qabul qilingan qaror haqida turistga javob berish", "Shikoyatlarning oldini olish bo'yicha tuzatish va profilaktika choralarini ishlab chiqish"],
  },
];

// VI–VII. Professional modullar va o'quv rejadagi tegishli modullar
export const MODULES = [
  { code: "PM-1", id: "5PM0227", title: "Ekskursiya xizmatini tashkil etish", credits: 5 },
  { code: "PM-2", id: "5PM0330", title: "Gid tarjimon va ekskursiya yetakchi faoliyatini tashkil etish", credits: 5 },
  { code: "PM-3", id: "5PM0226", title: "Ekskursiya xizmatida animatorlik", credits: 3 },
  { code: "MM-2.3", id: "5PM0399", title: "Iqtisodiyotda axborot-kommunikatsiya texnologiyalari va tizimlari", credits: 5 },
];

export const ALL_COMPETENCIES = [...KK, ...UK];
export const COMPETENCY = Object.fromEntries(ALL_COMPETENCIES.map((c) => [c.code, c]));

// ---------- Platforma faoliyatlarining kompetensiyalar bilan bog'lanishi ----------
// (Platforma tomonidan pedagogik tahlil asosida belgilangan; o'qituvchi tahrirlashi mumkin.)

export const TOPIC_MAP = {
  t1: ["UK-7", "UK-8", "UK-3"],
  t2: ["UK-8", "UK-9", "UK-10"],
  t3: ["UK-8", "KK-2.5", "KK-2.3"],
  t4: ["UK-9", "UK-5", "KK-2.2"],
  t5: ["KK-2.3", "KK-2.1", "UK-8"],
  t6: ["KK-2.4", "KK-2.2", "UK-5"],
  t7: ["UK-7", "UK-8", "KK-2.4"],
  t8: ["KK-2.5", "UK-8", "UK-9"],
  t9: ["UK-9", "UK-8"],
  t10: ["UK-8", "UK-4"],
  t11: ["UK-8", "UK-1"],
  t12: ["KK-2.5", "KK-2.3", "UK-8"],
  t13: ["KK-2.2", "KK-2.6", "KK-2.4"],
  t14: ["KK-2.4", "KK-2.5", "KK-2.1"],
  t15: ["UK-8", "UK-10", "KK-2.4"],
};

export const SCENARIO_MAP = {
  "registon-tour": { kk: ["KK-2.6", "KK-2.7", "UK-4", "UK-6"], functions: ["A/05.5", "A/06.5"] },
  "lost-tourist": { kk: ["KK-2.6", "UK-1", "UK-10", "UK-8"], functions: ["A/05.5"] },
  overbooking: { kk: ["KK-2.8", "KK-2.5", "UK-4"], functions: ["A/07.5", "A/03.5"] },
  "double-payment": { kk: ["KK-2.8", "UK-8", "UK-9"], functions: ["A/07.5", "A/04.5"] },
  "khiva-virtual": { kk: ["KK-2.6", "KK-2.4", "UK-8"], functions: ["A/05.5"] },
  "foreign-arrival": { kk: ["KK-2.7", "UK-4", "UK-8"], functions: ["A/06.5", "A/04.5"] },
  "negative-review": { kk: ["KK-2.8", "KK-2.4", "UK-5"], functions: ["A/07.5"] },
  "accessible-tour": { kk: ["KK-2.3", "KK-2.6", "UK-4"], functions: ["A/02.5", "A/05.5"] },
  "itinerary-design": { kk: ["KK-2.3", "KK-2.2", "KK-2.5"], functions: ["A/02.5", "A/01.5"] },
  "heat-emergency": { kk: ["KK-2.6", "UK-10", "UK-1"], functions: ["A/05.5"] },
};

export const ROUTE_LAB_MAP = { kk: ["KK-2.2", "KK-2.3", "KK-2.1", "UK-7", "UK-8"], functions: ["A/01.5", "A/02.5"] };

/**
 * O'quvchining kompetensiya xaritasi: har bir kompetensiya bo'yicha dalillar (0–100) o'rtachasi.
 * evidence: { topics: {topicId: pct}, selfStudy: [{topicId, grade}], trainer: [{scenarioId, total}], routes: [{total}] }
 */
export function competencyMap(evidence) {
  const bucket = Object.fromEntries(ALL_COMPETENCIES.map((c) => [c.code, []]));
  const add = (codes, value, source) => codes.forEach((c) => bucket[c]?.push({ value, source }));
  for (const [tid, pct] of Object.entries(evidence.topics || {})) if (pct > 0) add(TOPIC_MAP[tid] || [], pct, "Mavzu");
  for (const s of evidence.selfStudy || []) if (s.grade != null) add(TOPIC_MAP[s.topicId] || [], ((s.grade - 2) / 3) * 100, "Mustaqil ish");
  const bestTrainer = {};
  for (const t of evidence.trainer || []) bestTrainer[t.scenarioId] = Math.max(bestTrainer[t.scenarioId] ?? 0, t.total);
  for (const [sid, total] of Object.entries(bestTrainer)) add(SCENARIO_MAP[sid]?.kk || [], total, "Trenajyor");
  for (const r of evidence.routes || []) if (r.total != null) add(ROUTE_LAB_MAP.kk, r.total, "Marshrut loyihasi");
  return ALL_COMPETENCIES.map((c) => {
    const items = bucket[c.code];
    const value = items.length ? items.reduce((s, x) => s + x.value, 0) / items.length : null;
    return { ...c, value, count: items.length, sources: [...new Set(items.map((x) => x.source))], level: value == null ? "Dalil yo'q" : value >= 70 ? "Shakllangan" : value >= 40 ? "Rivojlanmoqda" : "Boshlang'ich" };
  });
}
