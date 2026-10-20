// Cuentas de Hedera conocidas de exchanges: si una salida de la billetera de una colecta va a una de estas, la página
// la muestra como "retiro a pesos en <exchange>"; si va a otra cuenta, como salida a una billetera no identificada.
// En producción van las cuentas de depósito reales de cada exchange (Binance y otros usan una cuenta + memo).
export const EXCHANGES = {
  "0.0.11103219": "un exchange (demo)", // cuenta que hace de exchange en testnet (scripts/sembrar-colectas-completas.js)
};
