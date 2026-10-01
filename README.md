# Raqamli Gid Akademiyasi

"Turizmda raqamli texnologiyalar" fani bo'yicha interaktiv ta'lim platformasi va sun'iy intellekt asosidagi **virtual gidlik trenajyori**. Platforma Turizm va madaniy meros texnikumlari o'quvchilarini raqamli kasbiy faoliyatga tayyorlash uchun mo'ljallangan.

## Imkoniyatlar

| Bo'lim | Tavsif |
|---|---|
| 📚 **Mavzular** | “Turizmda raqamli texnologiyalar” o'quv qo'llanmasining (Jizzax, 2025) 15 ta mavzusi: to'liq nazariy matn, jadvallar, muqovalar, nazorat savollari (yozma javob bilan), qo'llanma testlari (variantlar aralashtiriladi), glossariy (flesh-kartalar), konspekt va 9 xil interaktiv metod (aqliy hujum, klaster, Venn diagrammasi, keys-stadi, FSMU, INSERT, moslashtirish, T-jadval, ketma-ketlik). |
| 🧩 **Mustaqil ta'lim** | Shaxsiy o'quv rejasi (muddatlar bilan), mustaqil ish topshiriqlari (matn + havola), o'qituvchi bahosi va izohi, refleksiv kundalik, shaxsiy tavsiyalar. |
| 🎙️ **Virtual gidlik trenajyori** | 10 ta kasbiy ssenariy. AI turist/mijoz rolini o'ynaydi, javoblar real vaqtda oqim bilan chiqadi, mashg'ulot davomida kutilmagan hodisalar kiritiladi, marshrut bekatlari, "Ustoz maslahati", taymer. Yakunda 5 mezon × 20 ball = 100 ballik AI baholash va tavsiyalar. |
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
   | `ANTHROPIC_API_KEY` | tavsiya | [console.anthropic.com](https://console.anthropic.com) dan olinadi. Bo'lmasa trenajyor demo-rejimda (oldindan yozilgan javoblar) ishlaydi. |
   | `ANTHROPIC_MODEL` | yo'q | Standart: `claude-opus-5-5`. Tezroq va arzonroq javob uchun `claude-sonnet-5-5`. |

4. **Deploy** tugmasini bosing. Har bir `git push` dan keyin sayt avtomatik yangilanadi.
5. Saytda **Ro'yxatdan o'tish → O'qituvchi** ni tanlab, `TEACHER_CODE` bilan o'qituvchi profilini yarating.

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
