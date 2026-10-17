// POST /api/colectas/:id/conversiones { txId, ars, clave } → evento CONVERSION: la organización convirtió pesos a USDC
// en un PSAV registrado y el USDC llegó a su cuenta de Hedera. La compra la hace la organización, nunca la plataforma.
// Solo el organizador. La transferencia se busca en el Mirror Node: el USDC sale de la red, no del cliente.
// No se exige el memo de la colecta, porque un PSAV en general no permite ponerlo.
import { leerEventos, publicarEvento, verificarTransferencia } from "../../hedera/colectas.js";
import { idTx } from "../../hedera/lib.js";
import { json, error, leerCuerpo, buscarColecta, esperarEnMirror, rechazoOrganizador } from "../_comun.js";

const TX_ID = /^0\.0\.\d+-\d+-\d+$/;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const b = await leerCuerpo(req);
    const rechazo = rechazoOrganizador(colecta, b.clave);
    if (rechazo) return error(res, ...rechazo);
    const txId = idTx(String(b.txId || "").trim());
    const ars = Math.round(Number(b.ars));
    if (!TX_ID.test(txId)) return error(res, 400, "Falta el identificador de la transacción (0.0.x-segundos-nanos).");
    if (!(ars > 0)) return error(res, 400, "Indicá cuántos pesos se convirtieron.");
    // una transferencia cuenta una sola vez: ni dos conversiones ni conversión y donación a la vez
    const yaEsta = (await leerEventos(colecta.topicId)).some(
      ({ evento: ev }) => ev.txId === txId || String(ev.txHashscan || "").endsWith(`/${txId}`)
    );
    if (yaEsta) return error(res, 409, "Esa transferencia ya está registrada en la colecta.");
    const usdc = await verificarTransferencia({ txId, beneficiario: colecta.beneficiarioCuenta, campaignId: colecta.campaignId, exigirMemo: false });
    if (usdc.error) return error(res, 400, usdc.error);
    const evento = {
      type: "CONVERSION",
      campaignId: colecta.campaignId,
      ars,
      usdc: usdc.usdc,
      rate: Math.round((ars / usdc.usdc) * 100) / 100,
      txId,
      txHashscan: usdc.hashscan,
      timestamp: new Date().toISOString(),
    };
    const reg = await publicarEvento(colecta.topicId, evento);
    await esperarEnMirror(colecta.topicId, reg.secuencia);
    return json(res, 201, { secuencia: reg.secuencia, hashscan: reg.hashscan, usdc: usdc.usdc, tipoDeCambio: evento.rate });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
