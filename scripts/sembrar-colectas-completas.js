// Da de alta en testnet las colectas de la portada (scripts/casos-reales.json) con su historia completa:
// - cada colecta con su BILLETERA PROPIA (cuenta de Hedera asociada al USDC de prueba): sin eso, las salidas de
//   distintas colectas se mezclan y no se pueden atribuir;
// - donaciones USDC verificadas en el Mirror Node;
// - retiros de la billetera a una cuenta que hace de exchange (como mandar USDC a Binance para pasarlo a pesos):
//   quedan en Hedera aunque nadie los cargue, y la página los muestra solos;
// - gastos con factura de demostración (CAE, proveedor y la huella del PDF de web/ejemplo/facturas).
// Usa la API de siempre, así que hace falta `npm run dev` corriendo:  node scripts/sembrar-colectas-completas.js [url]
// Antes, `python scripts/facturas-demo.py`. Las claves (organizador y billeteras) quedan en hedera/.casos-reales.json,
// fuera de git, nunca en la consola. Se puede cortar y volver a correr: retoma donde quedó.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AccountCreateTransaction, Hbar, PrivateKey, TokenAssociateTransaction, TransferTransaction } from "@hashgraph/sdk";
import { clienteOperador, leerJson, CUENTAS, ESTADO, DECIMALES } from "../hedera/lib.js";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.argv[2] || "http://localhost:3000";
const DATOS = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts", "casos-reales.json"), "utf8"));
const FACTURAS = JSON.parse(fs.readFileSync(path.join(RAIZ, "web", "ejemplo", "facturas", "index.json"), "utf8"));
const HASH_DE = Object.fromEntries(Object.entries(FACTURAS).map(([hash, url]) => [path.basename(url), hash]));
const ESTADO_SEMBRADO = path.join(RAIZ, "hedera", ".casos-reales.json");
const COTIZACION = Number(process.env.COTIZACION_ARS_USD) || 1400;
const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";

const hecho = fs.existsSync(ESTADO_SEMBRADO) ? JSON.parse(fs.readFileSync(ESTADO_SEMBRADO, "utf8")) : {};
const guardar = () => fs.writeFileSync(ESTADO_SEMBRADO, JSON.stringify(hecho, null, 2));
const estado = leerJson(ESTADO), cuentas = leerJson(CUENTAS);
const token = process.env.USDC_TOKEN_ID ?? estado.tokenId, donante = process.env.DEMO_DONANTE_ID ?? cuentas.comprador.id;
const { client, id: operador } = clienteOperador();
const unidades = (pesos) => Math.round((pesos / COTIZACION) * 10 ** DECIMALES);

async function pedir(ruta, cuerpo) {
  const r = await fetch(BASE + ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const d = await r.json();
  if (!r.ok) throw new Error(`${ruta}: ${d.error || r.status}`);
  return d;
}

/** Cuenta nueva de testnet, asociada al USDC de prueba. La paga la plataforma; la clave queda solo en el archivo local. */
async function crearCuenta(memo) {
  const clave = PrivateKey.generateECDSA();
  const alta = await (await new AccountCreateTransaction().setKey(clave.publicKey).setInitialBalance(new Hbar(2)).setAccountMemo(memo).execute(client)).getReceipt(client);
  const id = alta.accountId.toString();
  const asociar = await new TokenAssociateTransaction().setAccountId(id).setTokenIds([token]).freezeWith(client).sign(clave);
  await (await asociar.execute(client)).getReceipt(client);
  return { id, clave: clave.toStringDer() };
}

// 1. la billetera de demo del donante necesita USDC de prueba para las donaciones: se recarga desde la plataforma
const pendiente = DATOS.casos.reduce((s, c) => s + c.donaciones.slice(hecho[c.clave]?.donaciones ?? 0).reduce((a, b) => a + b, 0), 0);
const necesita = Math.ceil(pendiente / COTIZACION) + 20;
const saldo = await fetch(`${MIRROR}/accounts/${donante}/tokens?token.id=${token}`).then((r) => r.json()).then((d) => (d.tokens?.[0]?.balance ?? 0) / 10 ** DECIMALES);
if (pendiente && saldo < necesita) {
  const u = Math.round((necesita - saldo) * 10 ** DECIMALES);
  await (await new TransferTransaction().addTokenTransfer(token, operador, -u).addTokenTransfer(token, donante, u).setTransactionMemo("recarga demo").execute(client)).getReceipt(client);
  console.log(`recarga: ${(u / 10 ** DECIMALES).toFixed(2)} USDC de prueba a la billetera de demo`);
}

// 2. la cuenta que hace de exchange (en la vida real, la cuenta de depósito de Binance u otro, con su memo)
if (!hecho.exchange) { hecho.exchange = await crearCuenta("Exchange (demo) · Colectas Trazables"); guardar(); }
console.log(`exchange de demo: ${hecho.exchange.id}`);

// 3. cada colecta: billetera propia, alta, donaciones, y retiros intercalados con los gastos
for (const c of DATOS.casos) {
  const h = (hecho[c.clave] ??= { donaciones: 0, retiros: 0, gastos: 0 });
  if (!h.billetera) { h.billetera = await crearCuenta(`Billetera de la colecta (demo): ${c.clave}`); guardar(); console.log(`${c.clave}: billetera ${h.billetera.id}`); }
  if (!h.id) {
    const alta = await pedir("/api/colectas", { titulo: c.titulo, descripcion: c.descripcion, meta: c.meta, beneficiarioCuenta: h.billetera.id, organizador: c.organizador });
    Object.assign(h, { id: alta.id, topicId: alta.topicId, claveOrganizador: alta.claveOrganizador });
    guardar();
    console.log(`${c.clave}: alta ${alta.id} · topic ${alta.topicId}`);
  }
  for (; h.donaciones < c.donaciones.length; h.donaciones++, guardar()) {
    const pago = await pedir("/api/demo/donar", { campaignId: h.id, monto: c.donaciones[h.donaciones] });
    await pedir(`/api/colectas/${encodeURIComponent(h.id)}/donaciones`, { txId: pago.txId });
    console.log(`${c.clave}: donación ${h.donaciones + 1}/${c.donaciones.length} de $${c.donaciones[h.donaciones]} verificada`);
  }
  // orden de la vida real: primer retiro, la mitad de los gastos, segundo retiro, el resto de los gastos
  const mitad = Math.ceil(c.gastos.length / 2);
  const pasos = [["retiro", 0], ...c.gastos.slice(0, mitad).map((_, i) => ["gasto", i]), ["retiro", 1], ...c.gastos.slice(mitad).map((_, i) => ["gasto", mitad + i])];
  for (const [tipo, i] of pasos) {
    if (tipo === "retiro" && i === h.retiros && i < c.retiros.length) {
      const u = unidades(c.retiros[i]);
      const tx = await new TransferTransaction().addTokenTransfer(token, h.billetera.id, -u).addTokenTransfer(token, hecho.exchange.id, u)
        .setTransactionMemo("Retiro a pesos (demo)").freezeWith(client).sign(PrivateKey.fromStringDer(h.billetera.clave));
      await (await tx.execute(client)).getReceipt(client);
      h.retiros++; guardar();
      console.log(`${c.clave}: retiro ${i + 1}/${c.retiros.length} de $${c.retiros[i]} al exchange`);
    }
    if (tipo === "gasto" && i === h.gastos) {
      const g = c.gastos[i];
      const invoiceHash = HASH_DE[`${c.clave}-${i + 1}.pdf`];
      if (!invoiceHash) throw new Error(`Falta la factura ${c.clave}-${i + 1}.pdf: corré python scripts/facturas-demo.py`);
      const monto = g.items.reduce((s, [, cant, unit]) => s + cant * unit, 0);
      const r = await pedir(`/api/colectas/${encodeURIComponent(h.id)}/gastos`, { monto, proveedorCuit: g.cuit, cae: g.cae, invoiceHash, detalle: g.detalle, proveedor: g.proveedor, clave: h.claveOrganizador });
      h.gastos++; guardar();
      console.log(`${c.clave}: gasto ${i + 1}/${c.gastos.length} "${g.detalle}" $${monto} · ${r.hashscan}`);
    }
  }
}
client.close();
console.log(`\nExchange de demo para api/_exchanges.js: ${hecho.exchange.id}`);
console.log("IDs para api/_destacadas.js:");
for (const c of DATOS.casos) console.log(`  ${c.clave}: ${hecho[c.clave].id} · billetera ${hecho[c.clave].billetera.id}`);
