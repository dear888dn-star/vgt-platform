// Virtual gidlik trenajyori: ssenariy tanlash, real vaqtdagi AI suhbat, kutilmagan hodisalar, baholash.
import { h, mount, toast, loading, fmtDate, modal, emptyState } from "../ui.js";
import { api } from "../api.js";
import { competencyChips } from "../competency.js";
import { FUNCTIONS } from "../../data/standard.js";
import { createVoice, voiceSupport } from "../voice.js";
import { sceneSVG } from "../landmarks.js";

// Har bir ssenariy uchun manzara (obida va kun vaqti)
const SCENE_OF = {
  "registon-tour": ["registan", "day"], "lost-tourist": ["bukhara", "day"], overbooking: ["tashkent", "night"], "double-payment": ["tashkent", "day"],
  "khiva-virtual": ["khiva", "sunset"], "foreign-arrival": ["tashkent", "sunset"], "negative-review": ["registan", "sunset"], "accessible-tour": ["shahizinda", "day"],
  "itinerary-design": ["aksaray", "sunset"], "heat-emergency": ["bukhara", "day"],
};
export const scenarioScene = (id, animated = false) => {
  const [landmark, time] = SCENE_OF[id] || ["registan", "day"];
  return sceneSVG({ landmark, time, animated, caravan: animated });
};

let cache = null;
async function scenarios() {
  cache ||= await api.get("trainer/scenarios");
  return cache;
}

const LEVEL_CLASS = { "Boshlang'ich": "lvl-1", "O'rta": "lvl-2", "Murakkab": "lvl-3" };

export async function renderList(el) {
  mount(el, loading());
  const [{ scenarios: list, aiEnabled }, sessions] = await Promise.all([scenarios(), api.get("trainer/sessions")]);
  const best = {};
  for (const s of sessions) best[s.scenarioId] = Math.max(best[s.scenarioId] ?? 0, s.total);
  const categories = ["Barchasi", ...new Set(list.map((s) => s.category))];
  const grid = h("div", { class: "grid cols-3" });
  const draw = (cat) => {
    grid.replaceChildren(
      ...list
        .filter((s) => cat === "Barchasi" || s.category === cat)
        .map((s) =>
          h(
            "a",
            { href: `#/trainer/${s.id}`, class: "card scenario-card tilt" },
            h("div", { class: "sc-scene", html: scenarioScene(s.id) }, h("span", { class: "sc-icon" }, s.icon), h("span", { class: `badge ${LEVEL_CLASS[s.level]}` }, s.level)),
            h("h3", {}, s.title),
            h("p", { class: "muted small" }, "📍 ", s.location),
            s.functions?.length > 0 && h("p", { class: "small" }, "🎯 ", s.functions.join(", "), " · ", s.competencies.filter((c) => c.startsWith("KK")).join(", ")),
            h("p", { class: "small clamp" }, s.brief),
            h("div", { class: "row between small" }, h("span", { class: "chip chip-soft" }, s.category), h("span", { class: "muted" }, `⏱ ${s.duration} daq · ${s.language}`)),
            best[s.id] !== undefined && h("div", { class: "best" }, `Eng yaxshi natija: ${best[s.id]}/100`)
          )
        )
    );
  };
  const filters = h(
    "div",
    { class: "chips filter" },
    categories.map((c, i) =>
      h("button", { class: `chip ${i === 0 ? "active" : ""}`, onclick: (e) => {
        filters.querySelectorAll(".chip").forEach((b) => b.classList.toggle("active", b === e.target));
        draw(c);
      } }, c)
    )
  );
  draw("Barchasi");

  mount(
    el,
    h(
      "section",
      { class: "trainer-hero" },
      h("div", {}, h("div", { class: "eyebrow" }, "Sun'iy intellekt asosidagi simulyator"), h("h1", {}, "Virtual gidlik trenajyori"),
        h("p", { class: "lead" }, "AI turist, mijoz yoki ekskursiya ishtirokchisi rolini o'ynaydi. Siz gid yoki turizm mutaxassisi sifatida real vaqt rejimida harakat qilasiz: savollarga javob berasiz, muammolarni hal qilasiz, kutilmagan hodisalarga moslashasiz. Yakunda 5 mezon bo'yicha 100 ballik baho va shaxsiy tavsiyalar olasiz.")),
      h("div", { class: "trainer-steps" }, ["1. Ssenariyni tanlang", "2. Vaziyat bilan tanishing", "3. Real vaqtda muloqot qiling", "4. AI bahosi va tavsiyalar"].map((s) => h("div", { class: "trainer-step" }, s)))
    ),
    !aiEnabled && h("div", { class: "alert alert-warn" }, "⚠️ Trenajyor demo-rejimda ishlamoqda: AI kaliti ulanmagan, personaj javoblari oldindan yozilgan. To'liq rejim uchun administrator GEMINI_API_KEY yoki ANTHROPIC_API_KEY ni sozlashi kerak."),
    filters,
    grid,
    h("h2", { class: "section-title" }, "📈 Mening natijalarim"),
    sessions.length ? historyTable(sessions) : emptyState("🎙️", "Hali mashg'ulot o'tkazilmagan", "Yuqoridagi ssenariylardan birini tanlang.")
  );
}

function historyTable(sessions) {
  return h(
    "div",
    { class: "card table-wrap" },
    sparkline(sessions.slice().reverse().map((s) => s.total)),
    h(
      "table",
      { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Sana"), h("th", {}, "Ssenariy"), h("th", {}, "Ball"), h("th", {}, "Maslahatlar"), h("th", {}, ""))),
      h(
        "tbody",
        {},
        sessions.map((s) =>
          h("tr", {}, h("td", {}, fmtDate(s.createdAt)), h("td", {}, s.scenarioTitle), h("td", {}, h("b", { class: scoreClass(s.total) }, s.total)), h("td", {}, s.hintsUsed), h("td", {}, h("button", { class: "btn small ghost", onclick: () => showSession(s) }, "Ko'rish")))
        )
      )
    )
  );
}

export function scoreClass(total) {
  return total >= 80 ? "score-high" : total >= 60 ? "score-mid" : "score-low";
}

function sparkline(values) {
  if (values.length < 2) return null;
  const W = 600, H = 80, max = 100;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (W - 20) + 10},${H - 10 - (v / max) * (H - 20)}`).join(" ");
  const wrap = h("div", { class: "sparkline" });
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ballar dinamikasi"><polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${values.map((v, i) => `<circle cx="${(i / (values.length - 1)) * (W - 20) + 10}" cy="${H - 10 - (v / max) * (H - 20)}" r="4" fill="var(--primary)"><title>${v}</title></circle>`).join("")}</svg>`;
  return h("div", {}, h("div", { class: "small muted" }, "Ballar dinamikasi (eskidan yangiga)"), wrap);
}

export function showSession(s) {
  modal(`${s.scenarioTitle} — ${s.total}/100`, h("div", { class: "stack" }, evaluationView(s, cache?.criteria), h("h3", {}, "Suhbat yozuvi"), transcriptView(s)), { wide: true });
}

export function transcriptView(s) {
  return h(
    "div",
    { class: "chat chat-static" },
    h("div", { class: "msg bot" }, s.opening),
    s.messages.map((m) => h("div", { class: `msg ${m.role === "user" ? "me" : "bot"}` }, m.content))
  );
}

const DEFAULT_CRITERIA = [
  { key: "communication", title: "Muloqot madaniyati va nutq", max: 20 },
  { key: "knowledge", title: "Kasbiy bilim va faktlar aniqligi", max: 20 },
  { key: "problem", title: "Muammoni hal qilish va qaror qabul qilish", max: 20 },
  { key: "digital", title: "Raqamli vositalardan foydalanish", max: 20 },
  { key: "service", title: "Mijozga yo'naltirilganlik va kasbiy etika", max: 20 },
];

export function evaluationView(session, criteria = DEFAULT_CRITERIA) {
  const ev = session.evaluation;
  const crit = criteria || DEFAULT_CRITERIA;
  return h(
    "div",
    { class: "evaluation" },
    h(
      "div",
      { class: "eval-top" },
      h("div", { class: `score-ring ${scoreClass(session.total)}`, style: { "--pct": session.total } }, h("b", {}, session.total), h("span", {}, "/100")),
      h("div", {}, h("h3", {}, session.total >= 80 ? "A'lo natija! 🏆" : session.total >= 60 ? "Yaxshi natija 👍" : "Mashq qilishni davom eting 💪"), h("p", {}, ev.summary), ev.demo && h("span", { class: "badge badge-warn" }, "Demo-baholash"))
    ),
    ev.standard && h("div", { class: "alert alert-info" }, h("b", {}, "🎯 Kasb standarti talablariga moslik: "), ev.standard),
    h("div", { class: "criteria" }, crit.map((c) => h("div", { class: "criterion" }, h("div", { class: "row between small" }, h("span", {}, c.title), h("b", {}, `${ev.scores[c.key]}/${c.max}`)), h("div", { class: "progress" }, h("div", { class: "progress-fill", style: { width: `${(ev.scores[c.key] / c.max) * 100}%` } }))))),
    h(
      "div",
      { class: "grid cols-3" },
      listCard("💪 Kuchli tomonlar", ev.strengths, "ok"),
      listCard("🛠 Yaxshilash kerak", ev.improvements, "warn"),
      listCard("📌 Tavsiyalar", ev.recommendations, "info")
    )
  );
}

function listCard(title, items, kind) {
  return h("div", { class: `card mini ${kind}` }, h("h4", {}, title), h("ul", {}, (items || []).map((i) => h("li", {}, i))));
}

// ---------------- Mashg'ulot sahifasi ----------------

export async function renderSession(el, id) {
  mount(el, loading());
  const { scenarios: list, criteria, aiEnabled, voiceAI } = await scenarios();
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error("Ssenariy topilmadi");
  const s = { ...found, voiceAI };

  // Brifing ekrani
  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/trainer" }, "Trenajyor"), " / ", s.title),
    h(
      "div",
      { class: "card briefing" },
      h("div", { class: "briefing-scene", html: scenarioScene(s.id, true) }),
      h("div", { class: "row between wrap" }, h("div", { class: "row" }, h("span", { class: "scenario-icon xl" }, s.icon), h("div", {}, h("div", { class: "eyebrow" }, s.category), h("h1", {}, s.title))), h("span", { class: `badge ${LEVEL_CLASS[s.level]}` }, s.level)),
      h("p", { class: "muted" }, "📍 ", s.location, ` · ⏱ ${s.duration} daqiqa · 🗣 muloqot tili: ${s.language}`),
      h("h3", {}, "Sizning rolingiz"),
      h("p", {}, s.role),
      h("h3", {}, "Vaziyat"),
      h("p", {}, s.brief),
      h("h3", {}, "Maqsadlar"),
      h("ul", { class: "checklist" }, s.objectives.map((o) => h("li", {}, o))),
      s.route && [h("h3", {}, "Marshrut"), h("ol", { class: "route" }, s.route.map((r) => h("li", {}, h("b", {}, r.title), h("small", { class: "muted" }, ` — ${r.hint}`))))],
      s.functions?.length > 0 && [
        h("h3", {}, "Kasb standarti talablari (Gid tarjimon)"),
        h("ul", { class: "small" }, FUNCTIONS.filter((f) => s.functions.includes(f.code)).map((f) => h("li", {}, h("b", {}, `${f.code} ${f.title}: `), f.actions.slice(0, 4).join("; "), "."))),
        competencyChips(s.competencies),
      ],
      h("h3", {}, "Baholash mezonlari"),
      h("div", { class: "chips" }, criteria.map((c) => h("span", { class: "chip chip-soft" }, `${c.title} (${c.max})`))),
      h("div", { class: "alert alert-info" }, "Mashg'ulot davomida kutilmagan hodisalar yuz berishi mumkin. Vaqt real hisoblanadi. \"Ustoz maslahati\"dan foydalanish mumkin, ammo bu baholashda hisobga olinadi."),
      !aiEnabled && h("div", { class: "alert alert-warn" }, "Demo-rejim: personaj javoblari oldindan yozilgan."),
      (voiceSupport.tts || voiceSupport.stt) && h("div", { class: "alert alert-info voice-tip" }, h("b", {}, "🎙 Ovozli rejim: "), "personaj javoblarini ovoz chiqarib o'qiydi, siz esa mikrofon orqali gapirib javob berasiz — xuddi real vaziyatdagidek. Eng tabiiy o'zbekcha ovoz va nutqni tanish uchun Google Chrome yoki Microsoft Edge brauzeridan foydalaning."),
      h("div", { class: "row wrap" },
        h("button", { class: "btn lg", onclick: () => startSession(el, s, criteria, false) }, "▶ Mashg'ulotni boshlash"),
        (voiceSupport.tts || voiceSupport.stt) && h("button", { class: "btn lg ghost voice-start", onclick: () => startSession(el, s, criteria, true) }, "🎙 Ovozli rejimda boshlash"))
    )
  );
}

function startSession(el, s, criteria, voiceOn = false) {
  const history = []; // {role, content} — server uchun
  let hintsUsed = 0;
  let busy = false;
  let finished = false;
  let stop = 0;
  const firedTwists = new Set();
  const started = Date.now();

  const chat = h("div", { class: "chat", "aria-live": "polite" });
  const input = h("textarea", { rows: 2, placeholder: "Gid sifatida javobingizni yozing... (Enter — yuborish, Shift+Enter — yangi qator)", maxlength: 2000 });
  const sendBtn = h("button", { class: "btn", onclick: () => send() }, "Yuborish ➤");
  const timer = h("span", { class: "timer" }, "00:00");
  const turnInfo = h("span", { class: "muted small" }, "0 ta javob");
  const stopsBox = h("div");
  const pendingEvents = [];

  // ---------- Ovozli rejim ----------
  const voice = voiceSupport.tts || voiceSupport.stt ? createVoice(s, { onState: drawVoice }) : null;
  let voiceMode = Boolean(voice && voiceOn);
  let voiceUsed = false;
  let lastNotice = "";
  const orb = h("div", { class: "vo-orb", "aria-hidden": "true" }, h("i", { class: "r1" }), h("i", { class: "r2" }), h("i", { class: "r3" }), h("span", { class: "vo-face" }, s.icon));
  const vStatus = h("div", { class: "vo-status", role: "status" }, "Ovozli rejim yoqildi");
  const vHint = h("div", { class: "vo-hint muted small" });
  const micBig = h("button", { class: "vo-mic", "aria-label": "Gapirish", onclick: () => toggleListen() }, h("span", {}, "🎙"));
  const engineSel = h(
    "select",
    { "aria-label": "Ovoz manbai", onchange: () => voice.setEngine(engineSel.value) },
    h("option", { value: "auto" }, s.voiceAI ? "🔊 AI ovozi (o'zbekcha)" : "Ovoz: avtomatik"),
    h("option", { value: "browser" }, "Brauzer ovozi")
  );
  const rateSel = h("select", { "aria-label": "Nutq tezligi", onchange: () => voice.setRate(Number(rateSel.value)) }, [0.85, 1, 1.15, 1.3].map((r) => h("option", { value: r }, `Tezlik ×${String(r).replace(".", ",")}`)));
  const autoChk = h("input", { type: "checkbox", onchange: () => voice.setAutoListen(autoChk.checked) });
  if (voice) {
    engineSel.value = voice.state.engine === "browser" ? "browser" : "auto";
    rateSel.value = String(voice.state.rate);
    autoChk.checked = voice.state.autoListen;
  }
  const voiceStage = h(
    "div",
    { class: "voice-stage" },
    orb,
    h("div", { class: "vo-main" }, vStatus, vHint, h("div", { class: "vo-controls" }, micBig, h("div", { class: "vo-settings" }, engineSel, rateSel, h("label", { class: "vo-check" }, autoChk, " Javobdan keyin avtomatik tinglash"))))
  );
  const voiceToggle = h("button", { class: "btn small ghost voice-toggle", "aria-pressed": "false", onclick: () => setVoiceMode(!voiceMode) }, "🎙 Ovozli rejim");

  function drawVoice(st) {
    voiceStage.classList.toggle("speaking", Boolean(st.speaking));
    voiceStage.classList.toggle("listening", Boolean(st.listening));
    voiceStage.style.setProperty("--lvl", (st.level || 0).toFixed(3));
    micBtn.classList.toggle("rec", Boolean(st.listening));
    micBtn.style.setProperty("--lvl", (st.level || 0).toFixed(3));
    micBig.classList.toggle("rec", Boolean(st.listening));
    if (st.speaking) vStatus.textContent = `🔊 ${st.speaker || "Turist"} gapirmoqda… (to'xtatib gapirish uchun mikrofonni bosing)`;
    else if (st.listening) vStatus.textContent = "🎧 Sizni tinglayapman… gapiring";
    else if (busy) vStatus.textContent = "💭 Javob tayyorlanmoqda…";
    else if (!finished) vStatus.textContent = "Gapirish uchun mikrofon tugmasini bosing";
    if (st.notice && st.notice !== lastNotice) {
      lastNotice = st.notice;
      toast(st.notice, "warn");
    }
  }

  async function setVoiceMode(on) {
    voiceMode = on && Boolean(voice);
    voiceToggle.setAttribute("aria-pressed", String(voiceMode));
    voiceToggle.classList.toggle("on", voiceMode);
    voiceStage.classList.toggle("open", voiceMode);
    if (!voiceMode) return voice?.stop();
    const info = await voice.info();
    vHint.textContent =
      s.voiceAI && voice.state.engine !== "browser"
        ? "🔊 AI ovozi (Gemini) — personajlar o'zbek tilida, har biri o'z ovozi bilan gapiradi."
        : info.mode === "native"
          ? `Brauzer ovozi: ${info.voice || "standart"}`
          : "Brauzerda o'zbekcha ovoz yo'q — tabiiy o'zbekcha ovoz uchun administrator GEMINI_API_KEY ni sozlashi kerak.";
    const lastBot = [...chat.querySelectorAll(".msg.bot .msg-text")].at(-1);
    if (lastBot && !busy) speakThenListen(lastBot.textContent);
  }

  async function speakThenListen(text, thenListen = true) {
    if (!voice) return;
    await voice.speak(text);
    if (thenListen && voiceMode && voice.state.autoListen && !finished && !busy) listenNow();
  }

  async function listenNow() {
    if (!voice || finished || busy) return;
    const before = input.value;
    try {
      const text = await voice.listen({ onText: (t) => (input.value = t) });
      if (text) {
        input.value = text;
        if (voiceMode) send();
      } else input.value = before;
    } catch (err) {
      input.value = before;
      toast(err.message, "error");
    }
  }

  function toggleListen() {
    if (!voice) return;
    if (voice.state.listening) return voice.stopListening();
    voice.cancelSpeech();
    listenNow();
  }

  const micBtn = h("button", { class: "btn ghost mic-btn", title: "Ovoz bilan yozish", "aria-label": "Ovoz bilan yozish", disabled: !voice || !voiceSupport.stt, onclick: () => toggleListen() }, "🎙");

  const addMsg = (cls, text, label) => {
    const say = cls.startsWith("bot") && voice && h("button", { class: "msg-say", title: "Ovoz chiqarib o'qish", "aria-label": "Ovoz chiqarib o'qish", onclick: () => speakThenListen(m.querySelector(".msg-text").textContent, false) }, "🔊");
    const m = h("div", { class: `msg ${cls}` }, label && h("div", { class: "msg-label" }, label, say), h("div", { class: "msg-text" }, text));
    chat.append(m);
    chat.scrollTop = chat.scrollHeight;
    return m.querySelector(".msg-text");
  };

  const tick = setInterval(() => {
    const sec = Math.floor((Date.now() - started) / 1000);
    timer.textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
    timer.classList.toggle("over", sec > s.duration * 60);
  }, 1000);
  window.addEventListener("hashchange", () => (clearInterval(tick), voice?.destroy()), { once: true });

  const drawStops = () => {
    if (!s.route) return;
    stopsBox.replaceChildren(
      h("h4", {}, "🗺 Marshrut"),
      h("ol", { class: "route compact" }, s.route.map((r, i) => h("li", { class: i < stop ? "passed" : i === stop ? "current" : "" }, r.title))),
      stop < s.route.length - 1
        ? h("button", { class: "btn small ghost block", onclick: () => {
            stop++;
            drawStops();
            pendingEvents.push(`[Bekat: guruh "${s.route[stop].title}" yoniga keldi]`);
            addMsg("event", `📍 Guruh keyingi bekatga keldi: ${s.route[stop].title}`);
          } }, "Keyingi bekatga o'tish →")
        : h("p", { class: "small muted" }, "Oxirgi bekat")
    );
  };
  drawStops();

  async function send() {
    const text = input.value.trim();
    if (!text || busy || finished) return;
    let spoken = "";
    voice?.stop();
    if (voiceMode) voiceUsed = true;
    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    addMsg("me", text, "Siz (gid)");

    // Kutilmagan hodisalar: belgilangan javobdan keyin rejissyor ko'rsatmasi sifatida qo'shiladi.
    const turn = history.filter((m) => m.role === "user").length + 1;
    const twist = s.twists?.find((t) => t.afterTurn === turn && !firedTwists.has(t.afterTurn));
    let content = [...pendingEvents.splice(0), text].join("\n");
    if (twist) {
      firedTwists.add(twist.afterTurn);
      content += `\n[Vaziyat: ${twist.text}]`;
      addMsg("event", `⚡ Kutilmagan hodisa: ${twist.text}`);
    }
    history.push({ role: "user", content });
    turnInfo.textContent = `${turn} ta javob`;

    const target = addMsg("bot typing", "…", "Turist");
    let reply = "";
    try {
      const res = await api.stream("trainer/chat", { scenarioId: s.id, messages: history });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      target.parentNode.classList.remove("typing");
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        target.textContent = reply.replace("[[YAKUNLANDI]]", "").replace(/\[\[XATO\]\].*/s, "");
        chat.scrollTop = chat.scrollHeight;
      }
    } catch (e) {
      reply = `[[XATO]] ${e.message}`;
    }
    if (reply.includes("[[XATO]]") || !reply.trim()) {
      // Xato bo'lsa, oxirgi xabarni tarixdan olib tashlaymiz — o'quvchi qayta yuborishi mumkin.
      history.pop();
      target.parentNode.remove();
      toast(reply.split("[[XATO]]")[1]?.trim() || "Javob olinmadi", "error");
      input.value = text;
    } else {
      const ended = reply.includes("[[YAKUNLANDI]]");
      reply = reply.replace("[[YAKUNLANDI]]", "").trim();
      target.textContent = reply;
      history.push({ role: "assistant", content: reply });
      spoken = reply;
      if (ended) {
        addMsg("event", "✅ Vaziyat yakunlandi. Endi natijani baholashingiz mumkin.");
        finishBtn.classList.add("pulse");
      }
    }
    busy = false;
    sendBtn.disabled = false;
    if (voiceMode && spoken) speakThenListen(spoken);
    else input.focus();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  const hintBox = h("div", { class: "hint-box" });
  const hintBtn = h("button", { class: "btn ghost block", onclick: async () => {
    hintBtn.disabled = true;
    try {
      const msgs = history[history.length - 1]?.role === "user" ? history.slice(0, -1) : history;
      const { hint } = await api.post("trainer/hint", { scenarioId: s.id, messages: msgs });
      hintsUsed++;
      hintBox.prepend(h("div", { class: "alert alert-info small" }, "🧑‍🏫 ", hint));
    } catch (e) {
      toast(e.message, "error");
    }
    hintBtn.disabled = false;
  } }, "🧑‍🏫 Ustoz maslahati");

  const finishBtn = h("button", { class: "btn block", onclick: async () => {
    if (busy) return;
    if (history.filter((m) => m.role === "user").length < 2) return toast("Baholash uchun kamida 2 ta javob yozing", "warn");
    finished = true;
    voice?.stop();
    clearInterval(tick);
    finishBtn.disabled = true;
    input.disabled = true;
    sendBtn.disabled = true;
    const status = addMsg("event", "⏳ AI ekspert mashg'ulotni tahlil qilmoqda...");
    try {
      const msgs = history[history.length - 1]?.role === "user" ? history.slice(0, -1) : history;
      const session = await api.post("trainer/evaluate", { scenarioId: s.id, messages: msgs, hintsUsed, voice: voiceUsed, durationSec: Math.round((Date.now() - started) / 1000) });
      status.textContent = "✅ Baholash tayyor.";
      showResult(el, s, session, criteria);
    } catch (e) {
      toast(e.message, "error");
      status.textContent = `⚠️ ${e.message}`;
      finished = false;
      finishBtn.disabled = false;
      input.disabled = false;
      sendBtn.disabled = false;
    }
  } }, "🏁 Yakunlash va baholash");

  mount(
    el,
    h("div", { class: "row between session-head" }, h("div", {}, h("div", { class: "eyebrow" }, s.category), h("h2", {}, s.icon, " ", s.title)), h("div", { class: "row" }, voice && voiceToggle, timer, turnInfo)),
    voice && voiceStage,
    h(
      "div",
      { class: "session-layout" },
      h("div", { class: "card chat-card" }, chat, h("div", { class: "composer" }, input, voice && micBtn, sendBtn)),
      h(
        "aside",
        { class: "stack session-side" },
        h("div", { class: "card" }, h("h4", {}, "🎯 Maqsadlar"), h("ul", { class: "checklist small" }, s.objectives.map((o) => h("li", {}, o)))),
        s.route && h("div", { class: "card" }, stopsBox),
        h("div", { class: "card stack" }, hintBtn, hintBox),
        finishBtn,
        h("a", { href: "#/trainer", class: "btn ghost block", onclick: (e) => {
          if (history.length && !finished && !confirm("Mashg'ulot saqlanmaydi. Chiqasizmi?")) e.preventDefault();
        } }, "Chiqish")
      )
    )
  );
  window.scrollTo({ top: 0, behavior: "instant" });
  addMsg("event", `🎬 Mashg'ulot boshlandi. ${s.role}`);
  addMsg("bot", s.opening, "Turist");
  if (voiceMode) setVoiceMode(true);
  else input.focus();
}

function showResult(el, s, session, criteria) {
  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/trainer" }, "Trenajyor"), " / ", s.title, " / Natija"),
    h("h1", {}, "Mashg'ulot natijasi"),
    h("div", { class: "card" }, evaluationView(session, criteria)),
    h(
      "div",
      { class: "row wrap" },
      h("button", { class: "btn", onclick: () => renderSession(el, s.id) }, "🔁 Qayta o'ynash"),
      h("a", { href: "#/trainer", class: "btn ghost" }, "Boshqa ssenariy"),
      h("a", { href: "#/self-study", class: "btn ghost" }, "📓 Kundalikka refleksiya yozish"),
      h("a", { href: "#/surveys/trainer-usability", class: "btn ghost" }, "📝 Trenajyorni baholash")
    ),
    h("details", { class: "card" }, h("summary", {}, "Suhbat yozuvini ko'rish"), transcriptView(session))
  );
}
