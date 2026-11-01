'use client';

import { Fragment, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/site';

const BANDS = [
  { cls: 'band--a', items: ['Flutter', 'Dart', 'Firebase', 'Riverpod', 'Bloc', 'React', 'Node.js', 'MongoDB'] },
  { cls: 'band--b', items: ['Mobile apps', 'Web platforms', 'APIs', 'Play Store', 'App Store', 'Shipped'] },
];

// Two crossing tapes that scroll in opposite directions and speed up with page scroll.
export default function Marquee() {
  const wrapRef = useRef(null);
  const trackRefs = useRef([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // A copy: React nulls the ref slots on unmount, before this effect's cleanup stops the loop.
    const tracks = [...trackRefs.current];
    let widths = [];
    const measure = () => { widths = tracks.map(t => t.scrollWidth / 2); };
    measure();
    document.fonts?.ready.then(measure);

    let x = 0, lastY = scrollY, vel = 0, visible = false, raf = 0;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(wrapRef.current);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dy = scrollY - lastY;
      lastY = scrollY;
      vel += (dy - vel) * 0.1;
      if (!visible) return;
      x += 0.8 + Math.abs(vel) * 0.4;
      tracks.forEach((t, i) => {
        const o = x % widths[i];
        t.style.transform = `translateX(${i % 2 ? o - widths[i] : -o}px)`;
      });
    };
    raf = requestAnimationFrame(loop);
    addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className="marquee" ref={wrapRef} aria-hidden="true">
      {BANDS.map((band, b) => (
        <div key={band.cls} className={`band ${band.cls}`}>
          <div className="band__track" ref={el => { trackRefs.current[b] = el; }}>
            {[0, 1].map(copy => (
              <Fragment key={copy}>
                {band.items.map(item => (
                  <Fragment key={item}><span>{item}</span><i>✦</i></Fragment>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
