# Colectas Trazables — contexto para quien trabaje en este repo (personas o IA)

Colectas para emergencias donde cada donación, gasto, entrega y alias oficial queda registrado en **Hedera** y cualquiera lo verifica gratis. Lema: **"Mirá llegar tu ayuda"**. Proyecto de NEA Tech 2026 (Corrientes), track Hedera. Equipo: Martín, Nicolás y Facundo.

- **Demo en vivo:** https://colectas-trazables.vercel.app. Cada push a `main` despliega solo (Vercel personal de Martín).
- **Cierre de la entrega:** se anunció el cambio al sábado 17/10 a las 9:30, pero el formulario de Hedera (forms.gle/CXr9GdkbeXb6VuDV9) todavía dice viernes 16/10 a las 19:00. Después del cierre no se commitea nada.

## Cómo está armado

| Carpeta | Qué hay |
| --- | --- |
| `hedera/` | Todo lo que habla con la red. `colectas.js` maneja el registro de colectas, el topic por colecta, la donación USDC, los eventos y la lectura desde el Mirror Node. `alias.js` es el registro de alias con clave **2 de 4**. `avisos.js` es el canal de avisos oficiales, que solo puede firmar Defensa Civil. |
| `api/` | Funciones de Vercel. El plan gratuito admite **12 por deploy**: las acciones de una colecta (`donaciones`, `gastos`, `entregas`, `verificar`, `mercadopago`, `conversiones`) viven en `api/_colecta/` y las despacha `api/colectas/[id]/[accion].js`; una acción nueva va ahí, no como archivo suelto. `_comun.js` tiene las piezas compartidas y arma la colecta a partir de los eventos. |
| `web/` | HTML, CSS y JS sin build. La base es de **Facundo**: `app.js`, `index.html`, `colecta.html`, `gasto.html`. Lo agregado después va en archivos aparte: `alias.html` + `alias-check.js`, `entrega.html` + `entregas.js`, `avisos.html` + `avisos-view.js` y `terminos.html`. |
| `contratos/` | Smart contract `FideicomisoColecta.sol`: guarda el USDC de una colecta y solo paga a proveedores aprobados, con la huella de la factura y 2 de 3 firmas. Sin clave de administrador. Demo en testnet con `npm run fideicomiso` (contrato `0.0.11057590`). Claves de prueba en `contratos/.claves.json`, fuera de git. Ver `contratos/README.md`. |
| `dev.js` | Servidor local sin Vercel (`npm run dev`). Enruta `/api/*` a las mismas funciones. Si agregás una ruta en `api/`, sumala también a la lista `RUTAS`. |
| `docs/` | `PLAN` (idea), `TAREAS` (contratos), `NEGOCIO`, `LEGAL`, `ACTORES` (gobierno de Corrientes), `ANTECEDENTES`, `PITCH` (guion de 3 minutos). |

**Eventos de un topic de colecta:** `DONATION`, `EXPENSE`, `DELIVERY`, `CONVERSION` (pesos a USDC en un PSAV, la hace la organización). En el registro de colectas, `CAMPAIGN`; en el registro de alias, `ALIAS`; en el canal de avisos, `AVISO`. Cada mensaje de HCS admite hasta 1024 bytes.

**Lectura:** siempre desde el Mirror Node, que tarda unos segundos. Después de escribir, la API espera con `esperarEnMirror` antes de responder.

## Reglas que no se negocian (ver `docs/LEGAL.md`)

1. **Somos un registro, no un intermediario.** La plata va directo a la organización. No custodiamos ni transferimos por cuenta de terceros, para no ser PSAV.
2. **Quien recibe es una persona jurídica,** con CUIT y N° de la IGPJ. Nunca una persona suelta.
3. **A Hedera no va ningún dato personal.** Solo hashes y datos públicos de organizaciones. Las fotos de entregas van sin caras o con consentimiento; la foto no se sube, solo su hash.
4. **Hedera es un registro distribuido (DLT), no una "base de datos"** ni "la blockchain de Hedera". Así lo marcó el jurado.
5. **Nunca se commitean ni se imprimen claves:** `.env`, `hedera/.cuentas.json`, `hedera/.firmantes.json`, `contratos/.claves.json`. Están en `.gitignore` y `.vercelignore`. Antes de cada push, revisar con `git grep` que no haya claves.

**Pagar y registrar van separados.** `POST /api/demo/donar` es solo de la demo: una cuenta de prueba hace de billetera del donante y transfiere USDC con el memo `colecta:<id>` (en producción firma el donante con HashPack, o paga con Mercado Pago). `POST /api/colectas/:id/donaciones { txId }` registra la donación solo si el Mirror Node confirma la transferencia: tiene que haber salido bien, ir al beneficiario, llevar el memo de la colecta y no estar ya registrada. **Sin pago real, no hay donación en el registro.**

**Gastos y entregas, solo el organizador:** al crear la colecta se entrega una `claveOrganizador` (una sola vez) y en `CAMPAIGN` queda solo `orgKeyHash`. Las colectas sin `orgKeyHash` no admiten registros nuevos.

## Comandos

```bash
npm install
npm run dev                       # web + API en http://localhost:3000
npm run probar                    # prueba de punta a punta del módulo de Hedera en testnet
npm run alias -- <alias> "<titular>" <cuit> <firmanteA> <firmanteB>   # publicar un alias oficial (2 firmas)
```

Las tareas que se hacen una sola vez (`setup`, `registro` y `registro-alias`) ya están hechas. Los IDs están en `hedera/estado.json` y en el README.

## Trabajo en equipo

- **Antes de empezar:** hacer `git pull --rebase`. Commits chicos.
- **Si cambia un contrato de la API,** se actualiza `docs/TAREAS.md` en el mismo commit.
- **Archivos de Facundo** (`web/app.js` y los HTML base): tocarlos lo mínimo, y avisarle.
- **Uso de IA declarado:** el equipo usa Claude (Anthropic) como asistente.
