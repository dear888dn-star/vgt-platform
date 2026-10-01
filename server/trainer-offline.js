// AI kaliti bo'lmaganda ishlaydigan oflayn rejim: ssenariy bo'yicha javoblar va kalit so'zlarga asoslangan taxminiy baholash
const POLITE = ['iltimos', 'rahmat', 'kechirasiz', 'marhamat', 'xush kelibsiz', 'hurmatli', 'please', 'thank', 'sorry', 'welcome',
  'пожалуйста', 'спасибо', 'извините', 'добро пожаловать'];
const DIGITAL = ['ilova', 'xarita', 'google', 'yandex', 'navigat', 'onlayn', 'online', 'bron', 'booking', 'qr', 'telegram', 'whatsapp',
  'tarjimon', 'translate', 'gps', 'audio', 'vr', 'ar', '360', 'sayt', 'app', 'click', 'payme', 'karta', 'taksi', 'yandex go', 'приложен', 'карт'];
const SAFETY = ['xavfsiz', 'tibbiy', 'shifokor', '103', '102', '101', '112', 'suv', 'soya', 'politsiya', 'elchixona', 'sug\'urta',
  'birinchi yordam', 'safety', 'doctor', 'police', 'embassy', 'врач', 'полиц', 'вода'];
const PROBLEM = ['taklif', 'muqobil', 'alternativ', 'hal qil', 'yechim', 'reja', 'darhol', 'hozir', 'tekshir', 'qo\'ng\'iroq', 'aloqa',
  'solution', 'option', 'call', 'вариант', 'решени'];

const norm = s => String(s || '').toLowerCase();
const countHits = (text, list) => list.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
const clamp = x => Math.max(1, Math.min(5, Math.round(x)));

function reply(s, lang, messages, eventText) {
  const lines = (s.offline?.[lang] || s.offline?.uz || []);
  const turn = messages.filter(m => m.role === 'user').length;
  const last = norm(messages.filter(m => m.role === 'user').pop()?.content);
  const polite = countHits(last, POLITE) > 0;
  let base = lines[(turn - 1) % Math.max(lines.length, 1)] || 'Tushunarli. Davom etamizmi?';
  if (eventText) base = `*${eventText}*\n${s.offline_event_reaction?.[lang] || s.offline_event_reaction?.uz || 'Endi nima qilamiz?'}`;
  const mood = clamp(3 + (polite ? 1 : 0) + (last.length > 80 ? 1 : 0) - (last.length < 15 ? 1 : 0));
  return `${base}\n<<kayfiyat:${mood}>>`;
}

function hint(s, messages) {
  const turn = messages.filter(m => m.role === 'user').length;
  const hints = s.hints || [];
  return hints[Math.min(turn, hints.length - 1)] || 'Turistni diqqat bilan tinglang, aniq va xushmuomala javob bering, kerak bo\'lsa raqamli vositadan foydalaning.';
}

function evaluate(s, messages, hintsUsed, CRITERIA) {
  const user = messages.filter(m => m.role === 'user').map(m => norm(m.content));
  const all = user.join(' \n ');
  const turns = user.length;
  const avgLen = turns ? all.length / turns : 0;
  const factHits = countHits(all, (s.keywords || []).map(norm));
  const scores = {
    communication: clamp(1 + countHits(all, POLITE) + (avgLen > 60 ? 1 : 0) + (turns >= 4 ? 1 : 0)),
    knowledge: clamp(1 + factHits),
    problem_solving: clamp(1 + countHits(all, PROBLEM) + (turns >= 5 ? 1 : 0)),
    digital: clamp(1 + countHits(all, DIGITAL)),
    safety_ethics: clamp(2 + countHits(all, SAFETY)),
    composure: clamp(2 + (turns >= 3 ? 1 : 0) + (avgLen > 40 ? 1 : 0) - (hintsUsed > 2 ? 1 : 0)),
  };
  const criteria = CRITERIA.map(c => ({
    key: c.key,
    score: turns ? scores[c.key] ?? 3 : 1,
    comment: turns ? 'Oflayn rejimda kalit so\'zlar va javoblar hajmi asosida taxminiy baholandi.' : 'Javob berilmagan.',
  }));
  return {
    mode: 'offline',
    criteria,
    strengths: turns ? ['Mashg\'ulot yakunlandi va suhbat davom ettirildi.'] : [],
    improvements: ['AI rejimida batafsil va aniqroq baholash olish mumkin.'],
    mistakes: [],
    recommendations: [
      'Ssenariy bo\'yicha tarixiy faktlarni qayta takrorlang.',
      'Muloqotda xushmuomalalik iboralaridan (iltimos, marhamat, kechirasiz) foydalaning.',
      'Muammoli vaziyatda kamida ikkita muqobil yechim taklif qiling va raqamli vositalarni nomlang.',
    ],
    summary: 'Bu taxminiy (oflayn) baholash. To\'liq sun\'iy intellekt tahlili uchun administrator ANTHROPIC_API_KEY ni sozlashi kerak.',
  };
}

module.exports = { reply, hint, evaluate };
