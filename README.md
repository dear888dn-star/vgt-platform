# Safar akademiya

"Turizmda raqamli texnologiyalar" fani bo'yicha interaktiv ta'lim platformasi va sun'iy intellekt asosidagi **virtual gidlik trenajyori**. Platforma Turizm va madaniy meros texnikumlari o'quvchilarini raqamli kasbiy faoliyatga tayyorlash uchun mo'ljallangan.

## Imkoniyatlar

| Bo'lim | Tavsif |
|---|---|
| 📚 **Mavzular** | “Turizmda raqamli texnologiyalar” o'quv qo'llanmasining (Jizzax, 2025) 15 ta mavzusi: to'liq nazariy matn, jadvallar, muqovalar, nazorat savollari (yozma javob bilan), qo'llanma testlari (variantlar aralashtiriladi), glossariy (flesh-kartalar), konspekt va 9 xil interaktiv metod (aqliy hujum, klaster, Venn diagrammasi, keys-stadi, FSMU, INSERT, moslashtirish, T-jadval, ketma-ketlik). |
| 🧩 **Mustaqil ta'lim** | Shaxsiy o'quv rejasi (muddatlar bilan), mustaqil ish topshiriqlari (matn + havola), o'qituvchi bahosi va izohi, refleksiv kundalik, shaxsiy tavsiyalar. |
| 🎙️ **Virtual gidlik trenajyori** | 10 ta kasbiy ssenariy. AI turist/mijoz rolini o'ynaydi, javoblar real vaqtda oqim bilan chiqadi, mashg'ulot davomida kutilmagan hodisalar kiritiladi, marshrut bekatlari, "Ustoz maslahati", taymer. Yakunda 5 mezon × 20 ball = 100 ballik AI baholash va tavsiyalar. **Ovozli rejim**: personaj javoblari ovoz chiqarib o'qiladi (har bir personaj o'z ovozi bilan), o'quvchi mikrofon orqali gapirib javob beradi, javobdan keyin avtomatik tinglash. Brauzer ovozi (Web Speech API; eng yaxshi o'zbekcha ovoz — Microsoft Edge) yoki AI ovozi (Gemini TTS). |
| 🖥️ **Taqdimotlar** | O'qituvchi panelida har bir mavzuga taqdimot joylanadi: PDF (60 MB gacha, o'rnatilgan slayd ko'ruvchi — pdf.js: 3D o'tish animatsiyalari, eskizlar, to'liq ekran, avtomatik ko'rsatish, klaviatura va svayp), PowerPoint .pptx (20 MB gacha, PowerPoint Online orqali) yoki Google Slides / Canva / OneDrive havolasi. |
| 🎬 **Animatsion darslar** | Har bir mavzu o'quv qo'llanmadan avtomatik "video dars"ga aylanadi: kirish, bo'limlar (jonli piktogrammalar, so'zma-so'z chiquvchi matn, kalit tushunchalar), tayanch tushunchalar va yakun sahnalari; ovozli hikoya (brauzer ovozi), subtitrlar, tezlik, to'liq ekran, klaviatura. Oxirigacha ko'rilsa +10 XP. `public/js/lesson-player.js`. |
| 📹 **Video darslar va Mediateka** | O'qituvchi har bir mavzuga YouTube/Vimeo havolasi yoki video fayl (MP4/WebM, 80 MB gacha; muqova va davomiylik avtomatik) qo'shadi. “Mediateka” sahifasida animatsion darslar, videolar, taqdimotlar va galereya (rasmlarni kattalashtirib ko'rish) jamlangan. Bosh sahifada platforma haqida 26 soniyalik video. |
| 🧭 **Virtual sayohat** | Buyuk ipak yo'li bo'ylab namunaviy ekskursiya: 7 bekat (Toshkent → Samarqand → Shahrisabz → Buxoro → Xiva), obidalarning original jonli illyustratsiyalari, ovozli gid hikoyasi, faktlar, gid uchun metodik maslahat, animatsion marshrut xaritasi va tegishli trenajyor ssenariysiga havola. Obidalar illyustratsiyalari: `public/js/landmarks.js` (SVG). |
| 🔊 **AI ovozi (Gemini TTS)** | Trenajyor personajlari, animatsion darslar, virtual sayohat, audiokitob va ekskursiya studiyasi o'zbek tilida tabiiy AI ovozida gapiradi (brauzer ovozlari o'zbekcha gapira olmaydi). Har bir matn bir marta yaratilib, MP3 ko'rinishida Netlify Blobs'da keshlanadi va barcha o'quvchilarga keshdan beriladi — bepul limit tejaladi, takroriy tinglash darhol. TTS modeli API'dan avtomatik aniqlanadi. O'qituvchi panelida: platforma ovozini tanlash (10 ta ovoz, namunani tinglash), ovozlarni oldindan tayyorlash navbati (limit tugasa kutib, davom etadi). Trenajyorda har bir personaj (jinsiga qarab) o'z ovozida gapiradi. AI ovozi ishlamasa — brauzer ovoziga qaytadi. `netlify/lib/tts.mjs`, `public/js/narrator.js`. |
| 🎧 **Audiokitob** | Qo'llanma matnini AI ovozida tinglash: butun nazariya yoki tanlangan bo'lim, joriy xatboshi belgilanadi va unga aylantiriladi, keyingi xatboshilar oldindan tayyorlanadi, pastki mini-pleyer (tezlik, avtoaylantirish), xatboshini ikki marta bosib shu joydan davom etish. Oxirigacha tinglansa nazariya o'qildi deb belgilanadi. |
| 🎬 **Ekskursiya studiyasi** | O'quvchi o'z virtual ekskursiyasini yaratadi: 12 tagacha bekat, obida manzarasi va kun vaqti, gid matni (so'z va vaqt hisoblagichi), faktlar; jonli ko'rinish, AI ovozida tinglash, AI metodist tahlili (faktlar aniqligi, hikoya tuzilmasi, til, tavsiyalar), havola orqali ulashish (`#/studio/view/...`). O'qituvchi panelida barcha ekskursiyalar ro'yxati. Ulashilgan ekskursiya uchun XP va “Ekskursiya muallifi” nishoni. |
| 🛂 **Safar pasporti** | O'yinlashtirish: XP ballari (mavzular, trenajyor, marshrut, mustaqil ish, diagnostika, takrorlash, seriya), 8 ta daraja (Sayyoh → Safar ustasi), har bir mavzu uchun animatsiyali "viza muhri", 18 ta nishon, kunlik seriya va faollik kalendari, guruh / texnikum / umumiy reyting (faqat ism va familiyaning bosh harfi; profilda yashirish mumkin). Hisob-kitob: `public/js/gamification.js` (brauzer va server uchun umumiy). |
| 🔁 **Kunlik takrorlash** | Tayanch tushunchalarni Leitner tizimi bo'yicha oraliq takrorlash (1–3–7–14–30 kun): aylanadigan kartalar, klaviatura (Probel, 1, 2), kuniga 10 ta yangi karta. |
| 🤖 **AI Ustoz** | Har bir mavzuda o'quv qo'llanma matniga tayangan savol-javob yordamchisi: tayyor savollar, matnni belgilab "Tushuntirib ber", test javobini to'g'ridan-to'g'ri aytmasdan yo'naltirish (Sokrat usuli). AI kaliti bo'lmasa, qo'llanmadan eng mos parchalarni topadi. |
| 🎓 **Sertifikat** | Shartlar bajarilganda (12+ mavzu, trenajyorda 3 ssenariy va 60+ ball, “Ekskursovod” darajasi) noyob raqamli sertifikat; `#/cert/SA-XXXXXXXX` havolasi orqali istalgan kishi haqiqiyligini tekshiradi; A4 formatda chop etish / PDF. |
| 🔍 **Qulayliklar** | Tezkor qidiruv (Ctrl+K yoki “/”): sahifalar, mavzular, bo'limlar, 145 ta tushuncha, ssenariylar. Yorug' / qorong'i / avtomatik mavzu. Telefonga ilova sifatida o'rnatish (PWA) va internetsiz rejim: oldin ochilgan mavzular va taqdimotlar oflayn ochiladi, natijalar aloqa tiklanganda saqlanadi. |
| 📈 **Ochiq monitoring** | Har bir sahifaning pastida texnikumlar kesimida T0 / T1 / T2 diagnostika natijalari: integral ko'rsatkich B, motivatsiya (anketa) M, test T, darajalar taqsimoti — animatsiyali diagrammalar, faqat umumlashtirilgan ma'lumotlar. |
| 🧪 **Kompleks diagnostika (1-ilova)** | T0 / T1 / T2 bosqichlari (o'qituvchi faol bosqichni ochadi). A — 15 bandli motivatsion anketa, B — 20 savolli test (25 daqiqalik taymer, kalit faqat serverda), C — 3 ta amaliy topshiriq, D — refleksiya varaqasi. O'qituvchi C (6 indikator × 3 topshiriq) va D (5 indikator) ni rubrika bo'yicha baholaydi; M, T, KQ, KK = 0,60×T + 0,40×KQ, P, R, AR = 0,70×P + 0,30×R, B = (M+KK+AR)/3 va darajalar avtomatik hisoblanadi. Anonim respondent kodi (TM-001), individual diagnostika varaqasi, CSV, T0→T2 tahlili (TG/NG, t-mezon, χ², η). |
| 🗺️ **Marshrut laboratoriyasi** | “Turistik marshrutni raqamli modellashtirish” topshirig'i: 4 murakkablik darajasi, Samarqand keysi, hudud tanlash mezonlari, obyektlar ma'lumotlar bazasi (atributlar, manbalar), interaktiv xarita (Leaflet + OpenStreetMap), masofa va vaqt hisobi, variantlarni taqqoslash, marshrutni optimallashtirish, marshrut pasporti, o'z-o'zini baholash, analitik hisobot, refleksiya, GeoJSON/CSV eksport. O'qituvchi 10 mezonli 100 ballik rubrika bilan baholaydi (86–100 yuqori, 71–85 o'rta, 56–70 qoniqarli, 0–55 past). |
| 🎯 **Kasb standarti** | 51010304-Turizm ta'lim dasturi va Gid tarjimon kasbiy standarti (NO1.232.1901/Б-22): mehnat funksiyalari A/01.5–A/07.5 va mehnat harakatlari, kasbiy kompetensiyalar KK-2.1…2.8 (bilim, ko'nikma, modul), umumiy kompetensiyalar UK-1…12, professional modullar. Har bir mavzu, trenajyor ssenariysi va marshrut laboratoriyasi kompetensiyalarga bog'langan; AI baholash kasb standarti talablariga moslikni ham tahlil qiladi. O'quvchining kompetensiya xaritasi va o'qituvchi uchun TG/NG kesimidagi kompetensiyalar jadvali (CSV). Bog'lanishlar: `public/data/standard.js`. |
| 📝 **So'rovnomalar** | Diagnostik va yakuniy bosqich so'rovnomalari, bilim testlari, SUS metodikasi asosidagi trenajyor bahosi, ekspert so'rovnomasi. O'quvchi email va parol bilan kiradi va topshiradi. |
| 🎮 **Safar Live (jonli viktorina)** | Sinfda Kahoot uslubidagi musobaqa: o'qituvchi mavzular, savollar soni va vaqtni tanlab o'yin yaratadi; proyektorda 6 xonali PIN va QR-kod, o'quvchilar telefonda `#/live` sahifasida ism va avatar tanlab qo'shiladi. Savol proyektorda (taymer halqasi, ixtiyoriy AI ovozida o'qish), telefonda 4 ta rangli tugma (▲◆●■). Ball: to'g'ri javob 500 + tezlik uchun 500 gacha + ketma-ketlik bonusi. Javoblar taqsimoti, reyting (o'rin o'zgarishi bilan), yakuniy shohsupa, konfetti, ovoz effektlari (WebAudio), CSV. `public/js/pages/live.js`. |
| ☁️ **So'z buluti (Safar Live)** | Jonli aqliy hujum: o'qituvchi ochiq savol beradi (tayyor savollar ham bor), o'quvchilar PIN/QR orqali qo'shilib 1–3 so'z yuboradi, proyektorda jonli so'z buluti o'sadi — ko'p takrorlangan so'zlar kattaroq (katta-kichik harf va tirnoqlar birlashtiriladi). O'qituvchi nomaqbul so'zni bosib yashiradi, yakunlaydi yoki qayta ochadi, CSV. |
| 🌍 **Geo-sayohat** | GeoGuessr uslubidagi o'yin: topishmoq va manzara bo'yicha O'zbekiston xaritasida 26 ta turistik obyektdan 8 tasining joyini topish. Masofaga qarab 1000 ballgacha, “viloyat” yordami (×0,7), har raunddan keyin to'g'ri joy, masofa va qiziqarli fakt; yakunda xarita bo'yicha tahlil va daraja. “Kun sayohati” — bugungi 8 manzil hamma uchun bir xil. XP va “Geograf gid” nishoni. `public/data/geo.js`, `public/js/pages/geo.js`. |
| 📉 **Test tahlili** | Mavzu testlarining sifat tahlili (klassik test nazariyasi) — o'quvchilarning birinchi urinishdagi javoblari asosida: qiyinlik indeksi p, ajrata olish indeksi D (yuqori/quyi 27%), savol–umumiy ball korrelyatsiyasi r, distraktorlar tahlili, KR-20 ishonchliligi, ballar taqsimoti gistogrammasi. Ehtimoliy xato javob kalitlari, juda oson/qiyin savollar va ishlamayotgan distraktorlar avtomatik belgilanadi. TG/NG filtri, CSV. `netlify/lib/itemstats.mjs`. |
| 📚 **Tadqiqot arxivi** | Dissertatsiya III bobidagi tajriba-sinov natijalari (2024–2026; Shahrisabz, Samarqand, Zomin TMMT; TG 106, NG 107) platformaga kiritilgan: 3.1, 3.9–3.15-jadvallar, T0→T1→T2 dinamikasi; Welch t, Koen d, χ² darajalar sonidan qayta hisoblanib, e'lon qilingan qiymatlar bilan solishtiriladi. Yangi diagnostikalar B indeksi darajalari (past 3 / o'rta 4 / yuqori 5) orqali arxiv bilan birlashtiriladi: ochiq monitoringda “Birlashgan / Tajriba-sinov 2024–2026 / Platforma” va TG/NG filtrlari, TG–NG taqqoslash kartasi; o'qituvchi tahlilida “arxivni qo'shish” varianti. Ro'yxatdan o'tishda arxivdagi texnikum nomlari taklif qilinadi. Ma'lumotlar: `public/data/research-archive.js`. |
| 💾 **Zaxira nusxa** | O'qituvchi panelida barcha ma'lumotlarni (ixtiyoriy — fayllar bilan) bitta JSON faylga yuklab olish va o'qituvchi kodi bilan qayta tiklash. |
| 📊 **O'qituvchi paneli** | Natijalarni yig'ish (savollar bo'yicha taqsimot, M ± SD, darajalar), filtrlar, CSV eksport (Excel), **tajriba-sinov tahlili** (TG/NG, juftlangan va Welch t-mezoni, Pirson χ², Koen d, samaradorlik koeffitsiyenti η), so'rovnoma konstruktori (JSON import/eksport), o'quvchilarni TG/NG guruhlariga ajratish, trenajyor natijalari, mustaqil ishlarni baholash. |

## Texnologiyalar

- Frontend: oddiy HTML/CSS/JavaScript (ES modullar), yig'ish (build) bosqichi talab qilinmaydi — `public/`
- Backend: Netlify Functions (`netlify/functions/api.mjs`) — yagona `/api/*` funksiyasi
- Ma'lumotlar bazasi: Netlify Blobs (alohida server shart emas)
- AI: Claude API (`@anthropic-ai/sdk`)
- Autentifikatsiya: email + parol (scrypt xesh), HMAC imzoli token

## Netlify'ga joylashtirish

1. Ushbu repozitoriyni GitHub'ga joylang.
2. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → GitHub → repozitoriyni tanlang. Sozlamalar `netlify.toml` dan avtomatik olinadi (publish: `public`, functions: `netlify/functions`).
3. **Site configuration → Environment variables** bo'limida qo'shing:

   | O'zgaruvchi | Majburiy | Tavsif |
   |---|---|---|
   | `JWT_SECRET` | ✅ | Uzun tasodifiy satr (masalan, 40+ belgi). Kirish tokenlarini imzolaydi. |
   | `TEACHER_CODE` | ✅ | O'qituvchi ro'yxatdan o'tishi uchun maxfiy kod. Faqat o'qituvchilarga bering. |
   | `GEMINI_API_KEY` | tavsiya | Bepul Google Gemini API kaliti: [aistudio.google.com](https://aistudio.google.com) → Get API key. Trenajyor, ustoz maslahati va AI baholash shu orqali ishlaydi. |
   | `GEMINI_TTS_MODEL` | yo'q | AI ovozi (TTS) modeli. Ko'rsatilmasa, `GEMINI_API_KEY` bilan mavjud TTS modellari API'dan avtomatik aniqlanadi (flash birinchi). Bepul tarifda TTS limiti kichik: o'qituvchi panelidagi “🔊 AI ovozlar” bo'limida ovozlarni oldindan tayyorlab qo'yish tavsiya etiladi. |
   | `GEMINI_MODEL` | yo'q | Standart: `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-lite-latest` — birinchi model band bo'lsa, keyingisi ishlatiladi. |
   | `ANTHROPIC_API_KEY` | yo'q (pullik) | [console.anthropic.com](https://console.anthropic.com) dan olinadi. Agar o'rnatilsa, Gemini o'rniga Claude ishlatiladi. Hech qanday AI kaliti bo'lmasa, trenajyor demo-rejimda ishlaydi. |
   | `ANTHROPIC_MODEL` | yo'q | Standart: `claude-opus-5-5`. Tezroq va arzonroq javob uchun `claude-sonnet-5-5`. |

4. **Deploy** tugmasini bosing. Har bir `git push` dan keyin sayt avtomatik yangilanadi.
5. Saytda **Ro'yxatdan o'tish → O'qituvchi** ni tanlab, `TEACHER_CODE` bilan o'qituvchi profilini yarating.

### Xatoliklarni tekshirish

Ro'yxatdan o'tish yoki kirishda xatolik chiqsa, brauzerda `https://<sayt-nomi>.netlify.app/api/health` ni oching. U ma'lumotlar ombori (Netlify Blobs), `JWT_SECRET`, `TEACHER_CODE` va AI holatini ko'rsatadi.

- `blobs` qatorida "XATO" chiqsa — saytni Netlify'da qayta deploy qiling (**Deploys → Trigger deploy → Clear cache and deploy site**). Bu yordam bermasa, `NETLIFY_SITE_ID` (Site configuration → General → Site ID) va `NETLIFY_BLOBS_TOKEN` (User settings → Applications → Personal access token) o'zgaruvchilarini qo'shing.
- `JWT_SECRET` o'rnatilmagan bo'lsa, server avtomatik maxfiy kalit yaratib, omborda saqlaydi; baribir uni o'zingiz o'rnatish tavsiya etiladi.

> Eslatma: AI baholash 10–20 soniya davom etishi mumkin. Agar Netlify funksiya vaqt chegarasi xatosini bersa, `ANTHROPIC_MODEL=claude-sonnet-5-5` ni o'rnating.

## Cloudflare'ga joylashtirish (Workers)

Platforma Cloudflare Workers'da ham ishlaydi — kod bir xil, faqat kirish nuqtasi (`cloudflare/worker.mjs`) va ombor (`cloudflare/store.mjs`) boshqa: JSON yozuvlar **D1** (SQLite) da, fayllar (taqdimotlar, videolar, AI ovozlari) **Workers KV** da saqlanadi. Sozlamalar — `wrangler.jsonc`, HTTP sarlavhalari — `public/_headers`.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Compute (Workers) → Workers & Pages → Create → Import a repository** → GitHub → `vgt-platform` repozitoriyasini va tarmoqni tanlang.
2. Build sozlamalari: **Build command:** `npm install`, **Deploy command:** `npx wrangler deploy` (standart). D1 bazasi va KV ombori birinchi deploy paytida avtomatik yaratiladi.
3. Worker → **Settings → Variables and Secrets** → **Add** (turi: *Secret*): `TEACHER_CODE`, `GEMINI_API_KEY` (va kerak bo'lsa `JWT_SECRET`, `ANTHROPIC_API_KEY`, `GEMINI_MODEL` …). Keyin **Deployments → Retry/Deploy**.
4. `https://safar-akademiya.<akkaunt>.workers.dev/api/health` ni oching: `blobs: ishlayapti`, `platform: cloudflare` chiqishi kerak.
5. Eski (Netlify) saytdagi ma'lumotlarni ko'chirish: yangi saytda **`#/migrate`** sahifasini oching, eski sayt manzili va `TEACHER_CODE` ni kiriting (ikkala saytda kod bir xil bo'lishi kerak). Foydalanuvchilar, parollar, diagnostika, so'rovnomalar, natijalar, taqdimotlar, videolar va AI ovozlari ko'chadi; eski saytdagi ma'lumotlar o'chirilmaydi. Uzilib qolsa — qayta bosing, to'xtagan joydan davom etadi.
6. O'z domeningiz bo'lsa: Worker → **Settings → Domains & Routes → Add → Custom domain**.

**Bepul reja cheklovlari:** kuniga 100 000 API so'rovi (statik fayllar hisobga kirmaydi), har so'rovga 10 ms protsessor vaqti, D1 — 500 MB (faqat JSON yozuvlar uchun yetarli), KV — 1 GB va kuniga 1 000 ta yozish. Protsessor chegarasi sababli AI ovozi MP3 o'rniga **WAV** formatida saqlanadi (kodlash talab qilinmaydi), parollar esa PBKDF2 bilan xeshlanadi (eski scrypt parollar ham ishlaydi va kirishda yangilanadi). **Workers Paid** ($5/oy) rejasida `TTS_FORMAT=mp3` o'zgaruvchisini qo'shsangiz, ovoz fayllari ~6 marta kichik bo'ladi. Ko'p fayl yuklansa, R2 ombori ulash mumkin: `wrangler.jsonc` ga `"r2_buckets": [{ "binding": "FILES" }]` qo'shiladi (R2 ulansa, fayllar KV o'rniga R2 da saqlanadi).

Lokal sinov: `npx wrangler dev` → http://localhost:8787 (`.dev.vars` faylida `TEACHER_CODE=...`).

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env   # ixtiyoriy: ANTHROPIC_API_KEY ni kiriting
npm run dev            # http://localhost:8888
```

Lokal rejimda ma'lumotlar `.data/` papkasida saqlanadi, o'qituvchi kodi — `ustoz-local` (agar `.env` da boshqasi berilmagan bo'lsa).

## Tadqiqotda foydalanish tartibi

1. O'quvchilar ro'yxatdan o'tadi (guruhini ko'rsatadi).
2. O'qituvchi **O'quvchilar** bo'limida guruhlarni Tajriba (TG) va Nazorat (NG) guruhlariga biriktiradi.
3. O'quvchilar diagnostik so'rovnoma va kirish testini topshiradi.
4. TG platforma va trenajyor bilan, NG an'anaviy usulda o'qiydi.
5. Yakuniy so'rovnoma, yakuniy test va trenajyor bahosi so'rovnomasi topshiriladi.
6. **Tajriba-sinov tahlili** bo'limida statistik natijalar olinadi va CSV ko'rinishida yuklab olinadi.

## Kontentni yangilash

- **O'quv qo'llanma matni** (nazariya, reja, nazorat savollari, testlar, glossariy, rasmlar): qo'llanmaning yangi .docx versiyasidan avtomatik import qilinadi:
  ```bash
  python3 scripts/import-docx.py "Turizmda_raqamli_texnologiyalar.docx"
  ```
  Natija: `public/data/book.js` va `public/img/topics/`. Rasmlarni siqish uchun ImageMagick (`convert`) kerak.
- **Test kalitlari**: `public/data/answer-key.js` — qo'llanmada javoblar kaliti yo'qligi sababli mazmun asosida tuzilgan, o'qituvchi tekshirib chiqishi tavsiya etiladi.
- **Pedagogik qatlam** (mavzu maqsadi, interaktiv metodlar, mustaqil ishlar, resurslar, trenajyor bilan bog'lanish): `public/data/topics.js`.
- **Boshlang'ich so'rovnomalar**: `netlify/lib/seed-surveys.mjs` (birinchi ishga tushirishda bazaga yoziladi; keyin o'qituvchi panelidagi konstruktor orqali tahrirlanadi).
- **Trenajyor ssenariylari**: `netlify/lib/scenarios.mjs` — vaziyat, personaj, kutilmagan hodisalar, marshrut.

## Tuzilma

```
public/                 Frontend (statik)
  index.html
  css/style.css
  data/topics.js        Fan mavzulari
  js/app.js             Marshrutizator
  js/pages/*.js         Sahifalar
  js/methods.js         Interaktiv metodlar
  js/stats.js           Statistik tahlil
netlify/
  functions/api.mjs     API
  lib/                  Ombor, autentifikatsiya, AI, ssenariylar, so'rovnomalar
scripts/dev-server.mjs  Lokal server
```
