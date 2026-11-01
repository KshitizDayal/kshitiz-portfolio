import Link from 'next/link';
import { notFound } from 'next/navigation';
import Shell from '@/components/blog/Shell';
import PostChrome from '@/components/blog/PostChrome';
import { SITE_URL } from '@/lib/data';
import { getPost, getPostMeta, getPosts } from '@/lib/blog';

export function generateStaticParams() {
  return getPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostMeta(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Kshitiz Dayal`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: 'article', title: post.title, description: post.excerpt, publishedTime: post.date, authors: ['Kshitiz Dayal'] },
    twitter: { card: 'summary', title: post.title, description: post.excerpt, creator: '@14_kshitiz' },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const posts = getPosts();
  const i = posts.findIndex(p => p.slug === slug);
  const newer = posts[i - 1];
  const older = posts[i + 1];
  const url = encodeURIComponent(`${SITE_URL}/blog/${slug}`);

  return (
    <Shell posts={posts}>
      <PostChrome />
      <article className="post">
        <header className="post__head">
          <Link className="post__back blog-in" href="/blog">← All posts</Link>
          <p className="post__meta blog-in" style={{ '--d': 1 }}>
            <time dateTime={post.date}>{post.dateLabel}</time>
            <span>·</span>
            <span>{post.minutes} min read</span>
            {post.draft && <b className="badge-draft">Draft</b>}
            {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </p>
          <h1 className="post__title blog-in" style={{ '--d': 2 }}>{post.title}</h1>
          {post.excerpt && <p className="post__excerpt blog-in" style={{ '--d': 3 }}>{post.excerpt}</p>}
          <div className="post__author blog-in" style={{ '--d': 4 }}>
            <img src="/assets/images/avatar.png" alt="" width="44" height="44" />
            <span><b>Kshitiz Dayal</b><small>Co-founder, StatOz · Flutter & full-stack developer</small></span>
          </div>
        </header>

        <div className="post__body blog-in" style={{ '--d': 5 }}>
          {post.toc.length > 1 && (
            <nav className="toc" aria-label="On this page">
              <p>On this page</p>
              <ol>
                {post.toc.map(h => (
                  <li key={h.id} className={`lvl-${h.depth}`}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>

        <footer className="post__foot">
          <div className="share">
            <span>Share this post</span>
            <a href={`https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${url}&via=14_kshitiz`} target="_blank" rel="noopener noreferrer">𝕏 Post</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noopener noreferrer">in Share</a>
            <button type="button" data-copy-link>⧉ Copy link</button>
          </div>
          {(newer || older) && (
            <nav className="pager" aria-label="More posts">
              {older && <Link className="pager__prev" href={`/blog/${older.slug}`}><small>← Older</small><b>{older.title}</b></Link>}
              {newer && <Link className="pager__next" href={`/blog/${newer.slug}`}><small>Newer →</small><b>{newer.title}</b></Link>}
            </nav>
          )}
        </footer>
      </article>
    </Shell>
  );
}
