'use client';

import { useState } from 'react';
import PostList from './PostList';

// The full post list with tag filters. Only shows filters once there's something to filter.
export default function BlogIndex({ posts }) {
  const [tag, setTag] = useState(null);
  const tags = [...new Set(posts.flatMap(p => p.tags))].sort();
  const shown = tag ? posts.filter(p => p.tags.includes(tag)) : posts;

  return (
    <section className="blog-list">
      <div className="wrap">
        {tags.length > 1 && (
          <div className="filters blog-in" style={{ '--d': 2 }} role="group" aria-label="Filter posts by tag">
            <button className="filter" aria-pressed={!tag} onClick={() => setTag(null)}>All <small>{posts.length}</small></button>
            {tags.map(t => (
              <button key={t} className="filter" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                #{t} <small>{posts.filter(p => p.tags.includes(t)).length}</small>
              </button>
            ))}
          </div>
        )}
        <PostList posts={shown} animate />
      </div>
    </section>
  );
}
