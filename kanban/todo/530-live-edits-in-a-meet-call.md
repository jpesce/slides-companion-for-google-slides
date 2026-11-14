# Live edits as the Meet call sees it

**Problem:** presenting through Meet, the call sees only a crop of the tab: Slides' editor crops the shared tab to its own player's slide (Region Capture, `CropTarget.fromElement`). When live edits swaps in a fresh copy of the player, the copy takes the same place, so the call should see the change as the room does: unchanged slides identical, edited ones dissolving in over half a second. No one has watched that from the call's side, and one part of presenting through Meet was never covered: your camera on the slide (`SK_sharedCameraStreamCoordinator`), which each player reads as it loads, so a copy might take it over, drop it, or make it blink.

**Evidence:** the swap shows no flash in the tab itself (screen recording, 13 November 2026), and Meet's Next, Previous and slide number, plus the shared view staying live, were checked in a real call in Dia (5 November 2026). Loading a second player out of sight also adds work while the computer sends video: on a slow laptop the call could stutter as it loads.

**Approach:** a real Meet call in the maintainer's browser, presenting from Meet's Start slideshow, with a second participant (another profile, or a phone) recording what the call sees. Edit the slide on screen and another slide, with the camera on and off. Measure the shared view frame by frame, as for the tab.

**Done when:**
- [ ] What the call sees during a swap is recorded here, camera on and off: no flicker, a blink, or a freeze.
- [ ] Anything other than what the room sees is fixed, or, if it can't be, live edits waits for a slide change while presenting through Meet, and a test covers it.
- [ ] How long a copy takes to load, and what it costs the computer during a call, is noted here.
