// What moves on the website: the companion, as he moves in Slides' toolbar (companion-motion.js),
// his eyes on the pointer; the film, which plays on the screen he peeks over; things below the fold
// rising in as they scroll into view; the footer's words, with his eyes in them; and Settings'
// illustrations, which hold a still frame when the system asks for reduced motion.
{
  const still = matchMedia('(prefers-reduced-motion: reduce)');

  // The page is styled once style.css has applied and been drawn with: from then on, things may
  // transition (style.css holds them until then).
  const sheet = document.querySelector('link[rel="stylesheet"][href="style.css"]');
  const styled = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.add('styled')),
    );
  if (sheet?.sheet) styled();
  else (sheet ?? window).addEventListener('load', styled, { once: true });

  // CSS's cubic-bezier() timing functions, for what the script moves frame by frame.
  const bezier = (x1, y1, x2, y2) => {
    const at = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
    return (x) => {
      let low = 0;
      let high = 1;
      for (let i = 0; i < 20; i += 1) {
        const t = (low + high) / 2;
        if (at(t, x1, x2) < x) low = t;
        else high = t;
      }
      return at((low + high) / 2, y1, y2);
    };
  };

  // Sparkles around a word, for as long as it's lit: a burst as it lights, then one every so
  // often, never in step, each at a new place around the word, of its own size, turning as it
  // grows in and shrinks away. Most are small, a few large, as glints are. They, and the
  // highlight's sheen, rest while the word is off screen or the tab is hidden, and the burst
  // plays only when it lights, not when they wake.
  //
  // They're shapes in one SVG laid over the word's list item, moved frame by frame. As small SVGs
  // of their own inside the word, each animated with the Web Animations API, iOS's WebKit gave
  // each a compositing layer and lost track of where an inline element's layers go: it drew them
  // elsewhere on the page, or not at all, while it reported them in place.
  const sparkler = (host) => {
    const NS = 'http://www.w3.org/2000/svg';
    const shape = host.querySelector('.sparkle path').getAttribute('d');
    const yellows = ['#f4b400', '#f9ab00', '#fbbc04'];
    const between = (low, high) => low + Math.random() * (high - low);
    // Quick to grow, slower to fade: a glint, not a blink.
    const grow = bezier(0.2, 0.8, 0.3, 1);
    const fade = bezier(0.6, 0, 0.8, 0.4);
    const spin = bezier(0.3, 0.2, 0.4, 1);
    const box = host.closest('li');
    const layer = document.createElementNS(NS, 'svg');
    layer.setAttribute('class', 'sparks');
    layer.setAttribute('aria-hidden', 'true');
    box.append(layer);
    const sparks = [];
    let along = Math.random();
    let lit = false;
    let seen = false;
    let timer = 0;
    let frame = 0;
    const draw = (now) => {
      for (const spark of [...sparks]) {
        const t = Math.min(1, (now - spark.born) / spark.life);
        const scale = t < 0.35 ? grow(t / 0.35) : 1 - fade((t - 0.35) / 0.65);
        const angle = spark.turn * spin(t);
        spark.node.setAttribute(
          'transform',
          `translate(${spark.x} ${spark.y}) rotate(${angle}) scale(${(scale * spark.size) / 160}) translate(-80 -80)`,
        );
        if (t < 1) continue;
        spark.node.remove();
        sparks.splice(sparks.indexOf(spark), 1);
      }
      frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };
    const spark = (large) => {
      if (sparks.length > 6) return;
      // Where the word is in its list item, which may have moved since the last one.
      const word = host.getBoundingClientRect();
      const around = box.getBoundingClientRect();
      const { width, height } = word;
      const size = large ? between(13, 19) : 6 + Math.random() ** 1.8 * 12;
      // The other words around it, line by line, to keep clear of: a spark over "a few" on the
      // line above read as a smudge on the words, not a glint off this one.
      const words = [];
      const range = document.createRange();
      const texts = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      while (texts.nextNode()) {
        if (host.contains(texts.currentNode) || !texts.currentNode.data.trim()) continue;
        range.selectNodeContents(texts.currentNode);
        words.push(...[...range.getClientRects()].filter((r) => r.width));
      }
      // All the way around the word, never over it: along its top, past its end, under it and
      // before it, each a golden ratio's step on from the last, a little either way, so they
      // spread evenly rather than bunch. Its ends are short, so they count for a little more.
      // A place over other words is passed over for the next step on; with none clear in a few
      // tries, there's no spark this time.
      const end = Math.max(height, 28);
      const edges = [width, end, width, end];
      let x = 0;
      let y = 0;
      let clear = false;
      for (let tries = 0; tries < 6 && !clear; tries += 1) {
        along = (along + 0.618 + between(-0.08, 0.08) + 1) % 1;
        let at = along * edges.reduce((sum, edge) => sum + edge, 0);
        let edge = 0;
        while (at > edges[edge]) at -= edges[edge++];
        const share = at / edges[edge];
        // Clear of the letters by at least a few pixels, whatever its size.
        const gap = size / 2 + between(3, 10);
        const [dx, dy] = [
          [share * width, -gap],
          [width + gap, share * height],
          [(1 - share) * width, height + gap],
          [-gap, (1 - share) * height],
        ][edge];
        const [cx, cy] = [word.left + dx, word.top + dy];
        // A sparkle turning reaches past its own size: half again, and a little air.
        const reach = size * 0.75 + 3;
        clear = !words.some(
          (r) =>
            cx + reach > r.left &&
            cx - reach < r.right &&
            cy + reach > r.top &&
            cy - reach < r.bottom,
        );
        [x, y] = [cx - around.left, cy - around.top];
      }
      if (!clear) return;
      const node = document.createElementNS(NS, 'path');
      node.setAttribute('d', shape);
      node.setAttribute('fill', yellows[Math.floor(Math.random() * yellows.length)]);
      node.setAttribute('transform', `translate(${x} ${y}) scale(0)`);
      layer.append(node);
      sparks.push({
        node,
        x,
        y,
        size,
        born: performance.now(),
        life: between(650, 1000),
        turn: (Math.random() < 0.5 ? -1 : 1) * between(90, 180),
      });
      if (!frame) frame = requestAnimationFrame(draw);
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
      // A smaller burst, when the lit word is pointed at or tapped.
      burst() {
        if (lit && seen && !document.hidden)
          for (let i = 0; i < 4; i += 1) setTimeout(() => spark(i < 2), i * 60);
      },
    };
  };
  // The companions: each moves as he does in Slides' toolbar (companion-motion.js). Here the page
  // also directs them. Each rises, on a spring, from the edge he peeks over: the hero's from
  // behind the film as the page opens, if its edge is in view then, reading the headline and
  // glancing at Add to Chrome before looking back out at you; otherwise (on a phone, where it's at
  // the screen's foot or below; the last call's, always) with the scroll, as that edge comes up
  // the window. Each blinks once up. The icon's companion, in the bar and the hero, is one of them
  // too, minus the rise. All follow the mouse (companion-motion.js), and a finger: where it
  // touches, and as it moves until the page takes it for a scroll, as the browser then stops
  // telling. With nobody pointing for a few seconds (always, on a phone, between taps), each looks
  // about now and then, coming back to you in between, rather than staring at the last place a
  // pointer was.
  const { animateCompanion, companionDrawing } = globalThis.slidesCompanion;
  const companions = [...document.querySelectorAll('.peek, .icon')].map((host) => ({
    host,
    him: animateCompanion(host, companionDrawing),
    seen: false,
  }));
  let pointed = -Infinity;
  const touched = (event) => {
    pointed = performance.now();
    if (event.pointerType === 'mouse') return;
    for (const { him } of companions) him.look({ x: event.clientX, y: event.clientY });
  };
  addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse') pointed = performance.now();
    else touched(event);
  });
  addEventListener('pointerdown', touched);
  const idle = () => performance.now() - pointed > 4000;
  const centre = (element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    return { x: left + width / 2, y: top + height / 2 };
  };
  const watching = new IntersectionObserver((entries) => {
    for (const entry of entries)
      companions.find(({ host }) => host === entry.target).seen = entry.isIntersecting;
  });
  for (const { host } of companions) watching.observe(host);
  if (!still.matches) {
    const headline = document.querySelector('.hero h1');
    const button = document.querySelector('.hero .button');
    for (const { host, him } of companions) {
      if (!host.matches('.peek')) continue;
      const panel = host.closest('.panel');
      const stage = host.closest('.stage');
      const edge = () =>
        panel
          ? panel.getBoundingClientRect().bottom
          : stage.querySelector('.screen').getBoundingClientRect().top;
      // Any of the edge he peeks over on screen as the page opens, at its foot included, and he
      // rises there and then, all the way: brought up by the scroll from there, a page that
      // opened with the edge near the screen's foot left him a fifth of the way through his
      // rise, a lump of fur with his eyes behind the film, until it moved.
      const inView = () => edge() < innerHeight;
      // The hero's is already rising as the page opens (style.css), unless this runs late.
      const opening = stage && host.getAnimations()[0];
      if (opening && inView() && (opening.currentTime ?? 0) < 350) {
        if (!headline || !button) continue;
        const glance = (at, then) => setTimeout(() => idle() && then(), at);
        glance(1300, () => him.look(centre(headline)));
        glance(2100, () => him.look(centre(button)));
        glance(3000, () => him.look(null));
        continue;
      }
      if (inView()) continue;
      // All below the screen as the page opens, he comes up with the scroll instead, as the edge
      // he peeks over rises from the window's foot to a fifth of the way up it, following it on
      // his spring: he trails a quick scroll a little and bounces when it stops, and ducks back
      // down once it's gone back below the window. Tied to the scroll, as the steps are, so he's
      // seen rising however fast the page moves: timed, a flick carried him off the top before he
      // was up, and waiting for the page to slow, a flick never did with him in view. A scroll
      // that stops part way through his rise doesn't leave him half up, eyes behind the edge: he
      // finishes it.
      host.style.animation = 'none';
      const depth = panel ? '100%' : 'var(--peek) * 0.62';
      const goal = () => Math.min(1, Math.max(0, (innerHeight - edge()) / (innerHeight * 0.2)));
      let x = goal();
      let v = 0;
      let last = 0;
      let frame = 0;
      let blinked = x >= 1;
      let committed = false;
      let stopping = 0;
      const place = () => (host.style.translate = `0 calc(${depth} * ${(1 - x).toFixed(4)})`);
      place();
      // His spring: damped as style.css's --spring, a little quicker, so he keeps up with a flick.
      // A quarter of a frame at a time, steady at any rate.
      const [OMEGA, ZETA] = [14, 0.6];
      const step = (now) => {
        const dt = Math.min(0.064, (now - (last || now - 16)) / 1000) / 4;
        last = now;
        const reached = goal();
        if (!reached) committed = false;
        const target = committed ? 1 : reached;
        for (let k = 0; k < 4; k += 1) {
          v += (-(OMEGA ** 2) * (x - target) - 2 * ZETA * OMEGA * v) * dt;
          x += v * dt;
        }
        if (!blinked && x > 0.98) {
          blinked = true;
          setTimeout(() => him.blink(), 300);
        }
        if (Math.abs(x - target) < 0.001 && Math.abs(v) < 0.01) {
          x = target;
          frame = last = 0;
        } else frame = requestAnimationFrame(step);
        place();
      };
      const moved = () => {
        frame ||= requestAnimationFrame(step);
        clearTimeout(stopping);
        stopping = setTimeout(() => {
          if (goal() > 0) committed = true;
          frame ||= requestAnimationFrame(step);
        }, 150);
      };
      addEventListener('scroll', moved, { passive: true });
      // The page can move under him without a scroll: the hero settles once its font arrives,
      // bringing the film's edge up into view, and he should come up then too.
      addEventListener('resize', moved);
      document.fonts.ready.then(moved);
    }
    const wander = () => {
      for (const { host, him, seen } of companions) {
        if (!seen || !idle() || document.hidden) continue;
        if (Math.random() < 0.45) {
          him.look(null);
          continue;
        }
        const angle = Math.random() * Math.PI * 2;
        const { x, y } = centre(host);
        him.look({ x: x + Math.cos(angle) * 320, y: y + Math.sin(angle) * 240 });
      }
      setTimeout(wander, 2400 + Math.random() * 2600);
    };
    setTimeout(wander, 4200);
  }

  // The bar appears once the hero's Add to Chrome has gone up under it, as the App Store's bar
  // takes the Get button once the app's own has, and stays, rather than coming and going with the
  // buttons further down the page. It floats a little below the window's top, so "under it" is
  // down to its foot. It leaves only once the button is back a little way below that line, so a
  // scroll that stops on it, or a trackpad's settle, can't flicker it in and out. Opened already
  // past the hero, the page has it in place, without the transition. Pages whose hero doesn't hold
  // the icon, name and button (What's new, the privacy policy) have it in place from the start.
  const nav = document.querySelector('.nav');
  if (!nav.classList.contains('docked')) {
    const button = document.querySelector('.hero .actions .button');
    const SLACK = 24;
    let first = true;
    const settle = (docked) => {
      if (first && docked) {
        nav.classList.add('instant');
        requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('instant')));
      }
      first = false;
      nav.classList.toggle('docked', docked);
    };
    // The bar's foot is measured again whenever it may have moved: it's smaller on a phone, and
    // Safari can run this script before style.css applies, when the bar is an unstyled header.
    let watchedFoot = -1;
    let watchers = [];
    const watch = () => {
      const foot = nav.offsetTop + nav.offsetHeight;
      if (foot === watchedFoot) return;
      watchedFoot = foot;
      for (const watcher of watchers) watcher.disconnect();
      watchers = [
        // In once the button is wholly above the bar's foot...
        new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting && entry.boundingClientRect.top < foot) settle(true);
            else first = false;
          },
          { rootMargin: `-${foot}px 0px 0px 0px` },
        ),
        // ...and out once any of it is back more than SLACK below it.
        new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) settle(false);
          },
          { rootMargin: `-${foot + SLACK}px 0px 0px 0px` },
        ),
      ];
      for (const watcher of watchers) watcher.observe(button);
    };
    watch();
    addEventListener('load', watch);
    addEventListener('resize', watch);
  } else {
    // Where it's in place from the start, it rests flat on the page at the top, with nothing under
    // it yet, and lifts off over the first 48px of scroll, before what's below reaches it: its
    // glass, rim and shadow earned as the page starts to pass beneath, as Material's top app bar
    // and iOS's bars do. Tied to the scroll rather than played, so it's as far up as the page is.
    const LIFT = 48;
    let frame = 0;
    const lift = () => {
      frame = 0;
      nav.style.setProperty('--lift', Math.min(1, Math.max(0, scrollY / LIFT)).toFixed(3));
    };
    lift();
    addEventListener(
      'scroll',
      () => {
        frame ||= requestAnimationFrame(lift);
      },
      { passive: true },
    );
  }

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

  // The film plays with its sound, as asked for, and shows its poster again when it ends. Only the
  // home page has it.
  const stage = document.querySelector('.stage');
  if (stage) {
    const video = stage.querySelector('.screen video');
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
  }

  // A phone or a tablet can't add extensions, so there each Add to Chrome sends the store's link to
  // the computer instead: the device's own share sheet (AirDrop, Messages, Mail, Notes...), or,
  // without one, the link copied. Nothing goes through a server. Without this script the button
  // stays a link to the store.
  if (matchMedia('(hover: none) and (pointer: coarse)').matches) {
    const say = (button, words) => {
      button.innerHTML = button.classList.contains('button-small')
        ? `<span class="send-long">${words}</span><span class="send-short">Share link</span>`
        : words;
    };
    for (const button of document.querySelectorAll('a.button[href*="chromewebstore.google.com"]')) {
      say(button, 'Send to my computer');
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        const url = button.href;
        try {
          if (!navigator.share) throw new Error('No share sheet');
          await navigator.share({
            title: 'Slides Companion',
            text: 'Slides Companion, free presenter tools for Google Slides. Add it to Chrome on your computer:',
            url,
          });
        } catch (error) {
          // Closing the share sheet isn't a failure.
          if (error.name === 'AbortError') return;
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            location.href = url;
            return;
          }
          button.style.minWidth = `${button.offsetWidth}px`;
          button.textContent = 'Link copied';
          setTimeout(() => {
            say(button, 'Send to my computer');
            button.style.minWidth = '';
          }, 2000);
        }
      });
    }
  }

  // Only what's below the fold waits to rise in, so nothing on screen blinks out as the page loads,
  // and without this script everything simply shows.
  if (!still.matches && 'IntersectionObserver' in window) {
    // What comes into view together arrives a beat apart, top to bottom and left to right, so a
    // row of two reads as two, not as one slab.
    const arrive = new IntersectionObserver(
      (entries) => {
        const coming = entries
          .filter((entry) => entry.isIntersecting)
          .map(({ target, boundingClientRect: box }) => ({ target, box }))
          .sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left);
        coming.forEach(({ target }, i) => {
          target.style.setProperty('--delay', `${Math.min(i, 3) * 90}ms`);
          target.classList.replace('waiting', 'arrived');
          arrive.unobserve(target);
        });
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    for (const element of document.querySelectorAll('[data-reveal]')) {
      if (element.getBoundingClientRect().top < innerHeight) continue;
      element.classList.add('waiting');
      arrive.observe(element);
    }
  }

  // What's new's tabs: one raised thumb that slides to the tab you pick, and the tab's page fading
  // up as it swaps in (style.css). Out now unless the address is #next, as the stylesheet reads it.
  const tabs = document.querySelector('.tabs');
  if (tabs) {
    const thumb = document.createElement('span');
    thumb.className = 'tabs-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    tabs.prepend(thumb);
    tabs.classList.add('sliding');
    const place = (glide) => {
      const on = tabs.querySelector(location.hash === '#next' ? '[href="#next"]' : '[href="#now"]');
      if (!glide) thumb.style.transition = 'none';
      thumb.style.translate = `${on.offsetLeft}px 0`;
      thumb.style.width = `${on.offsetWidth}px`;
      if (!glide) {
        thumb.getBoundingClientRect();
        thumb.style.transition = '';
      }
    };
    place(false);
    new ResizeObserver(() => place(false)).observe(tabs);
    // Marked as a tab is picked, not before, so the page doesn't fade in as it opens.
    // The tab picked opens at once, as the link is followed; going back or forward, as the address
    // changes.
    const open = (hash) =>
      (document.documentElement.dataset.tab = hash === '#next' ? 'next' : 'now');
    tabs.addEventListener('click', (event) => {
      // A click between the tabs, or on the thumb, picks none, and leaves the address as it is.
      const link = event.target.closest('a');
      if (!link) return;
      document.body.classList.add('switching');
      open(link.hash);
    });
    addEventListener('hashchange', () => {
      open(location.hash);
      place(true);
    });
  }

  // iOS's Safari shows :active, the buttons' press, only on a page that listens for touches.
  addEventListener('touchstart', () => {}, { passive: true });

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
    let burstAt = 0;
    const burst = () => {
      if (performance.now() - burstAt < 700) return;
      burstAt = performance.now();
      sparkles.burst();
    };
    mark.addEventListener('pointerenter', (event) => event.pointerType === 'mouse' && burst());
    mark.addEventListener('pointerdown', burst);
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
      // Lit once the reader has scrolled to the end of it and the stroke is mostly drawn, its
      // last stretch finishing under the swell: waiting for the eased stroke to be whole, it lit
      // a beat behind the scroll, a third of the way up the window at a steady pace and above it
      // at a quick one, its payoff unseen.
      const lit = target >= 1 && glow > 0.6;
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

  // The footer's words, "You're in good company.": sized so their letters run edge to edge, the
  // small print placed beside them on a laptop, and the o's of "good" his eyes, looking where the
  // pointer is, or at the link in focus, and blinking now and then.
  {
    const footer = document.querySelector('.footer');
    const phrase = footer.querySelector('.footer-phrase');
    const lines = [...phrase.querySelectorAll('.footer-line')];
    const seeing = lines[1];
    const os = [...seeing.querySelectorAll('.footer-o')];
    const eyes = [...seeing.querySelectorAll('.footer-eye')];
    const pupils = eyes.map((eye) => eye.querySelector('.footer-pupil'));
    const lids = eyes.map((eye) => eye.querySelector('.footer-lid'));
    const links = footer.querySelector('.footer-links');
    const legal = footer.querySelector('.footer-legal');
    const wide = matchMedia('(min-width: 1068px)');
    // Where each row's letters start after its box's left edge and end before its right, and how
    // far the tails of g, p and y reach under the baseline, in em, measured on screen in Chromium
    // and WebKit. The left ones are also in the stylesheet, which moves each row by them.
    const INK = { left: [-0.0026, 0.0208], right: [0.0049, 0.0104], descent: 0.209 };
    let geometry = [];

    // How far a line is from where it rests, part way up or still waiting: measuring around it
    // rather than stopping it, so a layout (a font arriving, a resize) never interrupts the rise.
    // At rest a line sits at the top of its row's window, inside its padding, and the window
    // doesn't move.
    const lift = (line) => {
      const row = line.parentElement;
      const pad = parseFloat(getComputedStyle(row).paddingTop) || 0;
      return line.getBoundingClientRect().top - (row.getBoundingClientRect().top + pad);
    };
    const layout = () => {
      // The letters, not their boxes, from one edge to the other: the font draws its letters for
      // their size (optical sizing), wider when smaller, so measure and correct until they fit.
      const width = phrase.clientWidth;
      let size = 100;
      for (let i = 0; i < 5; i += 1) {
        phrase.style.fontSize = `${size}px`;
        const ink = Math.max(
          ...lines.map(
            (line, r) => line.getBoundingClientRect().width - (INK.left[r] + INK.right[r]) * size,
          ),
        );
        size *= width / ink;
      }
      phrase.style.fontSize = `${size}px`;
      phrase.style.height = '';
      const box = phrase.getBoundingClientRect();
      const [first, last] = lines.map(
        (line) =>
          line.querySelector('.footer-base').getBoundingClientRect().top - lift(line) - box.top,
      );
      const own = seeing.getBoundingClientRect();
      const o = os.map((letter) => letter.getBoundingClientRect());
      // Sitting on the page's foot, the tails of g, p and y the last thing on it (on a phone, a
      // gutter above it, style.css).
      phrase.style.height = `${last + INK.descent * size}px`;

      // His eyes, in the o's as the page lays them out, placed in their line so they rise with
      // it. The o's ink is about 0.93 of its advance, round, its stroke about 0.094 of the size;
      // measuring the letter on a canvas gave it 8% too wide in Safari, and the eyes spilled out.
      // Round letters dip a little under the baseline, and the counter with them.
      const spacing = parseFloat(getComputedStyle(phrase).letterSpacing) || 0;
      const ink = (o[0].width - spacing) * 0.927;
      const inner = ink / 2 - size * 0.094;
      const pupil = inner * 0.9;
      phrase.style.setProperty('--pupil', `${pupil}px`);
      const baseline = last - (own.top - lift(seeing) - box.top);
      geometry = o.map((r, i) => {
        const x = r.left - own.left + (r.width - spacing) / 2;
        const y = baseline + size * 0.008 - ink / 2;
        // A little bigger than the counter: its edge hides under the letter's ink, so a closed lid
        // leaves no sliver of white.
        const window = inner + 2;
        Object.assign(eyes[i].style, {
          left: `${x - window}px`,
          top: `${y - window}px`,
          width: `${window * 2}px`,
          height: `${window * 2}px`,
        });
        return { x, y, travel: inner - pupil / 2 - inner * 0.1, at: geometry[i]?.at ?? [0, 0] };
      });

      // On a laptop, the small print in the room the first row leaves: under the links, as wide
      // as they are, its last line on the first row's baseline, by a mark at its end.
      if (wide.matches) {
        legal.style.width = `${links.getBoundingClientRect().width}px`;
        const mark =
          legal.querySelector('.footer-base').getBoundingClientRect().top -
          legal.getBoundingClientRect().top;
        legal.style.top = `${phrase.offsetTop + first - mark}px`;
      } else legal.style.width = legal.style.top = '';
      phrase.classList.add('placed');
    };

    // Where he looks: the pointer, or on a phone the last touch, as the companions above do; the
    // link in focus; or, with neither, now and then somewhere else, coming back to the page in
    // between. A touch's pointermove stops once it turns into a scroll, so where it started
    // counts too.
    let pointer = null;
    let focused = null;
    let glance = [0, 0];
    const look = (event) => (pointer = [event.clientX, event.clientY]);
    addEventListener('pointerdown', look, { passive: true });
    addEventListener('pointermove', look, { passive: true });
    footer.addEventListener('focusin', (event) => (focused = event.target.closest('a')));
    footer.addEventListener('focusout', () => (focused = null));
    setInterval(() => {
      const a = Math.random() * Math.PI * 2;
      glance = Math.random() < 0.4 ? [0, 0] : [Math.cos(a) * 300, Math.sin(a) * 300];
    }, 2200);

    // A blink, timed as on an animator's chart: shut in about five frames, held for one, and
    // opened slower, most of the way at once and then easing (a long half-open tail reads as
    // sleepy). One in eight is a double, the second starting before the eyes are open again. A
    // glance that swings a long way brings one, as animators hide a change of gaze in a blink.
    const BLINK = { close: 80, hold: 17, open: 180, double: 0.125 };
    const BLINK_EVERY = [2600, 7200];
    const GLANCE = { angle: 1.75, within: 400, chance: 0.7, rest: 1400 };
    let blinks = [];
    let lastBlink = -Infinity;
    const shut = (t) => {
      const { close, hold, open } = BLINK;
      if (t < 0 || t > close + hold + open) return 0;
      if (t < close) return (t / close) ** 2 * (3 - (2 * t) / close);
      if (t < close + hold) return 1;
      return (1 - (t - close - hold) / open) ** 3;
    };
    const blink = (now = performance.now()) => {
      if (still.matches || now - lastBlink < 200) return;
      lastBlink = now;
      blinks.push(now);
      if (Math.random() < BLINK.double)
        blinks.push(now + BLINK.close + BLINK.hold + BLINK.open * 0.45);
    };
    const blinkLater = () => {
      const [least, most] = BLINK_EVERY;
      setTimeout(
        () => {
          if (!document.hidden) blink();
          blinkLater();
        },
        least + Math.random() * (most - least),
      );
    };
    blinkLater();
    // The lids: the letter's ink around an opening that flattens from the whole counter into a
    // slit and back, the classic blink of a round eye, in the o's own geometry. The slit sits a
    // quarter of the way below the middle, the upper lid travelling further than the lower, as
    // ours do. Free-drawn lid curves looked lumpy in so plain a circle, and a lid sliding all the
    // way down left a heavy, sleepy bowl of white at the bottom of the o. Shut, a hairline of the
    // slit stays, so a closed eye reads as a line, not as the o filled in.
    //
    // Pressed (`joy`), they squeeze into happy arcs, as the companion's do: the opening's lower
    // edge rises past its middle into the upper's curve, leaving an arch of white, ^ ^. Drawn
    // with curves rather than arcs, so the two shapes can blend: a curve whose controls are at 4/3
    // of a height peaks at that height.
    const lidPath = (size, radius, closed, joy = 0) => {
      const c = size / 2;
      const rx = radius * 1.04;
      const ry = Math.max(rx * 0.05, rx * (1 - closed));
      const y = c + radius * 0.25 * closed;
      const box = `M0 0H${size}V${size}H0Z`;
      if (!joy) {
        const ends = `${(c - rx).toFixed(2)} ${y.toFixed(2)}`;
        const arc = `A${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 0 `;
        return `path(evenodd, "${box} M${ends} ${arc}${(c + rx).toFixed(2)} ${y.toFixed(2)} ${arc}${ends}Z")`;
      }
      const mix = (from, to) => from + (to - from) * joy;
      // Its ends drop and draw in, its curves lean in from them, as an arch's do, and the band
      // left between them thins to a third of the eye at its middle, pointed at its ends.
      const ends = mix(y, c + radius * 0.3);
      const top = mix(y - ry, c - radius * 0.5);
      const bottom = mix(y + ry, c - radius * 0.12);
      const half = mix(rx, radius * 0.84);
      const lean = half * mix(1, 0.5);
      const [x0, x1, k0, k1] = [c - half, c + half, c - lean, c + lean].map((v) => v.toFixed(2));
      const lift = (peak) => (ends + ((peak - ends) * 4) / 3).toFixed(2);
      const [e, t, b] = [ends.toFixed(2), lift(top), lift(bottom)];
      return `path(evenodd, "${box} M${x0} ${e} C${k0} ${t} ${k1} ${t} ${x1} ${e} C${k1} ${b} ${k0} ${b} ${x0} ${e}Z")`;
    };
    let joy = 0;
    let glad = false;
    let gladAt = 0;
    phrase.addEventListener('pointerdown', () => {
      glad = true;
      gladAt = performance.now();
    });
    // A quick tap still gets the whole smile: it lets go once he's had time to squeeze.
    const letGo = () => {
      if (!glad) return;
      setTimeout(() => (glad = false), Math.max(0, gladAt + 160 - performance.now()));
    };
    document.addEventListener('pointerup', letGo, { capture: true });
    document.addEventListener('pointercancel', letGo, { capture: true });
    let gaze = [];

    let frameId = 0;
    let then = 0;
    const draw = (now) => {
      const box = seeing.getBoundingClientRect();
      // Eased, frame-rate independent: a glance, not a snap.
      const step = then ? Math.min(now - then, 64) : 16;
      const ease = 1 - Math.exp(-step / 70);
      then = now;
      geometry.forEach((eye, i) => {
        let target;
        if (focused) {
          const r = focused.getBoundingClientRect();
          target = [
            r.left + r.width / 2 - box.left - eye.x,
            r.top + r.height / 2 - box.top - eye.y,
          ];
        } else if (pointer) target = [pointer[0] - box.left - eye.x, pointer[1] - box.top - eye.y];
        else target = glance;
        const d = Math.hypot(...target);
        const k = d ? (eye.travel * Math.min(1, d / 200)) / d : 0;
        eye.at = eye.at.map((v, j) => v + (target[j] * k - v) * ease);
        pupils[i].style.setProperty('--x', `${eye.at[0]}px`);
        pupils[i].style.setProperty('--y', `${eye.at[1]}px`);
        // A long swing of his gaze, from one side to the other, brings a blink.
        if (i === 0 && d > 40) {
          const angle = Math.atan2(target[1], target[0]);
          gaze = gaze.filter((g) => now - g.t <= GLANCE.within);
          const swing = Math.max(
            0,
            ...gaze.map((g) => Math.abs(Math.atan2(Math.sin(angle - g.a), Math.cos(angle - g.a)))),
          );
          if (swing > GLANCE.angle && now - lastBlink > GLANCE.rest) {
            gaze = [];
            if (Math.random() < GLANCE.chance) blink(now);
          }
          gaze.push({ t: now, a: angle });
        }
      });
      // The lids, while a blink is under way. The pupils slip behind them as they close, so the
      // slit stays one clean line.
      blinks = blinks.filter((start) => now - start <= BLINK.close + BLINK.hold + BLINK.open);
      const closed = Math.max(0, ...blinks.map((start) => shut(now - start)));
      // The smile comes on at once and lets go a little slower.
      const target = glad ? 1 : 0;
      joy = still.matches
        ? target
        : joy + (target - joy) * (1 - Math.exp(-step / (glad ? 35 : 110)));
      if (joy < 0.002) joy = 0;
      const hidden = Math.max(closed, joy);
      for (const pupil of pupils)
        pupil.style.opacity = hidden > 0.7 ? String(Math.max(0, 1 - (hidden - 0.7) / 0.3)) : '';
      lids.forEach((lid, i) => {
        if (!closed && !joy) {
          lid.style.visibility = 'hidden';
          return;
        }
        const size = eyes[i].offsetWidth;
        lid.style.clipPath = lidPath(size, size / 2 - 2, closed, joy);
        lid.style.visibility = 'visible';
      });
      frameId = requestAnimationFrame(draw);
    };

    // The first time the words are seen, they rise into place, and he blinks as the second line
    // settles; with reduced motion they fade in. Played once. His eyes only move while the words
    // are on screen. Unrisen, not .waiting: that's the page's own rising in, which hid the whole
    // phrase 24px low, and jumped it up as the words began to rise.
    phrase.classList.add('unrisen');
    new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frameId);
      then = 0;
      if (entry.isIntersecting) frameId = requestAnimationFrame(draw);
    }).observe(phrase);
    // They rise once the middle of the second row's letters, his eyes' row, is above the window's
    // foot, so both rows are seen to rise: from when a third of the phrase showed, on a laptop
    // "good company." was still partly below the window as it rose, and on a phone at its very
    // foot. Measured, not observed: the row's window reaches below the letters' tails, so how
    // much of it shows says little.
    const mark = seeing.querySelector('.footer-base');
    let riseFrame = 0;
    const rise = () => {
      riseFrame ||= requestAnimationFrame(() => {
        riseFrame = 0;
        const size = parseFloat(phrase.style.fontSize);
        const middle = mark.getBoundingClientRect().top - lift(seeing) - 0.25 * size;
        if (!phrase.classList.contains('unrisen') || !(middle < innerHeight)) return;
        removeEventListener('scroll', rise);
        phrase.classList.remove('unrisen');
        setTimeout(() => blink(), 1000);
      });
    };
    addEventListener('scroll', rise, { passive: true });

    // Fitted again whenever the words' room changes width, and once fonts have loaded. Safari can
    // run this script before style.css applies, when the words are a plain paragraph wider than
    // the page's frame and the font isn't asked for yet, so there's nothing to wait for: fitted
    // then, and only then, they stayed half as big again as the page. And it fires no
    // loadingdone, so a fit made while fonts load waits for them to be ready, and fits again.
    let fittedTo = 0;
    let waitingForFonts = false;
    const fit = () => {
      layout();
      rise();
      if (document.fonts.status !== 'loading' || waitingForFonts) return;
      waitingForFonts = true;
      document.fonts.ready.then(() => {
        waitingForFonts = false;
        fit();
      });
    };
    new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === fittedTo) return;
      fittedTo = entry.contentRect.width;
      fit();
    }).observe(phrase);
    document.fonts.addEventListener('loadingdone', fit);
    addEventListener('load', fit);
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
