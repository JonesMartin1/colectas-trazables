// Uso: node pagar.js <pedido> <monto en USDC>   ej.: node pagar.js 123 25.50
// El comprador paga: el neto va al comercio y el 0,5 % a la plataforma, en UNA transacción.
// Después se sella la venta en el topic y se verifica el pago en el Mirror Node.
import { PrivateKey, TransferTransaction, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { clienteOperador, leerJson, ESTADO, CUENTAS, DECIMALES, COMISION_BPS, hashscan, idTx, MIRROR } from "./lib.js";

const [pedido, montoTexto] = process.argv.slice(2);
const monto = Math.round(Number(montoTexto) * 10 ** DECIMALES);
if (!pedido || !(monto > 0)) {
  console.log("Uso: node pagar.js <pedido> <monto>   ej.: node pagar.js 123 25.50");
  process.exit(1);
}

const estado = leerJson(ESTADO);
const cuentas = leerJson(CUENTAS);
if (!estado || !cuentas) throw new Error("Primero corré: node setup.js");

const { client } = clienteOperador();
const comision = Math.floor((monto * COMISION_BPS) / 10_000);
const neto = monto - comision;
const fmt = (x) => (x / 10 ** DECIMALES).toFixed(2);

// 1. El pago (lo firma el comprador; la red la paga la plataforma, como haría un facilitador).
const pago = await new TransferTransaction()
  .addTokenTransfer(estado.tokenId, cuentas.comprador.id, -monto)
  .addTokenTransfer(estado.tokenId, estado.comercio, neto)
  .addTokenTransfer(estado.tokenId, estado.plataforma, comision)
  .setTransactionMemo(`pedido:${pedido}`)
  .freezeWith(client);
const respuesta = await (await pago.sign(PrivateKey.fromStringDer(cuentas.comprador.clave))).execute(client);
const recibo = await respuesta.getReceipt(client);
const txPago = idTx(respuesta.transactionId);
console.log(`Pago ${recibo.status}: ${fmt(monto)} USDCd → comercio ${fmt(neto)} + plataforma ${fmt(comision)}`);
console.log(`  ${hashscan("transaction", txPago)}`);

// 2. El comprobante en el topic de ventas.
const sello = await new TopicMessageSubmitTransaction()
  .setTopicId(estado.topicId)
  .setMessage(JSON.stringify({ pedido, monto: fmt(monto), neto: fmt(neto), comision: fmt(comision), tx: txPago, fecha: new Date().toISOString() }))
  .execute(client);
const reciboSello = await sello.getReceipt(client);
console.log(`Venta sellada en el topic ${estado.topicId}, mensaje #${reciboSello.topicSequenceNumber}`);
console.log(`  ${hashscan("topic", estado.topicId)}`);

// 3. Lo que hace el agente: verificar en el Mirror Node que el pago llegó al comercio.
const url = `${MIRROR}/transactions/${txPago}`;
let verificado = false;
for (let intento = 0; intento < 10 && !verificado; intento++) {
  await new Promise((r) => setTimeout(r, 2000));
  const datos = await fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const tx = datos?.transactions?.[0];
  const alComercio = tx?.token_transfers?.find((t) => t.account === estado.comercio && t.token_id === estado.tokenId)?.amount;
  const memo = tx ? Buffer.from(tx.memo_base64 ?? "", "base64").toString() : "";
  verificado = tx?.result === "SUCCESS" && alComercio === neto && memo === `pedido:${pedido}`;
}
console.log(verificado
  ? `✅ Verificado en el Mirror Node: el comercio recibió ${fmt(neto)} USDCd por el pedido ${pedido}.`
  : "⚠ El Mirror Node todavía no muestra el pago (tarda unos segundos). Revisalo en HashScan.");
client.close();
