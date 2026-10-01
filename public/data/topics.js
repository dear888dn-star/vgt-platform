// "Turizmda raqamli texnologiyalar" fani mavzulari.
// Har bir mavzu: maqsad, reja, nazariy qism (sections), tayanch tushunchalar (glossary),
// interaktiv metodlar (methods), test (quiz) va mustaqil ta'lim topshiriqlari (selfStudy).
// O'quv qo'llanma matni taqdim etilganda shu fayldagi mazmun yangilanadi.

export const COURSE = {
  title: "Turizmda raqamli texnologiyalar",
  audience: "Turizm va madaniy meros texnikumlari o'quvchilari uchun",
  description:
    "Fan bo'lajak gid, tur-menejer va turizm mutaxassislarini raqamli kasbiy faoliyatga tayyorlaydi: turizm axborot tizimlari, onlayn bron qilish, raqamli marketing, VR/AR va virtual ekskursiyalar, sun'iy intellekt, madaniy merosni raqamlashtirish va raqamli xavfsizlik.",
};

export const TOPICS = [
  {
    id: "t1",
    num: 1,
    title: "Turizmda raqamli transformatsiya: mohiyati va rivojlanish tendensiyalari",
    icon: "🌐",
    hours: 4,
    goal: "Turizm sohasidagi raqamli transformatsiya tushunchasi, uning bosqichlari va O'zbekistonda raqamli turizmni rivojlantirish yo'nalishlari bilan tanishtirish.",
    plan: [
      "Raqamli texnologiyalar va raqamli transformatsiya tushunchasi",
      "Turizm rivojlanishining raqamli bosqichlari (e-Tourism, Smart Tourism, Turizm 4.0)",
      "Raqamli turist va uning sayohat sikli",
      "O'zbekistonda raqamli turizmni rivojlantirish yo'nalishlari",
    ],
    sections: [
      {
        title: "1. Raqamli transformatsiya tushunchasi",
        html: `<p><b>Raqamli texnologiyalar</b> — axborotni raqamli shaklda yig'ish, saqlash, qayta ishlash va uzatish imkonini beruvchi vositalar majmui: internet, mobil qurilmalar, bulutli xizmatlar, sun'iy intellekt, katta ma'lumotlar (Big Data), virtual va to'ldirilgan reallik.</p>
<p><b>Raqamli transformatsiya</b> — tashkilot faoliyatining barcha jarayonlarini (xizmat ko'rsatish, marketing, boshqaruv, mijoz bilan aloqa) raqamli texnologiyalar asosida tubdan qayta qurish. Bu shunchaki kompyuter o'rnatish emas, balki <i>biznes-modelning</i> o'zgarishidir: masalan, an'anaviy tur-agentlik ofisidan onlayn platformaga o'tish.</p>
<div class="callout">💡 Raqamlashtirishning uch darajasi: <b>digitization</b> (qog'oz hujjatni raqamli shaklga o'tkazish) → <b>digitalization</b> (jarayonlarni raqamli vositalar bilan avtomatlashtirish) → <b>digital transformation</b> (yangi raqamli biznes-model).</div>`,
      },
      {
        title: "2. Turizmning raqamli rivojlanish bosqichlari",
        html: `<ul>
<li><b>1950–1970-yillar:</b> aviakompaniyalarning kompyuterlashtirilgan bron tizimlari (CRS) — SABRE (1960).</li>
<li><b>1980–1990-yillar:</b> global distributsiya tizimlari (GDS) — Amadeus, Galileo, Worldspan.</li>
<li><b>1995–2005-yillar:</b> <b>e-Tourism</b> — internet, onlayn tur-agentliklar (Expedia 1996, Booking.com 1996).</li>
<li><b>2007–2015-yillar:</b> mobil va ijtimoiy turizm — smartfonlar, TripAdvisor, Instagram, mobil ilovalar.</li>
<li><b>2015-yildan hozirgacha:</b> <b>Smart Tourism / Turizm 4.0</b> — sun'iy intellekt, IoT, Big Data, VR/AR, kontaktsiz xizmatlar, raqamli egizaklar.</li>
</ul>`,
      },
      {
        title: "3. Raqamli turist va sayohat sikli",
        html: `<p>Zamonaviy turist sayohatning har bir bosqichida raqamli vositalardan foydalanadi:</p>
<ol>
<li><b>Ilhomlanish (Dreaming):</b> Instagram, YouTube, bloglar, virtual turlar.</li>
<li><b>Rejalashtirish (Planning):</b> qidiruv tizimlari, onlayn xaritalar, sharhlar.</li>
<li><b>Bron qilish (Booking):</b> OTA platformalari, mehmonxona saytlari, elektron chiptalar.</li>
<li><b>Sayohat (Experiencing):</b> mobil ilovalar, audiogidlar, QR-kodlar, onlayn to'lov.</li>
<li><b>Ulashish (Sharing):</b> sharhlar, foto va videolar (UGC).</li>
</ol>
<p>Gid va turizm mutaxassisi har bir bosqichda turistga raqamli yordam bera olishi kerak — bu <b>raqamli kasbiy kompetentlik</b>ning asosidir.</p>`,
      },
      {
        title: "4. O'zbekistonda raqamli turizm",
        html: `<p>O'zbekistonda turizmni rivojlantirish va "Raqamli O'zbekiston — 2030" strategiyasi doirasida quyidagi yo'nalishlar amalga oshirilmoqda: <b>elektron viza (e-visa.gov.uz)</b> tizimi, mehmonxonalarda turistlarni onlayn ro'yxatga olish tizimi (<b>E-mehmon</b>), milliy turizm portali (<b>uzbekistan.travel</b>), muzey va tarixiy obyektlarda QR-audiogidlar, onlayn chipta xizmatlari, virtual muzeylar.</p>
<div class="callout">🎯 Muhokama savoli: Sizning shahringizdagi qaysi turistik obyektda raqamli xizmatlar yetishmaydi?</div>`,
      },
    ],
    glossary: [
      { term: "Raqamli transformatsiya", def: "Faoliyatni raqamli texnologiyalar asosida tubdan qayta qurish, yangi biznes-modelga o'tish." },
      { term: "e-Tourism", def: "Turizm xizmatlarini internet va axborot texnologiyalari orqali taqdim etish." },
      { term: "Smart Tourism", def: "Sun'iy intellekt, IoT va Big Data asosida turistga shaxsiylashtirilgan, \"aqlli\" xizmat ko'rsatish." },
      { term: "Turizm 4.0", def: "To'rtinchi sanoat inqilobi texnologiyalarining turizmga tatbiq etilishi." },
      { term: "Raqamli turist", def: "Sayohatning barcha bosqichlarida raqamli vositalardan faol foydalanuvchi turist." },
      { term: "E-mehmon", def: "O'zbekistonda xorijiy fuqarolarni joylashtirish vositalarida onlayn ro'yxatga olish tizimi." },
    ],
    methods: [
      {
        type: "brainstorm",
        id: "t1-bs",
        title: "Aqliy hujum",
        instruction: "Turist sayohat davomida qanday raqamli vositalardan foydalanadi? Imkon qadar ko'p g'oya yozing (har bir g'oyani alohida qo'shing).",
        minIdeas: 6,
        examples: ["Onlayn xarita", "Elektron viza", "Mobil to'lov", "Audiogid", "Tarjimon ilova", "Taksi ilovasi"],
      },
      {
        type: "ordering",
        id: "t1-order",
        title: "Xronologik ketma-ketlik",
        instruction: "Turizmdagi raqamli texnologiyalarni paydo bo'lish tartibida joylashtiring.",
        items: ["CRS (SABRE)", "GDS (Amadeus, Galileo)", "Onlayn tur-agentliklar (Expedia, Booking)", "Ijtimoiy tarmoqlar va mobil ilovalar", "Sun'iy intellekt va Smart Tourism"],
      },
      {
        type: "matching",
        id: "t1-match",
        title: "Moslashtirish",
        instruction: "Sayohat bosqichini unga mos raqamli vosita bilan moslang.",
        pairs: [
          ["Ilhomlanish", "Instagram va virtual turlar"],
          ["Rejalashtirish", "Onlayn xaritalar va sharhlar"],
          ["Bron qilish", "OTA platformasi"],
          ["Sayohat", "QR-audiogid"],
          ["Ulashish", "TripAdvisor'da sharh yozish"],
        ],
      },
    ],
    quiz: [
      { q: "Raqamli transformatsiya nima?", options: ["Kompyuter sotib olish", "Faoliyatni raqamli texnologiyalar asosida tubdan qayta qurish", "Saytga rasm joylash", "Internet tezligini oshirish"], correct: 1, explain: "Transformatsiya — biznes-model va jarayonlarning tubdan o'zgarishi." },
      { q: "Birinchi kompyuterlashtirilgan aviabron tizimi:", options: ["Booking", "SABRE", "Instagram", "Airbnb"], correct: 1, explain: "SABRE 1960-yilda American Airlines uchun yaratilgan." },
      { q: "Sayohat siklining \"Sharing\" bosqichi nimani anglatadi?", options: ["Chipta sotib olish", "Taassurotlarni sharh va fotolar orqali ulashish", "Viza olish", "Mehmonxona tanlash"], correct: 1 },
      { q: "O'zbekistonda elektron viza qaysi portal orqali olinadi?", options: ["e-visa.gov.uz", "booking.com", "my.gov.uz/hotel", "uzbekistan.travel/visa-shop"], correct: 0 },
      { q: "Smart Tourism asosida qaysi texnologiyalar yotadi?", options: ["Faqat telefon", "Sun'iy intellekt, IoT, Big Data", "Faks va pochta", "Qog'oz xarita"], correct: 1 },
    ],
    selfStudy: [
      { id: "t1-s1", title: "Esse: \"Raqamli turist — kim u?\"", type: "Esse", description: "O'zingiz yoki tanishingizning so'nggi sayohatini sayohat siklining 5 bosqichi bo'yicha tahlil qiling: har bir bosqichda qanday raqamli vositalar ishlatilgan? (1–2 sahifa)" },
      { id: "t1-s2", title: "Raqamli xizmatlar xaritasi", type: "Amaliy ish", description: "O'z shahringizdagi 3 ta turistik obyekt uchun mavjud raqamli xizmatlarni (sayt, QR, onlayn chipta, virtual tur) aniqlang va jadval ko'rinishida taqdim eting." },
    ],
    resources: [
      { title: "O'zbekiston milliy turizm portali", url: "https://uzbekistan.travel" },
      { title: "Elektron viza portali", url: "https://e-visa.gov.uz" },
      { title: "UN Tourism (BMT Butunjahon turizm tashkiloti)", url: "https://www.untourism.int" },
    ],
  },
  {
    id: "t2",
    num: 2,
    title: "Turizmda axborot tizimlari: CRS, GDS va PMS",
    icon: "🗄️",
    hours: 4,
    goal: "Turizm korxonalarida qo'llaniladigan axborot tizimlarining turlari, vazifalari va ish tamoyillarini o'rganish.",
    plan: ["Axborot tizimi tushunchasi va tarkibi", "Markazlashgan bron tizimlari (CRS)", "Global distributsiya tizimlari (GDS)", "Mehmonxonani boshqarish tizimlari (PMS)", "Tur-operator dasturlari"],
    sections: [
      {
        title: "1. Axborot tizimi tushunchasi",
        html: `<p><b>Axborot tizimi</b> — axborotni yig'ish, saqlash, qayta ishlash va foydalanuvchiga taqdim etish uchun mo'ljallangan apparat, dasturiy ta'minot, ma'lumotlar bazasi va odamlar majmui. Turizmda axborot tizimlari bron qilish, narxlarni boshqarish, mijozlar bazasini yuritish va hisobotlarni tayyorlash uchun ishlatiladi.</p>
<p><b>Ma'lumotlar bazasi</b> — tartiblangan ma'lumotlar to'plami (masalan: mehmonlar, xonalar, bronlar jadvallari).</p>`,
      },
      {
        title: "2. CRS — Computer Reservation System",
        html: `<p><b>CRS</b> — bitta kompaniya (aviakompaniya, mehmonxona tarmog'i) xizmatlarini bron qilish tizimi. Masalan, <i>Uzbekistan Airways</i> chiptalarini sotish tizimi yoki mehmonxonalar tarmog'ining markaziy bron tizimi.</p>`,
      },
      {
        title: "3. GDS — Global Distribution System",
        html: `<p><b>GDS</b> — ko'plab aviakompaniyalar, mehmonxonalar, avtomobil ijarasi va boshqa xizmatlarni yagona tarmoqqa birlashtirgan global bron tizimi. Dunyodagi asosiy GDSlar: <b>Amadeus</b> (Ispaniya), <b>Sabre</b> (AQSh), <b>Travelport</b> (Galileo, Worldspan).</p>
<p>Tur-agent GDS terminali orqali bir necha soniyada turli aviakompaniyalar reyslarini solishtirib, chipta bron qilishi mumkin. Bron natijasida <b>PNR</b> (Passenger Name Record) — yo'lovchi bron yozuvi yaratiladi.</p>`,
      },
      {
        title: "4. PMS — Property Management System",
        html: `<p><b>PMS</b> — mehmonxonaning ichki boshqaruv tizimi: xonalar fondi, mehmonlarni joylashtirish (check-in/check-out), to'lovlar, xonalarni tozalash (housekeeping) va hisobotlar. Mashhur PMSlar: <b>Opera (Oracle)</b>, <b>Fidelio</b>, <b>Cloudbeds</b>, <b>Shelter</b>.</p>
<p>PMS <b>channel manager</b> orqali OTA platformalari (Booking.com, Expedia) bilan sinxronlashadi. Sinxronizatsiya buzilsa — <b>overbooking</b> (bitta xonaning ikki marta sotilishi) yuzaga keladi. <span class="tag">Trenajyor: "Mehmonxonada overbooking" ssenariysi</span></p>`,
      },
      {
        title: "5. Tur-operator dasturlari",
        html: `<p>Tur-operatorlar tur-paketlarni shakllantirish, narx kalkulyatsiyasi, hamkorlar va agentlar bilan ishlash uchun maxsus dasturlardan foydalanadi (masalan, <b>Samo-Tour</b>, <b>Master-Tour</b>, <b>TourPlan</b>). Ular CRM, buxgalteriya va onlayn bron moduli bilan integratsiyalashgan bo'ladi.</p>`,
      },
    ],
    glossary: [
      { term: "CRS", def: "Computer Reservation System — bitta kompaniya xizmatlarini kompyuterlashtirilgan bron qilish tizimi." },
      { term: "GDS", def: "Global Distribution System — aviachipta, mehmonxona va boshqa xizmatlarni global bron qilish tarmog'i (Amadeus, Sabre, Travelport)." },
      { term: "PMS", def: "Property Management System — mehmonxonani boshqarish tizimi." },
      { term: "PNR", def: "Passenger Name Record — yo'lovchining GDS tizimidagi bron yozuvi." },
      { term: "Channel manager", def: "Bir nechta onlayn sotuv kanallarida narx va bo'sh xonalarni avtomatik sinxronlovchi dastur." },
      { term: "Overbooking", def: "Mavjud xonalar/o'rinlardan ko'proq bron qabul qilinishi." },
    ],
    methods: [
      {
        type: "venn",
        id: "t2-venn",
        title: "Venn diagrammasi: GDS va PMS",
        instruction: "Har bir xususiyat qaysi tizimga tegishli ekanini belgilang: faqat GDS, faqat PMS yoki ikkalasiga ham.",
        a: "GDS",
        b: "PMS",
        items: [
          ["Aviachiptalarni bron qilish", "a"],
          ["Housekeeping (xona tozalash) nazorati", "b"],
          ["Bron ma'lumotlarini saqlash", "both"],
          ["Ko'plab aviakompaniyalarni birlashtiradi", "a"],
          ["Check-in / check-out jarayoni", "b"],
          ["Ma'lumotlar bazasiga asoslanadi", "both"],
          ["PNR yaratish", "a"],
          ["Mehmon hisobini (folio) yuritish", "b"],
        ],
      },
      {
        type: "case",
        id: "t2-case",
        title: "Keys-stadi: \"Ikki marta sotilgan xona\"",
        instruction: "Vaziyatni o'qing va savollarga javob yozing.",
        text: "Buxorodagi 20 xonali butik-mehmonxona Booking.com va Expedia orqali xona sotadi. Administrator xonalar sonini har bir saytda qo'lda yangilaydi. Bayram kunlarida bitta xona ikki saytda bir vaqtda sotilib qoldi va kechqurun ikkita mehmon bir xonaga da'vogar bo'ldi.",
        questions: ["Muammoning asosiy sababi nima?", "Mehmonxona administratori hozir qanday harakat qilishi kerak?", "Kelajakda bunday holatning oldini olish uchun qaysi raqamli yechimni tavsiya qilasiz?"],
        model: "Sabab — kanallar qo'lda boshqarilgani va sinxronizatsiya yo'qligi. Hozir: mehmondan kechirim so'rash, yuqori toifadagi xona yoki hamkor mehmonxonada joy va bepul transfer taklif qilish, kompensatsiya berish. Kelajakda: PMS bilan integratsiyalashgan channel manager joriy etish, \"stop-sale\" va xavfsizlik zaxirasi (buffer) belgilash.",
      },
      {
        type: "fsmu",
        id: "t2-fsmu",
        title: "FSMU texnikasi",
        instruction: "\"Kichik mehmonxonalar ham PMS tizimidan foydalanishi shart\" degan fikr bo'yicha FSMU texnikasini bajaring.",
        statement: "Kichik mehmonxonalar ham PMS tizimidan foydalanishi shart.",
      },
    ],
    quiz: [
      { q: "Quyidagilardan qaysi biri GDS emas?", options: ["Amadeus", "Sabre", "Travelport", "Opera PMS"], correct: 3, explain: "Opera — mehmonxona PMS tizimi." },
      { q: "PNR nima?", options: ["Mehmonxona reytingi", "Yo'lovchining bron yozuvi", "To'lov kartasi turi", "Aeroport kodi"], correct: 1 },
      { q: "Overbookingning asosiy texnik sababi:", options: ["Channel manager orqali sinxronizatsiyaning yo'qligi yoki buzilishi", "Wi-Fi tezligi", "Mehmonlar soni", "Xona narxi"], correct: 0 },
      { q: "PMS asosan kim tomonidan ishlatiladi?", options: ["Aviakompaniya", "Mehmonxona", "Muzey", "Bank"], correct: 1 },
      { q: "CRSning GDSdan farqi:", options: ["CRS bitta kompaniya xizmatlarini, GDS ko'plab kompaniyalarni birlashtiradi", "Hech qanday farqi yo'q", "CRS faqat poyezdlar uchun", "GDS faqat mehmonxonalar uchun"], correct: 0 },
    ],
    selfStudy: [
      { id: "t2-s1", title: "Taqqoslash jadvali: 3 ta PMS", type: "Tahliliy ish", description: "Cloudbeds, Opera va yana bitta PMS tizimini narx, imkoniyatlar, til va O'zbekiston uchun mosligi bo'yicha jadvalda taqqoslang." },
      { id: "t2-s2", title: "Mehmonxonaga intervyu", type: "Amaliy ish", description: "Yaqindagi mehmonxona xodimi bilan suhbatlashib, ular qaysi axborot tizimlaridan foydalanishini va qanday muammolarga duch kelishini yozib keling." },
    ],
    resources: [
      { title: "Amadeus — rasmiy sayt", url: "https://amadeus.com" },
      { title: "Cloudbeds PMS haqida", url: "https://www.cloudbeds.com" },
    ],
  },
  {
    id: "t3",
    num: 3,
    title: "Onlayn bron qilish tizimlari va OTA platformalari",
    icon: "🛎️",
    hours: 4,
    goal: "Onlayn tur-agentliklar, bron qilish platformalari va elektron to'lov jarayonlarini amaliy o'rganish.",
    plan: ["OTA va meta-qidiruv tizimlari", "Onlayn bron qilish bosqichlari", "Dinamik narxlash va reyting", "Elektron chipta va elektron to'lovlar"],
    sections: [
      {
        title: "1. OTA va meta-qidiruv",
        html: `<p><b>OTA (Online Travel Agency)</b> — turistik xizmatlarni internet orqali sotuvchi onlayn agentlik: <b>Booking.com</b>, <b>Expedia</b>, <b>Agoda</b>, <b>Trip.com</b>, <b>Airbnb</b> (uy-joy ijarasi). OTA mehmonxonadan har bir bron uchun komissiya (odatda 15–25%) oladi.</p>
<p><b>Meta-qidiruv tizimlari</b> (Skyscanner, Google Hotels, Trivago) o'zi sotmaydi — turli saytlardagi narxlarni solishtirib, foydalanuvchini sotuvchi saytga yo'naltiradi.</p>`,
      },
      {
        title: "2. Onlayn bron qilish bosqichlari",
        html: `<ol><li>Qidiruv (sana, joy, mehmonlar soni)</li><li>Filtrlash va solishtirish (narx, reyting, joylashuv, sharhlar)</li><li>Tanlash va shartlarni o'qish (bekor qilish siyosati!)</li><li>Mehmon ma'lumotlarini kiritish</li><li>To'lov yoki kafolat (karta)</li><li>Tasdiq xati (voucher) olish</li></ol>
<div class="callout">⚠️ Turistga albatta <b>bekor qilish shartlari</b> (free cancellation / non-refundable) ni tushuntiring — bu eng ko'p nizo chiqadigan nuqta.</div>`,
      },
      {
        title: "3. Dinamik narxlash va reyting",
        html: `<p><b>Dinamik narxlash (Revenue management)</b> — talab, mavsum, bandlik darajasi va raqobatchilar narxiga qarab narxni avtomatik o'zgartirish. Asosiy ko'rsatkichlar: <b>ADR</b> (o'rtacha kunlik narx), <b>Occupancy</b> (bandlik %), <b>RevPAR</b> (mavjud xona boshiga daromad = ADR × Occupancy).</p>
<p>OTA reytingi mehmonlar sharhlari, javob tezligi, narx raqobatbardoshligi va bekor qilishlar soniga bog'liq.</p>`,
      },
      {
        title: "4. Elektron chipta va to'lovlar",
        html: `<p>Elektron chipta (e-ticket) — qog'oz o'rniga raqamli shakldagi chipta (QR-kod, PDF). O'zbekistonda temir yo'l chiptalari <b>railway.uz</b>, muzey chiptalari esa onlayn xizmatlar orqali sotiladi. Mahalliy to'lov tizimlari: <b>Click, Payme, Uzum</b>; xalqaro: Visa, Mastercard, UnionPay.</p>
<p>To'lov xavfsizligi: <b>3-D Secure</b> (SMS-kod), <b>PCI DSS</b> standarti. Hech qachon mijozdan karta CVV kodini so'ramang! <span class="tag">Trenajyor: "Onlayn to'lovda ikki marta pul yechilishi"</span></p>`,
      },
    ],
    glossary: [
      { term: "OTA", def: "Online Travel Agency — onlayn tur-agentlik (Booking.com, Expedia)." },
      { term: "Meta-qidiruv", def: "Turli saytlardagi narxlarni solishtiruvchi qidiruv tizimi (Skyscanner, Trivago)." },
      { term: "RevPAR", def: "Revenue Per Available Room — mavjud bitta xonaga to'g'ri keladigan daromad." },
      { term: "Voucher", def: "Bronni tasdiqlovchi hujjat." },
      { term: "3-D Secure", def: "Onlayn karta to'lovlarini qo'shimcha tasdiqlash (SMS-kod) protokoli." },
      { term: "Non-refundable", def: "Bekor qilinganda pul qaytarilmaydigan tarif." },
    ],
    methods: [
      {
        type: "ordering",
        id: "t3-order",
        title: "Bron qilish algoritmi",
        instruction: "Onlayn bron qilish bosqichlarini to'g'ri tartibda joylashtiring.",
        items: ["Qidiruv parametrlarini kiritish", "Variantlarni filtrlash va solishtirish", "Bekor qilish shartlarini o'qish", "Mehmon ma'lumotlarini kiritish", "To'lovni amalga oshirish", "Tasdiq xati (voucher) olish"],
      },
      {
        type: "tchart",
        id: "t3-tchart",
        title: "T-jadval: OTA orqali sotish",
        instruction: "Mehmonxona uchun OTA platformalari orqali sotishning afzallik va kamchiliklarini yozing.",
        left: "Afzalliklari",
        right: "Kamchiliklari",
      },
      {
        type: "case",
        id: "t3-case",
        title: "Keys: RevPAR hisoblash",
        instruction: "Hisoblang va xulosa yozing.",
        text: "Samarqanddagi 40 xonali mehmonxonada iyul oyida o'rtacha bandlik 75%, o'rtacha kunlik narx (ADR) 600 000 so'm. Avgustda narx 700 000 so'mga oshirildi, bandlik 60% ga tushdi.",
        questions: ["Iyul va avgust uchun RevPAR qancha?", "Qaysi oyda strategiya samaraliroq bo'ldi va nima uchun?"],
        model: "Iyul: 600 000 × 0,75 = 450 000 so'm. Avgust: 700 000 × 0,60 = 420 000 so'm. Iyuldagi strategiya samaraliroq — narx oshishi bandlikning pasayishini qoplamadi.",
      },
    ],
    quiz: [
      { q: "Skyscanner qanday tizim?", options: ["OTA", "Meta-qidiruv tizimi", "PMS", "GDS"], correct: 1 },
      { q: "RevPAR formulasi:", options: ["ADR × Occupancy", "ADR + Occupancy", "Xonalar soni × 2", "Daromad − xarajat"], correct: 0 },
      { q: "Non-refundable tarifning ma'nosi:", options: ["Bepul bekor qilish", "Bekor qilinganda pul qaytarilmaydi", "Nonushta kiritilgan", "Chegirma yo'q"], correct: 1 },
      { q: "Mijozdan qaysi ma'lumotni hech qachon so'ramaslik kerak?", options: ["Ism-familiya", "Email", "Karta CVV kodi", "Kelish sanasi"], correct: 2 },
      { q: "O'zbekistondagi mahalliy to'lov tizimlari:", options: ["Click, Payme, Uzum", "PayPal, Venmo", "Alipay, WeChat", "Apple Card"], correct: 0 },
    ],
    selfStudy: [
      { id: "t3-s1", title: "OTA platformalarini taqqoslash", type: "Tahliliy ish", description: "Bitta Toshkent mehmonxonasining bir xil sanadagi narxini Booking.com, Trip.com va mehmonxonaning o'z saytida solishtiring. Farq sabablarini tushuntiring (skrinshotlar bilan)." },
      { id: "t3-s2", title: "Mijoz uchun yo'riqnoma", type: "Ijodiy ish", description: "Xorijiy turist uchun \"O'zbekistonda poyezd chiptasini onlayn qanday sotib olish mumkin\" mavzusida bosqichma-bosqich yo'riqnoma (infografika) tayyorlang." },
    ],
    resources: [
      { title: "O'zbekiston temir yo'llari — onlayn chipta", url: "https://railway.uz" },
      { title: "Booking.com Partner Hub", url: "https://partner.booking.com" },
    ],
  },
  {
    id: "t4",
    num: 4,
    title: "Turizmda raqamli marketing va ijtimoiy tarmoqlar",
    icon: "📣",
    hours: 4,
    goal: "Turistik mahsulotni raqamli kanallar orqali ilgari surish usullari: SMM, SEO, kontent-marketing va onlayn obro' boshqaruvini o'rganish.",
    plan: ["Raqamli marketing kanallari", "SMM va kontent-marketing", "SEO va kontekst reklama", "Onlayn obro' boshqaruvi (ORM) va sharhlar bilan ishlash"],
    sections: [
      {
        title: "1. Raqamli marketing kanallari",
        html: `<p>Turizmda asosiy raqamli kanallar: <b>veb-sayt</b>, <b>ijtimoiy tarmoqlar</b> (Instagram, Telegram, Facebook, TikTok, YouTube), <b>qidiruv tizimlari</b> (Google, Yandex), <b>email-marketing</b>, <b>sharh platformalari</b> (TripAdvisor, Google Maps), <b>influenser-marketing</b>.</p>`,
      },
      {
        title: "2. SMM va kontent-marketing",
        html: `<p><b>SMM (Social Media Marketing)</b> — ijtimoiy tarmoqlar orqali auditoriya bilan ishlash. Turizmda eng samarali kontent turlari: qisqa videolar (Reels, Shorts), \"sahna ortidan\" lavhalar, gidning shaxsiy hikoyalari, turistlar fotolari (<b>UGC</b>), interaktiv so'rovnomalar va jonli efirlar.</p>
<p><b>Kontent-reja</b> — qaysi kuni, qaysi tarmoqda, qanday mavzuda post chiqishini belgilovchi jadval. Asosiy ko'rsatkichlar: qamrov (reach), faollik (engagement rate), konversiya.</p>`,
      },
      {
        title: "3. SEO va kontekst reklama",
        html: `<p><b>SEO</b> — saytni qidiruv tizimlarida yuqori o'ringa chiqarish (kalit so'zlar, sifatli kontent, tezlik, mobilga moslik). Masalan: \"Samarkand day tour\", \"Bukhara guide\".</p>
<p><b>Kontekst reklama</b> (Google Ads, Yandex Direct) — kalit so'z bo'yicha pullik reklama, har bir bosish uchun to'lov (<b>PPC</b>).</p>`,
      },
      {
        title: "4. Onlayn obro' boshqaruvi",
        html: `<p>Turistlarning 90% dan ortig'i bron qilishdan oldin sharhlarni o'qiydi. Salbiy sharhga javob berish qoidalari:</p>
<ol><li>Tez javob bering (24 soat ichida).</li><li>Mijozga ismi bilan murojaat qiling, minnatdorchilik bildiring.</li><li>Shablon emas — shaxsiy va aniq javob yozing.</li><li>Aybni tan oling, bahona qilmang.</li><li>Yechim taklif qiling va shaxsiy kanalga o'ting.</li><li>Xulosa chiqarib, xizmatni yaxshilang.</li></ol>
<span class="tag">Trenajyor: "Salbiy onlayn sharhga javob"</span>`,
      },
    ],
    glossary: [
      { term: "SMM", def: "Social Media Marketing — ijtimoiy tarmoqlar orqali marketing." },
      { term: "SEO", def: "Search Engine Optimization — saytni qidiruv tizimlari uchun optimallashtirish." },
      { term: "UGC", def: "User Generated Content — foydalanuvchilar yaratgan kontent (sharh, foto, video)." },
      { term: "Engagement rate", def: "Auditoriya faolligi ko'rsatkichi: (layk + izoh + ulashish) / qamrov." },
      { term: "ORM", def: "Online Reputation Management — onlayn obro'ni boshqarish." },
      { term: "PPC", def: "Pay Per Click — har bir bosish uchun to'lanadigan reklama modeli." },
    ],
    methods: [
      {
        type: "cluster",
        id: "t4-cluster",
        title: "Klaster",
        instruction: "\"Raqamli marketing\" tushunchasi atrofida klaster tuzing: asosiy yo'nalishlar va ularning tarkibiy qismlarini qo'shing.",
        center: "Raqamli marketing",
        sample: ["SMM", "SEO", "Email-marketing", "Kontekst reklama", "Influenserlar", "Sharh platformalari"],
      },
      {
        type: "case",
        id: "t4-case",
        title: "Keys: kontent-reja",
        instruction: "Xivadagi kichik oilaviy mehmon uyi (guest house) uchun bir haftalik Instagram kontent-rejasini tuzing.",
        text: "Mehmon uyi Ichan qal'a yonida joylashgan, 6 xonali, uy egasi milliy taomlar pishiradi va kulolchilik ustaxonasiga ekskursiya tashkil qiladi. Auditoriya — Yevropalik 25–45 yoshli sayyohlar.",
        questions: ["7 kun uchun post mavzulari va formati (Reels, karusel, Stories)", "Qaysi heshteglar va kalit so'zlardan foydalanasiz?", "Natijani qaysi ko'rsatkichlar bilan baholaysiz?"],
        model: "Masalan: 1-kun — Reels: ertalabki Ichan qal'a; 2 — karusel: xonalar; 3 — Stories so'rovnoma: \"Qaysi taomni tatib ko'rmoqchisiz?\"; 4 — kulolchilik ustaxonasidan video; 5 — mehmon sharhi (UGC); 6 — uy egasining oshxona sirlari; 7 — Xiva tun manzarasi. Heshteglar: #Khiva #Uzbekistan #SilkRoad #VisitUzbekistan. Ko'rsatkichlar: qamrov, saqlashlar, profilga o'tish, Direct orqali so'rovlar soni.",
      },
      {
        type: "insert",
        id: "t4-insert",
        title: "INSERT texnikasi",
        instruction: "Matnni o'qing va har bir jumlani belgilang: ✓ — bilardim, + — yangi ma'lumot, − — boshqacha o'ylardim, ? — tushunarsiz/savolim bor.",
        sentences: [
          "Turistlarning aksariyati bron qilishdan oldin onlayn sharhlarni o'qiydi.",
          "Salbiy sharhni o'chirib tashlash eng to'g'ri yo'l hisoblanadi.",
          "Sharhga javob shablon bo'lmasligi, shaxsiy bo'lishi kerak.",
          "Qisqa videolar turizmda eng yuqori faollik keltiruvchi kontent turidir.",
          "SEO saytni qidiruv tizimlarida yuqori o'ringa chiqarishga yordam beradi.",
        ],
      },
    ],
    quiz: [
      { q: "UGC nima?", options: ["Davlat reklamasi", "Foydalanuvchilar yaratgan kontent", "Grafik dizayn dasturi", "Reklama byudjeti"], correct: 1 },
      { q: "Salbiy sharhga to'g'ri munosabat:", options: ["E'tibor bermaslik", "Mijoz bilan tortishish", "Tez, shaxsiy javob berib, yechim taklif qilish", "Sharhni o'chirishni talab qilish"], correct: 2 },
      { q: "SEO nimaga xizmat qiladi?", options: ["Saytni qidiruvda yuqoriga chiqarish", "Chipta sotish", "Xona tozalash", "Valyuta almashtirish"], correct: 0 },
      { q: "PPC modelida reklama beruvchi nima uchun to'laydi?", options: ["Har bir ko'rish uchun", "Har bir bosish uchun", "Oylik obuna", "Faqat sotuvdan keyin"], correct: 1 },
      { q: "Engagement rate nimani o'lchaydi?", options: ["Sayt tezligini", "Auditoriya faolligini", "Mehmonxona bandligini", "Xodimlar sonini"], correct: 1 },
    ],
    selfStudy: [
      { id: "t4-s1", title: "Instagram-sahifa auditi", type: "Tahliliy ish", description: "O'zbekistondagi bitta tur-firma yoki muzeyning Instagram sahifasini tahlil qiling: kontent turlari, post chastotasi, faollik, kamchiliklar va 5 ta taklif." },
      { id: "t4-s2", title: "30 soniyalik promo-video", type: "Ijodiy loyiha", description: "O'z shahringizdagi bitta tarixiy obyekt haqida 30 soniyalik Reels/Shorts formatidagi video tayyorlang va havolasini yuboring." },
    ],
    resources: [{ title: "Google Digital Garage (bepul kurslar)", url: "https://learndigital.withgoogle.com" }],
  },
  {
    id: "t5",
    num: 5,
    title: "Mobil ilovalar va geoaxborot tizimlari (GAT) turizmda",
    icon: "📱",
    hours: 4,
    goal: "Turistik mobil ilovalar, onlayn xaritalar, GPS va GAT texnologiyalaridan ekskursiya marshrutlarini ishlab chiqishda foydalanishni o'rganish.",
    plan: ["Turistik mobil ilovalar turlari", "GPS va geolokatsiya xizmatlari", "GAT (GIS) va raqamli xaritalar", "QR-kod va audiogidlar", "Raqamli ekskursiya marshrutini ishlab chiqish"],
    sections: [
      {
        title: "1. Turistik mobil ilovalar",
        html: `<p>Turizmda mobil ilovalar turlari: <b>navigatsiya</b> (Google Maps, Yandex Maps, Maps.me, 2GIS), <b>transport</b> (Yandex Go, railway.uz), <b>to'lov</b> (Click, Payme), <b>tarjimon</b> (Google Translate), <b>audiogid</b> (izi.TRAVEL), <b>bron</b> (Booking, Airbnb), <b>sharh</b> (TripAdvisor).</p>`,
      },
      {
        title: "2. GPS va geolokatsiya",
        html: `<p><b>GPS</b> — sun'iy yo'ldoshlar yordamida joylashuvni aniqlash tizimi. <b>Geolokatsiya</b> — foydalanuvchining joriy joylashuvini aniqlash va ulashish. Gid uchun amaliy qo'llanish: adashgan turistdan <b>joylashuvni Telegram/WhatsApp orqali so'rash</b>, uchrashuv nuqtasini xaritada belgilab yuborish, guruh a'zolarining jonli joylashuvini kuzatish (live location).</p>
<span class="tag">Trenajyor: "Buxoroda adashgan turist"</span>`,
      },
      {
        title: "3. GAT (GIS) va raqamli xaritalar",
        html: `<p><b>Geoaxborot tizimi (GAT, GIS)</b> — geografik ma'lumotlarni yig'ish, tahlil qilish va xaritada aks ettirish tizimi. Turizmda: turistik resurslar xaritasi, oqimlarni tahlil qilish, marshrut optimallashtirish. Amaliy vositalar: <b>Google My Maps</b> (o'z xaritangizni yaratish), <b>QGIS</b> (bepul professional GIS).</p>`,
      },
      {
        title: "4. QR-kodlar va audiogidlar",
        html: `<p>Obyekt yonidagi <b>QR-kod</b> turistni ko'p tilli ma'lumot, audio yoki video sahifasiga yo'naltiradi. <b>Audiogid</b> — oldindan yozilgan ovozli ekskursiya. izi.TRAVEL platformasida bepul audiogid yaratish mumkin.</p>`,
      },
      {
        title: "5. Raqamli marshrut ishlab chiqish",
        html: `<p>Ekskursiya marshrutini tuzish bosqichlari: maqsad va auditoriyani aniqlash → obyektlarni tanlash → Google My Maps'da nuqtalarni belgilash → masofa va vaqtni hisoblash → har bir bekat uchun matn (\"gid portfeli\") → xavfsizlik va dam olish nuqtalari → QR/havola orqali turistlarga ulashish.</p>`,
      },
    ],
    glossary: [
      { term: "GPS", def: "Global Positioning System — sun'iy yo'ldosh orqali joylashuvni aniqlash tizimi." },
      { term: "GAT (GIS)", def: "Geoaxborot tizimi — geografik ma'lumotlarni tahlil qilish va xaritalash tizimi." },
      { term: "Geolokatsiya", def: "Qurilmaning geografik joylashuvini aniqlash." },
      { term: "QR-kod", def: "Smartfon kamerasi orqali o'qiladigan, havola yoki ma'lumot saqlovchi ikki o'lchamli shtrix-kod." },
      { term: "Audiogid", def: "Obyekt haqida oldindan yozilgan ovozli ekskursiya." },
      { term: "Gid portfeli", def: "Ekskursiya uchun tayyorlangan ko'rgazmali materiallar to'plami." },
    ],
    methods: [
      {
        type: "matching",
        id: "t5-match",
        title: "Ilova va vazifa",
        instruction: "Ilovani uning asosiy vazifasi bilan moslang.",
        pairs: [
          ["Yandex Go", "Taksi chaqirish"],
          ["Maps.me", "Oflayn xarita"],
          ["izi.TRAVEL", "Audiogid yaratish va tinglash"],
          ["Google My Maps", "Shaxsiy marshrut xaritasini tuzish"],
          ["Google Translate", "Matn va nutqni tarjima qilish"],
        ],
      },
      {
        type: "case",
        id: "t5-case",
        title: "Loyiha-keys: piyoda marshrut",
        instruction: "O'z shahringiz uchun 2 soatlik piyoda ekskursiya marshrutini rejalashtiring.",
        text: "Sizga 2 soatlik vaqt va 10 kishilik o'quvchilar guruhi berilgan. Marshrutda kamida 4 ta obyekt, 1 ta dam olish nuqtasi bo'lishi kerak.",
        questions: ["Obyektlar ro'yxati va ketma-ketligi", "Har bir obyekt orasidagi masofa va vaqt", "Qaysi raqamli vositalardan foydalanasiz va nima uchun?"],
        model: "Marshrutni Google My Maps'da tuzish, masofani xarita orqali o'lchash (piyoda ~4 km/soat), har bekatda 15–20 daqiqa; QR-havola orqali turistlarga xaritani ulashish; guruh bilan Telegram-chat va jonli joylashuv.",
      },
    ],
    quiz: [
      { q: "GIS nimani anglatadi?", options: ["Geoaxborot tizimi", "Global internet xizmati", "Gid identifikatsiya tizimi", "Grafik interfeys"], correct: 0 },
      { q: "Adashgan turistni topishda eng samarali raqamli usul:", options: ["Qog'oz xarita yuborish", "Joylashuvni messenjer orqali ulashishni so'rash", "Kutib turish", "Politsiyaga xat yozish"], correct: 1 },
      { q: "Oflayn rejimda ishlay oladigan xarita ilovasi:", options: ["Maps.me", "Instagram", "Click", "Booking"], correct: 0 },
      { q: "izi.TRAVEL nima uchun ishlatiladi?", options: ["Audiogidlar uchun", "To'lov uchun", "Taksi uchun", "Viza uchun"], correct: 0 },
      { q: "Piyoda yurishning o'rtacha tezligi (marshrut rejalashda):", options: ["~4 km/soat", "~15 km/soat", "~1 km/soat", "~30 km/soat"], correct: 0 },
    ],
    selfStudy: [
      { id: "t5-s1", title: "Google My Maps'da ekskursiya xaritasi", type: "Amaliy loyiha", description: "Kamida 6 bekatli ekskursiya marshrutini Google My Maps'da yarating: har bir bekatga rasm va qisqa ta'rif qo'shing. Havolani yuboring." },
      { id: "t5-s2", title: "Audiogid matni", type: "Ijodiy ish", description: "Bitta obyekt uchun 2–3 daqiqalik audiogid matnini yozing va ovozli yozuvini tayyorlang (izi.TRAVEL yoki boshqa platforma)." },
    ],
    resources: [
      { title: "Google My Maps", url: "https://www.google.com/maps/d/" },
      { title: "izi.TRAVEL — audiogidlar", url: "https://izi.travel" },
    ],
  },
  {
    id: "t6",
    num: 6,
    title: "Virtual va to'ldirilgan reallik (VR/AR): virtual ekskursiyalar",
    icon: "🥽",
    hours: 6,
    goal: "VR, AR, 360° panorama texnologiyalarining mohiyatini va ular yordamida virtual ekskursiya tayyorlash hamda o'tkazish texnologiyasini o'rganish.",
    plan: ["VR, AR va MR tushunchalari", "360° panorama va virtual tur", "Virtual ekskursiya turlari", "Onlayn ekskursiya o'tkazish metodikasi", "Texnik nosozliklarni boshqarish"],
    sections: [
      {
        title: "1. VR, AR va MR",
        html: `<p><b>Virtual reallik (VR)</b> — foydalanuvchini to'liq sun'iy raqamli muhitga olib kiruvchi texnologiya (VR-ko'zoynak: Meta Quest, HTC Vive).</p>
<p><b>To'ldirilgan reallik (AR)</b> — real tasvir ustiga raqamli ma'lumot qo'shish (smartfon kamerasi orqali tarixiy binoning asl ko'rinishini tiklash).</p>
<p><b>Aralash reallik (MR)</b> — real va virtual obyektlarning o'zaro ta'siri.</p>`,
      },
      {
        title: "2. 360° panorama va virtual tur",
        html: `<p><b>360° panorama</b> — barcha yo'nalishlarni qamrab oluvchi sferik tasvir. Bir nechta panoramalarni bog'lab, \"yurish\" imkoniyati bo'lgan <b>virtual tur</b> yaratiladi. Vositalar: 360° kamera (Insta360, Ricoh Theta), smartfon ilovalari, Kuula, Google Street View.</p>`,
      },
      {
        title: "3. Virtual ekskursiya turlari",
        html: `<ul><li><b>Yozib olingan</b> (video, virtual tur sayti) — mustaqil ko'rish uchun.</li><li><b>Jonli onlayn</b> (Zoom, Google Meet, YouTube Live) — gid real vaqtda olib boradi.</li><li><b>Gibrid</b> — bir guruh joyida, boshqasi onlayn.</li><li><b>Immersiv VR</b> — VR-ko'zoynak bilan to'liq ishtirok.</li></ul>`,
      },
      {
        title: "4. Onlayn ekskursiya metodikasi",
        html: `<p>Onlayn auditoriya diqqati tez tarqaladi, shuning uchun har 5–7 daqiqada <b>interaktiv element</b> kiriting: savol, viktorina (Kahoot, Mentimeter), \"toping-chi\" topshirig'i, chatda ovoz berish. Ekskursiya tuzilmasi: salomlashish va texnik tekshiruv → kirish → bekatlar → interaktiv → xulosa va savol-javob → qayta aloqa.</p>`,
      },
      {
        title: "5. Texnik nosozliklarni boshqarish",
        html: `<p>Zaxira reja: ikkinchi internet manbai (mobil hotspot), oldindan yuklab olingan panorama va slaydlar, chatda yozma ma'lumot berish, yordamchi-moderator. Nosozlikda xotirjamlikni saqlab, auditoriyaga aniq xabar bering.</p>
<span class="tag">Trenajyor: "Ichan qal'a: onlayn virtual ekskursiya"</span>`,
      },
    ],
    glossary: [
      { term: "VR", def: "Virtual Reality — to'liq sun'iy raqamli muhit." },
      { term: "AR", def: "Augmented Reality — real tasvirga raqamli qatlam qo'shish." },
      { term: "MR", def: "Mixed Reality — real va virtual obyektlarning o'zaro ta'siri." },
      { term: "360° panorama", def: "Barcha yo'nalishlarni qamrab oluvchi sferik fotosurat." },
      { term: "Virtual tur", def: "O'zaro bog'langan panoramalar orqali obyekt bo'ylab virtual sayohat." },
      { term: "Immersivlik", def: "Foydalanuvchining virtual muhitga \"sho'ng'ish\" darajasi." },
    ],
    methods: [
      {
        type: "venn",
        id: "t6-venn",
        title: "Venn diagrammasi: VR va AR",
        instruction: "Xususiyatlarni VR, AR yoki ikkalasiga tegishli ekanini belgilang.",
        a: "VR",
        b: "AR",
        items: [
          ["Maxsus ko'zoynak talab qiladi", "a"],
          ["Smartfon kamerasi orqali ishlaydi", "b"],
          ["Raqamli kontentdan foydalanadi", "both"],
          ["Real dunyo ko'rinib turadi", "b"],
          ["Foydalanuvchi to'liq virtual muhitda", "a"],
          ["Turizmda ekskursiya uchun qo'llanadi", "both"],
        ],
      },
      {
        type: "brainstorm",
        id: "t6-bs",
        title: "Aqliy hujum: AR g'oyalari",
        instruction: "O'zbekistondagi tarixiy obyektlar uchun AR-ilova g'oyalarini taklif qiling.",
        minIdeas: 4,
        examples: ["Afrosiyob shahrining qayta tiklangan ko'rinishi", "Ulug'bek rasadxonasida sekstant ishlashini ko'rsatish"],
      },
      {
        type: "fsmu",
        id: "t6-fsmu",
        title: "FSMU: virtual ekskursiya kelajagi",
        instruction: "Fikr bo'yicha FSMU texnikasini bajaring.",
        statement: "Kelajakda virtual ekskursiyalar real ekskursiyalarni to'liq almashtiradi.",
      },
    ],
    quiz: [
      { q: "AR nima?", options: ["To'liq virtual muhit", "Real tasvirga raqamli qatlam qo'shish", "Audio yozuv", "3D printer"], correct: 1 },
      { q: "Onlayn ekskursiyada diqqatni saqlash uchun interaktiv elementni qancha vaqtda kiritish tavsiya etiladi?", options: ["Har 5–7 daqiqada", "Faqat oxirida", "Hech qachon", "Har 40 daqiqada"], correct: 0 },
      { q: "360° panorama uchun mo'ljallangan kamera:", options: ["Insta360", "Veb-kamera", "Skaner", "Proyektor"], correct: 0 },
      { q: "Onlayn ekskursiyada internet uzilsa, birinchi qadam:", options: ["Ekskursiyani bekor qilish", "Xotirjamlik bilan zaxira kanalga o'tish va auditoriyani xabardor qilish", "Hech narsa demaslik", "Chatni o'chirish"], correct: 1 },
      { q: "Gibrid ekskursiya — bu:", options: ["Faqat VR", "Bir guruh joyida, boshqasi onlayn ishtirok etadi", "Avtobusli tur", "Yozib olingan video"], correct: 1 },
    ],
    selfStudy: [
      { id: "t6-s1", title: "360° panorama yaratish", type: "Amaliy loyiha", description: "Smartfon yordamida (Google Street View yoki boshqa ilova) bitta obyektning 360° panoramasini yarating va Kuula/Google Maps'ga joylab havolasini yuboring." },
      { id: "t6-s2", title: "Onlayn ekskursiya ssenariysi", type: "Metodik ish", description: "15 daqiqalik onlayn virtual ekskursiya ssenariysini yozing: bekatlar, matn, 3 ta interaktiv topshiriq va texnik zaxira reja." },
    ],
    resources: [
      { title: "Google Arts & Culture — virtual muzeylar", url: "https://artsandculture.google.com" },
      { title: "Kuula — 360° virtual turlar", url: "https://kuula.co" },
    ],
  },
  {
    id: "t7",
    num: 7,
    title: "Sun'iy intellekt, chatbotlar va tavsiya tizimlari",
    icon: "🤖",
    hours: 4,
    goal: "Sun'iy intellektning turizmdagi qo'llanilishi, chatbotlar va tavsiya tizimlari, generativ AI vositalaridan kasbiy faoliyatda mas'uliyatli foydalanishni o'rganish.",
    plan: ["Sun'iy intellekt tushunchasi", "Chatbotlar va virtual yordamchilar", "Tavsiya tizimlari va shaxsiylashtirish", "Generativ AI gid ishida", "AI dan foydalanish etikasi"],
    sections: [
      {
        title: "1. Sun'iy intellekt tushunchasi",
        html: `<p><b>Sun'iy intellekt (SI, AI)</b> — kompyuter tizimlarining inson intellektiga xos vazifalarni (nutqni tushunish, qaror qabul qilish, tarjima, tasvirni tanish) bajarish qobiliyati. <b>Mashinali o'qitish</b> — tizimning ma'lumotlardan o'rganishi. <b>Katta til modellari (LLM)</b> — matn yaratuvchi va tushunuvchi neyron tarmoqlar (Claude, ChatGPT, Gemini).</p>`,
      },
      {
        title: "2. Chatbotlar",
        html: `<p>Turizmda chatbotlar 24/7 rejimida savollarga javob beradi, bron qiladi, sayohat davomida yordam beradi. Telegram-botlar O'zbekistonda eng ommabop kanal. Chatbot murakkab yoki hissiy vaziyatlarda mijozni <b>jonli operatorga</b> o'tkazishi kerak.</p>`,
      },
      {
        title: "3. Tavsiya tizimlari",
        html: `<p>Tavsiya tizimlari foydalanuvchining oldingi tanlovlari va o'xshash foydalanuvchilar xatti-harakati asosida mehmonxona, tur yoki restoran taklif qiladi (Booking, Airbnb, TripAdvisor). Bu <b>shaxsiylashtirish</b> (personalization) deyiladi.</p>`,
      },
      {
        title: "4. Generativ AI gid ishida",
        html: `<p>Gid AI yordamida: ekskursiya matni qoralamasini tayyorlash, turli tillarga tarjima, turistlar uchun individual dastur, viktorina savollari tuzish, mashq qilish (masalan, ushbu platformadagi <b>Virtual gidlik trenajyori</b>). Ammo AI <b>faktik xatolar</b> (\"gallyutsinatsiya\") qilishi mumkin — barcha sana va faktlarni ishonchli manbalardan tekshiring!</p>`,
      },
      {
        title: "5. AI etikasi",
        html: `<ul><li>Turistlarning shaxsiy ma'lumotlarini AI xizmatlariga kiritmang.</li><li>AI yaratgan matnni tekshirmasdan tarqatmang.</li><li>Mualliflik huquqi va madaniy merosga hurmat.</li><li>AI — yordamchi, gidning shaxsiy tajribasi va samimiyati o'rnini bosa olmaydi.</li></ul>`,
      },
    ],
    glossary: [
      { term: "Sun'iy intellekt", def: "Kompyuter tizimlarining inson intellektiga xos vazifalarni bajarish qobiliyati." },
      { term: "Chatbot", def: "Foydalanuvchi bilan matn yoki ovoz orqali avtomatik muloqot qiluvchi dastur." },
      { term: "LLM", def: "Large Language Model — katta til modeli." },
      { term: "Gallyutsinatsiya (AI)", def: "AI ning ishonarli ko'rinadigan, ammo noto'g'ri ma'lumot yaratishi." },
      { term: "Shaxsiylashtirish", def: "Xizmat yoki tavsiyani muayyan foydalanuvchi ehtiyojiga moslash." },
      { term: "Tavsiya tizimi", def: "Foydalanuvchiga uning qiziqishlari asosida mahsulot taklif qiluvchi algoritm." },
    ],
    methods: [
      {
        type: "tchart",
        id: "t7-tchart",
        title: "T-jadval: AI gid ishida",
        instruction: "Gid faoliyatida sun'iy intellektdan foydalanishning imkoniyat va xavflarini yozing.",
        left: "Imkoniyatlar",
        right: "Xavflar",
      },
      {
        type: "case",
        id: "t7-case",
        title: "Keys: AI xatosi",
        instruction: "Vaziyatni tahlil qiling.",
        text: "Yosh gid ekskursiya matnini AI yordamida tayyorladi va turistlarga \"Registon maydonidagi Ulug'bek madrasasi XVII asrda qurilgan\" deb aytdi. Turistlardan biri telefonida tekshirib, xatoni ko'rsatdi.",
        questions: ["Qanday xato qilingan? To'g'ri ma'lumot qanday?", "Gid bu vaziyatda o'zini qanday tutishi kerak?", "AI dan foydalanishda qanday qoidaga amal qilish kerak edi?"],
        model: "Ulug'bek madrasasi 1417–1420-yillarda (XV asr) qurilgan. Gid xatoni samimiy tan olishi, turistga minnatdorchilik bildirishi va to'g'ri ma'lumotni berishi kerak. Qoida: AI matnidagi barcha faktlarni ishonchli manbalar (ilmiy adabiyot, muzey rasmiy saytlari) orqali tekshirish.",
      },
    ],
    quiz: [
      { q: "AI gallyutsinatsiyasi nima?", options: ["AI ning noto'g'ri, ammo ishonarli ma'lumot yaratishi", "AI ning tez ishlashi", "VR effekti", "Virus"], correct: 0 },
      { q: "Chatbot qachon mijozni jonli operatorga o'tkazishi kerak?", options: ["Hech qachon", "Murakkab yoki hissiy vaziyatlarda", "Har doim", "Faqat tunda"], correct: 1 },
      { q: "Tavsiya tizimining asosiy maqsadi:", options: ["Shaxsiylashtirilgan taklif berish", "Narxni oshirish", "Saytni sekinlashtirish", "Reklama blokirovkasi"], correct: 0 },
      { q: "AI yordamida tayyorlangan ekskursiya matni bilan nima qilish shart?", options: ["Darhol o'qib berish", "Faktlarni ishonchli manbalardan tekshirish", "Chop etib tarqatish", "Hech narsa"], correct: 1 },
      { q: "Qaysi biri katta til modeliga (LLM) misol?", options: ["Claude", "Excel", "Photoshop", "Windows"], correct: 0 },
    ],
    selfStudy: [
      { id: "t7-s1", title: "AI bilan ekskursiya matni va tekshiruv", type: "Tadqiqot ishi", description: "AI yordamida bitta obyekt haqida ekskursiya matni yarating, so'ng undagi kamida 5 ta faktni ishonchli manbalardan tekshiring. Topilgan xatolar va manbalar ro'yxatini taqdim eting." },
      { id: "t7-s2", title: "Trenajyorda 3 ta ssenariy", type: "Amaliy mashg'ulot", description: "Virtual gidlik trenajyorida kamida 3 ta turli ssenariyni bajaring va AI bergan tavsiyalar asosida o'z rivojlanish rejangizni yozing." },
    ],
    resources: [{ title: "Claude — sun'iy intellekt yordamchisi", url: "https://claude.ai" }],
  },
  {
    id: "t8",
    num: 8,
    title: "Madaniy merosni raqamlashtirish va raqamli muzeylar",
    icon: "🏛️",
    hours: 4,
    goal: "Madaniy meros obyektlarini raqamli hujjatlashtirish, saqlash va ommalashtirish texnologiyalarini o'rganish.",
    plan: ["Madaniy merosni raqamlashtirish zarurati", "3D skanerlash va fotogrammetriya", "Raqamli arxivlar va kataloglar", "Raqamli va virtual muzeylar", "YuNESKO obyektlari va raqamli texnologiyalar"],
    sections: [
      {
        title: "1. Raqamlashtirish zarurati",
        html: `<p>Madaniy meros obyektlari vaqt, iqlim, turistik oqim va tabiiy ofatlar ta'sirida yemiriladi. <b>Raqamlashtirish</b> obyektni aniq hujjatlashtirish, restavratsiya uchun ma'lumot to'plash, kelajak avlodlar uchun saqlash va butun dunyoga ommalashtirish imkonini beradi.</p>`,
      },
      {
        title: "2. 3D skanerlash va fotogrammetriya",
        html: `<p><b>3D lazer skanerlash</b> — obyekt yuzasini millimetr aniqlikda o'lchab, nuqtalar buluti (point cloud) yaratish. <b>Fotogrammetriya</b> — turli burchakdan olingan ko'plab fotosuratlar asosida 3D model yaratish (dronlar yordamida ham). Natijada virtual tur, AR-ilova va restavratsiya rejasi uchun aniq model olinadi.</p>`,
      },
      {
        title: "3. Raqamli arxivlar",
        html: `<p>Qo'lyozmalar, eksponatlar va hujjatlarning raqamli nusxalari elektron kataloglarda saqlanadi. Har bir raqamli obyekt <b>metama'lumotlar</b> (nomi, davri, muallifi, materiali, joylashuvi) bilan tavsiflanadi.</p>`,
      },
      {
        title: "4. Raqamli muzeylar",
        html: `<p>Raqamli muzey — eksponatlarni onlayn taqdim etuvchi platforma: virtual zallar, 3D eksponatlar, interaktiv ko'rgazmalar. Masalan, <b>Google Arts & Culture</b> platformasida O'zbekiston muzeylari kolleksiyalari mavjud.</p>`,
      },
      {
        title: "5. YuNESKO obyektlari",
        html: `<p>O'zbekistondagi YuNESKO Butunjahon merosi ro'yxatidagi obyektlar: <b>Ichan qal'a</b> (1990), <b>Buxoro tarixiy markazi</b> (1993), <b>Shahrisabz tarixiy markazi</b> (2000), <b>Samarqand — madaniyatlar chorrahasi</b> (2001), <b>G'arbiy Tyan-Shan</b> (2016), <b>Ipak yo'li: Zarafshon-Qoraqum yo'lagi</b> (2023), <b>Turon cho'llari</b> (2023).</p>`,
      },
    ],
    glossary: [
      { term: "Fotogrammetriya", def: "Fotosuratlar asosida obyektning 3D modelini yaratish usuli." },
      { term: "Nuqtalar buluti", def: "3D skanerlash natijasida olingan fazoviy nuqtalar to'plami." },
      { term: "Metama'lumot", def: "Ma'lumot haqidagi ma'lumot: nomi, sanasi, muallifi va boshqalar." },
      { term: "Raqamli muzey", def: "Eksponatlarni onlayn va virtual taqdim etuvchi platforma." },
      { term: "Raqamli egizak", def: "Real obyektning aniq raqamli nusxasi." },
    ],
    methods: [
      {
        type: "cluster",
        id: "t8-cluster",
        title: "Klaster: raqamlashtirish",
        instruction: "\"Madaniy merosni raqamlashtirish\" klasterini tuzing: texnologiyalar, natijalar, foydalanuvchilar.",
        center: "Madaniy merosni raqamlashtirish",
        sample: ["3D skanerlash", "Fotogrammetriya", "Raqamli arxiv", "Virtual muzey", "AR-ilova", "Restavratsiya"],
      },
      {
        type: "ordering",
        id: "t8-order",
        title: "YuNESKO ro'yxatiga kiritilish tartibi",
        instruction: "O'zbekistondagi obyektlarni YuNESKO ro'yxatiga kiritilgan yili bo'yicha tartiblang.",
        items: ["Ichan qal'a (Xiva)", "Buxoro tarixiy markazi", "Shahrisabz tarixiy markazi", "Samarqand — madaniyatlar chorrahasi", "G'arbiy Tyan-Shan"],
      },
    ],
    quiz: [
      { q: "Ichan qal'a YuNESKO ro'yxatiga qachon kiritilgan?", options: ["1990", "2001", "1965", "2016"], correct: 0 },
      { q: "Fotogrammetriya nima?", options: ["Fotolardan 3D model yaratish", "Fotolarni tahrirlash", "Fotoapparat turi", "Fotokorrespondentlik"], correct: 0 },
      { q: "Metama'lumotga misol:", options: ["Eksponatning davri va materiali", "Muzey xodimining maoshi", "Chipta narxi", "Wi-Fi paroli"], correct: 0 },
      { q: "Raqamli egizak nima?", options: ["Real obyektning aniq raqamli nusxasi", "Ikki gid", "Ikki nusxa chipta", "Video montaj"], correct: 0 },
      { q: "Samarqand YuNESKO ro'yxatiga qaysi nom bilan kiritilgan?", options: ["Samarqand — madaniyatlar chorrahasi", "Samarqand — qadimiy qal'a", "Registon majmuasi", "Afrosiyob"], correct: 0 },
    ],
    selfStudy: [
      { id: "t8-s1", title: "Raqamli eksponat pasporti", type: "Amaliy ish", description: "Mahalliy muzeydagi bitta eksponatni suratga oling va uning raqamli pasportini (metama'lumotlar bilan) tayyorlang." },
      { id: "t8-s2", title: "Fotogrammetriya tajribasi", type: "Amaliy loyiha", description: "Kichik buyum (kulolchilik mahsuloti, haykalcha) ning 3D modelini smartfon ilovasi (Polycam, KIRI Engine) yordamida yarating va havolasini yuboring." },
    ],
    resources: [
      { title: "YuNESKO Butunjahon merosi: O'zbekiston", url: "https://whc.unesco.org/en/statesparties/uz" },
      { title: "Google Arts & Culture", url: "https://artsandculture.google.com" },
    ],
  },
  {
    id: "t9",
    num: 9,
    title: "Katta ma'lumotlar (Big Data), turizm analitikasi va CRM",
    icon: "📊",
    hours: 4,
    goal: "Turizmda ma'lumotlarni yig'ish, tahlil qilish va mijozlar bilan munosabatlarni boshqarish (CRM) asoslarini o'rganish.",
    plan: ["Big Data tushunchasi va manbalari", "Turizm analitikasi ko'rsatkichlari", "Ma'lumotlarni vizuallashtirish", "CRM tizimlari va mijoz bazasi"],
    sections: [
      {
        title: "1. Big Data",
        html: `<p><b>Katta ma'lumotlar</b> — an'anaviy usullar bilan qayta ishlab bo'lmaydigan hajmdagi ma'lumotlar. \"5V\" xususiyati: <b>Volume</b> (hajm), <b>Velocity</b> (tezlik), <b>Variety</b> (xilma-xillik), <b>Veracity</b> (ishonchlilik), <b>Value</b> (qiymat). Turizmdagi manbalar: bronlar, mobil operator ma'lumotlari, bank tranzaksiyalari, ijtimoiy tarmoqlar, sharhlar, Wi-Fi va sensorlar.</p>`,
      },
      {
        title: "2. Turizm analitikasi",
        html: `<p>Asosiy ko'rsatkichlar: turistlar soni va oqimi, o'rtacha qolish muddati, o'rtacha xarajat, mavsumiylik, qayta tashrif darajasi, mijoz qoniqishi (<b>NPS</b>). Tahlil natijasida talab prognozlanadi, narxlar va marketing optimallashtiriladi.</p>`,
      },
      {
        title: "3. Vizuallashtirish",
        html: `<p>Ma'lumotlar diagramma, grafik va dashboardlar orqali taqdim etiladi: <b>Excel / Google Sheets</b>, <b>Looker Studio</b>, <b>Power BI</b>. To'g'ri diagramma tanlash: vaqt bo'yicha o'zgarish — chiziqli grafik; ulushlar — ustunli yoki doiraviy diagramma; joylashuv — xarita.</p>`,
      },
      {
        title: "4. CRM",
        html: `<p><b>CRM (Customer Relationship Management)</b> — mijozlar bilan munosabatlarni boshqarish tizimi: mijoz bazasi, murojaatlar tarixi, sotuv voronkasi, eslatmalar, avtomatik xabarlar. Misollar: <b>Bitrix24</b>, <b>amoCRM</b>, <b>HubSpot</b>. Gid uchun ham shaxsiy mijozlar bazasini yuritish muhim (doimiy mijozlar, tavsiyalar).</p>`,
      },
    ],
    glossary: [
      { term: "Big Data", def: "Katta hajmli, tez o'zgaruvchan va xilma-xil ma'lumotlar." },
      { term: "CRM", def: "Mijozlar bilan munosabatlarni boshqarish tizimi." },
      { term: "NPS", def: "Net Promoter Score — mijozlarning tavsiya qilishga tayyorlik indeksi." },
      { term: "Dashboard", def: "Asosiy ko'rsatkichlarni bitta ekranda ko'rsatuvchi vizual panel." },
      { term: "Sotuv voronkasi", def: "Mijozning qiziqishdan xaridgacha bo'lgan bosqichlari." },
    ],
    methods: [
      {
        type: "matching",
        id: "t9-match",
        title: "5V xususiyatlari",
        instruction: "Big Data xususiyatini uning ma'nosi bilan moslang.",
        pairs: [
          ["Volume", "Ma'lumotlarning juda katta hajmi"],
          ["Velocity", "Ma'lumotlarning yuqori tezlikda yangilanishi"],
          ["Variety", "Ma'lumot turlarining xilma-xilligi"],
          ["Veracity", "Ma'lumotlarning ishonchliligi"],
          ["Value", "Ma'lumotlardan olinadigan foyda"],
        ],
      },
      {
        type: "case",
        id: "t9-case",
        title: "Keys: NPS hisoblash",
        instruction: "NPS ni hisoblang va xulosa chiqaring.",
        text: "Tur-firma 200 nafar mijozdan \"Bizni do'stlaringizga tavsiya qilasizmi? (0–10)\" deb so'radi: 110 kishi 9–10 ball (promouterlar), 60 kishi 7–8 ball (neytrallar), 30 kishi 0–6 ball (tanqidchilar) berdi.",
        questions: ["NPS qancha? (NPS = promouterlar % − tanqidchilar %)", "Natijani yaxshilash uchun qanday raqamli choralar ko'rasiz?"],
        model: "Promouterlar 55%, tanqidchilar 15% → NPS = 40 (yaxshi ko'rsatkich). Choralar: tanqidchilar bilan CRM orqali shaxsiy aloqa, sharhlarni monitoring, sodiqlik dasturi, sayohatdan keyin avtomatik so'rovnoma.",
      },
    ],
    quiz: [
      { q: "NPS qanday hisoblanadi?", options: ["Promouterlar % − tanqidchilar %", "Barcha ballar yig'indisi", "O'rtacha ball × 10", "Mijozlar soni"], correct: 0 },
      { q: "CRM tizimiga misol:", options: ["Bitrix24", "Photoshop", "Zoom", "Maps.me"], correct: 0 },
      { q: "Vaqt bo'yicha o'zgarishni ko'rsatish uchun mos diagramma:", options: ["Chiziqli grafik", "Doiraviy diagramma", "Jadval emas", "Matn"], correct: 0 },
      { q: "Big Data'ning \"Variety\" xususiyati:", options: ["Xilma-xillik", "Tezlik", "Hajm", "Narx"], correct: 0 },
      { q: "Turizmda Big Data manbai bo'la olmaydigan narsa:", options: ["Bank tranzaksiyalari", "Ijtimoiy tarmoqlar", "Bronlar", "Gidning shaxsiy kundaligi (yopiq)"], correct: 3 },
    ],
    selfStudy: [
      { id: "t9-s1", title: "Turistlar oqimi dashbordi", type: "Amaliy ish", description: "Ochiq statistik ma'lumotlar (stat.uz, uzbektourism.uz) asosida O'zbekistonga kelgan xorijiy turistlar soni bo'yicha Google Sheets'da diagrammalar tuzing va xulosa yozing." },
      { id: "t9-s2", title: "Gidning mijozlar bazasi", type: "Amaliy ish", description: "Google Sheets'da gid uchun oddiy CRM jadvali yarating: mijoz, mamlakat, sana, tur, fikr, keyingi aloqa sanasi (kamida 10 ta shartli yozuv)." },
    ],
    resources: [
      { title: "O'zbekiston statistika agentligi", url: "https://stat.uz" },
      { title: "Looker Studio", url: "https://lookerstudio.google.com" },
    ],
  },
  {
    id: "t10",
    num: 10,
    title: "Raqamli xavfsizlik, shaxsiy ma'lumotlar va kasbiy etika",
    icon: "🔐",
    hours: 4,
    goal: "Turizm faoliyatida axborot xavfsizligi, shaxsiy ma'lumotlarni himoya qilish va raqamli kasbiy etika qoidalarini o'zlashtirish.",
    plan: ["Turizmda kiberxavfsizlik tahdidlari", "Shaxsiy ma'lumotlarni himoya qilish", "Xavfsiz onlayn to'lovlar", "Raqamli kasbiy etika va gidning onlayn obro'si"],
    sections: [
      {
        title: "1. Kiberxavfsizlik tahdidlari",
        html: `<p>Turizmdagi asosiy tahdidlar: <b>fishing</b> (soxta bron saytlari va xatlar), soxta mehmonxona e'lonlari, ochiq Wi-Fi tarmoqlarida ma'lumot o'g'irlash, mijozlar bazasining sizib chiqishi, ijtimoiy muhandislik (telefon orqali aldash).</p>
<div class="callout">🛡️ Asosiy qoidalar: kuchli parol + ikki bosqichli autentifikatsiya (2FA), havolani tekshirish (https, domen nomi), ochiq Wi-Fi'da VPN, dasturlarni yangilab turish.</div>`,
      },
      {
        title: "2. Shaxsiy ma'lumotlar",
        html: `<p>O'zbekiston Respublikasining <b>\"Shaxsga doir ma'lumotlar to'g'risida\"gi Qonuni</b> (2019) shaxsiy ma'lumotlarni yig'ish, saqlash va uzatish tartibini belgilaydi. Turizmda shaxsiy ma'lumotlar: pasport, viza, telefon, karta ma'lumotlari, sog'liq holati. Gid turistning pasport nusxasini messenjerlarda tarqatmasligi, rasmlarini ruxsatsiz ijtimoiy tarmoqqa joylamasligi kerak.</p>`,
      },
      {
        title: "3. Xavfsiz onlayn to'lovlar",
        html: `<p>Faqat ishonchli to'lov shlyuzlari (Click, Payme, bank ekvayringi) dan foydalaning. Karta raqami, amal qilish muddati va CVV kodini chat yoki telefon orqali so'ramang. Shubhali tranzaksiyada bank bilan bog'lanish tartibini bilish kerak.</p>`,
      },
      {
        title: "4. Raqamli kasbiy etika",
        html: `<p>Gidning raqamli etikasi: turistlar bilan muloqotda xushmuomalalik va tezkorlik, ish va shaxsiy akkauntlarni ajratish, sharhlarni soxtalashtirmaslik, mualliflik huquqiga rioya (boshqa birovning foto va matnlari), madaniy merosga hurmat, ishonchsiz ma'lumot tarqatmaslik.</p>`,
      },
    ],
    glossary: [
      { term: "Fishing", def: "Soxta sayt yoki xat orqali shaxsiy ma'lumotlarni o'g'irlash firibgarligi." },
      { term: "2FA", def: "Ikki bosqichli autentifikatsiya — parol va qo'shimcha kod orqali kirish." },
      { term: "VPN", def: "Virtual xususiy tarmoq — internet trafigini shifrlovchi xizmat." },
      { term: "Shaxsga doir ma'lumot", def: "Shaxsni aniqlash imkonini beruvchi har qanday ma'lumot." },
      { term: "Ijtimoiy muhandislik", def: "Inson ishonchidan foydalanib ma'lumot olish firibgarligi." },
    ],
    methods: [
      {
        type: "venn",
        id: "t10-venn",
        title: "Xavfsiz yoki xavfli?",
        instruction: "Har bir harakatni xavfsiz (A), xavfli (B) yoki vaziyatga bog'liq (ikkalasi) deb belgilang.",
        a: "Xavfsiz",
        b: "Xavfli",
        items: [
          ["2FA ni yoqish", "a"],
          ["Turist pasportini umumiy guruh chatiga yuborish", "b"],
          ["Ochiq Wi-Fi'dan foydalanish", "both"],
          ["Mijozdan CVV kodni telefonda so'rash", "b"],
          ["Click/Payme orqali to'lov havolasi yuborish", "a"],
          ["Turistni suratga olib Instagram'ga joylash", "both"],
        ],
      },
      {
        type: "case",
        id: "t10-case",
        title: "Keys: soxta bron sayti",
        instruction: "Vaziyatni tahlil qiling.",
        text: "Turist sizga \"Mehmonxonamizni oldindan to'ladim, ammo mehmonxona bronni topa olmayapti\" deydi. U to'lovni \"booking-confirm-hotels.com\" saytida, emailda kelgan havola orqali qilgan.",
        questions: ["Nima sodir bo'lgan bo'lishi mumkin?", "Turistga qanday yordam berasiz?", "Kelajakda turistlarni qanday ogohlantirasiz?"],
        model: "Fishing — soxta sayt. Yordam: bankka darhol murojaat qilib kartani bloklash va chargeback so'rash, mehmonxonada yangi bron, politsiyaga ariza. Ogohlantirish: faqat rasmiy saytlar/ilovalar, domenni tekshirish, emaildagi shubhali havolalarga bosmaslik.",
      },
    ],
    quiz: [
      { q: "Fishing nima?", options: ["Baliq ovlash turi", "Soxta sayt/xat orqali ma'lumot o'g'irlash", "Antivirus", "Bron turi"], correct: 1 },
      { q: "2FA nima?", options: ["Ikki bosqichli autentifikatsiya", "Ikki fayl", "Fayl arxivi", "Wi-Fi turi"], correct: 0 },
      { q: "O'zbekistonda shaxsga doir ma'lumotlar to'g'risidagi qonun qabul qilingan yil:", options: ["2019", "1991", "2005", "2023"], correct: 0 },
      { q: "Ochiq Wi-Fi'da xavfsizlikni oshiruvchi vosita:", options: ["VPN", "Bluetooth", "Kamera", "Printer"], correct: 0 },
      { q: "Turistni suratga olib ijtimoiy tarmoqqa joylashdan oldin:", options: ["Uning roziligini olish kerak", "Hech narsa kerak emas", "Faqat filtr qo'yish", "Ism yozish"], correct: 0 },
    ],
    selfStudy: [
      { id: "t10-s1", title: "Turistlar uchun xavfsizlik eslatmasi", type: "Ijodiy ish", description: "Xorijiy turistlar uchun ingliz tilida \"O'zbekistonda raqamli xavfsizlik: 10 ta maslahat\" eslatmasini (Canva'da) tayyorlang." },
      { id: "t10-s2", title: "Raqamli etika kodeksi", type: "Esse", description: "Gidning raqamli etika kodeksini 10 band ko'rinishida ishlab chiqing va har birini misol bilan asoslang." },
    ],
    resources: [{ title: "Kiberxavfsizlik markazi (O'zbekiston)", url: "https://csec.uz" }],
  },
  {
    id: "t11",
    num: 11,
    title: "Raqamli gid: kasbiy kompetensiyalar va virtual trenajyorda tayyorgarlik",
    icon: "🎓",
    hours: 6,
    goal: "Zamonaviy gidning raqamli kasbiy kompetensiyalari tarkibini aniqlash va virtual gidlik trenajyori yordamida kasbiy vaziyatlarda amaliy ko'nikmalarni shakllantirish.",
    plan: ["Raqamli gid kompetensiyalari modeli", "Ekskursiya texnikasi va metodikasi", "Nostandart vaziyatlarda gidning harakatlari", "Virtual gidlik trenajyori bilan ishlash", "Refleksiya va o'z-o'zini rivojlantirish"],
    sections: [
      {
        title: "1. Raqamli gid kompetensiyalari",
        html: `<p>Raqamli kasbiy kompetentlik komponentlari:</p>
<ul><li><b>Motivatsion-qadriyatli</b> — raqamli texnologiyalarni o'rganishga intilish, kasbiy qadriyatlar.</li><li><b>Kognitiv</b> — turizm axborot tizimlari, raqamli vositalar haqidagi bilimlar.</li><li><b>Operatsion-faoliyatli</b> — raqamli vositalardan amalda foydalanish ko'nikmalari.</li><li><b>Kommunikativ</b> — onlayn va oflayn muloqot, nizoli vaziyatlarni boshqarish.</li><li><b>Refleksiv</b> — o'z faoliyatini tahlil qilish va rivojlantirish.</li></ul>`,
      },
      {
        title: "2. Ekskursiya texnikasi",
        html: `<p>Ekskursiya metodik usullari: <b>ko'rsatish</b> (obyektni ko'rsatish usullari: dastlabki kuzatish, vizual rekonstruksiya, taqqoslash) va <b>hikoya qilish</b> (ma'lumot, sharh, savol-javob, iqtibos, afsona). Gid holati: guruhga yuzlanib turish, obyektni yopmaslik, ovoz va temp, vaqtni nazorat qilish.</p>`,
      },
      {
        title: "3. Nostandart vaziyatlar",
        html: `<p>Gid duch keladigan vaziyatlar: turistning adashishi, tibbiy holat, ob-havo, nizoli turist, texnik nosozlik, hujjat yo'qolishi. Umumiy algoritm: <b>xotirjamlik → xavfsizlik → baholash → aniq ko'rsatma → xabar berish (operator, xizmatlar) → hujjatlashtirish</b>. Favqulodda raqamlar: <b>112</b> (yagona), <b>101</b> (yong'in), <b>102</b> (politsiya), <b>103</b> (tez yordam).</p>`,
      },
      {
        title: "4. Virtual gidlik trenajyori",
        html: `<p>Platformadagi <a href="#/trainer">Virtual gidlik trenajyori</a> sun'iy intellekt asosida turist, mijoz yoki ekskursiya ishtirokchisi rolini o'ynaydi va sizni real vaqt rejimida turli kasbiy vaziyatlarga soladi. Mashg'ulot davomida <b>kutilmagan hodisalar</b> (yomg'ir, texnik nosozlik, turistning holati yomonlashuvi) yuz beradi. Yakunda AI 5 mezon bo'yicha 100 ballik baho va shaxsiy tavsiyalar beradi.</p>
<div class="callout">📌 Tavsiya: har bir ssenariyni kamida 2 marta bajaring va natijalarni solishtiring — bu refleksiv kompetensiyangizni rivojlantiradi.</div>`,
      },
      {
        title: "5. Refleksiya",
        html: `<p>Har bir ekskursiya yoki trenajyor mashg'ulotidan so'ng o'zingizga savol bering: <i>Nima yaxshi chiqdi? Nimani boshqacha qilardim? Qaysi bilimim yetishmadi? Keyingi safar nimani sinab ko'raman?</i> Javoblarni <a href="#/self-study">Mustaqil ta'lim</a> bo'limidagi kundalikka yozib boring.</p>`,
      },
    ],
    glossary: [
      { term: "Raqamli kasbiy kompetentlik", def: "Kasbiy vazifalarni raqamli texnologiyalar yordamida samarali hal qilish qobiliyati va tayyorligi." },
      { term: "Ekskursiya metodikasi", def: "Ekskursiyani tayyorlash va o'tkazish usullari majmui." },
      { term: "Vizual rekonstruksiya", def: "Obyektning avvalgi ko'rinishini turist tasavvurida tiklash usuli." },
      { term: "Refleksiya", def: "O'z faoliyatini tahlil qilish va baholash." },
      { term: "Trenajyor", def: "Kasbiy ko'nikmalarni xavfsiz, simulyatsiya qilingan muhitda mashq qilish vositasi." },
    ],
    methods: [
      {
        type: "ordering",
        id: "t11-order",
        title: "Favqulodda vaziyat algoritmi",
        instruction: "Gidning favqulodda vaziyatdagi harakatlarini to'g'ri tartibda joylashtiring.",
        items: ["Xotirjamlikni saqlash", "Xavfsizlikni ta'minlash", "Vaziyatni baholash", "Aniq ko'rsatma berish", "Tegishli xizmatlar va operatorga xabar berish", "Hodisani hujjatlashtirish"],
      },
      {
        type: "case",
        id: "t11-case",
        title: "Keys: \"Zerikkan o'smir\"",
        instruction: "Vaziyatni tahlil qiling.",
        text: "Oilaviy ekskursiyada 14 yoshli o'smir zerikib, telefonida o'yin o'ynamoqda va ota-onasi xijolat tortmoqda.",
        questions: ["O'smirni ekskursiyaga jalb qilish uchun qanday usullarni qo'llaysiz?", "Qaysi raqamli vositalar yordam berishi mumkin?"],
        model: "Unga savol berish, \"tadqiqotchi\" vazifasini berish (masalan, naqshlarda yashiringan hayvonni topish), AR-ilova yoki QR-viktorina, telefonida fotokvest, Instagram uchun eng yaxshi rakurslarni topishni so'rash.",
      },
      {
        type: "fsmu",
        id: "t11-fsmu",
        title: "FSMU: trenajyor va real tajriba",
        instruction: "Fikr bo'yicha FSMU texnikasini bajaring.",
        statement: "AI trenajyorida mashq qilish real ekskursiyaga tayyorgarlikni sezilarli oshiradi.",
      },
    ],
    quiz: [
      { q: "O'zbekistonda tez yordam raqami:", options: ["103", "101", "102", "104"], correct: 0 },
      { q: "Favqulodda vaziyatda gidning birinchi qadami:", options: ["Xotirjamlikni saqlash va xavfsizlikni ta'minlash", "Ijtimoiy tarmoqqa yozish", "Ekskursiyani davom ettirish", "Kutish"], correct: 0 },
      { q: "Raqamli kompetentlikning refleksiv komponenti:", options: ["O'z faoliyatini tahlil qilish va rivojlantirish", "Kompyuter sotib olish", "Ingliz tilini bilish", "Avtomobil haydash"], correct: 0 },
      { q: "Vizual rekonstruksiya — bu:", options: ["Obyektning avvalgi ko'rinishini tasavvurda tiklash", "Binoni ta'mirlash", "Video montaj", "Rasm chizish"], correct: 0 },
      { q: "Ekskursiya paytida gid qanday turishi kerak?", options: ["Guruhga yuzlanib, obyektni to'smasdan", "Guruhga orqa o'girib", "Obyekt oldida to'sib", "Avtobusda"], correct: 0 },
    ],
    selfStudy: [
      { id: "t11-s1", title: "Trenajyor natijalari tahlili (refleksiv esse)", type: "Refleksiv esse", description: "Trenajyordagi kamida 3 ta mashg'ulot natijalarini solishtiring: ballar dinamikasi, takrorlanayotgan xatolar, AI tavsiyalari va o'zingizning rivojlanish rejangiz." },
      { id: "t11-s2", title: "Gid portfeli", type: "Yakuniy loyiha", description: "Tanlagan ekskursiyangiz uchun to'liq raqamli gid portfelini tayyorlang: marshrut xaritasi, matn, ko'rgazmali materiallar (rasm, QR), interaktiv topshiriqlar, xavfsizlik rejasi." },
    ],
    resources: [],
  },
];

export const METHOD_INFO = {
  brainstorm: { name: "Aqliy hujum", icon: "💡", about: "G'oyalarni tanqidsiz, erkin va ko'p miqdorda yig'ish metodi." },
  cluster: { name: "Klaster", icon: "🕸️", about: "Tushunchalar o'rtasidagi bog'liqlikni grafik shaklda ifodalash metodi." },
  venn: { name: "Venn diagrammasi", icon: "⭕", about: "Ikki tushunchaning umumiy va farqli jihatlarini aniqlash metodi." },
  case: { name: "Keys-stadi", icon: "📁", about: "Real kasbiy vaziyatni tahlil qilib, yechim topish metodi." },
  fsmu: { name: "FSMU", icon: "🗣️", about: "Fikr → Sabab → Misol → Umumlashtirish: o'z fikrini asoslashga o'rgatuvchi texnika." },
  insert: { name: "INSERT", icon: "✍️", about: "Matnni belgilar yordamida faol, tanqidiy o'qish texnikasi." },
  matching: { name: "Moslashtirish", icon: "🔗", about: "Tushuncha va ta'riflarni o'zaro moslash mashqi." },
  tchart: { name: "T-jadval", icon: "⚖️", about: "Ikki qarama-qarshi jihatni (afzallik/kamchilik) taqqoslash grafik organayzeri." },
  ordering: { name: "Ketma-ketlik", icon: "🔢", about: "Jarayon bosqichlari yoki voqealarni to'g'ri tartibga keltirish mashqi." },
};
