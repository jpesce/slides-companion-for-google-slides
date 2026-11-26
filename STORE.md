# Chrome Web Store listing

Everything we put on the [Chrome Web Store dashboard](https://chrome.google.com/webstore/devconsole) lives here, so it stays in step with the extension. When something changes, update it here first, then paste it into the dashboard.

## Name and summary

These two aren't pasted in. They come from `extension/_locales/*/messages.json`, so every language gets them with the next release:

- `storeName`, in English "Slides Companion: Timer, Zoom & Speaker Notes for Google Slides™" (75 characters at most)
- `extensionDescription`, in English "Google Slides™ presentations, enhanced, for free: pictures up close, links on your slide, a countdown and notes that float on top." (132 at most)

The store shows the summary next to the name in search results, on its homepage and on category pages. A test fails if either one goes over Chrome's limit.

People mostly find extensions by the words in their name. That's why the name has the features people search for after "Slides Companion", and ends with "for Google Slides™" in each language. Google's branding rules ask for the "for" and the ™.

## Description

Present in Google Slides™ with a little help. Show pictures up close, open links without leaving your slide, keep an eye on the time and keep your notes where you can see them.

It runs on top of Google Slides™, so everything else just works. Free and open source. We collect no data, everything happens in your browser.

🔍 SPOTLIGHT
Click a picture during a slideshow to see it full screen, then flip through the other pictures on that slide. While editing, select a picture and press Space. Right-click any picture to download the original.

🔗 LINKS
Links open over your slide instead of in a new tab, PDFs too. Press Esc to get back to where you were.

⏱️ TIMER
Tell presenter view how long you have and it counts down. A bar fills up as the time goes, and turns orange when you’re almost out.

📝 PRESENTER VIEW
Only have one screen? Presenter view floats on top of your full-screen slideshow, with your notes, the timer and the next slide. You can also float just your notes. On a video call, share only the slideshow’s tab and nobody else sees your notes, because the floating window isn’t part of the share. With a second screen, presenter view opens in its own window, like it always has.

✏️ LIVE EDITS
Changes to the deck show up in a slideshow that’s already running, whether you made them or someone else did. Handy for a deck on an office TV: start the slideshow from the editor on the TV, and edits appear within seconds. A “Publish to the web” link can take 30 to 60 minutes to update.

🔎 ZOOM & SCROLL
Zoom in on a detail with your trackpad, mouse wheel or the + and - keys. An accidental swipe on the trackpad won’t skip a slide.

🖊️ PEN
Whatever you draw with Slides’ pen is still there the next time you present.

⚙️ MAKE IT YOURS
Every tool has its own page in Settings. Open it from the companion in Slides’ toolbar, or from the extension’s button in your browser. If you’d rather Slides looked exactly like Google made it, you can hide the companion there too.

🌍 Available in 33 languages. It follows whatever language your Slides is in.

Google Slides is a trademark of Google LLC. This extension is not made or endorsed by Google.

## Links

Store listing › Additional fields:

- Homepage URL: https://slidescompanion.pesce.cc/
- Support URL: https://github.com/jpesce/slides-companion-for-google-slides/issues, where the issue forms ask for what helps most

## Icon

Store listing › Graphic assets › Store icon: `extension/icons/icon128.png`. `npm run brand` draws it ([brand/README.md](brand/README.md)). Upload it again whenever the icon changes.

## Promo tile

Store listing › Graphic assets › Small promo tile, 440×280: `brand/store-promo-tile.png`, the icon on light grey. The store uses it when it features the extension. Google asks for no text on it, and for it to still read at half size. `npm run brand` draws it too.

## Marquee

Store listing › Graphic assets › Marquee, 1400×560: `brand/store-marquee.png`, the icon next to the name and the tagline, "Google Slides™ presentations, enhanced.", on light grey. It's the banner for the store's homepage carousel. The store can't put us in the carousel without one. `npm run brand` draws it as well.

## Screenshots

Store listing › Graphic assets › Screenshots, 1280×800. The store needs at least one and takes up to five. Ours are `build/demo/store/screenshot-1.png` to `screenshot-5.png`, in this order:

1. Pictures up close
2. Links
3. The timer
4. Floating notes
5. Live edits

Each one has a short line about what the feature does, above the real thing on a screen, cropped to where it happens. The companion peeks over the top of the screen at it, the way he does on the icon.

Google wants them full bleed, with square corners, showing the real extension and not much text. The store shows them at half size, so the words have to be readable at 640×400.

When the extension changes in a way you can see, run `npm run demo` and then `npm run demo:screenshots`, and upload them again. The words and the crop of each one are in `SCREENSHOTS` in `scripts/demo/screenshots.mjs`.

## Video

Store listing › Graphic assets › YouTube video. It plays at the top of the listing, before the screenshots. Ours is the demo film, `build/demo/slides-companion-demo.mp4`, which `npm run demo:finish` makes from the After Effects edit ([CONTRIBUTING.md](CONTRIBUTING.md#pictures-and-the-demo-video) explains how to update it). It's on YouTube at https://youtu.be/RIkkW6QDaOY.

After a new cut:

1. Upload it to YouTube, Public or Unlisted (the store plays both), with the title "Slides Companion: Google Slides™ presentations, enhanced" and this description:

   > Free tools for presenting in Google Slides™. See pictures up close, open links over your slide, zoom in, keep your drawings, count down in presenter view, float your notes on top, and edit the deck while it's on screen. https://chromewebstore.google.com/detail/image-spotlight-for-googl/habmkngfcidcchgmdpampgcbmnllkbhd

   For the thumbnail, use a frame of the title card where the companion's eyes are open. He blinks at 1.5 s, so 1.9 s works.

2. Paste the new link into the field, and here.

The README plays a smaller copy, `build/demo/slides-companion-demo-readme.mp4`, also made by `npm run demo:finish`, because GitHub only plays videos up to 10 MB on a free plan. To update it, drop the file into any GitHub comment box to get a `user-attachments` link (you don't have to post the comment), and swap it for the link under the README's intro.

## Privacy practices

**Single purpose:** tools for presenting with Google Slides.

**Permission justifications:**

- `storage`: keeps the presenter's settings, drawings, timer length for each deck, the floating notes window's size and zoom, and when live edits last stopped working. All of it stays on the presenter's computer.
- `scripting`: only if the presenter allows all sites. Runs a small script in a page opened over the slide during a slideshow, so Esc gets back to the slideshow and the bar can show the page's site.
- `declarativeNetRequestWithHostAccess`: only if the presenter allows all sites. Lets a page open over the slide in the presenting tab by removing the X-Frame-Options and Content-Security-Policy response headers of frames in that tab, and only while the page is open. Google Slides' own headers are never touched.
- Host permission `https://docs.google.com/presentation/*`: adds the tools to Google Slides.
- Optional host permission for all sites: requested only when the presenter clicks "Allow all sites" in Settings, so any site can open over the slide.

**Remote code:** none. Every script ships in the package.

**Data usage:** collects no user data.

**Privacy policy:** https://slidescompanion.pesce.cc/privacy
