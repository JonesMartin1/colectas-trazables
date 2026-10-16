// POST /api/colectas/:id/donaciones { monto } → donación de demo en USDC de testnet al beneficiario,
// más el evento DONATION en el topic de la colecta. Al donante se le devuelve un comprobante;
// en el registro queda solo su hash.
import crypto from "node:crypto";
import { donarUSDC, publicarEvento } from "../../../hedera/colectas.js";
import { json, error, leerCuerpo, buscarColecta, sha256, COTIZACION, esperarEnMirror } from "../../_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const { monto: m } = await leerCuerpo(req);
    const monto = Math.round(Number(m));
    if (!(monto > 0) || monto > 10_000_000) return error(res, 400, "El monto tiene que estar entre $1 y $10.000.000.");
    const usdc = Math.max(0.01, Math.round((monto / COTIZACION) * 100) / 100);
    let pago;
    try {
      pago = await donarUSDC({ beneficiario: colecta.beneficiarioCuenta, monto: usdc });
    } catch (e) {
      const asociado = /TOKEN_NOT_ASSOCIATED/.test(e.message);
      return error(res, 400, asociado ? "La cuenta destinataria todavía no aceptó el token USDC de la demo." : `No se pudo transferir: ${e.message}`);
    }
    const comprobante = `${pago.txId}.${crypto.randomBytes(4).toString("hex")}`;
    const evento = {
      type: "DONATION",
      campaignId: colecta.campaignId,
      amount: monto,
      currency: "ARS",
      method: "usdc",
      usdc,
      externalRefHash: sha256(comprobante),
      txHashscan: pago.hashscan,
      timestamp: new Date().toISOString(),
    };
    const reg = await publicarEvento(colecta.topicId, evento);
    await esperarEnMirror(colecta.topicId, reg.secuencia);
    return json(res, 201, { comprobante, secuencia: reg.secuencia, hashscan: pago.hashscan, registro: reg.hashscan, usdc });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
