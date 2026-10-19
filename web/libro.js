// Libro de la colecta (colecta.html): la trazabilidad completa, leída del registro en Hedera.
// Últimos gastos con su factura, gráfico de saldo en el tiempo y el libro de todos los movimientos con saldo
// acumulado, filtros, detalle con hashes y link a HashScan, y descarga en CSV. Aparte de app.js (Facundo).
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id") || "inundados-paso-de-los-libres";
  const actividad = document.querySelector(".activity");
  if (!actividad) return;

  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const corto = (v) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M` : Math.abs(v) >= 1e3 ? `$${Math.round(v / 1e3)} mil` : `$${Math.round(v)}`);
  const fecha = (v) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(v));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const hs = (u) => { try { const x = new URL(u); return x.hostname === "hashscan.io" ? x.href : null; } catch { return null; } };
  const hashCorto = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : "—");
  async function sha256File(f) {
    const d = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const TIPOS = {
    donacion: { nombre: "Donación", clase: "t-don", signo: 1 },
    gasto: { nombre: "Gasto", clase: "t-gas", signo: -1 },
    entrega: { nombre: "Entrega", clase: "t-ent", signo: 0 },
    conversion: { nombre: "Cambio de moneda", clase: "t-con", signo: 0 },
  };

  const sec = document.createElement("section");
  sec.className = "libro section-wrap";
  sec.id = "libro";
  sec.innerHTML = `
    <div class="libro-head reveal"><div><span class="section-kicker">LIBRO DE LA COLECTA · REGISTRO PÚBLICO</span>
      <h2>Cada peso: de dónde vino <em>y a dónde fue.</em></h2></div>
      <div class="libro-acciones"><button type="button" class="quiet-button" id="libro-csv">Descargar CSV ↓</button></div></div>
    <p class="libro-sub">ÚLTIMOS GASTOS</p><div class="ultimos" id="ultimos-gastos"><div class="nea-esqueleto claro"></div></div>
    <article class="chart-card fx-card reveal libro-grafico"><h3>Saldo en el tiempo</h3><p class="chart-sub">RECAUDADO, GASTADO Y SALDO, MOVIMIENTO POR MOVIMIENTO</p><div id="libro-linea"></div></article>
    <div class="libro-filtros" role="group" aria-label="Filtrar el libro"></div>
    <div class="libro-tabla" role="table" aria-label="Libro de movimientos"><div class="libro-fila cab" role="row"><span>#</span><span>Fecha</span><span>Movimiento</span><span>Detalle</span><span class="der">Monto</span><span class="der">Saldo</span><span></span></div><div id="libro-filas"></div></div>`;
  actividad.after(sec);
  actividad.classList.add("oculto"); // el libro reemplaza a los paneles de movimientos

  let movs = [];
  const datos = (window.datosColecta ??= fetch(`/api/colectas/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => fetch("/ejemplo/colecta.json").then((r) => r.json())));
  datos.then((d) => {
    movs = [
      ...(d.donaciones || []).map((x) => ({ tipo: "donacion", ...x, detalle: `${x.metodo === "mercadopago" ? "Mercado Pago" : x.metodo === "usdc" ? "Dólares digitales" : x.metodo || "Donación"}${x.verificada ? " · pago verificado" : ""}`, hash: x.externalRefHash })),
      ...(d.gastos || []).map((x) => ({ tipo: "gasto", ...x, detalle: `Proveedor CUIT ${x.proveedorCuit || "—"} · CAE ${x.cae || "—"}`, hash: x.invoiceHash })),
      ...(d.entregas || []).map((x) => ({ tipo: "entrega", ...x, monto: 0, detalle: `${x.cantidad} × ${x.item} · ${x.lugar}`, hash: x.fotoHash })),
      ...(d.conversiones || []).map((x) => ({ tipo: "conversion", ...x, monto: x.ars, detalle: `${x.usdc} dólares digitales a $${x.tipoDeCambio} por dólar` })),
    ].sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0) || new Date(a.fecha) - new Date(b.fecha));
    let saldo = 0;
    for (const m of movs) { saldo += TIPOS[m.tipo].signo * (Number(m.monto) || 0); m.saldo = saldo; }
    ultimos();
    linea();
    filtros();
    pintar("todo");
    document.dispatchEvent(new Event("fx:nuevo"));
    if (location.hash === "#libro") sec.scrollIntoView({ behavior: "smooth" }); // llegó desde "Ver trazabilidad"
  }).catch(() => { sec.querySelector("#libro-filas").innerHTML = '<p class="chart-vacio">No se pudo leer el libro.</p>'; });

  function verificador(hash, acepta) {
    const lab = document.createElement("label");
    lab.className = "invoice-check";
    lab.textContent = acepta.startsWith("image") ? "Comprobá la foto: " : "Verificá la factura: ";
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = acepta;
    const res = document.createElement("span"); res.className = "invoice-result";
    inp.addEventListener("change", async () => { if (inp.files[0]) res.textContent = (await sha256File(inp.files[0])) === hash ? "Coincide con el registro ✓" : "No coincide ✗"; });
    lab.append(inp, res);
    return lab;
  }

  function ultimos() {
    const caja = sec.querySelector("#ultimos-gastos");
    const gastos = movs.filter((m) => m.tipo === "gasto").slice(-3).reverse();
    if (!gastos.length) { caja.innerHTML = '<p class="chart-vacio">Todavía no hay gastos registrados.</p>'; return; }
    caja.innerHTML = "";
    for (const g of gastos) {
      const c = document.createElement("article");
      c.className = "gasto-card fx-card reveal";
      const link = hs(g.hashscan);
      c.innerHTML = `<header><span class="t-chip t-gas">GASTO #${esc(g.secuencia)}</span><small>${esc(fecha(g.fecha))}</small></header>
        <strong>${esc(pesos(g.monto))}</strong>
        <dl><dt>Proveedor (CUIT)</dt><dd>${esc(g.proveedorCuit || "—")}</dd><dt>CAE de la factura</dt><dd>${esc(g.cae || "—")}</dd><dt>Huella del PDF</dt><dd title="${esc(g.invoiceHash)}">${esc(hashCorto(g.invoiceHash))}</dd></dl>
        ${link ? `<a class="sello-hedera" href="${link}" target="_blank" rel="noopener noreferrer">✓ Ver en HashScan ↗</a>` : ""}`;
      if (/^[a-f0-9]{64}$/.test(g.invoiceHash || "")) c.append(verificador(g.invoiceHash, "application/pdf,.pdf"));
      caja.append(c);
    }
  }

  function linea() {
    const caja = sec.querySelector("#libro-linea");
    const plata = movs.filter((m) => m.tipo === "donacion" || m.tipo === "gasto");
    if (!plata.length) { caja.innerHTML = '<p class="chart-vacio">Todavía no hay movimientos de plata.</p>'; return; }
    let r = 0, g = 0;
    const pts = [{ r: 0, g: 0 }, ...plata.map((m) => (m.tipo === "donacion" ? (r += Number(m.monto) || 0) : (g += Number(m.monto) || 0), { r, g }))];
    const W = 900, H = 230, P = 40, max = Math.max(r, g, 1);
    const x = (i) => P + (i / (pts.length - 1)) * (W - P * 2);
    const y = (v) => H - 26 - (v / max) * (H - 56);
    const path = (f) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(f(p)).toFixed(1)}`).join(" ");
    const area = (f) => `${path(f)} L${x(pts.length - 1)} ${H - 26} L${x(0)} ${H - 26} Z`;
    caja.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="libro-svg" role="img" aria-label="Recaudado ${pesos(r)}, gastado ${pesos(g)}, saldo ${pesos(r - g)}">
      <defs><linearGradient id="lr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd14b" stop-opacity=".4"/><stop offset="1" stop-color="#9fd14b" stop-opacity="0"/></linearGradient></defs>
      ${[0, 0.5, 1].map((t) => `<line x1="${P}" x2="${W - P}" y1="${y(max * t)}" y2="${y(max * t)}" stroke="#dfe5da" stroke-dasharray="4 6"/><text x="${P - 6}" y="${y(max * t) + 4}" text-anchor="end" class="eje">${corto(max * t)}</text>`).join("")}
      <path d="${area((p) => p.r)}" fill="url(#lr)"/>
      <path class="trazo" d="${path((p) => p.r)}" stroke="#6fae2c"/><path class="trazo" d="${path((p) => p.g)}" stroke="#e0703f"/><path class="trazo" d="${path((p) => p.r - p.g)}" stroke="#2775ca" stroke-dasharray="6 5"/>
    </svg>
    <div class="leyenda tres"><div><i style="background:var(--f-6fae2c)"></i>Recaudado<b>${pesos(r)}</b></div><div><i style="background:var(--f-e0703f)"></i>Gastado<b>${pesos(g)}</b></div><div><i style="background:var(--f-2775ca)"></i>Saldo<b>${pesos(r - g)}</b></div></div>`;
  }

  function filtros() {
    const caja = sec.querySelector(".libro-filtros");
    const cuenta = (t) => movs.filter((m) => t === "todo" || m.tipo === t).length;
    const opciones = [["todo", "Todo"], ["donacion", "Donaciones"], ["gasto", "Gastos"], ["entrega", "Entregas"], ["conversion", "Cambios de moneda"]].filter(([t]) => t === "todo" || cuenta(t));
    caja.innerHTML = opciones.map(([t, n]) => `<button type="button" data-t="${t}" aria-pressed="${t === "todo"}">${n} <b>${cuenta(t)}</b></button>`).join("");
    caja.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      caja.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      pintar(b.dataset.t);
    });
  }

  function pintar(t) {
    const filas = sec.querySelector("#libro-filas");
    const lista = movs.filter((m) => t === "todo" || m.tipo === t).slice().reverse(); // lo más nuevo arriba
    if (!lista.length) { filas.innerHTML = '<p class="chart-vacio">No hay movimientos.</p>'; return; }
    filas.innerHTML = "";
    for (const m of lista) {
      const T = TIPOS[m.tipo];
      const fila = document.createElement("details");
      fila.className = "libro-item";
      const monto = T.signo === 0 ? (m.tipo === "conversion" ? pesos(m.monto) : "—") : `${T.signo > 0 ? "+" : "−"} ${pesos(m.monto)}`;
      const link = hs(m.hashscan);
      fila.innerHTML = `<summary class="libro-fila" role="row"><span class="mono">#${esc(m.secuencia)}</span><span>${esc(fecha(m.fecha))}</span><span><span class="t-chip ${T.clase}">${T.nombre}</span></span><span class="det">${esc(m.detalle)}</span><span class="der ${T.signo > 0 ? "pos" : T.signo < 0 ? "neg" : ""}">${monto}</span><span class="der mono">${esc(pesos(m.saldo))}</span><span class="der">${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" title="Ver en HashScan">Verificar ↗</a>` : ""}</span></summary>
        <div class="libro-detalle"><dl>
          <dt>Registro público</dt><dd class="mono">N.º ${esc(m.secuencia)} de esta colecta</dd>
          ${m.hash ? `<dt>${m.tipo === "gasto" ? "Huella SHA-256 de la factura" : m.tipo === "entrega" ? "Huella SHA-256 de la foto" : "Huella del comprobante"}</dt><dd class="mono">${esc(m.hash)}</dd>` : ""}
          ${m.tipo === "gasto" ? `<dt>CAE (verificable en ARCA)</dt><dd class="mono">${esc(m.cae)}</dd>` : ""}
          <dt>Fecha de consenso</dt><dd>${esc(fecha(m.fecha))}</dd></dl></div>`;
      if (m.tipo === "gasto" && /^[a-f0-9]{64}$/.test(m.hash || "")) fila.querySelector(".libro-detalle").append(verificador(m.hash, "application/pdf,.pdf"));
      if (m.tipo === "entrega" && /^[a-f0-9]{64}$/.test(m.hash || "")) fila.querySelector(".libro-detalle").append(verificador(m.hash, "image/*"));
      filas.append(fila);
    }
  }

  sec.querySelector("#libro-csv").addEventListener("click", () => {
    const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [["secuencia", "fecha", "movimiento", "detalle", "monto_ars", "saldo_ars", "huella", "hashscan"].join(","),
      ...movs.map((m) => [m.secuencia, m.fecha, TIPOS[m.tipo].nombre, m.detalle, TIPOS[m.tipo].signo * (Number(m.monto) || 0), m.saldo, m.hash || "", m.hashscan || ""].map(celda).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `libro-${id}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
