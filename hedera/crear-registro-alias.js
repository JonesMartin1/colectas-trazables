// Una sola vez: genera las 4 claves de prueba de los firmantes y crea el topic de alias con umbral 2 de 4.
// Las claves quedan en hedera/.firmantes.json (no se sube); el topic, en estado.json.
import { PrivateKey } from "@hashgraph/sdk";
import { leerJson, guardarJson, ESTADO } from "./lib.js";
import { FIRMANTES, FIRMANTES_URL, crearTopicAlias, cerrar } from "./alias.js";

const estado = leerJson(ESTADO) ?? {};
if (estado.aliasTopicId) {
  console.log(`Ya existe el registro de alias: ${estado.aliasTopicId}`);
  process.exit(0);
}
const claves = {};
const publicas = [];
for (const f of FIRMANTES) {
  const k = PrivateKey.generateECDSA();
  claves[f.id] = k.toStringDer();
  publicas.push(k.publicKey);
}
guardarJson(FIRMANTES_URL, claves);
const { topicId, hashscan } = await crearTopicAlias(publicas);
guardarJson(ESTADO, { ...estado, aliasTopicId: topicId });
console.log(`Registro de alias (2 de 4): ${topicId}  ${hashscan}`);
console.log("En Vercel, cargarlo como ALIAS_TOPIC_ID.");
cerrar();
