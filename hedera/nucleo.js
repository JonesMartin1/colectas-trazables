// Lectura del núcleo (Plataforma + Colecta) sin gastar HBAR: las funciones de lectura se simulan en el
// Mirror Node (POST /contracts/call) y los eventos se leen de /contracts/{id}/results/logs.
import { Interface } from "ethers";
import { COLECTA_ABI, PLATAFORMA_ABI } from "./nucleo-abi.js";

const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";
const iColecta = new Interface(COLECTA_ABI);
const iPlataforma = new Interface(PLATAFORMA_ABI);
const usdc = (x) => Number(x) / 1e6;
export const evmDeId = (id) => "0x" + Number(String(id).split(".").pop()).toString(16).padStart(40, "0");
const idDeEvm = (evm) => (/^0x0{24}/i.test(evm) ? `0.0.${parseInt(evm.slice(26), 16)}` : null);
const textoBytes32 = (b) => Buffer.from(b.slice(2), "hex").toString("utf8").replace(/\0+$/, "");
const ESTADOS = ["pendiente", "aprobado", "rechazado"];

async function llamar(iface, a, fn, args = []) {
  const r = await fetch(`${MIRROR}/contracts/call`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: iface.encodeFunctionData(fn, args), to: a, block: "latest" }),
  });
  const j = await r.json();
  if (!j.result) throw new Error(`No se pudo leer ${fn}: ${j._status?.messages?.[0]?.message ?? r.status}`);
  return iface.decodeFunctionResult(fn, j.result);
}

/** Cuenta de Hedera de una dirección EVM (alias), para mostrar 0.0.x y el link a HashScan. */
async function cuentaDe(evm) {
  const directa = idDeEvm(evm);
  if (directa) return directa;
  try {
    const j = await (await fetch(`${MIRROR}/accounts/${evm}`)).json();
    return j.account ?? null;
  } catch {
    return null;
  }
}

const formatoEvento = (nombre, resultado) => {
  const args = resultado.toObject();
  const o = {};
  for (const [k, v] of Object.entries(args)) {
    if (/^\d+$/.test(k)) continue;
    if (typeof v === "bigint") o[k] = /monto|comision|restante|totalAportado/.test(k) ? usdc(v) : Number(v);
    else o[k] = v;
  }
  return { evento: nombre, ...o };
};

export async function leerColectaNucleo(contratoId) {
  const a = evmDeId(contratoId);
  const c = async (fn, args) => (await llamar(iColecta, a, fn, args))[0];
  const [colectaId, plataforma, titular, organizador, publicada, pausada, liquidada, fraude, cierre, contable, aportado, liberado, justificado, sinFactura, metaTotal, nItems, nValidadoras, nComprobantes, nTramos] =
    await Promise.all(["colectaId", "plataforma", "titular", "organizador", "publicada", "pausada", "liquidada", "fraudeConfirmado", "cierre", "contable", "totalAportado", "liberado", "justificado", "sinFactura", "metaTotal", "cantidadItems", "cantidadValidadoras", "cantidadComprobantes", "cantidadTramos"].map((f) => c(f)));

  const rango = (n) => Array.from({ length: Number(n) }, (_, i) => i);
  const entidad = async (evm) => {
    const [e, cuenta] = await Promise.all([llamar(iPlataforma, plataforma, "entidades", [evm]), cuentaDe(evm)]);
    return { evm, cuenta, nombre: e.nombre, pais: textoBytes32(e.pais), activa: e.activa };
  };

  const [items, validadorasEvm, comprobantes, tramos, titularInfo, organizadorCuenta, logs] = await Promise.all([
    Promise.all(rango(nItems).map(async (i) => {
      const [nombre, meta, metaOriginal, gastado] = await Promise.all([c("nombres", [i]), c("metas", [i]), c("metasOriginales", [i]), c("gastado", [i])]);
      return { nombre, meta: usdc(meta), metaOriginal: usdc(metaOriginal), gastado: usdc(gastado) };
    })),
    Promise.all(rango(nValidadoras).map((i) => c("validadoras", [i]))),
    Promise.all(rango(nComprobantes).map(async (i) => {
      const r = await llamar(iColecta, a, "comprobantes", [i]);
      return { id: i, item: Number(r.item), monto: usdc(r.monto), huella: r.huella, conCAE: r.conCAE, estado: ESTADOS[Number(r.estado)], denuncias: Number(r.denuncias) };
    })),
    Promise.all(rango(nTramos).map(async (i) => {
      const r = await llamar(iColecta, a, "tramos", [i]);
      return { id: i, monto: usdc(r.monto), aprobado: r.aprobado };
    })),
    entidad(titular),
    cuentaDe(organizador),
    fetch(`${MIRROR}/contracts/${contratoId}/results/logs?order=asc&limit=100`).then((r) => r.json()),
  ]);
  const validadoras = await Promise.all(validadorasEvm.map(async (evm) => ({ ...(await entidad(evm)), esTitular: evm.toLowerCase() === titular.toLowerCase() })));

  const eventos = (logs.logs ?? [])
    .map((l) => {
      try {
        const p = iColecta.parseLog({ topics: l.topics, data: l.data });
        return { ...formatoEvento(p.name, p.args), timestamp: l.timestamp, hashscan: `https://hashscan.io/testnet/transaction/${l.timestamp}` };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const tope = (Number(metaTotal) * 3000) / 10000;
  return {
    contrato: contratoId,
    hashscan: `https://hashscan.io/testnet/contract/${contratoId}`,
    plataforma: idDeEvm(plataforma),
    colectaId,
    estado: { publicada, pausada, liquidada, fraude },
    cierre: new Date(Number(cierre) * 1000).toISOString(),
    titular: titularInfo,
    organizador: { evm: organizador, cuenta: organizadorCuenta },
    validadoras,
    items,
    totales: {
      aportado: usdc(aportado),
      enContrato: usdc(contable),
      liberado: usdc(liberado),
      justificado: usdc(justificado),
      sinRendir: usdc(liberado - justificado),
      topeSinRendir: usdc(tope),
      sinFactura: usdc(sinFactura),
      meta: usdc(metaTotal),
    },
    comprobantes,
    tramos,
    eventos,
  };
}
