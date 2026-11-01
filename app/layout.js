import { Inter, Instrument_Serif, JetBrains_Mono, Unbounded } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/data';

const display = Unbounded({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Kshitiz Dayal — Flutter & Full-Stack Developer',
  description: 'Kshitiz Dayal is a Flutter and full-stack developer in Bangalore, building mobile apps and the platforms behind them.',
  icons: { icon: '/assets/images/logo_kshitiz.ico' },
  openGraph: {
    title: 'Kshitiz Dayal — Flutter & Full-Stack Developer',
    description: 'I build apps that live in your pocket.',
  },
};

export const viewport = {
  themeColor: '#0b0b0c',
};

// Runs before paint: skip the boot screen for returning visitors (this session), reduced motion or any page but home.
const bootScript = `document.documentElement.classList.add('js');try{if(location.pathname!=='/'||sessionStorage.getItem('kd-booted')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('skip-boot')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="is-booting" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
