# Cómo funciona Colectas Trazables dentro de la ley argentina

Relevamiento del 16/10/2026. **No es asesoramiento legal.** Es el mapa para llevarle a un abogado y a un contador. Lo que no está confirmado va marcado **A CONFIRMAR**.

## El principio que ordena todo

**Colectas Trazables es un registro, no un intermediario.** Hay tres reglas que no se negocian:

1. **La plata nunca pasa por nosotros.** Va directo del donante a la cuenta de la organización: banco, Mercado Pago o su propia billetera.
2. **Quien recibe es una persona jurídica,** nunca una persona suelta. Es lo que pidió Henry Tong (16/10) y lo que exige la lógica de control del Estado.
3. **En Hedera no hay datos personales.** Solo hashes y datos públicos de organizaciones.

## 1. Quién organiza una colecta: personas jurídicas inscriptas en la IGPJ

- En Corrientes, las asociaciones civiles, las fundaciones, las cooperadoras y las comisiones vecinales obtienen personería jurídica ante la **Inspección General de Personas Jurídicas (IGPJ)**, del Ministerio de Justicia y Derechos Humanos. Su marco es el Decreto Ley 28/00 y el Código Civil y Comercial.
- **Para inscribirse, la IGPJ exige:**
  - acta constitutiva y estatuto por escribano;
  - Comisión Directiva y **Comisión Revisora de Cuentas, sin parientes entre sí**;
  - nómina de socios con DNI;
  - declaración jurada de no tener cargos públicos que los inhabiliten;
  - garantía y sellado.
- **Bomberos voluntarios:** su personería requiere **autorización de Defensa Civil**.
- **Normas recientes útiles:**
  - Res. IGPJ 496/2026: estatuto tipo para **asociaciones vecinales**, que agiliza su constitución.
  - Res. IGPJ 1282/2025: estatuto tipo para **cooperadoras hospitalarias**.
- **Vía rápida en una emergencia: la simple asociación** (Código Civil y Comercial, arts. 187 a 192).
  - Se constituye por instrumento privado con firma certificada y existe desde la fecha del acta.
  - Con menos de 20 socios puede prescindir del órgano de fiscalización, pero igual certifica sus estados contables.
  - Los administradores responden en forma solidaria.
  - **A CONFIRMAR:** si en Corrientes debe inscribirse en la IGPJ.

**En el producto:** para crear una colecta se pide la organización (nombre, tipo, CUIT y N° de resolución de la IGPJ, o "en trámite"). La página pública la muestra. Más adelante, la IGPJ puede ser **verificadora**: confirmar que la organización existe y está vigente antes de que su alias entre al registro oficial.

## 2. La plata: no somos procesador de pagos ni PSAV

**Pagos en pesos (Mercado Pago o transferencia):** van a la cuenta de la organización. Si leemos esos pagos, es en **solo lectura**, con su autorización (OAuth). No cobramos ni retenemos nada.

**Cripto (USDC en Hedera):**
- **Qué exige la norma:** la **RG CNV 994/2024** obliga a registrarse como PSAV a quien hace, **por cuenta de terceros**, alguna actividad del art. 4 bis de la Ley 25.246: intercambio, transferencia, custodia o administración de activos virtuales.
- **Excepciones:** quedan afuera quienes operan **por cuenta propia** y quienes no superan **35.000 UVA por mes**.
- **Diseño de producción:** el donante **firma la transferencia con su propia billetera** (HashPack) y la organización la recibe en **su propia billetera**. Nosotros no transferimos ni custodiamos. **A CONFIRMAR con un abogado:** que así no somos PSAV.
- ⚠ **La demo actual no es así:** la donación en USDC la firma una cuenta de prueba desde nuestro servidor. Sirve para mostrar el registro en testnet, pero **en producción se reemplaza** por la firma del donante con su billetera.
- **Si la organización quiere pasar los USDC a pesos,** lo hace en un exchange registrado como PSAV ante la CNV.

## 3. Lavado de dinero: las organizaciones son sujetos obligados

- **Res. UIF 30/2011**, modificada por las Res. UIF 50/2022, 84/2023 y 56/2024: las **personas jurídicas que reciben donaciones** son sujetos obligados, según el art. 20 inc. 18 de la Ley 25.246.
  - El umbral para ser sujeto obligado está expresado en salarios mínimos (catorce SMVM, según el texto relevado; **A CONFIRMAR** el texto vigente).
  - Deben informar **del 1 al 15 de cada mes** las donaciones que superen el monto fijado.
- **Valor del producto:** el registro de donaciones, con fecha, monto, medio y referencia, les facilita esos reportes. En Hedera no queda la identidad del donante, que la organización ya tiene por su banco o Mercado Pago.
- **Roadmap:** exportar un CSV para conciliar con el reporte a la UIF.

## 4. Impuestos: ARCA

- **Deducción en Ganancias:** el donante puede deducir donaciones a entidades **exentas habilitadas por ARCA** (consulta por CUIT; marco RG 2681 y RG 3611). El límite general relevado es del 5 % de la ganancia neta.
- **Comprobantes:** las entidades con **certificado de exención vigente** están exceptuadas de emitir comprobantes con validez fiscal (RG 1415). Las que no lo tienen emiten un comprobante del régimen general (por ejemplo, un recibo con los datos del donante, el monto y el medio de pago). **A CONFIRMAR** la vigencia.
- **Régimen de información anual:** "Donantes y Donatarios" (RG 2681, art. 36; aplicativo de la RG 3166).
- **Gastos:** cada gasto se respalda con una **factura electrónica con CAE**, que ARCA permite verificar. Es la pieza que da veracidad.

## 5. Datos personales: Ley 25.326

- **En la red pública no va ningún nombre, DNI ni dato de donantes o beneficiarios.** Solo hashes con sal y datos públicos de organizaciones (razón social, CUIT, alias).
  - **Por qué importa:** lo que va a Hedera no se puede borrar, y la ley da derecho a pedir la supresión. Si en la red no hay datos personales, no hay nada que suprimir.
- **Fotos:** una imagen que permite identificar a alguien **es un dato personal** (AAIP, Disposición 10/2015), y tratarla requiere **consentimiento libre, expreso e informado** (art. 5 de la Ley 25.326; art. 53 del Código Civil y Comercial).
  - **Regla del producto:** la foto de una entrega muestra **lo entregado, sin caras**, o se carga con el consentimiento de quienes aparecen.
  - La foto **no se sube**: queda con la organización, que es responsable del dato. A la red va solo su hash.
- **Pendientes:** una política de privacidad y la inscripción de bases ante la AAIP, si guardamos datos de usuarios (hoy no guardamos ninguno).

## 6. Las firmas del registro de alias (2 de 4)

- Las firmas criptográficas de Hedera son **firma electrónica** en los términos de la Ley 25.506. **No son firma digital:** no usan un certificado de un certificador licenciado.
- **Qué implica:** la firma electrónica **no tiene presunción de autoría ni de integridad**. Si alguien la desconoce, quien la invoca tiene que probarla.
- **Cómo lo hacemos sólido:** un **convenio de adhesión**, firmado con firma digital u ológrafa por cada institución firmante (Defensa Civil, Desarrollo Social, Cáritas, Cruz Roja), donde cada una **declara su clave pública y reconoce como propias las firmas hechas con ella**. Es la práctica habitual de pactar la validez probatoria.
- **Fecha cierta:** el sello de tiempo de consenso de Hedera es **evidencia técnica**, no "fecha cierta" en el sentido del Código Civil y Comercial. La validez legal de cada gasto la da su factura con CAE.

## 7. Trabajar con el Estado

- **Convenio de colaboración:** en la emergencia, la herramienta es **gratis**. Para que Defensa Civil o Desarrollo Social firmen alias o publiquen avisos alcanza con un convenio de colaboración, sin contratación.
- **Licencia paga, más adelante:** la **Ley 5571** de Corrientes (administración financiera) prevé **contratación directa en emergencia** (art. 109, inc. 3 d). Así se usó en la emergencia sanitaria de la Ley 6528. Para municipios, aplica su propio régimen. **A CONFIRMAR**.
- **Gestión del riesgo:** **Ley 27.287 (SINAGIR)**. Inscribirnos en el registro de organizaciones de la sociedad civil (RAGIR) para tener un canal formal con Protección Civil.

## 8. Nuestra empresa

- Una **S.A.S.** (Ley 27.349) para facturar licencias. **A CONFIRMAR** dónde se inscribe en Corrientes.
- **Términos y condiciones**, con jurisdicción en Corrientes:
  - **somos un registro;**
  - **no verificamos la veracidad de lo que carga cada organización,** que es responsable de su contenido;
  - **no custodiamos fondos.**
- **Seguro y responsabilidad:** a evaluar antes de pasar a mainnet.

## Checklist para salir de testnet a producción

| # | Tarea | Quién | Estado |
| --- | --- | --- | --- |
| 1 | Organización obligatoria al crear una colecta (tipo, CUIT, N° IGPJ) | Producto | **Hecho** (16/10) |
| 2 | Regla de fotos sin caras o con consentimiento, en el formulario de entregas | Producto | **Hecho** (16/10) |
| 3 | Términos y política de privacidad (borrador) | Producto + abogado | **Borrador** (16/10) |
| 4 | Reemplazar la donación firmada por el servidor por la firma del donante (HashPack) | Producto | Pendiente |
| 5 | Dictamen: ¿somos PSAV con el diseño no custodio? | Abogado | Pendiente |
| 6 | Convenio de adhesión de los firmantes con sus claves públicas | Abogado + instituciones | Pendiente |
| 7 | Convenio de colaboración con Defensa Civil y Desarrollo Social | Gobierno | Pendiente |
| 8 | Texto vigente de la Res. UIF 30/2011 y de los regímenes de ARCA | Contador | Pendiente |
| 9 | Constituir la S.A.S. | Equipo | Pendiente |
| 10 | Inscripción en el RAGIR (SINAGIR) | Equipo | Pendiente |

## Fuentes

- IGPJ Corrientes: [Minjus Corrientes](https://minjus.corrientes.gob.ar/noticia/obtencion-de-personeria-juridica-asociaciones), [+blogdelcontador (Res. 496/2026 y 1282/2025)](https://siap.blogdelcontador.com.ar/organismo/igpj-inspeccion-general-de-personas-juridicas-de-la-provincia-de-corrientes/)
- Simple asociación: [CCyC art. 187](https://www.conceptosjuridicos.com/ar/articulos/codigo-civil-y-comercial-articulo-187/), [art. 190](https://codigocivilonline.com.ar/etiquetas/articulo-190/)
- PSAV: [RG CNV 994/2024 (texto)](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-994-2024-397598/texto), [Bruchou & Funes de Rioja](https://bruchoufunes.com/nuevas-resoluciones-de-uif-y-cnv-sobre-proveedores-de-servicios-de-activos-virtuales-psav/), [Microjuris](https://aldiaargentina.microjuris.com/2025/03/14/legislacion-cnv-aprueban-la-regulacion-de-los-proveedores-de-servicios-de-activos-virtuales-psavs/)
- UIF donaciones: [UIF: sector donaciones (Res. 30/2011)](https://www.argentina.gob.ar/uif/preguntas-frecuentes-generales-uif/consultas-por-sector/sector-donaciones-o-aportes-de-terceros-resolucion-uif-no-302011), [Res. 50/2022](https://www.boletinoficial.gob.ar/detalleAviso/primera/260923/20220413), [Biblioteca AFIP](https://biblioteca.afip.gob.ar/dcp/RES_59000030_2011_01_27)
- ARCA: [Consulta: donaciones (Consejo Salta)](https://www.consejosalta.org.ar/wp-content/uploads/CONSULTA-Donaciones.pdf), [comprobante de entidad exenta](https://blogdelcontador.com.ar/consulta-frecuente-que-comprobante-debe-emitir-una-entidad-exenta-para-respaldar-las-donaciones-recibidas), [RG 3611](https://blogdelcontador.com.ar/resolucion-general-3611-afip-se-modifica-y-complementa-el-procedimiento-de-exenciones-en-ganancias-para-las-entidades-sin-fines-de-lucro)
- Imagen como dato personal: [Disposición DNPDP 10/2015](https://www.argentina.gob.ar/normativa/nacional/243335/texto)
- Firma electrónica: [abogados.com.ar](https://abogados.com.ar/la-firma-electronica-en-argentina-validez-juridica-robustez-tecnologica-y-eficiencia-operativa/39342), [Derecho en Zapatillas](https://www.derechoenzapatillas.com/2020/firma-electronica-y-firma-digital-en-la-jurisprudencia/)
- Contratación directa en emergencia (Corrientes, Ley 5571): [decreto de emergencia sanitaria](https://e-legis-ar.msal.gov.ar/htdocs/legisalud/migration/pdf/35797.pdf)
