// GitHub-style contribution calendar for the last year (data from lib/live.js).
// Server-rendered; hovering a square shows its count and date.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function label(day) {
  const d = new Date(day.date + "T00:00:00");
  const when = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${day.count === 0 ? "No" : day.count} contribution${day.count === 1 ? "" : "s"} on ${when}`;
}

export default function ContributionGraph({ data, username, showFrom, trimUntil }) {
  if (!data) return null;
  const { profileUrl } = data;
  let { weeks, total } = data;

  // Optional trim: hide days before `showFrom` until the `trimUntil` date arrives.
  const today = new Date().toISOString().slice(0, 10);
  const trimmed = Boolean(showFrom && (!trimUntil || today < trimUntil));
  if (trimmed) {
    weeks = weeks
      .filter((week) => week.some((d) => d && d.date >= showFrom)) // drop whole weeks before the start
      .map((week) => week.map((d) => (d && d.date >= showFrom ? d : null))); // blank days before it in the first week
    total = weeks.flat().reduce((sum, d) => sum + (d?.count || 0), 0);
  }
  const sinceLabel = trimmed
    ? new Date(showFrom + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  // month labels: show a month's name above the first week that starts in it
  const monthLabels = weeks.map((week, i) => {
    const first = week.find(Boolean);
    if (!first) return "";
    const m = new Date(first.date + "T00:00:00").getMonth();
    const prev = weeks[i - 1]?.find(Boolean);
    const pm = prev ? new Date(prev.date + "T00:00:00").getMonth() : -1;
    return m !== pm && i < weeks.length - 1 ? MONTHS[m] : "";
  });

  return (
    <div className="contrib">
      <p className="contrib-head">
        <strong>{total.toLocaleString()}</strong> contribution{total === 1 ? "" : "s"} {trimmed ? `since ${sinceLabel}` : "in the last year"}
        <span className="sep" aria-hidden="true"> · </span>
        <a className="underline" href={profileUrl} target="_blank" rel="noreferrer">@{username} ↗</a>
      </p>
      {/* rtl wrapper makes a narrow screen start scrolled to the most recent weeks */}
      <div className="contrib-scroll">
        <div className="contrib-inner" role="img" aria-label={`${total} GitHub contributions ${trimmed ? `since ${sinceLabel}` : "in the last year"}`}>
          <div className="contrib-months" aria-hidden="true">
            {monthLabels.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
          <div className="contrib-grid">
            {weeks.map((week, i) => (
              <div key={i} className="contrib-week">
                {Array.from({ length: 7 }, (_, r) => {
                  const day = week[r];
                  return day ? (
                    <span key={r} className={`contrib-day l${day.level}`} title={label(day)} />
                  ) : (
                    <span key={r} className="contrib-day empty" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="contrib-legend" aria-hidden="true">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`contrib-day l${l}`} />
        ))}
        More
      </p>
    </div>
  );
}
