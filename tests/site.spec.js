import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import { assemble, privacy } from '../scripts/build-site.mjs';
import { releasePages, versions } from '../scripts/changelog.mjs';

// The website (site/), as scripts/build-site.mjs puts it together for GitHub Pages: every file it
// points to is there, everything it shares with the extension is filled in, and the companion's
// eyes follow the pointer, as in Slides' toolbar. What's new and the changelog show what GitHub has
// released, from CHANGELOG.md, with a preview of what isn't yet; the privacy page is PRIVACY.md.
let OUT;
let PAGES;

// Each worker puts the site together in a folder of its own, away from build/site/, which
// npm run site:serve may be showing.
test.beforeAll(({}, testInfo) => {
  OUT = testInfo.outputPath('site');
  assemble(OUT);
  PAGES = [
    'index.html',
    ...fs.readdirSync(OUT).filter((f) => f.endsWith('.html') && f !== 'index.html'),
  ];
});

test(
  'the website points only at files it has, with nothing left to fill in',
  { tag: '@offline' },
  () => {
    for (const file of PAGES) {
      const html = fs.readFileSync(path.join(OUT, file), 'utf8');
      expect(html, file).not.toMatch(/\{\{[\w -]+\}\}/);
      // Each part only once: a {{…}} named in a comment would be filled in there too.
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
      expect(ids, file).toEqual([...new Set(ids)]);
      const count = (pattern) => (html.match(pattern) ?? []).length;
      expect(count(/class="slides-companion-body"/g), file).toBe(count(/class="(peek|icon)[ "]/g));
      // A srcset lists its files with their widths, between commas. A data: URL carries its file
      // (the illustrations' shadows). A link to a part of a page is to that page, and the site's
      // folder is its home page.
      const local = [...html.matchAll(/(src|href|poster|srcset)="([^"]+)"/g)]
        .flatMap(([, name, value]) =>
          name === 'srcset' ? value.split(',').map((part) => part.trim().split(' ')[0]) : [value],
        )
        .filter((url) => !/^(https?:|#|mailto:|data:)/.test(url))
        .map((url) => url.replace(/#.*$/, '').replace(/^\.\/$/, 'index.html'))
        // A page by its name, as GitHub Pages finds whats-new.html at /whats-new.
        .map((url) => (path.extname(url) ? url : `${url}.html`));
      expect(local.length, file).toBeGreaterThan(8);
      for (const url of local)
        expect(fs.existsSync(path.join(OUT, url)), `${file}: ${url}`).toBe(true);
    }
  },
);

test('every page has the same bar and foot', { tag: '@offline' }, () => {
  // The links each page's bar and foot offer, by their words; the page you're on is marked, and
  // the home page's Features is on the page itself.
  const links = (html, part) =>
    [...new RegExp(`<${part}[\\s\\S]*?</${part}>`).exec(html)[0].matchAll(/<a\b([^>]*)>([^<]+)</g)]
      .map(([, attributes, words]) => `${words.trim()} ${/href="([^"]+)"/.exec(attributes)[1]}`)
      .map((link) => link.replace(' ./#features', ' #features'));
  const home = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  for (const file of PAGES.slice(1)) {
    const html = fs.readFileSync(path.join(OUT, file), 'utf8');
    expect(links(html, 'header'), file).toEqual(links(home, 'header'));
    expect(links(html, 'footer'), file).toEqual(links(home, 'footer'));
  }
});

test(
  'What’s new shows each version GitHub has released once, and what’s coming next in a tab',
  { tag: '@offline' },
  () => {
    const changelog = `# Changelog

## v1.1.0 - Unreleased

**Still to come**

- Something new.

## v1.0.0 - 2026-12-02

**A new name**

Words before the list, with a "quote" and Slides' own.

- **Spotlight:** select an image and press <kbd>Space</kbd>.
- **Zoom & scroll:** see \`code\` <script>alert(1)</script>
  and a line that runs on.
- The button no longer opens a popup.

## v0.1.0 - 2025-05-08

**Initial release**

- Enable image spotlight
`;
    expect(versions(changelog).map((v) => [v.number, v.date])).toEqual([
      ['1.1.0', null],
      ['1.0.0', '2026-12-02'],
      ['0.1.0', '2025-05-08'],
    ]);

    // One page: the latest release as the hero, the ones before it under it, each once.
    const tags = new Set(['v1.0.0', 'v0.1.0']);
    const pages = releasePages(changelog, { tags });
    expect(Object.keys(pages)).toEqual(['whats-new.html']);
    const page = pages['whats-new.html'];
    expect(page.latest).toContain('id="v1.0.0"');
    expect(page.latest).toContain('What’s new in version 1.0.0');
    expect(page.latest).toContain('<h1>A new name</h1>');
    expect(page.latest).toContain('a “quote” and Slides’ own');
    expect(page.latest).toContain('<time datetime="2026-12-02">2 December 2026</time>');
    expect(page.latest).toContain('/releases/tag/v1.0.0');
    // Each named change beside its name, its words a sentence; the rest under "Also".
    expect(page['latest changes']).toContain(
      '<h3>Spotlight</h3><p>Select an image and press <kbd>Space</kbd>.</p>',
    );
    expect(page['latest changes']).toContain('<h3>Also</h3>');
    // Markdown's code is kept as written, HTML that isn't a key is shown, not run, and an item
    // that runs on over two lines stays one.
    expect(page['latest changes']).toContain(
      'See <code>code</code> &lt;script&gt;alert(1)&lt;/script&gt; and a line that runs on.',
    );
    expect(page.earlier).toContain('id="v0.1.0"');
    expect(page.earlier).not.toContain('v1.0.0"');
    expect(page.earlier).not.toContain('1.1.0');

    // What the code has that isn't released: its own tab, set as the latest release is, with how
    // to install it from the code, and no GitHub release to link to.
    expect(page.tabs).toContain('<a href="#now">Out now</a><a href="#next">Coming next</a>');
    expect(page.next).toContain('Coming next: version 1.1.0');
    expect(page.next).toContain('<h1>Still to come</h1>');
    expect(page.next).toContain('/archive/refs/heads/main.zip');
    expect(page.next).not.toContain('/releases/tag/v1.1.0');
    expect(page['next changes']).toContain('Something new.');

    // With everything released, nothing's coming next, and there are no tabs.
    const allOut = releasePages(changelog, { tags: new Set([...tags, 'v1.1.0']) })[
      'whats-new.html'
    ];
    expect(allOut.tabs).toBe('');
    expect(allOut.next).toBe('');

    // Before any release, the page still makes sense, everything coming next.
    const none = releasePages(changelog, { tags: new Set() })['whats-new.html'];
    expect(none.latest).toContain('Coming soon');
    expect(none.earlier).toBe('');
    expect(none.next).toContain('Coming next: version 1.1.0');
    expect(none['next changes']).toContain('Version 1.0.0');
  },
);

test('the privacy page is PRIVACY.md, all of it', { tag: '@offline' }, () => {
  const markdown = fs.readFileSync(path.join(import.meta.dirname, '../PRIVACY.md'), 'utf8');
  const page = fs.readFileSync(path.join(OUT, 'privacy.html'), 'utf8');
  // No Markdown left showing, as bold around code once was.
  expect(page.replaceAll(/<code>.*?<\/code>/g, '')).not.toMatch(/\*\*|`/);
  // Every part, its number beside it.
  for (const [, number, words] of markdown.matchAll(/^## (\d+)\.\s+(.*)$/gm)) {
    expect(page).toContain(`<span class="part-number">${number}</span>`);
    expect(page).toContain(`<h2>${words.replaceAll("'", '’')}</h2>`);
  }
  // Every item, by its words before any markup.
  for (const [, item] of markdown.matchAll(/^- (?:\*\*)?([A-Za-z][\w ,]{12,}?)[*:(`]/gm))
    expect(page, item).toContain(item.replaceAll("'", '’'));
  const parts = privacy(`# Policy

_Last updated: today_

In short.

## 1. First

- One **bold**, \`code\`, <kbd>Esc</kbd> and a [link](https://example.com).
- **\`storage\`:** bold around code, and \`it's **not** read\`.
`);
  expect(parts['privacy title']).toBe('Policy');
  expect(parts['privacy updated']).toContain('Last updated: today');
  expect(parts['privacy lead']).toBe('<p class="lead">In short.</p>');
  expect(parts['privacy parts']).toContain('id="first"');
  expect(parts['privacy parts']).toContain(
    '<li>One <strong>bold</strong>, <code>code</code>, <kbd>Esc</kbd> and a <a href="https://example.com">link</a>.</li>',
  );
  expect(parts['privacy parts']).toContain(
    "<li><strong><code>storage</code>:</strong> bold around code, and <code>it's **not** read</code>.</li>",
  );
});

test('the website’s companions look at the pointer', { tag: '@offline' }, async ({ page }) => {
  // Offline: Google's fonts aren't needed to check this.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
  const pupils = page.locator('.peek .slides-companion-pupil');
  await expect(pupils).toHaveCount(4);
  const where = () => pupils.evaluateAll((all) => all.map((p) => Number(p.getAttribute('cx'))));
  const rest = await where();
  await page.mouse.move(0, 400);
  await expect.poll(where).not.toEqual(rest);
  const left = await where();
  await page.mouse.move(1200, 400);
  await expect.poll(async () => (await where()).every((x, i) => x > left[i])).toBe(true);
  // The icon's, in the bar and the hero, too.
  const icons = page.locator('.icon .slides-companion-pupil');
  await expect(icons).toHaveCount(4);
  const iconsAt = () => icons.evaluateAll((all) => all.map((p) => Number(p.getAttribute('cx'))));
  const iconsRight = await iconsAt();
  await page.mouse.move(0, 400);
  await expect.poll(async () => (await iconsAt()).every((x, i) => x < iconsRight[i])).toBe(true);
  // The illustrations are in the page, each once: Settings' three, and the site's own for
  // Download image.
  await expect(page.locator('.art > svg')).toHaveCount(4);
  expect(errors).toEqual([]);
});

// A tap's lift brings a mousemove the companions follow anyway, so the finger here stays down: they
// look at once, and follow it as it moves, before the page takes it for a scroll.
test(
  'on a phone, the companions look where a finger touches, and follow it',
  { tag: '@offline' },
  async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    const cdp = await context.newCDPSession(page);
    const touch = (type, x, y) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    const pupil = page.locator('.hero-icon .slides-companion-pupil').first();
    const x = async () => Number(await pupil.getAttribute('cx'));
    await touch('touchStart', 10, 120);
    await expect.poll(x).toBeLessThan(400);
    const left = await x();
    await touch('touchMove', 380, 125);
    await expect.poll(x).toBeGreaterThan(left + 40);
    await touch('touchEnd');
    await context.close();
  },
);

test(
  'the footer’s words run from edge to edge, rise in once, and have his eyes in their o’s',
  { tag: '@offline' },
  async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    const phrase = page.locator('.footer-phrase');
    await expect(phrase).toHaveClass(/\bplaced\b/);
    const measure = () =>
      page.evaluate(() => {
        const box = (element) => element.getBoundingClientRect().toJSON();
        const all = (selector) => [...document.querySelectorAll(selector)].map(box);
        const lines = all('.footer-line');
        return {
          // How far the longer row is from the page's width, give or take its sidebearings.
          off:
            Math.abs(
              Math.max(...lines.map((line) => line.width)) -
                box(document.querySelector('.footer-frame')).width,
            ) / box(document.querySelector('.footer-frame')).width,
          lines,
          os: all('.footer-o'),
          eyes: all('.footer-eye'),
          legal: box(document.querySelector('.footer-legal')),
          links: box(document.querySelector('.footer-links')),
        };
      });
    // A phone, where everything stacks, and a laptop, where the small print sits beside the words.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(async () => (await measure()).off, `${width}px wide`).toBeLessThan(0.02);
      const { os, eyes } = await measure();
      eyes.forEach((eye, i) => {
        expect(eye.left, `${width}px wide`).toBeGreaterThan(os[i].left);
        expect(eye.right, `${width}px wide`).toBeLessThan(os[i].right);
        expect(eye.width, `${width}px wide`).toBeGreaterThan(os[i].width * 0.3);
      });
    }
    // On the laptop, the small print beside "You're in", ending where the links do, above
    // "good company.".
    const { legal, links, lines } = await measure();
    expect(Math.abs(legal.right - links.right)).toBeLessThan(1);
    expect(legal.left).toBeGreaterThan(lines[0].right);
    expect(legal.bottom).toBeLessThan(lines[1].top + lines[1].height * 0.3);

    // Waiting below the page's fold, then risen and whole once it's reached.
    await expect(phrase).toHaveClass(/\bunrisen\b/);
    await phrase.scrollIntoViewIfNeeded();
    await expect(phrase).not.toHaveClass(/\bunrisen\b/);
    await expect
      .poll(() =>
        page
          .locator('.footer-line')
          .evaluateAll((all) => all.map((line) => getComputedStyle(line).opacity)),
      )
      .toEqual(['1', '1']);
    // His eyes follow the pointer, one way and the other.
    const look = () =>
      page
        .locator('.footer-pupil')
        .first()
        .evaluate((p) => parseFloat(p.style.getPropertyValue('--x')));
    await page.mouse.move(5, 450);
    await expect.poll(look).toBeLessThan(-2);
    await page.mouse.move(1400, 450);
    await expect.poll(look).toBeGreaterThan(2);
    // And on a phone, the last touch.
    const touch = (x) =>
      page.evaluate(
        (x) =>
          dispatchEvent(
            new PointerEvent('pointerdown', { pointerType: 'touch', clientX: x, clientY: 450 }),
          ),
        x,
      );
    await touch(5);
    await expect.poll(look).toBeLessThan(-2);
    await touch(1400);
    await expect.poll(look).toBeGreaterThan(2);
    // Pressed, his eyes squeeze into happy arcs, and open again once let go.
    const lids = () =>
      page.locator('.footer-lid').evaluateAll((all) => all.map((lid) => lid.style.visibility));
    const o = await page.locator('.footer-o').first().boundingBox();
    await page.mouse.move(o.x + o.width / 2, o.y + o.height / 2);
    await page.mouse.down();
    await expect.poll(lids).toEqual(['visible', 'visible']);
    await page.mouse.up();
    await expect.poll(lids).toEqual(['hidden', 'hidden']);
    expect(errors).toEqual([]);
  },
);

test(
  'the website is never wider than the window, so it stays centred',
  { tag: '@offline' },
  async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    for (const file of PAGES) {
      await page.goto(pathToFileURL(path.join(OUT, file)).href);
      // A phone, a tablet, a laptop and a 5K display at its default scaling.
      for (const width of [390, 834, 1440, 2560]) {
        await page.setViewportSize({ width, height: 900 });
        const sideways = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(sideways, `${file}, ${width}px wide`).toBe(0);
      }
    }
  },
);

test(
  'the bar at the top appears once the hero’s Add to Chrome has gone, and stays',
  { tag: '@offline' },
  async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    const brand = page.locator('.nav .brand');
    const button = page.locator('.nav .button');
    await expect(brand).toBeHidden();
    await expect(button).toBeHidden();
    // Not yet when only the hero's name has gone up under it: its own button is still there.
    await page.evaluate(() => {
      const box = document.querySelector('.hero .eyebrow').getBoundingClientRect();
      scrollTo(0, box.bottom + scrollY);
    });
    // The observers answer by the next frame or two.
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    await expect(page.locator('.nav')).not.toHaveClass(/\bdocked\b/);
    await page.evaluate(() => {
      const box = document.querySelector('.hero .actions .button').getBoundingClientRect();
      scrollTo(0, box.bottom + scrollY);
    });
    await expect(brand).toBeVisible();
    await expect(button).toBeVisible();
    // Over the black tile it turns to dark glass, and back once past it.
    const nav = page.locator('.nav');
    await page.evaluate(() => {
      const tile = document.querySelector('.tile-dark').getBoundingClientRect();
      scrollTo(0, tile.top + scrollY - 20);
    });
    await expect(nav).toHaveClass(/\bdark\b/);
    await page.locator('.cells').scrollIntoViewIfNeeded();
    await expect(nav).not.toHaveClass(/\bdark\b/);
    // Even beside the last call's own button.
    await page.locator('.panel .button').scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
  },
);

test(
  'on What’s new and the privacy policy, the bar is there from the start, lifting off as the page scrolls, and nothing fails',
  { tag: '@offline' },
  async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const file of PAGES.slice(1)) {
      await page.goto(pathToFileURL(path.join(OUT, file)).href);
      await expect(page.locator('.nav .brand'), file).toBeVisible();
      await expect(page.locator('.nav .button'), file).toBeVisible();
      // Flat on the page at the top, lifting into its glass once the page scrolls.
      const lift = () =>
        page.locator('.nav').evaluate((nav) => nav.style.getPropertyValue('--lift'));
      await expect.poll(lift, file).toBe('0.000');
      await page.evaluate(() => scrollTo(0, 200));
      await expect.poll(lift, file).toBe('1.000');
      // The companion at the foot still watches the pointer.
      await expect(page.locator('.peek .slides-companion-pupil'), file).toHaveCount(2);
    }
    expect(errors).toEqual([]);
  },
);

test(
  'What’s new’s tabs show what’s out now, or what’s coming next for a link to it',
  { tag: '@offline' },
  async ({ page }, testInfo) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    // A site of its own, with a version coming next, whatever the changelog has today.
    const out = testInfo.outputPath('site-next');
    assemble(out, {
      changelog: `## v2.0.0 - Unreleased\n\n**Next**\n\n- Soon.\n\n## v1.0.0 - 2026-12-02\n\n**Now**\n\n- Here.\n\n## v0.1.0 - 2025-05-08\n\n**Before**\n\n- Then.\n`,
      released: new Set(['v1.0.0', 'v0.1.0']),
    });
    const url = pathToFileURL(path.join(out, 'whats-new.html')).href;
    const now = page.getByRole('heading', { name: 'Now', exact: true });
    const next = page.getByRole('heading', { name: 'Next', exact: true });
    const before = page.getByRole('heading', { name: 'Before' });
    await page.goto(url);
    await expect(now).toBeVisible();
    await expect(before).toBeAttached();
    await expect(next).toBeHidden();
    await page.getByRole('link', { name: 'Coming next' }).click();
    await expect(next).toBeVisible();
    await expect(now).toBeHidden();
    await expect(before).toBeHidden();
    expect(page.url()).toMatch(/#next$/);
    // The raised thumb slides under the tab picked.
    const under = () =>
      page.evaluate(() => {
        const thumb = document.querySelector('.tabs-thumb').getBoundingClientRect();
        const on = document.querySelector('.tabs a[href="#next"]').getBoundingClientRect();
        return Math.abs(thumb.left - on.left);
      });
    await expect.poll(under).toBeLessThan(1);
    await page.getByRole('link', { name: 'Out now' }).click();
    await expect(now).toBeVisible();
    // A link to #next opens on it.
    await page.goto(`${url}#next`);
    await expect(next).toBeVisible();
  },
);

test(
  'on a phone, Add to Chrome sends the link to the computer instead',
  { tag: '@offline' },
  async ({ browser }) => {
    // A phone: touch, no hover, as Chromium emulates one.
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await context.addInitScript(() => {
      window.shared = [];
      navigator.share = async (data) => window.shared.push(data);
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    const hero = page.locator('.hero .button');
    await expect(hero).toHaveText('Send to my computer');
    // The bar says it short, and the small print says it's for the computer.
    await page.evaluate(() => {
      const box = document.querySelector('.hero .actions .button').getBoundingClientRect();
      scrollTo(0, box.bottom + scrollY);
    });
    await expect(page.locator('.nav .button')).toHaveText(/Share link/);
    await expect(page.locator('.nav .button .send-short')).toBeVisible();
    await expect(page.locator('.hero .for-phone')).toBeVisible();
    await expect(page.locator('.hero .for-computer')).toBeHidden();
    await hero.click();
    const shared = await page.evaluate(() => window.shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toContain('chromewebstore.google.com');
    expect(page.url()).toMatch(/index\.html$/);
    await context.close();

    // On a computer, it's still Add to Chrome, to the store.
    const desk = await browser.newPage();
    await desk.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await desk.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    await expect(desk.locator('.hero .button')).toHaveText('Add to Chrome');
    await expect(desk.locator('.hero .for-computer')).toBeVisible();
    await desk.close();
  },
);
