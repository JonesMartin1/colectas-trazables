// 10 factura: T 18 to 20, illustrated. Layers: stripes > invoice sheet (slides in) > CAE stamp > fingerprint + arrow up.
(function () {
  'use strict';
  const ID = 'factura';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const MONO = 'Consolas, "Courier New", monospace';
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSage], offset: (T * 2) * 6, seed: 101 });
      const sx = 540 + 600 * (1 - E.outCubic(L.seg(t, 0, 8 / 24)));
      ctx.save();
      ctx.translate(sx, 880);
      ctx.rotate(-0.025);
      ctx.fillStyle = L.rgba(P.ink, 0.2);
      ctx.fillRect(-390 + 12, -460 + 16, 780, 920);
      ctx.fillStyle = P.newsprint;
      ctx.fillRect(-390, -460, 780, 920);
      L.inkPath(ctx, L.rectPts(-390, -460, 780, 920, 24), { closed: true, width: 3, color: P.ink, seed: 102, boil: L.boil(T) });
      L.text(ctx, 'FACTURA B', -340, -380, { size: 50, weight: 900, color: P.ink, family: C.SANS, tracking: 3 });
      L.text(ctx, 'Corralón (ejemplo)', -340, -320, { size: 34, weight: 600, color: P.inkSoft, family: C.SANS });
      L.text(ctx, 'CUIT 30-00000000-0', -340, -276, { size: 30, color: P.inkSoft, family: MONO });
      L.inkLine(ctx, -340, -240, 340, -240, { width: 2, color: P.ink, seed: 103 });
      L.text(ctx, '40 colchones', -340, -170, { size: 46, weight: 700, color: P.ink, family: C.SANS });
      L.text(ctx, 'evacuados de Itatí', -340, -120, { size: 32, color: P.inkSoft, family: C.SANS });
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = L.rgba(P.greek, 0.85);
        ctx.fillRect(-340, -60 + k * 40, 420 + ((k * 97) % 160), 12);
      }
      L.inkLine(ctx, -340, 90, 340, 90, { width: 2, color: P.ink, seed: 104 });
      L.text(ctx, 'CAE', -340, 160, { size: 30, weight: 700, color: P.ink, family: C.SANS });
      L.text(ctx, '7428 1930 5512 08', -340, 210, { size: 40, weight: 600, color: P.ink, family: MONO });
      // stamp T 18.5
      if (t >= 0.5 - 1e-6) {
        const u = Math.min(1, (t - 0.5) / (3 / 24) + 1 / 3);
        const s = 1 + 0.3 * (1 - E.outBack(u));
        ctx.save();
        ctx.translate(190, 330);
        ctx.rotate(-0.2);
        ctx.scale(s, s);
        L.inkCircle(ctx, 0, 0, 92, { width: 6, color: P.okGreen, seed: 105 });
        L.inkCircle(ctx, 0, 0, 76, { width: 2, color: P.okGreen, seed: 106 });
        L.text(ctx, 'CAE ✓', 0, -4, { size: 40, weight: 900, color: P.okGreen, family: C.SANS, align: 'center' });
        L.text(ctx, 'ARCA', 0, 38, { size: 26, weight: 800, color: P.okGreen, family: C.SANS, align: 'center', tracking: 4 });
        ctx.restore();
      }
      ctx.restore();
      // fingerprint lifts T 19.0: the invoice's hash goes to Hedera
      const fp = L.seg(t, 1.0 - 1 / 24, 1.0 + 8 / 24, 'outCubic');
      if (fp > 0) {
        const fx = 250, fy = 1470 - 30 * fp;
        for (let i = 0; i < 6; i++) L.inkCircle(ctx, fx, fy, 12 + i * 8, { ry: 16 + i * 10, width: 2.2, color: P.annBlue, seed: 110 + i, draw: fp });
        L.text(ctx, 'su huella (hash) va a Hedera', 330, fy + 14, { size: 38, weight: 700, color: P.annBlue, family: C.SANS, alpha: fp });
      }
    },
  });
})();
