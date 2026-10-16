# Art bible: Colectas Trazables — las noticias y la solución

The visual rules every scene follows.
Where this file and a scene brief disagree on a colour, weight or rule, this file wins.
Where this file and `docs/storyboard.md` disagree on a position or a time, the storyboard wins.

Sections 1 to 9 are the house style, fixed by the reference analysis — change them only after a fresh one (the skill's `templates/reference-analysis.md` shows the method). Sections 2.2, the identity tints in 2.3, and 10 are rewritten per film from the captured research.

## 1. Frame

The canvas is 1080 px wide and 1920 px tall at 24 fps.
Every pixel value in this file assumes that size.
The origin is the top-left corner and y grows downward.

### 1.1 Shorts safe area

YouTube Shorts draws its own interface over the video.
The title and channel row covers roughly the bottom 380 px, the button column covers roughly x 950 to 1080 from y 1000 down, and the top bar covers roughly the top 180 px.
Anything the viewer must read (the subject, a match-cut shape, a glyph that carries meaning, the wordmark) sits inside x 60 to 940 and y 220 to 1540.
Backgrounds, stripes, grain, guide geometry, construction lines and decorative scenery run full bleed.
The safe area is non-negotiable: the storyboard may never move must-read content outside it. If a composition collides with it, move the scenery — never the must-read content.

### 1.2 Composition for a tall frame

Compose for the height, never crop a square.
Hanging, climbing, falling and rising subjects use the vertical axis.
The frame centre line x = 540 is the default axis for the subject.
Large subjects fill 60 to 90 percent of the frame width so they read on a phone.

## 2. Palettes

Names below are the keys of `FILM.lib.pal`.
Where a key already exists in `src/lib.js`, the value here is the published final value.
Colour is flat.
Tone in illustrated mode comes from hatching, never from gradients.
Radial glow halos are allowed only in schematic mode.

### 2.1 Warm illustrated palette (paper plate)

| Name | Hex | Use |
|---|---|---|
| paper | #EFE3C9 | Paper base |
| paperShade | #E2D1B0 | Paper shadow, tucked edges on white |
| paperDeep | #CDB58C | Paper vignette, deep paper tone |
| stripeCream | #F2E7CF | Stripe band A, default |
| stripeYellow | #EFDCA3 | Stripe band B, warm default |
| stripeApricot | #F0D9B5 | Stripe band B, dawn or tender acts |
| stripeSage | #DCE3CC | Stripe band B, foliage acts |
| stripeSpring | #E4EDD0 | Stripe band B, new-growth acts |
| stripeSky | #C9D3D2 | Stripe band B, open-sky acts |
| ink | #2A1C13 | Main outlines |
| inkSoft | #5B4331 | Secondary outlines, detail lines |
| inkFaint | #8A735C | Construction lines, graticule |
| tan | #C8A47A | Dry organic matter |
| ochre | #C38F2E | Earthy accent |
| rose | #C88C86 | Dusty rose accents |
| duskRose | #E3B1A1 | Dusk sky band |
| sage | #94A47F | Generic foliage |
| teal | #3C8783 | Water hatching, teal accents |
| tealDeep | #285F5D | Deep water hatching |
| sun | #F1BF4A | Sun disc |
| nightSky | #4E3F6E | Night sky band |
| night | #2F2748 | Deepest night, star-field base |
| white | #FBF6EA | Highlights, silk, moon |

Stripe band B changes by act; the storyboard assigns one per act.
`orange #D8742B`, `leaf #6E8F4F`, `wood #A8784C`, `sunset #E79D8F`, `dusk #5A4878` and `red #BF3F2C` stay available in `lib.pal` for incidental scenery.

### 2.2 Subject palette, warm

| Name | Hex | Use |
|---|---|---|
| kraft | #C9A877 | The board the clippings are pasted on |
| kraftDeep | #A88457 | Board hatching, shadow under clippings |
| newsprint | #F4F0E6 | Clipping paper |
| newsprintShade | #E1D9C6 | Clipping torn edge, shade |
| headline | #1E1A17 | Headline and masthead ink |
| greek | #B9B0A0 | Greeked body text bars and far-away headlines |
| tape | #E9DFB4 | Masking tape strips (alpha 0.85) |
| pinRed | #C23B2E | Pins, red string, alarm rings, the "bad alias" mark |
| okGreen | #3E8E5A | "Oficial", "llegó", check marks on paper |
| sticky | #F3D86A | The fairness sticky note |
| screen | #FBF8F0 | Phone screens on paper |
| payBlue | #3D7FC1 | The donate button (generic, not a brand colour) |

### 2.3 Cool schematic palette (blueprint plate)

| Name | Hex | Use |
|---|---|---|
| navy | #0B1230 | Blueprint base |
| navyDeep | #060A1C | Near-black navy for the opening spark frame |
| navyLight | #18234D | Inset circle fills, panel tint |
| grid | #3A4A86 | 60 px grid lines |
| lavender | #C8C1EF | Main linework |
| lineWhite | #EEF0FF | Emphasis lines, veins, ticks |
| paleBlue | #9CC2EA | Secondary accent, frost |
| glow | #FFF3DC | Nucleus cores, sun glyph, glows |
| magenta | #FF3D98 | Moments of change only |

Subject identity tints for this film: `schemOk #7FE3A1` (official, verified) and `schemCoin #F2C77A` (a donation travelling).
Subject tints are line or dot colours, never fills, and a schematic shot uses at most one of them besides magenta.

### 2.4 Overlay colours on illustrations

| Name | Hex | Use |
|---|---|---|
| annMagenta | #E43D8C | Change rings, trajectories, target rings |
| annBlue | #3B8EE0 | Trajectory and motion lines, fluid paths, rulers |
| annYellow | #EAB530 | Attention rings, brackets, tally rings, sun paths |
| teal | #3C8783 | Secondary guide lines when blue is already in use |

Overlays sit above the illustration at full opacity and never get hatched or grained.

## 3. Line

All widths are at 1080 px wide.
Illustrated lines come from `lib.inkPath` with pressure variation of plus or minus 25 percent.

### 3.1 Illustrated weights

| Element | Width | Colour and opacity |
|---|---|---|
| Hero subject outline | 5 px | ink 100% |
| Doubled hero outline, occasional | 1.5 px, offset 3 px | ink 40% |
| Secondary form outline | 3 px | ink 100% |
| Detail lines: segment rings, veins, ridges | 1.8 px | inkSoft 90% |
| Hatch strokes | 1.2 to 1.8 px | ink or the form's deep colour, 70 to 90% |
| Construction lines | 1.5 px | inkFaint 30% |

Hero-specific line treatments (for example the band widths of a wing's veins) are specified in section 10 with exact widths at a stated subject size, and scale with the drawn size.

### 3.2 Schematic weights

| Element | Width | Colour and opacity |
|---|---|---|
| Primary outline, double | outer 2.5 px and inner 1.5 px, 9 px apart | lavender 85% outer, 50% inner |
| Secondary outline | 1.5 px | lavender 60% |
| Lattice and cell lines | 1 px | lavender 30 to 40% |
| Grid | 1 px, 60 px pitch | grid 35% |
| Guide circles | 1.5 px | lavender 12 to 18% |
| Long diagonals | 1 px | lavender 12% |
| Ticks | 1.5 px, 10 to 20 px long | lineWhite 60% |
| Brackets | 1.5 px, end ticks 16 px | lavender 60% |
| Magenta flashes and rings | 3 px | magenta 100%, fading |

### 3.3 Overlay weights

| Element | Width |
|---|---|
| Attention and change rings | 3 px |
| Trajectory lines | 2.5 px |
| Dashed trajectories | 2.5 px, 14 px on and 10 px off |
| Motion rings | 2 px |
| Arc annotations | 2 px with 8 px end ticks |
| Rulers | 2 px, short ticks 12 px, long ticks 28 px |

## 4. Tone

### 4.1 Hatching

Light comes from the upper left, so shadow falls on the lower right of each form.
Only shadow sides and recesses get hatched, and lit sides stay flat colour.
The primary hatch runs at 45 degrees, rising from lower left to upper right.
Cross-hatch adds a second layer at 105 degrees for deep shadow.
Spacing sets the tone: 12 px for light shade, 8 px for mid shade, 5 px for dark shade, with the cross layer at 7 px.
Cylinders (stems, bodies, trunks) take contour hatching perpendicular to the long axis, slightly curved, 6 to 8 px apart, on the shadow half only.
Foliage takes hatching parallel to the side veins, between the veins.
Bark takes lengthwise hatching.
Water takes horizontal hatching, and coastlines take engraved hatching parallel to the coast that fades with distance offshore.
Every stroke jitters: angle plus or minus 3 degrees, spacing plus or minus 15 percent, each end plus or minus 6 px.

### 4.2 Stipple

Stipple dots have a radius of 1.0 to 2.2 px.
Use stipple for hairs, frost, stars, fine tissue texture, and the body texture of a subject seen very small.
Density runs from 0.002 dots per px² (sparse) to 0.02 dots per px² (dense).

### 4.3 Grain and boil

`core` lays paper grain over illustrated shots and fine noise over schematic shots, re-seeded on the 12 fps boil clock.
Scenes do not add their own full-frame grain.
Every ink and schematic line wobbles on the same 12 fps boil through `lib.boil(T)`, so still frames shimmer like drawn animation.

### 4.4 Stripes

The stripe background uses `lib.stripes` with a band width of 140 px at 30 degrees, rising left to right (`width: 140, angle: -0.52`).
Band A is stripeCream and band B changes by act, as listed in 2.1.
Stripes drift 6 px along their normal per beat unless a shot says otherwise.

## 5. Schematic language

The schematic shots explain what happens inside, and they never show the outside life.
Every schematic frame starts from `lib.blueprint`: navy base, 60 px grid, at least one large faint guide circle, and two long diagonals.
The subject is a double lavender outline with fine internal structure.
Cell structure is a lattice: hexagons (14 to 18 px cells) for tissue and eyes, rectangular cells for shells and sections.
Nuclei and points of activity are glow dots: core radius 8 to 10 px in glow, halo radius 40 px, and 8 to 16 radial ticks 14 to 22 px long at 70 percent.
Measurement is shown with brackets, tick scales and arc annotations, never with numbers.
DEVIATION for this film (decided 16/10): the subject is news and verification, so short labels are allowed in schematic shots (12 to 40 px, lavender or lineWhite), never more than 6 words each, always inside the safe area.
Relationships are shown as a network: thin curved lavender lines from a source region to small circular node glyphs 90 to 120 px across.
Magenta marks a moment of change and each magenta event lasts at most 12 frames before fading.
Progress glyph: a ring of 5 arcs (verify, donate, record, read, sign), the current arc lit in schemOk, at (900, 300) in every schematic shot. Canonical helper: `FILM.cast.progress(ctx, k, a)` in src/cast.js.

## 6. Overlays on illustrations

Overlays show what the drawing cannot: paths, attention, sound, time and scale.
They are thin rings, arcs, straight guide lines, rulers and brackets in the four overlay colours.
Rings expand with `outExpo` and fade over 5 to 12 frames.
Trajectory lines draw on behind a moving subject at 24 fps.
Every illustrated shot carries at least one overlay and at most four overlay colours at once.

## 7. Motion

### 7.1 The on-twos rule

Anything that is drawn as a character or object moves on twos.
Compute its pose from `lib.onTwos(t)`, so it changes 12 times a second and holds each drawing for 2 frames.
Camera moves, zooms, overlay draw-on progress and ring expansion run at a full 24 fps so they stay smooth.
Line wobble follows the 12 fps boil clock.

### 7.2 Timing

The beat is 60/bpm seconds; at the default 120 bpm that is 0.5 s, which is 12 frames at 24 fps, an 8th note 6 frames and a 16th note 3.
Every pop, cut and hit lands on a beat, an 8th or a 16th, exactly on the frame.
Pops use `outBack` over 3 frames with a 6 to 10 percent overshoot.
Draw-ons use `outExpo` over 6 frames.
Character motion never eases for longer than one beat, and only camera moves may run slower.
Motion should feel snappy, never floaty.

### 7.3 Determinism

Seed every random choice from `lib.hash(shotId, ...)` through `lib.rng`.
A scene draws from `t` alone and never depends on a previous frame.
A scene may be asked for `t` slightly beyond its duration during a transition, so clamp to the final pose.

## 8. Match cuts

A match cut keeps a shape on the same pixels across a mode change.
The shared geometry tables live in `docs/storyboard.md`, section "Shared geometry", and scenes copy those numbers exactly.
Line weights may change across the cut, positions may not.

## 9. Wordmark

The wordmark is "colectas trazables" in lowercase, lib.text, 64 px, weight 300, letter-spacing 0.12 em, lavender 90 percent, centred on x 540, baseline y 1100. Below it, "mirá llegar tu ayuda" at 36 px, baseline 1170.

## 10. Subject reference

Sources checked on 2026-10-16: Infobae 16/10/2026; Los Andes 21/02/2022; La Gaceta 2023; Corta 2023; LM Neuquén 2023; La Nación 18/02/2026; Aire de Santa Fe 2026; Chequeado 2025; La República 01/07/2026. Detail in colectas-trazables/docs/ANTECEDENTES.md and NEGOCIO.md.

### 10.1 The clippings (headlines are quoted exactly; long ones end in an ellipsis)

| Id | Outlet | Date | Headline |
|---|---|---|---|
| C1 | Infobae | 16/10/2026 | El Niño: las aguas del Paraná ingresaron a la ciudad de Corrientes y la provincia suma más de 200 evacuados |
| C2 | Los Andes | 21/02/2022 | Santi Maratea lo hizo otra vez: juntó más de 111 millones de pesos para combatir los incendios en Corrientes |
| C3 | La Gaceta | 2023 | Por qué la colecta de Santiago Maratea para Independiente está en la mira de la AFIP |
| C4 | Corta | 2023 | Colecta de Santi Maratea: las 10 irregularidades que detectó la IGJ |
| C5 | La Nación | 18/02/2026 | Santi Maratea se defendió de una denuncia por una de sus colectas |
| C6 | Chequeado | 2025 | Inundaciones en Bahía Blanca: cuidado con los intentos de estafas al momento de hacer una transferencia |
| C7 | La República | 01/07/2026 | Autoridades de EE.UU. advierten posibles estafas en donaciones para Venezuela tras doble terremoto |

A clipping: torn-edge newsprint card, masthead (outlet, caps, sans, 26 px, letter-spacing 0.1 em) with a rule under it, headline in a bold serif at 50 to 56 px, date line 22 px, then 4 to 6 greeked body lines. Two tape strips on the top corners.

### 10.2 The fairness rules (non-negotiable)

- The sticky note next to C3/C4 says: "Después la IGJ dijo que la colecta estaba en orden" (LM Neuquén, 2023).
- The caption next to C5 says: "Él dice que tiene todos los comprobantes." (La Nación / Aire de Santa Fe, 2026). The film never says or implies that anyone stole.
- The question card says "¿Adónde fue cada peso?" — a question about visibility, not an accusation.

### 10.3 The solution (what each schematic must show truthfully)

- Alias check: an alias typed, a green ring "OFICIAL · firmado por Defensa Civil y Cáritas"; a look-alike alias gets a red mark "NO REGISTRADO".
- Donation: paid with an ordinary button; the donor gets a code like "CT-7F3A-92".
- Record: a topic in Hedera's Consensus Service; each message is one event, numbered #1, #2… with a consensus time; only hashes, no names; "sin clave de admin: nadie lo borra".
- Invoice: Factura with CUIT and CAE; its fingerprint (hash) goes into the topic.
- Mirror node: anyone reads for free ("leer: USD 0").
- Signers: 4 institutions, threshold key 2 of 4.
- Map: Corrientes province, stylised; Paraná on the north and west edge, Uruguay on the east; pins Corrientes (capital, NW corner), Itatí (east of the capital on the Paraná), Empedrado (south of the capital on the Paraná).

### 10.4 Mistakes to avoid

- Calling Hedera "blockchain" in on-screen text — it is "Hedera" or "registro distribuido".
- Showing a person's name or amount next to a donor — donations are anonymous hashes.
- Drawing the Mercado Pago logo or any brand logo — the button is a generic blue "Donar".
- Drawing the map as accurate geography — it is a labelled sketch.
