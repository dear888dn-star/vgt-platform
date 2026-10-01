// O'qituvchi va administrator paneli
import { h, clear, api, toast, fmtDate, fmtDuration, stat, bars, modal, md, ROLE_NAMES } from '../util.js';
import { KIND_NAMES, DEFAULT_LIKERT } from './surveys.js';
import { METHOD_TYPES } from './methods.js';
import { state } from '../app.js';

const refresh = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
const groupSelect = (groups, current, onChange) => h('select', { onchange: e => onChange(e.target.value) },
  h('option', { value: '' }, 'Barcha guruhlar'), groups.map(g => h('option', { value: g, selected: g === current }, g)));

// ===================== Bosh panel =====================
export async function dashboardView() {
  const d = await api('/admin/dashboard');
  const KIND = { survey: '📝 So\'rovnoma', trainer: '🧭 Trenajyor', submission: '📋 Topshiriq' };
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, `${ROLE_NAMES[state.user.role]} paneli`), h('p', { class: 'muted' }, 'Platforma bo\'yicha umumiy ko\'rsatkichlar va tadqiqot natijalari'))),
    h('div', { class: 'stats' },
      stat('O\'quvchilar', d.students), stat('So\'rovnoma javoblari', d.surveyResponses), stat('Trenajyor mashg\'ulotlari', d.trainerSessions),
      stat('Tekshirilmagan topshiriqlar', d.pendingSubmissions), stat('Mavzular', d.topics)),
    h('div', { class: 'grid-2' },
      h('section', { class: 'panel' }, h('h2', null, 'Guruhlar bo\'yicha o\'quvchilar'),
        d.groups.length ? bars(d.groups.map(g => ({ label: g.group_name || 'Guruhsiz', value: g.c }))) : h('p', { class: 'muted' }, 'Hali o\'quvchilar yo\'q')),
      h('section', { class: 'panel' }, h('h2', null, 'So\'nggi faollik'),
        d.recent.length ? h('ul', { class: 'activity' }, d.recent.map(r => h('li', null, h('span', null, KIND[r.kind]), h('b', null, r.full_name), h('span', { class: 'muted' }, r.what), h('small', null, fmtDate(r.at)))))
          : h('p', { class: 'muted' }, 'Faollik yo\'q'))),
    h('div', { class: 'grid-2 cards' },
      h('a', { class: 'card card-link accent-purple', href: '#/teacher/surveys' }, h('div', { class: 'card-icon' }, '📝'), h('h3', null, 'So\'rovnoma natijalari'), h('p', null, 'Diagrammalar, komponentlar indeksi, oldin/keyin taqqoslash (t-test), CSV eksport.')),
      h('a', { class: 'card card-link accent-gold', href: '#/teacher/trainer' }, h('div', { class: 'card-icon' }, '🧭'), h('h3', null, 'Trenajyor hisobotlari'), h('p', null, 'Mezonlar bo\'yicha o\'rtacha ballar, o\'quvchilar dinamikasi, transkriptlar.'))));
}

// ===================== O'quvchilar =====================
export async function studentsView() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const group = params.get('group') || '';
  const [{ students }, dash] = await Promise.all([api(`/admin/students?group=${encodeURIComponent(group)}`), api('/admin/dashboard')]);
  const groups = dash.groups.map(g => g.group_name).filter(Boolean);
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'O\'quvchilar'), h('p', { class: 'muted' }, `${students.length} nafar`)),
      groupSelect(groups, group, g => { location.hash = `#/teacher/students?group=${encodeURIComponent(g)}`; })),
    h('div', { class: 'table-wrap panel' }, h('table', null,
      h('thead', null, h('tr', null, ['F.I.Sh.', 'Guruh', 'Mavzular', 'Test o\'rt.', 'Trenajyor', 'Trenajyor o\'rt.', 'So\'rovnomalar', 'Topshiriqlar'].map(x => h('th', null, x)))),
      h('tbody', null, students.map(s => h('tr', null,
        h('td', null, h('a', { href: `#/teacher/student/${s.id}` }, s.full_name), h('div', { class: 'small muted' }, s.email)),
        h('td', null, s.group_name || '—'), h('td', null, s.topics_done), h('td', null, s.quiz_avg != null ? s.quiz_avg + '%' : '—'),
        h('td', null, s.trainer_count), h('td', null, s.trainer_avg ?? '—'), h('td', null, s.surveys_done), h('td', null, s.submissions)))))));
}

export async function studentView(id) {
  const d = await api(`/admin/students/${id}`);
  const u = d.user;
  return h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/teacher/students' }, 'O\'quvchilar'), ' / ', u.full_name),
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, u.full_name), h('p', { class: 'muted' }, [u.email, u.college, u.group_name, u.course && `${u.course}-kurs`].filter(Boolean).join(' · ')))),
    h('div', { class: 'grid-2' },
      h('section', { class: 'panel' }, h('h2', null, 'Mavzular va testlar'),
        d.progress.length ? bars(d.progress.map(p => ({ label: p.title, value: p.quiz_best != null ? Math.round(p.quiz_best) : 0, display: `${p.quiz_best != null ? Math.round(p.quiz_best) + '%' : '—'} ${p.status === 'completed' ? '✓' : ''}` })), { max: 100, colorByValue: true }) : h('p', { class: 'muted' }, 'Ma\'lumot yo\'q')),
      h('section', { class: 'panel' }, h('h2', null, 'Trenajyor dinamikasi'),
        d.trainer.length ? [bars(d.trainer.map((t, i) => ({ label: `${i + 1}. ${t.scenario_id}`, value: t.score_total })), { max: 100, colorByValue: true }),
          h('ul', { class: 'small' }, d.trainer.map(t => h('li', null, h('a', { href: `#/trainer/session/${t.id}` }, `${t.scenario_id} — ${t.score_total} ball`), ` (${fmtDate(t.finished_at)})`)))]
          : h('p', { class: 'muted' }, 'Mashg\'ulotlar yo\'q'))),
    h('section', { class: 'panel' }, h('h2', null, 'Interaktiv metodlardagi javoblar'),
      d.methods.length ? d.methods.map(m => h('details', { class: 'method-resp' },
        h('summary', null, h('b', null, METHOD_TYPES[m.method_type] || m.method_type), ` · ${m.topic_title}`, m.score != null ? ` · ${m.score}%` : '', h('small', { class: 'muted' }, ' ' + fmtDate(m.created_at))),
        h('pre', { class: 'json' }, JSON.stringify(m.response, null, 2)))) : h('p', { class: 'muted' }, 'Javoblar yo\'q')),
    h('div', { class: 'grid-2' },
      h('section', { class: 'panel' }, h('h2', null, 'So\'rovnomalar'), d.surveys.length ? h('ul', null, d.surveys.map(s => h('li', null, h('a', { href: `#/teacher/survey/${s.survey_id}/results` }, s.title), ` — ${fmtDate(s.created_at)}`))) : h('p', { class: 'muted' }, 'Yo\'q')),
      h('section', { class: 'panel' }, h('h2', null, 'Topshiriqlar'), d.submissions.length ? h('ul', null, d.submissions.map(s => h('li', null, `${s.title}: `, s.status === 'graded' ? h('b', null, `${s.score}/${s.max_score}`) : h('i', null, 'tekshirilmagan')))) : h('p', { class: 'muted' }, 'Yo\'q'))));
}

// ===================== So'rovnomalar =====================
export async function surveysAdminView() {
  const { surveys } = await api('/surveys?all=1');
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'So\'rovnomalar va natijalar'), h('p', { class: 'muted' }, 'Ilmiy tadqiqot anketalari, ularning natijalari va konstruktor')),
      h('a', { class: 'btn btn-primary', href: '#/teacher/survey/new/edit' }, '+ Yangi so\'rovnoma')),
    h('div', { class: 'table-wrap panel' }, h('table', null,
      h('thead', null, h('tr', null, ['So\'rovnoma', 'Turi', 'Kim uchun', 'Javoblar', 'Holat', ''].map(x => h('th', null, x)))),
      h('tbody', null, surveys.map(s => h('tr', null,
        h('td', null, h('b', null, s.title)),
        h('td', null, KIND_NAMES[s.kind] || s.kind),
        h('td', null, { student: 'O\'quvchilar', teacher: 'O\'qituvchilar', all: 'Hamma' }[s.audience]),
        h('td', null, h('b', null, s.total_count)),
        h('td', null, h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: !!s.is_active, onchange: async e => {
          await api(`/surveys/${s.id}/active`, { method: 'PATCH', body: { is_active: e.target.checked } });
          toast(e.target.checked ? 'Faollashtirildi' : 'To\'xtatildi');
        } }), h('span', null, s.is_active ? 'Faol' : 'Nofaol'))),
        h('td', { class: 'nowrap' },
          h('a', { class: 'btn btn-sm btn-primary', href: `#/teacher/survey/${s.id}/results` }, 'Natijalar'), ' ',
          s.pair_slug ? [h('a', { class: 'btn btn-sm', href: `#/teacher/survey/${s.id}/compare` }, 'Oldin/keyin'), ' '] : null,
          h('a', { class: 'btn btn-sm btn-ghost', href: `#/teacher/survey/${s.id}/edit` }, 'Tahrirlash'))))))));
}

export async function surveyResultsView(id) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const group = params.get('group') || '';
  const r = await api(`/surveys/${id}/results?group=${encodeURIComponent(group)}`);
  const s = r.survey;
  const LEVEL_CLS = { past: 'low', "o'rta": 'mid', yuqori: 'high' };
  const showResponse = async rid => {
    const { response } = await api(`/surveys/${id}/responses/${rid}`);
    modal(`${response.full_name} — javoblar`, h('div', null, s.questions.map(q => {
      const v = response.answers[q.id];
      let shown;
      if (q.type === 'matrix') shown = h('ul', null, q.rows.map((row, i) => h('li', null, `${typeof row === 'object' ? row.text : row}: `, h('b', null, v?.[i] ?? '—'))));
      else shown = h('b', null, Array.isArray(v) ? v.join(', ') : v ?? '—');
      return h('div', { class: 'resp-item' }, h('div', { class: 'muted small' }, q.text), shown);
    })));
  };
  return h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/teacher/surveys' }, 'So\'rovnomalar'), ' / Natijalar'),
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, s.title), h('p', { class: 'muted' }, s.description)),
      h('div', { class: 'row' },
        groupSelect(r.groups, group, g => { location.hash = `#/teacher/survey/${id}/results?group=${encodeURIComponent(g)}`; }),
        h('a', { class: 'btn', href: `/api/surveys/${id}/export.csv?group=${encodeURIComponent(group)}` }, '⬇ CSV (Excel)'),
        s.pair_slug ? h('a', { class: 'btn', href: `#/teacher/survey/${id}/compare` }, 'Oldin/keyin taqqoslash') : null,
        h('button', { class: 'btn btn-ghost', onclick: () => window.print() }, '🖨 Chop etish'))),
    h('div', { class: 'stats' }, stat('Respondentlar', r.total), Object.entries(r.byGroup).slice(0, 4).map(([g, c]) => stat(`Guruh: ${g}`, c))),
    !r.total ? h('div', { class: 'alert alert-info' }, 'Hali javoblar yo\'q.') : [
      r.dimensions.length ? h('section', { class: 'panel' }, h('h2', null, 'Komponentlar (yo\'nalishlar) bo\'yicha indeks'),
        h('p', { class: 'muted small' }, 'O\'rtacha ball 1–5 shkalada. Daraja: past (<2,6), o\'rta (2,6–3,8), yuqori (>3,8). Teskari savollar avtomatik qayta hisoblanadi.'),
        h('div', { class: 'table-wrap' }, h('table', null,
          h('thead', null, h('tr', null, ['Komponent', 'n', 'O\'rtacha', 'SD', 'Daraja', 'Past', 'O\'rta', 'Yuqori'].map(x => h('th', null, x)))),
          h('tbody', null, r.dimensions.map(d => h('tr', null, h('td', null, h('b', null, d.name)), h('td', null, d.n), h('td', null, h('b', null, d.mean)), h('td', null, d.sd ?? '—'),
            h('td', null, h('span', { class: `badge lvl-${LEVEL_CLS[d.level]}` }, d.level)),
            ['past', "o'rta", 'yuqori'].map(l => h('td', null, `${d.levels[l]} (${Math.round((d.levels[l] / d.n) * 100)}%)`))))))),
        bars(r.dimensions.map(d => ({ label: d.name, value: d.mean })), { max: 5, colorByValue: true })) : null,
      r.perQuestion.map((q, i) => questionResult(q, i)),
      h('section', { class: 'panel' }, h('h2', null, 'Respondentlar'),
        h('div', { class: 'table-wrap' }, h('table', null,
          h('thead', null, h('tr', null, ['#', 'F.I.Sh.', 'Guruh', 'Sana', ''].map(x => h('th', null, x)))),
          h('tbody', null, r.respondents.map((p, i) => h('tr', null, h('td', null, i + 1), h('td', null, p.full_name), h('td', null, p.group_name || '—'), h('td', null, fmtDate(p.created_at)),
            h('td', null, h('button', { class: 'btn btn-sm btn-ghost', onclick: () => showResponse(p.id) }, 'Ko\'rish')))))))),
    ]);
}

function questionResult(q, i) {
  let body;
  if (q.type === 'single' || q.type === 'multiple') {
    const total = q.n || 1;
    body = bars(Object.entries(q.counts).map(([k, v]) => ({ label: k, value: v, display: `${v} (${Math.round((v / total) * 100)}%)` })));
  } else if (q.type === 'likert' || q.type === 'scale') {
    body = [h('p', null, `O'rtacha: `, h('b', null, q.mean ?? '—'), q.sd != null ? ` · SD: ${q.sd}` : ''),
      bars(Object.entries(q.dist).map(([k, v]) => ({ label: q.labels ? `${k} — ${q.labels[k - 1]}` : k, value: v })))];
  } else if (q.type === 'number') {
    body = h('p', null, `O'rtacha: `, h('b', null, q.mean ?? '—'), q.sd != null ? ` · SD: ${q.sd}` : '');
  } else if (q.type === 'matrix') {
    body = [q.cronbachAlpha != null ? h('p', { class: 'small muted' }, `Kronbax alfa (ichki izchillik): `, h('b', null, q.cronbachAlpha), q.cronbachAlpha >= 0.7 ? ' — qoniqarli' : ' — past') : null,
      h('div', { class: 'table-wrap' }, h('table', { class: 'matrix-res' },
        h('thead', null, h('tr', null, h('th', null, 'Band'), q.columns.map((c, j) => h('th', { title: c }, j + 1)), h('th', null, 'O\'rt.'), h('th', null, 'SD'))),
        h('tbody', null, q.rows.map(r => h('tr', null, h('td', null, r.text), q.columns.map((_, j) => {
          const v = r.dist[j + 1] || 0;
          const pct = r.n ? v / r.n : 0;
          return h('td', { class: 'center heat', style: { '--h': pct } }, v);
        }), h('td', null, h('b', null, r.mean ?? '—')), h('td', null, r.sd ?? '—'))))))];
  } else {
    body = q.texts?.length ? h('ul', { class: 'texts' }, q.texts.map(t => h('li', null, t))) : h('p', { class: 'muted' }, 'Javoblar yo\'q');
  }
  return h('section', { class: 'panel' },
    h('div', { class: 'row space' }, h('h3', null, `${i + 1}. ${q.text}`), h('span', { class: 'badge' }, `n = ${q.n}`)),
    q.dimension ? h('small', { class: 'muted' }, `Komponent: ${q.dimension}`) : null, body);
}

export async function surveyCompareView(id) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const group = params.get('group') || '';
  const r = await api(`/surveys/${id}/compare?group=${encodeURIComponent(group)}`);
  const sig = p => (p == null ? '—' : p < 0.001 ? 'p < 0,001' : `p = ${p}`);
  return h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/teacher/surveys' }, 'So\'rovnomalar'), ' / Oldin–keyin taqqoslash'),
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Tajriba-sinov natijalari: oldin va keyin'),
      h('p', { class: 'muted' }, `Kirish: ${r.pre.title}`), h('p', { class: 'muted' }, `Yakuniy: ${r.post.title}`)),
      h('input', { placeholder: 'Guruh (masalan T-21)', value: group, onchange: e => { location.hash = `#/teacher/survey/${id}/compare?group=${encodeURIComponent(e.target.value)}`; } })),
    h('div', { class: 'alert alert-info' }, 'Juftlashgan Styudent t-testi faqat ikkala so\'rovnomani ham to\'ldirgan o\'quvchilar bo\'yicha hisoblanadi. p < 0,05 bo\'lsa, o\'zgarish statistik ahamiyatli. Koen d: 0,2 — kichik, 0,5 — o\'rta, 0,8 — katta samara.'),
    h('section', { class: 'panel' }, h('div', { class: 'table-wrap' }, h('table', null,
      h('thead', null, h('tr', null, ['Komponent', 'Oldin (o\'rt.)', 'Keyin (o\'rt.)', 'O\'zgarish', 'Juftlar (n)', 't', 'df', 'p', 'Koen d', 'Xulosa'].map(x => h('th', null, x)))),
      h('tbody', null, r.dimensions.map(d => {
        const p = d.paired;
        const delta = d.preMean != null && d.postMean != null ? Math.round((d.postMean - d.preMean) * 100) / 100 : null;
        return h('tr', null, h('td', null, h('b', null, d.name)), h('td', null, `${d.preMean ?? '—'} (n=${d.preN})`), h('td', null, `${d.postMean ?? '—'} (n=${d.postN})`),
          h('td', { class: delta > 0 ? 'good-text' : delta < 0 ? 'bad-text' : '' }, delta != null ? (delta > 0 ? '+' : '') + delta : '—'),
          h('td', null, p?.n ?? 0), h('td', null, p?.t ?? '—'), h('td', null, p?.df ?? '—'), h('td', null, sig(p?.p)), h('td', null, p?.cohenD ?? '—'),
          h('td', null, p?.p != null ? (p.p < 0.05 ? h('span', { class: 'badge badge-ok' }, 'Ahamiyatli') : h('span', { class: 'badge' }, 'Ahamiyatsiz')) : '—'));
      }))))),
    h('section', { class: 'panel' }, h('h2', null, 'Diagramma'),
      r.dimensions.map(d => h('div', { class: 'compare-item' }, h('b', null, d.name),
        bars([{ label: 'Oldin', value: d.preMean || 0 }, { label: 'Keyin', value: d.postMean || 0 }], { max: 5, colorByValue: true })))));
}

// --------- So'rovnoma konstruktori ---------
const TYPE_LABELS = { likert: 'Likert (1–5)', single: 'Bitta variant', multiple: 'Bir nechta variant', scale: 'Shkala (masalan 1–10)', text: 'Erkin matn', number: 'Son', matrix: 'Matritsa (bir nechta band × shkala)' };

export async function surveyEditView(id) {
  const isNew = id === 'new';
  const s = isNew
    ? { title: '', description: '', kind: 'other', audience: 'student', is_active: 1, allow_multiple: 0, pair_slug: '', questions: [{ id: 'q1', type: 'likert', text: '' }] }
    : (await api(`/surveys/${id}`)).survey;
  const qs = s.questions.map(q => ({ ...q }));
  const list = h('div', { class: 'q-editor-list' });

  const rowsToText = q => (q.rows || []).map(r => (typeof r === 'object' ? [r.text, r.dimension || '', r.reverse ? 'R' : ''].filter((x, i) => x || i === 0).join(' | ') : r)).join('\n');
  const textToRows = t => t.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [text, dimension, rev] = l.split('|').map(x => x.trim());
    return dimension || rev ? { text, ...(dimension ? { dimension } : {}), ...(rev === 'R' ? { reverse: true } : {}) } : text;
  });

  const draw = () => clear(list, qs.map((q, i) => {
    const upd = (k, v) => { q[k] = v; };
    const typeSel = h('select', { onchange: e => { q.type = e.target.value; draw(); } }, Object.entries(TYPE_LABELS).map(([k, v]) => h('option', { value: k, selected: q.type === k }, v)));
    return h('div', { class: 'q-editor panel' },
      h('div', { class: 'row space' }, h('b', null, `${i + 1}-savol`),
        h('div', { class: 'row' },
          h('button', { class: 'icon-btn', disabled: i === 0, onclick: () => { [qs[i - 1], qs[i]] = [qs[i], qs[i - 1]]; draw(); } }, '▲'),
          h('button', { class: 'icon-btn', disabled: i === qs.length - 1, onclick: () => { [qs[i + 1], qs[i]] = [qs[i], qs[i + 1]]; draw(); } }, '▼'),
          h('button', { class: 'icon-btn', onclick: () => { qs.splice(i, 1); draw(); } }, '🗑'))),
      h('div', { class: 'grid-3' },
        h('label', { class: 'field' }, h('span', null, 'ID (noyob)'), h('input', { value: q.id, oninput: e => upd('id', e.target.value.trim()) })),
        h('label', { class: 'field' }, h('span', null, 'Turi'), typeSel),
        h('label', { class: 'field' }, h('span', null, 'Komponent (indeks uchun)'), h('input', { value: q.dimension || '', placeholder: 'masalan: Kognitiv komponent', oninput: e => upd('dimension', e.target.value || undefined) }))),
      h('label', { class: 'field' }, h('span', null, 'Savol matni'), h('input', { value: q.text, oninput: e => upd('text', e.target.value) })),
      h('div', { class: 'grid-2' },
        h('label', { class: 'field' }, h('span', null, 'Bo\'lim sarlavhasi (ixtiyoriy)'), h('input', { value: q.section || '', oninput: e => upd('section', e.target.value || undefined) })),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: q.required !== false, onchange: e => upd('required', e.target.checked ? undefined : false) }), ' Majburiy savol')),
      ['single', 'multiple', 'likert'].includes(q.type) ? h('label', { class: 'field' }, h('span', null, q.type === 'likert' ? 'Shkala yorliqlari (har biri yangi qatorda; bo\'sh — standart 5 ballik)' : 'Variantlar (har biri yangi qatorda)'),
        h('textarea', { rows: 4, oninput: e => upd('options', e.target.value.split('\n').map(x => x.trim()).filter(Boolean)) }, (q.options || []).join('\n'))) : null,
      q.type === 'scale' ? h('div', { class: 'grid-2' },
        h('label', { class: 'field' }, h('span', null, 'Minimal'), h('input', { type: 'number', value: q.min ?? 1, oninput: e => upd('min', Number(e.target.value)) })),
        h('label', { class: 'field' }, h('span', null, 'Maksimal'), h('input', { type: 'number', value: q.max ?? 10, oninput: e => upd('max', Number(e.target.value)) }))) : null,
      q.type === 'matrix' ? [
        h('label', { class: 'field' }, h('span', null, 'Bandlar (har biri yangi qatorda). Format: matn | komponent | R (R — teskari ball)'),
          h('textarea', { rows: 6, oninput: e => upd('rows', textToRows(e.target.value)) }, rowsToText(q))),
        h('label', { class: 'field' }, h('span', null, 'Ustunlar (shkala yorliqlari, har biri yangi qatorda; bo\'sh — standart)'),
          h('textarea', { rows: 3, oninput: e => upd('columns', e.target.value.trim() ? e.target.value.split('\n').map(x => x.trim()).filter(Boolean) : undefined) }, (q.columns || []).join('\n')))] : null);
  }));
  draw();

  const f = {};
  const field = (label, key, el) => { f[key] = el; return h('label', { class: 'field' }, h('span', null, label), el); };
  const jsonArea = h('textarea', { rows: 16, class: 'mono' });
  const jsonBox = h('details', { class: 'panel' }, h('summary', null, '{ } JSON rejimi (import/eksport)'),
    h('p', { class: 'muted small' }, 'Ilmiy ish ilovalaridagi anketani JSON ko\'rinishida joylashtirish yoki nusxalash uchun.'),
    jsonArea, h('div', { class: 'row' },
      h('button', { class: 'btn btn-sm', onclick: () => { jsonArea.value = JSON.stringify(qs, null, 2); } }, 'Eksport'),
      h('button', { class: 'btn btn-sm', onclick: () => { try { const v = JSON.parse(jsonArea.value); if (!Array.isArray(v)) throw new Error(); qs.splice(0, qs.length, ...v); draw(); toast('Import qilindi'); } catch { toast('JSON noto\'g\'ri (savollar massivi kerak)', 'error'); } } }, 'Import')));

  const save = async () => {
    const body = {
      title: f.title.value, description: f.description.value, kind: f.kind.value, audience: f.audience.value,
      pair_slug: f.pair_slug.value || null, is_active: f.is_active.checked, allow_multiple: f.allow_multiple.checked, questions: qs,
    };
    try {
      if (isNew) { const { id: nid } = await api('/surveys', { method: 'POST', body }); location.hash = `#/teacher/survey/${nid}/results`; }
      else { await api(`/surveys/${id}`, { method: 'PUT', body }); toast('Saqlandi'); }
    } catch (e) { toast(e.message, 'error'); }
  };

  return h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/teacher/surveys' }, 'So\'rovnomalar'), ' / ', isNew ? 'Yangi' : 'Tahrirlash'),
    h('h1', null, isNew ? 'Yangi so\'rovnoma' : 'So\'rovnomani tahrirlash'),
    !isNew && s.questions.length ? h('div', { class: 'alert alert-warn' }, 'Diqqat: javoblar to\'plangan so\'rovnomada savol ID larini o\'zgartirsangiz, eski javoblar natijalarda ko\'rinmay qoladi.') : null,
    h('div', { class: 'panel form' },
      field('Sarlavha', 'title', h('input', { value: s.title })),
      field('Tavsif', 'description', h('textarea', { rows: 2 }, s.description || '')),
      h('div', { class: 'grid-3' },
        field('Turi', 'kind', h('select', null, Object.entries(KIND_NAMES).map(([k, v]) => h('option', { value: k, selected: s.kind === k }, v)))),
        field('Kim uchun', 'audience', h('select', null, [['student', 'O\'quvchilar'], ['teacher', 'O\'qituvchilar'], ['all', 'Hamma']].map(([k, v]) => h('option', { value: k, selected: s.audience === k }, v)))),
        field('Juft (yakuniy) so\'rovnoma slug', 'pair_slug', h('input', { value: s.pair_slug || '', placeholder: 'faqat kirish diagnostikasi uchun' }))),
      h('div', { class: 'row' },
        h('label', { class: 'checkbox' }, f.is_active = h('input', { type: 'checkbox', checked: !!s.is_active }), ' Faol'),
        h('label', { class: 'checkbox' }, f.allow_multiple = h('input', { type: 'checkbox', checked: !!s.allow_multiple }), ' Qayta to\'ldirishga ruxsat'))),
    list,
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => { qs.push({ id: `q${qs.length + 1}`, type: 'likert', text: '' }); draw(); } }, '+ Savol qo\'shish'),
      h('button', { class: 'btn btn-primary', onclick: save }, 'Saqlash')),
    jsonBox);
}

// ===================== Trenajyor hisobotlari =====================
export async function trainerReportView() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const group = params.get('group') || '';
  const r = await api(`/trainer/report?group=${encodeURIComponent(group)}`);
  const sig = r.dynamics?.p != null ? (r.dynamics.p < 0.05 ? 'statistik ahamiyatli' : 'statistik ahamiyatsiz') : null;
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Trenajyor natijalari'), h('p', { class: 'muted' }, 'Virtual gidlik trenajyorida o\'quvchilarning kasbiy ko\'nikmalari monitoringi')),
      h('input', { placeholder: 'Guruh bo\'yicha filtr', value: group, onchange: e => { location.hash = `#/teacher/trainer?group=${encodeURIComponent(e.target.value)}`; } })),
    h('div', { class: 'stats' }, stat('Mashg\'ulotlar', r.total), stat('O\'rtacha ball', r.avgScore ?? '—'), stat('O\'quvchilar', r.students.length),
      r.dynamics ? stat('Birinchi → oxirgi urinish', `${r.dynamics.meanDiff > 0 ? '+' : ''}${r.dynamics.meanDiff}`, `n=${r.dynamics.n}, p=${r.dynamics.p ?? '—'} (${sig || '—'})`) : null),
    !r.total ? h('div', { class: 'alert alert-info' }, 'Hali yakunlangan mashg\'ulotlar yo\'q.') : [
      h('div', { class: 'grid-2' },
        h('section', { class: 'panel' }, h('h2', null, 'Mezonlar bo\'yicha o\'rtacha (1–5)'), bars(r.perCriterion.map(c => ({ label: c.name, value: c.mean || 0 })), { max: 5, colorByValue: true })),
        h('section', { class: 'panel' }, h('h2', null, 'Ssenariylar bo\'yicha o\'rtacha ball'), bars(r.perScenario.map(s => ({ label: `${s.title} (${s.n})`, value: s.mean })), { max: 100, colorByValue: true }))),
      h('section', { class: 'panel' }, h('h2', null, 'O\'quvchilar dinamikasi'),
        h('div', { class: 'table-wrap' }, h('table', null,
          h('thead', null, h('tr', null, ['O\'quvchi', 'Guruh', 'Urinishlar', 'Birinchi', 'Oxirgi', 'Eng yaxshi', 'O\'sish'].map(x => h('th', null, x)))),
          h('tbody', null, r.students.map(s => h('tr', null, h('td', null, h('a', { href: `#/teacher/student/${s.id}` }, s.full_name)), h('td', null, s.group_name || '—'), h('td', null, s.attempts),
            h('td', null, s.first), h('td', null, s.last), h('td', null, h('b', null, s.best)),
            h('td', { class: s.last - s.first > 0 ? 'good-text' : s.last - s.first < 0 ? 'bad-text' : '' }, s.attempts > 1 ? `${s.last - s.first > 0 ? '+' : ''}${s.last - s.first}` : '—'))))))),
      h('section', { class: 'panel' }, h('h2', null, 'Barcha mashg\'ulotlar'),
        h('div', { class: 'table-wrap' }, h('table', null,
          h('thead', null, h('tr', null, ['O\'quvchi', 'Ssenariy', 'Til', 'Ball', ...r.criteria.map(c => c.name.split(' ')[0]), 'Vaqt', 'Sana', ''].map(x => h('th', null, x)))),
          h('tbody', null, r.sessions.map(s => {
            const by = Object.fromEntries(s.scores.map(c => [c.key, c.score]));
            return h('tr', null, h('td', null, s.full_name), h('td', null, s.scenario_title), h('td', null, s.language.toUpperCase()), h('td', null, h('b', null, s.score_total)),
              r.criteria.map(c => h('td', { class: 'center' }, by[c.key] ?? '—')), h('td', null, fmtDuration(s.duration_sec)), h('td', null, fmtDate(s.finished_at)),
              h('td', null, h('a', { href: `#/trainer/session/${s.id}` }, 'Transkript')));
          })))))]);
}

// ===================== Topshiriqlarni tekshirish =====================
export async function submissionsView() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const status = params.get('status') ?? 'submitted';
  const [{ submissions }, { topics }] = await Promise.all([api(`/selfstudy/submissions?status=${status}`), api('/topics')]);
  const grade = s => {
    const score = h('input', { type: 'number', min: 0, max: s.max_score, value: s.score ?? '' });
    const fb = h('textarea', { rows: 4 }, s.feedback || '');
    const m = modal(`${s.full_name} — ${s.assignment_title}`, h('div', null,
      s.answer_text ? h('div', { class: 'answer pre' }, s.answer_text) : null,
      s.link ? h('p', null, '🔗 ', h('a', { href: s.link, target: '_blank', rel: 'noopener' }, s.link)) : null,
      h('label', { class: 'field' }, h('span', null, `Ball (maks. ${s.max_score})`), score),
      h('label', { class: 'field' }, h('span', null, 'Izoh'), fb)), [
      h('button', { class: 'btn btn-primary', onclick: async () => {
        await api(`/selfstudy/submissions/${s.id}/grade`, { method: 'POST', body: { score: score.value, feedback: fb.value } });
        toast('Baholandi'); m.close(); refresh();
      } }, 'Baholash')]);
  };
  const newForm = h('form', { class: 'panel form', onsubmit: async e => {
    e.preventDefault();
    await api('/selfstudy/assignments', { method: 'POST', body: Object.fromEntries(new FormData(newForm)) });
    toast('Topshiriq qo\'shildi'); newForm.reset();
  } },
    h('h3', null, 'Yangi mustaqil ish topshirig\'i'),
    h('div', { class: 'grid-2' },
      h('label', { class: 'field' }, h('span', null, 'Sarlavha'), h('input', { name: 'title', required: true })),
      h('label', { class: 'field' }, h('span', null, 'Mavzu'), h('select', { name: 'topic_id' }, h('option', { value: '' }, 'Umumiy'), topics.map(t => h('option', { value: t.id }, `${t.order_no}. ${t.title}`))))),
    h('label', { class: 'field' }, h('span', null, 'Tavsif'), h('textarea', { name: 'description', rows: 3, required: true })),
    h('div', { class: 'grid-3' },
      h('label', { class: 'field' }, h('span', null, 'Guruh (bo\'sh — hamma)'), h('input', { name: 'group_name' })),
      h('label', { class: 'field' }, h('span', null, 'Muddat'), h('input', { name: 'due_date', type: 'date' })),
      h('label', { class: 'field' }, h('span', null, 'Maks. ball'), h('input', { name: 'max_score', type: 'number', value: 10 }))),
    h('button', { class: 'btn btn-primary' }, 'Qo\'shish'));
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('h1', null, 'Mustaqil ish topshiriqlari'),
      h('div', { class: 'tabs' }, [['submitted', 'Tekshirilmagan'], ['graded', 'Baholangan'], ['', 'Hammasi']].map(([k, l]) =>
        h('a', { class: `tab ${status === k ? 'active' : ''}`, href: `#/teacher/submissions?status=${k}` }, l)))),
    h('div', { class: 'table-wrap panel' }, submissions.length ? h('table', null,
      h('thead', null, h('tr', null, ['O\'quvchi', 'Guruh', 'Topshiriq', 'Yuborilgan', 'Holat', ''].map(x => h('th', null, x)))),
      h('tbody', null, submissions.map(s => h('tr', null, h('td', null, s.full_name), h('td', null, s.group_name || '—'), h('td', null, s.assignment_title), h('td', null, fmtDate(s.submitted_at)),
        h('td', null, s.status === 'graded' ? h('span', { class: 'badge badge-ok' }, `${s.score}/${s.max_score}`) : h('span', { class: 'badge badge-info' }, 'Yangi')),
        h('td', null, h('button', { class: 'btn btn-sm btn-primary', onclick: () => grade(s) }, s.status === 'graded' ? 'Qayta baholash' : 'Tekshirish'))))))
      : h('p', { class: 'muted' }, 'Topshiriqlar yo\'q.')),
    newForm);
}

// ===================== Mavzular muharriri =====================
export async function topicsAdminView() {
  const { topics } = await api('/topics');
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Mavzular muharriri'), h('p', { class: 'muted' }, 'O\'quv qo\'llanma mazmunini joylash va tahrirlash')),
      h('a', { class: 'btn btn-primary', href: '#/teacher/topic/new/edit' }, '+ Yangi mavzu')),
    h('div', { class: 'table-wrap panel' }, h('table', null,
      h('thead', null, h('tr', null, ['№', 'Mavzu', 'Modul', 'Soat', 'Holat', ''].map(x => h('th', null, x)))),
      h('tbody', null, topics.map(t => h('tr', null, h('td', null, t.order_no), h('td', null, h('b', null, t.title)), h('td', null, t.module), h('td', null, t.hours),
        h('td', null, t.is_published ? h('span', { class: 'badge badge-ok' }, 'E\'lon qilingan') : h('span', { class: 'badge' }, 'Qoralama')),
        h('td', { class: 'nowrap' }, h('a', { class: 'btn btn-sm', href: `#/teacher/topic/${t.id}/edit` }, 'Tahrirlash'), ' ', h('a', { class: 'btn btn-sm btn-ghost', href: `#/topic/${t.id}` }, 'Ko\'rish'))))))));
}

const METHOD_TEMPLATES = {
  klaster: { type: 'klaster', key: 'kl1', title: 'Klaster: ...', instruction: '...', center: 'Markaziy tushuncha', sample: ['...'] },
  venn: { type: 'venn', key: 'v1', title: 'Venn diagrammasi', instruction: '...', a: 'A', b: 'B', items: [{ text: '...', answer: 'a' }, { text: '...', answer: 'ab' }] },
  insert: { type: 'insert', key: 'ins1', title: 'INSERT jadvali', instruction: 'V, +, −, ?', statements: ['...'] },
  blits: { type: 'blits', key: 'b1', title: 'Blits-so\'rov', seconds: 10, items: [{ q: '...', a: true }] },
  moslash: { type: 'moslash', key: 'm1', title: 'Moslashtirish', pairs: [{ left: '...', right: '...' }] },
  ketma: { type: 'ketma', key: 'k1', title: 'Ketma-ketlik', steps: ['1-qadam', '2-qadam'] },
  keys: { type: 'keys', key: 'c1', title: 'Keys-stadi', situation: '...', questions: ['...'] },
  fsmu: { type: 'fsmu', key: 'f1', title: 'FSMU', statement: '...' },
  aqliy: { type: 'aqliy', key: 'a1', title: 'Aqliy hujum', question: '...' },
  bbb: { type: 'bbb', key: 'bbb1', title: 'B-B-B jadvali' },
  sinkveyn: { type: 'sinkveyn', key: 's1', title: 'Sinkveyn', word: '...' },
};

export async function topicEditView(id) {
  const isNew = id === 'new';
  const t = isNew
    ? { title: '', module: '', hours: 2, summary: '', content: '', objectives: [], keywords: [], methods: [], quiz: [], practice: [], resources: [], is_published: 1 }
    : (await api(`/topics/${id}`)).topic;
  const quiz = t.quiz.map(q => ({ ...q, options: [...q.options] }));
  const F = {};
  const inp = (label, key, el) => { F[key] = el; return h('label', { class: 'field' }, h('span', null, label), el); };
  const preview = h('div', { class: 'prose preview' });
  const content = h('textarea', { rows: 20, class: 'mono', oninput: () => { preview.innerHTML = md(content.value); } }, t.content);
  preview.innerHTML = md(t.content);

  const quizBox = h('div');
  const drawQuiz = () => clear(quizBox, quiz.map((q, i) => h('div', { class: 'q-editor panel' },
    h('div', { class: 'row space' }, h('b', null, `${i + 1}-savol`), h('button', { class: 'icon-btn', onclick: () => { quiz.splice(i, 1); drawQuiz(); } }, '🗑')),
    h('input', { value: q.q, placeholder: 'Savol', oninput: e => { q.q = e.target.value; } }),
    q.options.map((o, j) => h('div', { class: 'row' }, h('input', { type: 'radio', name: `ans${i}`, checked: q.answer === j, onchange: () => { q.answer = j; }, title: 'To\'g\'ri javob' }),
      h('input', { value: o, placeholder: `${j + 1}-variant`, oninput: e => { q.options[j] = e.target.value; } }))),
    h('input', { value: q.explanation || '', placeholder: 'Izoh (javobdan keyin ko\'rsatiladi)', oninput: e => { q.explanation = e.target.value; } }))));
  drawQuiz();

  const methods = h('textarea', { rows: 14, class: 'mono' }, JSON.stringify(t.methods, null, 2));
  const save = async () => {
    let parsedMethods;
    try { parsedMethods = JSON.parse(methods.value || '[]'); if (!Array.isArray(parsedMethods)) throw new Error(); } catch { return toast('Interaktiv metodlar JSON noto\'g\'ri', 'error'); }
    const lines = v => v.split('\n').map(x => x.trim()).filter(Boolean);
    const body = {
      title: F.title.value, module: F.module.value, hours: F.hours.value, order_no: F.order_no.value || undefined, summary: F.summary.value,
      content: content.value, is_published: F.is_published.checked,
      objectives: lines(F.objectives.value),
      keywords: lines(F.keywords.value).map(l => { const [term, ...rest] = l.split(' — '); return { term: term.trim(), definition: rest.join(' — ').trim() }; }),
      resources: lines(F.resources.value).map(l => { const [title, url] = l.split('|').map(x => x.trim()); return { title, url: url || title }; }),
      practice: lines(F.practice.value).map(l => { const [title, ...rest] = l.split('|'); return { title: title.trim(), text: rest.join('|').trim() }; }),
      quiz: quiz.filter(q => q.q && q.options.filter(Boolean).length >= 2),
      methods: parsedMethods,
    };
    try {
      if (isNew) { const { id: nid } = await api('/topics', { method: 'POST', body }); toast('Mavzu yaratildi'); location.hash = `#/teacher/topic/${nid}/edit`; }
      else { await api(`/topics/${id}`, { method: 'PUT', body }); toast('Saqlandi'); }
    } catch (e) { toast(e.message, 'error'); }
  };

  return h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/teacher/topics' }, 'Mavzular muharriri'), ' / ', isNew ? 'Yangi' : t.title),
    h('div', { class: 'page-head' }, h('h1', null, isNew ? 'Yangi mavzu' : 'Mavzuni tahrirlash'), h('button', { class: 'btn btn-primary', onclick: save }, 'Saqlash')),
    h('div', { class: 'panel form' },
      inp('Mavzu nomi', 'title', h('input', { value: t.title })),
      h('div', { class: 'grid-3' },
        inp('Modul', 'module', h('input', { value: t.module })),
        inp('Soat', 'hours', h('input', { type: 'number', value: t.hours })),
        inp('Tartib raqami', 'order_no', h('input', { type: 'number', value: t.order_no || '' }))),
      inp('Qisqacha mazmun', 'summary', h('textarea', { rows: 2 }, t.summary)),
      h('label', { class: 'checkbox' }, F.is_published = h('input', { type: 'checkbox', checked: !!t.is_published }), ' O\'quvchilarga ko\'rinadi')),
    h('div', { class: 'panel' }, h('h2', null, 'Nazariy matn'),
      h('p', { class: 'muted small' }, 'Markdown: ## sarlavha, **qalin**, *kursiv*, - ro\'yxat, 1. raqamli ro\'yxat, | jadval |, > iqtibos'),
      h('div', { class: 'grid-2 editor-split' }, content, preview)),
    h('div', { class: 'panel form' },
      inp('Maqsadlar (har biri yangi qatorda)', 'objectives', h('textarea', { rows: 4 }, t.objectives.join('\n'))),
      inp('Tayanch tushunchalar (format: Atama — ta\'rif)', 'keywords', h('textarea', { rows: 5 }, t.keywords.map(k => `${k.term} — ${k.definition}`).join('\n'))),
      inp('Amaliy topshiriqlar (format: Sarlavha | matn)', 'practice', h('textarea', { rows: 3 }, t.practice.map(p => `${p.title} | ${p.text}`).join('\n'))),
      inp('Manbalar (format: Nomi | https://...)', 'resources', h('textarea', { rows: 3 }, t.resources.map(r => `${r.title} | ${r.url}`).join('\n')))),
    h('div', { class: 'panel' }, h('h2', null, 'Test savollari'), quizBox,
      h('button', { class: 'btn', onclick: () => { quiz.push({ q: '', options: ['', '', '', ''], answer: 0, explanation: '' }); drawQuiz(); } }, '+ Savol')),
    h('div', { class: 'panel' }, h('h2', null, 'Interaktiv metodlar (JSON)'),
      h('p', { class: 'muted small' }, 'Shablon qo\'shish uchun metod turini bosing, so\'ng "..." joylarini to\'ldiring. Har bir metodning "key" qiymati mavzu ichida noyob bo\'lsin.'),
      h('div', { class: 'row wrap' }, Object.keys(METHOD_TEMPLATES).map(k => h('button', { class: 'btn btn-sm', onclick: () => {
        let arr; try { arr = JSON.parse(methods.value || '[]'); } catch { arr = []; }
        const tpl = { ...METHOD_TEMPLATES[k], key: `${METHOD_TEMPLATES[k].key}_${arr.length + 1}` };
        arr.push(tpl); methods.value = JSON.stringify(arr, null, 2);
      } }, '+ ' + METHOD_TYPES[k]))),
      methods),
    h('div', { class: 'row' }, h('button', { class: 'btn btn-primary btn-lg', onclick: save }, 'Saqlash'),
      !isNew && state.user.role === 'admin' ? h('button', { class: 'btn btn-bad', onclick: async () => {
        if (!confirm('Mavzuni butunlay o\'chirasizmi? O\'quvchilar natijalari ham o\'chadi.')) return;
        await api(`/topics/${id}`, { method: 'DELETE' }); location.hash = '#/teacher/topics';
      } }, 'O\'chirish') : null));
}

// ===================== Foydalanuvchilar (admin) =====================
export async function usersView() {
  const { users } = await api('/admin/users');
  const form = h('form', { class: 'panel form', onsubmit: async e => {
    e.preventDefault();
    try { await api('/admin/users', { method: 'POST', body: Object.fromEntries(new FormData(form)) }); toast('Foydalanuvchi yaratildi'); refresh(); }
    catch (ex) { toast(ex.message, 'error'); }
  } },
    h('h3', null, 'Yangi foydalanuvchi (o\'qituvchi yoki admin)'),
    h('div', { class: 'grid-3' },
      h('label', { class: 'field' }, h('span', null, 'F.I.Sh.'), h('input', { name: 'full_name', required: true })),
      h('label', { class: 'field' }, h('span', null, 'Email'), h('input', { name: 'email', type: 'email', required: true })),
      h('label', { class: 'field' }, h('span', null, 'Parol'), h('input', { name: 'password', type: 'text', minlength: 6, required: true }))),
    h('div', { class: 'grid-3' },
      h('label', { class: 'field' }, h('span', null, 'Rol'), h('select', { name: 'role' }, Object.entries(ROLE_NAMES).map(([k, v]) => h('option', { value: k, selected: k === 'teacher' }, v)))),
      h('label', { class: 'field' }, h('span', null, 'Texnikum'), h('input', { name: 'college' })),
      h('label', { class: 'field' }, h('span', null, 'Guruh'), h('input', { name: 'group_name' }))),
    h('button', { class: 'btn btn-primary' }, 'Yaratish'));
  return h('div', { class: 'page' },
    h('h1', null, 'Foydalanuvchilar'),
    form,
    h('div', { class: 'table-wrap panel' }, h('table', null,
      h('thead', null, h('tr', null, ['F.I.Sh.', 'Email', 'Rol', 'Guruh', 'Sana', ''].map(x => h('th', null, x)))),
      h('tbody', null, users.map(u => h('tr', null, h('td', null, u.full_name), h('td', null, u.email),
        h('td', null, h('select', { disabled: u.id === state.user.id, onchange: async e => {
          try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { role: e.target.value } }); toast('Rol o\'zgartirildi'); } catch (ex) { toast(ex.message, 'error'); }
        } }, Object.entries(ROLE_NAMES).map(([k, v]) => h('option', { value: k, selected: u.role === k }, v)))),
        h('td', null, u.group_name || '—'), h('td', null, fmtDate(u.created_at)),
        h('td', { class: 'nowrap' },
          h('button', { class: 'btn btn-sm btn-ghost', onclick: async () => {
            const p = prompt('Yangi parol (kamida 6 belgi):');
            if (!p) return;
            try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { password: p } }); toast('Parol yangilandi'); } catch (ex) { toast(ex.message, 'error'); }
          } }, 'Parol'), ' ',
          u.id !== state.user.id ? h('button', { class: 'btn btn-sm btn-bad', onclick: async () => {
            if (!confirm(`${u.full_name} ni o'chirasizmi? Barcha natijalari ham o'chadi.`)) return;
            await api(`/admin/users/${u.id}`, { method: 'DELETE' }); refresh();
          } }, 'O\'chirish') : null)))))));
}

export { DEFAULT_LIKERT };
