// 14 mapa: T 26 to 28, illustrated. A labelled sketch of Corrientes (not accurate geography).
// Layers: stripes > province shape (sage) > Paraná / Uruguay hatching > pins on beats > yellow ring > label.
(function () {
  'use strict';
  const ID = 'mapa';
  // stylised outline, screen coordinates (NW corner = the capital on the Paraná)
  const SHAPE = [[250, 520], [420, 470], [600, 500], [780, 470], [880, 560], [900, 760], [840, 980], [760, 1160], [640, 1330], [520, 1420], [400, 1390], [330, 1230], [280, 1020], [250, 800]];
  const PINS = [
    { name: 'Corrientes', x: 280, y: 545, at: 0.0 },
    { name: 'Itatí', x: 470, y: 505, at: 0.5 },
    { name: 'Empedrado', x: 262, y: 760, at: 1.0 },
  ];
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      L.stripes(ctx, { colors: [P.stripeCream, P.stripeSky], offset: (T * 2) * 6, seed: 141 });
      const bi = L.boil(T);
      L.inkPath(ctx, SHAPE, { closed: true, width: 5, color: P.ink, fill: L.mix(P.sage, P.paper, 0.45), seed: 142, boil: bi });
      L.hatch(ctx, SHAPE, { spacing: 12, angle: Math.PI / 4, color: P.ink, alpha: 0.18, seed: 143, bounds: [250, 470, 650, 950] });
      // Paraná along north and west, Uruguay along the east
      L.inkPath(ctx, [[120, 380], [300, 430], [480, 420], [700, 410], [840, 400]], { width: 14, color: P.teal, alpha: 0.85, seed: 144, boil: bi });
      L.inkPath(ctx, [[150, 420], [200, 700], [180, 1000], [230, 1350]], { width: 14, color: P.teal, alpha: 0.85, seed: 145, boil: bi });
      L.inkPath(ctx, [[960, 560], [970, 850], [900, 1150], [760, 1450]], { width: 12, color: P.teal, alpha: 0.7, seed: 146, boil: bi });
      L.text(ctx, 'río Paraná', 520, 385, { size: 30, weight: 600, color: P.tealDeep, family: C.SANS, italic: true });
      L.text(ctx, 'río Uruguay', 900, 1240, { size: 28, weight: 600, color: P.tealDeep, family: C.SANS, italic: true, align: 'right' });
      // pins on the beats
      for (const p of PINS) {
        if (t < p.at - 1e-6) continue;
        const u = Math.min(1, (t - p.at) / (3 / 24) + 1 / 3);
        const s = 1 + 0.4 * (1 - E.outBack(u));
        C.pin(ctx, p.x, p.y, 1.3 * s);
        L.text(ctx, p.name, p.x + 34, p.y + 12, { size: 38, weight: 800, color: P.ink, family: C.SANS });
      }
      const r = L.seg(t, 1.5 - 1 / 24, 1.5 + 7 / 24, 'outExpo');
      if (r > 0) L.inkCircle(ctx, 380, 600, 230, { ry: 170, width: 4, color: P.annYellow, draw: r, seed: 147 });
      L.text(ctx, 'Primeras colectas piloto', 540, 1500, { size: 44, weight: 800, color: P.ink, family: C.SANS, align: 'center', alpha: L.seg(t, 1.5, 1.8) });
      L.text(ctx, 'esquema, no a escala', 940, 300, { size: 22, color: P.inkSoft, family: C.SANS, align: 'right' });
    },
  });
})();
