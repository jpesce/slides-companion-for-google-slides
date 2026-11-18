# Download image on the website and in the store's words

**Problem:** a presenter who wants a picture out of a deck, as it was added, finds no way to in Slides: they screenshot it, or send it through Google Keep and download it from there. The extension does it from the picture's right-click menu and Spotlight's bar, but the website never says so, and the store listing only says "save the original", not the word people search with.

**Evidence of demand:** "download image from Google Slides" is a question people ask often enough to have its own how-to articles, each a workaround. The README lists it ("Download image: save any picture as it was added to the deck"), the maintainer asked for it on the website on 18 November 2026.

**Approach:** a fourth card in "Little things that help", after Drawings that stay and before He never takes the stage, with an illustration in Settings' style: the pointer right-clicks the slide's picture, picks Download image from the menu, and the picture flies into a download that fills. Download image has no page in Settings, so the illustration is drawn by `scripts/build-illustrations.mjs` for the site only, not shipped in the extension. In STORE.md, "save the original" becomes "download the original". Not in the film: its 48 seconds are moments in a talk, and this happens while editing.

**Done when:**
- [x] The card is on the home page, on a phone, a tablet and a laptop, and the four cards sit evenly with He never takes the stage still last.
- [x] Its illustration moves as the others do, ends as it starts, and holds still with reduced motion.
- [x] STORE.md says "download".
- [x] `npm run test:offline` passes.
- [x] The maintainer has said yes to it.

**Decisions (18 November 2026):**

- On a laptop the first three cards share a row and He never takes the stage lies on its side across the next, as before; on a tablet the four go two by two, and on a phone they stack. Two by two on a laptop was tried: Zoom into any slide's short words left its card half empty, and the companion's card lost its place as the closer.
- "Download any picture: right-click a picture to save it at full size, as it was added to the deck." Its size matters more to a presenter than its crop (a screenshot gets neither). "Full size" rather than "full resolution": the extension saves the file Slides holds, which Slides scales down to 2048px when a bigger one is added.
- The illustration is built with Settings' own pieces (the slide, the photo, the pointer, the curves), and `build-site.mjs` asks `build-illustrations.mjs` for it, so `extension/illustrations.js` stays as it was. Its still frame, with reduced motion, is the menu with Download image picked.
- Each of the four cards puts its words first and its picture at its foot, as the tools' tiles do, on the card's grey, so a picture is only ever cut where the card ends. With the picture above the words, the maintainer saw on a phone that its screens were cut across the middle of the card, by the picture's own edge, which nobody could see. A picture in a panel of a lighter grey, inset in the card, was tried too: it made that edge visible, but put a box inside a box, and the tiles and the cards would have followed two rules. The site also drops the frame's rounded corners, which the card now rounds.
- Download's slide sits in the middle and runs off the card's foot, as the other screens do, and the download sits on the slide's top right corner: alone in the frame's corner, it belonged to nothing, sat in the card's corner, and its ring was clipped there. The pointer rests a little higher, clear of the foot.
