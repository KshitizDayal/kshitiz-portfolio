'use client';

import { useEffect, useRef } from 'react';
import { getAccent, go, hasFinePointer, openPalette, prefersReducedMotion } from '@/lib/site';
import { useIstTime } from '@/lib/useIstTime';
import { HomeScreen, Phone } from './Phone';

export default function Hero() {
  return (
    <section className="hero">
      <DotField />

      <div className="hero__inner">
        <div className="hero__copy">
          <a className="status" href="#statoz"><i />Building StatOz</a>

          <h1 className="hero__title">
            <span className="line"><span>I build apps</span></span>
            <span className="line"><span>that live in</span></span>
            <span className="line"><span>your <em>pocket.</em></span></span>
          </h1>

          <p className="hero__sub">
            I&apos;m <b>Kshitiz Dayal</b>, co-founder of <a className="hero__oz" href="#statoz">StatOz</a> and a Flutter &amp;
            full-stack developer in Bangalore. I build mobile apps and the platforms behind them, from the first widget
            to the last API.
          </p>

          <div className="hero__cta">
            <a className="btn btn--solid" href="#work">See the work <span aria-hidden="true">↓</span></a>
            <button className="btn btn--ghost" onClick={openPalette}>Press <kbd>⌘</kbd><kbd>K</kbd></button>
          </div>
        </div>

        <div className="hero__device">
          <span className="float float--1">⚡ Hot reload ready</span>
          <span className="float float--2">Flutter · Dart</span>
          <span className="float float--3">🔥 Firebase</span>
          <span className="float float--4">📍 Bangalore, IN</span>

          <HeroPhone />
          <p className="drag-hint" aria-hidden="true">↻ drag to spin · tap an app</p>
        </div>
      </div>
    </section>
  );
}


// A dot grid that bends away from the cursor and lights up in the accent colour.
function DotField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const GAP = 28, RADIUS = 160;
    const still = prefersReducedMotion();
    let w = 0, h = 0, mx = -1e4, my = -1e4, visible = true, raf = 0;

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const accent = getAccent();
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const dx = x - mx, dy = y - my;
          const d = Math.hypot(dx, dy) || 1;
          const f = Math.max(0, 1 - d / RADIUS);
          const e = f * f * (3 - 2 * f);
          const wave = Math.sin(x * 0.012 + t * 0.0012) * Math.cos(y * 0.014 + t * 0.0009);
          const s = 1.2 + e * 2.6 + wave * 0.4;
          ctx.globalAlpha = 0.14 + e * 0.8 + wave * 0.05;
          ctx.fillStyle = e > 0.04 ? accent : '#ffffff';
          ctx.fillRect(x + (dx / d) * e * 24 - s / 2, y + (dy / d) * e * 24 + wave * 2 - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }

    const onResize = () => { size(); if (still) draw(0); };
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });

    size();
    addEventListener('resize', onResize);
    addEventListener('pointermove', onMove, { passive: true });
    io.observe(canvas);

    if (still) {
      draw(0);
    } else {
      const loop = t => {
        raf = requestAnimationFrame(loop);
        if (visible) draw(t);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener('resize', onResize);
      removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas className="hero__field" ref={canvasRef} aria-hidden="true" />;
}


// The 3D phone: drag to spin with momentum, then it settles back to face you.
function HeroPhone() {
  const stageRef = useRef(null);
  const phoneRef = useRef(null);
  const { time, date } = useIstTime();

  useEffect(() => {
    const stage = stageRef.current;
    const el = phoneRef.current;
    const fine = hasFinePointer();

    let rx = -4, ry = -22, vx = 0, vy = 0, tiltX = 0, tiltY = 0;
    let dragging = false, moved = 0, lx = 0, ly = 0, visible = true, raf = 0;
    const nearest = (angle, base) => base + 360 * Math.round((angle - base) / 360);

    const onDown = e => {
      dragging = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
    };
    const onMove = e => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6 && !stage.hasPointerCapture(e.pointerId)) {
        stage.setPointerCapture(e.pointerId);
        stage.classList.add('is-dragging');
      }
      vy = dx * 0.45;
      vx = -dy * 0.3;
      ry += vy;
      rx = Math.min(50, Math.max(-50, rx + vx));
    };
    const onUp = () => {
      dragging = false;
      stage.classList.remove('is-dragging');
    };
    // A drag must not count as a tap on an app icon.
    const onClick = e => {
      if (moved > 6) {
        moved = 0;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const app = e.target.closest('[data-goto]');
      if (app) go(app.dataset.goto, 'center');
    };
    const onTilt = e => {
      tiltX = e.clientX / innerWidth - 0.5;
      tiltY = e.clientY / innerHeight - 0.5;
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('click', onClick, true);
    if (fine) addEventListener('pointermove', onTilt, { passive: true });
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(stage);

    if (prefersReducedMotion()) {
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    } else {
      const loop = t => {
        raf = requestAnimationFrame(loop);
        if (!visible) return;
        if (!dragging) {
          vx *= 0.93;
          vy *= 0.95;
          ry += vy;
          rx += vx;
          const baseX = -4 - tiltY * 14 + Math.sin(t / 1300) * 2;
          const baseY = -22 + tiltX * 30 + Math.sin(t / 1700) * 5;
          if (Math.abs(vy) < 1.5) ry += (nearest(ry, baseY) - ry) * 0.05;
          rx += (baseX - rx) * 0.06;
        }
        el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('click', onClick, true);
      removeEventListener('pointermove', onTilt);
    };
  }, []);

  return (
    <div className="stage" ref={stageRef}>
      <Phone phoneRef={phoneRef}>
        <HomeScreen time={time} date={date} />
      </Phone>
    </div>
  );
}
