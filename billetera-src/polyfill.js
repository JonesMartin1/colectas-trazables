// Las librerías de Hedera esperan Buffer y process como en Node: en el navegador se los damos antes de cargarlas.
import { Buffer } from "buffer";
globalThis.Buffer ??= Buffer;
globalThis.process ??= { env: {}, browser: true };
globalThis.global ??= globalThis;
