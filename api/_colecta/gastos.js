// POST /api/colectas/:id/gastos { monto, proveedorCuit, cae, invoiceHash, clave, detalle?, proveedor?, pagoRef?, direccion?, localidad? }
// → evento EXPENSE. pagoRef es el número de la operación de Mercado Pago con la que se pagó (para juntar el pago con su
// factura). direccion/localidad ubican el comercio en el mapa (ver _geo.js: la dirección solo si es persona jurídica).
// detalle (qué se compró) y proveedor (razón social) son opcionales y públicos: nunca datos de personas.
// Solo el organizador: la clave que recibió al crear la colecta tiene que coincidir con el orgKeyHash del registro.
// El PDF nunca llega acá: el navegador calcula su SHA-256 y manda solo el hash.
import { publicarEvento } from "../../hedera/colectas.js";
import { json, error, leerCuerpo, buscarColecta, esperarEnMirror, rechazoOrganizador } from "../_comun.js";
import { ubicarComercio } from "../_geo.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const b = await leerCuerpo(req);
    const rechazo = rechazoOrganizador(colecta, b.clave);
    if (rechazo) return error(res, ...rechazo);
    const monto = Math.round(Number(b.monto));
    const cuit = String(b.proveedorCuit || "").replace(/\D/g, "");
    const cae = String(b.cae || "").replace(/\D/g, "");
    const invoiceHash = String(b.invoiceHash || "").toLowerCase();
    if (!(monto > 0)) return error(res, 400, "El monto tiene que ser mayor que cero.");
    if (cuit.length !== 11) return error(res, 400, "El CUIT tiene que tener 11 dígitos.");
    if (cae.length !== 14) return error(res, 400, "El CAE tiene que tener 14 dígitos.");
    if (!/^[a-f0-9]{64}$/.test(invoiceHash)) return error(res, 400, "Falta el hash SHA-256 de la factura.");
    const corto = (v, max) => String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
    const detalle = corto(b.detalle, 90), proveedor = corto(b.proveedor, 60);
    const pagoRef = String(b.pagoRef || "").replace(/\D/g, "").slice(0, 20);
    const lugar = await ubicarComercio({ cuit, direccion: b.direccion, localidad: b.localidad });
    const evento = {
      type: "EXPENSE",
      campaignId: colecta.campaignId,
      amount: monto,
      currency: "ARS",
      supplierCuit: `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`,
      cae,
      invoiceHash,
      ...(detalle && { detail: detalle }),
      ...(proveedor && { supplierName: proveedor }),
      ...(pagoRef && { paymentRef: pagoRef }),
      ...(lugar.direccion && { address: lugar.direccion }),
      ...(lugar.localidad && { locality: lugar.localidad }),
      ...(lugar.geo && { geo: lugar.geo }),
      timestamp: new Date().toISOString(),
    };
    const reg = await publicarEvento(colecta.topicId, evento);
    await esperarEnMirror(colecta.topicId, reg.secuencia);
    return json(res, 201, { secuencia: reg.secuencia, hashscan: reg.hashscan });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
