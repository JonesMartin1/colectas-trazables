// Mercado Pago: preferencia de Checkout Pro y lectura de un pago. Sin SDK, con fetch.
// La plata la cobra la cuenta de MP de la organización (MP_ACCESS_TOKEN es su token de prueba);
// en producción, cada organización conecta la suya por OAuth. Nunca pasa por la plataforma.
import { sha256 } from "./_comun.js";

const API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw Object.assign(new Error("Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)."), { status: 503 });
  return t;
}

async function llamar(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, { ...opciones, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...opciones.headers } });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago respondió ${r.status}: ${datos.message || "error"}`);
  return datos;
}

/** El comprobante del donante es el número de pago; en el registro queda solo su hash. */
export const comprobanteMP = (paymentId) => `mp-${paymentId}`;
export const hashPagoMP = (paymentId) => sha256(comprobanteMP(paymentId));

/** Preferencia de pago para una colecta: external_reference ata el pago a la colecta. */
export function crearPreferencia({ colecta, monto, origen }) {
  const vuelta = `${origen}/colecta.html?id=${encodeURIComponent(colecta.campaignId)}`;
  const publico = origen.startsWith("https://");
  return llamar("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [{ title: `Donación: ${colecta.titulo}`.slice(0, 120), quantity: 1, unit_price: monto, currency_id: "ARS" }],
      external_reference: colecta.campaignId,
      // MP solo acepta avisos y vuelta automática a URLs públicas https (en local no hay)
      ...(publico ? { notification_url: `${origen}/api/webhooks/mercadopago`, auto_return: "approved" } : {}),
      back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
    }),
  });
}

/** El pago leído de la API de MP: lo único en lo que confiamos (nunca en el cuerpo del aviso). */
export const leerPago = (paymentId) => llamar(`/v1/payments/${encodeURIComponent(paymentId)}`);

/**
 * Pagos aprobados de los últimos `dias` días, para la conciliación: los que el aviso (webhook) no llegó a registrar.
 * Una sola búsqueda paginada, sin filtrar por colecta: después se agrupan por external_reference.
 */
export async function pagosAprobadosRecientes(dias = 7) {
  const desde = new Date(Date.now() - dias * 864e5).toISOString().replace("Z", "-00:00");
  const hasta = new Date().toISOString().replace("Z", "-00:00");
  const todos = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const q = new URLSearchParams({ status: "approved", range: "date_created", begin_date: desde, end_date: hasta, sort: "date_created", criteria: "asc", limit: "100", offset: String(offset) });
    const d = await llamar(`/v1/payments/search?${q}`);
    todos.push(...(d.results || []));
    if ((d.results || []).length < 100) break;
  }
  return todos;
}

