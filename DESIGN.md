# music.patpadgett.com — DESIGN.md

## Overdrive (overdrive.js, 15 KB, no libraries)
Three layers that hand the cover off to each other; never more than one owns it.
- **Idle — Jakarta at night (WebGL).** The Korupsi cover gets a luminance-derived depth field (bright = near). Cursor/gyro parallax ±3.5%, heat-shimmer refraction confined to warm+bright pixels, ambient embers born from the fires plus a denser cloud under the pointer. DPR ≤1.5, paused off-screen/hidden tab, context-loss → plain `<img>`. Off under reduced motion.
- **Rolling — the reel (PLAY MASTER).** Real transport. One `<audio id="preview">` plays self-hosted 30-second previews (`assets/audio/01–11.mp3`, mono 96 kbps, loudness-matched, fade in/out). Everything visual derives from it: the reel spins only while `!paused`; VU needles read a Web Audio analyser on the element; the red ▶ is the loaded track, pencil ✓ marks previews that have finished; the transport line (`aria-live`) names the track and shows m:ss / 0:30. Stamp toggles play/pause (`aria-pressed`, label follows state); Space on the page body does the same. Previews auto-advance; after 11 the stamp resets and the line points to Bandcamp. The Bandcamp embed is a separate disclosure ("Full album ▾") — the sale, not the demo.
- **Sheet — the instrument.** Rows are `role=button` with `aria-pressed`, labelled "Preview track N, Title, 30 seconds", min-height 44px. Hover slides a carriage line; click strikes the title glyph-by-glyph (38 ms/glyph, 220 ms hammer) and plays that row's preview (click again to pause). `KEY CLICKS: OFF` toggle (aria-pressed) enables a 50 ms square-wave strike — off by default, never autoplay.
- Reduced motion: idle depth and reel/VU off; sheet keeps ▶/✓ marks and strike colour without motion.

## Delight
- **Every stamp stamps.** Pointer-down on any `.stamp` (PLAY MASTER, SEND IT) runs a 320 ms press with a random rotation (−9° … +1°) and a fading ink-bleed ring, so no two presses land alike.
- **RECEIVED.** A successful booking greys the paper and lands a red double-bordered rubber stamp (rough-edge SVG filter) reading RECEIVED / today's date / "Reply in 48 h · Tampa". Copy matches: "Got it. I will write back to … within two days." The mailto fallback path is unchanged.
- **End of side B.** The footer ends with a leader-tape strip: "End of side B · 36:06 · rewind ↺" (runtime is the true sum of the sheet). Hover runs the tape backwards; click rewinds to the top and spins the reel in reverse for 1.4 s, focus lands on the reel. Reduced motion: no tape run, instant scroll.
- Repeat-use rule: the three delight touches only respond to the visitor's own action. (Ambient motion on the page — the idle depth cover and the police tape — is the world, not delight, and both pause: depth off-screen, tape on hover/focus.)

## Transport surfaces
- `.mini` — pinned bottom bar (paper, red top rule) that appears only while a preview plays: ▶/❚❚ 44px round button, "NN Title", m:ss / 0:30, "track sheet ↑". Body gets 70px bottom padding while playing so the last row never hides under it.
- Status: `.transport__now` is the only `aria-live` region and changes only on track/state; the clock (`.transport__time`, `#mini-time`) is `aria-hidden` and ticks once per second.
- `.motion` toggle (MOTION: ON/OFF, persisted in localStorage `lp-motion`) sits under KEY CLICKS: off = no tape, no depth cover, no reel spin; audio unaffected. Tape group (`.tape`, `.tape__ribbon`, `.tape__seg`) pauses on hover/focus-within.
- Ledger: `--row` is 44px; rows, rules and punch marks share it.
- Cover under `.has-depth` uses `opacity:0`, not `visibility:hidden`, so the `<img>` alt stays in the accessibility tree.

## Mobile conversion path (≤760px)
- `.spine__nav` is hidden; the tape-box label carries two rubber-stamp shortcuts instead — `LISTEN / 30 s previews` (also starts the preview) and `WORK WITH ME / booking sheet` — 64px tall, placed between the catalogue block and the meta table.
- `.reel__note` switches to ink on the paper when the layout stacks.

## Booking hardening
- Per-field errors (`.field__err`, `aria-describedby`, `aria-invalid`), specific copy; status line counts fields.
- Submit disabled while pending and after success; confirmation lives in `.booking__done` outside the faded block and receives focus. "I reply within 48 hours." is in the lede, before the risk.
