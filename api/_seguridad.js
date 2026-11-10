// Controles de seguridad compartidos por la API (el guion bajo evita que Vercel la publique como ruta).
// Qué control de ISO/IEC 27002:2022 cubre cada pieza está en docs/SEGURIDAD.md.
import crypto from "node:crypto";
import { DESTACADAS } from "./_destacadas.js";

const sha256 = (texto) => crypto.createHash("sha256").update(String(texto)).digest("hex");

// ---------------------------------------------------------------- límite de pedidos (8.6, 8.16)
// Ventana fija en memoria, por función y por IP. En Vercel cada instancia tiene su propia memoria: frena ráfagas
// contra una instancia tibia, pero NO reemplaza el límite del Firewall de Vercel (ver docs/SEGURIDAD.md).
const ventanas = new Map();
const MAX_ENTRADAS = 5000;

export function ipDe(req) {
  const xff = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return String(req.headers?.["x-real-ip"] || xff || req.socket?.remoteAddress || "desconocida");
}

/** Cuenta un pedido. Devuelve 0 si pasa, o los segundos que faltan para volver a intentar. */
export function contar(clave, max, ventanaSeg, ahora = Date.now()) {
  let v = ventanas.get(clave);
  if (!v || ahora >= v.hasta) {
    if (ventanas.size >= MAX_ENTRADAS) for (const [k, x] of ventanas) if (ahora >= x.hasta) ventanas.delete(k);
    if (ventanas.size >= MAX_ENTRADAS) ventanas.clear(); // bajo ataque con miles de IPs: empezar de cero antes que crecer sin fin
    v = { n: 0, hasta: ahora + ventanaSeg * 1000 };
    ventanas.set(clave, v);
  }
  v.n += 1;
  return v.n > max ? Math.max(1, Math.ceil((v.hasta - ahora) / 1000)) : 0;
}

/**
 * Límite por IP para una función. Si se pasó, responde 429 y devuelve true (el handler tiene que cortar).
 * `global` agrega un tope sin mirar la IP: acota el gasto de HBAR aunque el ataque venga de muchas direcciones.
 */
export function limitar(req, res, nombre, { max, ventanaSeg = 60, global = 0 }) {
  const espera = contar(`${nombre}:${ipDe(req)}`, max, ventanaSeg) || (global ? contar(`${nombre}:*`, global, 3600) : 0);
  if (!espera) return false;
  console.warn(`[seguridad] límite de pedidos en ${nombre} (ip ${sha256(ipDe(req)).slice(0, 12)})`); // la IP no va al log: solo su huella
  res.setHeader("Retry-After", String(espera));
  res.status(429).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Demasiados pedidos seguidos. Probá de nuevo en un rato." }));
  return true;
}

// ---------------------------------------------------------------- errores sin detalle interno (8.28)
/**
 * Los errores que armamos nosotros (con `status` 4xx/503) llevan un mensaje pensado para la persona. Cualquier otro
 * es interno: va al log del servidor y afuera sale un texto genérico, sin rutas, IDs ni mensajes de librerías.
 */
export function mensajeDeError(e, donde = "api") {
  const status = Number(e?.status);
  if (status >= 400 && status < 500 || status === 503) return [status, e.message];
  if (e instanceof SyntaxError) return [400, "El cuerpo del pedido no es un JSON válido."];
  console.error(`[error] ${donde}:`, e?.message);
  return [500, "No pudimos completar la operación. Probá de nuevo en unos minutos."];
}

// ---------------------------------------------------------------- alta de colectas con código (5.15, 5.16, 8.3, 8.5)
// El código de alta se le entrega a la organización después de validarla (CUIT, IGPJ, titular de la cuenta).
// En el servidor solo viven sus hashes (CODIGOS_ALTA_HASH, separados por coma): `npm run codigo-alta` genera uno.
const hashesDeAlta = () => String(process.env.CODIGOS_ALTA_HASH || "").split(",").map((h) => h.trim().toLowerCase()).filter((h) => /^[a-f0-9]{64}$/.test(h));

export const altaConfigurada = () => hashesDeAlta().length > 0;

/** Si el código es uno de los habilitados, devuelve su huella corta (queda en el registro: un código, una colecta). */
export function huellaDeAlta(codigo) {
  const texto = String(codigo || "").trim();
  if (texto.length < 16 || texto.length > 128) return null;
  const propio = Buffer.from(sha256(texto), "hex");
  let ok = false;
  for (const h of hashesDeAlta()) if (crypto.timingSafeEqual(propio, Buffer.from(h, "hex"))) ok = true; // sin cortar: tiempo constante
  return ok ? propio.toString("hex").slice(0, 16) : null;
}

// ---------------------------------------------------------------- colectas ocultas y verificadas
// El registro de Hedera no se puede borrar: lo que no corresponde mostrar se deja de servir desde la API.
// Pruebas de la revisión de seguridad del 10/11/2026 (creadas sin permiso de alta, con cuenta 0.0.12345).
export const OCULTAS = new Set([
  "prueba-de-seguridad-pentest-borrar-fbbace",
  "prueba-mass-assignment-borrar-be503e",
  "xss-img-src-x-onerror-alert-document-dom-dc22a6",
  "pentest-poc-emergencia-litoral-no-donar-3733ec",
  "nico-y-facu-arreglen-poeee-su-app-059ffc",
]);

const DE_PORTADA = new Set(DESTACADAS.map((d) => d.campaignId));
// Colectas anteriores al código de alta que ya se validaron a mano (ids separados por coma).
const validadasAMano = () => new Set(String(process.env.COLECTAS_VERIFICADAS || "").split(",").map((s) => s.trim()).filter(Boolean));

/**
 * Verificada = la organización fue validada antes del alta. Lo dice el registro (`verificada: true`, que solo escribe
 * el servidor cuando el alta vino con un código válido), la portada de la demo o la lista validada a mano.
 * Una colecta sin verificar no lleva sello ni recibe pagos de Mercado Pago.
 */
export const esVerificada = (c) => c?.verificada === true || DE_PORTADA.has(c?.campaignId) || validadasAMano().has(c?.campaignId);
