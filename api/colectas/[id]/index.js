// GET /api/colectas/:id → colecta, donaciones, gastos y totales, leídos del Mirror Node
import { json, error, armarColecta } from "../../_comun.js";
import { listarColectas } from "../../../hedera/colectas.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return error(res, 405, "Método no permitido");
    // una sola lectura del registro: sirve para encontrar la colecta y para saber si su billetera es compartida
    const todas = await listarColectas();
    const colecta = todas.filter((c) => c.campaignId === req.query.id).pop();
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    return json(res, 200, await armarColecta(colecta, todas));
  } catch (e) {
    return error(res, 500, e.message);
  }
}
