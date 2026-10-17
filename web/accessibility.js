// Controles compartidos en todas las páginas. No almacenan datos personales.
(() => {
  const key = "ct-accessibility";
  const defaults = { language: "es", large: false, contrast: false, reducedMotion: false };
  let saved;
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch { saved = {}; }
  const state = { ...defaults, ...saved };
  const labels = {
    es: { title: "Accesibilidad", open: "Abrir opciones de accesibilidad", language: "Idioma", large: "Texto más grande", contrast: "Más contraste", motion: "Reducir movimiento" },
    en: { title: "Accessibility", open: "Open accessibility options", language: "Language", large: "Larger text", contrast: "Higher contrast", motion: "Reduce motion" }
  };
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* almacenamiento no disponible */ } };
  const apply = () => {
    document.documentElement.classList.toggle("a11y-large", !!state.large);
    document.documentElement.classList.toggle("a11y-contrast", !!state.contrast);
    document.documentElement.classList.toggle("a11y-reduced-motion", !!state.reducedMotion);
    document.documentElement.lang = state.language === "en" ? "en" : "es-AR";
    window.dispatchEvent(new CustomEvent("ct-language-change", { detail: { language: state.language } }));
  };
  window.ctLanguage = () => state.language;
  apply();
  const mount = () => {
    const dock = document.createElement("div");
    dock.className = "accessibility-dock";
    dock.innerHTML = `<button class="accessibility-trigger" type="button" aria-controls="accessibility-panel" aria-expanded="false"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="5" r="2.5"/><path d="M5 11h22M16 8v9m-7 3 7-3 7 3m-10-2-2 10m8-10 2 10"/></svg></button><div class="accessibility-panel" id="accessibility-panel" hidden><h2></h2><div class="a11y-row"><span data-label="language"></span><div class="a11y-language"><button type="button" data-language="es" aria-pressed="true" lang="es">ES</button><button type="button" data-language="en" aria-pressed="false" lang="en">EN</button></div></div><div class="a11y-row"><span data-label="large"></span><button type="button" data-setting="large" aria-pressed="false">A+</button></div><div class="a11y-row"><span data-label="contrast"></span><button type="button" data-setting="contrast" aria-pressed="false">◐</button></div><div class="a11y-row"><span data-label="motion"></span><button type="button" data-setting="reducedMotion" aria-pressed="false">⏸</button></div></div>`;
    document.body.append(dock);
    const trigger = dock.querySelector(".accessibility-trigger");
    const panel = dock.querySelector(".accessibility-panel");
    const render = () => {
      const copy = labels[state.language] || labels.es;
      trigger.setAttribute("aria-label", copy.open);
      trigger.title = copy.open;
      panel.querySelector("h2").textContent = copy.title;
      for (const [name, value] of Object.entries(copy)) {
        panel.querySelector(`[data-label="${name}"]`)?.replaceChildren(document.createTextNode(value));
      }
      panel.querySelectorAll("[data-language]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === state.language)));
      panel.querySelectorAll("[data-setting]").forEach((button) => {
        const setting = button.dataset.setting;
        button.setAttribute("aria-pressed", String(!!state[setting]));
        button.setAttribute("aria-label", copy[setting === "reducedMotion" ? "motion" : setting]);
      });
    };
    trigger.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      trigger.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) panel.querySelector("button")?.focus();
    });
    dock.addEventListener("click", (event) => {
      const language = event.target.closest("[data-language]")?.dataset.language;
      const setting = event.target.closest("[data-setting]")?.dataset.setting;
      if (language) state.language = language;
      if (setting) state[setting] = !state[setting];
      if (language || setting) { persist(); apply(); render(); }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); trigger.focus(); }
    });
    document.addEventListener("click", (event) => {
      if (!dock.contains(event.target) && !panel.hidden) { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); }
    });
    render();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
