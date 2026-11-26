# More delight in the website's 3D companion

**Problem:** the 3D companion looks, blinks, breathes, squishes, smiles and can be petted. A few more small reactions could make people play with him, and remember him, without getting in the way of the page.

**Evidence of demand:** none yet; ideas from trying him on the branch `feat/site-3d`. Try each, keep only what's still charming the tenth time.

**Ideas, each its own small try:**
- **A hop:** a click pops him a little higher out from behind the film (squash, stretch up, settle), not only a squish in place.
- **A ruffle:** a click sends a ripple through his spikes out from where it landed, with the petting springs he already has.
- **Tickled:** several clicks in quick succession and he gets giddier: a little shake, the smile held longer.
- **Contented:** petted for a while, he leans into the hand and his eyes half close.
- **Missed you:** the pointer gone from the window for a while, he looks about for it, and a happy blink when it's back.

**Kept (26 November 2026):** the maintainer: "looking good, keep it!" for the hop and the ruffle.
- **Hop** (`HOP`): let go, his springing back kicks him up 2.6 of his radii a second, and he settles on a spring (ω 11, ζ 0.45), dipping back behind the film a touch.
- **Ruffle** (`RUFFLE`): each spike flicks away from the click at 9 rad/s on the petting springs, the ripple travelling round him at 0.06 s a radian, down to a fifth opposite.
- With the smile held a beat after the click (`JOY`, 650 ms).

**Tried, waiting on the maintainer's verdict:**
- **Tickled** (`TICKLE`): each click within 500 ms of the last wiggles him about his base, harder up to the fifth, and holds the smile up to 900 ms longer.
- **Contented** (`CONTENT`): 1.2 s of strokes across his fur (near, and moving across him, not a pointer passing by), and his eyes close into the smile's arcs (0.85 of the way) as he leans 0.1 rad into the hand; he forgets it at half the pace. Half-closed lids were tried first and read as bored.
- **Missed you** (`MISSED`): the mouse out of the window for 2.5 s, he looks about for it, somewhere new every 1.3 s (ignoring the page's own looking about meanwhile); when it's back, a little hop and a quick smile. A mouse only: a finger lifting isn't leaving.

**Approach:** in `site/companion-3d.js`, on the springs he already has; the drawn fallback keeps what it has (card 720 is about matching the smile). Reduced motion: none of it, as now.

**Done when:**
- [ ] Each idea tried, and a decision on each written here, with what was kept.
- [ ] What's kept doesn't cost frames at rest (still drawn on demand) and the site's tests pass.
