# What the pen drew carries over every time a live edit swaps the player

**Problem:** "what the pen drew, and the pen itself, carry over" in `tests/live-edits.spec.js` fails now and then. After a live edit, the slide shown has no `.slides-companion-kept-ink` in its markup layer within 5 seconds. Either the test checks too soon or on the wrong player, or a presenter's drawing sometimes doesn't carry over to the new player, which would be a real loss mid-talk.

**Evidence of demand:** on 2026-11-16 it failed in two of three full `npm test` runs. Run alone it failed once in 4 runs with card 600's change, and once in 3 on the commit before it (91a4831), so it isn't that change.

**Approach:** run it with `--repeat-each=10 --workers=1` and keep a trace of a failure (`--trace on`). See whether the ink reached the new player late, reached a player that isn't the one shown, or never came. Fix the extension if a drawing can be lost. Fix the test if it only looks too soon or in the wrong place.

**Done when:**
- [ ] The cause is known and written here.
- [ ] It passes 10 runs in a row with `--workers=1`, and in a full `npm test`.
