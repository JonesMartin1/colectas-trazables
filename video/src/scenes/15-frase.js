// 15 frase: T 28 to 30, illustrated. Three lines on the beats, underline on T 29.5, small heart pin.
(function () {
  'use strict';
  const ID = 'frase';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeYellow], offset: (T * 2) * 6, seed: 151 });
      const lines = [['Corrientes,', P.ink], ['la provincia donde', P.ink], ['la solidaridad se ve.', P.okGreen]];
      lines.forEach(([s, col], i) => {
        const a = i * 0.5;
        if (t < a - 1e-6) return;
        const u = Math.min(1, (t - a) / (3 / 24) + 1 / 3);
        const dy = 30 * (1 - E.outBack(u));
        L.text(ctx, s, 540, 760 + i * 120 + dy, { size: 84, weight: 800, color: col, family: C.SERIF, align: 'center' });
      });
      const ul = L.seg(t, 1.5 - 1 / 24, 1.5 + 6 / 24, 'outExpo');
      if (ul > 0) L.inkLine(ctx, 170, 1035, 910, 1035, { width: 7, color: P.annYellow, draw: ul, seed: 152 });
      // heart made of two arcs and a point, ink
      const hx = 540, hy = 560;
      L.inkPath(ctx, [[hx, hy + 60], [hx - 70, hy - 4], [hx - 60, hy - 52], [hx - 18, hy - 56], [hx, hy - 24], [hx + 18, hy - 56], [hx + 60, hy - 52], [hx + 70, hy - 4], [hx, hy + 60]], { closed: true, width: 5, color: P.ink, fill: P.pinRed, seed: 153, boil: L.boil(T) });
    },
  });
})();
