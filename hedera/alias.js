// Registro de alias oficiales: un topic de HCS cuya clave de envío es una KeyList con umbral 2 de 4
// (Defensa Civil, Desarrollo Social, Cáritas, Cruz Roja). Ninguna institución sola puede agregar un alias.
// En la demo las 4 claves son de prueba y viven en hedera/.firmantes.json (fuera de git).
import { KeyList, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { clienteOperador, leerJson, hashscan, idTx } from "./lib.js";
import { leerEventos } from "./colectas.js";

export const FIRMANTES_URL = new URL("./.firmantes.json", import.meta.url);
export const FIRMANTES = [
  { id: "defensa-civil", nombre: "Defensa Civil" },
  { id: "desarrollo-social", nombre: "Desarrollo Social" },
  { id: "caritas", nombre: "Cáritas" },
  { id: "cruz-roja", nombre: "Cruz Roja" },
];
export const UMBRAL = 2;

let red;
const conexion = () => (red ??= clienteOperador());
export const cerrar = () => red?.client.close();

/** Normaliza un alias para compararlo: minúsculas, sin espacios ni acentos. */
export const normalizar = (a) => String(a || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "").trim();

/** Crea el topic de alias con la KeyList 2 de 4 como clave de envío. */
export async function crearTopicAlias(clavesPublicas) {
  const { client } = conexion();
  const llave = KeyList.of(...clavesPublicas).setThreshold(UMBRAL);
  const tx = await new TopicCreateTransaction()
    .setTopicMemo("Registro de alias oficiales (2 de 4) - Colectas Trazables")
    .setSubmitKey(llave)
    .execute(client);
  const topicId = (await tx.getReceipt(client)).topicId.toString();
  return { topicId, hashscan: hashscan("topic", topicId) };
}

/** Publica un alias firmado por las instituciones indicadas (sus ids). Con menos de 2 firmas la red lo rechaza. */
export async function publicarAlias(topicId, { alias, titular, cuit, nota }, firmanteIds) {
  const claves = leerJson(FIRMANTES_URL);
  if (!claves) throw new Error("Faltan las claves de los firmantes (hedera/.firmantes.json)");
  const { client } = conexion();
  const firmantes = firmanteIds.map((id) => {
    const f = FIRMANTES.find((x) => x.id === id);
    if (!f || !claves[id]) throw new Error(`Firmante desconocido: ${id}`);
    return { ...f, clave: PrivateKey.fromStringDer(claves[id]) };
  });
  const evento = {
    type: "ALIAS",
    alias: normalizar(alias),
    titular,
    cuit,
    nota: nota || undefined,
    firmantes: firmantes.map((f) => f.nombre),
    timestamp: new Date().toISOString(),
  };
  const tx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(JSON.stringify(evento)).freezeWith(client);
  for (const f of firmantes) await tx.sign(f.clave);
  const r = await tx.execute(client);
  const recibo = await r.getReceipt(client);
  const txId = idTx(r.transactionId);
  return { secuencia: Number(recibo.topicSequenceNumber), txId, hashscan: hashscan("transaction", txId) };
}

/** Distancia de edición, para avisar cuando un alias se parece a uno oficial. */
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Consulta un alias contra el registro (leído del Mirror Node). */
export async function consultarAlias(topicId, alias) {
  const buscado = normalizar(alias);
  const oficiales = new Map();
  for (const e of await leerEventos(topicId)) {
    if (e.evento.type === "ALIAS") oficiales.set(e.evento.alias, { ...e.evento, secuencia: e.secuencia, fecha: e.fecha, hashscan: e.hashscan });
    if (e.evento.type === "ALIAS_BAJA") oficiales.delete(e.evento.alias);
  }
  const hit = oficiales.get(buscado);
  if (hit) return { estado: "oficial", alias: buscado, ...hit };
  const parecidos = [...oficiales.values()]
    .map((o) => ({ alias: o.alias, titular: o.titular, d: distancia(buscado, o.alias) }))
    .filter((o) => o.d > 0 && o.d <= Math.max(2, Math.floor(o.alias.length / 6)))
    .sort((a, b) => a.d - b.d)
    .map(({ alias: a, titular }) => ({ alias: a, titular }));
  return { estado: parecidos.length ? "parecido" : "no_registrado", alias: buscado, parecidos };
}
