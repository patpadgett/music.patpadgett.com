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
- `.mini` ≤560px: two lines — full title on top, then ▶/❚❚, time pushed right, ↑ and × (44px). Body padding 104px while open.
- `.reel__by` (mobile only): "Produced, mixed & written by Patrick Padgett" directly under the title, before the catalogue box — the producer credit precedes WORK WITH ME.
- Listening language: nav "Stream elsewhere" (outlets), mobile stamp "PLAY / 30-second previews", PLAY MASTER stamp (aria-label says previews), "Full album ▾" for Bandcamp.
- `.mini` — pinned bottom bar (paper, red top rule) shown whenever a preview is loaded, playing or paused (`.is-paused` tints it): ▶/❚❚ 44px round button, "NN Title" (gets the width), m:ss / 0:30, ↑ back to the sheet, × closes (pauses, hides, returns focus to the stamp). Starting any track re-shows it. Body gets 70px bottom padding while it is open.
- Handoff: opening the Bandcamp disclosure pauses the preview — one transport owns sound at a time.
- Rewind (footer leader): reverse-spins the plain cover for 1.4 s with the depth canvas suspended; no spin under reduced motion or MOTION: OFF. Stamp press animation is also off under reduced motion.
- Status: `.transport__now` is the transport's only `aria-live` region (the booking status is the other on the page) and changes only on track/state; the clock (`.transport__time`, `#mini-time`) is `aria-hidden` and ticks once per second.
- `.util` groups KEY CLICKS then MOTION (aria-label: "Ambient motion (tape, cover, reel)") (renamed for honest scope: it governs tape, depth cover, reel spin — not the glyph strike or carriage). `aria-pressed` reflects *effective* motion (false under reduced motion). Stamp transform transition is 0 under reduced motion.
- `.util` groups KEY CLICKS then MOTION (DOM order = visual order; compact pills side by side on mobile). `.motion` (persisted in localStorage `lp-motion`) reads "OFF (system)" under reduced motion: off = no tape, no depth cover, no reel spin; audio unaffected. Tape group (`.tape`, `.tape__ribbon`, `.tape__seg`) pauses on hover/focus-within.
- Ledger: `--row` is 44px; rows, rules and punch marks share it. `.tracks__hint` above the rows carries the instruction ("Tap a track · 30-second previews · press again to pause") — the stamp carries no micro-text.
- Cover under `.has-depth` uses `opacity:0`, not `visibility:hidden`, so the `<img>` alt stays in the accessibility tree.

## Mobile conversion path (≤760px)
- `.spine__nav` is hidden; the tape-box label carries two rubber-stamp shortcuts instead — `PLAY / 30-second previews` (also starts the preview) and `WORK WITH ME / booking sheet` — 64px tall, placed between the catalogue block and the meta table.
- `.reel__note` switches to ink on the paper when the layout stacks.

## Booking hardening
- Per-field errors (`.field__err`, `aria-describedby`, `aria-invalid`), specific copy; status line counts fields.
- Submit disabled while pending and after success; confirmation lives in `.booking__done` outside the faded block and receives focus. "I reply within 48 hours." is in the lede, before the risk.

## Round-5 refinements
- `.util` (KEY CLICKS · MOTION) lives in DOM *after* the track rows (tab order: tracks first); on desktop it is absolutely positioned in the sheet head, on ≤560px it wraps in a row below the list. Fixes 320px overflow.
- Row states: `.is-playing` = loaded track; `.is-playing.is-paused` shows ❚❚ instead of ▶.
- Mobile `.reel__cat` is a flowing band (inline items with trailing · separators, LP–001 inline at 1.5rem); desktop keeps the stacked box. `.reel__by` precedes `.reel__cat` in DOM as well as visually.
- Failed booking POST: "Could not send — nothing was lost. Try again or send it by email." (retry button + mailto); fields kept, submit re-enabled.
- `#mini-btn` 44px; `#outlets` scroll-margin.

## Round-6 refinements
- Mobile label order: title → credit → PLAY / WORK WITH ME → catalogue band → metadata (stamps before the catalogue so both actions sit in a 320×700 first screen).
- ≤360px: rows drop the note column, 30/1fr/40 grid, titles wrap by word (glyph spans are grouped per word in `.w{white-space:nowrap}` so the strike effect can't split a word).
- Mini bar title carries "· preview".
- Booking draft (name, email, message, type) is kept in `sessionStorage` (`lp-booking-draft`) on input, restored on load, cleared on success.
- Utility pills ≥32px tall.

## Owner decisions (round 6 follow-up)
- Session notes text is Patrick's own — leave as written.
- Mobile hero is **album-first**: one PLAY stamp (full card width, "30-second previews") is the only red action; "Work with me → booking sheet" is a quiet underlined text link beneath it. No second stamp.
- Fix: at 390px the two-stamp row overflowed the label card by 10px; the single-column stack removes the overflow at every width (checked 320–760).

## Round-7 refinements
- `.reel__go` precedes `.reel__cat` in DOM (mobile Tab: PLAY → booking → catalogue link).
- Desktop utilities are one `.util` stack (absolute in the sheet at right:18px/top:14px, 6px gap) — DOM stays after the tracks so keyboard order is tracks first.
- `.go--book` is a 44px-tall hit area with the same quiet underline; `.hire__kind` stays on one line at 320px.

## Round-8 refinements
- `.go--book` uses a native text-decoration underline (red, 1.5px, offset 4px) so wrapped lines each carry their own rule; 44px hit area kept.
- Mobile police-tape URL segments 19px (bold) — clears the 18.67px bold large-text threshold at 3.43:1.
