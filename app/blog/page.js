import Shell from '@/components/blog/Shell';
import BlogIndex from '@/components/blog/BlogIndex';
import { getPosts } from '@/lib/blog';

export const metadata = {
  title: 'Blog — Kshitiz Dayal',
  description: 'Notes on Flutter, the web, games and building StatOz, by Kshitiz Dayal.',
  alternates: { canonical: '/blog', types: { 'application/rss+xml': '/blog/rss.xml' } },
};

export default function BlogPage() {
  const posts = getPosts();

  return (
    <Shell posts={posts}>
      <header className="blog-hero">
        <div className="wrap">
          <p className="kicker blog-in">// blog · ~/kshitiz/notes</p>
          <h1 className="blog-hero__title blog-in" style={{ '--d': 1 }}>Writ<em>ing.</em></h1>
          <div className="blog-hero__row blog-in" style={{ '--d': 2 }}>
            <p className="blog-hero__lead">
              Things I learn building apps, games and the platforms behind them. Flutter, the web, tech and the occasional rabbit hole.
            </p>
            <a className="rss" href="/blog/rss.xml"><span aria-hidden="true">◉</span> RSS feed</a>
          </div>
        </div>
      </header>
      <BlogIndex posts={posts} />
    </Shell>
  );
}
