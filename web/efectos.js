// Efectos de toda la web: aparición al hacer scroll, hover con inclinación y luz que sigue al mouse,
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

  // luz que sigue al mouse e inclinación 3D
  document.addEventListener("pointermove", (e) => {
    const c = e.target.closest?.(".fx-card");
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty("--mx", `${px * 100}%`);
    c.style.setProperty("--my", `${py * 100}%`);
    if (!quieto && c.matches(INCLINAN)) {
      c.style.setProperty("--rx", `${(0.5 - py) * 8}deg`);
      c.style.setProperty("--ry", `${(px - 0.5) * 10}deg`);
    }
  });
  document.addEventListener("pointerout", (e) => {
    const c = e.target.closest?.(".fx-card");
    if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
  });

  // destellos en los héroes
  if (!quieto) {
    document.querySelectorAll(".hero,.page-hero,.nea-section").forEach((h) => {
      for (let i = 0; i < 22; i++) {
        const s = document.createElement("span");
        s.className = "sparkle";
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 100}%`;
        s.style.setProperty("--d", `${2 + Math.random() * 3}s`);
        s.style.setProperty("--delay", `${Math.random() * 4}s`);
        const t = 3 + Math.random() * 5;
        s.style.width = s.style.height = `${t}px`;
        h.append(s);
      }
    });
  }

  // números que cuentan: cuando app.js escribe un monto en las tarjetas de balance, se anima desde 0
  const formato = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  document.querySelectorAll(".stat-card strong").forEach((n) => {
    let propio = false;
    new MutationObserver(() => {
      if (propio || quieto) return;
      const signo = /[-−]/.test(n.textContent) ? -1 : 1;
      const valor = Number(n.textContent.replace(/\D/g, ""));
      if (!(valor > 0)) return;
      const card = n.closest(".stat-card"), t0 = performance.now(), ms = 1300;
      card?.classList.add("contando");
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        propio = true; n.textContent = formato.format(signo * Math.round(valor * (1 - Math.pow(1 - k, 3))) || 0); propio = false;
        if (k < 1) requestAnimationFrame(paso); else card?.classList.remove("contando");
      };
      requestAnimationFrame(paso);
    }).observe(n, { childList: true, characterData: true, subtree: true });
  });

  preparar();
  document.addEventListener("fx:nuevo", preparar);
})();
