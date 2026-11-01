'use client';

import { useEffect, useRef } from 'react';

const LINES = [
  ['Launching lib/main.dart on Chrome in debug mode...', ''],
  ['Resolving dependencies ...... flutter · firebase · node', 'dim'],
  ['Compiling 7 products ........ done', 'dim'],
  ['✓ Built build/web', 'ok'],
  ['', ''],
  ['Flutter run key commands.', ''],
  ['r   Hot reload. 🔥🔥🔥', 'hl'],
  ['⌘K  Open command palette.', 'hl'],
];

// A fake `flutter run` that plays once per session, then wipes away to reveal the site.
export default function Boot() {
  const outRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const body = document.body;
    const ready = () => body.classList.add('is-ready');

    // Already booted: a returning visitor, or arriving from another page without a reload.
    if (document.documentElement.classList.contains('skip-boot') || !body.classList.contains('is-booting')) {
      body.classList.remove('is-booting');
      ready();
      return;
    }

    const out = outRef.current;
    const bar = barRef.current;
    const timers = [];
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      removeEventListener('keydown', finish);
      removeEventListener('pointerdown', finish);
      bar.style.width = '100%';
      try { sessionStorage.setItem('kd-booted', '1'); } catch { /* storage unavailable */ }
      body.classList.add('is-booted');
      timers.push(setTimeout(ready, 250));
      timers.push(setTimeout(() => body.classList.remove('is-booting', 'is-booted'), 950));
    }

    addEventListener('keydown', finish);
    addEventListener('pointerdown', finish);

    out.textContent = '';
    const cmd = document.createElement('span');
    cmd.className = 'cmd';
    out.append(cmd);

    let t = 250;
    [...'$ flutter run -d kshitiz.dev'].forEach(ch => {
      timers.push(setTimeout(() => { cmd.textContent += ch; }, (t += 24)));
    });
    t += 200;
    LINES.forEach(([text, cls], i) => {
      timers.push(setTimeout(() => {
        const line = document.createElement('span');
        line.className = cls;
        line.textContent = `\n${text}`;
        out.append(line);
        bar.style.width = `${((i + 1) / LINES.length) * 100}%`;
      }, (t += i < 4 ? 190 : 90)));
    });
    timers.push(setTimeout(finish, t + 550));

    return () => {
      timers.forEach(clearTimeout);
      removeEventListener('keydown', finish);
      removeEventListener('pointerdown', finish);
    };
  }, []);

  return (
    <div className="boot" aria-hidden="true">
      <div className="boot__term">
        <div className="tbar"><span /><span /><span /><em>zsh — kshitiz</em></div>
        <pre className="boot__out" ref={outRef} />
        <div className="boot__progress"><i ref={barRef} /></div>
      </div>
      <p className="boot__skip">click or press any key to skip</p>
    </div>
  );
}
