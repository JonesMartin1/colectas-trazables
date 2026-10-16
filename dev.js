// Servidor local para probar sin Vercel: sirve web/ y enruta /api/* a las mismas funciones que usa Vercel.
// Uso: npm run dev → http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(RAIZ, "web");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

// Rutas de la API, en el mismo orden en que Vercel las resolvería.
const RUTAS = [
  [/^\/api\/salud$/, "api/salud.js", []],
  [/^\/api\/alias$/, "api/alias.js", []],
  [/^\/api\/demo\/donar$/, "api/demo/donar.js", []],
  [/^\/api\/colectas$/, "api/colectas/index.js", []],
  [/^\/api\/colectas\/([^/]+)$/, "api/colectas/[id]/index.js", ["id"]],
  [/^\/api\/colectas\/([^/]+)\/donaciones$/, "api/colectas/[id]/donaciones.js", ["id"]],
  [/^\/api\/colectas\/([^/]+)\/gastos$/, "api/colectas/[id]/gastos.js", ["id"]],
  [/^\/api\/colectas\/([^/]+)\/verificar$/, "api/colectas/[id]/verificar.js", ["id"]],
];

function adaptarRes(res) {
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (d) => (res.setHeader("Content-Type", "application/json; charset=utf-8"), res.end(JSON.stringify(d)));
  return res;
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    for (const [re, archivo, claves] of RUTAS) {
      const m = url.pathname.match(re);
      if (!m) continue;
      req.query = Object.fromEntries(url.searchParams);
      claves.forEach((k, i) => (req.query[k] = decodeURIComponent(m[i + 1])));
      const { default: handler } = await import(pathToFileURL(path.join(RAIZ, archivo)).href);
      try {
        await handler(req, adaptarRes(res));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
    let f = path.join(WEB, url.pathname === "/" ? "index.html" : url.pathname);
    if (!f.startsWith(WEB)) return (res.statusCode = 403), res.end();
    if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return (res.statusCode = 404), res.end("No encontrado");
    res.setHeader("Content-Type", TIPOS[path.extname(f)] || "application/octet-stream");
    fs.createReadStream(f).pipe(res);
  })
  .listen(Number(process.env.PORT) || 3000, () => console.log(`Colectas Trazables en http://localhost:${Number(process.env.PORT) || 3000}`));
