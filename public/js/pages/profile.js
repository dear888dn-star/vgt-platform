import { h, mount, toast } from "../ui.js";
import { api, session } from "../api.js";
import { cohortPicker } from "./auth.js";

const COHORT = { experimental: "Tajriba guruhi", control: "Nazorat guruhi", unassigned: "Belgilanmagan" };

export async function render(el) {
  const user = await api.get("me");
  session.updateUser(user);
  const form = h(
    "form",
    { class: "card", onsubmit: async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (!data.newPassword) delete data.newPassword;
      try {
        const res = await api.put("me", data);
        session.updateUser(res.user);
        toast("Ma'lumotlar saqlandi", "ok");
        form.querySelectorAll("input[type=password]").forEach((i) => (i.value = ""));
      } catch (ex) {
        toast(ex.message, "error");
      }
    } },
    h("h2", {}, "Shaxsiy ma'lumotlar"),
    h("label", { class: "field" }, h("span", {}, "Ism-familiya"), h("input", { name: "name", value: user.name, required: true })),
    h("label", { class: "field" }, h("span", {}, "Ta'lim muassasasi"), h("input", { name: "college", value: user.college || "" })),
    user.role === "student" && h("label", { class: "field" }, h("span", {}, "Guruh"), h("input", { name: "group", value: user.group || "" })),
    user.role === "student" && (user.cohort || "unassigned") === "unassigned" && cohortPicker(),
    h("h3", {}, "Parolni o'zgartirish"),
    h("div", { class: "grid cols-2" },
      h("label", { class: "field" }, h("span", {}, "Joriy parol"), h("input", { name: "password", type: "password", autocomplete: "current-password" })),
      h("label", { class: "field" }, h("span", {}, "Yangi parol"), h("input", { name: "newPassword", type: "password", minlength: 6, autocomplete: "new-password" }))),
    h("button", { class: "btn", type: "submit" }, "Saqlash")
  );
  mount(
    el,
    h("div", { class: "page-head" }, h("h1", {}, "Profil"), h("button", { class: "btn ghost", onclick: () => { session.clear(); location.hash = "#/"; } }, "Chiqish")),
    h(
      "div",
      { class: "grid cols-2-1" },
      form,
      h(
        "div",
        { class: "card" },
        h("div", { class: "avatar xl" }, user.name.slice(0, 1).toUpperCase()),
        h("h3", {}, user.name),
        h("p", { class: "muted" }, user.email),
        h("dl", { class: "dl" },
          h("dt", {}, "Rol"), h("dd", {}, user.role === "teacher" ? "O'qituvchi" : "O'quvchi"),
          user.role === "student" && [h("dt", {}, "Tadqiqot guruhi"), h("dd", {}, COHORT[user.cohort || "unassigned"])],
          h("dt", {}, "Ro'yxatdan o'tgan"), h("dd", {}, new Date(user.createdAt).toLocaleDateString("uz-UZ")))
      )
    )
  );
}
