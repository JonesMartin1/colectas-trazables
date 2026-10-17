// Gráficos de la colecta (colecta.html), en dos cards: uso de lo recaudado y cómo se donó.
// Sin librerías: SVG y CSS. Lee la misma API que la página (o el ejemplo, si no hay API). Aparte de app.js (Facundo).
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id") || "inundados-paso-de-los-libres";
  const ledger = document.querySelector(".ledger-area");
  if (!ledger) return;

  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const corto = (v) => (v >= 1e6 ? `$${(v / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M` : v >= 1e3 ? `$${Math.round(v / 1e3)} mil` : `$${Math.round(v)}`);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const NOMBRES = { mercadopago: "Mercado Pago", usdc: "USDC (Hedera)" };
  const COLORES = { mercadopago: "#009ee3", usdc: "#2775ca" };

  const seccion = el("section", "charts-area section-wrap", `
    <div class="charts-grid">
      <article class="chart-card mitad fx-card reveal" id="g-uso"><h3>Uso de lo recaudado</h3><p class="chart-sub">GASTADO VS. SALDO · TODO SALE DEL REGISTRO EN HEDERA</p></article>
      <article class="chart-card mitad fx-card reveal" id="g-medios"><h3>Cómo se donó</h3><p class="chart-sub">POR MEDIO DE PAGO</p></article>
    </div>`);
  seccion.id = "graficos";
  ledger.after(seccion);

  const cuando = (nodo, fn) => {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: 0.25 });
    io.observe(nodo);
  };

  function animar(ms, paso) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return paso(1);
    const t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / ms); paso(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  function uso(d) {
    const card = seccion.querySelector("#g-uso");
    const { recaudado = 0, gastado = 0, saldo = 0 } = d.totales || {};
    const pct = recaudado > 0 ? Math.min(100, (gastado / recaudado) * 100) : 0;
    const ent = d.entregas || [];
    const dn = el("div", "donut", `<div class="donut-centro"><strong>0%</strong><span>USADO</span></div>`);
    const fila = el("div", "dona-fila");
    fila.append(dn, el("div", "leyenda", `
      <div><i style="background:var(--coral)"></i>Gastado<b>${pesos(gastado)}</b></div>
      <div><i style="background:var(--glow)"></i>Saldo<b>${pesos(saldo)}</b></div>
      <div><i style="background:#cfd8cb"></i>Recaudado<b>${pesos(recaudado)}</b></div>`));
    card.append(fila, el("div", "kpis", `<div><strong>${(d.gastos || []).length}</strong><span>FACTURAS</span></div><div><strong>${ent.length}</strong><span>ENTREGAS</span></div><div><strong>${ent.reduce((s, e) => s + (Number(e.cantidad) || 0), 0)}</strong><span>UNIDADES</span></div>`));
    cuando(card, () => animar(1400, (t) => {
      dn.style.setProperty("--g", (pct * t).toFixed(2));
      dn.querySelector("strong").textContent = `${Math.round(pct * t)}%`;
    }));
  }

  function medios(d) {
    const card = seccion.querySelector("#g-medios");
    const grupos = { mercadopago: { total: 0, n: 0 } };
    for (const x of d.donaciones || []) {
      const k = x.metodo || "otro";
      grupos[k] ??= { total: 0, n: 0 };
      grupos[k].total += Number(x.monto) || 0;
      grupos[k].n++;
    }
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

  fetch(`/api/colectas/${encodeURIComponent(id)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .catch(() => fetch("/ejemplo/colecta.json").then((r) => r.json()))
    .then((d) => { uso(d); medios(d); document.dispatchEvent(new Event("fx:nuevo")); })
    .catch(() => seccion.querySelector(".charts-grid").replaceWith(el("p", "chart-vacio", "No se pudieron cargar los gráficos.")));
})();
