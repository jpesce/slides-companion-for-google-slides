# The hero's icon with the rim macOS 27 draws

**Problem:** the icon at the top of the home page is a flat yellow tile. Beside the app icons people see every day on a Mac, it looks unfinished, where the page around it is meant to feel made with care.

**Evidence of demand:** the maintainer asked on 18 November 2026 for a rim exactly like Apple's newest macOS icons, high-crafted and detailed.

**Approach:** measure the rim on Apple's own icons and draw the same in CSS over the live icon. macOS 27 (Golden Gate, WWDC 2026) changed it from Tahoe's: a sharper specular edge with "dark parts", light from straight above. Measured on Basic Apple Guy's comparison images (Music, Messages, Notes at 730px) from the edge inward, every 15° round the icon, then fitted on a 730px test tile measured the same way.

**Done when:**
- [x] The hero's icon has the rim, and it matches Apple's within a few levels at every angle and depth measured.
- [x] It looks right at the page's sizes (80px, 64px on a phone) in Chromium and WebKit.
- [x] The companion still looks about, at 60 frames a second in WebKit with the icon drawn at 600px.
- [x] `npm run test:offline` passes.
- [x] The maintainer has said yes to it.

**Decisions (18 November 2026):**

- What Apple's rim is, measured: a crisp band about 1% of the icon deep, brightest at the top (about +150 on each channel at its edge, near white on yellow) and two thirds of that at the bottom, fading through the corners (0.87, 0.6, 0.3 of it at 15°, 30° and 45° off); a soft glow under it, to about 3% in; and at the sides a shade as deep, 17 off every channel whatever the colour. Light is added, not mixed, and the shade taken away.
- Three layers over the icon: each a conic gradient from its middle (how strong, round it) under a mask drawn once as an SVG in icon.svg's 1080 units (how it fades inward). The light blends with plus-lighter; the shade with difference against a dark grey, which takes the same amount off any lighter colour, as Apple's does. Each layer is a compositing layer of its own: repainted with the companion's eyes, WebKit's conic gradients cost a 600px icon three quarters of its frames.
- The tile keeps its shape (icon.svg's, 240 of 1080), not Apple's squircle: the rim is Apple's, the icon is ours. The bar's round icon has none: it's a window he peeks from, not an app icon.
- Not the macOS outer shadow: the icon keeps the store pictures' lift.
- The rim is quieter than Apple's: 0.45% of the icon deep rather than 1%, its fades as much steeper, and 70% as bright, the shade 80%. As Apple's, it drew a line along the top of the yellow louder than the rest of the page; softer alone read as a dimmer line, thinner alone still too much (the maintainer's calls, three rounds).
- The tile is lit from above, as Apple's fills are: a gradient from oklch 0.884 at the top to 0.859 at the bottom, our yellow (#FFCF03, 0.871) at its middle. Apple's step 0.03 to 0.09; at that, the top of our yellow washed out, and it's the brand's. On the website only: the store's icon and Chrome's stay flat.
- No grain: none of Apple's current icons have one, Golden Gate's turned sharper and cleaner, and at the page's 80px a grain subtle enough to look meant can't be seen.
- The bar's rim, by the same light, measured on Apple's Liquid Glass bars (the Claude app's, at 3x, on iOS): one hairline, as bright along the top as the bottom, lit across the diagonal from up and to the left, so each end fades out at its unlit corner (the left end's lower one, the right end's upper one: 30% of the rim 15° from it, 60% at 30°, 80% at 45°), its glass flat. Ours had a glint at the left end four times as bright as Apple's brightest, a top brighter than its underside and a sheen in the glass, which read as a lamp over the bar.
