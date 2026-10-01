#!/usr/bin/env python3
"""O'quv qo'llanma (.docx) ni platforma formatiga o'giradi.

Foydalanish:
    python3 scripts/import-docx.py "Turizmda_raqamli_texnologiyalar.docx"

Natija:
    public/data/book.js          — mavzular matni, nazorat savollari, testlar, glossariy
    public/img/topics/tNN.jpg    — mavzu muqovalari (ImageMagick o'rnatilgan bo'lsa)

Faqat Python standart kutubxonasidan foydalanadi. Testlarning to'g'ri javoblari
qo'llanmada belgilanmagan, shuning uchun ular public/data/answer-key.js faylida alohida saqlanadi.
"""
import html
import json
import re
import shutil
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
ROOT = Path(__file__).resolve().parent.parent

TOPIC_RE = re.compile(r"^(\d{1,2})-MAVZU:\s*(.+)$")
QUESTIONS_RE = re.compile(r"^Nazorat savollari\.?$", re.I)
TESTS_RE = re.compile(r"^(Test savollar[i]?|Nazorat uchun tes?t?lar)\.?:?$", re.I)
GLOSSARY_RE = re.compile(r"^Mavzu yuzasidan gl", re.I)
LITERATURE_RE = re.compile(r"^FOYDALANILGAN ADABIYOTLAR", re.I)
OPTION_RE = re.compile(r"^([A-Da-d])[\)\.]\s*(.+)$")
NUMBERED_RE = re.compile(r"^\d{1,2}[\.\)]\s*(.+)$")
CAPTION_RE = re.compile(r"^(\d+(\.\d+)?-?\s*[Jj]advali?|\d+\.\d+-jadval|Rasm|\d+-rasm)", re.I)


def load(docx):
    z = zipfile.ZipFile(docx)
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("word/_rels/document.xml.rels"))}
    styles = {}
    for s in ET.fromstring(z.read("word/styles.xml")).iter(W + "style"):
        n = s.find(W + "name")
        styles[s.get(W + "styleId")] = n.get(W + "val") if n is not None else ""
    body = ET.fromstring(z.read("word/document.xml")).find(W + "body")
    return z, rels, styles, body


def runs_html(p, rels):
    """Paragraf matni (qalin qismlar <b> bilan) va undagi rasmlar."""
    parts, images = [], []
    for r in p.iter(W + "r"):
        rpr = r.find(W + "rPr")
        bold = rpr is not None and rpr.find(W + "b") is not None and rpr.find(W + "b").get(W + "val") not in ("0", "false")
        text = ""
        for el in r:
            if el.tag == W + "t":
                text += el.text or ""
            elif el.tag == W + "tab":
                text += " "
            elif el.tag == W + "br":
                text += "\n"
        for blip in r.iter():
            if blip.tag.endswith("}blip"):
                images.append(rels.get(blip.get(R + "embed")))
        if text:
            parts.append((html.escape(text), bold))
    plain = "".join(t for t, _ in parts)
    merged = ""
    for t, b in parts:
        merged += f"<b>{t}</b>" if b and t.strip() else t
    merged = merged.replace("</b><b>", "")
    return html.unescape(plain).strip(), merged.strip(), images


def paragraphs(body, rels, styles):
    """Hujjatni tekis elementlar ro'yxatiga aylantiradi: p (paragraf), li (ro'yxat), table, img."""
    out = []
    for el in body:
        if el.tag == W + "p":
            ppr = el.find(W + "pPr")
            style, level = "", None
            if ppr is not None:
                ps = ppr.find(W + "pStyle")
                if ps is not None:
                    style = styles.get(ps.get(W + "val"), "")
                num = ppr.find(W + "numPr")
                if num is not None:
                    lvl = num.find(W + "ilvl")
                    level = int(lvl.get(W + "val")) if lvl is not None else 0
            plain, rich, images = runs_html(el, rels)
            for img in images:
                out.append({"kind": "img", "src": img})
            if plain:
                out.append({"kind": "li" if level is not None else "p", "level": level or 0, "text": plain, "html": rich, "style": style})
        elif el.tag == W + "tbl":
            rows = []
            for tr in el.iter(W + "tr"):
                cells = []
                for tc in tr.findall(W + "tc"):
                    cells.append("<br>".join(runs_html(p, rels)[1] for p in tc.iter(W + "p") if runs_html(p, rels)[0]))
                rows.append(cells)
            out.append({"kind": "table", "rows": rows})
    return out


def blocks_to_html(items):
    """Bo'lim elementlarini HTML ga aylantiradi."""
    out, i = [], 0
    while i < len(items):
        it = items[i]
        if it["kind"] == "li":
            lis = []
            while i < len(items) and items[i]["kind"] == "li":
                lis.append(f"<li>{items[i]['html']}</li>")
                i += 1
            out.append("<ul>" + "".join(lis) + "</ul>")
            continue
        if it["kind"] == "table":
            head, *rest = it["rows"] or [[]]
            t = "<div class=\"table-scroll\"><table class=\"book-table\"><thead><tr>" + "".join(f"<th>{c}</th>" for c in head) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rest) + "</tbody></table></div>"
            out.append(t)
        elif it["kind"] == "p":
            if CAPTION_RE.match(it["text"]) and len(it["text"]) < 120:
                out.append(f"<p class=\"caption\">{it['html']}</p>")
            elif re.match(r"^\d\)\s", it["text"]) and len(it["text"]) < 120:
                out.append(f"<h4>{it['html']}</h4>")
            else:
                out.append(f"<p>{it['html']}</p>")
        i += 1
    return "\n".join(out)


def is_heading(text, num):
    m = re.match(rf"^{num}\.(\d{{1,2}})\.?\s*(\S.*)$", text)
    return m and len(text) < 220 and not text.endswith("?") and not re.match(r"^\d+\.\d+\.?\s*-\s*jadval", text, re.I)


def parse_tests(items):
    tests, cur = [], None
    for it in items:
        if it["kind"] != "p" and it["kind"] != "li":
            continue
        t = it["text"]
        opt = OPTION_RE.match(t)
        if opt and cur is not None:
            cur["options"].append(opt.group(2).strip())
            continue
        if it["kind"] == "li" and cur is not None and it["level"] >= 1:
            cur["options"].append(t)
            continue
        if it["kind"] == "li" and cur is not None and len(cur["options"]) < 4 and not t.endswith("?"):
            cur["options"].append(t)
            continue
        q = NUMBERED_RE.match(t)
        cur = {"q": (q.group(1) if q else t).strip(), "options": []}
        tests.append(cur)
    return [t for t in tests if len(t["options"]) >= 2]


def parse_questions(items):
    qs = []
    for it in items:
        if it["kind"] in ("p", "li"):
            m = NUMBERED_RE.match(it["text"])
            qs.append((m.group(1) if m else it["text"]).strip())
    return qs


def parse_glossary(items):
    gl = []
    for it in items:
        if it["kind"] not in ("p", "li"):
            continue
        t = NUMBERED_RE.match(it["text"])
        t = t.group(1) if t else it["text"]
        m = re.match(r"^(.{2,90}?)\s+[–—-]\s+(.+)$", t)
        if m and not OPTION_RE.match(t) and not t.rstrip().endswith("?"):
            gl.append({"term": m.group(1).strip(), "def": m.group(2).strip()})
    return gl


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    z, rels, styles, body = load(sys.argv[1])
    items = paragraphs(body, rels, styles)

    # Kirish va mavzular chegaralari
    starts = [(i, TOPIC_RE.match(it["text"])) for i, it in enumerate(items) if it["kind"] == "p" and TOPIC_RE.match(it["text"])]
    lit_idx = next((i for i, it in enumerate(items) if it["kind"] == "p" and LITERATURE_RE.match(it["text"])), len(items))
    intro_idx = next((i for i, it in enumerate(items) if it["kind"] == "p" and it["text"].strip().upper() == "KIRISH"), None)

    intro = blocks_to_html(items[intro_idx + 1 : starts[0][0]]) if intro_idx is not None else ""
    literature = [it["text"] for it in items[lit_idx + 1 :] if it["kind"] in ("p", "li")]

    img_dir = ROOT / "public" / "img" / "topics"
    img_dir.mkdir(parents=True, exist_ok=True)
    has_convert = shutil.which("convert") is not None

    topics = []
    for k, (start, m) in enumerate(starts):
        end = starts[k + 1][0] if k + 1 < len(starts) else lit_idx
        num = int(m.group(1))
        chunk = items[start + 1 : end]

        # Reja: mavzu nomidan keyingi sarlavhasimon qatorlar
        plan, j = [], 0
        while j < len(chunk) and chunk[j]["kind"] in ("p", "li") and is_heading(chunk[j]["text"], num) and chunk[j]["text"] not in plan:
            plan.append(chunk[j]["text"])
            j += 1

        image = None
        sections, cur = [], None
        mode, tail = "body", {"questions": [], "tests": [], "glossary": []}
        for it in chunk[j:]:
            text = it.get("text", "")
            if it["kind"] == "img" and image is None and not sections:
                image = it["src"]
                continue
            if it["kind"] == "p" and QUESTIONS_RE.match(text):
                mode = "questions"
                continue
            if it["kind"] == "p" and TESTS_RE.match(text):
                mode = "tests"
                continue
            if it["kind"] == "p" and GLOSSARY_RE.match(text):
                mode = "glossary"
                continue
            if mode != "body":
                tail[mode].append(it)
                continue
            if it["kind"] in ("p", "li") and is_heading(text, num):
                cur = {"title": re.sub(r"^(\d+\.\d+)\.?\s*", r"\1. ", text).rstrip("."), "items": []}
                sections.append(cur)
                continue
            if cur is None:
                cur = {"title": "", "items": []}
                sections.append(cur)
            cur["items"].append(it)

        # Glossariydan oldin qolib ketgan "atama – ta'rif" paragraflari (2-mavzudagi kabi)
        if tail["tests"] and tail["glossary"]:
            stray = [it for it in tail["tests"] if it["kind"] == "p" and re.match(r"^[^?]{2,60}\s[–—]\s", it["text"])]
            tail["glossary"] = stray + tail["glossary"]

        # Reja to'liq bo'lishi uchun bo'lim sarlavhalaridan olinadi (qo'llanmadagi reja ba'zan qisqartirilgan).
        # 12-mavzudagi kabi raqamsiz reja (ro'yxat) birinchi nomsiz bo'limda qolsa, u olib tashlanadi.
        if sections and not sections[0]["title"] and all(x["kind"] == "li" for x in sections[0]["items"]):
            sections.pop(0)
        titled = [s["title"] for s in sections if s["title"]]
        if titled:
            plan = titled

        img_name = None
        if image and has_convert:
            img_name = f"t{num:02d}.jpg"
            src = z.extract("word/" + image, ROOT / ".data" / "docx")
            subprocess.run(["convert", src, "-resize", "720x720>", "-strip", "-quality", "78", str(img_dir / img_name)], check=True)

        topics.append(
            {
                "num": num,
                "title": m.group(2).strip().strip("“”\"").replace("“", "“"),
                "plan": [re.sub(r"^(\d+\.\d+)\.?\s*", r"\1. ", p).rstrip(".") for p in plan],
                "image": f"/img/topics/{img_name}" if img_name else None,
                "sections": [{"title": s["title"], "html": blocks_to_html(s["items"])} for s in sections if s["items"] or s["title"]],
                "questions": parse_questions(tail["questions"]),
                "tests": parse_tests(tail["tests"]),
                "glossary": parse_glossary(tail["glossary"]),
            }
        )

    data = {"intro": intro, "topics": topics, "literature": literature}
    out = ROOT / "public" / "data" / "book.js"
    out.write_text(
        "// Avtomatik yaratilgan fayl — qo'lda tahrirlamang.\n"
        "// Manba: \"Turizmda raqamli texnologiyalar\" o'quv qo'llanmasi (Jizzax, 2025).\n"
        "// Qayta yaratish: python3 scripts/import-docx.py <fayl.docx>\n"
        f"export const BOOK = {json.dumps(data, ensure_ascii=False, indent=1)};\n",
        encoding="utf-8",
    )
    for t in topics:
        print(f"{t['num']:>2}. {t['title'][:60]:<60} reja:{len(t['plan'])} bo'lim:{len(t['sections'])} savol:{len(t['questions'])} test:{len(t['tests'])} glossariy:{len(t['glossary'])} rasm:{'ha' if t['image'] else 'yo`q'}")
    print(f"Adabiyotlar: {len(literature)} ta; kirish: {len(intro)} belgi -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
