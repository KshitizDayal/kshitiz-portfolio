import { ACCENTS, EMAIL } from './data';

/*
 * Small site-wide actions shared by the palette, keyboard shortcuts and sections.
 * They touch the DOM directly, so only call them from client components.
 */

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hasFinePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

let accentIndex = 0;
export const getAccent = () => ACCENTS[accentIndex];

let pit = null;
export function registerPit(api) {
  pit = api;
  return () => {
    if (pit === api) pit = null;
  };
}

export const openPalette = () => window.dispatchEvent(new Event('palette:open'));

// Scrolls to a home page section, or heads home first when it isn't on this page (e.g. from the blog).
export function go(selector, block = 'start') {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
  else if (selector.startsWith('#')) location.href = `/${selector}`;
}

export const openLink = url => window.open(url, '_blank', 'noopener');

let toastTimer;
export function toast(message) {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast('Email copied. Talk soon ✌️');
  } catch {
    toast(EMAIL);
  }
}

function restart(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

export function hotReload() {
  accentIndex = (accentIndex + 1) % ACCENTS.length;
  document.documentElement.style.setProperty('--accent', ACCENTS[accentIndex]);
  const flash = document.querySelector('.flash');
  flash && restart(flash, 'go');
  restart(document.body, 'is-reloading');
  setTimeout(() => document.body.classList.remove('is-reloading'), 450);
  toast(`⚡ Reloaded 1 of 1 libraries in ${Math.round(180 + Math.random() * 240)}ms`);
}

export function flipGravity() {
  if (!pit) {
    toast('Gravity is switched off on this device.');
    return;
  }
  go('#stack');
  toast(pit.flip() ? 'Gravity flipped 🙃' : 'Gravity restored 🙂');
}

export function confetti() {
  const canvas = document.querySelector('.confetti');
  if (!canvas || prefersReducedMotion()) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = innerWidth, H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = [...ACCENTS, '#ffffff'];
  const parts = Array.from({ length: 220 }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? -10 : W + 10,
      y: H * 0.8,
      vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 13),
      vy: -(11 + Math.random() * 15),
      w: 6 + Math.random() * 8,
      h: 9 + Math.random() * 10,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[i % colors.length],
    };
  });

  const start = performance.now();
  (function tick(now) {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.4;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y < H + 40) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.cos(p.r * 2));
      ctx.restore();
    }
    if (alive && now - start < 6000) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  })(start);
}

export function hire() {
  confetti();
  toast('Permission granted. Opening your mail app…');
  setTimeout(() => {
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's build something together")}`;
  }, 1400);
}
