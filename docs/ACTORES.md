# Actores de Corrientes: quién firma, quién verifica y quién audita

Relevamiento del 16/10/2026. NEA Tech lo organiza el **Gobierno de Corrientes, a través del Ministerio de Ciencia y Tecnología**, junto con LNX Group. Lo que no se pudo confirmar va marcado **SUPUESTO**.

## El dato que cambia el pitch

El **6 de octubre de 2026** hubo una mesa de emergencia en Casa de Gobierno por El Niño. Participaron:
- **Gobierno provincial:**
  - Fornaroli, de la Secretaría General.
  - Gaya, de Seguridad.
  - Irigoyen, de Desarrollo Social.
  - Brambilla, de Asuntos Gubernamentales.
  - Lovinson, de Defensa Civil.
- **Organizaciones:** Cáritas, Cruz Roja, Rotary, la Pastoral Evangélica, la UNNE, la Federación Económica (FEC), la Asociación de Sociedades Rurales y el Ejército.

Ahí se acordó organizar la recepción, el acopio y la distribución de donaciones, y la nota oficial dice textualmente:

> "se establecerán mecanismos de transparencia y rendición de cuentas para las donaciones"

**El propio gobierno organizador anunció la necesidad hace diez días. Nosotros llevamos el mecanismo.**

## Cómo participa cada uno (sin token: con claves)

En Hedera, "participar" no requiere un token. Cada topic tiene una **clave de envío**, y esa clave puede ser **compartida entre varios firmantes con umbral** (*threshold key*). Por ejemplo, para que un alias entre al registro oficial pueden hacer falta 2 de 3 firmas: Defensa Civil, Desarrollo Social y Cáritas. **Ninguna institución sola puede agregar ni "colar" una cuenta.** Ese es el "consejo de firmantes" de Corrientes.

Los roles son cuatro:
- **Firmante:** escribe en el registro.
- **Verificador:** da fe de un dato.
- **Auditor:** lee y controla. Es gratis, desde el Mirror Node.
- **Impulsor:** patrocina o adopta.

## Gobierno provincial (Ejecutivo)

| Organismo | Responsable | Por qué le interesa | Rol |
| --- | --- | --- | --- |
| **Ministerio de Desarrollo Social** | José Irigoyen | Anunció los mecanismos de transparencia para las donaciones y maneja la asistencia a los evacuados | **Firmante** de las colectas oficiales y de las entregas. **Primer cliente.** |
| **Defensa Civil** | Bruno Lovinson (director) | Coordina la emergencia, monitorea 30 municipios vulnerables y publica los partes de evacuados | **Firmante** del registro de **alias oficiales** y de los partes con fecha |
| **Ministerio de Ciencia y Tecnología** | Luciano Cabrera | Organiza NEA Tech; su misión es que el Estado y las empresas adopten tecnología | **Impulsor** del piloto. Puede alojar la infraestructura. |
| **Secretaría General de la Gobernación** | Juan Pablo Fornaroli | Encabezó la mesa del 6/10 | **Impulsor político** del comité de emergencia |
| **Ministerio de Seguridad** | Adán Gaya | Estuvo en la mesa. Defensa Civil coordina con Seguridad (**SUPUESTO**: dependencia orgánica a confirmar). | Avala el registro de alias, porque prevenir estafas es un tema de seguridad |
| **Subsecretaría de Asuntos Gubernamentales** | Fernando Brambilla | Es el vínculo con los municipios | Puente para sumar municipios |
| **Ministerio de Hacienda y Finanzas** | Marcelo Rivas Piasentini | Maneja las cuentas oficiales y los fondos de emergencia | **Firmante** de los fondos públicos de emergencia (etapa 2) |
| **Ministerio de Obras Públicas** | Jorge Meza | La reconstrucción después de la crecida | **Firmante** de los gastos de reconstrucción (etapa 2) |
| **Ministerio de Coordinación y Planificación** | Carlos Vignolo | Planificación interinstitucional | Usuario de los reportes |
| **Fiscalía de Estado** | Horacio Ortega | Control de legalidad del Estado | **Auditor** y aval jurídico |

## Organismos de control y Legislatura

| Organismo | Por qué le interesa | Rol |
| --- | --- | --- |
| **Tribunal de Cuentas de Corrientes** | Aprueba o desaprueba las cuentas del Estado y de los municipios | **Auditor**: lee gratis el registro, que no se puede editar (**SUPUESTO**: no confirmamos sus autoridades actuales) |
| **Legislatura de Corrientes** | La Cámara de Diputados tiene un área de Innovación Tecnológica Legislativa desde diciembre de 2024 | **Auditor**. Puede proponer que toda colecta oficial de emergencia sea trazable. |
| **Concejos Deliberantes** | Controlan a cada municipio | **Auditores** locales |

## Municipios

| Municipio | Situación | Rol |
| --- | --- | --- |
| **Ciudad de Corrientes** (capital) | El Paraná entró al barrio Anahí. Ya tiene portal de datos abiertos (70 conjuntos), el asistente Muni Bot por WhatsApp y firma electrónica: está listo para lo digital. (**SUPUESTO**: intendente actual a confirmar.) | **Firmante** de sus colectas. Muni Bot puede responder "¿este alias es real?". |
| **Itatí** y **Empedrado** | Declararon la emergencia hídrica | **Municipios piloto** |
| **Ituzaingó** (Isla Apipé), **Paso de los Libres**, **Yahapé** y **Goya** | Primeras evacuaciones; el gobernador recorrió Apipé | Segunda ola del piloto |

## Banco, empresas y academia

| Actor | Por qué le interesa | Rol |
| --- | --- | --- |
| **Banco de Corrientes (BanCo)**, sponsor de NEA Tech | Es el banco provincial. Puede confirmar que un alias o CBU pertenece a un CUIT. | **Verificador** de la titularidad de las cuentas del registro de alias (**SUPUESTO**: hay que ver si es agente financiero de la provincia) |
| **Federación Económica de Corrientes (FEC)** | Empresas que donan y quieren mostrar adónde fue su aporte | **Clientes que pagan** (fee de RSE) |
| **Asociación de Sociedades Rurales** | Productores afectados y donantes | Usuarios y donantes |
| **UNNE** | Estuvo en la mesa. Es independiente y tiene capacidad técnica. | **Verificador u observador independiente**. Puede correr su propio Mirror Node o auditar. |
| **Universidad de la Cuenca del Plata (UCP)**, sponsor | Ecosistema del evento | Aliado académico |
| **LNX Group**, coorganizador | Ecosistema tecnológico | Aliado para escalar |

## Sociedad civil (las que ya juntan donaciones)

| Organización | Rol |
| --- | --- |
| **Cáritas** | **Primera ONG piloto**: ya acostumbra rendir cuentas de lo recaudado en inundaciones. Puede ser una de las firmas del registro de alias. |
| **Cruz Roja** (filial Corrientes) | ONG piloto y firmante |
| **Rotary Club** y **Pastoral Evangélica** | ONG usuarias |
| **Bomberos voluntarios** | Beneficiarios típicos de las colectas (antecedente: Maratea 2022) |
| **Ejército Argentino** | Logística de entregas. Etapa 2: lotes con QR. |

## Nacional

| Organismo | Rol |
| --- | --- |
| **Agencia Federal de Emergencias** (Ministerio de Seguridad Nacional) | Coordina los recursos nacionales ante desastres. Es el camino para escalar a otras provincias. |
| **SINAGIR / RAGIR** (Ley 27.287) | Inscribirnos en el registro para tener un canal formal con Protección Civil |
| **ARCA** | Verificador externo, sin convenio: valida el **CAE** de cada factura de gasto |

## Propuesta concreta para el pitch

1. **Consejo de firmantes del registro de alias:** Defensa Civil, Desarrollo Social, Cáritas y Cruz Roja, con umbral de 2 de 4.
2. **Verificador de titularidad:** Banco de Corrientes.
3. **Auditores, sin costo y sin pedir permiso:** Tribunal de Cuentas, Legislatura, UNNE, la prensa y cualquier vecino.
4. **Impulsor:** Ministerio de Ciencia y Tecnología, como piloto de NEA Tech.
5. **Piloto:** Itatí y Empedrado, que ya tienen la emergencia declarada, más la capital.

> "El 6 de octubre, el gobierno de Corrientes se comprometió a establecer mecanismos de transparencia y rendición de cuentas para las donaciones. Este es ese mecanismo, y funciona desde hoy."

## Fuentes

- Mesa del 6/10 y frase sobre transparencia: [Corrientes Hoy](https://www.corrienteshoy.com/info-general/corrientes-coordina-acciones-ante-la-llegada-de-el-ninio.htm)
- Gabinete de Juan Pablo Valdés: [Instituto de Cultura de Corrientes](https://culturacorrientes.com/el-gobernador-juan-pablo-valdes-puso-en-funciones-a-los-ministros-de-su-gabinete/), [El Litoral](https://www.ellitoral.com.ar/actualidad/2025-12-11-10-1-0-jura-de-ministros-en-corrientes-quienes-integran-el-gabinete-de-juan-pablo-valdes), [Letra P](https://www.letrap.com.ar/politica/corrientes-quien-es-quien-el-gabinete-del-gobernador-juan-pablo-valdes-n5420741), [Mapa del Estado](https://www.corrientes.gob.ar/gobierno/autoridades)
- NEA Tech (organizadores, Luciano Cabrera, Santiago Siri como orador): [neatech.com.ar](https://neatech.com.ar/), [Corrientes Hoy](https://www.corrienteshoy.com/info-general/comenzo-el-nea-tech-2026-el-encuentro-que-impulsa-el-desarrollo-tecnologico-en-corrientes.htm), [El Litoral](https://www.ellitoral.com.ar/sociedad/2026-9-29-15-14-0-nea-tech-2026-corrientes-sera-sede-de-un-evento-sobre-tecnologia-e-innovacion)
- Emergencia (Apipé, Itatí, Lovinson): [Infobae](https://www.infobae.com/sociedad/2026/10/14/el-impacto-de-el-nino-en-el-litoral-cuales-son-las-rutas-pueblos-y-pasos-fronterizos-afectados-por-las-lluvias-y-la-crecida-de-rios/), [La Nación](https://www.lanacion.com.ar/sociedad/crecidas-del-parana-y-del-uruguay-zonas-criticas-evacuados-rutas-cortadas-y-fechas-que-inquietan-nid15102026/), [Argentina Forestal (comités de julio)](https://www.argentinaforestal.com/2026/07/03/corrientes-el-gobierno-provincial-activa-comites-de-emergencia-ante-fuertes-impactos-de-el-nino/)
- Modernización municipal (datos abiertos, Muni Bot): [What Works Cities](https://whatworkscities.bloomberg.org/cities/corrientes-argentina/); Legislatura: [HCD Corrientes](https://hcdcorrientes.gov.ar/2024/12/)
- Cáritas rinde cuentas en inundaciones: [caritas.org.ar](https://caritas.org.ar/caritas-junto-a-los-hermanos-inundados-4/)
- Banco de Corrientes: [Indicadores AR](https://indicadores.ar/empresa/30500010602), [Perfil](https://www.perfil.com/noticias/nea/el-banco-de-corrientes-habilito-el-aguinaldo-dorado-como-pedir-el-anticipo-del-sac.phtml)
