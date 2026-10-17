// GET  /api/colectas  → todas las colectas del topic de registro
// POST /api/colectas  → crea una colecta: topic propio en HCS y alta en el registro
import crypto from "node:crypto";
import { listarColectas, registrarColecta } from "../../hedera/colectas.js";
import { json, error, leerCuerpo, crearId, esCuenta, esperarEnMirror, sha256 } from "../_comun.js";

export const TIPOS = ["Asociación civil", "Fundación", "Simple asociación", "Cooperadora", "Bomberos voluntarios", "Comisión vecinal", "Municipio u organismo público"];

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const colectas = await listarColectas();
      return json(res, 200, colectas.map(({ campaignId, titulo, meta, topicId, beneficiarioCuenta }) => ({ campaignId, titulo, meta, topicId, beneficiarioCuenta })));
    }
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const b = await leerCuerpo(req);
    const titulo = String(b.titulo || "").trim().slice(0, 100);
    const descripcion = String(b.descripcion || "").trim().slice(0, 240);
    const meta = Math.round(Number(b.meta));
    const beneficiarioCuenta = String(b.beneficiarioCuenta || "").trim();
    if (titulo.length < 3) return error(res, 400, "El nombre de la colecta es muy corto.");
    if (!(meta > 0)) return error(res, 400, "La meta tiene que ser un número mayor que cero.");
    if (!esCuenta(beneficiarioCuenta)) return error(res, 400, "La cuenta destinataria tiene que tener la forma 0.0.123456.");
    // Quien recibe es siempre una persona jurídica (docs/LEGAL.md §1), nunca una persona suelta.
    const o = b.organizador || {};
    const nombre = String(o.nombre || "").trim().slice(0, 80);
    const tipo = String(o.tipo || "").trim();
    const cuit = String(o.cuit || "").replace(/\D/g, "");
    const igpj = String(o.igpj || "").trim().slice(0, 40) || "en trámite";
    if (nombre.length < 3) return error(res, 400, "Indicá el nombre de la organización que organiza la colecta.");
    if (!TIPOS.includes(tipo)) return error(res, 400, "Elegí el tipo de organización.");
    if (cuit.length !== 11) return error(res, 400, "El CUIT de la organización tiene que tener 11 dígitos.");
    const organizador = { nombre, tipo, cuit: `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`, igpj };
    const id = crearId(titulo);
    // clave del organizador: se devuelve una sola vez; en el registro queda solo su hash
    const claveOrganizador = crypto.randomBytes(16).toString("hex");
    const alta = await registrarColecta({ campaignId: id, titulo, descripcion, meta, beneficiarioCuenta, organizador, orgKeyHash: sha256(claveOrganizador) });
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
    return error(res, e.status || 500, e.message);
  }
}
