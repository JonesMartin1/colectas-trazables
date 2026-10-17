// Crear una colecta exige: 1) cuenta iniciada y 2) identidad validada (DNI + selfie con prueba de vida).
// En producción, la validación la hace el servicio biométrico de RENAPER (SID) por convenio; en la demo está simulada.
// La imagen de la cámara nunca sale del navegador y no se guarda ningún dato personal: solo que la cuenta quedó validada.
(function () {
  if (document.body.dataset.page !== "crear") return;
  const Cuenta = window.Cuenta;
  if (!Cuenta?.actual()) { location.replace(Cuenta ? Cuenta.urlLogin() : "/login.html"); return; }
  const sesion = Cuenta.actual();
  const K = "ct-identidad";
  const validada = () => { try { return JSON.parse(localStorage.getItem(K))?.[sesion.email]; } catch { return null; } };
  const marcar = () => {
    try {
      const todo = JSON.parse(localStorage.getItem(K)) || {};
      todo[sesion.email] = { fecha: new Date().toISOString() };
      localStorage.setItem(K, JSON.stringify(todo));
    } catch { /* sin almacenamiento */ }
  };

  const crear = document.querySelector(".create-section");
  if (!crear) return;
  if (validada()) return insignia();

  crear.classList.add("oculto");
  const panel = document.createElement("section");
  panel.className = "identidad section-wrap";
  panel.innerHTML = `
    <div class="identidad-copy">
      <div class="eyebrow"><span class="signal"></span> PASO OBLIGATORIO · ORGANIZADORES</div>
      <h1>Validá tu <em>identidad</em><br>para crear una colecta.</h1>
      <p>Quien junta plata en nombre de otros tiene que ser una persona real. Validamos tu DNI con una selfie y una prueba de vida contra RENAPER.</p>
      <ol class="identidad-pasos"><li data-p="1">Datos del DNI</li><li data-p="2">Selfie y prueba de vida</li><li data-p="3">Validación</li></ol>
      <p class="identidad-nota">Demo: la respuesta de RENAPER está simulada. La imagen no sale de tu dispositivo y no guardamos tu DNI.</p>
    </div>
    <div class="identidad-card raised-panel">
      <form id="id-dni">
        <div class="form-head"><span>PASO 1 DE 3</span><span>RENAPER · SID</span></div>
        <h2>Datos del DNI</h2>
        <label for="id-numero">Número de DNI</label><input id="id-numero" inputmode="numeric" required pattern="[0-9]{7,8}" maxlength="8" placeholder="30123456" autocomplete="off">
        <label for="id-sexo">Sexo según el DNI</label><select id="id-sexo" required><option value="">Elegí…</option><option value="F">F</option><option value="M">M</option><option value="X">X</option></select>
        <label for="id-tramite">Número de trámite</label><input id="id-tramite" inputmode="numeric" required pattern="[0-9]{11}" maxlength="11" placeholder="11 dígitos, al frente del DNI" autocomplete="off">
        <button class="button button-dark" type="submit">Continuar <span aria-hidden="true">↗</span></button>
        <p class="form-feedback" role="status"></p>
      </form>
      <div id="id-selfie" hidden>
        <div class="form-head"><span>PASO 2 DE 3</span><span>PRUEBA DE VIDA</span></div>
        <h2>Selfie y prueba de vida</h2>
        <div class="camara"><video autoplay playsinline muted></video><div class="camara-marco"></div><div class="camara-sin">Sin cámara: usá el modo demo</div><div class="camara-escaneo"></div></div>
        <p class="camara-instruccion">Ubicá tu cara dentro del óvalo.</p>
        <div class="camara-progreso"><span></span></div>
        <button class="button button-dark" type="button" id="id-escanear">Empezar escaneo <span aria-hidden="true">↗</span></button>
      </div>
      <div id="id-validando" hidden>
        <div class="form-head"><span>PASO 3 DE 3</span><span>RENAPER · SID</span></div>
        <h2>Validando con RENAPER…</h2>
        <ul class="validacion-lista"><li>Datos del DNI</li><li>Coincidencia facial</li><li>Prueba de vida</li><li>Estado del documento</li></ul>
        <a class="button button-lime" id="id-seguir" href="#" hidden>Crear mi colecta <span aria-hidden="true">↗</span></a>
      </div>
    </div>`;
  crear.before(panel);

  const paso = (n) => panel.querySelectorAll(".identidad-pasos li").forEach((li) => li.classList.toggle("activo", Number(li.dataset.p) <= n));
  paso(1);

  // Paso 1: formato del DNI y del trámite (la consulta real la hace RENAPER)
  const fDni = panel.querySelector("#id-dni");
  fDni.addEventListener("submit", (e) => {
    e.preventDefault();
    const fb = fDni.querySelector(".form-feedback");
    if (!fDni.checkValidity()) { fb.className = "form-feedback error"; fb.textContent = "Revisá el DNI (7 u 8 dígitos) y el número de trámite (11 dígitos)."; return; }
    fDni.hidden = true;
    panel.querySelector("#id-selfie").hidden = false;
    paso(2);
    abrirCamara();
  });

  // Paso 2: cámara + prueba de vida guiada
  let stream;
  async function abrirCamara() {
    const video = panel.querySelector("video");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      video.srcObject = stream;
      panel.querySelector(".camara").classList.add("con-video");
    } catch {
      panel.querySelector(".camara").classList.add("sin-video");
    }
  }
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  panel.querySelector("#id-escanear").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    const cam = panel.querySelector(".camara");
    const instr = panel.querySelector(".camara-instruccion");
    const barra = panel.querySelector(".camara-progreso span");
    cam.classList.add("escaneando");
    const pasos = ["Mirá a la cámara", "Parpadeá dos veces", "Girá la cabeza a la izquierda", "Girá la cabeza a la derecha", "Sonreí"];
    for (let i = 0; i < pasos.length; i++) {
      instr.textContent = pasos[i];
      barra.style.width = `${((i + 1) / pasos.length) * 100}%`;
      await esperar(1100);
    }
    cam.classList.remove("escaneando");
    stream?.getTracks().forEach((t) => t.stop()); // la imagen nunca se envía ni se guarda
    panel.querySelector("#id-selfie").hidden = true;
    panel.querySelector("#id-validando").hidden = false;
    paso(3);
    validar();
  });

  // Paso 3: respuesta (simulada) de RENAPER, ítem por ítem
  async function validar() {
    const items = panel.querySelectorAll(".validacion-lista li");
    for (const li of items) { li.classList.add("cargando"); await esperar(700); li.classList.replace("cargando", "ok"); }
    marcar();
    panel.querySelector("#id-validando h2").textContent = "¡Identidad validada!";
    const seguir = panel.querySelector("#id-seguir");
    seguir.hidden = false;
    seguir.addEventListener("click", (e) => { e.preventDefault(); panel.remove(); crear.classList.remove("oculto"); insignia(); crear.scrollIntoView({ behavior: "smooth" }); });
  }

  function insignia() {
    const copy = document.querySelector(".create-copy");
    if (!copy || copy.querySelector(".id-ok")) return;
    const b = document.createElement("div");
    b.className = "id-ok";
    b.textContent = `✓ Identidad validada · ${sesion.nombre}`;
    copy.prepend(b);
  }
})();
