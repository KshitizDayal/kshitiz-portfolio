---
title: How I built this portfolio
date: 2026-11-01
excerpt: A phone made of twelve CSS layers, a physics pit for my tech stack and a career log that reads like git. Here's how the pieces of this site work.
tags: [Next.js, CSS, Web]
---

Most developer portfolios are a resume with a nicer font. I wanted mine to feel like the things I actually build: apps you hold, poke and play with. So instead of a page of bullet points, this site has a phone you can spin, a pit of tech-stack chips you can throw around and a career history that prints like `git log`.

None of it needs a 3D engine or an animation library. Here's how the main pieces work.

## The stack

The site is a **Next.js App Router** project, rendered to static HTML at build time and hosted on Vercel. Almost every section is a client component, because nearly everything on the page reacts to your cursor, your scroll or your keyboard.

The only runtime dependency beyond React is [matter-js](https://brm.io/matter-js/), and even that only loads when you scroll down to the stack section.

## A phone made of twelve layers

The phone in the hero isn't a 3D model. It's a stack of twelve flat `div`s, each pushed a little further back along the Z axis:

```css:globals.css
.phone__layer {
  position: absolute;
  inset: 0;
  border-radius: 50px;
  background: #2b2b31;
  transform: translateZ(calc(var(--i) * -1.3px));
}

.phone__layer:nth-child(odd) {
  background: #35353c;
}
```

Each layer gets its index as a CSS variable, `--i`, so the whole stack is one line of maths. Put `transform-style: preserve-3d` on the parent and `perspective` on the wrapper, and when the phone rotates, those layers read as a solid metal edge. Alternating the colour of odd layers gives it a subtle brushed look.

Dragging the phone spins it, and letting go hands that speed to a small inertia loop: the spin decays every frame, then the phone eases back to face you, leaning slightly towards your cursor. The screens inside are plain HTML too, so every app icon is a real button that scrolls you to its project.

## The physics pit

The stack section drops every technology I use into a box and lets gravity sort it out. The chips are ordinary HTML elements. matter-js only does the maths:

1. Measure every chip and create a matching rounded rectangle body.
2. Run the physics engine on a fixed time step.
3. Copy each body's position and angle back onto its chip with a CSS transform.

```js:components/Stack.js
for (const b of bodies) {
  const { el, cw, ch } = b.plugin.chip;
  const { x, y } = b.position;
  el.style.transform = `translate(${x - cw / 2}px, ${y - ch / 2}px) rotate(${b.angle}rad)`;
}
```

Because the chips stay in the DOM, they keep real text, real fonts and real accessibility. The pit also grows its height to fit however many chips there are, so adding a new skill never makes it overflow on a phone.

> The trick to good-looking physics is boring: a fixed time step, a few extra solver iterations and resetting anything that escapes the box.

## A career log that reads like git

My work history is a terminal running `git log --graph`. Each job is a commit, my engineering degree is a branch that merges back into `main`, and the current role sits at `HEAD`. The graph lines are SVG paths that draw themselves in as you scroll, using `pathLength` so every line animates at the same pace no matter how long it is.

## Small things you can find

- Press `⌘K` (or `/`) for a command palette that can take you anywhere on the site.
- Press `R` for a "hot reload" that swaps the accent colour, just like Flutter's.
- The first visit plays a fake `flutter run` boot screen. It only plays once per session, and it's skipped entirely if your system asks for reduced motion.

That last point matters. The big effects check `prefers-reduced-motion` and calm down when your system asks them to. Playful should never mean unusable.

## What's next

This blog is the newest piece. I'll be writing here about Flutter, games, web development and what I learn building [StatOz](https://www.statoz.in/). If something here helped you, or you think I got it wrong, I'd love to hear about it.
