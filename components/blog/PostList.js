import Link from 'next/link';

const pad = n => String(n).padStart(2, '0');

// One row per post: number, meta, title, excerpt, tags and an arrow that turns on hover.
export default function PostList({ posts, animate = false }) {
  if (!posts.length) return <p className="posts__empty">$ ls posts/ → nothing here yet. The first one is compiling.</p>;

  return (
    <ol className="posts">
      {posts.map((p, i) => (
        <li key={p.slug} className={animate ? 'blog-in' : undefined} style={animate ? { '--d': i + 2 } : undefined}>
          <Link href={`/blog/${p.slug}`} className="post-row">
            <span className="post-row__idx">{pad(i + 1)}</span>
            <span className="post-row__main">
              <span className="post-row__meta">
                <time dateTime={p.date}>{p.dateLabel}</time>
                <span>·</span>
                <span>{p.minutes} min read</span>
                {p.draft && <b className="badge-draft">Draft</b>}
              </span>
              <span className="post-row__title">{p.title}</span>
              {p.excerpt && <span className="post-row__excerpt">{p.excerpt}</span>}
            </span>
            <span className="post-row__tags">
              {p.tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </span>
            <span className="post-row__go" aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
