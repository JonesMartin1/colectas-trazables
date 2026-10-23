// Piezas compartidas por las funciones de la API (el guion bajo evita que Vercel la publique como ruta).
import crypto from "node:crypto";
import { listarColectas, leerEventos, sha256 } from "../hedera/colectas.js";
import { leerJson, ESTADO, DECIMALES, MIRROR, mirrorSiguiente, hashscan } from "../hedera/lib.js";
import { EXCHANGES } from "./_exchanges.js";

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

// en mainnet no hay token de prueba: el USDC tiene que venir de USDC_TOKEN_ID o de estado-mainnet.json
const TOKEN_USDC = () => process.env.USDC_TOKEN_ID ?? leerJson(ESTADO)?.tokenId;

/**
 * Salidas de USDC de la billetera de la colecta, leídas del Mirror Node: cada retiro (por ejemplo, a un exchange
 * para pasarlo a pesos) queda en Hedera aunque el organizador no lo cargue. Solo tiene sentido si la billetera es
 * exclusiva de la colecta: si la comparten varias, no se puede atribuir y se devuelve null.
 */
export async function leerSalidas(cuenta) {
  const token = TOKEN_USDC();
  if (!/^0\.0\.\d+$/.test(String(cuenta || "")) || !token) return [];
  const salidas = [];
  // del más nuevo al más viejo: con order=asc el Mirror Node arranca desde el inicio de la red y da páginas vacías
  let url = `${MIRROR}/transactions?account.id=${cuenta}&order=desc&limit=100`;
  for (let pagina = 0; url && pagina < 5; pagina++) {
    const d = await fetch(url).then((r) => (r.ok ? r.json() : { transactions: [] }));
    for (const tx of d.transactions || []) {
      if (tx.result !== "SUCCESS") continue;
      const movs = (tx.token_transfers || []).filter((t) => t.token_id === token);
      const sale = movs.find((t) => t.account === cuenta && t.amount < 0);
      if (!sale) continue;
      const destino = movs.find((t) => t.amount > 0)?.account || null;
      const usdc = -sale.amount / 10 ** DECIMALES;
      const memo = tx.memo_base64 ? Buffer.from(tx.memo_base64, "base64").toString("utf8") : "";
      salidas.push({
        fecha: new Date(Number(tx.consensus_timestamp.split(".")[0]) * 1000).toISOString(),
        usdc, monto: Math.round(usdc * COTIZACION),
        destino, destinoNombre: EXCHANGES[destino] || null,
        memo, hashscan: hashscan("transaction", tx.transaction_id), // el Mirror Node ya lo da como 0.0.x-seg-nanos
      });
    }
    // una página incompleta es la última: no seguir pidiendo páginas vacías
    url = d.links?.next && (d.transactions || []).length === 100 ? mirrorSiguiente(d.links.next) : null;
  }
  return salidas.reverse();
}

/** La colecta con sus donaciones, gastos y totales, todo leído del Mirror Node. */
export async function armarColecta(colecta, todas = null) {
  // salidas de la billetera: solo si es exclusiva de esta colecta (las de demo viejas comparten una)
  const lista = todas ?? (await listarColectas());
  const compartida = lista.filter((c) => c.beneficiarioCuenta === colecta.beneficiarioCuenta).length > 1;
  // eventos y salidas en paralelo: son dos lecturas independientes del Mirror Node
  const [eventos, salidas] = await Promise.all([
    leerEventos(colecta.topicId),
    compartida ? null : leerSalidas(colecta.beneficiarioCuenta).catch(() => []),
  ]);
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
  const retirado = (salidas || []).reduce((s, x) => s + x.monto, 0);
  return {
    colecta: {
      id: colecta.campaignId,
      titulo: colecta.titulo,
      descripcion: colecta.descripcion,
      meta: colecta.meta,
      beneficiarioCuenta: colecta.beneficiarioCuenta,
      organizador: colecta.organizador || null,
      topicId: colecta.topicId,
      hashscan: hashscan("topic", colecta.topicId),
      usdcToken: TOKEN_USDC() || null, // para donar desde una billetera propia (web/billetera.js)
    },
    donaciones,
    gastos,
    entregas,
    conversiones,
    salidas,
    billeteraCompartida: compartida,
    totales: { recaudado, gastado, saldo: recaudado - gastado, retirado, sinRendir: Math.max(0, retirado - gastado) },
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
