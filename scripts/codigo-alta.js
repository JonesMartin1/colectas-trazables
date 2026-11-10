// Genera un código de alta para una organización ya validada (npm run codigo-alta).
// El CÓDIGO se le entrega a la organización por un canal privado: sirve una sola vez, para crear una colecta verificada.
// El HASH se agrega a la variable CODIGOS_ALTA_HASH de Vercel (varios, separados por coma). El servidor nunca guarda el código.
import crypto from "node:crypto";

const codigo = crypto.randomBytes(18).toString("base64url"); // 144 bits
const hash = crypto.createHash("sha256").update(codigo).digest("hex");
console.log(`Código de alta (entregar a la organización, no guardar en el repo):\n  ${codigo}\n`);
console.log(`Hash (agregar a CODIGOS_ALTA_HASH en Vercel):\n  ${hash}`);
