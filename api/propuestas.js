// GET  /api/propuestas → propuestas postuladas (ideas sin aval de una ONG todavía), de la más nueva a la más vieja.
// POST /api/propuestas { titulo, descripcion, provincia, categoria, montoEstimado } → evento PROPOSAL en el topic de
// propuestas. Cualquiera puede postular una idea; pasa a ser colecta cuando una organización validada la avala y la crea.
// No va ningún dato personal: ni el nombre ni el email de quien postula.
import { leerEventos, publicarEvento } from "../hedera/colectas.js";
import { leerJson, ESTADO } from "../hedera/lib.js";
import { json, error, leerCuerpo, esperarEnMirror } from "./_comun.js";

export const PROVINCIAS = ["Corrientes", "Chaco", "Misiones", "Formosa"];
export const CATEGORIAS = ["Inundaciones", "Incendios", "Agua", "Salud", "Alimentación", "Educación", "Otra"];
const ROTO = /�/; // texto que no llegó en UTF-8
const limpio = (s, max) => String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  try {
    const topicId = process.env.PROPUESTAS_TOPIC_ID ?? leerJson(ESTADO)?.propuestasTopicId;
    if (!topicId) return error(res, 503, "El registro de propuestas no está configurado.");
    if (req.method === "GET") {
      const lista = (await leerEventos(topicId))
        .filter((e) => e.evento.type === "PROPOSAL" && !ROTO.test(JSON.stringify(e.evento))) // se ignoran los de codificación rota
        .map((e) => ({ ...e.evento, secuencia: e.secuencia, fecha: e.fecha, hashscan: e.hashscan }))
        .reverse();
      return json(res, 200, { topicId, hashscan: `https://hashscan.io/testnet/topic/${topicId}`, propuestas: lista });
    }
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const b = await leerCuerpo(req);
    const titulo = limpio(b.titulo, 90);
    const descripcion = limpio(b.descripcion, 260);
    const provincia = PROVINCIAS.includes(b.provincia) ? b.provincia : null;
    const categoria = CATEGORIAS.includes(b.categoria) ? b.categoria : null;
    const montoEstimado = Math.round(Number(b.montoEstimado));
    if (ROTO.test(titulo + descripcion)) return error(res, 400, "El texto llegó con caracteres inválidos: mandalo en UTF-8.");
    if (titulo.length < 5) return error(res, 400, "Contá la idea en un título de al menos 5 letras.");
    if (descripcion.length < 20) return error(res, 400, "Describí un poco más qué hace falta y para quién.");
    if (!provincia) return error(res, 400, "Elegí la provincia.");
    if (!categoria) return error(res, 400, "Elegí el tema.");
    if (!(montoEstimado > 0) || montoEstimado > 100_000_000) return error(res, 400, "El monto estimado tiene que estar entre $1 y $100.000.000.");
    const reg = await publicarEvento(topicId, { type: "PROPOSAL", titulo, descripcion, provincia, categoria, montoEstimado, timestamp: new Date().toISOString() });
    await esperarEnMirror(topicId, reg.secuencia);
    return json(res, 201, { secuencia: reg.secuencia, hashscan: reg.hashscan });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
