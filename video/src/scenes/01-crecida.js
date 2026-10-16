// 01 crecida: T 0 to 2. Layers: board (C1 in full text) > red ring around "200 evacuados" > stamp HOY.
(function () {
  'use strict';
  const ID = 'crecida';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const zoom = 1 + 0.03 * E.inOutSine(t / info.dur);
      const cam = { x: 540, y: 880, zoom };
      const clips = C.board(ctx, T, cam, ['C1']);
      const c1 = clips.C1;
      // 1. ring around the line with "evacuados" (T 0.5, draw-on over 6 frames)
      const idx = Math.max(0, c1.lines.findIndex((s) => s.includes('evacuados')));
      const ring = L.seg(t, 0.5 - 1 / 24, 0.5 + 5 / 24, 'outExpo');
      L.camera(ctx, cam, () => C.ringBox(ctx, c1.lineBox(idx), ring, P.pinRed, 11, T));
      // 2. stamp HOY (T 1.0, pop on the beat)
      if (t >= 1.0 - 1e-6) {
        const u = Math.min(1, (t - 1.0) / (3 / 24) + 1 / 3);
        const s = 1 + 0.35 * (1 - E.outBack(u));
        ctx.save();
        ctx.translate(820, 1230);
        ctx.rotate(-0.14);
        ctx.scale(s, s);
        L.inkPath(ctx, L.rrectPts(-120, -58, 240, 116, 14, 12), { closed: true, width: 6, color: P.pinRed, seed: 21, boil: L.boil(T) });
        L.text(ctx, 'HOY', 0, 26, { size: 76, weight: 900, color: P.pinRed, family: C.SANS, align: 'center', tracking: 6 });
        ctx.restore();
      }
    },
  });
})();
