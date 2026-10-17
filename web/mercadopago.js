// Donar con Mercado Pago en colecta.html. Va aparte de app.js para no tocar el archivo de Facundo.
// Al volver de MP, la URL trae payment_id: el comprobante es "mp-<payment_id>" y se verifica igual que los demás.
(function () {
  if (document.body.dataset.page !== "colecta") return;
  const id = new URLSearchParams(location.search).get("id");
  const form = document.getElementById("donate-form");
  if (!id || !form) return;

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "button button-dark";
  boton.textContent = "Donar con Mercado Pago ↗";
  const aviso = document.createElement("p");
  aviso.className = "form-feedback";
  aviso.setAttribute("role", "status");
  form.after(boton, aviso);

  boton.addEventListener("click", async () => {
    const monto = Number(new FormData(form).get("monto"));
    if (!(monto > 0)) { aviso.className = "form-feedback error"; aviso.textContent = "Escribí el monto de la donación."; return; }
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
