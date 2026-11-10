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
      <div class="bt-conectar">
        <label for="bt-usdc">¿Cuántos USDC querés donar?</label>
        <input id="bt-usdc" name="usdc" type="number" min="0.01" step="0.01" value="1" inputmode="decimal">
        <button type="button" class="button button-lime bt-hashpack">Conectar HashPack y donar</button>
        <p class="form-feedback bt-estado" role="status" aria-live="polite"></p>
        <small>Tu billetera te muestra la transferencia y vos la firmás. Nosotros no vemos tu clave.</small>
      </div>
      <p class="bt-o">O hacelo a mano:</p>
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
    // registra una transferencia ya hecha: la API la busca en el Mirror Node antes de anotarla
    const registrar = async (txId) => {
      const r = await fetch(`/api/colectas/${encodeURIComponent(c.id)}/donaciones`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txId }),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(res.error || `Error ${r.status}`), { status: r.status });
      return res;
    };
    // Después de firmar, la plata ya salió: si anotar falla por algo pasajero (el Mirror Node todavía no ve la
    // transferencia, límite de pedidos, corte de red, error del servidor) se reintenta solo. Repetir no duplica:
    // la API rechaza una transferencia ya registrada (409), y eso acá cuenta como hecho.
    const ESPERAS = [3000, 6000, 10000];
    const pasajero = (e) => !e.status || e.status === 429 || e.status >= 500 || (e.status === 400 && /no existe esa transacci/i.test(e.message));
    const registrarConReintentos = async (txId) => {
      for (let intento = 0; ; intento++) {
        try { return await registrar(txId); } catch (e) {
          if (e.status === 409) return { yaEstaba: true };
          if (!pasajero(e) || intento >= ESPERAS.length) throw e;
          await new Promise((ok) => setTimeout(ok, ESPERAS[intento]));
        }
      }
    };

    const form = caja.querySelector(".bt-form");

    // "Conectar HashPack y donar": la librería de la billetera (web/hashpack.js, pesada) se carga recién acá
    let libreria;
    const cargarHashPack = () => (libreria ??= new Promise((ok, mal) => {
      if (window.ColectasHashPack) return ok(window.ColectasHashPack);
      const s = document.createElement("script");
      s.src = "/hashpack.js";
      s.onload = () => (window.ColectasHashPack ? ok(window.ColectasHashPack) : mal(new Error("No se pudo cargar la conexión con la billetera.")));
      s.onerror = () => { libreria = null; mal(new Error("No se pudo cargar la conexión con la billetera.")); };
      document.head.append(s);
    }));
    const conectar = caja.querySelector(".bt-hashpack");
    const estadoHP = caja.querySelector(".bt-estado");
    conectar.addEventListener("click", async () => {
      const decir = (texto, tipo = "") => { estadoHP.className = `form-feedback bt-estado ${tipo}`; estadoHP.textContent = texto; };
      const usdc = Number(caja.querySelector("#bt-usdc").value);
      if (!(usdc > 0)) return decir("Indicá cuántos USDC querés donar.", "error");
      conectar.disabled = true;
      try {
        // 1) la firma: si falla acá, no se movió nada (o la billetera no llegó a avisarnos)
        let pago;
        try {
          decir("Abriendo la conexión con tu billetera…");
          const hp = await cargarHashPack();
          decir("Revisá tu billetera: te va a pedir que conectes y que firmes la transferencia.");
          pago = await hp.donar({ red: red(), token: c.usdcToken, beneficiario: c.beneficiarioCuenta, memo, usdc });
        } catch (e) {
          const m = String(e?.message || e);
          return decir(/reject|rechaz|cancel|denied|closed|expired/i.test(m) ? "Cancelaste la operación en tu billetera. No se movió nada." : `No se pudo completar: ${m} Si en tu billetera figura como enviada, pegá el ID abajo.`, "error");
        }
        // 2) el registro: la plata ya salió, así que un error acá nunca se muestra como "no se pudo donar"
        try {
          decir("Transferencia enviada. Verificando en Hedera…");
          const res = await registrarConReintentos(pago.txId);
          decir(res.yaEstaba ? "Tu donación ya figura registrada en la colecta." : `Donación registrada. Guardá este comprobante: ${res.comprobante}`, "success");
        } catch {
          form.tx.value = pago.txId;
          decir(`Tu transferencia salió bien, pero todavía no pudimos anotarla. No vuelvas a donar. ID: ${pago.txId} — ya quedó cargado abajo: tocá "Registrar mi donación" en unos segundos.`, "error");
        }
      } finally { conectar.disabled = false; }
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const estado = form.querySelector(".form-feedback");
      const boton = form.querySelector("button");
      boton.disabled = true; boton.textContent = "Verificando en Hedera...";
      estado.className = "form-feedback"; estado.textContent = "";
      try {
        const res = await registrar(form.tx.value.trim());
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
