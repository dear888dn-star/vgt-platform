# Raqamli Gid Akademiyasi

"Turizmda raqamli texnologiyalar" fani bo'yicha interaktiv ta'lim platformasi va sun'iy intellekt asosidagi **virtual gidlik trenajyori**. Platforma Turizm va madaniy meros texnikumlari o'quvchilarini raqamli kasbiy faoliyatga tayyorlash uchun mo'ljallangan.

## Imkoniyatlar

| Bo'lim | Tavsif |
|---|---|
| 📚 **Mavzular** | “Turizmda raqamli texnologiyalar” o'quv qo'llanmasining (Jizzax, 2025) 15 ta mavzusi: to'liq nazariy matn, jadvallar, muqovalar, nazorat savollari (yozma javob bilan), qo'llanma testlari (variantlar aralashtiriladi), glossariy (flesh-kartalar), konspekt va 9 xil interaktiv metod (aqliy hujum, klaster, Venn diagrammasi, keys-stadi, FSMU, INSERT, moslashtirish, T-jadval, ketma-ketlik). |
| 🧩 **Mustaqil ta'lim** | Shaxsiy o'quv rejasi (muddatlar bilan), mustaqil ish topshiriqlari (matn + havola), o'qituvchi bahosi va izohi, refleksiv kundalik, shaxsiy tavsiyalar. |
| 🎙️ **Virtual gidlik trenajyori** | 10 ta kasbiy ssenariy. AI turist/mijoz rolini o'ynaydi, javoblar real vaqtda oqim bilan chiqadi, mashg'ulot davomida kutilmagan hodisalar kiritiladi, marshrut bekatlari, "Ustoz maslahati", taymer. Yakunda 5 mezon × 20 ball = 100 ballik AI baholash va tavsiyalar. |
| 🧪 **Kompleks diagnostika (1-ilova)** | T0 / T1 / T2 bosqichlari (o'qituvchi faol bosqichni ochadi). A — 15 bandli motivatsion anketa, B — 20 savolli test (25 daqiqalik taymer, kalit faqat serverda), C — 3 ta amaliy topshiriq, D — refleksiya varaqasi. O'qituvchi C (6 indikator × 3 topshiriq) va D (5 indikator) ni rubrika bo'yicha baholaydi; M, T, KQ, KK = 0,60×T + 0,40×KQ, P, R, AR = 0,70×P + 0,30×R, B = (M+KK+AR)/3 va darajalar avtomatik hisoblanadi. Anonim respondent kodi (TM-001), individual diagnostika varaqasi, CSV, T0→T2 tahlili (TG/NG, t-mezon, χ², η). |
| 🗺️ **Marshrut laboratoriyasi** | “Turistik marshrutni raqamli modellashtirish” topshirig'i: 4 murakkablik darajasi, Samarqand keysi, hudud tanlash mezonlari, obyektlar ma'lumotlar bazasi (atributlar, manbalar), interaktiv xarita (Leaflet + OpenStreetMap), masofa va vaqt hisobi, variantlarni taqqoslash, marshrutni optimallashtirish, marshrut pasporti, o'z-o'zini baholash, analitik hisobot, refleksiya, GeoJSON/CSV eksport. O'qituvchi 10 mezonli 100 ballik rubrika bilan baholaydi (86–100 yuqori, 71–85 o'rta, 56–70 qoniqarli, 0–55 past). |
| 🎯 **Kasb standarti** | 51010304-Turizm ta'lim dasturi va Gid tarjimon kasbiy standarti (NO1.232.1901/Б-22): mehnat funksiyalari A/01.5–A/07.5 va mehnat harakatlari, kasbiy kompetensiyalar KK-2.1…2.8 (bilim, ko'nikma, modul), umumiy kompetensiyalar UK-1…12, professional modullar. Har bir mavzu, trenajyor ssenariysi va marshrut laboratoriyasi kompetensiyalarga bog'langan; AI baholash kasb standarti talablariga moslikni ham tahlil qiladi. O'quvchining kompetensiya xaritasi va o'qituvchi uchun TG/NG kesimidagi kompetensiyalar jadvali (CSV). Bog'lanishlar: `public/data/standard.js`. |
| 📝 **So'rovnomalar** | Diagnostik va yakuniy bosqich so'rovnomalari, bilim testlari, SUS metodikasi asosidagi trenajyor bahosi, ekspert so'rovnomasi. O'quvchi email va parol bilan kiradi va topshiradi. |
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
