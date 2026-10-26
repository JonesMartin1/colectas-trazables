// POST /api/webhooks/mercadopago → aviso de Mercado Pago. Solo trae el id del pago: el pago se busca en la API de MP
// y se registra la DONATION solo si está aprobado, es de una colecta nuestra y no se registró antes.
// Como no se confía en el aviso, uno falso no puede inventar donaciones.
// Siempre responde 200 (si no, MP reintenta); lo que no corresponde se ignora.
//
// GET /api/webhooks/mercadopago?tarea=conciliar → conciliación (la corre el cron diario de vercel.json): busca en MP
// los pagos aprobados de los últimos 7 días y registra los que el aviso no registró (sitio caído, aviso perdido).
// Solo con `Authorization: Bearer <CRON_SECRET>`, que Vercel manda solo en los cron; sin CRON_SECRET no corre.
import { publicarEvento, leerEventos, listarColectas } from "../../hedera/colectas.js";
import { json, leerCuerpo, buscarColecta, esperarEnMirror } from "../_comun.js";
import { leerPago, hashPagoMP, pagosAprobadosRecientes } from "../_mercadopago.js";

/** Registra un pago aprobado de MP como DONATION, si no estaba. `eventos` se puede pasar para no releer el topic. */
async function registrarPago(pago, colecta, eventos = null) {
  const externalRefHash = hashPagoMP(pago.id);
  const lista = eventos ?? (await leerEventos(colecta.topicId));
  if (lista.some((e) => e.evento.type === "DONATION" && e.evento.externalRefHash === externalRefHash)) return { ignorado: "ya registrado" };
  const reg = await publicarEvento(colecta.topicId, {
    type: "DONATION",
    campaignId: colecta.campaignId,
    amount: Math.round(Number(pago.transaction_amount)),
    currency: pago.currency_id || "ARS",
    method: "mercadopago",
    externalRefHash,
    timestamp: new Date().toISOString(),
  });
  return { registrado: reg.secuencia, hashscan: reg.hashscan, topicId: colecta.topicId, secuencia: reg.secuencia };
}

async function conciliar(req, res) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return json(res, 503, { error: "Falta CRON_SECRET: la conciliación no corre." });
  if (req.headers.authorization !== `Bearer ${secreto}`) return json(res, 401, { error: "No autorizado" });
  const pagos = await pagosAprobadosRecientes(7);
  const colectas = new Map((await listarColectas()).map((c) => [c.campaignId, c]));
  const porColecta = new Map();
  for (const p of pagos) {
    if (!colectas.has(p.external_reference)) continue;
    porColecta.set(p.external_reference, [...(porColecta.get(p.external_reference) || []), p]);
  }
  const registrados = [];
  for (const [id, lista] of porColecta) {
    const colecta = colectas.get(id);
    const eventos = await leerEventos(colecta.topicId);
    for (const p of lista) {
      const r = await registrarPago(p, colecta, eventos);
      if (r.registrado) registrados.push({ colecta: id, pago: `mp-${p.id}`, monto: p.transaction_amount, hashscan: r.hashscan });
    }
  }
  return json(res, 200, { revisados: pagos.length, registrados });
}

export default async function handler(req, res) {
  if (req.query?.tarea === "conciliar") {
    try { return await conciliar(req, res); } catch (e) { return json(res, 500, { error: e.message }); }
  }
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

    const r = await registrarPago(pago, colecta);
    if (r.registrado) await esperarEnMirror(r.topicId, r.secuencia);
    return json(res, 200, r.registrado ? { registrado: r.registrado, hashscan: r.hashscan } : r);
  } catch (e) {
    console.error("webhook de Mercado Pago:", e.message);
    return json(res, 200, { error: e.message });
  }
}
