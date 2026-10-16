# Video animado de Colectas Trazables (32 s, vertical)

Video procedural: cada cuadro y cada sonido se calculan en el navegador con JavaScript, sin imágenes ni audio externos.
Muestra los titulares reales sobre colectas (Corrientes, Maratea, Bahía Blanca, Venezuela) y después cómo funciona la solución.

- Resultado: [`../entregables/video/colectas-trazables-32s.mp4`](../entregables/video/colectas-trazables-32s.mp4); qué muestra cada plano y las fuentes de los titulares, en [`../entregables/video/planos.md`](../entregables/video/planos.md).
- Reproductor HTML autocontenido: `dist/`.
- Guion y reglas visuales: `docs/storyboard.md` y `docs/art-bible.md`. Escenas: `src/scenes/`. Música: `src/music.js`.

## Regenerarlo

```bash
cd video/tools && npm install && npx playwright install chromium   # una vez
cd .. && node tools/check.cjs        # control de calidad: determinismo, áreas seguras, errores
node tools/render.cjs                # exports/<slug>.mp4 (requiere ffmpeg)
```
