'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '@/lib/data';
import { useIstTime } from '@/lib/useIstTime';
import { Phone, ProjectScreen } from './Phone';
import Spotlight from './Spotlight';

const pad = n => String(n).padStart(2, '0');

// Desktop: one sticky phone whose screen swaps as each chapter scrolls past.
// Mobile: every chapter carries its own phone.
export default function Work() {
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const { time } = useIstTime();

  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && setActive(+e.target.dataset.i));
    }, { rootMargin: '-45% 0px -45% 0px' });
    listRef.current.querySelectorAll('.chapter').forEach(c => io.observe(c));
    return () => io.disconnect();
  }, []);

  const dir = active % 2 ? 1 : -1;
  const tilt = { transform: `rotateY(${dir * 16}deg) rotateX(6deg) rotateZ(${-dir * 2}deg)` };

  return (
    <section className="section work" id="work" style={{ '--pa': PROJECTS[active].ink }}>
      <div className="wrap">
        <p className="kicker">// 01 — Selected work</p>
        <h2 className="h2" data-reveal>Seven products.<br /><em>One pocket.</em></h2>
        <Spotlight />
      </div>

      <div className="work__grid">
        <div className="work__chapters" ref={listRef}>
          {PROJECTS.map((p, i) => (
            <article key={p.id} className={`chapter${i === active ? ' is-active' : ''}`} data-i={i} style={{ '--a': p.ink }}>
              <div className="chapter__phone" aria-hidden="true">
                <Phone><ProjectScreen p={p} time={time} state="active" /></Phone>
              </div>
              <p className="chapter__idx"><b>{pad(i + 1)}</b> / {pad(PROJECTS.length)} · {p.tag}</p>
              <h3 className="chapter__name">{p.name}</h3>
              <p className="chapter__kicker">{p.kicker}</p>
              <p className="chapter__desc">{p.desc}</p>
              {p.links && (
                <p className="chapter__links">
                  {p.links.map(l => (
                    <a key={l.href} className={l.primary ? 'chapter__play' : undefined} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>

        <div className="work__aside">
          <div className="work__sticky">
            <div aria-hidden="true">
              <Phone phoneStyle={tilt}>
                {PROJECTS.map((p, i) => (
                  <ProjectScreen key={p.id} p={p} time={time} state={i === active ? 'active' : i < active ? 'past' : 'next'} />
                ))}
              </Phone>
            </div>
            <p className="work__counter"><span>{pad(active + 1)}</span> / {pad(PROJECTS.length)}</p>
          </div>
        </div>
      </div>

      <p className="work__note">Phone screens are UI reimagined for this site, not production screenshots.</p>
    </section>
  );
}
