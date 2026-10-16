// 06 adonde-fue: T 10 to 12. Pull back over the whole board (all greeked), red strings to a centre pin,
// question card pops on T 11.0.
(function () {
  'use strict';
  const ID = 'adonde-fue';
  const HUB = [1200, 2250];
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const k = E.inOutCubic(L.seg(t, 0, 1.0));
      const zoom = Math.exp(Math.log(0.36) * k);
      const cam = { x: 1200, y: 3450 + (HUB[1] - 3450) * k, zoom };
      const clips = C.board(ctx, T, cam, []);
      // red strings, drawn on T 10.5 to 11.0
      const sp = L.seg(t, 0.5, 1.0, 'outCubic');
      if (sp > 0) {
        L.camera(ctx, cam, () => {
          let i = 0;
          for (const id in clips) {
            const c = clips[id];
            if (!c) continue;
            const a = [c.top.x, c.top.y + 24];
            const mid = [(a[0] + HUB[0]) / 2, (a[1] + HUB[1]) / 2 + 120];
            L.inkPath(ctx, [a, mid, HUB], { width: 9, color: P.pinRed, draw: sp, seed: 40 + i++, boil: L.boil(T) });
          }
          C.pin(ctx, HUB[0], HUB[1], 2.6);
        });
      }
      // question card, screen-fixed, pops T 11.0
      if (t >= 1.0 - 1e-6) {
        const u = Math.min(1, (t - 1.0) / (3 / 24) + 1 / 3);
        const s = 1 + 0.12 * (1 - E.outBack(u));
        ctx.save();
        ctx.fillStyle = L.rgba(P.ink, 0.35 * Math.min(1, (t - 1.0) * 6 + 0.2));
        ctx.fillRect(0, 0, info.W, info.H);
        ctx.translate(540, 900);
        ctx.rotate(-0.02);
        ctx.scale(s, s);
        ctx.fillStyle = L.rgba(P.ink, 0.3);
        ctx.fillRect(-420 + 12, -190 + 16, 840, 380);
        ctx.fillStyle = P.newsprint;
        ctx.fillRect(-420, -190, 840, 380);
        L.inkPath(ctx, L.rectPts(-420, -190, 840, 380, 24), { closed: true, width: 3, color: P.ink, seed: 61, boil: L.boil(T) });
        L.text(ctx, '¿Adónde fue', 0, -20, { size: 88, weight: 800, color: P.headline, family: C.SERIF, align: 'center' });
        L.text(ctx, 'cada peso?', 0, 90, { size: 88, weight: 800, color: P.pinRed, family: C.SERIF, align: 'center' });
        ctx.restore();
      }
    },
  });
})();
