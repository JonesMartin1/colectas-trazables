// GET  /api/colectas  → las colectas destacadas (casos reales, ver _destacadas.js); ?todas=1 (o en mainnet) → todo el topic de registro
// POST /api/colectas  → crea una colecta: topic propio en HCS y alta en el registro
// Alta con código (ver _seguridad.js y docs/SEGURIDAD.md): en la red real no se crea nada sin un `codigoAlta` válido,
// que se entrega a la organización después de validarla. En la demo de testnet se puede crear sin código, pero la
// colecta queda "sin verificar": sin sello y sin Mercado Pago. El campo `verificada` lo pone el servidor, nunca el cliente.
import crypto from "node:crypto";
import { registrarColecta } from "../../hedera/colectas.js";
import { json, error, errorDe, leerCuerpo, crearId, esCuenta, esperarEnMirror, sha256, listarColectas } from "../_comun.js";
import { destacar } from "../_destacadas.js";
import { ES_MAINNET } from "../../hedera/lib.js";
import { limitar, altaConfigurada, huellaDeAlta, esVerificada } from "../_seguridad.js";

export const TIPOS = ["Asociación civil", "Fundación", "Simple asociación", "Cooperadora", "Bomberos voluntarios", "Comisión vecinal", "Municipio u organismo público"];

// sin caracteres de control ni saltos: los textos van a un registro público que no se puede corregir
const limpio = (v, max) => String(v || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Dígito verificador del CUIT (módulo 11): descarta los inventados al voleo, no prueba que exista. */
export function cuitValido(cuit) {
  if (!/^\d{11}$/.test(cuit)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((s, p, i) => s + p * Number(cuit[i]), 0);
  const resto = 11 - (suma % 11);
  return Number(cuit[10]) === (resto === 11 ? 0 : resto === 10 ? 9 : resto);
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const todas = await listarColectas();
      // en la red real no hay casos de ejemplo destacados: se lista el registro, pero solo lo verificado
      const pedirTodas = new URL(req.url, "http://local").searchParams.get("todas") === "1";
      const colectas = ES_MAINNET ? todas.filter(esVerificada) : pedirTodas ? todas : destacar(todas);
      return json(res, 200, colectas.map((c) => {
        const { campaignId, titulo, meta, topicId, beneficiarioCuenta, foto, lugar, fecha, categoria, fuente } = c;
        return { campaignId, titulo, meta, topicId, beneficiarioCuenta, foto, lugar, fecha, categoria, fuente, verificada: esVerificada(c) };
      }));
    }
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    // cada alta crea un topic y gasta HBAR del operador: pocas por IP y un tope por hora en total
    if (limitar(req, res, "crear-colecta", { max: 3, ventanaSeg: 600, global: 30 })) return;
    const b = await leerCuerpo(req);

    const conCodigo = String(b.codigoAlta || "").trim();
    if (ES_MAINNET && !altaConfigurada()) return error(res, 503, "El alta de colectas está cerrada. Escribinos para validar tu organización.");
    if (ES_MAINNET && !conCodigo) return error(res, 403, "Para crear una colecta necesitás el código de alta que te damos al validar tu organización.");
    const alta = conCodigo ? huellaDeAlta(conCodigo) : null;
    if (conCodigo && !alta) return error(res, 403, "El código de alta no es válido.");

    const titulo = limpio(b.titulo, 100);
    const descripcion = limpio(b.descripcion, 240);
    const meta = Math.round(Number(b.meta));
    const beneficiarioCuenta = String(b.beneficiarioCuenta || "").trim();
    if (titulo.length < 3) return error(res, 400, "El nombre de la colecta es muy corto.");
    if (!(meta > 0) || meta > 100_000_000_000) return error(res, 400, "La meta tiene que ser un número mayor que cero.");
    if (!esCuenta(beneficiarioCuenta)) return error(res, 400, "La cuenta destinataria tiene que tener la forma 0.0.123456.");
    // Quien recibe es siempre una persona jurídica (docs/LEGAL.md §1), nunca una persona suelta.
    const o = b.organizador && typeof b.organizador === "object" ? b.organizador : {};
    const nombre = limpio(o.nombre, 80);
    const tipo = String(o.tipo || "").trim();
    const cuit = String(o.cuit || "").replace(/\D/g, "");
    const igpj = limpio(o.igpj, 40) || "en trámite";
    if (nombre.length < 3) return error(res, 400, "Indicá el nombre de la organización que organiza la colecta.");
    if (!TIPOS.includes(tipo)) return error(res, 400, "Elegí el tipo de organización.");
    if (cuit.length !== 11) return error(res, 400, "El CUIT de la organización tiene que tener 11 dígitos.");
    // con código de alta el CUIT ya lo validó una persona: ahí sí se exige que sea un CUIT bien formado
    if (alta && !cuitValido(cuit)) return error(res, 400, "El CUIT de la organización no es válido: revisá los números.");
    // un código, una colecta: si ya se usó, no sirve para dar de alta otra
    if (alta && (await listarColectas()).some((c) => c.altaHuella === alta)) return error(res, 409, "Ese código de alta ya se usó para crear una colecta.");

    const organizador = { nombre, tipo, cuit: `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`, igpj };
    const id = crearId(titulo);
    // clave del organizador: se devuelve una sola vez; en el registro queda solo su hash
    const claveOrganizador = crypto.randomBytes(16).toString("hex");
    const reg = await registrarColecta({
      campaignId: id, titulo, descripcion, meta, beneficiarioCuenta, organizador, orgKeyHash: sha256(claveOrganizador),
      ...(alta && { verificada: true, altaHuella: alta }),
    });
    console.info(`[auditoria] colecta creada ${id} · ${alta ? `verificada (alta ${alta})` : "sin verificar"}`);
    // la colecta se busca en el registro vía Mirror Node: esperar a que aparezca antes de responder
    await esperarEnMirror(reg.registro.topicId, reg.registro.secuencia);
    const idUrl = encodeURIComponent(id);
    res.setHeader("Cache-Control", "no-store"); // la respuesta lleva la clave del organizador
    return json(res, 201, {
      id,
      topicId: reg.topicId,
      url: `/colecta.html?id=${idUrl}`,
      hashscan: reg.hashscan,
      verificada: Boolean(alta),
      claveOrganizador,
      urlOrganizador: `/gasto.html?id=${idUrl}#clave=${claveOrganizador}`, // en el # para que no viaje al servidor
    });
  } catch (e) {
    return errorDe(res, e, "colectas");
  }
}
