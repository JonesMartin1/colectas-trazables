// Versión simple: lo importante arriba y menos scroll. Reacomoda el DOM de las páginas base (sin editarlas):
// - colecta: números, meta y donar en la portada; movimientos en pestañas.
// - inicio: marketplace justo debajo de la portada, en carruseles; se ocultan secciones repetidas.
// Corre después de app.js, entregas.js, graficos.js y marketplace.js, y antes de efectos.js.
(function () {
  const pagina = document.body.dataset.page;
  document.body.classList.add("simple");

  if (pagina === "colecta") {
    const izq = document.querySelector(".page-hero-grid > div");
    const acciones = izq?.querySelector(".page-hero-actions");
    const donar = document.getElementById("donar");
    const mapa = document.querySelector(".page-map");
    if (izq && acciones) {
      ["#sample-banner", ".stat-grid", ".goal-bar", "#topic-id"].forEach((sel) => {
        const n = document.querySelector(sel);
        if (n) izq.insertBefore(n, sel === "#sample-banner" ? izq.firstChild : acciones);
      });
      document.querySelector(".ledger-area")?.classList.add("oculto");
    }
    if (mapa && donar) {
      mapa.replaceWith(donar);
      donar.classList.add("donar-arriba");
      document.querySelector(".action-area")?.classList.add("solo-verificar");
    }
    pestanas();
  }

  if (pagina === "home") {
    [".trust-strip", ".manifesto", ".campaign-section", ".create-section"].forEach((s) => document.querySelector(s)?.classList.add("oculto"));
    const ejemplo = document.querySelector(".campaign-section");
    const nea = document.getElementById("nea");
    const hero = document.querySelector(".hero");
    if (nea && hero) {
      ejemplo?.removeAttribute("id");
      nea.id = "colectas"; // el menú "Colectas" ahora lleva al marketplace
      hero.after(nea);
    }
    document.querySelectorAll("#nea-activas,#nea-causas").forEach(carrusel);
    pasoCuenta();
    porQueHedera(hero);
    pruebaEnVivo();
    document.querySelector("#como-funciona")?.classList.add("compacto");
  }

  if (pagina === "crear" && typeof setupCreate === "function") {
    setupCreate(); // de app.js: el mismo formulario que antes estaba en el inicio
    const q = new URLSearchParams(location.search);
    [["titulo", "titulo"], ["descripcion", "desc"], ["meta", "meta"]].forEach(([id, k]) => {
      const n = document.getElementById(id);
      if (n && q.get(k)) n.value = q.get(k).slice(0, 300);
    });
  }

  if (pagina === "colecta") registroEnHedera();

  // Franja corta debajo de la portada: por qué esto necesita Hedera y no una base de datos.
  function porQueHedera(hero) {
    if (!hero || document.querySelector(".por-que")) return;
    hero.insertAdjacentHTML("afterend", `<section class="por-que" aria-label="Por qué Hedera"><div class="section-wrap por-que-grid">
      <div><b>Inmutable</b><span>Cada movimiento es un mensaje de Hedera Consensus Service, con fecha de consenso. Nadie lo borra.</span></div>
      <div><b>Verificable gratis</b><span>Cualquiera lo comprueba en HashScan o en el Mirror Node, sin crear cuenta.</span></div>
      <div><b>Sin intermediarios</b><span>La plata va directo a la organización. Nosotros no la tocamos.</span></div>
      <div><b>Firmas que protegen</b><span>Los alias oficiales necesitan 2 de 4 firmas institucionales.</span></div>
    </div></section>`);
  }

  // Prueba en vivo: cuántas colectas hay en el registro y la última, en la card de la portada.
  function pruebaEnVivo() {
    fetch("/api/salud").then((r) => r.json()).then((d) => {
      const n = document.getElementById("prueba-vivo");
      if (n && d.colectas) n.textContent = `En vivo en Hedera ${d.red || "testnet"} · ${d.colectas} colectas registradas`;
    }).catch(() => {});
    document.addEventListener("colectas:listas", (e) => {
      const c = e.detail?.[0];
      const card = document.querySelector(".object-shell");
      if (!c || !card) return;
      const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
      const pct = c.meta > 0 ? Math.min(100, (c.recaudado / c.meta) * 100) : 0;
      const poner = (sel, txt) => { const n = card.querySelector(sel); if (n) n.textContent = txt; };
      poner(".object-top span:last-child", c.topicId);
      poner(".object-label", "EN VIVO · REGISTRADA EN HEDERA");
      poner(".object-face h2", c.titulo);
      poner(".object-stat span", "Recaudado, leído de la red");
      poner(".object-stat strong", pesos(c.recaudado));
      poner(".object-meta span:first-child", `Meta: ${pesos(c.meta)}`);
      poner(".object-meta span:last-child", `${pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`);
      const barra = card.querySelector(".meter span");
      if (barra) barra.style.width = `${Math.max(1, pct)}%`;
      const pie = card.querySelector(".object-bottom");
      if (pie) { pie.style.cursor = "pointer"; pie.onclick = () => (location.href = `/colecta.html?id=${encodeURIComponent(c.campaignId)}`); }
    });
  }

  // Colecta: "Registro: 0.0.x" pasa a ser un sello con link a HashScan.
  function registroEnHedera() {
    const n = document.getElementById("topic-id");
    if (!n) return;
    const sello = () => {
      const id = n.textContent.match(/0\.0\.\d+/)?.[0];
      if (!id) return false;
      obs.disconnect();
      n.innerHTML = `<a class="sello-hedera" href="https://hashscan.io/testnet/topic/${id}" target="_blank" rel="noopener noreferrer">✓ Registrada en Hedera · ${id} · Verificala en HashScan ↗</a>`;
      return true;
    };
    const obs = new MutationObserver(sello);
    if (!sello()) obs.observe(n, { childList: true, characterData: true, subtree: true });
  }

  // "Cómo funciona": el primer paso es crear la cuenta (o ingresar); los demás se corren un número.
  function pasoCuenta() {
    const pasos = document.querySelector("#como-funciona .steps");
    if (!pasos || pasos.querySelector(".paso-cuenta")) return;
    pasos.querySelectorAll(".step-number").forEach((n, i) => (n.firstChild.textContent = `0${i + 2} `));
    pasos.insertAdjacentHTML("afterbegin", `<article class="step-card paso-cuenta">
      <div class="step-number">01 <span>↗</span></div>
      <div class="step-art step-art-cero"><div class="alias-paper"><small>TU CUENTA</small><strong>Hola, Ana</strong><span><b>✓</b> Lista para donar</span></div></div>
      <h3>Creás tu cuenta</h3><p>Te registrás o iniciás sesión en un minuto. Es el primer paso para donar. <a class="paso-link" href="/login.html">Crear mi cuenta ↗</a></p></article>`);
    pasos.classList.add("cuatro");
  }

  // Donaciones, gastos y entregas en pestañas, en vez de paneles uno abajo del otro.
  function pestanas() {
    const grid = document.querySelector(".activity-grid");
    if (!grid) return;
    const sig = grid.nextElementSibling;
    if (sig?.classList.contains("activity-panel")) grid.append(sig); // el panel de entregas (entregas.js)
    const paneles = [...grid.querySelectorAll(":scope > .activity-panel")];
    if (paneles.length < 2) return;
    const barra = document.createElement("div");
    barra.className = "pestanas";
    barra.setAttribute("role", "tablist");
    const mostrar = (i) => paneles.forEach((p, j) => {
      p.classList.toggle("activo", i === j);
      barra.children[j].setAttribute("aria-selected", String(i === j));
    });
    paneles.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.textContent = p.querySelector("h3")?.textContent || `Panel ${i + 1}`;
      b.addEventListener("click", () => mostrar(i));
      barra.append(b);
    });
    grid.classList.add("con-pestanas");
    grid.before(barra);
    mostrar(0);
  }

  // Una fila que se desliza, con flechas, en vez de una grilla larga.
  function carrusel(grid) {
    grid.classList.add("carrusel");
    const titulo = grid.previousElementSibling;
    const fila = document.createElement("div");
    fila.className = "carrusel-fila";
    const flechas = document.createElement("div");
    flechas.className = "carrusel-flechas";
    for (const [txt, dir] of [["←", -1], ["→", 1]]) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = txt;
      b.setAttribute("aria-label", dir < 0 ? "Anteriores" : "Siguientes");
      b.addEventListener("click", () => grid.scrollBy({ left: dir * grid.clientWidth * 0.8, behavior: "smooth" }));
      flechas.append(b);
    }
    if (titulo?.classList.contains("nea-subtitulo")) { titulo.before(fila); fila.append(titulo, flechas); }
    else grid.before(fila), fila.append(flechas);
  }
})();
