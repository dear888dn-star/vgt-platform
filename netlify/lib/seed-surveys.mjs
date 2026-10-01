// Boshlang'ich so'rovnomalar (tadqiqot ilovalari asosida yangilanadi).
// Savol turlari: likert (1–5), single, multi, text, scale (0–10), test (to'g'ri javobli).
// "component" — ilmiy ishdagi kompetentlik komponenti; natijalar shu kesimda jamlanadi.

export const SEED_VERSION = 1;

const LIKERT_LEVELS = [
  { min: 1, max: 2.59, label: "Past" },
  { min: 2.6, max: 3.79, label: "O'rta" },
  { min: 3.8, max: 5, label: "Yuqori" },
];

const COMPETENCE_COMPONENTS = [
  { key: "motiv", title: "Motivatsion-qadriyatli" },
  { key: "cogn", title: "Kognitiv (bilim)" },
  { key: "oper", title: "Operatsion-faoliyatli" },
  { key: "comm", title: "Kommunikativ" },
  { key: "refl", title: "Refleksiv" },
];

const COMPETENCE_ITEMS = [
  ["motiv", "Turizm sohasida raqamli texnologiyalarni o'rganish men uchun muhim."],
  ["motiv", "Kelajakdagi kasbimda raqamli vositalardan faol foydalanishni rejalashtiraman."],
  ["motiv", "Yangi raqamli dastur va ilovalarni mustaqil o'rganishga qiziqaman."],
  ["motiv", "Virtual ekskursiya va trenajyorlar kasbiy tayyorgarligimni oshiradi deb hisoblayman."],
  ["cogn", "GDS, CRS, PMS kabi turizm axborot tizimlarining vazifasini tushuntirib bera olaman."],
  ["cogn", "Onlayn bron qilish (OTA) platformalari qanday ishlashini bilaman."],
  ["cogn", "VR/AR va 360° panorama texnologiyalarining turizmdagi o'rnini bilaman."],
  ["cogn", "Shaxsiy ma'lumotlarni himoya qilish va kiberxavfsizlik qoidalarini bilaman."],
  ["oper", "Onlayn xarita va GIS vositalari yordamida ekskursiya marshrutini tuza olaman."],
  ["oper", "Turistik obyekt uchun raqamli taqdimot yoki virtual tur tayyorlay olaman."],
  ["oper", "Ijtimoiy tarmoqlarda turistik mahsulot uchun kontent yarata olaman."],
  ["oper", "Bron qilish tizimida buyurtma yaratish va o'zgartirishni bajara olaman."],
  ["comm", "Turistlar bilan onlayn kanallar (chat, email, messenjer) orqali professional muloqot qila olaman."],
  ["comm", "Kutilmagan yoki nizoli vaziyatda mijoz bilan xotirjam muloqot qila olaman."],
  ["comm", "Xorijiy turistga raqamli servislar (taksi, to'lov, xarita) haqida tushuntira olaman."],
  ["comm", "Onlayn auditoriya uchun interaktiv ekskursiya o'tkaza olaman."],
  ["refl", "O'z kasbiy faoliyatimdagi xatolarni tahlil qilib, xulosa chiqaraman."],
  ["refl", "Raqamli bilimlarimni qaysi yo'nalishda rivojlantirish kerakligini bilaman."],
  ["refl", "Mashg'ulotdan so'ng o'z natijalarimni mustaqil baholay olaman."],
  ["refl", "Olingan fikr-mulohazalar asosida ish uslubimni o'zgartiraman."],
];

function competenceSurvey(id, stage, title, description) {
  return {
    id,
    title,
    description,
    audience: "student",
    stage,
    active: true,
    order: stage === "pre" ? 1 : 5,
    scoring: { method: "likert", components: COMPETENCE_COMPONENTS, levels: LIKERT_LEVELS },
    questions: [
      ...(stage === "pre"
        ? [
            { id: "d_course", type: "single", text: "Kursingiz", options: ["1-kurs", "2-kurs", "3-kurs"] },
            { id: "d_spec", type: "single", text: "Mutaxassisligingiz", options: ["Gid (ekskursiya yetakchisi)", "Turizm (mehmonxona xo'jaligi)", "Turizm (tur-operatorlik)", "Madaniy meros obyektlari bilan ishlash", "Boshqa"] },
            { id: "d_device", type: "multi", text: "Qaysi qurilmalardan muntazam foydalanasiz?", options: ["Smartfon", "Noutbuk / kompyuter", "Planshet", "VR ko'zoynak"] },
          ]
        : []),
      ...COMPETENCE_ITEMS.map(([component, text], i) => ({ id: `c${i + 1}`, type: "likert", component, text })),
      { id: "open1", type: "text", text: "Raqamli texnologiyalarni o'rganishda sizga eng katta qiyinchilik nima?", optional: true },
    ],
  };
}

const KNOWLEDGE_TEST = [
  ["GDS (Global Distribution System) nima?", ["Mehmonxona ichki boshqaruv tizimi", "Aviachipta, mehmonxona va boshqa xizmatlarni global bron qilish tizimi", "Ijtimoiy tarmoq", "Geografik axborot tizimi"], 1],
  ["Quyidagilardan qaysi biri GDS hisoblanadi?", ["Amadeus", "Instagram", "Canva", "Zoom"], 0],
  ["PMS (Property Management System) qayerda qo'llaniladi?", ["Aeroportda", "Mehmonxonani boshqarishda", "Muzeyda", "Bankda"], 1],
  ["OTA qisqartmasi nimani anglatadi?", ["Online Travel Agency", "Open Tourism Area", "Official Tour Agent", "Online Ticket App"], 0],
  ["To'ldirilgan reallik (AR) nima?", ["To'liq sun'iy virtual muhit", "Real tasvir ustiga raqamli ma'lumot qo'shish", "3D printer texnologiyasi", "Ovozli yordamchi"], 1],
  ["Channel manager vazifasi nima?", ["Xodimlar maoshini hisoblash", "Bir nechta bron kanallaridagi narx va bo'sh xonalarni sinxronlash", "Reklama videolarini montaj qilish", "Turistlarni kutib olish"], 1],
  ["UGC (User Generated Content) turizmda nima?", ["Davlat statistikasi", "Foydalanuvchilar yaratgan sharh, foto va videolar", "Gid litsenziyasi", "Mehmonxona standarti"], 1],
  ["Madaniy merosni 3D raqamlashtirishning asosiy maqsadi:", ["Obyektni buzish", "Obyektni hujjatlashtirish, saqlash va virtual taqdim etish", "Chipta narxini oshirish", "Turistlar sonini cheklash"], 1],
  ["Turistning karta CVV kodini chat orqali so'rash:", ["Odatiy amaliyot", "Xavfsizlik qoidalarini qo'pol buzish", "Faqat xorijiy turistlardan so'raladi", "Faqat bayram kunlari ruxsat etiladi"], 1],
  ["Turizmda chatbotning asosiy afzalligi:", ["24/7 tezkor javob va xizmatni avtomatlashtirish", "Gidlarni butunlay almashtirish", "Narxlarni oshirish", "Internetsiz ishlash"], 0],
  ["SEO nima uchun kerak?", ["Saytni qidiruv tizimlarida yuqori o'ringa chiqarish", "Mehmonxona xonasini tozalash", "Viza olish", "Valyuta ayirboshlash"], 0],
  ["Big Data turizmda nimaga yordam beradi?", ["Turistlar xulq-atvorini tahlil qilib, talabni prognoz qilishga", "Faqat buxgalteriyaga", "Binolarni ta'mirlashga", "Hech narsaga"], 0],
];

function knowledgeTest(id, stage, title) {
  return {
    id,
    title,
    description: "Turizmda raqamli texnologiyalar fani bo'yicha bilim darajasini aniqlovchi test. Har bir savolda bitta to'g'ri javob bor.",
    audience: "student",
    stage,
    active: true,
    order: stage === "pre" ? 2 : 6,
    scoring: { method: "test", levels: [{ min: 0, max: 54.9, label: "Past" }, { min: 55, max: 79.9, label: "O'rta" }, { min: 80, max: 100, label: "Yuqori" }] },
    questions: KNOWLEDGE_TEST.map(([text, options, correct], i) => ({ id: `t${i + 1}`, type: "test", text, options, correct })),
  };
}

export const SEED_SURVEYS = [
  competenceSurvey(
    "competence-pre",
    "pre",
    "Raqamli kasbiy kompetentlik (diagnostik bosqich)",
    "Tajriba-sinov ishlari boshida o'tkaziladi. Har bir fikrga qanchalik qo'shilishingizni 1 dan 5 gacha baholang (1 — mutlaqo qo'shilmayman, 5 — to'liq qo'shilaman). Javoblaringiz faqat ilmiy maqsadlarda umumlashtirilgan holda foydalaniladi."
  ),
  knowledgeTest("knowledge-pre", "pre", "Bilim testi (kirish nazorati)"),
  {
    id: "motivation",
    title: "O'quv motivatsiyasi va kasbga munosabat",
    description: "Kasbiy tanlovingiz va o'qishga bo'lgan munosabatingizni aniqlash uchun so'rovnoma.",
    audience: "student",
    stage: "any",
    active: true,
    order: 3,
    scoring: { method: "likert", components: [{ key: "int", title: "Ichki motivatsiya" }, { key: "ext", title: "Tashqi motivatsiya" }], levels: LIKERT_LEVELS },
    questions: [
      { id: "m1", type: "single", text: "Turizm mutaxassisligini tanlashingizga asosiy sabab nima?", options: ["O'zim qiziqaman", "Ota-onam maslahati", "Yaxshi daromad istiqboli", "Do'stlarim ta'siri", "Tasodifan"] },
      { id: "m2", type: "likert", component: "int", text: "Darslarda yangi narsalarni o'rganish menga zavq beradi." },
      { id: "m3", type: "likert", component: "int", text: "Darsdan tashqari vaqtda ham turizmga oid ma'lumotlarni qidiraman." },
      { id: "m4", type: "likert", component: "int", text: "Gid bo'lib ishlashni tasavvur qilsam, ilhomlanaman." },
      { id: "m5", type: "likert", component: "ext", text: "Men asosan yaxshi baho olish uchun o'qiyman." },
      { id: "m6", type: "likert", component: "ext", text: "O'qituvchi talab qilgani uchun topshiriqlarni bajaraman." },
      { id: "m7", type: "likert", component: "int", text: "Interaktiv va o'yin elementli darslar o'qishga qiziqishimni oshiradi." },
      { id: "m8", type: "multi", text: "Qaysi ta'lim shakllari sizga ko'proq yoqadi?", options: ["Ma'ruza", "Amaliy mashg'ulot", "Virtual ekskursiya", "Trenajyor / simulyatsiya", "Guruhda ishlash", "Mustaqil onlayn o'qish", "Ekskursiyaga chiqish"] },
      { id: "m9", type: "scale", text: "Kelajakda turizm sohasida ishlash ehtimolingizni 0 dan 10 gacha baholang." },
    ],
  },
  {
    id: "trainer-usability",
    title: "Virtual gidlik trenajyorini baholash",
    description: "Trenajyordan kamida bir marta foydalangandan so'ng to'ldiriladi. Birinchi 10 ta savol xalqaro SUS (System Usability Scale) metodikasiga asoslangan.",
    audience: "student",
    stage: "post",
    active: true,
    order: 4,
    scoring: { method: "sus", susItems: ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10"], components: [{ key: "value", title: "Kasbiy foydalilik" }], levels: LIKERT_LEVELS },
    questions: [
      { id: "u1", type: "likert", text: "Men bu trenajyordan tez-tez foydalanishni xohlardim." },
      { id: "u2", type: "likert", text: "Trenajyor keragidan ortiq murakkab deb o'ylayman." },
      { id: "u3", type: "likert", text: "Trenajyordan foydalanish oson edi." },
      { id: "u4", type: "likert", text: "Foydalanish uchun texnik mutaxassis yordami kerak bo'ladi deb o'ylayman." },
      { id: "u5", type: "likert", text: "Trenajyorning turli qismlari yaxshi uyg'unlashgan." },
      { id: "u6", type: "likert", text: "Trenajyorda nomuvofiqliklar juda ko'p." },
      { id: "u7", type: "likert", text: "Ko'pchilik bu trenajyordan foydalanishni tez o'rganib oladi deb o'ylayman." },
      { id: "u8", type: "likert", text: "Trenajyordan foydalanish juda noqulay edi." },
      { id: "u9", type: "likert", text: "Trenajyordan foydalanishda o'zimni ishonchli his qildim." },
      { id: "u10", type: "likert", text: "Ishlashni boshlashdan oldin ko'p narsani o'rganishim kerak bo'ldi." },
      { id: "v1", type: "likert", component: "value", text: "Trenajyor vaziyatlari real kasbiy vaziyatlarga yaqin." },
      { id: "v2", type: "likert", component: "value", text: "AI baholashi va tavsiyalari menga foydali bo'ldi." },
      { id: "v3", type: "likert", component: "value", text: "Trenajyor muloqot va muammoni hal qilish ko'nikmalarimni rivojlantirdi." },
      { id: "v4", type: "likert", component: "value", text: "Real turistlar bilan ishlashga o'zimni tayyorroq his qilyapman." },
      { id: "v5", type: "single", text: "Qaysi ssenariy sizga eng foydali bo'ldi?", options: ["Ekskursiya o'tkazish", "Favqulodda vaziyatlar", "Mijozlarga xizmat (shikoyatlar)", "Raqamli xizmatlar va onlayn to'lov", "Xorijiy turist bilan muloqot", "Virtual/onlayn ekskursiya"] },
      { id: "v6", type: "text", text: "Trenajyorni yaxshilash bo'yicha takliflaringiz:", optional: true },
    ],
  },
  competenceSurvey(
    "competence-post",
    "post",
    "Raqamli kasbiy kompetentlik (yakuniy bosqich)",
    "Tajriba-sinov ishlari yakunida o'tkaziladi. Diagnostik bosqichdagi savollar bilan bir xil — natijalar solishtiriladi. Har bir fikrga 1 dan 5 gacha baho bering."
  ),
  knowledgeTest("knowledge-post", "post", "Bilim testi (yakuniy nazorat)"),
  {
    id: "platform-satisfaction",
    title: "Ta'lim platformasidan qoniqish",
    description: "Platformadagi mavzular, interaktiv metodlar va mustaqil ta'lim imkoniyatlari haqidagi fikringiz.",
    audience: "student",
    stage: "post",
    active: true,
    order: 7,
    scoring: { method: "likert", components: [{ key: "content", title: "Mazmun" }, { key: "method", title: "Metodika" }, { key: "self", title: "Mustaqil ta'lim" }], levels: LIKERT_LEVELS },
    questions: [
      { id: "p1", type: "likert", component: "content", text: "Mavzular tushunarli va tizimli bayon qilingan." },
      { id: "p2", type: "likert", component: "content", text: "Mavzular bo'lajak kasbim uchun dolzarb." },
      { id: "p3", type: "likert", component: "method", text: "Interaktiv metodlar (klaster, keys, Venn diagrammasi va b.) mavzuni o'zlashtirishga yordam berdi." },
      { id: "p4", type: "likert", component: "method", text: "Testlar va flesh-kartalar bilimimni mustahkamladi." },
      { id: "p5", type: "likert", component: "self", text: "Platforma mustaqil ta'limni rejalashtirishga yordam berdi." },
      { id: "p6", type: "likert", component: "self", text: "Mustaqil ish topshiriqlari va o'qituvchi fikri foydali bo'ldi." },
      { id: "p7", type: "scale", text: "Platformani do'stlaringizga tavsiya qilish ehtimolingiz (0–10)?" },
      { id: "p8", type: "text", text: "Platformaga qo'shilishi kerak bo'lgan imkoniyatlar:", optional: true },
    ],
  },
  {
    id: "expert-teachers",
    title: "Ekspert so'rovnomasi (o'qituvchilar uchun)",
    description: "Turizm va madaniy meros texnikumlari o'qituvchilari uchun: platforma va virtual gidlik trenajyorining pedagogik samaradorligini ekspert baholash.",
    audience: "teacher",
    stage: "any",
    active: true,
    order: 8,
    scoring: { method: "likert", components: [{ key: "ped", title: "Pedagogik maqsadga muvofiqlik" }, { key: "tech", title: "Texnologik sifat" }, { key: "prof", title: "Kasbiy yo'naltirilganlik" }], levels: LIKERT_LEVELS },
    questions: [
      { id: "e0", type: "single", text: "Pedagogik ish stajingiz", options: ["5 yilgacha", "5–10 yil", "10–20 yil", "20 yildan ortiq"] },
      { id: "e1", type: "likert", component: "ped", text: "Platforma mazmuni fan dasturi va o'quv qo'llanmaga mos keladi." },
      { id: "e2", type: "likert", component: "ped", text: "Interaktiv metodlar o'quvchilar faolligini oshiradi." },
      { id: "e3", type: "likert", component: "ped", text: "Mustaqil ta'lim tizimi o'quvchining individual rivojlanish trayektoriyasini ta'minlaydi." },
      { id: "e4", type: "likert", component: "tech", text: "Platforma interfeysi qulay va tushunarli." },
      { id: "e5", type: "likert", component: "tech", text: "Natijalarni yig'ish va tahlil qilish vositalari yetarli." },
      { id: "e6", type: "likert", component: "prof", text: "Trenajyor ssenariylari real kasbiy faoliyatni aks ettiradi." },
      { id: "e7", type: "likert", component: "prof", text: "AI asosidagi trenajyor kasbiy kompetentlikni shakllantirishda samarali vosita." },
      { id: "e8", type: "likert", component: "prof", text: "Platformani boshqa texnikumlarda joriy etishni tavsiya qilaman." },
      { id: "e9", type: "text", text: "Ekspert sifatidagi taklif va mulohazalaringiz:", optional: true },
    ],
  },
];
