// 1-ilova. Bo'lajak turizm mutaxassislarini raqamli texnologiyalar asosida kasbiy faoliyatga
// tayyorlashning kompleks diagnostik vositalari (A–D bo'limlar) va natijalarni hisoblash formulalari.

export const STAGES = {
  T0: "Aniqlovchi bosqich (T0)",
  T1: "Shakllantiruvchi bosqich (T1)",
  T2: "Yakunlovchi bosqich (T2)",
};

export const LIKERT_SCALE = ["Mutlaqo qo'shilmayman", "Qo'shilmayman", "Qisman qo'shilaman", "Qo'shilaman", "To'liq qo'shilaman"];

export const SECTION_A = {
  title: "A-bo'lim. Motivatsion-qadriyatli mezon bo'yicha anketa",
  instruction: "Har bir fikrga o'zingizning haqiqiy munosabatingizni belgilang. 1 — mutlaqo qo'shilmayman; 2 — qo'shilmayman; 3 — qisman qo'shilaman; 4 — qo'shilaman; 5 — to'liq qo'shilaman.",
  items: [
    "Turizm sohasida, ayniqsa sayyohlar bilan ishlash yo'nalishida faoliyat yuritishni istayman.",
    "Raqamli texnologiyalar turizm mutaxassisining kasbiy muvaffaqiyati uchun zarur deb hisoblayman.",
    "Onlayn bronlash, raqamli xarita va turistik mobil ilovalarni o'rganishga qiziqaman.",
    "Sun'iy intellekt vositalaridan turistik xizmat sifatini oshirishda mas'uliyat bilan foydalanishga tayyorman.",
    "Kasbiy vazifani bajarish uchun internetdan topilgan axborotni tekshirib, saralashga harakat qilaman.",
    "Yangi dastur yoki platformani mustaqil o'rganish menga qiziq.",
    "Murakkab raqamli topshiriqda xato qilsam, uni tuzatish yo'lini izlayman.",
    "Turistlarning shaxsiy ma'lumotlarini himoya qilishni kasbiy mas'uliyat deb bilaman.",
    "Raqamli vositalar yordamida ekskursiya va marshrutni qiziqarliroq tashkil etish mumkin deb hisoblayman.",
    "Kasbiy rivojlanishim uchun o'qituvchi va mutaxassislarning fikr-mulohazasini qabul qilaman.",
    "Kelajakda turistik tashkilotda raqamli vositalardan foydalana olishimga ishonaman.",
    "Raqamli marketing va onlayn muloqot ko'nikmalari ishga joylashish imkoniyatimni oshiradi deb o'ylayman.",
    "Guruhli loyihada raqamli vositalar orqali hamkorlik qilishga tayyorman.",
    "Kasbiy maqsadimga erishish uchun raqamli ko'nikmalarimni muntazam rivojlantirishni rejalashtiraman.",
    "Virtual vaziyat va trenajyorlarda mashq qilish kasbiy tayyorgarligimni oshiradi deb hisoblayman.",
  ],
};

const B_QUESTIONS = [
  ["Turistik marshrutni ko'rgazmali shaklda yaratish uchun eng mos vosita qaysi?", ["Elektron pochta", "Raqamli xarita", "Matn muharriri", "Antivirus"]],
  ["Onlayn bronlash tizimining asosiy vazifasi nima?", ["Faqat reklama tarqatish", "Xizmat mavjudligini tekshirish va rezervatsiya qilish", "Parol yaratish", "Matn tarjima qilish"]],
  ["CRM tizimi turistik korxonada, avvalo, nima uchun qo'llanadi?", ["Mijozlar haqidagi ma'lumotlarni yuritish va xizmatni boshqarish", "Xarita chizish", "Video montaj qilish", "Kompyuter ta'mirlash"]],
  ["Turistning telefon raqami va pasport ma'lumotini yuborishda to'g'ri harakat qaysi?", ["Uni ochiq guruhga joylash", "Har kimga yuborish", "Himoyalangan kanal va zarur ruxsat asosida yuborish", "Ijtimoiy tarmoqqa chiqarish"]],
  ["Bulutli xizmatlarning asosiy afzalligi nimada?", ["Fayllarga turli qurilmadan hamkorlikda kirish imkonida", "Internetni o'chiradi", "Faqat qog'oz hujjat yaratadi", "Viruslarni ko'paytiradi"]],
  ["Turist uchun marshrut tuzishda raqamli xaritadagi qaysi ma'lumot muhim?", ["Faqat obyekt nomi", "Masofa, vaqt va obyektlar ketma-ketligi", "Telefon modeli", "Fayl rangi"]],
  ["Elektron jadval turistik xizmat narxini hisoblashda nima beradi?", ["Avtomatik hisoblash va xarajatlarni tahlil qilish", "Faqat surat saqlash", "Videokonferensiya o'tkazish", "Parol almashish"]],
  ["Raqamli manbadagi axborotni ishlatishdan oldin nima qilish kerak?", ["Manba ishonchliligi va yangilanganligini tekshirish", "Darhol nusxalash", "Muallifini yashirish", "Faqat sarlavhani o'qish"]],
  ["Turistning shikoyatiga elektron pochta orqali javob berishda eng muhim talab qaysi?", ["Kechikib, qisqa javob berish", "Xushmuomalalik, aniq yechim va keyingi harakatni ko'rsatish", "Shikoyatni e'tiborsiz qoldirish", "Shaxsiy ma'lumotni ommalashtirish"]],
  ["Sun'iy intellekt yaratgan turistik matndan foydalanishdan oldin nima qilinadi?", ["Tekshirilmasdan yuboriladi", "Mazmuni, faktlari va uslubi tekshiriladi", "Muallifi o'zgartiriladi", "Internet o'chiriladi"]],
  ["Virtual ekskursiyaning asosiy pedagogik imkoniyati nimada?", ["Obyekt va kasbiy vaziyatni xavfsiz muhitda modellashtirish", "Faqat musiqa tinglash", "Qog'oz sarfini oshirish", "Darsni bekor qilish"]],
  ["Raqamli marketingda auditoriyani aniqlash nima uchun zarur?", ["Xabarni mos turistlar guruhiga yo'naltirish uchun", "Kompyuter xotirasini to'ldirish uchun", "Xarita o'rniga ishlatish uchun", "Parol yozish uchun"]],
  ["Onlayn fikr-mulohazalarni tahlil qilish nimaga xizmat qiladi?", ["Xizmatdagi muammoni va mijoz ehtiyojini aniqlashga", "Faqat reklama sonini sanashga", "Hujjatni chop etishga", "Internetni cheklashga"]],
  ["Kuchli parolning to'g'ri tavsifi qaysi?", ["Tug'ilgan yil", "Ism-familiya", "Harf, raqam va belgilar aralashmasi", "123456"]],
  ["Turistik obyekt bo'yicha raqamli kontent tayyorlashda mualliflik huquqiga rioya qilish nimani anglatadi?", ["Manbani ko'rsatish va ruxsat talablarini hisobga olish", "Barcha materialni muallifsiz olish", "Boshqaning nomidan nashr qilish", "Hech narsani tekshirmaslik"]],
  ["Videokonferensiyada mijoz yoki hamkor bilan muloqotning to'g'ri usuli qaysi?", ["Tayyor kun tartibi, aniq nutq va maxfiylikka rioya qilish", "Mikrofonni doim o'chirib qo'yish", "Mijozni tanishtirmaslik", "Noma'lum havola yuborish"]],
  ["Chat-botning turistik xizmatdagi maqbul vazifasi qaysi?", ["Tez-tez beriladigan savollarga dastlabki javob berish", "Turist pasportini ochiq joylash", "Moliyaviy hujjatlarni yo'qotish", "Dars jadvalini o'chirib yuborish"]],
  ["Raqamli to'lov havolasi bilan ishlashda qanday xavf bor?", ["Soxta havola orqali ma'lumot o'g'irlanishi", "Xarita kattalashishi", "Taqdimot uzayishi", "Elektron jadval rangining o'zgarishi"]],
  ["Turist uchun mos turistik mahsulot tanlashda qaysi ma'lumot birinchi navbatda olinadi?", ["Ehtiyoj, byudjet, vaqt va qiziqishlar", "Faqat telefon markasi", "O'qituvchining ismi", "Fayl hajmi"]],
  ["Raqamli kasbiy topshiriqning odatiy raqamli topshiriqdan farqi nimada?", ["Kasbiy muammoni raqamli vosita bilan hal qilishga qaratilganida", "Faqat kompyuterda yozilishida", "Savolning uzunligida", "Internet tezligida"]],
];

// 1-ilovadagi "B-bo'lim uchun javoblar kaliti": B B A C A B A A B B A A A C A A A A A A
const B_KEY = "BBACABAABBAAACAAAAAA".split("").map((l) => "ABCD".indexOf(l));

export const SECTION_B = {
  title: "B-bo'lim. Kognitiv-kommunikativ mezon bo'yicha diagnostik test",
  instruction: "Har bir savolning bitta to'g'ri javobini tanlang. Bajarish vaqti: 25 daqiqa. Har bir to'g'ri javob — 1 ball, noto'g'ri yoki belgilanmagan javob — 0 ball.",
  minutes: 25,
  questions: B_QUESTIONS.map(([q, options]) => ({ q, options })),
};

export const SECTION_C = {
  title: "C-bo'lim. Amaliy-refleksiv mezon bo'yicha standart topshiriqlar",
  instruction: "Quyidagi uch topshiriqni 90 daqiqa davomida mustaqil bajaring. Internetdan faqat ochiq manba sifatida foydalanish mumkin. O'qituvchi bajarish jarayonida mazmuniy yordam bermaydi; u faqat texnik tashkiliy yo'riqnoma beradi.",
  minutes: 90,
  tasks: [
    {
      title: "1-topshiriq. Raqamli marshrut va axborot manbasi",
      text: "Berilgan shahar bo'yicha 4 ta turistik obyektni tanlang. Ishonchli raqamli manbalardan qisqa ma'lumot to'plang va Google Maps yoki unga teng vositada 2–3 soatlik piyoda marshrut tuzing. Xarita havolasi, obyektlar ketma-ketligi, masofa va taxminiy vaqtni topshiring.",
      fields: [
        { key: "link", label: "Xarita havolasi", type: "url" },
        { key: "text", label: "Obyektlar ketma-ketligi, qisqa ma'lumot va manbalar, masofa va taxminiy vaqt", type: "textarea" },
      ],
    },
    {
      title: "2-topshiriq. Turistik mahsulotni rasmiylashtirish",
      text: "Bir kunlik turpaket uchun elektron jadvalda narx hisobini tuzing. So'ng mijozga yuborish uchun 120–150 so'zli professional elektron xat tayyorlang. Xatda xizmat tarkibi, narx, bronlash sharti va aloqa tartibi aniq berilishi lozim.",
      fields: [
        { key: "link", label: "Elektron jadval havolasi (Google Sheets, OneDrive va b.)", type: "url" },
        { key: "text", label: "Mijozga elektron xat (120–150 so'z)", type: "textarea", words: [120, 150] },
      ],
    },
    {
      title: "3-topshiriq. Kasbiy vaziyat va gidlik muloqoti",
      text: "Siz tuzgan marshrut bo'yicha 3 daqiqalik og'zaki yoki yozma gidlik ssenariysini yarating. Berilgan kutilmagan savolga javob yozing: “Ob-havo sababli bitta obyektga kira olmasak, sayyohlar uchun qanday muqobil yechim taklif qilasiz?” Javobda turist ehtiyoji, vaqt va xavfsizlikni hisobga oling.",
      fields: [
        { key: "text", label: "Gidlik ssenariysi (yoki audio/video havolasi bilan izoh)", type: "textarea" },
        { key: "answer", label: "Kutilmagan savolga javob", type: "textarea" },
        { key: "link", label: "Audio/video yozuv havolasi", type: "url", optional: true },
      ],
    },
  ],
  rubric: [
    { title: "Ishonchli axborotni tanlash va manbani ko'rsatish", levels: ["Manba tanlanmagan yoki tekshirilmagan", "Asosan mos manba tanlangan, ayrim kamchiliklar bor", "Bir nechta ishonchli manba tanlangan va to'g'ri ko'rsatilgan"] },
    { title: "Raqamli vositadan foydalanish", levels: ["Vazifa yordam bilan va xatolar bilan bajarilgan", "Asosan mustaqil bajarilgan, ayrim texnik xatolar bor", "Mustaqil, to'g'ri va maqsadga muvofiq bajarilgan"] },
    { title: "Kasbiy qaror va yechim", levels: ["Yechim kasbiy vaziyatga mos emas", "Yechim qisman mos, asoslash yetarli emas", "Yechim turist ehtiyoji, vaqt va xavfsizlikni hisobga olgan"] },
    { title: "Raqamli muloqot va hujjat sifati", levels: ["Xat yoki ssenariy noaniq, kasbiy uslubga mos emas", "Mazmun asosan tushunarli, ayrim uslubiy xatolar bor", "Aniq, xushmuomala, kasbiy uslub va talabga to'liq mos"] },
    { title: "Mustaqillik va ishni yakunlash", levels: ["Ish to'liq tugallanmagan yoki ko'p yordam talab qilgan", "Ish yakunlangan, ayrim yordam yoki eslatma talab qilingan", "Ish belgilangan vaqtda to'liq va mustaqil yakunlangan"] },
    { title: "Raqamli xavfsizlik va etik talablar", levels: ["Maxfiylik yoki mualliflik qoidalari buzilgan", "Asosiy talablar qisman bajarilgan", "Maxfiylik, mualliflik va etik talablar to'liq bajarilgan"] },
  ],
  kqIndicators: [0, 2, 3], // KQ — 1-, 3- va 4-indikatorlar
};

export const SECTION_D = {
  title: "D-bo'lim. Refleksiya varaqasi",
  instruction: "Amaliy topshiriqlar bajarilgandan so'ng quyidagi savollarga 8–10 daqiqa davomida qisqa, aniq javob yozing.",
  questions: [
    "Qaysi topshiriqni eng yaxshi bajardingiz? Javobingizni aniq dalil bilan izohlang.",
    "Bajarishda qaysi xato yoki qiyinchilik yuz berdi?",
    "Ushbu qiyinchilikning sababi nimada deb o'ylaysiz?",
    "Keyingi urinishda natijani yaxshilash uchun qanday ikki aniq harakatni amalga oshirasiz?",
    "Kasbiy vazifani bajarishda raqamli vositadan foydalanish sizning qaroringizga qanday ta'sir qildi?",
  ],
  rubric: [
    { title: "Natijani anglash", levels: ["Javob umumiy yoki dalilsiz", "Natija qisman izohlangan", "Natija aniq dalil bilan izohlangan"] },
    { title: "Xatoni aniqlash", levels: ["Xato ko'rsatilmagan", "Xato ko'rsatilgan, lekin noaniq", "Xato va uning ko'rinishi aniq ko'rsatilgan"] },
    { title: "Sababni tahlil qilish", levels: ["Sabab tahlil qilinmagan", "Sabab qisman tahlil qilingan", "Sabab dalil va vaziyat bilan tahlil qilingan"] },
    { title: "Takomillashtirish rejasi", levels: ["Aniq reja yo'q", "Bitta umumiy harakat belgilangan", "Ikki yoki undan ortiq aniq, bajariladigan harakat belgilangan"] },
    { title: "Kasbiy qarorni baholash", levels: ["Raqamli vosita ta'siri tushuntirilmagan", "Ta'sir qisman izohlangan", "Ta'sirning foydasi va cheklovi asosli izohlangan"] },
  ],
};

export const CRITERIA = [
  { key: "M", title: "Motivatsion-qadriyatli" },
  { key: "KK", title: "Kognitiv-kommunikativ" },
  { key: "AR", title: "Amaliy-refleksiv" },
];

/** Talabaga yuboriladigan vositalar (B-bo'lim kalitisiz). */
export function publicInstrument() {
  return { stages: STAGES, likert: LIKERT_SCALE, A: SECTION_A, B: SECTION_B, C: SECTION_C, D: SECTION_D, criteria: CRITERIA };
}

// ---------- Hisoblash (2-bo'lim: "Natijalarni hisoblash va darajalash") ----------

const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const byAvg = (v) => (v < 3.5 ? 3 : v < 4.5 ? 4 : 5); // 3,00–3,49 → 3; 3,50–4,49 → 4; 4,50–5,00 → 5
const clampRound = (v) => Math.min(5, Math.max(3, Math.round(v)));

export function gradeM(m) {
  return m < 2.5 ? 3 : m < 3.75 ? 4 : 5; // 1,00–2,49 → 3; 2,50–3,74 → 4; 3,75–5,00 → 5
}
export function gradeT(pct) {
  return pct < 50 ? 3 : pct < 75 ? 4 : 5; // 0–49 % → 3; 50–74 % → 4; 75–100 % → 5
}
export function levelOfB(b) {
  return b < 3.5 ? "Past" : b < 4.5 ? "O'rta" : "Yuqori";
}
export const levelOfGrade = (g) => ({ 3: "Past", 4: "O'rta", 5: "Yuqori" })[g];

export function scoreB(answers) {
  return B_KEY.reduce((n, k, i) => n + (answers?.[i] === k ? 1 : 0), 0);
}

/**
 * Bitta o'quvchining bitta bosqichdagi natijasi. Barcha bo'limlar to'ldirilmagan bo'lsa,
 * mavjud ko'rsatkichlar qaytariladi, umumiy natija (B) esa null bo'ladi.
 */
export function computeResult(record) {
  const r = {};
  if (record.A?.answers?.length === 15) {
    r.Mraw = record.A.answers.reduce((s, x) => s + x, 0);
    r.Mavg = r.Mraw / 15;
    r.M = gradeM(r.Mavg);
  }
  if (record.B?.submittedAt) {
    r.Traw = scoreB(record.B.answers);
    r.Tpct = (r.Traw / 20) * 100;
    r.T = gradeT(r.Tpct);
  }
  const C = record.grading?.C; // [3 topshiriq][6 indikator] — baholar 3..5
  if (C && C.length === 3 && C.every((t) => t.length === 6 && t.every((g) => [3, 4, 5].includes(g)))) {
    r.KQavg = avg(C.flatMap((t) => SECTION_C.kqIndicators.map((i) => t[i])));
    r.KQ = byAvg(r.KQavg);
    r.Pavg = avg(C.flat());
    r.P = byAvg(r.Pavg);
  }
  const D = record.grading?.D; // [5 indikator]
  if (D && D.length === 5 && D.every((g) => [3, 4, 5].includes(g))) {
    r.Ravg = avg(D);
    r.R = byAvg(r.Ravg);
  }
  if (r.T && r.KQ) r.KK = clampRound(0.6 * r.T + 0.4 * r.KQ);
  if (r.P && r.R) r.AR = clampRound(0.7 * r.P + 0.3 * r.R);
  if (r.M && r.KK && r.AR) {
    r.B = (r.M + r.KK + r.AR) / 3;
    r.level = levelOfB(r.B);
  }
  return r;
}
