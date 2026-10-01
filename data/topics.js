// "Turizmda raqamli texnologiyalar" fani mavzulari.
// DIQQAT: bu boshlang'ich (namunaviy) mazmun. Fan bo'yicha o'quv qo'llanma taqdim etilgach, har bir mavzu matni
// qo'llanmaga muvofiq almashtiriladi (yoki o'qituvchi panelidagi "Mavzular muharriri" orqali tahrirlanadi).
//
// Interaktiv metod turlari: klaster | venn | insert | blits | moslash | ketma | keys | fsmu | aqliy | bbb | sinkveyn

const topics = [
  // ================= 1-MODUL =================
  {
    slug: 'kirish',
    module: '1-modul. Raqamli turizm asoslari',
    title: 'Turizmda raqamli texnologiyalar faniga kirish',
    hours: 2,
    summary: 'Fanning maqsadi, vazifalari, raqamli transformatsiya tushunchasi va turizm sohasidagi raqamli kasbiy kompetensiyalar.',
    objectives: [
      'Raqamli transformatsiya va raqamli turizm tushunchalarini izohlay olish',
      'Turizm sohasidagi raqamli texnologiyalar turlarini tasniflash',
      'Bo\'lajak gid va turizm mutaxassisi uchun zarur raqamli kompetensiyalarni aniqlash',
    ],
    content: `## Fanning maqsadi va vazifalari

**"Turizmda raqamli texnologiyalar"** fanining maqsadi — turizm va madaniy meros texnikumlari o'quvchilarida zamonaviy raqamli vositalardan kasbiy faoliyatda samarali foydalanish kompetensiyasini shakllantirishdir.

Fanning asosiy vazifalari:
- turizmda qo'llaniladigan axborot tizimlari va raqamli platformalar bilan tanishtirish;
- onlayn bron, raqamli marketing, virtual ekskursiya kabi amaliy ko'nikmalarni shakllantirish;
- madaniy merosni raqamlashtirish va targ'ib qilish usullarini o'rgatish;
- raqamli muhitda xavfsizlik va kasb etikasi qoidalarini o'zlashtirish;
- virtual gidlik trenajyori orqali real kasbiy vaziyatlarda ishlash tajribasini hosil qilish.

## Raqamli transformatsiya va raqamli turizm

**Raqamli transformatsiya** — tashkilot faoliyatining barcha jabhalariga raqamli texnologiyalarni joriy etish orqali biznes jarayonlari, mahsulot va xizmatlarni tubdan yangilash.

**Raqamli turizm (e-turizm)** — turistik xizmatlarni rejalashtirish, bron qilish, ko'rsatish va baholashning barcha bosqichlarida raqamli texnologiyalardan foydalanish.

Zamonaviy turistning sayohat sikli raqamli bosqichlardan iborat:
1. **Ilhomlanish** — ijtimoiy tarmoqlar, video-bloglar, virtual turlar.
2. **Rejalashtirish** — qidiruv tizimlari, sharhlar, xaritalar.
3. **Bron qilish** — onlayn platformalar, mobil ilovalar, onlayn to'lov.
4. **Sayohat** — navigatsiya, audio-gid, QR-kodlar, tarjimon ilovalar.
5. **Taassurot ulashish** — sharhlar, foto/video, ijtimoiy tarmoqlar.

## Turizmdagi raqamli texnologiyalar tasnifi

| Guruh | Misollar |
|---|---|
| Axborot va bron tizimlari | GDS, PMS, onlayn bron platformalari |
| Mobil texnologiyalar | Navigatsiya, audio-gid, QR-kod, mobil to'lov |
| Immersiv texnologiyalar | VR, AR, 360° panorama, 3D-modellar |
| Intellektual texnologiyalar | Sun'iy intellekt, chat-botlar, katta ma'lumotlar |
| Kommunikatsion texnologiyalar | Ijtimoiy tarmoqlar, messenjerlar, videokonferensiya |

## Bo'lajak gidning raqamli kompetensiyalari

Raqamli kasbiy kompetensiya to'rt komponentdan iborat:
- **motivatsion** — raqamli texnologiyalarni o'rganishga intilish;
- **kognitiv** — raqamli vositalar haqidagi bilimlar;
- **faoliyatli** — ularni amalda qo'llay olish;
- **refleksiv** — o'z faoliyatini tahlil qilish va takomillashtirish.

> Platformadagi "Virtual gidlik trenajyori" aynan faoliyatli va refleksiv komponentlarni rivojlantirishga xizmat qiladi.`,
    keywords: [
      { term: 'Raqamli transformatsiya', definition: 'Faoliyatning barcha jabhalariga raqamli texnologiyalarni joriy etib, jarayon va xizmatlarni tubdan yangilash.' },
      { term: 'Raqamli turizm (e-turizm)', definition: 'Turistik xizmatlarning barcha bosqichlarida raqamli texnologiyalardan foydalanish.' },
      { term: 'Raqamli kompetensiya', definition: 'Raqamli vositalardan kasbiy maqsadlarda samarali, xavfsiz va mas\'uliyatli foydalanish qobiliyati.' },
      { term: 'Sayohat sikli', definition: 'Turistning ilhomlanishdan taassurot ulashishgacha bo\'lgan bosqichlari.' },
    ],
    methods: [
      { type: 'bbb', key: 'bbb1', title: '"Bilaman — Bilishni xohlayman — Bilib oldim" jadvali', instruction: 'Mavzuni o\'qishdan oldin birinchi ikki ustunni, o\'qigandan keyin uchinchi ustunni to\'ldiring.' },
      { type: 'klaster', key: 'kl1', title: 'Klaster: "Raqamli turizm"', instruction: 'Markaziy tushunchaga bog\'liq kamida 6 ta tushuncha (texnologiya, vosita, platforma) qo\'shing.', center: 'Raqamli turizm', sample: ['Onlayn bron', 'Virtual tur', 'Mobil ilova', 'QR-gid', 'SMM', 'Sun\'iy intellekt'] },
      { type: 'ketma', key: 'kt1', title: 'Ketma-ketlik: Turistning raqamli sayohat sikli', instruction: 'Bosqichlarni to\'g\'ri tartibga keltiring.', steps: ['Ilhomlanish', 'Rejalashtirish', 'Bron qilish', 'Sayohat', 'Taassurot ulashish'] },
    ],
    quiz: [
      { q: 'Raqamli turizm (e-turizm) nima?', options: ['Faqat onlayn chipta sotish', 'Turistik xizmatlarning barcha bosqichlarida raqamli texnologiyalardan foydalanish', 'Kompyuter o\'yinlari', 'Faqat virtual sayohat'], answer: 1, explanation: 'E-turizm rejalashtirishdan taassurot ulashishgacha bo\'lgan barcha bosqichlarni qamraydi.' },
      { q: 'Sayohat siklining birinchi bosqichi qaysi?', options: ['Bron qilish', 'Sayohat', 'Ilhomlanish', 'Sharh yozish'], answer: 2, explanation: 'Turist avval ilhomlanadi (ijtimoiy tarmoq, video, virtual tur).' },
      { q: 'VR, AR va 360° panoramalar qaysi texnologiyalar guruhiga kiradi?', options: ['Immersiv', 'Kommunikatsion', 'Bron tizimlari', 'Moliyaviy'], answer: 0, explanation: 'Immersiv texnologiyalar foydalanuvchini virtual muhitga "sho\'ng\'itadi".' },
      { q: 'Raqamli kompetensiyaning qaysi komponenti o\'z faoliyatini tahlil qilishni anglatadi?', options: ['Motivatsion', 'Kognitiv', 'Faoliyatli', 'Refleksiv'], answer: 3, explanation: 'Refleksiya — o\'z faoliyatini tahlil qilish va takomillashtirish.' },
      { q: 'PMS qaysi guruhga kiradi?', options: ['Immersiv texnologiyalar', 'Axborot va bron tizimlari', 'Ijtimoiy tarmoqlar', 'Sun\'iy intellekt'], answer: 1, explanation: 'PMS — mehmonxona boshqaruv tizimi, axborot tizimlari guruhiga kiradi.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Smartfoningizdagi turizmda foydali bo\'lishi mumkin bo\'lgan 5 ta ilovani tanlang va ularning sayohat siklining qaysi bosqichida qo\'llanishini jadval ko\'rinishida yozing.' },
    ],
    selfstudy: [
      { title: 'Esse: "Raqamli davr gidi qanday bo\'lishi kerak?"', description: '1–1,5 sahifalik esse yozing. Unda raqamli davrda gid kasbidagi o\'zgarishlar, zarur ko\'nikmalar va o\'zingizning rivojlanish rejangizni yoritib bering.', max_score: 10 },
    ],
    resources: [
      { title: 'UNWTO — Digital Transformation', url: 'https://www.unwto.org/digital-transformation' },
      { title: 'O\'zbekiston turizm portali', url: 'https://uzbekistan.travel' },
    ],
  },
  {
    slug: 'axborot-tizimlari',
    module: '1-modul. Raqamli turizm asoslari',
    title: 'Turizmda axborot tizimlari va texnologiyalari',
    hours: 2,
    summary: 'Axborot tizimi tushunchasi, turizm korxonalarida qo\'llaniladigan axborot tizimlari va ularning vazifalari.',
    objectives: [
      'Axborot tizimining tarkibiy qismlarini bilish',
      'Turoperator va turagent faoliyatida ishlatiladigan tizimlarni farqlash',
      'Bulutli texnologiyalar afzalliklarini tushuntirish',
    ],
    content: `## Axborot tizimi tushunchasi

**Axborot tizimi** — axborotni yig'ish, saqlash, qayta ishlash va uzatish uchun mo'ljallangan apparat, dasturiy ta'minot, ma'lumotlar, odamlar va jarayonlar majmuasi.

Axborot tizimining tarkibiy qismlari:
- **apparat ta'minoti** — kompyuterlar, serverlar, smartfonlar, tarmoq qurilmalari;
- **dasturiy ta'minot** — operatsion tizimlar va amaliy dasturlar;
- **ma'lumotlar bazasi** — mijozlar, turlar, narxlar, bronlar;
- **foydalanuvchilar** — menejerlar, gidlar, mijozlar;
- **jarayonlar** — bron qilish, to'lov, hisobot.

## Turizm korxonalaridagi axborot tizimlari

| Tizim | Vazifasi |
|---|---|
| CRS (markaziy bron tizimi) | Mehmonxona yoki aviakompaniyaning o'z bron tizimi |
| GDS (global distribyutsiya tizimi) | Aviachipta, mehmonxona, avtomobil ijarasini global miqyosda sotish |
| PMS | Mehmonxona ichki jarayonlarini boshqarish |
| CRM | Mijozlar bilan munosabatlarni boshqarish |
| Turoperator tizimlari | Tur paketlarini shakllantirish, narxlash, hujjatlar |
| Channel manager | Bir nechta onlayn platformalarda xonalar sonini sinxronlash |

## Bulutli texnologiyalar

**Bulutli texnologiyalar** — dasturlar va ma'lumotlarni internet orqali masofaviy serverlarda saqlash va ishlatish. Afzalliklari: istalgan joydan kirish, kam xarajat, avtomatik yangilanish, ma'lumotlarning zaxira nusxasi.

Gid uchun amaliy misol: ekskursiya materiallari, turistlar ro'yxati va marshrutlarni bulutli xotirada (Google Drive va h.k.) saqlash ularni istalgan vaqtda telefondan ochish imkonini beradi.

## Mobil texnologiyalar

Bugungi kunda turistlarning aksariyati sayohatni smartfon orqali rejalashtiradi. Gid uchun eng zarur mobil vositalar: xaritalar va navigatsiya, messenjerlar, tarjimon ilovalar, onlayn to'lov, audio-gid ilovalari.`,
    keywords: [
      { term: 'Axborot tizimi', definition: 'Axborotni yig\'ish, saqlash, qayta ishlash va uzatish uchun mo\'ljallangan vositalar va jarayonlar majmuasi.' },
      { term: 'CRM', definition: 'Customer Relationship Management — mijozlar bilan munosabatlarni boshqarish tizimi.' },
      { term: 'Channel manager', definition: 'Bir nechta onlayn bron kanallarida xonalar mavjudligi va narxlarni sinxronlovchi tizim.' },
      { term: 'Bulutli texnologiyalar', definition: 'Dastur va ma\'lumotlarni internet orqali masofaviy serverlarda saqlash va ishlatish.' },
    ],
    methods: [
      { type: 'moslash', key: 'm1', title: 'Moslashtirish: tizim va vazifa', instruction: 'Har bir tizimni uning vazifasi bilan moslang.', pairs: [
        { left: 'GDS', right: 'Aviachipta va mehmonxonalarni global miqyosda sotish' },
        { left: 'PMS', right: 'Mehmonxona ichki jarayonlarini boshqarish' },
        { left: 'CRM', right: 'Mijozlar bilan munosabatlarni boshqarish' },
        { left: 'Channel manager', right: 'Onlayn kanallarda xonalar sonini sinxronlash' },
        { left: 'CRS', right: 'Kompaniyaning o\'z markaziy bron tizimi' },
      ] },
      { type: 'insert', key: 'ins1', title: 'INSERT jadvali', instruction: 'Har bir fikrni belgilang: V — bilardim, + — yangi ma\'lumot, − — boshqacha o\'ylardim, ? — tushunarsiz.', statements: [
        'Axborot tizimi faqat kompyuter dasturlaridan iborat.',
        'GDS orqali aviachipta va mehmonxona bron qilinadi.',
        'Bulutli xotiradagi ma\'lumotga istalgan joydan kirish mumkin.',
        'Channel manager mehmonxonaga overbookingdan saqlanishga yordam beradi.',
      ] },
    ],
    quiz: [
      { q: 'Axborot tizimining tarkibiga nima kirmaydi?', options: ['Ma\'lumotlar bazasi', 'Foydalanuvchilar', 'Turistik obyektning devori', 'Dasturiy ta\'minot'], answer: 2, explanation: 'Axborot tizimi apparat, dastur, ma\'lumot, odamlar va jarayonlardan iborat.' },
      { q: 'CRM nima uchun mo\'ljallangan?', options: ['Mijozlar bilan munosabatlarni boshqarish', 'Xonalarni tozalash', 'Aviareyslarni boshqarish', 'Video montaj'], answer: 0, explanation: 'CRM — Customer Relationship Management.' },
      { q: 'Bir nechta onlayn platformalarda xonalar sonini sinxronlovchi tizim?', options: ['GDS', 'Channel manager', 'CRM', 'GPS'], answer: 1, explanation: 'Channel manager barcha kanallarda mavjud xonalarni bir xil saqlaydi.' },
      { q: 'Bulutli texnologiyalarning afzalligi?', options: ['Faqat bitta kompyuterda ishlaydi', 'Istalgan joydan kirish mumkin', 'Internet kerak emas', 'Ma\'lumot hech qachon saqlanmaydi'], answer: 1, explanation: 'Bulut — masofaviy serverlar, istalgan joydan internet orqali kirish.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Google Drive (yoki boshqa bulutli xizmat)da "Ekskursiya materiallari" papkasini yarating: marshrut, obyektlar haqida ma\'lumot va turistlar ro\'yxati shablonini joylashtiring, havolani o\'qituvchiga yuboring.' },
    ],
    selfstudy: [
      { title: 'Taqqoslash jadvali: turizm korxonasi axborot tizimlari', description: 'O\'zbekistondagi biror turistik kompaniya (yoki mehmonxona) misolida u foydalanayotgan (yoki foydalanishi mumkin bo\'lgan) 3 ta axborot tizimini tahlil qiling: nomi, vazifasi, afzalligi, kamchiligi.', max_score: 10 },
    ],
    resources: [],
  },
  {
    slug: 'internet-resurslar',
    module: '1-modul. Raqamli turizm asoslari',
    title: 'Turistik internet-resurslar va mobil ilovalar',
    hours: 2,
    summary: 'Turistik saytlar, portallar, sharh platformalari, xaritalar va gid uchun zarur mobil ilovalar.',
    objectives: [
      'Turistik internet-resurslarni turlariga ko\'ra tasniflash',
      'Ma\'lumotning ishonchliligini baholash',
      'Gid faoliyatida mobil ilovalardan foydalanish',
    ],
    content: `## Turistik internet-resurslar turlari

- **Rasmiy portallar** — davlat turizm portallari (masalan, uzbekistan.travel), muzeylar saytlari.
- **Onlayn sayohat agentliklari (OTA)** — Booking.com, Expedia, Trip.com.
- **Sharh platformalari** — Tripadvisor, Google Maps sharhlari.
- **Metaqidiruv tizimlari** — Skyscanner, Kayak, Trivago (narxlarni taqqoslaydi).
- **Kontent platformalari** — sayohat bloglari, YouTube, Instagram, TikTok.

## Ma'lumot ishonchliligini baholash

Gid turistlarga faqat tekshirilgan ma'lumot berishi kerak. Ishonchlilik mezonlari:
1. Manba muallifi va tashkiloti ma'lummi?
2. Ma'lumot sanasi yangimi?
3. Boshqa ishonchli manbalar bilan mos keladimi?
4. Ilmiy yoki rasmiy manbaga havola bormi?

## Gid uchun mobil ilovalar

| Vazifa | Ilovalar |
|---|---|
| Navigatsiya | Google Maps, Yandex Maps, Maps.me (oflayn) |
| Tarjima | Google Translate (ovoz, kamera, suhbat rejimi), Yandex Translate |
| Transport | Yandex Go, MyTaxi, temir yo'l chiptalari ilovasi |
| To'lov | Click, Payme, bank ilovalari |
| Muloqot | Telegram, WhatsApp (guruh chatlari) |
| Ob-havo | Ob-havo ilovalari, rasmiy ogohlantirishlar |

> Maslahat: ekskursiya oldidan oflayn xaritalarni yuklab oling — tog'li hududlarda internet bo'lmasligi mumkin.`,
    keywords: [
      { term: 'OTA', definition: 'Online Travel Agency — onlayn sayohat agentligi (Booking.com, Expedia).' },
      { term: 'Metaqidiruv', definition: 'Bir nechta platformalardagi narxlarni bir joyda taqqoslovchi qidiruv tizimi.' },
      { term: 'UGC', definition: 'User Generated Content — foydalanuvchilar yaratgan kontent (sharh, foto, video).' },
    ],
    methods: [
      { type: 'venn', key: 'v1', title: 'Venn diagrammasi: OTA va metaqidiruv tizimi', instruction: 'Har bir xususiyatni tegishli sohaga joylang.', a: 'OTA (Booking.com)', b: 'Metaqidiruv (Skyscanner)', items: [
        { text: 'Bron to\'g\'ridan-to\'g\'ri platformada amalga oshadi', answer: 'a' },
        { text: 'Turli saytlardagi narxlarni taqqoslaydi', answer: 'b' },
        { text: 'Internet orqali ishlaydi', answer: 'ab' },
        { text: 'Mehmonxonadan komissiya oladi', answer: 'a' },
        { text: 'Foydalanuvchini boshqa saytga yo\'naltiradi', answer: 'b' },
        { text: 'Mobil ilovasi mavjud', answer: 'ab' },
      ] },
      { type: 'blits', key: 'b1', title: 'Blits-so\'rov', instruction: 'Har bir fikr to\'g\'ri yoki noto\'g\'riligini tez aniqlang (har biriga 10 soniya).', seconds: 10, items: [
        { q: 'Maps.me ilovasi oflayn xaritalar bilan ishlay oladi.', a: true },
        { q: 'Tripadvisor — aviakompaniya.', a: false },
        { q: 'Skyscanner narxlarni taqqoslovchi metaqidiruv tizimi.', a: true },
        { q: 'Ijtimoiy tarmoqdagi har qanday ma\'lumot ishonchli.', a: false },
        { q: 'Google Translate kamera orqali yozuvlarni tarjima qila oladi.', a: true },
      ] },
    ],
    quiz: [
      { q: 'Booking.com qaysi turdagi resurs?', options: ['OTA', 'Metaqidiruv', 'Ijtimoiy tarmoq', 'GDS'], answer: 0, explanation: 'Booking.com — onlayn sayohat agentligi (OTA).' },
      { q: 'Oflayn xarita uchun qaysi ilova qulay?', options: ['Maps.me', 'Instagram', 'Payme', 'Zoom'], answer: 0, explanation: 'Maps.me xaritalarni oldindan yuklab, internetsiz ishlatish imkonini beradi.' },
      { q: 'Ma\'lumot ishonchliligini baholash mezoni emas:', options: ['Muallif ma\'lumligi', 'Ma\'lumot sanasi', 'Saytning rangi', 'Boshqa manbalar bilan mosligi'], answer: 2, explanation: 'Dizayn ishonchlilik mezoni emas.' },
      { q: 'UGC nima?', options: ['Foydalanuvchilar yaratgan kontent', 'Davlat portali', 'To\'lov tizimi', 'Bron tizimi'], answer: 0, explanation: 'User Generated Content — sharhlar, foto, videolar.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Buxoroda 3 kunlik sayohat uchun 3 xil manbadan (rasmiy portal, OTA, sharh platformasi) ma\'lumot to\'plang va ularni ishonchlilik mezonlari bo\'yicha baholang.' },
    ],
    selfstudy: [
      { title: '"Gidning raqamli ryukzagi"', description: 'Gid ishida foydali 10 ta mobil ilovadan iborat ro\'yxat tuzing: nomi, vazifasi, qaysi vaziyatda kerak bo\'lishi, bepul/pullik. Skrinshotlar bilan taqdimot (5–7 slayd) tayyorlang va havolasini yuboring.', max_score: 10 },
    ],
    resources: [{ title: 'Uzbekistan Travel', url: 'https://uzbekistan.travel' }],
  },

  // ================= 2-MODUL =================
  {
    slug: 'bron-tizimlari',
    module: '2-modul. Bron va boshqaruv tizimlari',
    title: 'Global distribyutsiya tizimlari (GDS) va onlayn bron platformalari',
    hours: 4,
    summary: 'Amadeus, Sabre, Travelport (Galileo) tizimlari, onlayn bron jarayoni, overbooking va bron tasdiqnomasi.',
    objectives: [
      'GDS ning vazifasi va asosiy tizimlarini bilish',
      'Onlayn bron jarayoni bosqichlarini bajarish',
      'Bron bilan bog\'liq muammoli vaziyatlarni hal qilish',
    ],
    content: `## Global distribyutsiya tizimlari (GDS)

**GDS** — aviakompaniyalar, mehmonxonalar, avtomobil ijarasi kompaniyalarining xizmatlarini butun dunyo bo'ylab sayohat agentliklariga real vaqt rejimida sotish imkonini beruvchi kompyuterlashgan tizim.

Yetakchi GDS tizimlari:
- **Amadeus** (Ispaniya, Madrid) — dunyodagi eng yirik GDS;
- **Sabre** (AQSh);
- **Travelport** (Galileo, Worldspan, Apollo tizimlari).

## Onlayn bron jarayoni

1. Qidiruv: yo'nalish, sanalar, mehmonlar soni.
2. Variantlarni taqqoslash: narx, joylashuv, reyting, sharhlar, bekor qilish shartlari.
3. Tanlash va ma'lumot kiritish: F.I.Sh., pasport, aloqa.
4. To'lov: oldindan, joyida yoki qisman.
5. **Tasdiqnoma (voucher)**: bron raqami, sanalar, xona turi, to'lov holati.

## Bron bilan bog'liq muammolar

- **Overbooking** — mavjud joylardan ko'proq bron qabul qilinishi. Bunda mehmonxona mehmonni teng yoki yuqori toifadagi muqobil joyga o'z hisobidan joylashtirishi (re-accommodation) qabul qilingan amaliyot.
- **No-show** — mehmon bron qilib, kelmasligi.
- **Bekor qilish siyosati** — bepul bekor qilish muddati, jarimalar.

> Trenajyorda "Mehmonxonada bron muammosi (overbooking)" ssenariysida ushbu bilimlaringizni sinab ko'ring.`,
    keywords: [
      { term: 'GDS', definition: 'Global Distribution System — sayohat xizmatlarini global miqyosda sotuvchi kompyuterlashgan tizim.' },
      { term: 'Overbooking', definition: 'Mavjud joylardan ko\'proq bron qabul qilish.' },
      { term: 'No-show', definition: 'Bron qilgan mijozning ogohlantirmasdan kelmasligi.' },
      { term: 'Voucher (tasdiqnoma)', definition: 'Bron qilingan xizmatni tasdiqlovchi hujjat.' },
    ],
    methods: [
      { type: 'ketma', key: 'k1', title: 'Onlayn bron bosqichlari', instruction: 'Bosqichlarni to\'g\'ri tartibda joylashtiring.', steps: ['Qidiruv parametrlarini kiritish', 'Variantlarni taqqoslash', 'Mehmon ma\'lumotlarini kiritish', 'To\'lovni amalga oshirish', 'Tasdiqnomani olish'] },
      { type: 'keys', key: 'c1', title: 'Keys-stadi: "Overbooking"', situation: 'Siz Buxorodagi mehmonxonaga 15 kishilik guruhni olib keldingiz. Ma\'mur 4 ta xona ortiqcha bron qilinganini, ularni bera olmasligini aytdi. Soat 21:00, guruh charchagan.', questions: ['Birinchi navbatda qanday harakat qilasiz?', 'Mehmonxonadan nimani talab qilasiz?', 'Turistlarga vaziyatni qanday tushuntirasiz?', 'Qaysi raqamli vositalar yordam beradi?'] },
    ],
    quiz: [
      { q: 'Quyidagilardan qaysi biri GDS?', options: ['Amadeus', 'Instagram', 'Payme', 'Zoom'], answer: 0, explanation: 'Amadeus — eng yirik GDS.' },
      { q: 'Overbooking nima?', options: ['Bronni bekor qilish', 'Mavjud joylardan ko\'proq bron qabul qilish', 'Mehmonning kelmasligi', 'Chegirma'], answer: 1, explanation: 'Overbooking — ortiqcha bron.' },
      { q: 'No-show nimani anglatadi?', options: ['Mehmon bron qilib kelmadi', 'Mehmonxona yopiq', 'Xona ta\'mirda', 'Reys bekor qilindi'], answer: 0, explanation: 'No-show — ogohlantirmasdan kelmaslik.' },
      { q: 'Bron tasdiqnomasida odatda nima ko\'rsatilmaydi?', options: ['Bron raqami', 'Sanalar', 'Mehmonning sevimli rangi', 'Xona turi'], answer: 2, explanation: 'Tasdiqnomada bronga oid rasmiy ma\'lumotlar bo\'ladi.' },
      { q: 'Galileo qaysi kompaniyaga tegishli?', options: ['Sabre', 'Travelport', 'Amadeus', 'Booking'], answer: 1, explanation: 'Galileo — Travelport tarkibidagi tizim.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Booking.com yoki boshqa platformada (bron qilmasdan) Samarqandda 2 kecha uchun 3 ta mehmonxonani tanlab, narx, reyting, bekor qilish shartlari va masofani taqqoslovchi jadval tuzing.' },
    ],
    selfstudy: [
      { title: 'Keys yechimi: guruh uchun bron', description: '20 kishilik maktab o\'quvchilari guruhi uchun Toshkent–Samarqand–Buxoro 4 kunlik turning joylashtirish va transport bronini rejalashtiring. Qaysi platformalardan foydalanishingizni, taxminiy xarajatlarni va xavflarni (overbooking, kechikish) qanday kamaytirishingizni yozing.', max_score: 15 },
    ],
    resources: [{ title: 'Amadeus', url: 'https://amadeus.com' }],
  },
  {
    slug: 'pms',
    module: '2-modul. Bron va boshqaruv tizimlari',
    title: 'Mehmonxona boshqaruv tizimlari (PMS) va CRM',
    hours: 2,
    summary: 'PMS modullari, mehmonni joylashtirish va chiqarish jarayonlari, mijoz bilan ishlashda CRM tizimlari.',
    objectives: [
      'PMS ning asosiy modullarini bilish',
      'Check-in va check-out jarayonlarini raqamli tizimda tasavvur qilish',
      'Mijoz shikoyatlarini CRM orqali boshqarish tamoyillarini tushunish',
    ],
    content: `## PMS (Property Management System)

**PMS** — mehmonxonaning kundalik faoliyatini avtomatlashtiruvchi dasturiy ta'minot. Mashhur tizimlar: Opera (Oracle), Fidelio, Shelter, Cloudbeds, Bnovo.

Asosiy modullari:
- **Front office** — bron, joylashtirish (check-in), chiqarish (check-out);
- **Housekeeping** — xonalar holati (toza, iflos, ta'mirda);
- **Hisob-kitob** — schyotlar, to'lovlar, hisobotlar;
- **Revenue management** — narxlarni boshqarish;
- **Integratsiya** — channel manager, onlayn bron, POS-terminallar.

## CRM va mijoz tajribasi

**CRM** tizimi mijozning tarixini (avvalgi tashriflar, istaklar, shikoyatlar) saqlaydi va shaxsiylashtirilgan xizmat ko'rsatishga yordam beradi.

Shikoyat bilan ishlash modeli (**LEARN**):
- **L**isten — tinglash;
- **E**mpathize — hamdardlik bildirish;
- **A**pologize — kechirim so'rash;
- **R**eact — chora ko'rish;
- **N**otify — natija haqida xabardor qilish va kuzatib borish.`,
    keywords: [
      { term: 'PMS', definition: 'Property Management System — mehmonxona boshqaruv tizimi.' },
      { term: 'Check-in / check-out', definition: 'Mehmonni joylashtirish / chiqarish jarayoni.' },
      { term: 'Housekeeping', definition: 'Xonalar tozaligi va holatini boshqarish xizmati.' },
      { term: 'LEARN modeli', definition: 'Shikoyat bilan ishlash: tinglash, hamdardlik, kechirim, chora, xabardor qilish.' },
    ],
    methods: [
      { type: 'ketma', key: 'k1', title: 'LEARN modeli bosqichlari', instruction: 'Bosqichlarni to\'g\'ri tartibda joylashtiring.', steps: ['Tinglash', 'Hamdardlik bildirish', 'Kechirim so\'rash', 'Chora ko\'rish', 'Natija haqida xabardor qilish'] },
      { type: 'fsmu', key: 'f1', title: 'FSMU: "Har bir mehmonxona PMS dan foydalanishi shart"', statement: 'Har bir mehmonxona, hatto kichik oilaviy mehmon uyi ham PMS dan foydalanishi shart.' },
    ],
    quiz: [
      { q: 'PMS ning qaysi moduli xonalar tozaligini boshqaradi?', options: ['Front office', 'Housekeeping', 'Revenue', 'POS'], answer: 1, explanation: 'Housekeeping — xonalar holati.' },
      { q: 'LEARN modelidagi "E" harfi nimani bildiradi?', options: ['Empathize — hamdardlik', 'Explain — tushuntirish', 'Exit — chiqish', 'Email'], answer: 0, explanation: 'Empathize — hamdardlik bildirish.' },
      { q: 'Quyidagilardan qaysi biri PMS?', options: ['Opera', 'Skyscanner', 'Telegram', 'Maps.me'], answer: 0, explanation: 'Oracle Opera — keng tarqalgan PMS.' },
    ],
    practice: [
      { title: 'Rolli o\'yin', text: 'Juftlikda: biri ma\'mur, biri shikoyatchi mehmon. LEARN modeli asosida 5 daqiqalik suhbat o\'tkazing, so\'ng rollarni almashtiring.' },
    ],
    selfstudy: [
      { title: 'PMS demo-versiyasini o\'rganish', description: 'Istalgan bulutli PMS (masalan, Cloudbeds, Bnovo) ning demo-videosini ko\'rib, uning 5 ta asosiy funksiyasini skrinshotlar bilan tavsiflang.', max_score: 10 },
    ],
    resources: [],
  },

  // ================= 3-MODUL =================
  {
    slug: 'raqamli-marketing',
    module: '3-modul. Raqamli marketing va kommunikatsiya',
    title: 'Turizmda raqamli marketing va ijtimoiy tarmoqlar (SMM)',
    hours: 4,
    summary: 'Raqamli marketing kanallari, SMM, kontent-reja, onlayn obro\' boshqaruvi va sharhlar bilan ishlash.',
    objectives: [
      'Raqamli marketing kanallarini farqlash',
      'Turistik mahsulot uchun kontent-reja tuzish',
      'Salbiy sharhlarga professional javob yozish',
    ],
    content: `## Raqamli marketing kanallari

- **SEO** — qidiruv tizimlarida saytni yuqori o'ringa olib chiqish;
- **Kontekst reklama** — qidiruv natijalaridagi pullik e'lonlar;
- **SMM** — ijtimoiy tarmoqlarda marketing (Instagram, Facebook, TikTok, Telegram, YouTube);
- **E-mail marketing** — obunachilarga xabarnomalar;
- **Influenser-marketing** — blogerlar orqali targ'ibot.

## Kontent-reja

Kontent-reja — qaysi kuni, qaysi platformada, qanday formatda (foto, video, reels, story) va qanday mavzuda post chiqarilishini belgilovchi jadval.

Kontent turlari nisbati (tavsiya):
- 40% — foydali/ma'rifiy (tarix, maslahatlar);
- 30% — ko'ngilochar (qiziqarli faktlar, sahna ortidan);
- 20% — ijtimoiy isbot (sharhlar, turistlar fotolari);
- 10% — sotuv (turlar, aksiyalar).

## Onlayn obro' boshqaruvi

Sharhlarga javob berish qoidalari:
1. Har bir sharhga (ijobiy va salbiy) 24–48 soat ichida javob bering.
2. Mijozga murojaat qiling, rahmat ayting.
3. Salbiy sharhda bahslashmang: kechirim so'rang, aniq chora ayting.
4. Muhokamani shaxsiy kanalga o'tkazishni taklif qiling.

> Trenajyordagi "Talabchan VIP mijoz va onlayn obro'" ssenariysi ushbu mavzuga bag'ishlangan.`,
    keywords: [
      { term: 'SMM', definition: 'Social Media Marketing — ijtimoiy tarmoqlar orqali marketing.' },
      { term: 'SEO', definition: 'Search Engine Optimization — saytni qidiruv tizimlari uchun optimallashtirish.' },
      { term: 'Kontent-reja', definition: 'Postlar jadvali: sana, platforma, format, mavzu.' },
      { term: 'Influenser', definition: 'Ijtimoiy tarmoqlarda katta auditoriyaga ega, fikri ta\'sirli shaxs.' },
    ],
    methods: [
      { type: 'aqliy', key: 'a1', title: 'Aqliy hujum: "Xiva uchun viral video g\'oyalari"', question: 'Xivaga yosh turistlarni jalb qilish uchun TikTok/Reels videolari uchun imkon qadar ko\'p g\'oya yozing.' },
      { type: 'keys', key: 'c1', title: 'Keys: salbiy sharh', situation: 'Tripadvisorda: "Gid 30 daqiqa kechikdi, tarixni yuzaki gapirdi, pulimga achinaman. 1 yulduz." Siz kompaniya nomidan javob yozishingiz kerak.', questions: ['Javob matnini yozing (5–7 gap).', 'Ichki ravishda qanday choralar ko\'rasiz?'] },
      { type: 'sinkveyn', key: 's1', title: 'Sinkveyn: "SMM"', word: 'SMM' },
    ],
    quiz: [
      { q: 'SMM nima?', options: ['Ijtimoiy tarmoqlarda marketing', 'Mehmonxona tizimi', 'Bron tizimi', 'Xarita'], answer: 0, explanation: 'Social Media Marketing.' },
      { q: 'Salbiy sharhga javobda nima qilish kerak emas?', options: ['Kechirim so\'rash', 'Bahslashish va ayblash', 'Chora haqida aytish', 'Rahmat aytish'], answer: 1, explanation: 'Bahslashish obro\'ga zarar yetkazadi.' },
      { q: 'Tavsiya etilgan kontentda eng katta ulush qaysi turga to\'g\'ri keladi?', options: ['Sotuv', 'Foydali/ma\'rifiy', 'Reklama', 'Narxlar'], answer: 1, explanation: 'Taxminan 40% foydali kontent.' },
      { q: 'SEO ning maqsadi?', options: ['Saytni qidiruvda yuqoriga chiqarish', 'Chipta sotish', 'Video montaj', 'Xona tozalash'], answer: 0, explanation: 'Search Engine Optimization.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Bir haftalik (7 post) kontent-reja tuzing: o\'zingiz yashaydigan hududdagi turistik obyektni targ\'ib qilish uchun.' },
    ],
    selfstudy: [
      { title: 'Turistik obyekt uchun SMM-loyiha', description: 'Tanlangan madaniy meros obyekti uchun: 1) maqsadli auditoriya tavsifi, 2) 2 haftalik kontent-reja, 3) 3 ta tayyor post (matn + rasm/video g\'oyasi), 4) samaradorlik ko\'rsatkichlari (KPI). Havola yoki matn ko\'rinishida yuboring.', max_score: 15 },
    ],
    resources: [],
  },

  // ================= 4-MODUL =================
  {
    slug: 'vr-ar',
    module: '4-modul. Immersiv texnologiyalar va virtual gidlik',
    title: 'Virtual va to\'ldirilgan reallik (VR/AR) turizmda',
    hours: 4,
    summary: 'VR, AR, MR tushunchalari, qurilmalar, turizm va muzey ishida qo\'llanilishi, afzallik va cheklovlar.',
    objectives: [
      'VR, AR va MR ni farqlay olish',
      'Turizmda immersiv texnologiyalarni qo\'llash misollarini keltirish',
      'Madaniy meros obyekti uchun AR-loyiha g\'oyasini ishlab chiqish',
    ],
    content: `## Asosiy tushunchalar

- **Virtual reallik (VR)** — foydalanuvchini to'liq sun'iy muhitga "sho'ng'ituvchi" texnologiya (VR ko'zoynak/shlem).
- **To'ldirilgan reallik (AR)** — real dunyo tasviri ustiga raqamli obyektlarni qo'shish (smartfon kamerasi, AR ko'zoynak).
- **Aralash reallik (MR)** — real va virtual obyektlarning o'zaro ta'sirlashuvi.
- **360° panorama / video** — barcha yo'nalishlarni ko'rish imkonini beruvchi sferik tasvir.

## Turizmda qo'llanilishi

| Yo'nalish | Misol |
|---|---|
| Marketing | Mehmonxona xonalari va obyektlarning virtual turi — "sotib olishdan oldin sinab ko'rish" |
| Madaniy meros | Vayron bo'lgan obyektlarni AR orqali "tiklash" (masalan, Oqsaroyning dastlabki ko'rinishi) |
| Muzeylar | Eksponatlarni "jonlantirish", interaktiv ekspozitsiyalar |
| Ta'lim | Gidlarni virtual muhitda tayyorlash, trenajyorlar |
| Inklyuziv turizm | Harakatlanishi cheklangan insonlar uchun virtual sayohat |

## Afzalliklar va cheklovlar

**Afzalliklar:** yangi auditoriyani jalb qilish, obyektga yuklamani kamaytirish, ta'limiy samaradorlik, masofadan kirish.

**Cheklovlar:** qurilmalar narxi, "kiberkasallik" (bosh aylanishi), real tajribani to'liq almashtira olmasligi, texnik xizmat ko'rsatish zarurati.`,
    keywords: [
      { term: 'VR', definition: 'Virtual Reality — to\'liq sun\'iy raqamli muhit.' },
      { term: 'AR', definition: 'Augmented Reality — real dunyo ustiga raqamli qatlam qo\'shish.' },
      { term: 'MR', definition: 'Mixed Reality — real va virtual obyektlarning o\'zaro ta\'siri.' },
      { term: 'Immersivlik', definition: 'Foydalanuvchining virtual muhitga "sho\'ng\'ish" darajasi.' },
    ],
    methods: [
      { type: 'venn', key: 'v1', title: 'Venn diagrammasi: VR va AR', instruction: 'Xususiyatlarni tegishli sohaga joylang.', a: 'VR', b: 'AR', items: [
        { text: 'Foydalanuvchi real muhitni ko\'rmaydi', answer: 'a' },
        { text: 'Smartfon kamerasi orqali ishlashi mumkin', answer: 'b' },
        { text: 'Raqamli kontentdan foydalanadi', answer: 'ab' },
        { text: 'Real obyekt ustiga ma\'lumot chiqaradi', answer: 'b' },
        { text: 'Odatda maxsus shlem talab qiladi', answer: 'a' },
        { text: 'Turizm marketingida qo\'llaniladi', answer: 'ab' },
      ] },
      { type: 'klaster', key: 'kl1', title: 'Klaster: "Immersiv texnologiyalar muzeyda"', instruction: 'Muzeyda immersiv texnologiyalarni qo\'llash g\'oyalarini qo\'shing.', center: 'Immersiv muzey', sample: ['AR eksponat', 'VR zal', '360° tur', 'Golografiya', 'Interaktiv ekran'] },
    ],
    quiz: [
      { q: 'Real dunyo ustiga raqamli obyekt qo\'shuvchi texnologiya?', options: ['VR', 'AR', 'GDS', 'PMS'], answer: 1, explanation: 'AR — to\'ldirilgan reallik.' },
      { q: 'VR ning cheklovi?', options: ['Kiberkasallik', 'Arzonligi', 'Internetsiz ishlamasligi doimo', 'Faqat matn ko\'rsatishi'], answer: 0, explanation: 'Ba\'zi foydalanuvchilarda bosh aylanishi kuzatiladi.' },
      { q: 'Vayron bo\'lgan obyektni "tiklab" ko\'rsatish uchun eng mos texnologiya?', options: ['AR', 'E-mail', 'CRM', 'SEO'], answer: 0, explanation: 'AR real joy ustiga qayta tiklangan modelni chiqaradi.' },
      { q: 'MR nima?', options: ['Aralash reallik', 'Marketing reja', 'Mehmonxona reytingi', 'Mobil reklama'], answer: 0, explanation: 'Mixed Reality.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Google Arts & Culture yoki boshqa platformada O\'zbekistondagi biror obyektning 360° turini ko\'rib chiqing va turistlar uchun 5 ta qiziqarli nuqtani belgilang.' },
    ],
    selfstudy: [
      { title: 'AR-loyiha g\'oyasi', description: 'Tanlangan madaniy meros obyekti uchun AR-ilova konsepsiyasini tayyorlang: maqsad, foydalanuvchi, 3 ta asosiy funksiya, ekran eskizlari (qo\'lda chizilgan bo\'lishi mumkin), kutilgan natija.', max_score: 15 },
    ],
    resources: [{ title: 'Google Arts & Culture', url: 'https://artsandculture.google.com' }],
  },
  {
    slug: 'virtual-ekskursiya',
    module: '4-modul. Immersiv texnologiyalar va virtual gidlik',
    title: 'Virtual ekskursiya: tayyorlash va o\'tkazish metodikasi',
    hours: 4,
    summary: 'Virtual ekskursiya turlari, ssenariy tuzish, texnik vositalar, onlayn auditoriya bilan ishlash va nosozliklarda harakat.',
    objectives: [
      'Virtual ekskursiya turlarini farqlash',
      'Virtual ekskursiya ssenariysini tuzish',
      'Onlayn auditoriyani boshqarish va texnik nosozliklarda harakat qilish',
    ],
    content: `## Virtual ekskursiya turlari

1. **Jonli onlayn ekskursiya** — gid joyida turib videokonferensiya orqali olib boradi.
2. **Studiyadan panoramali ekskursiya** — gid 360° panoramalar, fotosuratlar va video asosida olib boradi.
3. **Avtonom virtual tur** — foydalanuvchi o'zi mustaqil "yuradi" (sayt, VR ilova).
4. **Gibrid ekskursiya** — bir vaqtning o'zida real va onlayn guruh bilan ishlash.

## Ssenariy tuzish bosqichlari

1. Maqsad va auditoriyani aniqlash (yoshi, tili, qiziqishlari).
2. Mavzu va marshrut (5–7 nuqta).
3. Har bir nuqta uchun: ko'rgazmali material + hikoya + interaktiv element (savol, so'rov).
4. Vaqt taqsimoti (odatda 30–45 daqiqa).
5. Texnik tekshiruv va zaxira reja.
6. Yakun: xulosa, savol-javob, keyingi qadam (real tur bron havolasi).

## Texnik vositalar

- Videokonferensiya: Zoom, Google Meet, Microsoft Teams;
- Kontent: 360° panorama, dron videolari, 3D-modellar;
- Interaktiv: onlayn so'rovlar (poll), viktorinalar, chat;
- Uskunalar: yaxshi mikrofon, barqaror internet (zaxira mobil internet), stabilizator.

## Nosozlikda harakat qilish

- Xotirjamlikni saqlang, auditoriyani xabardor qiling;
- zaxira kanalga o'ting (mobil internet, oldindan yuklangan video);
- texnik pauza vaqtida og'zaki hikoya yoki savol-javob o'tkazing.

> Trenajyordagi "Onlayn virtual ekskursiya: Shahrisabz, Oqsaroy" ssenariysida mashq qiling.`,
    keywords: [
      { term: 'Virtual ekskursiya', definition: 'Raqamli vositalar orqali masofadan o\'tkaziladigan ekskursiya.' },
      { term: 'Gibrid ekskursiya', definition: 'Real va onlayn guruh bilan bir vaqtda o\'tkaziladigan ekskursiya.' },
      { term: 'Poll', definition: 'Onlayn tezkor so\'rov.' },
    ],
    methods: [
      { type: 'ketma', key: 'k1', title: 'Virtual ekskursiya ssenariysini tuzish bosqichlari', instruction: 'To\'g\'ri tartibga keltiring.', steps: ['Maqsad va auditoriyani aniqlash', 'Mavzu va marshrutni tanlash', 'Nuqtalar uchun material va hikoya tayyorlash', 'Vaqtni taqsimlash', 'Texnik tekshiruv va zaxira reja', 'Yakunlash va keyingi qadam'] },
      { type: 'keys', key: 'c1', title: 'Keys: aloqa uzildi', situation: 'Siz Germaniyadagi 60 kishilik auditoriyaga Samarqanddan jonli efir o\'tkazyapsiz. 10-daqiqada internet uzildi, 2 daqiqadan so\'ng qayta ulandingiz, chatda 15 kishi chiqib ketgan.', questions: ['Qayta ulanganingizda nima deysiz?', 'Bunday holatning oldini olish uchun qanday tayyorgarlik ko\'rish kerak edi?'] },
    ],
    quiz: [
      { q: 'Real va onlayn guruh bilan bir vaqtda o\'tkaziladigan ekskursiya?', options: ['Avtonom', 'Gibrid', 'Klassik', 'Piyoda'], answer: 1, explanation: 'Gibrid ekskursiya.' },
      { q: 'Virtual ekskursiyaning tavsiya etilgan davomiyligi?', options: ['5 daqiqa', '30–45 daqiqa', '3 soat', '8 soat'], answer: 1, explanation: 'Onlayn diqqatni ushlab turish uchun 30–45 daqiqa maqbul.' },
      { q: 'Texnik nosozlikda birinchi qilinadigan ish?', options: ['Efirni to\'xtatib ketish', 'Xotirjam bo\'lib auditoriyani xabardor qilish', 'Hech narsa demaslik', 'Auditoriyani ayblash'], answer: 1, explanation: 'Auditoriya bilan aloqani saqlash muhim.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Kichik guruhlarda o\'z hududingizdagi obyekt bo\'yicha 10 daqiqalik virtual ekskursiya ssenariysini tuzing va sinfdoshlaringizga Google Meet orqali o\'tkazing.' },
    ],
    selfstudy: [
      { title: 'Virtual ekskursiya ssenariysi', description: '30 daqiqalik virtual ekskursiya to\'liq ssenariysini tayyorlang (jadval: nuqta, vaqt, vizual material, gid matni, interaktiv element). Material havolalarini ilova qiling.', max_score: 20 },
    ],
    resources: [],
  },
  {
    slug: 'raqamli-meros',
    module: '4-modul. Immersiv texnologiyalar va virtual gidlik',
    title: 'Madaniy merosni raqamlashtirish',
    hours: 2,
    summary: '3D-skanerlash, fotogrammetriya, raqamli arxivlar, QR va audio-gidlar; O\'zbekistonning YUNESKO ro\'yxatidagi obyektlari.',
    objectives: [
      'Madaniy merosni raqamlashtirish usullarini bilish',
      'O\'zbekistonning YUNESKO Butunjahon merosi obyektlarini sanab o\'tish',
      'Obyekt uchun QR-kodli axborot materiali tayyorlash',
    ],
    content: `## Raqamlashtirish usullari

- **3D-lazerli skanerlash** — obyektning aniq geometrik modelini olish;
- **Fotogrammetriya** — ko'plab fotosuratlardan 3D-model yaratish;
- **360° panorama va dron suratlari**;
- **Raqamli arxivlar va kutubxonalar** — qo'lyozmalar, tarixiy hujjatlar;
- **QR-kod va audio-gidlar** — obyekt yonida qisqa ma'lumot va audio hikoya.

## O'zbekistonning YUNESKO Butunjahon merosi obyektlari

| Obyekt | Ro'yxatga kiritilgan yili |
|---|---|
| Xiva — Ichan qal'a | 1990 |
| Buxoro tarixiy markazi | 1993 |
| Shahrisabz tarixiy markazi | 2000 |
| Samarqand — madaniyatlar chorrahasi | 2001 |
| G'arbiy Tyan-Shan (tabiiy, transchegaraviy) | 2016 |
| Ipak yo'li: Zarafshon–Qoraqum yo'lagi (transchegaraviy) | 2023 |

## Raqamlashtirishning ahamiyati

- obyektni kelajak avlodlar uchun saqlab qolish (zilzila, eroziya xavfi);
- restavratsiya uchun aniq ma'lumot;
- turistlar uchun interaktiv kontent va masofadan kirish;
- ilmiy tadqiqotlar uchun ochiq manba.`,
    keywords: [
      { term: 'Fotogrammetriya', definition: 'Ko\'p sonli fotosuratlar asosida 3D-model yaratish usuli.' },
      { term: 'Raqamli arxiv', definition: 'Hujjat va obyektlarning raqamli nusxalari saqlanadigan elektron to\'plam.' },
      { term: 'YUNESKO Butunjahon merosi', definition: 'Insoniyat uchun alohida qadrli madaniy va tabiiy obyektlar ro\'yxati.' },
    ],
    methods: [
      { type: 'moslash', key: 'm1', title: 'Obyekt va YUNESKO ro\'yxatiga kiritilgan yil', instruction: 'Moslang.', pairs: [
        { left: 'Ichan qal\'a', right: '1990' },
        { left: 'Buxoro tarixiy markazi', right: '1993' },
        { left: 'Shahrisabz tarixiy markazi', right: '2000' },
        { left: 'Samarqand — madaniyatlar chorrahasi', right: '2001' },
      ] },
      { type: 'insert', key: 'ins1', title: 'INSERT jadvali', instruction: 'Fikrlarni belgilang (V, +, −, ?).', statements: [
        'Fotogrammetriya uchun maxsus lazerli skaner shart.',
        'Raqamlashtirish restavratsiya ishlariga yordam beradi.',
        'Ichan qal\'a O\'zbekistonda birinchi bo\'lib YUNESKO ro\'yxatiga kiritilgan.',
        'QR-kod orqali turist audio-gidni tinglashi mumkin.',
      ] },
    ],
    quiz: [
      { q: 'O\'zbekistonda birinchi bo\'lib YUNESKO ro\'yxatiga kiritilgan obyekt?', options: ['Ichan qal\'a', 'Buxoro', 'Samarqand', 'Shahrisabz'], answer: 0, explanation: 'Ichan qal\'a — 1990-yil.' },
      { q: 'Ko\'plab fotosuratlardan 3D-model yaratish usuli?', options: ['Fotogrammetriya', 'SEO', 'CRM', 'GDS'], answer: 0, explanation: 'Fotogrammetriya.' },
      { q: 'Samarqand YUNESKO ro\'yxatiga qachon kiritilgan?', options: ['1990', '1993', '2001', '2016'], answer: 2, explanation: '2001-yil.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Bepul QR-generator yordamida tanlangan obyekt haqidagi qisqa ma\'lumot (yoki audio fayl havolasi) uchun QR-kod yarating va axborot taxtachasi maketini tayyorlang.' },
    ],
    selfstudy: [
      { title: 'Audio-gid tayyorlash', description: 'Tanlangan obyekt haqida 2–3 daqiqalik audio-gid yozib oling (o\'zbek va bitta xorijiy tilda), matnini ham yuboring. Audio faylni bulutga joylab havolasini qoldiring.', max_score: 15 },
    ],
    resources: [{ title: 'UNESCO — Uzbekistan', url: 'https://whc.unesco.org/en/statesparties/uz' }],
  },

  // ================= 5-MODUL =================
  {
    slug: 'suniy-intellekt',
    module: '5-modul. Sun\'iy intellekt, ma\'lumotlar va xavfsizlik',
    title: 'Sun\'iy intellekt turizmda',
    hours: 4,
    summary: 'Sun\'iy intellekt tushunchasi, chat-botlar, shaxsiylashtirish, tarjima, marshrut tuzish; SI dan mas\'uliyatli foydalanish.',
    objectives: [
      'Turizmda sun\'iy intellekt qo\'llanilish yo\'nalishlarini bilish',
      'SI vositalaridan kasbiy maqsadda to\'g\'ri foydalanish (prompt yozish)',
      'SI javoblarini tanqidiy tekshirish',
    ],
    content: `## Sun'iy intellekt tushunchasi

**Sun'iy intellekt (SI)** — inson intellektiga xos vazifalarni (matnni tushunish, tarjima, tasvirni tanish, qaror qabul qilish) bajara oladigan kompyuter tizimlari. **Katta til modellari** (masalan, Claude) matn yaratish, savollarga javob berish va suhbat olib borishga qodir.

## Turizmda qo'llanilishi

- **Chat-botlar va virtual yordamchilar** — 24/7 mijozlarga javob, bron;
- **Shaxsiylashtirish** — turistning qiziqishlariga mos tavsiyalar;
- **Tarjima** — real vaqtdagi ovozli tarjima;
- **Marshrut tuzish** — vaqt, byudjet va qiziqishlarga mos reja;
- **Narxlarni dinamik boshqarish** — talabga qarab narx belgilash;
- **Ta'lim** — gidlarni tayyorlash trenajyorlari (masalan, ushbu platformadagi virtual gidlik trenajyori).

## SI bilan ishlash: yaxshi so'rov (prompt) yozish

Yaxshi so'rov tarkibi:
1. **Rol**: "Sen tajribali gid-metodistsan..."
2. **Vazifa**: "...Samarqand bo'yicha 1 kunlik marshrut tuz"
3. **Kontekst**: "turistlar — 60 yoshdan oshgan, yurish qiyin"
4. **Format**: "jadval ko'rinishida, vaqt bilan"

## Mas'uliyatli foydalanish

- SI xato qilishi mumkin — **tarixiy faktlarni har doim ishonchli manbalardan tekshiring**;
- turistlarning shaxsiy ma'lumotlarini (pasport, telefon) SI xizmatlariga kiritmang;
- SI yaratgan matnni o'z nomingizdan taqdim etishda halol bo'ling;
- SI — yordamchi, gidning shaxsiy muloqoti va mas'uliyatini almashtirmaydi.`,
    keywords: [
      { term: 'Sun\'iy intellekt', definition: 'Inson intellektiga xos vazifalarni bajaruvchi kompyuter tizimlari.' },
      { term: 'Chat-bot', definition: 'Foydalanuvchi bilan matn yoki ovoz orqali muloqot qiluvchi dastur.' },
      { term: 'Prompt', definition: 'SI tizimiga beriladigan so\'rov yoki ko\'rsatma.' },
      { term: 'Katta til modeli', definition: 'Ulkan matnlar asosida o\'qitilgan, matn yaratishga qodir SI modeli.' },
    ],
    methods: [
      { type: 'fsmu', key: 'f1', title: 'FSMU: "Sun\'iy intellekt gidlarni almashtiradi"', statement: 'Yaqin 10 yilda sun\'iy intellekt gidlarni to\'liq almashtiradi.' },
      { type: 'blits', key: 'b1', title: 'Blits-so\'rov: SI haqida', seconds: 10, instruction: 'To\'g\'ri yoki noto\'g\'ri?', items: [
        { q: 'SI javoblari har doim 100% to\'g\'ri.', a: false },
        { q: 'Turistning pasport ma\'lumotlarini ochiq chat-botga kiritish xavfsiz.', a: false },
        { q: 'Promptda rol va formatni ko\'rsatish javob sifatini oshiradi.', a: true },
        { q: 'SI real vaqtda ovozli tarjima qila oladi.', a: true },
      ] },
      { type: 'aqliy', key: 'a1', title: 'Aqliy hujum: SI gidga qanday yordam beradi?', question: 'Gid ishida sun\'iy intellektdan foydalanishning imkon qadar ko\'p usullarini yozing.' },
    ],
    quiz: [
      { q: 'Promptda nima ko\'rsatilishi tavsiya etiladi?', options: ['Rol, vazifa, kontekst, format', 'Faqat bitta so\'z', 'Parol', 'Hech narsa'], answer: 0, explanation: 'Aniq prompt — sifatli javob.' },
      { q: 'SI bergan tarixiy faktni nima qilish kerak?', options: ['Darhol turistga aytish', 'Ishonchli manbalardan tekshirish', 'E\'tiborsiz qoldirish', 'Ijtimoiy tarmoqqa joylash'], answer: 1, explanation: 'SI xato qilishi mumkin.' },
      { q: 'Dinamik narx belgilash nimaga asoslanadi?', options: ['Talab va taklifga', 'Ob-havoga faqat', 'Gidning kayfiyatiga', 'Tasodifga'], answer: 0, explanation: 'Talab o\'zgarishiga qarab narx o\'zgaradi.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'SI chat-botidan foydalanib Buxoro bo\'yicha 1 kunlik marshrut tuzdiring. So\'ng undagi 5 ta faktni ishonchli manbalar orqali tekshirib, xatolarni belgilang.' },
      { title: 'Trenajyor', text: '"Virtual gidlik trenajyori" bo\'limida kamida 2 ta ssenariydan o\'ting va natijalaringizni tahlil qiling.' },
    ],
    selfstudy: [
      { title: 'SI yordamida marshrut va uning tanqidiy tahlili', description: 'SI yordamida tuzilgan marshrutni ilova qiling, undagi faktlarni tekshiring (manbalar bilan), xatolar va kamchiliklarni ko\'rsating, yakuniy tuzatilgan variantni taqdim eting.', max_score: 15 },
    ],
    resources: [],
  },
  {
    slug: 'big-data',
    module: '5-modul. Sun\'iy intellekt, ma\'lumotlar va xavfsizlik',
    title: 'Katta ma\'lumotlar va turizm analitikasi',
    hours: 2,
    summary: 'Big Data manbalari, turistlar oqimi tahlili, asosiy ko\'rsatkichlar, ma\'lumotlarni vizuallashtirish.',
    objectives: [
      'Turizmda katta ma\'lumotlar manbalarini bilish',
      'Asosiy turistik ko\'rsatkichlarni hisoblash',
      'Oddiy diagramma tuzib tahlil qilish',
    ],
    content: `## Katta ma'lumotlar (Big Data)

**Big Data** — hajmi, tezligi va xilma-xilligi sababli an'anaviy usullar bilan qayta ishlab bo'lmaydigan ma'lumotlar to'plami.

Turizmdagi manbalar: bron tizimlari, mobil operator ma'lumotlari, ijtimoiy tarmoqlar, sharhlar, to'lov tizimlari, chegara statistikasi, veb-sayt tashriflari.

## Asosiy ko'rsatkichlar

| Ko'rsatkich | Ma'nosi |
|---|---|
| Turistlar oqimi | Ma'lum davrda kelgan turistlar soni |
| O'rtacha qolish muddati | Turistlarning o'rtacha tunashlari soni |
| Xonalar bandligi (Occupancy) | Band xonalar / mavjud xonalar × 100% |
| ADR | O'rtacha kunlik xona narxi |
| Mavsumiylik | Oylar bo'yicha talab o'zgarishi |

## Ma'lumotlarni vizuallashtirish

Excel / Google Sheets diagrammalari, Power BI, Looker Studio kabi vositalar yordamida ma'lumotlar grafik ko'rinishga keltiriladi. Masalan, oylar bo'yicha turistlar oqimi chiziqli diagrammada mavsumiylikni yaqqol ko'rsatadi.`,
    keywords: [
      { term: 'Big Data', definition: 'Katta hajmli, tez o\'zgaruvchan va xilma-xil ma\'lumotlar.' },
      { term: 'Occupancy', definition: 'Xonalar bandligi foizi.' },
      { term: 'ADR', definition: 'Average Daily Rate — o\'rtacha kunlik xona narxi.' },
      { term: 'Mavsumiylik', definition: 'Yil davomida turistik talabning o\'zgarishi.' },
    ],
    methods: [
      { type: 'moslash', key: 'm1', title: 'Ko\'rsatkich va ma\'nosi', instruction: 'Moslang.', pairs: [
        { left: 'Occupancy', right: 'Xonalar bandligi foizi' },
        { left: 'ADR', right: 'O\'rtacha kunlik xona narxi' },
        { left: 'Mavsumiylik', right: 'Oylar bo\'yicha talab o\'zgarishi' },
        { left: 'Turistlar oqimi', right: 'Ma\'lum davrda kelgan turistlar soni' },
      ] },
    ],
    quiz: [
      { q: '50 xonali mehmonxonada 40 xona band. Bandlik necha foiz?', options: ['40%', '80%', '125%', '50%'], answer: 1, explanation: '40/50 × 100% = 80%.' },
      { q: 'ADR nimani anglatadi?', options: ['O\'rtacha kunlik xona narxi', 'Turistlar soni', 'Reyting', 'Xodimlar soni'], answer: 0, explanation: 'Average Daily Rate.' },
      { q: 'Quyidagilardan qaysi biri Big Data manbai emas?', options: ['Bron tizimlari', 'Ijtimoiy tarmoqlar', 'Qog\'ozdagi shaxsiy kundalik', 'Mobil operator ma\'lumotlari'], answer: 2, explanation: 'Shaxsiy qog\'oz kundalik — katta ma\'lumot manbai emas.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Google Sheets da 12 oylik shartli turistlar soni jadvalini tuzib, chiziqli diagramma yarating va eng yuqori/past mavsumni aniqlang.' },
    ],
    selfstudy: [
      { title: 'Mini-tahlil', description: 'Ochiq manbalardan (Turizm qo\'mitasi, Statistika agentligi) O\'zbekistonga kelgan xorijiy turistlar soni bo\'yicha so\'nggi yillar ma\'lumotini to\'plang, diagramma tuzing va 5–7 gaplik xulosa yozing.', max_score: 10 },
    ],
    resources: [{ title: 'O\'zbekiston statistika agentligi', url: 'https://stat.uz' }],
  },
  {
    slug: 'kiberxavfsizlik',
    module: '5-modul. Sun\'iy intellekt, ma\'lumotlar va xavfsizlik',
    title: 'Raqamli xavfsizlik va kasb etikasi',
    hours: 2,
    summary: 'Shaxsiy ma\'lumotlar himoyasi, fishing, onlayn firibgarlik, xavfsiz to\'lov, raqamli etika va mualliflik huquqi.',
    objectives: [
      'Turistlarning shaxsiy ma\'lumotlarini himoya qilish qoidalarini bilish',
      'Fishing va firibgarlik belgilarini aniqlash',
      'Raqamli muhitda kasb etikasiga rioya qilish',
    ],
    content: `## Shaxsiy ma'lumotlar himoyasi

Gid va turizm xodimi turistlarning pasport ma'lumotlari, telefon raqami, to'lov ma'lumotlari bilan ishlaydi. Asosiy qoidalar:
- ma'lumotlarni faqat zarur maqsadda va zarur hajmda to'plash;
- ochiq messenjer guruhlarida pasport suratlarini tarqatmaslik;
- qurilmalarni parol bilan himoyalash, ikki bosqichli autentifikatsiyani yoqish;
- turistning roziligisiz uning suratini ijtimoiy tarmoqqa joylamaslik.

## Onlayn firibgarlik va fishing

**Fishing** — soxta sayt, xat yoki xabar orqali login, parol, karta ma'lumotlarini o'g'irlash.

Belgilari:
- shoshiltiruvchi xabar ("bron 1 soatda bekor bo'ladi!");
- manzili g'alati havola (booking-c0nfirm.xyz);
- karta ma'lumotini messenjer orqali so'rash;
- haddan tashqari arzon taklif.

## Xavfsiz to'lov

Faqat rasmiy platformalar va himoyalangan (https) sahifalarda to'lov qiling; SMS-kodni hech kimga aytmang.

## Raqamli etika va mualliflik huquqi

- boshqalarning foto va videolaridan ruxsatsiz foydalanmaslik, manbani ko'rsatish;
- sharhlarni soxtalashtirmaslik;
- ijtimoiy tarmoqlarda madaniyatli muloqot.`,
    keywords: [
      { term: 'Fishing', definition: 'Soxta xabar yoki sayt orqali maxfiy ma\'lumotlarni o\'g\'irlash.' },
      { term: 'Ikki bosqichli autentifikatsiya', definition: 'Parolga qo\'shimcha ravishda ikkinchi tasdiq (SMS-kod, ilova) talab qilish.' },
      { term: 'Shaxsiy ma\'lumot', definition: 'Shaxsni aniqlash imkonini beruvchi har qanday ma\'lumot.' },
    ],
    methods: [
      { type: 'venn', key: 'v1', title: 'Xavfsiz va xavfli harakatlar', instruction: 'A — xavfsiz, B — xavfli. Ikkalasiga tegishli bo\'lmagani bo\'lmaydi, shuning uchun har birini aniq joylang.', a: 'Xavfsiz', b: 'Xavfli', items: [
        { text: 'Pasport suratini ochiq guruhga yuborish', answer: 'b' },
        { text: 'Ikki bosqichli autentifikatsiyani yoqish', answer: 'a' },
        { text: 'SMS-kodni "bank xodimi"ga aytish', answer: 'b' },
        { text: 'Rasmiy ilova orqali to\'lash', answer: 'a' },
        { text: 'Notanish havolani ochish', answer: 'b' },
      ] },
      { type: 'keys', key: 'c1', title: 'Keys: shubhali xabar', situation: 'Turist sizga: "Booking\'dan xabar keldi, bron tasdiqlanishi uchun karta ma\'lumotlarini mana bu havolaga kiriting deyishdi: booking-verify-pay.com" dedi.', questions: ['Bu xabarda qanday xavf belgilari bor?', 'Turistga qanday maslahat berasiz?'] },
    ],
    quiz: [
      { q: 'Fishing nima?', options: ['Baliq ovlash turi', 'Soxta xabar orqali ma\'lumot o\'g\'irlash', 'Bron tizimi', 'Marketing usuli'], answer: 1, explanation: 'Fishing — firibgarlik usuli.' },
      { q: 'Qaysi harakat xavfsiz?', options: ['SMS-kodni aytish', 'Ikki bosqichli autentifikatsiya', 'Notanish havolani ochish', 'Parolni guruhga yozish'], answer: 1, explanation: '2FA hisobni himoyalaydi.' },
      { q: 'Turistning suratini ijtimoiy tarmoqqa joylashdan oldin nima qilish kerak?', options: ['Hech narsa', 'Uning roziligini olish', 'Faqat filtr qo\'yish', 'Yashirincha joylash'], answer: 1, explanation: 'Rozilik — etika va qonun talabi.' },
    ],
    practice: [
      { title: 'Amaliy topshiriq', text: 'Telefoningiz va asosiy hisoblaringizda (e-mail, messenjer) ikki bosqichli autentifikatsiyani yoqing va xavfsizlik bo\'yicha 10 banddan iborat shaxsiy cheklist tuzing.' },
    ],
    selfstudy: [
      { title: 'Turistlar uchun eslatma (pamyatka)', description: 'Xorijiy turistlar uchun "Raqamli xavfsizlik bo\'yicha 10 ta maslahat" eslatmasini (o\'zbek va ingliz tillarida) dizayn bilan tayyorlang.', max_score: 10 },
    ],
    resources: [],
  },
  {
    slug: 'raqamli-gid',
    module: '5-modul. Sun\'iy intellekt, ma\'lumotlar va xavfsizlik',
    title: 'Raqamli gid: kasbiy faoliyatga kompleks tayyorgarlik',
    hours: 4,
    summary: 'Yakuniy integrativ mavzu: gidning raqamli ish jarayoni, portfolio, trenajyor orqali kasbiy vaziyatlarda ishlash va refleksiya.',
    objectives: [
      'Ekskursiyaning barcha bosqichlarida raqamli vositalarni kompleks qo\'llash',
      'Muammoli kasbiy vaziyatlarni hal qilish strategiyasini egallash',
      'Shaxsiy raqamli portfolio yaratish',
    ],
    content: `## Gidning raqamli ish jarayoni

| Bosqich | Raqamli vositalar |
|---|---|
| Tayyorgarlik | Bulutli xotira, onlayn manbalar, SI yordamchi, ob-havo ilovasi |
| Guruh bilan aloqa | Messenjer guruhi, onlayn anketa, elektron vaucher |
| Ekskursiya | Navigatsiya, radiogid, QR/AR, tarjimon ilova |
| Muammoli vaziyat | Favqulodda raqamlar, geolokatsiya, onlayn bron, transport ilovasi |
| Yakun | Onlayn so'rov, sharh so'rash, foto ulashish (rozilik bilan) |

## Muammoli vaziyatlarda harakat algoritmi

1. **To'xtash va baholash** — xavf bormi? kimga ta'sir qilmoqda?
2. **Xavfsizlikni ta'minlash** — birinchi navbatda odamlar.
3. **Xabardor qilish** — guruh, kompaniya, kerak bo'lsa xizmatlar (101, 102, 103).
4. **Muqobil yechim** — kamida ikkita variant.
5. **Hujjatlashtirish** — nima bo'ldi, qanday hal qilindi.
6. **Tahlil (refleksiya)** — keyingi safar nimani yaxshiroq qilish mumkin.

## Raqamli portfolio

Bo'lajak gidning raqamli portfoliosi: rezyume, sertifikatlar, o'tkazgan ekskursiyalar video/fotolari, tayyorlagan virtual tur va audio-gidlar, mijozlar sharhlari, trenajyor natijalari.

> Ushbu mavzu bo'yicha asosiy amaliyot — **Virtual gidlik trenajyorida** barcha ssenariylardan o'tish va natijalarni tahlil qilish.`,
    keywords: [
      { term: 'Raqamli portfolio', definition: 'Mutaxassisning yutuqlari va ishlarini aks ettiruvchi elektron to\'plam.' },
      { term: 'Refleksiya', definition: 'O\'z faoliyatini tahlil qilish va xulosa chiqarish.' },
      { term: 'Radiogid', definition: 'Guruhga gid ovozini simsiz quloqchinlar orqali yetkazuvchi tizim.' },
    ],
    methods: [
      { type: 'ketma', key: 'k1', title: 'Muammoli vaziyatda harakat algoritmi', instruction: 'To\'g\'ri tartibga keltiring.', steps: ['To\'xtash va baholash', 'Xavfsizlikni ta\'minlash', 'Xabardor qilish', 'Muqobil yechim taklif qilish', 'Hujjatlashtirish', 'Tahlil (refleksiya)'] },
      { type: 'bbb', key: 'bbb1', title: 'Yakuniy refleksiya: B-B-B jadvali', instruction: 'Fan davomida nimalarni bilib olganingizni yozing.' },
      { type: 'sinkveyn', key: 's1', title: 'Sinkveyn: "Raqamli gid"', word: 'Raqamli gid' },
    ],
    quiz: [
      { q: 'Muammoli vaziyatda birinchi qadam?', options: ['Kompaniyaga hisobot yozish', 'To\'xtash va xavfni baholash', 'Ijtimoiy tarmoqqa yozish', 'Ekskursiyani davom ettirish'], answer: 1, explanation: 'Avval vaziyatni baholash kerak.' },
      { q: 'O\'zbekistonda tez tibbiy yordam raqami?', options: ['101', '102', '103', '104'], answer: 2, explanation: '103 — tez tibbiy yordam.' },
      { q: 'Raqamli portfolioga nima kirmaydi?', options: ['Sertifikatlar', 'Trenajyor natijalari', 'Turistlarning pasport nusxalari', 'Ekskursiya videolari'], answer: 2, explanation: 'Turistlarning shaxsiy hujjatlari portfolioga joylanmaydi.' },
    ],
    practice: [
      { title: 'Trenajyor amaliyoti', text: 'Virtual gidlik trenajyorida kamida 5 ta turli ssenariydan o\'ting, har biri bo\'yicha olingan tavsiyalarni yozib boring.' },
    ],
    selfstudy: [
      { title: 'Raqamli portfolio', description: 'Shaxsiy raqamli portfoliongizni yarating (Google Sites, Canva yoki Telegram-kanal ko\'rinishida): rezyume, fan davomida bajargan eng yaxshi 3 ta ishingiz, trenajyor natijalari va refleksiv esse. Havolasini yuboring.', max_score: 20 },
    ],
    resources: [],
  },
];

module.exports = { topics };
