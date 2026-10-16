// 09 registro: T 16 to 18, schematic, the hinge. Layers: blueprint > topic column > slot #1 (DONATION)
// > coin drop + magenta flash > consensus time > slot #2 > lock "sin clave de admin" > progress.
(function () {
  'use strict';
  const ID = 'registro';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const MONO = 'Consolas, "Courier New", monospace';
      L.blueprint(ctx, { seed: 9, center: [540, 960] });
      C.label(ctx, 'Hedera · Consensus Service', 540, 420, { size: 38, weight: 600, color: P.lineWhite, align: 'center' });
      C.label(ctx, 'topic de la colecta', 540, 465, { size: 26, color: P.lavender, align: 'center' });
      // topic column: 4 slots
      const X0 = 230, X1 = 850, Y0 = 520, SH = 150, GAP = 22;
      for (let i = 0; i < 4; i++) {
        const y = Y0 + i * (SH + GAP);
        L.inkPath(ctx, L.rrectPts(X0, y, X1 - X0, SH, 14, 12), { closed: true, width: i === 0 ? 2.5 : 1.5, color: P.lavender, alpha: i === 0 ? 0.85 : 0.35, seed: 90 + i });
        L.text(ctx, '#' + (i + 1), X0 + 26, y + 52, { size: 30, weight: 700, color: P.lavender, family: MONO, alpha: i === 0 ? 0.9 : 0.35 });
      }
      L.hexLattice && L.ticks(ctx, 540, 1250, { r: 300, n: 48, len: 12, color: P.lineWhite, alpha: 0.18 });
      // coin drops into slot #1 on the downbeat T 16.0 (already landed on frame 0 with the flash)
      const fl = L.seg(t, 0, 10 / 24, 'outExpo');
      if (fl < 1) L.inkCircle(ctx, 540, Y0 + SH / 2, 60 + 260 * fl, { width: 3, color: P.magenta, alpha: 1 - fl, seed: 95 });
      L.glowDot(ctx, X1 - 60, Y0 + 52, 9, { color: P.schemCoin });
      L.text(ctx, 'DONATION', X0 + 110, Y0 + 56, { size: 36, weight: 800, color: P.schemOk, family: MONO });
      L.text(ctx, 'ref: 9e4b19c2…cd3', X0 + 110, Y0 + 104, { size: 28, color: P.lineWhite, family: MONO, alpha: 0.85 });
      // consensus time (T 16.5)
      L.text(ctx, '16/10 14:40:46', X1 - 26, Y0 + 132, { size: 24, color: P.paleBlue, family: MONO, align: 'right', p: L.seg(t, 0.5, 0.8) });
      // slot #2 EXPENSE ghost (T 17.0)
      const g = L.seg(t, 1.0, 1.25);
      if (g > 0) {
        const y = Y0 + SH + GAP;
        L.text(ctx, 'EXPENSE', X0 + 110, y + 56, { size: 36, weight: 800, color: P.schemCoin, family: MONO, alpha: g });
        L.text(ctx, 'CAE + hash de factura', X0 + 110, y + 104, { size: 28, color: P.lineWhite, family: MONO, alpha: 0.7 * g });
      }
      // lock (pulses T 17.5)
      const lk = L.seg(t, 1.5 - 1 / 24, 1.5 + 6 / 24, 'outExpo');
      const ly = 1300;
      L.inkPath(ctx, L.rrectPts(500, ly, 80, 66, 10, 8), { closed: true, width: 3, color: P.lineWhite, seed: 96 });
      L.inkPath(ctx, [[514, ly], [514, ly - 30], [540, ly - 52], [566, ly - 30], [566, ly]], { width: 3, color: P.lineWhite, seed: 97 });
      if (lk > 0 && lk < 1) L.inkCircle(ctx, 540, ly + 20, 60 + 80 * lk, { width: 2, color: P.schemOk, alpha: 1 - lk, seed: 98 });
      C.label(ctx, 'sin clave de admin: nadie lo borra', 540, 1440, { size: 32, weight: 600, color: P.lineWhite, align: 'center' });
      C.progress(ctx, 2, 1);
    },
  });
})();
