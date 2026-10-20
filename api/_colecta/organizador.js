// POST /api/colectas/:id/organizador { clave } → { ok: true } si es la clave de organizador de esa colecta.
// Lo usan gasto.html y entrega.html para dejar pasar al formulario solo a quien organiza. No registra nada:
// gastos y entregas vuelven a comprobar la clave al publicar.
import { json, error, leerCuerpo, buscarColecta, rechazoOrganizador } from "../_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const { clave } = await leerCuerpo(req);
    const rechazo = rechazoOrganizador(colecta, clave);
    if (rechazo) return error(res, ...rechazo);
    return json(res, 200, { ok: true, titulo: colecta.titulo });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
