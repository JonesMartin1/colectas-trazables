// POST /api/colectas/:id/entregas { item, cantidad, lugar, fotoHash, clave } → evento DELIVERY en el topic de la colecta.
// Qué se entregó, cuánto y dónde (un centro o un barrio, nunca el nombre de una persona) y la huella SHA-256
// de una foto que queda en poder de la organización. Idea sugerida por Henry Tong (16/10).
// Solo el organizador: misma clave que para los gastos.
import { publicarEvento } from "../../../hedera/colectas.js";
import { json, error, leerCuerpo, buscarColecta, esperarEnMirror, rechazoOrganizador } from "../../_comun.js";

const limpio = (s, max) => String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    const colecta = await buscarColecta(req.query.id);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const b = await leerCuerpo(req);
    const rechazo = rechazoOrganizador(colecta, b.clave);
    if (rechazo) return error(res, ...rechazo);
    const item = limpio(b.item, 80);
    const lugar = limpio(b.lugar, 80);
    const cantidad = Math.round(Number(b.cantidad));
    const fotoHash = String(b.fotoHash || "").toLowerCase();
    if (item.length < 2) return error(res, 400, "Contá qué se entregó.");
    if (!(cantidad > 0)) return error(res, 400, "La cantidad tiene que ser mayor que cero.");
    if (lugar.length < 2) return error(res, 400, "Indicá dónde se entregó (centro, barrio o localidad, sin nombres de personas).");
    if (!/^[a-f0-9]{64}$/.test(fotoHash)) return error(res, 400, "Falta la huella de la foto de la entrega.");
    // Una imagen que identifica a alguien es un dato personal (Ley 25.326, Disp. 10/2015): sin caras o con consentimiento.
    const foto = ["sin-caras", "con-consentimiento"].includes(b.foto) ? b.foto : null;
    if (!foto) return error(res, 400, "Confirmá que la foto no muestra caras o que tenés el consentimiento de quienes aparecen.");
    const evento = {
      type: "DELIVERY",
      campaignId: colecta.campaignId,
      item,
      quantity: cantidad,
      place: lugar,
      photoHash: fotoHash,
      photo: foto,
      timestamp: new Date().toISOString(),
    };
    const reg = await publicarEvento(colecta.topicId, evento);
    await esperarEnMirror(colecta.topicId, reg.secuencia);
    return json(res, 201, { secuencia: reg.secuencia, hashscan: reg.hashscan });
  } catch (e) {
    return error(res, 500, e.message);
  }
}
