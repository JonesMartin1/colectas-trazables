// Una sola vez: crea el topic de registro (la "tabla" de colectas) y lo guarda en estado.json.
import { leerJson, guardarJson, ESTADO } from "./lib.js";
import { crearTopic, cerrar } from "./colectas.js";

const estado = leerJson(ESTADO) ?? {};
if (estado.registroTopicId) {
  console.log(`Ya existe el registro: ${estado.registroTopicId}`);
  process.exit(0);
}
const { topicId, hashscan } = await crearTopic("Registro de Colectas Trazables (NEA Tech 2026)");
guardarJson(ESTADO, { ...estado, registroTopicId: topicId });
console.log(`Topic de registro: ${topicId}  ${hashscan}`);
console.log("En Vercel, cargarlo como REGISTRO_TOPIC_ID.");
cerrar();
