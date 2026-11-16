// The companion: our mascot, pinned to the top of Slides' side toolbar, whose eyes follow the
// mouse, who blinks, and who squashes when pressed (companion-motion.js). His picture and where his
// eyes are come from companion-drawing.js (npm run brand).
{
  const DRAWING = globalThis.slidesCompanion.companionDrawing;

  function createCompanion() {
    const button = document.createElement('div');
    button.className = 'slides-companion-button';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', globalThis.slidesCompanion.text('settingsLabel'));
    button.innerHTML = DRAWING.svg;

    const openSettings = () => {
      tip.hide();
      globalThis.slidesCompanion.openSettings(button);
    };
    button.addEventListener('click', openSettings);
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      openSettings();
    });
    showTooltipOnHover(button);
    return button;
  }

  // Slides' tooltip manager only knows its own buttons, so we draw the same `jfk-tooltip` (Slides'
  // own styles, which add 4px) centred 1px below the button, as Slides does on this toolbar, and up
  // to the window's edge.
  const tooltip = globalThis.slidesCompanion.ui.tooltip();
  const tip = globalThis.slidesCompanion.ui.hoverTip(tooltip, (button) => {
    tooltip.say(globalThis.slidesCompanion.text('settingsLabel'));
    tooltip.place(button.getBoundingClientRect(), { gap: 1 });
  });

  function showTooltipOnHover(button) {
    button.addEventListener('mouseenter', () => tip.pointAt(button));
    button.addEventListener('mouseleave', () => tip.pointAt(null));
    button.addEventListener('mousedown', tip.press);
  }

  // He shows unless the presenter keeps Slides' toolbar as Slides made it (Settings), and comes and
  // goes in every open Slides tab as soon as they choose. His animation stops once he's gone.
  const { settings } = globalThis.slidesCompanion;
  let sideToolbar = null;
  let button = null;
  function update() {
    const shown = settings.get('showCompanion') && sideToolbar;
    if (shown && button?.isConnected) return;
    tip.hide();
    // Any other copy goes too: a previous copy of this script (e.g. before an extension reload)
    // may have left one behind, or put one in after this one started.
    for (const old of document.querySelectorAll('.slides-companion-button')) old.remove();
    button = null;
    if (!shown) return;
    button = createCompanion();
    sideToolbar.insertBefore(button, sideToolbar.firstChild);
    globalThis.slidesCompanion.animateCompanion(button, DRAWING);
  }

  settings.ready.then(() => {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && 'showCompanion' in changes) update();
    });
    // The side toolbar may render after the content script runs.
    const find = () => {
      sideToolbar = document.querySelector('#docs-side-toolbar');
      if (sideToolbar) update();
      return sideToolbar;
    };
    if (find()) return;
    const observer = new MutationObserver(() => {
      if (find()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
