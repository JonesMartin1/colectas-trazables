// Efectos de toda la web: aparición al hacer scroll, hover con inclinación,
// destellos en los héroes y números que cuentan. Si el usuario pidió menos movimiento, solo marca las cards.
(function () {
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-fx");

  const CARDS = ".stat-card,.activity-panel,.action-panel,.campaign-card,.chart-card,.nea-card,.raised-panel,.goal-bar,.step-card,.object-shell";
  const INCLINAN = ".campaign-card,.nea-card,.chart-card,.stat-card,.step-card,.object-shell";

  const io = "IntersectionObserver" in window && !quieto
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;

  function preparar() {
    document.querySelectorAll(CARDS).forEach((c) => { c.classList.add("fx-card"); if (!c.classList.contains("reveal") && !c.closest(".reveal, .hero")) c.classList.add("reveal"); });
    document.querySelectorAll(".reveal:not(.visible)").forEach((n, i) => {
      if (!io) return n.classList.add("visible");
      if (!n.dataset.fx) { n.dataset.fx = "1"; n.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(n); }
    });
  }

  // inclinación 3D (la mancha de color que seguía al mouse se sacó)
  document.addEventListener("pointermove", (e) => {
    const c = e.target.closest?.(".fx-card");
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    if (!quieto && c.matches(INCLINAN)) {
      c.style.setProperty("--rx", `${(0.5 - py) * 8}deg`);
      c.style.setProperty("--ry", `${(px - 0.5) * 10}deg`);
    }
  });
  document.addEventListener("pointerout", (e) => {
    const c = e.target.closest?.(".fx-card");
    if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
  });

  // (los destellos de los héroes se sacaron: el jurado pidió menos efecto tecnológico y más foco en lo humano)

  // números que cuentan: cuando app.js escribe un monto en las tarjetas de balance, se anima desde 0
  const formato = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  document.querySelectorAll(".stat-card strong").forEach((n) => {
    // El observer avisa después (microtarea), así que una bandera alrededor de la escritura no alcanza:
    // se reconoce lo propio comparando los dígitos con lo último escrito (i18n puede cambiar el formato, no el número),
    // y cada monto nuevo corta la animación anterior.
    const digitos = (s) => s.replace(/\D/g, "");
    let escrito = null, turno = 0;
    new MutationObserver(() => {
      if (quieto || (escrito !== null && digitos(n.textContent) === digitos(escrito))) return;
      const signo = /[-−]/.test(n.textContent) ? -1 : 1;
      const valor = Number(digitos(n.textContent));
      if (!(valor > 0)) return;
      const card = n.closest(".stat-card"), t0 = performance.now(), ms = 1300, este = ++turno;
      card?.classList.add("contando");
      const paso = (t) => {
        if (este !== turno) return;
        const k = Math.min(1, Math.max(0, (t - t0) / ms));
        escrito = n.textContent = formato.format(signo * Math.round(valor * (1 - Math.pow(1 - k, 3))) || 0);
        if (k < 1) requestAnimationFrame(paso); else card?.classList.remove("contando");
      };
      requestAnimationFrame(paso);
    }).observe(n, { childList: true, characterData: true, subtree: true });
  });

  // verificadores de factura y de foto: el selector de archivo del navegador sale en inglés ("Choose File") y sin
  // estilo. Se oculta (sigue siendo accesible con teclado) y en su lugar va un botón propio dentro del mismo label.
  function botonArchivo(inp) {
    if (inp.dataset.boton) return;
    const lab = inp.closest(".invoice-check");
    if (!lab) return;
    inp.dataset.boton = "1";
    [...lab.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => n.remove());
    const boton = document.createElement("span");
    boton.className = "boton-archivo";
    boton.setAttribute("aria-hidden", "true");
    boton.textContent = (inp.accept || "").startsWith("image") ? "Subí la foto para comprobarla ↑" : "Subí la factura para verificarla ↑";
    inp.setAttribute("aria-label", boton.textContent);
    inp.classList.add("archivo-oculto");
    inp.after(boton);
  }
  const archivos = () => document.querySelectorAll(".invoice-check input[type=file]").forEach(botonArchivo);
  new MutationObserver(archivos).observe(document.body, { childList: true, subtree: true });

  preparar();
  archivos();
  document.addEventListener("fx:nuevo", preparar);
})();
