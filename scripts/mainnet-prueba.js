// Prueba en MAINNET con una billetera real (HashPack). Arma, pagando con la cuenta de la plataforma:
//   1. el topic de registro de colectas (estado-mainnet.json),
//   2. una billetera para la colecta de prueba, asociada al USDC de Circle (0.0.456858), con 1 HBAR para poder
//      devolver el USDC al final,
//   3. la colecta de prueba en el registro (con su topic), con la misma lógica que POST /api/colectas.
// La cuenta de la plataforma se crea sola cuando alguien le manda HBAR a su dirección EVM (hedera/.cuentas-mainnet.json,
// fuera de git). Las claves nunca se imprimen. Se puede volver a correr: retoma donde quedó.
//   node scripts/mainnet-prueba.js            → arma lo que falte
//   node scripts/mainnet-prueba.js registrar <txId>   → registra la donación de esa transacción
//   node scripts/mainnet-prueba.js devolver <0.0.cuenta> → devuelve el USDC de la billetera de la colecta
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CUENTAS = path.join(RAIZ, "hedera", ".cuentas-mainnet.json");
const MIRROR = "https://mainnet-public.mirrornode.hedera.com/api/v1";
const USDC = "0.0.456858";
const cuentas = JSON.parse(fs.readFileSync(CUENTAS, "utf8"));
const guardarCuentas = () => fs.writeFileSync(CUENTAS, JSON.stringify(cuentas, null, 2));
const leer = (ruta) => fetch(MIRROR + ruta).then((r) => (r.ok ? r.json() : null));

// la cuenta de la plataforma: existe recién cuando recibió HBAR en su dirección EVM
const p = cuentas.plataforma;
if (!p.id) {
  const a = await leer(`/accounts/${p.evm}`);
  if (!a?.account) { console.log(`La cuenta de la plataforma todavía no existe: falta mandar HBAR a ${p.evm}`); process.exit(1); }
  p.id = a.account; guardarCuentas();
}
const saldo = (await leer(`/accounts/${p.id}`)).balance.balance / 1e8;
console.log(`Plataforma: ${p.id} · ${saldo.toFixed(2)} HBAR`);

// todo lo que sigue corre en mainnet con la cuenta de la plataforma (antes de importar lib.js, que lee el entorno)
Object.assign(process.env, { HEDERA_NETWORK: "mainnet", HEDERA_ACCOUNT_ID: p.id, HEDERA_PRIVATE_KEY: p.clave, USDC_TOKEN_ID: USDC });
delete process.env.REGISTRO_TOPIC_ID; delete process.env.DEMO_DONANTE_ID; delete process.env.DEMO_DONANTE_KEY;
const sdk = await import("@hashgraph/sdk");
const lib = await import(pathToFileURL(path.join(RAIZ, "hedera", "lib.js")).href);
if (lib.RED !== "mainnet") throw new Error("No quedó en mainnet: no sigo.");
const hedera = await import(pathToFileURL(path.join(RAIZ, "hedera", "colectas.js")).href);
const estado = lib.leerJson(lib.ESTADO) ?? {};
const guardarEstado = () => lib.guardarJson(lib.ESTADO, estado);
const { client } = lib.clienteOperador();
const [orden, arg] = process.argv.slice(2);

if (orden === "registrar") {
  const handler = (await import(pathToFileURL(path.join(RAIZ, "api", "_colecta", "donaciones.js")).href)).default;
  const r = await llamar(handler, { method: "POST", query: { id: estado.colectaPrueba }, body: { txId: arg } });
  console.log(r.status, r.datos.error ?? `Donación registrada · comprobante ${r.datos.comprobante}`);
} else if (orden === "devolver") {
  const b = cuentas.colectaPrueba;
  const t = await leer(`/accounts/${b.id}/tokens?token.id=${USDC}`);
  const unidades = t?.tokens?.[0]?.balance ?? 0;
  if (!unidades) { console.log("La billetera de la colecta no tiene USDC."); process.exit(0); }
  const tx = await new sdk.TransferTransaction().addTokenTransfer(USDC, b.id, -unidades).addTokenTransfer(USDC, arg, unidades)
    .setTransactionMemo("Devolución de la prueba de Colectas Trazables").setTransactionId(sdk.TransactionId.generate(b.id))
    .freezeWith(client).sign(sdk.PrivateKey.fromStringDer(b.clave));
  await (await tx.execute(client)).getReceipt(client);
  console.log(`Devueltos ${unidades / 1e6} USDC a ${arg} · ${lib.hashscan("transaction", lib.idTx(tx.transactionId))}`);
} else {
  // 1. registro de colectas
  if (!estado.registroTopicId) {
    const { topicId } = await hedera.crearTopic("Registro de Colectas Trazables");
    Object.assign(estado, { registroTopicId: topicId, tokenId: USDC }); guardarEstado();
    console.log(`Registro: ${topicId} · ${lib.hashscan("topic", topicId)}`);
  }
  // 2. billetera de la colecta, asociada al USDC
  if (!cuentas.colectaPrueba?.id) {
    const clave = sdk.PrivateKey.generateECDSA();
    const alta = await (await new sdk.AccountCreateTransaction().setKey(clave.publicKey).setInitialBalance(new sdk.Hbar(1))
      .setAccountMemo("Colectas Trazables · colecta de prueba").execute(client)).getReceipt(client);
    cuentas.colectaPrueba = { id: alta.accountId.toString(), clave: clave.toStringDer() }; guardarCuentas();
    console.log(`Billetera de la colecta: ${cuentas.colectaPrueba.id}`);
  }
  if (!cuentas.colectaPrueba.asociada) {
    const b = cuentas.colectaPrueba;
    const tx = await new sdk.TokenAssociateTransaction().setAccountId(b.id).setTokenIds([USDC]).freezeWith(client).sign(sdk.PrivateKey.fromStringDer(b.clave));
    await (await tx.execute(client)).getReceipt(client);
    b.asociada = true; guardarCuentas();
    console.log("Billetera asociada al USDC");
  }
  // 3. la colecta, con la misma validación que la API
  if (!estado.colectaPrueba) {
    const handler = (await import(pathToFileURL(path.join(RAIZ, "api", "colectas", "index.js")).href)).default;
    const r = await llamar(handler, { method: "POST", query: {}, body: {
      titulo: "Prueba en la red real (mainnet)",
      descripcion: "Colecta de prueba técnica de Colectas Trazables: una donación real desde HashPack, verificada y registrada. No es una organización real; el USDC se devuelve.",
      meta: 10000, beneficiarioCuenta: cuentas.colectaPrueba.id,
      organizador: { nombre: "Colectas Trazables (prueba técnica)", tipo: "Simple asociación", cuit: "30-00000000-0", igpj: "prueba" },
    } });
    if (r.status !== 201) throw new Error(r.datos.error);
    estado.colectaPrueba = r.datos.id; guardarEstado();
    console.log(`Colecta: ${r.datos.id} · topic ${r.datos.topicId}`);
  }
  console.log(`\nPara donar desde HashPack:\n  Cuenta: ${cuentas.colectaPrueba.id}\n  Memo:   colecta:${estado.colectaPrueba}\n  Token:  USDC (${USDC})`);
  const final = (await leer(`/accounts/${p.id}`)).balance.balance / 1e8;
  console.log(`Plataforma: quedan ${final.toFixed(2)} HBAR (se gastaron ${(saldo - final).toFixed(2)})`);
}
client.close();
process.exit(0);

/** Corre una función de la API sin servidor y devuelve { status, datos }. */
async function llamar(handler, req) {
  let status = 200, cuerpo = "";
  const res = { status(c) { status = c; return res; }, setHeader() { return res; }, end(t) { cuerpo = t; }, json(d) { cuerpo = JSON.stringify(d); } };
  await handler(req, res);
  return { status, datos: JSON.parse(cuerpo || "{}") };
}
