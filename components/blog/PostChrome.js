'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@/lib/site';

// The interactive bits of a post page: reading progress, copy buttons and the active heading in the contents list.
export default function PostChrome() {
  const barRef = useRef(null);

  useEffect(() => {
    const article = document.querySelector('.post');
    const bar = barRef.current;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = article.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      bar.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => { raf ||= requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const onClick = async e => {
      const btn = e.target.closest('.code__copy, [data-copy-link]');
      if (!btn) return;
      const text = btn.matches('.code__copy') ? btn.closest('.code').querySelector('pre').textContent : location.href.split('#')[0];
      try {
        await navigator.clipboard.writeText(text);
        if (btn.matches('.code__copy')) {
          btn.textContent = 'Copied ✓';
          btn.classList.add('is-copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-copied'); }, 1600);
        } else {
          toast('Link copied. Share away ✌️');
        }
      } catch {
        toast('Copy failed. Your browser said no.');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const links = new Map([...document.querySelectorAll('.toc a')].map(a => [a.hash.slice(1), a]));
    if (!links.size) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('is-active'));
        links.get(e.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    links.forEach((_, id) => { const h = document.getElementById(id); h && io.observe(h); });
    return () => io.disconnect();
  }, []);

  return <div className="progress" aria-hidden="true"><i ref={barRef} /></div>;
}
