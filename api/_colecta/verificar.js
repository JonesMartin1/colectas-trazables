// GET /api/colectas/:id/verificar?comprobante=... → ¿está esta donación en el registro?
// Se recalcula el hash del comprobante y se busca entre los eventos leídos del Mirror Node.
import { leerEventos } from "../../hedera/colectas.js";
import { json, error, buscarColecta, sha256 } from "../_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const comprobante = String(req.query.comprobante || "").trim();
    if (!comprobante) return error(res, 400, "Falta el código del comprobante.");
    const buscado = sha256(comprobante);
    const e = (await leerEventos(colecta.topicId)).find((x) => x.evento.type === "DONATION" && x.evento.externalRefHash === buscado);
    if (!e) return json(res, 200, { encontrada: false });
    return json(res, 200, { encontrada: true, secuencia: e.secuencia, fecha: e.fecha, monto: e.evento.amount, hashscan: e.hashscan });
  } catch (err) {
    return error(res, 500, err.message);
  }
}
