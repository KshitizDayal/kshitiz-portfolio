'use client';

import { useEffect, useRef, useState } from 'react';
import { COMMITS } from '@/lib/data';

// Career as `git log --graph`: main is the career line, edu/svit branches off and merges back.
export default function Log() {
  const termRef = useRef(null);
  const bodyRef = useRef(null);
  const [paths, setPaths] = useState(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;

    function measure() {
      const box = body.getBoundingClientRect();
      const pts = [...body.querySelectorAll('.node')].map((n, i) => {
        const r = n.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, ...COMMITS[i] };
      });
      const main = pts.filter(p => p.lane === 0);
      const edu = pts.find(p => p.lane === 1);
      const merge = pts.find(p => p.merge);
      const first = main[0], root = main[main.length - 1];
      const x0 = first.x, x1 = edu.x;

      setPaths({
        w: box.width,
        h: box.height,
        main: `M${x0} ${first.y} V${root.y}`,
        edu: `M${x0} ${root.y} C${x0} ${root.y - 26} ${x1} ${root.y - 22} ${x1} ${root.y - 50} V${merge.y + 50} C${x1} ${merge.y + 22} ${x0} ${merge.y + 26} ${x0} ${merge.y}`,
      });
    }

    measure();
    document.fonts?.ready.then(measure);
    let timer;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(measure, 120); };
    addEventListener('resize', onResize);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        measure();
        setDrawn(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(termRef.current);

    return () => {
      clearTimeout(timer);
      io.disconnect();
      removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section className="section log" id="log">
      <div className="wrap">
        <p className="kicker">// 02 — Career</p>
        <h2 className="h2" data-reveal>My life,<br /><em>version-controlled.</em></h2>

        <div className="term" ref={termRef} data-reveal>
          <div className="tbar"><span /><span /><span /><em>~/kshitiz — git log --graph --all</em></div>
          <div className={`term__body${drawn ? ' is-drawn' : ''}`} ref={bodyRef}>
            <svg className="graph" aria-hidden="true" viewBox={paths ? `0 0 ${paths.w} ${paths.h}` : undefined}>
              {paths && (
                <>
                  <path className="p-main" pathLength="1" d={paths.main} />
                  <path className="p-edu" pathLength="1" d={paths.edu} />
                </>
              )}
            </svg>

            <ol className="commits">
              {COMMITS.map((c, i) => (
                <li key={c.hash} className={`commit${c.merge ? ' commit--merge' : ''}`} data-lane={c.lane} style={{ '--d': `${0.2 + i * 0.18}s` }}>
                  <span className="node" />
                  <div className="commit__meta">
                    <code className="hash">{c.hash}</code>
                    {c.ref && <span className={`ref ref--${c.ref.kind}`}>{c.ref.label}</span>}
                    <time>{c.time}</time>
                  </div>
                  <h3><span className="type">{c.type}</span>{c.title}</h3>
                  <p>{c.text}</p>
                  {c.points && (
                    <ul className="commit__points">
                      {c.points.map(point => <li key={point}>{point}</li>)}
                    </ul>
                  )}
                  {c.link && (
                    <a className="commit__link" href={c.link.href} target="_blank" rel="noopener noreferrer">{c.link.label}</a>
                  )}
                </li>
              ))}
            </ol>
            <p className="term__end">(END)<span className="caret" /></p>
          </div>
        </div>
      </div>
    </section>
  );
}
