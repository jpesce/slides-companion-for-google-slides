# Live edits as the Meet call sees it

**Problem:** presenting through Meet, the call sees only a crop of the tab: Slides' editor crops the shared tab to its own player's slide (Region Capture, `CropTarget.fromElement`). When live edits swaps in a fresh copy of the player, the copy takes the same place, so the call should see the change as the room does: unchanged slides identical, edited ones dissolving in over half a second. No one has watched that from the call's side, and one part of presenting through Meet was never covered: your camera on the slide (`SK_sharedCameraStreamCoordinator`), which each player reads as it loads, so a copy might take it over, drop it, or make it blink.

**Evidence:** the swap shows no flash in the tab itself (screen recording, 13 November 2026), and Meet's Next, Previous and slide number, plus the shared view staying live, were checked in a real call in Dia (5 November 2026). Loading a second player out of sight also adds work while the computer sends video: on a slow laptop the call could stutter as it loads.

**Approach:** a real Meet call in the maintainer's browser, presenting from Meet's Start slideshow, with a second participant (another profile, or a phone) recording what the call sees. Edit the slide on screen and another slide, with the camera on and off. Measure the shared view frame by frame, as for the tab.

**Done when:**
- [ ] What the call sees during a swap is recorded here, camera on and off: no flicker, a blink, or a freeze.
- [x] Anything other than what the room sees is fixed, or, if it can't be, live edits waits for a slide change while presenting through Meet, and a test covers it. Nothing differed, so there was nothing to fix.
- [x] How long a copy takes to load, and what it costs the computer during a call, is noted here.

## Checked in a real call, 14 November 2026

Dia, live edits on "now". The Work profile presented a scratch deck from the editor's **Just present this tab**, and the Personal profile watched from the call. The presenter's Meet camera was on. Edits were made through the Slides API, and the participant's stage was screen-recorded at 60 fps and measured frame by frame.

- **Edit to the slide on screen** (twice): the call shows the same half-second dissolve as the room (12.10–12.55 s in one recording, 8.68–9.15 s in the other). The middle frame shows the old and new text crossfading. There was no blink and no frozen frame.
- **Edit to another slide:** nothing changes in the call. The largest frame-to-frame difference was 0.03, against 0.5 at the peak of a dissolve.
- **Delay:** the call showed the edit before the API call had even returned, so within about 6 s of the write.
- **Cost:** Dia's processes go from about 1 core (the call and the tab share) to about 2.7 cores for about 2 s, then settle. That's on a 10-core Mac already busy, with a load average of 33. The presenter's camera, as the participant received it, kept about 27 fps through the edit, with no gap between frames over 120 ms, so the outgoing video didn't stutter.
- **Not covered:** your camera on the slide (`SK_sharedCameraStreamCoordinator`). This deck's menus (Slideshow options, Slides' Meet menu) offered no way to turn it on. What's left is finding where Slides offers it and repeating the on-screen edit with it on.
