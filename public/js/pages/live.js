// Safar Live: jonli sinf viktorinasi. O'qituvchi proyektorda o'yinni boshqaradi (PIN + QR),
// o'quvchilar telefonda qo'shilib javob beradi; tezlik va seriya uchun ball, jonli reyting, shohsupa.
import { h, mount, toast, loading } from "../ui.js";
import { api, session } from "../api.js";
import { TOPICS } from "../../data/topics.js";
import { confetti } from "../motion.js";
import { sfx } from "../sfx.js";
import { createNarrator } from "../narrator.js";

const AVATARS = ["🐪", "🦁", "🐯", "🦅", "🐬", "🦊", "🐼", "🐸", "🦉", "🐝", "🦄", "🐢", "🐧", "🐨", "🦋", "🐙"];
const SHAPES = ["▲", "◆", "●", "■"];
const credKey = (pin) => `vgt.live.${pin}`;
const joinUrl = (pin) => `${location.origin}/#/live?pin=${pin}`;

async function qrSvg(text, size = 220) {
  const { default: qrcode } = await import("/vendor/qrcode/qrcode.mjs");
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  let path = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="${size}" height="${size}" role="img" aria-label="Qo'shilish uchun QR-kod"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${path}" fill="#0a2e33"/></svg>`;
}

// ---------------- O'qituvchi: o'yin yaratish (panel bo'limi) ----------------

export function createForm() {
  const selected = new Set();
  const count = h("input", { type: "number", min: 3, max: 30, value: 10 });
  const duration = h("select", {}, [10, 15, 20, 30, 45, 60].map((d) => h("option", { value: d, selected: d === 20 }, `${d} soniya`)));
  const title = h("input", { placeholder: "Masalan: 7-mavzu bo'yicha musobaqa", maxlength: 100 });
  const readAloud = h("input", { type: "checkbox" });
  const chips = h("div", { class: "chips" }, TOPICS.map((t) => h("button", { type: "button", class: "chip", title: t.title, onclick: (e) => {
    selected.has(t.id) ? selected.delete(t.id) : selected.add(t.id);
    e.currentTarget.classList.toggle("active", selected.has(t.id));
  } }, `${t.icon} ${t.num}`)));
  const btn = h("button", { class: "btn lg", onclick: async () => {
    btn.disabled = true;
    try {
      const { pin } = await api.post("live", { topicIds: [...selected], count: Number(count.value), duration: Number(duration.value), title: title.value.trim(), readAloud: readAloud.checked });
      location.hash = `#/live/host/${pin}`;
    } catch (e) {
      toast(e.message, "error");
      btn.disabled = false;
    }
  } }, "🎮 O'yinni yaratish");
  return h(
    "div",
    { class: "stack" },
    h("div", { class: "live-promo" }, h("div", {}, h("h2", {}, "🎮 Safar Live — jonli sinf viktorinasi"), h("p", {}, "Savollar proyektorda chiqadi, o'quvchilar telefonda QR-kod yoki PIN orqali qo'shilib javob beradi. To'g'ri va tez javob ko'proq ball beradi, ketma-ket to'g'ri javoblar uchun bonus. Har savoldan keyin jonli reyting, oxirida shohsupa.")), h("div", { class: "live-promo-shapes", "aria-hidden": "true" }, SHAPES.map((s, i) => h("span", { class: `opt-c${i}` }, s)))),
    h("div", { class: "card stack" },
      h("label", { class: "field" }, h("span", {}, "O'yin nomi"), title),
      h("div", {}, h("b", {}, "Mavzular "), h("small", { class: "muted" }, "(tanlanmasa — barcha mavzulardan)"), chips),
      h("div", { class: "grid cols-2" }, h("label", { class: "field" }, h("span", {}, "Savollar soni"), count), h("label", { class: "field" }, h("span", {}, "Har bir savolga vaqt"), duration)),
      h("label", { class: "check-row" }, readAloud, " 🔊 Savollarni AI ovozida o'qib berish (Gemini TTS)"),
      btn)
  );
}

// ---------------- O'quvchi: qo'shilish ----------------

export function renderJoin(el) {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const pin = h("input", { class: "pin-input", inputmode: "numeric", maxlength: 6, placeholder: "PIN", value: params.get("pin") || "", autocomplete: "off" });
  const name = h("input", { class: "name-input", maxlength: 24, placeholder: "Ismingiz", value: session.user?.name?.split(" ")[0] || "" });
  let avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const grid = h("div", { class: "avatar-grid" }, AVATARS.map((a) => h("button", { type: "button", class: `av ${a === avatar ? "active" : ""}`, onclick: (e) => {
    avatar = a;
    grid.querySelectorAll(".av").forEach((x) => x.classList.toggle("active", x === e.currentTarget));
  } }, a)));
  const err = h("div");
  const form = h(
    "form",
    { class: "live-join card", onsubmit: async (e) => {
      e.preventDefault();
      err.replaceChildren();
      const p = pin.value.trim();
      if (!/^\d{6}$/.test(p)) return err.replaceChildren(h("div", { class: "alert alert-error" }, "PIN 6 ta raqamdan iborat"));
      try {
        const r = await api.post(`live/${p}/join`, { name: name.value.trim(), avatar });
        sessionStorage.setItem(credKey(p), JSON.stringify({ pid: r.pid, key: r.key }));
        sfx.join();
        location.hash = `#/live/play/${p}`;
      } catch (ex) {
        err.replaceChildren(h("div", { class: "alert alert-error" }, ex.message));
      }
    } },
    h("div", { class: "live-logo" }, h("span", {}, "🎮"), h("b", {}, "Safar Live")),
    pin,
    name,
    h("p", { class: "muted small center" }, "Avatar tanlang"),
    grid,
    err,
    h("button", { class: "btn lg block", type: "submit" }, "Qo'shilish 🚀")
  );
  mount(el, h("div", { class: "live-join-wrap" }, h("div", { class: "live-bg", "aria-hidden": "true" }, SHAPES.map((s, i) => h("span", { class: `float-shape opt-c${i}`, style: { "--i": i } }, s))), form));
  (pin.value ? name : pin).focus();
}

// ---------------- O'quvchi: o'yin ekrani ----------------

export async function renderPlay(el, pin) {
  let cred;
  try {
    cred = JSON.parse(sessionStorage.getItem(credKey(pin)) || "null");
  } catch {}
  if (!cred) {
    location.hash = `#/live?pin=${pin}`;
    return;
  }
  let timer;
  let alive = true;
  let last = { state: null, qIndex: -2 };
  let sending = false;
  const screen = h("div", { class: "live-play" });
  mount(el, screen);

  const tick = async () => {
    if (!alive) return;
    try {
      const d = await api.get(`live/${pin}/play?pid=${cred.pid}&key=${cred.key}`);
      const changed = d.state !== last.state || d.qIndex !== last.qIndex || (d.state === "question" && d.answered !== last.answered);
      if (changed) draw(d);
      last = d;
    } catch (e) {
      if (/topilmadi|qaytadan/.test(e.message)) {
        screen.replaceChildren(h("div", { class: "lp-msg" }, h("div", { class: "big-emoji" }, "🔌"), h("h2", {}, e.message), h("a", { class: "btn", href: `#/live?pin=${pin}` }, "Qayta qo'shilish")));
        alive = false;
        return;
      }
    }
    timer = setTimeout(tick, 1200);
  };

  const header = (d) => h("div", { class: "lpl-head" }, h("span", { class: "lpl-me" }, d.me.avatar, " ", d.me.name), h("span", {}, d.qIndex >= 0 ? `${Math.min(d.qIndex + 1, d.total)} / ${d.total}` : d.title));

  function draw(d) {
    if (d.state === "lobby") {
      screen.className = "live-play st-lobby";
      screen.replaceChildren(header(d), h("div", { class: "lp-msg" }, h("div", { class: "big-emoji bounce" }, d.me.avatar), h("h2", {}, "Siz o'yindasiz!"), h("p", {}, "Ismingizni proyektorda ko'ring. O'qituvchi o'yinni boshlashini kuting…"), h("div", { class: "dots" }, h("i"), h("i"), h("i"))));
    } else if (d.state === "question") {
      screen.className = "live-play st-question";
      if (d.answered) {
        screen.replaceChildren(header(d), h("div", { class: "lp-msg" }, h("div", { class: "big-emoji spin-slow" }, "⏳"), h("h2", {}, "Javob yuborildi!"), h("p", {}, "Boshqalar javob berishini kuting…")));
        return;
      }
      const bar = h("div", { class: "lpl-timer" }, h("i", { style: { animationDuration: `${d.timeLeft}ms` } }));
      screen.replaceChildren(
        header(d),
        bar,
        h("p", { class: "lpl-q" }, d.question.q),
        h("div", { class: "lpl-opts" }, d.question.options.map((o, i) => h("button", { class: `lpl-opt opt-c${i}`, onclick: async () => {
          if (sending) return;
          sending = true;
          try {
            await api.post(`live/${pin}/answer`, { pid: cred.pid, key: cred.key, q: d.qIndex, choice: i });
            draw({ ...d, answered: true });
            last = { ...d, answered: true };
          } catch (e) {
            toast(e.message, "warn");
          }
          sending = false;
        } }, h("span", { class: "shape" }, SHAPES[i]), h("span", {}, o))))
      );
    } else if (d.state === "reveal") {
      const r = d.result;
      const ok = r.myChoice === r.correctOption;
      const none = r.myChoice === null || r.myChoice === undefined;
      ok ? sfx.correct() : sfx.wrong();
      screen.className = `live-play st-reveal ${ok ? "good" : "bad"}`;
      screen.replaceChildren(
        header(d),
        h("div", { class: "lp-msg" },
          h("div", { class: "big-emoji pop" }, ok ? "🎉" : none ? "⌛" : "😕"),
          h("h2", {}, ok ? "To'g'ri!" : none ? "Vaqt tugadi" : "Noto'g'ri"),
          ok && h("div", { class: "points-pop" }, `+${r.last}`),
          r.streak >= 2 && h("div", { class: "streak-badge" }, `🔥 ${r.streak} ta ketma-ket!`),
          !ok && h("p", { class: "correct-was" }, "To'g'ri javob: ", h("b", {}, d.question.options[r.correctOption])),
          h("div", { class: "lpl-score" }, h("span", {}, `Jami: ${r.total} ball`), h("span", {}, `🏅 ${r.rank}-o'rin / ${r.players}`)))
      );
    } else if (d.state === "final") {
      const r = d.result;
      if (r.rank <= 3) {
        confetti();
        sfx.win();
      }
      screen.className = "live-play st-final";
      screen.replaceChildren(
        header(d),
        h("div", { class: "lp-msg" },
          h("div", { class: "big-emoji pop" }, ["🥇", "🥈", "🥉"][r.rank - 1] || "🏁"),
          h("h2", {}, r.rank <= 3 ? `${r.rank}-o'rin! Tabriklaymiz!` : `${r.rank}-o'rin`),
          h("p", {}, `${r.total} ball · ${r.correctCount} ta to'g'ri javob`),
          h("div", { class: "mini-podium" }, (d.podium || []).map((p, i) => h("div", {}, h("span", {}, ["🥇", "🥈", "🥉"][i]), " ", p.avatar, " ", h("b", {}, p.name), ` — ${p.total}`))),
          h("a", { class: "btn", href: "#/live" }, "Yangi o'yinga qo'shilish"))
      );
      alive = false;
    }
  }

  tick();
  return () => {
    alive = false;
    clearTimeout(timer);
  };
}

// ---------------- O'qituvchi: proyektor ekrani ----------------

export async function renderHost(el, pin) {
  mount(el, loading());
  let alive = true;
  let timer;
  let g = null;
  let view = null; // reveal ichida: "dist" | "board"
  let lastKey = "";
  let busy = false;
  let lastTickSec = -1;
  const narr = createNarrator({});
  const qr = await qrSvg(joinUrl(pin), 230).catch(() => "");
  const stage = h("div", { class: "live-host" });
  const soundBtn = h("button", { class: "lh-tool", title: "Ovoz effektlari", onclick: () => {
    sfx.setMuted(!sfx.muted);
    soundBtn.textContent = sfx.muted ? "🔇" : "🔊";
  } }, sfx.muted ? "🔇" : "🔊");
  const tools = h("div", { class: "lh-tools" }, soundBtn, h("button", { class: "lh-tool", title: "To'liq ekran", onclick: () => (document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen?.().catch(() => {})) }, "⛶"));
  const wrap = h("div", { class: "live-host-wrap" }, tools, stage);
  mount(el, wrap);

  const control = async (action) => {
    if (busy) return;
    busy = true;
    try {
      await api.post(`live/${pin}/control`, { action });
      if (action === "reveal") sfx.reveal();
      if (action === "start") sfx.start();
      view = action === "reveal" ? "dist" : null;
      await poll(true);
    } catch (e) {
      toast(e.message, "error");
    }
    busy = false;
  };

  const poll = async (force = false) => {
    if (!alive) return;
    clearTimeout(timer);
    try {
      g = await api.get(`live/${pin}/host`);
      const key = `${g.state}|${g.qIndex}|${view}|${g.state === "lobby" ? g.players.length : ""}`;
      if (force || key !== lastKey) draw();
      else update();
      lastKey = key;
      // Vaqt tugasa yoki hamma javob bersa — javoblarni avtomatik ochish
      if (g.state === "question" && (g.timeLeft <= 0 || (g.players.length > 0 && g.answered >= g.players.length))) await control("reveal");
    } catch (e) {
      stage.replaceChildren(h("div", { class: "lp-msg" }, h("h2", {}, e.message), h("a", { class: "btn", href: "#/teacher/live" }, "Orqaga")));
      alive = false;
      return;
    }
    if (alive) timer = setTimeout(poll, 1000);
  };

  function update() {
    if (g.state === "question") {
      const sec = Math.ceil(g.timeLeft / 1000);
      const n = stage.querySelector(".lh-count");
      if (n) n.textContent = sec;
      stage.querySelector(".lh-ring")?.style.setProperty("--p", (g.timeLeft / (g.duration * 1000)) * 100);
      const a = stage.querySelector(".lh-answered");
      if (a) a.textContent = `${g.answered} / ${g.players.length} javob`;
      if (sec <= 5 && sec > 0 && sec !== lastTickSec) {
        lastTickSec = sec;
        sfx.tick();
      }
    }
  }

  const playersGrid = () => h("div", { class: "lh-players" }, g.players.map((p, i) => h("div", { class: "lh-player", style: { "--i": i % 12 } }, h("span", {}, p.avatar), h("b", {}, p.name))));

  function draw() {
    stage.className = `live-host st-${g.state}`;
    if (g.state === "lobby") {
      stage.replaceChildren(
        h("div", { class: "lh-lobby" },
          h("div", { class: "lh-join" },
            h("div", { class: "lh-title" }, "🎮 ", g.title),
            h("p", {}, "Telefoningizda oching:"),
            h("div", { class: "lh-url" }, `${location.host}/#/live`),
            h("p", {}, "O'yin PIN-kodi:"),
            h("div", { class: "lh-pin" }, pin.split("").map((c, i) => h("span", { style: { "--i": i } }, c))),
            qr && h("div", { class: "lh-qr", html: qr })),
          h("div", { class: "lh-lobby-right" },
            h("div", { class: "lh-count-players" }, h("b", {}, g.players.length), " o'yinchi"),
            g.players.length ? playersGrid() : h("p", { class: "lh-wait" }, "O'quvchilar qo'shilishini kuting…"),
            h("button", { class: "btn lg lh-big", disabled: !g.players.length, onclick: () => control("start") }, `▶ Boshlash (${g.questions.length} savol)`)))
      );
      if (g.players.length) sfx.join();
    } else if (g.state === "question") {
      const q = g.questions[g.qIndex];
      lastTickSec = -1;
      stage.replaceChildren(
        h("div", { class: "lh-top" }, h("span", { class: "lh-qnum" }, `${g.qIndex + 1} / ${g.questions.length}`), h("span", { class: "lh-answered" }, `${g.answered} / ${g.players.length} javob`), h("button", { class: "btn ghost light", onclick: () => control("reveal") }, "Javoblarni ochish ⏭")),
        h("div", { class: "lh-qwrap" }, h("div", { class: "lh-ring", style: { "--p": 100 } }, h("span", { class: "lh-count" }, Math.ceil(g.timeLeft / 1000))), h("h2", { class: "lh-q" }, q.q)),
        h("div", { class: "lh-opts" }, q.options.map((o, i) => h("div", { class: `lh-opt opt-c${i}`, style: { "--i": i } }, h("span", { class: "shape" }, SHAPES[i]), h("span", {}, o))))
      );
      if (g.readAloud) narr.speak(`${q.q} ${q.options.map((o, i) => `${["A", "B", "C", "D"][i]}: ${o}.`).join(" ")}`, { style: "narrator" });
    } else if (g.state === "reveal" && view !== "board") {
      narr.stop();
      const q = g.questions[g.qIndex];
      const max = Math.max(1, ...(g.dist || []));
      stage.replaceChildren(
        h("div", { class: "lh-top" }, h("span", { class: "lh-qnum" }, `${g.qIndex + 1} / ${g.questions.length}`), h("span", {}, `${(g.dist || []).reduce((a, b) => a + b, 0)} / ${g.players.length} javob berdi`), h("button", { class: "btn lg", onclick: () => ((view = "board"), draw()) }, "🏆 Reyting →")),
        h("h2", { class: "lh-q small" }, q.q),
        h("div", { class: "lh-dist" }, q.options.map((o, i) => h("div", { class: `lh-dcol ${i === q.correct ? "correct" : "dim"}` },
          h("div", { class: "lh-dbar-wrap" }, h("b", {}, g.dist?.[i] || 0), h("div", { class: `lh-dbar opt-c${i}`, style: { "--h": `${((g.dist?.[i] || 0) / max) * 100}%` } })),
          h("div", { class: `lh-opt small opt-c${i}` }, h("span", { class: "shape" }, i === q.correct ? "✓" : SHAPES[i]), h("span", {}, o)))))
      );
    } else if (g.state === "reveal" && view === "board") {
      const rows = Object.entries(g.board).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
      stage.replaceChildren(
        h("div", { class: "lh-top" }, h("span", { class: "lh-qnum" }, "🏆 Reyting"), h("span", {}), h("button", { class: "btn lg", onclick: () => control("next") }, g.qIndex + 1 >= g.questions.length ? "🏁 Yakuniy natijalar" : "Keyingi savol →")),
        h("ol", { class: "lh-board" }, rows.map(([pid, r], i) => {
          const prev = g.prevRanks?.[pid];
          const moved = prev ? prev - (i + 1) : 0;
          return h("li", { class: "lh-row", style: { "--i": i, "--from": `${(prev ? prev - 1 - i : 0) * 100}%` } },
            h("span", { class: "lh-rank" }, i + 1),
            h("span", { class: "lh-av" }, r.avatar),
            h("b", { class: "lh-name" }, r.name),
            r.streak >= 2 && h("span", { class: "lh-streak" }, `🔥${r.streak}`),
            moved > 0 && h("span", { class: "lh-up" }, `▲${moved}`),
            r.last > 0 && h("span", { class: "lh-last" }, `+${r.last}`),
            h("span", { class: "lh-total" }, r.total));
        }))
      );
    } else if (g.state === "final") {
      narr.stop();
      const rows = Object.entries(g.board).sort((a, b) => b[1].total - a[1].total);
      const top = rows.slice(0, 3);
      const order = [1, 0, 2].filter((i) => top[i]);
      stage.replaceChildren(
        h("div", { class: "lh-top" }, h("span", { class: "lh-qnum" }, "🏁 ", g.title), h("span", {}), h("div", { class: "row" },
          h("button", { class: "btn ghost light", onclick: () => exportCsv(rows) }, "⬇ CSV"),
          h("a", { class: "btn", href: "#/teacher/live" }, "🎮 Yangi o'yin"))),
        h("div", { class: "lh-podium" }, order.map((i) => h("div", { class: `lh-pod p${i + 1}`, style: { "--d": `${[2, 1, 3][i] * 0.5}s` } },
          h("div", { class: "lh-pod-av" }, top[i][1].avatar), h("b", {}, top[i][1].name), h("span", {}, `${top[i][1].total} ball`),
          h("div", { class: "lh-pod-col" }, h("span", {}, ["🥇", "🥈", "🥉"][i]))))),
        rows.length > 3 ? h("ol", { class: "lh-rest", start: 4 }, rows.slice(3, 15).map(([, r]) => h("li", {}, r.avatar, " ", r.name, h("b", {}, r.total)))) : ""
      );
      setTimeout(() => {
        confetti();
        sfx.win();
      }, 1600);
      setTimeout(confetti, 2600);
    }
  }

  function exportCsv(rows) {
    const lines = [["O'rin", "Ism", "Ball", "To'g'ri javoblar"], ...rows.map(([, r], i) => [i + 1, r.name, r.total, r.correct])];
    const csv = "﻿" + lines.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = h("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `safar-live-${pin}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
  }

  poll(true);
  return () => {
    alive = false;
    clearTimeout(timer);
    narr.stop();
  };
}
