// 07 alias-verde: T 12 to 14, schematic. Layers: blueprint > guides > phone > field 1 + OFICIAL > field 2 + NO REGISTRADO > progress.
(function () {
  'use strict';
  const ID = 'alias-verde';
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, C = FILM.cast, E = L.ease;
      const t = Math.max(0, Math.min(tIn, info.dur)), T = info.shot.start + t;
      const MONO = 'Consolas, "Courier New", monospace';
      L.blueprint(ctx, { seed: 7, center: [540, 880] });
      L.guideCircle(ctx, 540, 880, 470, { color: P.lavender, alpha: 0.14 });
      // phone
      C.phoneSchem(ctx, 540, 900, 600, 1080, L.seg(t, 0, 0.2, 'outExpo') || 1, 71);
      C.label(ctx, '¿Este alias es real?', 540, 540, { size: 40, weight: 600, color: P.lineWhite, align: 'center' });
      // field 1
      const f1 = [290, 600, 500, 86];
      L.inkPath(ctx, L.rrectPts(f1[0], f1[1], f1[2], f1[3], 16, 10), { closed: true, width: 2, color: P.lavender, alpha: 0.8, seed: 72 });
      L.text(ctx, 'colecta.itati', 320, 657, { size: 40, weight: 600, color: P.lineWhite, family: MONO, p: L.seg(t, 0, 0.45) });
      // OFICIAL (T 12.5)
      const ok = L.seg(t, 0.5 - 1 / 24, 0.5 + 5 / 24, 'outExpo');
      if (ok > 0) {
        L.glowDot(ctx, 540, 800, 10, { color: P.schemOk, alpha: ok });
        L.inkCircle(ctx, 540, 800, 64, { width: 4, color: P.schemOk, draw: ok, seed: 73 });
        L.inkCircle(ctx, 540, 800, 64 + 70 * ok, { width: 2, color: P.schemOk, alpha: 1 - ok, seed: 74 });
        L.inkPath(ctx, [[508, 802], [532, 828], [578, 772]], { width: 7, color: P.schemOk, draw: ok, seed: 75, smooth: false });
        C.label(ctx, 'OFICIAL', 540, 920, { size: 52, weight: 800, color: P.schemOk, align: 'center', alpha: ok, tracking: 4 });
        C.label(ctx, 'firmado por Defensa Civil + Cáritas', 540, 968, { size: 28, color: P.lavender, align: 'center', alpha: ok });
      }
      // field 2 (T 13.0) and NO REGISTRADO (T 13.5)
      if (t >= 1.0) {
        const f2 = [290, 1040, 500, 86];
        L.inkPath(ctx, L.rrectPts(f2[0], f2[1], f2[2], f2[3], 16, 10), { closed: true, width: 2, color: P.lavender, alpha: 0.8, seed: 76 });
        L.text(ctx, 'colecta.itati1', 320, 1097, { size: 40, weight: 600, color: P.lineWhite, family: MONO, p: L.seg(t, 1.0, 1.45) });
      }
      const bad = L.seg(t, 1.5 - 1 / 24, 1.5 + 5 / 24, 'outExpo');
      if (bad > 0) {
        L.inkCircle(ctx, 540, 1235, 56, { width: 4, color: P.magenta, draw: bad, seed: 77 });
        L.inkLine(ctx, 515, 1210, 565, 1260, { width: 7, color: P.magenta, draw: bad, seed: 78 });
        L.inkLine(ctx, 565, 1210, 515, 1260, { width: 7, color: P.magenta, draw: bad, seed: 79 });
        C.label(ctx, 'NO REGISTRADO', 540, 1350, { size: 44, weight: 800, color: P.magenta, align: 'center', alpha: bad, tracking: 3 });
      }
      // side bracket and progress glyph
      L.bracket(ctx, 175, 600, 175, 1360, { color: P.lavender, alpha: 0.5 });
      L.ticks(ctx, 120, 980, { r: 0, n: 1, len: 0 });
      C.progress(ctx, 0, 1);
    },
  });
})();
