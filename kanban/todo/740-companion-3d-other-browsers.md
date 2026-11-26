# The 3D companion in Firefox, Safari and on a mid-range laptop

**Problem:** the website's 3D companion (`site/companion-3d.js`) was checked in Chromium and in Playwright's WebKit build, on an M1 Max. Visitors also come in Firefox, in Safari itself, and on slower machines. If he looks wrong or stutters there, the page is worse than with the drawing.

**Evidence of demand:** left open when card 700 (The companion in real 3D on the website) was finished: these couldn't be tried on the maintainer's computer as it was.

**Approach:**
- **Firefox:** install Playwright's Firefox (`npx playwright install firefox`, a download the maintainer approves) or Firefox itself, and run the site's 3D test and the side-by-side probe there.
- **Safari:** open http://localhost:4520 in Safari: the takeover, looking, pressing, petting, tickling, missed-you, and a lost context.
- **A mid-range laptop:** a few years old, integrated graphics. He should hold 60 frames a second while moving; below 20 the drawing comes back by itself (`SLOW`), so check it doesn't do that on an ordinary machine.
- **A move between screens** of different pixel density (a laptop and an external monitor): the canvas should stay sharp. Chromium's emulation of it doesn't fire the signals a real move does.

**Done when:**
- [ ] Checked in Firefox and Safari, side by side with the drawing, with anything that differs fixed or written here.
- [ ] 60 frames a second while he moves on a mid-range laptop, and the drawing doesn't come back there.
- [ ] Still sharp after moving the window to a screen with another pixel density.
