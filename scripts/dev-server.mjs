// Lokal ishga tushirish: `npm run dev` -> http://localhost:8888
// Netlify Blobs o'rniga .data/ papkasida JSON fayllar ishlatiladi.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// .env faylidan o'zgaruvchilarni yuklash (ixtiyoriy)
try {
  for (const line of (await fs.readFile(path.join(root, ".env"), "utf8")).split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
process.env.VGT_LOCAL_DATA ||= path.join(root, ".data");
process.env.TEACHER_CODE ||= "ustoz-local";

const { default: api } = await import("../netlify/functions/api.mjs");
const PORT = Number(process.env.PORT) || 8888;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".pdf": "application/pdf", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".ico": "image/x-icon", ".webp": "image/webp" };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname.startsWith("/api/")) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      const response = await api(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) for await (const chunk of response.body) res.write(chunk);
      return res.end();
    }
    let file = path.join(root, "public", decodeURIComponent(url.pathname));
    if (!file.startsWith(path.join(root, "public"))) return res.writeHead(403).end();
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
      const data = await fs.readFile(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }).end(data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(PORT, () => {
    console.log(`VGT platformasi: http://localhost:${PORT}`);
    console.log(`AI rejimi: ${process.env.ANTHROPIC_API_KEY ? "Claude API" : process.env.GEMINI_API_KEY ? "Google Gemini API" : "demo (AI kaliti o'rnatilmagan)"}`);
    console.log(`O'qituvchi kodi (lokal): ${process.env.TEACHER_CODE}`);
  });
