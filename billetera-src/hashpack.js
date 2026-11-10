// "Conectar HashPack": la persona conecta su billetera por WalletConnect y firma ella la transferencia de USDC a la
// billetera de la colecta, con el memo de la colecta. La clave nunca sale de su billetera: esta página solo pide la firma.
// Se empaqueta a web/hashpack.js con `npm run build` (ver README.md de esta carpeta) y web/billetera.js lo carga recién
// cuando alguien toca el botón, para no pesarle al resto del sitio.
import "./polyfill.js";
import { DAppConnector, HederaChainId, HederaJsonRpcMethod, HederaSessionEvent } from "@hashgraph/hedera-wallet-connect";
import { LedgerId, TransferTransaction } from "@hiero-ledger/sdk";

const PROJECT_ID = "f86c33e87c74d7c5d3fc9677bfa8076d"; // Reown (dashboard.reown.com): identifica al sitio, no es un secreto
const DECIMALES = 6; // como el USDC real

let conector = null;
let redActual = null;

async function conectar(red) {
  if (conector && redActual === red) return conector;
  const mainnet = red === "mainnet";
  const c = new DAppConnector(
    { name: "Colectas Trazables", description: "Mirá llegar tu ayuda", url: location.origin, icons: [document.querySelector('link[rel~="icon"]')?.href].filter(Boolean) },
    mainnet ? LedgerId.MAINNET : LedgerId.TESTNET,
    PROJECT_ID,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    [mainnet ? HederaChainId.Mainnet : HederaChainId.Testnet],
  );
  await c.init({ logger: "error" });
  conector = c;
  redActual = red;
  return c;
}

/** La cuenta conectada (0.0.x), abriendo el modal de conexión si todavía no hay ninguna. */
async function cuenta(red) {
  const c = await conectar(red);
  if (!c.signers.length) await c.openModal(undefined, true);
  if (!c.signers.length) throw new Error("No se conectó ninguna billetera.");
  return c.signers[0];
}

/**
 * Transfiere `usdc` del token a la billetera de la colecta, con su memo. Devuelve { txId, cuenta }.
 * La firma y el envío los hace la billetera de la persona; acá solo se arma el pedido.
 */
async function donar({ red, token, beneficiario, memo, usdc }) {
  const unidades = Math.round(Number(usdc) * 10 ** DECIMALES);
  if (!(unidades > 0)) throw new Error("Indicá cuántos USDC querés donar.");
  const firmante = await cuenta(red);
  const de = firmante.getAccountId();
  if (de.toString() === String(beneficiario)) throw new Error("La billetera conectada es la de la colecta: doná desde otra.");
  const tx = new TransferTransaction()
    .addTokenTransfer(token, de, -unidades)
    .addTokenTransfer(token, beneficiario, unidades)
    .setTransactionMemo(memo);
  // Sin congelar: freezeWithSigner falla ("nodeAccountId must be set") porque el firmante de WalletConnect no conoce
  // los nodos. Se fija solo el ID (quién paga y cuándo) y la billetera elige el nodo al firmar y enviar.
  await firmante.populateTransaction(tx);
  const respuesta = await tx.executeWithSigner(firmante);
  return { txId: respuesta.transactionId.toString(), cuenta: de.toString() };
}

async function desconectar() {
  try { await conector?.disconnectAll(); } catch { /* ya estaba desconectada */ }
}

window.ColectasHashPack = { cuenta: async (red) => (await cuenta(red)).getAccountId().toString(), donar, desconectar };
