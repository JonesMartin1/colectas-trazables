# Pitch (3 minutos): "Mirá llegar tu ayuda"

El enfoque, decidido el 16/10:
- **El protagonista es el vecino que dona, no el Estado.** El mensaje es positivo: solidaridad sin miedo.
- **El gobierno es socio, no sospechoso.**
- Lo de "control", "auditoría" y "desvío" queda **solo para las preguntas**.

Los datos y las fuentes están en [`NEGOCIO.md`](NEGOCIO.md), [`ANTECEDENTES.md`](ANTECEDENTES.md) y [`ACTORES.md`](ACTORES.md).

## Palabras

| No decir | Decir |
| --- | --- |
| transparencia, control, auditoría, rendición de cuentas | **"mirá llegar tu ayuda"**, "lo ves" |
| desvío, corrupción, Venezuela, Haití | **"doná sin miedo a que te estafen"** |
| consejo de firmantes, umbral de 2 de 4 | "lo respaldan Defensa Civil y Cáritas" |
| blockchain inmutable | "queda guardado para siempre y nadie lo puede cambiar, ni nosotros" |
| "la blockchain de Hedera" | "Hedera, un registro distribuido" (el jurado marcó que no es una blockchain) |

## Guion: 3:00, unas 400 palabras

### 0:00 a 0:25: el gancho, una vecina

> "Esta semana el Paraná entró a la ciudad. En el barrio Anahí hay familias evacuadas. Ana, de acá de Corrientes, quiere ayudar: le llega por WhatsApp un alias para donar. Y duda. ¿Es real? ¿La plata va a llegar? Esa duda la tuvimos todos alguna vez."

### 0:25 a 0:50: el problema, dicho en positivo

> "Corrientes es solidaria. En los incendios de 2022 se juntaron 111 millones de pesos en una sola noche. El problema no es la plata: es que nadie puede **ver** que su ayuda llegó. Y en esa duda aparecen las estafas: en la inundación de Bahía Blanca circularon alias falsos casi iguales al oficial."
>
> *(Acá va una frase de una entrevista real: "[cita de un donante o de un organizador de Corrientes]".)*

### 0:50 a 1:50: la demo, en tres momentos

1. **Antes de donar.**
   > "Ana escribe el alias en Colectas Trazables… y aparece en verde: *Oficial, respaldado por Defensa Civil y Cáritas*. Si fuera trucho, se vería en rojo."
2. **Al donar.**
   > "Dona con Mercado Pago, como siempre. No necesita saber nada de cripto. Le llega un código, como el seguimiento de un envío."
3. **Después.**
   > "Unos días más tarde, Ana entra con su código: su donación está ahí, con fecha. Y ve en qué se usó la colecta: *40 colchones para evacuados de Itatí*, con la factura electrónica de un corralón de acá."

**En pantalla:** la página pública de la colecta y un clic a HashScan para mostrar que es real, en vivo.

### 1:50 a 2:15: por qué Hedera, en una respiración

> "Todo esto queda guardado en Hedera, un registro distribuido que nadie puede borrar ni cambiar, ni siquiera nosotros. Verlo es gratis para cualquiera, y registrar una colecta de mil donaciones cuesta menos de un dólar."

### 2:15 a 2:40: el modelo y el socio

> "El 6 de octubre, el Ministerio de Desarrollo Social anunció que quería mecanismos de transparencia para las donaciones de esta emergencia. Nosotros ponemos la herramienta. **En la emergencia es gratis.** La sostienen las ONG, los municipios y las empresas que quieren mostrar, todos los días, que su ayuda llega. Empezamos esta semana en Itatí, Empedrado y la capital."

### 2:40 a 3:00: el cierre

> "Ana ya no duda. Dona, y ve llegar su ayuda. Queremos que Corrientes sea **la provincia donde la solidaridad se ve**. Somos Martín, Nicolás y Facundo. Colectas Trazables."

## Qué tiene que estar andando para este guion

| Momento | Depende de | Estado |
| --- | --- | --- |
| Alias en verde o en rojo | Página "¿Este alias es real?" sobre el topic de registro | **Por hacer** |
| Donar con Mercado Pago | Issue #6, Mercado Pago sandbox | **Por hacer** (antes era opcional) |
| Comprobante y "verificá tu donación" | Web (#3) y API (#2) | En curso |
| "En qué se usó" con factura | Gasto con hash, CUIT y CAE (#2 y #3) | En curso |
| Clic a HashScan | `hedera/colectas.js` | **Hecho** |

**Si algo no llega:** el plan B es mostrar la donación en USDC (ya anda) y decir "con Mercado Pago funciona igual". Lo honesto es no mostrar como hecho algo que no está.

## Para las preguntas: el minuto técnico (sobre todo para Henry Tong)

- **Frases de la propia charla de Henry, para usarlas tal cual:** "Hedera es la **capa de confianza** de la economía digital". Sobre HCS: "marcas de tiempo y orden de eventos descentralizados, **registros de auditoría inmutables**… **no es una base de datos**". Y Web3 en dos palabras: "inmutabilidad y descentralización". Nunca decir "usamos Hedera como base de datos".
- **¿Por qué no una base de datos?** Porque participan varias partes que no confían entre sí: donante, organizador y plataforma. Una base de datos la controla alguien que la puede editar. El topic se crea **sin clave de administrador**, así que ni nosotros lo podemos borrar.
- **¿Quién puede escribir?** El registro de alias usa una **clave compartida con umbral** (por ejemplo, 2 de 4: Defensa Civil, Desarrollo Social, Cáritas y Cruz Roja). Ninguna institución sola puede colar un alias.
- **¿Cuánto cuesta?**
  - Leer del Mirror Node es gratis.
  - Escribir: unos 0,01 USD por colecta y 0,0008 USD por cada donación o gasto.
  - Con mucho tráfico se usa un Mirror Node pago y caché, porque el registro no cambia hacia atrás.
- **¿Hedera es una blockchain?** Es un registro distribuido (DLT) con consenso **hashgraph** y finalidad en segundos (aBFT).
- **¿Por qué no hay token?** Lo evaluamos y al donante no le suma nada. El reglamento pide evitar la tokenización innecesaria.
- **¿Qué impide que carguen un gasto falso?** La factura lleva **CAE**, que se verifica en ARCA. Además, cada donación de Mercado Pago se carga sola. Próximo paso: un agente con AI Studio que revisa cada gasto y deja su veredicto en el mismo topic.
- **¿Y la ayuda en especie?** Ya registramos **entregas** (qué, cuánto, dónde y la huella de una foto), por sugerencia del propio Henry el 16/10. Nunca van nombres de personas: el lugar alcanza (Ley 25.326). Próximo paso: subir la foto a IPFS o al File Service de Hedera, y lotes con QR.
- **Canal de avisos oficiales** (idea de Henry): un topic firmado por Defensa Civil con los partes de evacuados y zonas, para que las cifras no cambien sin dejar rastro. Va al roadmap.
- **¿Hubo casos parecidos?** Sí, y por eso lo diseñamos así:
  - El Programa Mundial de Alimentos usó una blockchain privada, que en la práctica era una base de datos.
  - En Ucrania se veía la plata que entraba, pero no el gasto.
  - Binance solo ayudó a sus propios usuarios.
  - El detalle está en [`ANTECEDENTES.md`](ANTECEDENTES.md).
- **¿Es legal?** No tocamos la plata: va directo a la cuenta de la organización. A Hedera no va ningún dato personal, solo hashes. Ver [`NEGOCIO.md`](NEGOCIO.md), sección 6.

## Diapositiva del stack (para el deck)

Es el diagrama de capas de Hedera, con lo que usamos marcado. Está en `entregables/hedera-para-colectas.pdf`.
- **Usuarios:** personas, empresas y gobierno.
- **Caso de uso:** pagos digitales.
- **Herramientas:** el SDK de JavaScript.
- **Servicios:** HCS, HTS y Mirror Node.
