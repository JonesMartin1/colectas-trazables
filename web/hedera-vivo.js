// "Hedera en vivo" (hedera.html): lee el Mirror Node público de testnet directo desde el navegador, sin pasar
// por nuestra API, para que cualquiera vea que los datos son de la red: último bloque, mensajes en cada topic,
// el token, el contrato y las transacciones de la plataforma, que se actualizan solas.
(function () {
  if (document.body.dataset.page !== "hedera") return;
  const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";
  const PLATAFORMA = "0.0.10989169";
  const COMPONENTES = [
    { servicio: "HCS", nombre: "Registro de colectas", id: "0.0.11051457", tipo: "topic", que: "Alta de cada colecta (CAMPAIGN) con su organización y la huella de la clave del organizador." },
    { servicio: "HCS", nombre: "Propuestas sin aval", id: "0.0.11058740", tipo: "topic", que: "Ideas que postula la comunidad (PROPOSAL), sin datos personales." },
    { servicio: "HCS", nombre: "Alias oficiales · firma 2 de 4", id: "0.0.11052767", tipo: "topic", que: "Solo se publica un alias si lo firman 2 de 4 instituciones (KeyList con umbral)." },
    { servicio: "HCS", nombre: "Avisos oficiales", id: "0.0.11053502", tipo: "topic", que: "Partes que solo puede firmar Defensa Civil; si una cifra cambia, queda el rastro." },
    { servicio: "HTS", nombre: "USDCd (USDC de prueba)", id: "0.0.11041203", tipo: "token", que: "Donaciones en cripto, directo a la cuenta de la organización." },
    { servicio: "HSCS", nombre: "Fideicomiso de la colecta", id: "0.0.11057590", tipo: "contract", que: "Guarda el USDC y solo paga a proveedores aprobados, con la huella de la factura y 2 de 3 firmas." },
    { servicio: "Cuenta", nombre: "Plataforma", id: PLATAFORMA, tipo: "account", que: "Paga las comisiones y firma los registros. Nunca recibe la plata de las donaciones." },
  ];
  const TIPOS_TX = { CONSENSUSSUBMITMESSAGE: ["Mensaje HCS", "registro"], CRYPTOTRANSFER: ["Transferencia", "plata"], TOKENASSOCIATE: ["Asociar token", "token"], CONSENSUSCREATETOPIC: ["Topic nuevo", "registro"], CONTRACTCALL: ["Llamada a contrato", "contrato"], CONTRACTCREATEINSTANCE: ["Contrato nuevo", "contrato"], CRYPTOCREATEACCOUNT: ["Cuenta nueva", "token"], TOKENCREATION: ["Token nuevo", "token"], TOKENMINT: ["Emisión de token", "token"] };

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const json = (ruta) => fetch(ruta.startsWith("http") ? ruta : MIRROR + ruta).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
  const hace = (seg) => { const s = Math.max(0, Math.round(Date.now() / 1000 - seg)); return s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : `hace ${Math.round(s / 3600)} h`; };
  const hbar = (tiny) => `${(Number(tiny) / 1e8).toLocaleString("es-AR", { maximumFractionDigits: 4 })} ℏ`;
  const nombres = new Map(COMPONENTES.filter((c) => c.tipo === "topic").map((c) => [c.id, c.nombre]));

  // nodos de la topología: click → HashScan
  document.querySelectorAll("#topologia .nodo[data-href]").forEach((n) => {
    n.style.cursor = "pointer";
    n.addEventListener("click", () => { const h = n.dataset.href; h.startsWith("#") ? $(h).scrollIntoView({ behavior: "smooth" }) : window.open(h, "_blank", "noopener"); });
  });

  // estado de la red: último bloque
  async function red() {
    try {
      const b = (await json("/blocks?limit=1&order=desc")).blocks[0];
      $("#red-bloque").textContent = `Bloque #${b.number.toLocaleString("es-AR")} · ${b.count} transacciones`;
      $("#red-hace").textContent = `${hace(Number(b.timestamp.to))} · testnet en línea`;
      $("#estado-red").classList.add("ok");
    } catch { $("#red-bloque").textContent = "Sin conexión con el Mirror Node"; $("#estado-red").classList.remove("ok"); }
  }

  // componentes con su dato en vivo
  async function componentes() {
    const caja = $("#componentes");
    caja.innerHTML = COMPONENTES.map((c) => `<article class="componente fx-card" data-id="${c.id}"><header><span class="srv srv-${c.servicio.toLowerCase()}">${c.servicio}</span><a class="mono" href="https://hashscan.io/testnet/${c.tipo}/${c.id}" target="_blank" rel="noopener noreferrer">${c.id} ↗</a></header><h3>${esc(c.nombre)}</h3><p>${esc(c.que)}</p><b class="vivo">…</b></article>`).join("");
    document.dispatchEvent(new Event("fx:nuevo"));
    let mensajes = 0;
    await Promise.all(COMPONENTES.map(async (c) => {
      const b = caja.querySelector(`[data-id="${c.id}"] .vivo`);
      try {
        if (c.tipo === "topic") { const m = (await json(`/topics/${c.id}/messages?limit=1&order=desc`)).messages[0]; const n = m?.sequence_number || 0; mensajes += n; b.textContent = `${n} mensajes · último ${m ? hace(Number(m.consensus_timestamp)) : "—"}`; }
        if (c.tipo === "token") { const t = await json(`/tokens/${c.id}`); b.textContent = `${(Number(t.total_supply) / 10 ** t.decimals).toLocaleString("es-AR")} ${t.symbol} emitidos`; }
        if (c.tipo === "contract") { const k = await json(`/contracts/${c.id}`); b.textContent = `Desplegado ${k.created_timestamp ? hace(Number(k.created_timestamp)) : ""} · sin clave de administrador`; }
        if (c.tipo === "account") { const a = await json(`/accounts/${c.id}?transactions=false`); b.textContent = `Saldo: ${hbar(a.balance.balance)} para comisiones`; }
      } catch { b.textContent = "sin datos"; }
    }));
    // mensajes de los topics de cada colecta
    try {
      const colectas = await fetch("/api/colectas").then((r) => r.json());
      $("#k-colectas").textContent = colectas.length;
      colectas.forEach((c) => nombres.set(c.topicId, `Colecta: ${c.titulo}`));
      const nums = await Promise.all(colectas.map((c) => json(`/topics/${c.topicId}/messages?limit=1&order=desc`).then((d) => d.messages[0]?.sequence_number || 0).catch(() => 0)));
      mensajes += nums.reduce((s, n) => s + n, 0);
    } catch { $("#k-colectas").textContent = "—"; }
    $("#k-mensajes").textContent = mensajes.toLocaleString("es-AR");
  }

  // feed de transacciones de la plataforma
  const vistos = new Set();
  async function feed() {
    try {
      const txs = (await json(`/transactions?account.id=${PLATAFORMA}&limit=18&order=desc`)).transactions;
      const caja = $("#feed-lista");
      const primera = !vistos.size;
      const filas = txs.map((t) => {
        const [tipo, clase] = TIPOS_TX[t.name] || [t.name.toLowerCase(), "token"];
        const entidad = t.entity_id ? (nombres.get(t.entity_id) || t.entity_id) : (t.token_transfers?.length ? "USDCd entre cuentas" : "HBAR");
        const nueva = !primera && !vistos.has(t.consensus_timestamp);
        vistos.add(t.consensus_timestamp);
        return `<a class="tx${nueva ? " nueva" : ""}" href="https://hashscan.io/testnet/transaction/${t.consensus_timestamp}" target="_blank" rel="noopener noreferrer">
          <span class="tx-hora">${hace(Number(t.consensus_timestamp))}</span><span class="tx-tipo tx-${clase}">${tipo}</span>
          <span class="tx-ent">${esc(entidad)}</span><span class="tx-res ${t.result === "SUCCESS" ? "ok" : "mal"}">${t.result === "SUCCESS" ? "✓ consenso" : esc(t.result)}</span>
          <span class="tx-fee mono">${hbar(t.charged_tx_fee)}</span><span class="tx-link">HashScan ↗</span></a>`;
      });
      caja.innerHTML = filas.join("");
      const msgs = txs.filter((t) => t.name === "CONSENSUSSUBMITMESSAGE" && t.charged_tx_fee > 0);
      if (msgs.length) $("#k-costo").textContent = hbar(msgs.reduce((s, t) => s + Number(t.charged_tx_fee), 0) / msgs.length);
    } catch { $("#feed-lista").innerHTML = '<p class="chart-vacio">No se pudo leer el Mirror Node.</p>'; }
  }

  red(); componentes(); feed();
  setInterval(red, 5000);
  setInterval(() => { if (!document.hidden) feed(); }, 6000);
})();
