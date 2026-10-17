// Vista de una colecta del núcleo (contrato Colecta en Hedera): lee GET /api/nucleo?c=0.0.x y pinta
// estado, entidades, barras por ítem, tramos, comprobantes y la línea de tiempo de eventos. Solo lectura.
(function () {
  if (document.body.dataset.page !== "nucleo") return;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const u = (n) => `${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
  const hs = (tipo, id) => `https://hashscan.io/testnet/${tipo}/${id}`;
  const corto = (h) => `${String(h).slice(0, 10)}…`;
  const contrato = new URLSearchParams(location.search).get("c") || "";

  const ETIQUETAS = {
    Validada: (e) => `${e.esTitular ? "La titular" : "Una entidad"} validó la colecta`,
    Publicada: () => "Se publicó: ya recibe donaciones",
    Donado: (e) => `Donación de ${u(e.monto)} (comisión ${u(e.comision)})`,
    AnonimasReconocidas: (e) => `Donación anónima de ${u(e.monto)}`,
    Atribuido: (e) => `Donación atribuida a un donante: ${u(e.monto)}`,
    CreditosRecibidos: (e) => `Entraron ${u(e.monto)} en créditos de otra colecta`,
    TramoPedido: (e) => `El organizador pidió un tramo de ${u(e.monto)}`,
    TramoLiberado: (e) => `Se liberó un tramo de ${u(e.monto)}`,
    ComprobanteCargado: (e) => `Se cargó un comprobante de ${u(e.monto)} ${e.conCAE ? "(factura con CAE)" : "(ticket)"}`,
    ComprobanteAprobado: (e) => `Comprobante #${e.id} aprobado`,
    ComprobanteRechazado: (e) => `Comprobante #${e.id} rechazado`,
    ReasignacionPedida: (e) => `Pedido de reasignación: ${u(e.monto)}`,
    ReasignacionAprobada: (e) => `Reasignación aprobada${e.avisarDonantes ? " (se avisó a los donantes)" : ""}`,
    Denuncia: (e) => `Un donante denunció el comprobante #${e.comprobante}`,
    Pausada: () => "Colecta pausada",
    Reanudada: () => "Colecta reanudada",
    FraudeConfirmado: () => "La titular confirmó un fraude: el organizador quedó inhabilitado",
    ProrrogaPedida: () => "El organizador pidió una prórroga",
    ProrrogaAprobada: () => "Prórroga aprobada",
    CambioOrganizadorPedido: () => "Cambio de organizador pedido (72 h de espera)",
    CambioOrganizadorHecho: () => "Cambio de organizador hecho",
    Liquidada: (e) => `Liquidada (${esc(e.motivo)}): ${u(e.restante)} volvieron como créditos a los donantes`,
  };

  function pintar(d) {
    document.title = `${d.colectaId} — Colectas Trazables`;
    $("nu-titulo").textContent = d.colectaId;
    const est = [];
    est.push(d.estado.publicada ? '<span class="nu-chip ok">● Publicada</span>' : '<span class="nu-chip">○ Esperando a la titular</span>');
    if (d.estado.pausada && !d.estado.liquidada) est.push('<span class="nu-chip alerta">❚❚ Pausada</span>');
    if (d.estado.fraude) est.push('<span class="nu-chip alerta">⚠ Fraude confirmado</span>');
    if (d.estado.liquidada) est.push('<span class="nu-chip alerta">Liquidada: lo que quedó volvió como créditos</span>');
    est.push(`<span class="nu-chip">Cierra el ${new Date(d.cierre).toLocaleDateString("es-AR")}</span>`);
    $("nu-estado").innerHTML = est.join("");

    const ent = d.validadoras.map((v) => `<a class="nu-chip ${v.esTitular ? "titular" : ""}" href="${hs("account", v.cuenta)}" target="_blank" rel="noopener">${v.esTitular ? "Titular" : "Aval"} · ${esc(v.nombre)} (${esc(v.pais)})</a>`);
    if (!d.validadoras.some((v) => v.esTitular)) ent.unshift(`<span class="nu-chip">Titular pendiente · ${esc(d.titular.nombre)}</span>`);
    $("nu-entidades").innerHTML = ent.join("") + `<a class="nu-chip" href="${hs("account", d.organizador.cuenta)}" target="_blank" rel="noopener">Organizador · ${esc(d.organizador.cuenta)} (identidad verificada · simulada en testnet)</a>`;
    $("nu-links").innerHTML = `Contrato <a href="${d.hashscan}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(d.contrato)}</a> · Plataforma <a href="${hs("contract", d.plataforma)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(d.plataforma)}</a>`;

    const COLORES = ["#8fb02e", "#2775ca", "#d97a2b", "#9b59b6", "#16a085"];
    $("nu-barras").innerHTML = d.items.map((it, i) => {
      const pct = it.meta ? Math.min(100, (it.gastado / it.meta) * 100) : 0;
      const cambio = it.meta !== it.metaOriginal ? ` · meta original ${u(it.metaOriginal)}` : "";
      return `<div class="barra-fila"><header><span>${esc(it.nombre)}${cambio}</span><b>${u(it.gastado)} / ${u(it.meta)}</b></header><div class="barra-pista"><span style="width:${pct}%;background:${COLORES[i % COLORES.length]}"></span></div></div>`;
    }).join("");

    const t = d.totales;
    $("nu-kpis").innerHTML = `<div><strong>${u(t.aportado)}</strong><span>RECAUDADO NETO</span></div><div><strong>${u(t.liberado)}</strong><span>LIBERADO EN TRAMOS</span></div><div><strong>${u(t.justificado)}</strong><span>RENDIDO CON COMPROBANTES</span></div>`;
    const pctTope = t.topeSinRendir ? Math.min(100, (t.sinRendir / t.topeSinRendir) * 100) : 0;
    $("nu-tope").innerHTML = `<p class="nu-nota" style="margin-top:18px"><b>Plata sin rendir:</b> ${u(t.sinRendir)} de un tope de ${u(t.topeSinRendir)} (30 % de la meta). Para pedir más, primero hay que justificar con comprobantes.</p><div class="nu-meter"><span style="width:${pctTope}%"></span></div><p class="nu-nota">Tickets sin factura aprobados: ${u(t.sinFactura)} (tope: 10 % de lo liberado) · En el contrato: ${u(t.enContrato)}</p>`;

    $("nu-comprobantes").innerHTML = d.comprobantes.length
      ? `<tr><th>#</th><th>ÍTEM</th><th>MONTO</th><th>TIPO</th><th>ESTADO</th><th>DENUNCIAS</th></tr>` +
        d.comprobantes.map((c) => `<tr><td>${c.id}</td><td>${esc(d.items[c.item]?.nombre)}</td><td>${u(c.monto)}</td><td>${c.conCAE ? "Factura con CAE" : "Ticket"}</td><td>${c.estado}</td><td>${c.denuncias ? `⚠ ${c.denuncias}` : "—"}</td></tr>`).join("")
      : '<tr><td class="chart-vacio">Todavía no hay comprobantes.</td></tr>';
    $("nu-tramos").innerHTML = d.tramos.length
      ? `<tr><th>#</th><th>MONTO</th><th>ESTADO</th></tr>` + d.tramos.map((r) => `<tr><td>${r.id}</td><td>${u(r.monto)}</td><td>${r.aprobado ? "Liberado" : "Esperando aprobación"}</td></tr>`).join("")
      : '<tr><td class="chart-vacio">Todavía no se pidió ningún tramo.</td></tr>';

    $("nu-eventos").innerHTML = d.eventos.map((e) => {
      const f = ETIQUETAS[e.evento];
      const fecha = new Date(Number(e.timestamp.split(".")[0]) * 1000).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
      return `<li><time>${fecha}</time><span>${f ? f(e) : esc(e.evento)}</span><a href="${e.hashscan}" target="_blank" rel="noopener">Ver en HashScan</a></li>`;
    }).join("") || '<li class="chart-vacio">Sin eventos todavía.</li>';
  }

  fetch(`/api/nucleo${contrato ? `?c=${encodeURIComponent(contrato)}` : ""}`)
    .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || "No se pudo leer la colecta")))))
    .then(pintar)
    .catch((e) => { $("nu-titulo").textContent = "No se pudo leer la colecta"; $("nu-bajada").textContent = e.message; });
})();
