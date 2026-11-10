// POST /api/colectas/:id/mercadopago { monto } → link de Checkout Pro para donar a esta colecta.
// No registra nada: la donación entra al registro cuando el webhook confirma el pago con la API de MP.
import { json, error, errorDe, leerCuerpo, buscarColecta } from "../_comun.js";
import { crearPreferencia } from "../_mercadopago.js";

import { limitar, esVerificada } from "../_seguridad.js";
import { ES_MAINNET } from "../../hedera/lib.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    if (limitar(req, res, "mercadopago", { max: 10 })) return;
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    // sin organización validada no hay cobro: una colecta sin verificar no puede sacar un link de pago
    if (!esVerificada(colecta)) return error(res, 403, "Esta colecta todavía no está verificada y no recibe pagos.");
    const monto = Math.round(Number((await leerCuerpo(req)).monto));
    if (!(monto > 0) || monto > 10_000_000) return error(res, 400, "El monto tiene que estar entre $1 y $10.000.000.");
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origen = `${req.headers["x-forwarded-proto"] || (/^localhost|^127\./.test(host) ? "http" : "https")}://${host}`;
    const pref = await crearPreferencia({ colecta, monto, origen });
    // el link de producción solo existe en la red real: en la demo el servidor entrega únicamente el de prueba
    if (!ES_MAINNET && !pref.sandbox_init_point) return error(res, 503, "El checkout de prueba no está disponible.");
    return json(res, 201, ES_MAINNET ? { url: pref.init_point } : { urlPrueba: pref.sandbox_init_point });
  } catch (e) {
    return errorDe(res, e, "mercadopago");
  }
}
