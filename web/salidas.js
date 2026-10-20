// Salidas de la billetera de la colecta (colecta.html). Cuando el organizador pasa USDC a pesos (por ejemplo,
// lo manda a su cuenta de un exchange y de ahí a Mercado Pago), esa salida queda en Hedera aunque no la cargue:
// la API la lee del Mirror Node. Acá se muestra junto con lo justificado con facturas y lo que falta rendir.
// Si la billetera la comparten varias colectas (las de demo viejas), no se puede atribuir y la sección no aparece.
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;
  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fecha = (iso) => new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const hs = (u) => { try { const x = new URL(u); return x.hostname === "hashscan.io" ? x.href : null; } catch { return null; } };

  const datos = (window.datosColecta ??= fetch(`/api/colectas/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => fetch("/ejemplo/colecta.json").then((r) => r.json())));
  datos.then((d) => {
    if (!Array.isArray(d.salidas)) return; // billetera compartida o colecta de ejemplo
    const t = d.totales || {};
    const sec = document.createElement("section");
    sec.className = "salidas section-wrap";
    sec.id = "salidas";
    const filas = d.salidas.slice().reverse().map((s) => {
      const link = hs(s.hashscan);
      const destino = s.destinoNombre
        ? `<span class="salida-destino">a ${esc(s.destinoNombre)} · para pasar a pesos</span>`
        : `<span class="salida-destino alerta">a otra billetera (${esc(s.destino || "—")}) · sin identificar</span>`;
      return `<div class="salida"><div><strong>${esc(pesos(s.monto))}</strong><small>${esc(s.usdc.toLocaleString("es-AR", { maximumFractionDigits: 2 }))} USDC · ${esc(fecha(s.fecha))}</small>${destino}</div>${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">Ver en HashScan ↗</a>` : ""}</div>`;
    }).join("") || '<p class="chart-vacio">Todavía no salió plata de la billetera de la colecta.</p>';
    sec.innerHTML = `<div class="salidas-head"><span class="section-kicker">SALIDAS DE LA BILLETERA · SE REGISTRAN SOLAS</span>
        <h2>Cada peso que sale, <em>queda a la vista.</em></h2>
        <p>Cuando el organizador pasa la plata a pesos para comprar, la salida queda registrada en Hedera aunque no la cargue. Después tiene que subir las facturas por ese monto.</p></div>
      <div class="salidas-numeros">
        <div><span>Retirado a pesos</span><strong>${esc(pesos(t.retirado))}</strong></div>
        <div><span>Justificado con facturas</span><strong>${esc(pesos(t.gastado))}</strong></div>
        <div class="${t.sinRendir > 0 ? "pendiente" : "al-dia"}"><span>Retirado sin rendir</span><strong>${esc(pesos(t.sinRendir))}</strong><small>${t.sinRendir > 0 ? "Falta que suba facturas por este monto" : "Todo lo retirado está justificado"}</small></div>
      </div>
      <div class="salidas-lista">${filas}</div>`;
    (document.getElementById("libro") || document.querySelector("main")).before(sec);
  }).catch(() => {});
})();
