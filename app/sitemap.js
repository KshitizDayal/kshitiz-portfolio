import { SITE_URL } from '@/lib/data';
import { getPosts } from '@/lib/blog';

export default function sitemap() {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/blog`, priority: 0.8 },
    ...getPosts().map(p => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date, priority: 0.6 })),
  ];
}
