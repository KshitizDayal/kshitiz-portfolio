import Link from 'next/link';
import PostList from './blog/PostList';

const LATEST = 3;

// Home page teaser for the blog: the latest few posts and a way into the rest.
export default function Writing({ posts }) {
  return (
    <section className="section writing" id="writing">
      <div className="wrap">
        <p className="kicker">// 04 — Writing</p>
        <div className="writing__head">
          <h2 className="h2" data-reveal>Thoughts,<br /><em>compiled.</em></h2>
          <p className="writing__lead" data-reveal>
            Notes on Flutter, the web, games and building a product from zero. Written down so I stop re-learning them.
          </p>
        </div>
        <div data-reveal>
          <PostList posts={posts.slice(0, LATEST)} />
        </div>
        <Link className="btn btn--ghost writing__all" href="/blog">
          {posts.length > LATEST ? `All ${posts.length} posts` : 'Visit the blog'} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
