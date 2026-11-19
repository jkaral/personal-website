import site from "../content/site";
import RecentlyStack from "../components/RecentlyStack";
import NameCycle from "../components/NameCycle";
import ContributionGraph from "../components/ContributionGraph";
import ReadAloud from "../components/ReadAloud";
import { Section } from "../components/sections";
import { getGitHubContributions } from "../lib/live";

// The landing page: hero and About (through the "Recently" photos).
// Every other section has its own page (app/experience, app/projects, app/writing, app/contact, ...).

export const revalidate = 21600; // rebuild the page with fresh live data every 6 hours

export default async function Home() {
  const contrib = await getGitHubContributions(site.live?.githubUsername);
  const { about, hobbies } = site;

  return (
    // .home: landing-page text sizes (see the "Landing page text sizes" block in globals.css)
    <div className="home">
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
          <ContributionGraph data={contrib} username={site.live?.githubUsername} showFrom={site.live?.githubShowFrom} trimUntil={site.live?.githubTrimUntil} />
        </div>
      </section>

      {/* About */}
      <Section id="about" title="About">
        <div className={`about-grid ${about.recently.length ? "" : "single"}`}>
          <div>
            {about.quote && (
              <figure className="quote">
                <div className="quote-line">
                  <blockquote lang="el">{about.quote.text}</blockquote>
                  {about.quote.audio && (
                    <ReadAloud audio={about.quote.audio} note={about.quote.audioNote} label="Hear the quote read aloud" />
                  )}
                </div>
                <figcaption>
                  “{about.quote.translation}”
                  {about.quote.source && <span> — {about.quote.source}</span>}
                </figcaption>
              </figure>
            )}
            {about.bio.map((p, i) => {
              const pieces = Array.isArray(p) ? p : [p];
              const isLast = i === about.bio.length - 1;
              return (
                <p key={i} className="lead">
                  {pieces.map((piece, j) =>
                    typeof piece === "string" ? (
                      <span key={j}>{piece}</span>
                    ) : (
                      <a key={j} className="logo-link" href={piece.url} target="_blank" rel="noreferrer">
                        {piece.logo && <img src={piece.logo} alt="" />}
                        <span>{piece.text}</span>
                      </a>
                    )
                  )}
                  {isLast && hobbies.length > 0 && (
                    <>
                      {" "}
                      <a className="underline" href="/hobbies">See my hobbies ↘</a>
                    </>
                  )}
                </p>
              );
            })}
            {about.exploring.length > 0 && (
              <>
                <h3 className="sub">What I&apos;m exploring</h3>
                <ul className="bullets">
                  {about.exploring.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {about.recently.length > 0 && <RecentlyStack photos={about.recently} />}
        </div>
      </Section>
    </div>
  );
}
