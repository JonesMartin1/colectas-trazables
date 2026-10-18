// Menú único y corto para todas las páginas: Colectas, Cómo funciona, Verificá un alias y el botón "Crear colecta".
// Reemplaza el nav de cada HTML base, así queda igual en todos lados. Corre antes de cuenta.js (que suma "Ingresar").
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const lema = header.querySelector(".brand small");
  if (lema) lema.textContent = "VERIFICADO EN HEDERA";
  const aqui = location.pathname;
  const links = [
    ["/#colectas", "Colectas"],
    ["/#como-funciona", "Cómo funciona"],
    ["/hedera.html", "Hedera en vivo"],
    ["/alias.html", "¿Alias real?"],
  ];
  const nav = header.querySelector(".desktop-nav") || document.createElement("nav");
  nav.className = "desktop-nav menu-corto";
  nav.setAttribute("aria-label", "Navegación principal");
  nav.innerHTML = links.map(([href, txt]) => `<a href="${href}"${href === aqui ? ' aria-current="page"' : ""}>${txt}</a>`).join("");
  nav.id = "menu-principal";
  nav.insertAdjacentHTML("beforeend", '<a class="solo-movil" href="/crear.html">Crear colecta <span aria-hidden="true">↗</span></a>');
  const brand = header.querySelector(".brand");
  if (!nav.isConnected) brand ? brand.after(nav) : header.prepend(nav);

  // en el celular el nav no entra: se abre con un botón y cae debajo del encabezado (estilos en movil.css)
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "menu-boton";
  boton.setAttribute("aria-controls", "menu-principal");
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-label", "Abrir el menú");
  boton.innerHTML = "<span></span><span></span><span></span>";
  header.append(boton);
  const abrir = (si) => {
    header.classList.toggle("menu-abierto", si);
    boton.setAttribute("aria-expanded", String(si));
    boton.setAttribute("aria-label", si ? "Cerrar el menú" : "Abrir el menú");
  };
  boton.addEventListener("click", () => abrir(!header.classList.contains("menu-abierto")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) abrir(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrir(false); });

  // indicador en vivo: último bloque de Hedera testnet, leído del Mirror Node público
  const ticker = document.createElement("a");
  ticker.className = "ticker-red";
  ticker.href = "/hedera.html";
  ticker.innerHTML = '<span class="punto"></span><span>Hedera testnet</span>';
  document.body.append(ticker);
  const bloque = () => fetch("https://testnet.mirrornode.hedera.com/api/v1/blocks?limit=1&order=desc").then((r) => r.json())
    .then((d) => { const b = d.blocks?.[0]; if (b) ticker.lastChild.textContent = `Hedera testnet · bloque #${b.number.toLocaleString("es-AR")}`; }).catch(() => {});
  bloque();
  setInterval(() => { if (!document.hidden) bloque(); }, 10000);

  let accion = header.querySelector(".nav-action");
  if (accion?.id) return; // gasto y entrega: es "Volver a la colecta" y lo usa app.js
  if (!accion) { accion = document.createElement("a"); header.append(accion); }
  accion.className = "nav-action";
  accion.href = "/crear.html";
  accion.innerHTML = 'Crear colecta <span aria-hidden="true">↗</span>';
})();
