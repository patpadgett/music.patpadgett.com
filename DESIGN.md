# music.patpadgett.com — DESIGN.md

## Overdrive (overdrive.js, 15 KB, no libraries)
Three layers that hand the cover off to each other; never more than one owns it.
- **Idle — Jakarta at night (WebGL).** The Korupsi cover gets a luminance-derived depth field (bright = near). Cursor/gyro parallax ±3.5%, heat-shimmer refraction confined to warm+bright pixels, ambient embers born from the fires plus a denser cloud under the pointer. DPR ≤1.5, paused off-screen/hidden tab, context-loss → plain `<img>`. Off under reduced motion.
- **Rolling — the reel (PLAY MASTER).** Cover becomes a 50% radius reel: cream hub with three spokes + spoke shading, 3.4 s/rev. Two Canvas2D VU meters (arc scale, red zone, ballistic needles) appear above the player, driven by a Web Audio analyser on a *muted* synthetic tape-hiss/LFO source — nothing audible. The current row gets a red ▶, finished rows a pencil ✓, walking the sheet on each track's printed duration. HIDE MASTER stops everything and gives the cover back to the depth layer.
- **Sheet — the instrument.** Rows are `role=button`, focusable, Enter/Space. Hover slides a carriage line; click strikes the title glyph-by-glyph (38 ms/glyph, 220 ms hammer) and opens the player at that row. `KEY CLICKS: OFF` toggle (aria-pressed) enables a 50 ms square-wave strike — off by default, never autoplay.
- Reduced motion: idle depth and reel/VU off; sheet keeps ▶/✓ marks and strike colour without motion.

## Delight
- **Every stamp stamps.** Pointer-down on any `.stamp` (PLAY MASTER, SEND IT) runs a 320 ms press with a random rotation (−9° … +1°) and a fading ink-bleed ring, so no two presses land alike.
- **RECEIVED.** A successful booking greys the paper and lands a red double-bordered rubber stamp (rough-edge SVG filter) reading RECEIVED / today's date / "Reply in 48 h · Tampa". Copy matches: "Got it. I will write back to … within two days." The mailto fallback path is unchanged.
- **End of side B.** The footer ends with a leader-tape strip: "End of side B · 36:06 · rewind ↺" (runtime is the true sum of the sheet). Hover runs the tape backwards; click rewinds to the top and spins the reel in reverse for 1.4 s, focus lands on the reel. Reduced motion: no tape run, instant scroll.
- Repeat-use rule: nothing here happens unprompted; all three are responses to the visitor's own action.
