// Versión simple: lo importante arriba y menos scroll. Reacomoda el DOM de las páginas base (sin editarlas):
// - colecta: números, meta y donar en la portada; movimientos en pestañas.
// - inicio: marketplace justo debajo de la portada, en una grilla de 3 por fila; se ocultan secciones repetidas.
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

  if (pagina === "colecta") { registroEnHedera(); soloOrganizador(); botonDonarFijo(); }

  // Franja corta debajo de la portada: por qué confiar, en palabras de quien dona (lo técnico vive en /hedera.html).
  function porQueHedera(hero) {
    if (!hero || document.querySelector(".por-que")) return;
    hero.insertAdjacentHTML("afterend", `<section class="por-que" aria-label="Por qué confiar"><div class="section-wrap por-que-grid">
      <div><b>Va directo a la organización</b><span>Nosotros nunca tocamos la plata.</span></div>
      <div><b>Ves cada factura</b><span>Cada gasto se publica con su comprobante.</span></div>
      <div><b>Nadie lo puede borrar</b><span>Ni el organizador ni nosotros podemos cambiar lo que pasó.</span></div>
      <div><b>Cualquiera lo verifica</b><span>Gratis y sin crear cuenta. <a href="/hedera.html">Ver cómo ↗</a></span></div>
    </div></section>`);
  }

  // Prueba en vivo: cuántas colectas hay en el registro y la última, en la card de la portada.
  function pruebaEnVivo() {
    fetch("/api/salud").then((r) => r.json()).then((d) => {
      const n = document.getElementById("prueba-vivo");
      if (n && d.colectas) n.textContent = `${d.colectas} colectas en curso`;
    }).catch(() => {});
    document.addEventListener("colectas:listas", (e) => {
      const c = e.detail?.[0];
      const card = document.querySelector(".object-shell");
      if (!c || !card) return;
      const pesos = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0);
      const pct = c.meta > 0 ? Math.min(100, (c.recaudado / c.meta) * 100) : 0;
      const poner = (sel, txt) => { const n = card.querySelector(sel); if (n) n.textContent = txt; };
      poner(".object-top > span:last-child", "✓ VERIFICADA");
      poner(".object-label", "COLECTA EN CURSO");
      poner(".object-face h2", c.titulo);
      poner(".object-stat span", "Recaudado hasta ahora");
      poner(".object-stat strong", pesos(c.recaudado));
      poner(".object-meta span:first-child", `Meta: ${pesos(c.meta)}`);
      poner(".object-meta span:last-child", `${pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`);
      const barra = card.querySelector(".meter span");
      if (barra) barra.style.width = `${Math.max(1, pct)}%`;
      // la foto de atrás es la del lugar de esta colecta, no una postal suelta
      const halo = document.querySelector(".hero-object .object-halo");
      if (halo && /^\/img\/[\w-]+\.jpg$/.test(c.foto || "")) {
        halo.style.setProperty("--hero-foto", `url(${c.foto})`);
        if (c.lugar) halo.style.setProperty("--hero-lugar", JSON.stringify(String(c.lugar)));
      }
      // toda la colecta principal (tarjeta y foto) lleva a su página, con el mouse o con el teclado
      const bloque = card.closest(".hero-object") || card;
      const ir = () => (location.href = `/colecta.html?id=${encodeURIComponent(c.campaignId)}`);
      bloque.style.cursor = "pointer";
      bloque.setAttribute("role", "link");
      bloque.tabIndex = 0;
      bloque.setAttribute("aria-label", `Ver la colecta: ${c.titulo}`);
      bloque.onclick = ir;
      bloque.onkeydown = (ev) => { if (ev.key === "Enter") ir(); };
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
      n.innerHTML = `<a class="sello-hedera" href="https://hashscan.io/${window.HEDERA_RED || "testnet"}/topic/${id}" target="_blank" rel="noopener noreferrer" title="Registro ${id} en Hedera">✓ Registro público · Verificalo ↗</a>`;
      return true;
    };
    const obs = new MutationObserver(sello);
    if (!sello()) obs.observe(n, { childList: true, characterData: true, subtree: true });
  }

  // Colecta: lo que hace el organizador (cargar gastos y entregas) sale del camino de quien dona y queda al final.
  function soloOrganizador() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id || document.querySelector(".organizador-pie")) return;
    document.getElementById("expense-link")?.classList.add("oculto");
    const main = document.querySelector("main");
    main?.insertAdjacentHTML("beforeend", `<section class="organizador-pie section-wrap"><span>¿Organizás esta colecta?</span>
      <a href="/gasto.html?id=${encodeURIComponent(id)}">Cargar un gasto ↗</a><a href="/entrega.html?id=${encodeURIComponent(id)}">Cargar una entrega ↗</a></section>`);
  }

  // Colecta, en el celular: un botón "Donar" fijo abajo, que se esconde cuando el formulario ya está a la vista.
  function botonDonarFijo() {
    const donar = document.getElementById("donar");
    if (!donar || document.querySelector(".donar-fijo")) return;
    const b = document.createElement("a");
    b.className = "donar-fijo";
    b.href = "#donar";
    b.innerHTML = 'Donar <span aria-hidden="true">↗</span>';
    b.addEventListener("click", (e) => {
      e.preventDefault();
      donar.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => document.getElementById("donate-amount")?.focus({ preventScroll: true }), 450);
    });
    document.body.append(b);
    // llegando con #donar (botón "Doná" de las tarjetas), el navegador salta antes de que esta página se reacomode,
    // y los datos que llegan después empujan el formulario (a veces sin cambiar el alto total): durante 6 s, o hasta
    // que la persona toque o scrollee por su cuenta, si el formulario se corrió se lo vuelve a poner arriba.
    if (location.hash === "#donar") {
      // posición de layout (offsetTop), no getBoundingClientRect: la animación de entrada de la tarjeta la desplaza con
      // transform y la página "temblaba" corrigiendo ese desplazamiento (lo marcó un usuario en un video, 20/10).
      // Solo se vuelve a scrollear si el contenido de arriba realmente cambió de alto.
      donar.classList.add("visible");
      const arriba = () => { let y = 0; for (let n = donar; n; n = n.offsetParent) y += n.offsetTop; return y; };
      let ultima = -1;
      const ir = () => { const y = arriba(); if (Math.abs(y - ultima) > 4) { ultima = y; scrollTo({ top: y, behavior: "instant" }); } };
      const reloj = setInterval(ir, 150);
      const soltar = () => { clearInterval(reloj); ["touchstart", "wheel", "keydown", "pointerdown"].forEach((t) => removeEventListener(t, soltar)); };
      ["touchstart", "wheel", "keydown", "pointerdown"].forEach((t) => addEventListener(t, soltar, { passive: true }));
      setTimeout(soltar, 6000);
    }
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(([e]) => b.classList.toggle("escondido", e.isIntersecting), { threshold: 0.15 }).observe(donar);
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

})();
