// Una sola vez: crea el topic de propuestas (ideas que postula cualquiera, todavía sin aval de una ONG)
// y lo guarda en estado.json. Solo la plataforma escribe (submitKey), sin adminKey: nadie lo puede borrar.
import { leerJson, guardarJson, ESTADO } from "./lib.js";
import { crearTopic, cerrar } from "./colectas.js";

const estado = leerJson(ESTADO) ?? {};
if (estado.propuestasTopicId) {
  console.log(`Ya existe el topic de propuestas: ${estado.propuestasTopicId}`);
  process.exit(0);
}
const { topicId, hashscan } = await crearTopic("Propuestas sin aval - Colectas Trazables (NEA Tech 2026)");
guardarJson(ESTADO, { ...estado, propuestasTopicId: topicId });
console.log(`Topic de propuestas: ${topicId}  ${hashscan}`);
console.log("En Vercel, cargarlo como PROPUESTAS_TOPIC_ID (o se lee de estado.json).");
cerrar();
