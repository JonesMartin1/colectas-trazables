// Identidad TRAMA: logo nuevo en header y footer, y el interruptor de modo soleado / nocturno.
// Va sin defer en el <head> para aplicar el tema guardado antes de pintar (si no, parpadea). Por defecto, soleado.
(function () {
  const raiz = document.documentElement;
  const leer = () => { try { return localStorage.getItem("tema"); } catch { return null; } };
  const guardar = (t) => { try { localStorage.setItem("tema", t); } catch {} };

  function aplicar(tema) {
    raiz.dataset.tema = tema;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = tema === "oscuro" ? "#0b1f1e" : "#f4f6f5";
    const boton = document.querySelector(".tema-switch");
    if (boton) {
      boton.setAttribute("aria-checked", String(tema === "oscuro"));
      boton.title = tema === "oscuro" ? "Pasar a modo soleado" : "Pasar a modo nocturno";
    }
  }
  aplicar(leer() === "oscuro" ? "oscuro" : "claro");

  const MARCA = `<svg class="marca-svg" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M38 13 9 44l26 29" fill="none" stroke="var(--marca-trazo)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M42 39h37M60 39v48" fill="none" stroke="#18B5A6" stroke-width="15" stroke-linecap="round"/>
    <circle cx="38" cy="13" r="9.5" fill="var(--marca-trazo)"/><circle cx="88" cy="21" r="11" fill="#C8FF64"/>
    <circle cx="79" cy="39" r="9" fill="var(--marca-trazo)"/><circle cx="34" cy="76" r="10" fill="#C8FF64"/></svg>`;
  const LOGO = `${MARCA}<span class="marca-texto"><b>Colectas</b><b>Trazables</b></span><span class="marca-lema">La solidaridad se ve.</span>`;

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector('link[rel="icon"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="/img/icono.svg" type="image/svg+xml">');
    document.querySelectorAll(".brand").forEach((b) => { b.classList.add("marca"); b.innerHTML = LOGO; });

    const header = document.querySelector(".site-header");
    if (!header || header.querySelector(".tema-switch")) return;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tema-switch";
    boton.setAttribute("role", "switch");
    boton.setAttribute("aria-label", "Modo nocturno");
    boton.innerHTML = '<span class="tema-sol" aria-hidden="true">☀</span><span class="tema-pista"><span class="tema-bolita"></span></span><span class="tema-luna" aria-hidden="true">☾</span>';
    boton.addEventListener("click", () => {
      const tema = raiz.dataset.tema === "oscuro" ? "claro" : "oscuro";
      raiz.classList.add("tema-cambiando");
      aplicar(tema);
      guardar(tema);
      setTimeout(() => raiz.classList.remove("tema-cambiando"), 450);
    });
    const accion = header.querySelector(".nav-action");
    accion ? accion.before(boton) : header.append(boton);
    aplicar(raiz.dataset.tema);
  });
})();
