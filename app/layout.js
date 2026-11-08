import {
  Inter,
  Noto_Serif_Display,
  Space_Grotesk,
  DM_Serif_Display,
  Bebas_Neue,
  JetBrains_Mono,
  Pacifico,
  Unbounded,
  Instrument_Serif,
  Caveat,
} from "next/font/google";
import localFont from "next/font/local";
import site from "../content/site";
import Icon from "../components/Icon";
import ThemeToggle from "../components/ThemeToggle";
import Reveal from "../components/Reveal";
import ParticleBackground from "../components/ParticleBackground";
import SwirlLine from "../components/SwirlLine";
import Sidebar from "../components/Sidebar";
import FeedbackChat from "../components/FeedbackChat";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const sans = Inter({ subsets: ["latin", "greek"], variable: "--font-sans" });
// Bundled locally (variable weight 500–700) so headings never fall back if Google Fonts is unreachable.
const playfair = localFont({
  src: "./fonts/PlayfairDisplay-latin.woff2",
  weight: "500 700",
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});
// Playfair has no Greek letters, so the Greek name uses a matching high-contrast serif.
const greek = Noto_Serif_Display({ subsets: ["greek"], variable: "--font-greek", weight: ["700"] });
// Extra display fonts the hero name cycles through (components/NameCycle.js)
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", weight: ["700"], display: "swap" });
const dmserif = DM_Serif_Display({ subsets: ["latin"], variable: "--font-dmserif", weight: ["400"], display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: ["400"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["700"], display: "swap" });
const pacifico = Pacifico({ subsets: ["latin"], variable: "--font-pacifico", weight: ["400"], display: "swap" });
const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", weight: ["700"], display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument", weight: ["400"], style: ["italic"], display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", weight: ["700"], display: "swap" });
const cycleFonts = [grotesk, dmserif, bebas, mono, pacifico, unbounded, instrument, caveat].map((f) => f.variable).join(" ");

export const metadata = {
  title: { default: site.siteTitle, template: `%s · ${site.siteTitle}` },
  description: site.siteDescription,
};

const nav = [
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Experience" },
  { href: "/#writing", label: "Writing" },
  { href: "/#hobbies", label: "Hobbies" },
  { href: "/#uses", label: "Uses" },
  { href: "/#contact", label: "Contact" },
];

// Sidebar sections (wide screens). ids match the sections on the homepage.
const sideLinks = [
  { id: "about", label: "about" },
  { id: "work", label: "experience" },
  { id: "projects", label: "projects" },
  { id: "writing", label: "writing" },
  { id: "hobbies", label: "hobbies" },
  { id: "uses", label: "uses" },
  { id: "inspirations", label: "inspirations" },
  { id: "contact", label: "contact" },
];

// Applies the saved light/dark choice before paint (no flash).
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-palette={site.palette || "cream"} className={`${sans.variable} ${playfair.variable} ${greek.variable} ${cycleFonts}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {site.particles !== false && <ParticleBackground />}
        <SwirlLine />
        <a className="skip" href="#main">Skip to content</a>
        <header className="topbar">
          <div className="topbar-inner">
            <a href="/" className="logo" aria-label="Home">
              <span className="en">{site.initials}</span>
              <span className="gr" lang="el" aria-hidden="true">{site.greekInitials}</span>
            </a>
            <nav aria-label="Main">
              {nav.map((n) => (
                <a key={n.href} href={n.href}>{n.label}</a>
              ))}
            </nav>
            <div className="top-actions">
              <FeedbackChat />
              <a className="app-icon" href={`mailto:${site.email}`} aria-label="Email" title="Email">
                <Icon name="email" size={16} />
              </a>
              {site.social.map((s) => (
                <a className="app-icon" key={s.url} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                  <Icon name={s.icon} size={16} />
                </a>
              ))}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <Sidebar links={sideLinks} songs={site.music} />
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <span className="logo small" aria-hidden="true">
              <span className="en">{site.initials}</span>
              <span className="gr" lang="el">{site.greekInitials}</span>
            </span>
            <p>© {new Date().getFullYear()} {site.name}</p>
            <p className="muted">{site.footer}</p>
          </div>
        </footer>
        <Reveal />
        <Analytics />
      </body>
    </html>
  );
}
