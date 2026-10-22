import "dotenv/config";
import fs from "node:fs";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

/**
 * La red se elige con UNA variable: HEDERA_NETWORK = "testnet" (por defecto) o "mainnet". De ella salen el cliente
 * del SDK, el Mirror Node, los links de HashScan y los archivos de IDs y claves. En mainnet no se migra nada: las
 * cuentas, los topics, el token y los contratos se crean de nuevo y sus IDs van a estado-mainnet.json (o a las
 * variables de entorno). MIRROR_NODE_URL permite usar un Mirror Node pago (el público es para desarrollo).
 */
export const RED = (process.env.HEDERA_NETWORK || "testnet").trim().toLowerCase();
if (!["testnet", "mainnet"].includes(RED)) throw new Error(`HEDERA_NETWORK tiene que ser "testnet" o "mainnet", no "${RED}"`);
export const ES_MAINNET = RED === "mainnet";
export const MIRROR_URL = (process.env.MIRROR_NODE_URL || (ES_MAINNET ? "https://mainnet-public.mirrornode.hedera.com" : "https://testnet.mirrornode.hedera.com")).replace(/\/+$/, "");
export const MIRROR = `${MIRROR_URL}/api/v1`;
/** Siguiente página del Mirror Node: links.next viene como ruta (/api/v1/...). */
export const mirrorSiguiente = (next) => (next ? MIRROR_URL + next : null);

export const ESTADO = new URL(ES_MAINNET ? "./estado-mainnet.json" : "./estado.json", import.meta.url);
export const CUENTAS = new URL(ES_MAINNET ? "./.cuentas-mainnet.json" : "./.cuentas.json", import.meta.url); // claves, fuera de git
export const DECIMALES = 6; // como el USDC real
export const COMISION_BPS = 50; // 0,5 %

/** Acepta la clave del portal en DER (302e...) o en HEX (0x...). */
export function leerClave(texto) {
  const limpio = (texto ?? "").trim();
  if (!limpio) throw new Error("Falta HEDERA_PRIVATE_KEY en .env");
  if (/^30[0-9a-f]+$/i.test(limpio)) return PrivateKey.fromStringDer(limpio);
  return PrivateKey.fromStringECDSA(limpio.replace(/^0x/, ""));
}

/** Cliente del SDK de la red elegida, sin operador. */
export const nuevoCliente = () => (ES_MAINNET ? Client.forMainnet() : Client.forTestnet());

/** Lo que firma el servidor con cuentas de prueba (donar en la demo, roles del núcleo) no corre en mainnet. */
export function soloDemo() {
  if (ES_MAINNET) throw Object.assign(new Error("Esta acción es solo de la demo y no está disponible en mainnet."), { status: 403 });
}

export function clienteOperador() {
  const id = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const clave = leerClave(process.env.HEDERA_PRIVATE_KEY);
  return { client: nuevoCliente().setOperator(id, clave), id, clave };
}

export const leerJson = (url) => (fs.existsSync(url) ? JSON.parse(fs.readFileSync(url, "utf8")) : null);
export const guardarJson = (url, datos) => fs.writeFileSync(url, JSON.stringify(datos, null, 2));

export const hashscan = (tipo, id) => `https://hashscan.io/${RED}/${tipo}/${id}`;
/** El Mirror Node y HashScan escriben el id como 0.0.x-segundos-nanos. */
export const idTx = (txId) => txId.toString().replace("@", "-").replace(/\.(\d+)$/, "-$1");
