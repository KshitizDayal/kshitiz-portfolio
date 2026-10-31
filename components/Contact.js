"use client";

import { EMAIL, LINKS, PHONE } from "@/lib/data";
import { copyEmail } from "@/lib/site";
import { useIstTime } from "@/lib/useIstTime";
import { GitHubIcon, LinkedInIcon, XIcon } from "./Icons";

const SOCIALS = [
  [LINKS.github, "GitHub", GitHubIcon],
  [LINKS.linkedin, "LinkedIn", LinkedInIcon],
  [LINKS.x, "X (Twitter)", XIcon],
];

export default function Contact() {
  const { time } = useIstTime();

  return (
    <section className="section contact" id="contact">
      <div className="wrap">
        <p className="kicker">// 04 — Contact</p>

        <div className="contact__row">
          <a className="magnet" href={`mailto:${EMAIL}`} data-magnet>
            <span>Say hi ↗</span>
          </a>

          <div className="contact__info">
            <button className="copy" onClick={copyEmail}>
              {EMAIL}
              <small>click to copy</small>
            </button>
            <a className="contact__line" href={PHONE.href}>
              {PHONE.label}
            </a>
            <p className="contact__line">📍 Bangalore, India · {time} IST</p>
            <ul className="socials">
              {SOCIALS.map(([href, label, Icon]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="giant" aria-hidden="true">
          KSHITIZ
        </p>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Kshitiz Dayal.</span>
          <span className="footer__keys">
            Press <kbd>R</kbd> for hot reload · <kbd>⌘K</kbd> for everything
            else
          </span>
        </footer>
      </div>
    </section>
  );
}
