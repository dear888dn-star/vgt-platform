// Server API bilan ishlash va foydalanuvchi sessiyasi.
const TOKEN_KEY = "vgt.token";
const USER_KEY = "vgt.user";

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
  } catch {}
}

export const session = {
  get token() {
    return safeGet(TOKEN_KEY);
  },
  get user() {
    try {
      return JSON.parse(safeGet(USER_KEY) || "null");
    } catch {
      return null;
    }
  },
  set(token, user) {
    safeSet(TOKEN_KEY, token);
    safeSet(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("vgt:auth"));
  },
  updateUser(user) {
    safeSet(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("vgt:auth"));
  },
  clear() {
    safeSet(TOKEN_KEY, null);
    safeSet(USER_KEY, null);
    window.dispatchEvent(new Event("vgt:auth"));
  },
  get isTeacher() {
    return this.user?.role === "teacher";
  },
};

async function request(method, path, data, { raw = false } = {}) {
  const binary = data instanceof Blob || data instanceof ArrayBuffer;
  const headers = { "content-type": binary ? "application/octet-stream" : "application/json" };
  if (session.token) headers.authorization = `Bearer ${session.token}`;
  const res = await fetch(`/api/${path}`, { method, headers, body: data === undefined ? undefined : binary ? data : JSON.stringify(data) });
  if (res.status === 401 && session.token && !path.startsWith("auth/")) {
    session.clear();
    location.hash = "#/login";
  }
  if (!res.ok) {
    let message = `Xatolik (${res.status})`;
    try {
      message = (await res.json()).error || message;
    } catch {}
    throw new Error(message);
  }
  return raw ? res : res.json();
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, d) => request("POST", p, d ?? {}),
  put: (p, d) => request("PUT", p, d ?? {}),
  del: (p) => request("DELETE", p),
  stream: (p, d) => request("POST", p, d, { raw: true }),
  putBinary: (p, blob) => request("PUT", p, blob),
  raw: (p) => request("GET", p, undefined, { raw: true }),
};
