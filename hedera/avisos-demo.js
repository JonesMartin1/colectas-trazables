// Una sola vez: crea el canal de avisos y publica partes de demostración con cifras tomadas de la prensa
// (no son partes oficiales: cada aviso dice su fuente). Uso: node hedera/avisos-demo.js
import { leerJson, guardarJson, ESTADO } from "./lib.js";
import { crearCanalAvisos, publicarAviso, cerrar } from "./avisos.js";

const estado = leerJson(ESTADO) ?? {};
let topicId = estado.avisosTopicId;
if (!topicId) {
  ({ topicId } = await crearCanalAvisos());
  guardarJson(ESTADO, { ...estado, avisosTopicId: topicId });
  console.log(`Canal de avisos: ${topicId}  https://hashscan.io/testnet/topic/${topicId}`);
}
const DEMO = [
  { tipo: "parte", titulo: "Evacuados por la crecida", localidad: "Provincia de Corrientes", fechaParte: "2026-10-14", cifras: { evacuados: 108, localidades: 5 }, fuente: "El Litoral, 14/10/2026 (dato de prensa, demo)" },
  { tipo: "parte", titulo: "Evacuados por la crecida", localidad: "Provincia de Corrientes", fechaParte: "2026-10-15", cifras: { evacuados: 222 }, fuente: "El Litoral, 15/10/2026 (dato de prensa, demo)" },
  { tipo: "alerta", titulo: "Se esperan niveles de evacuación del Paraná", localidad: "Ribera del Paraná", fechaParte: "2026-10-16", texto: "Se prevé superar los valores de evacuación entre el 20 y el 21 de octubre.", fuente: "Declaración de Defensa Civil citada por Infobae, 16/10/2026 (demo)" },
];
for (const a of DEMO) {
  const r = await publicarAviso(topicId, a);
  console.log(`Aviso "${a.titulo}" (${a.fechaParte}): mensaje #${r.secuencia}  ${r.hashscan}`);
}
console.log("En Vercel, cargar AVISOS_TOPIC_ID.");
cerrar();
