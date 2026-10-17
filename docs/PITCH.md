# Pitch de finalistas (≈ 3:30 de 5 minutos): "Mirá llegar tu ayuda"

Versión del 17/10. El reglamento da **5 minutos de pitch y 2 de preguntas**, y el taller del evento recomienda 3. Apuntamos a **3:30**, para tener margen si la demo tarda.

El enfoque, decidido el 16/10:

- **El protagonista es el vecino que dona, no el Estado.** Mensaje positivo: solidaridad sin miedo.
- **El gobierno es socio, no sospechoso.**
- Lo de "control", "fraude" y "desvío" queda **solo para las preguntas**.

Datos y fuentes: [`NEGOCIO.md`](NEGOCIO.md), [`ANTECEDENTES.md`](ANTECEDENTES.md) y [`ACTORES.md`](ACTORES.md). El diseño completo del núcleo está en [`../contratos/README.md`](../contratos/README.md).

## Palabras

| No decir | Decir |
| --- | --- |
| transparencia, control, auditoría | **"mirá llegar tu ayuda"**, "lo ves" |
| desvío, corrupción, Venezuela | **"doná sin miedo"** |
| "la blockchain de Hedera", "base de datos" | "Hedera, un **registro distribuido**" (el jurado marcó que no es una blockchain y que HCS no es una base de datos) |
| smart contract (sin explicar) | "un **contrato que nadie puede cambiar**, ni nosotros" |
| umbral, multifirma | "lo respaldan Cáritas y Defensa Civil" |

## Lo que el jurado tiene que recordar

> **"La plata no la tiene nadie: la tiene un contrato que solo la suelta con el aval de una entidad y una factura. Mirá llegar tu ayuda."**

## Guion (≈ 3:30, unas 470 palabras)

### 0:00 a 0:25: el gancho

> "Esta semana el Paraná entró a la ciudad y hay familias evacuadas en Itatí y Empedrado. Ana, de acá de Corrientes, quiere ayudar. Le llega por WhatsApp una colecta… y duda. ¿La plata va a llegar? ¿En qué se va a usar? Esa duda la tuvimos todos."

### 0:25 a 0:55: el problema y por qué ahora

> "Corrientes es solidaria: en los incendios de 2022 se juntaron 173 millones de pesos en 48 horas. El problema no es la plata, es que nadie puede **ver** que llegó. Y en esa duda aparecen las estafas: en Bahía Blanca circularon alias falsos casi iguales al oficial. Por eso, el 6 de octubre, la Mesa de Emergencia del gobierno pidió mecanismos de transparencia para las donaciones. Nosotros traemos la herramienta."

### 0:55 a 1:20: la solución, en una frase y tres reglas

> "Colectas Trazables: cada colecta vive en un **contrato en Hedera que nadie puede cambiar, ni nosotros**. Tres reglas:
> uno, la colecta se publica **solo si una entidad la avala**, como Cáritas o Defensa Civil;
> dos, la plata sale **por tramos**, y para pedir más hay que mostrar en qué se gastó;
> tres, cada gasto **llena la barra de su ítem** con su factura. Ana lo ve todo, desde su casa."

### 1:20 a 2:30: la demo en vivo (`colectas-trazables.vercel.app/nucleo`)

1. **La colecta** (10 s).
   > "Esta es una colecta real en Hedera testnet: la titular es Cáritas Itatí, la avala Greenpeace, y acá están las barras: colchones, comida, combustible."
2. **El contrato frena lo que no corresponde** (20 s). En el panel "Probalo vos": **Defensa Civil → Aprobar un comprobante → Firmar**.
   > "Ahora, una entidad que **no** avaló esta colecta intenta aprobar un gasto… y el contrato la frena. No lo frenamos nosotros: lo frena el contrato."
3. **Una donación real** (20 s). **Donante A → Donar → 10 → Firmar**.
   > "Y una donación, firmada en vivo. Hecho: el contrato la cobra y separa el 1 %, a la vista."
4. **La prueba** (20 s). Clic en "Ver la transacción en HashScan".
   > "Esto es HashScan, el explorador público de Hedera: la llamada al contrato, la donación y la comisión. Cualquiera lo puede verificar gratis, para siempre."

**Si la red tarda:** seguir hablando ("Hedera confirma en segundos…"). **Si algo falla:** mostrar el video demo de 1 minuto o la transacción ya hecha (`0.0.11058572-1792225050-732114206`). Nunca mostrar como hecho algo que no está.

### 2:30 a 2:50: por qué Hedera

> "Hay tres partes que no confían entre sí: el que dona, el que organiza y la plataforma. Una base de datos siempre es de alguien. En Hedera, un registro distribuido, nadie puede borrar ni cambiar lo que pasó, y la plata vive en un contrato sin dueño. Registrar una colecta de mil donaciones cuesta menos de un dólar, y verlo es gratis."

### 2:50 a 3:10: modelo y primer paso

> "El modelo es simple: **el 99 % llega a la causa y el 1 % sostiene la plataforma**, cobrado por el mismo contrato y a la vista. Es una propuesta por validar. El primer paso: pilotos con dos o tres organizaciones de Itatí, Empedrado y la capital, con el gobierno como socio."

### 3:10 a 3:30: el cierre

> "Ana ya no duda: dona, y ve llegar su ayuda. La plata no la tiene nadie, la tiene un contrato. Queremos que Corrientes sea **la provincia donde la solidaridad se ve**. Somos Martín, Nicolás y Facundo: Colectas Trazables."

## Antes de subir al escenario (checklist)

- [ ] `colectas-trazables.vercel.app/nucleo` abierto y cargado, con el panel "Probalo vos" a la vista.
- [ ] Una pestaña con la transacción de respaldo en HashScan y el video demo descargado.
- [ ] Internet probado (si es posible, el celular como respaldo).
- [ ] Quién habla en cada parte y quién maneja la compu.
- [ ] Ensayar con cronómetro: si pasa de 3:45, recortar el bloque "por qué Hedera".

## Las 12 preguntas difíciles (y qué contestar)

**Las marcadas con ⚠ tocan algo simulado o pendiente: contestarlas con honestidad.**

1. **"¿Por qué blockchain y no una base de datos?"** Porque participan partes que no confían entre sí (donante, organizador, plataforma) y una base de datos la controla alguien que la puede editar. En Hedera, los topics se crean sin clave de administrador y los contratos se despliegan sin dueño: ni nosotros podemos cambiar o borrar nada. (Hedera es un registro distribuido con consenso hashgraph, no una base de datos.)
2. **"¿Quién tiene la plata?"** Nadie: el contrato de la colecta. Sale solo por tramos aprobados por una entidad validadora. La plataforma no tiene ninguna firma sobre esa plata; por eso no somos custodios ni PSAV (lo tiene que confirmar un dictamen legal ⚠).
3. **"¿Y si el organizador gasta en otra cosa?"** Nunca puede tener "sin rendir" más del 30 % de la meta: para pedir otro tramo tiene que cargar comprobantes y que una entidad los apruebe. Los tickets sin factura tienen un tope del 10 %. Si alguien que donó denuncia un comprobante, la titular puede pausar la colecta; si se confirma el fraude, el organizador queda inhabilitado y lo que queda vuelve a los donantes como créditos. Todo esto ya anda en testnet (49 pasos probados con `npm run nucleo`).
4. **"¿Y si la entidad es cómplice?"** Las entidades entran solo si figuran en un registro oficial (IGPJ, CENOC) y no pueden tener vínculo con el organizador. Además, dos validadoras pueden pausar sin la titular, cualquier donante puede denunciar y todo queda a la vista: una entidad que avala un fraude pone en juego su nombre en público.
5. **"¿Cómo saben que el organizador es quien dice ser?"** ⚠ En la demo está simulado. El diseño: verificación con DNI y prueba de vida a través de un proveedor con convenio con RENAPER. Nosotros no guardamos ni una foto: a Hedera va solo la constancia de que fue verificado.
6. **"¿Por qué alguien donaría en USDC? La gente usa pesos."** ⚠ Hoy, en la demo, se dona en USDC de prueba; Mercado Pago anda en sandbox pero no llega a la red. Por ley, Mercado Pago no puede vender cripto (BCRA A 7759). El camino es una rampa inscripta en la CNV que cobre en pesos y entregue en Hedera (estamos consultando a Binance Connect) o un peso digital emitido por un banco con Stablecoin Studio.
7. **"¿Esto funciona con plata real?"** ⚠ Todavía no: está en testnet. Para mainnet faltan tres cosas: que el donante firme con su billetera (HashPack), una auditoría de los contratos y el USDC real. El diseño y el código ya están.
8. **"¿Cuánto cuesta y quién paga?"** Leer es gratis (Mirror Node). Una donación al contrato costó 0,007 USD de red. La plataforma cobra el 1 % de cada donación, una sola vez: si la plata vuelve como créditos y se reusa, no paga de nuevo. ⚠ El 1 % es una hipótesis: el equilibrio está en unos USD 6,5 M donados por año.
9. **"¿Validaron el problema con usuarios?"** Con datos y casos documentados (colectas sin rendición, alias falsos, la Mesa de Emergencia del gobierno), y con la mentoría de Henry Tong, que nos hizo cambiar dos cosas: que reciban organizaciones y registrar entregas. ⚠ Las entrevistas con donantes y organizaciones de Corrientes están en curso: decirlo así.
10. **"¿Qué pasa con los datos personales?"** A Hedera no va ningún dato personal: solo huellas (hashes) y datos públicos de organizaciones. Las imágenes de comprobantes y la identidad quedan fuera de la red y se pueden borrar (Ley 25.326).
11. **"¿Por qué no un token propio?"** No le suma nada al donante, y el reglamento pide evitar la tokenización innecesaria. Usamos USDC (HTS) porque es plata estable que se mueve en segundos.
12. **"¿Qué hicieron con IA?"** Lo declaramos: usamos Claude (Anthropic) como asistente para programar, investigar y documentar. Las decisiones de producto (cómo se libera la plata, quién recibe, el 1 %) las tomamos nosotros.

**Pregunta comodín de Henry:** "¿Por qué Hedera y no otra red?" → Finalidad en segundos, comisiones fijas y bajísimas en dólares (clave para donaciones chicas), el consenso hashgraph (aBFT) y un consejo de gobierno de empresas conocidas. Y HCS nos da orden y fecha de consenso para cada evento sin tener que escribir un contrato para todo.
