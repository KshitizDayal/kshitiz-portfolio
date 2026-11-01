'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LINKS, STATOZ } from '@/lib/data';
import { copyEmail, flipGravity, go, hire, hotReload, openLink } from '@/lib/site';

const COMMANDS = [
  { label: 'Go to StatOz', icon: 'Oz', hint: 'Now building', run: () => go('#statoz', 'center') },
  { label: 'Open statoz.in', icon: '↗', hint: 'statoz.in', run: () => openLink(STATOZ.site) },
  { label: 'Go to work', icon: '↗', hint: 'Section', run: () => go('#work') },
  { label: 'Go to career log', icon: '⎇', hint: 'Section', run: () => go('#log') },
  { label: 'Go to stack', icon: '◎', hint: 'Section', run: () => go('#stack') },
  { label: 'Read the blog', icon: '✎', hint: 'Blog', href: '/blog' },
  { label: 'Go to contact', icon: '✉', hint: 'Section', run: () => go('#contact') },
  { label: 'Back to top', icon: '↑', run: () => go('#top') },
  { label: 'Copy email address', icon: '⧉', run: copyEmail },
  { label: 'Open GitHub', icon: '⌥', hint: 'github.com', run: () => openLink(LINKS.github) },
  { label: 'Open LinkedIn', icon: 'in', hint: 'linkedin.com', run: () => openLink(LINKS.linkedin) },
  { label: 'Open X', icon: '𝕏', hint: 'x.com', run: () => openLink(LINKS.x) },
  { label: 'Hot reload', icon: '⚡', key: 'R', run: hotReload },
  { label: 'Flip gravity', icon: '⇅', hint: 'Stack pit', run: flipGravity },
  { label: 'sudo hire kshitiz', icon: '#', hint: '🎉', run: hire },
];

// ⌘K / Ctrl+K or "/" opens it; R anywhere triggers a hot reload. Every blog post is a command too.
export default function Palette({ posts = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const lastFocus = useRef(null);
  const router = useRouter();

  const commands = useMemo(() => {
    const reads = posts.map(p => ({ label: `Read: ${p.title}`, icon: '¶', hint: `${p.minutes} min`, href: `/blog/${p.slug}` }));
    const at = COMMANDS.findIndex(c => c.href === '/blog') + 1;
    return [...COMMANDS.slice(0, at), ...reads, ...COMMANDS.slice(at)];
  }, [posts]);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/);
    return commands.filter(c => terms.every(t => c.label.toLowerCase().includes(t)));
  }, [query, commands]);

  const show = useCallback(() => {
    lastFocus.current = document.activeElement;
    setQuery('');
    setSel(0);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus?.();
  }, []);

  const runAt = i => {
    const c = results[i];
    if (!c) return;
    hide();
    setTimeout(c.href ? () => router.push(c.href) : c.run, 60);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? hide() : show();
        return;
      }
      if (open || document.body.classList.contains('is-booting')) return;
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey || /^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable) return;
      if (e.key === '/') {
        e.preventDefault();
        show();
      } else if (e.key.toLowerCase() === 'r') {
        hotReload();
      }
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('palette:open', show);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('palette:open', show);
    };
  }, [open, show, hide]);

  const onInputKey = e => {
    const n = results.length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); setSel((sel + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); setSel((sel - 1 + n) % n); }
    else if (e.key === 'Enter') { e.preventDefault(); runAt(sel); }
    else if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'Tab') e.preventDefault();
  };

  if (!open) return null;

  return (
    <div className="palette">
      <div className="palette__backdrop" onClick={hide} />
      <div className="palette__panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="palette__input"
          type="text"
          placeholder="Type a command or search…"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results.length ? `cmd-${sel}` : undefined}
          value={query}
          onChange={e => { setQuery(e.target.value); setSel(0); }}
          onKeyDown={onInputKey}
        />
        <ul className="palette__list" id="palette-list" role="listbox" ref={listRef}>
          {results.length ? results.map((c, i) => (
            <li
              key={c.label}
              id={`cmd-${i}`}
              className="palette__item"
              role="option"
              aria-selected={i === sel}
              onMouseMove={() => i !== sel && setSel(i)}
              onClick={() => runAt(i)}
            >
              <span className="ic">{c.icon}</span>
              <span>{c.label}</span>
              {c.key ? <kbd>{c.key}</kbd> : c.hint ? <small>{c.hint}</small> : null}
            </li>
          )) : <li className="palette__empty">No matches. Try “hire”.</li>}
        </ul>
        <footer className="palette__foot"><span>↑↓ navigate</span><span>↵ run</span><span>esc close</span></footer>
      </div>
    </div>
  );
}
