import Link from 'next/link';
import Boot from '../Boot';
import Effects from '../Effects';
import Nav from '../Nav';
import Palette from '../Palette';
import { EMAIL } from '@/lib/data';

// Everything a blog page shares with the home page (cursor, nav, ⌘K), minus the sections.
export default function Shell({ posts, children }) {
  return (
    <>
      <Boot />
      <Effects />
      <Nav />
      <main id="top" className="blog">
        {children}
        <footer className="blog-foot">
          <div className="wrap">
            <span>© {new Date().getFullYear()} Kshitiz Dayal · <a href={`mailto:${EMAIL}`}>Say hi ↗</a></span>
            <span><Link href="/blog">All posts</Link> · <a href="/">Back to the portfolio</a> · <a href="/blog/rss.xml">RSS</a></span>
          </div>
        </footer>
      </main>
      <Palette posts={posts} />
    </>
  );
}
