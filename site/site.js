// What moves on the website: the companion, as he moves in Slides' toolbar (companion-motion.js),
// his eyes on the pointer; the film, which plays on the screen he peeks over; things below the fold
// rising in as they scroll into view; and Settings' illustrations, which hold a still frame when
// the system asks for reduced motion.
{
  const still = matchMedia('(prefers-reduced-motion: reduce)');

  // Sparkles around a word, for as long as it's lit: a burst as it lights, then one every so
  // often, never in step, each at a new place around the word, of its own size, turning as it
  // grows in and shrinks away. Most are small, a few large, as glints are. They, and the
  // highlight's sheen, rest while the word is off screen or the tab is hidden, and the burst
  // plays only when it lights, not when they wake.
  const sparkler = (host) => {
    const svg = 'http://www.w3.org/2000/svg';
    const shape = host.querySelector('.sparkle path').getAttribute('d');
    const yellows = ['#f4b400', '#f9ab00', '#fbbc04'];
    const between = (low, high) => low + Math.random() * (high - low);
    let lit = false;
    let seen = false;
    let timer = 0;
    const spark = (large) => {
      if (host.querySelectorAll('.spark').length > 6) return;
      const width = host.offsetWidth;
      const height = host.offsetHeight;
      // Around the word rather than over it: above it and off its end, where there's room, and
      // never at its start, beside the words before it.
      const angle = between(Math.PI * 1.2, Math.PI * 2.25);
      const size = large ? between(13, 19) : 6 + Math.random() ** 1.8 * 12;
      // Clear of the letters by at least a few pixels, whatever its size.
      const x = width / 2 + Math.cos(angle) * (width / 2 + size / 2 + between(2, 12));
      const y = height / 2 + Math.sin(angle) * (height / 2 + size / 2 + between(0, 8));
      const life = between(650, 1000);
      const turn = (Math.random() < 0.5 ? -1 : 1) * between(90, 180);
      const node = document.createElementNS(svg, 'svg');
      node.setAttribute('class', 'spark');
      node.setAttribute('viewBox', '0 0 160 160');
      node.setAttribute('aria-hidden', 'true');
      Object.assign(node.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        fill: yellows[Math.floor(Math.random() * yellows.length)],
      });
      const path = document.createElementNS(svg, 'path');
      path.setAttribute('d', shape);
      node.append(path);
      host.append(node);
      // Quick to grow, slower to fade: a glint, not a blink.
      node
        .animate(
          [
            { scale: 0, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
            { scale: 1, offset: 0.35, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
            { scale: 0 },
          ],
          { duration: life, fill: 'forwards' },
        )
        .finished.then(() => node.remove());
      node.animate([{ rotate: '0deg' }, { rotate: `${turn}deg` }], {
        duration: life,
        easing: 'cubic-bezier(0.3, 0.2, 0.4, 1)',
      });
    };
    const twinkle = () => {
      spark(Math.random() < 0.15);
      timer = setTimeout(twinkle, between(140, 420));
    };
    const run = () => {
      clearTimeout(timer);
      timer = 0;
      host.classList.toggle('resting', !seen || document.hidden);
      if (lit && seen && !document.hidden) timer = setTimeout(twinkle, between(260, 360));
    };
    new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      run();
    }).observe(host);
    document.addEventListener('visibilitychange', run);
    return {
      light(on) {
        lit = on;
        if (on && seen) for (let i = 0; i < 5; i += 1) setTimeout(() => spark(i < 3), i * 55);
        run();
      },
    };
  };
  const { animateCompanion, companionDrawing } = globalThis.slidesCompanion;
  for (const host of document.querySelectorAll('.peek')) animateCompanion(host, companionDrawing);

  // The bar floats down into place once the hero's name has gone up under it, as the App
  // Store's bar fills once the app's icon has, and stays, rather than coming and going with the
  // buttons on the page. It floats a little below the window's top, so "under it" is down to its
  // foot.
  const nav = document.querySelector('.nav');
  const name = document.querySelector('.hero .eyebrow');
  const foot = () => nav.offsetTop + nav.offsetHeight;
  const dock = new IntersectionObserver(
    ([entry]) => {
      const gone = !entry.isIntersecting && entry.boundingClientRect.top < foot();
      nav.classList.toggle('docked', gone);
    },
    { rootMargin: `-${foot()}px 0px 0px 0px` },
  );
  dock.observe(name);

  // Over the picture tool's black tile, the bar turns to dark glass, from when the tile reaches
  // the middle of the bar until it leaves it.
  const darks = document.querySelectorAll('.tile-dark');
  let shading = 0;
  const shade = () => {
    shading = 0;
    const middle = nav.offsetTop + nav.offsetHeight / 2;
    const over = [...darks].some((dark) => {
      const { top, bottom } = dark.getBoundingClientRect();
      return top < middle && bottom > middle;
    });
    nav.classList.toggle('dark', over);
  };
  shade();
  addEventListener(
    'scroll',
    () => {
      if (!shading) shading = requestAnimationFrame(shade);
    },
    { passive: true },
  );

  // The film plays with its sound, as asked for, and shows its poster again when it ends.
  const stage = document.querySelector('.stage');
  const screen = stage.querySelector('.screen');
  const video = screen.querySelector('video');
  const play = () => {
    stage.classList.add('playing');
    video.controls = true;
    video.play();
    video.focus({ preventScroll: true });
  };
  for (const button of document.querySelectorAll('[data-play]'))
    button.addEventListener('click', play);
  // The poster plays it too; once playing, clicks are the video's own controls'.
  video.addEventListener('click', () => {
    if (!stage.classList.contains('playing')) play();
  });
  video.addEventListener('ended', () => {
    stage.classList.remove('playing');
    video.controls = false;
    video.load();
  });

  // Only what's below the fold waits to rise in, so nothing on screen blinks out as the page loads,
  // and without this script everything simply shows.
  if (!still.matches && 'IntersectionObserver' in window) {
    const arrive = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          target.classList.replace('waiting', 'arrived');
          arrive.unobserve(target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    for (const element of document.querySelectorAll('[data-reveal]')) {
      if (element.getBoundingClientRect().top < innerHeight) continue;
      element.classList.add('waiting');
      arrive.observe(element);
    }
  }

  // The steps to start fill as the page scrolls through them and empty as it scrolls back: their
  // rules one after another, from when the list's top is a tenth up the window until its foot is
  // 35% up, then the highlight behind "superpowers". Tied to the scroll rather than played once,
  // so the reader sets the pace and can go back over it. What's drawn follows the scroll through
  // a short exponential ease, about 90ms, frame-rate independent: a mouse wheel's jumps glide,
  // and a trackpad's scroll still feels attached.
  const steps = document.querySelector('.steps ol');
  if (!still.matches && steps) {
    const rules = [...steps.children];
    const mark = steps.querySelector('mark');
    const sparkles = sparkler(mark);
    mark.classList.add('live');
    const share = 0.8 / rules.length;
    const part = (value) => Math.min(1, Math.max(0, value));
    let target = 0;
    let shown = 0;
    let frame = 0;
    let then = 0;
    const draw = () => {
      rules.forEach((rule, i) =>
        rule.style.setProperty('--fill', part((shown - i * share) / share)),
      );
      const glow = part((shown - 0.8) / 0.2);
      mark.style.setProperty('--glow', glow);
      const lit = glow > 0.99;
      if (lit === mark.classList.contains('lit')) return;
      mark.classList.toggle('lit', lit);
      sparkles.light(lit);
    };
    const tick = (now) => {
      const step = then ? Math.min(now - then, 64) : 16;
      then = now;
      shown += (target - shown) * (1 - Math.exp(-step / 90));
      if (Math.abs(target - shown) < 0.0005) shown = target;
      draw();
      frame = shown === target ? 0 : requestAnimationFrame(tick);
      if (!frame) then = 0;
    };
    const measure = () => {
      const { top, height } = steps.getBoundingClientRect();
      const start = innerHeight * 0.9;
      const end = innerHeight * 0.65 - height;
      target = part((start - top) / (start - end));
      if (!frame && target !== shown) frame = requestAnimationFrame(tick);
    };
    measure();
    shown = target;
    draw();
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
  }

  // Settings' illustrations loop; with reduced motion, each holds the frame it's drawn to be seen at.
  const hold = () => {
    for (const svg of document.querySelectorAll('.art svg[data-still]')) {
      if (!still.matches) {
        svg.unpauseAnimations();
        continue;
      }
      svg.pauseAnimations();
      svg.setCurrentTime(Number(svg.dataset.still));
    }
  };
  hold();
  still.addEventListener('change', hold);
}
