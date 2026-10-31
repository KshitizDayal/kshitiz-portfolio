'use client';

import { useEffect, useRef } from 'react';
import { SKILLS } from '@/lib/data';
import { hasFinePointer, prefersReducedMotion, registerPit } from '@/lib/site';

const LEGEND = [['mobile', 'Mobile'], ['web', 'Web'], ['backend', 'Backend & APIs'], ['lang', 'Languages'], ['tool', 'Tools, testing & shipping']];

export default function Stack() {
  const pitRef = useRef(null);

  // Skill chips fall into the pit with real physics; drag them, fling them, or tap for a shockwave.
  useEffect(() => {
    const box = pitRef.current;
    const chips = [...box.querySelectorAll('.chip')];
    let cleanup = () => {};
    let cancelled = false;

    if (prefersReducedMotion()) {
      box.classList.add('is-static');
      return;
    }

    import('matter-js')
      .then(mod => {
        if (cancelled) return;
        cleanup = startPit(mod.default || mod, box, chips);
      })
      .catch(() => box.classList.add('is-static'));

    return () => {
      cancelled = true;
      cleanup();
    };
    // Restart the physics when the skills list changes (e.g. after editing lib/data.js).
  }, [SKILLS]);

  return (
    <section className="section stack" id="stack">
      <div className="wrap">
        <p className="kicker">// 03 — Stack</p>
        <div className="stack__head">
          <h2 className="h2" data-reveal>Throw my<br /><em>stack around.</em></h2>
          <p className="stack__lede" data-reveal>Drag, fling and pile them up. Tap empty space for a shockwave.</p>
        </div>

        <div className="pit" ref={pitRef}>
          {SKILLS.map(([label, kind, xl]) => (
            <span key={label} className={`chip chip--${kind}${xl ? ' chip--xl' : ''}`}>{label}</span>
          ))}
        </div>

        <ul className="legend">
          {LEGEND.map(([kind, label]) => <li key={kind}><i className={`chip--${kind}`} />{label}</li>)}
        </ul>
      </div>
    </section>
  );
}

function startPit(Matter, box, chips) {
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query } = Matter;
  // Extra solver passes stop a tall pile from squashing its bottom row into the floor.
  const engine = Engine.create({ positionIterations: 12, velocityIterations: 8 });
  const fine = hasFinePointer();
  const T = 400;
  const STEP = 1000 / 60;

  // Grow the pit until the whole stack fits; a settled pile fills roughly 80% of its area.
  function fit() {
    box.style.height = '';
    const area = chips.reduce((sum, el) => sum + el.offsetWidth * el.offsetHeight, 0);
    const needed = Math.ceil(area / 0.8 / box.clientWidth);
    if (needed > box.clientHeight) box.style.height = `${needed}px`;
  }

  fit();
  let w = box.clientWidth, h = box.clientHeight;

  // Heavy piles sink a few px into whatever they rest on, so the floor sits slightly high.
  const SINK = 4;
  const floor = Bodies.rectangle(w / 2, h - SINK + T / 2, w * 4, T, { isStatic: true });
  const left = Bodies.rectangle(-T / 2, h / 2, T, h * 6, { isStatic: true });
  const right = Bodies.rectangle(w + T / 2, h / 2, T, h * 6, { isStatic: true });
  const ceiling = Bodies.rectangle(w / 2, -T / 2, w * 4, T, { isStatic: true });
  Composite.add(engine.world, [floor, left, right]);

  let bodies = [];
  let ceilingOn = false, started = false, raf = 0, last = 0, acc = 0, gravity = 1, timer;

  function spawn() {
    started = true;
    box.classList.add('is-live');
    bodies = chips.filter(el => el.isConnected && el.offsetWidth).map((el, i) => {
      const cw = el.offsetWidth, ch = el.offsetHeight;
      const x = Math.min(w - cw / 2 - 2, Math.max(cw / 2 + 2, Math.random() * w));
      const b = Bodies.rectangle(x, -ch - i * 26, cw, ch, {
        chamfer: { radius: ch / 2 - 1 },
        restitution: 0.45,
        friction: 0.2,
        frictionAir: 0.012,
        density: 0.002,
        angle: (Math.random() - 0.5) * 0.8,
      });
      b.plugin.chip = { el, cw, ch };
      return b;
    });
    Composite.add(engine.world, bodies);
  }

  function step(t) {
    raf = requestAnimationFrame(step);
    acc += Math.min(100, t - (last || t));
    last = t;
    // Chips spawn above the box, so the ceiling only goes on once they're all inside.
    engine.gravity.y = ceilingOn ? gravity : 1;
    for (let n = 0; acc >= STEP && n < 4; n++) {
      Engine.update(engine, STEP);
      acc -= STEP;
    }

    for (const b of bodies) {
      const { el, cw, ch } = b.plugin.chip;
      const { x, y } = b.position;
      // Escaped (a hard fling, or the pit shrank on resize): drop it back in.
      if (x < -cw || x > w + cw || y > h + ch || (ceilingOn && y < -ch)) {
        Body.setPosition(b, { x: w / 2, y: gravity > 0 ? ch : h - ch });
        Body.setVelocity(b, { x: 0, y: 0 });
      }
      el.style.transform = `translate(${x - cw / 2}px, ${y - ch / 2}px) rotate(${b.angle}rad)`;
    }

    if (!ceilingOn && bodies.length && bodies.every(b => b.position.y > b.plugin.chip.ch)) {
      Composite.add(engine.world, ceiling);
      ceilingOn = true;
    }
  }

  function run(on) {
    if (on && !raf) {
      last = 0;
      raf = requestAnimationFrame(step);
    } else if (!on && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function shock(x, y, power = 0.045) {
    bodies.forEach(b => {
      const dx = b.position.x - x, dy = b.position.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 380) return;
      const f = power * b.mass * (1 - d / 380);
      Body.applyForce(b, b.position, { x: (dx / d) * f, y: (dy / d - 0.7 * Math.sign(gravity)) * f });
    });
    const ring = document.createElement('span');
    ring.className = 'ripple';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    box.append(ring);
    ring.addEventListener('animationend', () => ring.remove());
  }

  let mouse = null;
  const releaseOutside = e => { if (mouse && !box.contains(e.target)) mouse.mouseup(e); };
  if (fine) {
    mouse = Mouse.create(box);
    // Matter grabs wheel and touch events by default, which would block page scrolling.
    ['wheel', 'mousewheel', 'DOMMouseScroll'].forEach(ev => mouse.element.removeEventListener(ev, mouse.mousewheel));
    mouse.element.removeEventListener('touchmove', mouse.mousemove);
    mouse.element.removeEventListener('touchstart', mouse.mousedown);
    mouse.element.removeEventListener('touchend', mouse.mouseup);
    Composite.add(engine.world, MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } } }));
    addEventListener('mouseup', releaseOutside);
  }

  const onDown = e => {
    if (!started) return;
    const r = box.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (fine && Query.point(bodies, { x, y }).length) return;
    shock(x, y);
  };
  box.addEventListener('pointerdown', onDown);

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !started) spawn();
    run(entry.isIntersecting);
  }, { threshold: 0.25 });
  io.observe(box);

  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fit();
      w = box.clientWidth;
      h = box.clientHeight;
      Body.setPosition(floor, { x: w / 2, y: h - SINK + T / 2 });
      Body.setPosition(right, { x: w + T / 2, y: h / 2 });
      Body.setPosition(left, { x: -T / 2, y: h / 2 });
      Body.setPosition(ceiling, { x: w / 2, y: -T / 2 });
    }, 150);
  };
  addEventListener('resize', onResize);

  const unregister = registerPit({
    flip() {
      gravity *= -1;
      return gravity < 0;
    },
  });

  return () => {
    run(false);
    clearTimeout(timer);
    io.disconnect();
    unregister();
    box.removeEventListener('pointerdown', onDown);
    removeEventListener('resize', onResize);
    removeEventListener('mouseup', releaseOutside);
    if (mouse) {
      mouse.element.removeEventListener('mousemove', mouse.mousemove);
      mouse.element.removeEventListener('mousedown', mouse.mousedown);
      mouse.element.removeEventListener('mouseup', mouse.mouseup);
    }
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    box.classList.remove('is-live');
    box.style.height = '';
  };
}
