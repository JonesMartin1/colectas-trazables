// GET /api/nucleo?c=0.0.x → estado de una colecta del núcleo (contrato Colecta): barras, validadoras y titular,
// tramos, comprobantes y eventos. Se lee del Mirror Node, sin gastar HBAR.
import { json, error } from "./_comun.js";
import { leerColectaNucleo } from "../hedera/nucleo.js";

const COLECTA_DEMO = process.env.NUCLEO_COLECTA_ID ?? "0.0.11058607";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return error(res, 405, "Método no permitido");
    const id = String(req.query.c || COLECTA_DEMO).trim();
    if (!/^0\.0\.\d+$/.test(id)) return error(res, 400, "El contrato tiene que tener el formato 0.0.x");
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return json(res, 200, await leerColectaNucleo(id));
  } catch (e) {
    return error(res, 502, e.message);
  }
}
