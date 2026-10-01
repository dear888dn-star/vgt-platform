// Virtual gidlik trenajyori — interfeys
import { h, clear, api, toast, modal, fmtDate, fmtDuration } from '../util.js';
import { onLeave, state } from '../app.js';

const MOOD = ['', '😠', '😟', '😐', '🙂', '😄'];
const MOOD_TEXT = ['', 'Juda norozi', 'Norozi', 'Betaraf', 'Mamnun', 'Juda mamnun'];
const MOOD_RE = /<<kayfiyat:\s*(\d)\s*>>/gi;
const SPEECH_LANG = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
const LEVEL_CLASS = { 'Boshlang\'ich': 'lvl-1', 'O\'rta': 'lvl-2', 'Murakkab': 'lvl-3' };

const clean = s => String(s).replace(MOOD_RE, '').trim();

export async function trainerView() {
  const [data, hist] = await Promise.all([api('/trainer/scenarios'), api('/trainer/sessions')]);
  return h('div', { class: 'page' },
    h('section', { class: 'trainer-hero' },
      h('div', null,
        h('h1', null, '🧭 Virtual gidlik trenajyori'),
        h('p', null, 'Sun\'iy intellekt turist rolini o\'ynaydi va sizni real kasbiy vaziyatlarga soladi. Vaziyat real vaqt rejimida o\'zgaradi — kutilmagan hodisalarga tez va to\'g\'ri munosabat bildiring. Yakunda 6 mezon bo\'yicha baholanasiz.'),
        h('div', { class: 'row wrap' },
          h('span', { class: `badge ${data.aiEnabled ? 'badge-ok' : 'badge-warn'}` }, data.aiEnabled ? '● AI rejimi faol' : '● Oflayn (namuna) rejim'),
          data.criteria.map(c => h('span', { class: 'badge' }, c.name))))),
    !data.aiEnabled ? h('div', { class: 'alert alert-warn' }, 'Sun\'iy intellekt kaliti sozlanmagan — trenajyor ssenariy bo\'yicha tayyor javoblar bilan ishlaydi va taxminiy baholaydi. To\'liq AI rejimi uchun administrator serverda ANTHROPIC_API_KEY ni o\'rnatishi kerak.') : null,
    h('div', { class: 'scenario-grid' }, data.scenarios.map(s => h('article', { class: 'scenario-card' },
      h('div', { class: 'sc-icon' }, s.icon),
      h('div', { class: 'sc-body' },
        h('div', { class: 'row wrap' }, h('span', { class: `badge ${LEVEL_CLASS[s.level] || ''}` }, s.level), h('span', { class: 'badge' }, `⏱ ${s.duration_min} daq`), h('span', { class: 'badge' }, `⚡ ${s.events_count} kutilmagan vaziyat`)),
        h('h3', null, s.title),
        h('p', { class: 'muted small' }, '📍 ', s.location),
        h('p', null, s.situation),
        h('div', { class: 'row space' },
          h('span', { class: 'small muted' }, s.attempts ? `Urinishlar: ${s.attempts} · Eng yaxshi: ${s.best}` : 'Hali o\'tilmagan'),
          h('button', { class: 'btn btn-primary', onclick: () => startModal(s, data.languages) }, 'Boshlash ▶')))))),
    hist.sessions.length ? h('section', { class: 'panel' },
      h('h2', null, 'Mashg\'ulotlar tarixi'),
      h('div', { class: 'table-wrap' }, h('table', null,
        h('thead', null, h('tr', null, ['Ssenariy', 'Til', 'Holat', 'Ball', 'Davomiyligi', 'Sana', ''].map(x => h('th', null, x)))),
        h('tbody', null, hist.sessions.map(s => h('tr', null,
          h('td', null, s.scenario_title), h('td', null, s.language.toUpperCase()),
          h('td', null, s.status === 'finished' ? 'Yakunlangan' : 'Davom etmoqda'),
          h('td', null, s.score_total != null ? h('b', null, s.score_total) : '—'),
          h('td', null, fmtDuration(s.duration_sec)), h('td', null, fmtDate(s.started_at)),
          h('td', null, h('a', { href: `#/trainer/session/${s.id}` }, s.status === 'finished' ? 'Natija' : 'Davom ettirish')))))))) : null);
}

function startModal(s, languages) {
  let lang = 'uz';
  const m = modal(s.title, h('div', null,
    h('p', null, s.situation),
    h('h4', null, 'Sizning vazifalaringiz:'), h('ul', null, s.goals.map(g => h('li', null, g))),
    h('h4', null, 'Foydali raqamli vositalar:'), h('div', { class: 'chips' }, s.digital_tools.map(t => h('span', { class: 'chip' }, t))),
    h('h4', null, 'Muloqot tili:'),
    h('div', { class: 'seg' }, languages.map(l => h('label', null, h('input', { type: 'radio', name: 'lang', value: l.code, checked: l.code === 'uz', onchange: () => { lang = l.code; } }), h('span', null, l.name)))),
    h('p', { class: 'muted small' }, `Mashg'ulot vaqti: ${s.duration_min} daqiqa. Taymer boshlash tugmasini bosganingizdan so'ng ishga tushadi.`)), [
    h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, 'Bekor qilish'),
    h('button', { class: 'btn btn-primary', onclick: async () => {
      const { id } = await api('/trainer/sessions', { method: 'POST', body: { scenario_id: s.id, language: lang } });
      m.close();
      location.hash = `#/trainer/session/${id}`;
    } }, 'Mashg\'ulotni boshlash')]);
}

export async function trainerSessionView(id) {
  const { session, criteria } = await api(`/trainer/sessions/${id}`);
  if (session.status === 'finished') return resultView(session, criteria);
  return liveView(session);
}

function liveView(session) {
  const sc = session.scenario;
  const chat = h('div', { class: 'chat', 'aria-live': 'polite' });
  const moodEl = h('div', { class: 'mood' });
  const timerEl = h('div', { class: 'timer' });
  const eventsEl = h('ul', { class: 'events' });
  let mood = 3, busy = false, speak = false;
  let elapsed = session.elapsed_sec || 0;
  const limit = sc.duration_min * 60;

  const setMood = v => {
    if (!v) return;
    mood = v;
    clear(moodEl, h('span', { class: 'mood-emoji' }, MOOD[v]), h('div', null, h('b', null, 'Turist kayfiyati'), h('div', { class: 'mood-bar' }, [1, 2, 3, 4, 5].map(i => h('span', { class: i <= v ? `on m${v}` : '' }))), h('small', null, MOOD_TEXT[v])));
  };
  const addMsg = (role, text) => {
    const el = h('div', { class: `msg msg-${role}` },
      role === 'event' ? h('div', { class: 'msg-event' }, '⚡ Kutilmagan vaziyat: ', text)
        : h('div', { class: 'bubble' }, h('small', null, role === 'user' ? 'Siz (gid)' : 'Turist'), h('div', { class: 'msg-text' }, renderRP(text))));
    chat.append(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
  };
  for (const m of session.messages) {
    if (m.role === 'event') { if (!m.timeup) { addMsg('event', m.content); eventsEl.append(h('li', null, m.content)); } }
    else {
      addMsg(m.role === 'user' ? 'user' : 'assistant', clean(m.content));
      const mm = [...String(m.content).matchAll(MOOD_RE)].pop();
      if (mm) mood = Number(mm[1]);
    }
  }
  setMood(mood);

  const tick = () => {
    elapsed++;
    const left = limit - elapsed;
    timerEl.className = `timer ${left < 0 ? 'over' : left < 120 ? 'warn' : ''}`;
    clear(timerEl, h('span', null, left >= 0 ? '⏳ ' : '⌛ '), h('b', null, fmtDuration(Math.abs(left))), h('small', null, left >= 0 ? 'qoldi' : 'vaqt oshdi'));
  };
  tick();
  const timer = setInterval(tick, 1000);
  onLeave(() => { clearInterval(timer); window.speechSynthesis?.cancel(); rec?.abort?.(); });

  const input = h('textarea', { class: 'chat-input', rows: 2, placeholder: 'Turistga javobingizni yozing... (Enter — yuborish, Shift+Enter — yangi qator)' });
  const sendBtn = h('button', { class: 'btn btn-primary' }, 'Yuborish');
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  sendBtn.addEventListener('click', () => send());

  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    input.value = '';
    addMsg('user', text);
    const el = addMsg('assistant', '');
    const textEl = el.querySelector('.msg-text');
    textEl.append(h('span', { class: 'typing' }, h('i'), h('i'), h('i')));
    let acc = '';
    try {
      const res = await fetch(`/api/trainer/sessions/${session.id}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Xato');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const ev = /^event: (\w+)/m.exec(chunk)?.[1];
          const data = JSON.parse(/^data: (.*)$/m.exec(chunk)?.[1] || '{}');
          if (ev === 'event') {
            chat.insertBefore(h('div', { class: 'msg msg-event' }, h('div', { class: 'msg-event' }, '⚡ Kutilmagan vaziyat: ', data.text)), el);
            eventsEl.append(h('li', null, data.text));
            toast('⚡ Vaziyat o\'zgardi!', 'warn');
          } else if (ev === 'delta') {
            acc += data.text;
            clear(textEl, renderRP(clean(acc.replace(/<<[^>]*$/, ''))));
            chat.scrollTop = chat.scrollHeight;
          } else if (ev === 'done') {
            setMood(data.mood);
            if (speak) say(clean(acc), session.language);
          } else if (ev === 'error') {
            clear(textEl, h('span', { class: 'bad-text' }, data.error));
          }
        }
      }
    } catch (e) {
      clear(textEl, h('span', { class: 'bad-text' }, e.message));
    }
    busy = false; sendBtn.disabled = false;
    input.focus();
  }

  // Ovozli kiritish (Web Speech API, brauzer qo'llasa)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  const micBtn = SR ? h('button', { class: 'btn btn-ghost', title: 'Ovoz bilan javob berish', onclick: () => {
    if (rec) { rec.stop(); return; }
    rec = new SR();
    rec.lang = SPEECH_LANG[session.language] || 'uz-UZ';
    rec.interimResults = true;
    const base = input.value;
    rec.onresult = e => { input.value = base + [...e.results].map(r => r[0].transcript).join(''); };
    rec.onend = () => { rec = null; micBtn.classList.remove('rec'); };
    rec.onerror = () => toast('Ovozni aniqlab bo\'lmadi', 'error');
    micBtn.classList.add('rec');
    rec.start();
  } }, '🎤') : null;
  const ttsBtn = window.speechSynthesis ? h('button', { class: 'btn btn-ghost', title: 'Turist javoblarini ovozli o\'qish', onclick: () => {
    speak = !speak; ttsBtn.classList.toggle('active', speak); toast(speak ? 'Ovozli o\'qish yoqildi' : 'Ovozli o\'qish o\'chirildi');
  } }, '🔊') : null;

  const hintBtn = h('button', { class: 'btn btn-ghost', onclick: async () => {
    hintBtn.disabled = true;
    try {
      const { hint } = await api(`/trainer/sessions/${session.id}/hint`, { method: 'POST' });
      modal('💡 Murabbiy maslahati', h('div', { class: 'pre' }, hint), []);
    } catch (e) { toast(e.message, 'error'); }
    hintBtn.disabled = false;
  } }, '💡 Maslahat (−2 ball)');
  const finishBtn = h('button', { class: 'btn btn-gold', onclick: async () => {
    if (!confirm('Mashg\'ulotni yakunlab, baholashga yuborasizmi?')) return;
    finishBtn.disabled = true;
    finishBtn.textContent = 'Baholanmoqda...';
    try {
      await api(`/trainer/sessions/${session.id}/finish`, { method: 'POST' });
      clearInterval(timer);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (e) { toast(e.message, 'error'); finishBtn.disabled = false; finishBtn.textContent = 'Yakunlash va baholash'; }
  } }, 'Yakunlash va baholash');

  setTimeout(() => input.focus(), 50);
  return h('div', { class: 'page trainer-live' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/trainer' }, 'Trenajyor'), ' / ', sc.title),
    h('div', { class: 'live-grid' },
      h('aside', { class: 'live-side' },
        h('div', { class: 'panel' }, h('div', { class: 'sc-icon' }, sc.icon), h('h2', null, sc.title), h('p', { class: 'muted small' }, '📍 ', sc.location), h('p', null, sc.situation)),
        h('div', { class: 'panel live-status' }, timerEl, moodEl),
        h('details', { class: 'panel', open: true }, h('summary', null, '🎯 Vazifalar'), h('ul', null, sc.goals.map(g => h('li', null, g)))),
        h('details', { class: 'panel' }, h('summary', null, '📱 Raqamli vositalar'), h('ul', null, sc.digital_tools.map(g => h('li', null, g)))),
        h('details', { class: 'panel', open: true }, h('summary', null, '⚡ Vaziyat o\'zgarishlari'), eventsEl)),
      h('section', { class: 'live-chat panel' },
        chat,
        h('div', { class: 'composer' }, input, h('div', { class: 'composer-btns' }, micBtn, ttsBtn, sendBtn)),
        h('div', { class: 'row space' }, hintBtn, finishBtn))));
}

function renderRP(text) {
  // *harakat tasviri* — kursivda ko'rsatiladi
  const parts = String(text).split(/(\*[^*]+\*)/g);
  return parts.map(p => (/^\*[^*]+\*$/.test(p) ? h('em', { class: 'rp-action' }, p.slice(1, -1)) : p));
}

function say(text, lang) {
  const u = new SpeechSynthesisUtterance(text.replace(/\*[^*]+\*/g, ''));
  u.lang = SPEECH_LANG[lang] || 'uz-UZ';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function resultView(s, criteria) {
  const fb = s.feedback || {};
  const scores = s.scores || [];
  const byKey = Object.fromEntries(scores.map(c => [c.key, c]));
  const list = (title, items, cls) => items?.length ? h('div', { class: `panel fb ${cls}` }, h('h3', null, title), h('ul', null, items.map(x => h('li', null, x)))) : null;
  const isOwner = s.user_id === state.user.id;
  return h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: state.user.role === 'student' ? '#/trainer' : '#/teacher/trainer' }, 'Trenajyor'), ' / Natija'),
    h('section', { class: 'result-head' },
      h('div', { class: 'progress-ring big', style: { '--p': s.score_total } }, h('span', null, s.score_total), h('small', null, '100 dan')),
      h('div', null,
        h('h1', null, s.scenario?.title),
        h('p', { class: 'muted' }, `${fmtDate(s.finished_at)} · Davomiyligi: ${fmtDuration(s.duration_sec)} · Maslahatlar: ${s.hints_used} · Til: ${s.language.toUpperCase()} · ${s.mode === 'ai' ? 'AI baholash' : 'Oflayn baholash'}`),
        fb.summary ? h('p', { class: 'lead' }, fb.summary) : null,
        fb.note ? h('div', { class: 'alert alert-warn' }, fb.note) : null,
        isOwner ? h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/trainer' }, 'Boshqa ssenariy'),
          h('button', { class: 'btn', onclick: async () => {
            const { id } = await api('/trainer/sessions', { method: 'POST', body: { scenario_id: s.scenario_id, language: s.language } });
            location.hash = `#/trainer/session/${id}`;
          } }, '↻ Qayta urinish')) : null)),
    h('section', { class: 'panel' }, h('h2', null, 'Mezonlar bo\'yicha baholash'),
      h('div', { class: 'criteria' }, criteria.map(c => {
        const sc = byKey[c.key] || { score: 0, comment: '' };
        return h('div', { class: 'criterion' },
          h('div', { class: 'row space' }, h('b', null, c.name), h('span', { class: `score-pill s${sc.score}` }, `${sc.score}/5`)),
          h('div', { class: 'bar-track' }, h('div', { class: `bar-fill ${sc.score <= 2 ? 'low' : sc.score === 3 ? 'mid' : 'high'}`, style: { width: `${sc.score * 20}%` } })),
          h('p', { class: 'small' }, sc.comment));
      }))),
    h('div', { class: 'grid-2' },
      list('✅ Kuchli tomonlar', fb.strengths, 'ok'),
      list('🔧 Yaxshilash kerak', fb.improvements, 'warn'),
      list('❗ Xatolar', fb.mistakes, 'bad'),
      list('📌 Tavsiyalar', fb.recommendations, 'info')),
    h('details', { class: 'panel' }, h('summary', null, 'Suhbat matni (transkript)'),
      h('div', { class: 'chat chat-static' }, s.messages.filter(m => !m.timeup).map(m => h('div', { class: `msg msg-${m.role === 'user' ? 'user' : m.role === 'event' ? 'event' : 'assistant'}` },
        m.role === 'event' ? h('div', { class: 'msg-event' }, '⚡ ', m.content)
          : h('div', { class: 'bubble' }, h('small', null, m.role === 'user' ? 'Gid' : 'Turist'), h('div', { class: 'msg-text' }, renderRP(clean(m.content)))))))));
}
