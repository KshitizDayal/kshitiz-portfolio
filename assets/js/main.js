(() => {
  'use strict';

  /*-----------------------------------*\
    #HELPERS
  \*-----------------------------------*/

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, '0');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  const EMAIL = 'kshitizdayal14@gmail.com';
  const LINKS = {
    github: 'https://github.com/KshitizDayal',
    linkedin: 'https://www.linkedin.com/in/kshitizdayal/',
    x: 'https://x.com/14_kshitiz',
  };
  const IMG = 'assets/images/';
  const ACCENTS = ['#d7ff3a', '#3dd5ff', '#ff5fa2', '#ff8a3d', '#b18cff'];
  let accentIndex = 0;
  let pit = null;


  /*-----------------------------------*\
    #PROJECTS
  \*-----------------------------------*/

  const PROJECTS = [
    {
      name: 'Sports Connect', short: 'Sports', logo: 'sports_connect_logo.png', ink: '#ffc21a',
      tag: 'Jobs platform', kicker: 'Where sport gets hired.',
      desc: 'A job listing platform built for sports personnel.',
      theme: '--sbg:#0e1526;--fg:#fff;--card:#1a2338;--sub:#8b96ad;--a:#ffc21a;--on-a:#1a1200',
      screen: sportsScreen,
    },
    {
      name: 'Sumangali Jewels Paragon', short: 'Sumangali', app: 'Sumangali', logo: 'sumangali_logo.png', ink: '#e8b96a',
      tag: 'E-commerce', kicker: 'Gold, in your pocket.',
      desc: 'An e-commerce platform for a jewellery store.',
      theme: '--sbg:#fbf5ee;--fg:#3b0d0d;--card:#fff;--sub:#9a7b6b;--a:#7a1f1f;--on-a:#fff;--shadow:0 4px 14px rgba(122,31,31,.08)',
      screen: jewelScreen,
    },
    {
      name: 'American Speed', short: 'AmSpeed', logo: 'american_speed_logo.png', ink: '#ff4b5c',
      tag: 'Social', kicker: 'Social, at full throttle.',
      desc: 'A social media app for sports enthusiasts.',
      theme: '--sbg:#0a0a0a;--fg:#fff;--card:#1a1a1a;--sub:#8a8a8a;--a:#e0283d;--on-a:#fff',
      screen: speedScreen,
    },
    {
      name: 'Easy Hai Bro', short: 'EasyHaiBro', logo: 'ehb_logo.png', ink: '#ffe45c',
      tag: 'Pet services', kicker: 'Easy for pets. Easier for owners.',
      desc: 'A platform for pet owners to book services for their pets.',
      theme: '--sbg:#fff;--fg:#111;--card:#f3f3f1;--sub:#7a7a75;--a:#111;--on-a:#fff',
      screen: petScreen,
    },
    {
      name: 'MEATS', short: 'MEATS', logo: 'meats_logo.png', ink: '#ff6b8b',
      tag: 'Food', kicker: 'Food people, found.',
      desc: 'A platform for food enthusiasts.',
      theme: '--sbg:#1f0610;--fg:#fff;--card:#34101e;--sub:#c49aab;--a:#ff4d6d;--on-a:#fff',
      screen: foodScreen,
    },
    {
      name: 'GroupsTag', short: 'GroupsTag', logo: 'groupstag_logo.png', ink: '#3fd0bf',
      tag: 'Social', kicker: 'Your groups, tagged and together.',
      desc: 'A social media app for groups.',
      theme: '--sbg:#f4fbfa;--fg:#0f2a27;--card:#fff;--sub:#6b8a86;--a:#2bb5a6;--on-a:#fff;--shadow:0 4px 14px rgba(15,42,39,.06)',
      screen: groupScreen,
    },
  ];


  /*-----------------------------------*\
    #PHONE + SCREENS
  \*-----------------------------------*/

  const ICON = {
    signal: '<svg viewBox="0 0 18 12"><rect y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg>',
    wifi: '<svg viewBox="0 0 16 12"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.3C13.4 1.5 10.8.5 8 .5S2.6 1.5.7 3.4L2 4.7c1.6-1.5 3.7-2.4 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.3C11.5 4.8 9.8 4.1 8 4.1s-3.5.7-4.7 1.8l1.3 1.3C5.5 6.4 6.7 5.9 8 5.9zm0 3.5c.5 0 .9.2 1.2.5L8 11.5 6.8 9.9c.3-.3.7-.5 1.2-.5z"/></svg>',
    battery: '<svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2"/><rect x="25" y="4.5" width="1.6" height="4" rx=".8" opacity=".5"/></svg>',
  };

  const statusBar = () => `<div class="sb"><span data-time>9:41</span><span class="sb__icons">${ICON.signal}${ICON.wifi}${ICON.battery}</span></div>`;
  const tabBar = (on = 0) => `<div class="m-nav">${[0, 1, 2, 3].map(i => `<i class="${i === on ? 'on' : ''}"></i>`).join('')}</div>`;
  const appHead = (p, end = '') => `<div class="m-head"><img src="${IMG + p.logo}" alt=""><span>${p.app || p.name}</span><span class="m-end">${end}</span></div>`;

  function phone(screens) {
    const layers = Array.from({ length: 12 }, (_, i) => `<i class="phone__layer" style="--i:${i + 1}"></i>`).join('');
    return `<div class="phone">
      ${layers}
      <div class="phone__back"><div class="phone__cam"><i></i><i></i><i></i><i></i></div><span class="phone__logo">K</span><small>Designed &amp; built in Bangalore</small></div>
      <div class="phone__front"><div class="phone__screen">${screens}<div class="phone__island"></div><div class="phone__glare"></div></div></div>
    </div>`;
  }

  const phoneBox = screens => `<div class="phone-box"><div class="phone-scale">${phone(screens)}</div></div>`;
  const projectScreen = (p, active) => `<div class="scr${active ? ' is-active' : ''}" style="${p.theme}">${p.screen(p)}</div>`;

  function homeScreen() {
    const apps = PROJECTS.map((p, i) => `
      <button class="app" data-goto="${i}" aria-label="Jump to ${p.name}">
        <span class="app__icon"><img src="${IMG + p.logo}" alt=""></span>
        <span class="app__name">${p.short}</span>
      </button>`).join('');
    const dock = [
      [LINKS.github, 'logo-github', 'GitHub', '#111'],
      [LINKS.linkedin, 'logo-linkedin', 'LinkedIn', '#0a66c2'],
      [LINKS.x, 'logo-twitter', 'X', '#000'],
      [`mailto:${EMAIL}`, 'mail', 'Email', '#ff5fa2'],
    ].map(([href, icon, label, bg]) => `<a class="app__icon" style="--ib:${bg}" href="${href}" target="_blank" rel="noopener" aria-label="${label}"><ion-icon name="${icon}"></ion-icon></a>`).join('');

    return `<div class="scr scr--home is-active">
      ${statusBar()}
      <div class="home__clock"><b data-time>09:41</b><span data-date>Today</span></div>
      <div class="home__widget"><img src="${IMG}avatar.png" alt=""><div><b>Kshitiz Dayal</b><span>Flutter &amp; full-stack dev</span></div></div>
      <div class="home__apps">${apps}</div>
      <div class="home__dock">${dock}</div>
      <div class="home__bar"></div>
    </div>`;
  }

  function sportsScreen(p) {
    const jobs = [
      ['⚽', 'Assistant Coach', 'Northside FC · Pune', 'Apply'],
      ['🏏', 'Strength & Conditioning', 'City Cricket Academy', 'Apply'],
      ['🏀', 'Performance Analyst', 'Hoops Arena · Remote', 'Saved'],
    ];
    return `${statusBar()}<div class="m-body">
      ${appHead(p, '🔔')}
      <p class="m-h1">Find your next<br>role in sport.</p>
      <div class="m-search">🔍 <span>Search roles, clubs, cities</span></div>
      <div class="m-chips"><span class="m-chip on">All</span><span class="m-chip">Coaching</span><span class="m-chip">Fitness</span><span class="m-chip">Analytics</span></div>
      ${jobs.map(([e, t, s, a]) => `<div class="m-card"><span class="m-ico">${e}</span><div><p class="m-t">${t}</p><p class="m-s">${s}</p></div><span class="m-pill${a === 'Saved' ? ' m-pill--ghost' : ''}">${a}</span></div>`).join('')}
    </div>${tabBar(0)}`;
  }

  function jewelScreen(p) {
    const items = [['💍', 'Solitaire Ring', '18K · Rose gold'], ['📿', 'Temple Necklace', '22K · Antique'], ['✨', 'Kundan Jhumkas', '22K · Pair'], ['💫', 'Bridal Bangles', '22K · Set of 4']];
    return `${statusBar()}<div class="m-body">
      ${appHead(p, '🛍️')}
      <div class="m-banner m-banner--jewel"><small>New collection</small><b>The Bridal Edit</b><span class="m-pill">Shop now</span></div>
      <div class="m-chips"><span class="m-chip on">Rings</span><span class="m-chip">Necklaces</span><span class="m-chip">Bangles</span><span class="m-chip">Earrings</span></div>
      <div class="m-grid">${items.map(([e, t, s]) => `<div class="m-prod"><div class="m-prod__img">${e}</div><p class="m-t">${t}</p><p class="m-s">${s}</p></div>`).join('')}</div>
    </div>${tabBar(1)}`;
  }

  function speedScreen(p) {
    const stories = [['🏁', 'You'], ['🏎️', 'redline'], ['🛞', 'pitlane'], ['🔥', 'drift.co'], ['🏆', 'v8club']];
    return `${statusBar()}<div class="m-body">
      ${appHead(p, '💬')}
      <div class="m-stories">${stories.map(([e, n]) => `<span class="m-story"><i>${e}</i>${n}</span>`).join('')}</div>
      <div class="m-post">
        <div class="m-post__head"><span class="m-ico">🏁</span><div><p class="m-t">@redline.rider</p><p class="m-s">Track day · 2h</p></div><span class="m-end" style="margin-left:auto">•••</span></div>
        <div class="m-post__img"><span>🏎️</span></div>
        <div class="m-post__foot"><span>❤️ 1.2k</span><span>💬 84</span><span>↗︎</span></div>
        <p class="m-post__cap">Sunday laps. Full send. 🇺🇸</p>
      </div>
    </div>${tabBar(0)}`;
  }

  function petScreen(p) {
    const services = [['✂️', 'Grooming', 'Bath, trim & spa'], ['🩺', 'Vet visit', 'Home or clinic'], ['🦮', 'Walks', 'Daily, 30 min'], ['🏠', 'Boarding', 'Overnight stays']];
    return `${statusBar()}<div class="m-body">
      ${appHead(p, '🐾')}
      <div><p class="m-hi">Hi Aarav 👋</p><p class="m-h1">What does Bruno<br>need today?</p></div>
      <div class="m-card m-pet"><span class="m-ico">🐶</span><div><p class="m-t">Bruno</p><p class="m-s">Beagle · 3 yrs</p></div><span class="m-pill m-pill--ghost">Change</span></div>
      <div class="m-grid">${services.map(([e, t, s]) => `<div class="m-svc"><span class="m-ico">${e}</span><p class="m-t">${t}</p><p class="m-s">${s}</p></div>`).join('')}</div>
      <div class="m-cta">Book a slot →</div>
    </div>${tabBar(0)}`;
  }

  function foodScreen(p) {
    const spots = [['🍗', 'Fire Wings Lab', 'Wings · 2.1 km', '4.6'], ['🥩', 'Grill District', 'BBQ · 3.4 km', '4.7'], ['🌮', 'Taco Tuesday', 'Mexican · 0.8 km', '4.5']];
    return `${statusBar()}<div class="m-body">
      ${appHead(p, '❤️')}
      <p class="m-h1">Trending near you 🔥</p>
      <div class="m-feature"><div class="m-feature__img">🍔</div><div class="m-feature__txt"><p class="m-t">Smash Burger Co.</p><p class="m-s">★ 4.8 · Burgers · 1.2 km</p></div></div>
      <div>${spots.map(([e, t, s, r]) => `<div class="m-row"><span class="m-ico">${e}</span><div><p class="m-t">${t}</p><p class="m-s">${s}</p></div><span class="m-pill">★ ${r}</span></div>`).join('')}</div>
    </div>${tabBar(0)}`;
  }

  function groupScreen(p) {
    const groups = [
      ['🏔️', 'Weekend Trekkers', 'Riya: Sunrise at 5:30, who’s in?', '9:12', '12'],
      ['🎨', 'Design Crit Club', 'Sam shared a file', '8:47', '3'],
      ['⚽', 'Sunday League', 'Match moved to turf 2', 'Sat', ''],
      ['📚', 'Book Nook', 'Next read: poll is live', 'Mon', '5'],
    ];
    return `${statusBar()}<div class="m-body">
      ${appHead(p, '✏️')}
      <div class="m-search">🔍 <span>Search groups or #tags</span></div>
      <div class="m-chips"><span class="m-chip on">#trekking</span><span class="m-chip">#design</span><span class="m-chip">#football</span><span class="m-chip">#books</span></div>
      <div>${groups.map(([e, t, s, time, n]) => `<div class="m-row"><span class="m-ico" style="--ico:#e3f6f3">${e}</span><div><p class="m-t">${t}</p><p class="m-s">${s}</p></div><span class="m-meta">${time}${n ? `<br><span class="m-badge">${n}</span>` : ''}</span></div>`).join('')}</div>
    </div><span class="m-fab">+</span>${tabBar(2)}`;
  }


  /*-----------------------------------*\
    #HERO PHONE (drag to spin)
  \*-----------------------------------*/

  function initHeroPhone() {
    const stage = $('[data-hero-stage]');
    stage.innerHTML = phoneBox(homeScreen());
    const el = $('.phone', stage);

    let rx = -4, ry = -22, vx = 0, vy = 0;
    let tiltX = 0, tiltY = 0;
    let dragging = false, moved = 0, lx = 0, ly = 0, visible = true;

    const nearest = (angle, base) => base + 360 * Math.round((angle - base) / 360);

    stage.addEventListener('pointerdown', e => {
      dragging = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
    });

    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6 && !stage.hasPointerCapture(e.pointerId)) {
        stage.setPointerCapture(e.pointerId);
        stage.classList.add('is-dragging');
      }
      vy = dx * 0.45;
      vx = -dy * 0.3;
      ry += vy;
      rx = clamp(rx + vx, -50, 50);
    });

    const release = () => {
      dragging = false;
      stage.classList.remove('is-dragging');
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    // A drag must not count as a tap on an app icon.
    stage.addEventListener('click', e => {
      if (moved > 6) {
        moved = 0;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const app = e.target.closest('[data-goto]');
      if (app) {
        const target = $(`.chapter[data-i="${app.dataset.goto}"]`);
        target && target.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
      }
    }, true);

    if (finePointer) {
      addEventListener('pointermove', e => {
        tiltX = e.clientX / innerWidth - 0.5;
        tiltY = e.clientY / innerHeight - 0.5;
      }, { passive: true });
    }

    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(stage);

    if (reduceMotion) {
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      return;
    }

    (function loop(t) {
      requestAnimationFrame(loop);
      if (!visible) return;
      if (!dragging) {
        vx *= 0.93;
        vy *= 0.95;
        ry += vy;
        rx += vx;
        const baseX = -4 - tiltY * 14 + Math.sin(t / 1300) * 2;
        const baseY = -22 + tiltX * 30 + Math.sin(t / 1700) * 5;
        if (Math.abs(vy) < 1.5) ry += (nearest(ry, baseY) - ry) * 0.05;
        rx += (baseX - rx) * 0.06;
      }
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    })(0);
  }


  /*-----------------------------------*\
    #HERO FIELD (dot grid that reacts to the cursor)
  \*-----------------------------------*/

  function initField() {
    const canvas = $('.hero__field');
    const ctx = canvas.getContext('2d');
    const GAP = 28, RADIUS = 160;
    let w = 0, h = 0, mx = -1e4, my = -1e4, visible = true;

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const accent = ACCENTS[accentIndex];
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const dx = x - mx, dy = y - my;
          const d = Math.hypot(dx, dy) || 1;
          const f = Math.max(0, 1 - d / RADIUS);
          const e = f * f * (3 - 2 * f);
          const wave = Math.sin(x * 0.012 + t * 0.0012) * Math.cos(y * 0.014 + t * 0.0009);
          const px = x + (dx / d) * e * 24;
          const py = y + (dy / d) * e * 24 + wave * 2;
          const s = 1.2 + e * 2.6 + wave * 0.4;
          ctx.globalAlpha = 0.14 + e * 0.8 + wave * 0.05;
          ctx.fillStyle = e > 0.04 ? accent : '#ffffff';
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }

    size();
    addEventListener('resize', () => { size(); if (reduceMotion) draw(0); });
    addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }, { passive: true });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

    if (reduceMotion) {
      draw(0);
      return;
    }

    (function loop(t) {
      requestAnimationFrame(loop);
      if (visible) draw(t);
    })(0);
  }


  /*-----------------------------------*\
    #WORK (sticky phone, chapters swap its screen)
  \*-----------------------------------*/

  function initWork() {
    const section = $('#work');
    const list = $('[data-chapters]');
    const mount = $('[data-work-phone]');

    list.innerHTML = PROJECTS.map((p, i) => `
      <article class="chapter${i === 0 ? ' is-active' : ''}" data-i="${i}" style="--a:${p.ink}">
        <div class="chapter__phone" aria-hidden="true">${phoneBox(projectScreen(p, true))}</div>
        <p class="chapter__idx"><b>${pad(i + 1)}</b> / ${pad(PROJECTS.length)} · ${p.tag}</p>
        <h3 class="chapter__name">${p.name}</h3>
        <p class="chapter__kicker">${p.kicker}</p>
        <p class="chapter__desc">${p.desc}</p>
      </article>`).join('');

    mount.innerHTML = phoneBox(PROJECTS.map((p, i) => projectScreen(p, i === 0)).join(''));
    mount.setAttribute('aria-hidden', 'true');

    const screens = $$('.scr', mount);
    const phoneEl = $('.phone', mount);
    const chapters = $$('.chapter', list);
    const counter = $('[data-counter]');
    let current = -1;

    function setActive(i) {
      if (i === current) return;
      current = i;
      chapters.forEach((c, j) => c.classList.toggle('is-active', j === i));
      screens.forEach((s, j) => {
        s.classList.toggle('is-active', j === i);
        s.classList.toggle('is-past', j < i);
      });
      section.style.setProperty('--pa', PROJECTS[i].ink);
      counter.textContent = pad(i + 1);
      const dir = i % 2 ? 1 : -1;
      phoneEl.style.transform = `rotateY(${dir * 16}deg) rotateX(6deg) rotateZ(${-dir * 2}deg)`;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && setActive(+e.target.dataset.i));
    }, { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach(c => io.observe(c));
    setActive(0);
  }


  /*-----------------------------------*\
    #MARQUEE (speeds up with scroll velocity)
  \*-----------------------------------*/

  function initMarquee() {
    const tracks = $$('[data-marquee]');
    tracks.forEach(t => { t.innerHTML += t.innerHTML; });
    if (reduceMotion) return;

    let widths = [];
    const measure = () => { widths = tracks.map(t => t.scrollWidth / 2); };
    measure();
    addEventListener('resize', measure);
    document.fonts && document.fonts.ready.then(measure);

    let x = 0, lastY = scrollY, vel = 0, visible = false;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe($('.marquee'));

    (function loop() {
      requestAnimationFrame(loop);
      const dy = scrollY - lastY;
      lastY = scrollY;
      vel += (dy - vel) * 0.1;
      if (!visible) return;
      x += 0.8 + Math.abs(vel) * 0.4;
      tracks.forEach((t, i) => {
        const o = x % widths[i];
        t.style.transform = `translateX(${i % 2 ? o - widths[i] : -o}px)`;
      });
    })();
  }


  /*-----------------------------------*\
    #ABOUT (words light up as you scroll)
  \*-----------------------------------*/

  function initWords() {
    const el = $('[data-words]');
    const words = [];
    const frag = document.createDocumentFragment();

    [...el.childNodes].forEach(node => {
      const isEm = node.nodeName === 'EM';
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(' ');
          return;
        }
        const span = document.createElement('span');
        span.className = isEm ? 'w em' : 'w';
        span.textContent = part;
        frag.append(span);
        words.push(span);
      });
    });
    el.textContent = '';
    el.append(frag);

    if (reduceMotion) {
      words.forEach(w => w.classList.add('on'));
      return;
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.25), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }


  /*-----------------------------------*\
    #LOG (git graph)
  \*-----------------------------------*/

  function initGraph() {
    const body = $('.term__body');
    const svg = $('[data-graph]');
    const rows = $$('.commit', body);
    rows.forEach((r, i) => r.style.setProperty('--d', `${0.2 + i * 0.18}s`));

    function draw() {
      const box = body.getBoundingClientRect();
      const pts = rows.map(r => {
        const n = $('.node', r).getBoundingClientRect();
        return { x: n.left + n.width / 2 - box.left, y: n.top + n.height / 2 - box.top, lane: +r.dataset.lane };
      });
      const main = pts.filter(p => p.lane === 0);
      const edu = pts.find(p => p.lane === 1);
      const merge = pts[rows.findIndex(r => r.classList.contains('commit--merge'))];
      const root = main[main.length - 1];
      const x0 = main[0].x, x1 = edu.x;

      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = `
        <path class="p-main" pathLength="1" d="M${x0} ${main[0].y} V${root.y}"/>
        <path class="p-edu" pathLength="1" d="M${x0} ${root.y} C${x0} ${root.y - 26} ${x1} ${root.y - 22} ${x1} ${root.y - 50} V${merge.y + 50} C${x1} ${merge.y + 22} ${x0} ${merge.y + 26} ${x0} ${merge.y}"/>`;
    }

    draw();
    let timer;
    addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
    document.fonts && document.fonts.ready.then(draw);

    const term = body.closest('.term');
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        draw();
        term.classList.add('is-drawn');
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(term);
  }


  /*-----------------------------------*\
    #STACK (physics pit)
  \*-----------------------------------*/

  function initPit() {
    const box = $('[data-pit]');
    const chips = $$('.chip', box);

    if (!window.Matter || reduceMotion) {
      box.classList.add('is-static');
      return;
    }

    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query } = Matter;
    const engine = Engine.create();
    const T = 400;
    let w = box.clientWidth, h = box.clientHeight;

    const floor = Bodies.rectangle(w / 2, h + T / 2, w * 4, T, { isStatic: true });
    const left = Bodies.rectangle(-T / 2, h / 2, T, h * 6, { isStatic: true });
    const right = Bodies.rectangle(w + T / 2, h / 2, T, h * 6, { isStatic: true });
    const ceiling = Bodies.rectangle(w / 2, -T / 2, w * 4, T, { isStatic: true });
    Composite.add(engine.world, [floor, left, right]);

    let bodies = [];
    let ceilingOn = false, started = false, visible = false, raf = 0, last = 0, acc = 0;
    let gravity = 1;

    function spawn() {
      started = true;
      box.classList.add('is-live');
      bodies = chips.map((el, i) => {
        const cw = el.offsetWidth, ch = el.offsetHeight;
        const x = clamp(Math.random() * w, cw / 2 + 2, w - cw / 2 - 2);
        const b = Bodies.rectangle(x, -ch - i * 46, cw, ch, {
          chamfer: { radius: ch / 2 - 1 },
          restitution: 0.45,
          friction: 0.2,
          frictionAir: 0.012,
          density: 0.002,
          angle: (Math.random() - 0.5) * 0.8,
        });
        b.plugin.chip = { el, cw, ch };
        return b;
      });
      Composite.add(engine.world, bodies);
    }

    function resize() {
      w = box.clientWidth;
      h = box.clientHeight;
      Body.setPosition(floor, { x: w / 2, y: h + T / 2 });
      Body.setPosition(right, { x: w + T / 2, y: h / 2 });
      Body.setPosition(left, { x: -T / 2, y: h / 2 });
      Body.setPosition(ceiling, { x: w / 2, y: -T / 2 });
    }

    function step(t) {
      raf = requestAnimationFrame(step);
      const dt = Math.min(100, t - (last || t));
      last = t;
      acc += dt;
      engine.gravity.y = ceilingOn ? gravity : 1;
      let n = 0;
      while (acc >= 1000 / 60 && n++ < 4) {
        Engine.update(engine, 1000 / 60);
        acc -= 1000 / 60;
      }

      for (const b of bodies) {
        const { el, cw, ch } = b.plugin.chip;
        const { x, y } = b.position;
        if (x < -300 || x > w + 300 || y > h + 300 || (ceilingOn && y < -300)) {
          Body.setPosition(b, { x: w / 2, y: h / 2 });
          Body.setVelocity(b, { x: 0, y: 0 });
        }
        el.style.transform = `translate(${x - cw / 2}px, ${y - ch / 2}px) rotate(${b.angle}rad)`;
      }

      if (!ceilingOn && bodies.length && bodies.every(b => b.position.y > b.plugin.chip.ch)) {
        Composite.add(engine.world, ceiling);
        ceilingOn = true;
      }
    }

    function run(on) {
      if (on && !raf) {
        last = 0;
        raf = requestAnimationFrame(step);
      } else if (!on && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function shock(x, y, power = 0.045) {
      bodies.forEach(b => {
        const dx = b.position.x - x, dy = b.position.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 380) return;
        const f = power * b.mass * (1 - d / 380);
        Body.applyForce(b, b.position, { x: (dx / d) * f, y: (dy / d - 0.7 * Math.sign(gravity)) * f });
      });
      const ring = document.createElement('span');
      ring.className = 'ripple';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      box.append(ring);
      ring.addEventListener('animationend', () => ring.remove());
    }

    if (finePointer) {
      const mouse = Mouse.create(box);
      // Matter grabs wheel and touch events by default, which would block page scrolling.
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      mouse.element.removeEventListener('touchmove', mouse.mousemove);
      mouse.element.removeEventListener('touchstart', mouse.mousedown);
      mouse.element.removeEventListener('touchend', mouse.mouseup);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } } });
      Composite.add(engine.world, mc);
      addEventListener('mouseup', e => { if (!box.contains(e.target)) mouse.mouseup(e); });
    }

    box.addEventListener('pointerdown', e => {
      if (!started) return;
      const r = box.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (finePointer && Query.point(bodies, { x, y }).length) return;
      shock(x, y);
    });

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) spawn();
      run(visible);
    }, { threshold: 0.25 }).observe(box);

    let timer;
    addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(resize, 150); });

    pit = {
      flip() {
        gravity *= -1;
        return gravity < 0;
      },
    };
  }


  /*-----------------------------------*\
    #ACTIONS
  \*-----------------------------------*/

  let toastTimer;
  function toast(msg) {
    const el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
  }

  const go = sel => $(sel).scrollIntoView({ behavior: scrollBehavior });
  const openLink = url => window.open(url, '_blank', 'noopener');

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast('Email copied. Talk soon ✌️');
    } catch {
      toast(EMAIL);
    }
  }

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function hotReload() {
    accentIndex = (accentIndex + 1) % ACCENTS.length;
    document.documentElement.style.setProperty('--accent', ACCENTS[accentIndex]);
    restart($('.flash'), 'go');
    restart(document.body, 'is-reloading');
    setTimeout(() => document.body.classList.remove('is-reloading'), 450);
    toast(`⚡ Reloaded 1 of 1 libraries in ${Math.round(180 + Math.random() * 240)}ms`);
  }

  function flipGravity() {
    if (!pit) {
      toast('Gravity is switched off on this device.');
      return;
    }
    go('#stack');
    toast(pit.flip() ? 'Gravity flipped 🙃' : 'Gravity restored 🙂');
  }

  function confetti() {
    if (reduceMotion) return;
    const canvas = $('.confetti');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = [...ACCENTS, '#ffffff'];
    const parts = Array.from({ length: 220 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? -10 : W + 10,
        y: H * 0.8,
        vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 13),
        vy: -(11 + Math.random() * 15),
        w: 6 + Math.random() * 8,
        h: 9 + Math.random() * 10,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length],
      };
    });

    const start = performance.now();
    (function tick(now) {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.4;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y < H + 40) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.cos(p.r * 2));
        ctx.restore();
      }
      if (alive && now - start < 6000) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    })(start);
  }

  function hire() {
    confetti();
    toast('Permission granted. Opening your mail app…');
    setTimeout(() => {
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's build something together")}`;
    }, 1400);
  }


  /*-----------------------------------*\
    #COMMAND PALETTE
  \*-----------------------------------*/

  function initPalette() {
    const root = $('[data-palette]');
    const input = $('[data-palette-input]');
    const list = $('[data-palette-list]');

    const commands = [
      { label: 'Go to work', icon: '↗', hint: 'Section', run: () => go('#work') },
      { label: 'Go to career log', icon: '⎇', hint: 'Section', run: () => go('#log') },
      { label: 'Go to stack', icon: '◎', hint: 'Section', run: () => go('#stack') },
      { label: 'Go to contact', icon: '✉', hint: 'Section', run: () => go('#contact') },
      { label: 'Back to top', icon: '↑', run: () => go('#top') },
      { label: 'Copy email address', icon: '⧉', run: copyEmail },
      { label: 'Open GitHub', icon: '⌥', hint: 'github.com', run: () => openLink(LINKS.github) },
      { label: 'Open LinkedIn', icon: 'in', hint: 'linkedin.com', run: () => openLink(LINKS.linkedin) },
      { label: 'Open X', icon: '𝕏', hint: 'x.com', run: () => openLink(LINKS.x) },
      { label: 'Hot reload', icon: '⚡', key: 'R', run: hotReload },
      { label: 'Flip gravity', icon: '⇅', hint: 'Stack pit', run: flipGravity },
      { label: 'sudo hire kshitiz', icon: '#', hint: '🎉', run: hire },
    ];

    let filtered = commands, sel = 0, lastFocus = null;

    function setSel(i) {
      sel = i;
      $$('.palette__item', list).forEach((li, j) => li.setAttribute('aria-selected', String(j === sel)));
      const active = list.children[sel];
      if (active) {
        input.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
      }
    }

    function render() {
      list.innerHTML = filtered.length
        ? filtered.map((c, i) => `<li class="palette__item" id="cmd-${i}" role="option" aria-selected="false" data-i="${i}"><span class="ic">${c.icon}</span><span>${c.label}</span>${c.key ? `<kbd>${c.key}</kbd>` : c.hint ? `<small>${c.hint}</small>` : ''}</li>`).join('')
        : '<li class="palette__empty">No matches. Try “hire”.</li>';
      setSel(0);
    }

    function filter() {
      const terms = input.value.trim().toLowerCase().split(/\s+/);
      filtered = commands.filter(c => terms.every(t => c.label.toLowerCase().includes(t)));
      render();
    }

    function open() {
      lastFocus = document.activeElement;
      root.hidden = false;
      input.value = '';
      filter();
      input.focus();
    }

    function close() {
      root.hidden = true;
      lastFocus && lastFocus.focus && lastFocus.focus();
    }

    function runAt(i) {
      const c = filtered[i];
      if (!c) return;
      close();
      setTimeout(c.run, 60);
    }

    input.addEventListener('input', filter);
    input.addEventListener('keydown', e => {
      const n = filtered.length;
      if (e.key === 'ArrowDown' && n) { e.preventDefault(); setSel((sel + 1) % n); }
      else if (e.key === 'ArrowUp' && n) { e.preventDefault(); setSel((sel - 1 + n) % n); }
      else if (e.key === 'Enter') { e.preventDefault(); runAt(sel); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') e.preventDefault();
    });

    list.addEventListener('click', e => {
      const li = e.target.closest('[data-i]');
      li && runAt(+li.dataset.i);
    });
    list.addEventListener('mousemove', e => {
      const li = e.target.closest('[data-i]');
      if (li && +li.dataset.i !== sel) setSel(+li.dataset.i);
    });

    $('[data-palette-close]').addEventListener('click', close);
    $$('[data-palette-open]').forEach(b => b.addEventListener('click', open));

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        root.hidden ? open() : close();
        return;
      }
      if (!root.hidden || document.body.classList.contains('is-booting')) return;
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey || /^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable) return;
      if (e.key === '/') {
        e.preventDefault();
        open();
      } else if (e.key.toLowerCase() === 'r') {
        hotReload();
      }
    });
  }


  /*-----------------------------------*\
    #SMALL THINGS
  \*-----------------------------------*/

  function initClock() {
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' });
    const tick = () => {
      const now = new Date();
      $$('[data-time], [data-clock]').forEach(el => { el.textContent = time.format(now); });
      $$('[data-date]').forEach(el => { el.textContent = date.format(now); });
    };
    tick();
    setInterval(tick, 15000);
    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  function initCursor() {
    if (!finePointer || reduceMotion) return;
    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    document.body.classList.add('has-cursor');

    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });

    document.addEventListener('pointerover', e => {
      const t = e.target;
      const hover = !!t.closest('a, button, .palette__item');
      cursor.classList.toggle('is-hover', hover);
      cursor.classList.toggle('is-grab', !hover && !!t.closest('.pit, .stage'));
    });

    (function loop() {
      requestAnimationFrame(loop);
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    })();
  }

  function initMagnet() {
    if (!finePointer || reduceMotion) return;
    $$('[data-magnet]').forEach(el => {
      const inner = el.firstElementChild;
      addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < r.width) {
          el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
          inner.style.transform = `translate(${dx * 0.15}px, ${dy * 0.15}px)`;
        } else {
          el.style.transform = '';
          inner.style.transform = '';
        }
      }, { passive: true });
    });
  }

  function initNav() {
    const nav = $('.nav');
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      nav.classList.toggle('is-hidden', y > lastY && y > 240);
      lastY = y;
    }, { passive: true });
  }

  function initReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    $$('[data-reveal]').forEach(el => io.observe(el));
  }


  /*-----------------------------------*\
    #BOOT ("flutter run")
  \*-----------------------------------*/

  function initBoot(done) {
    const body = document.body;
    let seen = false;
    try { seen = sessionStorage.getItem('kd-booted') === '1'; } catch { /* storage unavailable */ }

    if (reduceMotion || seen) {
      body.classList.remove('is-booting');
      done();
      return;
    }

    const out = $('[data-boot-out]');
    const bar = $('[data-boot-progress]');
    const lines = [
      ['Launching lib/main.dart on Chrome in debug mode...', ''],
      ['Resolving dependencies ...... flutter · firebase · node', 'dim'],
      ['Compiling 6 products ........ done', 'dim'],
      ['✓ Built build/web', 'ok'],
      ['', ''],
      ['Flutter run key commands.', ''],
      ['r   Hot reload. 🔥🔥🔥', 'hl'],
      ['⌘K  Open command palette.', 'hl'],
    ];
    const timers = [];
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      removeEventListener('keydown', finish);
      removeEventListener('pointerdown', finish);
      bar.style.width = '100%';
      try { sessionStorage.setItem('kd-booted', '1'); } catch { /* storage unavailable */ }
      body.classList.add('is-booted');
      setTimeout(done, 250);
      setTimeout(() => body.classList.remove('is-booting', 'is-booted'), 950);
    }

    addEventListener('keydown', finish);
    addEventListener('pointerdown', finish);

    const cmd = document.createElement('span');
    cmd.className = 'cmd';
    out.append(cmd);

    let t = 250;
    [...'$ flutter run -d kshitiz.dev'].forEach(ch => {
      timers.push(setTimeout(() => { cmd.textContent += ch; }, (t += 24)));
    });
    t += 200;
    lines.forEach(([text, cls], i) => {
      timers.push(setTimeout(() => {
        const line = document.createElement('span');
        line.className = cls;
        line.textContent = `\n${text}`;
        out.append(line);
        bar.style.width = `${((i + 1) / lines.length) * 100}%`;
      }, (t += i < 4 ? 190 : 90)));
    });
    timers.push(setTimeout(finish, t + 550));
  }


  /*-----------------------------------*\
    #INIT
  \*-----------------------------------*/

  initHeroPhone();
  initWork();
  initClock();
  initField();
  initMarquee();
  initWords();
  initGraph();
  initPit();
  initPalette();
  initCursor();
  initMagnet();
  initNav();
  initReveal();
  $$('[data-copy]').forEach(b => b.addEventListener('click', copyEmail));
  initBoot(() => document.body.classList.add('is-ready'));
})();
