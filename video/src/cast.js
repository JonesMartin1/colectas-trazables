// Shared drawing pieces for this film (art bible 10, storyboard G1 and G2).
// The board and its clippings, the red strings, the phones and the progress glyph live here so
// every scene draws them identically. Everything is seeded from fixed keys and depends on t alone.
(function () {
  'use strict';
  const L = FILM.lib;
  const P = L.pal;
  const FR = 1 / 24;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const SERIF = 'Georgia, "Times New Roman", serif';
  const SANS = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

  // ---------------------------------------------------------------------------
  // G1: the board (world coordinates 2400 x 4500) and its clippings
  // ---------------------------------------------------------------------------
  const BOARD = { w: 2400, h: 4500 };
  const CLIPS = [
    { id: 'C1', x: 540, y: 760, w: 880, rot: -0.035, at: -1, outlet: 'INFOBAE', date: '16/10/2026',
      head: 'El Niño: las aguas del Paraná ingresaron a la ciudad de Corrientes y la provincia suma más de 200 evacuados' },
    { id: 'C2', x: 1640, y: 820, w: 880, rot: 0.03, at: 2.0, outlet: 'LOS ANDES', date: '21/02/2022',
      head: 'Santi Maratea lo hizo otra vez: juntó más de 111 millones de pesos para combatir los incendios en Corrientes' },
    { id: 'C3', x: 540, y: 2050, w: 880, rot: 0.03, at: 4.0, outlet: 'LA GACETA', date: '2023',
      head: 'Por qué la colecta de Santiago Maratea para Independiente está en la mira de la AFIP' },
    { id: 'C4', x: 560, y: 2560, w: 860, rot: -0.025, at: 5.0, outlet: 'CORTA', date: '2023',
      head: 'Colecta de Santi Maratea: las 10 irregularidades que detectó la IGJ' },
    { id: 'C5', x: 1640, y: 2150, w: 880, rot: -0.02, at: 6.0, outlet: 'LA NACION', date: '18/02/2026',
      head: 'Santi Maratea se defendió de una denuncia por una de sus colectas' },
    { id: 'C6', x: 1150, y: 3200, w: 880, rot: 0.025, at: 8.0, outlet: 'CHEQUEADO', date: '2025',
      head: 'Inundaciones en Bahía Blanca: cuidado con los intentos de estafas al momento de hacer una transferencia' },
    { id: 'C7', x: 1250, y: 3720, w: 880, rot: -0.03, at: 9.0, outlet: 'LA REPÚBLICA', date: '01/07/2026',
      head: 'Autoridades de EE.UU. advierten posibles estafas en donaciones para Venezuela tras doble terremoto' },
  ];
  const BYID = {};
  for (const c of CLIPS) BYID[c.id] = c;

  // word wrap, measured once per (font, text, width) and cached
  const wrapCache = {};
  function wrap(ctx, str, font, maxW) {
    const key = font + '|' + maxW + '|' + str;
    if (wrapCache[key]) return wrapCache[key];
    ctx.save();
    ctx.font = font;
    const words = str.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    const out = lines.map((s) => ({ s, w: ctx.measureText(s).width }));
    ctx.restore();
    wrapCache[key] = out;
    return out;
  }

  const HS = 58; // headline size
  const PAD = 34;
  function layout(ctx, c) {
    const font = `800 ${HS}px ${SERIF}`;
    const lines = wrap(ctx, c.head, font, c.w - PAD * 2);
    const lh = Math.round(HS * 1.14);
    const top = PAD + 46; // masthead row
    const headTop = top + 18;
    const bodyTop = headTop + lines.length * lh + 14;
    const h = bodyTop + 3 * 30 + PAD - 6;
    return { font, lines, lh, top, headTop, bodyTop, h };
  }

  // torn-edge outline, built once per clipping, t-independent
  function tornPts(c, w, h) {
    const key = 'torn|' + c.id + '|' + w + '|' + h;
    return L.cached(key, () => {
      const r = L.rng(L.hash('board', c.id, 'torn'));
      const pts = [];
      const step = 22;
      const j = (a) => (r() - 0.5) * a;
      for (let x = 0; x <= w; x += step) pts.push([x - w / 2 + j(2), -h / 2 + j(7)]);
      for (let y = step; y <= h; y += step) pts.push([w / 2 + j(7), y - h / 2 + j(2)]);
      for (let x = w - step; x >= 0; x -= step) pts.push([x - w / 2 + j(2), h / 2 + j(7)]);
      for (let y = h - step; y > 0; y -= step) pts.push([-w / 2 + j(7), y - h / 2 + j(2)]);
      return pts;
    });
  }

  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // slap-on scale: 1.12 at the paste frame, outBack to 1 over 3 frames
  function slapScale(T, at) {
    if (at < 0) return 1;
    const u = clamp((T - at) / (3 * FR) + 1 / 3);
    return 1 + 0.12 * (1 - L.ease.outBack(u));
  }

  /**
   * clipping(ctx, id, T, { greek }) draws clipping id in world coordinates, if it has been pasted by T.
   * Returns { lineBox(i) } giving a line's centre and width in world coordinates, or null when not pasted.
   */
  function clipping(ctx, id, T, o = {}) {
    const c = BYID[id];
    if (c.at >= 0 && T < c.at - 1e-6) return null;
    const lay = layout(ctx, c);
    const w = c.w, h = lay.h;
    const s = slapScale(T, c.at);
    const lift = (s - 1) / 0.12; // 1 at the paste frame
    const pts = tornPts(c, w, h);
    const bi = L.boil(T);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.scale(s, s);
    // shadow
    ctx.save();
    ctx.translate(10 + lift * 16, 14 + lift * 22);
    poly(ctx, pts);
    ctx.fillStyle = L.rgba(P.kraftDeep, 0.55 - lift * 0.2);
    ctx.fill();
    ctx.restore();
    // paper
    poly(ctx, pts);
    ctx.fillStyle = P.newsprint;
    ctx.fill();
    // a faint shade band along the lower edge (light from the upper left)
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    ctx.fillStyle = L.rgba(P.newsprintShade, 0.55);
    ctx.fillRect(-w / 2, h / 2 - 26, w, 30);
    ctx.fillRect(w / 2 - 18, -h / 2, 20, h);
    ctx.restore();
    L.inkPath(ctx, pts, { closed: true, width: 1.6, color: P.inkSoft, alpha: 0.55, seed: L.hash('board', id, 'edge'), boil: bi, smooth: false });
    const x0 = -w / 2 + PAD;
    const greek = !!o.greek;
    // masthead
    if (greek) {
      ctx.fillStyle = L.rgba(P.headline, 0.75);
      ctx.fillRect(x0, -h / 2 + PAD + 8, 170, 20);
      ctx.fillStyle = L.rgba(P.greek, 0.9);
      ctx.fillRect(w / 2 - PAD - 120, -h / 2 + PAD + 12, 120, 12);
    } else {
      L.text(ctx, c.outlet, x0, -h / 2 + PAD + 26, { size: 26, weight: 800, color: P.headline, family: SANS, tracking: 3 });
      L.text(ctx, c.date, w / 2 - PAD, -h / 2 + PAD + 26, { size: 22, weight: 600, color: P.inkSoft, family: SANS, align: 'right' });
    }
    ctx.fillStyle = P.headline;
    ctx.fillRect(x0, -h / 2 + lay.top, w - PAD * 2, 2.5);
    // headline
    for (let i = 0; i < lay.lines.length; i++) {
      const ln = lay.lines[i];
      const by = -h / 2 + lay.headTop + (i + 1) * lay.lh - 12;
      if (greek) {
        ctx.fillStyle = L.rgba(P.headline, 0.8);
        ctx.fillRect(x0, by - HS * 0.62, ln.w, HS * 0.6);
      } else {
        L.text(ctx, ln.s, x0, by, { size: HS, weight: 800, color: P.headline, family: SERIF });
      }
    }
    // greeked body copy
    const r = L.rng(L.hash('board', id, 'body'));
    ctx.fillStyle = L.rgba(P.greek, 0.85);
    for (let k = 0; k < 3; k++) {
      const by = -h / 2 + lay.bodyTop + k * 30;
      const colW = (w - PAD * 2 - 24) / 2;
      ctx.fillRect(x0, by, colW * (0.82 + r() * 0.18), 11);
      ctx.fillRect(x0 + colW + 24, by, colW * (k === 2 ? 0.55 : 0.82 + r() * 0.18), 11);
    }
    // tape on the top corners, after the slap settles
    if (lift < 0.5) {
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(sx * (w / 2 - 40), -h / 2 + 4);
        ctx.rotate(sx * 0.5 + (r() - 0.5) * 0.1);
        ctx.fillStyle = L.rgba(P.tape, 0.86);
        ctx.fillRect(-58, -18, 116, 36);
        ctx.fillStyle = L.rgba(P.newsprintShade, 0.6);
        ctx.fillRect(-58, -18, 116, 4);
        ctx.restore();
      }
    }
    // dust ticks for 6 frames after the slap
    if (c.at >= 0 && T >= c.at && T < c.at + 6 * FR) {
      const u = (T - c.at) / (6 * FR);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + 0.3;
        const R0 = Math.max(w, h) * 0.52 + u * 40;
        const x1 = Math.cos(a) * R0 * (w / Math.max(w, h)), y1 = Math.sin(a) * R0 * (h / Math.max(w, h));
        L.inkLine(ctx, x1, y1, x1 * (1.06 + u * 0.08), y1 * (1.06 + u * 0.08), { width: 3, color: P.ink, alpha: 1 - u, seed: k + 7 });
      }
    }
    ctx.restore();
    const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
    return {
      h,
      lineBox(i) {
        const ln = lay.lines[Math.min(i, lay.lines.length - 1)];
        const lx = x0 + ln.w / 2, ly = -h / 2 + lay.headTop + (i + 1) * lay.lh - 12 - HS * 0.33;
        return { x: c.x + lx * cs - ly * sn, y: c.y + lx * sn + ly * cs, w: ln.w, h: lay.lh, rot: c.rot };
      },
      lines: lay.lines.map((l) => l.s),
      top: { x: c.x + (h / 2) * sn, y: c.y - (h / 2) * cs },
    };
  }

  // kraft board under the current camera, with a fibre pattern tile
  function boardBase(ctx) {
    ctx.fillStyle = P.kraft;
    ctx.fillRect(-6000, -6000, BOARD.w + 12000, BOARD.h + 12000);
    const fib = L.cached('kraft-fibres', () => {
      const r = L.rng(L.hash('kraft', 'fibres'));
      const out = [];
      for (let i = 0; i < 2600; i++) out.push([r() * (BOARD.w + 1200) - 600, r() * (BOARD.h + 1200) - 600, 6 + r() * 22, r() * Math.PI, r()]);
      return out;
    });
    ctx.save();
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = L.rgba(k ? P.kraftDeep : P.paperShade, k ? 0.38 : 0.45);
      ctx.beginPath();
      for (let i = k; i < fib.length; i += 2) {
        const f = fib[i];
        const dx = Math.cos(f[3]) * f[2], dy = Math.sin(f[3]) * f[2] * 0.35;
        ctx.moveTo(f[0] - dx, f[1] - dy);
        ctx.lineTo(f[0] + dx, f[1] + dy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function pin(ctx, x, y, s = 1) {
    ctx.save();
    ctx.fillStyle = L.rgba(P.ink, 0.25);
    ctx.beginPath();
    ctx.ellipse(x + 6 * s, y + 9 * s, 15 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.pinRed;
    ctx.beginPath();
    ctx.arc(x, y, 15 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = L.rgba(P.white, 0.7);
    ctx.beginPath();
    ctx.arc(x - 5 * s, y - 5 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    L.inkCircle(ctx, x, y, 15 * s, { width: 2, color: P.ink, alpha: 0.8, seed: Math.round(x + y) });
  }

  /** The whole board at time T under camera cam; focus = ids that draw real text. Returns the clip handles. */
  function board(ctx, T, cam, focus) {
    const out = {};
    L.camera(ctx, cam, () => {
      boardBase(ctx);
      for (const c of CLIPS) {
        out[c.id] = clipping(ctx, c.id, T, { greek: !focus.includes(c.id) });
        if (out[c.id]) pin(ctx, out[c.id].top.x, out[c.id].top.y + 24);
      }
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Schematic and paper pieces for act 2
  // ---------------------------------------------------------------------------

  /** G2: progress ring, 5 arcs, arc k lit; a = fade-in alpha. */
  function progress(ctx, k, a = 1) {
    const cx = 900, cy = 300, r = 46, gap = (10 * Math.PI) / 180;
    const seg = (Math.PI * 2) / 5;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a0 = -Math.PI / 2 + i * seg + gap / 2, a1 = a0 + seg - gap;
      ctx.strokeStyle = i === k ? P.schemOk : i < k ? L.rgba(P.schemOk, 0.45 * a) : L.rgba(P.lavender, 0.3 * a);
      ctx.globalAlpha = i === k ? a : 1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
    L.ticks(ctx, cx, cy, { r: r + 10, n: 20, len: 6, color: P.lineWhite, alpha: 0.35 * a });
  }

  /** Schematic phone: double lavender outline. */
  function phoneSchem(ctx, cx, cy, w, h, draw = 1, seed = 1) {
    const pts = L.rrectPts(cx - w / 2, cy - h / 2, w, h, 56, 18);
    L.inkPath(ctx, pts, { closed: true, width: 2.5, color: P.lavender, alpha: 0.85, draw, seed, double: { offset: 9, width: 1.5, alpha: 0.5, from: 0, to: 1 } });
    if (draw >= 1) {
      L.inkPath(ctx, L.rrectPts(cx - 60, cy - h / 2 + 22, 120, 14, 7, 8), { closed: true, width: 1.5, color: P.lavender, alpha: 0.6, seed: seed + 3 });
    }
  }

  /** Ink phone on paper with a white screen; returns the screen rect. */
  function phoneInk(ctx, cx, cy, w, h, seed = 1, T = 0) {
    const bi = L.boil(T);
    const body = L.rrectPts(cx - w / 2, cy - h / 2, w, h, 64, 16);
    ctx.save();
    ctx.translate(14, 18);
    ctx.fillStyle = L.rgba(P.ink, 0.18);
    poly(ctx, body);
    ctx.fill();
    ctx.restore();
    L.inkPath(ctx, body, { closed: true, width: 5, color: P.ink, fill: P.ink, seed, boil: bi });
    const sx = cx - w / 2 + 26, sy = cy - h / 2 + 70, sw = w - 52, sh = h - 140;
    L.inkPath(ctx, L.rrectPts(sx, sy, sw, sh, 30, 16), { closed: true, width: 2, color: P.ink, fill: P.screen, seed: seed + 1, boil: bi });
    return { x: sx, y: sy, w: sw, h: sh };
  }

  /** Hand-drawn ellipse around a box {x, y, w, h, rot}, drawn on by p (0..1). */
  function ringBox(ctx, box, p, color, seed = 1, T = 0, pad = 26) {
    if (p <= 0) return;
    const pts = L.ellipsePts(box.x, box.y, box.w / 2 + pad, box.h / 2 + pad * 0.55, 72, box.rot || 0);
    L.inkPath(ctx, pts, { closed: false, width: 4.5, color, draw: p, seed, boil: L.boil(T), wobble: 3 });
  }

  function label(ctx, str, x, y, o = {}) {
    L.text(ctx, str, x, y, Object.assign({ size: 30, weight: 500, color: P.lavender, family: SANS }, o));
  }

  FILM.cast = Object.freeze({ BOARD, CLIPS, BYID, SERIF, SANS, wrap, clipping, board, boardBase, pin, slapScale, progress, phoneSchem, phoneInk, label, poly, ringBox });
})();
