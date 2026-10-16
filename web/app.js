const EXAMPLE_ID = "inundados-paso-de-los-libres";
const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(value) || 0);
const date = (value) => value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";
const byId = (id) => document.getElementById(id);
const campaignId = new URLSearchParams(location.search).get("id") || EXAMPLE_ID;
let liveCampaign = false;

function feedback(element, message, type = "") {
  element.textContent = message;
  element.className = `form-feedback ${type}`;
}

async function requestJSON(url, options) {
  const response = await fetch(url, options);
  let data;
  try { data = await response.json(); } catch { throw new Error("La respuesta del servidor no es válida."); }
  if (!response.ok) throw new Error(data.error || data.mensaje || `Error ${response.status}`);
  return data;
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  button.style.opacity = busy ? ".6" : "";
  if (busy) {
    button.dataset.original = button.innerHTML;
    button.textContent = label;
  } else if (button.dataset.original) {
    button.innerHTML = button.dataset.original;
    delete button.dataset.original;
  }
}

function safeLink(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "hashscan.io" ? parsed.href : null;
  } catch { return null; }
}

function renderMovements(container, movements, kind) {
  container.replaceChildren();
  if (!movements.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = kind === "donation" ? "Todavía no hay donaciones registradas." : "Todavía no hay gastos registrados.";
    container.append(empty);
    return;
  }
  for (const movement of movements) {
    const row = document.createElement("div");
    row.className = "movement";
    const icon = document.createElement("span");
    icon.className = "movement-icon";
    icon.textContent = kind === "donation" ? "↘" : "↗";
    const details = document.createElement("span");
    details.className = "movement-main";
    const amount = document.createElement("strong");
    amount.textContent = money(movement.monto);
    const when = document.createElement("small");
    when.textContent = `#${movement.secuencia ?? "—"} · ${date(movement.fecha)}`;
    details.append(amount, when);
    row.append(icon, details);
    const url = safeLink(movement.hashscan);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Ver registro ↗";
      row.append(link);
    }
    container.append(row);
    if (kind === "expense" && movement.invoiceHash && /^[a-f0-9]{64}$/i.test(movement.invoiceHash)) {
      const checker = document.createElement("label");
      checker.className = "invoice-check";
      checker.textContent = "Verificá la factura: ";
      const file = document.createElement("input");
      file.type = "file";
      file.accept = "application/pdf,.pdf";
      const result = document.createElement("span");
      result.className = "invoice-result";
      file.addEventListener("change", async () => {
        if (!file.files[0]) return;
        const hash = await sha256File(file.files[0]);
        result.textContent = hash.toLowerCase() === movement.invoiceHash.toLowerCase() ? "Coincide con el registro ✓" : "Esta factura no coincide";
      });
      checker.append(file, result);
      container.append(checker);
    }
  }
}

async function sha256File(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function renderCampaign(data, isExample) {
  const campaign = data.colecta || {};
  byId("colecta-title").textContent = campaign.titulo || "Colecta";
  byId("colecta-description").textContent = campaign.descripcion || "Seguí el recorrido de esta ayuda.";
  byId("colecta-mode").textContent = isExample ? "· EJEMPLO" : "· REGISTRO PÚBLICO";
  byId("sample-banner").hidden = !isExample;
  byId("donate-button").disabled = isExample;
  byId("donate-button").innerHTML = isExample ? "Donación no disponible en el ejemplo" : 'Donar (demo USDC) <span aria-hidden="true">↗</span>';
  byId("topic-id").textContent = `Registro: ${campaign.topicId || "no disponible"}`;
  const totals = data.totales || {};
  byId("total-recaudado").textContent = money(totals.recaudado);
  byId("total-gastado").textContent = money(totals.gastado);
  byId("total-saldo").textContent = money(totals.saldo);
  const progress = campaign.meta > 0 ? Math.min(100, (Number(totals.recaudado) || 0) / campaign.meta * 100) : 0;
  byId("goal-label").textContent = `${progress.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% de ${money(campaign.meta)}`;
  byId("goal-fill").style.width = `${progress}%`;
  const donations = Array.isArray(data.donaciones) ? data.donaciones : [];
  const expenses = Array.isArray(data.gastos) ? data.gastos : [];
  byId("donation-count").textContent = `${donations.length} ${donations.length === 1 ? "MOVIMIENTO" : "MOVIMIENTOS"}`;
  byId("expense-count").textContent = `${expenses.length} ${expenses.length === 1 ? "MOVIMIENTO" : "MOVIMIENTOS"}`;
  renderMovements(byId("donations-list"), donations, "donation");
  renderMovements(byId("expenses-list"), expenses, "expense");
}

async function loadCampaign() {
  byId("expense-link").href = `/gasto.html?id=${encodeURIComponent(campaignId)}`;
  try {
    const data = await requestJSON(`/api/colectas/${encodeURIComponent(campaignId)}`);
    liveCampaign = true;
    renderCampaign(data, false);
  } catch (error) {
    if (campaignId !== EXAMPLE_ID) {
      byId("colecta-title").textContent = "No pudimos cargar la colecta";
      byId("colecta-description").textContent = error.message;
      byId("colecta-mode").textContent = "· SIN DATOS";
      byId("donate-button").textContent = "Donación no disponible";
      return;
    }
    try {
      const data = await requestJSON("/ejemplo/colecta.json");
      renderCampaign(data, true);
    } catch {
      byId("colecta-description").textContent = "No se pudo cargar la colecta de ejemplo.";
    }
  }
}

function setupCreate() {
  const form = byId("create-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("create-feedback");
    const button = form.querySelector("button[type=submit]");
    const fields = new FormData(form);
    const payload = {
      titulo: String(fields.get("titulo")).trim(),
      descripcion: String(fields.get("descripcion")).trim(),
      meta: Number(fields.get("meta")),
      beneficiarioCuenta: String(fields.get("beneficiarioCuenta")).trim(),
      organizador: {
        nombre: String(fields.get("orgNombre") || "").trim(),
        tipo: String(fields.get("orgTipo") || ""),
        cuit: String(fields.get("orgCuit") || "").trim(),
        igpj: String(fields.get("orgIgpj") || "").trim()
      }
    };
    setBusy(button, true, "Creando colecta...");
    try {
      const result = await requestJSON("/api/colectas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      feedback(status, "Colecta creada. Abriendo su página...", "success");
      location.href = `/colecta.html?id=${encodeURIComponent(result.id)}`;
    } catch (error) {
      feedback(status, `No se pudo crear la colecta: ${error.message}`, "error");
    } finally { setBusy(button, false); }
  });
}

function setupDonation() {
  const form = byId("donate-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("donate-feedback");
    if (!liveCampaign) return feedback(status, "Esta es una vista de ejemplo. Las donaciones se habilitan al conectar la API.", "error");
    const button = form.querySelector("button[type=submit]");
    setBusy(button, true, "Registrando...");
    try {
      const result = await requestJSON(`/api/colectas/${encodeURIComponent(campaignId)}/donaciones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monto: Number(new FormData(form).get("monto")) }) });
      feedback(status, `Donación registrada. Guardá este comprobante: ${result.comprobante}`, "success");
      await loadCampaign();
    } catch (error) { feedback(status, error.message, "error"); }
    finally { setBusy(button, false); }
  });
}

function setupVerification() {
  const form = byId("verify-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("verify-feedback");
    if (!liveCampaign) return feedback(status, "La verificación requiere una colecta conectada a la API.", "error");
    const receipt = String(new FormData(form).get("comprobante")).trim();
    const button = form.querySelector("button[type=submit]");
    setBusy(button, true, "Buscando...");
    try {
      const result = await requestJSON(`/api/colectas/${encodeURIComponent(campaignId)}/verificar?comprobante=${encodeURIComponent(receipt)}`);
      if (!result.encontrada) return feedback(status, "No encontramos este comprobante en la colecta.", "error");
      const url = safeLink(result.hashscan);
      status.replaceChildren();
      status.className = "form-feedback success";
      status.append(document.createTextNode(`Donación encontrada · registro #${result.secuencia}. `));
      if (url) {
        const link = document.createElement("a");
        link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Ver en Hedera ↗";
        status.append(link);
      }
    } catch (error) { feedback(status, error.message, "error"); }
    finally { setBusy(button, false); }
  });
}

function setupExpense() {
  const url = `/colecta.html?id=${encodeURIComponent(campaignId)}`;
  byId("back-to-collection").href = url;
  byId("back-link").href = url;
  const form = byId("expense-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("expense-feedback");
    const fields = new FormData(form);
    const file = fields.get("factura");
    if (!(file instanceof File) || file.type !== "application/pdf") return feedback(status, "Elegí una factura en PDF.", "error");
    const button = form.querySelector("button[type=submit]");
    setBusy(button, true, "Calculando y publicando...");
    try {
      const invoiceHash = await sha256File(file);
      const payload = { monto: Number(fields.get("monto")), proveedorCuit: String(fields.get("proveedorCuit")).trim(), cae: String(fields.get("cae")).trim(), invoiceHash };
      const result = await requestJSON(`/api/colectas/${encodeURIComponent(campaignId)}/gastos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      feedback(status, `Gasto publicado en el registro #${result.secuencia}. Volviendo a la colecta... `, "success");
      setTimeout(() => { location.href = url; }, 1700);
    } catch (error) { feedback(status, `No se pudo publicar: ${error.message}`, "error"); }
    finally { setBusy(button, false); }
  });
}

if (document.body.dataset.page === "home") setupCreate();
if (document.body.dataset.page === "colecta") {
  loadCampaign();
  setupDonation();
  setupVerification();
  byId("share-button").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); byId("share-button").textContent = "Enlace copiado ✓"; }
    catch { byId("share-button").textContent = "Copiá la dirección de esta página"; }
  });
}
if (document.body.dataset.page === "gasto") setupExpense();
