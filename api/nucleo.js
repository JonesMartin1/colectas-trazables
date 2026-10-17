// /api/nucleo — colectas del núcleo (contrato Colecta en Hedera).
//   GET  ?c=0.0.x   → estado: barras, titular y avales, tramos, comprobantes y eventos (Mirror Node, sin gastar HBAR).
//   GET  ?lista=1   → colectas registradas en la Plataforma.
//   POST { c, rol, accion, ... }      → acción de demo firmada con la cuenta de prueba de ese rol (solo testnet).
//   POST { crear: { titulo, items, titular, dias } } → crea una colecta en contrato.
import { json, error, leerCuerpo } from "./_comun.js";
import { leerColectaNucleo } from "../hedera/nucleo.js";
import { accionDemo, crearColectaDemo, listarColectasNucleo, ROLES, NOMBRES_ACCIONES } from "../hedera/nucleo-escribir.js";

const COLECTA_DEMO = process.env.NUCLEO_COLECTA_ID ?? "0.0.11058739"; // colecta viva de la demo (la 0.0.11058607 quedó liquidada en la prueba de fraude)

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (req.query.lista) return json(res, 200, { colectas: await listarColectasNucleo(), roles: ROLES, acciones: NOMBRES_ACCIONES, demo: COLECTA_DEMO });
      const id = String(req.query.c || COLECTA_DEMO).trim();
      if (!/^0\.0\.\d+$/.test(id)) return error(res, 400, "El contrato tiene que tener el formato 0.0.x");
      res.setHeader("Cache-Control", "s-maxage=5, stale-while-revalidate=30");
      return json(res, 200, await leerColectaNucleo(id));
    }
    if (req.method === "POST") {
      const b = await leerCuerpo(req);
      if (b.crear) return json(res, 201, await crearColectaDemo(b.crear));
      const r = await accionDemo(b);
      return json(res, r.ok ? 200 : 422, r);
    }
    return error(res, 405, "Método no permitido");
  } catch (e) {
    return error(res, e.status ?? 502, e.message);
  }
}
