// Captures the interface in layers (build/demo/stills/layers/), so the After Effects edit can build a
// screen from its parts and move each one, instead of cutting between flat screenshots of it:
// - <scene>-backdrop*.png: the window with our interface hidden, in each layout it takes.
// - <scene>-<part>.png: each of our elements alone on transparency, in each state the video shows.
// - <scene>-ref-*.png: the whole window in a few states, to check the rebuilt screen against.
// - <scene>.json: where each part goes, in CSS pixels of its window, and the colours and sizes of
//   what the edit draws itself (a menu item's highlight, the countdown's bar).
// Chrome draws every picture here, at 4×, so each part looks exactly as presenters see it. That
// includes the clock's digits, captured as pictures: presenter view's Roboto isn't installed for
// After Effects to set.
//   node scripts/demo/stills.mjs layers [timer]
import fs from 'node:fs';
import path from 'node:path';
import { SLIDES } from './deck.mjs';
import { endSlideshow, goToSlideInEditor, launch, openEditor, sleep } from './record.mjs';

export const LAYERS = path.resolve(import.meta.dirname, '../../build/demo/stills/layers');

const report = (file) =>
  console.log(
    `${path.relative(process.cwd(), file)}: ${(fs.statSync(file).size / 1024).toFixed(0)} KB`,
  );

// A box in whole CSS pixels around another, a margin out, so a picture of it lands on whole pixels
// in the edit at any scale, and has room for a shadow.
const around = (b, margin = 0) => {
  const x = Math.floor(b.x - margin);
  const y = Math.floor(b.y - margin);
  return {
    x,
    y,
    width: Math.ceil(b.x + b.width + margin) - x,
    height: Math.ceil(b.y + b.height + margin) - y,
  };
};

async function box(locator) {
  const b = await locator.first().boundingBox();
  return b && { x: b.x, y: b.y, width: b.width, height: b.height };
}

// What a capture shows, as a style sheet of its own that the next capture replaces.
const STYLE = 'slides-companion-demo-layers';
const setStyle = (page, css) =>
  page.evaluate(
    ([id, css]) => {
      let sheet = document.getElementById(id);
      if (!sheet) {
        sheet = document.createElement('style');
        sheet.id = id;
        document.head.append(sheet);
      }
      sheet.textContent = css;
    },
    [STYLE, css],
  );
const hiding = (selectors) =>
  selectors.length ? `${selectors.join(', ')} { visibility: hidden !important; }` : '';
// Only what `show` matches, and what's inside it but `hide`, on a transparent page.
const only = (show, hide = []) => `
  html, body { background: transparent !important; }
  * { visibility: hidden !important; }
  ${show}, ${show} * { visibility: visible !important; }
  ${hide.map((h) => `${show} ${h}, ${show} ${h} *`).join(', ')}${hide.length ? ' { visibility: hidden !important; }' : ''}
`;

// Each capture styles the page for itself, then puts back `normal`, so the next step clicks and waits
// on the page as it is.
function shooter(page, scene, manifest, normal = '') {
  return async (name, { css = '', clip, transparent = Boolean(clip) } = {}) => {
    await setStyle(page, css);
    await sleep(120);
    const file = path.join(LAYERS, `${scene}-${name}.png`);
    await page.screenshot({
      path: file,
      clip,
      omitBackground: transparent,
      animations: 'disabled',
      caret: 'initial',
    });
    manifest.files[name] = { file: path.basename(file), clip: clip ?? null };
    await setStyle(page, normal);
    report(file);
  };
}

// Presenter view's timer, as the Timer scene shows it: the time ticking, the timer button hovered and
// pressed, its menu with an item highlighted, and counting down, with the bar under the time.
async function timer(page, context) {
  if (page.url().startsWith('about:')) await openEditor(page, SLIDES.timer);
  else {
    await endSlideshow(page);
    await goToSlideInEditor(page, SLIDES.timer);
  }
  await sleep(800);
  await page.locator('#punch-start-presentation-right').click();
  const opened = context.waitForEvent('page');
  await page.locator('.goog-menuitem').filter({ visible: true }).first().click();
  const presenter = await opened;
  const size = { width: 1100, height: 680 };
  await presenter.setViewportSize(size);
  const button = presenter.locator('.slides-companion-countdown-button');
  await button.waitFor();
  await sleep(1500);
  await presenter.mouse.move(700, 600);

  const manifest = { scene: 'timer', size, scale: 4, files: {} };

  // The time as a copy of Slides' own element, which says what each picture needs it to; Slides keeps
  // its own ticking, hidden. Same class, same place: the copy is laid out as the time is.
  await presenter.evaluate(() => {
    const time = document.querySelector(
      '.punch-viewer-speakernotes-timer-time:not(.slides-companion-countdown)',
    );
    const copy = time.cloneNode(false);
    copy.id = 'demo-time';
    copy.removeAttribute('hidden');
    copy.style.display = 'block';
    copy.textContent = '00:00:07';
    time.after(copy);
  });
  const TIME = '#demo-time';
  const TIMES = '.punch-viewer-speakernotes-timer-time:not(#demo-time)';
  const setTime = (text) =>
    presenter.evaluate((text) => (document.getElementById('demo-time').textContent = text), text);
  const hideTimes = `${TIMES} { display: none !important; }`;
  const shoot = shooter(presenter, 'timer', manifest, hideTimes);

  const MENU = '.slides-companion-countdown-menu';
  const BAR = '.slides-companion-countdown-bar';
  const CONTAINER = '.slides-companion-countdown-container';
  const BUTTON = '.slides-companion-countdown-button';
  const OURS = [TIME, BUTTON, MENU, BAR];
  const panel = presenter.locator('.punch-viewer-speakernotes-timer-panel');
  const measure = async () => ({
    timerPanel: {
      ...(await box(panel)),
      background: await panel.evaluate((element) => getComputedStyle(element).backgroundColor),
    },
    pageControl: await box(presenter.locator('.punch-viewer-speakernotes-page-control-panel')),
    sidePanel: await box(presenter.locator('.punch-viewer-speakernotes-side-panel')),
  });

  // At rest, counting up.
  await setStyle(presenter, hideTimes);
  manifest.rest = await measure();
  manifest.button = await box(button);
  manifest.container = await box(presenter.locator(CONTAINER));
  manifest.time = await box(presenter.locator(TIME));
  // Where each character of the time is, from the text itself.
  manifest.time.characters = await presenter.evaluate(() => {
    const text = document.getElementById('demo-time').firstChild;
    return [...text.data].map((character, i) => {
      const range = document.createRange();
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      const r = range.getBoundingClientRect();
      return { character, x: r.x, width: r.width };
    });
  });
  await shoot('backdrop', { css: hideTimes + hiding(OURS) });
  await shoot('ref-rest', { css: hideTimes });

  // Each digit, in every place: Roboto's digits are all as wide, so one picture of "11:11:11" has the
  // 1 for each place, where the time puts it.
  const digits = around(manifest.time, 3);
  manifest.digits = { clip: digits, widths: [] };
  for (let d = 0; d <= 9; d++) {
    await setTime(`${d}${d}:${d}${d}:${d}${d}`);
    manifest.digits.widths.push((await box(presenter.locator(TIME))).width);
    await shoot(`digits-${d}`, { css: hideTimes + only(TIME), clip: digits });
  }
  await setTime('00:00:07');

  const buttonClip = around(manifest.button, 3);
  await shoot('button', { css: hideTimes + only(BUTTON), clip: buttonClip });
  const at = manifest.button;
  await presenter.mouse.move(at.x + at.width / 2, at.y + at.height / 2);
  await sleep(300);
  await shoot('button-hover', { css: hideTimes + only(BUTTON), clip: buttonClip });

  // The menu, opened, with nothing highlighted, the pointer away from it.
  await presenter.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
  const fifteen = presenter.locator(`${MENU} .goog-menuitem`, {
    hasText: 'Count down from 15 minutes',
  });
  await fifteen.waitFor();
  // The menu closes when it loses focus, and hiding it for a picture of something else takes the
  // focus away: while it's open, the window keeps that from reaching it.
  await presenter.evaluate(() =>
    window.addEventListener('focusout', (event) => event.stopImmediatePropagation(), true),
  );
  await presenter.mouse.move(700, 600);
  await sleep(300);
  const unhighlight = () =>
    presenter.evaluate(() => {
      for (const item of document.querySelectorAll('.goog-menuitem-highlight'))
        item.classList.remove('goog-menuitem-highlight');
    });
  await unhighlight();
  manifest.menu = await box(presenter.locator(MENU));
  manifest.items = await presenter.evaluate((menu) => {
    return [
      ...document.querySelectorAll(`${menu} .goog-menuitem, ${menu} .goog-menuseparator`),
    ].map((element, i) => {
      element.dataset.demoPart = i;
      const r = element.getBoundingClientRect();
      return {
        part: i,
        separator: element.classList.contains('goog-menuseparator'),
        text: element.textContent,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      };
    });
  }, MENU);
  await shoot('button-checked', { css: hideTimes + only(BUTTON), clip: buttonClip });
  // The menu's box, shadow and separators; then each item on its own.
  manifest.menu.clip = around(manifest.menu, 8);
  await shoot('menu', {
    css: hideTimes + only(MENU, ['.goog-menuitem']),
    clip: manifest.menu.clip,
  });
  for (const item of manifest.items.filter((each) => !each.separator)) {
    item.clip = around(item);
    await shoot(`item-${item.part}`, {
      css: hideTimes + only(`[data-demo-part="${item.part}"]`),
      clip: item.clip,
    });
  }
  // A highlighted item: its colour, and the whole window as it looks, for the check.
  await fifteen.hover();
  await sleep(300);
  manifest.highlight = await presenter.locator('.goog-menuitem-highlight').evaluate((element) => {
    const r = element.getBoundingClientRect();
    return {
      color: getComputedStyle(element).backgroundColor,
      text: element.textContent,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    };
  });
  await setTime('00:00:09');
  await shoot('ref-menu', { css: hideTimes });

  // Counting down from 15 minutes, with the bar: the timer's panel grows to make room for it.
  await fifteen.click();
  await sleep(800);
  manifest.counting = await measure();
  const bar = presenter.locator(BAR);
  manifest.bar = await bar.evaluate((element) => {
    const fill = element.firstElementChild;
    const r = element.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      radius: parseFloat(getComputedStyle(element).borderTopLeftRadius),
      track: getComputedStyle(element).backgroundColor,
      fill: getComputedStyle(fill).backgroundColor,
    };
  });
  manifest.timeCounting = await box(presenter.locator(TIME));
  await presenter.mouse.move(700, 600);
  await sleep(300);
  await shoot('backdrop-counting', { css: hideTimes + hiding(OURS) });
  await setTime('00:14:59');
  await shoot('ref-counting', {
    css: hideTimes + hiding(['.slides-companion-countdown-bar-fill']),
  });
  await presenter.close();

  const file = path.join(LAYERS, 'timer.json');
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  report(file);
}

const SCENES = { timer };

export async function layers(only) {
  if (only && !SCENES[only]) throw new Error(`No scene "${only}": ${Object.keys(SCENES)}`);
  fs.mkdirSync(LAYERS, { recursive: true });
  const { context, close } = await launch(4);
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    for (const [name, scene] of Object.entries(SCENES))
      if (!only || name === only) await scene(page, context);
  } finally {
    await close();
  }
}
