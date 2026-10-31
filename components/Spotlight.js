'use client';

import { STATOZ } from '@/lib/data';
import { useIstTime } from '@/lib/useIstTime';
import { Phone, StatOzScreen } from './Phone';

// The product Kshitiz is building right now, featured above the past work.
export default function Spotlight() {
  const { time } = useIstTime();

  return (
    <div className="spot" id="statoz" style={{ '--a': STATOZ.ink }} data-reveal>
      <div className="spot__copy">
        <p className="spot__badge"><i />Now building · {STATOZ.role}</p>
        <h3 className="spot__name">Stat<span>Oz</span></h3>
        <p className="spot__tagline">{STATOZ.tagline}</p>
        <p className="spot__desc">{STATOZ.desc}</p>
        <ul className="spot__features">
          {STATOZ.features.map(f => <li key={f}>{f}</li>)}
        </ul>
        <div className="spot__links">
          <a className="btn btn--solid" href={STATOZ.site} target="_blank" rel="noopener noreferrer">Visit statoz.in ↗</a>
          <a className="btn btn--ghost" href={STATOZ.playStore} target="_blank" rel="noopener noreferrer">Google Play</a>
          <a className="btn btn--ghost" href={STATOZ.appStore} target="_blank" rel="noopener noreferrer">App Store</a>
        </div>
      </div>

      <div className="spot__device" aria-hidden="true">
        <Phone phoneStyle={{ transform: 'rotateY(-18deg) rotateX(8deg) rotateZ(3deg)' }}>
          <StatOzScreen time={time} />
        </Phone>
      </div>
    </div>
  );
}
