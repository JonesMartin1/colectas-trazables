// 03 afip-igj: T 4 to 6. C3 slaps T 4.0, C4 slaps T 5.0, fairness sticky note lands T 5.5.
(function () {
  'use strict';
  const ID = 'afip-igj';
  const HAND = '"Segoe Print", "Comic Sans MS", cursive';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const cam = { x: 540, y: 2300 + 30 * E.outCubic(t / info.dur), zoom: 1 };
      C.board(ctx, T, cam, ['C3', 'C4']);
      // sticky note (screen-fixed), lands on T 5.5
      if (t >= 1.5 - 1e-6) {
        const u = Math.min(1, (t - 1.5) / (3 / 24) + 1 / 3);
        const s = 1 + 0.15 * (1 - E.outBack(u));
        ctx.save();
        ctx.translate(790, 400);
        ctx.rotate(0.06);
        ctx.scale(s, s);
        ctx.fillStyle = L.rgba(P.ink, 0.2);
        ctx.fillRect(-170 + 10, -120 + 14, 340, 240);
        ctx.fillStyle = P.sticky;
        ctx.fillRect(-170, -120, 340, 240);
        ctx.fillStyle = L.rgba(P.ochre, 0.35);
        ctx.fillRect(-170, -120, 340, 26);
        const lines = ['Después la IGJ', 'dijo que la colecta', 'estaba en orden'];
        lines.forEach((ln, i) => L.text(ctx, ln, -150, -44 + i * 54, { size: 36, weight: 700, color: P.ink, family: HAND }));
        L.text(ctx, 'LM Neuquén, 2023', 150, 106, { size: 20, weight: 600, color: P.inkSoft, family: C.SANS, align: 'right' });
        ctx.restore();
      }
    },
  });
})();
