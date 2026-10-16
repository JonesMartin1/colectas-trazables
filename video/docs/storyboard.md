# Storyboard: Colectas Trazables — las noticias y la solución

## Logline

Story: the week's and the year's headlines about donations get pasted on a board until one question remains, "¿Adónde fue cada peso?", and then Colectas Trazables answers it step by step. Method: paper-plate collage shots for the news, blueprint shots for how the solution works, alternating once the solution starts.

## Numbers

- 120 bpm, beat 0.5 s (12 frames), bar 2 s.
- 32 s = 16 bars = 768 frames at 24 fps, 1080x1920.
- 16 shots of 2 s each (one bar each).

## Summary

| Order | Id | Start | End | Mode | Title |
|---|---|---|---|---|---|
| 01 | crecida | 0 | 2 | illustrated | The flood headline (C1) |
| 02 | maratea-111 | 2 | 4 | illustrated | 111 millones en una noche (C2) |
| 03 | afip-igj | 4 | 6 | illustrated | AFIP and IGJ, with the fairness note (C3, C4) |
| 04 | defensa | 6 | 8 | illustrated | 2026: he defends himself (C5) |
| 05 | estafas | 8 | 10 | illustrated | Scams with fake accounts (C6, C7) |
| 06 | adonde-fue | 10 | 12 | illustrated | Pull back: ¿Adónde fue cada peso? |
| 07 | alias-verde | 12 | 14 | schematic | The alias turns green |
| 08 | dona | 14 | 16 | illustrated | Donate as always, get a code |
| 09 | registro | 16 | 18 | schematic | The donation becomes message #1 in Hedera |
| 10 | factura | 18 | 20 | illustrated | The invoice and its CAE |
| 11 | mirror | 20 | 22 | schematic | Anyone reads it, free |
| 12 | tu-ayuda | 22 | 24 | illustrated | "Tu aporte llegó" |
| 13 | firmas | 24 | 26 | schematic | 2 of 4 signatures |
| 14 | mapa | 26 | 28 | illustrated | Itatí, Empedrado, Corrientes |
| 15 | frase | 28 | 30 | illustrated | La provincia donde la solidaridad se ve |
| 16 | marca | 30 | 32 | schematic | Wordmark |

## Structure

- Act 1, bars 1 to 6 (0 to 12 s): the news. One continuous board in world coordinates (G1); each shot pans to the next clipping, which slaps on on the downbeat. Shot 06 pulls back over the whole board.
- Act 2, bars 7 to 16 (12 to 32 s): the solution, plates alternating. The hinge "registro" lands on the midpoint downbeat (T 16).
- Time device: the progress glyph ring (5 arcs) on every schematic shot.
- The ending (16) leaves the wordmark on navy; the film does not loop.

## Conventions

- `T` global seconds, `t` shot-local. Hard cuts everywhere except 07 (flash in) and 16 (fade in).
- Only the clipping(s) a shot is about draw real text; every other clipping on the board is greeked (bars), so no text leaves the safe area while the camera moves.

## Shared geometry

### G1: the board (world coordinates, 2400 x 4500)

| Clipping | Centre x, y | Width | Rotation (rad) | Pasted at T |
|---|---|---|---|---|
| C1 | 540, 760 | 820 | -0.035 | before 0 (on frame 0) |
| C2 | 1640, 820 | 820 | 0.03 | 2.0 |
| C3 | 540, 2050 | 800 | 0.03 | 4.0 |
| C4 | 560, 2560 | 780 | -0.025 | 5.0 |
| C5 | 1640, 2150 | 820 | -0.02 | 6.0 |
| C6 | 1150, 3200 | 820 | 0.025 | 8.0 |
| C7 | 1250, 3720 | 800 | -0.03 | 9.0 |

Camera centres (zoom 1): 01 (540, 960) → 02 (1640, 960) → 03 (540, 2300) → 04 (1640, 2300) → 05 (1200, 3450). Shot 06 eases from (1200, 3450, zoom 1) to (1200, 2250, zoom 0.29) by T 11.0.

### G2: the progress glyph

Centre (900, 300), radius 46, 5 arcs with 10-degree gaps, 3 px; arc k lit in schemOk at 100 percent, others lavender 30 percent.

## Shots

## 01 crecida: The flood headline

T 0 to 2, illustrated, cut.

- Composition: kraft board full bleed; C1 centred at screen (540, 760); a red pin top centre.
- Forms: clipping per art bible 10.1; red ring (pinRed 4 px) around "más de 200 evacuados".
- Overlays: annYellow bracket on the date line; red ring.
- Motion: T 0 C1 already on the board (frame 0 full). T 0.5 the ring draws on (outExpo, 6 frames). T 1.0 a red stamp "HOY" pops (outBack 3 frames) at (860, 1080).
- Camera: slow push 1.00 to 1.03.
- Enter and exit: opens the film; leaves C1 on the board.
- Subject: Infobae, 16/10/2026.
- Sound: T 0 low pulse + paper rustle; T 0.5 tick; T 1.0 stamp thud.

---

## 02 maratea-111: 111 millones en una noche

T 2 to 4, illustrated, cut.

- Composition: camera at world (1640, 960); C2 at screen (540, 820).
- Motion: T 2.0 C2 slaps on (scale 1.12 to 1, outBack 3 frames) with dust ticks. T 3.0 a hand-drawn yellow ring around "111 millones" and a small ink annotation "en una noche".
- Sound: T 2.0 slap; T 3.0 marker squeak.

---

## 03 afip-igj: AFIP, IGJ and the fairness note

T 4 to 6, illustrated, cut.

- Composition: camera (540, 2300); C3 at screen (540, 750), C4 at (560, 1260); sticky note at screen (790, 470) rotated 0.06.
- Motion: T 4.0 C3 slaps. T 5.0 C4 slaps. T 5.5 the sticky note lands: "Después la IGJ dijo que la colecta estaba en orden".
- Subject: La Gaceta 2023; Corta 2023; LM Neuquén 2023.
- Sound: T 4.0 slap; T 5.0 slap; T 5.5 soft paper.

---

## 04 defensa: 2026

T 6 to 8, illustrated, cut.

- Composition: camera (1640, 2300); C5 at screen (540, 810); speech caption card below at screen (540, 1290).
- Motion: T 6.0 C5 slaps. T 7.0 caption types on: "Él dice que tiene todos los comprobantes." T 7.5 an annYellow underline under "comprobantes".
- Sound: T 6.0 slap; T 7.0 typewriter run.

---

## 05 estafas: Scams

T 8 to 10, illustrated, cut.

- Composition: camera (1200, 3450); C6 at screen (490, 710); C7 at (590, 1230).
- Motion: T 8.0 C6 slaps; T 9.0 C7 slaps; T 9.5 red "!" ring between them.
- Subject: Chequeado 2025; La República 01/07/2026.
- Sound: T 8.0 slap; T 9.0 slap; T 9.5 alarm blip.

---

## 06 adonde-fue: ¿Adónde fue cada peso?

T 10 to 12, illustrated, cut.

- Composition: whole board (all clippings greeked), red strings from every clipping to a pin at world (1200, 2250); at T 11.0 a newsprint card screen-fixed at (540, 900) with "¿Adónde fue cada peso?" at 76 px in two lines.
- Camera: pull-back per G1, inOutCubic, T 10.0 to 11.0, then holds.
- Motion: strings draw on T 10.5 to 11.0; card pops T 11.0.
- Sound: T 10.0 whoosh out; T 11.0 hit + silence gap to 11.5; T 11.5 riser into 12.

---

## 07 alias-verde: The alias turns green

T 12 to 14, schematic, flash in (0.125 s).

- Composition: blueprint; phone outline 520 x 1000 centred (540, 900); inside, a field box "alias" at y 640; result card below. Progress glyph arc 0.
- Motion: T 12.0 "colecta.itati" types (12 chars over 0.5 s). T 12.5 schemOk ring expands, check mark, label "OFICIAL · Defensa Civil + Cáritas". T 13.0 second field "colecta.itati1" types; T 13.5 magenta X + "NO REGISTRADO".
- Sound: T 12.0 flash + key ticks; T 12.5 bright chime; T 13.5 low buzz.

---

## 08 dona: Donate, get a code

T 14 to 16, illustrated, cut.

- Composition: phone drawn in ink on cream stripes, screen white; a generic blue "Donar $ 5.000" button; a receipt slip slides out below.
- Motion: T 14.5 a finger taps (button squash 3 frames). T 15.0 receipt slides out with code "CT-7F3A-92".
- Sound: T 14.5 tap; T 15.0 printer zip.

---

## 09 registro: Message #1 in Hedera (hinge)

T 16 to 18, schematic, cut.

- Composition: a vertical stack of message slots (G: x 230 to 850, slot h 150, top y 520); slot #1 receives "DONATION · 9e4b…" ; a lock glyph with "sin clave de admin"; label "Hedera · Consensus Service". Progress glyph arc 2.
- Motion: T 16.0 coin dot (schemCoin) drops from top into slot #1, magenta flash; T 16.5 consensus time ticks "16/10 14:40:46"; T 17.0 slot #2 "EXPENSE" appears faint; T 17.5 lock pulses.
- Sound: T 16.0 downbeat hit (kick + bell); T 16.5 tick; T 17.5 lock click.

---

## 10 factura: The invoice

T 18 to 20, illustrated, cut.

- Composition: an invoice sheet (newsprint) 760 wide: "Factura B", "Corralón (ejemplo)", "40 colchones", "CUIT 30-00000000-0", "CAE 7428 1930 5512 08"; a round stamp "CAE ✓ ARCA" pops.
- Motion: T 18.0 invoice slides in; T 18.5 stamp; T 19.0 a fingerprint glyph lifts off and an annBlue dashed arrow points up "hash → Hedera".
- Sound: T 18.0 slide; T 18.5 stamp; T 19.0 rising blip.

---

## 11 mirror: Read for free

T 20 to 22, schematic, cut.

- Composition: central node "Mirror Node" (glow dot) wired to 8 reader nodes on a circle r 330 (screens, eyes), labels "vecinos", "prensa", "Tribunal de Cuentas"; big label "leer: USD 0". Progress glyph arc 3.
- Motion: T 20.0 hub lights; readers light one per 8th note from T 20.5; T 21.0 "leer: USD 0".
- Sound: T 20.0 hit; T 20.5 to 21.5 8th-note plinks.

---

## 12 tu-ayuda: "Tu aporte llegó"

T 22 to 24, illustrated, cut.

- Composition: phone screen with okGreen check "Tu aporte llegó", line "#1 · 16/10 14:40"; below, three bars recaudado / gastado / saldo and "40 colchones · Itatí".
- Motion: T 22.0 check pops; T 22.5 to 23.0 bars grow; T 23.0 "40 colchones" line.
- Sound: T 22.0 warm chord + chime; T 22.5 marimba run.

---

## 13 firmas: 2 of 4

T 24 to 26, schematic, cut.

- Composition: 4 nodes left (Defensa Civil, Desarrollo Social, Cáritas, Cruz Roja), key glyph "2 de 4" centre, registry slot right. Progress glyph arc 4.
- Motion: T 24.0 nodes; T 24.5 first two lines light; T 25.0 key turns schemOk; T 25.5 the registry lights.
- Sound: T 24.5 two plucks; T 25.0 key click; T 25.5 chime.

---

## 14 mapa: Corrientes

T 26 to 28, illustrated, cut.

- Composition: stylised province outline in ink, Paraná hatched teal on north and west, Uruguay on the east; pins Corrientes (capital), Itatí, Empedrado; label "piloto".
- Motion: pins pop T 26.0, 26.5, 27.0; annYellow ring around all at 27.5.
- Sound: T 26.0, 26.5, 27.0 pin pops (rising); T 27.5 swell.

---

## 15 frase: La provincia donde la solidaridad se ve

T 28 to 30, illustrated, cut.

- Composition: cream stripes; text in three lines at 70 px "Corrientes, / la provincia donde / la solidaridad se ve." centred x 540, y 760 to 1000; small heart-pin.
- Motion: T 28.0 line 1; T 28.5 line 2; T 29.0 line 3; T 29.5 underline.
- Sound: T 28.0 piano chord; held.

---

## 16 marca: Wordmark

T 30 to 32, schematic, fade in (0.5 s).

- Composition: blueprint; the wordmark per art bible 9; small "registro en Hedera · testnet" at 26 px y 1240; progress ring complete.
- Motion: T 30.5 wordmark types on; T 31.0 tagline; holds.
- Sound: T 30.0 final chord; T 31.5 bell; fade by 32.
