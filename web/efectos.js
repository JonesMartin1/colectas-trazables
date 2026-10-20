// Efectos de toda la web: aparición al hacer scroll (al pasar el mouse las cards solo crecen, con CSS),
// destellos en los héroes y números que cuentan. Si el usuario pidió menos movimiento, solo marca las cards.
(function () {
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-fx");

  const CARDS = ".stat-card,.activity-panel,.action-panel,.campaign-card,.chart-card,.nea-card,.raised-panel,.goal-bar,.step-card,.object-shell";

  const io = "IntersectionObserver" in window && !quieto
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const n = e.target; n.classList.add("visible"); io.unobserve(n); setTimeout(() => (n.style.transitionDelay = ""), 1000); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;

  function preparar() {
    document.querySelectorAll(CARDS).forEach((c) => { c.classList.add("fx-card"); if (!c.classList.contains("reveal") && !c.closest(".reveal, .hero")) c.classList.add("reveal"); });
    document.querySelectorAll(".reveal:not(.visible)").forEach((n, i) => {
      if (!io) return n.classList.add("visible");
      if (!n.dataset.fx) { n.dataset.fx = "1"; n.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(n); }
    });
  }

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

  preparar();
  document.addEventListener("fx:nuevo", preparar);
})();
