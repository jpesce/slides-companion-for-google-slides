// CHANGELOG.md, read for the website's What's new page (scripts/build-site.mjs): every version once,
// newest first. It shows what GitHub shows: each version's section is its GitHub release's notes
// (make release), and a version shows once its release's tag exists, not when its heading is first
// dated, which happens before the tests, the tag and the release. While the code has a version that
// isn't released yet, the page has two tabs: Out now, the default, and Coming next (#next), that
// version set as the latest is, with how to install it from the code.
//
// A section is "## v1.2.3 - YYYY-MM-DD" (or "- Unreleased"), a first paragraph in bold as the
// version's title, paragraphs, and "- " items, a "**Label:**" at the start naming a feature.

import { blocks, inline } from './markdown.mjs';

const REPO = 'https://github.com/jpesce/slides-companion-for-google-slides';
// Trying a version before its release: the code on main, loaded as an unpacked extension.
const CODE_ZIP = `${REPO}/archive/refs/heads/main.zip`;

// ---- Reading it ----

// A version's heading: "## v1.2.3 - 2026-11-20", or "## v1.2.3 - Unreleased" until it's dated.
// The release steps (scripts/release.mjs) read the changelog with sections() too, and refuse to
// release a version under any other heading: when each read it its own way, a heading only the
// release steps accepted ("## v1.2.3 – 2026-11-20", with an en dash) would have made a GitHub
// release that What's new never showed, its tag there and its section skipped.
const HEADING = /^## v(\d+\.\d+\.\d+)\s*(?:-\s*(.*))?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Every version's section, in the changelog's order: its number, its heading as written, whether
// that's a heading What's new can read (`readable`), its date once it has one, and its body, up to
// the next "## ". A "## v1.2.3" in any other form is still a section, so the release steps can say
// what's wrong with it.
export function sections(text) {
  const out = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (!line.startsWith('## ')) {
      current?.lines.push(line);
      continue;
    }
    const version = /^## v(\d+\.\d+\.\d+)(?=\s|$)/.exec(line);
    const heading = HEADING.exec(line);
    const after = heading?.[2]?.trim() ?? '';
    current = version
      ? {
          number: version[1],
          heading: line,
          readable: Boolean(heading),
          date: heading && DATE.test(after) ? after : null,
          lines: [],
        }
      : null;
    if (current) out.push(current);
  }
  return out.map(({ lines, ...section }) => ({ ...section, body: lines.join('\n').trim() }));
}

// Every version What's new can show, newest first.
export function versions(text) {
  return sections(text)
    .filter((section) => section.readable)
    .map(({ number, date, body: markdown }) => ({ number, date, ...body(markdown) }))
    .sort((a, b) => newer(b.number, a.number));
}

const newer = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

function body(markdown) {
  const all = blocks(markdown);
  const paragraphs = all.filter((block) => block.type === 'paragraph').map(({ text }) => text);
  const items = all.filter((block) => block.type === 'list').flatMap(({ items }) => items);
  const bold = /^\*\*([^*]+)\*\*$/.exec(paragraphs[0] ?? '');
  return {
    title: bold ? bold[1] : null,
    intro: bold ? paragraphs.slice(1) : paragraphs,
    changes: items.filter(Boolean).map((item) => {
      const named = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(item);
      return named ? { label: named[1], text: named[2] } : { label: null, text: item };
    }),
  };
}

// ---- Writing it as HTML ----

// After its label, an item's words start a sentence of their own.
const sentence = (text) => text.replace(/^[a-z]/, (letter) => letter.toUpperCase());

const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
export const day = (date) => DAY.format(new Date(`${date}T00:00:00Z`));
// A version tagged while its heading still says Unreleased has no date to show.
const time = ({ date }) => (date ? `<time datetime="${date}">${day(date)}</time>` : '');
// As its tag and its GitHub release name it.
const anchor = ({ number }) => `v${number}`;
const titled = ({ number, title }) => inline(title ?? `Version ${number}`);
const github = (version) => `${REPO}/releases/tag/${anchor(version)}`;

// A version's changes as a list, each named one with its name in bold, as GitHub's release has them.
const list = (changes) =>
  changes.length
    ? `<ul>${changes
        .map(({ label, text }) =>
          label
            ? `<li><strong>${inline(label)}:</strong> ${inline(text)}</li>`
            : `<li>${inline(text)}</li>`,
        )
        .join('')}</ul>`
    : '';

// A version's changes on one grey surface: the named ones each beside its name, the rest together
// under "Also".
function changeRows(changes) {
  const named = changes.filter((change) => change.label);
  const rest = changes.filter((change) => !change.label);
  const row = (label, content) =>
    `<div class="change">${label ? `<h3>${inline(label)}</h3>` : ''}${content}</div>`;
  const rows = named.length
    ? [
        ...named.map(({ label, text }) => row(label, `<p>${inline(sentence(text))}</p>`)),
        ...(rest.length === 1 ? [row('Also', `<p>${inline(sentence(rest[0].text))}</p>`)] : []),
        ...(rest.length > 1
          ? [row('Also', `<ul>${rest.map(({ text }) => `<li>${inline(text)}</li>`).join('')}</ul>`)]
          : []),
      ]
    : rest.map(
        ({ text }) => `<div class="change change-plain"><p>${inline(sentence(text))}</p></div>`,
      );
  return rows.length ? `<div class="changes" data-reveal>${rows.join('')}</div>` : '';
}

// A version as a page's hero: what it is above its title, its intro under it, then `after`.
const hero = (version, eyebrow, after) => `<p class="eyebrow">${eyebrow}</p>
            <h1>${titled(version)}</h1>
            ${version.intro.map((paragraph) => `<p class="lead">${inline(paragraph)}</p>`).join('')}
            ${after}`;

// The latest release: when it came out, and its GitHub release.
function latest(version) {
  if (!version)
    return {
      latest: '<p class="eyebrow">What’s new</p><h1>Coming soon</h1>',
      'latest changes': '',
    };
  const { number, title, date } = version;
  return {
    latest: `<div id="${anchor(version)}">
            ${hero(
              version,
              title ? `What’s new in version ${number}` : 'What’s new',
              `<p class="fine release-date">Released${date ? ` ${time(version)}` : ''} · <a href="${github(version)}">On GitHub</a></p>`,
            )}
          </div>`,
    'latest changes': changeRows(version.changes),
  };
}

// What the code has that GitHub hasn't released, set as the latest release is, with how to get it
// before the store has it. Any older one still to come follows it, smaller.
function next(versions) {
  if (!versions.length) return { next: '', 'next changes': '' };
  const [newest, ...older] = versions;
  return {
    next: hero(
      newest,
      `Coming next: version ${newest.number}`,
      `<p class="fine release-date">Coming soon to the Chrome Web Store. Want it today? <a href="${CODE_ZIP}">Download the code</a>, then turn on Developer mode in chrome://extensions, click Load unpacked and choose its extension folder.</p>`,
    ),
    'next changes':
      changeRows(newest.changes) +
      older
        .map(
          (version) => `<div class="also-next notes">
              <p class="next-number">Version ${version.number}</p>
              <h3>${titled(version)}</h3>
              ${version.intro.map((paragraph) => `<p>${inline(paragraph)}</p>`).join('')}
              ${list(version.changes)}
            </div>`,
        )
        .join(''),
  };
}

// Out now or Coming next, while there's something coming: links to the top of the page, which the
// stylesheet reads (:target), so they work without a script and #next can be shared.
const tabs = (pending) =>
  pending
    ? `<span class="tab-target" id="now"></span><span class="tab-target" id="next"></span>
          <nav class="tabs" aria-label="Versions"><a href="#now">Out now</a><a href="#next">Coming next</a></nav>`
    : '';

// Every release before it, newest first, each with its number and date beside its notes, as
// GitHub's releases page sets them.
function earlier(versions) {
  if (!versions.length) return '';
  const entries = versions
    .map(
      (version) => `<article class="version" id="${anchor(version)}" data-reveal>
            <div class="version-side">
              <a class="version-number" href="#${anchor(version)}">${version.number}</a>
              ${time(version)}
            </div>
            <div class="notes">
              <h3>${titled(version)}</h3>
              ${version.intro.map((paragraph) => `<p>${inline(paragraph)}</p>`).join('')}
              ${list(version.changes)}
              <p class="version-github"><a href="${github(version)}">Release on GitHub</a></p>
            </div>
          </article>`,
    )
    .join('\n          ');
  return `<section class="section earlier">
        <div class="wrap read">
          <header class="section-head" data-reveal><h2>Earlier versions</h2></header>
          <div class="versions">
          ${entries}
          </div>
        </div>
      </section>`;
}

// What the What's new page fills in, by its {{…}} names.
export function releasePages(text, { tags }) {
  const all = versions(text).map((v) => ({ ...v, released: tags.has(`v${v.number}`) }));
  const released = all.filter((version) => version.released);
  // What's still to come is newer than the latest release; an older version left untagged by
  // mistake isn't "next".
  const newest = released[0]?.number ?? '0.0.0';
  const pending = all.filter((v) => !v.released && newer(v.number, newest) > 0);
  return {
    'whats-new.html': {
      template: 'whats-new.html',
      tabs: tabs(pending.length > 0),
      ...latest(released[0]),
      ...next(pending),
      earlier: earlier(released.slice(1)),
    },
  };
}
