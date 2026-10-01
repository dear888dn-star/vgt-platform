// Mustaqil ta'lim bo'limi
import { h, clear, api, toast, fmtDate, modal, stat, bars } from '../util.js';

const TABS = [
  ['topshiriqlar', '📋 Topshiriqlar'],
  ['reja', '🗓 Shaxsiy reja'],
  ['eslatmalar', '🗒 Eslatmalarim'],
  ['glossariy', '🔤 Glossariy'],
  ['natijalar', '📈 Natijalarim'],
];

export async function selfstudyView(tab = 'topshiriqlar') {
  if (!TABS.some(([k]) => k === tab)) tab = 'topshiriqlar';
  const body = h('div', { class: 'tab-body' }, await PANES[tab]());
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, 'Mustaqil ta\'lim'),
      h('p', { class: 'muted' }, 'O\'z o\'quv faoliyatingizni rejalashtiring, topshiriqlarni bajaring va natijalaringizni kuzating.'))),
    h('div', { class: 'tabs' }, TABS.map(([k, l]) => h('a', { class: `tab ${k === tab ? 'active' : ''}`, href: `#/selfstudy/${k}` }, l))),
    body);
}

const PANES = {
  async topshiriqlar() {
    const { assignments } = await api('/selfstudy/assignments');
    const done = assignments.filter(a => a.sub_status).length;
    return h('div', null,
      h('div', { class: 'progress-line' }, h('div', { style: { width: `${assignments.length ? (done / assignments.length) * 100 : 0}%` } })),
      h('p', { class: 'muted' }, `${done}/${assignments.length} topshiriq yuborilgan`),
      h('div', { class: 'assign-list' }, assignments.map(a => h('div', { class: 'panel assign' },
        h('div', { class: 'row space' },
          h('div', null, a.topic_title ? h('small', { class: 'muted' }, `${a.topic_order}. ${a.topic_title}`) : h('small', { class: 'muted' }, 'Umumiy topshiriq'), h('h3', null, a.title)),
          h('span', { class: `badge ${a.sub_status === 'graded' ? 'badge-ok' : a.sub_status ? 'badge-info' : ''}` },
            a.sub_status === 'graded' ? `Baho: ${a.sub_score}/${a.max_score}` : a.sub_status ? 'Tekshirilmoqda' : `${a.max_score} ball`)),
        h('p', null, a.description),
        a.due_date ? h('p', { class: 'small muted' }, `Muddat: ${a.due_date}`) : null,
        a.sub_feedback ? h('div', { class: 'alert alert-info' }, h('b', null, 'O\'qituvchi izohi: '), a.sub_feedback) : null,
        a.sub_status !== 'graded' ? h('button', { class: 'btn btn-sm btn-primary', onclick: () => submitModal(a) }, a.sub_status ? 'Javobni tahrirlash' : 'Bajarish') : null))));
  },

  async reja() {
    const [{ items }, { topics }] = await Promise.all([api('/selfstudy/plan'), api('/topics')]);
    const list = h('div', { class: 'plan-list' });
    const draw = () => clear(list, items.length ? items.map(it => h('label', { class: `plan-item ${it.done ? 'done' : ''}` },
      h('input', { type: 'checkbox', checked: !!it.done, onchange: async e => { await api(`/selfstudy/plan/${it.id}`, { method: 'PATCH', body: { done: e.target.checked } }); it.done = e.target.checked; draw(); } }),
      h('span', { class: 'plan-text' }, it.title, it.topic_title ? h('small', null, ` · ${it.topic_title}`) : null),
      it.due_date ? h('span', { class: `badge ${!it.done && it.due_date < new Date().toISOString().slice(0, 10) ? 'badge-bad' : ''}` }, it.due_date) : null,
      h('button', { class: 'icon-btn', 'aria-label': 'O\'chirish', onclick: async e => { e.preventDefault(); await api(`/selfstudy/plan/${it.id}`, { method: 'DELETE' }); items.splice(items.indexOf(it), 1); draw(); } }, '🗑')))
      : h('p', { class: 'muted' }, 'Rejangiz bo\'sh. Birinchi maqsadingizni qo\'shing!'));
    draw();
    const form = h('form', { class: 'plan-form', onsubmit: async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      await api('/selfstudy/plan', { method: 'POST', body: d });
      const fresh = await api('/selfstudy/plan');
      items.splice(0, items.length, ...fresh.items);
      form.reset();
      draw();
    } },
      h('input', { name: 'title', placeholder: 'Masalan: 7-mavzu testini 90% dan yuqori topshirish', required: true }),
      h('select', { name: 'topic_id' }, h('option', { value: '' }, 'Mavzu (ixtiyoriy)'), topics.map(t => h('option', { value: t.id }, `${t.order_no}. ${t.title}`))),
      h('input', { name: 'due_date', type: 'date' }),
      h('button', { class: 'btn btn-primary' }, 'Qo\'shish'));
    return h('div', null,
      h('div', { class: 'alert alert-info' }, '💡 SMART-maqsad qo\'ying: aniq, o\'lchanadigan, erishiladigan, dolzarb va muddatli.'),
      form, list);
  },

  async eslatmalar() {
    const { notes } = await api('/selfstudy/notes');
    return notes.length ? h('div', null, notes.map(n => h('div', { class: 'panel' },
      h('div', { class: 'row space' }, h('h3', null, n.topic_title), h('a', { class: 'btn btn-sm btn-ghost', href: `#/topic/${n.topic_id}` }, 'Mavzuga o\'tish')),
      h('p', { class: 'pre' }, n.text), h('small', { class: 'muted' }, fmtDate(n.updated_at)))))
      : h('p', { class: 'muted' }, 'Hali eslatma yozmagansiz. Har bir mavzuning "Eslatmalarim" bo\'limida konspekt yuritishingiz mumkin.');
  },

  async glossariy() {
    const { terms } = await api('/selfstudy/glossary');
    const list = h('div', { class: 'glossary' });
    const draw = q => clear(list, terms.filter(t => !q || (t.term + t.definition).toLowerCase().includes(q.toLowerCase()))
      .map(t => h('div', { class: 'gl-item' }, h('b', null, t.term), h('p', null, t.definition), h('a', { class: 'small', href: `#/topic/${t.topic_id}` }, t.topic_title))));
    draw('');
    let mode = 'list';
    const quizBox = h('div');
    const startCards = () => {
      let i = 0;
      const deck = [...terms].sort(() => Math.random() - 0.5);
      const card = () => {
        const t = deck[i % deck.length];
        clear(quizBox, h('button', { class: 'flashcard big', onclick: e => e.currentTarget.classList.toggle('flipped') },
          h('div', { class: 'fc-front' }, t.term), h('div', { class: 'fc-back' }, t.definition)),
        h('div', { class: 'row center' }, h('span', { class: 'muted' }, `${(i % deck.length) + 1}/${deck.length}`), h('button', { class: 'btn', onclick: () => { i++; card(); } }, 'Keyingi →')));
      };
      card();
    };
    return h('div', null,
      h('div', { class: 'row' },
        h('input', { type: 'search', placeholder: 'Atamani qidirish...', oninput: e => draw(e.target.value) }),
        h('button', { class: 'btn', onclick: () => { mode = mode === 'list' ? 'cards' : 'list'; list.hidden = mode === 'cards'; quizBox.hidden = mode === 'list'; if (mode === 'cards') startCards(); } }, '🃏 Kartochkalar rejimi')),
      quizBox, list);
  },

  async natijalar() {
    const o = await api('/selfstudy/overview');
    const { topics } = await api('/topics');
    return h('div', null,
      h('div', { class: 'stats' },
        stat('Tugallangan mavzular', `${o.completed}/${o.totalTopics}`),
        stat('Testlar o\'rtachasi', o.quizAvg != null ? o.quizAvg + '%' : '—'),
        stat('Trenajyor o\'rtachasi', o.trainerAvg ?? '—', `${o.trainerCount} ta mashg'ulot`),
        stat('Topshiriqlar', o.submissions, o.submissionsAvg != null ? `o'rtacha ${o.submissionsAvg}%` : null),
        stat('Sarflangan vaqt', `${o.timeSpentMin} daq`)),
      h('section', { class: 'panel' }, h('h2', null, 'Mavzular bo\'yicha test natijalari'),
        bars(topics.map(t => ({ label: `${t.order_no}. ${t.title}`, value: t.quiz_best != null ? Math.round(t.quiz_best) : 0, display: t.quiz_best != null ? `${Math.round(t.quiz_best)}%` : '—' })), { max: 100, colorByValue: true })),
      o.trainerHistory.length ? h('section', { class: 'panel' }, h('h2', null, 'Trenajyor natijalari dinamikasi'),
        bars(o.trainerHistory.map((s, i) => ({ label: `${i + 1}-mashg'ulot`, value: s.score_total })), { max: 100, colorByValue: true })) : null);
  },
};

function submitModal(a) {
  const text = h('textarea', { rows: 10, placeholder: 'Javobingizni shu yerga yozing...' }, a.answer_text || '');
  const link = h('input', { type: 'url', placeholder: 'https:// (Google Drive, Canva va h.k. havolasi — ixtiyoriy)', value: a.link || '' });
  const m = modal(a.title, h('div', null, h('p', { class: 'muted' }, a.description),
    h('label', { class: 'field' }, h('span', null, 'Javob matni'), text),
    h('label', { class: 'field' }, h('span', null, 'Fayl/loyiha havolasi'), link)), [
    h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, 'Bekor qilish'),
    h('button', { class: 'btn btn-primary', onclick: async () => {
      try {
        await api(`/selfstudy/assignments/${a.id}/submit`, { method: 'POST', body: { answer_text: text.value, link: link.value } });
        toast('Topshiriq yuborildi');
        m.close();
        location.hash = '#/selfstudy/topshiriqlar';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (e) { toast(e.message, 'error'); }
    } }, 'Yuborish')]);
}
