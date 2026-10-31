import Boot from '@/components/Boot';
import Effects from '@/components/Effects';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import Work from '@/components/Work';
import Log from '@/components/Log';
import Stack from '@/components/Stack';
import Contact from '@/components/Contact';
import Palette from '@/components/Palette';

export default function Home() {
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
        <Contact />
      </main>
      <Palette />
    </>
  );
}
