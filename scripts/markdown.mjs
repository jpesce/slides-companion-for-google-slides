// The project's Markdown (CHANGELOG.md, PRIVACY.md) as the website's HTML, for scripts/changelog.mjs
// and scripts/build-site.mjs. Only what those files use: # headings, paragraphs, "- " and "1. "
// items (which may run on over the lines after them), and inline **bold**, _italic_, `code`,
// [links](url) and <kbd>keys</kbd>. Any other HTML is shown as written, not run.

export const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// The files type straight quotes; the website sets curly ones, as the rest of its words do.
const curly = (text) =>
  text
    .replaceAll(/"([^"]*)"/g, '“$1”')
    .replaceAll(/(^|[\s(])'/g, '$1‘')
    .replaceAll("'", '’');

// A line of Markdown as HTML. Code is left as it's written, and set aside while the rest is read,
// so bold or a link can hold it: **`storage`:** is bold around code. Links' addresses are set aside
// too, so curly quotes and italics never reach an href.
export function inline(markdown) {
  const code = [];
  const urls = [];
  const text = markdown
    .replaceAll(/`([^`]+)`/g, (_, written) => {
      code.push(`<code>${escape(written)}</code>`);
      return `\uE000${code.length - 1}\uE000`;
    })
    .replaceAll(/\]\(([^)\s]+)\)/g, (_, url) => {
      urls.push(escape(url));
      return `](\uE001${urls.length - 1}\uE001)`;
    });
  return escape(curly(text))
    .replaceAll(/&lt;(\/?)kbd&gt;/g, '<$1kbd>')
    .replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replaceAll(/(^|[\s(])_([^_]+)_(?=$|[\s).,:;!?])/g, '$1<em>$2</em>')
    .replaceAll(
      /\[([^\]]+)\]\(\uE001(\d+)\uE001\)/g,
      (_, words, i) => `<a href="${urls[i]}">${words}</a>`,
    )
    .replaceAll(/\uE001(\d+)\uE001/g, (_, i) => urls[i])
    .replaceAll(/\uE000(\d+)\uE000/g, (_, index) => code[index]);
}

// Markdown's blocks, in order: { type: 'heading', level, text }, { type: 'paragraph', text } and
// { type: 'list', ordered, items }, each text still Markdown.
export function blocks(markdown) {
  const out = [];
  let open = null;
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const item = /^(?:([-*])|\d+\.)\s+(.*)$/.exec(line);
    if (!line) open = null;
    else if (heading) {
      out.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      open = null;
    } else if (item) {
      const ordered = !item[1];
      if (open?.type !== 'list' || open.ordered !== ordered) {
        open = { type: 'list', ordered, items: [] };
        out.push(open);
      }
      open.items.push(item[2]);
    } else if (open?.type === 'list') open.items[open.items.length - 1] += ` ${line}`;
    else if (open?.type === 'paragraph') open.text += ` ${line}`;
    else {
      open = { type: 'paragraph', text: line };
      out.push(open);
    }
  }
  return out;
}

// Blocks as HTML, each heading `shift` levels down (a file's ## becomes the page's h2 with 0).
export function html(list, { shift = 0 } = {}) {
  return list
    .map((block) => {
      if (block.type === 'heading') {
        const level = Math.min(6, block.level + shift);
        return `<h${level}>${inline(block.text)}</h${level}>`;
      }
      if (block.type === 'paragraph') return `<p>${inline(block.text)}</p>`;
      const tag = block.ordered ? 'ol' : 'ul';
      return `<${tag}>${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`;
    })
    .join('\n');
}
