// Marketplace de causas del NEA (index.html): arriba, las colectas reales del registro en Hedera; abajo, problemas
// de la región como causas de ejemplo para que una organización arme su colecta. Aparte de app.js (Facundo).
(function () {
  if (document.body.dataset.page !== "home") return;
  const ancla = document.getElementById("colectas");
  if (!ancla) return;

  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Causas de ejemplo: problemas reales de la región, con montos ilustrativos (no son colectas en curso).
  const CAUSAS = [
    { cat: "Inundaciones", prov: "Corrientes", icono: "🌊", fondo: "linear-gradient(135deg,#1b4f72,#2e86c1)", titulo: "Familias evacuadas por la crecida del Paraná", texto: "Colchones, agua potable y alimentos para los centros de evacuados de la costa.", tags: ["Colchones", "Agua", "Alimentos"], meta: 3000000, avance: 0.42 },
    { cat: "Incendios", prov: "Corrientes", icono: "🔥", fondo: "linear-gradient(135deg,#7b241c,#e67e22)", titulo: "Brigadistas en los Esteros del Iberá", texto: "Equipos, mochilas de agua y combustible para las cuadrillas que frenan el fuego.", tags: ["Equipos", "Combustible"], meta: 2500000, avance: 0.18 },
    { cat: "Agua", prov: "Chaco", icono: "💧", fondo: "linear-gradient(135deg,#0e6655,#48c9b0)", titulo: "Agua segura en El Impenetrable", texto: "Cisternas y filtros para parajes rurales que dependen del agua de lluvia.", tags: ["Cisternas", "Filtros"], meta: 4200000, avance: 0.27 },
    { cat: "Salud", prov: "Misiones", icono: "🦟", fondo: "linear-gradient(135deg,#4a235a,#a569bd)", titulo: "Prevención del dengue en los barrios", texto: "Repelente, mosquiteros y jornadas de descacharrado antes del verano.", tags: ["Repelente", "Mosquiteros"], meta: 1200000, avance: 0.63 },
    { cat: "Inundaciones", prov: "Chaco", icono: "🏚️", fondo: "linear-gradient(135deg,#1f3a5f,#5d8aa8)", titulo: "Barrios anegados del Gran Resistencia", texto: "Bombas de achique, lavandina y kits de limpieza para volver a casa.", tags: ["Bombas", "Limpieza"], meta: 1800000, avance: 0.35 },
    { cat: "Alimentación", prov: "Formosa", icono: "🍲", fondo: "linear-gradient(135deg,#7d6608,#f4d03f)", titulo: "Comedores comunitarios del interior", texto: "Mercadería para comedores que sostienen a cientos de familias cada semana.", tags: ["Mercadería", "Garrafas"], meta: 900000, avance: 0.71 },
    { cat: "Educación", prov: "Corrientes", icono: "🎒", fondo: "linear-gradient(135deg,#186a3b,#58d68d)", titulo: "Escuelas rurales después de la crecida", texto: "Útiles, pintura y arreglos para que las escuelas vuelvan a abrir.", tags: ["Útiles", "Reparaciones"], meta: 1500000, avance: 0.22 },
    { cat: "Incendios", prov: "Misiones", icono: "🚒", fondo: "linear-gradient(135deg,#922b21,#ec7063)", titulo: "Bomberos voluntarios de la selva misionera", texto: "Ropa ignífuga, mangueras y radios para los cuarteles del interior.", tags: ["Equipos", "Radios"], meta: 3200000, avance: 0.12 },
  ];
  const CATEGORIAS = ["Todas", ...new Set(CAUSAS.map((c) => c.cat))];

  const seccion = document.createElement("section");
  seccion.className = "nea-section";
  seccion.id = "nea";
  seccion.innerHTML = `<div class="section-wrap">
    <div class="nea-head reveal"><div><span class="section-kicker">MARKETPLACE SOLIDARIO · NEA</span>
      <h2>Los problemas del NEA,<br><em>a un clic de ayudar.</em></h2>
      <p>Elegí una causa de Corrientes, Chaco, Misiones o Formosa. Cada peso que entra y cada gasto queda en Hedera, a la vista de todos.</p></div>
      <input class="nea-buscar" type="search" placeholder="Buscar: agua, Chaco, incendios…" aria-label="Buscar causas"></div>
    <div class="nea-filtros" role="group" aria-label="Filtrar por tema"></div>
    <p class="nea-subtitulo reveal">COLECTAS ACTIVAS EN EL REGISTRO</p>
    <div class="nea-grid" id="nea-activas">${'<div class="nea-esqueleto"></div>'.repeat(3)}</div>
    <p class="nea-subtitulo reveal">CAUSAS DEL NEA QUE NECESITAN UNA COLECTA</p>
    <div class="nea-grid" id="nea-causas"></div></div>`;
  ancla.after(seccion);

  let filtro = "Todas", texto = "";
  const filtros = seccion.querySelector(".nea-filtros");
  for (const c of CATEGORIAS) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = c; b.setAttribute("aria-pressed", String(c === filtro));
    b.addEventListener("click", () => { filtro = c; filtros.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); pintarCausas(); });
    filtros.append(b);
  }
  seccion.querySelector(".nea-buscar").addEventListener("input", (e) => { texto = e.target.value.trim().toLowerCase(); pintarCausas(); pintarActivas(); });

  const tarjeta = ({ chip, real, icono, fondo, sobre, titulo, cuerpo, tags, recaudado, meta, accion, href }) => {
    const pct = meta > 0 ? Math.min(100, (recaudado / meta) * 100) : 0;
    return `<article class="nea-card fx-card reveal">
      <div class="nea-visual" style="--fondo:${fondo}"><span class="nea-chip${real ? " real" : ""}">${esc(chip)}</span><span class="nea-icono" aria-hidden="true">${icono}</span></div>
      <div class="nea-body"><small>${esc(sobre)}</small><h3>${esc(titulo)}</h3><p>${esc(cuerpo)}</p>
        <div class="nea-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <div class="nea-progreso"><header><b>${pesos(recaudado)}</b><span>de ${pesos(meta)}</span></header><div class="nea-pista"><span data-pct="${pct.toFixed(1)}"></span></div></div>
        <a class="nea-accion" href="${href}">${accion} ↗</a></div></article>`;
  };

  const coincide = (...campos) => !texto || campos.join(" ").toLowerCase().includes(texto);

  function pintarCausas() {
    const grid = seccion.querySelector("#nea-causas");
    const lista = CAUSAS.filter((c) => (filtro === "Todas" || c.cat === filtro) && coincide(c.titulo, c.texto, c.prov, c.cat, c.tags));
    grid.innerHTML = lista.length
      ? lista.map((c) => tarjeta({ chip: "CAUSA DE EJEMPLO", icono: c.icono, fondo: c.fondo, sobre: `${c.cat.toUpperCase()} · ${c.prov.toUpperCase()}`, titulo: c.titulo, cuerpo: c.texto, tags: c.tags, recaudado: Math.round(c.meta * c.avance), meta: c.meta, accion: "Crear una colecta para esta causa", href: `/crear.html?${new URLSearchParams({ titulo: c.titulo, desc: c.texto, meta: c.meta })}` })).join("")
      : '<p class="nea-vacio">No hay causas con ese filtro.</p>';
    activar(grid);
  }

  let activas = [];
  function pintarActivas() {
    const grid = seccion.querySelector("#nea-activas");
    const lista = activas.filter((c) => coincide(c.titulo, c.descripcion));
    grid.innerHTML = lista.length
      ? lista.map((c) => tarjeta({ chip: "✓ EN HEDERA", real: true, icono: "🤝", fondo: "linear-gradient(135deg,#1e3b2c,#486b5d)", sobre: `REGISTRO ${c.topicId}`, titulo: c.titulo, cuerpo: c.descripcion || "Colecta registrada en Hedera.", tags: [c.organizador?.tipo || "Organización", `${c.donaciones} ${c.donaciones === 1 ? "donación" : "donaciones"}`], recaudado: c.recaudado, meta: c.meta, ...accionDonar(c) })).join("")
      : '<p class="nea-vacio">No hay colectas activas con ese filtro.</p>';
    activar(grid);
  }

  // donar exige cuenta: sin sesión, la card lleva a registrarse y después vuelve a la colecta
  function accionDonar(c) {
    const url = `/colecta.html?id=${encodeURIComponent(c.campaignId)}`;
    const sesion = window.Cuenta?.actual();
    return sesion ? { accion: "Doná ahora", href: url } : { accion: "Registrate y doná", href: window.Cuenta ? Cuenta.urlLogin(url) : url };
  }

  // barras que se llenan al aparecer + avisar a efectos.js que hay cards nuevas
  function activar(grid) {
    document.dispatchEvent(new Event("fx:nuevo"));
    const llenar = () => grid.querySelectorAll(".nea-pista span").forEach((s) => (s.style.width = `${s.dataset.pct}%`));
    if (!("IntersectionObserver" in window)) return llenar();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); setTimeout(llenar, 250); } }, { threshold: 0.2 });
    io.observe(grid);
  }

  pintarCausas();
  fetch("/api/colectas")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((lista) => Promise.all(lista.slice(-6).reverse().map((c) =>
      fetch(`/api/colectas/${encodeURIComponent(c.campaignId)}`).then((r) => r.json()).then((d) => ({
        ...c, descripcion: d.colecta?.descripcion, organizador: d.colecta?.organizador,
        recaudado: d.totales?.recaudado || 0, donaciones: (d.donaciones || []).length,
      })).catch(() => ({ ...c, recaudado: 0, donaciones: 0 }))
    )))
    .then((l) => { activas = l; pintarActivas(); document.dispatchEvent(new CustomEvent("colectas:listas", { detail: l })); })
    .catch(() => { seccion.querySelector("#nea-activas").innerHTML = '<p class="nea-vacio">No se pudo leer el registro de colectas.</p>'; });
})();
