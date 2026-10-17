// Pruebas de lo que `npm run nucleo` no recorre porque depende del tiempo, sobre ColectaPlazos (copia de
// Colecta con plazos de segundos): prórroga, cambio de organizador con espera, liquidación por cierre y por
// inactividad, créditos de esa liquidación, y una entidad con billetera multifirma (2 de 3).
//   node contratos/pruebas/plazos.js   (usa la Plataforma del núcleo y las cuentas de contratos/.claves.json)
import fs from "node:fs";
import crypto from "node:crypto";
import {
  AccountAllowanceApproveTransaction, AccountCreateTransaction, AccountId, Client, ContractCallQuery, ContractCreateFlow,
  ContractExecuteTransaction, ContractFunctionParameters, ContractId, Hbar, KeyList, PrivateKey, TokenId,
  TransactionId, TransactionRecordQuery,
} from "@hashgraph/sdk";
import { clienteOperador, leerClave, leerJson, guardarJson, ESTADO, hashscan, idTx } from "../../hedera/lib.js";

const CLAVES = new URL("../.claves.json", import.meta.url);
const RESULTADO = new URL("./plazos.json", import.meta.url);
const BIN = fs.readFileSync(new URL("./build/pruebas_ColectaPlazos_sol_ColectaPlazos.bin", import.meta.url), "utf8");
const PLATAFORMA = ContractId.fromString(process.env.NUCLEO_PLATAFORMA_ID ?? "0.0.11058602");
const usdc = (n) => Math.round(n * 1e6);
const huella = (t) => "0x" + crypto.createHash("sha256").update(t).digest("hex");
const b32 = (h) => Buffer.from(h.slice(2), "hex");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const evmContrato = (c) => "0x" + ContractId.fromString(c.toString()).toSolidityAddress();
const evmCuenta = (a) => "0x" + AccountId.fromString(a.toString()).toSolidityAddress();

const { client } = clienteOperador();
const token = TokenId.fromString(process.env.USDC_TOKEN_ID ?? leerJson(ESTADO).tokenId);
const k = leerJson(CLAVES);
const clienteDe = (c) => Client.forTestnet().setOperator(c.id, leerClave(c.clave));
const pasos = [];
let fallos = 0;

function motivo(hex) {
  const h = (hex ?? "").replace(/^0x/, "");
  if (!h.startsWith("08c379a0")) return null;
  const largo = parseInt(h.slice(72, 136), 16);
  return Buffer.from(h.slice(136, 136 + largo * 2), "hex").toString("utf8");
}
function anotar(desc, esperado, ok, tx, razon) {
  if (ok !== esperado) fallos++;
  pasos.push({ desc, esperado: esperado ? "pasa" : "se rechaza", ok, razon, tx });
  console.log(`${ok === esperado ? (ok ? "✔" : "✋") : "‼"} ${desc}${ok ? "" : ` → "${razon}"`}${ok === esperado ? "" : "  (NO ERA LO ESPERADO)"}`);
}
async function resultado(tx, c, desc, esperado) {
  const rec = await new TransactionRecordQuery().setTransactionId(tx.transactionId).setValidateReceiptStatus(false).execute(c);
  const ok = rec.receipt.status.toString() === "SUCCESS";
  anotar(desc, esperado, ok, idTx(tx.transactionId), ok ? null : motivo(rec.contractFunctionResult?.errorMessage) ?? rec.receipt.status.toString());
  return ok;
}
async function llamar(contrato, quien, fn, params, desc, esperado = true) {
  const c = quien ? clienteDe(quien) : client;
  try {
    const tx = await new ContractExecuteTransaction().setContractId(contrato).setGas(2_000_000).setFunction(fn, params ?? new ContractFunctionParameters()).execute(c);
    return await resultado(tx, c, desc, esperado);
  } catch (e) {
    anotar(desc, esperado, false, null, e.status?.toString() ?? e.message);
    return false;
  } finally {
    if (quien) c.close();
  }
}
async function leer(contrato, fn, tipo = "uint256", params) {
  const r = await new ContractCallQuery().setContractId(contrato).setGas(200_000).setFunction(fn, params ?? new ContractFunctionParameters()).execute(client);
  return tipo === "bool" ? r.getBool(0) : tipo === "address" ? "0x" + r.getAddress(0) : Number(r.getUint256(0));
}
async function desplegar(organizadorEvm, titularEvm, id, cierreSeg) {
  const tx = await new ContractCreateFlow().setBytecode(BIN).setGas(5_000_000).setConstructorParameters(
    new ContractFunctionParameters().addAddress(evmContrato(PLATAFORMA)).addAddress("0x" + token.toSolidityAddress())
      .addAddress(organizadorEvm).addAddress(titularEvm).addString(id).addStringArray(["Agua", "Comida"]).addUint256Array([usdc(100), usdc(100)])
      .addUint256(Math.floor(Date.now() / 1000) + cierreSeg)).execute(client);
  const c = (await tx.getReceipt(client)).contractId;
  console.log(`  contrato ${id}: ${c}  ${hashscan("contract", c)}`);
  return c;
}
async function donar(colecta, quien, monto, desc) {
  const c = clienteDe(quien);
  await (await new AccountAllowanceApproveTransaction().approveTokenAllowance(token, quien.id, AccountId.fromString(colecta.toString()), usdc(monto)).execute(c)).getReceipt(c);
  c.close();
  return llamar(colecta, quien, "donar", new ContractFunctionParameters().addBytes32(b32(huella(`donante:${quien.id}`))).addUint256(usdc(monto)), desc);
}
async function hasta(colecta, condicion, desc, maxSeg = 240) {
  process.stdout.write(`  … esperando: ${desc}`);
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxSeg) {
    if (await condicion()) { console.log(` (${Math.round((Date.now() - t0) / 1000)} s)`); return true; }
    await esperar(10_000);
  }
  console.log(" (tiempo agotado)");
  return false;
}

// ---------------- 1. Entidad multifirma (2 de 3) ----------------
console.log("— Entidad con billetera multifirma (2 de 3)");
const llaves = [PrivateKey.generateECDSA(), PrivateKey.generateECDSA(), PrivateKey.generateECDSA()];
const multi = (await (await new AccountCreateTransaction().setKey(new KeyList(llaves.map((x) => x.publicKey), 2)).setInitialBalance(new Hbar(10)).execute(client)).getReceipt(client)).accountId;
console.log(`  cuenta multifirma ${multi}`);
await llamar(PLATAFORMA, null, "aprobarEntidad", new ContractFunctionParameters().addAddress(evmCuenta(multi)).addString("Cruz Roja Corrientes (multifirma, prueba)").addBytes32(Buffer.concat([Buffer.from("AR"), Buffer.alloc(30)])).addBytes32(b32(huella("prueba multifirma"))), "La plataforma aprueba una entidad con billetera multifirma");

async function validarMultifirma(colecta, firmas, desc, esperado) {
  try {
    const tx = new ContractExecuteTransaction().setContractId(colecta).setGas(1_000_000).setFunction("validar").setTransactionId(TransactionId.generate(multi)).freezeWith(client);
    for (const llave of llaves.slice(0, firmas)) await tx.sign(llave);
    const r = await tx.execute(client);
    return await resultado(r, client, desc, esperado);
  } catch (e) {
    anotar(desc, esperado, false, null, e.status?.toString() ?? e.message);
    return false;
  }
}

// ---------------- 2. Colecta A: cierre en 150 s ----------------
console.log("\n— Colecta A: liquidación por cierre (cierra en 150 s)");
const A = await desplegar(k.organizador2.evm, k["ent-caritas"].evm, "prueba-cierre", 150);
await llamar(PLATAFORMA, k["ent-caritas"], "registrarColecta", new ContractFunctionParameters().addAddress(evmContrato(A)), "Cáritas la registra en la Plataforma");
await llamar(A, k["ent-caritas"], "validar", null, "Cáritas (titular) valida y publica");
await validarMultifirma(A, 1, "La entidad multifirma valida con 1 sola firma de 3", false);
await validarMultifirma(A, 2, "La entidad multifirma valida con 2 de 3 firmas", true);
await donar(A, k["donante-a"], 20, "Donante A dona 20");
await llamar(A, k.curioso, "liquidar", null, "Liquidar antes del cierre", false);

// ---------------- 3. Colecta B: prórroga, cambio de organizador, inactividad ----------------
console.log("\n— Colecta B: prórroga, cambio de organizador e inactividad");
const B = await desplegar(k.organizador2.evm, k["ent-caritas"].evm, "prueba-plazos", 60 * 86400);
await llamar(B, k["ent-caritas"], "validar", null, "Cáritas intenta publicar sin registrar la colecta", false);
await llamar(PLATAFORMA, k["ent-caritas"], "registrarColecta", new ContractFunctionParameters().addAddress(evmContrato(B)), "Cáritas la registra en la Plataforma");
await llamar(B, k["ent-caritas"], "validar", null, "Cáritas valida y publica");
await donar(B, k["donante-b"], 30, "Donante B dona 30");
const cierre0 = await leer(B, "cierre");
await llamar(B, k.organizador2, "pedirProrroga", new ContractFunctionParameters().addUint256(cierre0 + 91 * 86400), "Santi pide una prórroga de 91 días (máximo 90)", false);
await llamar(B, k.organizador2, "pedirProrroga", new ContractFunctionParameters().addUint256(cierre0 + 30 * 86400), "Santi pide una prórroga de 30 días");
await llamar(B, k["ent-greenpeace"], "aprobarProrroga", null, "Una entidad que no es la titular intenta aprobar la prórroga", false);
await llamar(B, k["ent-caritas"], "aprobarProrroga", null, "Cáritas (titular) aprueba la prórroga");
const cierre1 = await leer(B, "cierre");
anotar(`El cierre se corrió 30 días (${new Date(cierre0 * 1000).toLocaleDateString("es-AR")} → ${new Date(cierre1 * 1000).toLocaleDateString("es-AR")})`, true, cierre1 - cierre0 === 30 * 86400, null, "no cambió");

await llamar(B, k.organizador2, "pedirCambioOrganizador", new ContractFunctionParameters().addAddress(k.curioso.evm), "Santi intenta cambiar el organizador él mismo", false);
await llamar(B, k["ent-caritas"], "pedirCambioOrganizador", new ContractFunctionParameters().addAddress(k.curioso.evm), "Cáritas pide el cambio de billetera del organizador (tras repetir la verificación)");
anotar("Mientras espera, la colecta queda pausada", true, await leer(B, "pausada", "bool"), null, "no se pausó");
await llamar(B, k.curioso, "ejecutarCambioOrganizador", null, "Ejecutar el cambio antes de la espera", false);
await hasta(B, async () => true, "la espera del cambio (60 s en la prueba; 72 h en producción)", 0);
await esperar(65_000);
await llamar(B, k.curioso, "ejecutarCambioOrganizador", null, "Pasada la espera, se ejecuta el cambio");
anotar("La colecta se reanuda sola y el organizador es la billetera nueva", true,
  !(await leer(B, "pausada", "bool")) && (await leer(B, "organizador", "address")).toLowerCase() === k.curioso.evm.toLowerCase(), null, "no cambió");
await llamar(B, k.organizador2, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(10)), "La billetera vieja intenta pedir un tramo", false);
await llamar(B, k.curioso, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(10)), "La billetera nueva pide un tramo");

// ---------------- 3b. Colecta C: nunca registrada, le llega plata por fuera ----------------
console.log("\n— Colecta C: nunca registrada; le llega una transferencia directa (cierra en 120 s)");
const C = await desplegar(k.organizador2.evm, k["ent-defensa"].evm, "prueba-sin-registro", 120);
{
  const { TransferTransaction } = await import("@hashgraph/sdk");
  const cb = clienteDe(k["donante-b"]);
  await (await new TransferTransaction().addTokenTransfer(token, k["donante-b"].id, -usdc(5)).addTokenTransfer(token, AccountId.fromString(C.toString()), usdc(5)).execute(cb)).getReceipt(cb);
  cb.close();
  console.log("  llegaron 5 USDCd por fuera de donar");
}
const saldoDe = async (id) => (await (await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${id}/tokens?token.id=${token}`)).json()).tokens?.[0]?.balance / 1e6 || 0;
const saldoTitularAntes = await saldoDe(k["ent-defensa"].id);

// ---------------- 4. Liquidaciones por tiempo ----------------
console.log("\n— Liquidaciones por tiempo");
await hasta(A, async () => (await leer(A, "cierre")) * 1000 < Date.now() - 5000, "que pase el cierre de la colecta A");
await llamar(A, k.curioso, "liquidar", null, "Pasado el cierre, cualquiera liquida la colecta A (va a créditos)");
await llamar(PLATAFORMA, k.curioso, "reclamar", new ContractFunctionParameters().addAddress(evmContrato(A)).addBytes32(b32(huella(`donante:${k["donante-a"].id}`))), "El donante A reclama sus créditos de la colecta A");

await hasta(B, async () => ((await leer(B, "ultimaActividad")) + 95) * 1000 < Date.now(), "90 s sin actividad del organizador en la colecta B (30 días en producción)");
await llamar(B, k.curioso, "liquidar", null, "Por inactividad del organizador, cualquiera liquida la colecta B");

await hasta(C, async () => (await leer(C, "cierre")) * 1000 < Date.now() - 5000, "que pase el cierre de la colecta C");
await llamar(C, k.curioso, "liquidar", null, "Se liquida la colecta C, que nunca se registró: la plata va a la titular");
await esperar(6000);
const saldoTitularDespues = await saldoDe(k["ent-defensa"].id);
anotar(`La titular (Defensa Civil) recibió lo que estaba trabado: ${saldoTitularAntes} → ${saldoTitularDespues} USDCd`, true, saldoTitularDespues > saldoTitularAntes, null, "no recibió");

console.log(fallos ? `\n‼ ${fallos} paso(s) no salieron como se esperaba` : `\nLos ${pasos.length} pasos salieron como se esperaba.`);
guardarJson(RESULTADO, { red: "testnet", plataforma: PLATAFORMA.toString(), colectaCierre: A.toString(), colectaPlazos: B.toString(), colectaSinRegistro: C.toString(), multifirma: multi.toString(), fallos, pasos });
client.close();
