# The demo's link opens our own page, not Wikipedia

**Problem:** the demo deck's links slide opens Wikipedia's page on Earthrise, so the store's second screenshot, the website's links tile and the video's links scene all put Wikipedia's page front and centre, someone else's brand, where ours could be.

**Evidence of demand:** card 550 left it open ("Link to one of our own pages in the links capture, not Wikipedia"); the website (card 560) gives us a page of our own to link to.

**Approach:** once the website is live, change the links slide's link (`LINK_TEXT` and its URL in `scripts/demo/deck.mjs`, and the live demo deck with the Slides connector) to the website, with words to match, then capture again (`node scripts/demo/stills.mjs ui links`), and draw the screenshots and the website's pictures again. The video's links scene scrolls Wikipedia's article and its sticky contents (`ui.json`), so it needs its own pass in After Effects: decide there whether the website scrolls as well, or the scene changes.

**Done when:**
- [ ] The demo deck's links slide opens the website.
- [ ] The store's screenshot 2 and the website's links tile show it.
- [ ] The video's links scene shows it, and the video is rendered again.
- [ ] Nothing of Wikipedia's is left in the demo (the slide's credit line stays, for the photo).
