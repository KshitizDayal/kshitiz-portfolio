/* eslint-disable @next/next/no-img-element */
import { EMAIL, LINKS, PROJECTS, STATOZ } from '@/lib/data';
import { GitHubIcon, LinkedInIcon, MailIcon, XIcon } from './Icons';

const LAYERS = Array.from({ length: 12 }, (_, i) => i + 1);

export function Phone({ children, phoneRef, phoneStyle }) {
  return (
    <div className="phone-box">
      <div className="phone-scale">
        <div className="phone" ref={phoneRef} style={phoneStyle}>
          {LAYERS.map(i => <i key={i} className="phone__layer" style={{ '--i': String(i) }} />)}
          <div className="phone__back">
            <div className="phone__cam"><i /><i /><i /><i /></div>
            <span className="phone__logo">K</span>
            <small>Designed &amp; built in Bangalore</small>
          </div>
          <div className="phone__front">
            <div className="phone__screen">
              {children}
              <div className="phone__island" />
              <div className="phone__glare" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/*-----------------------------------*\
  #SCREEN PARTS
\*-----------------------------------*/

function StatusBar({ time }) {
  return (
    <div className="sb">
      <span>{time}</span>
      <span className="sb__icons">
        <svg viewBox="0 0 18 12"><rect y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" width="3" height="12" rx="1" /></svg>
        <svg viewBox="0 0 16 12"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.3C13.4 1.5 10.8.5 8 .5S2.6 1.5.7 3.4L2 4.7c1.6-1.5 3.7-2.4 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.3C11.5 4.8 9.8 4.1 8 4.1s-3.5.7-4.7 1.8l1.3 1.3C5.5 6.4 6.7 5.9 8 5.9zm0 3.5c.5 0 .9.2 1.2.5L8 11.5 6.8 9.9c.3-.3.7-.5 1.2-.5z" /></svg>
        <svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="18" height="9" rx="2" /><rect x="25" y="4.5" width="1.6" height="4" rx=".8" opacity=".5" /></svg>
      </span>
    </div>
  );
}

function TabBar({ on = 0 }) {
  return (
    <div className="m-nav">
      {[0, 1, 2, 3].map(i => <i key={i} className={i === on ? 'on' : undefined} />)}
    </div>
  );
}

function AppHead({ p, end }) {
  return (
    <div className="m-head">
      {p.logo ? <img src={p.logo} alt="" /> : <span className="m-head__emoji" style={{ background: p.iconBg }}>{p.emoji}</span>}
      <span>{p.app || p.name}</span>
      <span className="m-end">{end}</span>
    </div>
  );
}

function Card({ icon, title, sub, pill, ghost, className = 'm-card' }) {
  return (
    <div className={className}>
      <span className="m-ico">{icon}</span>
      <div><p className="m-t">{title}</p><p className="m-s">{sub}</p></div>
      {pill && <span className={`m-pill${ghost ? ' m-pill--ghost' : ''}`}>{pill}</span>}
    </div>
  );
}

function Chips({ items }) {
  return (
    <div className="m-chips">
      {items.map((c, i) => <span key={c} className={`m-chip${i === 0 ? ' on' : ''}`}>{c}</span>)}
    </div>
  );
}


/*-----------------------------------*\
  #HOME SCREEN
\*-----------------------------------*/

const DOCK = [
  { href: LINKS.github, label: 'GitHub', bg: '#111', Icon: GitHubIcon },
  { href: LINKS.linkedin, label: 'LinkedIn', bg: '#0a66c2', Icon: LinkedInIcon },
  { href: LINKS.x, label: 'X', bg: '#000', Icon: XIcon },
  { href: `mailto:${EMAIL}`, label: 'Email', bg: '#ff5fa2', Icon: MailIcon },
];

export function HomeScreen({ time, date }) {
  return (
    <div className="scr scr--home is-active">
      <StatusBar time={time} />
      <div className="home__clock"><b>{time}</b><span>{date}</span></div>
      <div className="home__widget">
        <img src="/assets/images/avatar.png" alt="" />
        <div><b>Kshitiz Dayal</b><span>Flutter &amp; full-stack dev</span></div>
      </div>
      <div className="home__apps">
        <button className="app" data-goto="#statoz" aria-label="Jump to StatOz">
          <span className="app__icon app__icon--oz">Oz</span>
          <span className="app__name">StatOz</span>
        </button>
        {PROJECTS.map((p, i) => (
          <button key={p.id} className="app" data-goto={`.chapter[data-i="${i}"]`} aria-label={`Jump to ${p.name}`}>
            <span className="app__icon" style={p.iconBg ? { '--ib': p.iconBg } : undefined}>
              {p.logo ? <img src={p.logo} alt="" /> : <span className="app__emoji">{p.emoji}</span>}
            </span>
            <span className="app__name">{p.short}</span>
          </button>
        ))}
      </div>
      <div className="home__dock">
        {DOCK.map(({ href, label, bg, Icon }) => (
          <a key={label} className="app__icon" style={{ '--ib': bg }} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
            <Icon />
          </a>
        ))}
      </div>
      <div className="home__bar" />
    </div>
  );
}


/*-----------------------------------*\
  #PROJECT SCREENS
  UI reimagined for the site, not real screenshots.
\*-----------------------------------*/

function SportsBody({ p }) {
  const jobs = [
    ['⚽', 'Assistant Coach', 'Northside FC · Pune', 'Apply'],
    ['🏏', 'Strength & Conditioning', 'City Cricket Academy', 'Apply'],
    ['🏀', 'Performance Analyst', 'Hoops Arena · Remote', 'Saved'],
  ];
  return (
    <>
      <div className="m-body">
        <AppHead p={p} end="🔔" />
        <p className="m-h1">Find your next<br />role in sport.</p>
        <div className="m-search">🔍 <span>Search roles, clubs, cities</span></div>
        <Chips items={['All', 'Coaching', 'Fitness', 'Analytics']} />
        {jobs.map(([e, t, s, a]) => <Card key={t} icon={e} title={t} sub={s} pill={a} ghost={a === 'Saved'} />)}
      </div>
      <TabBar on={0} />
    </>
  );
}

function JewelBody({ p }) {
  const items = [['💍', 'Solitaire Ring', '18K · Rose gold'], ['📿', 'Temple Necklace', '22K · Antique'], ['✨', 'Kundan Jhumkas', '22K · Pair'], ['💫', 'Bridal Bangles', '22K · Set of 4']];
  return (
    <>
      <div className="m-body">
        <AppHead p={p} end="🛍️" />
        <div className="m-banner m-banner--jewel"><small>New collection</small><b>The Bridal Edit</b><span className="m-pill">Shop now</span></div>
        <Chips items={['Rings', 'Necklaces', 'Bangles', 'Earrings']} />
        <div className="m-grid">
          {items.map(([e, t, s]) => (
            <div key={t} className="m-prod"><div className="m-prod__img">{e}</div><p className="m-t">{t}</p><p className="m-s">{s}</p></div>
          ))}
        </div>
      </div>
      <TabBar on={1} />
    </>
  );
}

function SpeedBody({ p }) {
  const stories = [['🏁', 'You'], ['🏎️', 'redline'], ['🛞', 'pitlane'], ['🔥', 'drift.co'], ['🏆', 'v8club']];
  return (
    <>
      <div className="m-body">
        <AppHead p={p} end="💬" />
        <div className="m-stories">
          {stories.map(([e, n]) => <span key={n} className="m-story"><i>{e}</i>{n}</span>)}
        </div>
        <div className="m-post">
          <div className="m-post__head">
            <span className="m-ico">🏁</span>
            <div><p className="m-t">@redline.rider</p><p className="m-s">Track day · 2h</p></div>
            <span className="m-end">•••</span>
          </div>
          <div className="m-post__img"><span>🏎️</span></div>
          <div className="m-post__foot"><span>❤️ 1.2k</span><span>💬 84</span><span>↗︎</span></div>
          <p className="m-post__cap">Sunday laps. Full send. 🇺🇸</p>
        </div>
      </div>
      <TabBar on={0} />
    </>
  );
}

function PetsBody({ p }) {
  const services = [['✂️', 'Grooming', 'Bath, trim & spa'], ['🩺', 'Vet visit', 'Home or clinic'], ['🦮', 'Walks', 'Daily, 30 min'], ['🏠', 'Boarding', 'Overnight stays']];
  return (
    <>
      <div className="m-body">
        <AppHead p={p} end="🐾" />
        <div><p className="m-hi">Hi Aarav 👋</p><p className="m-h1">What does Bruno<br />need today?</p></div>
        <Card className="m-card m-pet" icon="🐶" title="Bruno" sub="Beagle · 3 yrs" pill="Change" ghost />
        <div className="m-grid">
          {services.map(([e, t, s]) => (
            <div key={t} className="m-svc"><span className="m-ico">{e}</span><p className="m-t">{t}</p><p className="m-s">{s}</p></div>
          ))}
        </div>
        <div className="m-cta">Book a slot →</div>
      </div>
      <TabBar on={0} />
    </>
  );
}

function GroupsBody({ p }) {
  const groups = [
    ['🏔️', 'Weekend Trekkers', 'Riya: Sunrise at 5:30, who’s in?', '9:12', '12'],
    ['🎨', 'Design Crit Club', 'Sam shared a file', '8:47', '3'],
    ['⚽', 'Sunday League', 'Match moved to turf 2', 'Sat', ''],
    ['📚', 'Book Nook', 'Next read: poll is live', 'Mon', '5'],
  ];
  return (
    <>
      <div className="m-body">
        <AppHead p={p} end="✏️" />
        <div className="m-search">🔍 <span>Search groups or #tags</span></div>
        <Chips items={['#trekking', '#design', '#football', '#books']} />
        <div>
          {groups.map(([e, t, s, time, n]) => (
            <div key={t} className="m-row">
              <span className="m-ico" style={{ '--ico': '#e3f6f3' }}>{e}</span>
              <div><p className="m-t">{t}</p><p className="m-s">{s}</p></div>
              <span className="m-meta">{time}{n && <><br /><span className="m-badge">{n}</span></>}</span>
            </div>
          ))}
        </div>
      </div>
      <span className="m-fab">+</span>
      <TabBar on={2} />
    </>
  );
}

// Modelled on StatOz's real prediction quiz.
export function StatOzScreen({ time }) {
  const options = [['L. Messi', 64], ['J. Álvarez', 21], ['Own goal / none', 15]];
  return (
    <div className="scr scr--statoz is-active" style={STATOZ.theme}>
      <StatusBar time={time} />
      <div className="m-body">
        <div className="m-head"><span className="oz-logo">Stat<b>Oz</b></span><span className="m-end oz-xp">+250 XP</span></div>
        <div className="oz-match"><small>GROUP J · LOCKS AT KICKOFF</small><b>ARG<i>vs</i>AUT</b></div>
        <div className="oz-progress"><i /></div>
        <p className="oz-q"><small>QUESTION 2 / 4</small>First goalscorer?</p>
        {options.map(([name, pct], i) => (
          <div key={name} className={`oz-opt${i === 0 ? ' on' : ''}`}>
            <i style={{ width: `${pct}%` }} />
            <span>{name}</span><b>{pct}%</b>
          </div>
        ))}
        <p className="m-s oz-note">12,480 predicted · XP only, never coins</p>
        <div className="m-cta">Lock my pick →</div>
      </div>
      <TabBar on={0} />
    </div>
  );
}

// Modelled on the real game: shuttle on the left, rocks scrolling in, score and pause on top.
function SpaceBody() {
  const rocks = [[18, 0], [52, -1.4], [34, -2.6], [70, -3.4]];
  return (
    <>
      <div className="space-hud">
        <div><small>SCORE</small><b>7</b></div>
        <div className="space-best"><small>BEST</small><b>11</b></div>
        <span className="space-pause">II</span>
      </div>
      <div className="space-field">
        <div className="space-stars" />
        <div className="space-hills" />
        {rocks.map(([y, delay]) => (
          <span key={y} className="space-rock" style={{ top: `${y}%`, animationDelay: `${delay}s` }}>🪨</span>
        ))}
        <span className="space-ship">🚀</span>
      </div>
      <p className="space-hint">Drag to steer · hit rocks to score</p>
    </>
  );
}

// Team chat with a task card and an HR alert, the app's three pillars on one screen.
function WrkinBody({ p }) {
  return (
    <>
      <div className="m-body">
        <AppHead p={{ ...p, app: 'Wrkin' }} end="🔔" />
        <div className="wk-tabs"><span className="on">Chats</span><span>Tasks</span><span>HR</span></div>
        <div className="wk-alert">🔔 <b>Leave approved</b><span>12–14 Nov</span></div>
        <p className="wk-channel"># design-team <span>· 8 online</span></p>
        <div className="wk-msg">
          <span className="m-ico" style={{ '--ico': '#ffe1ec' }}>👩🏻‍💻</span>
          <div className="wk-bubble">
            <p className="m-s">Priya</p>
            <p>New onboarding mockups are up 🎨</p>
            <div className="wk-media"><i /><i /><i /></div>
          </div>
        </div>
        <div className="wk-task">
          <p className="m-s">📌 TASK · DUE FRI</p>
          <p className="m-t">Review onboarding flow</p>
          <div className="wk-task__foot"><span className="m-s">Assigned to you</span><span className="m-pill">Mark done</span></div>
        </div>
        <div className="wk-bubble wk-bubble--me">On it 👍</div>
      </div>
      <div className="wk-input"><span>＋</span><p>Message #design-team</p><b>➤</b></div>
    </>
  );
}

const BODIES = { wrkin: WrkinBody, sports: SportsBody, jewel: JewelBody, speed: SpeedBody, pets: PetsBody, groups: GroupsBody, space: SpaceBody };

export function ProjectScreen({ p, time, state }) {
  const Body = BODIES[p.id];
  const cls = state === 'active' ? ' is-active' : state === 'past' ? ' is-past' : '';
  return (
    <div className={`scr scr--${p.id}${cls}`} style={p.theme}>
      <StatusBar time={time} />
      <Body p={p} />
    </div>
  );
}
