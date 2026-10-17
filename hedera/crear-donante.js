// Una sola vez por máquina: crea la cuenta "donante" de la demo (la billetera de prueba que dona USDCd),
// le asocia el token y la fondea desde la plataforma, que es la tesorería del USDCd de prueba.
// La clave queda en hedera/.cuentas.json (fuera de git), donde la busca hedera/colectas.js.
import { AccountCreateTransaction, Hbar, PrivateKey, TokenAssociateTransaction, TransferTransaction } from "@hashgraph/sdk";
import { clienteOperador, leerJson, guardarJson, ESTADO, CUENTAS, DECIMALES, hashscan } from "./lib.js";

const cuentas = leerJson(CUENTAS) ?? {};
if (cuentas.comprador) {
  console.log(`Ya hay cuenta donante (${cuentas.comprador.id}) en hedera/.cuentas.json.`);
  process.exit(0);
}
const { tokenId } = leerJson(ESTADO) ?? {};
if (!tokenId) throw new Error("Falta tokenId en hedera/estado.json");

const { client, id: plataforma } = clienteOperador();
const clave = PrivateKey.generateECDSA();
const alta = await new AccountCreateTransaction().setECDSAKeyWithAlias(clave.publicKey).setInitialBalance(new Hbar(10)).execute(client);
const id = (await alta.getReceipt(client)).accountId.toString();
console.log(`Cuenta donante: ${id}  ${hashscan("account", id)}`);

const asociar = await new TokenAssociateTransaction().setAccountId(id).setTokenIds([tokenId]).freezeWith(client);
await (await (await asociar.sign(clave)).execute(client)).getReceipt(client);

const fondeo = await new TransferTransaction()
  .addTokenTransfer(tokenId, plataforma, -1000 * 10 ** DECIMALES)
  .addTokenTransfer(tokenId, id, 1000 * 10 ** DECIMALES)
  .execute(client);
await fondeo.getReceipt(client);
console.log("Donante con el USDCd asociado y 1.000 USDCd de prueba.");

guardarJson(CUENTAS, { ...cuentas, comprador: { id, clave: clave.toStringDer() } });
console.log("Clave guardada en hedera/.cuentas.json (no se sube).");
client.close();
