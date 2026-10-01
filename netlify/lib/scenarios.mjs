import { SCENARIO_MAP, COMPETENCY, FUNCTIONS } from "../../public/data/standard.js";

// Virtual gidlik trenajyori ssenariylari.
// Har bir ssenariy: talabaga beriladigan vaziyat (brief), AI o'ynaydigan personaj (persona),
// real vaqtda kiritiladigan kutilmagan hodisalar (twists) va baholash uchun kalit so'zlar.

export const CRITERIA = [
  { key: "communication", title: "Muloqot madaniyati va nutq", max: 20 },
  { key: "knowledge", title: "Kasbiy bilim va faktlar aniqligi", max: 20 },
  { key: "problem", title: "Muammoni hal qilish va qaror qabul qilish", max: 20 },
  { key: "digital", title: "Raqamli vositalardan foydalanish", max: 20 },
  { key: "service", title: "Mijozga yo'naltirilganlik va kasbiy etika", max: 20 },
];

export const SCENARIOS = [
  {
    id: "registon-tour",
    title: "Registon ansambli bo'ylab ekskursiya",
    category: "Ekskursiya o'tkazish",
    level: "Boshlang'ich",
    icon: "🕌",
    location: "Samarqand, Registon maydoni",
    duration: 15,
    language: "o'zbek",
    role: "Siz Registon ansambli bo'yicha ekskursiya olib boruvchi gidsiz.",
    brief:
      "Germaniyadan kelgan 3 kishilik oila (ota Klaus, ona Anna va 14 yoshli o'g'il Lukas) bilan Registon maydonida ekskursiya o'tkazasiz. Ular o'zbek tilini biroz biladi. Har bir bekatda obyekt haqida qisqa va qiziqarli ma'lumot bering, savollarga javob bering, guruh diqqatini saqlang. Raqamli vositalardan (QR-audiogid, AR ilova, onlayn chipta) foydalanishni taklif qilishingiz mumkin.",
    objectives: [
      "Guruh bilan salomlashish, o'zini tanishtirish va ekskursiya rejasini aytish",
      "Ulug'bek, Sherdor va Tillakori madrasalari haqida aniq faktlar berish",
      "Turistlarning savollariga to'liq va qiziqarli javob berish",
      "Kutilmagan vaziyatga moslashish",
    ],
    route: [
      { title: "Ulug'bek madrasasi", hint: "1417–1420-yillar, Mirzo Ulug'bek, astronomiya va matematika maktabi" },
      { title: "Sherdor madrasasi", hint: "1619–1636-yillar, Yalangto'sh Bahodir, sher va quyosh tasviri" },
      { title: "Tillakori madrasasi", hint: "1646–1660-yillar, masjid-madrasa, oltin bezaklar" },
    ],
    persona:
      "Sen Germaniyadan kelgan oila nomidan gapirasan: ota Klaus (tarixga qiziquvchi, aniq sana va raqamlarni so'raydi), ona Anna (fotosurat, xavfsizlik va qulaylik haqida so'raydi), o'g'il Lukas (14 yosh, zerikib qolishi mumkin, texnologiya va o'yinlar, Instagram uchun joylar so'raydi). Har javobda bitta yoki ikki oila a'zosi gapiradi va ism bilan belgilanadi (masalan: \"Klaus: ...\"). O'zbek tilida biroz xato bilan, ba'zan nemis yoki ingliz so'zlarini qo'shib gapir.",
    opening:
      "Klaus: Assalomu alaykum! Biz tayyormiz. Bu maydon juda katta ekan... Qayerdan boshlaymiz?\nLukas: Wi-Fi bormi bu yerda? 😅",
    twists: [
      { afterTurn: 3, text: "Lukas guruhdan biroz uzoqlashib, telefonida o'yin o'ynay boshladi va zerikkanini aytdi." },
      { afterTurn: 6, text: "To'satdan kuchli shamol va yengil yomg'ir boshlandi, Anna kamerasini qayerga yashirishni so'rayapti." },
    ],
    keywords: ["ulug'bek", "sherdor", "tillakori", "madrasa", "1417", "1619", "1646", "audiogid", "qr", "ilova", "xush kelibsiz"],
    fallback: [
      "Klaus: Juda qiziq! Bu bino qachon qurilgan va kim qurdirgan?",
      "Anna: Bu yerda suratga olish mumkinmi? Chipta narxiga kiradimi?",
      "Lukas: Bu sher tasviri nimani bildiradi? Telefonimda qandaydir ilova bilan ko'rsa bo'ladimi?",
      "Klaus: Ulug'bek astronom bo'lgan deb o'qigandim. Uning rasadxonasi ham shu yerdami?",
      "Anna: Yomg'ir kuchaymoqda... Qayerga yashirinsak bo'ladi?",
      "Klaus: Rahmat! Bu juda yaxshi ekskursiya bo'ldi. Keyingi joy qayer?",
    ],
  },
  {
    id: "lost-tourist",
    title: "Buxoroda adashgan turist",
    category: "Favqulodda vaziyat",
    level: "O'rta",
    icon: "🧭",
    location: "Buxoro, eski shahar",
    duration: 10,
    language: "o'zbek",
    role: "Siz Buxorodagi guruh gidisiz. Guruhingizdagi bir turist adashib qoldi va sizga telefon qildi.",
    brief:
      "Italiyalik turist Marko Lyabi-hovuz yaqinida guruhdan ajralib qoldi. Telefoni 8% zaryadda, u tor ko'chalarda adashgan va xavotirda. Siz uni tinchlantirishingiz, joylashuvini aniqlashingiz (geolokatsiya, xarita ilovalari, mo'ljallar), xavfsiz uchrashuv nuqtasini belgilashingiz va guruhning qolgan qismini nazorat qilishingiz kerak.",
    objectives: [
      "Turistni tinchlantirish va aniq ko'rsatma berish",
      "Joylashuvni raqamli vositalar orqali aniqlash (geolokatsiya, mo'ljallar)",
      "Zaryad tugashini hisobga olgan holda zaxira reja tuzish",
      "Uchrashuv nuqtasi va vaqtini aniq belgilash",
    ],
    persona:
      "Sen italiyalik turist Markosan, 45 yosh. Buxoroda guruhdan adashib qolding. Telefoningda 8% zaryad bor. Xavotirdasan, tez gapirasan, o'zbek tilini kam bilasan, inglizcha so'zlar qo'shasan. Atrofingda gilam do'koni, eski gumbazli bozor (Toqi Sarrofon) va katta minorani ko'ryapsan, lekin nomlarini bilmaysan — faqat tasvirlaysan. Agar gid aniq va xotirjam ko'rsatma bersa — tinchlanasan. Agar gid chalkash yoki uzun gapirsa — xavotiring oshadi.",
    opening: "Marko: Hello?! Gid, siz meni eshitayapsizmi? Men... men yo'qoldim! Hamma ko'chalar bir xil! Telefon 8 foiz qoldi!",
    twists: [
      { afterTurn: 2, text: "Markoning telefoni 3% zaryadga tushdi, ovoz uzilib-uzilib eshitilmoqda." },
      { afterTurn: 4, text: "Mahalliy do'kondor Markoga yordam berishni taklif qilmoqda, lekin u ingliz tilini bilmaydi." },
    ],
    keywords: ["joylashuv", "lokatsiya", "geolokatsiya", "xarita", "google", "yandex", "tinchlan", "minora", "kalon", "toqi", "uchrashuv", "zaryad", "telegram"],
    fallback: [
      "Marko: Men qayerdaman bilmayman! Bu yerda gumbazli bozor bor, gilamlar sotilyapti...",
      "Marko: Lokatsiya? Qanday yuboraman? WhatsApp'dami?",
      "Marko: Telefon o'chib qolsa nima qilaman?!",
      "Marko: Bir odam menga nimadir deyapti, lekin tushunmayapman...",
      "Marko: OK, OK... Men katta minora tomon boraman. U yerda kutaman. Grazie!",
    ],
  },
  {
    id: "overbooking",
    title: "Mehmonxonada overbooking",
    category: "Mijozlarga xizmat",
    level: "O'rta",
    icon: "🏨",
    location: "Toshkent, mehmonxona qabulxonasi",
    duration: 10,
    language: "o'zbek",
    role: "Siz mehmonxonaning qabul bo'limi xodimi (front-desk) va tur-operator vakilisiz.",
    brief:
      "Mehmon Dilnoza Karimova Booking.com orqali oldindan bron qilgan xonasiga keldi, ammo PMS tizimidagi sinxronizatsiya xatosi tufayli xona boshqa mehmonga berilgan (overbooking). Mehmon charchagan va g'azablangan. Muammoni hal qiling: kechirim so'rang, muqobil variant taklif qiling, kompensatsiya bering, holatni tizimda to'g'ri qayd eting.",
    objectives: [
      "Mehmonning his-tuyg'ularini tan olish va samimiy kechirim so'rash",
      "Muqobil yechim taklif qilish (yuqori toifadagi xona, hamkor mehmonxona, transfer)",
      "Kompensatsiya va keyingi qadamlarni aniq aytish",
      "PMS/Channel manager xatosini qanday oldini olishni tushuntirish",
    ],
    persona:
      "Sen Dilnoza Karimovasan, 34 yosh, Samarqanddan xizmat safari bilan kelgansan, ertaga ertalab muhim uchrashuving bor. 3 hafta oldin Booking.com orqali bron qilgansan va tasdiq xati bor. Juda charchagansan va g'azablisan. Agar xodim kechirim so'rab, aniq va adolatli yechim taklif qilsa — asta-sekin tinchlanasan. Agar u bahona qilsa yoki aybni tizimga ag'darsa — sharh yozish va pulni qaytarishni talab qilasan.",
    opening:
      "Dilnoza: Kechirasiz, bu qanaqasi?! Men uch hafta oldin bron qilganman, mana tasdiq xati! Endi siz xona yo'q deyapsizmi? Soat kechki o'n bir bo'ldi!",
    twists: [
      { afterTurn: 3, text: "Dilnoza telefonini olib, Booking.com'da salbiy sharh yozishni boshlaganini aytdi." },
    ],
    keywords: ["kechirasiz", "uzr", "tushunaman", "xona", "lyuks", "kompensatsiya", "transfer", "nonushta", "pms", "tizim", "booking", "chegirma"],
    fallback: [
      "Dilnoza: Bu sizning muammoingiz emas, mening muammoim deb o'ylaysizmi?!",
      "Dilnoza: Xo'p, qanday variant taklif qilasiz? Uzoqqa borishni xohlamayman.",
      "Dilnoza: Hozir Booking'da sharh yozaman, hamma bilsin!",
      "Dilnoza: Mayli... agar transfer va nonushta bo'lsa, rozi bo'laman.",
      "Dilnoza: Rahmat, endi tushunarli. Boshqa bunday bo'lmasin.",
    ],
  },
  {
    id: "double-payment",
    title: "Onlayn to'lovda ikki marta pul yechilishi",
    category: "Raqamli xizmatlar",
    level: "O'rta",
    icon: "💳",
    location: "Tur-agentlik onlayn qo'llab-quvvatlash chati",
    duration: 10,
    language: "o'zbek",
    role: "Siz tur-agentlikning onlayn qo'llab-quvvatlash (support) mutaxassisisiz.",
    brief:
      "Mijoz agentlik saytida Xiva turiga to'lov qilgan, ammo kartasidan ikki marta pul yechilgan. Mijozdan kerakli ma'lumotlarni (buyurtma raqami, to'lov vaqti, tranzaksiya ID) xavfsiz tarzda so'rang, karta ma'lumotlarini to'liq so'ramang, muammoni tushuntiring va qaytarish jarayonini aniq vaqt bilan bayon qiling.",
    objectives: [
      "Shaxsiy va to'lov ma'lumotlari xavfsizligiga rioya qilish",
      "Muammo sababini (holding, takroriy tranzaksiya) tushunarli izohlash",
      "Qaytarish (refund) muddatlari va bosqichlarini aniq aytish",
      "Mijozga yozma tasdiq (email/chek) yuborishni va'da qilish",
    ],
    persona:
      "Sen Javohir, 27 yosh, dasturchi, Xiva turiga 2 400 000 so'm to'lagansan va kartangdan ikki marta yechilgan. Raqamli savodxonliging yuqori, shuning uchun aniq texnik javob kutasan. Agar support karta raqamingni to'liq yoki CVV kodini so'rasa — darhol shubhalanasan va buni aytasan. Javoblar qisqa va aniq bo'lsa mamnun bo'lasan.",
    opening: "Javohir: Salom. Saytingizda Xiva turiga to'lov qildim, kartamdan 2 marta 2,4 mln yechildi. Bu nima degani? Pulim qachon qaytadi?",
    twists: [
      { afterTurn: 2, text: "Javohir bank ilovasida ikkinchi to'lov 'kutilmoqda' (pending) holatida turganini skrinshot bilan yubordi." },
    ],
    keywords: ["buyurtma", "tranzaksiya", "id", "cvv", "xavfsiz", "qaytar", "refund", "bank", "ish kuni", "email", "chek", "holding"],
    fallback: [
      "Javohir: Buyurtma raqamim VGT-48213. Yana nima kerak?",
      "Javohir: Karta raqamimni to'liq yozishim kerakmi? Bu xavfsizmi?",
      "Javohir: 'Pending' holatda turibdi. Bu nimani anglatadi?",
      "Javohir: Necha kunda qaytadi? Yozma tasdiq bera olasizmi?",
      "Javohir: Tushunarli, rahmat. Emailni kutaman.",
    ],
  },
  {
    id: "khiva-virtual",
    title: "Ichan qal'a: onlayn virtual ekskursiya",
    category: "Virtual turizm",
    level: "Murakkab",
    icon: "🏰",
    location: "Xiva, Ichan qal'a (onlayn translyatsiya)",
    duration: 15,
    language: "o'zbek",
    role: "Siz 360° panorama va videoaloqa orqali onlayn virtual ekskursiya olib boryapsiz.",
    brief:
      "Toshkentdagi maktab o'quvchilari va ularning o'qituvchisi uchun Ichan qal'a bo'ylab onlayn virtual ekskursiya o'tkazasiz. Ekranda 360° panorama ko'rsatyapsiz. Ishtirokchilar chatda savol beradi. Texnik nosozliklarga tayyor bo'ling va interaktivlikni (viktorina, so'rovnoma) saqlang.",
    objectives: [
      "Onlayn auditoriya bilan interaktiv aloqa o'rnatish",
      "Kalta minor, Muhammad Aminxon madrasasi, Islomxo'ja minorasi haqida aniq ma'lumot berish",
      "Texnik nosozlikni boshqarish (internet uzilishi, ovoz yo'qolishi)",
      "Interaktiv metodlar (viktorina, savol-javob) qo'llash",
    ],
    route: [
      { title: "Ota darvoza va Kalta minor", hint: "1851–1855, tugallanmagan minora, firuza koshinlar" },
      { title: "Muhammad Aminxon madrasasi", hint: "1851–1854, Xorazmdagi eng yirik madrasa, hozir mehmonxona" },
      { title: "Islomxo'ja minorasi", hint: "1908–1910, balandligi ~57 m, Xivadagi eng baland minora" },
    ],
    persona:
      "Sen onlayn ekskursiya ishtirokchilari nomidan chatda yozasan: o'qituvchi Gulnora opa (tartib va ta'limiy maqsadni kuzatadi), o'quvchi Sardor (ko'p savol beradi, ba'zan hazil qiladi), o'quvchi Madina (minoralar balandligi va afsonalarga qiziqadi). Har xabarda 1-2 ishtirokchi ism bilan yozadi. Agar gid interaktiv savol bersa — faol javob berasiz.",
    opening: "Gulnora opa: Assalomu alaykum! Bizni yaxshi ko'ryapsizmi? Bolalar tayyor.\nSardor: Ekranda qal'a devorlari ko'rinyapti, zo'r! Bu haqiqiy jonli efirmi?",
    twists: [
      { afterTurn: 3, text: "Ishtirokchilar ovoz uzilib qolganini va tasvir qotib qolganini yozishmoqda." },
      { afterTurn: 6, text: "Sardor: 'Kalta minor nega qisqa? Uni o'zga sayyoraliklar qurganmi?' deb hazil qildi, boshqa o'quvchilar kulmoqda." },
    ],
    keywords: ["kalta minor", "aminxon", "islomxo'ja", "1851", "1910", "panorama", "360", "viktorina", "savol", "ovoz", "internet", "ichan qal'a"],
    fallback: [
      "Sardor: Kalta minor nega bunchalik qisqa?",
      "Madina: Islomxo'ja minorasi necha metr? Unga chiqsa bo'ladimi?",
      "Gulnora opa: Ovoz uzilib qoldi... Eshitilmayapti!",
      "Sardor: Viktorina bo'ladimi? Men birinchi javob beraman!",
      "Gulnora opa: Rahmat, bolalarga juda yoqdi. Yozib olingan versiyasi bormi?",
    ],
  },
  {
    id: "foreign-arrival",
    title: "Xorijiy turistni kutib olish (ingliz tilida)",
    category: "Xorijiy til va raqamli servislar",
    level: "O'rta",
    icon: "✈️",
    location: "Toshkent xalqaro aeroporti",
    duration: 10,
    language: "ingliz",
    role: "You are a tour guide meeting a foreign tourist at Tashkent International Airport.",
    brief:
      "Kanadalik turist Emily birinchi marta O'zbekistonga keldi. U e-visa, mahalliy SIM-karta, naqd pul va kartalar, taksi ilovalari (Yandex Go), offline xaritalar va to'lov ilovalari haqida so'raydi. Ingliz tilida muloqot qiling va zarur raqamli servislarni tavsiya qiling.",
    objectives: [
      "Ingliz tilida to'g'ri va xushmuomala muloqot",
      "Mahalliy raqamli servislarni (SIM, taksi, xarita, to'lov) tushuntirish",
      "Valyuta ayirboshlash va xavfsizlik bo'yicha maslahat",
      "Keyingi dastur (transfer, mehmonxona) haqida ma'lumot berish",
    ],
    persona:
      "You are Emily, 29, a travel blogger from Toronto, Canada, visiting Uzbekistan for the first time. You speak only English (simple, friendly). You ask practical questions: SIM card and mobile internet, how to pay (cards vs cash), which taxi app to use, offline maps, whether tap water is safe, and the best spot for Instagram photos in Tashkent. You are tired after a long flight.",
    opening: "Emily: Hi! You must be my guide? Oh, what a long flight... I have no local SIM and my phone has no internet. What should I do first?",
    twists: [{ afterTurn: 3, text: "Emily realised her bank card was declined at the currency exchange machine." }],
    keywords: ["welcome", "sim", "ucell", "beeline", "mobiuz", "uzmobile", "yandex", "taxi", "cash", "card", "visa", "map", "sum", "exchange"],
    fallback: [
      "Emily: Where can I buy a SIM card? Do I need my passport?",
      "Emily: Can I use Uber here? Or another app?",
      "Emily: My card was declined! What can I do?",
      "Emily: Is it safe to drink tap water?",
      "Emily: Thank you so much, you're very helpful!",
    ],
  },
  {
    id: "negative-review",
    title: "Salbiy onlayn sharhga javob",
    category: "Raqamli marketing va obro' boshqaruvi",
    level: "O'rta",
    icon: "⭐",
    location: "TripAdvisor / Google Maps sahifasi",
    duration: 10,
    language: "o'zbek",
    role: "Siz tur-firmaning SMM va mijozlar bilan ishlash bo'yicha menejerisiz.",
    brief:
      "Mijoz Samarqand turidan keyin TripAdvisor'da 1 yulduzli sharh yozdi: avtobus kechikkan, gid shoshilgan, ovqat sovuq bo'lgan. Siz avval ommaviy javob yozasiz, keyin mijoz bilan shaxsiy chatda gaplashasiz. Maqsad — mijozni qaytarish va obro'ni tiklash.",
    objectives: [
      "Ommaviy javobda xotirjam, professional va shaxsiy ohangni saqlash",
      "Faktlarni aniqlash, aybni tan olish va yechim taklif qilish",
      "Mijozni shaxsiy kanalga (chat/telefon) o'tkazish",
      "Sharhlarni monitoring qilish va xizmatni yaxshilash rejasini aytish",
    ],
    persona:
      "Sen Rustam Aliyevsan, 40 yosh, oilang bilan Samarqand turiga borgansan va xafa bo'lgansan. Sharhing: 'Avtobus 1 soat kechikdi, gid hamma joyda shoshildi, tushlik sovuq edi. Pulimga achinaman. 1 yulduz.' Agar kompaniya javobi shablon bo'lsa — yana g'azablanasan. Agar samimiy va aniq yechim bo'lsa — sharhni o'zgartirishni o'ylab ko'rasan.",
    opening: "Rustam (TripAdvisor sharhi, ⭐☆☆☆☆): Avtobus 1 soat kechikdi, gid hamma joyda shoshildi, tushlik sovuq edi. Pulimga achinaman. Hech kimga tavsiya qilmayman!",
    twists: [{ afterTurn: 2, text: "Sharh ostiga boshqa foydalanuvchi: 'Menda ham shunaqa bo'lgan!' deb izoh yozdi." }],
    keywords: ["hurmatli", "uzr", "kechirasiz", "rahmat", "fikr", "aloqa", "chegirma", "qaytar", "yaxshila", "shaxsiy", "telefon"],
    fallback: [
      "Rustam: Shablon javob yozibsiz-da. Hammaga shunday deysiz.",
      "Rustam: Xo'sh, endi nima taklif qilasiz?",
      "Rustam: Gidni jazolaysizmi? Muammo kompaniyaning tashkilotchiligida.",
      "Rustam: Yaxshi, agar keyingi safar shunday bo'lmasa, sharhni o'zgartiraman.",
    ],
  },
  {
    id: "accessible-tour",
    title: "Imkoniyati cheklangan turist uchun tur",
    category: "Inklyuziv turizm",
    level: "Murakkab",
    icon: "♿",
    location: "Toshkent, tur-agentlik ofisi",
    duration: 12,
    language: "o'zbek",
    role: "Siz tur-agentlikning tur-menejerisiz.",
    brief:
      "Nogironlik aravachasidan foydalanuvchi mijoz Samarqand va Buxoroga 3 kunlik sayohat rejalashtirmoqchi. Qulay mehmonxona, transport (Afrosiyob poyezdi), obyektlarga kirish imkoniyati, raqamli resurslar (accessible xaritalar, audiogid) va xavfsizlik masalalarini muhokama qiling.",
    objectives: [
      "Mijoz ehtiyojlarini to'g'ri aniqlash (savollar berish)",
      "Inklyuziv infratuzilma va raqamli resurslarni tavsiya qilish",
      "Real va halol ma'lumot berish (cheklovlarni yashirmaslik)",
      "Tur dasturini bosqichma-bosqich taklif qilish",
    ],
    persona:
      "Sen Nodira, 31 yosh, nogironlik aravachasidan foydalanasan, faol hayot kechirasan va sayohatni yaxshi ko'rasan. Senga achinish ohangi yoqmaydi — teng muloqot kutasan. Aniq savollar berasan: pandus, lift, hojatxona, poyezd vagoni, gid hamrohligi, narx. Agar menejer noaniq va'da bersa — aniqlik talab qilasan.",
    opening: "Nodira: Assalomu alaykum. Samarqand va Buxoroga 3 kunlik sayohat qilmoqchiman. Aravachada harakatlanaman. Haqiqatan qulay bo'ladimi yoki shunchaki 'muammo yo'q' deysizmi?",
    twists: [{ afterTurn: 3, text: "Nodira Registondagi ba'zi madrasalarga kirishda zinapoyalar borligini internetda o'qiganini aytdi." }],
    keywords: ["pandus", "lift", "aravacha", "afrosiyob", "poyezd", "mehmonxona", "xona", "audiogid", "xarita", "hamroh", "narx", "dastur"],
    fallback: [
      "Nodira: Poyezdda aravacha uchun joy bormi?",
      "Nodira: Mehmonxonada maxsus moslashtirilgan xona bormi? Rasmlarini ko'rsata olasizmi?",
      "Nodira: Zinapoyali joylarda nima qilamiz?",
      "Nodira: Yaxshi, dasturni yozma ko'rinishda yuboring.",
    ],
  },
  {
    id: "itinerary-design",
    title: "Individual tur dasturini tuzish",
    category: "Tur-mahsulot yaratish",
    level: "O'rta",
    icon: "🗺️",
    location: "Onlayn konsultatsiya (Telegram)",
    duration: 12,
    language: "o'zbek",
    role: "Siz individual turlar bo'yicha raqamli tur-konsultantsiz.",
    brief:
      "Yosh juftlik Shahrisabz va Samarqandga 2 kunlik, cheklangan byudjetli (umumiy 3 mln so'm) sayohat rejalashtirmoqda. Ular madaniy meros, milliy taomlar va fotosuratga qiziqadi. Raqamli vositalar (onlayn xarita, bron qilish, chipta xizmatlari) yordamida aniq kunlik dastur tuzib bering.",
    objectives: [
      "Mijoz ehtiyoji va byudjetini aniqlash",
      "Kunlik marshrutni vaqt va masofa bilan tuzish",
      "Narxlarni hisoblash va byudjetga moslashtirish",
      "Bron qilish va chipta xarid qilish uchun raqamli vositalarni tavsiya qilish",
    ],
    persona:
      "Sen Aziz va Malika nomidan Telegram'da yozasan (asosan Malika yozadi). Yangi turmush qurgansizlar, byudjet 3 mln so'm, 2 kun. Oqsaroy, Dorus-saodat, Registon, Shohi Zinda va milliy taomlar (Samarqand noni, plov) qiziq. Narxlarni aniq so'raysiz va byudjetdan oshsa e'tiroz bildirasiz.",
    opening: "Malika: Assalomu alaykum! Biz 2 kunga Shahrisabz va Samarqandga bormoqchimiz. Byudjet 3 mln so'm, ikki kishiga. Qanday reja taklif qilasiz? 😊",
    twists: [{ afterTurn: 3, text: "Malika ertangi poyezd chiptalari tugab qolganini sayt orqali ko'rganini yozdi." }],
    keywords: ["oqsaroy", "dorus-saodat", "registon", "shohi zinda", "poyezd", "afrosiyob", "chipta", "mehmonxona", "narx", "so'm", "marshrut", "xarita", "kun"],
    fallback: [
      "Malika: Shahrisabzga qanday boramiz? Taksi qimmat emasmi?",
      "Malika: Mehmonxona qancha turadi? Arzonroq variant bormi?",
      "Malika: Poyezd chiptalari tugab qolibdi! Endi nima qilamiz?",
      "Malika: Umumiy hisob qancha bo'ladi?",
      "Malika: Zo'r, rahmat! Dasturni PDF qilib yubora olasizmi?",
    ],
  },
  {
    id: "heat-emergency",
    title: "Issiq urishi: tibbiy favqulodda vaziyat",
    category: "Favqulodda vaziyat",
    level: "Murakkab",
    icon: "🚑",
    location: "Samarqand, Shohi Zinda majmuasi (iyul, +41°C)",
    duration: 8,
    language: "o'zbek",
    role: "Siz ekskursiya olib borayotgan gidsiz.",
    brief:
      "Ekskursiya vaqtida keksa turist Gerbert (72 yosh) boshi aylanib, holsizlanib qoldi — issiq urishi alomatlari. Darhol to'g'ri birinchi yordam choralarini ko'ring, tez yordamni (103) chaqiring, guruhning qolgan qismini boshqaring, sug'urta kompaniyasi va tur-operatorga xabar bering.",
    objectives: [
      "Xavfsizlik va birinchi yordam ketma-ketligini to'g'ri bajarish",
      "Tez yordam (103) / 112 ga aniq manzil bilan qo'ng'iroq qilish",
      "Guruhning qolgan a'zolarini tinchlantirish va boshqarish",
      "Tur-operator va sug'urtaga raqamli kanallar orqali xabar berish",
    ],
    persona:
      "Sen guruh a'zolari nomidan gapirasan: Gerbertning rafiqasi Helga (juda xavotirda, ingliz-nemis aralash gapiradi) va guruhdagi boshqa turist Pyotr (ruscha so'zlar qo'shadi, yordam berishga tayyor). Gerbertning holati gid harakatlariga qarab yaxshilanadi yoki yomonlashadi. Agar gid noto'g'ri harakat qilsa (masalan, sovuq muzli suvni birdaniga ichirsa yoki kutib tursa), holat yomonlashganini bildir.",
    opening: "Helga: Gid! Gid! Herbert... uning boshi aylanyapti, u o'tirib qoldi! Yuzi qizarib ketgan, juda terlayapti... Bitte, yordam bering!",
    twists: [
      { afterTurn: 2, text: "Gerbert hushidan ketishga yaqin, savollarga sekin javob bermoqda." },
      { afterTurn: 4, text: "Guruhdagi boshqa turistlar ham issiqdan shikoyat qilib, avtobusga qaytishni so'ramoqda." },
    ],
    keywords: ["103", "112", "tez yordam", "soya", "suv", "sovut", "manzil", "shohi zinda", "sug'urta", "operator", "yotqiz", "tinchlan"],
    fallback: [
      "Helga: Nima qilaylik?! U gapirmayapti!",
      "Pyotr: Men suv olib keldim, ichiraymi? Muzdek suv bor.",
      "Helga: Tez yordam qachon keladi? Ular qayerga kelishini bilishadimi?",
      "Pyotr: Boshqalar avtobusga qaytmoqchi, nima deymiz?",
      "Helga: U o'ziga kelyapti... Danke, rahmat sizga!",
    ],
  },
];

// Ovozli rejim uchun personajlarning ovozi (f — ayol, m — erkak). Birinchisi — asosiy so'zlovchi.
const SPEAKERS = {
  "registon-tour": { Klaus: "m", Anna: "f", Lukas: "m" },
  "lost-tourist": { Marko: "m" },
  overbooking: { Dilnoza: "f" },
  "double-payment": { Javohir: "m" },
  "khiva-virtual": { "Gulnora opa": "f", Sardor: "m", Madina: "f" },
  "foreign-arrival": { Emily: "f" },
  "negative-review": { Rustam: "m" },
  "accessible-tour": { Nodira: "f" },
  "itinerary-design": { Malika: "f", Aziz: "m" },
  "heat-emergency": { Helga: "f", Pyotr: "m", Herbert: "m" },
};

export function publicScenario(s) {
  // Talabaga persona tafsilotlari emas, faqat vaziyat ko'rsatiladi.
  const { persona, keywords, fallback, ...rest } = s;
  const speakers = Object.fromEntries(Object.entries(SPEAKERS[s.id] || {}).map(([k, v]) => [k, v === "m" ? "male" : "female"]));
  return { ...rest, speakers, competencies: SCENARIO_MAP[s.id]?.kk || [], functions: SCENARIO_MAP[s.id]?.functions || [] };
}

/** Ssenariyga tegishli kasb standarti talablari (baholash uchun). */
export function standardContext(s) {
  const map = SCENARIO_MAP[s.id];
  if (!map) return "";
  const fx = FUNCTIONS.filter((f) => map.functions.includes(f.code));
  return [
    "Gid tarjimon kasb standarti (NO1.232.1901/Б-22) bo'yicha tegishli talablar:",
    ...fx.map((f) => `- Mehnat funksiyasi ${f.code} “${f.title}”: ${f.actions.join("; ")}.`),
    ...map.kk.map((c) => `- ${c}: ${COMPETENCY[c]?.title}`),
  ].join("\n");
}

export function personaSystemPrompt(s) {
  return `Sen "Virtual gidlik trenajyori" deb nomlangan ta'limiy simulyatorda rol o'ynaysan. Bu trenajyor Turizm va madaniy meros texnikumi o'quvchilarini — bo'lajak gid va turizm mutaxassislarini — real kasbiy vaziyatlarga tayyorlaydi.

VAZIYAT: ${s.title} (${s.location}).
${s.brief}

O'QUVCHINING ROLI: ${s.role}

SENING ROLING (personaj): ${s.persona}

MULOQOT TILI: ${s.language}.

QOIDALAR:
1. Faqat personaj(lar) nomidan gapir. Hech qachon o'zingni sun'iy intellekt yoki trenajyor deb atama, o'quvchiga maslahat berma va uning o'rniga muammoni hal qilma.
2. Javoblaring qisqa va tabiiy bo'lsin: odatda 1–4 jumla, xuddi real suhbatdagidek.
3. O'quvchining harakatlari sifatiga real reaksiya bildir: aniq, xushmuomala va to'g'ri harakatlarga — vaziyat yumshaydi; noaniq, qo'pol, noto'g'ri yoki xavfli harakatlarga — vaziyat keskinlashadi.
4. Agar o'quvchi faktik xato qilsa (sana, nom, raqam), personaj tabiiy ravishda shubha bildirishi yoki aniqlik so'rashi mumkin.
5. Kvadrat qavsdagi [Vaziyat: ...] va [Bekat: ...] yozuvlari rejissyor ko'rsatmalari — ularni o'quvchi aytmagan; ularga personaj sifatida tabiiy reaksiya bildir.
6. Mavzudan chetga chiquvchi yoki nojo'ya xabarlarga personaj sifatida hayron bo'lib javob ber va suhbatni vaziyatga qaytar.
7. Faqat oddiy matn yoz: markdown belgilarini (*, **, #, _) ishlatma. Chet so'zlarni ham oddiy yoz.
8. Vaziyat to'liq hal bo'lganda yoki ekskursiya mantiqan yakunlanganda, personajning so'nggi javobi oxirida alohida qatorda [[YAKUNLANDI]] belgisini qo'y.`;
}

export function evaluationPrompt(s, transcript, meta) {
  return `Sen turizm va gidlik bo'yicha tajribali metodist-ekspertsan. Quyida "Virtual gidlik trenajyori"dagi mashg'ulot yozuvi keltirilgan. O'quvchining (bo'lajak turizm mutaxassisi) faoliyatini xolis va pedagogik jihatdan foydali tarzda baholab ber.

SSENARIY: ${s.title} — ${s.location}
O'quvchi roli: ${s.role}
Vaziyat: ${s.brief}
Maqsadlar:
${s.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}

BAHOLASH MEZONLARI (har biri 0–20 ball):
${CRITERIA.map((c) => `- ${c.key}: ${c.title}`).join("\n")}

${standardContext(s)}

QO'SHIMCHA MA'LUMOT: o'quvchi ${meta.hintsUsed} marta "Ustoz maslahati"dan foydalandi; mashg'ulot davomiyligi ${meta.durationMin} daqiqa.

MASHG'ULOT YOZUVI:
${transcript}

Baholashda faqat o'quvchi ("GID" deb belgilangan) xabarlarini baholang. Fikr-mulohazalarni o'zbek tilida, o'quvchiga murojaat qilib ("siz") yozing. Kuchli tomonlar va xatolarni yozuvdan aniq misollar bilan ko'rsating. Agar o'quvchi juda kam yozgan bo'lsa, ballarni shunga mos ravishda past qo'ying.
"standard" maydonida o'quvchining harakatlari yuqoridagi kasb standarti mehnat harakatlari va kompetensiyalariga qanchalik mos kelganini 2–4 jumlada baholang (qaysi mehnat harakatini bajardi, qaysi birini o'tkazib yubordi).`;
}

export const EVALUATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(CRITERIA.map((c) => [c.key, { type: "integer" }])),
      required: CRITERIA.map((c) => c.key),
    },
    summary: { type: "string" },
    standard: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["scores", "summary", "standard", "strengths", "improvements", "recommendations"],
};

export function hintPrompt(s) {
  return `Sen tajribali gid-ustoz (mentor)san. O'quvchi "Virtual gidlik trenajyori"da quyidagi vaziyatda mashq qilmoqda va maslahat so'radi.

VAZIYAT: ${s.title} — ${s.brief}
O'quvchi roli: ${s.role}
Maqsadlar: ${s.objectives.join("; ")}

Suhbatning hozirgi holatiga qarab, o'quvchiga keyingi qadam uchun BITTA aniq, amaliy maslahat ber (2–3 jumla, o'zbek tilida). Tayyor javob matnini yozib berma — yo'nalish ko'rsat. Faqat oddiy matn yoz, markdown belgilarini (*, **, #) ishlatma.`;
}
