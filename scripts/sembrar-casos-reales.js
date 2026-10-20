// Una sola vez: da de alta en testnet las colectas de casos reales del NEA (último año) que se muestran en la portada.
// Usa la API (la misma que la web), así que hace falta `npm run dev` corriendo: node scripts/sembrar-casos-reales.js [url]
// Los hechos son reales (fuentes en api/_destacadas.js); la organización es de demo, porque ninguna ONG real
// organiza estas colectas en la plataforma. Cada una recibe una donación de prueba en USDC, verificada en el Mirror Node.
// Las claves de organizador quedan en hedera/.demo-organizador.json (fuera de git), nunca en la consola.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://localhost:3000";
const CLAVES = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "hedera", ".demo-organizador.json");
const BENEFICIARIO = "0.0.11041201"; // cuenta "comercio" de la demo, ya asociada al USDC de prueba
const org = (nombre, tipo) => ({ nombre, tipo, cuit: "30-00000000-0", igpj: "Res. 000/2026 (demo)" });

const CASOS = [
  {
    clave: "itati",
    titulo: "Evacuados de Itatí por la crecida del Paraná",
    descripcion: "Octubre de 2026: el Paraná superó la cota crítica y 55 personas de 15 familias dejaron sus casas en Itatí. Agua potable, colchones, alimentos y kits de limpieza para volver.",
    meta: 4000000, donacion: 25000,
    organizador: org("Asociación Civil Manos del Litoral (demo)", "Asociación civil"),
  },
  {
    clave: "isla-cerrito",
    titulo: "Isla del Cerrito, aislada por la crecida",
    descripcion: "Octubre de 2026: 101 familias (unas 180 personas) armaron refugios en el puente San Pedro y se desplazaron 4.000 animales. Lonas, agua, alimentos y forraje mientras la isla siga incomunicada.",
    meta: 5000000, donacion: 40000,
    organizador: org("Cooperadora Ribereña del Chaco (demo)", "Cooperadora"),
  },
  {
    clave: "paso-libres",
    titulo: "Familias evacuadas por el río Uruguay en Paso de los Libres",
    descripcion: "Octubre de 2026: 31 personas de 6 familias dejaron sus casas por la crecida del río Uruguay y están alojadas en barracas del Ejército. Colchones, frazadas, alimentos e higiene.",
    meta: 2000000, donacion: 15000,
    organizador: org("Bomberos Voluntarios del Litoral (demo)", "Bomberos voluntarios"),
  },
  {
    clave: "obera",
    titulo: "Temporal en Oberá: familias evacuadas por los arroyos",
    descripcion: "Junio de 2026: desbordaron los arroyos Tuicha y Yaboty y hubo familias evacuadas en Oberá; en Eldorado se asistió a más de 100. Chapas, colchones, frazadas y plásticos para los techos.",
    meta: 3500000, donacion: 30000,
    organizador: org("Fundación Tierra Colorada (demo)", "Fundación"),
  },
  {
    clave: "castelli",
    titulo: "Lluvias en Castelli: 300 personas en centros de evacuados",
    descripcion: "Abril de 2026: las lluvias intensas obligaron a trasladar a 300 personas a tres centros comunitarios de Juan José Castelli, Chaco. Bolsones de alimentos, agua y elementos de higiene.",
    meta: 3000000, donacion: 20000,
    organizador: org("Comisión Vecinal Impenetrable Solidario (demo)", "Comisión vecinal"),
  },
];

async function pedir(ruta, cuerpo) {
  const r = await fetch(BASE + ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const d = await r.json();
  if (!r.ok) throw new Error(`${ruta}: ${d.error || r.status}`);
  return d;
}

const guardadas = fs.existsSync(CLAVES) ? JSON.parse(fs.readFileSync(CLAVES, "utf8")) : {};
for (const c of CASOS) {
  if (guardadas[c.clave]) { console.log(`${c.clave}: ya existe (${guardadas[c.clave].id})`); continue; }
  const alta = await pedir("/api/colectas", { titulo: c.titulo, descripcion: c.descripcion, meta: c.meta, beneficiarioCuenta: BENEFICIARIO, organizador: c.organizador });
  guardadas[c.clave] = { id: alta.id, topicId: alta.topicId, claveOrganizador: alta.claveOrganizador };
  fs.writeFileSync(CLAVES, JSON.stringify(guardadas, null, 2));
  const pago = await pedir("/api/demo/donar", { campaignId: alta.id, monto: c.donacion });
  await pedir(`/api/colectas/${encodeURIComponent(alta.id)}/donaciones`, { txId: pago.txId });
  console.log(`${c.clave}: ${alta.id} · topic ${alta.topicId} · donación de $${c.donacion} verificada`);
}
