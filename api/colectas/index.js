// GET  /api/colectas  → todas las colectas del topic de registro
// POST /api/colectas  → crea una colecta: topic propio en HCS y alta en el registro
import crypto from "node:crypto";
import { listarColectas, registrarColecta } from "../../hedera/colectas.js";
import { json, error, leerCuerpo, crearId, esCuenta, esperarEnMirror, sha256 } from "../_comun.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const colectas = await listarColectas();
      return json(res, 200, colectas.map(({ campaignId, titulo, meta, topicId, beneficiarioCuenta }) => ({ campaignId, titulo, meta, topicId, beneficiarioCuenta })));
    }
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const b = await leerCuerpo(req);
    const titulo = String(b.titulo || "").trim().slice(0, 100);
    const descripcion = String(b.descripcion || "").trim().slice(0, 300);
    const meta = Math.round(Number(b.meta));
    const beneficiarioCuenta = String(b.beneficiarioCuenta || "").trim();
    if (titulo.length < 3) return error(res, 400, "El nombre de la colecta es muy corto.");
    if (!(meta > 0)) return error(res, 400, "La meta tiene que ser un número mayor que cero.");
    if (!esCuenta(beneficiarioCuenta)) return error(res, 400, "La cuenta destinataria tiene que tener la forma 0.0.123456.");
    const id = crearId(titulo);
    // clave del organizador: se devuelve una sola vez; en el registro queda solo su hash
    const claveOrganizador = crypto.randomBytes(16).toString("hex");
    const alta = await registrarColecta({ campaignId: id, titulo, descripcion, meta, beneficiarioCuenta, orgKeyHash: sha256(claveOrganizador) });
    // la colecta se busca en el registro vía Mirror Node: esperar a que aparezca antes de responder
    await esperarEnMirror(alta.registro.topicId, alta.registro.secuencia);
    const idUrl = encodeURIComponent(id);
    return json(res, 201, {
      id,
      topicId: alta.topicId,
      url: `/colecta.html?id=${idUrl}`,
      hashscan: alta.hashscan,
      claveOrganizador,
      urlOrganizador: `/gasto.html?id=${idUrl}#clave=${claveOrganizador}`, // en el # para que no viaje al servidor
    });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
