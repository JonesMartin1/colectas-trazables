// Recorrido completo del núcleo en testnet (diseño D1–D29): Plataforma + Colecta.
// Entidades aprobadas, validación y publicación, donaciones con comisión del 1 %, donación anónima,
// tramos con tope sin rendir, comprobantes con/sin CAE, reasignación, denuncias, pausa, fraude,
// liquidación a créditos y uso de créditos en otra colecta. Cada paso dice si salió como se esperaba.
//   node contratos/nucleo.js
import fs from "node:fs";
import crypto from "node:crypto";
import {
  AccountAllowanceApproveTransaction, AccountCreateTransaction, AccountId, Client, ContractCallQuery, ContractCreateFlow,
  ContractExecuteTransaction, ContractFunctionParameters, ContractId, Hbar, PrivateKey, TokenId, TransactionRecordQuery,
  TransferTransaction,
} from "@hashgraph/sdk";
import { clienteOperador, leerClave, leerJson, guardarJson, ESTADO, hashscan, idTx } from "../hedera/lib.js";

const CLAVES = new URL("./.claves.json", import.meta.url); // fuera de git y de Vercel
const RESULTADO = new URL("./nucleo.json", import.meta.url);
const bin = (n) => fs.readFileSync(new URL(`./build/${n}_sol_${n}.bin`, import.meta.url), "utf8");
const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";
const usdc = (n) => Math.round(n * 1e6);
const aUsdc = (x) => Number(x) / 1e6;
const huella = (t) => "0x" + crypto.createHash("sha256").update(t).digest("hex");
const b32 = (hex) => Buffer.from(hex.slice(2), "hex");
const DIA = 86400;

const { client, id: operadorId } = clienteOperador();
const estado = leerJson(ESTADO);
const token = TokenId.fromString(process.env.USDC_TOKEN_ID ?? estado.tokenId);
const tokenEvm = "0x" + token.toSolidityAddress();
const evmDeContrato = (cid) => "0x" + ContractId.fromString(cid.toString()).toSolidityAddress();
const clienteDe = (c) => Client.forTestnet().setOperator(c.id, leerClave(c.clave));
const resumen = [];
let fallosInesperados = 0;

async function evmDeCuenta(id) {
  const j = await (await fetch(`${MIRROR}/accounts/${id}`)).json();
  return j.evm_address;
}

const ROLES = ["ent-caritas", "ent-defensa", "ent-greenpeace", "organizador", "organizador2", "donante-a", "donante-b", "curioso"];
async function cuentas() {
  const g = leerJson(CLAVES) ?? {};
  for (const rol of ROLES) {
    if (g[rol]) continue;
    const clave = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction().setECDSAKeyWithAlias(clave.publicKey).setInitialBalance(new Hbar(10)).setMaxAutomaticTokenAssociations(5).execute(client);
    const id = (await tx.getReceipt(client)).accountId.toString();
    g[rol] = { id, clave: clave.toStringDer(), evm: "0x" + clave.publicKey.toEvmAddress() };
    guardarJson(CLAVES, g);
  }
  return g;
}

function motivo(hex) {
  const h = (hex ?? "").replace(/^0x/, "");
  if (!h.startsWith("08c379a0")) return null;
  const largo = parseInt(h.slice(72, 136), 16);
  return Buffer.from(h.slice(136, 136 + largo * 2), "hex").toString("utf8");
}

function anotar(descripcion, esperado, ok, tx, razon) {
  const bien = ok === esperado;
  if (!bien) fallosInesperados++;
  resumen.push({ descripcion, esperado: esperado ? "pasa" : "se rechaza", resultado: ok ? "pasó" : "rechazado", razon, tx });
  const marca = bien ? (ok ? "✔" : "✋") : "‼";
  console.log(`${marca} ${descripcion}${ok ? "" : ` → "${razon}"`}${bien ? "" : "   (NO ERA LO ESPERADO)"}${tx ? `\n   ${hashscan("transaction", tx)}` : ""}`);
}

/** Ejecuta una función del contrato como `quien`. esperado = true si tiene que pasar, false si se tiene que rechazar. */
async function llamar(contrato, quien, funcion, params, descripcion, esperado = true) {
  const c = quien ? clienteDe(quien) : client;
  try {
    const tx = await new ContractExecuteTransaction().setContractId(contrato).setGas(2_000_000).setFunction(funcion, params ?? new ContractFunctionParameters()).execute(c);
    const rec = await new TransactionRecordQuery().setTransactionId(tx.transactionId).setValidateReceiptStatus(false).execute(c);
    const ok = rec.receipt.status.toString() === "SUCCESS";
    anotar(descripcion, esperado, ok, idTx(tx.transactionId), ok ? null : motivo(rec.contractFunctionResult?.errorMessage) ?? rec.receipt.status.toString());
    return ok;
  } finally {
    if (quien) c.close();
  }
}

async function desplegar(nombre, params, gas, descripcion, esperado = true) {
  try {
    const tx = await new ContractCreateFlow().setBytecode(bin(nombre)).setGas(gas).setConstructorParameters(params).execute(client);
    const rec = await new TransactionRecordQuery().setTransactionId(tx.transactionId).setValidateReceiptStatus(false).execute(client);
    const ok = rec.receipt.status.toString() === "SUCCESS";
    anotar(descripcion, esperado, ok, idTx(tx.transactionId), ok ? null : motivo(rec.contractFunctionResult?.errorMessage) ?? rec.receipt.status.toString());
    return ok ? rec.receipt.contractId : null;
  } catch (e) {
    anotar(descripcion, esperado, false, e.transactionId ? idTx(e.transactionId) : null, e.status?.toString() ?? e.message);
    return null;
  }
}

async function leer(contrato, funcion, params, tipo = "uint256") {
  const r = await new ContractCallQuery().setContractId(contrato).setGas(200_000).setFunction(funcion, params ?? new ContractFunctionParameters()).execute(client);
  return tipo === "bool" ? r.getBool(0) : r.getUint256(0);
}

async function permitirYDonar(colecta, quien, codigo, monto, descripcion, esperado = true) {
  const c = clienteDe(quien);
  const permiso = await new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(token, quien.id, AccountId.fromString(colecta.toString()), usdc(monto))
    .execute(c);
  await permiso.getReceipt(c);
  c.close();
  return llamar(colecta, quien, "donar", new ContractFunctionParameters().addBytes32(b32(codigo)).addUint256(usdc(monto)), descripcion, esperado);
}

const parametrosColecta = (plataforma, organizador, titular, id, nombres, metas, cierre) =>
  new ContractFunctionParameters()
    .addAddress(evmDeContrato(plataforma))
    .addAddress(tokenEvm)
    .addAddress(organizador)
    .addAddress(titular)
    .addString(id)
    .addStringArray(nombres)
    .addUint256Array(metas.map(usdc))
    .addUint256(Math.floor(Date.now() / 1000) + cierre);

// ================================================================================================
const k = await cuentas();
const operadorEvm = await evmDeCuenta(operadorId);
const codigo = { a: huella(`donante:${k["donante-a"].id}`), b: huella(`donante:${k["donante-b"].id}`) };

// USDCd de prueba para los donantes (el operador es la tesorería del token).
const fondeo = new TransferTransaction();
for (const r of ["donante-a", "donante-b"]) fondeo.addTokenTransfer(token, operadorId, -usdc(300)).addTokenTransfer(token, k[r].id, usdc(300));
await (await fondeo.execute(client)).getReceipt(client);
console.log("Cuentas:", ROLES.map((r) => `${r} ${k[r].id}`).join(" · "), "\n");

console.log("— Plataforma y entidades");
const plataforma = await desplegar("Plataforma", new ContractFunctionParameters().addAddress(tokenEvm).addAddress(operadorEvm).addAddress(operadorEvm), 3_000_000, "Se despliega la Plataforma (registro de entidades + fondo de créditos)");
const pais = (p) => Buffer.concat([Buffer.from(p, "ascii"), Buffer.alloc(32 - p.length)]);
const aprobar = (rol, nombre, p, fuente) =>
  llamar(plataforma, null, "aprobarEntidad", new ContractFunctionParameters().addAddress(k[rol].evm).addString(nombre).addBytes32(pais(p)).addBytes32(b32(huella(fuente))), `La plataforma aprueba a ${nombre} (${p})`);
await aprobar("ent-caritas", "Caritas Itati", "AR", "IGPJ Corrientes - Caritas Diocesana (prueba)");
await aprobar("ent-defensa", "Defensa Civil Corrientes", "AR", "Gobierno de Corrientes - Defensa Civil (prueba)");
await aprobar("ent-greenpeace", "Greenpeace", "NL", "Kamer van Koophandel - Stichting Greenpeace Council (prueba)");
await llamar(plataforma, k.curioso, "aprobarEntidad", new ContractFunctionParameters().addAddress(k.curioso.evm).addString("Fundacion Trucha").addBytes32(pais("AR")).addBytes32(b32(huella("nada"))), "Alguien que no es la plataforma intenta aprobarse como entidad", false);

console.log("\n— Crear y publicar la colecta");
const NOMBRES = ["Comida", "Camas", "Gasolina"], METAS = [300, 200, 100];
await desplegar("Colecta", parametrosColecta(plataforma, k.organizador.evm, k["ent-greenpeace"].evm, "intento-titular-extranjera", NOMBRES, METAS, 60 * DIA), 5_000_000, "Colecta con titular extranjera (Greenpeace)", false);
const colecta = await desplegar("Colecta", parametrosColecta(plataforma, k.organizador.evm, k["ent-caritas"].evm, "inundacion-itati-nucleo", NOMBRES, METAS, 60 * DIA), 5_000_000, "Colecta de Santi (organizador) con Cáritas Itatí como titular: Comida 300, Camas 200, Gasolina 100");
await permitirYDonar(colecta, k["donante-a"], codigo.a, 50, "Donar antes de que la valide la titular", false);
await llamar(colecta, k["ent-greenpeace"], "validar", null, "Greenpeace valida (aval extranjero; todavía no se publica)");
await llamar(colecta, k["ent-caritas"], "validar", null, "Cáritas intenta publicar sin haberla registrado en la Plataforma", false);
await llamar(plataforma, k["ent-caritas"], "registrarColecta", new ContractFunctionParameters().addAddress(evmDeContrato(colecta)), "Cáritas registra la colecta en la Plataforma (habilita créditos)");
await llamar(colecta, k["ent-caritas"], "validar", null, "Cáritas Itatí valida como titular → la colecta se publica");

console.log("\n— Donaciones");
await permitirYDonar(colecta, k["donante-a"], codigo.a, 200, "Donante A dona 200 USDCd (1 % de comisión a la plataforma)");
await permitirYDonar(colecta, k["donante-b"], codigo.b, 100, "Donante B dona 100 USDCd");
const cb = clienteDe(k["donante-b"]);
const directa = await new TransferTransaction().addTokenTransfer(token, k["donante-b"].id, -usdc(10)).addTokenTransfer(token, AccountId.fromString(colecta.toString()), usdc(10)).execute(cb);
await directa.getReceipt(cb);
cb.close();
console.log(`   (llegan 10 USDCd por fuera de donar: ${hashscan("transaction", idTx(directa.transactionId))})`);
await llamar(colecta, k.curioso, "reconocerAnonimas", null, "Cualquiera reconoce la transferencia directa como donación anónima");
console.log(`   Recaudado neto: ${aUsdc(await leer(colecta, "totalAportado"))} USDCd · en el contrato: ${aUsdc(await leer(colecta, "contable"))}`);

console.log("\n— Tramos (tope sin rendir: 30 % de 600 = 180)");
await llamar(colecta, k.organizador, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(200)), "Santi pide un tramo de 200", false);
await llamar(colecta, k.organizador, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(150)), "Santi pide un tramo de 150");
await llamar(colecta, k["ent-defensa"], "aprobarTramo", new ContractFunctionParameters().addUint256(0), "Defensa Civil (no validó esta colecta) intenta aprobar el tramo", false);
await llamar(colecta, k["ent-greenpeace"], "aprobarTramo", new ContractFunctionParameters().addUint256(0), "Greenpeace (validadora) aprueba → Santi recibe 150");
await llamar(colecta, k.organizador, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(50)), "Santi pide 50 más sin haber rendido nada (150 + 50 > 180)", false);

console.log("\n— Comprobantes (las barras)");
const h1 = huella("factura-camas-colchoneria-norte-0001-CAE-75123456789012");
await llamar(colecta, k.organizador, "cargarComprobante", new ContractFunctionParameters().addUint256(1).addUint256(usdc(100)).addBytes32(b32(h1)).addBool(true), "Santi carga factura con CAE: Camas 100");
await llamar(colecta, k.organizador, "cargarComprobante", new ContractFunctionParameters().addUint256(0).addUint256(usdc(20)).addBytes32(b32(huella("ticket-almacen-20"))).addBool(false), "Santi carga ticket sin factura: Comida 20");
await llamar(colecta, k["ent-caritas"], "aprobarComprobante", new ContractFunctionParameters().addUint256(0), "Cáritas aprueba la factura de Camas");
await llamar(colecta, k["ent-caritas"], "aprobarComprobante", new ContractFunctionParameters().addUint256(1), "Cáritas intenta aprobar el ticket de 20 (tope sin factura: 10 % de 150 = 15)", false);
await llamar(colecta, k["ent-caritas"], "rechazarComprobante", new ContractFunctionParameters().addUint256(1), "Cáritas rechaza el ticket de 20");
await llamar(colecta, k.organizador, "cargarComprobante", new ContractFunctionParameters().addUint256(0).addUint256(usdc(12)).addBytes32(b32(huella("ticket-almacen-12"))).addBool(false), "Santi carga un ticket de 12");
await llamar(colecta, k["ent-caritas"], "aprobarComprobante", new ContractFunctionParameters().addUint256(2), "Cáritas aprueba el ticket de 12");
await llamar(colecta, k.organizador, "cargarComprobante", new ContractFunctionParameters().addUint256(1).addUint256(usdc(100)).addBytes32(b32(h1)).addBool(true), "Santi intenta cargar otra vez la misma factura", false);
await llamar(colecta, k.organizador, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(100)), "Ya rindió 112: pide 100 más (38 + 100 ≤ 180)");
await llamar(colecta, k["ent-caritas"], "aprobarTramo", new ContractFunctionParameters().addUint256(1), "Cáritas aprueba el segundo tramo");

console.log("\n— Reasignación entre ítems");
await llamar(colecta, k.organizador, "pedirReasignacion", new ContractFunctionParameters().addUint256(1).addUint256(2).addUint256(usdc(50)).addBytes32(b32(huella("Bajo el agua: faltan viajes a los parajes"))), "Santi pide pasar 50 de Camas a Gasolina, con motivo");
await llamar(colecta, k["ent-caritas"], "aprobarReasignacion", new ContractFunctionParameters().addUint256(0), "Cáritas aprueba la reasignación");

console.log("\n— Denuncias, pausa y fraude");
await llamar(colecta, k["donante-a"], "denunciar", new ContractFunctionParameters().addUint256(2).addBytes32(b32(huella("El ticket es de otro comercio"))), "Donante A denuncia el ticket de 12");
await llamar(colecta, k.curioso, "denunciar", new ContractFunctionParameters().addUint256(2).addBytes32(b32(huella("troll"))), "Alguien que no donó intenta denunciar", false);
await llamar(colecta, k["ent-greenpeace"], "pausar", null, "Greenpeace vota pausar (falta otra validadora o la titular)");
console.log(`   ¿Pausada? ${await leer(colecta, "pausada", null, "bool")}`);
await llamar(colecta, k["ent-caritas"], "pausar", null, "Cáritas (titular) pausa la colecta");
await llamar(colecta, k.organizador, "pedirTramo", new ContractFunctionParameters().addUint256(usdc(10)), "Santi pide un tramo con la colecta pausada", false);
await permitirYDonar(colecta, k["donante-b"], codigo.b, 5, "Donar con la colecta pausada", false);
await llamar(colecta, k.curioso, "liquidar", null, "Alguien intenta liquidar antes de tiempo", false);
await llamar(colecta, k["ent-caritas"], "confirmarFraude", null, "Cáritas confirma el fraude → Santi queda inhabilitado");
await llamar(colecta, k.curioso, "liquidar", null, "Cualquiera liquida: lo que queda va al fondo de créditos");

console.log("\n— Créditos");
await llamar(plataforma, k.curioso, "reclamar", new ContractFunctionParameters().addAddress(evmDeContrato(colecta)).addBytes32(b32(codigo.a)), "Se reclaman los créditos del donante A");
await llamar(plataforma, k.curioso, "reclamar", new ContractFunctionParameters().addAddress(evmDeContrato(colecta)).addBytes32(b32(codigo.b)), "Se reclaman los créditos del donante B");
await llamar(plataforma, k.curioso, "reclamar", new ContractFunctionParameters().addAddress(evmDeContrato(colecta)).addBytes32(b32(codigo.a)), "Reclamar dos veces lo mismo", false);
const creditosA = await leer(plataforma, "creditos", new ContractFunctionParameters().addBytes32(b32(codigo.a)));
const creditosB = await leer(plataforma, "creditos", new ContractFunctionParameters().addBytes32(b32(codigo.b)));
console.log(`   Créditos: A ${aUsdc(creditosA)} · B ${aUsdc(creditosB)} USDCd`);

await desplegar("Colecta", parametrosColecta(plataforma, k.organizador.evm, k["ent-defensa"].evm, "santi-otra-vez", ["Comida"], [100], 30 * DIA), 5_000_000, "Santi (inhabilitado) intenta abrir otra colecta", false);
const colecta2 = await desplegar("Colecta", parametrosColecta(plataforma, k.organizador2.evm, k["ent-defensa"].evm, "agua-para-parajes", ["Agua"], [150], 30 * DIA), 5_000_000, "Otro organizador abre 'Agua para parajes' con Defensa Civil como titular");
await llamar(plataforma, k["ent-defensa"], "registrarColecta", new ContractFunctionParameters().addAddress(evmDeContrato(colecta2)), "Defensa Civil la registra en la Plataforma");
await llamar(colecta2, k["ent-defensa"], "validar", null, "Defensa Civil valida → se publica");
const usoA = (BigInt(creditosA.toString()) / 2n).toString();
await llamar(plataforma, null, "usar", new ContractFunctionParameters().addBytes32(b32(codigo.a)).addAddress(evmDeContrato(colecta2)).addUint256(usoA), `El donante A usa ${aUsdc(usoA)} de sus créditos en 'Agua para parajes' (sin comisión de nuevo)`);
await llamar(plataforma, null, "usar", new ContractFunctionParameters().addBytes32(b32(codigo.a)).addAddress(evmDeContrato(colecta)).addUint256(1), "Usar créditos en la colecta liquidada", false);

const final = {
  colecta1: {
    totalAportado: aUsdc(await leer(colecta, "totalAportado")), liberado: aUsdc(await leer(colecta, "liberado")), justificado: aUsdc(await leer(colecta, "justificado")),
    barras: Object.fromEntries(await Promise.all(NOMBRES.map(async (n, i) => [n, `${aUsdc(await leer(colecta, "gastado", new ContractFunctionParameters().addUint256(i)))} / ${aUsdc(await leer(colecta, "metas", new ContractFunctionParameters().addUint256(i)))}`]))),
  },
  colecta2: { aporteA: aUsdc(await leer(colecta2, "aportes", new ContractFunctionParameters().addBytes32(b32(codigo.a)))), totalAportado: aUsdc(await leer(colecta2, "totalAportado")) },
  creditosRestantesA: aUsdc(await leer(plataforma, "creditos", new ContractFunctionParameters().addBytes32(b32(codigo.a)))),
};
console.log("\nEstado final:", JSON.stringify(final, null, 2));
console.log(fallosInesperados ? `\n‼ ${fallosInesperados} paso(s) no salieron como se esperaba` : "\nTodos los pasos salieron como se esperaba.");

guardarJson(RESULTADO, {
  red: "testnet",
  plataforma: plataforma?.toString(), colecta: colecta?.toString(), colecta2: colecta2?.toString(),
  hashscan: { plataforma: plataforma && hashscan("contract", plataforma), colecta: colecta && hashscan("contract", colecta), colecta2: colecta2 && hashscan("contract", colecta2) },
  cuentas: Object.fromEntries(ROLES.map((r) => [r, { cuenta: k[r].id, evm: k[r].evm }])),
  final, fallosInesperados, pasos: resumen,
});
client.close();
