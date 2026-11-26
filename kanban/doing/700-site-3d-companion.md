# The companion in real 3D on the website

**Problem:** the landing page's companion, icon and screens are flat: SVG and still captures. A companion you can see from every side, lit by the mouse, his fur moving as he turns, could make the page feel alive in a way flat drawings can't, and make people remember him.

**Evidence of demand:** none yet. This is an experiment, on the branch `feat/site-3d`, to find out whether it's worth what it costs in weight and work. Keep it only if it clearly beats the flat page side by side.

**Approach:**
- Start with one asset, the hero's companion peeking over the screen, since he's the page's character. Only if it works, try the icon's tile and the finale's companion.
- Render with three.js (MIT), vendored in `site/` and loaded with a dynamic `import()` only once the hero is on screen, WebGL works and the visitor hasn't asked for reduced motion or data. Credit it in THIRD-PARTY-NOTICES.txt.
- Build him in code first (a sphere of instanced fur strands or shell-textured fur, two eyes), the way `npm run brand` draws him from code today, so he's reproducible and diffable. Move to a Blender model (glTF, meshopt-compressed) only if code can't get the look.
- Keep the SVG companion as the fallback, shown until the 3D one is ready and for anyone it doesn't run for. Same placement, so nothing jumps when it swaps.
- Keep his behaviour: eyes follow the pointer, he blinks and squishes when clicked (companion-motion.js), and the light leans toward the mouse like the rims do.

**Prototype (26 November 2026):** `npm run site:serve`, then http://localhost:4520/lab/companion-3d. It shows today's drawn companion next to two 3D versions, peeking over a screen as on the home page, or whole and turnable:
- **A, built in code** (`site/lab/companion-code.js`): 8,000 straight strands in one instanced mesh, placed by the drawing's rules. 143 KB gzipped, almost all three.js; ready in about 15 ms.
- **B, modeled in Blender** (`scripts/lab/companion-blender.py`): 6,000 hair curves groomed by Blender's own hair node groups (Clump, Frizz) into tufts, exported as glTF and compressed by gltfpack. 625 KB gzipped (169 KB code, 456 KB model). `build/lab/companion.blend` can be groomed by hand.
- Shared (`site/lab/rig.js`): the bun's shape and eyes from the drawing (`site/lab/companion-shape.json`), the springs and blink timings of `companion-motion.js`, lids, a key light that follows the mouse, and fur that lags as he turns and squashes.
- His face is bare, a matte velvet black: short fur there read as stubble, and the drawing's face is flat.
- `site/lab/` is copied into the site as it's built, so merging the branch would publish it (with `noindex`). Remove it, or keep it out of the build, before merging.

**Done when:**
- [x] A prototype on the branch, compared side by side with the flat companion.
- [ ] A decision: A, B, or neither.
- [ ] If kept: the page's weight grows by at most an agreed budget, Largest Contentful Paint doesn't get worse, and it holds 60 fps on a mid-range laptop.
- [ ] Reduced motion, no WebGL and phones all get a companion that looks right.
- [ ] `npm run test:offline` covers the fallback, and the site's tests pass.
