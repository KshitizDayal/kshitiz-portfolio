"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/site";

// [text, emphasised]
const INTRO = [
  ["I studied", false],
  ["circuits,", true],
  ["then fell for code. Since then I've been on the teams behind", false],
  ["Junglee Poker", true],
  ["and", false],
  ["Junglee Ludo,", true],
  ["built quiz games for", false],
  ["Sky Bet", true],
  ["and", false],
  ["Betfair", true],
  [", and put apps in", false],
  ["thousands of pockets.", true],
  ["Now I'm co-founding", false],
  ["StatOz,", true],
  ["still obsessed with the details you feel with your", false],
  ["thumb.", true],
];
const WORDS = INTRO.flatMap(([text, em]) =>
  text.split(" ").map((word) => ({ word, em })),
);

const STATS = [
  ["2020", "Shipping code since"],
  ["7", "Products built"],
  ["3", "Platforms: iOS, Android & web"],
];

export default function About() {
  const textRef = useRef(null);

  // Words light up one by one as the paragraph scrolls through the viewport.
  useEffect(() => {
    const el = textRef.current;
    const words = [...el.querySelectorAll(".w")];
    if (prefersReducedMotion()) {
      words.forEach((w) => w.classList.add("on"));
      return;
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const p = Math.min(
        1,
        Math.max(
          0,
          (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.25),
        ),
      );
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="section about" id="about">
      <div className="wrap">
        <p className="kicker">// 00 — Hello</p>

        <div className="about__grid">
          <p className="about__text" ref={textRef}>
            {WORDS.map(({ word, em }, i) => (
              <span key={i}>
                <span className={em ? "w em" : "w"}>{word}</span>
                {i < WORDS.length - 1 ? " " : ""}
              </span>
            ))}
          </p>

          <div className="sticker" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="sticker__ring">
              <defs>
                <path
                  id="ring"
                  d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"
                />
              </defs>
              <text>
                <textPath href="#ring">
                  FLUTTER DEV ✦ FULL-STACK ✦ BANGALORE ✦ FLUTTER DEV ✦
                  FULL-STACK ✦{" "}
                </textPath>
              </text>
            </svg>
            <img
              src="/assets/images/avatar.png"
              alt=""
              width="120"
              height="120"
            />
          </div>
        </div>

        <ul className="stats" data-reveal>
          {STATS.map(([value, label]) => (
            <li key={label} className="stat">
              <b>{value}</b>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
