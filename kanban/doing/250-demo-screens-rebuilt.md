# The demo video's screens move like designed UI, not screenshots

**Problem:** in the demo video, everything inside a window is a flat 4× screenshot of one state (`build/demo/stills/ui/`). The edit can only move the whole picture, cross-fade to the next state, and draw a pointer and ripple on top. So the extension's own interface, the thing the video sells, never moves as a designed piece: a menu doesn't unfold, the timer's digits don't tick, the floating notes don't lift off the slide. Card 660 made the film continuous and its camera fluid. This is the gap that is left between it and a top-tier product film.

**Evidence of demand:** the review after card 660 (2026-11-21). The camera, easing, beat, blur and continuity are at the level of a top product film. The screens are what still reads as "screen recording": the only motion inside them is the pointer, the ripples and Spotlight's 150 ms open.

**Decision (maintainer, 2026-11-21): where the film's motion stops and the extension's begins.** The video is on the Chrome Web Store, so it mustn't show behaviour the extension doesn't have. The camera, depth, light and the order things are revealed belong to the film. What each element does (what opens, what it shows, where it ends up) matches the extension. Its timing may be eased or slowed so a viewer can follow it.

**Approach, as built:** take the elements from the real extension, running in the real Slides, and rebuild the screen in After Effects from them, one layer per element.

1. **Capture in layers.** `node scripts/demo/stills.mjs layers timer` (part of `npm run demo`, in `scripts/demo/layers.mjs`) opens presenter view and writes to `build/demo/stills/layers/`:
   - the window with our interface hidden, in each layout it takes (at rest, and counting down with the bar);
   - each of our elements alone on transparency, in each state the film shows: the button at rest, hovered and checked; the menu's box; each item;
   - the digits 0–9;
   - three references of the whole window;
   - `timer.json`, with where each part goes and the colours and sizes of what the edit draws itself.
2. **Pictures, not vectors.** The plan was shape and text layers rebuilt from computed styles. Chrome's own pictures at 4× won instead: they match to the pixel, and After Effects has no Roboto to set presenter view's time in. What moves as a whole is a picture, and only what has to grow or slide is drawn: the bar and its fill, and the menu's highlight. Roboto's digits are tabular, so one picture of "dd:dd:dd" per digit gives every place. A precomp holds 0–9, and each place is a time-remapped, masked copy of it, so each digit changes on its own.
3. **Built by a script.** `scripts/demo/timer.jsx` (File › Scripts › Run Script File…, with the demo's project open) builds "Timer stage, in parts" from `timer.json`, with no hand placement. It keeps the old stage's pointer, so the clicks and their sounds don't move. It finds when the pointer reaches the button from the pointer's own path, and puts the new stage in "5 Timer v2". Run again after a recapture, it rebuilds the comp in place.

**Decisions (v25 render, 2026-11-21):**

- **At rest it matches.** Each state was rendered and compared with its reference from Chrome, pixel by pixel and side by side:
  - at rest, the largest difference is 1 level;
  - with the menu open, 7 levels at the items' antialiased edges;
  - counting down, only the bar's first sliver of fill differs (18 pixels), which the reference hides.
- **What the extension does, eased** (stage times; the film adds 25.3 s):
  - The pointer reaches the button at 1.78 s and the hover fades in over 0.12 s. It's pressed at 2.05 s.
  - The menu opens at 2.12 s. It fades in over 0.08 s and grows from 95 % to 100 % from under its button (0.3 s, decelerate), with its items coming in 12 ms apart.
  - The highlight follows the pointer's row through a 0.1 s average, so it moves with the pointer rather than blinking from item to item. It holds through the click.
  - The click on "Count down from 15 minutes" at 2.95 s closes the menu at 3.02 s, over 0.1 s.
  - The time turns to 00:15:00 with it. The panel's content then moves down by the bar's height (16 px, 0.45 s, standard curve) instead of jumping, and the bar fades in under the time.
- **Digits.** Only the digits that change move: the old one rises 6 px and fades, and the new one rises in from 6 px below (0.32 s, decelerate). This is the one choice closest to the line: the extension swaps the digit. It's there so the eye catches the tick. Setting `RISE` to 0 in `timer.jsx` makes it a plain swap.
- **Frame changes.** In v24, the Timer's largest single-frame changes were the cut to the countdown (7.0 mean |ΔY| at 480 px wide, at 28.33 s) and the menu appearing (5.3, at 27.43 s). In v25 the largest is the camera's push in (4.6); nothing inside the screen comes close. Every frame outside the Timer is unchanged.
- **Rollback.** The old "Timer stage" stays in the project, unused, and `build/demo/ae/slides-companion-demo-before-parts.aep` is the v24 project.

**The other scenes don't need their own card:**

- **Zoom.** No interface of ours is on screen. The slide is the vector export, and the zoom is the camera's move on it. (Pen has left the film: see card 660's Decisions.)
- **Spotlight and Links.** The extension's stage fades in over 150 ms and its bar over 250 ms (`spotlight.css`). A dissolve between captured states is exactly that motion, and anything more (the picture flying out of the slide) would be behaviour the extension doesn't have. Links' article already scrolls from its own layers: the page, its sticky Contents and header.
- **Floating notes.** No longer in the film since v29 (its scene was cut; the closing card names it). The window, its shadow and its edge are already separate layers, and the window rises in after the slide. Turning the page swaps the notes' text in the extension, and a dissolve shows that faithfully.
- **Live edits.** The editor is Slides' own interface, so a picture of it is the honest one. The slideshow's 128 → 129 is the slide's vector export changing, as it does when Slides saves.

**Done when:**

- [x] `npm run demo` (or `node scripts/demo/stills.mjs layers timer`) writes the backdrop, the element layers and the manifest for the Timer scene.
- [x] A script builds the Timer comps in After Effects from the manifest, with no hand placement.
- [x] At rest, the rebuilt Timer matches its screenshot: measured, and compared side by side.
- [x] The Timer scene is animated element by element, within the line above, and rendered into the film; `npm run demo:finish` and `npm run site:pictures` are run again.
- [x] Each other scene has its own card for the same treatment, or a written reason it doesn't need one.
