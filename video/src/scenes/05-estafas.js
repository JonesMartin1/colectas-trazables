// 05 estafas: T 8 to 10. C6 slaps T 8.0, C7 T 9.0; red "!" mark T 9.5.
(function () {
  'use strict';
  const ID = 'estafas';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const cam = { x: 1200, y: 3430 + 20 * E.outCubic(t / info.dur), zoom: 1 };
      C.board(ctx, T, cam, ['C6', 'C7']);
      const u = L.seg(t, 1.5 - 1 / 24, 1.5 + 8 / 24, 'outExpo');
      if (u > 0) {
        const x = 905, y = 975;
        ctx.save();
        ctx.fillStyle = P.pinRed;
        ctx.beginPath();
        ctx.arc(x, y, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        L.text(ctx, '!', x, y + 25, { size: 72, weight: 900, color: P.white, family: C.SANS, align: 'center' });
        L.inkCircle(ctx, x, y, 46 + u * 60, { width: 3, color: P.pinRed, alpha: 1 - u * 0.8, seed: 3 });
      }
    },
  });
})();
