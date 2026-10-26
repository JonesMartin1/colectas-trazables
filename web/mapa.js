// "Dónde se compró" (colecta.html): mapa de los comercios donde la colecta gastó, con OpenStreetMap y Leaflet.
// Sale solo si algún gasto trae ubicación (la API la calcula al registrar el gasto, ver api/_geo.js). Si el proveedor
// es una persona, el punto es su localidad, no su dirección. Leaflet se carga solo cuando hace falta.
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;
  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cargar = (tag, attrs) => new Promise((ok, mal) => {
    const n = document.createElement(tag);
    Object.assign(n, attrs, { crossOrigin: "anonymous", onload: ok, onerror: mal });
    document.head.append(n);
  });

  const datos = (window.datosColecta ??= fetch(`/api/colectas/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => fetch("/ejemplo/colecta.json").then((r) => r.json())));
  datos.then(async (d) => {
    const conLugar = (d.gastos || []).filter((g) => Array.isArray(g.geo) && g.geo.length === 2);
    if (!conLugar.length) return;
    // un punto por comercio: si se le compró varias veces, se suman
    const porLugar = new Map();
    for (const g of conLugar) {
      const k = g.geo.join(",");
      const p = porLugar.get(k) ?? { geo: g.geo, nombre: g.proveedor || g.proveedorCuit, lugar: [g.direccion, g.localidad].filter(Boolean).join(", "), total: 0, compras: [] };
      p.total += g.monto;
      p.compras.push(g.detalle || "compra");
      porLugar.set(k, p);
    }
    const sec = document.createElement("section");
    sec.className = "mapa-gastos section-wrap";
    sec.id = "mapa";
    sec.innerHTML = `<div class="salidas-head"><span class="section-kicker">DÓNDE SE COMPRÓ</span>
        <h2>La ayuda tiene <em>dirección.</em></h2>
        <p>Cada punto es un comercio donde la colecta compró, con su factura. Si el proveedor es una persona, se muestra solo su localidad.</p></div>
      <div class="mapa-caja" id="mapa-caja" role="region" aria-label="Mapa de los comercios donde se compró"></div>`;
    (document.getElementById("salidas") || document.getElementById("libro") || document.querySelector("main")).before(sec);

    await cargar("link", { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" });
    await cargar("script", { src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", integrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" });
    const L = window.L;
    const mapa = L.map("mapa-caja", { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapa);
    const puntos = [...porLugar.values()].map((p) => {
      L.circleMarker(p.geo, { radius: 9, weight: 2, color: "#0e3d3a", fillColor: "#18b5a6", fillOpacity: 0.85 })
        .bindPopup(`<strong>${esc(p.nombre)}</strong><br>${esc(p.lugar)}<br>${esc(pesos(p.total))} · ${esc(p.compras.join(", "))}`)
        .addTo(mapa);
      return p.geo;
    });
    if (puntos.length === 1) mapa.setView(puntos[0], 15); else mapa.fitBounds(puntos, { padding: [30, 30] });
  }).catch(() => {});
})();
