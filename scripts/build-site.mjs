// The project's website, put together from site/ into build/site/, which GitHub Pages publishes
// (.github/workflows/site.yml). The page is written in site/; what it shares with the extension and
// the brand is added as it's put together, so it never falls behind them: the companion and how he
// moves, Settings' illustrations, the icon, and the languages the extension speaks.
//   node scripts/build-site.mjs            put it together (npm run site)
//   node scripts/build-site.mjs serve      ...and show it at http://localhost:4520, put together
//                                          again on every page load (npm run site:serve)
//   node scripts/build-site.mjs pictures   draw site/media/ from npm run demo's stills and the demo
//                                          video (npm run site:pictures), after npm run demo:finish
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PAPER, peekingDrawing } from './build-brand.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'build/site');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Settings' illustrations, by feature, as the extension draws them, on the page's grey rather than
// Settings' blue-grey, so each sits on its tile without a frame.
function illustrations() {
  const context = { globalThis: {} };
  context.globalThis = context;
  vm.runInNewContext(read('extension/illustrations.js'), context);
  return Object.fromEntries(
    Object.entries(context.slidesCompanion.illustrations).map(([name, svg]) => [
      name,
      svg.replaceAll(/#f0f4f9/gi, PAPER),
    ]),
  );
}

// Each language the extension speaks, named in itself, as Chrome codes it in _locales/.
function languages() {
  return fs
    .readdirSync(path.join(ROOT, 'extension/_locales'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => {
      const tag = name.replace('_', '-');
      const own = new Intl.DisplayNames([tag], { type: 'language' }).of(tag);
      return { tag, name: own[0].toLocaleUpperCase(tag) + own.slice(1) };
    });
}

// The page with what it shares filled in: {{companion}}, {{illustration name}}, {{languages}} (how
// many) and {{language names}}.
function page() {
  const art = illustrations();
  const spoken = languages();
  const { svg } = peekingDrawing();
  return read('site/index.html').replaceAll(/\{\{([\w -]+)\}\}/g, (_, token) => {
    const [what, name] = token.split(' ');
    if (what === 'companion') return svg;
    if (what === 'illustration' && art[name]) return art[name];
    if (token === 'languages') return String(spoken.length);
    // In three rows, each twice over, for the page to drift by.
    if (token === 'language names')
      return [0, 1, 2]
        .map((row) => {
          const names = spoken
            .filter((_, i) => i % 3 === row)
            .map(({ tag, name }) => `<span lang="${tag}">${name}</span>`)
            .join('');
          return `<div class="row">${names}${names}</div>`;
        })
        .join('');
    throw new Error(`site/index.html asks for {{${token}}}, which there's nothing to fill in with`);
  });
}

// Into build/site/ by default; the tests give each worker a folder of its own, so two putting it
// together at once don't delete each other's files.
export function assemble(out = OUT) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(SITE, out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), page());
  const copy = (from, to) => fs.copyFileSync(path.join(ROOT, from), path.join(out, to));
  copy('extension/companion-motion.js', 'companion-motion.js');
  copy('brand/icon.svg', 'icon.svg');
  copy('brand/icon-512.png', 'apple-touch-icon.png');
  copy('brand/github-social-preview.png', 'social.png');
  const drawing = peekingDrawing();
  delete drawing.svg;
  fs.writeFileSync(
    path.join(out, 'companion-drawing.js'),
    `// Made by scripts/build-site.mjs: where the companion's eyes and base are, for
// companion-motion.js. His picture is in the page.
globalThis.slidesCompanion ??= {};
globalThis.slidesCompanion.companionDrawing = ${JSON.stringify(drawing)};
`,
  );
}

// ---- Serving it while it's worked on ----

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

// Each page load puts the site together again, so an edit shows on reload. Videos are sent in the
// ranges the browser asks for, as Pages sends them, so the film can seek.
function serve(port = 4520) {
  http
    .createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname.endsWith('/')) assemble();
      const file = path.join(
        OUT,
        decodeURIComponent(url.pathname),
        url.pathname.endsWith('/') ? 'index.html' : '',
      );
      if (!file.startsWith(OUT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        response.writeHead(404).end('Not found');
        return;
      }
      const { size } = fs.statSync(file);
      const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
      const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range ?? '');
      if (!range) {
        response.writeHead(200, { 'Content-Type': type, 'Content-Length': size });
        fs.createReadStream(file).pipe(response);
        return;
      }
      const start = range[1] ? Number(range[1]) : size - Number(range[2]);
      const end = range[1] && range[2] ? Number(range[2]) : size - 1;
      response.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(file, { start, end }).pipe(response);
    })
    .listen(port, () =>
      console.log(`The site, put together on each page load: http://localhost:${port}/`),
    );
}

// ---- The pictures ----

const MEDIA = path.join(SITE, 'media');
const FILM = path.join(ROOT, 'build/demo/slides-companion-demo.mp4');
// The film's first frame of its own, a moment before a picture is clicked: the slide with three
// pictures, the pointer on one. The tile under it shows that picture full screen.
const POSTER_AT = 4.6;

// Draws site/media/: each picture at its width on a wide screen, and twice that for screens with more
// pixels, as WebP, which Chromium's canvas writes; the film's poster; and the film itself, from
// npm run demo:finish's master, lighter than the README's copy for its size.
async function pictures() {
  const { chromium } = await import('@playwright/test');
  const { SCREENSHOTS, PLATE, PRESENTER, image, crop } = await import('./demo/screenshots.mjs');
  const shot = (name) => SCREENSHOTS.find((s) => s.name === name);
  const NOTES = { width: 480, height: 600 };
  // name, what it shows, and its width and height on a wide screen.
  const PICTURES = [
    // As the store's screenshots show them, as wide as the page.
    ['spotlight', shot('spotlight'), PLATE.width, PLATE.height],
    ['links', shot('links'), PLATE.width, PLATE.height],
    ['live-edits', shot('liveEdits'), PLATE.width, PLATE.height],
    // Half as wide: the countdown with the slide under it, down to the gap above the next ones,
    // and the bar's grey remainder showing, so it reads as nearly done, not done.
    [
      'timer',
      {
        size: PRESENTER,
        scene: image('ui/timer-heads-up.png', PRESENTER),
        from: [0, -15],
        across: 541,
        ground: '#F8FAFD',
      },
      540,
      448,
    ],
    // The notes window's page, whole: the page gives it its corners and shadow.
    [
      'notes',
      { size: NOTES, scene: image('ui/notes-bigger.png', NOTES), from: [0, 0], across: 480 },
      360,
      450,
    ],
  ];

  fs.mkdirSync(MEDIA, { recursive: true });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-pictures-'));
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const tab = await context.newPage();

  // A PNG as WebP, `widths` wide each, written as name-<width>.webp.
  async function webp(png, name, widths) {
    const files = await tab.evaluate(
      async ({ data, widths }) => {
        const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
        const bitmap = await createImageBitmap(blob);
        const out = [];
        for (const width of widths) {
          const height = Math.round((bitmap.height * width) / bitmap.width);
          const canvas = new OffscreenCanvas(width, height);
          const context = canvas.getContext('2d');
          context.imageSmoothingQuality = 'high';
          context.drawImage(bitmap, 0, 0, width, height);
          const encoded = await canvas.convertToBlob({ type: 'image/webp', quality: 0.86 });
          const url = await new Promise((done) => {
            const reader = new FileReader();
            reader.onload = () => done(reader.result);
            reader.readAsDataURL(encoded);
          });
          out.push([width, url.split(',')[1]]);
        }
        return out;
      },
      { data: png.toString('base64'), widths },
    );
    for (const [width, data] of files) {
      const file = path.join(MEDIA, `${name}-${width}.webp`);
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`${path.relative(ROOT, file)}: ${Math.round(fs.statSync(file).size / 1024)} KB`);
    }
  }

  for (const [name, what, width, height] of PICTURES) {
    const html = path.join(temp, `${name}.html`);
    fs.writeFileSync(
      html,
      `<!doctype html><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;position:relative;background:${what.ground ?? '#fff'}}</style>${crop(what, width)}`,
    );
    await tab.setViewportSize({ width, height });
    await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await webp(await tab.screenshot(), name, [width, width * 2]);
  }

  const frame = path.join(temp, 'poster.png');
  execFileSync('ffmpeg', [
    '-loglevel',
    'error',
    '-y',
    '-ss',
    String(POSTER_AT),
    '-i',
    FILM,
    '-frames:v',
    '1',
    frame,
  ]);
  await tab.goto('about:blank');
  await webp(fs.readFileSync(frame), 'poster', [960, 1920]);

  const film = path.join(MEDIA, 'film.mp4');
  // Fast start, so it plays before it's all downloaded.
  execFileSync('ffmpeg', [
    ...['-loglevel', 'error', '-y', '-i', FILM],
    ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p'],
    ...['-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', film],
  ]);
  console.log(`${path.relative(ROOT, film)}: ${Math.round(fs.statSync(film).size / 1024)} KB`);

  await browser.close();
  fs.rmSync(temp, { recursive: true, force: true });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2];
  if (command === 'pictures') await pictures();
  else {
    assemble();
    if (command === 'serve') serve();
    else console.log(`Put the site together in ${path.relative(ROOT, OUT)}/`);
  }
}
