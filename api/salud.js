// GET /api/salud: confirma que la API llega a Hedera (registro de colectas vía Mirror Node).
import { listarColectas } from "../hedera/colectas.js";

export default async function handler(req, res) {
  try {
    const colectas = await listarColectas();
    res.status(200).json({ ok: true, red: "testnet", registro: process.env.REGISTRO_TOPIC_ID ?? null, colectas: colectas.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
