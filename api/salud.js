// GET /api/salud: confirma que la API llega a Hedera (registro de colectas vía Mirror Node) y en qué red está.
// GET /red.js (vercel.json lo reescribe a /api/salud?formato=js): la red para el navegador, como window.HEDERA_RED,
// así las páginas arman los links de HashScan de la misma red que la API sin tener la red escrita a mano.
import { listarColectas } from "../hedera/colectas.js";
import { RED } from "../hedera/lib.js";

export default async function handler(req, res) {
  if (req.query?.formato === "js") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).end(`window.HEDERA_RED = ${JSON.stringify(RED)};
`);
  }
  try {
    const colectas = await listarColectas();
    res.status(200).json({ ok: true, red: RED, registro: process.env.REGISTRO_TOPIC_ID ?? null, colectas: colectas.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
