// O'qituvchi (admin) paneli: umumiy ko'rsatkichlar, so'rovnoma natijalari, tajriba-sinov tahlili,
// so'rovnoma konstruktori, o'quvchilar va tadqiqot guruhlari, trenajyor natijalari, mustaqil ishlarni baholash.
import { h, mount, toast, loading, fmtDate, modal, confirmDialog, emptyState, downloadFile } from "../ui.js";
import { api } from "../api.js";
import { mean, sd, fmt, scoreResponse, overallScale, levelNames, welchT, pairedT, chiSquare, significance, toCSV } from "../stats.js";
import { LIKERT_LABELS } from "./surveys.js";
import { showSession, scoreClass } from "./trainer.js";
import { resultSheet } from "./diagnostics.js";
import { projectSummary, gradeCard } from "./route-lab.js";
import { mapFromEvidence, competencyTable } from "../competency.js";
import { TOPICS } from "../../data/topics.js";
import { slideViewer, uploadSlides, fmtSize } from "../slides.js";
import { allVideos, videoCard, uploadVideo, invalidateVideos } from "../media.js";

const COHORTS = { experimental: "Tajriba (TG)", control: "Nazorat (NG)", unassigned: "Belgilanmagan" };
const TYPE_NAMES = { likert: "Likert (1–5)", single: "Bitta variant", multi: "Bir nechta variant", text: "Erkin javob", scale: "Shkala (0–10)", test: "Test (to'g'ri javobli)" };

const TABS = [
  ["", "📊 Umumiy"],
  ["diagnostics", "🧪 Kompleks diagnostika"],
  ["routes", "🗺 Marshrut loyihalari"],
  ["competencies", "🎯 Kompetensiyalar"],
  ["results", "📈 So'rovnoma natijalari"],
  ["experiment", "📐 So'rovnomalar tahlili"],
  ["builder", "🛠 So'rovnoma konstruktori"],
  ["slides", "🖥️ Taqdimotlar"],
  ["videos", "📹 Video darslar"],
  ["students", "👥 O'quvchilar"],
  ["trainer", "🎙 Trenajyor natijalari"],
  ["self-study", "🧩 Mustaqil ishlar"],
];

export async function render(el, tab = "", param) {
  const content = h("div");
  mount(
    el,
    h("div", { class: "page-head" }, h("h1", {}, "O'qituvchi paneli")),
    h("nav", { class: "tabs" }, TABS.map(([key, label]) => h("a", { href: `#/teacher${key ? "/" + key : ""}`, class: (tab || "") === key ? "active" : "" }, label))),
    content
  );
  mount(content, loading());
  const views = { "": overview, diagnostics, routes: routeProjects, competencies: competencyOverview, results, experiment, builder, slides: slidesManager, videos: videosManager, students, trainer, "self-study": selfStudy };
  const view = views[tab || ""];
  if (!view) throw new Error("Bo'lim topilmadi");
  await view(content, param);
}

// ---------------- Umumiy ----------------

async function overview(el) {
  const [o, surveys] = await Promise.all([api.get("admin/overview"), api.get("admin/surveys")]);
  const card = (icon, value, label, href) => h(href ? "a" : "div", { class: "card stat-card", href }, h("div", { class: "stat-icon" }, icon), h("b", {}, value), h("span", { class: "muted small" }, label));
  mount(
    el,
    !o.aiEnabled && h("div", { class: "alert alert-warn" }, "⚠️ AI kaliti ulanmagan: trenajyor demo-rejimda. Netlify sozlamalarida GEMINI_API_KEY (bepul) yoki ANTHROPIC_API_KEY o'zgaruvchisini qo'shing."),
    h(
      "div",
      { class: "grid cols-4" },
      card("🎓", o.students, `o'quvchi (TG: ${o.cohorts.experimental}, NG: ${o.cohorts.control})`, "#/teacher/students"),
      card("🧪", o.diag.complete, `to'liq diagnostika varaqasi · ${o.diag.toGrade} tasi baholashni kutmoqda · faol bosqich: ${o.diag.activeStage || "yo'q"}`, "#/teacher/diagnostics"),
      card("🗺", o.routes.submitted, `marshrut loyihasi baholashni kutmoqda · ${o.routes.graded} tasi baholangan`, "#/teacher/routes"),
      card("📝", o.responses, `so'rovnoma javobi (${o.surveys} ta so'rovnoma)`, "#/teacher/results"),
      card("🎙", o.trainerSessions, `trenajyor mashg'uloti${o.avgTrainerScore !== null ? ` · o'rtacha ${o.avgTrainerScore} ball` : ""}`, "#/teacher/trainer"),
      card("🧩", o.selfStudySubmissions, `mustaqil ish · ${o.ungraded} tasi baholanmagan`, "#/teacher/self-study")
    ),
    o.cohorts.experimental + o.cohorts.control === 0 &&
      h("div", { class: "alert alert-info" }, "💡 Tajriba-sinov tahlili uchun ", h("a", { href: "#/teacher/students" }, "O'quvchilar"), " bo'limida o'quvchilarni Tajriba (TG) va Nazorat (NG) guruhlariga ajrating."),
    h(
      "div",
      { class: "card table-wrap" },
      h("h3", {}, "So'rovnomalar"),
      h(
        "table",
        { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Nomi"), h("th", {}, "Bosqich"), h("th", {}, "Kim uchun"), h("th", {}, "Holat"), h("th", {}, "Javoblar"), h("th", {}))),
        h("tbody", {}, surveys.map((s) => h("tr", {}, h("td", {}, s.title), h("td", {}, stageName(s.stage)), h("td", {}, audienceName(s.audience)), h("td", {}, s.active ? h("span", { class: "badge badge-ok" }, "Faol") : h("span", { class: "badge" }, "Nofaol")), h("td", {}, h("b", {}, s.responseCount)), h("td", {}, h("a", { href: `#/teacher/results/${s.id}`, class: "btn small ghost" }, "Natijalar")))))
      )
    )
  );
}

const stageName = (s) => ({ pre: "Diagnostik", post: "Yakuniy", any: "Umumiy" })[s] || s;
const audienceName = (a) => ({ student: "O'quvchilar", teacher: "O'qituvchilar", all: "Barcha" })[a] || a;

// ---------------- Taqdimotlar ----------------

async function slidesManager(el) {
  const { slides } = await api.get("slides");
  const byTopic = Object.fromEntries(slides.map((x) => [x.topicId, x]));
  const kindLabel = { pdf: "PDF", pptx: "PowerPoint", link: "Havola" };

  const preview = (meta) => {
    const v = slideViewer(meta);
    const close = modal(meta.title, v, { wide: true });
    const obs = new MutationObserver(() => {
      if (!v.isConnected) {
        v.destroy?.();
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true });
    return close;
  };

  const row = (t) => {
    const status = h("div", { class: "sm-status" });
    const bar = h("div", { class: "sm-upload hidden" }, h("div", { class: "sm-upload-fill" }), h("span", {}, "0%"));
    const fileInput = h("input", { type: "file", accept: ".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation", class: "hidden", onchange: () => fileInput.files[0] && upload(fileInput.files[0]) });

    const drawStatus = () => {
      const m = byTopic[t.id];
      status.replaceChildren(
        m
          ? h("div", {}, h("span", { class: "badge badge-ok" }, kindLabel[m.kind]), " ", h("b", {}, m.title), h("div", { class: "muted small" }, [m.kind === "link" ? m.url : `${m.name} · ${fmtSize(m.size)}${m.pages ? ` · ${m.pages} slayd` : ""}`, ` · ${fmtDate(m.uploadedAt)}`]))
          : h("span", { class: "muted small" }, "Taqdimot joylanmagan")
      );
      actions.querySelector(".sm-view").disabled = !m;
      actions.querySelector(".sm-del").disabled = !m;
    };

    async function upload(file) {
      if (!/\.(pdf|pptx)$/i.test(file.name)) return toast("Faqat .pdf yoki .pptx fayl yuklang", "error");
      bar.classList.remove("hidden");
      card.classList.add("uploading");
      const setP = (f) => {
        bar.firstChild.style.transform = `scaleX(${f})`;
        bar.lastChild.textContent = `${Math.round(f * 100)}%`;
      };
      setP(0);
      try {
        byTopic[t.id] = await uploadSlides(t.id, file, { onProgress: setP });
        toast(`${t.num}-mavzu: taqdimot joylandi`, "ok");
        drawStatus();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        card.classList.remove("uploading");
        setTimeout(() => bar.classList.add("hidden"), 600);
        fileInput.value = "";
      }
    }

    const linkForm = () => {
      const url = h("input", { type: "url", placeholder: "https://docs.google.com/presentation/d/...", required: true, value: byTopic[t.id]?.kind === "link" ? byTopic[t.id].url : "" });
      const title = h("input", { placeholder: "Taqdimot nomi", value: byTopic[t.id]?.title || t.title });
      const close = modal(
        `${t.num}-mavzu: havola orqali joylash`,
        h(
          "form",
          { onsubmit: async (e) => {
            e.preventDefault();
            try {
              byTopic[t.id] = await api.put(`admin/slides/${t.id}/link`, { url: url.value.trim(), title: title.value.trim() });
              toast("Taqdimot havolasi saqlandi", "ok");
              drawStatus();
              close();
            } catch (err) {
              toast(err.message, "error");
            }
          } },
          h("p", { class: "muted small" }, "Google Slides (Fayl → Ulashish → Internetda e'lon qilish), Canva (Ulashish → Ko'rish havolasi), OneDrive / PowerPoint Online (Joylashtirish havolasi) havolalarini qo'yishingiz mumkin. Havola hamma uchun ochiq bo'lishi kerak."),
          h("label", { class: "field" }, h("span", {}, "Havola"), url),
          h("label", { class: "field" }, h("span", {}, "Nomi"), title),
          h("div", { class: "row end" }, h("button", { class: "btn", type: "submit" }, "Saqlash"))
        )
      );
    };

    const actions = h(
      "div",
      { class: "row wrap sm-actions" },
      h("button", { class: "btn small", onclick: () => fileInput.click() }, "📤 Fayl yuklash"),
      h("button", { class: "btn small ghost", onclick: linkForm }, "🔗 Havola"),
      h("button", { class: "btn small ghost sm-view", onclick: () => preview(byTopic[t.id]) }, "👁 Ko'rish"),
      h("button", { class: "btn small ghost danger-text sm-del", onclick: async () => {
        if (!(await confirmDialog(`${t.num}-mavzu taqdimotini o'chirasizmi?`))) return;
        try {
          await api.del(`admin/slides/${t.id}`);
          delete byTopic[t.id];
          drawStatus();
          toast("Taqdimot o'chirildi", "ok");
        } catch (err) {
          toast(err.message, "error");
        }
      } }, "🗑")
    );

    const card = h(
      "div",
      {
        class: "card sm-row",
        ondragover: (e) => {
          e.preventDefault();
          card.classList.add("drag");
        },
        ondragleave: () => card.classList.remove("drag"),
        ondrop: (e) => {
          e.preventDefault();
          card.classList.remove("drag");
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        },
      },
      h("div", { class: "sm-thumb" }, t.image ? h("img", { src: t.image, alt: "" }) : t.icon),
      h("div", { class: "sm-main" }, h("div", { class: "eyebrow" }, `${t.num}-mavzu`), h("h3", {}, t.title), status, bar),
      actions,
      fileInput
    );
    drawStatus();
    return card;
  };

  mount(
    el,
    h(
      "div",
      { class: "alert alert-info" },
      h("b", {}, "Har bir mavzu uchun taqdimot joylang. "),
      "O'quvchi mavzuni ochganda taqdimot darsning boshida o'rnatilgan slayd ko'ruvchida chiqadi (varaqlash, to'liq ekran, avtomatik ko'rsatish). ",
      h("br"),
      "Eng yaxshi natija uchun ",
      h("b", {}, "PDF"),
      " yuklang (PowerPoint'da: Fayl → Eksport → PDF), eng ko'pi 60 MB. ",
      h("b", {}, ".pptx"),
      " fayllar (20 MB gacha) PowerPoint Online orqali ko'rsatiladi. Faylni kartaga sudrab tashlash ham mumkin."
    ),
    h("div", { class: "stack sm-list" }, TOPICS.map(row))
  );
}

// ---------------- Video darslar ----------------

async function videosManager(el) {
  const videos = await allVideos({ fresh: true });
  const byTopic = {};
  for (const v of videos) (byTopic[v.topicId] ||= []).push(v);

  const row = (t) => {
    const list = h("div", { class: "video-grid compact" });
    const bar = h("div", { class: "sm-upload hidden" }, h("div", { class: "sm-upload-fill" }), h("span", {}, "0%"));
    const drawList = () => {
      const items = byTopic[t.id] || [];
      list.replaceChildren(
        ...(items.length
          ? items.map((v) =>
              videoCard(v, h("div", { class: "row wrap vc-admin" },
                h("button", { class: "btn small ghost", onclick: async () => {
                  const title = prompt("Video nomi:", v.title);
                  if (title === null) return;
                  try {
                    Object.assign(v, await api.put(`admin/videos/${t.id}/${v.id}`, { title }));
                    invalidateVideos();
                    drawList();
                  } catch (e) {
                    toast(e.message, "error");
                  }
                } }, "✏️"),
                h("button", { class: "btn small ghost danger-text", onclick: async () => {
                  if (!(await confirmDialog(`“${v.title}” videosini o'chirasizmi?`))) return;
                  try {
                    await api.del(`admin/videos/${t.id}/${v.id}`);
                    byTopic[t.id] = byTopic[t.id].filter((x) => x.id !== v.id);
                    invalidateVideos();
                    drawList();
                    toast("Video o'chirildi", "ok");
                  } catch (e) {
                    toast(e.message, "error");
                  }
                } }, "🗑")))
            )
          : [h("p", { class: "muted small" }, "Hali video yo'q")])
      );
    };
    const fileInput = h("input", { type: "file", accept: "video/mp4,video/webm,video/ogg,.mp4,.webm,.mov", class: "hidden", onchange: async () => {
      const f = fileInput.files[0];
      if (!f) return;
      bar.classList.remove("hidden");
      const setP = (x) => {
        bar.firstChild.style.transform = `scaleX(${x})`;
        bar.lastChild.textContent = `${Math.round(x * 100)}%`;
      };
      setP(0);
      try {
        const v = await uploadVideo(t.id, f, { onProgress: setP });
        (byTopic[t.id] ||= []).push(v);
        invalidateVideos();
        drawList();
        toast(`${t.num}-mavzu: video joylandi`, "ok");
      } catch (e) {
        toast(e.message, "error");
      } finally {
        setTimeout(() => bar.classList.add("hidden"), 600);
        fileInput.value = "";
      }
    } });
    const addLink = () => {
      const url = h("input", { type: "url", required: true, placeholder: "https://www.youtube.com/watch?v=..." });
      const title = h("input", { placeholder: "Video nomi", required: true });
      const desc = h("textarea", { rows: 2, placeholder: "Qisqa izoh (ixtiyoriy)" });
      const close = modal(
        `${t.num}-mavzu: video havolasi`,
        h("form", { onsubmit: async (e) => {
          e.preventDefault();
          try {
            const v = await api.post(`admin/videos/${t.id}/link`, { url: url.value.trim(), title: title.value.trim(), description: desc.value.trim() });
            (byTopic[t.id] ||= []).push(v);
            invalidateVideos();
            drawList();
            close();
            toast("Video qo'shildi", "ok");
          } catch (err) {
            toast(err.message, "error");
          }
        } },
          h("p", { class: "muted small" }, "YouTube (oddiy, Shorts yoki youtu.be havola), Vimeo yoki to'g'ridan-to'g'ri .mp4 havolasi. YouTube videolari platformada o'rnatilgan pleyerda ochiladi."),
          h("label", { class: "field" }, h("span", {}, "Havola"), url),
          h("label", { class: "field" }, h("span", {}, "Nomi"), title),
          h("label", { class: "field" }, h("span", {}, "Izoh"), desc),
          h("div", { class: "row end" }, h("button", { class: "btn", type: "submit" }, "Qo'shish")))
      );
    };
    drawList();
    return h(
      "div",
      { class: "card vm-row" },
      h("div", { class: "row between wrap" }, h("div", {}, h("div", { class: "eyebrow" }, `${t.num}-mavzu`), h("h3", {}, t.title)), h("div", { class: "row wrap" }, h("button", { class: "btn small", onclick: addLink }, "🔗 YouTube / havola"), h("button", { class: "btn small ghost", onclick: () => fileInput.click() }, "📤 Video fayl"), fileInput)),
      bar,
      list
    );
  };

  mount(
    el,
    h("div", { class: "alert alert-info" }, h("b", {}, "Har bir mavzuga bir nechta video dars qo'shing. "), "Eng qulayi — videoni YouTube'ga joylab, havolasini qo'shish. Kichik videolarni (MP4/WebM, 80 MB gacha) to'g'ridan-to'g'ri yuklash ham mumkin: muqova rasmi va davomiylik avtomatik aniqlanadi. Videolar mavzu sahifasida va “Mediateka”da chiqadi."),
    h("div", { class: "stack" }, TOPICS.map(row))
  );
}

// ---------------- Natijalar ----------------

async function results(el, surveyId) {
  const surveys = await api.get("admin/surveys");
  if (!surveys.length) return mount(el, emptyState("📝", "So'rovnomalar yo'q"));
  const id = surveyId || surveys.find((s) => s.responseCount)?.id || surveys[0].id;
  const picker = h("select", { onchange: (e) => (location.hash = `#/teacher/results/${e.target.value}`) }, surveys.map((s) => h("option", { value: s.id, selected: s.id === id }, `${s.title} (${s.responseCount})`)));
  const body = h("div", {}, loading());
  mount(el, h("div", { class: "card row wrap" }, h("label", { class: "field grow" }, h("span", {}, "So'rovnoma"), picker)), body);

  const { survey, responses } = await api.get(`admin/surveys/${id}/results`);
  const groups = [...new Set(responses.map((r) => r.user.group).filter(Boolean))].sort();
  const filters = { cohort: "", group: "" };
  const out = h("div", { class: "stack" });
  const filterBar = h(
    "div",
    { class: "row wrap filter-bar" },
    h("label", { class: "field" }, h("span", {}, "Tadqiqot guruhi"), h("select", { onchange: (e) => ((filters.cohort = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), Object.entries(COHORTS).map(([k, v]) => h("option", { value: k }, v)))),
    h("label", { class: "field" }, h("span", {}, "O'quv guruhi"), h("select", { onchange: (e) => ((filters.group = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), groups.map((g) => h("option", { value: g }, g)))),
    h("div", { class: "grow" }),
    h("button", { class: "btn ghost", onclick: () => exportRaw(survey, filtered()) }, "⬇ Javoblar (CSV)"),
    h("button", { class: "btn ghost", onclick: () => exportSummary(survey, filtered()) }, "⬇ Statistika (CSV)")
  );
  const filtered = () => responses.filter((r) => (!filters.cohort || (r.user.cohort || "unassigned") === filters.cohort) && (!filters.group || r.user.group === filters.group));

  const draw = () => {
    const rs = filtered();
    if (!rs.length) return out.replaceChildren(emptyState("📭", "Javoblar yo'q", "Tanlangan filtr bo'yicha hali hech kim javob bermagan."));
    out.replaceChildren(summaryBlock(survey, rs), questionsBlock(survey, rs), responsesTable(survey, rs, () => results(el, id)));
  };
  mount(body, h("div", { class: "card" }, h("h2", {}, survey.title), h("p", { class: "muted small" }, `${stageName(survey.stage)} · ${audienceName(survey.audience)} · ${survey.questions.length} ta savol · jami ${responses.length} ta javob`), filterBar), out);
  draw();
}

function summaryBlock(survey, rs) {
  const scored = rs.map((r) => ({ r, s: scoreResponse(survey, r.answers) }));
  const overall = scored.map((x) => x.s.overall).filter(Number.isFinite);
  const scale = overallScale(survey);
  const levels = levelNames(survey);
  const comps = survey.scoring?.components || [];
  const cohortKeys = ["experimental", "control", "unassigned"].filter((k) => scored.some((x) => (x.r.user.cohort || "unassigned") === k));
  const hasScore = overall.length > 0;

  return h(
    "div",
    { class: "card" },
    h("h3", {}, "Umumlashtirilgan natijalar"),
    h(
      "div",
      { class: "grid cols-4" },
      miniStat("Respondentlar", rs.length),
      hasScore && miniStat(scale.label, `${fmt(mean(overall))} ± ${fmt(sd(overall))}`),
      hasScore && levels.length > 0 && miniStat("Eng ko'p uchragan daraja", modeLevel(scored.map((x) => x.s.level), levels))
    ),
    hasScore && levels.length > 0 && h("div", {}, h("h4", {}, "Darajalar bo'yicha taqsimot"), levelChart(levels, cohortKeys.map((k) => ({ name: COHORTS[k], values: levels.map((l) => scored.filter((x) => (x.r.user.cohort || "unassigned") === k && x.s.level === l).length) })))),
    (comps.length > 0 || hasScore) &&
      h(
        "div",
        { class: "table-wrap" },
        h("h4", {}, "Komponentlar bo'yicha o'rtacha ko'rsatkich (M ± SD)"),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Ko'rsatkich"), cohortKeys.map((k) => h("th", {}, `${COHORTS[k]} (n=${scored.filter((x) => (x.r.user.cohort || "unassigned") === k).length})`)), h("th", {}, `Jami (n=${rs.length})`))),
          h(
            "tbody",
            {},
            [...comps.map((c) => [c.title, (x) => x.s.components[c.key]]), ...(hasScore ? [[h("b", {}, scale.label), (x) => x.s.overall]] : [])].map(([title, get]) =>
              h("tr", {}, h("td", {}, title), [...cohortKeys.map((k) => scored.filter((x) => (x.r.user.cohort || "unassigned") === k)), scored].map((group) => {
                const v = group.map(get).filter(Number.isFinite);
                return h("td", {}, v.length ? `${fmt(mean(v))} ± ${fmt(sd(v))}` : "—");
              }))
            )
          )
        )
      )
  );
}

function modeLevel(levels, names) {
  const counts = names.map((n) => levels.filter((l) => l === n).length);
  const max = Math.max(...counts);
  return max ? `${names[counts.indexOf(max)]} (${Math.round((max / levels.length) * 100)}%)` : "—";
}

function miniStat(label, value) {
  return h("div", { class: "mini-stat" }, h("span", { class: "muted small" }, label), h("b", {}, value));
}

const PALETTE = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"];

/** Guruhlangan ustunli diagramma (foizlarda). series: [{name, values:[count per level]}] */
function levelChart(levels, series) {
  const W = 640, H = 240, pad = { l: 40, r: 10, t: 16, b: 40 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const groupW = innerW / levels.length;
  const barW = Math.min(46, (groupW - 16) / Math.max(series.length, 1));
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Darajalar bo'yicha taqsimot">`;
  for (let p = 0; p <= 100; p += 25) {
    const y = pad.t + innerH - (p / 100) * innerH;
    svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" class="grid-line"/><text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" class="axis">${p}%</text>`;
  }
  levels.forEach((lvl, i) => {
    const gx = pad.l + i * groupW + (groupW - barW * series.length) / 2;
    series.forEach((s, j) => {
      const total = s.values.reduce((a, b) => a + b, 0) || 1;
      const pct = (s.values[i] / total) * 100;
      const bh = (pct / 100) * innerH;
      const x = gx + j * barW, y = pad.t + innerH - bh;
      svg += `<rect x="${x + 2}" y="${y}" width="${barW - 4}" height="${Math.max(bh, 0.5)}" rx="4" fill="${PALETTE[j % PALETTE.length]}"><title>${s.name}: ${s.values[i]} (${pct.toFixed(1)}%)</title></rect>`;
      if (pct > 0) svg += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" class="bar-label">${Math.round(pct)}%</text>`;
    });
    svg += `<text x="${pad.l + i * groupW + groupW / 2}" y="${H - pad.b + 20}" text-anchor="middle" class="axis-x">${lvl}</text>`;
  });
  svg += "</svg>";
  const chart = h("div", { class: "chart" });
  chart.innerHTML = svg;
  return h("div", {}, chart, h("div", { class: "legend" }, series.map((s, j) => h("span", {}, h("i", { style: { background: PALETTE[j % PALETTE.length] } }), s.name))));
}

function questionsBlock(survey, rs) {
  return h(
    "details",
    { class: "card", open: true },
    h("summary", {}, h("h3", { class: "inline" }, "Savollar bo'yicha tahlil")),
    h(
      "div",
      { class: "stack" },
      survey.questions.map((q, i) => {
        const vals = rs.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== null && v !== "");
        let body;
        if (q.type === "likert" || q.type === "scale") {
          const opts = q.type === "likert" ? [1, 2, 3, 4, 5] : Array.from({ length: 11 }, (_, k) => k);
          body = [h("p", { class: "small" }, `M = ${fmt(mean(vals))}, SD = ${fmt(sd(vals))}, n = ${vals.length}`), distBars(opts.map((o) => [q.type === "likert" ? `${o} — ${LIKERT_LABELS[o - 1]}` : String(o), vals.filter((v) => v === o).length]), vals.length)];
        } else if (q.type === "single" || q.type === "test") {
          body = [
            q.type === "test" && h("p", { class: "small" }, `To'g'ri javob berganlar: ${vals.filter((v) => v === q.correct).length} / ${vals.length} (${vals.length ? Math.round((vals.filter((v) => v === q.correct).length / vals.length) * 100) : 0}%)`),
            distBars(q.options.map((o, k) => [`${q.type === "test" && k === q.correct ? "✓ " : ""}${o}`, vals.filter((v) => v === k).length]), vals.length),
          ];
        } else if (q.type === "multi") {
          body = distBars(q.options.map((o, k) => [o, vals.filter((v) => v.includes(k)).length]), vals.length);
        } else {
          body = vals.length ? h("ul", { class: "text-answers" }, vals.map((v) => h("li", {}, v))) : h("p", { class: "muted small" }, "Javoblar yo'q");
        }
        return h("div", { class: "q-analysis" }, h("h4", {}, `${i + 1}. ${q.text}`), h("span", { class: "muted small" }, TYPE_NAMES[q.type], q.component ? ` · ${(survey.scoring?.components || []).find((c) => c.key === q.component)?.title || q.component}` : ""), body);
      })
    )
  );
}

function distBars(rows, total) {
  return h(
    "div",
    { class: "dist" },
    rows.map(([label, n]) => {
      const pct = total ? (n / total) * 100 : 0;
      return h("div", { class: "dist-row" }, h("span", { class: "dist-label" }, label), h("div", { class: "dist-bar" }, h("div", { class: "dist-fill", style: { width: `${pct}%` } })), h("span", { class: "dist-val" }, `${n} (${Math.round(pct)}%)`));
    })
  );
}

function responsesTable(survey, rs, reload) {
  return h(
    "details",
    { class: "card table-wrap" },
    h("summary", {}, h("h3", { class: "inline" }, `Respondentlar ro'yxati (${rs.length})`)),
    h(
      "table",
      { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "F.I.Sh."), h("th", {}, "Guruh"), h("th", {}, "Tadqiqot guruhi"), h("th", {}, "Sana"), h("th", {}, "Natija"), h("th", {}, "Daraja"), h("th", {}))),
      h(
        "tbody",
        {},
        rs.map((r) => {
          const s = scoreResponse(survey, r.answers);
          return h(
            "tr",
            {},
            h("td", {}, r.user.name),
            h("td", {}, r.user.group || "—"),
            h("td", {}, COHORTS[r.user.cohort || "unassigned"]),
            h("td", {}, fmtDate(r.submittedAt)),
            h("td", {}, fmt(s.overall)),
            h("td", {}, s.level || "—"),
            h(
              "td",
              { class: "nowrap" },
              h("button", { class: "btn small ghost", onclick: () => viewResponse(survey, r) }, "Ko'rish"),
              h("button", { class: "icon-btn", title: "O'chirish", onclick: async () => {
                if (!(await confirmDialog(`${r.user.name} javobini o'chirasizmi? O'quvchi so'rovnomani qayta topshira oladi.`))) return;
                await api.del(`admin/surveys/${survey.id}/responses/${r.userId}`);
                toast("Javob o'chirildi", "ok");
                reload();
              } }, "🗑")
            )
          );
        })
      )
    )
  );
}

function answerText(q, v) {
  if (v === undefined || v === null || v === "") return "—";
  if (q.type === "likert") return `${v} — ${LIKERT_LABELS[v - 1]}`;
  if (q.type === "single" || q.type === "test") return `${q.options[v]}${q.type === "test" ? (v === q.correct ? " ✓" : " ✗") : ""}`;
  if (q.type === "multi") return v.map((k) => q.options[k]).join("; ");
  return String(v);
}

function viewResponse(survey, r) {
  modal(`${r.user.name} — ${survey.title}`, h("div", {}, h("p", { class: "muted small" }, `${r.user.email} · ${r.user.group || "—"} · ${fmtDate(r.submittedAt)}`), h("dl", { class: "answers" }, survey.questions.map((q) => [h("dt", {}, q.text), h("dd", {}, answerText(q, r.answers[q.id]))]))), { wide: true });
}

function exportRaw(survey, rs) {
  const header = ["F.I.Sh.", "Email", "Guruh", "Muassasa", "Tadqiqot guruhi", "Sana", ...survey.questions.map((q, i) => `${i + 1}. ${q.text}`), "Umumiy natija", "Daraja"];
  const rows = rs.map((r) => {
    const s = scoreResponse(survey, r.answers);
    return [r.user.name, r.user.email, r.user.group, r.user.college, COHORTS[r.user.cohort || "unassigned"], fmtDate(r.submittedAt), ...survey.questions.map((q) => (["likert", "scale"].includes(q.type) ? r.answers[q.id] ?? "" : answerText(q, r.answers[q.id]))), Number.isFinite(s.overall) ? s.overall.toFixed(2).replace(".", ",") : "", s.level || ""];
  });
  downloadFile(`${survey.id}-javoblar.csv`, toCSV([header, ...rows]));
}

function exportSummary(survey, rs) {
  const rows = [["Savol", "Turi", "n", "M", "SD", "Taqsimot"]];
  for (const q of survey.questions) {
    const vals = rs.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== "");
    if (["likert", "scale"].includes(q.type)) {
      const opts = q.type === "likert" ? [1, 2, 3, 4, 5] : Array.from({ length: 11 }, (_, k) => k);
      rows.push([q.text, TYPE_NAMES[q.type], vals.length, fmt(mean(vals)).replace(".", ","), fmt(sd(vals)).replace(".", ","), opts.map((o) => `${o}: ${vals.filter((v) => v === o).length}`).join(", ")]);
    } else if (["single", "test", "multi"].includes(q.type)) {
      rows.push([q.text, TYPE_NAMES[q.type], vals.length, "", "", q.options.map((o, k) => `${o}: ${vals.filter((v) => (Array.isArray(v) ? v.includes(k) : v === k)).length}`).join(", ")]);
    }
  }
  downloadFile(`${survey.id}-statistika.csv`, toCSV(rows));
}

// ---------------- Tajriba-sinov tahlili ----------------

async function experiment(el) {
  const surveys = (await api.get("admin/surveys")).filter((s) => s.audience !== "teacher");
  const pre = surveys.filter((s) => s.stage === "pre");
  const post = surveys.filter((s) => s.stage === "post");
  if (!pre.length || !post.length) return mount(el, emptyState("🧪", "Juft so'rovnomalar topilmadi", "Diagnostik (pre) va yakuniy (post) bosqichdagi so'rovnomalar kerak."));
  const pairFor = (p) => post.find((x) => x.id === p.id.replace(/-pre$/, "-post")) || post[0];
  const preSel = h("select", {}, pre.map((s) => h("option", { value: s.id }, s.title)));
  const postSel = h("select", {}, post.map((s) => h("option", { value: s.id }, s.title)));
  postSel.value = pairFor(pre[0]).id;
  preSel.addEventListener("change", () => (postSel.value = pairFor(pre.find((s) => s.id === preSel.value)).id));
  const out = h("div", { class: "stack" });
  const run = async () => {
    out.replaceChildren(loading("Hisoblanmoqda..."));
    const [a, b] = await Promise.all([api.get(`admin/surveys/${preSel.value}/results`), api.get(`admin/surveys/${postSel.value}/results`)]);
    out.replaceChildren(experimentReport(a, b));
  };
  mount(
    el,
    h(
      "div",
      { class: "card" },
      h("h2", {}, "Tajriba-sinov ishlari natijalarini statistik tahlil qilish"),
      h("p", { class: "muted small" }, "Tajriba (TG) va nazorat (NG) guruhlarining diagnostik va yakuniy bosqich natijalari solishtiriladi: o'rtacha qiymatlar, darajalar taqsimoti, Styudent t-mezoni, Pirson χ² mezoni va samaradorlik koeffitsiyenti."),
      h("div", { class: "grid cols-2" }, h("label", { class: "field" }, h("span", {}, "Diagnostik (boshlang'ich) so'rovnoma"), preSel), h("label", { class: "field" }, h("span", {}, "Yakuniy so'rovnoma"), postSel)),
      h("button", { class: "btn", onclick: run }, "Tahlil qilish")
    ),
    out
  );
  run();
}

function experimentReport(preData, postData) {
  const groups = ["experimental", "control"];
  const byUser = (data) => Object.fromEntries(data.responses.map((r) => [r.userId, { r, s: scoreResponse(data.survey, r.answers) }]));
  const preU = byUser(preData), postU = byUser(postData);
  const cohortOf = (x) => x.r.user.cohort || "unassigned";
  const scale = overallScale(postData.survey);
  const levels = levelNames(postData.survey);
  const comps = postData.survey.scoring?.components || [];
  const csv = [["Ko'rsatkich", "Guruh", "Bosqich", "n", "M", "SD"]];

  const sel = (U, g) => Object.values(U).filter((x) => cohortOf(x) === g && Number.isFinite(x.s.overall));
  const stats = groups.map((g) => {
    const p = sel(preU, g), q = sel(postU, g);
    const matched = q.filter((x) => preU[x.r.userId] && Number.isFinite(preU[x.r.userId].s.overall));
    return {
      g,
      pre: p.map((x) => x.s.overall),
      post: q.map((x) => x.s.overall),
      paired: pairedT(matched.map((x) => preU[x.r.userId].s.overall), matched.map((x) => x.s.overall)),
      matchedN: matched.length,
      preLevels: levels.map((l) => p.filter((x) => x.s.level === l).length),
      postLevels: levels.map((l) => q.filter((x) => x.s.level === l).length),
    };
  });
  const [E, N] = stats;
  if (!E.pre.length && !E.post.length && !N.pre.length && !N.post.length) {
    return emptyState("👥", "Tadqiqot guruhlari belgilanmagan", "O'quvchilar bo'limida respondentlarni Tajriba (TG) va Nazorat (NG) guruhlariga ajrating.");
  }
  const betweenPre = welchT(E.pre, N.pre);
  const betweenPost = welchT(E.post, N.post);
  const eta = mean(E.post) / mean(N.post);
  const chiPost = chiSquare([E.postLevels, N.postLevels]);
  const chiPre = chiSquare([E.preLevels, N.preLevels]);
  for (const st of stats) {
    csv.push([scale.label, COHORTS[st.g], "Boshlang'ich", st.pre.length, fmt(mean(st.pre)), fmt(sd(st.pre))]);
    csv.push([scale.label, COHORTS[st.g], "Yakuniy", st.post.length, fmt(mean(st.post)), fmt(sd(st.post))]);
  }

  const compRows = comps.map((c) => {
    const cells = groups.flatMap((g) => [preU, postU].map((U) => Object.values(U).filter((x) => cohortOf(x) === g).map((x) => x.s.components[c.key]).filter(Number.isFinite)));
    cells.forEach((v, i) => csv.push([c.title, COHORTS[groups[Math.floor(i / 2)]], i % 2 ? "Yakuniy" : "Boshlang'ich", v.length, fmt(mean(v)), fmt(sd(v))]));
    return h("tr", {}, h("td", {}, c.title), cells.map((v) => h("td", {}, v.length ? `${fmt(mean(v))} ± ${fmt(sd(v))}` : "—")), h("td", {}, fmt(mean(cells[1]) - mean(cells[0]))), h("td", {}, fmt(mean(cells[3]) - mean(cells[2]))));
  });

  const levelRow = (st, which) => {
    const arr = st[which];
    const total = arr.reduce((a, b) => a + b, 0);
    return h("tr", {}, h("td", {}, COHORTS[st.g]), h("td", {}, which === "preLevels" ? "Boshlang'ich" : "Yakuniy"), h("td", {}, total), arr.map((n) => h("td", {}, `${n} (${total ? fmt((n / total) * 100, 1) : 0}%)`)));
  };

  return h(
    "div",
    { class: "stack" },
    h(
      "div",
      { class: "card table-wrap" },
      h("h3", {}, `1. Umumiy ko'rsatkich: ${scale.label}`),
      h(
        "table",
        { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Guruh"), h("th", {}, "Boshlang'ich (n, M ± SD)"), h("th", {}, "Yakuniy (n, M ± SD)"), h("th", {}, "O'sish (Δ)"), h("th", {}, "Juftlangan t-mezon (oldin/keyin)"))),
        h(
          "tbody",
          {},
          stats.map((st) =>
            h(
              "tr",
              {},
              h("td", {}, h("b", {}, COHORTS[st.g])),
              h("td", {}, `n=${st.pre.length}; ${fmt(mean(st.pre))} ± ${fmt(sd(st.pre))}`),
              h("td", {}, `n=${st.post.length}; ${fmt(mean(st.post))} ± ${fmt(sd(st.post))}`),
              h("td", {}, h("b", {}, fmt(mean(st.post) - mean(st.pre)))),
              h("td", {}, st.paired ? `t(${st.paired.df}) = ${fmt(st.paired.t)}; ${significance(st.paired.p)}; d = ${fmt(st.paired.d)} (n=${st.matchedN})` : "Ma'lumot yetarli emas")
            )
          )
        )
      ),
      h(
        "div",
        { class: "grid cols-3" },
        resultBox("TG va NG — boshlang'ich bosqich (Welch t)", betweenPre ? `t = ${fmt(betweenPre.t)}, df = ${fmt(betweenPre.df, 1)}; ${significance(betweenPre.p)}` : "Ma'lumot yetarli emas", betweenPre && betweenPre.p >= 0.05 ? "Guruhlar boshlang'ich bosqichda statistik jihatdan teng (bir jinsli) — bu tajriba uchun to'g'ri shart." : ""),
        resultBox("TG va NG — yakuniy bosqich (Welch t)", betweenPost ? `t = ${fmt(betweenPost.t)}, df = ${fmt(betweenPost.df, 1)}; ${significance(betweenPost.p)}; Koen d = ${fmt(betweenPost.d)}` : "Ma'lumot yetarli emas", betweenPost && betweenPost.p < 0.05 && betweenPost.t > 0 ? "Tajriba guruhi natijalari nazorat guruhidan statistik ahamiyatli darajada yuqori." : ""),
        resultBox("Samaradorlik koeffitsiyenti", Number.isFinite(eta) ? `η = X̄(TG) / X̄(NG) = ${fmt(eta, 3)}` : "—", Number.isFinite(eta) ? (eta > 1 ? `Tajriba guruhida natija ${fmt((eta - 1) * 100, 1)}% ga yuqori.` : "Samaradorlik kuzatilmadi.") : "")
      )
    ),
    levels.length > 0 &&
      h(
        "div",
        { class: "card table-wrap" },
        h("h3", {}, "2. Darajalar bo'yicha taqsimot"),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Guruh"), h("th", {}, "Bosqich"), h("th", {}, "n"), levels.map((l) => h("th", {}, l)))),
          h("tbody", {}, stats.flatMap((st) => [levelRow(st, "preLevels"), levelRow(st, "postLevels")]))
        ),
        h("p", { class: "small" }, h("b", {}, "Pirson χ² mezoni (TG va NG): "), `boshlang'ich — ${chiPre ? `χ² = ${fmt(chiPre.chi2, 3)}, df = ${chiPre.df}, ${significance(chiPre.p)}` : "ma'lumot yetarli emas"}; yakuniy — ${chiPost ? `χ² = ${fmt(chiPost.chi2, 3)}, df = ${chiPost.df}, ${significance(chiPost.p)}` : "ma'lumot yetarli emas"}.`),
        levelChart(levels, [
          { name: "TG — boshlang'ich", values: E.preLevels },
          { name: "TG — yakuniy", values: E.postLevels },
          { name: "NG — boshlang'ich", values: N.preLevels },
          { name: "NG — yakuniy", values: N.postLevels },
        ])
      ),
    comps.length > 0 &&
      h(
        "div",
        { class: "card table-wrap" },
        h("h3", {}, "3. Komponentlar bo'yicha dinamika (M ± SD)"),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Komponent"), h("th", {}, "TG boshl."), h("th", {}, "TG yakun."), h("th", {}, "NG boshl."), h("th", {}, "NG yakun."), h("th", {}, "Δ TG"), h("th", {}, "Δ NG"))),
          h("tbody", {}, compRows)
        )
      ),
    h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile(`tajriba-${preData.survey.id}-${postData.survey.id}.csv`, toCSV(csv)) }, "⬇ Jadvalni yuklab olish (CSV)")),
    h("p", { class: "muted small" }, "Izoh: Juftlangan t-mezon har ikkala bosqichda qatnashgan o'quvchilar bo'yicha hisoblanadi. p < 0,05 bo'lsa farq statistik ahamiyatli hisoblanadi. Koen d: 0,2 — kichik, 0,5 — o'rta, 0,8 — katta ta'sir.")
  );
}

function resultBox(title, value, note) {
  return h("div", { class: "card mini info" }, h("h4", {}, title), h("p", {}, h("b", {}, value)), note && h("p", { class: "small" }, note));
}

// ---------------- So'rovnoma konstruktori ----------------

async function builder(el, editId) {
  const surveys = await api.get("admin/surveys");
  if (editId) {
    const s = editId === "new" ? null : surveys.find((x) => x.id === editId);
    if (editId !== "new" && !s) throw new Error("So'rovnoma topilmadi");
    return surveyEditor(el, s);
  }
  mount(
    el,
    h("div", { class: "row wrap" }, h("a", { href: "#/teacher/builder/new", class: "btn" }, "➕ Yangi so'rovnoma"), h("button", { class: "btn ghost", onclick: () => importJson() }, "⬆ JSON'dan import")),
    h(
      "div",
      { class: "card table-wrap" },
      h(
        "table",
        { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Nomi"), h("th", {}, "Bosqich"), h("th", {}, "Savollar"), h("th", {}, "Javoblar"), h("th", {}, "Faol"), h("th", {}))),
        h(
          "tbody",
          {},
          surveys.map((s) =>
            h(
              "tr",
              {},
              h("td", {}, s.title, h("div", { class: "muted small" }, s.id)),
              h("td", {}, stageName(s.stage)),
              h("td", {}, s.questions.length),
              h("td", {}, s.responseCount),
              h("td", {}, h("input", { type: "checkbox", checked: s.active, "aria-label": "Faol", onchange: async (e) => {
                try {
                  await api.put(`admin/surveys/${s.id}`, { ...s, active: e.target.checked });
                  toast(e.target.checked ? "So'rovnoma faollashtirildi" : "So'rovnoma yashirildi", "ok");
                } catch (ex) {
                  toast(ex.message, "error");
                  e.target.checked = !e.target.checked;
                }
              } })),
              h(
                "td",
                { class: "nowrap" },
                h("a", { href: `#/teacher/builder/${s.id}`, class: "btn small ghost" }, "Tahrirlash"),
                h("button", { class: "icon-btn", title: "JSON eksport", onclick: () => downloadFile(`${s.id}.json`, JSON.stringify(stripMeta(s), null, 2), "application/json") }, "⬇"),
                h("button", { class: "icon-btn", title: "O'chirish", onclick: async () => {
                  if (!(await confirmDialog(`"${s.title}" so'rovnomasini o'chirasizmi?`))) return;
                  try {
                    await api.del(`admin/surveys/${s.id}`);
                    toast("O'chirildi", "ok");
                    builder(el);
                  } catch (ex) {
                    toast(ex.message, "error");
                  }
                } }, "🗑")
              )
            )
          )
        )
      )
    ),
    h("p", { class: "muted small" }, "Javoblari bor so'rovnomaning savollarini o'zgartirish natijalar tahliliga ta'sir qilishi mumkin. Bunday holda yangi so'rovnoma yaratish tavsiya etiladi.")
  );

  function importJson() {
    const input = h("input", { type: "file", accept: "application/json" });
    input.addEventListener("change", async () => {
      try {
        const data = JSON.parse(await input.files[0].text());
        await api.post("admin/surveys", data);
        toast("So'rovnoma import qilindi", "ok");
        builder(el);
      } catch (ex) {
        toast(ex.message, "error");
      }
    });
    input.click();
  }
}

const stripMeta = ({ responseCount, createdAt, updatedAt, seed, createdBy, ...rest }) => rest;

function surveyEditor(el, existing) {
  const s = existing
    ? structuredClone(stripMeta(existing))
    : { title: "", description: "", audience: "student", stage: "any", active: true, scoring: { components: [] }, questions: [{ type: "likert", text: "" }] };
  s.scoring ||= { components: [] };
  s.scoring.components ||= [];
  const qBox = h("div", { class: "stack" });
  const compBox = h("div", { class: "stack" });

  const input = (obj, key, attrs = {}) => {
    const elx = h(attrs.tag || "input", { ...attrs, tag: undefined, value: attrs.tag ? undefined : obj[key] ?? "" }, attrs.tag ? obj[key] ?? "" : null);
    elx.addEventListener("input", () => (obj[key] = elx.value));
    return elx;
  };

  const drawComps = () => {
    compBox.replaceChildren(
      ...s.scoring.components.map((c, i) => h("div", { class: "row" }, input(c, "key", { placeholder: "kalit (masalan: motiv)", class: "w-sm" }), input(c, "title", { placeholder: "Komponent nomi" }), h("button", { class: "icon-btn", onclick: () => (s.scoring.components.splice(i, 1), drawComps(), drawQs()) }, "✕"))),
      h("button", { class: "btn small ghost", onclick: () => (s.scoring.components.push({ key: `k${s.scoring.components.length + 1}`, title: "" }), drawComps()) }, "+ Komponent")
    );
  };

  const drawQs = () => {
    qBox.replaceChildren(
      ...s.questions.map((q, i) => {
        const opts = h("textarea", { rows: 4, placeholder: "Har bir variant alohida qatorda" }, (q.options || []).join("\n"));
        opts.addEventListener("input", () => (q.options = opts.value.split("\n").map((x) => x.trim()).filter(Boolean)));
        const needsOptions = ["single", "multi", "test"].includes(q.type);
        return h(
          "div",
          { class: "card q-editor" },
          h(
            "div",
            { class: "row between" },
            h("b", {}, `${i + 1}-savol`),
            h(
              "div",
              { class: "row" },
              h("button", { class: "icon-btn", disabled: i === 0, onclick: () => ([s.questions[i - 1], s.questions[i]] = [s.questions[i], s.questions[i - 1]], drawQs()) }, "▲"),
              h("button", { class: "icon-btn", disabled: i === s.questions.length - 1, onclick: () => ([s.questions[i + 1], s.questions[i]] = [s.questions[i], s.questions[i + 1]], drawQs()) }, "▼"),
              h("button", { class: "icon-btn", onclick: () => (s.questions.splice(i, 1), drawQs()) }, "🗑")
            )
          ),
          h("div", { class: "grid cols-3" },
            h("label", { class: "field" }, h("span", {}, "Turi"), h("select", { onchange: (e) => ((q.type = e.target.value), drawQs()) }, Object.entries(TYPE_NAMES).map(([k, v]) => h("option", { value: k, selected: q.type === k }, v)))),
            q.type === "likert" && s.scoring.components.length > 0 && h("label", { class: "field" }, h("span", {}, "Komponent"), h("select", { onchange: (e) => (q.component = e.target.value || undefined) }, h("option", { value: "" }, "—"), s.scoring.components.map((c) => h("option", { value: c.key, selected: q.component === c.key }, c.title || c.key)))),
            h("label", { class: "check" }, h("input", { type: "checkbox", checked: q.optional, onchange: (e) => (q.optional = e.target.checked) }), "Ixtiyoriy savol")
          ),
          h("label", { class: "field" }, h("span", {}, "Savol matni"), input(q, "text", { tag: "textarea", rows: 2 })),
          needsOptions && h("label", { class: "field" }, h("span", {}, "Variantlar"), opts),
          q.type === "test" && h("label", { class: "field" }, h("span", {}, "To'g'ri javob raqami (1 dan boshlab)"), h("input", { type: "number", min: 1, value: Number.isInteger(q.correct) ? q.correct + 1 : "", oninput: (e) => (q.correct = Number(e.target.value) - 1) }))
        );
      }),
      h("div", { class: "row wrap" }, Object.entries(TYPE_NAMES).map(([k, v]) => h("button", { class: "btn small ghost", onclick: () => (s.questions.push({ type: k, text: "", ...(["single", "multi", "test"].includes(k) ? { options: [] } : {}) }), drawQs()) }, `+ ${v}`)))
    );
  };

  drawComps();
  drawQs();
  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/teacher/builder" }, "Konstruktor"), " / ", existing ? existing.title : "Yangi so'rovnoma"),
    h(
      "div",
      { class: "card stack" },
      h("label", { class: "field" }, h("span", {}, "Nomi"), input(s, "title")),
      !existing && h("label", { class: "field" }, h("span", {}, "Identifikator (lotin harflari, ixtiyoriy)"), input(s, "id", { placeholder: "masalan: motivation-2" })),
      h("label", { class: "field" }, h("span", {}, "Tavsif / yo'riqnoma"), input(s, "description", { tag: "textarea", rows: 3 })),
      h(
        "div",
        { class: "grid cols-4" },
        h("label", { class: "field" }, h("span", {}, "Kim uchun"), h("select", { onchange: (e) => (s.audience = e.target.value) }, ["student", "teacher", "all"].map((a) => h("option", { value: a, selected: s.audience === a }, audienceName(a))))),
        h("label", { class: "field" }, h("span", {}, "Tadqiqot bosqichi"), h("select", { onchange: (e) => (s.stage = e.target.value) }, ["pre", "any", "post"].map((a) => h("option", { value: a, selected: s.stage === a }, stageName(a))))),
        h("label", { class: "field" }, h("span", {}, "Tartib raqami"), h("input", { type: "number", value: s.order ?? 50, oninput: (e) => (s.order = Number(e.target.value)) })),
        h("label", { class: "check" }, h("input", { type: "checkbox", checked: s.active, onchange: (e) => (s.active = e.target.checked) }), "Faol (o'quvchilarga ko'rinadi)")
      ),
      h("h3", {}, "Komponentlar (Likert savollarini guruhlash uchun)"),
      compBox
    ),
    h("h3", { class: "section-title" }, "Savollar"),
    qBox,
    h(
      "div",
      { class: "row end sticky-actions" },
      h("a", { href: "#/teacher/builder", class: "btn ghost" }, "Bekor qilish"),
      h("button", { class: "btn", onclick: async (e) => {
        e.target.disabled = true;
        try {
          if (existing) await api.put(`admin/surveys/${existing.id}`, s);
          else await api.post("admin/surveys", s);
          toast("So'rovnoma saqlandi", "ok");
          location.hash = "#/teacher/builder";
        } catch (ex) {
          toast(ex.message, "error");
          e.target.disabled = false;
        }
      } }, "💾 Saqlash")
    )
  );
}

// ---------------- O'quvchilar ----------------

async function students(el) {
  const users = await api.get("admin/students");
  const list = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");
  const groups = [...new Set(list.map((u) => u.group).filter(Boolean))].sort();
  const q = { text: "", group: "" };
  const tbody = h("tbody");

  const setCohort = async (u, cohort) => {
    const res = await api.put(`admin/students/${u.id}`, { cohort });
    u.cohort = res.cohort;
  };

  const draw = () => {
    const rows = list.filter((u) => (!q.group || u.group === q.group) && (!q.text || `${u.name} ${u.email}`.toLowerCase().includes(q.text)));
    tbody.replaceChildren(
      ...rows.map((u) =>
        h(
          "tr",
          {},
          h("td", {}, u.name),
          h("td", {}, u.email),
          h("td", {}, u.group || "—"),
          h("td", {}, u.college || "—"),
          h("td", {}, fmtDate(u.createdAt)),
          h("td", {}, h("select", { class: `cohort-${u.cohort || "unassigned"}`, onchange: async (e) => {
            try {
              await setCohort(u, e.target.value);
              e.target.className = `cohort-${u.cohort}`;
              toast("Saqlandi", "ok");
            } catch (ex) {
              toast(ex.message, "error");
            }
          } }, Object.entries(COHORTS).map(([k, v]) => h("option", { value: k, selected: (u.cohort || "unassigned") === k }, v))), u.cohortSource === "self" && h("div", { class: "muted small" }, "o'quvchi o'zi tanlagan"))
        )
      )
    );
    if (!rows.length) tbody.append(h("tr", {}, h("td", { colspan: 6, class: "muted center" }, "O'quvchilar topilmadi")));
  };

  const bulkGroup = h("select", {}, h("option", { value: "" }, "Guruhni tanlang"), groups.map((g) => h("option", { value: g }, g)));
  const bulkCohort = h("select", {}, Object.entries(COHORTS).map(([k, v]) => h("option", { value: k }, v)));

  draw();
  mount(
    el,
    h(
      "div",
      { class: "card" },
      h("h3", {}, "Tadqiqot guruhlarini belgilash"),
      h("p", { class: "muted small" }, "Butun o'quv guruhini bir vaqtda Tajriba (TG) yoki Nazorat (NG) guruhiga biriktiring. So'rovnoma natijalari shu bo'linma asosida tahlil qilinadi."),
      h("div", { class: "row wrap" }, bulkGroup, "→", bulkCohort, h("button", { class: "btn", onclick: async () => {
        if (!bulkGroup.value) return toast("Guruhni tanlang", "warn");
        const targets = list.filter((u) => u.group === bulkGroup.value);
        await Promise.all(targets.map((u) => setCohort(u, bulkCohort.value)));
        toast(`${targets.length} nafar o'quvchi ${COHORTS[bulkCohort.value]} ga biriktirildi`, "ok");
        draw();
      } }, "Biriktirish"))
    ),
    h(
      "div",
      { class: "card table-wrap" },
      h(
        "div",
        { class: "row wrap" },
        h("input", { type: "search", placeholder: "Ism yoki email bo'yicha qidirish", oninput: (e) => ((q.text = e.target.value.toLowerCase()), draw()) }),
        h("select", { onchange: (e) => ((q.group = e.target.value), draw()) }, h("option", { value: "" }, "Barcha guruhlar"), groups.map((g) => h("option", { value: g }, g))),
        h("div", { class: "grow" }),
        h("span", { class: "muted small" }, `Jami: ${list.length} o'quvchi`),
        h("button", { class: "btn ghost", onclick: () => downloadFile("oquvchilar.csv", toCSV([["F.I.Sh.", "Email", "Guruh", "Muassasa", "Tadqiqot guruhi", "Ro'yxatdan o'tgan"], ...list.map((u) => [u.name, u.email, u.group, u.college, COHORTS[u.cohort || "unassigned"], fmtDate(u.createdAt)])])) }, "⬇ CSV")
      ),
      h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", {}, "F.I.Sh."), h("th", {}, "Email"), h("th", {}, "Guruh"), h("th", {}, "Muassasa"), h("th", {}, "Ro'yxatdan o'tgan"), h("th", {}, "Tadqiqot guruhi"))), tbody)
    ),
    teachers.length > 0 && h("div", { class: "card" }, h("h3", {}, `O'qituvchilar (${teachers.length})`), h("ul", {}, teachers.map((t) => h("li", {}, `${t.name} — ${t.email}${t.college ? ` (${t.college})` : ""}`))))
  );
}

// ---------------- Trenajyor natijalari ----------------

async function trainer(el) {
  const [sessions, { criteria, scenarios }] = await Promise.all([api.get("admin/trainer-sessions"), api.get("trainer/scenarios")]);
  if (!sessions.length) return mount(el, emptyState("🎙", "Hali trenajyor mashg'ulotlari yo'q"));
  const f = { scenario: "", cohort: "" };
  const out = h("div", { class: "stack" });
  const draw = () => {
    const rs = sessions.filter((s) => (!f.scenario || s.scenarioId === f.scenario) && (!f.cohort || (s.user.cohort || "unassigned") === f.cohort));
    const cohortKeys = Object.keys(COHORTS).filter((k) => rs.some((s) => (s.user.cohort || "unassigned") === k));
    out.replaceChildren(
      h(
        "div",
        { class: "card table-wrap" },
        h("h3", {}, "Mezonlar bo'yicha o'rtacha ball"),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Mezon"), cohortKeys.map((k) => h("th", {}, COHORTS[k])), h("th", {}, `Jami (n=${rs.length})`))),
          h(
            "tbody",
            {},
            [...criteria.map((c) => [`${c.title} (${c.max})`, (s) => s.evaluation.scores[c.key]]), [h("b", {}, "Umumiy ball (100)"), (s) => s.total]].map(([title, get]) =>
              h("tr", {}, h("td", {}, title), [...cohortKeys.map((k) => rs.filter((s) => (s.user.cohort || "unassigned") === k)), rs].map((g) => h("td", {}, g.length ? `${fmt(mean(g.map(get)), 1)} ± ${fmt(sd(g.map(get)), 1)}` : "—")))
            )
          )
        )
      ),
      h(
        "div",
        { class: "card table-wrap" },
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Sana"), h("th", {}, "O'quvchi"), h("th", {}, "Guruh"), h("th", {}, "Ssenariy"), h("th", {}, "Ball"), h("th", {}, "Davomiylik"), h("th", {}, "Maslahat"), h("th", {}))),
          h(
            "tbody",
            {},
            rs.map((s) =>
              h(
                "tr",
                {},
                h("td", {}, fmtDate(s.createdAt)),
                h("td", {}, s.user.name),
                h("td", {}, s.user.group || "—"),
                h("td", {}, s.scenarioTitle),
                h("td", {}, h("b", { class: scoreClass(s.total) }, s.total)),
                h("td", {}, `${Math.round(s.durationSec / 60)} daq`),
                h("td", {}, s.hintsUsed),
                h("td", {}, h("button", { class: "btn small ghost", onclick: () => showSession(s) }, "Ko'rish"))
              )
            )
          )
        )
      ),
      h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile("trenajyor-natijalari.csv", toCSV([["Sana", "O'quvchi", "Guruh", "Tadqiqot guruhi", "Ssenariy", ...criteria.map((c) => c.title), "Umumiy ball", "Davomiylik (daq)", "Maslahatlar"], ...rs.map((s) => [fmtDate(s.createdAt), s.user.name, s.user.group, COHORTS[s.user.cohort || "unassigned"], s.scenarioTitle, ...criteria.map((c) => s.evaluation.scores[c.key]), s.total, Math.round(s.durationSec / 60), s.hintsUsed])])) }, "⬇ CSV"))
    );
  };
  mount(
    el,
    h(
      "div",
      { class: "card row wrap filter-bar" },
      h("label", { class: "field" }, h("span", {}, "Ssenariy"), h("select", { onchange: (e) => ((f.scenario = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), scenarios.map((s) => h("option", { value: s.id }, s.title)))),
      h("label", { class: "field" }, h("span", {}, "Tadqiqot guruhi"), h("select", { onchange: (e) => ((f.cohort = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), Object.entries(COHORTS).map(([k, v]) => h("option", { value: k }, v))))
    ),
    out
  );
  draw();
}

// ---------------- Mustaqil ishlar ----------------

async function selfStudy(el) {
  const items = await api.get("admin/self-study");
  if (!items.length) return mount(el, emptyState("🧩", "Hali mustaqil ishlar topshirilmagan"));
  let onlyPending = true;
  const list = h("div", { class: "stack" });
  const draw = () => {
    const rs = items.filter((i) => !onlyPending || i.grade == null || i.resubmitted);
    list.replaceChildren(
      ...rs.map((it) =>
        h(
          "div",
          { class: "card" },
          h("div", { class: "row between wrap" }, h("div", {}, h("b", {}, it.taskTitle), h("div", { class: "muted small" }, `${it.topicTitle} · ${it.user.name} (${it.user.group || "—"}) · ${fmtDate(it.submittedAt)}`)), it.grade != null ? h("span", { class: `badge ${it.resubmitted ? "badge-warn" : "badge-ok"}` }, it.resubmitted ? `Qayta topshirilgan (avval: ${it.grade})` : `Baho: ${it.grade}`) : h("span", { class: "badge badge-warn" }, "Baholanmagan")),
          it.text && h("p", { class: "pre-wrap" }, it.text),
          it.link && h("p", {}, "🔗 ", h("a", { href: it.link, target: "_blank", rel: "noopener noreferrer" }, it.link)),
          gradeForm(it, draw)
        )
      )
    );
    if (!rs.length) list.append(emptyState("✅", "Barcha ishlar baholangan"));
  };
  mount(el, h("label", { class: "check" }, h("input", { type: "checkbox", checked: true, onchange: (e) => ((onlyPending = e.target.checked), draw()) }), "Faqat baholanmaganlarni ko'rsatish"), list);
  draw();
}

function gradeForm(it, redraw) {
  const grade = h("select", {}, [5, 4, 3, 2].map((g) => h("option", { value: g, selected: it.grade === g }, g)));
  const fb = h("textarea", { rows: 2, placeholder: "O'quvchiga izoh va tavsiyalar" }, it.feedback || "");
  return h(
    "div",
    { class: "row wrap grade-form" },
    h("label", { class: "field" }, h("span", {}, "Baho"), grade),
    h("label", { class: "field grow" }, h("span", {}, "Izoh"), fb),
    h("button", { class: "btn", onclick: async () => {
      try {
        const res = await api.put(`admin/self-study/${it.userId}/${it.taskId}`, { grade: Number(grade.value), feedback: fb.value });
        Object.assign(it, res);
        toast("Baho saqlandi", "ok");
        redraw();
      } catch (ex) {
        toast(ex.message, "error");
      }
    } }, "Baholash")
  );
}

// ---------------- Kompleks diagnostika (1-ilova) ----------------

const DIAG_LEVELS = ["Past", "O'rta", "Yuqori"];
const gradeLevel = (g) => ({ 3: "Past", 4: "O'rta", 5: "Yuqori" })[g];

async function diagnostics(el) {
  const data = await api.get("admin/diagnostics");
  const { instrument, records } = data;
  let settings = data.settings;
  const stages = Object.keys(instrument.stages);
  const f = { stage: settings.activeStage || "T0", cohort: "", group: "", anon: false };
  const groups = [...new Set(records.map((r) => r.user?.group).filter(Boolean))].sort();
  const out = h("div", { class: "stack" });

  const stageSel = h("select", {}, h("option", { value: "" }, "Yopiq (faol bosqich yo'q)"), stages.map((st) => h("option", { value: st, selected: settings.activeStage === st }, instrument.stages[st])));
  const control = h(
    "div",
    { class: "card" },
    h("h3", {}, "Diagnostika bosqichini boshqarish"),
    h("p", { class: "small muted" }, "O'quvchilar faqat faol bosqichdagi bo'limlarni topshira oladi. T0 — o'qitish boshlanishidan oldin, T2 — shakllantiruvchi ta'sir tugagach. Har bir bosqichda bir xil vositalar, vaqt me'yori va rubrika qo'llanadi."),
    h("div", { class: "row wrap" }, stageSel, h("button", { class: "btn", onclick: async () => {
      try {
        settings = await api.put("admin/diagnostics/settings", { activeStage: stageSel.value || null });
        toast(settings.activeStage ? `${instrument.stages[settings.activeStage]} ochildi` : "Diagnostika yopildi", "ok");
      } catch (e) {
        toast(e.message, "error");
      }
    } }, "Saqlash"))
  );

  const filtered = () => records.filter((r) => r.stage === f.stage && (!f.cohort || (r.user?.cohort || "unassigned") === f.cohort) && (!f.group || r.user?.group === f.group));
  const who = (r) => (f.anon ? r.user?.code || "—" : `${r.user?.name || "?"} (${r.user?.code || "—"})`);

  const draw = () => {
    const rs = filtered().sort((a, b) => (a.user?.code || "").localeCompare(b.user?.code || ""));
    const st = (r, k) => (r[k]?.submittedAt ? "✓" : k === "C" && r.C?.savedAt ? "…" : "—");
    out.replaceChildren(
      h(
        "div",
        { class: "card table-wrap" },
        h("div", { class: "row between wrap" }, h("h3", {}, `${instrument.stages[f.stage]}: ${rs.length} ta o'quvchi`), h("button", { class: "btn ghost small", onclick: () => exportDiag(rs, instrument) }, "⬇ Natijalar (CSV)")),
        rs.length
          ? h(
              "table",
              { class: "table" },
              h("thead", {}, h("tr", {}, ["O'quvchi", "Guruh", "Tadqiqot guruhi", "A", "B (test)", "C", "D", "M", "KK", "AR", "B — umumiy", ""].map((t) => h("th", {}, t)))),
              h(
                "tbody",
                {},
                rs.map((r) => {
                  const res = r.result || {};
                  const needs = (r.C?.submittedAt && !r.grading?.C) || (r.D?.submittedAt && !r.grading?.D);
                  return h(
                    "tr",
                    {},
                    h("td", {}, who(r)),
                    h("td", {}, r.user?.group || "—"),
                    h("td", {}, COHORTS[r.user?.cohort || "unassigned"]),
                    h("td", {}, st(r, "A")),
                    h("td", {}, res.Traw != null ? `${res.Traw}/20${r.B?.overtime ? " ⏰" : ""}` : st(r, "B")),
                    h("td", {}, r.grading?.C ? "✓ baholangan" : st(r, "C")),
                    h("td", {}, r.grading?.D ? "✓ baholangan" : st(r, "D")),
                    ...["M", "KK", "AR"].map((k) => h("td", {}, res[k] ? h("b", { class: `grade-${res[k]}` }, res[k]) : "—")),
                    h("td", {}, res.B != null ? h("b", {}, `${res.B.toFixed(2)} · ${res.level}`) : "—"),
                    h("td", { class: "nowrap" },
                      h("button", { class: `btn small ${needs ? "" : "ghost"}`, onclick: () => gradeDiagModal(r, instrument, () => diagnostics(el)) }, needs ? "Baholash" : "Ko'rish"),
                      h("button", { class: "icon-btn", title: "Bosqichni qayta topshirishga ruxsat (yozuvni o'chirish)", onclick: async () => {
                        if (!(await confirmDialog(`${who(r)}: ${f.stage} bosqichidagi barcha javoblar o'chirilsinmi? O'quvchi bosqichni qaytadan topshiradi.`))) return;
                        await api.del(`admin/diagnostics/${r.stage}/${r.userId}/all`);
                        toast("O'chirildi", "ok");
                        diagnostics(el);
                      } }, "🗑"))
                  );
                })
              )
            )
          : h("p", { class: "muted" }, "Bu bosqichda hali yozuvlar yo'q.")
      ),
      diagAnalysis(records, instrument, f)
    );
  };

  mount(
    el,
    control,
    h(
      "div",
      { class: "card row wrap filter-bar" },
      h("label", { class: "field" }, h("span", {}, "Bosqich"), h("select", { onchange: (e) => ((f.stage = e.target.value), draw()) }, stages.map((st) => h("option", { value: st, selected: f.stage === st }, instrument.stages[st])))),
      h("label", { class: "field" }, h("span", {}, "Tadqiqot guruhi"), h("select", { onchange: (e) => ((f.cohort = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), Object.entries(COHORTS).map(([k, v]) => h("option", { value: k }, v)))),
      h("label", { class: "field" }, h("span", {}, "O'quv guruhi"), h("select", { onchange: (e) => ((f.group = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), groups.map((g) => h("option", { value: g }, g)))),
      h("label", { class: "check" }, h("input", { type: "checkbox", onchange: (e) => ((f.anon = e.target.checked), draw()) }), "Anonim ko'rinish (faqat kod)")
    ),
    out
  );
  draw();
}

function gradeDiagModal(r, ins, reload) {
  const C = r.grading?.C ? r.grading.C.map((t) => [...t]) : [0, 1, 2].map(() => Array(6).fill(null));
  const D = r.grading?.D ? [...r.grading.D] : Array(5).fill(null);
  const note = h("textarea", { rows: 2, placeholder: "Izoh (ixtiyoriy)" }, r.grading?.note || "");
  const gradeButtons = (arr, idx, levels) =>
    h("div", { class: "rubric-choices" }, [3, 4, 5].map((g, k) =>
      h("button", { class: `rubric-choice ${arr[idx] === g ? "active" : ""}`, title: levels[k], onclick: (e) => {
        arr[idx] = g;
        [...e.currentTarget.parentNode.children].forEach((b) => b.classList.toggle("active", b === e.currentTarget));
      } }, h("b", {}, g), h("span", {}, levels[k]))
    ));
  const link = (u) => (u ? h("a", { href: u, target: "_blank", rel: "noopener noreferrer" }, u) : h("span", { class: "muted" }, "—"));
  const cTasks = ins.C.tasks.map((t, ti) => {
    const ans = r.C?.tasks?.[ti] || {};
    return h(
      "div",
      { class: "card" },
      h("h4", {}, t.title),
      t.fields.map((fl) => h("div", { class: "small" }, h("b", {}, fl.label, ": "), fl.type === "url" ? link(ans[fl.key]) : h("div", { class: "pre-wrap answer-box" }, ans[fl.key] || "—"))),
      h("h4", {}, "Rubrika"),
      ins.C.rubric.map((ind, ii) => h("div", { class: "rubric-row" }, h("span", { class: "small" }, `${ii + 1}. ${ind.title}`), gradeButtons(C[ti], ii, ind.levels)))
    );
  });
  const dPart = h(
    "div",
    { class: "card" },
    h("h4", {}, ins.D.title),
    h("dl", { class: "answers" }, ins.D.questions.map((q, i) => [h("dt", {}, q), h("dd", { class: "pre-wrap" }, r.D?.answers?.[i] || "—")])),
    h("h4", {}, "Refleksiya rubrikasi"),
    ins.D.rubric.map((ind, ii) => h("div", { class: "rubric-row" }, h("span", { class: "small" }, `${ii + 1}. ${ind.title}`), gradeButtons(D, ii, ind.levels)))
  );
  let close;
  close = modal(
    `${r.user?.code || ""} — ${r.user?.name || ""} · ${r.stage}`,
    h(
      "div",
      { class: "stack" },
      r.result?.B != null && resultSheet(r.result, { code: r.user?.code, group: r.user?.group, stage: r.stage, date: r.updatedAt }),
      h("p", { class: "small muted" }, `A: ${r.A?.submittedAt ? fmtDate(r.A.submittedAt) : "—"} · B: ${r.B?.submittedAt ? `${fmtDate(r.B.submittedAt)} (${Math.round((r.B.seconds || 0) / 60)} daq${r.B.overtime ? ", vaqt me'yoridan oshgan" : ""})` : "—"} · C: ${r.C?.submittedAt ? fmtDate(r.C.submittedAt) : "—"} · D: ${r.D?.submittedAt ? fmtDate(r.D.submittedAt) : "—"}`),
      h("h3", {}, ins.C.title),
      r.C?.submittedAt ? cTasks : h("p", { class: "muted" }, "C-bo'lim hali topshirilmagan."),
      r.D?.submittedAt ? dPart : h("p", { class: "muted" }, "D-bo'lim hali topshirilmagan."),
      h("label", { class: "field" }, h("span", {}, "Izoh"), note),
      h("div", { class: "row end" }, h("button", { class: "btn", onclick: async () => {
        const payload = { note: note.value };
        const cDone = C.every((t) => t.every((g) => g != null));
        const dDone = D.every((g) => g != null);
        if (r.C?.submittedAt) {
          if (!cDone && C.flat().some((g) => g != null)) return toast("C-bo'lim: barcha 18 ta indikatorni baholang", "warn");
          if (cDone) payload.C = C;
        }
        if (r.D?.submittedAt) {
          if (!dDone && D.some((g) => g != null)) return toast("D-bo'lim: barcha 5 ta indikatorni baholang", "warn");
          if (dDone) payload.D = D;
        }
        try {
          await api.put(`admin/diagnostics/${r.stage}/${r.userId}/grade`, payload);
          toast("Baholar saqlandi", "ok");
          close();
          reload();
        } catch (e) {
          toast(e.message, "error");
        }
      } }, "💾 Baholarni saqlash"))
    ),
    { wide: true }
  );
}

function exportDiag(rs, ins) {
  const header = ["Respondent kodi", "F.I.Sh.", "Guruh", "Tadqiqot guruhi", "Bosqich", "M xom (/75)", "M baho", "T xom (/20)", "T %", "T baho", "KQ o'rtacha", "KQ baho", "KK", "P o'rtacha", "P baho", "R o'rtacha", "R baho", "AR", "B (umumiy)", "Daraja", ...ins.A.items.map((_, i) => `A${i + 1}`), ...ins.B.questions.map((_, i) => `B${i + 1}`)];
  const num = (x, d = 2) => (x == null ? "" : String(+x.toFixed(d)).replace(".", ","));
  const rows = rs.map((r) => {
    const x = r.result || {};
    return [r.user?.code, r.user?.name, r.user?.group, COHORTS[r.user?.cohort || "unassigned"], r.stage, x.Mraw ?? "", x.M ?? "", x.Traw ?? "", num(x.Tpct, 0), x.T ?? "", num(x.KQavg), x.KQ ?? "", x.KK ?? "", num(x.Pavg), x.P ?? "", num(x.Ravg), x.R ?? "", x.AR ?? "", num(x.B), x.level ?? "", ...Array.from({ length: 15 }, (_, i) => r.A?.answers?.[i] ?? ""), ...Array.from({ length: 20 }, (_, i) => (r.B?.answers?.[i] != null ? "ABCD"[r.B.answers[i]] : ""))];
  });
  downloadFile(`diagnostika-${rs[0]?.stage || ""}.csv`, toCSV([header, ...rows]));
}

function diagAnalysis(records, ins, f) {
  const complete = records.filter((r) => r.result?.B != null);
  const stages = Object.keys(ins.stages);
  const pre = h("select", {}, stages.map((s) => h("option", { value: s, selected: s === "T0" }, ins.stages[s])));
  const post = h("select", {}, stages.map((s) => h("option", { value: s, selected: s === "T2" }, ins.stages[s])));
  const box = h("div", { class: "stack" });
  const run = () => box.replaceChildren(diagReport(complete, pre.value, post.value, ins));
  pre.addEventListener("change", run);
  post.addEventListener("change", run);
  run();
  return h(
    "div",
    { class: "card" },
    h("h2", {}, "Tajriba-sinov natijalari tahlili (TG va NG)"),
    h("p", { class: "small muted" }, "Faqat barcha bo'limlari baholangan (to'liq) diagnostika varaqalari hisobga olinadi. Mezonlar bo'yicha 3 — past, 4 — o'rta, 5 — yuqori; umumiy B: 3,00–3,49 past, 3,50–4,49 o'rta, 4,50–5,00 yuqori."),
    h("div", { class: "grid cols-2" }, h("label", { class: "field" }, h("span", {}, "Boshlang'ich bosqich"), pre), h("label", { class: "field" }, h("span", {}, "Yakuniy bosqich"), post)),
    box
  );
}

function diagReport(complete, preSt, postSt, ins) {
  if (!complete.length) return emptyState("📊", "To'liq diagnostika varaqalari hali yo'q", "O'quvchilar barcha bo'limlarni topshirib, siz C va D bo'limlarini baholaganingizdan keyin tahlil shu yerda paydo bo'ladi.");
  const groups = ["experimental", "control"];
  const sel = (st, g) => complete.filter((r) => r.stage === st && (r.user?.cohort || "unassigned") === g);
  const csv = [["Ko'rsatkich", "Guruh", "Bosqich", "n", "M", "SD", "Past", "O'rta", "Yuqori"]];
  const metrics = [["M", "Motivatsion-qadriyatli (M)"], ["KK", "Kognitiv-kommunikativ (KK)"], ["AR", "Amaliy-refleksiv (AR)"], ["B", "Umumiy tayyorgarlik (B)"]];
  const lvl = (k, r) => (k === "B" ? r.result.level : gradeLevel(r.result[k]));

  const metricRows = metrics.flatMap(([k, title]) =>
    groups.flatMap((g) =>
      [preSt, postSt].map((st) => {
        const rs = sel(st, g);
        const v = rs.map((r) => r.result[k]);
        const dist = DIAG_LEVELS.map((L) => rs.filter((r) => lvl(k, r) === L).length);
        csv.push([title, COHORTS[g], st, rs.length, fmt(mean(v)), fmt(sd(v)), ...dist]);
        return h("tr", {}, h("td", {}, title), h("td", {}, COHORTS[g]), h("td", {}, st), h("td", {}, rs.length), h("td", {}, v.length ? `${fmt(mean(v))} ± ${fmt(sd(v))}` : "—"), dist.map((n) => h("td", {}, rs.length ? `${n} (${fmt((n / rs.length) * 100, 1)}%)` : "—")));
      })
    )
  );

  const B = (st, g) => sel(st, g).map((r) => r.result.B);
  const paired = (g) => {
    const post = sel(postSt, g);
    const pairs = post.map((r) => [complete.find((x) => x.stage === preSt && x.userId === r.userId), r]).filter(([a]) => a);
    return { res: pairedT(pairs.map(([a]) => a.result.B), pairs.map(([, b]) => b.result.B)), n: pairs.length };
  };
  const tPre = welchT(B(preSt, "experimental"), B(preSt, "control"));
  const tPost = welchT(B(postSt, "experimental"), B(postSt, "control"));
  const levelsB = (st, g) => DIAG_LEVELS.map((L) => sel(st, g).filter((r) => r.result.level === L).length);
  const chiPre = chiSquare([levelsB(preSt, "experimental"), levelsB(preSt, "control")]);
  const chiPost = chiSquare([levelsB(postSt, "experimental"), levelsB(postSt, "control")]);
  const eta = mean(B(postSt, "experimental")) / mean(B(postSt, "control"));
  const tStr = (t) => (t ? `t = ${fmt(t.t)}, df = ${fmt(t.df, 1)}; ${significance(t.p)}; d = ${fmt(t.d)}` : "Ma'lumot yetarli emas");
  const chiStr = (c) => (c ? `χ² = ${fmt(c.chi2, 3)}, df = ${c.df}; ${significance(c.p)}` : "Ma'lumot yetarli emas");

  return h(
    "div",
    { class: "stack" },
    h("div", { class: "table-wrap" }, h("table", { class: "table" }, h("thead", {}, h("tr", {}, ["Ko'rsatkich", "Guruh", "Bosqich", "n", "M ± SD", ...DIAG_LEVELS].map((t) => h("th", {}, t)))), h("tbody", {}, metricRows))),
    h(
      "div",
      { class: "grid cols-3" },
      resultBox(`TG va NG — ${preSt} (Welch t, B bo'yicha)`, tStr(tPre), tPre && tPre.p >= 0.05 ? "Guruhlar boshlang'ich bosqichda statistik jihatdan bir jinsli." : ""),
      resultBox(`TG va NG — ${postSt} (Welch t, B bo'yicha)`, tStr(tPost), tPost && tPost.p < 0.05 && tPost.t > 0 ? "Tajriba guruhi natijalari nazorat guruhidan statistik ahamiyatli darajada yuqori." : ""),
      resultBox("Samaradorlik koeffitsiyenti", Number.isFinite(eta) ? `η = B̄(TG) / B̄(NG) = ${fmt(eta, 3)}` : "—", Number.isFinite(eta) && eta > 1 ? `TG natijasi ${fmt((eta - 1) * 100, 1)}% ga yuqori.` : "")
    ),
    h(
      "div",
      { class: "grid cols-2" },
      ...groups.map((g) => {
        const { res, n } = paired(g);
        return resultBox(`${COHORTS[g]}: ${preSt} → ${postSt} (juftlangan t)`, res ? `Δ = ${fmt(res.meanDiff)}; t(${res.df}) = ${fmt(res.t)}; ${significance(res.p)} (n=${n})` : "Ma'lumot yetarli emas", "");
      })
    ),
    h("p", { class: "small" }, h("b", {}, "Pirson χ² mezoni (B darajalari, TG va NG): "), `${preSt} — ${chiStr(chiPre)}; ${postSt} — ${chiStr(chiPost)}.`),
    levelChart(DIAG_LEVELS, [
      { name: `TG — ${preSt}`, values: levelsB(preSt, "experimental") },
      { name: `TG — ${postSt}`, values: levelsB(postSt, "experimental") },
      { name: `NG — ${preSt}`, values: levelsB(preSt, "control") },
      { name: `NG — ${postSt}`, values: levelsB(postSt, "control") },
    ]),
    h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile(`diagnostika-tahlil-${preSt}-${postSt}.csv`, toCSV(csv)) }, "⬇ Tahlil jadvali (CSV)"))
  );
}

// ---------------- Marshrut loyihalari ----------------

async function routeProjects(el) {
  const { projects, rubric, levels } = await api.get("admin/routes");
  if (!projects.length) return mount(el, emptyState("🗺", "Hali topshirilgan marshrut loyihalari yo'q"));
  let onlyPending = false;
  const list = h("div", { class: "stack" });
  const draw = () => {
    const rs = projects.filter((p) => !onlyPending || p.status === "submitted" || p.changedAfterSubmit);
    list.replaceChildren(
      h(
        "div",
        { class: "card table-wrap" },
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, ["O'quvchi", "Guruh", "Loyiha", "Daraja", "Obyektlar", "Topshirilgan", "Baho", ""].map((t) => h("th", {}, t)))),
          h("tbody", {}, rs.map((p) =>
            h(
              "tr",
              {},
              h("td", {}, `${p.user?.name} (${p.user?.code || "—"})`),
              h("td", {}, p.user?.group || "—"),
              h("td", {}, p.title, p.changedAfterSubmit && h("span", { class: "badge badge-warn" }, "o'zgartirilgan")),
              h("td", {}, `${p.level}-daraja`),
              h("td", {}, p.objects?.length || 0),
              h("td", {}, fmtDate(p.submittedAt)),
              h("td", {}, p.grade ? h("b", {}, `${p.grade.total} · ${p.grade.level}`) : h("span", { class: "badge badge-warn" }, "Kutilmoqda")),
              h("td", {}, h("button", { class: "btn small", onclick: () => gradeRouteModal(p, rubric, levels, () => routeProjects(el)) }, p.grade ? "Ko'rish" : "Baholash"))
            )
          ))
        )
      ),
      h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile("marshrut-loyihalari.csv", toCSV([["Kod", "O'quvchi", "Guruh", "Tadqiqot guruhi", "Loyiha", "Daraja", ...rubric.map((c) => `${c.title} (${c.max})`), "Jami", "Daraja (baho)"], ...rs.map((p) => [p.user?.code, p.user?.name, p.user?.group, COHORTS[p.user?.cohort || "unassigned"], p.title, p.level, ...rubric.map((_, i) => p.grade?.scores[i] ?? ""), p.grade?.total ?? "", p.grade?.level ?? ""])])) }, "⬇ CSV"))
    );
  };
  mount(el, h("label", { class: "check" }, h("input", { type: "checkbox", onchange: (e) => ((onlyPending = e.target.checked), draw()) }), "Faqat baholanmaganlar"), list);
  draw();
}

function gradeRouteModal(p, rubric, levels, reload) {
  const scores = p.grade ? [...p.grade.scores] : rubric.map(() => null);
  const totalEl = h("b");
  const drawTotal = () => {
    const t = scores.reduce((a, x) => a + (Number(x) || 0), 0);
    const lv = levels.find((l) => t >= l.min);
    totalEl.textContent = `${t} / 100 — ${lv.label}`;
  };
  const fb = h("textarea", { rows: 3, placeholder: "O'quvchiga izoh va tavsiyalar" }, p.grade?.feedback || "");
  drawTotal();
  let close;
  close = modal(
    `${p.title} — ${p.user?.name}`,
    h(
      "div",
      { class: "stack" },
      p.grade && gradeCard(p.grade, rubric),
      projectSummary(p),
      h("h3", {}, "Baholash mezonlari (100 ball)"),
      h("div", { class: "stack" }, rubric.map((c, i) =>
        h("div", { class: "rubric-row" }, h("span", {}, `${i + 1}. ${c.title}`), h("div", { class: "row" }, h("input", { type: "number", min: 0, max: c.max, value: scores[i] ?? "", class: "w-xs", oninput: (e) => { scores[i] = e.target.value === "" ? null : Number(e.target.value); drawTotal(); } }), h("span", { class: "muted small" }, `/ ${c.max}`)))
      )),
      h("p", {}, "Jami: ", totalEl),
      h("details", {}, h("summary", { class: "small" }, "Darajalar tavsifi"), h("ul", { class: "small" }, levels.map((l) => h("li", {}, h("b", {}, `${l.label} (${l.min}+): `), l.text)))),
      h("label", { class: "field" }, h("span", {}, "Izoh"), fb),
      h("div", { class: "row end" }, h("button", { class: "btn", onclick: async () => {
        if (scores.some((x) => x == null)) return toast("Barcha mezonlarni baholang", "warn");
        try {
          await api.put(`admin/routes/${p.userId}/${p.id}/grade`, { scores, feedback: fb.value });
          toast("Baho saqlandi", "ok");
          close();
          reload();
        } catch (e) {
          toast(e.message, "error");
        }
      } }, "💾 Bahoni saqlash"))
    ),
    { wide: true }
  );
}

// ---------------- Kasb standarti bo'yicha kompetensiyalar ----------------

async function competencyOverview(el) {
  const items = (await api.get("admin/evidence")).map((x) => ({ ...x, map: mapFromEvidence(x.evidence) }));
  if (!items.length) return mount(el, emptyState("🎯", "O'quvchilar yo'q"));
  const codes = items[0].map.map((c) => c.code);
  const cohortKeys = ["experimental", "control", "unassigned"].filter((k) => items.some((x) => (x.user.cohort || "unassigned") === k));
  const avgFor = (list, code) => {
    const v = list.map((x) => x.map.find((c) => c.code === code).value).filter((x) => x != null);
    return v.length ? { m: mean(v), n: v.length } : null;
  };
  const summary = h(
    "div",
    { class: "card table-wrap" },
    h("h3", {}, "Kompetensiyalar bo'yicha o'rtacha ko'rsatkich (0–100)"),
    h("p", { class: "small muted" }, "Har bir o'quvchi uchun mavzular, baholangan mustaqil ishlar, trenajyor (ssenariy bo'yicha eng yaxshi natija) va baholangan marshrut loyihalari asosida hisoblanadi. Qavs ichida — dalili bor o'quvchilar soni."),
    h(
      "table",
      { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Kompetensiya"), cohortKeys.map((k) => h("th", {}, COHORTS[k])), h("th", {}, "Jami"))),
      h("tbody", {}, codes.map((code) => {
        const c = items[0].map.find((x) => x.code === code);
        return h("tr", {}, h("td", { title: c.title }, h("b", {}, code), " ", h("span", { class: "small muted" }, c.title.length > 70 ? c.title.slice(0, 70) + "…" : c.title)),
          [...cohortKeys.map((k) => items.filter((x) => (x.user.cohort || "unassigned") === k)), items].map((list) => {
            const a = avgFor(list, code);
            return h("td", {}, a ? `${fmt(a.m, 0)} (${a.n})` : "—");
          }));
      }))
    ),
    h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile("kompetensiyalar.csv", toCSV([["Kod", "F.I.Sh.", "Guruh", "Tadqiqot guruhi", ...codes], ...items.map((x) => [x.user.code, x.user.name, x.user.group, COHORTS[x.user.cohort || "unassigned"], ...x.map.map((c) => (c.value == null ? "" : Math.round(c.value)))])])) }, "⬇ CSV"))
  );
  const list = h(
    "div",
    { class: "card table-wrap" },
    h("h3", {}, "O'quvchilar"),
    h("table", { class: "table" },
      h("thead", {}, h("tr", {}, ["O'quvchi", "Guruh", "Tadqiqot guruhi", "Shakllangan KK", "Shakllangan UK", ""].map((t) => h("th", {}, t)))),
      h("tbody", {}, items.sort((a, b) => a.user.name.localeCompare(b.user.name)).map((x) => {
        const kk = x.map.filter((c) => c.kind === "KK");
        const uk = x.map.filter((c) => c.kind === "UK");
        return h("tr", {}, h("td", {}, `${x.user.name} (${x.user.code || "—"})`), h("td", {}, x.user.group || "—"), h("td", {}, COHORTS[x.user.cohort || "unassigned"]),
          h("td", {}, `${kk.filter((c) => c.level === "Shakllangan").length} / ${kk.length}`), h("td", {}, `${uk.filter((c) => c.level === "Shakllangan").length} / ${uk.length}`),
          h("td", {}, h("button", { class: "btn small ghost", onclick: () => modal(`Kompetensiya xaritasi — ${x.user.name}`, h("div", { class: "stack" }, h("h4", {}, "Kasbiy kompetensiyalar"), competencyTable(kk), h("h4", {}, "Umumiy kompetensiyalar"), competencyTable(uk)), { wide: true }) }, "Xarita")));
      }))
    )
  );
  mount(el, h("p", { class: "muted" }, "Gid tarjimon kasb standarti (NO1.232.1901/Б-22) va 51010304-Turizm ta'lim dasturi bo'yicha kompetensiyalar. ", h("a", { href: "#/standard?tab=functions" }, "Standartni ko'rish →")), summary, list);
}
