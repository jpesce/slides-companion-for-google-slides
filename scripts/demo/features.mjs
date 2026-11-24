// The demo video's closing card shows every feature as a tile: one simple, still picture each, one
// idea, in Settings' flat palette, under the claim "8 features in one extension". The tiles then
// gather into the icon on the end card. Draws each tile to build/demo/stills/features/<id>.png at
// four times the 200 px it shows at, with transparency around its rounded corners; After Effects
// adds the shadow, the same as the film's windows have.
//   node scripts/demo/features.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { STILLS } from './stills.mjs';

// Settings' illustration palette (Google's ink, blue and its tints, surface, outline, the pen's red).
const INK = '#1f1f1f';
const BLUE = '#0b57d0';
const BLUE70 = '#7cacf8';
const BLUE90 = '#d3e3fd';
const SURFACE = '#f0f4f9';
const LINE = '#c4c7c5';
const NOTE = '#747775';
const RED = '#fe5252';

const tile = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="44" fill="#fff"/>${body}</svg>`;
const lines = (x, y, widths, gap = 16, h = 8, color = LINE) =>
  widths
    .map(
      (w, i) =>
        `<rect x="${x}" y="${y + i * gap}" width="${w}" height="${h}" rx="${h / 2}" fill="${color}"/>`,
    )
    .join('');
// A picture: a sky, two hills and a sun, clipped to its corners.
const picture = (id, x, y, w, h, r) =>
  `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>` +
  `<g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${BLUE90}"/>` +
  `<path d="M${x} ${y + h} L${x + w * 0.34} ${y + h * 0.48} L${x + w * 0.55} ${y + h * 0.76} L${x + w * 0.72} ${y + h * 0.58} L${x + w} ${y + h} Z" fill="${BLUE70}"/>` +
  `<circle cx="${x + w * 0.76}" cy="${y + h * 0.28}" r="${h * 0.11}" fill="#fff"/></g>`;
// Material Symbols' sync and download, as Slides draws them.
const SYNC =
  'M160-160v-80h110l-16-14q-52-46-73-105t-21-119q0-111 66.5-197.5T400-790v84q-72 26-116 88.5T240-478q0 45 17 87.5t53 78.5l10 10v-98h80v240H160Zm400-10v-84q72-26 116-88.5T720-482q0-45-17-87.5T650-648l-10-10v98h-80v-240h240v80H690l16 14q49 49 71.5 106.5T800-482q0 111-66.5 197.5T560-170Z';
const DOWNLOAD =
  'M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z';

// In the order the card shows them: the film's features first, as it showed them, then the rest.
export const FEATURES = [
  // The picture as tall as the screen, black either side of it, as Spotlight shows it. Black only at
  // the sides, not all round, so the tile weighs about what the others do.
  [
    'spotlight',
    'Image spotlight',
    tile(
      `<rect x="30" y="56" width="140" height="88" rx="12" fill="${INK}"/>${picture('sp', 48, 56, 104, 88, 0)}`,
    ),
  ],
  // A page, and a link opening over it.
  [
    'links',
    'Open links',
    tile(
      `<rect x="28" y="34" width="144" height="102" rx="12" fill="${SURFACE}"/>${lines(46, 54, [96, 78, 88])}<rect x="58" y="118" width="116" height="50" rx="25" fill="${BLUE}"/><g fill="none" stroke="#fff" stroke-width="6"><rect x="80" y="134" width="38" height="18" rx="9"/><rect x="108" y="134" width="38" height="18" rx="9"/></g>`,
    ),
  ],
  // A picture, and a lens on its detail.
  [
    'zoom',
    'Zoom',
    tile(
      `${picture('zm', 24, 34, 132, 104, 12)}<circle cx="112" cy="100" r="38" fill="#fff" fill-opacity="0.55" stroke="${BLUE}" stroke-width="10"/><path d="M112 84v32M96 100h32" stroke="${BLUE}" stroke-width="8" stroke-linecap="round"/><path d="M140 128l26 26" stroke="${BLUE}" stroke-width="16" stroke-linecap="round"/>`,
    ),
  ],
  // A stopwatch, most of its time left.
  [
    'timer',
    'Countdown timer',
    tile(
      `<rect x="88" y="24" width="24" height="14" rx="5" fill="${INK}"/><rect x="96" y="36" width="8" height="12" fill="${INK}"/><circle cx="100" cy="110" r="54" fill="none" stroke="#e3e3e3" stroke-width="16"/><circle cx="100" cy="110" r="54" fill="none" stroke="${BLUE}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(2 * Math.PI * 54 * 0.7).toFixed(1)} 999" transform="rotate(-90 100 110)"/><path d="M100 110V78" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="110" r="8" fill="${INK}"/>`,
    ),
  ],
  // The notes window alone: its title bar, and the notes.
  [
    'notes',
    'Floating notes',
    tile(
      `<rect x="30" y="34" width="140" height="132" rx="14" fill="${SURFACE}"/><rect x="30" y="34" width="140" height="30" rx="14" fill="${BLUE90}"/><rect x="30" y="50" width="140" height="14" fill="${BLUE90}"/><rect x="44" y="45" width="40" height="8" rx="4" fill="${BLUE}"/>${lines(46, 82, [108, 92, 104, 64], 18, 10, NOTE)}`,
    ),
  ],
  // The film's slide, its numbers in two cards, and Slides' sync on it as the slideshow takes the
  // edit: drawn as Download's picture and badge are, so neither tile outweighs the rest.
  [
    'live-edits',
    'Live edits',
    tile(
      `<rect x="24" y="34" width="136" height="104" rx="12" fill="${SURFACE}"/>${lines(40, 50, [56])}<rect x="40" y="70" width="50" height="52" rx="8" fill="#fff"/><rect x="98" y="70" width="50" height="52" rx="8" fill="#fff"/>${lines(48, 80, [30], 0, 5)}${lines(106, 80, [26], 0, 5)}<rect x="48" y="92" width="34" height="20" rx="5" fill="${BLUE}"/><rect x="106" y="92" width="24" height="20" rx="5" fill="${BLUE}"/><circle cx="148" cy="144" r="32" fill="${BLUE}"/><svg x="128" y="124" width="40" height="40" viewBox="0 -960 960 960"><path d="${SYNC}" fill="#fff"/></svg>`,
    ),
  ],
  // A chart, and what the presenter circled on it.
  [
    'pen',
    'Persistent pen',
    tile(
      `<rect x="24" y="36" width="152" height="124" rx="12" fill="${SURFACE}"/><rect x="44" y="112" width="18" height="30" rx="4" fill="${BLUE70}"/><rect x="70" y="98" width="18" height="44" rx="4" fill="${BLUE70}"/><rect x="96" y="104" width="18" height="38" rx="4" fill="${BLUE70}"/><rect x="124" y="64" width="18" height="78" rx="4" fill="${BLUE}"/><path d="M140 50c-30 0-38 36-32 66s38 40 50 10 6-74-26-78" fill="none" stroke="${RED}" stroke-width="7" stroke-linecap="round"/>`,
    ),
  ],
  // A picture, saved as it was added to the deck.
  [
    'download',
    'Download original image',
    tile(
      `${picture('dl', 24, 34, 136, 104, 12)}<circle cx="148" cy="144" r="32" fill="${BLUE}"/><svg x="128" y="124" width="40" height="40" viewBox="0 -960 960 960"><path d="${DOWNLOAD}" fill="#fff"/></svg>`,
    ),
  ],
];

// Four times the 200 px a tile shows at, so After Effects only ever scales it down.
const SIZE = 800;

async function main() {
  const dir = path.join(STILLS, 'features');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  for (const [id, , svg] of FEATURES) {
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${svg}`,
    );
    await page.screenshot({ path: path.join(dir, `${id}.png`), omitBackground: true });
  }
  await browser.close();
  console.log(`${FEATURES.length} tiles in ${path.relative(process.cwd(), dir)}`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) await main();
