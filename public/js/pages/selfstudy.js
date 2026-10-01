import { h, mount, toast, modal, fmtDate, progressBar, loading } from "../ui.js";
import { api } from "../api.js";
import { TOPICS } from "../../data/topics.js";
import { loadProgress, updatePlan, setNote, topicCompletion } from "../progress.js";

const JOURNAL_KEY = "__journal";

export async function render(el) {
  mount(el, loading());
  const [progress, submissions, sessions] = await Promise.all([loadProgress(), api.get("self-study"), api.get("trainer/sessions").catch(() => [])]);
  const subs = Object.fromEntries(submissions.map((s) => [s.taskId, s]));
  const allTasks = TOPICS.flatMap((t) => t.selfStudy.map((s) => ({ ...s, topic: t })));

  const completedTopics = TOPICS.filter((t) => topicCompletion(t) === 100).length;
  const quizScores = TOPICS.map((t) => progress.topics[t.id]?.quiz).filter((x) => x !== null && x !== undefined);
  const avgQuiz = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;
  const graded = submissions.filter((s) => s.grade != null);
  const avgGrade = graded.length ? (graded.reduce((a, b) => a + b.grade, 0) / graded.length).toFixed(1) : null;
  const bestTrainer = sessions.length ? Math.max(...sessions.map((s) => s.total)) : null;

  const refresh = () => (location.hash === "#/self-study" ? render(el) : (location.hash = "#/self-study"));
  const stats = h(
    "div",
    { class: "grid cols-4" },
    statCard("📚", `${completedTopics}/${TOPICS.length}`, "mavzu to'liq o'zlashtirildi"),
    statCard("✅", avgQuiz !== null ? `${avgQuiz}%` : "—", "testlar o'rtacha natijasi"),
    statCard("🧩", `${submissions.length}/${allTasks.length}`, `mustaqil ish topshirildi${avgGrade ? ` · o'rtacha baho ${avgGrade}` : ""}`),
    statCard("🎙️", sessions.length, `trenajyor mashg'uloti${bestTrainer !== null ? ` · eng yuqori ${bestTrainer} ball` : ""}`)
  );

  // Tavsiyalar: keyingi tugallanmagan mavzu va eng past test natijasi
  const nextTopic = TOPICS.find((t) => topicCompletion(t) < 100);
  const weakest = TOPICS.filter((t) => progress.topics[t.id]?.quiz != null).sort((a, b) => progress.topics[a.id].quiz - progress.topics[b.id].quiz)[0];
  const recs = [];
  if (nextTopic) recs.push(h("li", {}, "Davom eting: ", h("a", { href: `#/topics/${nextTopic.id}` }, `${nextTopic.num}. ${nextTopic.title}`), ` (${topicCompletion(nextTopic)}%)`));
  if (weakest && progress.topics[weakest.id].quiz < 80) recs.push(h("li", {}, "Takrorlang: ", h("a", { href: `#/topics/${weakest.id}?tab=quiz` }, weakest.title), ` — test natijasi ${progress.topics[weakest.id].quiz}%`));
  const unsent = allTasks.find((t) => !subs[t.id]);
  if (unsent) recs.push(h("li", {}, "Mustaqil ish: ", h("b", {}, unsent.title)));
  if (!sessions.length) recs.push(h("li", {}, h("a", { href: "#/trainer" }, "Virtual gidlik trenajyorida"), " birinchi mashg'ulotni bajaring."));

  mount(
    el,
    h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "Mustaqil ta'lim"), h("p", { class: "muted" }, "O'quv rejangizni tuzing, topshiriqlarni bajaring va o'z rivojlanishingizni kuzating."))),
    stats,
    recs.length > 0 && h("div", { class: "card accent" }, h("h3", {}, "🎯 Siz uchun tavsiyalar"), h("ul", {}, recs)),
    h("div", { class: "grid cols-2" }, planner(progress), journal(progress)),
    tasksSection(allTasks, subs, refresh)
  );

  const want = new URLSearchParams(location.hash.split("?")[1] || "").get("task");
  const task = allTasks.find((t) => t.id === want);
  if (task) openSubmit(task, subs[task.id], refresh);
}

function statCard(icon, value, label) {
  return h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, icon), h("b", {}, value), h("span", { class: "muted small" }, label));
}

function planner(progress) {
  const list = h("ul", { class: "plan-list" });
  const today = new Date().toISOString().slice(0, 10);
  const draw = () => {
    const items = [...progress.plan].sort((a, b) => Number(a.done) - Number(b.done) || (a.due || "9").localeCompare(b.due || "9"));
    list.replaceChildren(
      ...items.map((item) =>
        h(
          "li",
          { class: `plan-item ${item.done ? "done" : ""} ${!item.done && item.due && item.due < today ? "overdue" : ""}` },
          h("input", { type: "checkbox", checked: item.done, "aria-label": "Bajarildi", onchange: (e) => (updatePlan(() => (item.done = e.target.checked)), draw()) }),
          h("div", { class: "grow" }, h("div", {}, item.title), h("small", { class: "muted" }, item.due ? `Muddat: ${new Date(item.due).toLocaleDateString("uz-UZ")}` : "Muddatsiz")),
          h("button", { class: "icon-btn", "aria-label": "O'chirish", onclick: () => (updatePlan((p) => p.splice(p.indexOf(item), 1)), draw()) }, "✕")
        )
      )
    );
    if (!items.length) list.append(h("li", { class: "muted small" }, "Reja bo'sh. Mavzu yoki vazifa qo'shing."));
  };
  draw();
  const sel = h("select", {}, h("option", { value: "" }, "— Mavzuni tanlang yoki o'z vazifangizni yozing —"), TOPICS.map((t) => h("option", { value: `${t.num}-mavzu: ${t.title}` }, `${t.num}. ${t.title}`)));
  const custom = h("input", { type: "text", placeholder: "O'z vazifangiz (ixtiyoriy)", maxlength: 200 });
  const due = h("input", { type: "date", min: today });
  return h(
    "div",
    { class: "card" },
    h("h2", {}, "🗓️ Shaxsiy o'quv rejam"),
    h("div", { class: "stack" }, sel, custom, h("div", { class: "row" }, due, h("button", { class: "btn", onclick: () => {
      const title = custom.value.trim() || sel.value;
      if (!title) return toast("Mavzu tanlang yoki vazifa yozing", "warn");
      updatePlan((p) => p.push({ id: crypto.randomUUID(), title, due: due.value || null, done: false }));
      custom.value = "";
      sel.value = "";
      due.value = "";
      draw();
    } }, "Rejaga qo'shish"))),
    list
  );
}

function journal(progress) {
  const entries = Array.isArray(progress.notes[JOURNAL_KEY]) ? progress.notes[JOURNAL_KEY] : [];
  const list = h("div", { class: "journal" });
  const draw = () =>
    list.replaceChildren(...entries.slice().reverse().map((e) => h("div", { class: "journal-entry" }, h("small", { class: "muted" }, fmtDate(e.at)), h("p", {}, e.text))));
  draw();
  const ta = h("textarea", { rows: 3, placeholder: "Bugun nimani o'rgandim? Nima qiyin bo'ldi? Keyingi qadamim..." });
  return h(
    "div",
    { class: "card" },
    h("h2", {}, "📓 Refleksiv kundalik"),
    h("p", { class: "muted small" }, "Har bir dars yoki trenajyor mashg'ulotidan so'ng qisqa refleksiya yozing."),
    ta,
    h("button", { class: "btn", onclick: () => {
      const text = ta.value.trim();
      if (text.length < 5) return;
      entries.push({ at: new Date().toISOString(), text });
      setNote(JOURNAL_KEY, entries);
      ta.value = "";
      draw();
      toast("Kundalikka yozildi", "ok");
    } }, "Yozish"),
    list
  );
}

function statusOf(sub) {
  if (!sub) return h("span", { class: "badge" }, "Topshirilmagan");
  if (sub.grade == null || sub.resubmitted) return h("span", { class: "badge badge-warn" }, "Tekshirilmoqda");
  return h("span", { class: `badge ${sub.grade >= 4 ? "badge-ok" : "badge-warn"}` }, `Baho: ${sub.grade}`);
}

function tasksSection(allTasks, subs, refresh) {
  const container = h("div", { class: "stack" });
  for (const topic of TOPICS) {
    container.append(
      h(
        "div",
        { class: "card" },
        h("h3", {}, `${topic.icon} ${topic.num}. ${topic.title}`),
        h(
          "div",
          { class: "task-list" },
          allTasks
            .filter((t) => t.topic.id === topic.id)
            .map((t) => {
              const sub = subs[t.id];
              return h(
                "div",
                { class: "task" },
                h("div", { class: "grow" }, h("div", { class: "row wrap" }, h("b", {}, t.title), h("span", { class: "chip chip-soft" }, t.type), statusOf(sub)), h("p", { class: "small" }, t.description), sub?.feedback && h("div", { class: "alert alert-info small" }, h("b", {}, "O'qituvchi izohi: "), sub.feedback)),
                h("button", { class: `btn small ${sub ? "ghost" : ""}`, onclick: () => openSubmit(t, sub, refresh) }, sub ? "Ko'rish / qayta topshirish" : "Topshirish")
              );
            })
        )
      )
    );
  }
  return h("section", {}, h("h2", { class: "section-title" }, "🧩 Mustaqil ish topshiriqlari"), container);
}

function openSubmit(task, sub, onDone) {
  const text = h("textarea", { rows: 8, placeholder: "Javobingiz, xulosalaringiz..." }, sub?.text || "");
  const link = h("input", { type: "url", placeholder: "https://... (Google Drive, YouTube, Canva, My Maps havolasi)", value: sub?.link || "" });
  let close;
  close = modal(
    task.title,
    h(
      "div",
      { class: "stack" },
      h("p", { class: "muted" }, `${task.topic.num}-mavzu: ${task.topic.title}`),
      h("p", {}, task.description),
      sub && h("p", { class: "small muted" }, `Oxirgi topshirilgan: ${fmtDate(sub.submittedAt)}`),
      h("label", { class: "field" }, h("span", {}, "Javob matni"), text),
      h("label", { class: "field" }, h("span", {}, "Fayl yoki loyiha havolasi"), link),
      h("p", { class: "small muted" }, "Fayllarni (taqdimot, video, rasm) Google Drive yoki boshqa xizmatga yuklab, ochiq havolasini qo'shing."),
      h("div", { class: "row end" }, h("button", { class: "btn", onclick: async (e) => {
        e.target.disabled = true;
        try {
          await api.post(`self-study/${task.id}`, { text: text.value, link: link.value, taskTitle: task.title, topicTitle: task.topic.title });
          toast("Topshiriq yuborildi!", "ok");
          close();
          onDone();
        } catch (ex) {
          toast(ex.message, "error");
          e.target.disabled = false;
        }
      } }, sub ? "Qayta yuborish" : "Yuborish"))
    ),
    { wide: true }
  );
}
