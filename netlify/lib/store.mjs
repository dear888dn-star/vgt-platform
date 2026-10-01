// Ma'lumotlar ombori: Netlify'da Netlify Blobs, lokal rejimda .data/ papkasidagi JSON fayllar.
import { getStore } from "@netlify/blobs";
import fs from "node:fs/promises";
import path from "node:path";

const STORE_NAME = "vgt";

function fileStore(dir) {
  const file = (key) => path.join(dir, encodeURIComponent(key) + ".json");
  return {
    async get(key) {
      try {
        return JSON.parse(await fs.readFile(file(key), "utf8"));
      } catch (e) {
        if (e.code === "ENOENT") return null;
        throw e;
      }
    },
    async set(key, value) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file(key), JSON.stringify(value));
    },
    async del(key) {
      await fs.rm(file(key), { force: true });
    },
    async list(prefix = "") {
      let names = [];
      try {
        names = await fs.readdir(dir);
      } catch {
        return [];
      }
      return names
        .filter((n) => n.endsWith(".json"))
        .map((n) => decodeURIComponent(n.slice(0, -5)))
        .filter((k) => k.startsWith(prefix));
    },
  };
}

function blobStore() {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  return {
    get: (key) => store.get(key, { type: "json" }),
    set: (key, value) => store.setJSON(key, value),
    del: (key) => store.delete(key),
    async list(prefix = "") {
      const { blobs } = await store.list({ prefix });
      return blobs.map((b) => b.key);
    },
  };
}

let instance;
export function db() {
  if (!instance) {
    const localDir = process.env.VGT_LOCAL_DATA;
    instance = localDir ? fileStore(path.join(localDir, STORE_NAME)) : blobStore();
  }
  return instance;
}

export async function getMany(prefix) {
  const store = db();
  const keys = await store.list(prefix);
  const items = await Promise.all(keys.map((k) => store.get(k)));
  return items.filter(Boolean);
}
