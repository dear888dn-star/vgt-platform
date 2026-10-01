// Interaktiv ta'lim metodlari (vidjetlar). Har bir vidjet o'quvchi javobini serverga saqlaydi.
import { h, clear, api, toast, shuffle } from '../util.js';

const TYPE_NAMES = {
  klaster: 'Klaster', venn: 'Venn diagrammasi', insert: 'INSERT', blits: 'Blits-so\'rov', moslash: 'Moslashtirish',
  ketma: 'Ketma-ketlik', keys: 'Keys-stadi', fsmu: 'FSMU', aqliy: 'Aqliy hujum', bbb: 'B-B-B jadvali', sinkveyn: 'Sinkveyn',
};

export function methodWidget(topicId, m, saved) {
  const builder = BUILDERS[m.type];
  const status = h('span', { class: 'badge ' + (saved ? 'badge-ok' : '') }, saved ? 'Bajarilgan ✓' : 'Bajarilmagan');
  const save = async (response, score = null) => {
    await api(`/topics/${topicId}/method`, { method: 'POST', body: { method_key: m.key, method_type: m.type, response, score } });
    status.className = 'badge badge-ok';
    status.textContent = 'Bajarilgan ✓';
    toast('Javobingiz saqlandi');
  };
  return h('section', { class: 'method' },
    h('div', { class: 'method-head' },
      h('span', { class: 'method-type' }, TYPE_NAMES[m.type] || m.type),
      h('h3', null, m.title), status),
    m.instruction ? h('p', { class: 'muted' }, m.instruction) : null,
    builder ? builder(m, saved?.response, save) : h('p', null, 'Noma\'lum metod turi'));
}

const textarea = (value, attrs = {}) => h('textarea', { rows: 3, ...attrs }, value || '');

const BUILDERS = {
  klaster(m, prev, save) {
    let items = prev?.items ? [...prev.items] : [];
    const svgBox = h('div', { class: 'cluster' });
    const draw = () => {
      const n = items.length;
      const W = 560, H = 360, cx = W / 2, cy = H / 2, R = 140;
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const el = (tag, attrs, text) => {
        const e = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        if (text) e.textContent = text;
        svg.append(e);
        return e;
      };
      items.forEach((t, i) => {
        const a = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
        const x = cx + R * 1.35 * Math.cos(a), y = cy + R * Math.sin(a);
        el('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'cl-line' });
        el('rect', { x: x - 62, y: y - 17, width: 124, height: 34, rx: 17, class: 'cl-node' });
        el('text', { x, y: y + 5, 'text-anchor': 'middle', class: 'cl-text' }, t.length > 18 ? t.slice(0, 17) + '…' : t);
      });
      el('circle', { cx, cy, r: 58, class: 'cl-center' });
      el('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', class: 'cl-center-text' }, m.center);
      clear(svgBox, svg);
      clear(list, items.map((t, i) => h('span', { class: 'chip' }, t, h('button', { class: 'chip-x', 'aria-label': 'O\'chirish', onclick: () => { items.splice(i, 1); draw(); } }, '×'))));
    };
    const list = h('div', { class: 'chips' });
    const input = h('input', { placeholder: 'Yangi tushuncha...', maxlength: 40 });
    const add = () => { const v = input.value.trim(); if (v && items.length < 12) { items.push(v); input.value = ''; draw(); } };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    draw();
    return h('div', null, svgBox,
      h('div', { class: 'row' }, input, h('button', { class: 'btn', onclick: add }, 'Qo\'shish')),
      list,
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', onclick: () => items.length >= 3 ? save({ items }) : toast('Kamida 3 ta tushuncha qo\'shing', 'error') }, 'Saqlash'),
        m.sample ? h('button', { class: 'btn btn-ghost', onclick: e => { e.target.replaceWith(h('span', { class: 'muted small' }, 'Namuna: ' + m.sample.join(', '))); } }, 'Namunani ko\'rish') : null));
  },

  venn(m, prev, save) {
    const placed = prev?.placed || {};
    const zones = { a: m.a, ab: 'Umumiy', b: m.b };
    const result = h('div');
    const rows = m.items.map((it, i) => {
      const sel = h('select', null, h('option', { value: '' }, '— tanlang —'), Object.entries(zones).map(([k, v]) => h('option', { value: k, selected: placed[i] === k }, v)));
      sel.addEventListener('change', () => { placed[i] = sel.value; drawVenn(); });
      return h('div', { class: 'venn-item' }, h('span', null, it.text), sel);
    });
    const diagram = h('div', { class: 'venn' });
    const drawVenn = () => clear(diagram,
      ['a', 'ab', 'b'].map(z => h('div', { class: `venn-zone venn-${z}` }, h('b', null, zones[z]),
        m.items.map((it, i) => (placed[i] === z ? h('div', { class: 'venn-chip' }, it.text) : null)))));
    drawVenn();
    const check = () => {
      let ok = 0;
      m.items.forEach((it, i) => {
        const good = placed[i] === it.answer;
        if (good) ok++;
        rows[i].classList.toggle('good', good);
        rows[i].classList.toggle('bad', !good);
      });
      const score = Math.round((ok / m.items.length) * 100);
      clear(result, h('div', { class: `alert ${score >= 70 ? 'alert-ok' : 'alert-warn'}` }, `Natija: ${ok}/${m.items.length} (${score}%)`));
      save({ placed }, score);
    };
    return h('div', null, diagram, h('div', { class: 'venn-list' }, rows), h('button', { class: 'btn btn-primary', onclick: check }, 'Tekshirish va saqlash'), result);
  },

  insert(m, prev, save) {
    const marks = prev?.marks || {};
    const OPTS = [['V', 'Bilardim'], ['+', 'Yangi'], ['−', 'Boshqacha o\'ylardim'], ['?', 'Tushunarsiz']];
    const table = h('div', { class: 'table-wrap' }, h('table', { class: 'insert' },
      h('thead', null, h('tr', null, h('th', null, 'Fikr'), OPTS.map(([k, t]) => h('th', { title: t }, k)))),
      h('tbody', null, m.statements.map((s, i) => h('tr', null, h('td', null, s),
        OPTS.map(([k]) => h('td', { class: 'center' }, h('input', { type: 'radio', name: `ins-${m.key}-${i}`, value: k, checked: marks[i] === k, onchange: () => { marks[i] = k; } }))))))));
    return h('div', null, table, h('p', { class: 'muted small' }, OPTS.map(([k, t]) => `${k} — ${t}`).join(' · ')),
      h('button', { class: 'btn btn-primary', onclick: () => Object.keys(marks).length === m.statements.length ? save({ marks }) : toast('Barcha fikrlarni belgilang', 'error') }, 'Saqlash'));
  },

  blits(m, _prev, save) {
    const box = h('div', { class: 'blits' });
    const start = () => {
      let i = 0, ok = 0, timer, left;
      const answers = [];
      const next = () => {
        clearInterval(timer);
        if (i >= m.items.length) {
          const score = Math.round((ok / m.items.length) * 100);
          clear(box, h('div', { class: `alert ${score >= 70 ? 'alert-ok' : 'alert-warn'}` }, `Natija: ${ok}/${m.items.length} (${score}%)`),
            h('ul', null, m.items.map((it, k) => h('li', { class: answers[k] === it.a ? 'good-text' : 'bad-text' }, `${it.q} — ${it.a ? 'To\'g\'ri' : 'Noto\'g\'ri'}`))),
            h('button', { class: 'btn', onclick: start }, 'Qayta urinish'));
          save({ answers }, score);
          return;
        }
        const it = m.items[i];
        left = m.seconds || 10;
        const timeEl = h('span', { class: 'blits-time' }, left);
        const answer = v => { answers[i] = v; if (v === it.a) ok++; i++; next(); };
        clear(box, h('div', { class: 'blits-q' }, h('small', null, `${i + 1}/${m.items.length}`), timeEl, h('p', null, it.q)),
          h('div', { class: 'row' }, h('button', { class: 'btn btn-ok', onclick: () => answer(true) }, '✓ To\'g\'ri'), h('button', { class: 'btn btn-bad', onclick: () => answer(false) }, '✗ Noto\'g\'ri')));
        timer = setInterval(() => { left--; timeEl.textContent = left; if (left <= 0) { answers[i] = null; i++; next(); } }, 1000);
      };
      next();
    };
    clear(box, h('button', { class: 'btn btn-primary', onclick: start }, `▶ Boshlash (${m.items.length} savol, har biriga ${m.seconds || 10} soniya)`));
    return box;
  },

  moslash(m, prev, save) {
    const rights = shuffle(m.pairs.map(p => p.right));
    const chosen = prev?.chosen || {};
    const result = h('div');
    const rows = m.pairs.map((p, i) => h('div', { class: 'match-row' }, h('b', null, p.left), h('span', null, '→'),
      h('select', { onchange: e => { chosen[i] = e.target.value; } }, h('option', { value: '' }, '— tanlang —'), rights.map(r => h('option', { value: r, selected: chosen[i] === r }, r)))));
    const check = () => {
      let ok = 0;
      m.pairs.forEach((p, i) => { const g = chosen[i] === p.right; if (g) ok++; rows[i].classList.toggle('good', g); rows[i].classList.toggle('bad', !g); });
      const score = Math.round((ok / m.pairs.length) * 100);
      clear(result, h('div', { class: `alert ${score >= 70 ? 'alert-ok' : 'alert-warn'}` }, `Natija: ${ok}/${m.pairs.length} (${score}%)`));
      save({ chosen }, score);
    };
    return h('div', null, rows, h('button', { class: 'btn btn-primary', onclick: check }, 'Tekshirish va saqlash'), result);
  },

  ketma(m, prev, save) {
    let order = prev?.order || shuffle(m.steps);
    const list = h('ol', { class: 'order-list' });
    const result = h('div');
    const draw = () => clear(list, order.map((s, i) => h('li', { class: 'order-item' }, h('span', null, s),
      h('span', { class: 'order-btns' },
        h('button', { class: 'icon-btn', disabled: i === 0, 'aria-label': 'Yuqoriga', onclick: () => { [order[i - 1], order[i]] = [order[i], order[i - 1]]; draw(); } }, '▲'),
        h('button', { class: 'icon-btn', disabled: i === order.length - 1, 'aria-label': 'Pastga', onclick: () => { [order[i + 1], order[i]] = [order[i], order[i + 1]]; draw(); } }, '▼')))));
    draw();
    const check = () => {
      let ok = 0;
      [...list.children].forEach((li, i) => { const g = order[i] === m.steps[i]; if (g) ok++; li.classList.toggle('good', g); li.classList.toggle('bad', !g); });
      const score = Math.round((ok / m.steps.length) * 100);
      clear(result, h('div', { class: `alert ${score === 100 ? 'alert-ok' : 'alert-warn'}` }, score === 100 ? 'Barakalla! Tartib to\'g\'ri.' : `${ok}/${m.steps.length} ta qadam o'z joyida. Qayta urinib ko'ring.`));
      save({ order }, score);
    };
    return h('div', null, list, h('button', { class: 'btn btn-primary', onclick: check }, 'Tekshirish va saqlash'), result);
  },

  keys(m, prev, save) {
    const fields = m.questions.map((q, i) => textarea(prev?.answers?.[i], { placeholder: 'Javobingiz...' }));
    return h('div', null,
      h('div', { class: 'case' }, h('b', null, 'Vaziyat: '), m.situation),
      m.questions.map((q, i) => h('label', { class: 'field' }, h('span', null, `${i + 1}. ${q}`), fields[i])),
      h('button', { class: 'btn btn-primary', onclick: () => fields.every(f => f.value.trim()) ? save({ answers: fields.map(f => f.value.trim()) }) : toast('Barcha savollarga javob yozing', 'error') }, 'Saqlash'));
  },

  fsmu(m, prev, save) {
    const parts = [['F', 'Fikringizni bayon eting'], ['S', 'Fikringizga sabab ko\'rsating'], ['M', 'Misol keltiring'], ['U', 'Umumlashtiring']];
    const fields = parts.map((_, i) => textarea(prev?.answers?.[i]));
    return h('div', null,
      h('div', { class: 'case' }, h('b', null, 'Fikr: '), `"${m.statement}"`),
      h('div', { class: 'grid-2' }, parts.map(([k, t], i) => h('label', { class: 'field' }, h('span', null, h('b', { class: 'fsmu-letter' }, k), ' ', t), fields[i]))),
      h('button', { class: 'btn btn-primary', onclick: () => fields.every(f => f.value.trim()) ? save({ answers: fields.map(f => f.value.trim()) }) : toast('Barcha qismlarni to\'ldiring', 'error') }, 'Saqlash'));
  },

  aqliy(m, prev, save) {
    const ideas = prev?.ideas ? [...prev.ideas] : [];
    const list = h('ol', { class: 'ideas' });
    const draw = () => clear(list, ideas.map((t, i) => h('li', null, t, ' ', h('button', { class: 'chip-x', onclick: () => { ideas.splice(i, 1); draw(); } }, '×'))));
    const input = h('input', { placeholder: 'G\'oyangiz...' });
    const add = () => { if (input.value.trim()) { ideas.push(input.value.trim()); input.value = ''; draw(); } };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    draw();
    return h('div', null, h('div', { class: 'case' }, h('b', null, 'Savol: '), m.question),
      h('div', { class: 'row' }, input, h('button', { class: 'btn', onclick: add }, '+ G\'oya')), list,
      h('button', { class: 'btn btn-primary', onclick: () => ideas.length >= 3 ? save({ ideas }) : toast('Kamida 3 ta g\'oya yozing', 'error') }, 'Saqlash'));
  },

  bbb(m, prev, save) {
    const cols = ['Bilaman', 'Bilishni xohlayman', 'Bilib oldim'];
    const fields = cols.map((_, i) => textarea(prev?.answers?.[i], { rows: 5 }));
    return h('div', null,
      h('div', { class: 'grid-3' }, cols.map((c, i) => h('label', { class: 'field' }, h('span', null, h('b', null, c)), fields[i]))),
      h('button', { class: 'btn btn-primary', onclick: () => fields.some(f => f.value.trim()) ? save({ answers: fields.map(f => f.value.trim()) }) : toast('Jadvalni to\'ldiring', 'error') }, 'Saqlash'));
  },

  sinkveyn(m, prev, save) {
    const parts = ['1. Ot (mavzu)', '2. Ikkita sifat', '3. Uchta fe\'l', '4. To\'rt so\'zli ibora', '5. Sinonim (bir so\'z)'];
    const fields = parts.map((_, i) => h('input', { value: prev?.answers?.[i] || (i === 0 ? m.word : '') }));
    return h('div', null, h('div', { class: 'sinkveyn' }, parts.map((p, i) => h('label', { class: 'field' }, h('span', null, p), fields[i]))),
      h('button', { class: 'btn btn-primary', onclick: () => fields.every(f => f.value.trim()) ? save({ answers: fields.map(f => f.value.trim()) }) : toast('Barcha qatorlarni to\'ldiring', 'error') }, 'Saqlash'));
  },
};

export const METHOD_TYPES = TYPE_NAMES;
