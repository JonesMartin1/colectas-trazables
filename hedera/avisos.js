// Canal de avisos oficiales (idea de Henry Tong, 16/10): un topic de HCS donde solo el organismo emisor
// (Defensa Civil) puede publicar, porque la clave de envío es la suya. Cada parte queda con fecha de consenso
// y nadie puede cambiarlo después: si una cifra oficial cambia, el cambio queda a la vista.
// En la demo, la clave de Defensa Civil es la de prueba de hedera/.firmantes.json.
import { PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { clienteOperador, leerJson, hashscan, idTx } from "./lib.js";
import { leerEventos } from "./colectas.js";
import { FIRMANTES_URL } from "./alias.js";

const EMISOR = "defensa-civil";
let red;
const conexion = () => (red ??= clienteOperador());
export const cerrar = () => red?.client.close();

function claveEmisor() {
  const claves = leerJson(FIRMANTES_URL);
  if (!claves?.[EMISOR]) throw new Error("Falta la clave de prueba de Defensa Civil (hedera/.firmantes.json)");
  return PrivateKey.fromStringDer(claves[EMISOR]);
}

/** Crea el canal: la clave de envío es solo la del emisor. */
export async function crearCanalAvisos() {
  const { client } = conexion();
  const tx = await new TopicCreateTransaction()
    .setTopicMemo("Avisos oficiales de emergencia - Defensa Civil (demo) - Colectas Trazables")
    .setSubmitKey(claveEmisor().publicKey)
    .execute(client);
  const topicId = (await tx.getReceipt(client)).topicId.toString();
  return { topicId, hashscan: hashscan("topic", topicId) };
}

/** Publica un aviso firmado por el emisor. */
export async function publicarAviso(topicId, aviso) {
  const { client } = conexion();
  const evento = { type: "AVISO", emisor: "Defensa Civil (demo)", ...aviso, timestamp: new Date().toISOString() };
  const msg = JSON.stringify(evento);
  if (Buffer.byteLength(msg) > 1024) throw new Error("El aviso supera los 1024 bytes de un mensaje de HCS");
  const tx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(msg).freezeWith(client);
  await tx.sign(claveEmisor());
  const r = await tx.execute(client);
  const recibo = await r.getReceipt(client);
  const txId = idTx(r.transactionId);
  return { secuencia: Number(recibo.topicSequenceNumber), txId, hashscan: hashscan("transaction", txId) };
}

/** Todos los avisos, del más nuevo al más viejo, leídos del Mirror Node. */
export async function listarAvisos(topicId) {
  return (await leerEventos(topicId))
    .filter((e) => e.evento.type === "AVISO")
    .map((e) => ({ ...e.evento, secuencia: e.secuencia, fecha: e.fecha, hashscan: e.hashscan }))
    .reverse();
}
