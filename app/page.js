import site from "../content/site";
import RecentlyStack from "../components/RecentlyStack";
import NameCycle from "../components/NameCycle";
import HandMark from "../components/HandMark";
import CursorTrail from "../components/CursorTrail";
import ScrollHighlight from "../components/ScrollHighlight";

// The landing page ("me"): the intro (name, tagline, the "now" list beside the Recently photos).
// Everything else is on its own page: app/work-ethic (my why + GitHub + uses, experience, projects,
// awards), app/identity (hobbies, writing, my mind) and app/contact.

export default function Home() {
  const { about } = site;
  // order of the hand-drawn marks down the list, so they draw in one after another
  const markOrder = new Map(about.now.flat().filter((p) => p?.mark && p.mark !== "highlight").map((p, k) => [p, k]));

  return (
    // .home: landing-page text sizes (see the "Landing page text sizes" block in globals.css)
    <div className="home">
      {/* paintings that pop up under the mouse as it moves */}
      <CursorTrail items={site.trail || []} />
      {/* draws the marker highlight on the <mark>s in the "now" list */}
      <ScrollHighlight />
      {/* Intro */}
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
          </div>
          {/* right below the intro: what I'm doing now on the left, the Recently photos on the right */}
          <div className="hero-now">
            {/* what I'm doing now: a list with ">" as the bullets. hl-scroll + hl-plain: its <mark>s get a
                plain marker highlight (no outline / shadow / shine; drawn by ScrollHighlight) */}
            <ul className="now-list hl-scroll hl-plain">
              {about.now.map((line, i) => (
                <li key={i}>
                  {line.map((piece, j) =>
                    typeof piece === "string" ? (
                      <span key={j}>{piece}</span>
                    ) : piece.mark === "highlight" ? (
                      <mark key={j}>{piece.text}</mark>
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
            {about.recently.length > 0 && <RecentlyStack photos={about.recently} />}
          </div>
        </div>
      </section>
    </div>
  );
}
