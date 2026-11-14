# Presenter view and Meet's floating call window take turns

**Problem:** Chrome keeps one picture-in-picture window open at a time, across every tab. Presenter view floating (the default on one screen) and floating notes use that window, and so does Google Meet for its floating call window. So on one screen, during a Meet call, opening presenter view closes Meet's call window, and Meet opening its own (from its menu, or by itself when you leave the Meet tab, where its automatic picture-in-picture is on) closes presenter view, mid-talk.

**Evidence:** checked 14 November 2026 in the test Chromium: a second tab's picture-in-picture window closed the first one's. Presenting in a Meet call from one screen is the case presenter view floating is for, so presenters meet this.

**Approach:** first see it in a real Meet call: does Meet open its window by itself when you go from the Meet tab to the slideshow, and what does the presenter see when presenter view goes? Then pick what fits, for example:
- Say it where the presenter chooses (Settings › Presenter view): floating takes the place of Meet's floating call window, and "In a window of its own" keeps both.
- When presenter view's floating window closes without the presenter closing it, offer it back (S opens it again today).

**Done when:**
- [ ] What happens in a real Meet call is written here, with Meet's automatic picture-in-picture on and off. Done with it on (below); off isn't checked yet.
- [ ] Presenters can find out, before a talk, that the two take turns, in plain words.
- [ ] If presenter view can come back by itself or with one click, it does, and a test covers it.

## Checked in a real call, 14 November 2026

Dia, with Meet's automatic picture-in-picture on, as Meet ships it. The deck was presented from the editor's **Just present this tab**, with a second participant in another profile. A second screen was connected, so presenter view was set to "Floating over your slideshow" for the test, then set back.

- Going from the Meet tab to the deck makes Meet open its floating call window by itself.
- Pressing S then opens presenter view floating, and Meet's window closes.
- With presenter view floating, going to the Meet tab and back leaves it alone: Meet doesn't open its window while another one is up.
- Meet's **More options › Open picture-in-picture** replaces presenter view, and presenter view doesn't come back by itself.
- With a second screen and the default setting, presenter view opens in its own window and Meet's floating window stays: no clash.

So the two only take turns when the presenter asks for one: presenter view takes over Meet's automatic window, and Meet's menu takes it back. Meet never takes the window from presenter view by itself.
