# Chrome Web Store listing

The text for the [Chrome Web Store dashboard](https://chrome.google.com/webstore/devconsole), kept here so it changes with the extension. Paste each part into its field when it changes.

## Name and summary

Come from `extension/_locales/*/messages.json`, in every language: `storeName` ("Slides Companion: Timer, Zoom & Speaker Notes for Google Slides™" in English) and `extensionDescription` ("Free presenter tools for Google Slides™: pictures up close, links on your slide, a countdown and notes that float on top."), which the store shows beside the name in search, on its homepage and on category pages. A test keeps each within Chrome's limits (75 and 132 characters).

The store finds extensions mostly by the words in their name. So after our own name, it carries the most-searched words of our niche, then Google Slides' name in each language, after "for" and marked ™, as Google's branding rules ask.

## Description

Presenting in Google Slides™, with a little help. Show a picture up close, open a link right on your slide, finish on time and keep your notes in sight, all without leaving the slideshow.

Slides Companion works on top of Slides’ own slideshow, so your videos, animations and clicker keep working. It’s free and open source, with no account and no servers: everything happens in your browser.

🖼️ PICTURES UP CLOSE
During a slideshow, click a picture to see it full screen, then go through the slide’s other pictures. While editing, select one and press Space. Right-click a picture to download the original.

🔗 LINKS ON YOUR SLIDE
Links open right over your slide, PDFs included. Press Esc and you’re back where you left off.

⏱️ COUNTDOWN TIMER
In presenter view, count down from the time you have, with a bar that fills as you go and turns orange near the end.

📝 PRESENTER VIEW ON ONE SCREEN
Presenter view floats over your full-screen slideshow, with your notes, the timer and the next slide, so one screen is enough. Or float just your notes. With a second screen, presenter view opens in its own window, as Slides does.

🤫 NOTES ONLY YOU SEE
In a video call, share just the slideshow’s tab: the floating window stays out of the share, so only you see your notes.

⚡ LIVE EDITS
Edits to the deck, by you or anyone else, show up in a slideshow that’s already running. Showing a deck on an office TV? Start the slideshow from the editor on the TV, and changes show up there within seconds. (A “Publish to the web” link takes 30 to 60 minutes to catch up.)

🔍 ZOOM AND SCROLL
Zoom in on a detail with your trackpad, mouse wheel or the + and - keys. A stray swipe on the trackpad won’t skip a slide.

🖊️ DRAWINGS THAT STAY
What you draw with Slides’ pen stays on the slide for the next time you present.

⚙️ MAKE IT YOURS
Each tool has its own page in Settings: click the companion in Slides’ toolbar, or the extension’s button in your browser. Rather keep Slides exactly as Google made it? Tuck the companion away in Settings.

🌍 Speaks 33 languages, and switches to match Slides.

Google Slides is a trademark of Google LLC. This extension is not made or endorsed by Google.

## Icon

The store's icon (Store listing › Graphic assets) is `extension/icons/icon128.png`, made by `npm run brand` (see [brand/README.md](brand/README.md)). Upload it again whenever the icon changes.

## Promo tile

The store's small promo tile (Store listing › Graphic assets), 440×280, is what the store shows when it features the extension. Ours is `brand/store-promo-tile.png`, the app icon on light grey, made by `npm run brand` ([brand/README.md](brand/README.md)). The store asks for no words on it and for it to work at half its size. Upload it again whenever it changes.

## Marquee

The marquee (Store listing › Graphic assets), 1400×560, is the banner the store's homepage carousel shows if it picks the extension, and it can't pick one without it. Ours is `brand/store-marquee.png`, the app icon beside the extension's name and the summary's words, on light grey, also made by `npm run brand`.

## Screenshots

The store needs at least one screenshot and takes five (Store listing › Graphic assets), at 1280×800. Ours are `build/demo/store/screenshot-1.png` to `screenshot-5.png`, one feature each, in that order: pictures up close, links, the timer, floating notes and live edits. `npm run demo:screenshots` makes them from what `npm run demo` captures, so after a change the extension shows, run both and upload them again. Each says in a few words what the feature does for the presenter, on light grey, above the real thing on a screen, cropped to where it happens, with the companion peeking over the screen's top edge, as he peeks up on the icon, looking at it. The store wants them full bleed with square corners, showing the real extension with little text, and shows them at half size, so the words have to read at 640×400. To change the words or what each one shows, edit `SCREENSHOTS` in `scripts/demo/screenshots.mjs`.

## Video

The store's "YouTube video" field (Store listing › Graphic assets) shows a video at the top of the listing, before the screenshots. Ours is the demo video, `build/demo/slides-companion-demo.mp4`, made by `npm run demo:finish` from the After Effects edit ([CONTRIBUTING.md](CONTRIBUTING.md#pictures-and-the-demo-video) says how to bring it up to date).

1. Upload it to YouTube, as Public or Unlisted (the store plays either), with the title "Slides Companion: presenter tools for Google Slides™" and this description:

   > Free presenter tools for Google Slides™: see pictures up close, open links over your slide, zoom in, keep your drawings, count down in presenter view, float your notes on top and edit the deck while it's on screen. https://chromewebstore.google.com/detail/image-spotlight-for-googl/habmkngfcidcchgmdpampgcbmnllkbhd

2. Paste its link into the field.

After a new cut, upload the new video and replace the link.

The README plays a lighter copy, `build/demo/slides-companion-demo-readme.mp4`, also made by `npm run demo:finish`: GitHub plays videos up to 10 MB on a free plan. After a new cut, drop it into any GitHub comment box to get a new `user-attachments` link (no need to post the comment), and replace the one under the README's intro.

## Privacy practices

**Single purpose:** tools for presenting with Google Slides.

**Permission justifications:**

- `storage`: saves the presenter's settings, drawings, timer time for each deck, the floating notes window's size and zoom, and when live edits last stopped working, on the presenter's computer.
- `scripting`: when the presenter allows every site, runs a small script in pages opened over the slide during a slideshow, so Esc returns to the slideshow and the bar shows the page's site.
- `declarativeNetRequestWithHostAccess`: when the presenter allows every site, lets a page open over the slide in the presenting tab, by removing the X-Frame-Options and Content-Security-Policy response headers of frames in that tab (never Google Slides' own), only while the page is open.
- Host permission `https://docs.google.com/presentation/*`: adds the tools to Google Slides.
- Optional host permission for every site: asked only when the presenter clicks "Allow all sites" in Settings, so any site can open over the slide.

**Remote code:** none. Every script is in the package.

**Data usage:** collects no user data.

**Privacy policy:** https://github.com/jpesce/slides-companion-for-google-slides/blob/main/PRIVACY.md
