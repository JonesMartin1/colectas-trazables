// Entregas: el formulario de entrega.html y el panel de entregas que se agrega en colecta.html.
// Va aparte de app.js para no tocar el archivo de Facundo.
(function () {
  const id = new URLSearchParams(location.search).get("id");
  const byId = (x) => document.getElementById(x);
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const safe = (url) => {
    try { const u = new URL(url); return u.protocol === "https:" && u.hostname === "hashscan.io" ? u.href : null; } catch { return null; }
  };
  const fecha = (v) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(v));
  async function sha256File(file) {
    const d = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // ---- formulario (entrega.html)
  if (document.body.dataset.page === "entrega") {
    const back = `/colecta.html?id=${encodeURIComponent(id || "")}`;
    byId("back-link").href = back;
    byId("back-to-collection").href = back;
    const form = byId("delivery-form"), fb = byId("delivery-feedback");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(form);
      const foto = f.get("foto");
      if (!(foto instanceof File) || !foto.size) { fb.className = "form-feedback error"; fb.textContent = "Elegí una foto de la entrega."; return; }
      const btn = form.querySelector("button");
      btn.disabled = true;
      fb.className = "form-feedback"; fb.textContent = "Calculando la huella y registrando…";
      try {
        const payload = { item: f.get("item"), cantidad: Number(f.get("cantidad")), lugar: f.get("lugar"), foto: f.get("fotoRegla"), fotoHash: await sha256File(foto) };
        const r = await fetch(`/api/colectas/${encodeURIComponent(id)}/entregas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
        fb.className = "form-feedback success"; fb.textContent = `Entrega registrada en el mensaje #${d.secuencia}. Volviendo a la colecta…`;
        setTimeout(() => { location.href = back; }, 1700);
      } catch (e) {
        fb.className = "form-feedback error"; fb.textContent = `No se pudo registrar: ${e.message}`;
      } finally { btn.disabled = false; }
    });
  }

  // ---- panel en la página de la colecta (colecta.html)
  if (document.body.dataset.page === "colecta" && id) {
    const grid = document.querySelector(".activity-grid");
    if (!grid) return;
    const panel = el("div", null, "activity-panel");
    panel.style.gridColumn = "1 / -1";
    const head = el("div", null, "activity-panel-head");
    head.append(el("span", "✓"), el("h3", "Entregas"), el("small", "CARGANDO", ""));
    const list = el("div", null, "movement-list");
    const add = el("a", "Registrar una entrega ↗", "quiet-button");
    add.href = `/entrega.html?id=${encodeURIComponent(id)}`;
    add.style.margin = "14px 0 4px"; add.style.display = "inline-block";
    panel.append(head, list, add);
    grid.after(panel);
    fetch(`/api/colectas/${encodeURIComponent(id)}`).then((r) => r.json()).then((d) => {
      const o = d.colecta && d.colecta.organizador;
      const desc = byId("colecta-description");
      if (o && desc) {
        const org = el("p", null, "");
        org.style.cssText = "margin-top:14px;font-size:14px;opacity:.9";
        const b = el("strong", `Organiza: ${o.nombre}`);
        org.append(b, ` · ${o.tipo} · CUIT ${o.cuit} · IGPJ: ${o.igpj}`);
        desc.after(org);
      }
      const entregas = Array.isArray(d.entregas) ? d.entregas : [];
      head.querySelector("small").textContent = `${entregas.length} ${entregas.length === 1 ? "ENTREGA" : "ENTREGAS"}`;
      if (!entregas.length) { list.append(el("p", "Todavía no hay entregas registradas.", "empty-state")); return; }
      for (const e of entregas) {
        const row = el("div", null, "movement");
        const main = el("span", null, "movement-main");
        main.append(el("strong", `${e.cantidad} × ${e.item}`), el("small", `#${e.secuencia} · ${e.lugar} · ${fecha(e.fecha)}`));
        row.append(el("span", "✓", "movement-icon"), main);
        const u = safe(e.hashscan);
        if (u) { const a = el("a", "Ver registro ↗"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; row.append(a); }
        list.append(row);
        // comprobar la foto: quien tenga la foto puede ver que es la misma que se registró
        if (/^[a-f0-9]{64}$/.test(e.fotoHash || "")) {
          const chk = el("label", "Comprobá la foto: ", "invoice-check");
          const inp = el("input"); inp.type = "file"; inp.accept = "image/*";
          const res = el("span", null, "invoice-result");
          inp.addEventListener("change", async () => {
            if (!inp.files[0]) return;
            res.textContent = (await sha256File(inp.files[0])) === e.fotoHash ? "Coincide con el registro ✓" : "Esta foto no coincide";
          });
          chk.append(inp, res);
          list.append(chk);
        }
      }
    }).catch(() => { head.querySelector("small").textContent = "SIN DATOS"; });
  }
})();
