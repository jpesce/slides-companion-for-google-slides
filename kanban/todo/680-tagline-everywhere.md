# One tagline everywhere: "Google Slides™ presentations, enhanced."

**Problem:** the store marquee and the GitHub preview now say "Google Slides™ presentations, enhanced.", while the store summary, the website, the README and the YouTube description still say "Free presenter tools for Google Slides™". Someone who sees the picture, then the listing, reads two different promises.

**Evidence of demand:** the maintainer chose the new line on 24 November 2026 (card 510), to say the extension makes presenting in Google Slides better rather than only that it adds tools.

**Approach:** put the line, with "free" kept where there's room, in:
- the store summary, `extensionDescription` in `extension/_locales/*/messages.json`, in every language: for example "Google Slides™ presentations, enhanced, for free: pictures up close, links on your slide, a countdown and notes that float on top." (120 characters in English; the test keeps it under 132). Translate it in each language, keeping "Google Slides™" as an adjective, never on its own as a product name;
- the site's title and descriptions (`site/index.html`, `site/whats-new.html`, `site/site.js`'s share text);
- the README's first line, and the YouTube description in STORE.md;
- the GitHub repository's About description (`gh repo edit --description`, once the maintainer says yes: it's public);
- the film's title card, which says "Presenter tools for Google Slides" under the name: the demo deck's and the recording's subtitle (`scripts/demo/deck.mjs`, `scripts/demo/record.mjs`) and "0 Title" in the After Effects project. It means rendering the film again, so the maintainer decides whether it's worth it.

Left as they are: the site's hero ("Present with a little help"), which has its own voice; CHANGELOG.md, which is history; BENCHMARK.md's "adds presenter tools to Google Slides™", which describes rather than sells.

The store name stays as it is: it carries the words people search for (Timer, Zoom, Speaker Notes).

**Done when:**
- [ ] Every place above says the new line, in every language.
- [ ] The tests that check the store summary's length and every language's messages pass.
- [ ] The maintainer has read the line in a few languages' stores, or had them checked.
