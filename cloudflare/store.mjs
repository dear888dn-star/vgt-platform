// Cloudflare ombori: JSON yozuvlar — D1 (SQLite, kuchli izchillik), fayllar (taqdimot, video, ovoz) —
// R2 (FILES ulangan bo'lsa) yoki Workers KV (BLOBS). Fayl kalitlari ham D1 da qayd etiladi, shuning uchun
// list() bitta so'rov bilan ishlaydi. Interfeys netlify/lib/store.mjs dagi bilan bir xil.

const SCHEMA = "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, val TEXT, bin INTEGER NOT NULL DEFAULT 0, size INTEGER, updated INTEGER)";

/** Prefiks bo'yicha diapazon: [prefix, prefix + '￿'). */
const range = (prefix) => [prefix, `${prefix}￿`];

export function cloudflareStore(env) {
  const { DB, BLOBS, FILES } = env;
  if (!DB) throw new Error("D1 ma'lumotlar bazasi ulanmagan (wrangler.jsonc: d1_databases, binding \"DB\")");
  let ready = null;
  const init = () => (ready ||= DB.prepare(SCHEMA).run().catch((e) => ((ready = null), Promise.reject(e))));

  const files = FILES
    ? {
        put: (key, data) => FILES.put(key, data),
        get: async (key) => (await FILES.get(key))?.arrayBuffer() ?? null,
        del: (key) => FILES.delete(key),
      }
    : BLOBS
      ? {
          put: (key, data) => BLOBS.put(key, data),
          get: (key) => BLOBS.get(key, "arrayBuffer"),
          del: (key) => BLOBS.delete(key),
        }
      : null;
  const needFiles = () => {
    if (!files) throw new Error("Fayllar ombori ulanmagan (wrangler.jsonc: kv_namespaces BLOBS yoki r2_buckets FILES)");
    return files;
  };

  return {
    async get(key) {
      await init();
      const row = await DB.prepare("SELECT val FROM kv WHERE key = ?1").bind(key).first();
      return row?.val != null ? JSON.parse(row.val) : null;
    },
    async set(key, value) {
      await init();
      await DB.prepare("INSERT INTO kv (key, val, bin, updated) VALUES (?1, ?2, 0, ?3) ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated = excluded.updated")
        .bind(key, JSON.stringify(value), Date.now())
        .run();
    },
    async del(key) {
      await init();
      const row = await DB.prepare("SELECT bin FROM kv WHERE key = ?1").bind(key).first();
      await DB.prepare("DELETE FROM kv WHERE key = ?1").bind(key).run();
      if (row?.bin && files) await files.del(key);
    },
    async getBinary(key) {
      return needFiles().get(key);
    },
    async setBinary(key, data) {
      await init();
      const bytes = data instanceof ArrayBuffer ? data : data.buffer ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
      await needFiles().put(key, bytes);
      await DB.prepare("INSERT INTO kv (key, bin, size, updated) VALUES (?1, 1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET bin = 1, size = excluded.size, updated = excluded.updated")
        .bind(key, bytes.byteLength ?? 0, Date.now())
        .run();
    },
    async list(prefix = "") {
      await init();
      const { results } = await DB.prepare("SELECT key FROM kv WHERE key >= ?1 AND key < ?2 ORDER BY key").bind(...range(prefix)).all();
      return results.map((r) => r.key);
    },
    /** getMany uchun: prefiks ostidagi barcha JSON yozuvlar bitta so'rovda. */
    async getAll(prefix = "") {
      await init();
      const { results } = await DB.prepare("SELECT val FROM kv WHERE key >= ?1 AND key < ?2 AND val IS NOT NULL ORDER BY key").bind(...range(prefix)).all();
      return results.map((r) => JSON.parse(r.val));
    },
    /** Ko'chirish (eksport) uchun: kalitlar sahifalab, turi bilan. */
    async page(after = "", limit = 200) {
      await init();
      const { results } = await DB.prepare("SELECT key, bin FROM kv WHERE key > ?1 ORDER BY key LIMIT ?2").bind(after, limit).all();
      return results.map((r) => ({ key: r.key, bin: Boolean(r.bin) }));
    },
  };
}
