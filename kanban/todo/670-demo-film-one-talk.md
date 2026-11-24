# The demo film is one talk, with the companion in it

**Problem:** the film is polished and looks like Google built it, but it has no idea of its own. Its five scenes share one layout (label, headline, window), one pace (5–6 s each) and one calm background, so it reads as a list of features rather than a moment a presenter lives through. The companion, our most distinctive picture, shows only as a 128 px icon at the start and the end, and the brand's yellow nowhere else.

**Evidence of demand:** the maintainer's review of v29 (2026-11-23): "world-class animation and design" is the bar, and a film made only of tidy screens doesn't meet it.

**Approach:** proposals, for the maintainer to pick from before any work:

1. **One talk as the thread.** The film is one 15-minute talk, start to finish: a small countdown sits in a corner of every scene and runs down across them (14:58 at Spotlight, about 1:00 by Live edits). The Countdown timer scene shows where that time came from, and the end card lands with the talk finished on time. The scenes' order already tells the story: show a photo, someone asks about it, open the link, zoom in on the detail, time runs short, fix a number live.
2. **The companion as guide.** He stands on a window's edge in each scene and looks where the click is about to land, as he does in the store's screenshots (`looks` in `scripts/demo/screenshots.mjs`). He uses the brand's yellow, once a scene, and the store, website and film share one character.
3. **Headlines that act out the feature, once each.** "full screen" opens out as the picture does, "Count down" rolls its digits like the closing card's odometer, "Edit" gets a caret that types the change. Subtle, in Slides' own motion curves, never more than one move per headline.
4. **The link bar as the subject.** Wikipedia stays (card 660 says why); push the camera in on the link bar as it appears, so the feature is what the eye lands on rather than the page.
5. ~~**An end card that reads on a phone.**~~ Done in v31 (card 660). The store and README play the film small: at 360 px wide, the 34 px tagline is about 6 px tall. Icon 128 → 160 px, name 80 → 96 px, "Free in the Chrome Web Store" 34 → 48 px, and the closing card's tiles land at the new icon size.

3 is small and safe; 1 and 2 are the idea, and go together.

**Done when:**
- [ ] The maintainer has picked which of these to do.
- [ ] Each one picked is prototyped in HTML first, then built in After Effects.
- [ ] The film is rendered again, with the sound, store, README and website copies.
