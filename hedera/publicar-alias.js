// Publica un alias oficial firmado por dos instituciones (lo que haría cada institución desde su lado).
// Uso: node hedera/publicar-alias.js <alias> "<titular>" <cuit> <firmanteA> [firmanteB]
//   firmantes: defensa-civil | desarrollo-social | caritas | cruz-roja
// Con un solo firmante la red lo rechaza (INVALID_SIGNATURE): sirve para mostrar el umbral.
import { leerJson, ESTADO } from "./lib.js";
import { publicarAlias, cerrar } from "./alias.js";

const [alias, titular, cuit, ...firmantes] = process.argv.slice(2);
if (!alias || !titular || !firmantes.length) {
  console.log('Uso: node hedera/publicar-alias.js <alias> "<titular>" <cuit> <firmanteA> [firmanteB]');
  process.exit(1);
}
const topicId = process.env.ALIAS_TOPIC_ID ?? leerJson(ESTADO)?.aliasTopicId;
try {
  const r = await publicarAlias(topicId, { alias, titular, cuit }, firmantes);
  console.log(`Alias ${alias} publicado con ${firmantes.length} firmas: mensaje #${r.secuencia}  ${r.hashscan}`);
} catch (e) {
  console.log(`Rechazado con ${firmantes.length} firma(s): ${e.message.split("\n")[0]}`);
}
cerrar();
