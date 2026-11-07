import site from "../../content/site";

export const metadata = { title: "Uses" };

export default function Uses() {
  const { uses } = site;
  return (
    <div className="container page">
      <a className="underline small" href="/">← Home</a>
      <h1 className="page-title">Uses</h1>
      <p className="lead">{uses.intro}</p>
      <div className="uses-grid">
        {uses.groups.map((g) => (
          <section key={g.title} className="uses-group">
            <h2>{g.title}</h2>
            <ul>
              {g.items.map((it) => (
                <li key={it.name} className={it.icon ? "has-icon" : ""}>
                  {it.icon && (
                    <span
                      className="app-glyph"
                      aria-hidden="true"
                      style={{ "--icon": `url(${it.icon})`, ...(it.color ? { "--tint": it.color } : {}) }}
                    />
                  )}
                  <span className="uses-text">
                    <strong>{it.url ? <a className="underline" href={it.url} target="_blank" rel="noreferrer">{it.name}</a> : it.name}</strong>
                    {it.note && <span>{it.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
