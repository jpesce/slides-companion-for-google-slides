# Presenter view and Meet's floating call window take turns

**Problem:** Chrome keeps one picture-in-picture window open at a time, across every tab. Presenter view floating (the default on one screen) and floating notes use that window, and so does Google Meet for its floating call window. So on one screen, during a Meet call, opening presenter view closes Meet's call window, and Meet opening its own (from its menu, or by itself when you leave the Meet tab, where its automatic picture-in-picture is on) closes presenter view, mid-talk.

**Evidence:** checked 14 November 2026 in the test Chromium: a second tab's picture-in-picture window closed the first one's. Presenting in a Meet call from one screen is the case presenter view floating is for, so presenters meet this.

**Approach:** first see it in a real Meet call: does Meet open its window by itself when you go from the Meet tab to the slideshow, and what does the presenter see when presenter view goes? Then pick what fits, for example:
- Say it where the presenter chooses (Settings › Presenter view): floating takes the place of Meet's floating call window, and "In a window of its own" keeps both.
- When presenter view's floating window closes without the presenter closing it, offer it back (S opens it again today).

**Done when:**
- [ ] What happens in a real Meet call is written here, with Meet's automatic picture-in-picture on and off.
- [ ] Presenters can find out, before a talk, that the two take turns, in plain words.
- [ ] If presenter view can come back by itself or with one click, it does, and a test covers it.
