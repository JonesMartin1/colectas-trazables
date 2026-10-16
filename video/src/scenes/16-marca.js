// 16 marca: T 30 to 32, schematic, fade in. Wordmark per art bible 9; full progress ring; Hedera note.
(function () {
  'use strict';
  const ID = 'marca';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast;
      const t = Math.max(0, Math.min(tIn, info.dur));
      L.blueprint(ctx, { seed: 16, center: [540, 1000] });
      L.guideCircle(ctx, 540, 1000, 380, { color: P.lavender, alpha: 0.16 });
      L.glowDot(ctx, 540, 860, 12, { color: P.schemOk });
      L.ticks(ctx, 540, 860, { r: 40, n: 20, len: 14, color: P.lineWhite, alpha: 0.6 });
      L.text(ctx, 'colectas trazables', 540, 1100, { size: 64, weight: 300, color: P.lavender, alpha: 0.95, align: 'center', tracking: '0.12em', p: L.seg(t, 0.5, 0.9) });
      L.text(ctx, 'mirá llegar tu ayuda', 540, 1170, { size: 36, weight: 400, color: P.schemOk, align: 'center', alpha: L.seg(t, 1.0, 1.3) });
      L.text(ctx, 'registro en Hedera · testnet', 540, 1240, { size: 26, color: P.lavender, align: 'center', alpha: 0.7 * L.seg(t, 1.2, 1.5) });
      // full ring: every arc lit
      for (let k = 0; k < 5; k++) C.progress(ctx, k, 1);
    },
  });
})();
