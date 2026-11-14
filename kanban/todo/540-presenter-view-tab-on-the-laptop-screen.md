# Presenter view opens as a tab when the slides are on the laptop screen

**Problem:** with a second screen connected and presenter view on its default (floating, unless there's a second screen), pressing S during a slideshow in Dia opened Slides' presenter view as a tab in the same window, in place of the slideshow, when the editor's window was on the laptop's own screen. With the same window on the external screen, S opened presenter view in its own window, as it should. A presenter whose slideshow runs on the laptop screen loses sight of the slides, and has to find presenter view among the tabs.

**Evidence:** seen 14 November 2026 in Dia (Studio Display as the main screen, MacBook screen above it), during the Meet check for card 520 (presenter view and Meet's floating call window take turns) and card 530 (live edits as the Meet call sees it). It happened once on the laptop screen, then not after moving the window to the main screen. Not yet tried in Chrome, or with the laptop as the main screen.

**Approach:** first find out whose behaviour it is. Repeat it in Chrome and in Dia, with each screen as the main one, and see where Slides asks `window.open` to put presenter view (its `left`/`top` features). If Dia turns a popup into a tab when it's asked to place it on another screen, the fix may be to open presenter view ourselves on the screen the slideshow isn't on, through the Window Management API, as card 310 did for the floating window.

**Done when:**
- [x] Which browsers and screen layouts open presenter view as a tab is written here.
- [ ] With a second screen, S opens presenter view in a window of its own on the other screen, whichever screen the slideshow is on, and a test covers it if the test Chromium can show it.

## What's known, 14 November 2026

- **Not the extension.** With a second screen and the default setting, S isn't held back, and Slides' own `window.open` goes through unchanged (presenter-view-main.js only takes over when a floating window is ready).
- **What Slides asks for:** `window.open('about:blank', 'punch_speaker_notes__…', '…,width=730,height=580,left=…,top=…')`, at the top-left of the screen the editor's window is on (`left=0,top=30` on the main screen, `left=462,top=1473` on the laptop's).
- **Chromium** (Playwright's, headed, both screens): presenter view opens in its own window, with the editor's window on either screen.
- **Dia, without Meet:** presenter view opens in its own window from the laptop screen too. A test page calling `window.open` with Slides' features also got its own window every time: aimed at either screen, from either screen, with no position, and with another tab's picture-in-picture window open. With no recent click or key, Dia blocks the popup rather than opening a tab.
- **So the tab only came during the Meet check:** the editor's tab was being shared to the call through Slides' **Just present this tab** (Region Capture), with Meet's floating call window open.

## Reproduced in a second call, 14 November 2026

In Dia, with the tab shared to Meet, presenter view became a tab on the first S after this sequence, twice out of two tries:

1. Presenter view set to "Floating over your slideshow", and S: it floats.
2. Meet's **More options › Open picture-in-picture** takes the floating window.
3. Esc, presenter view set back to "Floating, unless there's a second screen", Start slideshow, and S.

A temporary probe showed what happens at step 3: the extension doesn't hold S back, and Slides' `window.open` goes through our hook unchanged, with the same features as always (`width=730,height=580,left=462,top=1473`). Dia makes it a tab anyway. The next S gives a window again.

It doesn't happen without one of the pieces:

- **Without the share**, the same sequence gives a window.
- **With the share but without the sequence**, it gives a window: on either screen, and with Meet's floating window open.
- **In Chromium**, the same sequence with the tab captured (`getDisplayMedia` with `preferCurrentTab`, and another tab's picture-in-picture taking the window) gives a window.

**Conclusion:** this is Dia's own behaviour, from a popup request that every other case, and Chromium, honours. The extension can't tell Dia to make a window instead. A presenter meets it only in Dia, presenting to Meet, after presenter view floated and Meet took its window, and then opening presenter view in a window of its own (a second screen plugged in mid-talk, or the setting changed). The tab can be dragged out into a window. It's worth reporting to Dia, with the steps above.
