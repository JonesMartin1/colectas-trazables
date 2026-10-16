# Plan del MVP (ajustado al reglamento del track Hedera)

Reglamento: los "Qué no buscamos" y la rúbrica de 100 puntos mandan. La complejidad técnica, por sí sola, no suma.

## Problema

En Argentina, las colectas por catástrofes juntan millones en horas, pero no hay una forma pública de verificar adónde fue cada peso. Eso termina en sospechas, denuncias y donantes que dejan de donar. Contexto de hoy: las inundaciones de Corrientes y Entre Ríos (octubre de 2026).

## Por qué blockchain (25 pts)

Hedera no es técnicamente una blockchain: es un registro distribuido (DLT) con consenso hashgraph, que funciona como una blockchain, con orden y fecha de consenso para cada mensaje. En el pitch se dice así, porque el jurado lo marcó en su charla. El título de la sección queda como lo pide el reglamento.

El registro no prueba que un gasto sea verdadero. Prueba que **nadie lo cambió ni lo borró después**, y con fecha cierta. Entre las partes, nadie confía en nadie:

1. **El donante no confía en la plataforma.**
   - Al donar, recibe un código de comprobante.
   - En la página pública lo escribe, se recalcula `sha256(paymentId + sal)` y aparece su donación en el topic, con link a HashScan.
   - Verifica su aporte sin exponer sus datos.
2. **El público no confía en el organizador.**
   - Cada gasto lleva el hash del PDF de la factura, el CUIT del proveedor y el CAE de la factura electrónica.
   - El CAE se puede verificar en ARCA.
3. **Nadie confía en nosotros.**
   - Si la plataforma "corrige" números o desaparece, el topic sigue en Hedera.
   - Cualquiera lo lee desde el Mirror Node.

Una base de datos nuestra la podemos editar. Por eso no alcanza.

## Servicios de Hedera

| Servicio | Para qué |
| --- | --- |
| HCS | Un topic por colecta, creado con `submitKey` de la plataforma para que nadie más escriba. Cada donación y cada gasto es un mensaje. |
| HTS | Donación en USDC de testnet, directa a la cuenta del beneficiario. |
| Mirror Node | La página pública y la verificación de cada donación leen de ahí, no de nuestra base. |

**Afuera, a propósito:**
- **El token de gobernanza con Asset Tokenization Studio:** es "tokenización innecesaria" según el reglamento, y le abre una pregunta a la CNV. Va solo al roadmap.
- **Las cuentas de Hedera por usuario con claves custodiadas:** nos harían custodios. El beneficiario usa su propia cuenta.

## Eventos (lo que se publica en el topic)

Nunca van datos personales: solo hashes con sal.

```json
{ "type": "DONATION", "campaignId": "inundados-paso-de-los-libres", "amount": 15000, "currency": "ARS",
  "method": "mercadopago", "externalRefHash": "sha256(paymentId + sal)", "timestamp": "2026-10-16T18:00:00Z" }
```

```json
{ "type": "EXPENSE", "campaignId": "inundados-paso-de-los-libres", "amount": 120000, "currency": "ARS",
  "supplierCuit": "30-00000000-0", "cae": "00000000000000", "invoiceHash": "sha256(pdf)", "timestamp": "2026-10-16T20:00:00Z" }
```

Un mensaje de HCS admite hasta 1024 bytes. Si el evento crece, hay que achicarlo.

## Alcance de la demo, por prioridad

Si se acaba el tiempo, cae primero lo de abajo.

1. **Crear la colecta:** título, meta, beneficiario (cuenta de Hedera) y foto. Crea el topic y devuelve el link y el QR.
2. **Donación en USDC de testnet**, directa al beneficiario, más el evento DONATION en el topic. La base ya está en `hedera/pagar.js`.
3. **Gasto:** se sube el PDF, se calcula el hash, se ingresan el CUIT y el CAE, y se publica el evento EXPENSE.
4. **Página pública:** total, gastos, balance, links a HashScan y el cuadro "verificá tu donación".
5. **Mercado Pago sandbox** (Checkout Pro, webhook y evento DONATION), si sobra tiempo. Necesita una URL pública.

**Fuera de la demo:** Stripe, login con Google, OAuth de marketplace de Mercado Pago, n8n, votaciones y Bitcoin.

## Modelo de negocio

- **Gratis** para el donante y para el organizador particular.
- **Pagan** las ONG, las fundaciones, los municipios y las empresas con RSE: una licencia mensual por colectas verificadas y reportes para auditoría.
- **Primer paso:** una colecta real de las inundaciones con una organización de Corrientes.

## Deck (estructura del reglamento)

1. Problema.
2. Validación: entrevistas y casos de prensa.
3. Solución.
4. Por qué blockchain.
5. Equipo.
6. Stack.
7. Modelo de negocio.
8. Roadmap.
