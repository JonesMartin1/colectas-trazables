// Demo de punta a punta del fideicomiso en testnet: crea los firmantes y el proveedor de prueba,
// despliega el contrato (sin clave de administrador: nadie lo puede cambiar), lo fondea con USDCd
// como lo haría la rampa y muestra que la plata solo sale con 2 de 3 firmas hacia un proveedor aprobado.
//   node contratos/demo.js [campaignId]
import fs from "node:fs";
import crypto from "node:crypto";
import {
  AccountCreateTransaction, AccountId, Client, ContractCallQuery, ContractCreateFlow, ContractExecuteTransaction,
  ContractFunctionParameters, Hbar, PrivateKey, TokenId, TransactionRecordQuery, TransferTransaction,
} from "@hashgraph/sdk";
import { clienteOperador, leerClave, leerJson, guardarJson, ESTADO, CUENTAS, hashscan, idTx } from "../hedera/lib.js";

const CLAVES = new URL("./.claves.json", import.meta.url); // fuera de git y de Vercel
const RESULTADO = new URL("./fideicomiso.json", import.meta.url);
const BIN = new URL("./build/FideicomisoColecta_sol_FideicomisoColecta.bin", import.meta.url);
const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";
const COLECTA = process.argv[2] ?? "colchones-y-agua-para-itati-532f2d";
const FIRMANTES = ["organizacion", "defensa-civil", "caritas"];
const UMBRAL = 2;
const usdc = (n) => Math.round(n * 1e6);

const { client } = clienteOperador();
const estado = leerJson(ESTADO);
const token = TokenId.fromString(process.env.USDC_TOKEN_ID ?? estado.tokenId);
const direccion = (id) => "0x" + AccountId.fromString(id.toString()).toSolidityAddress();
const clienteDe = (cuenta) => Client.forTestnet().setOperator(cuenta.id, leerClave(cuenta.clave));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pasos = [];

/** Los firmantes tienen alias EVM: así msg.sender es su dirección 0x, la que se le pasa al contrato. */
async function cuentasDePrueba() {
  const guardadas = leerJson(CLAVES) ?? {};
  for (const rol of [...FIRMANTES, "proveedor"]) {
    if (guardadas[rol]) continue;
    const clave = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction()
      .setECDSAKeyWithAlias(clave.publicKey)
      .setInitialBalance(new Hbar(5))
      .setMaxAutomaticTokenAssociations(rol === "proveedor" ? 5 : 0) // el proveedor recibe USDCd sin asociarlo a mano
      .execute(client);
    const id = (await tx.getReceipt(client)).accountId.toString();
    guardadas[rol] = { id, clave: clave.toStringDer(), evm: "0x" + clave.publicKey.toEvmAddress() };
    guardarJson(CLAVES, guardadas);
  }
  return guardadas;
}

/** Decodifica el require(...) que hizo fallar la llamada: Error(string) en ABI. */
function motivo(hex) {
  const h = (hex ?? "").replace(/^0x/, "");
  if (!h.startsWith("08c379a0")) return null;
  const largo = parseInt(h.slice(8 + 64, 8 + 128), 16);
  return Buffer.from(h.slice(8 + 128, 8 + 128 + largo * 2), "hex").toString("utf8");
}

async function ejecutar(contrato, quien, funcion, parametros, descripcion) {
  const c = clienteDe(quien);
  try {
    const tx = await new ContractExecuteTransaction().setContractId(contrato).setGas(2_000_000).setFunction(funcion, parametros).execute(c);
    const rec = await new TransactionRecordQuery().setTransactionId(tx.transactionId).setValidateReceiptStatus(false).execute(c);
    const ok = rec.receipt.status.toString() === "SUCCESS";
    const paso = { descripcion, ok, tx: idTx(tx.transactionId), motivo: ok ? null : motivo(rec.contractFunctionResult?.errorMessage) ?? rec.receipt.status.toString() };
    pasos.push(paso);
    console.log(`${ok ? "✔" : "✘"} ${descripcion}${ok ? "" : ` → rechazado: "${paso.motivo}"`}\n   ${hashscan("transaction", paso.tx)}`);
    return paso;
  } finally {
    c.close();
  }
}

async function saldoContrato(contrato) {
  const r = await new ContractCallQuery().setContractId(contrato).setGas(100_000).setFunction("saldo").execute(client);
  return Number(r.getUint256(0)) / 1e6;
}

async function saldoCuenta(id) {
  await esperar(6000); // el Mirror Node tarda unos segundos
  const j = await (await fetch(`${MIRROR}/accounts/${id}/tokens?token.id=${token}`)).json();
  return (j.tokens?.[0]?.balance ?? 0) / 1e6;
}

const cuentas = await cuentasDePrueba();
const p = (rol) => cuentas[rol];
console.log("Firmantes:", FIRMANTES.map((r) => `${r} ${p(r).id}`).join(" · "), `· proveedor ${p("proveedor").id}`);

// 1. Despliegue sin clave de administrador.
const crear = await new ContractCreateFlow()
  .setBytecode(fs.readFileSync(BIN, "utf8"))
  .setGas(3_000_000)
  .setConstructorParameters(
    new ContractFunctionParameters()
      .addAddress(direccion(token))
      .addString(COLECTA)
      .addAddressArray(FIRMANTES.map((r) => p(r).evm))
      .addUint8(UMBRAL)
  )
  .setContractMemo(`Fideicomiso de la colecta ${COLECTA}`.slice(0, 100))
  .execute(client);
const contrato = (await crear.getReceipt(client)).contractId;
console.log(`\n✔ Contrato desplegado: ${contrato}\n   ${hashscan("contract", contrato)}`);

// 2. La rampa (acá simulada por la cuenta donante de la demo) manda el USDC al contrato, no a la organización.
const cs = leerJson(CUENTAS) ?? {};
const donante = { id: process.env.DEMO_DONANTE_ID ?? cs.comprador.id, clave: process.env.DEMO_DONANTE_KEY ?? cs.comprador.clave };
const cd = clienteDe(donante);
const fondeo = await new TransferTransaction()
  .addTokenTransfer(token, donante.id, -usdc(50))
  .addTokenTransfer(token, AccountId.fromString(contrato.toString()), usdc(50))
  .setTransactionMemo(`colecta:${COLECTA}`)
  .execute(cd);
await fondeo.getReceipt(cd);
cd.close();
console.log(`✔ Entran 50 USDCd al contrato (como los mandaría la rampa)\n   ${hashscan("transaction", idTx(fondeo.transactionId))}`);
console.log(`   Saldo del contrato: ${await saldoContrato(contrato)} USDCd\n`);

const factura = "0x" + crypto.createHash("sha256").update(`factura-demo-colchones-${contrato}`).digest("hex");
const prov = p("proveedor").evm; // la cuenta tiene alias EVM: Hedera la reconoce por esa dirección
const pago = () => new ContractFunctionParameters().addAddress(prov).addInt64(usdc(20)).addBytes32(Buffer.from(factura.slice(2), "hex"));

// 3. Las protecciones.
await ejecutar(contrato, p("organizacion"), "proponerPago", pago(), "La organización intenta pagarle a un proveedor que nadie aprobó");
await ejecutar(contrato, p("proveedor"), "proponerProveedor", new ContractFunctionParameters().addAddress(prov), "El proveedor intenta aprobarse solo");
await ejecutar(contrato, p("organizacion"), "proponerProveedor", new ContractFunctionParameters().addAddress(prov), "La organización propone al proveedor (1 de 2 firmas)");
await ejecutar(contrato, p("defensa-civil"), "aprobar", new ContractFunctionParameters().addUint256(0), "Defensa Civil aprueba al proveedor (2 de 2: queda aprobado)");
await ejecutar(contrato, p("organizacion"), "proponerPago", pago(), "La organización pide pagar 20 USDCd con la huella de la factura (1 de 2)");
await ejecutar(contrato, p("organizacion"), "aprobar", new ContractFunctionParameters().addUint256(1), "La organización intenta firmar dos veces");
console.log(`   Saldo del contrato con una sola firma: ${await saldoContrato(contrato)} USDCd (no se movió)`);
await ejecutar(contrato, p("caritas"), "aprobar", new ContractFunctionParameters().addUint256(1), "Cáritas aprueba el pago (2 de 2: se paga solo)");

const saldoFinal = await saldoContrato(contrato);
const recibio = await saldoCuenta(p("proveedor").id);
console.log(`\nSaldo final del contrato: ${saldoFinal} USDCd · el proveedor recibió: ${recibio} USDCd`);

guardarJson(RESULTADO, {
  red: "testnet",
  contrato: contrato.toString(),
  hashscan: hashscan("contract", contrato),
  colecta: COLECTA,
  token: token.toString(),
  umbral: UMBRAL,
  firmantes: Object.fromEntries(FIRMANTES.map((r) => [r, { cuenta: p(r).id, evm: p(r).evm }])),
  proveedor: p("proveedor").id,
  factura,
  fondeo: idTx(fondeo.transactionId),
  pasos,
  saldoFinal,
  proveedorRecibio: recibio,
});
client.close();
