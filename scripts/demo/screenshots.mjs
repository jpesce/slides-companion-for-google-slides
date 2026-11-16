// The Chrome Web Store's screenshots (build/demo/store/), made from what `npm run demo` captures, so
// they show the extension as it is and can be made again when it changes. The store asks for
// 1280×800, full bleed with square corners, showing the real thing with little text, and shows them
// at 640×400 on the listing.
//
// Each is one feature, laid out the same way: on light grey, what it does for the presenter in
// a few words on the left, the real thing on the right (a capture, cropped to where it happens), and
// the companion peeking up from the bottom edge, as on the promo tile and the icon, looking at it.
// Floating notes and the editor work in windows of their own, so their capture is that window over
// the slideshow, as the presenter sees it.
//   node scripts/demo/screenshots.mjs    (after npm run demo)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { PAPER, INK, peek, furHeight } from '../build-brand.mjs';
import { STILLS } from './stills.mjs';

const OUT = path.resolve(import.meta.dirname, '../../build/demo/store');
const still = (file) => pathToFileURL(path.join(STILLS, file)).href;

// The grid, in pixels of the 1280×800 screenshot: the words top left, and under them the real thing
// on a screen as big as the store's half-size view allows, bleeding off the right and bottom edges.
const [WIDTH, HEIGHT, MARGIN] = [1280, 800, 64];
export const PLATE = { x: MARGIN, y: 216, width: WIDTH - MARGIN, height: HEIGHT - 216 };
// The companion peeks over the screen's top edge from behind it, as he peeks up on the icon, his eyes
// just above the edge: his fur's left edge and width, and how much of his height shows.
const COMPANION = { x: 1001, width: 220, shown: 0.68 };

// The captures, in CSS pixels of the window they were taken in.
export const SLIDESHOW = { width: 1600, height: 900 };
export const PRESENTER = { width: 1100, height: 680 };
export const image = (file, { x = 0, y = 0, width, height }, extra = '') =>
  `<img src="${still(file)}" style="position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;${extra}">`;
const window = (file, box) =>
  image(
    file,
    box,
    'border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.1),0 12px 32px rgba(0,0,0,.28)',
  );

// The slideshow's full height, centred, its black filling the screen's wider shape, so a picture
// or a page sits in it as the audience sees it.
const SLIDESHOW_ON_BLACK = {
  from: [800 - (900 * PLATE.width) / PLATE.height / 2, 0],
  across: (900 * PLATE.width) / PLATE.height,
  ground: '#000',
};
// A slide's full width, cut below its main shape: a floating window over it overlaps that shape's
// right end, its own right edge on the margin the companion stands on.
const SLIDE_WIDE = { from: [0, 0], across: 1600 };

// Each screenshot: its feature (`name`, as the website calls it too), its words, the capture
// (`scene`, `size`), the part of it the screen shows (`from`, its left and top, and `across`, how
// much of it the screen is wide), where the companion looks, and what shows where the screen is
// wider than the capture (`ground`).
export const SCREENSHOTS = [
  {
    name: 'spotlight',
    title: 'Zoom in on any picture',
    line: 'Click a picture in the slideshow and it fills the screen.',
    size: SLIDESHOW,
    scene: image('ui/spotlight-bar.png', SLIDESHOW),
    // The whole slideshow, top to bottom, on its black where the screen is wider.
    ...SLIDESHOW_ON_BLACK,
    looks: [799, 448],
  },
  {
    name: 'links',
    title: 'Open links right on your slide',
    line: 'See the page, then press Esc and you’re back where you left off.',
    size: SLIDESHOW,
    scene: image('ui/links-bar.png', SLIDESHOW),
    ...SLIDESHOW_ON_BLACK,
    looks: [800, 860],
  },
  {
    name: 'timer',
    title: 'Finish right on time',
    line: 'Count down in presenter view, with a heads-up before time runs out.',
    size: PRESENTER,
    scene: image('ui/timer-heads-up.png', PRESENTER),
    // Zoomed in on the time: the bar with what's left of it, and below, in the gap between the slide's
    // title and its first row, nothing cut through. Presenter view's top panel goes on a little
    // above its own top, so the time sits about as far from the top as from the left.
    from: [0, -15],
    across: 480,
    ground: '#F8FAFD',
    looks: [71, 26],
  },
  {
    name: 'notes',
    title: 'Keep your notes to yourself',
    line: 'Share just the slideshow’s tab in a call, and only you see your notes.',
    size: SLIDESHOW,
    // The notes a step bigger, the window's top level with the quote's card.
    scene:
      image('slides/notes.svg', SLIDESHOW) +
      window('ui/notes-bigger.png', { x: 996, y: 280, width: 520, height: 650 }),
    ...SLIDE_WIDE,
    looks: [1200, 440],
  },
  {
    name: 'liveEdits',
    title: 'Fix it while it’s on screen',
    line: 'Edit the deck and the slideshow catches up in seconds.',
    size: SLIDESHOW,
    scene:
      image('slides/liveEdits-129.svg', SLIDESHOW) +
      window('ui/editor-129.png', { x: 600, y: 180, width: 1100, height: 619 }),
    ...SLIDE_WIDE,
    looks: [324, 531],
  },
];

const FONT =
  'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght,ROND@6..144,100..900,0..100&display=block';

// The part of a shot's capture its screen shows, scaled to fill a screen `width` wide. The website
// (scripts/build-site.mjs) shows the same parts.
export const crop = ({ size, scene, from: [fx, fy], across }, width) =>
  `<div style="position:absolute;left:0;top:0;width:${size.width}px;height:${size.height}px;transform-origin:0 0;transform:scale(${width / across}) translate(${-fx}px, ${-fy}px)">${scene}</div>`;

function page(shot) {
  const {
    title,
    line,
    from: [fx, fy],
    across,
    looks,
    ground = '#fff',
  } = shot;
  const scale = PLATE.width / across;
  // Where he looks, from the capture's pixels to the screenshot's.
  const at = [PLATE.x + (looks[0] - fx) * scale, PLATE.y + (looks[1] - fy) * scale];
  const top = PLATE.y - furHeight(COMPANION.width) * COMPANION.shown;
  const companion = peek(COMPANION.x, top, COMPANION.width, at);
  return `<!doctype html>
<link href="${FONT}" rel="stylesheet">
<style>
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden }
  body { position: relative; background: ${PAPER}; color: ${INK};
    font-family: "Google Sans Flex"; font-optical-sizing: auto }
  .copy { position: absolute; left: ${MARGIN}px; top: 57px; right: ${MARGIN}px }
  h1 { margin: 0; font-size: 56px; line-height: 1.1; font-weight: 500; letter-spacing: -0.012em }
  p { margin: 8px 0 0; font-size: 26px; line-height: 1.35; font-weight: 400; color: #444746 }
  .plate { position: absolute; left: ${PLATE.x}px; top: ${PLATE.y}px; width: ${PLATE.width}px;
    height: ${PLATE.height}px; overflow: hidden; border-radius: 24px 0 0 0; background: ${ground};
    box-shadow: 0 0 0 1px rgba(0,0,0,.08) }
  svg { position: absolute; inset: 0 }
</style>
<div class="copy"><h1>${title}</h1><p>${line}</p></div>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${companion}</svg>
<div class="plate">${crop(shot, PLATE.width)}</div>`;
}

async function build() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  for (const [i, shot] of SCREENSHOTS.entries()) {
    const html = path.join(OUT, `screenshot-${i + 1}.html`);
    fs.writeFileSync(html, page(shot));
    await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `screenshot-${i + 1}.png`);
    await tab.screenshot({ path: file });
    if (!process.env.KEEP_HTML) fs.rmSync(html);
    console.log(`${path.relative(process.cwd(), file)}: ${shot.title}`);
  }
  await browser.close();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
