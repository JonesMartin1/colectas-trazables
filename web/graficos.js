// Gráficos de la colecta (colecta.html): uso de lo recaudado, medios de pago, evolución en el tiempo y gastos por proveedor.
// Sin librerías: SVG y CSS. Lee la misma API que la página (o el ejemplo, si no hay API). Aparte de app.js (Facundo).
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id") || "inundados-paso-de-los-libres";
  const ledger = document.querySelector(".ledger-area");
  if (!ledger) return;

  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const corto = (v) => (v >= 1e6 ? `$${(v / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M` : v >= 1e3 ? `$${Math.round(v / 1e3)} mil` : `$${Math.round(v)}`);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const NOMBRES = { mercadopago: "Mercado Pago", usdc: "USDC (Hedera)", cripto: "Cripto" };
  const COLORES = { mercadopago: "#009ee3", usdc: "#2775ca" };

  const seccion = el("section", "charts-area section-wrap", `
    <div class="charts-head reveal"><span class="section-kicker">02 / EN GRÁFICOS</span>
      <h2>Mirá a dónde va <em>cada peso.</em></h2>
      <p>Cada número sale del registro en Hedera: nadie lo puede editar, ni el organizador ni nosotros.</p></div>
    <div class="charts-grid">
      <article class="chart-card fx-card reveal" id="g-uso"><h3>Uso de lo recaudado</h3><p class="chart-sub">GASTADO VS. SALDO DISPONIBLE</p></article>
      <article class="chart-card ancho fx-card reveal linea" id="g-tiempo"><h3>Recaudado y gastado en el tiempo</h3><p class="chart-sub">ACUMULADO, MOVIMIENTO POR MOVIMIENTO</p></article>
      <article class="chart-card fx-card reveal" id="g-medios"><h3>Cómo se donó</h3><p class="chart-sub">POR MEDIO DE PAGO</p></article>
      <article class="chart-card ancho fx-card reveal" id="g-gastos"><h3>En qué se gastó</h3><p class="chart-sub">POR PROVEEDOR (CUIT) Y ENTREGAS REGISTRADAS</p></article>
    </div>`);
  seccion.id = "graficos";
  ledger.after(seccion);

  const cuando = (nodo, fn) => {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: 0.25 });
    io.observe(nodo);
  };

  function dona(d) {
    const card = seccion.querySelector("#g-uso");
    const { recaudado = 0, gastado = 0, saldo = 0 } = d.totales || {};
    const pct = recaudado > 0 ? Math.min(100, (gastado / recaudado) * 100) : 0;
    const dn = el("div", "donut", `<div class="donut-centro"><strong>0%</strong><span>USADO</span></div>`);
    card.append(dn, el("div", "leyenda", `
      <div><i style="background:var(--coral)"></i>Gastado<b>${pesos(gastado)}</b></div>
      <div><i style="background:var(--glow)"></i>Saldo<b>${pesos(saldo)}</b></div>
      <div><i style="background:#cfd8cb"></i>Recaudado<b>${pesos(recaudado)}</b></div>`));
    cuando(card, () => animar(1400, (t) => {
      dn.style.setProperty("--g", (pct * t).toFixed(2));
      dn.querySelector("strong").textContent = `${Math.round(pct * t)}%`;
    }));
  }

  function medios(d) {
    const card = seccion.querySelector("#g-medios");
    const grupos = {};
    for (const x of d.donaciones || []) {
      const k = x.metodo || "otro";
      grupos[k] ??= { total: 0, n: 0 };
      grupos[k].total += Number(x.monto) || 0;
      grupos[k].n++;
    }
    if (!grupos.mercadopago) grupos.mercadopago = { total: 0, n: 0 };
    const total = Object.values(grupos).reduce((s, g) => s + g.total, 0) || 1;
    const barras = el("div", "barras");
    for (const [k, g] of Object.entries(grupos).sort((a, b) => b[1].total - a[1].total)) {
      const fila = el("div", "barra-fila", `<header><span>${NOMBRES[k] || k} · ${g.n} ${g.n === 1 ? "donación" : "donaciones"}</span><b>${pesos(g.total)}</b></header><div class="barra-pista"><span style="background:${COLORES[k] || "#8fb02e"}"></span></div>`);
      barras.append(fila);
      cuando(card, () => setTimeout(() => (fila.querySelector(".barra-pista span").style.width = g.total > 0 ? `${Math.max(2, (g.total / total) * 100)}%` : "0"), 150));
    }
    const n = (d.donaciones || []).length;
    const verificadas = (d.donaciones || []).filter((x) => x.verificada).length;
    card.append(barras, el("div", "kpis", `<div><strong>${n}</strong><span>DONACIONES</span></div><div><strong>${verificadas}</strong><span>VERIFICADAS</span></div><div><strong>${n ? corto((d.totales?.recaudado || 0) / n) : "$0"}</strong><span>PROMEDIO</span></div>`));
  }

  function tiempo(d) {
    const card = seccion.querySelector("#g-tiempo");
    const movs = [
      ...(d.donaciones || []).map((x) => ({ f: +new Date(x.fecha), r: Number(x.monto) || 0, g: 0 })),
      ...(d.gastos || []).map((x) => ({ f: +new Date(x.fecha), r: 0, g: Number(x.monto) || 0 })),
    ].filter((m) => !isNaN(m.f)).sort((a, b) => a.f - b.f);
    if (!movs.length) return card.append(el("p", "chart-vacio", "Todavía no hay movimientos para graficar."));
    let r = 0, g = 0;
    const pts = [{ i: 0, r: 0, g: 0 }, ...movs.map((m, i) => ({ i: i + 1, r: (r += m.r), g: (g += m.g) }))];
    const W = 640, H = 210, P = 30, max = Math.max(r, g, 1);
    const x = (i) => P + (i / (pts.length - 1)) * (W - P * 2);
    const y = (v) => H - P - (v / max) * (H - P * 2);
    const linea = (k) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.i).toFixed(1)} ${y(p[k]).toFixed(1)}`).join(" ");
    const area = (k) => `${linea(k)} L${x(pts.length - 1)} ${H - P} L${x(0)} ${H - P} Z`;
    const ultimo = pts[pts.length - 1];
    card.insertAdjacentHTML("beforeend", `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Recaudado acumulado ${pesos(r)} y gastado acumulado ${pesos(g)}">
        <defs><linearGradient id="gr-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd14b" stop-opacity=".45"/><stop offset="1" stop-color="#9fd14b" stop-opacity="0"/></linearGradient>
        <linearGradient id="gr-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f08a5d" stop-opacity=".35"/><stop offset="1" stop-color="#f08a5d" stop-opacity="0"/></linearGradient></defs>
        ${[0, 0.5, 1].map((t) => `<line x1="${P}" x2="${W - P}" y1="${y(max * t)}" y2="${y(max * t)}" stroke="#dfe5da" stroke-dasharray="4 6"/><text class="eje" x="${P - 6}" y="${y(max * t) + 3}" text-anchor="end">${corto(max * t)}</text>`).join("")}
        <path class="area" d="${area("r")}" fill="url(#gr-r)"/><path class="area" d="${area("g")}" fill="url(#gr-g)"/>
        <path class="trazo" d="${linea("r")}" stroke="#6fae2c"/><path class="trazo" d="${linea("g")}" stroke="#e0703f"/>
        <circle class="punto" cx="${x(ultimo.i)}" cy="${y(ultimo.r)}" r="6" fill="#d8f16a" stroke="#6fae2c" stroke-width="3"/>
        <circle class="punto" cx="${x(ultimo.i)}" cy="${y(ultimo.g)}" r="6" fill="#fff" stroke="#e0703f" stroke-width="3"/>
      </svg>
      <div class="leyenda" style="grid-template-columns:1fr 1fr"><div><i style="background:#6fae2c"></i>Recaudado<b>${pesos(r)}</b></div><div><i style="background:#e0703f"></i>Gastado<b>${pesos(g)}</b></div></div>`);
    card.querySelectorAll(".trazo").forEach((p) => p.style.setProperty("--len", Math.ceil(p.getTotalLength())));
    cuando(card, () => requestAnimationFrame(() => card.classList.add("visible")));
  }

  function gastos(d) {
    const card = seccion.querySelector("#g-gastos");
    const grupos = {};
    for (const x of d.gastos || []) {
      const k = x.proveedorCuit || "Sin CUIT";
      grupos[k] ??= { total: 0, n: 0 };
      grupos[k].total += Number(x.monto) || 0;
      grupos[k].n++;
    }
    const lista = Object.entries(grupos).sort((a, b) => b[1].total - a[1].total);
    if (!lista.length) card.append(el("p", "chart-vacio", "Todavía no hay gastos registrados."));
    const max = lista[0]?.[1].total || 1;
    const barras = el("div", "barras");
    for (const [cuit, g] of lista) {
      const fila = el("div", "barra-fila", `<header><span>Proveedor CUIT ${cuit} · ${g.n} ${g.n === 1 ? "factura" : "facturas"}</span><b>${pesos(g.total)}</b></header><div class="barra-pista"><span style="background:linear-gradient(90deg,#f0a35d,#e0703f)"></span></div>`);
      barras.append(fila);
      cuando(card, () => setTimeout(() => (fila.querySelector(".barra-pista span").style.width = `${Math.max(3, (g.total / max) * 100)}%`), 200));
    }
    const ent = d.entregas || [];
    const unidades = ent.reduce((s, e) => s + (Number(e.cantidad) || 0), 0);
    card.append(barras, el("div", "kpis", `<div><strong>${(d.gastos || []).length}</strong><span>FACTURAS</span></div><div><strong>${ent.length}</strong><span>ENTREGAS</span></div><div><strong>${unidades}</strong><span>UNIDADES ENTREGADAS</span></div>`));
  }

  function animar(ms, paso) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return paso(1);
    const t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / ms); paso(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  fetch(`/api/colectas/${encodeURIComponent(id)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .catch(() => fetch("/ejemplo/colecta.json").then((r) => r.json()))
    .then((d) => { dona(d); tiempo(d); medios(d); gastos(d); document.dispatchEvent(new Event("fx:nuevo")); })
    .catch(() => seccion.querySelector(".charts-grid").replaceWith(el("p", "chart-vacio", "No se pudieron cargar los gráficos.")));
})();
