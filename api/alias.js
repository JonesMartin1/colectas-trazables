// GET /api/alias?alias=... → ¿es un alias oficial? Lee el registro de alias (2 de 4) desde el Mirror Node.
// Respuestas: estado "oficial" (con titular y firmantes), "parecido" (se parece a uno oficial) o "no_registrado".
import { consultarAlias } from "../hedera/alias.js";
import { leerJson, ESTADO, hashscan } from "../hedera/lib.js";
import { json, error } from "./_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return error(res, 405, "Método no permitido");
    const alias = String(req.query.alias || "").trim();
    if (alias.length < 3 || alias.length > 60) return error(res, 400, "Escribí un alias de entre 3 y 60 caracteres.");
    const topicId = process.env.ALIAS_TOPIC_ID ?? leerJson(ESTADO)?.aliasTopicId;
    if (!topicId) return error(res, 503, "El registro de alias no está configurado.");
    const r = await consultarAlias(topicId, alias);
    return json(res, 200, { ...r, registro: hashscan("topic", topicId) });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
