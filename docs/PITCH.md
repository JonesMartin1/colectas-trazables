# Pitch (3 minutos) — notas para el deck y el video

El guion completo se arma después. Acá se juntan los puntos que tienen que estar.

El negocio completo (revenue, ley, pros y contras y plan para El Niño) está en [`NEGOCIO.md`](NEGOCIO.md). Los antecedentes (Venezuela 2026 y por qué fallaron las soluciones parecidas) están en [`ANTECEDENTES.md`](ANTECEDENTES.md).

**Frase de cierre:** "En la emergencia es gratis. Cobramos por la transparencia de todos los días."

## Cómo hablar de Hedera

- "Hedera es un **registro distribuido (DLT)** con consenso **hashgraph**": no decir "la blockchain de Hedera", porque el jurado lo marcó en su charla.
- La sección del deck sigue llamándose "Por qué blockchain", como pide el reglamento.
- **Finalidad en segundos (aBFT):** una vez confirmado, el registro no se revierte.

## Diapositiva "Stack"

Se muestra el diagrama de capas de Hedera (el de la charla) con lo que usamos marcado:
- **Usuarios:** los tres (personas, empresas y gobiernos).
- **Caso de uso:** pagos digitales.
- **Herramientas:** el SDK de JS.
- **Servicios:** HCS, HTS y Mirror Node.

Lo que no usamos (token, contratos inteligentes) también se nombra, y se explica por qué. El detalle está en `entregables/hedera-para-colectas.pdf`.

## Costo por colecta: leer es gratis, solo se paga escribir

- La página pública y la verificación de donaciones leen del **Mirror Node**. **Leer es gratis**: no gasta HBAR. Que la miren 10 o 10 millones de personas cuesta lo mismo.
- Escribir tiene tarifa fija en dólares:

| Acción | Costo |
| --- | --- |
| Crear la colecta (topic) | ≈ 0,01 USD |
| Anotarla en el registro | ≈ 0,0008 USD |
| Cada donación o gasto (mensaje HCS) | ≈ 0,0008 USD |
| Donación en USDC (transferencia HTS) | ≈ 0,001 USD más |

- **La frase:** "Una colecta con 1.000 donaciones y 50 gastos cuesta **menos de 1 dólar** de red, y la puede auditar todo el país gratis."
- **Si preguntan por la escala:** el Mirror Node público tiene límite de consultas por segundo. En producción usamos un proveedor de Mirror Node o uno propio, y cacheamos la página, porque el registro no cambia hacia atrás.

Fuente de tarifas: docs.hedera.com/hedera/networks/mainnet/fees.

## Lo que se muestra en vivo

1. Crear una colecta. Aparece el topic en HashScan.
2. Donar. El donante verifica su aporte con el comprobante.
3. Cargar un gasto. El balance se actualiza.
4. Mostrar que el topic no tiene clave de administrador: nadie lo puede borrar, ni nosotros.

## Si pregunta Henry Tong (técnico, le interesan agentes y tokenización)

- **¿Por qué no hay token?** Lo evaluamos, y al donante no le suma nada. El reglamento pide evitar la tokenización innecesaria.
- **Próximo paso agéntico:** con AI Studio (Agent Kit), un agente auditor revisa cada gasto, valida el CAE en ARCA y deja su veredicto en el mismo topic.
