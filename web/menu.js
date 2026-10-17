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
  const brand = header.querySelector(".brand");
  if (!nav.isConnected) brand ? brand.after(nav) : header.prepend(nav);

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
