import { h, clear, api, toast, md, debounce } from '../util.js';
import { methodWidget } from './methods.js';
import { onLeave } from '../app.js';

export async function topicsView() {
  const { topics } = await api('/topics');
  const modules = {};
  for (const t of topics) (modules[t.module] ||= []).push(t);
  const done = topics.filter(t => t.status === 'completed').length;
  return h('div', { class: 'page' },
    h('div', { class: 'page-head' },
      h('div', null, h('h1', null, 'Turizmda raqamli texnologiyalar'), h('p', { class: 'muted' }, `${topics.length} ta mavzu · ${done} tasi tugallangan`))),
    Object.entries(modules).map(([mod, list]) => h('section', { class: 'module' },
      h('h2', { class: 'module-title' }, mod),
      h('div', { class: 'topic-grid' }, list.map(t => h('a', { class: `topic-card ${t.status || ''}`, href: `#/topic/${t.id}` },
        h('div', { class: 'topic-num' }, t.order_no),
        h('div', { class: 'topic-body' },
          h('h3', null, t.title),
          h('p', null, t.summary),
          h('div', { class: 'topic-meta' },
            h('span', null, `⏱ ${t.hours} soat`),
            t.quiz_best != null ? h('span', null, `📝 Test: ${Math.round(t.quiz_best)}%`) : null,
            !t.is_published ? h('span', { class: 'badge' }, 'Yashirin') : null,
            h('span', { class: `badge ${t.status === 'completed' ? 'badge-ok' : t.status ? 'badge-info' : ''}` },
              t.status === 'completed' ? 'Tugallangan' : t.status ? 'Boshlangan' : 'Yangi')))))))));
}

export async function topicView(id) {
  const data = await api(`/topics/${id}`);
  const t = data.topic;
  const responses = Object.fromEntries(data.responses.map(r => [r.method_key, r]));
  const started = Date.now();
  const sendTime = () => {
    const sec = Math.round((Date.now() - started) / 1000);
    if (sec > 5) navigator.sendBeacon?.(`/api/topics/${t.id}/time`, new Blob([JSON.stringify({ seconds: sec })], { type: 'application/json' }));
  };
  onLeave(sendTime);

  const tabs = [
    ['nazariya', '📖 Nazariya'],
    ['metodlar', `🧩 Interaktiv metodlar (${t.methods.length})`],
    ['test', `📝 Test (${t.quiz.length})`],
    ['amaliyot', '🛠 Amaliyot va mustaqil ish'],
    ['eslatma', '🗒 Eslatmalarim'],
  ];
  const body = h('div', { class: 'tab-body' });
  const tabBar = h('div', { class: 'tabs', role: 'tablist' });
  const show = key => {
    [...tabBar.children].forEach(b => b.classList.toggle('active', b.dataset.k === key));
    clear(body, PANES[key]());
  };
  tabs.forEach(([k, label]) => tabBar.append(h('button', { class: 'tab', 'data-k': k, role: 'tab', onclick: () => show(k) }, label)));

  const PANES = {
    nazariya: () => h('div', null,
      t.objectives.length ? h('div', { class: 'objectives' }, h('h3', null, '🎯 Mavzu maqsadlari'), h('ul', null, t.objectives.map(o => h('li', null, o)))) : null,
      h('article', { class: 'prose', html: md(t.content) }),
      t.keywords.length ? h('section', { class: 'keywords' }, h('h3', null, '🔑 Tayanch tushunchalar'),
        h('div', { class: 'flashcards' }, t.keywords.map(k => h('button', { class: 'flashcard', onclick: e => e.currentTarget.classList.toggle('flipped') },
          h('div', { class: 'fc-front' }, k.term), h('div', { class: 'fc-back' }, k.definition)))),
        h('p', { class: 'muted small' }, 'Kartochkani bosib, ta\'rifini ko\'ring.')) : null,
      t.resources.length ? h('section', null, h('h3', null, '🔗 Qo\'shimcha manbalar'),
        h('ul', null, t.resources.map(r => h('li', null, h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.title))))) : null),
    metodlar: () => t.methods.length
      ? h('div', { class: 'methods' }, t.methods.map(m => methodWidget(t.id, m, responses[m.key])))
      : h('p', { class: 'muted' }, 'Bu mavzu uchun interaktiv metodlar hali qo\'shilmagan.'),
    test: () => quizPane(t, data.progress),
    amaliyot: () => h('div', null,
      t.practice.map(p => h('div', { class: 'panel' }, h('h3', null, p.title), h('p', null, p.text))),
      h('h3', null, 'Mustaqil ish topshiriqlari'),
      data.assignments.length ? data.assignments.map(a => h('div', { class: 'panel' },
        h('div', { class: 'row space' }, h('h4', null, a.title),
          h('span', { class: `badge ${a.sub_status === 'graded' ? 'badge-ok' : a.sub_status ? 'badge-info' : ''}` },
            a.sub_status === 'graded' ? `Baholandi: ${a.sub_score}/${a.max_score}` : a.sub_status ? 'Yuborilgan' : `Maks. ${a.max_score} ball`)),
        h('p', null, a.description),
        h('a', { class: 'btn btn-sm', href: '#/selfstudy' }, 'Mustaqil ta\'lim bo\'limida bajarish →')))
        : h('p', { class: 'muted' }, 'Topshiriqlar yo\'q.')),
    eslatma: () => {
      const status = h('span', { class: 'muted small' });
      const save = debounce(async v => {
        await api(`/topics/${t.id}/note`, { method: 'PUT', body: { text: v } });
        data.note = v;
        status.textContent = 'Saqlandi ✓';
      }, 800);
      return h('div', null, h('p', { class: 'muted' }, 'Mavzu bo\'yicha shaxsiy konspekt, savollar va fikrlaringizni yozing. Avtomatik saqlanadi.'),
        h('textarea', { class: 'note', rows: 14, oninput: e => { status.textContent = 'Saqlanmoqda...'; save(e.target.value); } }, data.note), status);
    },
  };

  const completeBtn = h('button', { class: `btn ${data.progress.status === 'completed' ? 'btn-ghost' : 'btn-primary'}`, disabled: data.progress.status === 'completed',
    onclick: async () => {
      await api(`/topics/${t.id}/complete`, { method: 'POST' });
      completeBtn.textContent = 'Tugallangan ✓';
      completeBtn.disabled = true;
      toast('Mavzu tugallandi! 🎉');
    } }, data.progress.status === 'completed' ? 'Tugallangan ✓' : 'Mavzuni tugallash');

  const page = h('div', { class: 'page' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/topics' }, 'Mavzular'), ' / ', t.module),
    h('header', { class: 'topic-head' },
      h('div', { class: 'topic-num big' }, t.order_no),
      h('div', null, h('h1', null, t.title), h('p', { class: 'muted' }, t.summary)),
      completeBtn),
    tabBar, body,
    h('div', { class: 'row space topic-nav' },
      data.prev ? h('a', { class: 'btn btn-ghost', href: `#/topic/${data.prev.id}` }, `← ${data.prev.order_no}. ${data.prev.title}`) : h('span'),
      data.next ? h('a', { class: 'btn btn-ghost', href: `#/topic/${data.next.id}` }, `${data.next.order_no}. ${data.next.title} →`) : h('span')));
  show('nazariya');
  return page;
}

function quizPane(t, progress) {
  if (!t.quiz.length) return h('p', { class: 'muted' }, 'Test savollari hali qo\'shilmagan.');
  const answers = {};
  const result = h('div');
  const qs = t.quiz.map((q, i) => h('fieldset', { class: 'quiz-q' },
    h('legend', null, `${i + 1}. ${q.q}`),
    q.options.map((o, j) => h('label', { class: 'option' },
      h('input', { type: 'radio', name: `q${i}`, value: j, onchange: () => { answers[i] = j; } }), h('span', null, o))),
    h('div', { class: 'quiz-expl' })));
  const submit = async () => {
    if (Object.keys(answers).length < t.quiz.length) return toast('Barcha savollarga javob bering', 'error');
    const r = await api(`/topics/${t.id}/quiz`, { method: 'POST', body: { answers } });
    r.details.forEach(d => {
      const fs = qs[d.index];
      fs.classList.toggle('good', d.correct);
      fs.classList.toggle('bad', !d.correct);
      fs.querySelectorAll('.option').forEach((lab, j) => lab.classList.toggle('correct-opt', j === d.answer));
      clear(fs.querySelector('.quiz-expl'), d.explanation ? `💡 ${d.explanation}` : '');
    });
    clear(result, h('div', { class: `alert ${r.score >= 70 ? 'alert-ok' : 'alert-warn'}` },
      h('b', null, `Natija: ${r.correct}/${r.total} — ${r.score}%`), r.score >= 70 ? ' Ajoyib!' : ' Nazariyani qayta ko\'rib chiqing va yana urinib ko\'ring.'));
    result.scrollIntoView({ behavior: 'smooth' });
  };
  return h('div', null,
    progress?.quiz_attempts ? h('p', { class: 'muted' }, `Urinishlar: ${progress.quiz_attempts} · Eng yaxshi natija: ${Math.round(progress.quiz_best)}%`) : null,
    qs, h('button', { class: 'btn btn-primary', onclick: submit }, 'Javoblarni tekshirish'), result);
}
