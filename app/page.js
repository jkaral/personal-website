import site from "../content/site";
import RecentlyStack from "../components/RecentlyStack";
import NameCycle from "../components/NameCycle";
import ContributionGraph from "../components/ContributionGraph";
import HandMark from "../components/HandMark";
import CursorTrail from "../components/CursorTrail";
import { Section } from "../components/sections";
import { getGitHubContributions } from "../lib/live";

// The landing page: hero (intro, then GitHub activity beside the "now" list) and About (the "Recently" photos).
// Every other section has its own page (app/experience, app/projects, app/writing, app/contact, ...).

export const revalidate = 21600; // rebuild the page with fresh live data every 6 hours

export default async function Home() {
  const contrib = await getGitHubContributions(site.live?.githubUsername);
  const { about } = site;
  // order of the marked phrases down the list, so their marks draw in one after another
  const markOrder = new Map(about.now.flat().filter((p) => p?.mark).map((p, k) => [p, k]));

  return (
    // .home: landing-page text sizes (see the "Landing page text sizes" block in globals.css)
    <div className="home">
      {/* paintings that pop up under the mouse as it moves */}
      <CursorTrail items={site.trail || []} />
      {/* Hero */}
      <section className="hero" id="top">
        <div className="hero-inner">
          {site.photo && <img className="portrait" src={site.photo} alt={site.name} />}
          <p className="greeting">{site.greeting}</p>
          <h1 className="name-swap" tabIndex={0} aria-label={`${site.name} (${site.greekName})`}>
            <span className="en" aria-hidden="true"><NameCycle name={site.name} /></span>
            <span className="gr" lang="el" aria-hidden="true">{site.greekName}</span>
          </h1>
          <div className="tagline-wrap">
            <p className="tagline">{site.tagline}</p>
            {/* handwritten note off to the left; a squiggly arrow leaves the tagline and curls left to "meaningful" */}
            <div className="tagline-note" aria-hidden="true">
              <span className="tagline-note-text">wait until the end for a meaningful display</span>
              <svg className="tagline-arrow" viewBox="0 0 200 90" width="200" height="90">
                <path className="tagline-arrow-line" pathLength="1" d="M196 30 C 182 40, 168 40, 170 30 C 172 20, 155 18, 150 28 C 144 42, 118 84, 80 84 C 58 84, 48 77, 47 65" />
                <path className="tagline-arrow-head" pathLength="1" d="M41 71 L47 63 L53 71" />
              </svg>
            </div>
          </div>
          <div className="cta">
            <a className="btn primary" href="/projects">View My Work</a>
            <a className="btn" href="/contact">Let&apos;s Talk</a>
          </div>
          {/* right below the intro: GitHub activity on the left, what I'm doing now on the right */}
          <div className="hero-now">
            <ContributionGraph data={contrib} username={site.live?.githubUsername} showFrom={site.live?.githubShowFrom} trimUntil={site.live?.githubTrimUntil} />
            {/* what I'm doing now: a list with ">" as the bullets */}
            <ul className="now-list">
              {about.now.map((line, i) => (
                <li key={i}>
                  {line.map((piece, j) =>
                    typeof piece === "string" ? (
                      <span key={j}>{piece}</span>
                    ) : piece.mark ? (
                      // hand-drawn circle / underline; they draw in one after another down the list
                      <HandMark key={j} kind={piece.mark} seed={i * 13 + j * 7 + 3} delay={0.5 + (markOrder.get(piece) || 0) * 0.35}>
                        {piece.text}
                      </HandMark>
                    ) : (
                      <a key={j} className="logo-link" href={piece.url} target="_blank" rel="noreferrer">
                        {piece.logo && <img src={piece.logo} alt="" />}
                        <span>{piece.text}</span>
                      </a>
                    )
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* About: the "Recently" photos */}
      {about.recently.length > 0 && (
        <Section id="about" title="About">
          <div className="about-recently">
            <RecentlyStack photos={about.recently} />
          </div>
        </Section>
      )}
    </div>
  );
}
