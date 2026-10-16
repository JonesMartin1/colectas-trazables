// 08 dona: T 14 to 16, illustrated. Layers: stripes > phone (ink) > screen UI > tap > receipt with code.
(function () {
  'use strict';
  const ID = 'dona';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeApricot], offset: (T * 2) * 6, seed: 81 });
      // receipt slides out from under the phone (T 15.0), drawn first so the phone covers its top
      const rp = L.seg(t, 1.0 - 1 / 24, 1.0 + 8 / 24, 'outCubic');
      if (rp > 0) {
        const ry = 1060 + 330 * rp;
        ctx.save();
        ctx.translate(560, ry);
        ctx.rotate(0.03);
        ctx.fillStyle = L.rgba(P.ink, 0.18);
        ctx.fillRect(-190 + 10, -150 + 12, 380, 300);
        ctx.fillStyle = P.white;
        ctx.fillRect(-190, -150, 380, 300);
        for (let x = -190; x < 190; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 150);
          ctx.lineTo(x + 10, 162);
          ctx.lineTo(x + 20, 150);
          ctx.fill();
        }
        L.text(ctx, 'Tu comprobante', 0, 30, { size: 30, weight: 600, color: P.inkSoft, family: C.SANS, align: 'center' });
        L.text(ctx, 'CT-7F3A-92', 0, 92, { size: 52, weight: 800, color: P.ink, family: 'Consolas, "Courier New", monospace', align: 'center' });
        ctx.restore();
      }
      // phone
      const scr = C.phoneInk(ctx, 540, 760, 560, 900, 82, T);
      L.text(ctx, 'Colecta', scr.x + 40, scr.y + 80, { size: 34, weight: 500, color: P.inkSoft, family: C.SANS });
      L.text(ctx, 'Inundados Itatí', scr.x + 40, scr.y + 140, { size: 46, weight: 800, color: P.ink, family: C.SANS });
      L.inkLine(ctx, scr.x + 40, scr.y + 180, scr.x + scr.w - 40, scr.y + 180, { width: 2, color: P.inkFaint, seed: 83 });
      L.text(ctx, '$ 5.000', scr.x + scr.w / 2, scr.y + 330, { size: 92, weight: 800, color: P.ink, family: C.SANS, align: 'center' });
      // button with a tap squash on T 14.5
      const tap = t >= 0.5 && t < 0.5 + 3 / 24 ? 0.94 : 1;
      const bw = (scr.w - 80) * tap, bh = 110 * tap;
      const bx = scr.x + scr.w / 2, by = scr.y + 480;
      ctx.save();
      ctx.fillStyle = P.payBlue;
      C.poly(ctx, L.rrectPts(bx - bw / 2, by - bh / 2, bw, bh, 26, 12));
      ctx.fill();
      ctx.restore();
      L.text(ctx, 'Donar', bx, by + 18, { size: 50, weight: 800, color: P.white, family: C.SANS, align: 'center' });
      // finger tap ring
      const ring = L.seg(t, 0.5 - 1 / 24, 0.5 + 7 / 24, 'outExpo');
      if (ring > 0 && ring < 1) L.inkCircle(ctx, bx + 120, by + 10, 30 + 90 * ring, { width: 3, color: P.annBlue, alpha: 1 - ring, seed: 84 });
      L.text(ctx, 'Mercado Pago o transferencia, como siempre', 540, 262, { size: 30, weight: 600, color: P.ink, family: C.SANS, align: 'center', alpha: L.seg(t, 1.2, 1.5) });
    },
  });
})();
