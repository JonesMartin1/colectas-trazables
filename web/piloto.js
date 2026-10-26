// Ajustes de textos para el sitio en la red real (window.HEDERA_RED === "mainnet", lo carga /red.js): saca los avisos de
// "demo" y "ejemplo" que solo valen para la demo en testnet. En testnet no hace nada.
(function () {
  if (window.HEDERA_RED !== "mainnet") return;
  const aplicar = () => {
    document.querySelectorAll(".demo-stamp").forEach((n) => n.remove());
    const aviso = document.querySelector(".legal .aviso");
    if (aviso) aviso.innerHTML = "<strong>Piloto en la red real de Hedera (mainnet).</strong> Las donaciones son con dinero real y van directo a la cuenta de la organización. Estos términos están en revisión: la organización responde por la administración de los fondos.";
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aplicar); else aplicar();
})();
