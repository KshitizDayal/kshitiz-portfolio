import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { createHighlighter } from 'shiki';

/*
 * Blog posts live as Markdown files in /content/blog. The file name is the URL slug.
 * Server-only: everything here reads from disk at build time.
 */

const DIR = path.join(process.cwd(), 'content/blog');
const SHOW_DRAFTS = process.env.NODE_ENV !== 'production';
const WORDS_PER_MINUTE = 220;

const LANGS = ['dart', 'js', 'jsx', 'ts', 'tsx', 'json', 'bash', 'shell', 'css', 'html', 'yaml', 'python', 'sql', 'diff', 'md', 'swift', 'kotlin', 'java', 'ini', 'ssh-config'];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };

// Inline HTML → plain text, for the contents list and heading ids.
const toText = html => html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ENTITIES[e]);

export const slugify = text =>
  toText(text).toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function readFile(file) {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const words = content.trim().split(/\s+/).length;
  const date = new Date(data.date);
  return {
    slug: file.replace(/\.md$/, ''),
    title: data.title,
    excerpt: data.excerpt ?? '',
    tags: data.tags ?? [],
    date: date.toISOString(),
    dateLabel: formatDate(date),
    draft: !!data.draft,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    content,
  };
}

// Files starting with "_" (and the README) are notes, not posts.
const postFiles = () =>
  fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md') : [];

// Newest first, drafts only in `npm run dev`. Content is stripped so lists stay light.
export function getPosts() {
  return postFiles()
    .map(readFile)
    .filter(p => SHOW_DRAFTS || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ content, ...meta }) => meta);
}

export function getPostMeta(slug) {
  return getPosts().find(p => p.slug === slug) ?? null;
}

let highlighter;
const getHighlighter = () => (highlighter ??= createHighlighter({ themes: ['vitesse-dark'], langs: LANGS }));

// Markdown → HTML, with highlighted code, linkable headings and a table of contents.
export async function getPost(slug) {
  const meta = getPostMeta(slug);
  if (!meta) return null;
  const { content } = readFile(`${slug}.md`);
  const hl = await getHighlighter();
  const toc = [];
  const seen = new Map();

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(html);
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id += `-${n}`;
        if (depth === 2 || depth === 3) toc.push({ id, depth, text: toText(html) });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${depth}>`;
      },
      code({ text, lang }) {
        const [name, file] = (lang ?? '').split(':');
        const language = hl.getLoadedLanguages().includes(name) ? name : 'text';
        const code = hl.codeToHtml(text, { lang: language, theme: 'vitesse-dark' });
        const label = escapeHtml(file || name || 'text');
        return `<figure class="code"><figcaption><span>${label}</span><button type="button" class="code__copy">Copy</button></figcaption>${code}</figure>`;
      },
      link({ href, title, tokens }) {
        const external = /^https?:\/\//.test(href);
        const attrs = [`href="${escapeHtml(href)}"`];
        if (title) attrs.push(`title="${escapeHtml(title)}"`);
        if (external) attrs.push('target="_blank" rel="noopener noreferrer"');
        return `<a ${attrs.join(' ')}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        const img = `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy" />`;
        // A span, not a <figure>: images sit inside a <p>.
        return title ? `<span class="figure">${img}<span class="figure__cap">${escapeHtml(title)}</span></span>` : img;
      },
    },
  });

  return { ...meta, html: await marked.parse(content), toc };
}
