// "Safar pasporti": daraja va XP, mavzular bo'yicha viza muhrlari, nishonlar, faollik kalendari, reyting, sertifikat.
import { h, mount, toast, loading, fmtLongDate } from "../ui.js";
import { api, session } from "../api.js";
import { loadGame, progressState } from "../progress.js";
import { XP_RULES, LEVELS, certificateStatus } from "../gamification.js";

const SOURCES = [
  ["topics", "📚 Mavzular"],
  ["trainer", "🎙 Trenajyor"],
  ["routes", "🗺 Marshrut"],
  ["selfStudy", "🧩 Mustaqil ish"],
  ["diagnostics", "🧪 Diagnostika"],
  ["review", "🔁 Takrorlash"],
  ["streak", "🔥 Seriya"],
];

export async function render(el) {
  mount(el, loading());
  const user = session.user;
  const [game, cert] = await Promise.all([loadGame({ fresh: true }), api.get("certificate").catch(() => null)]);
  const progress = progressState();
  const lv = game.level;

  const ring = h("div", { class: "pp-ring", style: { "--p": 0 } }, h("span", { class: "pp-ring-icon" }, lv.icon));
  requestAnimationFrame(() => setTimeout(() => ring.style.setProperty("--p", lv.pct), 120));

  mount(
    el,
    h(
      "section",
      { class: "pp-cover" },
      h("div", { class: "pp-guilloche", "aria-hidden": "true" }),
      h(
        "div",
        { class: "pp-cover-main" },
        h("div", { class: "pp-emblem", "aria-hidden": "true" }, "🧭"),
        h("div", { class: "pp-title" }, h("small", {}, "SAFAR AKADEMIYA · RAQAMLI PASPORT"), h("h1", {}, user.name)),
        h(
          "dl",
          { class: "pp-fields" },
          h("div", {}, h("dt", {}, "Muassasa"), h("dd", {}, user.college || "—")),
          h("div", {}, h("dt", {}, "Guruh"), h("dd", {}, user.group || "—")),
          h("div", {}, h("dt", {}, "Respondent kodi"), h("dd", {}, user.code || "—")),
          h("div", {}, h("dt", {}, "Faol kunlar"), h("dd", {}, String(game.stats.activeDays)))
        )
      ),
      h(
        "div",
        { class: "pp-level" },
        ring,
        h("div", {}, h("div", { class: "pp-level-name" }, lv.name), h("div", { class: "pp-xp" }, h("b", { "data-count": game.xp }, "0"), " XP"), h("div", { class: "pp-next" }, lv.next ? `${lv.next.icon} ${lv.next.name} darajasigacha ${lv.toNext} XP` : "Eng yuqori daraja 👑")),
        h("div", { class: `pp-streak ${game.stats.streak ? "on" : ""}`, title: "Ketma-ket faol kunlar" }, h("span", {}, "🔥"), h("b", {}, game.stats.streak), h("small", {}, "kun"))
      ),
      h("div", { class: "pp-mrz", "aria-hidden": "true" }, `P<UZB${user.name.toUpperCase().replace(/[^A-Z]/g, "<").slice(0, 24).padEnd(24, "<")}<<${String(game.xp).padStart(5, "0")}<<${lv.name.toUpperCase().replace(/[^A-Z]/g, "")}`)
    ),
    levelsTrack(game.xp),
    h("h2", { class: "section-title" }, "🛂 Viza muhrlari — mavzular"),
    h("p", { class: "muted" }, "Har bir mavzuni to'liq o'zlashtirganingizda (nazariya, test, tushunchalar va interaktiv metodlar) pasportingizga muhr bosiladi."),
    stamps(game.topics),
    h("h2", { class: "section-title" }, "🏅 Nishonlar"),
    badges(game.badges),
    h("div", { class: "grid cols-2 pp-two" }, h("div", { class: "card" }, h("h3", {}, "📅 Faollik kalendari"), heatmap(progress.activity || {}), h("p", { class: "muted small" }, `Eng uzun seriya: ${game.stats.longest} kun · Joriy seriya: ${game.stats.streak} kun`)), h("div", { class: "card" }, h("h3", {}, "⭐ XP manbalari"), sources(game.bySource), h("details", { class: "small" }, h("summary", {}, "XP qanday hisoblanadi?"), h("ul", { class: "pp-rules" }, XP_RULES.map(([t, v]) => h("li", {}, h("span", {}, t), h("b", {}, typeof v === "number" ? `+${v}` : v))))))),
    h("h2", { class: "section-title" }, "🏆 Reyting"),
    leaderboardBlock(),
    h("h2", { class: "section-title" }, "🎓 Sertifikat"),
    certificateBlock(game, cert)
  );
}

function levelsTrack(xp) {
  return h(
    "div",
    { class: "pp-track", role: "list", "aria-label": "Darajalar" },
    LEVELS.map((l, i) => h("div", { class: `pp-step ${xp >= l.min ? "done" : ""}`, role: "listitem", style: { "--i": i } }, h("span", {}, l.icon), h("b", {}, l.name), h("small", {}, `${l.min} XP`)))
  );
}

function stamps(topics) {
  const hues = [182, 38, 262, 150, 8, 200, 320, 90, 24, 228, 170, 290, 52, 210, 130];
  return h(
    "div",
    { class: "stamps" },
    topics.map((t, i) => {
      const done = t.pct === 100;
      const rot = ((i * 37) % 21) - 10;
      return h(
        "a",
        { href: `#/topics/${t.id}`, class: `stamp ${done ? "stamped" : t.pct ? "st-partial" : "st-empty"}`, style: { "--hue": hues[i % hues.length], "--rot": `${rot}deg`, "--d": `${i * 70}ms` }, title: `${t.num}-mavzu: ${t.title} — ${t.pct}%` },
        h(
          "div",
          { class: "stamp-ink" },
          h("span", { class: "stamp-top" }, `${t.num}-MAVZU`),
          h("span", { class: "stamp-icon" }, t.icon),
          h("span", { class: "stamp-bottom" }, done ? "O'ZLASHTIRILDI" : `${t.pct}%`)
        ),
        h("div", { class: "stamp-caption" }, t.title)
      );
    })
  );
}

function badges(list) {
  const earned = list.filter((b) => b.earned).length;
  return h(
    "div",
    {},
    h("p", { class: "muted" }, `${earned} / ${list.length} ta nishon qo'lga kiritildi`),
    h(
      "div",
      { class: "badges" },
      list.map((b) =>
        h(
          "div",
          { class: `badge-card ${b.earned ? "earned" : "locked"}`, title: b.text },
          h("div", { class: "badge-medal" }, h("span", {}, b.icon)),
          h("b", {}, b.title),
          h("small", { class: "muted" }, b.text),
          !b.earned && b.progress !== null && h("div", { class: "badge-progress" }, h("i", { style: { width: `${Math.round(b.progress * 100)}%` } }))
        )
      )
    )
  );
}

function heatmap(activity) {
  const weeks = 18;
  const end = new Date();
  const dow = (end.getUTCDay() + 6) % 7; // dushanba = 0
  const first = new Date(end);
  first.setUTCDate(end.getUTCDate() - dow - (weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const day = new Date(first);
    day.setUTCDate(first.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    const n = activity[key] || 0;
    const lvl = n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4;
    const future = day > end;
    cells.push(h("i", { class: `hm-cell l${lvl} ${future ? "future" : ""}`, title: `${fmtLongDate(day, { year: false })}: ${n} ta faoliyat`, style: { "--d": `${i * 4}ms` } }));
  }
  return h(
    "div",
    { class: "heatmap-wrap" },
    h("div", { class: "heatmap", style: { "--weeks": weeks }, role: "img", "aria-label": `So'nggi ${weeks} hafta faolligi` }, cells),
    h("div", { class: "hm-legend" }, "Kam", [0, 1, 2, 3, 4].map((l) => h("i", { class: `hm-cell l${l}` })), "Ko'p")
  );
}

function sources(bySource) {
  const max = Math.max(1, ...Object.values(bySource));
  return h(
    "div",
    { class: "src-bars" },
    SOURCES.map(([k, label]) => h("div", { class: "src-row" }, h("span", {}, label), h("div", { class: "src-track" }, h("i", { style: { "--w": `${(bySource[k] / max) * 100}%` } })), h("b", {}, bySource[k])))
  );
}

function leaderboardBlock() {
  const box = h("div", { class: "card lb" }, loading());
  let data;
  let scope = "group";
  const draw = () => {
    const sc = data[scope] || data.college;
    const tabs = [
      data.group && ["group", `👥 Guruhim (${data.myGroup})`],
      ["college", `🏫 Texnikumim`],
      ["all", "🌍 Umumiy"],
    ].filter(Boolean);
    box.replaceChildren(
      h("div", { class: "row between wrap" }, h("div", { class: "segmented" }, tabs.map(([k, l]) => h("button", { class: `seg ${scope === k ? "active" : ""}`, onclick: () => ((scope = k), draw()) }, l))), h("span", { class: "muted small" }, `${sc.total} ishtirokchi`)),
      sc.top.length
        ? h("ol", { class: "lb-list" }, [...sc.top, ...(sc.me ? [sc.me] : [])].map((r, i) => h("li", { class: `lb-row ${r.me ? "me" : ""} ${r.rank <= 3 ? `top${r.rank}` : ""} ${sc.me && i === sc.top.length ? "gap" : ""}`, style: { "--i": i } }, h("span", { class: "lb-rank" }, r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank), h("span", { class: "lb-name" }, r.name, r.me && h("small", {}, " (siz)")), h("span", { class: "lb-level" }, r.icon, " ", r.level), h("span", { class: "lb-meta muted small" }, `🏅 ${r.badges} · 🔥 ${r.streak}`), h("b", { class: "lb-xp" }, `${r.xp} XP`))))
        : h("p", { class: "muted" }, "Hali ishtirokchilar yo'q."),
      h("p", { class: "muted small" }, data.hidden ? "Siz reytingda boshqalarga yashirin ko'rinasiz. " : "Reytingda faqat ism va familiyaning bosh harfi ko'rsatiladi. ", h("a", { href: "#/profile" }, "Profil sozlamalari"))
    );
  };
  api
    .get("leaderboard")
    .then((d) => {
      data = d;
      if (!d.group) scope = "college";
      draw();
    })
    .catch((e) => box.replaceChildren(h("p", { class: "muted" }, e.message)));
  return box;
}

function certificateBlock(game, cert) {
  if (cert) return h("div", { class: "card cert-ready" }, h("div", { class: "row between wrap" }, h("div", {}, h("h3", {}, "🎓 Sertifikatingiz tayyor"), h("p", { class: "muted" }, `Raqami: ${cert.code}`)), h("a", { href: `#/cert/${cert.code}`, class: "btn" }, "Sertifikatni ochish")));
  const st = certificateStatus(game);
  const btn = h("button", { class: "btn", disabled: !st.eligible, onclick: async () => {
    btn.disabled = true;
    try {
      const c = await api.post("certificate");
      location.hash = `#/cert/${c.code}`;
    } catch (e) {
      toast(e.message, "error");
      btn.disabled = false;
    }
  } }, "🎓 Sertifikat olish");
  return h(
    "div",
    { class: "card" },
    h("p", {}, "Kursni muvaffaqiyatli yakunlagan o'quvchilarga haqiqiyligini tekshirish mumkin bo'lgan raqamli sertifikat beriladi."),
    h("ul", { class: "cert-req" }, st.req.map(([t, ok, v]) => h("li", { class: ok ? "ok" : "" }, h("span", {}, ok ? "✅" : "⬜"), t, h("small", { class: "muted" }, ` — ${v}`)))),
    btn
  );
}
