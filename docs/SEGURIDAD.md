# Seguridad

Qué controles de seguridad tiene el proyecto, contra qué norma se ordenan y qué falta. Al 2026-11-10.

## Alcance y norma de referencia

Los controles están ordenados según **ISO/IEC 27002:2022** (el catálogo de controles de ISO/IEC 27001:2022), con
**OWASP ASVS** y el **OWASP Top 10** como guía de detalle para la aplicación web.

**Esto no es una certificación.** ISO 27001 certifica el sistema de gestión de una *organización* (política aprobada,
análisis de riesgos, roles, auditoría interna, un organismo certificador), no un repositorio. Lo que hay acá es la
parte que sí se resuelve en el código y en la configuración, más la lista de lo organizativo que queda pendiente.

## Cómo avisar de una falla

`/.well-known/security.txt` (RFC 9116). Escribir antes de publicar el hallazgo. **No hacer pruebas que creen colectas
ni registros:** lo que entra a Hedera no se puede borrar.

## Controles aplicados

| Control ISO/IEC 27002:2022 | Qué hace el proyecto | Dónde |
| --- | --- | --- |
| 5.15 Control de acceso · 5.16 Gestión de identidad · 8.3 Restricción de acceso | **Alta de colectas con código.** En la red real no se crea nada sin un `codigoAlta` que se entrega a la organización después de validarla (CUIT, IGPJ, titular de la cuenta). Un código sirve para una sola colecta. En la demo de testnet se puede crear sin código, pero la colecta queda **sin verificar**: sin sello y sin Mercado Pago. | `api/colectas/index.js`, `api/_seguridad.js` |
| 8.5 Autenticación segura | El servidor guarda solo el **hash** de los códigos de alta (`CODIGOS_ALTA_HASH`) y de la clave del organizador (`orgKeyHash`, 128 bits al azar). Las comparaciones son en tiempo constante. | `api/_seguridad.js`, `api/_comun.js` |
| 8.2 Accesos privilegiados | Gastos, entregas y conversiones solo con la clave del organizador. La conciliación de pagos solo con `CRON_SECRET`. Los topics de Hedera tienen `submitKey`: solo la plataforma escribe, y no tienen `adminKey`: nadie borra. | `api/_colecta/*`, `api/webhooks/mercadopago.js`, `hedera/colectas.js` |
| 8.26 Requisitos de seguridad de la aplicación | **Sin organización validada no hay cobro:** el link de Mercado Pago se niega a las colectas sin verificar, y el webhook no registra pagos para ellas. Fuera de la red real, el servidor entrega solo el checkout de prueba (antes ese freno estaba solo en el navegador). | `api/_colecta/mercadopago.js`, `api/webhooks/mercadopago.js` |
| 8.28 Codificación segura | Entradas validadas y recortadas en el servidor, sin caracteres de control; el cliente no puede fijar `verificada` (el servidor arma el evento campo por campo). Cuerpo de los pedidos con tope de 16 KB. Los errores internos salen con un texto genérico y el detalle va al log. La web escribe los datos con `textContent` o escapados. | `api/_comun.js`, `api/_seguridad.js` |
| 8.6 Gestión de capacidad · 8.16 Monitoreo | **Regla del Firewall de Vercel** (creada el 10/11/2026 en el proyecto de la demo): 30 `POST` a `/api/*` por minuto y por IP, y después responde 429 sin llegar a las funciones; el webhook de Mercado Pago queda afuera. Es de la plataforma, no del repo: **el proyecto de mainnet necesita la suya**. Además, en el código, **límite de pedidos** por IP en todas las funciones que escriben o gastan, y un tope por hora sin mirar la IP en las que gastan HBAR (crear colecta, propuestas, donación de demo, núcleo). Cada rechazo queda en el log. | Firewall de Vercel, `api/_seguridad.js` |
| 8.23 Filtrado web · 8.9 Gestión de la configuración | Cabeceras en todas las respuestas: `X-Frame-Options: DENY` y `frame-ancestors 'none'` (clickjacking), `nosniff`, `Referrer-Policy`, `Permissions-Policy` (cámara solo para la selfie de identidad), `Cross-Origin-Opener-Policy`, HSTS (lo pone Vercel). | `vercel.json` |
| 8.15 Registro de eventos | El alta de cada colecta queda en el log del servidor y en el registro público de Hedera, con la huella del código usado (`altaHuella`). Todo hecho de una colecta es un evento con fecha de consenso. | `api/colectas/index.js`, HCS |
| 5.34 Privacidad y datos personales · 8.11 Enmascarado | A Hedera no va ningún dato personal: solo hashes y datos públicos de organizaciones. La IP no se escribe en el log: solo su huella. | `docs/LEGAL.md`, `api/_seguridad.js` |
| 8.24 Uso de criptografía | SHA-256 para huellas; claves al azar de `crypto.randomBytes`; TLS de Vercel. Firmas de Hedera con las claves del operador. | — |
| 5.17 Información de autenticación · 8.4 Acceso al código fuente | Las claves viven en variables de Vercel y en archivos fuera de git; un hook de pre-commit y un workflow revisan que no se suba ninguna. | `.githooks/`, `scripts/check-secrets.js`, `.github/workflows/secret-scan.yml` |
| 8.8 Gestión de vulnerabilidades técnicas · 5.24–5.27 Incidentes | Canal de aviso (`security.txt`), este documento y la lista de colectas ocultas para lo que no corresponde seguir mostrando. | `web/.well-known/security.txt`, `api/_seguridad.js` |
| 8.29 Pruebas de seguridad · 8.31 Separación de entornos | `npm run test:seguridad` prueba los controles sin tocar la red. La demo (testnet) y el piloto (mainnet) son deploys separados, y en mainnet las funciones de demo responden 403. | `scripts/seguridad.test.js`, `docs/MAINNET.md` |

## Operación

- **Dar de alta una organización:** validarla a mano, correr `npm run codigo-alta`, entregarle el código por un canal
  privado y sumar el hash a `CODIGOS_ALTA_HASH` en Vercel (varios, separados por coma). Después de usarlo, el hash se
  puede quitar.
- **Colectas anteriores al código de alta** que ya están validadas: sus ids van en `COLECTAS_VERIFICADAS`.
- **Ocultar una colecta** que no corresponde mostrar: sumar su id a `OCULTAS` en `api/_seguridad.js`. Sigue en Hedera,
  pero la API deja de servirla.

## Revisión del 10/11/2026

Un tercero revisó la demo y encontró cinco puntos. Estado:

| # | Hallazgo | Estado |
| --- | --- | --- |
| 1 | Colectas creadas sin login y con link de pago de producción | Cerrado: alta con código, sin verificar no cobra, y fuera de mainnet solo checkout de prueba |
| 2 | El login vive en el navegador | **Abierto.** El login de `web/cuenta.js` sigue siendo de demo y no protege nada; ninguna función del servidor confía en él. Lo que protege es el código de alta y la clave del organizador |
| 3 | Clickjacking | Cerrado: cabeceras en `vercel.json` |
| 4 | Sin límite de pedidos | Cerrado: regla del Firewall de Vercel (tope global) más el límite fino del código |
| 5 | Cabeceras menores | Cerrado |

Las cinco colectas de prueba que dejó la revisión no se pueden borrar de Hedera: quedaron ocultas.

## Pendiente

**En la plataforma (no es código de este repo):**

- Avisos cuando el saldo de HBAR del operador baja de un mínimo.

**En el código:**

- Login real del lado del servidor (Supabase Auth o similar), con sesión validada en cada pedido.
- Validar la firma del webhook de Mercado Pago (`x-signature`). Hoy un aviso falso no puede inventar una donación,
  porque el pago se vuelve a leer en la API de MP, pero sí dispara esa consulta.
- Política de contenido (CSP) completa para scripts y estilos: primero en modo `Report-Only`.
- Validar el CUIT contra el padrón de ARCA/AFIP en vez de a mano.
- Revisión automática de dependencias (`npm audit`) en el workflow.

**Organizativo (lo que pide ISO 27001 y no se resuelve con código):**

- Política de seguridad escrita y aprobada, con responsables.
- Análisis de riesgos y declaración de aplicabilidad.
- Procedimiento de respuesta a incidentes y de alta y baja de accesos (Vercel, GitHub, cuentas de Hedera).
- Copias de las claves del operador y plan de rotación.
- Auditoría de los contratos antes de usarlos con plata real (ver `docs/MAINNET.md`).
