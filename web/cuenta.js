// Cuenta de la demo: registro, inicio de sesión y sesión, guardados en este navegador (localStorage).
// Todavía no hay servidor de usuarios: la contraseña se guarda solo como hash SHA-256 y nada de esto va a Hedera.
// Para producción: Supabase Auth o Google. Donar exige tener la sesión iniciada.
(function () {
  const K_USUARIOS = "ct-usuarios", K_SESION = "ct-sesion";
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
  const normal = (e) => String(e || "").trim().toLowerCase();
  async function hash(t) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  // solo rutas internas, para no redirigir a otro sitio
  const seguro = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("//") ? u : "/");

  const Cuenta = {
    actual: () => leer(K_SESION, null),
    urlLogin: (volver = location.pathname + location.search) => `/login.html?volver=${encodeURIComponent(volver)}`,
    async registrar({ nombre, email, clave }) {
      email = normal(email);
      if (String(nombre).trim().length < 2) throw new Error("Escribí tu nombre.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("El email no es válido.");
      if (String(clave).length < 6) throw new Error("La contraseña tiene que tener al menos 6 caracteres.");
      const usuarios = leer(K_USUARIOS, {});
      if (usuarios[email]) throw new Error("Ya hay una cuenta con ese email: iniciá sesión.");
      usuarios[email] = { nombre: String(nombre).trim(), hash: await hash(`${email}:${clave}`) };
      guardar(K_USUARIOS, usuarios);
      guardar(K_SESION, { nombre: usuarios[email].nombre, email });
    },
    async ingresar({ email, clave }) {
      email = normal(email);
      const u = leer(K_USUARIOS, {})[email];
      if (!u || u.hash !== (await hash(`${email}:${clave}`))) throw new Error("Email o contraseña incorrectos.");
      guardar(K_SESION, { nombre: u.nombre, email });
    },
    salir() { try { localStorage.removeItem(K_SESION); } catch { /* nada */ } },
  };
  window.Cuenta = Cuenta;

  // ---- en el encabezado: "Ingresar" o "Hola, Ana · Salir"
  const header = document.querySelector(".site-header");
  if (header) {
    const chip = document.createElement("div");
    chip.className = "cuenta-chip";
    const s = Cuenta.actual();
    if (s) {
      chip.innerHTML = `<span class="cuenta-avatar" aria-hidden="true"></span><span class="cuenta-nombre"></span><button type="button">Salir</button>`;
      chip.querySelector(".cuenta-avatar").textContent = s.nombre.charAt(0).toUpperCase();
      chip.querySelector(".cuenta-nombre").textContent = `Hola, ${s.nombre.split(" ")[0]}`;
      chip.querySelector("button").addEventListener("click", () => { Cuenta.salir(); location.reload(); });
    } else if (document.body.dataset.page !== "login") {
      chip.innerHTML = `<a class="cuenta-ingresar" href="${Cuenta.urlLogin()}">Ingresar / Registrarme</a>`;
    }
    const accion = header.querySelector(".nav-action");
    accion ? accion.before(chip) : header.append(chip);
  }

  // ---- donar exige sesión: el clic se corta antes de que llegue a los botones de donar
  if (document.body.dataset.page === "colecta") {
    document.addEventListener("click", (e) => {
      const boton = e.target.closest?.(".mp-button, #donate-button");
      if (!boton || Cuenta.actual()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href = Cuenta.urlLogin();
    }, true);
    if (!Cuenta.actual()) {
      addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("donate-form");
        if (!form) return;
        const aviso = document.createElement("a");
        aviso.className = "aviso-cuenta";
        aviso.href = Cuenta.urlLogin();
        aviso.innerHTML = "<b>Para donar, primero creá tu cuenta</b> o iniciá sesión ↗";
        form.prepend(aviso);
      });
    }
  }

  // ---- página de login
  if (document.body.dataset.page === "login") {
    const volver = seguro(new URLSearchParams(location.search).get("volver"));
    if (Cuenta.actual()) { location.replace(volver); return; }
    addEventListener("DOMContentLoaded", () => {
      const tabs = document.querySelectorAll("[data-modo]");
      const form = document.getElementById("login-form");
      const fb = document.getElementById("login-feedback");
      const boton = form.querySelector("button[type=submit]");
      let modo = "registro";
      const poner = (m) => {
        modo = m;
        tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.modo === m)));
        form.querySelector(".solo-registro").hidden = m !== "registro";
        form.querySelector("#l-nombre").required = m === "registro";
        boton.firstChild.textContent = m === "registro" ? "Crear mi cuenta " : "Iniciar sesión ";
        form.querySelector("#l-clave").autocomplete = m === "registro" ? "new-password" : "current-password";
        fb.textContent = ""; fb.className = "form-feedback";
      };
      tabs.forEach((t) => t.addEventListener("click", () => poner(t.dataset.modo)));
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const f = new FormData(form);
        boton.disabled = true;
        try {
          if (modo === "registro") await Cuenta.registrar({ nombre: f.get("nombre"), email: f.get("email"), clave: f.get("clave") });
          else await Cuenta.ingresar({ email: f.get("email"), clave: f.get("clave") });
          fb.className = "form-feedback success"; fb.textContent = "¡Listo! Te llevamos a donar…";
          setTimeout(() => location.replace(volver), 700);
        } catch (e) {
          fb.className = "form-feedback error"; fb.textContent = e.message;
          boton.disabled = false;
        }
      });
      poner(new URLSearchParams(location.search).get("modo") === "ingresar" ? "ingresar" : "registro");
    });
  }
})();
