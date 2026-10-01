// Interaktiv pedagogik metodlar: aqliy hujum, klaster, Venn, keys, FSMU, INSERT, moslashtirish, T-jadval, ketma-ketlik.
import { h, toast } from "./ui.js";
import { METHOD_INFO } from "../data/topics.js";

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** saved — avvalgi natija, save(data, done) — natijani saqlash. */
export function renderMethod(method, saved, save) {
  const info = METHOD_INFO[method.type];
  const body = h("div", { class: "method-body" });
  const status = h("span", { class: `badge ${saved?.done ? "badge-ok" : ""}` }, saved?.done ? "✓ Bajarildi" : "Bajarilmagan");
  const wrapSave = (data, done) => {
    save(data, done);
    status.className = `badge ${done ? "badge-ok" : ""}`;
    status.textContent = done ? "✓ Bajarildi" : "Saqlandi";
  };
  const renderer = RENDERERS[method.type];
  renderer(body, method, saved?.data, wrapSave);
  return h(
    "section",
    { class: "card method", id: method.id },
    h("div", { class: "method-head" }, h("span", { class: "method-icon" }, info.icon), h("div", {}, h("div", { class: "eyebrow" }, info.name), h("h3", {}, method.title)), status),
    h("p", { class: "muted small" }, info.about),
    h("p", { class: "instruction" }, method.instruction),
    body
  );
}

function listEditor(placeholder, items, onChange, { chip = true } = {}) {
  const list = h("div", { class: chip ? "chips" : "stack" });
  const input = h("input", { type: "text", placeholder, maxlength: 200 });
  const draw = () => {
    list.replaceChildren(
      ...items.map((it, i) =>
        h("span", { class: chip ? "chip" : "list-item" }, it, h("button", { class: "chip-x", "aria-label": "O'chirish", onclick: () => (items.splice(i, 1), draw(), onChange()) }, "×"))
      )
    );
  };
  const add = () => {
    const v = input.value.trim();
    if (!v) return;
    items.push(v);
    input.value = "";
    draw();
    onChange();
  };
  input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), add()));
  draw();
  return h("div", {}, h("div", { class: "row" }, input, h("button", { class: "btn", onclick: add }, "Qo'shish")), list);
}

const RENDERERS = {
  brainstorm(el, m, data, save) {
    const ideas = data?.ideas ? [...data.ideas] : [];
    const counter = h("span", { class: "muted small" });
    const upd = () => {
      counter.textContent = `${ideas.length} / ${m.minIdeas} ta g'oya`;
      save({ ideas }, ideas.length >= m.minIdeas);
    };
    counter.textContent = `${ideas.length} / ${m.minIdeas} ta g'oya`;
    const examples = h("div", { class: "hidden chips" }, m.examples.map((e) => h("span", { class: "chip chip-soft" }, e)));
    el.append(
      listEditor("G'oyangizni yozing va Enter bosing", ideas, upd),
      h("div", { class: "row between" }, counter, h("button", { class: "btn ghost small", onclick: () => examples.classList.toggle("hidden") }, "Namunaviy g'oyalar")),
      examples
    );
  },

  cluster(el, m, data, save) {
    const branches = data?.branches ? data.branches.map((b) => ({ ...b, subs: [...b.subs] })) : [];
    const svgBox = h("div", { class: "cluster-svg" });
    const editor = h("div", { class: "stack" });
    const draw = () => {
      svgBox.innerHTML = clusterSvg(m.center, branches);
      editor.replaceChildren(
        ...branches.map((b, i) =>
          h(
            "div",
            { class: "cluster-branch" },
            h("strong", {}, b.name),
            h("button", { class: "chip-x", "aria-label": "O'chirish", onclick: () => (branches.splice(i, 1), changed()) }, "×"),
            listEditor("Tarkibiy qism qo'shish", b.subs, changed)
          )
        )
      );
    };
    const changed = () => {
      draw();
      save({ branches }, branches.length >= 4);
    };
    const input = h("input", { type: "text", placeholder: "Yangi yo'nalish (tarmoq) nomi", maxlength: 60 });
    const add = () => {
      const v = input.value.trim();
      if (!v) return;
      branches.push({ name: v, subs: [] });
      input.value = "";
      changed();
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), add()));
    draw();
    el.append(
      svgBox,
      h("div", { class: "row" }, input, h("button", { class: "btn", onclick: add }, "Tarmoq qo'shish")),
      h("p", { class: "muted small" }, "Kamida 4 ta tarmoq qo'shing. Yordam uchun: ", m.sample.join(", ")),
      editor
    );
  },

  venn(el, m, data, save) {
    const answers = data?.answers ? { ...data.answers } : {};
    const result = h("div");
    const diagram = h("div", { class: "venn-diagram" });
    const labels = { a: m.a, both: "Ikkalasi", b: m.b };
    const drawDiagram = () => {
      const zone = (key) => h("div", { class: `venn-zone venn-${key}` }, h("div", { class: "venn-title" }, labels[key]), m.items.filter(([t]) => answers[t] === key).map(([t]) => h("div", { class: "venn-item" }, t)));
      diagram.replaceChildren(zone("a"), zone("both"), zone("b"));
    };
    const rows = m.items.map(([text]) => {
      const btns = ["a", "both", "b"].map((k) =>
        h("button", { class: `seg ${answers[text] === k ? "active" : ""}`, onclick: (e) => {
          answers[text] = k;
          [...e.target.parentNode.children].forEach((b) => b.classList.toggle("active", b === e.target));
          drawDiagram();
          save({ answers }, false);
        } }, labels[k])
      );
      return h("div", { class: "venn-row" }, h("span", {}, text), h("div", { class: "segmented" }, btns));
    });
    const check = () => {
      if (m.items.some(([t]) => !answers[t])) return toast("Barcha xususiyatlarni belgilang", "warn");
      const correct = m.items.filter(([t, k]) => answers[t] === k).length;
      rows.forEach((r, i) => {
        r.classList.toggle("ok", answers[m.items[i][0]] === m.items[i][1]);
        r.classList.toggle("bad", answers[m.items[i][0]] !== m.items[i][1]);
      });
      result.replaceChildren(h("div", { class: `alert ${correct === m.items.length ? "alert-ok" : "alert-warn"}` }, `Natija: ${correct} / ${m.items.length} to'g'ri. ${correct === m.items.length ? "Ajoyib!" : "Qizil belgilangan qatorlarni qayta ko'rib chiqing."}`));
      save({ answers, score: correct }, correct === m.items.length);
    };
    drawDiagram();
    el.append(diagram, h("div", { class: "stack" }, rows), h("button", { class: "btn", onclick: check }, "Tekshirish"), result);
  },

  case(el, m, data, save) {
    const answers = data?.answers ? [...data.answers] : m.questions.map(() => "");
    const model = h("div", { class: `alert alert-info ${data?.done ? "" : "hidden"}` }, h("strong", {}, "Namunaviy yechim: "), m.model);
    el.append(
      h("blockquote", { class: "case-text" }, m.text),
      ...m.questions.map((q, i) =>
        h("label", { class: "field" }, h("span", {}, `${i + 1}. ${q}`), h("textarea", { rows: 3, oninput: (e) => (answers[i] = e.target.value) }, answers[i]))
      ),
      h("button", { class: "btn", onclick: () => {
        if (answers.some((a) => a.trim().length < 10)) return toast("Har bir savolga batafsilroq javob yozing", "warn");
        save({ answers }, true);
        model.classList.remove("hidden");
        toast("Javobingiz saqlandi", "ok");
      } }, "Javobni saqlash va namunani ko'rish"),
      model
    );
  },

  fsmu(el, m, data, save) {
    const parts = [
      ["f", "F — Fikringizni bayon eting"],
      ["s", "S — Fikringiz bayoniga sabab ko'rsating"],
      ["m", "M — Ko'rsatgan sababingizni isbotlovchi misol keltiring"],
      ["u", "U — Fikringizni umumlashtiring"],
    ];
    const vals = { f: "", s: "", m: "", u: "", ...(data || {}) };
    el.append(
      h("blockquote", { class: "case-text" }, m.statement),
      h("div", { class: "fsmu-grid" }, parts.map(([k, label]) => h("label", { class: `field fsmu-${k}` }, h("span", {}, label), h("textarea", { rows: 3, oninput: (e) => (vals[k] = e.target.value) }, vals[k])))),
      h("button", { class: "btn", onclick: () => {
        const done = Object.values(vals).every((v) => v.trim().length >= 5);
        save(vals, done);
        toast(done ? "FSMU saqlandi" : "Saqlandi. Barcha bandlarni to'ldiring.", done ? "ok" : "warn");
      } }, "Saqlash")
    );
  },

  insert(el, m, data, save) {
    const MARKS = ["", "✓", "+", "−", "?"];
    const marks = data?.marks ? [...data.marks] : m.sentences.map(() => "");
    const summary = h("div", { class: "muted small" });
    const drawSummary = () => {
      summary.textContent = MARKS.slice(1).map((k) => `${k} ${marks.filter((x) => x === k).length}`).join("   ");
    };
    const rows = m.sentences.map((s, i) => {
      const btn = h("button", { class: "insert-mark", "aria-label": "Belgi tanlash" }, marks[i] || "·");
      btn.addEventListener("click", () => {
        marks[i] = MARKS[(MARKS.indexOf(marks[i]) + 1) % MARKS.length];
        btn.textContent = marks[i] || "·";
        drawSummary();
        save({ marks }, marks.every(Boolean));
      });
      return h("div", { class: "insert-row" }, btn, h("span", {}, s));
    });
    drawSummary();
    el.append(h("p", { class: "muted small" }, "Belgini o'zgartirish uchun doirachani bosing: ✓ → + → − → ?"), h("div", { class: "stack" }, rows), summary);
  },

  matching(el, m, data, save) {
    const defs = data?.order || shuffle(m.pairs.map((p) => p[1]));
    const chosen = data?.chosen ? { ...data.chosen } : {};
    const result = h("div");
    const rows = m.pairs.map(([term]) =>
      h(
        "div",
        { class: "match-row" },
        h("strong", {}, term),
        h("select", { onchange: (e) => (chosen[term] = e.target.value, save({ order: defs, chosen }, false)) }, h("option", { value: "" }, "— tanlang —"), defs.map((d) => h("option", { value: d, selected: chosen[term] === d }, d)))
      )
    );
    el.append(
      h("div", { class: "stack" }, rows),
      h("button", { class: "btn", onclick: () => {
        const correct = m.pairs.filter(([t, d]) => chosen[t] === d).length;
        rows.forEach((r, i) => {
          r.classList.toggle("ok", chosen[m.pairs[i][0]] === m.pairs[i][1]);
          r.classList.toggle("bad", chosen[m.pairs[i][0]] !== m.pairs[i][1]);
        });
        result.replaceChildren(h("div", { class: `alert ${correct === m.pairs.length ? "alert-ok" : "alert-warn"}` }, `Natija: ${correct} / ${m.pairs.length}`));
        save({ order: defs, chosen, score: correct }, correct === m.pairs.length);
      } }, "Tekshirish"),
      result
    );
  },

  tchart(el, m, data, save) {
    const left = data?.left ? [...data.left] : [];
    const right = data?.right ? [...data.right] : [];
    const upd = () => save({ left, right }, left.length >= 3 && right.length >= 3);
    el.append(
      h(
        "div",
        { class: "tchart" },
        h("div", {}, h("h4", {}, "➕ ", m.left), listEditor("Yozing va Enter", left, upd, { chip: false })),
        h("div", {}, h("h4", {}, "➖ ", m.right), listEditor("Yozing va Enter", right, upd, { chip: false }))
      ),
      h("p", { class: "muted small" }, "Har bir ustunga kamida 3 tadan fikr yozing.")
    );
  },

  ordering(el, m, data, save) {
    let order = data?.order ? [...data.order] : shuffle(m.items);
    const list = h("ol", { class: "order-list" });
    const result = h("div");
    const draw = () => {
      list.replaceChildren(
        ...order.map((item, i) =>
          h(
            "li",
            { class: "order-item" },
            h("span", {}, item),
            h("span", { class: "order-btns" },
              h("button", { class: "icon-btn", "aria-label": "Yuqoriga", disabled: i === 0, onclick: () => move(i, -1) }, "▲"),
              h("button", { class: "icon-btn", "aria-label": "Pastga", disabled: i === order.length - 1, onclick: () => move(i, 1) }, "▼"))
          )
        )
      );
    };
    const move = (i, d) => {
      [order[i], order[i + d]] = [order[i + d], order[i]];
      draw();
      result.replaceChildren();
      save({ order }, false);
    };
    draw();
    el.append(
      list,
      h("button", { class: "btn", onclick: () => {
        const correct = order.filter((x, i) => x === m.items[i]).length;
        [...list.children].forEach((li, i) => {
          li.classList.toggle("ok", order[i] === m.items[i]);
          li.classList.toggle("bad", order[i] !== m.items[i]);
        });
        result.replaceChildren(h("div", { class: `alert ${correct === m.items.length ? "alert-ok" : "alert-warn"}` }, correct === m.items.length ? "To'g'ri tartib! 🎉" : `${correct} / ${m.items.length} ta element o'z joyida.`));
        save({ order, score: correct }, correct === m.items.length);
      } }, "Tekshirish"),
      result
    );
  },
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function wrapText(text, max = 16) {
  const words = String(text).split(" ");
  const lines = [""];
  for (const w of words) {
    if ((lines[lines.length - 1] + " " + w).trim().length > max && lines[lines.length - 1]) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim();
  }
  return lines.slice(0, 3);
}

function textBlock(x, y, text, cls, max) {
  const lines = wrapText(text, max);
  const start = y - ((lines.length - 1) * 14) / 2;
  return `<text x="${x}" y="${start}" class="${cls}" text-anchor="middle" dominant-baseline="middle">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join("")}</text>`;
}

function clusterSvg(center, branches) {
  const W = 640, H = 420, cx = W / 2, cy = H / 2;
  let out = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Klaster: ${esc(center)}">`;
  const n = Math.max(branches.length, 1);
  branches.forEach((b, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(ang) * 150, by = cy + Math.sin(ang) * 130;
    out += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" class="cl-line"/>`;
    b.subs.slice(0, 4).forEach((s, j, arr) => {
      const spread = 0.5;
      const a2 = ang + (j - (arr.length - 1) / 2) * spread;
      const sx = bx + Math.cos(a2) * 75, sy = by + Math.sin(a2) * 60;
      out += `<line x1="${bx}" y1="${by}" x2="${sx}" y2="${sy}" class="cl-line thin"/>`;
      out += `<rect x="${sx - 44}" y="${sy - 13}" width="88" height="26" rx="13" class="cl-sub"/>`;
      out += textBlock(sx, sy, s.length > 22 ? s.slice(0, 21) + "…" : s, "cl-sub-t", 30);
    });
    out += `<rect x="${bx - 58}" y="${by - 20}" width="116" height="40" rx="12" class="cl-branch"/>`;
    out += textBlock(bx, by, b.name, "cl-branch-t", 16);
  });
  out += `<ellipse cx="${cx}" cy="${cy}" rx="88" ry="42" class="cl-center"/>`;
  out += textBlock(cx, cy, center, "cl-center-t", 18);
  return out + "</svg>";
}
