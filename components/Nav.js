'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { openPalette } from '@/lib/site';

const LINKS = [['#work', 'Work'], ['#log', 'Log'], ['#stack', 'Stack'], ['/blog', 'Blog'], ['#contact', 'Contact']];

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const home = pathname === '/';

  // Slide away while scrolling down, come back on the way up.
  useEffect(() => {
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      setHidden(y > lastY && y > 240);
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav${hidden ? ' is-hidden' : ''}`}>
      <a href={home ? '#top' : '/'} className="nav__brand" aria-label={home ? 'Kshitiz Dayal, back to top' : 'Kshitiz Dayal, home'}>
        <span className="nav__mark">K</span>
        <span className="nav__name">Kshitiz Dayal</span>
      </a>
      <nav className="nav__links" aria-label="Sections">
        {LINKS.map(([href, label]) => href.startsWith('/')
          ? <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}>{label}</Link>
          : <a key={href} href={home ? href : `/${href}`}>{label}</a>)}
      </nav>
      <button className="nav__cmd" onClick={openPalette} aria-label="Open command palette">
        <span className="nav__cmd-label">Menu</span><kbd>⌘</kbd><kbd>K</kbd>
      </button>
    </header>
  );
}
