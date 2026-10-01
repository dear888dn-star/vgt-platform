// Umumiy yordamchi funksiyalar: DOM qurish, API, markdown, bildirishnomalar

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const [p, val] of Object.entries(v)) {
          if (p.startsWith('--')) el.style.setProperty(p, val);
          else el.style[p] = val;
        }
      }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch { /* bo'sh javob */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Xato (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function toast(msg, kind = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) { box = h('div', { id: 'toasts' }); document.body.append(box); }
  const t = h('div', { class: `toast toast-${kind}`, role: 'status' }, msg);
  box.append(t);
  setTimeout(() => t.classList.add('hide'), 3200);
  setTimeout(() => t.remove(), 3700);
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// Xavfsiz minimal markdown: avval HTML ekranlanadi, so'ng formatlanadi
export function md(src) {
  const lines = escapeHtml(src).split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      const lvl = Math.min(m[1].length + 1, 5);
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); i++; continue;
    }
    if (line.startsWith('&gt;')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('&gt;')) buf.push(lines[i++].replace(/^&gt;\s?/, ''));
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue;
    }
    if (line.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim());
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(rows[1] && /^\|?\s*:?-+/.test(rows[1]) ? 2 : 1);
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
        body.map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push(`<ul>${buf.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      out.push(`<ol>${buf.map(x => `<li>${inline(x)}</li>`).join('')}</ol>`); continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|&gt;|\s*[-*]\s|\s*\d+[.)]\s|\s*\|)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

export function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtDuration(sec) {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function loading(text = 'Yuklanmoqda...') {
  return h('div', { class: 'loading' }, h('span', { class: 'spinner' }), text);
}

export function errorBox(e) {
  return h('div', { class: 'alert alert-error' }, e?.message || String(e));
}

// Gorizontal ustunli diagramma (CSS asosida)
export function bars(items, { max, suffix = '', colorByValue = false } = {}) {
  const m = max ?? Math.max(1, ...items.map(i => i.value || 0));
  return h('div', { class: 'bars' }, items.map(it => {
    const pct = Math.round(((it.value || 0) / m) * 100);
    const tone = colorByValue ? (pct < 40 ? 'low' : pct < 70 ? 'mid' : 'high') : '';
    return h('div', { class: 'bar-row' },
      h('div', { class: 'bar-label', title: it.label }, it.label),
      h('div', { class: 'bar-track' }, h('div', { class: `bar-fill ${tone}`, style: { width: pct + '%' } })),
      h('div', { class: 'bar-value' }, it.display ?? `${it.value ?? '—'}${suffix}`));
  }));
}

export function stat(label, value, sub) {
  return h('div', { class: 'stat' }, h('div', { class: 'stat-value' }, value ?? '—'), h('div', { class: 'stat-label' }, label), sub ? h('div', { class: 'stat-sub' }, sub) : null);
}

export function modal(title, body, actions = []) {
  const close = () => wrap.remove();
  const wrap = h('div', { class: 'modal-backdrop', onclick: e => { if (e.target === wrap) close(); } },
    h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'modal-head' }, h('h3', null, title), h('button', { class: 'icon-btn', onclick: close, 'aria-label': 'Yopish' }, '✕')),
      h('div', { class: 'modal-body' }, body),
      actions.length ? h('div', { class: 'modal-actions' }, actions) : null));
  document.body.append(wrap);
  return { close, el: wrap };
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export const ROLE_NAMES = { student: 'O\'quvchi', teacher: 'O\'qituvchi', admin: 'Administrator' };
