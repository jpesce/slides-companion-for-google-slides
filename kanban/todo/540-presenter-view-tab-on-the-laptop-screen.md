# Presenter view opens as a tab when the slides are on the laptop screen

**Problem:** with a second screen connected and presenter view on its default (floating, unless there's a second screen), pressing S during a slideshow in Dia opened Slides' presenter view as a tab in the same window, in place of the slideshow, when the editor's window was on the laptop's own screen. With the same window on the external screen, S opened presenter view in its own window, as it should. A presenter whose slideshow runs on the laptop screen loses sight of the slides, and has to find presenter view among the tabs.

**Evidence:** seen 14 November 2026 in Dia (Studio Display as the main screen, MacBook screen above it), during the Meet check for card 520 (presenter view and Meet's floating call window take turns) and card 530 (live edits as the Meet call sees it). It happened once on the laptop screen, then not after moving the window to the main screen. Not yet tried in Chrome, or with the laptop as the main screen.

**Approach:** first find out whose behaviour it is. Repeat it in Chrome and in Dia, with each screen as the main one, and see where Slides asks `window.open` to put presenter view (its `left`/`top` features). If Dia turns a popup into a tab when it's asked to place it on another screen, the fix may be to open presenter view ourselves on the screen the slideshow isn't on, through the Window Management API, as card 310 did for the floating window.

**Done when:**
- [ ] Which browsers and screen layouts open presenter view as a tab is written here.
- [ ] With a second screen, S opens presenter view in a window of its own on the other screen, whichever screen the slideshow is on, and a test covers it if the test Chromium can show it.
