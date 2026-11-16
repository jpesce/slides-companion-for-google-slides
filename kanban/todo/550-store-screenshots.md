# Screenshots for the store listing

**Problem:** the Chrome Web Store needs at least one screenshot to publish a listing (1280×800 preferred, up to five), and STORE.md doesn't say which ones we use, how they're made or when to take them again. A presenter browsing the store decides from those pictures what the extension does.

**Evidence of demand:** the store's image rules (developer.chrome.com/docs/webstore/images) make one screenshot required and recommend showing the actual experience; they're the first thing after the video on the listing. Found while making the promo tile (card 510).

**Approach:** capture them the way `npm run demo` captures the video's stills, on the demo deck, so they can be taken again when the extension changes: one per main feature (image spotlight, links, timer in presenter view, floating notes, live edits), at 1280×800. Google's rules (developer.chrome.com/docs/webstore/images and best-listing, read 15 November 2026): "Square corners and no padding (full bleed)", show "the actual user experience" of the latest version, not "too much text", and the store downscales every screenshot to 640×400, so anything written on one must read at that size. The by-the-book drafts made for card 510 (a feature per picture, with its caption) are the starting point, but as full-bleed captures, not cards on yellow. Link to one of our own pages in the links capture, not Wikipedia, so no one else's brand is front and centre. Check what the listing has today first. Say in STORE.md where they're uploaded (Store listing › Graphic assets › Screenshots) and how to make them.

**Done when:**
- [x] A script makes up to five 1280×800 screenshots from the demo deck: `npm run demo:screenshots` (scripts/demo/screenshots.mjs), from `npm run demo`'s stills, into `build/demo/store/`.
- [ ] The maintainer has said yes to them.
- [x] STORE.md says how they're made and where they're uploaded.

**Decisions (15 November 2026):** each is one feature, shaped by rounds of design review:

- The real thing fills most of the picture. The first version showed the whole slideshow on a 16:9 screen at 44% of the picture, and at 640×400 the extension's own controls couldn't be read. Now the screen starts at the words' left edge (64px), 216px down, leaving about as much room under the words as the margin around them, and runs off the right and bottom (74% of the picture), cropped to where the feature happens.
- Words: a headline of what it does, as a verb ("Zoom in on any picture"), and a line of how, in Google Sans Flex, 56px at weight 500 and 26px at 400, with curly apostrophes.
- The companion peeks over the screen's top edge from behind it, his eyes just above it, looking at the feature: the icon's peek, with something to look at. Five faces in the bottom-left corner read as a watermark.
- No shadow under the screen: on yellow it turned olive.
- The timer shows its heads-up (orange, the bar nearly full), not its menu. `npm run demo` now captures it (`ui/timer-heads-up.png`): Slides' time is set to 13 minutes into a 15-minute countdown, and the countdown works out the rest itself.
- Floating notes say what they're for in a call: only the slideshow's tab is shared, so only you see them.
- The first two headlines say the words presenters search for: "Zoom in on any picture" (the store name says Zoom) and "Open links right on your slide" (as the summary does).
- The demo deck's notes on slide 7 are short lines, so none leaves a word alone on a line, and the store's still has them a step bigger than the video's (`ui/notes-bigger.png`), to read at half size and fill the window, its top level with the quote's card. The video's notes still (`ui/notes.png`) has the new words too: reload it in After Effects before the next render.
- Left as they are, on purpose: the timer's + and - are Slides' own buttons, and the notes window shows without the title bar Chrome draws around it, as the capture is the window's page; drawing either ourselves would show something that isn't there.

- Each crop is set from the captures' measured shapes, so nothing touches an edge by accident. Picture and link show the slideshow's whole height, centred, on its black where the screen is wider, so the Earth and the page sit in it as the audience sees them, the bar at its own distance from the bottom. Notes and live edits show the slide's whole width, cut below its main shape, and their window overlaps that shape's right end by a clear amount (never a sliver), its right edge on the margin the companion stands on. The timer is cut in the gap under the slide's title, with the bar's grey remainder showing, so it reads as nearly done, not done.
- The background is Google's lightest grey (#F1F3F4), not Slides yellow: the maintainer asked for clean and light, with the colour kept to the app icon. The headline is ink, its line grey (#444746), and the screen has a faint outline, no shadow, to stand off the grey. Measured on an 8-point grid: the headline's cap top sits on the 64px margin, as does the companion's right edge, and the headline, the marquee's and the GitHub preview's names share one weight (500) and tracking (-0.012em), each line under them about 0.45 of their size.

Tried and dropped: a caption band above the full capture (no character, nothing to look at), copy in a left column beside a taller screen (every crop cut words), and the whole slideshow on a smaller screen (unreadable at 640×400).

**Open:** the links one still shows Wikipedia, the demo deck's link. Changing it means changing the deck's link and the video's links scene with it.
