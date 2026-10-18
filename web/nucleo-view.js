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
        // data-label: en el celular cada fila se muestra como tarjeta con su etiqueta (movil.css)
        d.comprobantes.map((c) => `<tr><td class="nu-num" data-label="Comprobante #">${c.id}</td><td data-label="Ítem">${esc(d.items[c.item]?.nombre)}</td><td data-label="Monto">${u(c.monto)}</td><td data-label="Tipo">${c.conCAE ? "Factura con CAE" : "Ticket"}</td><td data-label="Estado">${c.estado}</td><td data-label="Denuncias">${c.denuncias ? `⚠ ${c.denuncias}` : "—"}</td></tr>`).join("")
      : '<tr><td class="chart-vacio">Todavía no hay comprobantes.</td></tr>';
    $("nu-tramos").innerHTML = d.tramos.length
      ? `<tr><th>#</th><th>MONTO</th><th>ESTADO</th></tr>` + d.tramos.map((r) => `<tr><td class="nu-num" data-label="Tramo #">${r.id}</td><td data-label="Monto">${u(r.monto)}</td><td data-label="Estado">${r.aprobado ? "Liberado" : "Esperando aprobación"}</td></tr>`).join("")
      : '<tr><td class="chart-vacio">Todavía no se pidió ningún tramo.</td></tr>';

    $("nu-eventos").innerHTML = d.eventos.map((e) => {
      const f = ETIQUETAS[e.evento];
      const fecha = new Date(Number(e.timestamp.split(".")[0]) * 1000).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
      return `<li><time>${fecha}</time><span>${f ? f(e) : esc(e.evento)}</span><a href="${e.hashscan}" target="_blank" rel="noopener">Ver en HashScan</a></li>`;
    }).join("") || '<li class="chart-vacio">Sin eventos todavía.</li>';
  }

  let actual = null;
  const cargar = () =>
    fetch(`/api/nucleo${contrato ? `?c=${encodeURIComponent(contrato)}` : ""}`)
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || "No se pudo leer la colecta")))))
      .then((d) => { actual = d; pintar(d); armarCampos(); })
      .catch((e) => { $("nu-titulo").textContent = "No se pudo leer la colecta"; $("nu-bajada").textContent = e.message; });

  // ---------- panel de demo: actuar como cada rol ----------
  const ACCIONES = {
    donante: [["donar", "Donar"], ["denunciar", "Denunciar un comprobante"]],
    organizador: [["pedirTramo", "Pedir un tramo"], ["cargarComprobante", "Cargar un comprobante"], ["pedirReasignacion", "Pedir pasar plata entre ítems"]],
    entidad: [["validar", "Validar la colecta"], ["aprobarTramo", "Aprobar un tramo"], ["aprobarComprobante", "Aprobar un comprobante"], ["rechazarComprobante", "Rechazar un comprobante"], ["aprobarReasignacion", "Aprobar una reasignación"], ["pausar", "Pausar la colecta"], ["reanudar", "Reanudar (solo la titular)"]],
  };
  let roles = {};
  const opciones = (lista) => lista.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join("");
  const itemsOpc = () => (actual?.items ?? []).map((it, i) => [i, it.nombre]);
  const comprobantesOpc = () => (actual?.comprobantes ?? []).map((c) => [c.id, `#${c.id} · ${actual.items[c.item]?.nombre} · ${u(c.monto)} · ${c.estado}`]);
  const tramosOpc = () => (actual?.tramos ?? []).map((t) => [t.id, `#${t.id} · ${u(t.monto)} · ${t.aprobado ? "liberado" : "pendiente"}`]);
  const sel = (name, lista) => `<label>${{ item: "Ítem", id: "Cuál", de: "Desde el ítem", a: "Hacia el ítem" }[name]}<select name="${name}">${opciones(lista)}</select></label>`;
  const CAMPOS = {
    donar: () => `<label>Monto (USDC de prueba)<input name="monto" type="number" min="1" step="0.01" value="10" required></label>`,
    denunciar: () => sel("id", comprobantesOpc()) + `<label>Motivo<input name="motivo" required maxlength="200" placeholder="Ej. El ticket es de otro comercio"></label>`,
    pedirTramo: () => `<label>Monto<input name="monto" type="number" min="1" step="0.01" value="20" required></label>`,
    cargarComprobante: () => sel("item", itemsOpc()) + `<label>Monto<input name="monto" type="number" min="0.01" step="0.01" required></label><label>Descripción (la imagen queda fuera de la red; acá va su huella)<input name="descripcion" required maxlength="200" placeholder="Ej. Factura A 0003-00001235 Almacén Norte"></label><label class="chk"><input type="checkbox" name="conCAE"> Es factura con CAE (verificada contra ARCA)</label>`,
    pedirReasignacion: () => sel("de", itemsOpc()) + sel("a", itemsOpc()) + `<label>Monto<input name="monto" type="number" min="1" step="0.01" required></label><label>Motivo<input name="motivo" required maxlength="200"></label>`,
    aprobarTramo: () => sel("id", tramosOpc()),
    aprobarComprobante: () => sel("id", comprobantesOpc()),
    rechazarComprobante: () => sel("id", comprobantesOpc()),
    aprobarReasignacion: () => `<label>Número de reasignación<input name="id" type="number" min="0" value="0" required></label>`,
  };
  function armarAcciones() {
    const tipo = roles[$("nu-rol").value]?.tipo;
    $("nu-acc").innerHTML = opciones(ACCIONES[tipo] ?? []);
    armarCampos();
  }
  function armarCampos() {
    const f = CAMPOS[$("nu-acc")?.value];
    $("nu-campos").innerHTML = f ? f() : "";
  }

  $("nu-rol").addEventListener("change", armarAcciones);
  $("nu-acc").addEventListener("change", armarCampos);
  $("nu-accion").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(ev.target));
    datos.conCAE = ev.target.conCAE?.checked ?? false;
    const r = $("nu-resultado");
    r.className = "nu-nota"; r.textContent = "Firmando y esperando el consenso de Hedera…";
    ev.target.querySelector("button").disabled = true;
    try {
      const resp = await fetch("/api/nucleo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c: actual.contrato, ...datos }) });
      const d = await resp.json();
      if (d.ok) {
        r.className = "nu-nota nu-ok";
        r.innerHTML = `✔ Hecho. <a href="${d.hashscan}" target="_blank" rel="noopener" style="text-decoration:underline">Ver la transacción en HashScan</a>${d.registro?.ok ? " · y la titular la registró en la Plataforma" : ""}`;
        setTimeout(cargar, 4000); // el Mirror Node tarda unos segundos
      } else {
        r.className = "nu-nota nu-no";
        r.innerHTML = `✋ El contrato lo rechazó: "${esc(d.motivo || d.error)}"${d.hashscan ? ` · <a href="${d.hashscan}" target="_blank" rel="noopener" style="text-decoration:underline">ver en HashScan</a>` : ""}`;
      }
    } catch (e) {
      r.className = "nu-nota nu-no"; r.textContent = e.message;
    } finally {
      ev.target.querySelector("button").disabled = false;
    }
  });

  // ---------- crear una colecta en contrato ----------
  $("nu-crear").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = Object.fromEntries(new FormData(ev.target));
    const items = [0, 1, 2].map((i) => ({ nombre: f[`n${i}`]?.trim(), meta: Number(f[`m${i}`]) })).filter((i) => i.nombre && i.meta > 0);
    const out = $("nu-creado");
    out.className = "nu-nota"; out.textContent = "Desplegando el contrato en Hedera (unos segundos)…";
    ev.target.querySelector("button").disabled = true;
    try {
      const resp = await fetch("/api/nucleo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crear: { titulo: f.titulo, items, titular: f.titular, dias: Number(f.dias) } }) });
      const d = await resp.json();
      if (!d.ok) throw new Error(d.error || "No se pudo crear");
      out.className = "nu-nota nu-ok";
      out.innerHTML = `✔ Contrato <a href="${d.hashscan}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(d.contrato)}</a> creado. Para publicarla, la titular tiene que validarla: <a href="/nucleo.html?c=${encodeURIComponent(d.contrato)}#probar" style="text-decoration:underline">abrirla</a>.`;
    } catch (e) {
      out.className = "nu-nota nu-no"; out.textContent = e.message;
    } finally {
      ev.target.querySelector("button").disabled = false;
    }
  });

  // ---------- roles y lista de colectas ----------
  fetch("/api/nucleo?lista=1").then((r) => r.json()).then((d) => {
    roles = d.roles ?? {};
    $("nu-rol").innerHTML = Object.entries(roles).map(([k, v]) => `<option value="${k}">${esc(v.nombre)}</option>`).join("");
    armarAcciones();
    $("nu-lista").innerHTML = (d.colectas ?? []).map((c) => `<a class="nu-chip ${c.contrato === (contrato || d.demo) ? "titular" : ""}" href="/nucleo.html?c=${encodeURIComponent(c.contrato)}">${esc(c.contrato)} · ${new Date(Number(c.timestamp.split(".")[0]) * 1000).toLocaleDateString("es-AR")}</a>`).join("") || '<span class="nu-chip">Todavía no hay otras colectas.</span>';
  }).catch(() => {});

  cargar();
})();
