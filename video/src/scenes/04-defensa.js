// 04 defensa: T 6 to 8. C5 slaps T 6.0; caption types T 7.0; underline T 7.5.
(function () {
  'use strict';
  const ID = 'defensa';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const cam = { x: 1640, y: 2340 - 40 * E.outCubic(t / info.dur), zoom: 1 };
      C.board(ctx, T, cam, ['C5']);
      // caption card (screen-fixed)
      const a = L.seg(t, 1.0 - 1 / 24, 1.0 + 3 / 24, 'outCubic');
      if (a > 0) {
        ctx.save();
        ctx.translate(540, 1290);
        ctx.rotate(0.015);
        ctx.globalAlpha = a;
        ctx.fillStyle = L.rgba(P.ink, 0.22);
        ctx.fillRect(-420 + 10, -100 + 14, 840, 200);
        ctx.fillStyle = P.white;
        ctx.fillRect(-420, -100, 840, 200);
        ctx.globalAlpha = 1;
        const p = L.seg(t, 1.0, 1.45, 'linear');
        L.text(ctx, 'Él dice que tiene todos', -380, -16, { size: 50, weight: 700, color: P.ink, family: C.SERIF, p: Math.min(1, p * 1.9) });
        L.text(ctx, 'los comprobantes.', -380, 52, { size: 50, weight: 700, color: P.ink, family: C.SERIF, p: Math.max(0, p * 1.9 - 0.9) });
        const u = L.seg(t, 1.5 - 1 / 24, 1.5 + 5 / 24, 'outExpo');
        if (u > 0) L.inkLine(ctx, -150, 70, 210, 70, { width: 5, color: P.annYellow, draw: u, seed: 9 });
        ctx.restore();
        L.text(ctx, 'La Nación / Aire de Santa Fe, 2026', 930, 1440, { size: 22, weight: 600, color: P.ink, family: C.SANS, align: 'right', alpha: a });
      }
    },
  });
})();
