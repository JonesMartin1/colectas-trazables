// POST /api/demo/donar { campaignId, monto } → SOLO la demo: la cuenta "donante" de prueba hace de billetera del donante
// y transfiere USDC de testnet al beneficiario, con el memo de la colecta. No registra nada: para eso, el cliente
// manda el txId a POST /api/colectas/:id/donaciones, que lo verifica en el Mirror Node.
// En la vida real este paso lo hace la billetera del donante (o Mercado Pago), nunca la plataforma.
import { donarUSDC, leerTransaccion, memoColecta } from "../../hedera/colectas.js";
import { json, error, errorDe, leerCuerpo, buscarColecta, COTIZACION } from "../_comun.js";
import { ES_MAINNET } from "../../hedera/lib.js";

import { limitar } from "../_seguridad.js";

const TOPE = 200_000; // pesos por donación, para que nadie vacíe la billetera de prueba

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return error(res, 405, "Método no permitido");
    if (limitar(req, res, "demo-donar", { max: 5, global: 120 })) return; // cada donación de demo gasta USDC y HBAR de prueba
    if (ES_MAINNET) return error(res, 403, "La donación de demo no existe en mainnet: cada persona dona desde su propia billetera.");
    const { campaignId, monto: m } = await leerCuerpo(req);
    const colecta = await buscarColecta(campaignId);
    if (!colecta) return error(res, 404, "No existe una colecta con ese identificador.");
    const monto = Math.round(Number(m));
    if (!(monto > 0) || monto > TOPE) return error(res, 400, `En la demo, el monto tiene que estar entre $1 y $${TOPE.toLocaleString("es-AR")}.`);
    const usdc = Math.max(0.01, Math.round((monto / COTIZACION) * 100) / 100);
    let pago;
    try {
      pago = await donarUSDC({ beneficiario: colecta.beneficiarioCuenta, monto: usdc, memo: memoColecta(colecta.campaignId) });
    } catch (e) {
      const asociado = /TOKEN_NOT_ASSOCIATED/.test(e.message);
      if (!asociado) console.error("[error] demo-donar:", e.message);
      return error(res, 400, asociado ? "La cuenta destinataria todavía no aceptó el token USDC de la demo." : "No se pudo hacer la transferencia de prueba. Probá de nuevo en unos minutos.");
    }
    // esperar a que el Mirror Node la muestre, así el registro posterior la encuentra de una
    await leerTransaccion(pago.txId, 15);
    return json(res, 201, { txId: pago.txId, hashscan: pago.hashscan, usdc });
  } catch (e) {
    return errorDe(res, e, "donar");
  }
}
