// Una sola vez: crea comercio y comprador, el token USDC de prueba y el topic de ventas.
// La plataforma (quien cobra el 0,5 %) es la cuenta del .env.
import {
  AccountCreateTransaction, Hbar, PrivateKey, TokenCreateTransaction, TokenType, TokenSupplyType,
  TokenAssociateTransaction, TransferTransaction, TopicCreateTransaction,
} from "@hashgraph/sdk";
import { clienteOperador, leerJson, guardarJson, ESTADO, CUENTAS, DECIMALES, hashscan } from "./lib.js";

if (leerJson(ESTADO)) {
  console.log("Ya existe estado.json: el setup ya se corrió. Borralo para empezar de cero.");
  process.exit(0);
}

const { client, id: plataforma, clave: clavePlataforma } = clienteOperador();

async function crearCuenta(nombre) {
  const clave = PrivateKey.generateECDSA();
  const tx = await new AccountCreateTransaction().setECDSAKeyWithAlias(clave.publicKey).setInitialBalance(new Hbar(10)).execute(client);
  const id = (await tx.getReceipt(client)).accountId.toString();
  console.log(`Cuenta ${nombre}: ${id}  ${hashscan("account", id)}`);
  return { id, clave };
}

const comercio = await crearCuenta("comercio");
const comprador = await crearCuenta("comprador");

const token = await (await new TokenCreateTransaction()
  .setTokenName("USD Coin (demo NEA Tech)").setTokenSymbol("USDCd")
  .setTokenType(TokenType.FungibleCommon).setDecimals(DECIMALES)
  .setInitialSupply(1_000_000 * 10 ** DECIMALES).setSupplyType(TokenSupplyType.Infinite)
  .setTreasuryAccountId(plataforma).setSupplyKey(clavePlataforma).setAdminKey(clavePlataforma)
  .execute(client)).getReceipt(client);
const tokenId = token.tokenId.toString();
console.log(`Token USDCd: ${tokenId}  ${hashscan("token", tokenId)}`);

for (const cuenta of [comercio, comprador]) {
  const tx = await new TokenAssociateTransaction().setAccountId(cuenta.id).setTokenIds([tokenId]).freezeWith(client);
  await (await (await tx.sign(cuenta.clave)).execute(client)).getReceipt(client);
}
console.log("Token asociado al comercio y al comprador.");

const fondeo = await new TransferTransaction()
  .addTokenTransfer(tokenId, plataforma, -1000 * 10 ** DECIMALES)
  .addTokenTransfer(tokenId, comprador.id, 1000 * 10 ** DECIMALES)
  .execute(client);
await fondeo.getReceipt(client);
console.log("Comprador fondeado con 1.000 USDCd.");

const topic = await (await new TopicCreateTransaction().setTopicMemo("Ventas web-ia (demo NEA Tech)").execute(client)).getReceipt(client);
const topicId = topic.topicId.toString();
console.log(`Topic de ventas: ${topicId}  ${hashscan("topic", topicId)}`);

guardarJson(ESTADO, { plataforma: plataforma.toString(), comercio: comercio.id, comprador: comprador.id, tokenId, topicId });
guardarJson(CUENTAS, {
  comercio: { id: comercio.id, clave: comercio.clave.toStringDer() },
  comprador: { id: comprador.id, clave: comprador.clave.toStringDer() },
});
console.log("Listo. IDs en estado.json (público) y claves de prueba en .cuentas.json (no se sube).");
client.close();
