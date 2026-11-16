# What's new and the privacy policy, on the website

**Problem:** to see what changed in a version, or read the privacy policy, a presenter has to go to GitHub: the website's "What's new" and "Privacy" pointed at CHANGELOG.md and PRIVACY.md there, pages written among code, in GitHub's look rather than ours.

**Evidence of demand:** the maintainer asked for it on 16 November 2026: "nice looking What's new and changelog pages, in our same visual style and care for craft, that always keep in sync with what's in GitHub, so the user doesn't have to go to GitHub for this." Then: "the default should be what's online and published, but it's ok to have a way of seeing what's ready (beta? preview?) if they want to install manually by cloning the repo", and "do the privacy page as well, that always keeps in sync with the markdown on the repo".

**Approach:** two pages beside the home page, `site/whats-new.html` and `site/privacy.html`, filled in from CHANGELOG.md (`scripts/changelog.mjs`) and PRIVACY.md as `scripts/build-site.mjs` puts the site together. CHANGELOG.md's sections are the GitHub releases' notes (`make release`), so What's new reads the same words; a version shows once its release's tag exists, so it shows what GitHub shows. The site workflow publishes again when a release is published, from main (Pages won't publish from a tag), with the tags fetched.

**Done when:**
- [x] What's new, one page, each version once: the latest release as the hero (its title, intro and date, each named change beside its name, the rest under "Also"), then every release before it, its number and date beside its notes, each at its own link (`#v1.0.0`) with its GitHub release.
- [x] While the code has a version that isn't released yet, two tabs, Out now (the default) and Coming next (`#next`), which shows it as the latest release is shown, with how to install it from the code; they work without a script, and a link to `#next` opens on it.
- [x] The privacy page: PRIVACY.md, each numbered part under a rule, its number beside it.
- [x] Pages are linked by name: `/whats-new`, `/privacy`, as GitHub Pages serves them, and as `npm run site:serve` does.
- [x] The bar, the foot and the last call are the home page's, the bar there from the start; the bar's and the foot's What's new lead to it.
- [x] They work on a phone, a tablet and a wide screen, and without their script.
- [x] `npm test` covers them offline: each version once, the tabs and a link to `#next`, the notes as HTML, all of PRIVACY.md, the same bar and foot as the home page, no sideways scroll.
- [ ] Once the site is live, the store's privacy policy link (STORE.md) points at `/privacy`.
- [ ] The maintainer has said yes to them.
- [ ] Once the site is live: a published release shows within minutes.

**Decisions (16 November 2026):**

- From CHANGELOG.md and the tags rather than GitHub's API: the same words, nothing fetched while the page loads (no rate limits, no flash of an empty page), and it builds offline, as the tests do. A release edited by hand on GitHub would differ until CHANGELOG.md says the same.
- One page, not What's new and a changelog: with two, the latest version showed twice, as What's new's hero and the changelog's first entry, under two names for one thing. As Linear's, Raycast's and Arc's are, it's one stream, newest first, the newest set big: What's new answers "what changed?" and the history under it "and before?". "What's new" rather than "changelog", the presenter's words rather than a developer's.
- What's coming next is a tab, "Out now | Coming next", above the hero: the page opens on what's published, and what's ready is a click away, set as big as a release is. The tries before it showed nobody what's ready (a preview on the maintainer's computer only), doubled every page (Released / Preview copies of both), or squeezed a whole release into a dropdown card (a dashed pill that opened above the latest release), which the maintainer found too big for what it was.
- The words: "Out now" and "Coming next", what a presenter would say, rather than "Released" or "Current" and "Preview" or "Beta", a developer's. The tab's own hero says "Coming next: version 1.0.0", then how to get it: "Coming soon to the Chrome Web Store. Want it today? Download the code, then turn on Developer mode in chrome://extensions, click Load unpacked and choose its extension folder."
- The tabs are links to empty marks at the top of the page, and the stylesheet shows the tab whose mark is the address's (`:target`, `:has()`), so they need no script, and `#next` can be shared.
- Links by name and by tag: `/whats-new#v1.0.0` names a version as its tag and its GitHub release do, so one can be told from the other. GitHub Pages serves `whats-new.html` at `/whats-new` (checked on pages.github.com, whose `/index` is its `index.html`).
- What's new sets the changes as a list on one grey surface, each name beside its words, as Apple's what's-new pages do: as cards side by side, the short ones (Pen) sat half empty beside the long ones (Presenter view). The changelog is the record: GitHub's bullets, denser, with the number and date in a column of their own that stays in view as the notes scroll.
- Straight quotes become curly, as the rest of the site's words are; keys are set as keycaps; a named change's words start with a capital once its name is beside them rather than before them.
- Dates as "2 December 2026", as the project writes them.

**One reader for the changelog (16 November 2026):** What's new (scripts/changelog.mjs) and the release steps (scripts/release.mjs) read CHANGELOG.md's sections with the same function, sections(), rather than each its own way. The release steps accepted any heading starting "## v1.2.3", What's new only "## v1.2.3 - …" with a hyphen, so a heading written with an en dash, or "(20 November)", would have made a tag and a GitHub release that What's new skipped without a word. Now `make all`'s notes step refuses a version whose heading the site can't read, or whose date isn't YYYY-MM-DD, saying how to write it.
