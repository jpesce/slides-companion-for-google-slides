# Release v1.0.1 once the store approves v1.0.0

**Problem:** v1.0.0 is in review at the Chrome Web Store. v1.0.1 is started in the code (the manifest says 1.0.1, and CHANGELOG.md has its section, "Unreleased"), so what's merged meanwhile has somewhere to go. Uploading a new version during a review would put it back at the end of the queue.

**Evidence of demand:** the maintainer, 26 November 2026: start v1.0.1, but only update the store after v1 has been approved.

**Approach:** wait for the store's approval of v1.0.0. Then follow CONTRIBUTING.md's Releasing steps from step 2: finish v1.0.1's section in CHANGELOG.md from the presenter's side and date it, commit and push, `make test-build`, `make all`, and upload the zip. Until then, don't tag or release v1.0.1. Pushed to `main`, the website's What's new shows it under Coming next, which is right while it waits.

**Done when:**
- [ ] The store has approved v1.0.0.
- [ ] v1.0.1 is tagged, released on GitHub, and uploaded to the store, with its changelog dated.
