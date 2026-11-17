// Draws the companion, our mascot, and writes every picture of him (`npm run brand`):
// - brand/: the SVGs and big PNGs, for the README, the store and anything else (brand/README.md);
// - extension/icons/: Chrome's icons, at 16, 32, 48 and 128px;
// - extension/companion-drawing.js: the toolbar companion that companion.js puts in Slides.
// He's one drawing, in code so every picture of him stays the same character: a black, furry bun
// with two hand-drawn oval eyes, a little different in size and tilt, looking up.
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = new URL('../', import.meta.url);
export const INK = '#1F1F1F';
// Slides' yellow, sampled from its 2026 favicon (ssl.gstatic.com favicon-2026-v2).
export const SLIDES_YELLOW = '#FFCF03';
// What the store and GitHub pictures stand on: Google's lightest grey, so Slides yellow shows only
// on the icon's square, as Apple keeps its blue to a few things.
export const PAPER = '#F1F3F4';

// A seeded random (Park–Miller), so the fur and the eyes' wobble come out the same every time.
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const fixed = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// The body: a lumpy bun outline with a hair at each of 120 points, longer on the crown.
// shape: w and h stretch it (1 is round), bottom squashes the lower half further, p squares off
// the lower half (2 is an oval). The hairs keep their length whatever the body's size, so a
// bigger companion is the same drawing scaled, not a bigger body. The hairs are mirrored left to
// right: drawn as they came, the crown and shoulders leaned to one side and the face looked
// off-centre.
function furPath({ cx, cy, R, seed, shape: { w, h, bottom, p } }) {
  const rand = rng(seed);
  const waves = [1, 2, 3].map((k) => [k + 1, rand() * 6.28, 6 + rand() * 10]);
  const oval = (a) => {
    const c = Math.abs(Math.cos(a));
    const s = Math.sin(a);
    const q = s > 0 ? p : 2;
    return 1 / ((c / w) ** q + (Math.abs(s) / (s > 0 ? h * bottom : h)) ** q) ** (1 / q);
  };
  const lumpy = (a) =>
    R * oval(a) + waves.reduce((sum, [k, ph, amp]) => sum + amp * Math.sin(k * a + ph), 0);
  const edge = (a) => (lumpy(a) + lumpy(Math.PI - a)) / 2;
  const at = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const n = 120;
  const step = (Math.PI * 2) / n;
  const base = [];
  const tips = [];
  for (let i = 0; i < n; i++) {
    const a = i * step - Math.PI / 2;
    const crown = Math.abs(((a + Math.PI / 2 + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.22;
    let len = 18 + rand() * 46;
    if (rand() < 0.1) len += 30 + rand() * 30;
    if (crown) len += 40 + rand() * 40;
    const tip = a + step / 2 + (rand() - 0.5) * step * 1.6;
    base.push(at(edge(a), a));
    tips.push(at(edge(tip) + len, tip));
  }
  // Point i sits at angle a and its mirror at pi - a, which is point n - i; tip i (between points
  // i and i + 1) mirrors tip n - 1 - i. The right half takes the left half's mirror.
  const mirror = ([x, y]) => [2 * cx - x, y];
  for (let i = 1; i < n / 2; i++) base[i] = mirror(base[n - i]);
  for (let i = 0; i < n / 2; i++) tips[i] = mirror(tips[n - 1 - i]);
  return base.map((b, i) => `${i ? 'L' : 'M'}${fixed(b)} L${fixed(tips[i])} `).join('') + 'Z';
}

// An eye: an oval that wobbles a little, as if drawn by hand, turned by its tilt.
function wobblePoints({ x, y, rx, ry, tilt, seed }) {
  const rand = rng(seed);
  const p1 = rand() * 6.28;
  const p2 = rand() * 6.28;
  const t = (tilt * Math.PI) / 180;
  const points = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const k = 1 + 0.045 * Math.sin(2 * a + p1) + 0.03 * Math.sin(3 * a + p2);
    const ex = rx * k * Math.cos(a);
    const ey = ry * k * Math.sin(a);
    points.push([x + ex * Math.cos(t) - ey * Math.sin(t), y + ex * Math.sin(t) + ey * Math.cos(t)]);
  }
  return points;
}
const wobble = (eye) =>
  wobblePoints(eye)
    .map((point, i) => `${i ? 'L' : 'M'}${fixed(point)}`)
    .join(' ') + ' Z';

// The two eyes as first drawn, scaled by k around the face's middle. The left one is taller and
// tilts left, the right one wider and tilts right. `rest` is where each pupil sits, as a fraction
// of the eye's radii: looking up, the right one a little further in.
const eyePair = (k) => {
  const [cx, cy] = [543, 560];
  const eye = (x, y, rx, ry, tilt, rest, seed) => ({
    x: cx + (x - cx) * k,
    y: cy + (y - cy) * k,
    rx: rx * k,
    ry: ry * k,
    tilt,
    rest,
    seed,
  });
  return [
    eye(458, 582, 70, 84, -14, [-0.1, -0.5], 7),
    eye(628, 542, 80, 74, 12, [-0.35, -0.42], 9),
  ];
};
const shift = (eyes, dx, dy) => eyes.map((e) => ({ ...e, x: e.x + dx, y: e.y + dy }));

// Drawn as they came, the left eye sat 57 units lower and was 14 taller than the right: at small
// sizes that read as a crooked face rather than a wonky one. So each eye moves halfway to the
// pair's mean height, and the left eye's height goes halfway to the right one's.
function matched([left, right]) {
  const mean = (left.y + right.y) / 2;
  return [
    { ...left, y: (left.y + mean) / 2, ry: (left.ry + right.ry) / 2 },
    { ...right, y: (right.y + mean) / 2 },
  ];
}

// An eye's outline a little outside its oval, to measure the pair by.
function outline(e) {
  const t = (e.tilt * Math.PI) / 180;
  return Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    const ex = e.rx * 1.05 * Math.cos(a);
    const ey = e.ry * 1.05 * Math.sin(a);
    return [e.x + ex * Math.cos(t) - ey * Math.sin(t), e.y + ex * Math.sin(t) + ey * Math.cos(t)];
  });
}
// The pair centred left to right on the body: as drawn, they sat a few units right of it.
const centred = (eyes) => {
  const xs = eyes.flatMap(outline).map(([x]) => x);
  return shift(eyes, 540 - (Math.min(...xs) + Math.max(...xs)) / 2, 0);
};

// The eyes pulled together until their outlines are `gap` units apart.
function closer(eyes, gap) {
  const dense = (e) => {
    const p = wobblePoints(e);
    return p.flatMap((a, i) => {
      const b = p[(i + 1) % p.length];
      return [0, 0.25, 0.5, 0.75].map((t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    });
  };
  const gapOf = (a, b) => {
    let least = Infinity;
    for (const [x1, y1] of dense(a))
      for (const [x2, y2] of dense(b)) least = Math.min(least, Math.hypot(x1 - x2, y1 - y2));
    return least;
  };
  const [left, right] = eyes;
  let s = 0;
  while (gapOf({ ...left, x: left.x + s }, { ...right, x: right.x - s }) > gap && s < 80) s += 0.5;
  return [
    { ...left, x: left.x + s },
    { ...right, x: right.x - s },
  ];
}

// How far a pupil may move from its eye's centre, in the eye's own (tilted) frame, keeping a rim of
// white at least `margin` wide around it. 0.93 allows for the wobble denting the oval inward.
export const pupilRoom = (e, r, margin) => [
  Math.max(0, e.rx * 0.93 - r - margin),
  Math.max(0, e.ry * 0.93 - r - margin),
];
function clampPupil(e, r, [ox, oy], margin) {
  const [ax, ay] = pupilRoom(e, r, margin);
  const t = (e.tilt * Math.PI) / 180;
  const [c, s] = [Math.cos(t), Math.sin(t)];
  let lx = ox * c + oy * s;
  let ly = -ox * s + oy * c;
  const n = Math.hypot(ax ? lx / ax : 0, ay ? ly / ay : 0);
  if (n > 1) [lx, ly] = [lx / n, ly / n];
  return [lx * c - ly * s, lx * s + ly * c];
}

// He's a bun rather than a ball: a little wider than tall, with a softly flattened bottom. The
// viewBox is the square around that shape.
const BODY = {
  cx: 540,
  cy: 575,
  R: 285,
  seed: 13,
  shape: { w: 1.14, h: 0.9, bottom: 0.9, p: 2.6 },
};
const VIEW = { x: 131, y: 132, size: 819 };

// The companion: eyes 1.3× the first drawing, 35 units above the bun's middle, which reads as
// looking up and alert.
export const COMPANION = {
  eyes: shift(centred(matched(eyePair(1.3))), 0, -35),
  pupil: 0.3,
};
// The toolbar companion is drawn at 25px, where one unit is 0.03px. So his eyes are bigger (1.42×),
// 28 units apart (about a pixel), with bigger pupils (0.46 of the eye) that keep 26 units of white
// (about 0.8px) around them, so the face and where he looks still read at that size.
export const TOOLBAR = {
  eyes: centred(closer(matched(eyePair(1.42)), 28)),
  pupil: 0.46,
  margin: 26,
};

// The picture of one companion: his fur, and two eyes whose pupils sit at rest. `prefix` names the
// classes, so a page that shows him (Slides) can find his parts without clashing with its own, and
// groups them the way companion.js moves them: the whole body (squashed from its base), the face
// inside it (which follows the body a beat late), each eye (which widens), and inside each eye what
// its lids cover. Only the toolbar companion keeps a rim of white around his pupils (`margin`); at
// the companion's size, the pupils sit where they were drawn.
function body({ eyes, pupil, margin }, prefix = '') {
  const fur = `<path d="${furPath(BODY)}" fill="${INK}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
  const pupils = eyes.map((e) => {
    const r = Math.min(e.rx, e.ry) * pupil;
    const rest = [e.rest[0] * e.rx, e.rest[1] * e.ry];
    const [ox, oy] = margin == null ? rest : clampPupil(e, r, rest, margin);
    const eye = `<path d="${wobble(e)}" fill="#fff"/><circle${prefix ? ` class="${prefix}pupil"` : ''} cx="${(e.x + ox).toFixed(1)}" cy="${(e.y + oy).toFixed(1)}" r="${r.toFixed(1)}" fill="${INK}"/>`;
    return prefix ? `<g class="${prefix}eye"><g class="${prefix}lids">${eye}</g></g>` : eye;
  });
  if (!prefix) return fur + pupils.join('');
  return `<g class="${prefix}body">${fur}<g class="${prefix}face">${pupils.join('')}</g></g>`;
}
const SVG = 'xmlns="http://www.w3.org/2000/svg"';
const view = `${VIEW.x} ${VIEW.y} ${VIEW.size} ${VIEW.size}`;

// The icon: the companion on a Slides-yellow tile, peeking up from its bottom edge. He's the
// companion's drawing scaled 390/285, with the top of his body 490 units down, then 1.1× from the
// tile's bottom edge, so the yellow still shows past his shoulders at 16px.
const ICON = { width: 390, top: 490.4, lift: 1.1 };
const iconScale = () => +(ICON.width / BODY.R).toFixed(4);
function icon(padded) {
  const top = BODY.cy - BODY.shape.h * BODY.R;
  const fit = `translate(540 1080) scale(${ICON.lift}) translate(-540 -1080) translate(540 ${ICON.top}) scale(${iconScale()}) translate(-540 ${-top})`;
  // Padded, it's as the Chrome Web Store asks: the tile 96/128 of the picture in transparent
  // padding, with the subtle white outer glow Chrome suggests for mostly dark icons, so the tile
  // shows on dark backgrounds.
  const glow = padded
    ? '<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter><rect width="1080" height="1080" rx="240" fill="#fff" opacity="0.3" filter="url(#glow)"/>'
    : '';
  return `<svg ${SVG} viewBox="${padded ? '-180 -180 1440 1440' : '0 0 1080 1080'}">${glow}<clipPath id="tile"><rect width="1080" height="1080" rx="240"/></clipPath><g clip-path="url(#tile)"><rect width="1080" height="1080" fill="${SLIDES_YELLOW}"/><g transform="${fit}">${body(COMPANION)}</g></g></svg>\n`;
}

// The store's promo tile and GitHub's social preview: him peeking up from the bottom edge, as on
// the icon, big enough that he's cut off below his eyes, which look up (at his name, on GitHub).
// `peek` places him by his fur: its box's left and top at (x, y), and `width` wide.
const furBox = () => {
  const n = furPath(BODY)
    .match(/-?[\d.]+/g)
    .map(Number);
  const [xs, ys] = [n.filter((_, i) => i % 2 === 0), n.filter((_, i) => i % 2 === 1)];
  const [x, y] = [Math.min(...xs), Math.min(...ys)];
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};
// His fur's height when it's `width` wide, to place him by how much of him shows.
export const furHeight = (width) => (width * furBox().height) / furBox().width;
// `at`, a point in the same space as (x, y), is where he looks: each pupil goes as far towards it
// as his eye allows, keeping a sliver of white around it. Without it, he looks up.
export function peek(x, y, width, at) {
  const box = furBox();
  const k = box.width / width;
  const eyes = !at
    ? COMPANION.eyes
    : COMPANION.eyes.map((e) => {
        const r = Math.min(e.rx, e.ry) * COMPANION.pupil;
        const far = [box.x + (at[0] - x) * k - e.x, box.y + (at[1] - y) * k - e.y].map(
          (d) => d * 1000,
        );
        const [ox, oy] = clampPupil(e, r, far, r * 0.35);
        return { ...e, rest: [ox / e.rx, oy / e.ry] };
      });
  return `<svg x="${x}" y="${y}" width="${width}" height="${furHeight(width).toFixed(1)}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" overflow="visible">${body({ ...COMPANION, eyes })}</svg>`;
}
const FONT =
  '<style>@import url("https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,100..900&amp;display=block");text{font-family:"Google Sans Flex";fill:#1F1F1F}</style>';

// The app icon at (x, y), `size` wide, on a soft shadow, as Apple and Google show app icons.
const appIcon = (x, y, size) => {
  const k = size / 1080;
  return `<filter id="lift" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="${(36 * k).toFixed(1)}"/></filter><rect x="${x}" y="${(y + 30 * k).toFixed(1)}" width="${size}" height="${size}" rx="${(240 * k).toFixed(1)}" fill="#000" opacity="0.14" filter="url(#lift)"/>${icon(false).replace('<svg ', `<svg x="${x}" y="${y}" width="${size}" height="${size}" `)}`;
};

// The Chrome Web Store's small promo tile, 440×280: the icon on light grey, no words, as the store
// asks, big enough to read at half its size.
const promoTile = () =>
  `<svg ${SVG} width="440" height="280" viewBox="0 0 440 280"><rect width="440" height="280" fill="${PAPER}"/>${appIcon(136, 52, 168)}</svg>\n`;

// The store's marquee, 1400×560, for the carousel at the top of its homepage if the extension is
// picked for it: the icon beside his name and what he does.
const marquee = () =>
  `<svg ${SVG} width="1400" height="560" viewBox="0 0 1400 560">${FONT}<rect width="1400" height="560" fill="${PAPER}"/>${appIcon(232, 160, 240)}<text x="536" y="276" font-size="80" font-weight="500" letter-spacing="-0.96">Slides Companion</text><text x="538" y="332" font-size="36" fill="#444746">Free presenter tools for Google Slides™</text></svg>\n`;

// GitHub's social preview, 1280×640, for links to the repository: the icon above his name and the
// store summary's words.
const socialPreview = () =>
  `<svg ${SVG} width="1280" height="640" viewBox="0 0 1280 640">${FONT}<rect width="1280" height="640" fill="${PAPER}"/>${appIcon(540, 116, 200)}<text x="640" y="446" text-anchor="middle" font-size="96" font-weight="500" letter-spacing="-1.15">Slides Companion</text><text x="640" y="512" text-anchor="middle" font-size="42" fill="#444746">Free presenter tools for Google Slides™</text></svg>\n`;

// Every picture, by its file in brand/.
export const svgs = () => ({
  'icon.svg': icon(false),
  'icon-store.svg': icon(true),
  'companion.svg': `<svg ${SVG} viewBox="${view}">${body(COMPANION)}</svg>\n`,
  'toolbar-companion.svg': `<svg ${SVG} viewBox="${view}">${body(TOOLBAR)}</svg>\n`,
  'store-promo-tile.svg': promoTile(),
  'store-marquee.svg': marquee(),
  'github-social-preview.svg': socialPreview(),
});

// The PNGs, each from one of the SVGs at a size. Chrome shows 16 in its extensions menu and on our
// pages, 32 on Windows, 48 in chrome://extensions and 128 when installing and in the store: the
// two small ones fill their square, as the menu's other icons do, the two big ones are padded.
export const PNGS = [
  ['extension/icons/icon16.png', 'icon.svg', 16],
  ['extension/icons/icon32.png', 'icon.svg', 32],
  ['extension/icons/icon48.png', 'icon-store.svg', 48],
  ['extension/icons/icon128.png', 'icon-store.svg', 128],
  ['brand/icon-512.png', 'icon.svg', 512],
  ['brand/companion-1024.png', 'companion.svg', 1024],
];

// The store's and GitHub's pictures, each from one of the SVGs at its width and height.
export const PICTURES = [
  ['brand/store-promo-tile.png', 'store-promo-tile.svg', 440, 280],
  ['brand/store-marquee.png', 'store-marquee.svg', 1400, 560],
  ['brand/github-social-preview.png', 'github-social-preview.svg', 1280, 640],
];

// Where a companion's eyes are, and their pupils' radius, in the picture's units, for
// companion-motion.js to move them by.
const eyesOf = ({ eyes, pupil }) =>
  eyes.map(({ x, y, rx, ry, tilt }) => ({
    x: +x.toFixed(1),
    y: +y.toFixed(1),
    rx: +rx.toFixed(1),
    ry: +ry.toFixed(1),
    tilt,
    r: +(Math.min(rx, ry) * pupil).toFixed(1),
  }));
// The middle of the bun's flattened bottom, which he sits on and squashes towards.
const BASE = { x: BODY.cx, y: +(BODY.cy + BODY.shape.h * BODY.shape.bottom * BODY.R).toFixed(1) };

// The companion as the website shows him (scripts/build-site.mjs), peeking over an edge: his
// picture framed to his fur, as `peek` frames him, with the classes companion-motion.js moves him
// by, and where his eyes and base are. His pupils keep a sliver of white, as `peek`'s do.
export function peekingDrawing() {
  const box = furBox();
  const svg = `<svg ${SVG} viewBox="${box.x} ${box.y} ${box.width} ${box.height}" overflow="visible" aria-hidden="true">${body(COMPANION, 'slides-companion-')}</svg>`;
  const margin = +(
    Math.min(...COMPANION.eyes.map((e) => Math.min(e.rx, e.ry))) *
    COMPANION.pupil *
    0.35
  ).toFixed(1);
  return {
    svg,
    view: { x: box.x, y: box.y, size: box.width },
    eyes: eyesOf(COMPANION),
    base: BASE,
    margin,
  };
}

// Where the website's peeking drawing goes on the icon's tile for him to sit as he does in
// icon.svg, as parts of the tile's side: its left and top, and its width. The website puts him on
// a tile of its own there (scripts/build-site.mjs), so he can look about as the others do.
export function iconPlacement() {
  const box = furBox();
  const top = BODY.cy - BODY.shape.h * BODY.R;
  const k = ICON.lift * iconScale();
  // As icon()'s transform takes a point of his to the tile's 1080 units.
  const x = 540 + k * (box.x - 540);
  const y = 1080 + ICON.lift * (ICON.top + iconScale() * (box.y - top) - 1080);
  const part = (value) => +(value / 1080).toFixed(5);
  return { left: part(x), top: part(y), width: part(k * box.width) };
}

// The toolbar companion for companion.js: his picture, with the classes it moves him by, and where
// his eyes and base are, in the picture's units.
export function companionScript() {
  const eyes = eyesOf(TOOLBAR);
  const svg = `<svg ${SVG} viewBox="${view}" aria-hidden="true">${body(TOOLBAR, 'slides-companion-')}</svg>`;
  const base = BASE;
  return `// Made by scripts/build-brand.mjs (npm run brand): change that, not this.
// The toolbar companion (companion.js): his picture, and where his eyes and base are in its units.
globalThis.slidesCompanion ??= {};
globalThis.slidesCompanion.companionDrawing = {
  svg: ${JSON.stringify(svg)},
  view: ${JSON.stringify(VIEW)},
  eyes: ${JSON.stringify(eyes)},
  base: ${JSON.stringify(base)},
  margin: ${TOOLBAR.margin},
};
`;
}

async function build() {
  fs.mkdirSync(new URL('brand/', ROOT), { recursive: true });
  const files = svgs();
  for (const [name, svg] of Object.entries(files))
    fs.writeFileSync(new URL(`brand/${name}`, ROOT), svg);
  fs.writeFileSync(new URL('extension/companion-drawing.js', ROOT), companionScript());

  // Chromium draws the PNGs, as it draws the SVGs everywhere else.
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, svg, size] of PNGS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${files[svg]}`,
    );
    await page.screenshot({ path: fileURLToPath(new URL(file, ROOT)), omitBackground: true });
  }
  for (const [file, svg, width, height] of PICTURES) {
    await page.setViewportSize({ width, height });
    await page.goto(new URL(`brand/${svg}`, ROOT).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(file, ROOT)) });
  }
  await browser.close();
  console.log(
    `Wrote ${Object.keys(files).length} SVGs and ${PNGS.length + PICTURES.length} PNGs, and extension/companion-drawing.js`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
