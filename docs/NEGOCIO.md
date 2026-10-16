# Colectas Trazables: el negocio, la ley y el plan para El Niño

Análisis del 16/10/2026. Está escrito con la mirada de Santiago Siri (Democracy Earth, Proof of Humanity): la confianza no se pide, se demuestra con un protocolo abierto.

Convención: lo que tiene fuente va con enlace al final. Lo que todavía no está verificado va marcado **SUPUESTO**.

---

## 1. La tesis

> En una emergencia, a Corrientes no le falta solidaridad: le falta **confianza verificable**. La plata aparece en una noche. Lo que no aparece es la prueba de adónde fue.

**Tres hechos la sostienen:**

1. **La plata aparece.**
   - En los incendios de Corrientes de febrero de 2022, la colecta de Santi Maratea juntó **$111 millones en una noche** y entre **$154 y $180 millones en 48 horas**. Con eso se anunció la compra de camionetas autobomba para los bomberos de San Miguel, Loreto, Berón de Astrada y Saladas.
   - En esos mismos incendios, Cáritas sumó donaciones de **más de 15.000 personas y 27 empresas**.
   - En la inundación de Bahía Blanca de 2025, Gran Hermano juntó **más de $500 millones en una hora**.
2. **La prueba no aparece.** En prensa no encontramos una rendición de cuentas consolidada y pública de ninguna de esas colectas. No significa que haya habido algo mal hecho. Significa que **nadie lo puede verificar**.
3. **La desconfianza tiene costo y abre la puerta al fraude.**
   - En Bahía Blanca 2025 circularon **cuentas falsas con alias parecidos** al oficial ("bahiaxbahia"). Chequeado y el Ministerio de Seguridad tuvieron que salir a advertir.
   - El estudio *Cultura de Dar 2025* muestra que el **30 % de los adultos** donó dinero a una organización en el último año. También señala que la idea de falta de transparencia **frena las donaciones**.

## 2. El momento: El Niño ya está en Corrientes

- **Pronóstico:**
  - El SMN da **100 % de probabilidad** de que El Niño continúe, con intensidad de fuerte a muy fuerte y el pico entre fines de la primavera y el comienzo del verano.
  - **Corrientes es la zona del país con mayor probabilidad de lluvias superiores a lo normal** entre octubre y diciembre: más del 55 %.
- **Situación al 15 y 16 de octubre:**
  - Hay **222 personas evacuadas o autoevacuadas**, y el Paraná ya **entró a la ciudad de Corrientes** (barrio Anahí).
  - Itatí y Empedrado declararon la **emergencia hídrica**.
  - Yacyretá cerró el paso a Paraguay.
- **Lo que viene:**
  - Defensa Civil (Bruno Lovinson) espera superar los niveles de evacuación **entre el 20 y el 21 de octubre**, y monitorea **30 municipios de alta vulnerabilidad**.
  - La emergencia puede durar **meses**.

**Conclusión:** no es un caso hipotético. Las colectas de esta emergencia empiezan **esta semana**. Si el producto anda el lunes, se usa de verdad.

## 3. El producto que marca un antes y un después

Son tres capas. La primera se puede usar ya y no toca plata de nadie.

### Capa A: Registro oficial de cuentas de emergencia ("¿Este alias es de verdad?")

- Defensa Civil, los municipios y las ONG reconocidas publican **sus alias y CBU oficiales** en un topic de Hedera que solo ellos pueden firmar.
- Cualquier persona escribe un alias antes de transferir y ve si es oficial, quién lo publicó y desde cuándo.
- **Ataca el problema de Bahía Blanca:** las cuentas truchas con nombre parecido.
- Es lo más simple de construir: es el mismo topic de registro que ya funciona en testnet.
- Legalmente es **información pública**. No mueve plata.

### Capa B: Colecta trazable (lo que ya construimos)

- Cada colecta tiene su topic.
  - **Donación:** queda un hash del pago, y el donante la verifica con su comprobante.
  - **Gasto:** se publica con el hash de la factura, el CUIT del proveedor y el CAE, que se verifica en ARCA.
- **Carga automática:**
  - La organización conecta su Mercado Pago en **modo solo lectura** (OAuth) y cada cobro se registra solo, **sin que la plata pase por nosotros**.
  - Las transferencias por CBU se cargan desde el extracto (próxima versión).
- **Cripto:** las donaciones en USDC sobre Hedera van de billetera a billetera.

### Capa C: Rendición automática

- Página pública con lo recaudado, lo gastado, el saldo y los comprobantes.
- Reporte exportable para el **Concejo Deliberante**, el **Tribunal de Cuentas** o la comisión directiva de la ONG.
- **Certificado para el donante** a una entidad exenta, que le sirve para deducir la donación de Ganancias.

### Antes y después

| | Hoy | Con Colectas Trazables |
| --- | --- | --- |
| ¿Este alias es real? | Se busca en redes y se confía | Se escribe el alias y se ve si es oficial, firmado por quién |
| ¿Llegó mi donación? | No se sabe | Se escribe el comprobante y aparece, con fecha de consenso |
| ¿En qué se gastó? | Fotos en Instagram, a veces | Factura con CAE verificable y hash publicado |
| ¿Se puede "corregir" después? | Sí, el Excel es de alguien | No: el topic no tiene clave de administrador |
| ¿Cuánto cuesta auditar? | Un contador y semanas | Nada: se lee gratis del Mirror Node |

## 4. Funciona ya: plan de 72 horas después de la ideathon

| Cuándo | Qué | Qué hace falta |
| --- | --- | --- |
| Sábado 17/10 | Pitch y demo en testnet | Lo que estamos terminando |
| Domingo 18/10 | Pasar a **mainnet**. Abrir el registro de alias con las cuentas oficiales que ya publicaron la provincia, los municipios y las ONG grandes (Cáritas, Cruz Roja), citando la fuente. | Cargar unos USD 20 en HBAR, que alcanzan para miles de mensajes |
| Lunes 19/10 | Ofrecer gratis una colecta trazable a 2 o 3 organizaciones que ya están juntando para los evacuados: bomberos voluntarios, parroquias o comedores de Itatí, Empedrado o la capital | Una reunión con cada una. La conexión con Mercado Pago, en solo lectura. |
| 20 y 21/10 (pico de evacuación) | Las colectas piloto están publicadas, con el link y el QR circulando por WhatsApp | Que las organizaciones lo compartan |
| Semana del 26/10 | Presentar los resultados a Defensa Civil de Corrientes y a los municipios con emergencia declarada | Los números del piloto |

**Regla ética, y también del pitch: en la emergencia es gratis.** Cobramos por la transparencia de todos los días, no por la tragedia.

## 5. Modelo de negocio y revenue para nosotros

### Quién es usuario y quién paga

| Actor | Lo usa para | ¿Paga? |
| --- | --- | --- |
| Donante | Verificar alias y donaciones | **No.** Puede dejar una propina opcional. |
| Organizador particular | Mostrar que es honesto | **No**, en emergencias |
| ONG y fundaciones | Rendición automática y cumplimiento (UIF, IGJ) | **Sí**, abono mensual |
| Municipios y provincia | Portal de transparencia de emergencias y donaciones | **Sí**, licencia anual |
| Empresas con RSE | Demostrar adónde fue su donación | **Sí**, un fee por campaña que paga la empresa y no sale de la donación |
| Fondos (BID Lab, programas de Hedera, bienes públicos digitales) | Financiar el protocolo abierto | Aportes no reembolsables (**SUPUESTO**: hay que postular) |

### Precios (**SUPUESTO**, a validar en las entrevistas)

| Plan | Precio |
| --- | --- |
| ONG | USD 40 por mes |
| Municipio | USD 200 por mes |
| Provincia | USD 1.500 por mes |
| Empresa | 1,5 % de la donación trazada, con mínimo de USD 300 por campaña |
| Propina del donante | Opcional. Supuesto: deja propina el 20 % de los donantes, con un promedio del 3 %. |

### Proyección (**SUPUESTO**: son escenarios, no promesas)

| | Año 1: Corrientes | Año 2: Litoral (5 provincias) | Año 3: Argentina |
| --- | --- | --- | --- |
| Municipios | 5 → USD 12.000 | 40 → USD 96.000 | 150 → USD 360.000 |
| Provincias | 0 (piloto gratis) | 2 → USD 36.000 | 6 → USD 108.000 |
| ONG | 30 → USD 14.400 | 150 → USD 72.000 | 600 → USD 288.000 |
| Empresas | 10 campañas → USD 4.500 | 40 → USD 24.000 | 150 → USD 120.000 |
| Propinas | sobre USD 0,5 M trazados → USD 3.000 | USD 3 M → USD 18.000 | USD 15 M → USD 90.000 |
| **Total** | **≈ USD 34.000** | **≈ USD 246.000** | **≈ USD 966.000** |

**Costos:**

| Costo | Monto |
| --- | --- |
| Red Hedera | Menos de USD 1 por colecta de 1.000 donaciones. Leer es gratis. |
| Hosting | ≈ USD 50 por mes |
| Mirror Node pago (con tráfico alto) | ≈ USD 100 a 300 por mes (**SUPUESTO**) |
| Contador y abogado | ≈ USD 400 por mes (**SUPUESTO**) |
| Total anual de infraestructura y servicios | ≈ USD 10.000 |

**Lo que dicen los números, sin maquillaje:**
- **El año 1 no paga sueldos.** Tres personas a USD 1.500 por mes son USD 54.000 al año.
- El punto de equilibrio está cerca de **USD 65.000 por año**, alrededor de la mitad del año 2.
- El año 1 se financia con fondos no reembolsables y con el piloto: en la emergencia es gratis, y eso genera la reputación que vende el año 2.
- **El negocio son los clientes institucionales,** municipios y ONG, por la transparencia permanente. Las colectas de emergencia son la vidriera.

## 6. Avalado por la ley

> El detalle actualizado (IGPJ, PSAV, UIF, ARCA, datos personales, firmas y checklist para producción) está en [`LEGAL.md`](LEGAL.md).

**El diseño legal tiene una regla central: nunca tocamos la plata.** Somos un registro, no un intermediario de pagos.

| Tema | Norma | Cómo lo cumplimos |
| --- | --- | --- |
| No somos procesador de pagos | — | Las donaciones van directo a la cuenta de la organización (Mercado Pago o banco). Nosotros solo **leemos** con permiso (OAuth en solo lectura). |
| Cripto | CNV RG 994/2024 y RG 1058/2025 (PSAV) | Las donaciones en USDC las firma el donante y van de billetera a billetera. No custodiamos ni transferimos por cuenta de terceros, así que en principio no somos PSAV. **Hay que confirmarlo con un abogado.** |
| Lavado de dinero | Ley 25.246, art. 20 inc. 18; Res. UIF 30/2011; IGJ RG 4/2012 | Las **personas jurídicas que reciben donaciones** son sujetos obligados ante la UIF y tienen que justificar el origen de los fondos. Nuestra trazabilidad **les ayuda a cumplir**: es un argumento de venta. Nosotros no recibimos donaciones. Hay que verificar los umbrales vigentes. |
| Datos personales | Ley 25.326 | **Nunca van datos personales a Hedera**, solo hashes con sal. Los datos del donante quedan fuera de la red y se pueden borrar si lo pide (derecho de supresión). Es la respuesta a "¿y si la red no se puede borrar?". |
| Donaciones | Código Civil y Comercial (contrato de donación) | La relación de donación es entre el donante y la organización. Nosotros somos un servicio de registro. |
| Deducción en Ganancias | Ley de Ganancias (deducción de hasta el 5 % de la ganancia neta, a entidades exentas habilitadas por ARCA, RG 2681) | El certificado y el registro sirven de respaldo. Solo aplica a entidades habilitadas, y se puede verificar el CUIT en ARCA. |
| Gestión de emergencias | Ley 27.287 (SINAGIR) y su registro RAGIR | La ley integra a las ONG y al sector privado a la gestión del riesgo. Hay que inscribirse en el RAGIR para tener un canal formal con Protección Civil. |
| Acceso a la información | Corrientes, Ley 5834 (**SUPUESTO**: verificar número y vigencia) | Para municipios y provincia, el portal ayuda a cumplir la obligación de publicar información. |
| Contratos con el Estado | Régimen de contrataciones de Corrientes y de cada municipio (**SUPUESTO**: verificar si la emergencia habilita la contratación directa) | En la emergencia lo damos gratis, sin contratación. La licencia paga va después, por la vía que corresponda. |
| Nuestra empresa | Ley 27.349 (S.A.S.) | La constituimos para facturar las licencias. |

**Lo que no prometemos:** el registro en Hedera no es "fecha cierta" en el sentido del Código Civil. Es **evidencia técnica** de que nadie cambió el registro. La validez legal de cada gasto la da la factura con CAE.

## 7. Pros y contras

### A favor
1. **El momento:** la emergencia es ahora, en Corrientes, con pronóstico de meses.
2. **El dolor está documentado:** cuentas truchas, rendiciones que nadie ve y desconfianza que frena donaciones.
3. **Costo casi cero:** leer es gratis y escribir cuesta fracciones de centavo de dólar.
4. **Regulación liviana:** no custodiamos fondos, así que no somos banco ni procesador de pagos, y en principio tampoco PSAV.
5. **Se monta sobre lo que la gente ya usa:** Mercado Pago, alias y CAE. El donante no necesita saber de cripto.
6. **Se replica:** sirve para cualquier desastre, provincia o país. Inundación, incendio, sequía: es el mismo protocolo.
7. **Es un bien público abierto:** el código es abierto y se puede postular como *Digital Public Good*, lo que abre fondos internacionales (**SUPUESTO**).

### En contra, y cómo lo respondemos

| Riesgo | Respuesta |
| --- | --- |
| **Basura que entra, basura que queda:** el organizador puede cargar un gasto falso | Factura con CAE verificable en ARCA, carga automática desde Mercado Pago y, más adelante, confirmación del proveedor y el agente auditor (AI Studio) |
| El Estado tarda y la transparencia incomoda a la política | Arrancar con ONG y con el registro de alias, que no compromete a nadie. Presentarlo como **protección del organizador honesto**. |
| Las donaciones en especie (colchones, agua) no quedan registradas | Próxima versión: entregas con QR por lote |
| Dependencia de la API de Mercado Pago | Cargar también desde el extracto bancario, y tener la cripto como vía propia |
| Límite del Mirror Node público si hay mucho tráfico | Caché de la página (el registro no cambia hacia atrás) y un proveedor pago |
| Competencia: Botón Donar de Mercado Pago, Donar Online, Pulenta (donaciones en cripto) | Ellos **cobran o reciben** donaciones. Nosotros **verificamos** las de todos, y nos podemos integrar con ellos en vez de competir. |
| Ingresos chicos el año 1 | Lo decimos de entrada: la emergencia es la vidriera y el negocio son los institucionales |

## 8. Por qué se aprueba (contra la rúbrica)

| Criterio | Puntos | Qué mostramos |
| --- | --- | --- |
| Validación | 30 | Maratea 2022 en Corrientes, cuentas truchas en Bahía Blanca 2025, *Cultura de Dar* y **entrevistas propias** (pendiente: organizadores, ONG y Defensa Civil) |
| Por qué blockchain | 25 | Tres partes que no confían entre sí y un registro que nadie puede editar, ni nosotros. Leer es gratis. |
| Uso de Hedera | 15 | HCS, HTS y Mirror Node, con transacciones en vivo. Sin token innecesario. |
| Viabilidad y modelo | 15 | Quién paga (institucionales), gratis en la emergencia, ley aplicable y primer paso: piloto la semana del 19/10 |
| Impacto | 10 | 222 evacuados hoy, 30 municipios vulnerables y replicable a cualquier desastre |
| Claridad | 5 | Una frase: "La Argentina junta millones en una noche. Ahora puede demostrar adónde fue cada peso." |

## 9. Lo que hay que validar esta semana

Preguntas para las entrevistas, con 3 o más personas por grupo:

- **Organizadores y ONG:**
  - ¿Cómo rinden cuentas hoy?
  - ¿Les pidieron comprobantes?
  - ¿Cuánto tiempo les lleva?
  - ¿Pagarían USD 40 por mes por la rendición automática?
- **Donantes:**
  - ¿Dejaron de donar por desconfianza?
  - ¿Alguna vez dudaron de un alias?
  - ¿Verificarían su donación si fuera un clic?
- **Defensa Civil y municipios:**
  - ¿Cómo publican hoy las cuentas oficiales?
  - ¿Les sirve un registro firmado?
  - ¿Qué tienen que rendir al Concejo?

## Fuentes

- Maratea, incendios de Corrientes 2022: [Diario de Cuyo](https://diariodecuyo.com.ar/argentina/La-colecta-de-Maratea-para-los-incendios-de-Corrientes-supero-los-100-millones-de-pesos-20220221-0008.html), [Los Andes](https://www.losandes.com.ar/sociedad/santi-maratea-lo-hizo-otra-vez-junto-mas-de-111-millones-de-pesos-para-combatir-los-incendios-en-corrientes/), [La Capital MDP](https://www.lacapitalmdp.com/corrientes-el-fuerte-apoyo-a-santi-maratea/), [Cadena 3](https://www.cadena3.com/noticia/sociedad/que-hara-santi-maratea-con-los-100-millones-recaudados_317715)
- Cáritas, incendios de 2022: [caritas.org.ar](https://caritas.org.ar/mas-de-15-000-personas-sumaron-donaciones-a-caritas-por-los-incendios-en-corrientes-y-misiones/)
- Bahía Blanca 2025, cuentas falsas: [Chequeado](https://chequeado.com/ultimas-noticias/inundaciones-en-bahia-blanca-cuidado-con-los-intentos-de-estafas-al-momento-de-hacer-una-transferencia-para-ayudar-a-los-damnificados/), [LM Neuquén](https://www.lmneuquen.com/pais/alerta-estafas-virtuales-las-donaciones-bahia-blanca-como-identificarlas-n1179133); Gran Hermano: [Aire de Santa Fe](https://www.airedesantafe.com.ar/espectaculos/se-conocio-el-monto-que-recaudo-gran-hermano-ayudar-los-afectados-el-temporal-bahia-blanca-n610752); fondos: [BAE Negocios](https://www.baenegocios.com/sociedad/a-una-semana-del-temporal-en-bahia-blanca-los-numeros-de-la-ayuda-tras-la-tragedia-20250314-0028.html)
- Cultura de Dar 2025: [Economía Sustentable](https://economiasustentable.com/noticias/son-solidarios-los-argentinos-un-nuevo-informe-revela-como-y-por-que-ayudan/amp/)
- El Niño 2026: [Infobae, 1/10](https://www.infobae.com/america/medio-ambiente/2026/10/01/el-nino-se-intensifica-las-zonas-de-argentina-donde-se-esperan-mas-lluvias-y-temperaturas-inferiores-a-lo-normal-en-el-ultimo-trimestre-del-ano/), [Infobae, 15/10](https://www.infobae.com/politica/2026/10/15/primeros-impactos-de-el-nino-las-zonas-de-riesgo-que-monitorea-el-gobierno-para-los-proximos-30-dias/), [La Nación](https://www.lanacion.com.ar/sociedad/super-nino-2026-que-se-sabe-del-fenomeno-que-cambiara-por-completo-el-clima-en-la-argentina-y-nid05102026/), [Confirmado](https://www.confirmado.com.ar/vernota.asp?id_noticia=34927)
- Corrientes, octubre de 2026: [Infobae, 16/10](https://www.infobae.com/sociedad/2026/10/16/el-nino-las-aguas-del-parana-ingresaron-a-la-ciudad-de-corrientes-y-la-provincia-suma-mas-de-200-evacuados/), [El Litoral](https://www.ellitoral.com.ar/sociedad/2026-10-15-21-30-0-el-numero-de-evacuados-se-duplico-en-corrientes-ya-hay-222-personas-fuera-de-sus-hogares), [Misiones Online](https://misionesonline.net/2026/10/15/corrientes-el-nino-parana-uruguay/), [Perfil (30 municipios)](https://www.perfil.com/noticias/nea/el-nino-en-argentina-preven-lluvias-superiores-a-lo-normal-y-monitorean-30-localidades-vulnerables-en-corrientes.phtml)
- UIF y donaciones: [Res. UIF 30/2011 (ICNL)](https://www.icnl.org/wp-content/uploads/Argentina_uif30.pdf), [IGJ RG 4/2012](https://www.boletinoficial.gob.ar/detalleAviso/primera/66402/20120307)
- SINAGIR y RAGIR: [Resolución 47/2022](https://www.argentina.gob.ar/normativa/nacional/norma-376826/texto)
- Deducción de donaciones: [Guía de ARCA](https://serviciosweb.afip.gob.ar/genericos/guiaspasopaso/VerGuia.aspx?id=278)
- Mercado Pago marketplace: [documentación de Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)
- Competencia: [Pulenta (Forbes)](https://www.forbesargentina.com/innovacion/de-mano-cura-una-firma-diseno-una-wallet-mundo-crypto-suma-causas-solidarias-n20509), [Botón Donar de Mercado Pago](https://www.memo.com.ar/economia/boton-donar-mercado-pago/)
- Acceso a la información en Corrientes: [SIPIAPA](https://media.sipiapa.org/adjuntos/185/documentos/001/829/0001829552.pdf)
