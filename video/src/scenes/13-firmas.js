// 13 firmas: T 24 to 26, schematic. Layers: blueprint > 4 signer nodes > wires > key "2 de 4" > registry slot > progress.
(function () {
  'use strict';
  const ID = 'firmas';
  const SIGNERS = ['Defensa Civil', 'Desarrollo Social', 'Cáritas', 'Cruz Roja'];
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      L.blueprint(ctx, { seed: 13, center: [540, 900] });
      C.label(ctx, 'Para agregar un alias oficial', 540, 430, { size: 36, weight: 600, color: P.lineWhite, align: 'center' });
      C.label(ctx, 'hacen falta 2 firmas de 4', 540, 478, { size: 32, color: P.lavender, align: 'center' });
      const KX = 540, KY = 1010;
      SIGNERS.forEach((name, i) => {
        const y = 600 + i * 150, x = 220;
        const lit = i < 2 ? L.seg(t, 0.5 - 1 / 24, 0.5 + 4 / 24, 'outExpo') : 0;
        L.inkCircle(ctx, x, y, 40, { width: 2, color: lit > 0 ? P.schemOk : P.lavender, alpha: 0.85, seed: 160 + i });
        C.label(ctx, name, x + 60, y + 10, { size: 28, color: P.lineWhite });
        if (lit > 0) {
          L.glowDot(ctx, x, y, 7, { color: P.schemOk, alpha: lit });
          L.inkPath(ctx, [[x + 40, y + 30], [x + 160, y + 120], [KX - 70, KY]], { width: 2.5, color: P.schemOk, draw: lit, seed: 170 + i });
        } else {
          L.inkPath(ctx, [[x + 40, y + 30], [x + 160, y + 120], [KX - 70, KY]], { width: 1.2, color: P.lavender, alpha: 0.25, seed: 170 + i, dash: [10, 10] });
        }
      });
      // key (turns on T 25.0)
      const k = L.seg(t, 1.0 - 1 / 24, 1.0 + 5 / 24, 'outExpo');
      const kc = k > 0 ? P.schemOk : P.lavender;
      L.inkCircle(ctx, KX, KY, 64, { width: 3, color: kc, seed: 180, double: { offset: 9, width: 1.5, alpha: 0.5, from: 0, to: 1 } });
      C.label(ctx, '2 de 4', KX, KY + 14, { size: 40, weight: 800, color: kc, align: 'center' });
      // registry (lights T 25.5)
      const r = L.seg(t, 1.5 - 1 / 24, 1.5 + 5 / 24, 'outExpo');
      L.inkPath(ctx, [[KX, KY + 64], [KX, 1180]], { width: 2.5, color: r > 0 ? P.schemOk : P.lavender, alpha: 0.8, seed: 181 });
      L.inkPath(ctx, L.rrectPts(300, 1180, 480, 130, 14, 12), { closed: true, width: 2.5, color: r > 0 ? P.schemOk : P.lavender, seed: 182 });
      C.label(ctx, 'registro de alias', 540, 1236, { size: 32, weight: 600, color: P.lineWhite, align: 'center' });
      C.label(ctx, 'ninguna institución sola puede escribir', 540, 1280, { size: 24, color: P.lavender, align: 'center' });
      if (r > 0 && r < 1) L.inkCircle(ctx, 540, 1245, 120 + 160 * r, { width: 2, color: P.schemOk, alpha: 1 - r, seed: 183 });
      C.progress(ctx, 4, 1);
    },
  });
})();
