// "¿Este alias es real?": consulta /api/alias y muestra verde (oficial), amarillo (se parece a uno oficial) o rojo.
(function () {
  const form = document.getElementById("alias-form");
  const input = document.getElementById("alias-input");
  const out = document.getElementById("alias-result");
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const safe = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "https:" && u.hostname === "hashscan.io" ? u.href : null;
    } catch { return null; }
  };
  const link = (url, text) => {
    const a = el("a", text);
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    return a;
  };

  function show(cls, nodes) {
    out.className = `alias-result show ${cls}`;
    out.replaceChildren(...nodes);
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const alias = input.value.trim();
    const button = form.querySelector("button");
    button.disabled = true;
    show("", [el("p", "Consultando el registro en Hedera…")]);
    try {
      const r = await fetch(`/api/alias?alias=${encodeURIComponent(alias)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
      if (d.estado === "oficial") {
        const signers = el("div", null, "signers");
        for (const f of d.firmantes || []) signers.append(el("span", `✓ ${f}`));
        const meta = el("small");
        meta.append(`Registrado el ${new Date(d.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })} · mensaje #${d.secuencia}. `);
        const u = safe(d.hashscan);
        if (u) meta.append(link(u, "Ver en Hedera ↗"));
        show("r-ok", [el("span", "OFICIAL", "badge"), el("h2", d.alias), el("p", `Titular: ${d.titular}`), el("p", "Firmado por:"), signers, meta]);
      } else if (d.estado === "parecido") {
        const p = d.parecidos[0];
        show("r-warn", [
          el("span", "¡CUIDADO!", "badge"),
          el("h2", `${d.alias} no es oficial`),
          el("p", `Se parece mucho a "${p.alias}" (${p.titular}), que sí está registrado. Puede ser una estafa: no transfieras y revisá el alias letra por letra.`),
        ]);
      } else {
        show("r-bad", [
          el("span", "NO REGISTRADO", "badge"),
          el("h2", `${d.alias} no está en el registro`),
          el("p", "Ninguna institución firmó este alias. Antes de transferir, pedí el alias oficial a quien organiza la colecta."),
        ]);
      }
    } catch (e) {
      show("r-bad", [el("p", `No se pudo consultar: ${e.message}`)]);
    } finally {
      button.disabled = false;
    }
  });
})();
