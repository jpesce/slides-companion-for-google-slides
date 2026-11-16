import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import { assemble } from '../scripts/build-site.mjs';

// The website (site/), as scripts/build-site.mjs puts it together for GitHub Pages: every file it
// points to is there, everything it shares with the extension is filled in, and the companion's
// eyes follow the pointer, as in Slides' toolbar.
let OUT;

// Each worker puts the site together in a folder of its own, away from build/site/, which
// npm run site:serve may be showing.
test.beforeAll(({}, testInfo) => {
  OUT = testInfo.outputPath('site');
  assemble(OUT);
});

test(
  'the website points only at files it has, with nothing left to fill in',
  { tag: '@offline' },
  () => {
    const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
    expect(html).not.toMatch(/\{\{[\w -]+\}\}/);
    // A srcset lists its files with their widths, between commas.
    const local = [...html.matchAll(/(src|href|poster|srcset)="([^"]+)"/g)]
      .flatMap(([, name, value]) =>
        name === 'srcset' ? value.split(',').map((part) => part.trim().split(' ')[0]) : [value],
      )
      .filter((url) => !/^(https?:|#|\.\/$|mailto:)/.test(url));
    expect(local.length).toBeGreaterThan(10);
    for (const url of local) expect(fs.existsSync(path.join(OUT, url)), url).toBe(true);
  },
);

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
  // Settings' illustrations are in the page, each once.
  await expect(page.locator('.art > svg')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test(
  'the website is never wider than the window, so it stays centred',
  { tag: '@offline' },
  async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    // A phone, a tablet, a laptop and a 5K display at its default scaling.
    for (const width of [390, 834, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(sideways, `${width}px wide`).toBe(0);
    }
  },
);

test(
  'the bar at the top floats in once the hero’s name has gone, and stays',
  { tag: '@offline' },
  async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(pathToFileURL(path.join(OUT, 'index.html')).href);
    const brand = page.locator('.nav .brand');
    const button = page.locator('.nav .button');
    await expect(brand).toBeHidden();
    await expect(button).toBeHidden();
    await page.evaluate(() => {
      const box = document.querySelector('.hero .eyebrow').getBoundingClientRect();
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
