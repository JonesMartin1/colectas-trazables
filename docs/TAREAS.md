# Tareas, contratos y horario (viernes 16/10)

**La regla que manda: a las 18:20 todo está mergeado y subido. A las 19:00 cierra y no se commitea más.**

## Horario

| Hora | Hito |
| --- | --- |
| 14:45 | Cada uno lee este archivo y toma su issue |
| 16:00 | `hedera/colectas.js` mergeado. Backend y web andando contra datos de ejemplo. Entrevistas de Gilda listas. |
| 17:00 | Integración: el flujo entero anda en una máquina (crear colecta → donar → cargar gasto → ver página pública) |
| 17:30 | Demo publicada en Vercel. **No se agregan más funciones**: solo arreglos. |
| 17:30–18:10 | Transacciones finales de la demo, IDs en el README y grabación del video |
| 18:20 | Todo mergeado, deck en PDF y video subido |
| 18:30 | Formulario enviado (forms.gle/YMJFPs919qHdH9w2A) |

## Quién hace qué

| Quién | Carpeta | Qué entrega |
| --- | --- | --- |
| Martín | `hedera/` | El módulo `colectas.js` (**ya está hecho y probado en testnet**), la publicación en Vercel, los merges y el formulario |
| Facu | `api/` | La API como funciones de Vercel: un archivo por ruta, ver `api/salud.js` de ejemplo (contrato abajo) |
| Nicolás | `web/` | Las tres pantallas, primero con datos de ejemplo (`web/ejemplo/colecta.json`) y después contra la API |
| Gilda | (fuera del repo) | Entrevistas, deck PDF de 8 secciones y video de hasta 5 minutos |

Hasta que esté lo de al lado, cada uno trabaja contra el contrato con datos inventados. Nadie espera a nadie.

## Contrato 1: `hedera/colectas.js` (Martín → Facu) — HECHO

Es un módulo ESM y todas sus funciones son `async`. `npm run probar` lo prueba de punta a punta en testnet.

Además de las funciones de abajo, exporta `registrarColecta(datos)`, que crea el topic y anota la colecta en el registro, `listarColectas()` y `sha256(texto)`.

```js
crearTopicColecta({ campaignId, titulo })
  // → { topicId, txId, hashscan }   el topic se crea con submitKey de la plataforma

publicarEvento(topicId, evento)
  // → { secuencia, txId, hashscan } evento = DONATION o EXPENSE (ver docs/PLAN.md); hasta 1024 bytes

donarUSDC({ beneficiario, monto })
  // → { txId, hashscan }            en la demo dona la cuenta de prueba "donante" de .cuentas.json

leerEventos(topicId)
  // → [{ secuencia, fecha, evento, hashscan }]   desde el Mirror Node, en orden
```

## Contrato 2: API (Facu → Nicolás)

Todas las respuestas son JSON. Los montos van en pesos, como número.

| Método y ruta | Recibe | Devuelve |
| --- | --- | --- |
| `GET /api/colectas` | — | `[{ campaignId, titulo, meta, topicId, beneficiarioCuenta }]` |
| `POST /api/colectas` | `{ titulo, descripcion, meta, beneficiarioCuenta }` | `{ id, topicId, url, hashscan }` |
| `GET /api/colectas/:id` | — | `{ colecta, donaciones[], gastos[], totales: { recaudado, gastado, saldo } }` |
| `POST /api/colectas/:id/donaciones` | `{ monto }` | `{ hashscan, comprobante }` |
| `POST /api/colectas/:id/gastos` | `{ monto, proveedorCuit, cae, invoiceHash }` | `{ secuencia, hashscan }` |
| `GET /api/colectas/:id/verificar?comprobante=...` | — | `{ encontrada, secuencia, hashscan }` |
| `POST /api/webhooks/mercadopago` | notificación de Mercado Pago | `200` (solo si sobra tiempo) |

**Detalles:**
- **Donaciones y gastos:** cada elemento trae `{ secuencia, fecha, monto, hashscan }`. Los gastos, además, `proveedorCuit` y `cae`.
- **Comprobante del donante:** `comprobante = <referencia del pago>.<sal al azar>`. En el topic se publica solo `externalRefHash = sha256(comprobante)`. Para verificar, se recalcula el hash y se busca en los eventos.
- **Guardado: no hay base de datos. Todo vive en Hedera.**
  - Las colectas están en el topic de registro: `listarColectas()`.
  - Las donaciones y los gastos están en el topic de cada colecta: `leerEventos()`.
  - La API no guarda nada; siempre lee del Mirror Node.
- **Factura:** el PDF no se sube. El navegador calcula `sha256` con `crypto.subtle` y manda solo el hash (`invoiceHash`).
  - La página pública tiene un "verificá la factura": se arrastra el PDF y se compara el hash.
  - Por eso `POST /api/colectas/:id/gastos` recibe JSON (`monto`, `proveedorCuit`, `cae`, `invoiceHash`), no multipart.
- **Donación en USDC:** el beneficiario tiene que tener asociado el token USDCd. En la demo se usa la cuenta 0.0.11041201.

## Pantallas (Nicolás)

1. **`index.html`, crear colecta:** el formulario. Al guardar, muestra el link de la colecta y su QR.
2. **`colecta.html?id=...`, página pública:**
   - recaudado, gastado y saldo;
   - la lista de donaciones y de gastos, cada una con su link a HashScan;
   - el botón "Donar (demo USDC)";
   - el cuadro "Verificá tu donación".
3. **`gasto.html?id=...`, cargar gasto:** monto, CUIT, CAE y PDF de la factura.

Sin frameworks: HTML, CSS y JS, para no perder tiempo con build ni deploy.

## Cómo se trabaja

- Una rama por issue (`feat/...`) y PR contra `main`. Martín mergea.
- Se avisa en el grupo cuando se abre un PR.
- Si algo del contrato no cierra, se cambia acá, en este archivo, en el mismo PR, y se avisa.
- Nunca se commitean `.env` ni `.cuentas.json`. Las claves de Vercel las carga Martín.
