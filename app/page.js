import Boot from '@/components/Boot';
import Effects from '@/components/Effects';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import Work from '@/components/Work';
import Log from '@/components/Log';
import Stack from '@/components/Stack';
import Writing from '@/components/Writing';
import Contact from '@/components/Contact';
import Palette from '@/components/Palette';
import { getPosts } from '@/lib/blog';

export default function Home() {
  const posts = getPosts();

  return (
    <>
      <Boot />
      <Effects />
      <Nav />
      <main id="top">
        <Hero />
        <Marquee />
        <About />
        <Work />
        <Log />
        <Stack />
        <Writing posts={posts} />
        <Contact />
      </main>
      <Palette posts={posts} />
    </>
  );
}
