// The notice asking for every site, in a frame of the Settings dialog
// (settings-dialog.js). It shows only while Chrome hasn't given the extension every site, which some
// sites need to be shown over the slide. Its button asks Chrome right away, as Chrome asks only during
// a click, and the notice goes once access is given. Taking it back is done in Chrome's own settings
// for the extension, where the notice comes back.
{
  const ALL_SITES = { origins: ['*://*/*'] };
  const DIALOG_ORIGIN = 'https://docs.google.com';
  const { text } = globalThis.slidesCompanion;
  document.documentElement.lang = new URLSearchParams(location.search).get('hl') ?? 'en';
  document.documentElement.dir = globalThis.slidesCompanion.dir();

  const banner = document.querySelector('.slides-companion-banner');
  const allow = banner.querySelector('.slides-companion-banner-action');
  banner.querySelector('.slides-companion-banner-text').textContent = text('allSitesLine');
  allow.textContent = text('allSitesAllow');

  const tell = (message) =>
    parent.postMessage({ source: 'slides-companion-all-sites', ...message }, DIALOG_ORIGIN);

  // What the dialog needs: whether the notice shows, which makes its button a Tab stop, and its
  // height. Whether it shows is told as soon as Chrome answers, not left to the height: the frame
  // is on a page of the dialog that's hidden until its feature is chosen, and isn't laid out until
  // then, so its height comes a few frames after the page shows, and a Tab pressed in between went
  // past the button.
  const report = () =>
    tell({
      type: 'notice',
      shown: !banner.hidden,
      height: Math.ceil(document.body.getBoundingClientRect().height),
    });

  const showIfMissing = () =>
    chrome.permissions.contains(ALL_SITES).then((has) => {
      banner.hidden = has;
      report();
    });
  showIfMissing();
  chrome.permissions.onAdded.addListener(showIfMissing);
  chrome.permissions.onRemoved.addListener(showIfMissing);

  allow.addEventListener('click', async () => {
    try {
      if (await chrome.permissions.request(ALL_SITES)) {
        banner.hidden = true;
        report();
      }
    } catch {}
  });

  // Tabbed into from the dialog.
  window.addEventListener('message', (event) => {
    if (event.source !== parent || event.origin !== DIALOG_ORIGIN || event.data !== 'focus') return;
    document.documentElement.classList.add('slides-companion-tabbed');
    allow.focus();
  });

  // The dialog's keys: Esc cancels, Tab goes on to its other controls. (Enter and Space choose the button.)
  window.addEventListener('keydown', (event) => {
    if (!['Escape', 'Tab'].includes(event.key)) return;
    event.preventDefault();
    tell({ type: 'key', key: event.key, shiftKey: event.shiftKey });
  });
  window.addEventListener('mousedown', () =>
    document.documentElement.classList.remove('slides-companion-tabbed'),
  );
  window.addEventListener('blur', () =>
    document.documentElement.classList.remove('slides-companion-tabbed'),
  );

  // The frame's height: the notice's, or none once it's gone.
  new ResizeObserver(report).observe(document.body);
}
