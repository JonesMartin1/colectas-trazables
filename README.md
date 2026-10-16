# Colectas Trazables

Colectas para emergencias donde cada donación y cada gasto quedan registrados en Hedera. Cualquiera puede verificar adónde fue la plata, y nadie puede borrar ni editar el registro: ni el organizador ni nosotros.

Proyecto para el **track Hedera de NEA Tech 2026** (Corrientes). El plan completo está en [`docs/PLAN.md`](docs/PLAN.md), y quién hace qué, los contratos entre partes y el horario, en [`docs/TAREAS.md`](docs/TAREAS.md).

## Estado

| Parte | Estado |
| --- | --- |
| Base en Hedera: token, cuentas, topic, transferencia y verificación en el Mirror Node (`hedera/`) | Hecha |
| Crear colecta (topic con `submitKey`, link y QR) | Por hacer |
| Donación en USDC con su evento DONATION | Por adaptar desde `hedera/pagar.js` |
| Gasto con hash de factura, CUIT y CAE (EXPENSE) | Por hacer |
| Página pública con balance y "verificá tu donación" | Por hacer |
| Mercado Pago sandbox (webhook y DONATION) | Si sobra tiempo |

## Cómo correrlo

Requisitos: Node 20 o más y una cuenta ECDSA de testnet de [portal.hedera.com](https://portal.hedera.com).

```bash
cd hedera
npm install
cp .env.example .env          # completar HEDERA_ACCOUNT_ID y HEDERA_PRIVATE_KEY
npm run setup                 # una sola vez: crea cuentas, token USDCd y topic; guarda los IDs en estado.json
npm run pagar -- 123 25.50    # pago de prueba: el neto al destinatario y el 0,5 % a la plataforma, más el registro en el topic
```

Cada paso imprime su link de HashScan.

`setup` no corre si ya existe `estado.json`. Para armar tu propio entorno de testnet, borrá ese archivo.

Las claves de las cuentas de prueba quedan en `.cuentas.json`, que no se sube.

## Evidencia en testnet

| Qué | ID | HashScan |
| --- | --- | --- |
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
5. **Cierre: viernes 16/10 a las 19:00.** Después de esa hora no se commitea nada. Los PRs tienen que estar mergeados antes de las 18:20.

Para no pisarse, cada uno trabaja en su carpeta:

| Carpeta | Qué va |
| --- | --- |
| `hedera/` | Todo lo que habla con la red: topics, mensajes, transferencias y Mirror Node |
| `backend/` | API: colectas, gastos y webhooks |
| `web/` | Alta de colecta y página pública |

## Originalidad y uso de IA

- Todo el código de este repo se escribió durante el ideathon, a partir del jueves 15/10 a las 14:00.
- No reutiliza proyectos anteriores.
- **Uso de IA:** el equipo usó Claude (Anthropic) como asistente para programar, redactar la documentación y revisar el plan contra el reglamento.

## Equipo

Martín, Gilda, Nicolás y Facu.
