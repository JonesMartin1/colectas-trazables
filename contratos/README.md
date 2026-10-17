# Fideicomiso de una colecta (smart contract en Hedera)

`FideicomisoColecta.sol` guarda el USDC de una colecta y **solo lo deja salir hacia proveedores aprobados, con la huella de la factura, cuando firman 2 de 3** (la organización y las entidades que la avalan). Corre en el servicio de contratos de Hedera (EVM) y mueve el token con el servicio de tokens (HTS, precompilado `0x167`).

- **Sin dueño:** se despliega sin clave de administrador, así que Hedera le pone como administrador al propio contrato. Nadie puede cambiarlo ni borrarlo, tampoco la plataforma. La plataforma no custodia: no tiene ninguna firma.
- **Reglas:** sumar un proveedor y cada pago necesitan `umbral` firmas. Quien propone cuenta como primera firma. Un pago exige proveedor aprobado, monto mayor que cero y la huella SHA-256 de la factura (el PDF nunca va a la red). Nadie firma dos veces la misma propuesta.
- **Lo que deja a la vista:** los eventos `Propuesto`, `Aprobado`, `ProveedorAprobado` y `Pagado` en HashScan.

## Dónde encaja

Pesos del donante → **rampa** (un PSAV que convierte, por ejemplo Binance Connect, ver `docs/LEGAL.md`) → USDC **al contrato** de la colecta, no a la organización → pagos a proveedores con doble firma. Así nadie tiene la plata "suelta" en ningún momento.

## Demo en testnet (17/10/2026)

`node contratos/demo.js [campaignId]` crea (una sola vez) tres firmantes y un proveedor de prueba, despliega un contrato nuevo, lo fondea con 50 USDCd como lo haría la rampa y recorre las protecciones. El resultado queda en `fideicomiso.json`; las claves de prueba, en `contratos/.claves.json` (fuera de git y de Vercel).

Contrato: [`0.0.11057590`](https://hashscan.io/testnet/contract/0.0.11057590), de la colecta `colchones-y-agua-para-itati-532f2d`.

| Paso | Resultado |
| --- | --- |
| La organización intenta pagarle a un proveedor no aprobado | rechazado: "El proveedor no esta aprobado" |
| El proveedor intenta aprobarse solo | rechazado: "No sos firmante de esta colecta" |
| La organización propone al proveedor y Defensa Civil aprueba | proveedor aprobado |
| La organización pide pagar 20 USDCd con la huella de la factura | queda en 1 de 2; el saldo no se mueve |
| La organización intenta firmar dos veces | rechazado: "Ya aprobaste esta propuesta" |
| Cáritas aprueba | se pagan 20 USDCd al proveedor; quedan 30 en el contrato |

## Compilar

```bash
cd contratos && npx --yes solc@0.8.24 --optimize --bin --abi -o build FideicomisoColecta.sol
```

Pendiente: la web todavía no lo muestra, y falta la devolución si la colecta vence sin gastarse. Para pagarle a una cuenta que recibe el token por primera vez hace falta gas alto (2.000.000), porque Hedera la asocia en el mismo pago.

---

# El núcleo: `Plataforma.sol` + `Colecta.sol` (diseño D1–D29)

Es la primera etapa del diseño funcional que salió de la entrevista del 17/10:
- un **organizador** verificado (Santi);
- una **entidad titular argentina**, que es la receptora legal;
- **entidades validadoras** que avalan;
- **donantes** con código.

| Contrato | Qué hace |
| --- | --- |
| `Plataforma.sol` | Registro de entidades aprobadas (con país y huella del registro oficial), colectas registradas por su titular, organizadores inhabilitados y **fondo de créditos**. La plataforma (`admin`) aprueba entidades y pasa las órdenes de los donantes, pero la plata del fondo solo puede ir a una colecta registrada y abierta. |
| `Colecta.sol` | Una colecta con **ítems (barras)**. Se publica cuando valida la titular. Las donaciones pagan el **1 %** de comisión al entrar, una sola vez; las transferencias directas cuentan como anónimas. Tramos al organizador con **tope sin rendir del 30 %** de la meta, cada uno aprobado por una validadora. **Comprobantes** con o sin CAE (los tickets, hasta el 10 % de lo liberado) que nunca se repiten. Reasignación entre ítems aprobada. **Denuncias** solo de donantes o entidades. Pausa (la titular, o 2 validadoras), fraude, prórroga, cambio de organizador con 72 h de espera, y **liquidación a créditos** por fraude, cierre o 30 días de inactividad. |
| `HTS.sol` | Asociar, transferir y cobrar con permiso (allowance) a través del servicio de tokens de Hedera. |

Ningún contrato tiene clave de administrador: no se pueden cambiar.

## Recorrido en testnet: `npm run nucleo` (49 pasos, todos como se esperaba, 17/10/2026)

Plataforma [`0.0.11058602`](https://hashscan.io/testnet/contract/0.0.11058602) · colecta [`0.0.11058607`](https://hashscan.io/testnet/contract/0.0.11058607) · segunda colecta [`0.0.11058623`](https://hashscan.io/testnet/contract/0.0.11058623). El detalle de cada paso, con su transacción, está en `nucleo.json`.

**Lo que se frena:**
- que alguien se apruebe solo como entidad;
- una titular extranjera;
- donar antes de que valide la titular, o con la colecta pausada;
- tramos que superan el tope sin rendir, o pedidos con la colecta pausada;
- aprobaciones de una entidad que no validó;
- tickets por encima del 10 %;
- una factura repetida;
- denuncias de quien no donó;
- liquidar antes de tiempo o reclamar dos veces;
- que un organizador inhabilitado abra otra colecta;
- usar créditos en una colecta liquidada.

**Lo que pasa:**
- las dos donaciones (comisión 1 %) y la anónima, reconocida;
- dos tramos (150 y 100), con comprobantes aprobados en el medio;
- las barras: Comida 12/300, Camas 100/150, Gasolina 0/150 (después de reasignar 50 de Camas a Gasolina);
- la denuncia, la pausa y el fraude confirmado;
- la liquidación: los créditos se reparten en proporción a lo donado, y el donante A usa la mitad de los suyos en otra colecta sin pagar comisión de nuevo.

**Pendientes:**
- La parte anónima de una liquidación queda en el fondo sin dueño que la reclame (habría que decidir a dónde va).
- La web todavía no usa estos contratos.
- La identidad está simulada: el organizador y las entidades son cuentas de prueba.

## Pruebas de plazos y un arreglo (17/10/2026)

`contratos/pruebas/` tiene una copia de `Colecta` con plazos de segundos (`ColectaPlazos.sol`, se genera desde `Colecta.sol`), porque en testnet no se puede adelantar el reloj.
- **`plazos.js`** probó: entidad con billetera multifirma 2 de 3 (con 1 firma la red responde `INVALID_SIGNATURE`), prórroga con tope de 90 días aprobada solo por la titular, cambio de organizador con espera (la colecta queda pausada y la billetera vieja deja de operar), liquidación por cierre con reclamo de créditos, y liquidación por inactividad.
- **Bug encontrado y arreglado:** una colecta que la titular validaba sin registrar en la Plataforma no se podía liquidar, y la plata quedaba trabada. Ahora **la titular tiene que registrarla antes de publicarla**, y si a una colecta nunca registrada le llega plata por fuera, al liquidarla **va a la titular**. Lo prueba `arreglo.js` (colecta `0.0.11060036`; liquidación: `0.0.11058573-1792233509-911036459`), y `npm run nucleo` pasó con 50 de 50 pasos (Plataforma `0.0.11060073`).

**Costos en testnet:** desplegar un contrato de este tamaño cuesta unos 55 HBAR (subir el bytecode más crearlo con 5M de gas). Cada firma de una entidad o donante con 2M de gas exige tener saldo para cubrir el máximo; por eso la web recarga 10 HBAR a los roles de la demo cuando bajan de 10, y "crear colecta" se pausa si el operador tiene menos de 150.
