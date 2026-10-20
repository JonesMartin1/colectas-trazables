// Puerta de organizador para gasto.html y entrega.html: antes de mostrar el formulario se pide la clave de
// organizador y se comprueba con POST /api/colectas/:id/organizador. Con el link de organizador (#clave=…) pasa sola.
// La clave queda en sessionStorage solo mientras dure la pestaña. Al publicar, la API la vuelve a comprobar.
(function () {
  const pagina = document.body.dataset.page;
  if (pagina !== "gasto" && pagina !== "entrega") return;
  const id = new URLSearchParams(location.search).get("id");
  const form = document.getElementById(pagina === "gasto" ? "expense-form" : "delivery-form");
  const campo = document.getElementById(pagina === "gasto" ? "organizer-key" : "d-clave");
  if (!id || !form || !campo) return;
  const K = `ct-organizador:${id}`;

  form.hidden = true;
  const puerta = document.createElement("form");
  puerta.className = "expense-form raised-panel puerta-organizador";
  puerta.innerHTML = `<div class="form-head"><span>SOLO ORGANIZADORES</span><span>VERIFICACIÓN</span></div>
    <h2>¿Sos quien organiza esta colecta?</h2>
    <p class="file-note">Para cargar ${pagina === "gasto" ? "un gasto" : "una entrega"}, ingresá la clave de organizador que recibiste al crear la colecta.</p>
    <label for="puerta-clave">Clave del organizador</label>
    <input id="puerta-clave" required autocomplete="off" spellcheck="false" placeholder="La recibiste al crear la colecta">
    <button class="button button-dark" type="submit">Verificar <span aria-hidden="true">↗</span></button>
    <p class="form-feedback" role="status" aria-live="polite"></p>`;
  form.before(puerta);
  const fb = puerta.querySelector(".form-feedback");
  const boton = puerta.querySelector("button");

  async function probar(clave, automatico) {
    boton.disabled = true;
    fb.className = "form-feedback";
    fb.textContent = "Verificando…";
    try {
      const r = await fetch(`/api/colectas/${encodeURIComponent(id)}/organizador`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clave }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo verificar la clave.");
      sessionStorage.setItem(K, clave);
      // ya verificada: el formulario la usa sin volver a pedirla
      campo.value = clave;
      // el campo, su rótulo y su nota se esconden con style (el CSS de los formularios pisa el atributo hidden)
      const nota = campo.nextElementSibling?.classList.contains("file-note") ? campo.nextElementSibling : null;
      [campo, form.querySelector(`label[for="${campo.id}"]`), nota].forEach((n) => n && (n.style.display = "none"));
      puerta.remove();
      form.hidden = false;
    } catch (e) {
      sessionStorage.removeItem(K);
      fb.className = automatico ? "form-feedback" : "form-feedback error";
      fb.textContent = automatico ? "" : e.message;
    } finally {
      boton.disabled = false;
    }
  }
  puerta.addEventListener("submit", (e) => { e.preventDefault(); probar(puerta.querySelector("input").value.trim(), false); });

  // el organizador sí sube archivos (la factura, la foto): botón propio en vez del "Choose File" del navegador
  form.querySelectorAll("input[type=file]").forEach((inp) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-archivo";
    const texto = () => (inp.files[0] ? `✓ ${inp.files[0].name} · cambiar` : (inp.accept || "").startsWith("image") ? "Elegir la foto ↑" : "Elegir el PDF de la factura ↑");
    boton.textContent = texto();
    boton.addEventListener("click", () => inp.click());
    inp.addEventListener("change", () => (boton.textContent = texto()));
    inp.classList.add("archivo-oculto");
    inp.after(boton);
  });

  const guardada = new URLSearchParams(location.hash.slice(1)).get("clave") || sessionStorage.getItem(K);
  if (guardada) probar(guardada, true);
})();
