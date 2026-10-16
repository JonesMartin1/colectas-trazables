// 11 mirror: T 20 to 22, schematic. Layers: blueprint > guide ring > wires > reader nodes (light on 8ths) > hub > "leer: USD 0" > progress.
(function () {
  'use strict';
  const ID = 'mirror';
  const READERS = ['Tribunal de Cuentas', 'prensa', 'vecinos', 'donantes', 'Defensa Civil', 'ONG', 'Concejo', 'cualquiera'];
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const cx = 540, cy = 900, R = 320;
      L.blueprint(ctx, { seed: 11, center: [cx, cy] });
      L.guideCircle(ctx, cx, cy, R, { color: P.lavender, alpha: 0.16 });
      for (let i = 0; i < READERS.length; i++) {
        const a = -Math.PI / 2 + (i / READERS.length) * Math.PI * 2;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        const on = L.seg(t, 0.5 + i * 0.125 - 1 / 24, 0.5 + i * 0.125 + 3 / 24, 'outExpo');
        L.inkLine(ctx, cx, cy, x, y, { width: 1.5, color: on > 0 ? P.schemOk : P.lavender, alpha: on > 0 ? 0.8 : 0.3, seed: 120 + i });
        L.inkCircle(ctx, x, y, 46, { width: 2, color: P.lavender, alpha: 0.8, seed: 130 + i });
        if (on > 0) {
          L.glowDot(ctx, x, y, 7, { color: P.schemOk, alpha: on });
          // an eye glyph
          L.inkPath(ctx, [[x - 24, y], [x, y - 14], [x + 24, y], [x, y + 14], [x - 24, y]], { width: 2, color: P.schemOk, seed: 140 + i, draw: on });
        }
        C.label(ctx, READERS[i], x, y + (Math.sin(a) < -0.9 ? -62 : 76), { size: 27, color: P.lineWhite, align: 'center', alpha: 0.9 });
      }
      // hub (T 20.0)
      L.glowDot(ctx, cx, cy, 14, { color: P.glow });
      L.inkCircle(ctx, cx, cy, 90, { width: 2.5, color: P.lavender, seed: 150, double: { offset: 9, width: 1.5, alpha: 0.5, from: 0, to: 1 } });
      C.label(ctx, 'Mirror Node', cx, cy + 140, { size: 34, weight: 600, color: P.lineWhite, align: 'center' });
      // leer: USD 0 (T 21.0)
      const z = L.seg(t, 1.0 - 1 / 24, 1.0 + 4 / 24, 'outExpo');
      if (z > 0) {
        C.label(ctx, 'leer: USD 0', cx, 1420, { size: 76, weight: 800, color: P.schemOk, align: 'center', alpha: z });
        C.label(ctx, 'cualquiera lo ve, gratis', cx, 1480, { size: 30, color: P.lavender, align: 'center', alpha: z });
      }
      C.progress(ctx, 3, 1);
    },
  });
})();
