# The website's buttons with their words centred

**Problem:** on the website the words in the buttons sat a little high, most where nothing hangs below the line: Add to Chrome, by more than a device pixel in Chrome. Next to Play the film, whose y fills the room under it, it looked off.

**Evidence of demand:** the maintainer asked on 18 November 2026 for every button's words to be centred, minding which have letters hanging below the line.

**Approach:** centre the band from the baseline to the capitals' tops in every button (Add to Chrome, the bar's button and its phone words, Play the film, the bar's links, What's new's tabs), with CSS's text-box, which trims a label's box to exactly that band.

**Done when:**
- [x] In Chromium and WebKit, at a laptop's and a phone's width and on a touch phone, each label's capitals are in its button's middle, as laid out, to 0.01px, and each button keeps its height.
- [x] `npm run test:offline` passes.
- [x] The maintainer has said yes to it.

**Decisions (18 November 2026):**

- The capitals' band, not all the ink: a g's or a y's tail hangs into the room under the line, as in Apple's buttons and Google's, so buttons side by side keep one baseline. Centred on all its ink, Coming next would have sat higher than Out now beside it.
- Why they sat high: Google Sans Flex's ascent less its descent (0.966 and 0.286 em) is short of its cap height (0.716 em), so a line box centred puts the capitals 0.018em above the middle; Chrome rounds the ascent and descent to whole pixels, which made it 0.59px at 17px.
- text-box: trim-both cap alphabetic where it's known (Chrome 133, Safari 18.2); elsewhere (Firefox) the words move down the 0.018em, by a clear border along the top of the buttons and by the padding of the tabs and links. Firefox wasn't tested: Playwright's Firefox isn't installed here.
- The buttons set only their sides' padding now, so the top padding that centres the words isn't undone by the bar's button's own.
