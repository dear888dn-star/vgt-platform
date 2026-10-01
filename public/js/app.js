import { h, clear, api, toast, loading, errorBox, stat, bars, fmtDate, ROLE_NAMES } from './util.js';
import { topicsView, topicView } from './views/topics.js';
import { selfstudyView } from './views/selfstudy.js';
import { trainerView, trainerSessionView } from './views/trainer.js';
import { surveysView, surveyView } from './views/surveys.js';
import * as teacher from './views/teacher.js';

export const state = { user: null };

const NAV = {
  student: [
    ['#/', '🏠', 'Bosh sahifa'],
    ['#/topics', '📚', 'Mavzular'],
    ['#/selfstudy', '🎯', 'Mustaqil ta\'lim'],
    ['#/trainer', '🧭', 'Gid trenajyori'],
    ['#/surveys', '📝', 'So\'rovnomalar'],
  ],
  teacher: [
    ['#/', '📊', 'Panel'],
    ['#/teacher/students', '👥', 'O\'quvchilar'],
    ['#/teacher/surveys', '📝', 'So\'rovnoma natijalari'],
    ['#/teacher/trainer', '🧭', 'Trenajyor natijalari'],
    ['#/teacher/submissions', '✅', 'Topshiriqlar'],
    ['#/teacher/topics', '✏️', 'Mavzular muharriri'],
    ['#/topics', '📚', 'Mavzularni ko\'rish'],
    ['#/trainer', '🎮', 'Trenajyorni sinash'],
    ['#/surveys', '🗳️', 'Anketalarni to\'ldirish'],
  ],
};
NAV.admin = [...NAV.teacher, ['#/admin/users', '🔐', 'Foydalanuvchilar']];

const routes = [
  [/^#\/login$/, () => authView('login'), { public: true }],
  [/^#\/register$/, () => authView('register'), { public: true }],
  [/^#\/?$/, () => (state.user.role === 'student' ? studentHome() : teacher.dashboardView())],
  [/^#\/topics$/, topicsView],
  [/^#\/topic\/(\d+)$/, m => topicView(m[1])],
  [/^#\/selfstudy(?:\/(\w+))?$/, m => selfstudyView(m[1])],
  [/^#\/trainer$/, trainerView],
  [/^#\/trainer\/session\/(\d+)$/, m => trainerSessionView(m[1])],
  [/^#\/surveys$/, surveysView],
  [/^#\/survey\/(\d+)$/, m => surveyView(m[1])],
  [/^#\/profile$/, profileView],
  [/^#\/teacher\/students$/, teacher.studentsView, { staff: true }],
  [/^#\/teacher\/student\/(\d+)$/, m => teacher.studentView(m[1]), { staff: true }],
  [/^#\/teacher\/surveys$/, teacher.surveysAdminView, { staff: true }],
  [/^#\/teacher\/survey\/(\d+)\/results$/, m => teacher.surveyResultsView(m[1]), { staff: true }],
  [/^#\/teacher\/survey\/(\d+)\/compare$/, m => teacher.surveyCompareView(m[1]), { staff: true }],
  [/^#\/teacher\/survey\/(new|\d+)\/edit$/, m => teacher.surveyEditView(m[1]), { staff: true }],
  [/^#\/teacher\/trainer$/, teacher.trainerReportView, { staff: true }],
  [/^#\/teacher\/submissions$/, teacher.submissionsView, { staff: true }],
  [/^#\/teacher\/topics$/, teacher.topicsAdminView, { staff: true }],
  [/^#\/teacher\/topic\/(new|\d+)\/edit$/, m => teacher.topicEditView(m[1]), { staff: true }],
  [/^#\/admin\/users$/, teacher.usersView, { admin: true }],
];

let cleanup = null;
export function onLeave(fn) { cleanup = fn; }

async function render() {
  if (cleanup) { try { cleanup(); } catch { /* */ } cleanup = null; }
  const hash = (location.hash || '#/').split('?')[0];
  const match = routes.find(([re]) => re.test(hash));
  if (!match) { location.hash = '#/'; return; }
  const [re, view, opts = {}] = match;
  if (!opts.public && !state.user) { location.hash = '#/login'; return; }
  if (opts.public && state.user) { location.hash = '#/'; return; }
  if (opts.staff && state.user.role === 'student') { location.hash = '#/'; return; }
  if (opts.admin && state.user.role !== 'admin') { location.hash = '#/'; return; }

  const app = document.getElementById('app');
  const main = h('main', { class: opts.public ? 'main-public' : 'main', id: 'main' }, loading());
  if (opts.public) clear(app, main);
  else clear(app, shell(hash), main);
  window.scrollTo(0, 0);
  try {
    const content = await view(hash.match(re));
    if (content) clear(main, content);
  } catch (e) {
    if (e.status === 401) { state.user = null; location.hash = '#/login'; return; }
    clear(main, errorBox(e));
  }
}

function shell(hash) {
  const items = NAV[state.user.role] || NAV.student;
  const active = href => (href === '#/' ? hash === '#/' || hash === '' : hash.startsWith(href));
  const sidebar = h('aside', { class: 'sidebar', id: 'sidebar' },
    h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-logo' }, '🧭'), h('span', null, h('b', null, 'Raqamli Gid'), h('small', null, 'Virtual gidlik trenajyori'))),
    h('nav', null, items.map(([href, icon, label]) => h('a', { href, class: active(href) ? 'active' : '', onclick: () => document.body.classList.remove('nav-open') },
      h('span', { class: 'nav-icon' }, icon), label))),
    h('div', { class: 'sidebar-foot' },
      h('a', { href: '#/profile', class: 'user-chip' },
        h('span', { class: 'avatar' }, (state.user.full_name || '?').slice(0, 1).toUpperCase()),
        h('span', null, h('b', null, state.user.full_name), h('small', null, ROLE_NAMES[state.user.role] + (state.user.group_name ? ' · ' + state.user.group_name : '')))),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: logout }, 'Chiqish')));
  const topbar = h('header', { class: 'topbar' },
    h('button', { class: 'icon-btn', 'aria-label': 'Menyu', onclick: () => document.body.classList.toggle('nav-open') }, '☰'),
    h('a', { class: 'brand brand-sm', href: '#/' }, '🧭 Raqamli Gid'));
  return [topbar, sidebar, h('div', { class: 'nav-scrim', onclick: () => document.body.classList.remove('nav-open') })];
}

async function logout() {
  await api('/auth/logout', { method: 'POST' });
  state.user = null;
  location.hash = '#/login';
}

function authView(mode) {
  const isReg = mode === 'register';
  const err = h('div');
  const field = (label, name, type = 'text', extra = {}) =>
    h('label', { class: 'field' }, h('span', null, label), h('input', { name, type, ...extra }));
  const form = h('form', { class: 'auth-form', onsubmit: async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    clear(err);
    try {
      const { user } = await api(isReg ? '/auth/register' : '/auth/login', { method: 'POST', body: data });
      state.user = user;
      toast(isReg ? 'Ro\'yxatdan o\'tdingiz! Xush kelibsiz.' : 'Xush kelibsiz!');
      location.hash = '#/';
    } catch (ex) { clear(err, errorBox(ex)); }
  } },
    h('h2', null, isReg ? 'Ro\'yxatdan o\'tish' : 'Tizimga kirish'),
    h('p', { class: 'muted' }, isReg ? 'O\'quvchi profilini yarating' : 'Email va parolingizni kiriting'),
    isReg ? field('F.I.Sh.', 'full_name', 'text', { required: true, placeholder: 'Aliyev Vali' }) : null,
    field('Email', 'email', 'email', { required: true, autocomplete: 'email', placeholder: 'siz@example.com' }),
    field('Parol', 'password', 'password', { required: true, minlength: 6, autocomplete: isReg ? 'new-password' : 'current-password' }),
    isReg ? h('div', { class: 'grid-2' },
      field('Texnikum', 'college', 'text', { placeholder: 'Turizm va madaniy meros texnikumi' }),
      field('Guruh', 'group_name', 'text', { placeholder: 'T-21' })) : null,
    isReg ? h('div', { class: 'grid-2' },
      h('label', { class: 'field' }, h('span', null, 'Kurs'), h('select', { name: 'course' }, ['', 1, 2, 3].map(c => h('option', { value: c }, c ? `${c}-kurs` : '—')))),
      field('Mutaxassislik', 'specialty', 'text', { placeholder: 'Ekskursiya ishi' })) : null,
    err,
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, isReg ? 'Ro\'yxatdan o\'tish' : 'Kirish'),
    h('p', { class: 'auth-switch' }, isReg ? 'Profilingiz bormi? ' : 'Profilingiz yo\'qmi? ',
      h('a', { href: isReg ? '#/login' : '#/register' }, isReg ? 'Kirish' : 'Ro\'yxatdan o\'ting')));
  return h('div', { class: 'auth-page' },
    h('section', { class: 'auth-hero' },
      h('div', { class: 'hero-pattern' }),
      h('div', { class: 'auth-hero-inner' },
        h('div', { class: 'brand-logo big' }, '🧭'),
        h('h1', null, 'Raqamli Gid'),
        h('p', { class: 'lead' }, '"Turizmda raqamli texnologiyalar" fani va sun\'iy intellekt asosidagi virtual gidlik trenajyori'),
        h('ul', { class: 'hero-list' },
          h('li', null, '📚 Interaktiv mavzular va zamonaviy metodlar'),
          h('li', null, '🧭 Real vaziyatlarni simulyatsiya qiluvchi AI-trenajyor'),
          h('li', null, '🎯 Mustaqil ta\'lim va shaxsiy reja'),
          h('li', null, '📝 Ilmiy tadqiqot so\'rovnomalari')))),
    h('section', { class: 'auth-card' }, form));
}

async function studentHome() {
  const [o, topics] = await Promise.all([api('/selfstudy/overview'), api('/topics')]);
  const next = topics.topics.find(t => t.status !== 'completed');
  const pct = o.totalTopics ? Math.round((o.completed / o.totalTopics) * 100) : 0;
  return h('div', { class: 'page' },
    h('section', { class: 'welcome' },
      h('div', null,
        h('h1', null, `Salom, ${state.user.full_name.split(' ')[1] || state.user.full_name}! 👋`),
        h('p', { class: 'muted' }, 'Bugun raqamli gid bo\'lish yo\'lida yana bir qadam tashlang.')),
      h('div', { class: 'progress-ring', style: { '--p': pct } }, h('span', null, pct + '%'), h('small', null, 'kurs'))),
    o.surveysPending ? h('a', { class: 'alert alert-info clickable', href: '#/surveys' }, `📝 Sizni ${o.surveysPending} ta so'rovnoma kutmoqda — ilmiy tadqiqotda ishtirok eting.`) : null,
    h('div', { class: 'stats' },
      stat('Tugallangan mavzular', `${o.completed}/${o.totalTopics}`),
      stat('Testlar o\'rtachasi', o.quizAvg != null ? o.quizAvg + '%' : '—'),
      stat('Trenajyor mashg\'ulotlari', o.trainerCount, o.trainerBest != null ? `eng yaxshi: ${o.trainerBest}` : null),
      stat('Interaktiv metodlar', o.methodsDone),
      stat('O\'qishga sarflangan vaqt', `${o.timeSpentMin} daq`)),
    h('div', { class: 'grid-2 cards' },
      h('a', { class: 'card card-link accent-blue', href: next ? `#/topic/${next.id}` : '#/topics' },
        h('div', { class: 'card-icon' }, '📚'),
        h('h3', null, next ? 'Davom ettirish' : 'Barcha mavzular tugallandi!'),
        h('p', null, next ? next.title : 'Mavzularni qayta ko\'rib chiqing'),
        h('span', { class: 'link-arrow' }, 'Ochish →')),
      h('a', { class: 'card card-link accent-gold', href: '#/trainer' },
        h('div', { class: 'card-icon' }, '🧭'),
        h('h3', null, 'Virtual gidlik trenajyori'),
        h('p', null, 'Sun\'iy intellekt turist rolini o\'ynaydi: real vaqtda kutilmagan vaziyatlarni hal qiling.'),
        h('span', { class: 'link-arrow' }, 'Mashq qilish →')),
      h('a', { class: 'card card-link accent-green', href: '#/selfstudy' },
        h('div', { class: 'card-icon' }, '🎯'),
        h('h3', null, 'Mustaqil ta\'lim'),
        h('p', null, 'Topshiriqlar, shaxsiy reja, eslatmalar va glossariy.'),
        h('span', { class: 'link-arrow' }, 'O\'tish →')),
      h('a', { class: 'card card-link accent-purple', href: '#/surveys' },
        h('div', { class: 'card-icon' }, '📝'),
        h('h3', null, 'So\'rovnomalar'),
        h('p', null, 'Raqamli kompetensiyangizni baholang va tadqiqotga hissa qo\'shing.'),
        h('span', { class: 'link-arrow' }, 'To\'ldirish →'))),
    o.trainerHistory.length > 1 ? h('section', { class: 'panel' },
      h('h2', null, 'Trenajyordagi o\'sish dinamikangiz'),
      bars(o.trainerHistory.slice(-10).map((s, i) => ({ label: `${i + 1}-urinish`, value: s.score_total })), { max: 100, colorByValue: true })) : null);
}

async function profileView() {
  const u = state.user;
  const form = h('form', { class: 'panel form', onsubmit: async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try {
      const { user } = await api('/auth/me', { method: 'PUT', body: data });
      state.user = user;
      toast('Saqlandi');
      render();
    } catch (ex) { toast(ex.message, 'error'); }
  } },
    h('h2', null, 'Profil'),
    h('div', { class: 'grid-2' },
      h('label', { class: 'field' }, h('span', null, 'F.I.Sh.'), h('input', { name: 'full_name', value: u.full_name, required: true })),
      h('label', { class: 'field' }, h('span', null, 'Email'), h('input', { value: u.email, disabled: true })),
      h('label', { class: 'field' }, h('span', null, 'Texnikum'), h('input', { name: 'college', value: u.college || '' })),
      h('label', { class: 'field' }, h('span', null, 'Guruh'), h('input', { name: 'group_name', value: u.group_name || '' })),
      h('label', { class: 'field' }, h('span', null, 'Kurs'), h('input', { name: 'course', type: 'number', min: 1, max: 4, value: u.course || '' })),
      h('label', { class: 'field' }, h('span', null, 'Mutaxassislik'), h('input', { name: 'specialty', value: u.specialty || '' }))),
    h('h3', null, 'Parolni almashtirish'),
    h('div', { class: 'grid-2' },
      h('label', { class: 'field' }, h('span', null, 'Joriy parol'), h('input', { name: 'current_password', type: 'password', autocomplete: 'current-password' })),
      h('label', { class: 'field' }, h('span', null, 'Yangi parol'), h('input', { name: 'password', type: 'password', minlength: 6, autocomplete: 'new-password' }))),
    h('button', { class: 'btn btn-primary' }, 'Saqlash'));
  return h('div', { class: 'page narrow' }, form,
    h('p', { class: 'muted small' }, `Ro'yxatdan o'tgan sana: ${fmtDate(u.created_at)} · Rol: ${ROLE_NAMES[u.role]}`));
}

window.addEventListener('hashchange', render);

(async function boot() {
  try {
    const { user } = await api('/auth/me');
    state.user = user;
  } catch { /* */ }
  render();
})();

export { render };
