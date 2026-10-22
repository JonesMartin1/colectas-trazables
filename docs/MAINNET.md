# Pasar de testnet a mainnet

La red se elige con **una sola variable**: `HEDERA_NETWORK` (`testnet` por defecto, o `mainnet`). De ella salen el
cliente del SDK, el Mirror Node, los links de HashScan y los archivos de IDs y claves (`hedera/lib.js`). El navegador
la recibe de `/red.js` (rewrite a `/api/salud?formato=js`), así los links de las páginas apuntan a la misma red.

En mainnet **no se migra nada**: lo que está en testnet se queda ahí. Hay que crear todo de nuevo y pagarlo con HBAR real.

## Qué hace el código en mainnet

- Lee los IDs de `hedera/estado-mainnet.json` (o de las variables de entorno) y las claves de `hedera/.cuentas-mainnet.json` (fuera de git).
- **No firma nada en nombre de terceros:** `POST /api/demo/donar` y las acciones de demo del núcleo (`/api/nucleo` POST) responden 403.
- Usa el Mirror Node público de mainnet (`mainnet-public.mirrornode.hedera.com`), salvo que `MIRROR_NODE_URL` indique uno pago.

## Pasos (según docs.hedera.com)

1. **Cuenta de mainnet:** no sale del portal de desarrolladores; se crea con una billetera (HashPack) y se carga con HBAR.
2. **Topics nuevos:** registro de colectas, alias, avisos y propuestas (scripts de `hedera/crear-*.js` con `HEDERA_NETWORK=mainnet`). Sus IDs van a `estado-mainnet.json` y a Vercel (`REGISTRO_TOPIC_ID`, `ALIAS_TOPIC_ID`, `AVISOS_TOPIC_ID`, `PROPUESTAS_TOPIC_ID`).
3. **USDC real:** `USDC_TOKEN_ID=0.0.456858` (Circle). Cada billetera de colecta tiene que asociarse al token.
4. **Contratos:** volver a publicarlos (USD 1 cada uno más el gas), después de la auditoría.
5. **Mirror Node pago para producción** (Validation Cloud, Arkhia, Hgraph): el público limita a ~50 consultas por segundo por IP y tarda 5–15 s.
6. **Reintentos ante `BUSY`:** la red rechaza lo que pasa sus límites (crear cuentas: 2 por segundo).
7. En Vercel: `HEDERA_NETWORK=mainnet`, `HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY` y los IDs de arriba. Sin `DEMO_DONANTE_*`.

## Costos de mainnet (USD, se pagan en HBAR)

Crear cuenta 0,05 · asociar token 0,05 · crear topic (abrir una colecta) 0,01 · mensaje (donación, gasto o entrega) 0,0008 · transferir token 0,001 · publicar contrato 1 + gas.

## Lo que sigue siendo de testnet a propósito

- `/hedera` (`hedera.html`, `hedera-vivo.js`, el indicador de `menu.js`): muestra el despliegue de testnet con sus IDs; en mainnet se rehace con los nuevos.
- Textos que dicen "demo en testnet" (`i18n.js`, `terminos.html`, `alias.html`): se reescriben junto con los términos legales.
- Las colectas de la portada (`api/_destacadas.js`) son de testnet: en mainnet la portada arranca vacía.
- Los scripts de prueba de `contratos/` y `scripts/` crean cuentas de prueba y siguen fijos en testnet.

## Antes de operar con plata real (no es código)

Auditoría de los contratos, dictamen legal y persona jurídica, identidad (RENAPER), login real y Project ID de Reown para HashPack.
