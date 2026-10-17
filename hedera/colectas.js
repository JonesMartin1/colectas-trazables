// Contrato 1 de docs/TAREAS.md: todo lo que el backend necesita de Hedera.
// Sin base de datos propia: los hechos (colectas, donaciones, gastos) se registran en HCS, que no es una base de datos
// sino un registro de auditoría con orden y fecha de consenso; se consultan desde el Mirror Node.
import crypto from "node:crypto";
import { PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction, TransferTransaction } from "@hashgraph/sdk";
import { clienteOperador, leerJson, ESTADO, CUENTAS, DECIMALES, hashscan, idTx } from "./lib.js";

const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";
const MAX_MENSAJE = 1024; // límite de HCS por mensaje

let red;
const conexion = () => (red ??= clienteOperador());

/** Cierra la conexión con la red (para scripts; en Vercel no hace falta). */
export const cerrar = () => red?.client.close();

export const sha256 = (texto) => crypto.createHash("sha256").update(texto).digest("hex");

/** Config: primero variables de entorno (Vercel), si no, los archivos que deja setup.js (local). */
function config() {
  const estado = leerJson(ESTADO) ?? {};
  const cuentas = leerJson(CUENTAS) ?? {};
  return {
    registro: process.env.REGISTRO_TOPIC_ID ?? estado.registroTopicId,
    token: process.env.USDC_TOKEN_ID ?? estado.tokenId,
    donanteId: process.env.DEMO_DONANTE_ID ?? cuentas.comprador?.id,
    donanteClave: process.env.DEMO_DONANTE_KEY ?? cuentas.comprador?.clave,
  };
}

/** Topic nuevo, sin adminKey (nadie lo puede borrar, ni nosotros) y con submitKey (solo la plataforma escribe). */
export async function crearTopic(memo) {
  const { client, clave } = conexion();
  const tx = await new TopicCreateTransaction()
    .setTopicMemo([...memo].slice(0, 90).join(""))
    .setSubmitKey(clave.publicKey)
    .execute(client);
  const topicId = (await tx.getReceipt(client)).topicId.toString();
  return { topicId, txId: idTx(tx.transactionId), hashscan: hashscan("topic", topicId) };
}

export const crearTopicColecta = ({ campaignId }) => crearTopic(`colecta:${campaignId}`);

export async function publicarEvento(topicId, evento) {
  const mensaje = JSON.stringify(evento);
  if (Buffer.byteLength(mensaje) > MAX_MENSAJE) throw new Error(`Evento de ${Buffer.byteLength(mensaje)} bytes: el máximo es ${MAX_MENSAJE}`);
  const { client } = conexion();
  const tx = await new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(mensaje).execute(client);
  const recibo = await tx.getReceipt(client);
  const txId = idTx(tx.transactionId);
  return { secuencia: Number(recibo.topicSequenceNumber), txId, hashscan: hashscan("transaction", txId) };
}

/** Alta de una colecta: crea su topic y la anota en el topic de registro. */
export async function registrarColecta({ campaignId, titulo, descripcion, meta, beneficiarioCuenta, organizador, orgKeyHash }) {
  const { registro } = config();
  if (!registro) throw new Error("Falta REGISTRO_TOPIC_ID (correr node hedera/crear-registro.js)");
  const datos = { type: "CAMPAIGN", campaignId, titulo, descripcion, meta, beneficiarioCuenta, organizador, orgKeyHash };
  // medir antes de crear el topic: si el alta no entra en un mensaje, no dejar un topic huérfano
  const prueba = JSON.stringify({ ...datos, topicId: "0.0.9999999999", timestamp: new Date().toISOString() });
  if (Buffer.byteLength(prueba) > MAX_MENSAJE) {
    throw Object.assign(new Error("Los textos de la colecta son demasiado largos: acortá el nombre, la descripción o la organización."), { status: 400 });
  }
  const topic = await crearTopicColecta({ campaignId });
  const evento = { ...datos, topicId: topic.topicId, timestamp: new Date().toISOString() };
  const alta = await publicarEvento(registro, evento);
  return { ...topic, registro: { ...alta, topicId: registro } };
}

/** Memo que ata una transferencia a una colecta: sin él, la misma transferencia se podría anotar en varias. */
export const memoColecta = (campaignId) => `colecta:${campaignId}`;

/** Donación en USDC de prueba: la firma la cuenta "donante" de la demo y va directo al beneficiario. */
export async function donarUSDC({ beneficiario, monto, memo }) {
  const { token, donanteId, donanteClave } = config();
  if (!token || !donanteId || !donanteClave) throw new Error("Faltan USDC_TOKEN_ID / DEMO_DONANTE_ID / DEMO_DONANTE_KEY");
  const unidades = Math.round(Number(monto) * 10 ** DECIMALES);
  if (!(unidades > 0)) throw new Error("Monto inválido");
  const { client } = conexion();
  const tx = new TransferTransaction()
    .addTokenTransfer(token, donanteId, -unidades)
    .addTokenTransfer(token, beneficiario, unidades)
    .setTransactionMemo(memo ?? "")
    .freezeWith(client);
  const respuesta = await (await tx.sign(PrivateKey.fromStringDer(donanteClave))).execute(client);
  await respuesta.getReceipt(client);
  const txId = idTx(respuesta.transactionId);
  return { txId, hashscan: hashscan("transaction", txId) };
}

/** Una transacción leída del Mirror Node; espera unos segundos si todavía no llegó. null si no existe. */
export async function leerTransaccion(txId, maxSeg = 10) {
  for (let i = 0; i <= maxSeg; i++) {
    const r = await fetch(`${MIRROR}/transactions/${encodeURIComponent(txId)}`);
    if (r.ok) return (await r.json()).transactions?.[0] ?? null;
    if (r.status !== 404) throw new Error(`Mirror Node respondió ${r.status} para ${txId}`);
    if (i < maxSeg) await new Promise((res) => setTimeout(res, 1000));
  }
  return null;
}

/**
 * Comprueba en el Mirror Node (no en nuestra palabra) que la transferencia existe, salió bien, acreditó USDCd
 * al beneficiario y lleva el memo de la colecta. Devuelve { usdc, hashscan } o { error }.
 */
export async function verificarTransferencia({ txId, beneficiario, campaignId }) {
  const { token } = config();
  if (!token) throw new Error("Falta USDC_TOKEN_ID");
  const tx = await leerTransaccion(txId);
  if (!tx) return { error: "No existe esa transacción en Hedera." };
  if (tx.result !== "SUCCESS") return { error: `La transacción no salió bien (${tx.result}).` };
  const memo = Buffer.from(tx.memo_base64 ?? "", "base64").toString("utf8");
  if (memo !== memoColecta(campaignId)) return { error: "La transferencia no está destinada a esta colecta (memo)." };
  const unidades = (tx.token_transfers ?? [])
    .filter((t) => t.token_id === token && t.account === beneficiario && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  if (!(unidades > 0)) return { error: "La transacción no le acreditó USDC al beneficiario de la colecta." };
  return { usdc: unidades / 10 ** DECIMALES, hashscan: hashscan("transaction", tx.transaction_id) };
}

/** Eventos de un topic, en orden, leídos del Mirror Node (no de nuestra base: no tenemos). */
export async function leerEventos(topicId) {
  const eventos = [];
  let url = `${MIRROR}/topics/${topicId}/messages?limit=100&order=asc`;
  while (url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Mirror Node respondió ${r.status} para ${topicId}`);
    const datos = await r.json();
    for (const m of datos.messages ?? []) {
      let evento;
      try { evento = JSON.parse(Buffer.from(m.message, "base64").toString("utf8")); } catch { continue; }
      eventos.push({
        secuencia: m.sequence_number,
        fecha: new Date(Number(m.consensus_timestamp.split(".")[0]) * 1000).toISOString(),
        evento,
        hashscan: `https://hashscan.io/testnet/transaction/${m.consensus_timestamp}`,
      });
    }
    url = datos.links?.next ? `https://testnet.mirrornode.hedera.com${datos.links.next}` : null;
  }
  return eventos;
}

/** Todas las colectas, desde el topic de registro. */
export async function listarColectas() {
  const { registro } = config();
  if (!registro) return [];
  return (await leerEventos(registro)).filter((e) => e.evento.type === "CAMPAIGN").map((e) => ({ ...e.evento, alta: e.hashscan }));
}
