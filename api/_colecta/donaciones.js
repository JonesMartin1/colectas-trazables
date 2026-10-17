// POST /api/colectas/:id/donaciones { txId } → registra una donación que YA se pagó.
// No se acepta un monto a ciegas: la transferencia se busca en el Mirror Node y tiene que haber salido bien,
// acreditado USDC al beneficiario, llevar el memo de esta colecta y no estar registrada todavía.
// El monto sale de la red, no del cliente. Al donante se le devuelve un comprobante; en el registro queda solo su hash.
import crypto from "node:crypto";
import { leerEventos, publicarEvento, verificarTransferencia } from "../../hedera/colectas.js";
import { idTx } from "../../hedera/lib.js";
import { json, error, leerCuerpo, buscarColecta, sha256, COTIZACION, esperarEnMirror } from "../_comun.js";

const TX_ID = /^0\.0\.\d+-\d+-\d+$/;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const { txId: crudo } = await leerCuerpo(req);
    const txId = idTx(String(crudo || "").trim()); // acepta 0.0.x@seg.nanos o 0.0.x-seg-nanos
    if (!TX_ID.test(txId)) return error(res, 400, "Falta el identificador de la transacción (0.0.x-segundos-nanos).");
    const yaEsta = (await leerEventos(colecta.topicId)).some(
      ({ evento: ev }) => ev.type === "DONATION" && (ev.txId === txId || String(ev.txHashscan || "").endsWith(`/${txId}`))
    );
    if (yaEsta) return error(res, 409, "Esa transferencia ya está registrada en la colecta.");
    const pago = await verificarTransferencia({ txId, beneficiario: colecta.beneficiarioCuenta, campaignId: colecta.campaignId });
    if (pago.error) return error(res, 400, pago.error);
    const comprobante = `${txId}.${crypto.randomBytes(4).toString("hex")}`;
    const evento = {
      type: "DONATION",
      campaignId: colecta.campaignId,
      amount: Math.round(pago.usdc * COTIZACION),
      currency: "ARS",
      method: "usdc",
      usdc: pago.usdc,
      txId,
      externalRefHash: sha256(comprobante),
      txHashscan: pago.hashscan,
      timestamp: new Date().toISOString(),
    };
    const reg = await publicarEvento(colecta.topicId, evento);
    await esperarEnMirror(colecta.topicId, reg.secuencia);
    return json(res, 201, { comprobante, secuencia: reg.secuencia, hashscan: pago.hashscan, registro: reg.hashscan, usdc: pago.usdc });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
