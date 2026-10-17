# Fideicomiso de una colecta (smart contract en Hedera)

`FideicomisoColecta.sol` guarda el USDC de una colecta y **solo lo deja salir hacia proveedores aprobados, con la huella de la factura, cuando firman 2 de 3** (la organización y las entidades que la avalan). Corre en el servicio de contratos de Hedera (EVM) y mueve el token con el servicio de tokens (HTS, precompilado `0x167`).

- **Sin dueño:** se despliega sin clave de administrador, así que Hedera le pone como administrador al propio contrato. Nadie puede cambiarlo ni borrarlo, tampoco la plataforma. La plataforma no custodia: no tiene ninguna firma.
- **Reglas:** sumar un proveedor y cada pago necesitan `umbral` firmas. Quien propone cuenta como primera firma. Un pago exige proveedor aprobado, monto mayor que cero y la huella SHA-256 de la factura (el PDF nunca va a la red). Nadie firma dos veces la misma propuesta.
- **Lo que deja a la vista:** los eventos `Propuesto`, `Aprobado`, `ProveedorAprobado` y `Pagado` en HashScan.

## Dónde encaja

Pesos del donante → **rampa** (un PSAV que convierte, por ejemplo Binance Connect, ver `docs/LEGAL.md`) → USDC **al contrato** de la colecta, no a la organización → pagos a proveedores con doble firma. Así nadie tiene la plata "suelta" en ningún momento.

## Demo en testnet (17/10/2026)

`node contratos/demo.js [campaignId]` crea (una sola vez) tres firmantes y un proveedor de prueba, despliega un contrato nuevo, lo fondea con 50 USDCd como lo haría la rampa y recorre las protecciones. El resultado queda en `fideicomiso.json`; las claves de prueba, en `contratos/.claves.json` (fuera de git y de Vercel).

Contrato: [`0.0.11057590`](https://hashscan.io/testnet/contract/0.0.11057590), de la colecta `colchones-y-agua-para-itati-532f2d`.

| Paso | Resultado |
| --- | --- |
| La organización intenta pagarle a un proveedor no aprobado | rechazado: "El proveedor no esta aprobado" |
| El proveedor intenta aprobarse solo | rechazado: "No sos firmante de esta colecta" |
| La organización propone al proveedor y Defensa Civil aprueba | proveedor aprobado |
| La organización pide pagar 20 USDCd con la huella de la factura | queda en 1 de 2; el saldo no se mueve |
| La organización intenta firmar dos veces | rechazado: "Ya aprobaste esta propuesta" |
| Cáritas aprueba | se pagan 20 USDCd al proveedor; quedan 30 en el contrato |

## Compilar

```bash
cd contratos && npx --yes solc@0.8.24 --optimize --bin --abi -o build FideicomisoColecta.sol
```

Pendiente: la web todavía no lo muestra, y falta la devolución si la colecta vence sin gastarse. Para pagarle a una cuenta que recibe el token por primera vez hace falta gas alto (2.000.000), porque Hedera la asocia en el mismo pago.
