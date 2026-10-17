// POST /api/webhooks/mercadopago → aviso de Mercado Pago. Solo trae el id del pago: el pago se busca en la API de MP
// y se registra la DONATION solo si está aprobado, es de una colecta nuestra y no se registró antes.
// Como no se confía en el aviso, uno falso no puede inventar donaciones.
// Siempre responde 200 (si no, MP reintenta); lo que no corresponde se ignora.
import { publicarEvento, leerEventos } from "../../hedera/colectas.js";
import { json, leerCuerpo, buscarColecta, esperarEnMirror } from "../_comun.js";
import { leerPago, hashPagoMP } from "../_mercadopago.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });
  try {
    const b = await leerCuerpo(req).catch(() => ({}));
    const tipo = b.type || b.topic || req.query.type || req.query.topic;
    const paymentId = String(b.data?.id || req.query["data.id"] || req.query.id || "");
    if (tipo !== "payment" || !/^\d+$/.test(paymentId)) return json(res, 200, { ignorado: "no es un pago" });

    const pago = await leerPago(paymentId);
    if (pago.status !== "approved") return json(res, 200, { ignorado: `pago ${pago.status}` });
    const colecta = await buscarColecta(pago.external_reference);
    if (!colecta) return json(res, 200, { ignorado: "colecta desconocida" });

    const externalRefHash = hashPagoMP(paymentId);
    const yaEsta = (await leerEventos(colecta.topicId)).some((e) => e.evento.type === "DONATION" && e.evento.externalRefHash === externalRefHash);
    if (yaEsta) return json(res, 200, { ignorado: "ya registrado" });

    const reg = await publicarEvento(colecta.topicId, {
      type: "DONATION",
      campaignId: colecta.campaignId,
      amount: Math.round(Number(pago.transaction_amount)),
      currency: pago.currency_id || "ARS",
      method: "mercadopago",
      externalRefHash,
      timestamp: new Date().toISOString(),
    });
    await esperarEnMirror(colecta.topicId, reg.secuencia);
    return json(res, 200, { registrado: reg.secuencia, hashscan: reg.hashscan });
  } catch (e) {
    console.error("webhook de Mercado Pago:", e.message);
    return json(res, 200, { error: e.message });
  }
}
