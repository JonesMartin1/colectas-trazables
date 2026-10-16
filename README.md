# Colectas Trazables

Colectas para emergencias donde cada donación y cada gasto quedan registrados en Hedera. Cualquiera puede verificar adónde fue la plata, y nadie puede borrar ni editar el registro: ni el organizador ni nosotros.

**Demo en vivo:** https://colectas-trazables.vercel.app · colecta de ejemplo: https://colectas-trazables.vercel.app/colecta.html?id=colchones-y-agua-para-itati-0bd057

Proyecto para el **track Hedera de NEA Tech 2026** (Corrientes). El plan completo está en [`docs/PLAN.md`](docs/PLAN.md), y quién hace qué, los contratos entre partes y el horario, en [`docs/TAREAS.md`](docs/TAREAS.md).

## Estado

| Parte | Estado |
| --- | --- |
| Módulo de Hedera: registro de colectas, topic por colecta con `submitKey`, donación en USDC, eventos y lectura desde el Mirror Node (`hedera/colectas.js`) | Hecho y probado en testnet |
| API en Vercel (`api/`): crear colecta, donar, registrar gasto, leer y verificar | Hecha y probada contra testnet |
| Web (`web/`): inicio, página pública de la colecta y carga de gastos | Hecha (Facundo) |
| Registro de alias oficiales ("¿este alias es real?") | Por hacer |
| Mercado Pago sandbox (webhook y DONATION) | Por hacer |
| Publicación en Vercel | Hecha: https://colectas-trazables.vercel.app |

## Cómo correrlo

Requisitos: Node 20 o más y una cuenta ECDSA de testnet de [portal.hedera.com](https://portal.hedera.com).

```bash
npm install
cp .env.example .env          # completar HEDERA_ACCOUNT_ID y HEDERA_PRIVATE_KEY
npm run setup                 # una sola vez: crea las cuentas de prueba, el token USDCd y un topic (hedera/estado.json)
npm run registro              # una sola vez: crea el topic de registro de colectas
npm run probar                # de punta a punta: colecta, donación en USDC, gasto y lectura desde el Mirror Node
npm run dev                   # web + API en http://localhost:3000, sin Vercel (dev.js enruta /api/* a las mismas funciones)
```

Cada paso imprime su link de HashScan.

`setup` no corre si ya existe `estado.json`. Para armar tu propio entorno de testnet, borrá ese archivo.

Las claves de las cuentas de prueba quedan en `.cuentas.json`, que no se sube.

## Evidencia en testnet

| Qué | ID | HashScan |
| --- | --- | --- |
| Topic de registro de colectas | 0.0.11051457 | https://hashscan.io/testnet/topic/0.0.11051457 |
| Colecta de la demo: "Colchones y agua para Itatí" (topic) | 0.0.11052743 | https://hashscan.io/testnet/topic/0.0.11052743 |
| Donación de la demo: 17,86 USDCd al beneficiario | 0.0.10989169-1792179856-190341722 | https://hashscan.io/testnet/transaction/0.0.10989169-1792179856-190341722 |
| Gasto de la demo (EXPENSE, mensaje #2) | 0.0.10989169-1792179862-930293709 | https://hashscan.io/testnet/transaction/0.0.10989169-1792179862-930293709 |
| Colecta de prueba (topic) | 0.0.11051460 | https://hashscan.io/testnet/topic/0.0.11051460 |
| Donación de prueba en USDC | 0.0.10989169-1792172437-238686943 | https://hashscan.io/testnet/transaction/0.0.10989169-1792172437-238686943 |
| Cuenta de la plataforma | 0.0.10989169 | https://hashscan.io/testnet/account/0.0.10989169 |
| Cuenta destinataria | 0.0.11041201 | https://hashscan.io/testnet/account/0.0.11041201 |
| Cuenta donante | 0.0.11041202 | https://hashscan.io/testnet/account/0.0.11041202 |
| Token USDCd (HTS, 6 decimales) | 0.0.11041203 | https://hashscan.io/testnet/token/0.0.11041203 |
| Topic (HCS) | 0.0.11041205 | https://hashscan.io/testnet/topic/0.0.11041205 |
| Transferencia de prueba | 0.0.10989169-1792102885-902378674 | https://hashscan.io/testnet/transaction/0.0.10989169-1792102885-902378674 |

Esta tabla se actualiza con las transacciones de la demo final.

## Cómo contribuir (equipo)

1. Clonar el repo y crear una rama por tarea: `git checkout -b feat/pagina-publica`.
2. Commits chicos y descriptivos.
3. Push de la rama y PR contra `main`. Martín revisa y mergea.
4. **Nunca commitear `.env` ni `.cuentas.json`.** El `.gitignore` ya los excluye, pero revisá `git status` antes de cada commit.
5. **Cierre: sábado 17/10 a las 9:30.** Después de esa hora no se commitea nada. Los PR tienen que estar mergeados antes de las 8:30.

Para no pisarse, cada uno trabaja en su carpeta:

| Carpeta | Qué va |
| --- | --- |
| `hedera/` | Todo lo que habla con la red: topics, mensajes, transferencias y Mirror Node |
| `api/` | API como funciones de Vercel: colectas, gastos y webhooks |
| `web/` | Alta de colecta y página pública |

## Originalidad y uso de IA

- Todo el código de este repo se escribió durante el ideathon, a partir del jueves 15/10 a las 14:00.
- No reutiliza proyectos anteriores.
- **Uso de IA:** el equipo usó Claude (Anthropic) como asistente para programar, redactar la documentación y revisar el plan contra el reglamento.

## Equipo

Martín, Nicolás y Facundo.
