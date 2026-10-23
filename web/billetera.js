// "Doná desde tu billetera" (colecta.html): para quien tiene HashPack u otra billetera de Hedera. La persona
// manda USDC a la billetera de la colecta con el memo de la colecta, desde su billetera (firma ella, no nosotros),
// y pega acá el ID de la transacción. La API la busca en el Mirror Node y la registra solo si salió bien, fue a esta
// billetera y lleva el memo: es la misma verificación que usa la demo. Cuando haya Project ID de Reown, el paso de
// copiar y pegar se reemplaza por "Conectar HashPack".
(function () {
  const panel = document.getElementById("donar");
  const id = new URLSearchParams(location.search).get("id");
  if (!panel || !id) return;
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const red = () => window.HEDERA_RED || "testnet";

  fetch(`/api/colectas/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
    const c = d?.colecta;
    if (!c?.beneficiarioCuenta || !c.usdcToken) return;
    const memo = `colecta:${c.id}`;
    const fila = (etiqueta, valor) => `<div class="bt-fila"><span>${etiqueta}</span><code>${esc(valor)}</code><button type="button" class="bt-copiar" data-copiar="${esc(valor)}">Copiar</button></div>`;
    const caja = document.createElement("details");
    caja.className = "billetera-propia";
    caja.innerHTML = `<summary>¿Tenés HashPack? Doná desde tu billetera</summary>
      <ol>
        <li>En tu billetera${red() === "testnet" ? " (en <b>testnet</b>)" : ""}, mandá USDC a la cuenta de la colecta y escribí el memo tal cual:
          ${fila("Cuenta", c.beneficiarioCuenta)}${fila("Memo", memo)}${fila(red() === "testnet" ? "Token" : "Token USDC", c.usdcToken)}</li>
        <li>Copiá el ID de la transacción (en HashPack, en el detalle del envío) y pegalo acá:</li>
      </ol>
      <form class="bt-form"><input name="tx" required placeholder="0.0.12345@1761234567.123456789" autocomplete="off" spellcheck="false"><button class="button button-dark" type="submit">Registrar mi donación</button><p class="form-feedback" role="status" aria-live="polite"></p></form>
      <small>La plata no pasa por nosotros: va de tu billetera a la de la colecta. Solo verificamos la transferencia en Hedera y la anotamos.</small>`;
    panel.append(caja);

    caja.addEventListener("click", (ev) => {
      const b = ev.target.closest(".bt-copiar");
      if (!b) return;
      navigator.clipboard?.writeText(b.dataset.copiar).then(() => { b.textContent = "Copiado"; setTimeout(() => (b.textContent = "Copiar"), 1500); });
    });
    const form = caja.querySelector(".bt-form");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const estado = form.querySelector(".form-feedback");
      const boton = form.querySelector("button");
      boton.disabled = true; boton.textContent = "Verificando en Hedera...";
      estado.className = "form-feedback"; estado.textContent = "";
      try {
        const r = await fetch(`/api/colectas/${encodeURIComponent(c.id)}/donaciones`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txId: form.tx.value.trim() }),
        });
        const res = await r.json();
        if (!r.ok) throw new Error(res.error || `Error ${r.status}`);
        estado.className = "form-feedback success";
        estado.textContent = `Donación registrada. Guardá este comprobante: ${res.comprobante}`;
        form.tx.value = "";
      } catch (e) {
        estado.className = "form-feedback error";
        estado.textContent = /no se encontr|not found|todavía/i.test(e.message) ? `${e.message} Si la mandaste recién, esperá unos segundos y probá de nuevo.` : e.message;
      } finally { boton.disabled = false; boton.textContent = "Registrar mi donación"; }
    });
  }).catch(() => {});
})();
