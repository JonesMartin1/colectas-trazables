// Donar con Mercado Pago en colecta.html. Va aparte de app.js para no tocar el archivo de Facundo.
// Agrega montos rápidos y el botón de Mercado Pago como opción principal; la billetera USDC de prueba queda debajo.
// Al volver de MP, la URL trae payment_id: el comprobante es "mp-<payment_id>" y se verifica igual que los demás.
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id");
  const form = document.getElementById("donate-form");
  if (!id || !form) return;
  const input = form.querySelector("[name=monto]");
  const usdc = document.getElementById("donate-button");

  // montos rápidos
  const rapidos = document.createElement("div");
  rapidos.className = "monto-rapido";
  rapidos.setAttribute("aria-label", "Montos rápidos");
  for (const m of [1000, 5000, 10000, 25000]) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `$ ${m.toLocaleString("es-AR")}`;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      input.value = m;
      rapidos.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    });
    rapidos.append(b);
  }
  input.closest(".amount-field").after(rapidos);
  input.addEventListener("input", () => rapidos.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")));

  // botón de Mercado Pago (logo recreado en SVG: apretón de manos dentro del óvalo)
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "mp-button";
  boton.innerHTML =
    '<span class="mp-logo" aria-hidden="true"><svg viewBox="0 0 40 26"><ellipse cx="20" cy="13" rx="18.5" ry="11.5" fill="#fff" stroke="#00b1ea" stroke-width="2"/>' +
    '<path d="M6 13.5l5.5-4.5 4 1.6 4.5-3 4.5 3 4-1.6 5.5 4.5" fill="none" stroke="#0a3d8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M12.5 14.5l3.5 3 2.2-1.5 2.3 2 2.2-1.6 2.3 1.6 2.5-2.5" fill="none" stroke="#0a3d8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
    "<span>Donar con Mercado Pago</span>";
  const seguro = document.createElement("p");
  seguro.className = "mp-seguro";
  seguro.textContent = "🔒 Pagás en Mercado Pago: la plata va directo a la organización.";
  const separador = document.createElement("div");
  separador.className = "donar-o";
  separador.textContent = "O CON CRIPTO (DEMO)";
  usdc.before(boton, seguro, separador);

  const aviso = form.querySelector("#donate-feedback");
  boton.addEventListener("click", async () => {
    const monto = Number(input.value);
    if (!(monto > 0)) { aviso.className = "form-feedback error"; aviso.textContent = "Elegí o escribí el monto de la donación."; input.focus(); return; }
    boton.disabled = true;
    aviso.className = "form-feedback"; aviso.textContent = "Abriendo Mercado Pago…";
    try {
      const r = await fetch(`/api/colectas/${encodeURIComponent(id)}/mercadopago`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monto }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
      location.href = d.urlPrueba || d.url; // en la demo, el checkout de prueba
    } catch (e) {
      aviso.className = "form-feedback error"; aviso.textContent = e.message;
      boton.disabled = false;
    }
  });

  // vuelta desde Mercado Pago
  const q = new URLSearchParams(location.search);
  const pago = q.get("payment_id") || q.get("collection_id");
  if (pago && /^\d+$/.test(pago) && (q.get("status") || q.get("collection_status")) === "approved") {
    aviso.className = "form-feedback success";
    aviso.textContent = `¡Gracias! Tu pago se está registrando en Hedera. Guardá este comprobante: mp-${pago}`;
    const verificar = document.getElementById("receipt-code");
    if (verificar) verificar.value = `mp-${pago}`;
  }
})();
