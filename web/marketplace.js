// Marketplace del NEA (index.html), en dos grupos bien separados:
// - Colectas APROBADAS: están en el registro de Hedera y las creó una organización verificada (persona jurídica +
//   identidad validada). Reciben donaciones y se puede ver la trazabilidad de cada peso.
// - PROPUESTAS sin aval: ideas que postula cualquiera (también quedan en Hedera, en su propio topic). No reciben
//   donaciones hasta que una ONG las avala y crea la colecta.
// Todo lo que se muestra está en Hedera testnet: las colectas son casos reales del NEA (api/_destacadas.js).
// Aparte de app.js (Facundo).
(function () {
  if (document.body.dataset.page !== "home") return;
  const ancla = document.getElementById("colectas");
  if (!ancla) return;

  const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const FOTOS = ["/img/rio-aereo.jpg", "/img/garganta.jpg", "/img/esteros.jpg", "/img/cataratas.jpg"];
  const ICONOS = { Inundaciones: ["", "linear-gradient(180deg,#0e3d3a10,#0e3d3a99),url(/img/esteros.jpg) center/cover"], Incendios: ["🔥", "linear-gradient(135deg,#7b241c,#e67e22)"], Agua: ["", "linear-gradient(180deg,#0e3d3a10,#0e3d3a99),url(/img/garganta.jpg) center/cover"], Salud: ["🩺", "linear-gradient(135deg,#4a235a,#a569bd)"], Alimentación: ["🍲", "linear-gradient(135deg,#7d6608,#f4d03f)"], Educación: ["🎒", "linear-gradient(135deg,#186a3b,#58d68d)"], Otra: ["🤲", "linear-gradient(135deg,#34495e,#7f8c8d)"] };


  const seccion = document.createElement("section");
  seccion.className = "nea-section";
  seccion.id = "nea";
  seccion.innerHTML = `<div class="section-wrap">
    <div class="nea-head reveal"><div><span class="section-kicker">COLECTAS DEL NEA</span>
      <h2>Los problemas del NEA,<br><em>a un clic de ayudar.</em></h2>
      <p>Las colectas <b>aprobadas</b> ya reciben donaciones y muestran en qué se gasta cada peso. Las <b>propuestas</b> son ideas de la comunidad que esperan el aval de una ONG.</p></div>
      <div class="nea-herramientas"><input class="nea-buscar" type="search" placeholder="Buscar: agua, Chaco, incendios…" aria-label="Buscar"><button type="button" class="button button-lime" id="postular-abrir">Postular una idea <span aria-hidden="true">↗</span></button></div></div>
    <form class="postular raised-panel" id="postular" hidden>
      <div class="form-head"><span>NUEVA PROPUESTA</span><span>QUEDA EN EL REGISTRO PÚBLICO</span></div>
      <div class="postular-grid">
        <div class="ancho"><label for="p-titulo">¿Qué hace falta?</label><input id="p-titulo" name="titulo" required minlength="5" maxlength="90" placeholder="Ej. Botes y chalecos para los parajes isleños de Itatí"></div>
        <div class="ancho"><label for="p-desc">¿Para quién y por qué?</label><textarea id="p-desc" name="descripcion" required minlength="20" maxlength="260" rows="3" placeholder="Contá la situación y qué se compraría. Sin nombres de personas."></textarea></div>
        <div><label for="p-prov">Provincia</label><select id="p-prov" name="provincia" required><option value="">Elegí…</option><option>Corrientes</option><option>Chaco</option><option>Misiones</option><option>Formosa</option></select></div>
        <div><label for="p-cat">Tema</label><select id="p-cat" name="categoria" required><option value="">Elegí…</option>${Object.keys(ICONOS).map((c) => `<option>${c}</option>`).join("")}</select></div>
        <div><label for="p-monto">Monto estimado ($)</label><input id="p-monto" name="montoEstimado" type="number" min="1" step="1" required placeholder="1500000"></div>
      </div>
      <button class="button button-dark" type="submit">Postular la idea <span aria-hidden="true">↗</span></button>
      <p class="form-feedback" role="status" aria-live="polite"></p>
      <p class="file-note">Tu propuesta se publica sin tu nombre ni tu email. Una ONG verificada la puede avalar y convertir en colecta.</p>
    </form>
    <div class="grupo grupo-aprobadas"><p class="nea-subtitulo"><span class="grupo-sello ok">✓</span> COLECTAS APROBADAS · RECIBEN DONACIONES</p>
      <div class="nea-grid" id="nea-activas">${'<div class="nea-esqueleto"></div>'.repeat(3)}</div></div>
    <button type="button" class="ver-ideas" aria-expanded="false" aria-controls="ideas">Ver ideas de la comunidad ↓</button>
    <div class="ideas" id="ideas" hidden><div class="nea-filtros" role="group" aria-label="Filtrar por tema"></div>
    <div class="grupo grupo-propuestas"><p class="nea-subtitulo"><span class="grupo-sello pend">!</span> PROPUESTAS SIN AVAL · TODAVÍA NO RECIBEN DONACIONES</p>
      <div class="nea-grid" id="nea-causas"></div></div></div></div>`;
  ancla.after(seccion);

  let filtro = "Todas", texto = "", activas = [], propuestas = [];
  const coincide = (...c) => !texto || c.join(" ").toLowerCase().includes(texto);
  const sesion = () => window.Cuenta?.actual();

  // las ideas sin aval (y sus filtros) quedan plegadas: la portada muestra primero lo que ya recibe donaciones
  const ideas = seccion.querySelector("#ideas"), verIdeas = seccion.querySelector(".ver-ideas");
  const abrirIdeas = (si) => {
    ideas.hidden = !si;
    verIdeas.setAttribute("aria-expanded", String(si));
    verIdeas.textContent = si ? "Ocultar ideas de la comunidad ↑" : "Ver ideas de la comunidad ↓";
    if (si) dispatchEvent(new Event("resize")); // el carrusel recalcula su ancho al hacerse visible
  };
  verIdeas.addEventListener("click", () => abrirIdeas(ideas.hidden));
  const filtros = seccion.querySelector(".nea-filtros");
  ["Todas", ...Object.keys(ICONOS)].forEach((c) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = c; b.setAttribute("aria-pressed", String(c === filtro));
    b.addEventListener("click", () => { filtro = c; filtros.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); pintarPropuestas(); });
    filtros.append(b);
  });
  seccion.querySelector(".nea-buscar").addEventListener("input", (e) => { texto = e.target.value.trim().toLowerCase(); pintarPropuestas(); pintarActivas(); });

  function pintarActivas() {
    const grid = seccion.querySelector("#nea-activas");
    const lista = activas.filter((c) => coincide(c.titulo, c.descripcion, c.organizador?.nombre, c.lugar));
    grid.innerHTML = lista.length ? lista.map((c, i) => {
      const pct = c.meta > 0 ? Math.min(100, (c.recaudado / c.meta) * 100) : 0;
      const url = `/colecta.html?id=${encodeURIComponent(c.campaignId)}`;
      // foto del lugar del caso real (api/_destacadas.js); si no tiene, una del NEA
      const foto = /^\/img\/[\w-]+\.jpg$/.test(c.foto || "") ? c.foto : FOTOS[i % FOTOS.length];
      const fuente = /^https:\/\//.test(c.fuente?.url || "") ? `<a class="nea-fuente" href="${esc(c.fuente.url)}" target="_blank" rel="noopener noreferrer">Caso real · fuente: ${esc(c.fuente.medio)} ↗</a>` : "";
      return `<article class="nea-card aprobada fx-card reveal">
        <a class="nea-visual" href="${url}" style="--fondo:linear-gradient(180deg,#0e3d3a10,#0e3d3a99),url(${foto}) center/cover"><span class="nea-chip real">✓ APROBADA</span>${c.lugar ? `<span class="nea-lugar">${esc(c.lugar)}${c.fecha ? ` · ${esc(c.fecha)}` : ""}</span>` : ""}</a>
        <div class="nea-body"><small>${esc(c.organizador?.nombre || "Organización verificada")}</small><h3><a href="${url}">${esc(c.titulo)}</a></h3><p>${esc(c.descripcion || "Colecta registrada en Hedera.")}</p>${fuente}
          <div class="nea-progreso"><header><b>${pesos(c.recaudado)}</b><span>de ${pesos(c.meta)}</span></header><div class="nea-pista"><span data-pct="${pct.toFixed(1)}"></span></div></div>
          <div class="nea-botones"><a class="nea-accion secundaria" href="${url}#libro">En qué se gastó ↗</a><a class="nea-accion" href="${url}#donar">Doná ↗</a></div></div></article>`;
    }).join("") : '<p class="nea-vacio">No hay colectas aprobadas con ese filtro.</p>';
    activar(grid);
  }

  function pintarPropuestas() {
    const grid = seccion.querySelector("#nea-causas");
    const lista = propuestas.filter((p) => (filtro === "Todas" || p.categoria === filtro) && coincide(p.titulo, p.descripcion, p.provincia, p.categoria));
    grid.innerHTML = lista.length ? lista.map((p) => {
      const [icono, fondo] = ICONOS[p.categoria] || ICONOS.Otra;
      const crear = `/crear.html?${new URLSearchParams({ titulo: p.titulo, desc: p.descripcion, meta: p.montoEstimado })}`;
      return `<article class="nea-card propuesta fx-card reveal">
        <div class="nea-visual" style="--fondo:${fondo}"><span class="nea-chip pend">SIN AVAL</span>${icono ? `<span class="nea-icono" aria-hidden="true">${icono}</span>` : ""}</div>
        <div class="nea-body"><small>${esc(p.categoria.toUpperCase())} · ${esc(p.provincia.toUpperCase())}${p.secuencia ? ` · PROPUESTA #${esc(p.secuencia)}` : ""}</small><h3>${esc(p.titulo)}</h3><p>${esc(p.descripcion)}</p>
          <div class="propuesta-estado"><span>Monto estimado</span><b>${pesos(p.montoEstimado)}</b><em>Esperando el aval de una ONG</em></div>
          <div class="nea-botones"><a class="nea-accion" href="${crear}">Soy ONG: avalar y crear ↗</a></div></div></article>`;
    }).join("") : '<p class="nea-vacio">No hay propuestas con ese filtro.</p>';
    activar(grid);
  }

  // postular: exige cuenta (sin publicar sus datos) y registra la idea en Hedera
  const form = seccion.querySelector("#postular");
  seccion.querySelector("#postular-abrir").addEventListener("click", () => {
    if (window.Cuenta && !sesion()) { location.href = Cuenta.urlLogin("/#postular"); return; }
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector("input").focus();
  });
  if (location.hash === "#postular" && sesion()) form.hidden = false;
  form.addEventListener("submit", () => abrirIdeas(true));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fb = form.querySelector(".form-feedback"), boton = form.querySelector("button[type=submit]");
    boton.disabled = true; fb.className = "form-feedback"; fb.textContent = "Publicando tu propuesta…";
    try {
      const r = await fetch("/api/propuestas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
      fb.className = "form-feedback success";
      fb.innerHTML = `¡Listo! Tu propuesta quedó registrada (#${d.secuencia}). <a href="${esc(d.hashscan)}" target="_blank" rel="noopener noreferrer">Verla en el registro ↗</a>`;
      form.reset();
      cargarPropuestas();
    } catch (err) { fb.className = "form-feedback error"; fb.textContent = err.message; }
    finally { boton.disabled = false; }
  });

  function activar(grid) {
    document.dispatchEvent(new Event("fx:nuevo"));
    const llenar = () => grid.querySelectorAll(".nea-pista span").forEach((s) => (s.style.width = `${s.dataset.pct}%`));
    if (!("IntersectionObserver" in window)) return llenar();
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); setTimeout(llenar, 250); } }, { threshold: 0.2 });
    io.observe(grid);
  }

  function cargarPropuestas() {
    fetch("/api/propuestas").then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => {
      propuestas = d.propuestas || [];
      pintarPropuestas();
    }).catch(() => {});
  }

  pintarPropuestas();
  cargarPropuestas();
  fetch("/api/colectas")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((lista) => Promise.all(lista.slice(0, 8).map((c) =>
      fetch(`/api/colectas/${encodeURIComponent(c.campaignId)}`).then((r) => r.json()).then((d) => ({
        ...c, descripcion: d.colecta?.descripcion, organizador: d.colecta?.organizador,
        recaudado: d.totales?.recaudado || 0, donaciones: (d.donaciones || []).length,
      })).catch(() => ({ ...c, recaudado: 0, donaciones: 0 }))
    )))
    .then((l) => { activas = l; pintarActivas(); document.dispatchEvent(new CustomEvent("colectas:listas", { detail: l })); })
    .catch(() => { seccion.querySelector("#nea-activas").innerHTML = '<p class="nea-vacio">No se pudo leer el registro de colectas.</p>'; });
})();
