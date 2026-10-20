// Da de alta en testnet las colectas de la portada (scripts/casos-reales.json) con su historia completa:
// varias donaciones USDC verificadas en el Mirror Node y gastos con factura de demostración (CAE, proveedor y la
// huella del PDF de web/ejemplo/facturas). Así la portada muestra cómo se ve una colecta en marcha.
// Usa la API de siempre, así que hace falta `npm run dev` corriendo:  node scripts/sembrar-colectas-completas.js [url]
// Antes, `python scripts/facturas-demo.py` (genera los PDF y el índice de hashes).
// Las claves de organizador quedan en hedera/.casos-reales.json (fuera de git), nunca en la consola.
// Se puede cortar y volver a correr: retoma donde quedó.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TransferTransaction } from "@hashgraph/sdk";
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

async function pedir(ruta, cuerpo) {
  const r = await fetch(BASE + ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const d = await r.json();
  if (!r.ok) throw new Error(`${ruta}: ${d.error || r.status}`);
  return d;
}

// 1. la billetera de demo del donante necesita USDC de prueba para todas las donaciones: se recarga desde la plataforma
const estado = leerJson(ESTADO), cuentas = leerJson(CUENTAS);
const token = process.env.USDC_TOKEN_ID ?? estado.tokenId, donante = process.env.DEMO_DONANTE_ID ?? cuentas.comprador.id;
const pendiente = DATOS.casos.reduce((s, c) => s + c.donaciones.slice(hecho[c.clave]?.donaciones ?? 0).reduce((a, b) => a + b, 0), 0);
const necesita = Math.ceil(pendiente / COTIZACION) + 20;
const saldo = await fetch(`${MIRROR}/accounts/${donante}/tokens?token.id=${token}`).then((r) => r.json()).then((d) => (d.tokens?.[0]?.balance ?? 0) / 10 ** DECIMALES);
if (saldo < necesita) {
  const { client, id } = clienteOperador();
  const unidades = Math.round((necesita - saldo) * 10 ** DECIMALES);
  const tx = await new TransferTransaction().addTokenTransfer(token, id, -unidades).addTokenTransfer(token, donante, unidades).setTransactionMemo("recarga demo").execute(client);
  await tx.getReceipt(client);
  client.close();
  console.log(`recarga: ${(unidades / 10 ** DECIMALES).toFixed(2)} USDC de prueba a la billetera de demo`);
}

// 2. cada colecta: alta, donaciones y gastos
for (const c of DATOS.casos) {
  const h = (hecho[c.clave] ??= { donaciones: 0, gastos: 0 });
  if (!h.id) {
    const alta = await pedir("/api/colectas", { titulo: c.titulo, descripcion: c.descripcion, meta: c.meta, beneficiarioCuenta: DATOS.beneficiario, organizador: c.organizador });
    Object.assign(h, { id: alta.id, topicId: alta.topicId, claveOrganizador: alta.claveOrganizador });
    guardar();
    console.log(`${c.clave}: alta ${alta.id} · topic ${alta.topicId}`);
  }
  for (; h.donaciones < c.donaciones.length; h.donaciones++, guardar()) {
    const pago = await pedir("/api/demo/donar", { campaignId: h.id, monto: c.donaciones[h.donaciones] });
    await pedir(`/api/colectas/${encodeURIComponent(h.id)}/donaciones`, { txId: pago.txId });
    console.log(`${c.clave}: donación ${h.donaciones + 1}/${c.donaciones.length} de $${c.donaciones[h.donaciones]} verificada`);
  }
  for (; h.gastos < c.gastos.length; h.gastos++, guardar()) {
    const g = c.gastos[h.gastos];
    const invoiceHash = HASH_DE[`${c.clave}-${h.gastos + 1}.pdf`];
    if (!invoiceHash) throw new Error(`Falta la factura ${c.clave}-${h.gastos + 1}.pdf: corré python scripts/facturas-demo.py`);
    const monto = g.items.reduce((s, [, cant, unit]) => s + cant * unit, 0);
    const r = await pedir(`/api/colectas/${encodeURIComponent(h.id)}/gastos`, { monto, proveedorCuit: g.cuit, cae: g.cae, invoiceHash, detalle: g.detalle, proveedor: g.proveedor, clave: h.claveOrganizador });
    console.log(`${c.clave}: gasto ${h.gastos + 1}/${c.gastos.length} "${g.detalle}" $${monto} · ${r.hashscan}`);
  }
}
console.log("\nIDs para api/_destacadas.js:");
for (const c of DATOS.casos) console.log(`  ${c.clave}: ${hecho[c.clave].id}`);
