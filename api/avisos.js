// GET /api/avisos → avisos oficiales (del más nuevo al más viejo), leídos del Mirror Node.
import { listarAvisos } from "../hedera/avisos.js";
import { leerJson, ESTADO } from "../hedera/lib.js";
import { json, error } from "./_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return error(res, 405, "Método no permitido");
    const topicId = process.env.AVISOS_TOPIC_ID ?? leerJson(ESTADO)?.avisosTopicId;
    if (!topicId) return error(res, 503, "El canal de avisos no está configurado.");
    return json(res, 200, { canal: topicId, hashscan: `https://hashscan.io/testnet/topic/${topicId}`, avisos: await listarAvisos(topicId) });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
