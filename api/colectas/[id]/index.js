// GET /api/colectas/:id → colecta, donaciones, gastos y totales, leídos del Mirror Node
import { json, error, buscarColecta, armarColecta } from "../../_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    return json(res, 200, await armarColecta(colecta));
  } catch (e) {
    return error(res, 500, e.message);
  }
}
