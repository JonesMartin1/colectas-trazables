import "dotenv/config";
import fs from "node:fs";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

export const ESTADO = new URL("./estado.json", import.meta.url);
export const CUENTAS = new URL("./.cuentas.json", import.meta.url); // claves de testnet, fuera de git
export const DECIMALES = 6; // como el USDC real
export const COMISION_BPS = 50; // 0,5 %

/** Acepta la clave del portal en DER (302e...) o en HEX (0x...). */
export function leerClave(texto) {
  const limpio = (texto ?? "").trim();
  if (!limpio) throw new Error("Falta HEDERA_PRIVATE_KEY en .env");
  if (/^30[0-9a-f]+$/i.test(limpio)) return PrivateKey.fromStringDer(limpio);
  return PrivateKey.fromStringECDSA(limpio.replace(/^0x/, ""));
}

export function clienteOperador() {
  const id = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const clave = leerClave(process.env.HEDERA_PRIVATE_KEY);
  return { client: Client.forTestnet().setOperator(id, clave), id, clave };
}

export const leerJson = (url) => (fs.existsSync(url) ? JSON.parse(fs.readFileSync(url, "utf8")) : null);
export const guardarJson = (url, datos) => fs.writeFileSync(url, JSON.stringify(datos, null, 2));

export const hashscan = (tipo, id) => `https://hashscan.io/testnet/${tipo}/${id}`;
/** El Mirror Node y HashScan escriben el id como 0.0.x-segundos-nanos. */
export const idTx = (txId) => txId.toString().replace("@", "-").replace(/\.(\d+)$/, "-$1");
