'use client';

import { useEffect, useRef } from 'react';
import { hasFinePointer, prefersReducedMotion } from '@/lib/site';

// Page-wide layers (cursor, grain, flash, confetti, toast) and the effects that drive them.
export default function Effects() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  // Fade-up any [data-reveal] element as it enters the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Custom cursor: a dot that follows exactly and a ring that trails behind.
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const cursor = cursorRef.current, dot = dotRef.current, ring = ringRef.current;
    document.body.classList.add('has-cursor');

    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0;
    const onMove = e => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
    };
    const onOver = e => {
      const t = e.target;
      const hover = !!t.closest('a, button, .palette__item');
      cursor.classList.toggle('is-hover', hover);
      cursor.classList.toggle('is-grab', !hover && !!t.closest('.pit, .stage'));
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    };

    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  // Magnetic elements lean towards the pointer when it gets close.
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const els = [...document.querySelectorAll('[data-magnet]')];
    const onMove = e => {
      els.forEach(el => {
        const inner = el.firstElementChild;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.hypot(dx, dy) < r.width;
        el.style.transform = near ? `translate(${dx * 0.3}px, ${dy * 0.3}px)` : '';
        if (inner) inner.style.transform = near ? `translate(${dx * 0.15}px, ${dy * 0.15}px)` : '';
      });
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
      <div className="cursor" ref={cursorRef} aria-hidden="true">
        <i className="cursor__dot" ref={dotRef} />
        <i className="cursor__ring" ref={ringRef} />
      </div>
      <div className="grain" aria-hidden="true" />
      <div className="flash" aria-hidden="true" />
      <canvas className="confetti" aria-hidden="true" />
      <div className="toast" role="status" aria-live="polite" />
    </>
  );
}
