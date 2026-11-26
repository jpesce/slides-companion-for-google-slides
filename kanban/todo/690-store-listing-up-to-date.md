# The store listing, brought up to date

**Problem:** what a presenter sees on the Chrome Web Store lags behind the extension and the website. The summary there still says "Free presenter tools for Google Slides™", the video is an old cut, the listing has no marquee and no links to the website, and its screenshots aren't ours yet. Someone who finds us in the store meets a different product than the one on the website.

**Evidence of demand:** the marquee is what the store needs to feature us in its homepage carousel at all; the website (slidescompanion.pesce.cc) and the new tagline are live everywhere else since 24 November 2026; Google's listing guide asks for a video, screenshots of the current version, and a homepage.

**Approach:** one pass through the store dashboard, with STORE.md as the checklist, after the next release (the summary, in every language, comes from the build itself):
- Upload the next release's zip (CONTRIBUTING.md's Releasing): it carries the new summary in all 33 languages.
- Store listing › Graphic assets: the small promo tile and the marquee from `brand/` (`npm run brand`), the screenshots from card 550, and the YouTube link of the new film (`build/demo/slides-companion-demo.mp4`, uploaded as STORE.md's Video section says, with its new title and description).
- Homepage URL: https://slidescompanion.pesce.cc/
- Privacy practices › Privacy policy: https://slidescompanion.pesce.cc/privacy
- Check the listing's description against STORE.md, in English and a couple of other languages.

Only the maintainer can do this (it's their dashboard), so this card is the checklist and the record.

**Progress (25 November 2026):** the new film is on YouTube, with the title card (eyes open) as its thumbnail: https://youtu.be/RIkkW6QDaOY. The listing's files are gathered in `build/store-upload/`. Chrome won't let any extension script the store's dashboard, so the maintainer does it by hand.

**Done when:**
- [ ] The store shows the next release, with the new summary.
- [ ] The promo tile, marquee, screenshots and new video are on the listing.
- [ ] The listing links to the website and its privacy page.
