// Avisos oficiales: lista de partes firmados (más nuevo arriba) y la serie de la cifra de evacuados.
(function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
  const safe = (url) => { try { const u = new URL(url); return u.protocol === "https:" && u.hostname === "hashscan.io" ? u.href : null; } catch { return null; } };
  const dia = (s) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(s + "T12:00:00Z"));
  const registrado = (s) => new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(s));
  const ETIQ = { evacuados: "evacuados", autoevacuados: "autoevacuados", localidades: "localidades" };

  fetch("/api/avisos").then((r) => r.json()).then((d) => {
    if (d.error) throw new Error(d.error);
    const canal = $("canal");
    canal.textContent = "";
    const u = safe(d.hashscan);
    canal.append(`Canal ${d.canal}, firmado solo por Defensa Civil. `);
    if (u) { const a = el("a", "Ver el canal en Hedera ↗"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; a.style.textDecoration = "underline"; canal.append(a); }
    canal.append(el("br"), "Demo: las cifras están tomadas de la prensa y cada aviso indica su fuente. No son partes oficiales.");

    const lista = $("lista");
    for (const a of d.avisos) {
      const card = el("article", null, "aviso");
      const meta = el("div", null, "meta");
      meta.append(el("span", `${a.emisor} · ${a.localidad || ""}`), el("span", a.fechaParte ? dia(a.fechaParte) : ""));
      const badge = el("span", a.tipo === "alerta" ? "ALERTA" : "PARTE", a.tipo === "alerta" ? "badge alerta" : "badge");
      card.append(meta, el("div", null, ""), badge, el("h2", a.titulo));
      if (a.cifras) {
        const c = el("div", null, "cifras");
        for (const [k, v] of Object.entries(a.cifras)) { const box = el("div"); box.append(el("strong", Number(v).toLocaleString("es-AR")), ETIQ[k] || k); c.append(box); }
        card.append(c);
      }
      if (a.texto) card.append(el("p", a.texto));
      if (a.fuente) card.append(el("p", `Fuente: ${a.fuente}`, "fuente"));
      const pie = el("p", `Registrado el ${registrado(a.fecha)} · mensaje #${a.secuencia} · `);
      const hu = safe(a.hashscan);
      if (hu) { const link = el("a", "Ver en Hedera ↗"); link.href = hu; link.target = "_blank"; link.rel = "noopener noreferrer"; pie.append(link); }
      card.append(pie);
      lista.append(card);
    }

    // serie de evacuados, en orden cronológico del parte
    const serie = d.avisos.filter((a) => a.cifras && a.cifras.evacuados != null).sort((x, y) => (x.fechaParte || "").localeCompare(y.fechaParte || "") || x.secuencia - y.secuencia);
    if (serie.length > 1) {
      $("serie").hidden = false;
      const rows = $("serie-rows");
      for (const a of serie) {
        const row = el("div", null, "serie-row");
        row.append(el("span", `${a.fechaParte ? dia(a.fechaParte) : ""} · mensaje #${a.secuencia}`), el("strong", Number(a.cifras.evacuados).toLocaleString("es-AR")));
        rows.append(row);
      }
    }
  }).catch((e) => { $("canal").textContent = `No se pudo consultar el canal: ${e.message}`; });
})();
