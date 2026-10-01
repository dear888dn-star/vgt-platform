// "Turistik marshrutni raqamli modellashtirish" topshirig'ini baholash mezonlari va darajalari.
export const ROUTE_RUBRIC = [
  { title: "Turistik obyektlarni to'g'ri tanlash", max: 10 },
  { title: "Axborot manbalaridan foydalanish", max: 10 },
  { title: "Raqamli xarita bilan ishlash", max: 15 },
  { title: "Obyektlarning fazoviy joylashuvi", max: 10 },
  { title: "Marshrut mantiqiyligi", max: 15 },
  { title: "Masofa va vaqt hisob-kitoblari", max: 10 },
  { title: "Turistik maqsadga muvofiqlik", max: 10 },
  { title: "Raqamli mahsulot sifati", max: 10 },
  { title: "Taqdimot va himoya", max: 5 },
  { title: "Refleksiya", max: 5 },
];

export const ROUTE_LEVELS = [
  { min: 86, label: "Yuqori", text: "O'quvchi marshrutni mustaqil loyihalaydi, ishonchli ma'lumotlardan foydalanadi, raqamli xaritani sifatli shakllantiradi, marshrut parametrlarini hisoblaydi va tanlangan yechimni kasbiy nuqtai nazardan asoslaydi." },
  { min: 71, label: "O'rta", text: "O'quvchi marshrutni asosan mustaqil ishlab chiqadi, raqamli vositalardan to'g'ri foydalanadi, ammo marshrutni optimallashtirish yoki analitik asoslashda ayrim kamchiliklarga yo'l qo'yadi." },
  { min: 56, label: "Qoniqarli", text: "O'quvchi topshiriqning asosiy qismini bajaradi, lekin raqamli xarita, hisob-kitob yoki marshrutni asoslashda o'qituvchi yordamiga ehtiyoj sezadi." },
  { min: 0, label: "Past", text: "O'quvchi marshrutni mustaqil modellashtira olmaydi, raqamli vositalardan foydalanishda qiyinchilikka duch keladi va yakuniy raqamli mahsulot kasbiy talablarga javob bermaydi." },
];

export const routeLevel = (total) => ROUTE_LEVELS.find((l) => total >= l.min).label;
