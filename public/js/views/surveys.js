// So'rovnomalar: ro'yxat va to'ldirish oynasi
import { h, clear, api, toast } from '../util.js';

const KIND_NAMES = { pre: 'Kirish diagnostikasi', post: 'Yakuniy diagnostika', trainer: 'Trenajyor', feedback: 'Fikr-mulohaza', expert: 'Ekspert baholash', other: 'Boshqa' };
export const DEFAULT_LIKERT = ['Mutlaqo qo\'shilmayman', 'Qo\'shilmayman', 'Betarafman', 'Qo\'shilaman', 'To\'liq qo\'shilaman'];
export { KIND_NAMES };

export async function surveysView() {
  const { surveys } = await api('/surveys');
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, 'So\'rovnomalar'),
      h('p', { class: 'muted' }, 'Sizning javoblaringiz ilmiy tadqiqot natijalarini shakllantirishda umumlashtirilgan holda foydalaniladi. Iltimos, samimiy javob bering.'))),
    surveys.length ? h('div', { class: 'survey-list' }, surveys.map(s => h('article', { class: `panel survey-card ${s.my_count && !s.allow_multiple ? 'done' : ''}` },
      h('div', { class: 'row wrap' }, h('span', { class: 'badge badge-info' }, KIND_NAMES[s.kind] || s.kind), h('span', { class: 'badge' }, `${s.question_count} blok`),
        s.my_count ? h('span', { class: 'badge badge-ok' }, 'To\'ldirilgan ✓') : null),
      h('h3', null, s.title),
      h('p', { class: 'muted' }, s.description),
      s.my_count && !s.allow_multiple ? h('span', { class: 'muted small' }, 'Rahmat! Siz bu so\'rovnomadan o\'tgansiz.')
        : h('a', { class: 'btn btn-primary', href: `#/survey/${s.id}` }, 'To\'ldirish →'))))
      : h('p', { class: 'muted' }, 'Hozircha faol so\'rovnomalar yo\'q.'));
}

export async function surveyView(id) {
  const { survey, myResponses } = await api(`/surveys/${id}`);
  if (myResponses.length && !survey.allow_multiple) {
    return h('div', { class: 'page narrow' }, h('div', { class: 'panel center' }, h('h2', null, '✅ Rahmat!'), h('p', null, 'Siz bu so\'rovnomadan o\'tgansiz.'), h('a', { class: 'btn', href: '#/surveys' }, 'So\'rovnomalarga qaytish')));
  }
  const answers = {};
  const blocks = survey.questions.map((q, i) => questionBlock(q, i, answers));
  const progress = h('div', { class: 'progress-line sticky' }, h('div'));
  const updateProgress = () => {
    const total = survey.questions.length;
    const done = survey.questions.filter(q => isAnswered(q, answers[q.id])).length;
    progress.firstChild.style.width = `${(done / total) * 100}%`;
  };
  const form = h('form', { class: 'survey-form', oninput: updateProgress, onchange: updateProgress, onsubmit: async e => {
    e.preventDefault();
    const missing = survey.questions.find(q => q.required !== false && q.type !== 'text' && !isAnswered(q, answers[q.id]));
    if (missing) {
      toast('Barcha majburiy savollarga javob bering', 'error');
      document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(`q-${missing.id}`)?.classList.add('bad');
      return;
    }
    try {
      await api(`/surveys/${survey.id}/respond`, { method: 'POST', body: { answers } });
      toast('Javoblaringiz qabul qilindi. Rahmat!');
      location.hash = '#/surveys';
    } catch (ex) { toast(ex.message, 'error'); }
  } },
    blocks,
    h('button', { class: 'btn btn-primary btn-lg', type: 'submit' }, 'Javoblarni yuborish'));
  return h('div', { class: 'page narrow' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/surveys' }, 'So\'rovnomalar')),
    h('header', { class: 'survey-head' }, h('h1', null, survey.title), h('p', { class: 'muted' }, survey.description)),
    progress, form);
}

function isAnswered(q, v) {
  if (v == null || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (q.type === 'matrix') return (q.rows || []).every((_, i) => v[i] != null);
  return true;
}

let lastSection = null;
export function questionBlock(q, i, answers) {
  const req = q.required !== false && q.type !== 'text';
  if (i === 0) lastSection = null;
  const sectionHead = q.section && q.section !== lastSection ? h('h2', { class: 'survey-section' }, q.section) : null;
  if (q.section) lastSection = q.section;
  const name = `q_${q.id}`;
  let input;
  const set = v => { answers[q.id] = v; document.getElementById(`q-${q.id}`)?.classList.remove('bad'); };
  switch (q.type) {
    case 'single':
      input = h('div', { class: 'options' }, q.options.map(o => h('label', { class: 'option' }, h('input', { type: 'radio', name, value: o, onchange: () => set(o) }), h('span', null, o))));
      break;
    case 'multiple':
      input = h('div', { class: 'options' }, q.options.map(o => h('label', { class: 'option' }, h('input', { type: 'checkbox', value: o, onchange: e => {
        const cur = new Set(answers[q.id] || []);
        e.target.checked ? cur.add(o) : cur.delete(o);
        set([...cur]);
      } }), h('span', null, o))));
      break;
    case 'likert': {
      const opts = q.options || DEFAULT_LIKERT;
      input = h('div', { class: 'likert' }, opts.map((o, j) => h('label', { class: 'likert-opt' }, h('input', { type: 'radio', name, value: j + 1, onchange: () => set(j + 1) }), h('b', null, j + 1), h('span', null, o))));
      break;
    }
    case 'scale': {
      const min = q.min ?? 1, max = q.max ?? 10;
      input = h('div', { class: 'scale' }, Array.from({ length: max - min + 1 }, (_, k) => min + k).map(v =>
        h('label', { class: 'scale-opt' }, h('input', { type: 'radio', name, value: v, onchange: () => set(v) }), h('span', null, v))));
      break;
    }
    case 'number':
      input = h('input', { type: 'number', min: q.min, max: q.max, oninput: e => set(e.target.value === '' ? null : Number(e.target.value)) });
      break;
    case 'matrix': {
      const cols = q.columns || DEFAULT_LIKERT;
      const val = {};
      input = h('div', { class: 'table-wrap' }, h('table', { class: 'matrix' },
        h('thead', null, h('tr', null, h('th', null, ''), cols.map((c, j) => h('th', { title: c }, h('b', null, j + 1), h('small', null, c))))),
        h('tbody', null, q.rows.map((row, r) => h('tr', null, h('td', null, typeof row === 'object' ? row.text : row),
          cols.map((c, j) => h('td', { class: 'center' }, h('label', { class: 'cell', title: c }, h('input', { type: 'radio', name: `${name}_${r}`, value: j + 1, onchange: () => { val[r] = j + 1; set({ ...val }); } })))))))));
      break;
    }
    default:
      input = h('textarea', { rows: 4, oninput: e => set(e.target.value) });
  }
  return [sectionHead, h('fieldset', { class: 'survey-q', id: `q-${q.id}` },
    h('legend', null, h('span', { class: 'qnum' }, i + 1), q.text, req ? h('span', { class: 'req' }, ' *') : null),
    input)];
}
