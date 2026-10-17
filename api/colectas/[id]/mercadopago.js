// POST /api/colectas/:id/mercadopago { monto } → link de Checkout Pro para donar a esta colecta.
// No registra nada: la donación entra al registro cuando el webhook confirma el pago con la API de MP.
import { json, error, leerCuerpo, buscarColecta } from "../../_comun.js";
import { crearPreferencia } from "../../_mercadopago.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const monto = Math.round(Number((await leerCuerpo(req)).monto));
    if (!(monto > 0) || monto > 10_000_000) return error(res, 400, "El monto tiene que estar entre $1 y $10.000.000.");
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origen = `${req.headers["x-forwarded-proto"] || (/^localhost|^127\./.test(host) ? "http" : "https")}://${host}`;
    const pref = await crearPreferencia({ colecta, monto, origen });
    return json(res, 201, { url: pref.init_point, urlPrueba: pref.sandbox_init_point });
  } catch (e) {
    return error(res, e.status || 500, e.message);
  }
}
