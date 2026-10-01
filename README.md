# Raqamli Gid — "Turizmda raqamli texnologiyalar" platformasi va virtual gidlik trenajyori

Turizm va madaniy meros texnikumlari o'quvchilarini raqamli kasbiy faoliyatga tayyorlash uchun interaktiv ta'lim platformasi.

## Asosiy oynalar

| Oyna | Imkoniyatlar |
|---|---|
| **Mavzular** | 5 modul, 13 mavzu. Har bir mavzuda: maqsadlar, nazariy matn, tayanch tushunchalar (aylanuvchi kartochkalar), interaktiv metodlar, izohli test, amaliy topshiriq, mustaqil ish, shaxsiy konspekt |
| **Interaktiv metodlar** | Klaster, Venn diagrammasi, INSERT, Blits-so'rov, Moslashtirish, Ketma-ketlik, Keys-stadi, FSMU, Aqliy hujum, B-B-B jadvali, Sinkveyn — o'quvchi javoblari saqlanadi va o'qituvchiga ko'rinadi |
| **Mustaqil ta'lim** | Topshiriqlarni yuborish (matn/havola), o'qituvchi bahosi va izohi, shaxsiy SMART-reja, eslatmalar, glossariy (kartochka rejimi), shaxsiy natijalar dinamikasi |
| **Virtual gidlik trenajyori** (yadro) | 10 ta kasbiy ssenariy (Registon ekskursiyasi, overbooking, issiq urishi, virtual tur, til to'sig'i, ziyoratgoh odobi, ob-havo va marshrut, VIP mijoz, pasport yo'qolishi, ekoturizm). Sun'iy intellekt turist rolini o'ynaydi. Real vaqtda taymer, turist kayfiyati ko'rsatkichi va avtomatik kiritiladigan **kutilmagan vaziyatlar** bor. O'zbek, rus va ingliz tillarida ishlaydi; ovozli kiritish, ovozli o'qish va murabbiy maslahati mavjud. Yakunda 6 mezon bo'yicha AI baholash, kuchli va zaif tomonlar, xatolar hamda tavsiyalar beriladi |
| **So'rovnomalar** | 5 ta anketa (1–5-ilovalar): kirish va yakuniy diagnostika (raqamli kompetensiyaning motivatsion, kognitiv, faoliyatli, refleksiv komponentlari), trenajyor samaradorligi, SUS, o'qituvchilarning ekspert bahosi |
| **O'qituvchi paneli** | So'rovnoma natijalari (diagrammalar, komponentlar indeksi va darajalari, Kronbax alfa, guruh filtri, CSV/Excel eksport, individual javoblar), **oldin/keyin taqqoslash** (juftlashgan t-test, p, Koen d), trenajyor hisobotlari (mezonlar, ssenariylar, o'quvchilar dinamikasi, transkriptlar), o'quvchi kartasi, topshiriqlarni baholash, **mavzular muharriri** va **so'rovnoma konstruktori** |
| **Admin** | O'qituvchi va admin hisoblarini yaratish, rollarni o'zgartirish, parollarni tiklash |

## Ishga tushirish

Talab: Node.js 20 yoki undan yangi.

```bash
npm install
cp .env.example .env      # JWT_SECRET, ADMIN_PASSWORD va ANTHROPIC_API_KEY ni to'ldiring
npm start                 # http://localhost:3000
npm test                  # avtomatik testlar
```

Birinchi ishga tushishda administrator yaratiladi (`ADMIN_EMAIL` / `ADMIN_PASSWORD`; berilmasa `admin@vgt.uz` / `admin12345` — darhol almashtiring).
O'quvchilar o'zlari email va parol bilan ro'yxatdan o'tadi. O'qituvchilar hisobini admin "Foydalanuvchilar" bo'limida yaratadi.

### Sun'iy intellekt

Trenajyor Claude API (`@anthropic-ai/sdk`, standart model `claude-opus-5-5`) orqali ishlaydi. Turist javoblari real vaqtda oqim (streaming) bilan keladi, baholash esa JSON-sxema bo'yicha tuziladi. Xavfsizlik klassifikatori so'rovni rad etsa, server tomonidagi zaxira model (`fallbacks: "default"`) yoqilgan.
`ANTHROPIC_API_KEY` berilmasa, platforma **oflayn rejimda** ishlaydi: turist ssenariydagi tayyor javoblar bilan gapiradi va baholash kalit so'zlar asosida taxminiy bo'ladi.

## Mazmunni almashtirish

- `data/topics.js` — mavzular (hozircha namunaviy matn). O'quv qo'llanma matni shu faylga yoki o'qituvchi panelidagi **Mavzular muharriri** orqali joylanadi.
- `data/surveys.js` — anketalar. Ilmiy ish ilovalariga moslab shu yerda yoki **So'rovnoma konstruktori** (JSON import ham bor) orqali tahrirlanadi. `dimension` maydoni natijalarni komponentlar bo'yicha indekslaydi, `reverse` — teskari ball, `pair_slug` — kirish va yakuniy so'rovnoma juftligi.
- `data/scenarios.js` — trenajyor ssenariylari, kutilmagan vaziyatlar va baholash mezonlari.

Seed faqat bazada yo'q yozuvlarni qo'shadi (slug bo'yicha). Mavjud mavzuni yangilash uchun panel muharriridan foydalaning yoki `storage/` bazasini qayta yarating.

## Tuzilma

```
server/        Express API (auth, topics, selfstudy, surveys, trainer, admin), SQLite, statistika
data/          Mavzular, so'rovnomalar, ssenariylar
public/        Interfeys (vanilla JS SPA)
test/          Avtomatik testlar
```
