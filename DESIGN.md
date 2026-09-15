# music.patpadgett.com — DESIGN.md

## Overdrive (overdrive.js, 15 KB, no libraries)
Three layers that hand the cover off to each other; never more than one owns it.
- **Idle — Jakarta at night (WebGL).** The Korupsi cover gets a luminance-derived depth field (bright = near). Cursor/gyro parallax ±3.5%, heat-shimmer refraction confined to warm+bright pixels, ambient embers born from the fires plus a denser cloud under the pointer. DPR ≤1.5, paused off-screen/hidden tab, context-loss → plain `<img>`. Off under reduced motion.
- **Rolling — the reel (PLAY MASTER).** Cover becomes a 50% radius reel: cream hub with three spokes + spoke shading, 3.4 s/rev. Two Canvas2D VU meters (arc scale, red zone, ballistic needles) appear above the player, driven by a Web Audio analyser on a *muted* synthetic tape-hiss/LFO source — nothing audible. The current row gets a red ▶, finished rows a pencil ✓, walking the sheet on each track's printed duration. HIDE MASTER stops everything and gives the cover back to the depth layer.
- **Sheet — the instrument.** Rows are `role=button`, focusable, Enter/Space. Hover slides a carriage line; click strikes the title glyph-by-glyph (38 ms/glyph, 220 ms hammer) and opens the player at that row. `KEY CLICKS: OFF` toggle (aria-pressed) enables a 50 ms square-wave strike — off by default, never autoplay.
- Reduced motion: idle depth and reel/VU off; sheet keeps ▶/✓ marks and strike colour without motion.
