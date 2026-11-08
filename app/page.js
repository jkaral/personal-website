import site from "../content/site";
import Icon from "../components/Icon";
import ContactForm from "../components/ContactForm";
import RecentlyStack from "../components/RecentlyStack";
import BannerCollage from "../components/BannerCollage";
import Collection from "../components/Collection";
import PencilCircle from "../components/PencilCircle";
import YouTubeLoop from "../components/YouTubeLoop";
import NameCycle from "../components/NameCycle";
import ContributionGraph from "../components/ContributionGraph";
import UsesBubble from "../components/UsesBubble";
import { getEssays, formatDate } from "../lib/writing";
import { getDuolingo, getFable, getGitHubContributions } from "../lib/live";

function sinceLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Media + extra text for hobby rows backed by live data.
function liveParts(kind, { fable, duo }) {
  if (kind === "fable") {
    const url = fable?.profileUrl || site.live?.fableProfile;
    if (!fable?.reading?.length) {
      return { media: null, extra: url && <a className="underline small" href={url} target="_blank" rel="noreferrer">My shelf on Fable ↗</a> };
    }
    return {
      media: (
        <a className="cover-stack" href={url} target="_blank" rel="noreferrer" aria-label="My Currently Reading shelf on Fable">
          {fable.reading.slice(0, 4).map((b, i, arr) => (
            <img key={b.title} src={b.cover} alt={`${b.title} cover`} loading="lazy" style={{ "--i": i, "--n": arr.length, zIndex: i }} />
          ))}
        </a>
      ),
      extra: (
        <>
          <p className="live-label">Currently reading</p>
          <ul className="reading-list">
            {fable.reading.map((b) => (
              <li key={b.title}><em>{b.title}</em>{b.authors && <span> — {b.authors}</span>}</li>
            ))}
          </ul>
          <p className="small muted">
            {fable.finishedCount != null && <>{fable.finishedCount} books finished · </>}
            <a className="underline" href={url} target="_blank" rel="noreferrer">My shelf on Fable ↗</a>
          </p>
        </>
      ),
    };
  }
  if (kind === "duolingo") {
    const url = duo?.profileUrl || (site.live?.duolingoUsername && `https://www.duolingo.com/profile/${site.live.duolingoUsername}`);
    if (!duo) {
      return { media: null, extra: url && <a className="underline small" href={url} target="_blank" rel="noreferrer">My Duolingo profile ↗</a> };
    }
    const hidden = site.live?.hideLanguages || [];
    const courses = duo.courses.filter((c) => !hidden.includes(c.code));
    const greetings = site.live?.greetings || {};
    const bubbles = courses.filter((c) => greetings[c.code]).slice(0, 4);
    return {
      media: (
        <a className="streak-card" href={url} target="_blank" rel="noreferrer" aria-label={`${duo.streak}-day Duolingo streak`}>
          {bubbles.map((c, i) => (
            <span key={c.code} className={`greet greet-${i}`} lang={c.code} aria-hidden="true">
              <span className="greet-code">{c.code.toUpperCase()}</span>
              {greetings[c.code]}
            </span>
          ))}
          <span className="streak-core">
            <span className="flame" aria-hidden="true">🔥</span>
            <span className="streak-num">{duo.streak.toLocaleString()}</span>
            <span className="streak-label">day streak</span>
            {duo.since && <span className="streak-since">since {sinceLabel(duo.since)}</span>}
          </span>
        </a>
      ),
      extra: (
        <>
          <p className="live-label">On Duolingo</p>
          <ul className="lang-chips">
            {courses.map((c) => (
              <li key={c.code}>{c.title} <span>{c.xp.toLocaleString()} XP</span></li>
            ))}
          </ul>
          <p className="small"><a className="underline" href={url} target="_blank" rel="noreferrer">My Duolingo profile ↗</a></p>
        </>
      ),
    };
  }
  return { media: null, extra: null };
}

function Section({ id, title, children, className = "" }) {
  return (
    <section id={id} className={`section reveal ${className}`}>
      <div className="container">
        <h2 className="section-title">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export const revalidate = 21600; // rebuild the page with fresh live data every 6 hours

export default async function Home() {
  const essays = getEssays();
  const [duo, fable, contrib] = await Promise.all([
    getDuolingo(site.live?.duolingoUsername),
    getFable(site.live?.fableProfile),
    getGitHubContributions(site.live?.githubUsername),
  ]);
  const { about, work, projects, hobbies, contact, banner } = site;

  return (
    <>
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
            <a className="btn primary" href="#projects">View My Work</a>
            <a className="btn" href="#contact">Let&apos;s Talk</a>
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
                <blockquote lang="el">{about.quote.text}</blockquote>
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
                      <a className="underline" href="#hobbies">See my hobbies ↘</a>
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

      {/* Work */}
      {work.length > 0 && (
        <Section id="work" title="Work">
          <ol className="rows">
            {work.map((w, i) => (
              <li key={i} className="row">
                <div className="row-main">
                  <h3 className="row-title">
                    {w.role} <span className="at">at</span>{" "}
                    {(w.orgs || [w]).map((o, k, all) => (
                      <span key={o.company}>
                        {k > 0 && <span className="at"> and </span>}
                        {o.url ? (
                          <a className="logo-link" href={o.url} target="_blank" rel="noreferrer">
                            {o.logo && <img src={o.logo} alt="" />}
                            <span>{o.company}</span>
                          </a>
                        ) : (
                          <span className="logo-link plain">
                            {o.logo && <img src={o.logo} alt="" />}
                            <span>{o.company}</span>
                          </span>
                        )}
                      </span>
                    ))}
                  </h3>
                  {w.description && <p className="row-desc">{w.description}</p>}
                  {w.stack?.length > 0 && <p className="stack">{w.stack.join(" · ")}</p>}
                  <p className="dates work-dates">{w.dates}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Section id="projects" title="Projects">
          <div className="project-grid">
            {projects.map((p) => (
              <article key={p.title} className="project">
                {p.videoFile ? (
                  // self-hosted clip: silent, looping, like a moving image
                  <div className="shot video">
                    <video src={p.videoFile} poster={p.videoPoster} autoPlay muted loop playsInline preload="auto" disablePictureInPicture aria-label={`${p.title} demo`} />
                  </div>
                ) : p.video ? (
                  // YouTube clip that loops silently like a moving image (see components/YouTubeLoop.js)
                  <div className="shot video yt">
                    <YouTubeLoop id={p.video} segments={p.videoSegments} title={`${p.title} demo`} />
                  </div>
                ) : (
                  p.image && (
                    <div className="shot">
                      <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" />
                    </div>
                  )
                )}
                <div className="project-head">
                  <h3>
                    {p.links?.[0] ? (
                      <a className="project-link" href={p.links[0].url} target="_blank" rel="noreferrer">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}{" "}
                    <span className="year">{p.year}</span>
                  </h3>
                  {/* extra links (e.g. Devpost) and the write-up sit beside the title */}
                  {(p.links?.length > 1 || p.writeup) && (
                    <div className="project-actions">
                      {p.links.slice(1).map((l) => (
                        <a key={l.url} className="btn project-btn" href={l.url} target="_blank" rel="noreferrer">
                          {l.label} <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                      {p.writeup && (
                        <a className="btn project-btn" href={p.writeup} target="_blank" rel="noreferrer">
                          Write-up <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {/* a description is text, or a list of text pieces and { text, url } links */}
                <p className="project-desc">
                  {(Array.isArray(p.description) ? p.description : [p.description]).map((piece, j) =>
                    typeof piece === "string" ? (
                      <span key={j}>{piece}</span>
                    ) : (
                      <a key={j} className="underline" href={piece.url}>{piece.text}</a>
                    )
                  )}
                </p>
                {p.stack?.length > 0 && <p className="stack">{p.stack.join(" · ")}</p>}
                {p.award && <p className="award">{p.award}</p>}
              </article>
            ))}
          </div>
        </Section>
      )}

      {/* Writing */}
      <Section id="writing" title="Writing">
        {essays.length === 0 ? (
          <p className="muted">Essays coming soon.</p>
        ) : (
          <ol className="rows">
            {essays.map((e) => (
              <li key={e.slug} className="row">
                <div className="row-main">
                  <h3 className="row-title">
                    <a className="essay-link" href={`/writing/${e.slug}`}>{e.title}</a>
                  </h3>
                  {e.summary && <p className="row-desc">{e.summary}</p>}
                </div>
                <span className="dates">{formatDate(e.date)}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Hobbies */}
      {hobbies.length > 0 && (
        <Section id="hobbies" title="Hobbies">
          <div className="hobby-list">
            {hobbies.map((h, i) => {
              const live = h.live ? liveParts(h.live, { fable, duo }) : null;
              const media =
                live?.media ||
                (h.image && (
                  <>
                    <img src={h.image} alt={h.title} loading="lazy" />
                    {h.circle && <PencilCircle {...h.circle} seed={i * 17 + 5} />}
                  </>
                ));
              return (
                <article key={h.title} className={`hobby-row ${i % 2 ? "flip" : ""} ${media ? "" : "no-img"} ${!live?.media && h.image ? "photo" : ""}`}>
                  {media && <div className={`hobby-media ${live?.media ? "live" : ""} ${h.circle && !live?.media ? "draw-on" : ""}`}>{media}</div>}
                  <div className="hobby-text">
                    <h3>
                      {h.title}
                      {h.titleLink && (
                        <>
                          {" "}<span className="at-sign">@</span>{" "}
                          <a className="project-link" href={h.titleLink.url} target="_blank" rel="noreferrer">{h.titleLink.text}</a>
                        </>
                      )}
                    </h3>
                    {h.description && <p>{h.description}</p>}
                    {h.speaking?.length > 0 && (
                      <>
                        <p className="live-label">Speaking</p>
                        <ul className="lang-chips">
                          {h.speaking.map((l) => (
                            <li key={l.lang}>{l.lang} <span>{l.level}</span></li>
                          ))}
                        </ul>
                      </>
                    )}
                    {live?.extra}
                    {h.link && (
                      <a className="underline small" href={h.link.url} target="_blank" rel="noreferrer">{h.link.label} ↗</a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Section>
      )}

      {/* Uses: floating bubble that opens into a grid */}
      <Section id="uses" title="Uses">
        <UsesBubble intro={site.uses.intro} groups={site.uses.groups} />
      </Section>

      {/* Contact */}
      <Section id="contact" title="Contact">
        <div className="contact-grid">
          <div>
            <p className="lead">{contact.blurb}</p>
            <div className="contact-links">
              <a href={`mailto:${site.email}`}><Icon name="email" /> <span>{site.email}</span></a>
              {site.social.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer"><Icon name={s.icon} /> <span>{s.label}</span></a>
              ))}
            </div>
          </div>
          <ContactForm email={site.email} />
        </div>
      </Section>

      {/* Inspirations: carousel + gallery of the banner items */}
      {banner?.items?.length > 0 && (
        <section id="inspirations" className="section reveal">
          <div className="container">
            <Collection title={banner.collectionTitle || "Inspirations"} intro={banner.collectionIntro} items={banner.items} />
          </div>
        </section>
      )}

      {/* Banner */}
      {banner && (
        <section className="banner-wrap reveal" aria-label="Banner">
          <div className="banner">
            <BannerCollage handle={banner.handle} items={banner.items || []} />
          </div>
        </section>
      )}
    </>
  );
}
