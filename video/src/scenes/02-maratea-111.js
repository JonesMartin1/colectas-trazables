// 02 maratea-111: T 2 to 4. Board pans to C2; C2 slaps on T 2.0; yellow ring on "111 millones" T 3.0.
(function () {
  'use strict';
  const ID = 'maratea-111';
  const HAND = '"Segoe Print", "Comic Sans MS", cursive';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const cam = { x: 1640 - 20 * E.outCubic(t / info.dur), y: 900, zoom: 1.0 };
      const clips = C.board(ctx, T, cam, ['C2']);
      const c2 = clips.C2;
      const idx = Math.max(0, c2.lines.findIndex((s) => s.includes('111')));
      const ring = L.seg(t, 1.0 - 1 / 24, 1.0 + 7 / 24, 'outExpo');
      L.camera(ctx, cam, () => C.ringBox(ctx, c2.lineBox(idx), ring, P.annYellow, 23, T, 30));
      if (t >= 1.25) {
        const p = L.seg(t, 1.25, 1.75, 'outCubic');
        ctx.save();
        ctx.translate(560, 1300);
        ctx.rotate(-0.05);
        L.text(ctx, 'en una noche', 0, 0, { size: 58, weight: 700, color: P.ink, family: HAND, align: 'center', p });
        ctx.restore();
      }
    },
  });
})();
