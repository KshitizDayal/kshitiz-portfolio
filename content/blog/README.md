# Writing a blog post

Every `.md` file in this folder is a post. The file name becomes the URL:
`content/blog/flutter-state-management.md` → `/blog/flutter-state-management`.

Files starting with `_` and this README are ignored, so `_ideas.md` is a safe scratchpad.

## Frontmatter

```md
---
title: "Why I stopped fighting Flutter's rebuilds"
date: 2026-11-01
excerpt: One or two sentences shown on the cards and in link previews.
tags: [Flutter, Performance]
draft: true
---

Your post starts here.
```

- `title` and `date` are required. Posts are sorted newest first by `date`.
  Publishing two on the same day? Add a time so they sort right: `date: 2026-11-01T21:00:00+05:30`.
- `draft: true` shows the post in `npm run dev` (with a Draft badge) but hides it from the live site.
  Delete the line or set it to `false` to publish.
- Reading time is worked out for you.

## What you can use

- `##` and `###` headings. These build the "On this page" list beside the post.
- **Bold**, _italic_, `inline code`, [links](https://example.com) (external links open in a new tab).
- `> quotes`, lists, tables, `---` dividers.
- Images: put them in `public/blog/` and write `![Alt text](/blog/my-image.png "Optional caption")`.
- Code blocks with a language get syntax highlighting and a Copy button.
  Add a file name after a colon to label the block:

  ````md
  ```dart:lib/main.dart
  void main() => runApp(const App());
  ```
  ````

  Supported: dart, js, jsx, ts, tsx, json, bash, shell, css, html, yaml, python, sql, diff, md, swift, kotlin, java, ini (use it for .gitconfig), ssh-config.
