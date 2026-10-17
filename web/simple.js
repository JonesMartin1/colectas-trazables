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
    [".trust-strip", ".manifesto", ".campaign-section"].forEach((s) => document.querySelector(s)?.classList.add("oculto"));
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
