// Piezas compartidas por las funciones de la API (el guion bajo evita que Vercel la publique como ruta).
import crypto from "node:crypto";
import { listarColectas, leerEventos, sha256 } from "../hedera/colectas.js";

export { sha256 };

/** Pesos por dólar para la donación de demo en USDC. Es un valor de demo, no una cotización real. */
export const COTIZACION = Number(process.env.COTIZACION_ARS_USD) || 1400;

export function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function error(res, status, mensaje) {
  json(res, status, { error: mensaje });
}

export async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const partes = [];
  for await (const p of req) partes.push(p);
  const texto = Buffer.concat(partes).toString("utf8");
  return texto ? JSON.parse(texto) : {};
}

/** Identificador legible y único: "ayuda-para-itati-mg2k9x". */
export function crearId(titulo) {
  const base = String(titulo)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "colecta";
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

export async function buscarColecta(id) {
  const colectas = await listarColectas();
  return colectas.filter((c) => c.campaignId === id).pop() ?? null;
}

/** La colecta con sus donaciones, gastos y totales, todo leído del Mirror Node. */
export async function armarColecta(colecta) {
  const eventos = await leerEventos(colecta.topicId);
  const donaciones = [];
  const gastos = [];
  const entregas = [];
  const conversiones = [];
  for (const e of eventos) {
    const ev = e.evento;
    const base = { secuencia: e.secuencia, fecha: e.fecha, monto: Number(ev.amount) || 0, hashscan: ev.txHashscan || e.hashscan };
    if (ev.type === "DONATION") donaciones.push({ ...base, metodo: ev.method, externalRefHash: ev.externalRefHash, verificada: Boolean(ev.txId) });
    if (ev.type === "EXPENSE") gastos.push({ ...base, proveedorCuit: ev.supplierCuit, cae: ev.cae, invoiceHash: ev.invoiceHash, detalle: ev.detail, proveedor: ev.supplierName });
    if (ev.type === "CONVERSION") conversiones.push({ secuencia: e.secuencia, fecha: e.fecha, hashscan: ev.txHashscan || e.hashscan, ars: ev.ars, usdc: ev.usdc, tipoDeCambio: ev.rate });
    if (ev.type === "DELIVERY") entregas.push({ secuencia: e.secuencia, fecha: e.fecha, hashscan: e.hashscan, item: ev.item, cantidad: ev.quantity, lugar: ev.place, fotoHash: ev.photoHash });
  }
  const recaudado = donaciones.reduce((s, d) => s + d.monto, 0);
  const gastado = gastos.reduce((s, g) => s + g.monto, 0);
  return {
    colecta: {
      id: colecta.campaignId,
      titulo: colecta.titulo,
      descripcion: colecta.descripcion,
      meta: colecta.meta,
      beneficiarioCuenta: colecta.beneficiarioCuenta,
      organizador: colecta.organizador || null,
      topicId: colecta.topicId,
      hashscan: `https://hashscan.io/testnet/topic/${colecta.topicId}`,
    },
    donaciones,
    gastos,
    entregas,
    conversiones,
    totales: { recaudado, gastado, saldo: recaudado - gastado },
  };
}

/** Espera a que el Mirror Node muestre el mensaje recién publicado (tarda unos segundos). */
export async function esperarEnMirror(topicId, secuencia, maxSeg = 12) {
  for (let i = 0; i < maxSeg; i++) {
    const eventos = await leerEventos(topicId).catch(() => []);
    if (eventos.some((e) => e.secuencia >= secuencia)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/**
 * Solo el organizador escribe gastos y entregas: la clave que recibió al crear la colecta tiene que coincidir
 * con el orgKeyHash del registro (comparación en tiempo constante). Devuelve null si está bien, o [status, mensaje].
 */
export function rechazoOrganizador(colecta, clave) {
  if (!/^[a-f0-9]{64}$/.test(String(colecta.orgKeyHash || ""))) return [403, "Esta colecta se creó sin clave de organizador y no admite registros nuevos."];
  const ok = clave && crypto.timingSafeEqual(Buffer.from(sha256(String(clave)), "hex"), Buffer.from(colecta.orgKeyHash, "hex"));
  return ok ? null : [401, "La clave del organizador no es correcta."];
}

export const esCuenta = (s) => /^0\.0\.\d+$/.test(String(s || ""));
