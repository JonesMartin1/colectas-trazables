// Prueba de punta a punta del módulo: alta de colecta, donación, gasto y lectura desde el Mirror Node.
import { cerrar, registrarColecta, donarUSDC, publicarEvento, leerEventos, listarColectas, sha256 } from "./colectas.js";
import { leerJson, ESTADO } from "./lib.js";

const beneficiario = leerJson(ESTADO).comercio; // cuenta de prueba ya asociada al token USDCd
const campaignId = `prueba-${Date.now()}`;

const colecta = await registrarColecta({ campaignId, titulo: "Colecta de prueba", descripcion: "DATO SIMULADO", meta: 100000, beneficiarioCuenta: beneficiario });
console.log("Colecta:", colecta.topicId, colecta.hashscan);

const pago = await donarUSDC({ beneficiario, monto: 10 });
const comprobante = `${pago.txId}.${Math.random().toString(36).slice(2, 10)}`;
const donacion = await publicarEvento(colecta.topicId, { type: "DONATION", campaignId, amount: 10, currency: "USDC", method: "usdc", externalRefHash: sha256(comprobante), timestamp: new Date().toISOString() });
console.log("Donación:", pago.hashscan, "→ evento #" + donacion.secuencia);

const gasto = await publicarEvento(colecta.topicId, { type: "EXPENSE", campaignId, amount: 4, currency: "USDC", supplierCuit: "30-00000000-0", cae: "00000000000000", invoiceHash: sha256("factura de prueba"), timestamp: new Date().toISOString() });
console.log("Gasto: evento #" + gasto.secuencia, gasto.hashscan);

await new Promise((r) => setTimeout(r, 6000)); // el Mirror Node tarda unos segundos
const eventos = await leerEventos(colecta.topicId);
const encontrada = eventos.some((e) => e.evento.externalRefHash === sha256(comprobante));
console.log(`Mirror Node: ${eventos.length} eventos; donación verificable con el comprobante: ${encontrada ? "sí" : "NO"}`);
console.log(`Colectas en el registro: ${(await listarColectas()).length}`);
cerrar();
