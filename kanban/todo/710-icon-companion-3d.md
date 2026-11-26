# The icon's companions in 3D, or not

**Problem:** on the website, the companions peeking over the page's edges (the hero's and the last call's) are now 3D (`site/companion-3d.js`). The icon's companions, on the yellow tile in the bar and in the hero, are still the drawing. Side by side, does the icon look flat next to the hero's companion, or right because it's the icon?

**Evidence of demand:** none. Raised while finishing card 700 (The companion in real 3D on the website).

**Why it wasn't done with them:** the tile is the brand mark, and has to stay exactly `icon.svg`, as on Chrome's toolbar and the store. It's small (about 40 px in the bar), where a turn, a painted shadow or a breath hardly show. It's always on screen, so it would draw more often than the companions you scroll past. And each would be another WebGL context: browsers allow only a handful per page and drop the oldest past that.

**Approach, if it's worth it:**
- First compare a mock side by side at the bar's and the hero's sizes, in light and dark: flat icon next to the 3D hero, against a 3D icon.
- If kept: one WebGL context for every companion on the page (a canvas drawn once per companion, or one canvas behind the page), not one each.
- His fur cut by the tile as in `icon.svg`, his outline and eyes at rest exactly the icon's, as `companion-3d.js` fits the hero's to his drawing.

**Done when:**
- [ ] A decision from the side-by-side, with the pictures on this card.
- [ ] If kept: the icon at rest matches `icon.svg`, one WebGL context drives every companion, and the site's tests cover it.
