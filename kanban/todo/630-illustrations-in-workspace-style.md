# Illustrations in Google Workspace's current style

**Problem:** Settings' illustrations, which the website's cards reuse, were drawn as wireframes: slides and windows outlined in 2px grey, small in the middle of their frame, the action in a pale tint. Beside the pictures Google draws of its own apps today they looked a generation older, in a dialog that's meant to look as if Google made it.

**Evidence of demand:** the maintainer asked on 18 November 2026 for the illustrations to match Google's latest style, and chose Workspace's after comparing Google's current pages.

**Approach:** keep each illustration's story, timing and frame (Android Settings', 28dp corners), and draw what's in it as Google Workspace's product pages draw its apps. All of it is in `scripts/build-illustrations.mjs`, so Settings (`extension/illustrations.js`) and the website change together. Neither the film nor the store's screenshots show Settings, so neither changes.

**Done when:**
- [x] Every illustration (the eight in Settings and the website's Download image) is drawn in the new style and animates as before, ending as it starts.
- [x] Each still frame, shown with reduced motion, still shows its feature.
- [x] Checked in Settings in a live deck, and on the website at a laptop's, a tablet's and a phone's width.
- [x] `npm run test:offline` and `tests/settings.spec.js` pass.
- [x] The maintainer has said yes to it.

**Decisions (18 November 2026):**

- Google publishes no current illustration guideline for product UI: Material 3's "art style" (Oddfellows, 2022) is editorial art, Material 3 Expressive's art direction (May 2025) is about shapes, and Gemini's system is its own. So the reference is what Google ships: the Slides, Workspace, Chrome, NotebookLM and Labs pages, which draw white surfaces lifted by a soft, blurred shadow, or flat tonal cards. Android's brand illustrations (developer.android.com) lift theirs with hard, unblurred offset shadows; tried on ours, they read as Android's brand rather than Slides', so Workspace's soft shadow it is.
- Surfaces are white and lifted by a soft two-layer shadow, with no outline; what floats over the rest (a menu, presenter view, the slideshow's screen) by a deeper one.
- Each scene is framed closer by a camera (a scale about a point), which leaves every animated coordinate as it was; the pointer is drawn as much smaller, so it keeps its size. Spotlight and Links zoom least, as their stage already fills the frame and both Close and the bar must stay in it.
- One colour on the action: Download image picked in Google's blue, and the edited line blue in both the editor and the slideshow. The pen keeps its red and the countdown its orange, the extension's own.
- Icons are Material Symbols (close, download, open in new tab, timer). Still no words, so each reads in every language.
- Spotlight's bar shows Download image after its arrows, as the real bar does. Presenter view's slideshow shows its picture on the right, clear of the window floating over it. The timer's Pause and Reset stay text buttons, as in presenter view.
- Shadows are drawn by an SVG filter inside a small `<image>` under each shape, not by a filter on the shape. Filtered in the illustration, WebKit blurs again on every frame anything animates: on the maintainer's phone the loops stuttered, and in WebKit at a phone's density, with each illustration shown 16 times, they ran at 5 to 24 frames a second against 60 without shadows. As images they ran at 60, and they look the same, pixel for pixel within a few levels of grey. Shadows drawn as stacked, fading copies of the shape were as fast, but their steps showed as faint rings.
- Pen's slide is centred in its frame, as Zoom's is, and Zoom's pointer rests a little higher: framed this close, at the usual resting place it was cut by the frame's foot.
