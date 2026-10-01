// So'rovnomalar (anketalar) to'plami.
// DIQQAT: bu boshlang'ich (namuna) anketalar. Ilmiy ish ilovalari taqdim etilgach, savollar ularga moslab yangilanadi
// yoki o'qituvchi panelidagi "So'rovnoma konstruktori" orqali tahrirlanadi.
//
// Savol turlari: likert | single | multiple | scale | text | number | matrix
// dimension — natijalarni komponentlar (yo'nalishlar) bo'yicha indekslash uchun; reverse — teskari ball.

const L5 = ['Mutlaqo qo\'shilmayman', 'Qo\'shilmayman', 'Betarafman', 'Qo\'shilaman', 'To\'liq qo\'shilaman'];
const LEVEL5 = ['Umuman bilmayman', 'Juda kam', 'O\'rtacha', 'Yaxshi', 'A\'lo darajada'];

// Raqamli kasbiy kompetensiya komponentlari (kirish va yakuniy diagnostikada bir xil — taqqoslash uchun)
const competencyBlocks = [
  {
    id: 'm1', type: 'matrix', section: 'I. Motivatsion-qadriyatli komponent', dimension: 'Motivatsion komponent', columns: L5,
    text: 'Quyidagi fikrlarga munosabatingizni bildiring',
    rows: [
      'Turizm sohasida raqamli texnologiyalarni bilish kelajakdagi kasbim uchun juda muhim.',
      'Yangi raqamli vositalarni (ilovalar, platformalar) o\'rganishga qiziqaman.',
      'Virtual ekskursiyalar va onlayn turlar real sayohatni to\'ldiradi deb hisoblayman.',
      'Raqamli ko\'nikmalarimni mustaqil ravishda rivojlantirishga tayyorman.',
      'Sun\'iy intellekt vositalari gid ishini yengillashtiradi deb o\'ylayman.',
    ],
  },
  {
    id: 'k1', type: 'matrix', section: 'II. Kognitiv (bilim) komponent', dimension: 'Kognitiv komponent', columns: LEVEL5,
    text: 'Quyidagi tushunchalar bo\'yicha bilimingizni baholang',
    rows: [
      'Global distribyutsiya tizimlari (GDS: Amadeus, Sabre, Galileo)',
      'Onlayn bron platformalari (Booking.com, Airbnb, Tripadvisor va h.k.)',
      'Mehmonxona boshqaruv tizimlari (PMS)',
      'Virtual va to\'ldirilgan reallik (VR/AR) texnologiyalari',
      'Raqamli marketing va ijtimoiy tarmoqlarda turistik mahsulotni targ\'ib qilish (SMM)',
      'Madaniy merosni raqamlashtirish (3D-modellar, 360° panoramalar)',
      'Shaxsiy ma\'lumotlar himoyasi va kiberxavfsizlik asoslari',
    ],
  },
  {
    id: 'f1', type: 'matrix', section: 'III. Faoliyatli (amaliy-texnologik) komponent', dimension: 'Faoliyatli komponent', columns: LEVEL5,
    text: 'Quyidagi amallarni qay darajada bajara olasiz?',
    rows: [
      'Onlayn xarita va navigatsiya ilovalari yordamida turistik marshrut tuzish',
      'Mehmonxona yoki aviachiptani onlayn bron qilish',
      'Tarjimon ilovalar orqali xorijiy turist bilan muloqot qilish',
      'Virtual (onlayn) ekskursiya tayyorlash va o\'tkazish',
      'Turistik obyekt uchun QR-kod yoki audio-gid tayyorlash',
      'Ijtimoiy tarmoqda turistik mahsulot uchun post/video tayyorlash',
      'Sun\'iy intellekt vositalari (chat-botlar) dan kasbiy maqsadda foydalanish',
    ],
  },
  {
    id: 'r1', type: 'matrix', section: 'IV. Refleksiv komponent', dimension: 'Refleksiv komponent', columns: L5,
    text: 'O\'z faoliyatingizni baholang',
    rows: [
      'Men raqamli vositalardan foydalanishdagi xatolarimni tahlil qila olaman.',
      'Muammoli vaziyatda qanday raqamli vosita yordam berishini tez aniqlay olaman.',
      'Kasbiy faoliyatimdagi kuchli va zaif tomonlarimni bilaman.',
      'Real turistlar bilan ishlashga o\'zimni tayyor his qilaman.',
    ],
  },
];

const surveys = [
  {
    slug: 'kirish-diagnostika',
    title: '1-ilova. Raqamli kasbiy kompetensiyani aniqlash — kirish (diagnostik) so\'rovnomasi',
    description: 'Tajriba-sinov ishidan oldin o\'quvchilarning raqamli kasbiy kompetensiyasi darajasini aniqlash uchun. Javoblaringiz faqat ilmiy maqsadda umumlashtirilgan holda foydalaniladi.',
    kind: 'pre',
    audience: 'student',
    pair_slug: 'yakuniy-diagnostika',
    questions: [
      { id: 'q1', type: 'single', section: 'Umumiy ma\'lumotlar', text: 'Jinsingiz', options: ['Erkak', 'Ayol'] },
      { id: 'q2', type: 'single', text: 'Ta\'lim yo\'nalishingiz', options: ['Turizm', 'Mehmonxona xo\'jaligi', 'Ekskursiya ishi (gid)', 'Madaniy meros obyektlarini muhofaza qilish', 'Boshqa'] },
      { id: 'q3', type: 'single', text: 'Turizm sohasida amaliy tajribangiz bormi?', options: ['Yo\'q', 'Faqat o\'quv amaliyoti', '1 yilgacha ishlaganman', '1 yildan ortiq'] },
      { id: 'q4', type: 'multiple', text: 'Qaysi qurilmalardan muntazam foydalanasiz?', options: ['Smartfon', 'Noutbuk/kompyuter', 'Planshet', 'VR ko\'zoynak'] },
      ...competencyBlocks,
      { id: 'q5', type: 'multiple', section: 'Qo\'shimcha', text: 'Qaysi raqamli vositalarni o\'rganishni xohlaysiz?', options: ['VR/AR', 'Onlayn bron tizimlari', 'SMM va raqamli marketing', 'Sun\'iy intellekt', 'Virtual ekskursiya yaratish', 'Video montaj', 'Xorijiy tilda muloqot ilovalari'] },
      { id: 'q6', type: 'text', required: false, text: 'Raqamli texnologiyalarni o\'rganishda qanday qiyinchiliklarga duch kelasiz?' },
    ],
  },
  {
    slug: 'yakuniy-diagnostika',
    title: '2-ilova. Raqamli kasbiy kompetensiyani aniqlash — yakuniy so\'rovnoma',
    description: 'Tajriba-sinov ishidan keyin o\'quvchilarning raqamli kasbiy kompetensiyasidagi o\'zgarishni aniqlash uchun (kirish so\'rovnomasi bilan taqqoslanadi).',
    kind: 'post',
    audience: 'student',
    questions: [
      ...competencyBlocks,
      { id: 'p1', type: 'scale', section: 'Qo\'shimcha', min: 1, max: 10, text: 'Platformadagi mashg\'ulotlar kasbiy tayyorgarligingizni qanchalik oshirdi? (1 — umuman, 10 — juda katta)' },
      { id: 'p2', type: 'multiple', text: 'Platformaning qaysi bo\'limlari sizga eng foydali bo\'ldi?', options: ['Interaktiv mavzular', 'Interaktiv metodlar (klaster, Venn, insert...)', 'Testlar', 'Virtual gidlik trenajyori', 'Mustaqil ta\'lim topshiriqlari', 'Glossariy'] },
      { id: 'p3', type: 'text', required: false, text: 'Platforma va trenajyorni takomillashtirish bo\'yicha takliflaringiz' },
    ],
  },
  {
    slug: 'trenajyor-samaradorlik',
    title: '3-ilova. Virtual gidlik trenajyorining samaradorligini baholash anketasi',
    description: 'Trenajyorda kamida 3 ta ssenariydan o\'tgandan so\'ng to\'ldiriladi.',
    kind: 'trainer',
    audience: 'student',
    questions: [
      {
        id: 't1', type: 'matrix', section: 'Trenajyor haqida fikringiz', columns: L5, text: 'Fikrlarga munosabatingiz',
        rows: [
          { text: 'Trenajyordagi vaziyatlar real hayotga yaqin.', dimension: 'Realistiklik' },
          { text: 'Sun\'iy intellekt turist rolini ishonarli o\'ynadi.', dimension: 'Realistiklik' },
          { text: 'Kutilmagan vaziyatlar meni tez qaror qabul qilishga o\'rgatdi.', dimension: 'Foydalilik' },
          { text: 'Trenajyor kasbiy muloqot ko\'nikmalarimni rivojlantirdi.', dimension: 'Foydalilik' },
          { text: 'Yakuniy baholash va tavsiyalar menga foydali bo\'ldi.', dimension: 'Foydalilik' },
          { text: 'Trenajyordan foydalanish oson va tushunarli.', dimension: 'Foydalanish qulayligi' },
          { text: 'Interfeys (chat, taymer, kayfiyat ko\'rsatkichi) qulay.', dimension: 'Foydalanish qulayligi' },
          { text: 'Trenajyorda qayta-qayta mashq qilish istagi paydo bo\'ldi.', dimension: 'Motivatsiya' },
          { text: 'Trenajyor real turistlar bilan ishlashdagi xavotirimni kamaytirdi.', dimension: 'Motivatsiya' },
        ],
      },
      { id: 't2', type: 'single', text: 'Trenajyordagi eng qiyin ssenariy qaysi bo\'ldi?', options: ['Registon ekskursiyasi', 'Overbooking', 'Jazirama issiq', 'Virtual tur', 'Til to\'sig\'i', 'Madaniy odob', 'Ob-havo / marshrut', 'VIP mijoz', 'Pasport yo\'qolishi', 'Ekoturizm'] },
      { id: 't3', type: 'scale', min: 1, max: 10, text: 'Trenajyorni umumiy baholang (1–10)', dimension: null },
      { id: 't4', type: 'text', required: false, text: 'Qanday yangi vaziyatlar (ssenariylar) qo\'shilishini xohlaysiz?' },
    ],
  },
  {
    slug: 'platforma-sus',
    title: '4-ilova. Platformadan foydalanish qulayligi (SUS shkalasi)',
    description: 'System Usability Scale (SUS) asosidagi standart so\'rovnoma.',
    kind: 'feedback',
    audience: 'all',
    questions: [
      {
        id: 's1', type: 'matrix', columns: L5, dimension: 'SUS (foydalanish qulayligi)', text: 'Platforma haqidagi fikrlaringiz',
        rows: [
          { text: 'Bu platformadan tez-tez foydalanishni xohlayman.' },
          { text: 'Platforma keraksiz darajada murakkab.', reverse: true },
          { text: 'Platformadan foydalanish oson.' },
          { text: 'Platformadan foydalanish uchun texnik yordam kerak bo\'ladi.', reverse: true },
          { text: 'Platformaning turli bo\'limlari yaxshi uyg\'unlashgan.' },
          { text: 'Platformada nomuvofiqliklar ko\'p.', reverse: true },
          { text: 'Ko\'pchilik bu platformani tez o\'rganib oladi deb o\'ylayman.' },
          { text: 'Platformadan foydalanish noqulay.', reverse: true },
          { text: 'Platformadan foydalanishda o\'zimni ishonchli his qildim.' },
          { text: 'Platformadan foydalanishdan oldin ko\'p narsani o\'rganishim kerak bo\'ldi.', reverse: true },
        ],
      },
    ],
  },
  {
    slug: 'oqituvchi-ekspert',
    title: '5-ilova. O\'qituvchilar uchun ekspert baholash anketasi',
    description: 'Maxsus fan o\'qituvchilari va soha mutaxassislari platforma hamda trenajyorni ekspert sifatida baholaydi.',
    kind: 'expert',
    audience: 'teacher',
    questions: [
      { id: 'e0', type: 'number', section: 'Ekspert haqida', text: 'Pedagogik ish stajingiz (yil)' },
      {
        id: 'e1', type: 'matrix', section: 'Ekspert baholash', columns: ['1 — juda past', '2 — past', '3 — o\'rta', '4 — yuqori', '5 — juda yuqori'], text: 'Mezonlar bo\'yicha baholang',
        rows: [
          { text: 'O\'quv mazmunining DTS va o\'quv dasturiga mosligi', dimension: 'Mazmun sifati' },
          { text: 'Mavzular mazmunining ilmiyligi va dolzarbligi', dimension: 'Mazmun sifati' },
          { text: 'Interaktiv metodlarning xilma-xilligi va maqsadga mosligi', dimension: 'Metodik sifat' },
          { text: 'Mustaqil ta\'limni tashkil etish imkoniyatlari', dimension: 'Metodik sifat' },
          { text: 'Trenajyor ssenariylarining kasbiy faoliyatga mosligi', dimension: 'Trenajyor sifati' },
          { text: 'Trenajyordagi baholash mezonlarining asoslanganligi', dimension: 'Trenajyor sifati' },
          { text: 'Platformaning texnik qulayligi', dimension: 'Texnik sifat' },
          { text: 'Natijalarni monitoring qilish imkoniyatlari', dimension: 'Texnik sifat' },
        ],
      },
      { id: 'e2', type: 'text', required: false, text: 'Takliflar va mulohazalar' },
    ],
  },
];

module.exports = { surveys };
