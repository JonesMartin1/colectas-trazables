// Escritura en el núcleo, SOLO para la demo en testnet: el servidor firma como cada rol de prueba
// (donantes, organizador, entidades). En producción firma cada persona con su billetera (HashPack);
// estas claves de prueba nunca se usan en mainnet. Las claves vienen de NUCLEO_CLAVES (Vercel) o de
// contratos/.claves.json (local), que están fuera de git.
import crypto from "node:crypto";
import {
  AccountAllowanceApproveTransaction, AccountId, Client, ContractCreateFlow, ContractExecuteTransaction,
  ContractFunctionParameters, ContractId, TokenId, TransactionRecordQuery,
} from "@hashgraph/sdk";
import { clienteOperador, leerClave, leerJson, ESTADO, idTx, hashscan } from "./lib.js";
import { COLECTA_BIN } from "./nucleo-abi.js";
import { evmDeId } from "./nucleo.js";

const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";
export const PLATAFORMA_ID = process.env.NUCLEO_PLATAFORMA_ID ?? "0.0.11058602";

/** Los roles que se pueden usar desde la web. El organizador de la demo es "organizador2": el primero quedó inhabilitado en la prueba de fraude. */
export const ROLES = {
  "donante-a": { nombre: "Donante A", tipo: "donante" },
  "donante-b": { nombre: "Donante B", tipo: "donante" },
  organizador2: { nombre: "Santi (organizador)", tipo: "organizador" },
  "ent-caritas": { nombre: "Cáritas Itatí", tipo: "entidad" },
  "ent-greenpeace": { nombre: "Greenpeace", tipo: "entidad" },
  "ent-defensa": { nombre: "Defensa Civil Corrientes", tipo: "entidad" },
};

const usdc = (n) => Math.round(Number(n) * 1e6);
const huella = (t) => "0x" + crypto.createHash("sha256").update(String(t)).digest("hex");
const b32 = (hex) => Buffer.from(hex.slice(2), "hex");
export const codigoDonante = (cuentaId) => huella(`donante:${cuentaId}`);

function claves() {
  if (process.env.NUCLEO_CLAVES) return JSON.parse(process.env.NUCLEO_CLAVES);
  return leerJson(new URL("../contratos/.claves.json", import.meta.url)) ?? {};
}

function cuentaDeRol(rol) {
  if (!ROLES[rol]) throw Object.assign(new Error("Rol desconocido."), { status: 400 });
  const c = claves()[rol];
  if (!c) throw Object.assign(new Error("Falta la clave de prueba de ese rol en el servidor."), { status: 503 });
  return c;
}

function motivo(hex) {
  const h = (hex ?? "").replace(/^0x/, "");
  if (!h.startsWith("08c379a0")) return null;
  const largo = parseInt(h.slice(72, 136), 16);
  return Buffer.from(h.slice(136, 136 + largo * 2), "hex").toString("utf8");
}

/** Solo se opera sobre contratos que desplegó nuestro operador (si no, alguien podría hacernos firmar en un contrato trucho). */
export async function esColectaNuestra(contratoId) {
  const { id: operador } = clienteOperador();
  const j = await (await fetch(`${MIRROR}/contracts/${contratoId}/results?order=asc&limit=1`)).json();
  const creacion = j.results?.[0];
  if (!creacion) return false;
  const op = await (await fetch(`${MIRROR}/accounts/${operador}`)).json();
  return [op.evm_address, evmDeId(operador.toString())].map((x) => x?.toLowerCase()).includes(creacion.from?.toLowerCase());
}

async function ejecutar(contratoId, cuenta, funcion, parametros) {
  const client = Client.forTestnet().setOperator(cuenta.id, leerClave(cuenta.clave));
  try {
    const tx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contratoId))
      .setGas(2_000_000)
      .setFunction(funcion, parametros ?? new ContractFunctionParameters())
      .execute(client);
    const rec = await new TransactionRecordQuery().setTransactionId(tx.transactionId).setValidateReceiptStatus(false).execute(client);
    const ok = rec.receipt.status.toString() === "SUCCESS";
    const id = idTx(tx.transactionId);
    return { ok, tx: id, hashscan: hashscan("transaction", id), motivo: ok ? null : motivo(rec.contractFunctionResult?.errorMessage) ?? rec.receipt.status.toString() };
  } finally {
    client.close();
  }
}

const num = (v, nombre) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw Object.assign(new Error(`Falta ${nombre} o no es un número válido.`), { status: 400 });
  return n;
};
const texto = (v, nombre) => {
  const t = String(v ?? "").trim();
  if (!t) throw Object.assign(new Error(`Falta ${nombre}.`), { status: 400 });
  return t.slice(0, 300);
};

/** Qué puede hacer cada tipo de rol y cómo se arman los parámetros. */
const ACCIONES = {
  donar: { tipo: "donante", armar: (b, c) => new ContractFunctionParameters().addBytes32(b32(codigoDonante(c.id))).addUint256(usdc(num(b.monto, "el monto"))) },
  denunciar: { tipo: "donante", armar: (b) => new ContractFunctionParameters().addUint256(num(b.id, "el comprobante")).addBytes32(b32(huella(texto(b.motivo, "el motivo")))) },
  pedirTramo: { tipo: "organizador", armar: (b) => new ContractFunctionParameters().addUint256(usdc(num(b.monto, "el monto"))) },
  cargarComprobante: {
    tipo: "organizador",
    // La imagen queda fuera de la red: acá va la huella de la descripción + un número único (en producción, la del archivo).
    armar: (b) => new ContractFunctionParameters().addUint256(num(b.item, "el ítem")).addUint256(usdc(num(b.monto, "el monto"))).addBytes32(b32(huella(`${texto(b.descripcion, "la descripción")}|${Date.now()}`))).addBool(Boolean(b.conCAE)),
  },
  pedirReasignacion: { tipo: "organizador", armar: (b) => new ContractFunctionParameters().addUint256(num(b.de, "el ítem de origen")).addUint256(num(b.a, "el ítem de destino")).addUint256(usdc(num(b.monto, "el monto"))).addBytes32(b32(huella(texto(b.motivo, "el motivo")))) },
  validar: { tipo: "entidad" },
  aprobarTramo: { tipo: "entidad", armar: (b) => new ContractFunctionParameters().addUint256(num(b.id, "el tramo")) },
  aprobarComprobante: { tipo: "entidad", armar: (b) => new ContractFunctionParameters().addUint256(num(b.id, "el comprobante")) },
  rechazarComprobante: { tipo: "entidad", armar: (b) => new ContractFunctionParameters().addUint256(num(b.id, "el comprobante")) },
  aprobarReasignacion: { tipo: "entidad", armar: (b) => new ContractFunctionParameters().addUint256(num(b.id, "la reasignación")) },
  pausar: { tipo: "entidad" },
  reanudar: { tipo: "entidad" },
};
export const NOMBRES_ACCIONES = Object.keys(ACCIONES);

export async function accionDemo({ c, rol, accion, ...datos }) {
  const def = ACCIONES[accion];
  if (!def) throw Object.assign(new Error("Acción desconocida."), { status: 400 });
  if (!/^0\.0\.\d+$/.test(String(c))) throw Object.assign(new Error("El contrato tiene que tener el formato 0.0.x."), { status: 400 });
  const QUIEN = { donante: "un donante", organizador: "el organizador", entidad: "una entidad" };
  if (ROLES[rol]?.tipo !== def.tipo) throw Object.assign(new Error(`Esa acción la hace ${QUIEN[def.tipo]}, no ${ROLES[rol]?.nombre ?? rol}.`), { status: 400 });
  if (!(await esColectaNuestra(c))) throw Object.assign(new Error("Ese contrato no es una colecta de esta plataforma."), { status: 403 });
  const cuenta = cuentaDeRol(rol);
  const parametros = def.armar?.(datos, cuenta);
  if (accion === "donar") {
    // El donante le da permiso al contrato por el monto (allowance) y después dona.
    const { tokenId } = leerJson(ESTADO);
    const token = TokenId.fromString(process.env.USDC_TOKEN_ID ?? tokenId);
    const client = Client.forTestnet().setOperator(cuenta.id, leerClave(cuenta.clave));
    try {
      const permiso = await new AccountAllowanceApproveTransaction().approveTokenAllowance(token, cuenta.id, AccountId.fromString(c), usdc(datos.monto)).execute(client);
      await permiso.getReceipt(client);
    } finally {
      client.close();
    }
  }
  const r = await ejecutar(c, cuenta, accion, parametros);
  // Cuando valida la titular, la colecta se publica y la titular la registra en la Plataforma (lista y créditos).
  if (accion === "validar" && r.ok && (await titularDe(c)).toLowerCase() === cuenta.evm.toLowerCase()) {
    r.registro = await ejecutar(PLATAFORMA_ID, cuenta, "registrarColecta", new ContractFunctionParameters().addAddress(evmDeId(c)));
  }
  return r;
}

async function titularDe(contratoId) {
  const { Interface } = await import("ethers");
  const { COLECTA_ABI } = await import("./nucleo-abi.js");
  const i = new Interface(COLECTA_ABI);
  const r = await fetch(`${MIRROR}/contracts/call`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data: i.encodeFunctionData("titular"), to: evmDeId(contratoId), block: "latest" }) });
  return i.decodeFunctionResult("titular", (await r.json()).result)[0];
}

/** Crea una colecta en contrato (la paga el operador). El organizador es el de la demo; la titular, una entidad argentina aprobada. */
export async function crearColectaDemo({ titulo, items, titular, dias }) {
  const id = texto(titulo, "el nombre").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  if (!Array.isArray(items) || !items.length || items.length > 8) throw Object.assign(new Error("Cargá entre 1 y 8 ítems."), { status: 400 });
  const nombres = items.map((i) => texto(i.nombre, "el nombre del ítem").slice(0, 40));
  const metas = items.map((i) => usdc(num(i.meta, "la meta del ítem")));
  if (metas.some((m) => m <= 0)) throw Object.assign(new Error("Cada ítem necesita un monto mayor que cero."), { status: 400 });
  if (!["ent-caritas", "ent-defensa"].includes(titular)) throw Object.assign(new Error("La titular tiene que ser una entidad argentina: Cáritas Itatí o Defensa Civil."), { status: 400 });
  const d = Math.min(90, Math.max(1, Math.round(num(dias ?? 30, "los días"))));
  const k = claves();
  const { client } = clienteOperador();
  const { tokenId } = leerJson(ESTADO);
  try {
    const tx = await new ContractCreateFlow()
      .setBytecode(COLECTA_BIN)
      .setGas(5_000_000)
      .setConstructorParameters(
        new ContractFunctionParameters()
          .addAddress(evmDeId(PLATAFORMA_ID))
          .addAddress(evmDeId(process.env.USDC_TOKEN_ID ?? tokenId))
          .addAddress(cuentaDeRol("organizador2").evm)
          .addAddress(k[titular].evm)
          .addString(id)
          .addStringArray(nombres)
          .addUint256Array(metas)
          .addUint256(Math.floor(Date.now() / 1000) + d * 86400)
      )
      .execute(client);
    const rec = await tx.getReceipt(client);
    const contrato = rec.contractId.toString();
    return { ok: true, contrato, colectaId: id, hashscan: hashscan("contract", contrato), tx: idTx(tx.transactionId) };
  } finally {
    client.close();
  }
}

/** Colectas registradas en la Plataforma (publicadas por su titular), leídas de sus eventos. */
export async function listarColectasNucleo() {
  const { Interface } = await import("ethers");
  const { PLATAFORMA_ABI } = await import("./nucleo-abi.js");
  const i = new Interface(PLATAFORMA_ABI);
  const j = await (await fetch(`${MIRROR}/contracts/${PLATAFORMA_ID}/results/logs?order=desc&limit=100`)).json();
  const out = [];
  for (const l of j.logs ?? []) {
    try {
      const p = i.parseLog({ topics: l.topics, data: l.data });
      if (p.name === "ColectaRegistrada") out.push({ contrato: `0.0.${parseInt(p.args.colecta.slice(26), 16)}`, timestamp: l.timestamp });
    } catch { /* otro evento */ }
  }
  return out;
}
