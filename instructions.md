# How this repo is built

The design, code and writing rules for kshitizdayal.com. Read this before adding a section, a project or a blog post, so new work looks and reads like the rest of the site.

This file lives at the repo root so it stays in git but never reaches the site. Next.js only serves `public/`, and the blog only reads `content/blog/`. Don't move it into either.

---

## 1. The idea

**A developer's own tools, turned into the UI.** The site doesn't describe Kshitiz as a Flutter and full-stack developer. It shows it with things a developer recognises:

| Piece | The tool it borrows from |
| --- | --- |
| Boot screen (`Boot.js`) | `flutter run` in a terminal, once per session |
| `R` key / "Hot reload" | Flutter hot reload: switches the accent colour and shows a toast |
| `⌘K` / `/` (`Palette.js`) | A command palette (VS Code, Raycast) |
| Career (`Log.js`) | `git log --graph`: jobs are commits, the degree is a branch that merges back |
| Work (`Work.js`, `Phone.js`) | A real phone you hold: 3D, draggable, with each app's UI rebuilt in HTML |
| Stack (`Stack.js`) | A physics pit of skill chips (matter-js) |
| Blog index | `// blog · ~/kshitiz/notes`, `$ ls posts/` when empty |

Every new feature should pass this test: **is it playful, is it something a developer would recognise, and does it still work with reduced motion and a keyboard?**

---

## 2. Stack and commands

- **Next.js 15 App Router, React 19, plain JavaScript** (no TypeScript). Static output, hosted on Vercel.
- Runtime dependencies are kept to a minimum: `matter-js` (stack pit, loaded lazily), `gray-matter` + `marked` + `shiki` (blog, build time only). **No UI kit, no CSS framework, no animation library.** Motion is hand-written CSS, canvas and `requestAnimationFrame`.
- `npm run dev` runs on port 3000 and shows drafts. `npm run build` is the real check.
- Path alias: `@/*` is the repo root (`jsconfig.json`).

### Repo map

```text
app/
  layout.js            fonts, metadata, the pre-paint boot script
  page.js              home: lists the sections in order
  globals.css          ALL styles, one file, split into #SECTIONS
  sitemap.js
  blog/page.js         blog index
  blog/[slug]/page.js  one post
  blog/rss.xml/route.js
components/            one file per home section, plus shared chrome
  blog/                Shell, BlogIndex, PostList, PostChrome
lib/
  data.js              ALL site content: links, projects, StatOz, commits, skills
  site.js              shared client actions: go, toast, copyEmail, hotReload, confetti…
  blog.js              Markdown → posts (server only)
  useIstTime.js        Bangalore clock hook
content/blog/          one .md file per post (README.md and _*.md are ignored)
public/                images and icons, served at /
assets/, index.html, index.txt   the old static portfolio, not used by Next.js
```

---

## 3. Visual design

### Colour

Dark only (`color-scheme: dark`). Tokens are at the top of `app/globals.css`. Use them and don't invent new greys.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-2` / `--bg-3` | `#0b0b0c` / `#121214` / `#1c1c20` | page, raised surfaces, chips and `kbd` |
| `--line` | `rgba(255,255,255,.09)` | every border and divider |
| `--text` | `#f3f1ea` | warm off-white, never pure `#fff` for body copy |
| `--muted` / `--dim` | `#a3a197` / `#64635c` | secondary copy / tertiary |
| `--accent` | `#d7ff3a` (acid lime) | one accent at a time: kickers, `<em>`, focus rings, selection, solid buttons |
| `--cyan` `--pink` `--amber` | | small highlights only |

The accent is **live**: hot reload cycles it through `ACCENTS` in `lib/data.js`. Anything that should follow it must read `var(--accent)` in CSS or `getAccent()` in JS, not a hard-coded lime. Text on an accent background is `#000`.

Per-component colour is passed as a custom property on the element (`--a` for a project's ink, `--pa` for the active project, `--sbg`/`--fg`/`--card` for phone screen themes), not as a new class.

### Type: four fonts, four jobs

Loaded with `next/font/google` in `app/layout.js` and exposed as `--f-*` tokens.

| Token | Font | Job |
| --- | --- | --- |
| `--f-display` | **Unbounded** 500–800 | Headlines, section titles, post titles, big numbers. Tight: `letter-spacing: -0.035em` to `-0.065em`, `line-height` ≈ 0.85–1 |
| `--f-serif` | **Instrument Serif** italic | The one emphasised word in a headline, blockquotes. Always italic, weight 400, usually in `--accent` |
| `--f-body` | **Inter** | Paragraphs, buttons, UI |
| `--f-mono` | **JetBrains Mono** | Kickers, meta lines, tags, hashes, `kbd`, code, terminal text |

**The signature move** is a heavy display headline whose last word or phrase switches to serif italic in the accent colour:

```jsx
<h2 className="h2" data-reveal>Seven products.<br /><em>One pocket.</em></h2>
<h1 className="blog-hero__title">Writ<em>ing.</em></h1>
```

Every section heading follows that shape: a short first line, a `<br />`, then an `<em>` twist that ends in a full stop. Examples: *Thoughts, / compiled.* · *My life, / version-controlled.* · *Throw my / stack around.*

### Section anatomy

```jsx
<section className="section NAME" id="NAME">
  <div className="wrap">
    <p className="kicker">// 03 — Stack</p>
    <h2 className="h2" data-reveal>Throw my<br /><em>stack around.</em></h2>
    …
  </div>
</section>
```

- **Kicker**: mono, accent colour, written as a code comment: `// NN — Name`. Current numbering: 00 Hello, 01 Selected work, 02 Career, 03 Stack, 04 Writing, 05 Contact. Renumber if you insert one.
- `.section` gives fluid vertical padding plus `--gutter` on the sides. `.wrap` caps the width at `--maxw` (1320px).
- Buttons: `.btn.btn--solid` (accent pill) or `.btn.btn--ghost` (bordered pill), 52px tall, `border-radius: 999px`.
- Pills everywhere: tags, filters and badges are rounded `999px`, mono, with a `--line` border.
- Symbols stand in for icons: `↗` external, `→` forward, `←` back, `↓` scroll, `·` separator, `✦` marquee divider, `¶` `⧉` `⚡` `⎇` in the palette. Purely decorative ones get `aria-hidden="true"`.

### Sizing and layout

- Fluid sizes use `clamp(min, vw, max)` for headings and section padding. Don't add fixed px breakpoints for type.
- Breakpoints are plain `max-width` media queries (600, 760, 960, 1180 are the common ones) placed **right after the rules they change**, not collected at the end.
- `main { overflow-x: clip }`. Nothing may scroll sideways at phone width.

### Motion

- One easing for nearly everything: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`. Durations are about 0.3s for hovers and about 1s for entrances.
- **Scroll reveals** on the home page: add `data-reveal` to an element. `Effects.js` adds `.in` once it is 15% visible. Hidden only when `.js` is on `<html>`, so content never disappears without JS.
- **Staggered entrances** on blog pages: `className="blog-in" style={{ '--d': n }}`, where each step adds 90ms.
- Page-wide layers (custom cursor, grain, flash, confetti canvas, toast) are rendered once in `Effects.js`. Talk to them through `lib/site.js` (`toast()`, `confetti()`, `hotReload()`), not by adding new overlays.
- **Reduced motion is not optional.** Every animated component checks `prefersReducedMotion()` and either renders a still frame or skips the effect. The cursor and magnet effects also need `hasFinePointer()`. The global `@media (prefers-reduced-motion: reduce)` block at the end of the CSS is the safety net, not the plan.

### Accessibility

- Visible `:focus-visible` ring in the accent colour.
- Decorative canvases, phones, marquees and symbols are `aria-hidden="true"`. Real controls are `<button>` and `<a>`, with an `aria-label` when the visible text is only an icon.
- The palette is a proper combobox and listbox. Keep the roles if you touch it.
- Shortcuts ignore typing in inputs and do nothing while the boot screen is up.

---

## 4. Writing on the site (UI copy)

- **Always first person. Never third person.** Kshitiz writes everything personally, so every line on the site and in the blog says "I", "me", "my": "I build apps that live in your pocket", never "Kshitiz builds apps…" or "He is a developer…". This covers headlines, section copy, project and career text in `lib/data.js`, toasts, palette labels and blog posts. The name "Kshitiz Dayal" appears only where it's a label, not a sentence: the logo, the post byline, page titles.
- **Short and dry.** "I build apps that live in your pocket." "Written down so I stop re-learning them."
- **Developer jokes, lightly.** "Merged into main, conflicts resolved." "`$ ls posts/` → nothing here yet. The first one is compiling." "No matches. Try “hire”." One per spot, never two.
- **British spelling**: colour, recognise, maths, jewellery. Dates are `en-GB` ("1 Nov 2026").
- **No Oxford comma**: "Flutter, the web, games and building StatOz."
- Page titles use an em dash: `Blog — Kshitiz Dayal`. Ranges in the career log too: `Oct 2024 — Sep 2026`.
- Toasts are one short sentence, sometimes with one emoji: "Email copied. Talk soon ✌️".
- Be honest in small print: "Phone screens are UI reimagined for this site, not production screenshots."

---

## 5. Code style

### General JavaScript

- 2-space indent, semicolons, **single quotes** (a few files, such as `About.js`, `Contact.js` and `data.js`, use double quotes: match the file you are in).
- Arrow functions for small helpers, no parentheses around a single parameter: `const pad = n => String(n).padStart(2, '0');`
- Module-level constants in `UPPER_CASE` at the top of the file (`LINKS`, `LATEST`, `BANDS`, `COMMANDS`, `WORDS_PER_MINUTE`).
- Small lists are **tuples with a shape comment**, not objects:
  ```js
  // [label, kind, large]
  export const SKILLS = [["Flutter", "mobile", true], ["Flame", "mobile"]];
  ```
  Use objects when items have more than about three fields (`PROJECTS`, `COMMITS`, `COMMANDS`).
- Short names inside tight scopes (`p`, `c`, `e`, `t`, `r`, `dx`), full words for anything exported.
- Modern syntax is welcome: `??`, `??=`, `||=`, `?.`, optional catch binding (`catch {`).

### Comments

Sparse, and they explain **what something is or why**, never what the next line does.

- One line above every component saying what it is, in plain English:
  `// Two crossing tapes that scroll in opposite directions and speed up with page scroll.`
- One line above each `useEffect` naming the behaviour:
  `// Slide away while scrolling down, come back on the way up.`
- Explain non-obvious numbers and workarounds:
  `// Extra solver passes stop a tall pile from squashing its bottom row into the floor.`
- Block comments (`/* … */`) only for file-level notes, as in `lib/blog.js` and `lib/site.js`.

### Components

- One default-exported component per file in `components/`, named after the section (`Hero`, `Work`, `Log`). Private helper components live below it in the same file, separated by two blank lines (`DotField`, `HeroPhone`).
- `'use client'` only when the file needs hooks or the DOM. `Writing.js`, `PostList.js`, `Shell.js` and `Icons.js` are server components. Keep them that way.
- **Content goes in `lib/data.js`, not in JSX.** Components map over data. Adding a project, job or skill should never mean editing a component.
- Imports: React and Next first, then `@/lib/...`, then sibling components with relative paths (`./Phone`, `../Nav`).
- Class names are built with template strings, not a `clsx` helper:
  `` className={`chapter${i === active ? ' is-active' : ''}`} ``

### Effects and animation code

This is where most of the site's code lives. Follow the existing pattern:

```js
useEffect(() => {
  const el = ref.current;
  if (prefersReducedMotion()) { /* draw a still frame */ return; }

  let raf = 0, visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  io.observe(el);

  const loop = t => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;        // never animate off-screen
    el.style.transform = `…`;    // write styles directly, never setState per frame
  };
  raf = requestAnimationFrame(loop);
  addEventListener('resize', onResize);

  return () => {                 // undo everything
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener('resize', onResize);
  };
}, []);
```

- One `useEffect` per behaviour.
- Animate through refs and `el.style`, or a CSS custom property (`--p`). React state is for things that change rarely (`active`, `open`, `hidden`).
- Use `addEventListener` and `scrollY` on the window without `window.`. Scroll and pointer listeners are `{ passive: true }`.
- Throttle scroll work with `requestAnimationFrame` (`raf ||= requestAnimationFrame(update)`).
- Canvases cap the pixel ratio: `Math.min(devicePixelRatio || 1, 2)`.
- Re-measure after fonts load (`document.fonts?.ready.then(measure)`), because Unbounded changes widths.
- Heavy libraries load lazily inside the effect: `import('matter-js')`.
- Server and client must render the same first markup. Use placeholders, like `useIstTime` returning `'09:41'` until it mounts.

### CSS

- **Everything is in `app/globals.css`**, in section order, with a banner per section and two blank lines between sections:
  ```css
  /*-----------------------------------*\
    #STACK
  \*-----------------------------------*/
  ```
  Small sub-areas get a lowercase comment: `/* StatOz phone screen */`.
- BEM-style names: `.block`, `.block__part`, `.block--variant`. States are `.is-*` (`is-active`, `is-hidden`, `is-dragging`, `is-copied`). Global page states sit on `body` (`is-booting`, `is-ready`, `has-cursor`).
- Prefix by section (`.hero__`, `.chapter__`, `.post-row__`, `.palette__`) so a selector says where it lives.
- Multi-line rules by default. Tiny one-declaration rules can sit on one line (`.toc a:hover { color: var(--text); }`).
- Colours, fonts and easing come from tokens. Literal colours are fine inside the phone screens, which imitate other apps' brands.
- No `!important` except the boot wipe and the reduced-motion block.

---

## 6. The blog

### How it works

`lib/blog.js` reads `content/blog/*.md` at build time. The file name is the slug. It works out reading time (220 wpm), hides `draft: true` in production, highlights code with Shiki (`vitesse-dark`), gives every heading an id and `#` anchor, and builds the "On this page" list from `##` and `###`. Posts are statically generated, and they also appear in the sitemap, the RSS feed, the home page "Writing" section (latest 3) and the `⌘K` palette as `Read: …` commands. **Adding a `.md` file is all it takes. Nothing else needs touching.**

Authoring syntax (frontmatter, images, `lang:file` code labels, supported languages) is documented in `content/blog/README.md`. Keep that README in step with `lib/blog.js` when you change one of them.

If a new post uses a language that isn't in `LANGS` in `lib/blog.js`, add it there, or the block renders as plain text.

### Frontmatter conventions

```md
---
title: "A Next.js folder structure that still makes sense at 200 files"
date: 2026-11-01T21:00:00+05:30
excerpt: Routes in app/, business logic in features/, the API in core/, and imports that only ever point one way. Here's the App Router structure I use, with the code for every layer so you can copy it.
tags: [Next.js, Architecture, TypeScript]
---
```

- **Title**: a specific claim or promise, often with a colon or a number. Quote it if it has a colon. Examples: "Two GitHub accounts, one laptop: let the folder decide", "Feature-first Flutter: a folder structure that holds up at 1,000 files".
- **Date**: add a time with `+05:30` whenever two posts share a day, so they sort correctly.
- **Excerpt**: one or two sentences. Start with the concrete payoff and end with what the reader gets ("…with the code for every layer so you can copy it").
- **Tags**: two to four, Title Case, reused across posts so the tag filters group posts together (`Architecture`, `TypeScript`, `Flutter`, `Git`).

### How a post is written

Read `github-multiple-accounts.md` and `nodejs-backend-structure.md` before writing a new one. They set the voice.

**Structure**

1. **Open with the real problem, from experience.** Start with a concrete situation ("I have two GitHub accounts on one MacBook."), then the symptoms as a short bullet list, with real error messages in backticks.
2. **State the fix in one bold sentence.** "**The folder a repo lives in decides which account it uses.**" Longer posts give it its own heading: `## The idea in one sentence`.
3. **One short transition line**: "Here's the whole setup. It takes about ten minutes."
4. **Body sections with plain-language `##` headings.** Tutorials use `## Step 1: Create one SSH key per account`. Architecture posts go big picture → full tree → per-folder roles → dependency rules → one feature built layer by layer (`### 1. Models: what the API sends`).
5. **Practical closers** that recur: `## Where does a new file go?` (a two-column table), `## Things that can still trip you up` / `## Where it breaks in real life`, `## Why not <the other approach>?`, `## The whole thing at a glance` (summary table).
6. **End on one short, punchy line**, not a "Conclusion" heading: "Set it up once, and "which account am I on?" stops being a question. It's the folder."

**Voice**

- **Always first person** ("I have two GitHub accounts", "the structure I use"), never "the author" or Kshitiz in the third person. Conversational, like explaining it to a colleague at their desk. Contractions are fine ("Here's", "doesn't", "it's").
- **A guide, told as how I did it.** Write the title, excerpt, opening and body as my own setup and decisions: "I went layer-first here", "I hold myself to four rules", "This is the list I go through every time I add a feature". Not neutral documentation ("Routes should…", "The rules:"). Address the reader as "you" only for advice on copying it ("If you copy this, pick a casing on day one").
- **Never invent experience.** Don't make up bugs, incidents, numbers or history to sound personal. If the opening needs a real story, ask for one.
- Short paragraphs, two to four sentences. Each `##` section opens by saying what it is about.
- **Bold** marks the one rule in a section that matters most. Inline `code` for every file name, flag, command and config key.
- Explain *why* as well as *what*: a `### Why IdentitiesOnly=yes matters` subsection is better than a bare instruction.
- A `>` blockquote is for the single most quotable takeaway of the post, at most one or two per post. It renders large, in serif italic.
- Examples are **generic and copyable** (a shop with `products` and a `cart`, `you@personal.com`). Mention where it comes from (StatOz, Junglee) for credibility, but strip out anything product-specific. Don't announce it in the post ("I've stripped out everything product-specific…"): just use the examples.
- Cross-link sibling posts inline: "(Building in Flutter? Here's [the Flutter version](/blog/flutter-folder-structure).)"
- Same house style as the site: British spelling, no Oxford comma, no emoji in prose.

**Code blocks**

- Always give a language. Label real files with their path: ` ```dart:lib/main.dart `, ` ```ini:~/.gitconfig `.
- Use ` ```text ` for folder trees (with `├──` / `└──` and aligned `#` comments) and for terminal output.
- Show the expected output as a comment under the command (`# Hi <your-personal-username>! …`).
- Keep each block to what the paragraph is about. Use `…` for what's left out.

**Tables** are for comparisons and lookups: "Holds / Never holds", "You're adding / Put it in", "Piece / What it does". Keep cells short.

---

## 7. Recipes

**Add a project**: add an object to `PROJECTS` in `lib/data.js` (`id`, `name`, `short`, `logo` or `emoji` + `iconBg`, `ink`, `tag`, `kicker`, `desc`, `theme`, optional `links`). Put the logo in `public/assets/images/`. If it needs a custom phone screen, add it in `Phone.js` and style it under `#PHONE SCREENS`. Update the "Seven products." headline and the `7` in the `About.js` stats if the count changes.

**Add a job**: add a commit to the top of `COMMITS` and move the `HEAD → main` ref onto it. Use a made-up 7-character hash and a conventional-commit `type` (`feat:`, `chore:`, `merge:`).

**Add a skill**: add one tuple to `SKILLS` in the right group. The pit grows to fit.

**Add a palette command**: add an entry to `COMMANDS` in `Palette.js` with `label`, `icon`, an optional `hint` or `key`, and either `run` (a `lib/site.js` action) or `href`.

**Add a home section**: create `components/Name.js` with the section anatomy above, add it to `app/page.js`, give it a kicker number and a `#NAME` block in `globals.css` in the same order, and add it to `LINKS` in `Nav.js` and `COMMANDS` in `Palette.js` if it should be reachable from there.

**Add a blog post**: add `content/blog/my-slug.md`, start with `draft: true`, check it in `npm run dev`, then remove the draft line.

---

## 8. Don'ts

- Don't add Tailwind, a component library, Framer Motion, GSAP or a 3D engine. Do it with CSS, canvas and `requestAnimationFrame`.
- Don't write about Kshitiz in the third person anywhere on the site or in a post. It's always "I".
- Don't hard-code content in components. It belongs in `lib/data.js` or a Markdown file.
- Don't add a second accent colour to a section, or use pure white for paragraph text.
- Don't ship an animation without a reduced-motion path and an off-screen pause.
- Don't use `setState` inside a `requestAnimationFrame` loop.
- Don't put notes or docs in `content/blog/` unless the file name starts with `_`, or they'll be published as posts.
- Don't edit the old `assets/` and `index.html`. They aren't part of the Next.js site.
