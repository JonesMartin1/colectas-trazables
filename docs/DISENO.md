# Diseño funcional: organizador, entidad titular y donantes (D1–D29)

Este diseño salió de una entrevista de Martín con Claude el 17/10 (/grill-me), que endureció la propuesta de los tres tipos de usuario. La primera etapa, el **núcleo en la red**, ya está hecha en testnet: `contratos/Plataforma.sol` y `contratos/Colecta.sol`, la web `/nucleo` y `npm run nucleo` (ver [`../contratos/README.md`](../contratos/README.md)).

## Los tres usuarios

| Usuario | Qué hace | Cómo entra |
| --- | --- | --- |
| **Donante** | Dona y sigue su aporte; puede denunciar un comprobante de la colecta a la que donó | Cuenta con Google o mail verificado |
| **Organizador** (ej. Santi) | Arma la colecta y sus ítems, pide validación, recibe tramos y carga comprobantes | Verificación de identidad (DNI + prueba de vida) con un proveedor con convenio RENAPER |
| **Entidad** (ONG, gobierno) | Valida colectas, aprueba tramos y comprobantes, puede pausar | Registro oficial de su país, revisado por la plataforma; billetera multifirma |

## Cómo funciona una colecta

1. El organizador publica sus datos públicos (nombre del DNI, localidad, sello de verificado) y los **ítems con sus montos**, que se muestran como barras.
2. Pide validación a entidades aprobadas. **Se publica cuando valida una entidad inscripta en Argentina**, que el organizador elige como **titular legal**: recibe, emite recibos y responde ante la UIF y ARCA. Las extranjeras (ej. Greenpeace) figuran como avales.
3. Las donaciones entran al **contrato de la colecta**. El contrato cobra el **1 %** al entrar, una sola vez.
4. El contrato libera la plata al organizador **por tramos**: nunca puede tener "sin rendir" más del **30 % de la meta**, y cada tramo lo aprueba cualquier validadora.
5. Cada gasto **llena la barra de su ítem** con un comprobante: factura con **CAE** (verificada contra ARCA) por encima de $50.000; tickets sin factura hasta el **10 %** de lo liberado. La imagen queda fuera de la red; en Hedera va su huella, que no se puede repetir.
6. Se puede **reasignar** plata entre ítems con motivo y aprobación; si se mueve más del 30 % de un ítem, se avisa a los donantes.
7. **Denuncias:** solo de quien donó a esa colecta o de entidades. La titular (o dos validadoras) puede **pausar**; si se confirma el fraude, el organizador queda **inhabilitado**.
8. **Liquidación:** por fraude, por cierre (máx. 90 días + prórrogas aprobadas) o por 30 días sin actividad del organizador. Lo que queda vuelve a los donantes como **créditos** en un fondo común sin dueño: no vencen, no se canjean por plata y solo sirven para donar a otra colecta, sin pagar comisión de nuevo.

## Las 29 decisiones, resumidas

| # | Decisión | Estado |
| --- | --- | --- |
| D1 | En Hedera, solo la constancia de que el organizador fue verificado; DNI, fotos y biometría fuera de la red y borrables | Diseño (identidad simulada) |
| D2 | La plata sale por tramos aprobados por una validadora | **Hecho** (tope sin rendir del 30 %) |
| D3, D4, D12 | Sobrante o congelado → créditos en un fondo sin dueño, que no vencen | **Hecho** (`Plataforma.reclamar` / `usar`) |
| D5 | Entidades: registro oficial verificable + revisión; sin vínculo con el organizador | Hecho en contrato (`aprobarEntidad`); el proceso de alta falta |
| D6 | CAE obligatorio por encima de un umbral, tope de tickets, control de imágenes repetidas | **Hecho** en contrato; la verificación contra ARCA falta (necesita CUIT de la SAS) |
| D7 | Lanzamiento con donaciones en cripto; rampa en pesos y peso digital en paralelo | Pendiente (rampa sin confirmar) |
| D8 | Aprueba cualquier validadora; a los 7 días se puede pedir otra | **Hecho** (cualquier entidad aprobada puede validar) |
| D9 | Verificación con un proveedor con convenio RENAPER; no guardamos fotos | Pendiente |
| D10, D11 | La receptora legal es la entidad titular argentina; las extranjeras son avales | **Hecho** (el contrato exige titular "AR") |
| D13, D18 | Billetera conectada o código de donante; lo que llega por fuera entra como anónimo | **Hecho** (`donar(código)`, `reconocerAnonimas`, `atribuir`) |
| D14 | 1 % al entrar, una sola vez; los créditos reusados no pagan | **Hecho** |
| D15, D17 | Denuncias de donantes o entidades; pausa por la titular o dos validadoras; fraude inhabilita | **Hecho** |
| D16 | Reasignación entre ítems con motivo y aprobación; aviso a donantes si supera el 30 % | Hecho en contrato (evento); la notificación falta |
| D19 | Siempre hay un organizador persona (si es una ONG, un miembro suyo) | **Hecho** |
| D20 | Primera etapa: el núcleo en la red | **Hecho** |
| D21 | Entidades con billetera multifirma | Diseño (el contrato acepta cualquier cuenta) |
| D22 | Cambiar la billetera del organizador: nueva verificación facial + titular + 72 h, con la colecta pausada | Hecho en contrato |
| D23 | Imágenes de comprobantes en el VPS, con acceso por rol | Pendiente |
| D24 | La plataforma la opera una SAS del equipo | Pendiente |
| D25 | La SAS recarga HBAR a entidades y organizadores con parte del 1 % | Pendiente |
| D26 | Perfil público: nombre del DNI, localidad y sello; nunca DNI, domicilio ni teléfono | Diseño |
| D27, D28 | Colecta abierta hasta el cierre (máx. 90 días + prórrogas aprobadas); el excedente va a créditos | Hecho en contrato |
| D29 | Conversión de USDC a pesos registrada y conciliada antes de cargar facturas en pesos | Pendiente (existe `CONVERSION` en HCS) |

## Riesgos aceptados

- Dentro de cada tramo, la plata sí llega al organizador: el control es posterior y el freno es no liberar el siguiente tramo.
- Los tickets sin factura siguen siendo declarativos, con tope.
- Al principio solo dona quien tiene cripto.
- Los créditos no vencen, así que se acumulan.
- Se cobra comisión también sobre colectas que después se congelan.

## Pendientes para operar con plata real

1. Firma del donante con su billetera (HashPack + WalletConnect: necesita un Project ID de Reown).
2. Pruebas completas y auditoría externa de los contratos; despliegue en mainnet con USDC real (`0.0.456858`).
3. Login real, verificación de identidad con proveedor, alta de entidades, CAE contra ARCA, imágenes en el VPS.
4. Unificar la colecta vieja (HCS: `/crear`, `/colecta`) con la nueva en contrato (`/nucleo`).
5. SAS, dictamen legal (contratos sin dueño, créditos, UIF) e inscripción de la base de datos. Ver [`LEGAL.md`](LEGAL.md).
6. Decidir a dónde va la parte anónima de una colecta liquidada (hoy queda en el fondo, sin dueño que la reclame).
