// Prueba barata (un solo despliegue) del arreglo del 17/10 en Colecta:
// 1) la titular no puede publicar una colecta que no registró en la Plataforma;
// 2) si a una colecta nunca registrada le llega plata por fuera, al liquidarla va a la titular (no queda trabada).
//   node contratos/pruebas/arreglo.js
import fs from "node:fs";
import {
  AccountId, Client, ContractCallQuery, ContractCreateFlow, ContractExecuteTransaction, ContractFunctionParameters,
  ContractId, TokenId, TransactionRecordQuery, TransferTransaction,
} from "@hashgraph/sdk";
import { clienteOperador, leerClave, leerJson, guardarJson, ESTADO, hashscan, idTx } from "../../hedera/lib.js";

const k = leerJson(new URL("../.claves.json", import.meta.url));
const BIN = fs.readFileSync(new URL("./build/pruebas_ColectaPlazos_sol_ColectaPlazos.bin", import.meta.url), "utf8");
const PLATAFORMA = ContractId.fromString(process.env.NUCLEO_PLATAFORMA_ID ?? "0.0.11058602");
const { client } = clienteOperador();
const token = TokenId.fromString(process.env.USDC_TOKEN_ID ?? leerJson(ESTADO).tokenId);
const clienteDe = (c) => Client.forTestnet().setOperator(c.id, leerClave(c.clave));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const saldo = async (id) => ((await (await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${id}/tokens?token.id=${token}`)).json()).tokens?.[0]?.balance ?? 0) / 1e6;
const pasos = [];
let fallos = 0;
const anotar = (desc, esperado, ok, razon, tx) => {
  if (ok !== esperado) fallos++;
  pasos.push({ desc, ok, esperado, razon, tx });
  console.log(`${ok === esperado ? (ok ? "✔" : "✋") : "‼"} ${desc}${ok ? "" : ` → "${razon}"`}${tx ? `\n   ${hashscan("transaction", tx)}` : ""}`);
};
function motivo(hex) {
  const h = (hex ?? "").replace(/^0x/, "");
  if (!h.startsWith("08c379a0")) return null;
  return Buffer.from(h.slice(136, 136 + parseInt(h.slice(72, 136), 16) * 2), "hex").toString("utf8");
}
async function llamar(contrato, quien, fn, desc, esperado) {
  const c = clienteDe(quien);
  try {
    const tx = await new ContractExecuteTransaction().setContractId(contrato).setGas(2_000_000).setFunction(fn).execute(c);
    const rec = await new TransactionRecordQuery().setTransactionId(tx.transactionId).setValidateReceiptStatus(false).execute(c);
    const ok = rec.receipt.status.toString() === "SUCCESS";
    anotar(desc, esperado, ok, ok ? null : motivo(rec.contractFunctionResult?.errorMessage) ?? rec.receipt.status.toString(), idTx(tx.transactionId));
  } finally {
    c.close();
  }
}

// Si el bytecode ya está subido a Hedera (un archivo), se reusa: subirlo de nuevo cuesta ~44 HBAR.
const ARCHIVO = process.env.BYTECODE_FILE_ID;
const { ContractCreateTransaction, FileId } = await import("@hashgraph/sdk");
const base = ARCHIVO ? new ContractCreateTransaction().setBytecodeFileId(FileId.fromString(ARCHIVO)).setAutoRenewAccountId(clienteOperador().id) : new ContractCreateFlow().setBytecode(BIN);
const crear = await base.setGas(5_000_000).setConstructorParameters(
  new ContractFunctionParameters().addAddress("0x" + PLATAFORMA.toSolidityAddress()).addAddress("0x" + token.toSolidityAddress())
    .addAddress(k.organizador2.evm).addAddress(k["ent-defensa"].evm).addString("prueba-arreglo").addStringArray(["Agua"]).addUint256Array([100e6])
    .addUint256(Math.floor(Date.now() / 1000) + 90)).execute(client);
const C = (await crear.getReceipt(client)).contractId;
console.log(`Colecta de prueba: ${C}  ${hashscan("contract", C)}`);

await llamar(C, k["ent-defensa"], "validar", "La titular intenta publicar sin registrar la colecta en la Plataforma", false);

const cb = clienteDe(k["donante-b"]);
await (await new TransferTransaction().addTokenTransfer(token, k["donante-b"].id, -5e6).addTokenTransfer(token, AccountId.fromString(C.toString()), 5e6).execute(cb)).getReceipt(cb);
cb.close();
console.log("  llegaron 5 USDCd por fuera de donar (la colecta nunca se registró ni se publicó)");
const antes = await saldo(k["ent-defensa"].id);

while (true) {
  const r = await new ContractCallQuery().setContractId(C).setGas(100_000).setFunction("cierre").execute(client);
  if (Number(r.getUint256(0)) * 1000 < Date.now() - 5000) break;
  await esperar(10_000);
}
await llamar(C, k.curioso, "liquidar", "Vencido el cierre, se liquida: como nunca se registró, la plata va a la titular", true);
await esperar(6000);
const despues = await saldo(k["ent-defensa"].id);
anotar(`La titular recibió lo que estaba trabado (${antes} → ${despues} USDCd)`, true, Math.abs(despues - antes - 5) < 0.000001, "no recibió los 5");

console.log(fallos ? `\n‼ ${fallos} paso(s) no salieron como se esperaba` : "\nEl arreglo funciona: todos los pasos salieron como se esperaba.");
guardarJson(new URL("./arreglo.json", import.meta.url), { red: "testnet", colecta: C.toString(), fallos, pasos });
client.close();
