# The drawn companions smile on after a click too

**Problem:** on the website, a click now leaves the 3D companion smiling a beat after the button's let go (`JOY` in `site/companion-3d.js`): his body springs back at once, his eyes stay happy arcs for 650 ms, then open gently. The drawn companions still smile only while pressed, and the 90 ms a quick click gets is barely seen: Slides' toolbar companion (`extension/companion-motion.js`), the website's drawing (the fallback, and the icon's), and the footer's eyes in "good company." (`site.js`, held 160 ms). The same click should feel the same everywhere.

**Evidence of demand:** the maintainer, trying the 3D one: holding the button to see the smile was a chore.

**Approach:** in `companion-motion.js`, split the eyes' squeeze from the body's squash, as `companion-3d.js` does: its own spring, in on the press spring, held `hold` after the release, then out on a spring that doesn't overshoot. The footer's `glad` the same, with the same numbers. The 3D one's arcs are also thinner now (`SMILE.half` 0.1 of the eye, from 0.14, the maintainer's call): match that too, checking it still reads in the toolbar at 25 px. In the toolbar, check it doesn't get in the way of opening the menu: the smile could start on the click and stay as the menu opens.

**Done when:**
- [ ] A quick click leaves every companion smiling for the same beat, then opening his eyes, in Slides' toolbar and on the website.
- [ ] Holding the button still keeps the smile for as long as it's held.
- [ ] The tests for the toolbar companion and the site cover it, and `npm test` passes.
