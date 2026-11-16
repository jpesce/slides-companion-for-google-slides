# The companion in the store and on GitHub

**Problem:** the extension's icon now shows the companion, but the store listing's promo tile and GitHub's link preview (the picture shown when the repo is shared) don't exist yet, so a shared link or a store search shows a generic picture or nothing.

**Evidence of demand:** card 240 listed the store's promo tiles among the places the mark shows up, and noted the README and the promo image as places the whole companion would suit.

**Approach:** draw them from `scripts/build-brand.mjs`, so they stay the same character: the store's small promo tile (440×280) and GitHub's social preview (1280×640), likely the companion on Slides yellow with the name. Check the store's current image rules first (developer.chrome.com/docs/webstore/images). Both are uploaded by hand (the store dashboard; the repo's Settings › General › Social preview), so say where in STORE.md and brand/README.md.


**The 3D companion is a candidate:** spiky fur, rendered in Blender, on Slides yellow and as a cut-out with a transparent background (lit neutral, or lit by the yellow). The maintainer hasn't decided where it shows. Today its script and renders are only on the maintainer's computer (`build/brand/3d/`, gitignored): if it's used, move the script to `brand/3d/` and commit the stills it uses, so it can be made again.

**Decisions (15 November 2026):** the maintainer picked the 2D companion peeking up from the bottom edge, as on the icon, over a 3D render and over him peeking over a slide: the first layouts, him beside his name, read as a template with nothing to say. The promo tile is him alone, with no words, as the store asks ("Avoid text", and it must work at half size). The social preview is "Slides Companion" and "Free presenter tools for Google Slides™" (the store summary's words) in Google Sans Flex, with him looking up at them. The 3D renders stay on the maintainer's computer, in `build/brand/3d/`. A test checks each picture's size, and that both are under GitHub's 1 MB.

Google's guidance for promo images (read 15 November 2026) backs this: "Don't just use a screenshot; your images should primarily communicate the brand", "Avoid text", work at half size, saturated colour, fill the region. The by-the-book version the maintainer asked for, a feature per picture with a caption, went to the store's screenshots instead (card 550). Added the 1400×560 marquee, as the store can't feature the extension in its homepage carousel without one. It shows him peeking up on the left as on the tile, looking up at his name and the summary's words, as the GitHub preview has them. The first version, the tile's picture made wider, left the banner empty.

A design review suggested putting a slide on the tile, with him peeking over it, so the tile wouldn't repeat the icon beside it. Drawn and dropped: beside the tile's bold peek it read as generic clip art, and the brand is what Google asks the tile to show.

**Changed (15 November 2026):** the maintainer found the full yellow too loud and asked for something clean and light, like Google's and Apple's communications, with the colour only on the app icon's square, as Apple keeps its blue. All three pictures are now the app icon on Google's lightest grey (#F1F3F4, `PAPER`), with a soft shadow: alone on the tile, beside the name on the marquee, above it on GitHub. The peeking pictures above are replaced.

**Done when:**
- [x] Both pictures are made by `npm run brand`, into `brand/`.
- [ ] The maintainer has said yes to them (the companion version: yes).
- [x] STORE.md and brand/README.md say where each is uploaded.
