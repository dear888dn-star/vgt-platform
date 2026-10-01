import { h, mount, toast } from "../ui.js";
import { api, session } from "../api.js";

function afterLogin() {
  const next = sessionStorage.getItem("vgt.after-login");
  sessionStorage.removeItem("vgt.after-login");
  location.hash = next || (session.isTeacher ? "#/teacher" : "#/");
}

function field(label, attrs) {
  return h("label", { class: "field" }, h("span", {}, label), h("input", attrs));
}

export function renderLogin(el) {
  if (session.user) return afterLogin();
  const err = h("div");
  const form = h(
    "form",
    { class: "card auth-card", onsubmit: async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const btn = form.querySelector("button");
      btn.disabled = true;
      err.replaceChildren();
      try {
        const res = await api.post("auth/login", { email: fd.get("email"), password: fd.get("password") });
        session.set(res.token, res.user);
        toast("Xush kelibsiz!", "ok");
        afterLogin();
      } catch (ex) {
        err.replaceChildren(h("div", { class: "alert alert-error" }, ex.message));
      } finally {
        btn.disabled = false;
      }
    } },
    h("h1", {}, "Tizimga kirish"),
    h("p", { class: "muted" }, "Email va parolingizni kiriting."),
    field("Email", { name: "email", type: "email", required: true, autocomplete: "email" }),
    field("Parol", { name: "password", type: "password", required: true, autocomplete: "current-password" }),
    err,
    h("button", { class: "btn block lg", type: "submit" }, "Kirish"),
    h("p", { class: "center muted" }, "Profilingiz yo'qmi? ", h("a", { href: "#/register" }, "Ro'yxatdan o'ting"))
  );
  mount(el, h("div", { class: "auth-wrap" }, form));
}

export async function renderRegister(el) {
  if (session.user) return afterLogin();
  let config = { teacherSignup: false };
  try {
    config = await api.get("config");
  } catch {}
  const err = h("div");
  const teacherFields = h("div", { class: "hidden" }, field("O'qituvchi kodi", { name: "teacherCode", type: "password", autocomplete: "off" }), h("p", { class: "muted small" }, "Kodni platforma administratoridan oling."));
  const studentFields = h("div", {}, field("Guruh", { name: "group", placeholder: "Masalan: GID-21", maxlength: 60 }));
  const form = h(
    "form",
    { class: "card auth-card", onsubmit: async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get("password") !== fd.get("password2")) {
        err.replaceChildren(h("div", { class: "alert alert-error" }, "Parollar mos kelmadi"));
        return;
      }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      err.replaceChildren();
      try {
        const res = await api.post("auth/register", Object.fromEntries(fd));
        session.set(res.token, res.user);
        toast("Profil yaratildi!", "ok");
        afterLogin();
      } catch (ex) {
        err.replaceChildren(h("div", { class: "alert alert-error" }, ex.message));
      } finally {
        btn.disabled = false;
      }
    } },
    h("h1", {}, "Ro'yxatdan o'tish"),
    config.teacherSignup &&
      h(
        "div",
        { class: "segmented role-switch" },
        ["student", "teacher"].map((r, i) =>
          h("label", { class: `seg ${i === 0 ? "active" : ""}` }, h("input", { type: "radio", name: "role", value: r, checked: i === 0, onchange: (e) => {
            form.querySelectorAll(".role-switch .seg").forEach((s) => s.classList.toggle("active", s.contains(e.target)));
            teacherFields.classList.toggle("hidden", r !== "teacher");
            studentFields.classList.toggle("hidden", r === "teacher");
          } }), r === "student" ? "🎓 O'quvchi" : "👩‍🏫 O'qituvchi")
        )
      ),
    field("Ism-familiya", { name: "name", required: true, maxlength: 120, autocomplete: "name" }),
    field("Email", { name: "email", type: "email", required: true, autocomplete: "email" }),
    field("Ta'lim muassasasi", { name: "college", placeholder: "Masalan: Samarqand turizm va madaniy meros texnikumi", maxlength: 160 }),
    studentFields,
    teacherFields,
    h("div", { class: "grid cols-2" }, field("Parol", { name: "password", type: "password", required: true, minlength: 6, autocomplete: "new-password" }), field("Parolni takrorlang", { name: "password2", type: "password", required: true, minlength: 6, autocomplete: "new-password" })),
    h("p", { class: "muted small" }, "Ro'yxatdan o'tish orqali siz so'rovnoma javoblaringiz ilmiy tadqiqot maqsadlarida umumlashtirilgan holda foydalanilishiga rozilik bildirasiz."),
    err,
    h("button", { class: "btn block lg", type: "submit" }, "Profil yaratish"),
    h("p", { class: "center muted" }, "Profilingiz bormi? ", h("a", { href: "#/login" }, "Kirish"))
  );
  mount(el, h("div", { class: "auth-wrap" }, form));
}
