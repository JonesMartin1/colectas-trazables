// 12 tu-ayuda: T 22 to 24, illustrated. Layers: stripes > phone > check + "Tu aporte llegó" > three bars > 40 colchones.
(function () {
  'use strict';
  const ID = 'tu-ayuda';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const MONO = 'Consolas, "Courier New", monospace';
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSpring], offset: (T * 2) * 6, seed: 121 });
      const scr = C.phoneInk(ctx, 540, 880, 640, 1180, 122, T);
      const x0 = scr.x + 44, cx = scr.x + scr.w / 2;
      // check pops on T 22.0 (frame 0 shows it)
      const u = Math.min(1, t / (3 / 24) + 1 / 3);
      const s = 1 + 0.25 * (1 - E.outBack(u));
      ctx.save();
      ctx.translate(cx, scr.y + 130);
      ctx.scale(s, s);
      ctx.fillStyle = P.okGreen;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.fill();
      L.inkPath(ctx, [[-28, 2], [-6, 26], [32, -22]], { width: 10, color: P.white, seed: 123, smooth: false });
      ctx.restore();
      L.text(ctx, 'Tu aporte llegó', cx, scr.y + 270, { size: 56, weight: 800, color: P.ink, family: C.SANS, align: 'center' });
      L.text(ctx, '#1 · 16/10 · 14:40', cx, scr.y + 320, { size: 30, color: P.inkSoft, family: MONO, align: 'center' });
      L.inkLine(ctx, x0, scr.y + 360, scr.x + scr.w - 44, scr.y + 360, { width: 2, color: P.inkFaint, seed: 124 });
      // bars grow T 22.5 to 23.0
      const g = E.outCubic(L.seg(t, 0.5, 1.0));
      const rows = [['Recaudado', 1.0, P.okGreen], ['Gastado', 0.62, P.ochre], ['Saldo', 0.38, P.payBlue]];
      const bw = scr.w - 88;
      rows.forEach(([name, v, col], i) => {
        const y = scr.y + 430 + i * 120;
        L.text(ctx, name, x0, y, { size: 34, weight: 700, color: P.ink, family: C.SANS });
        ctx.fillStyle = L.rgba(P.paperShade, 0.9);
        ctx.fillRect(x0, y + 20, bw, 34);
        ctx.fillStyle = col;
        ctx.fillRect(x0, y + 20, Math.max(0, bw * v * g - 2), 34);
      });
      // 40 colchones (T 23.0)
      const c = L.seg(t, 1.0 - 1 / 24, 1.0 + 4 / 24, 'outCubic');
      if (c > 0) {
        const y = scr.y + 860;
        ctx.save();
        ctx.globalAlpha = c;
        ctx.fillStyle = L.rgba(P.okGreen, 0.12);
        ctx.fillRect(x0 - 10, y - 60, bw + 20, 170);
        ctx.restore();
        L.text(ctx, 'La colecta compró', x0 + 10, y, { size: 34, color: P.inkSoft, family: C.SANS, alpha: c });
        L.text(ctx, '40 colchones · Itatí', x0 + 10, y + 64, { size: 46, weight: 800, color: P.ink, family: C.SANS, alpha: c });
      }
    },
  });
})();
