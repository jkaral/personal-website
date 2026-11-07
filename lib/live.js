// Live data for the Hobbies section, fetched on the server and cached.
// Neither Duolingo nor Fable has an official public API, so these use the same
// public endpoints their own websites use. Every function returns null on failure
// so the page falls back to a plain profile link instead of breaking.

const REFRESH_SECONDS = 6 * 60 * 60; // re-fetch at most every 6 hours
const HEADERS = { "User-Agent": "Mozilla/5.0 (personal website)", Accept: "application/json" };

async function getJSON(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: REFRESH_SECONDS } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDuolingo(username) {
  if (!username) return null;
  const fields = "users{streak,streakData{currentStreak},courses{title,learningLanguage,xp},totalXp,username}";
  const data = await getJSON(
    `https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(username)}&fields=${encodeURIComponent(fields)}`
  );
  const u = data?.users?.[0];
  if (!u) return null;
  return {
    streak: u.streakData?.currentStreak?.length ?? u.streak ?? 0,
    since: u.streakData?.currentStreak?.startDate || null,
    totalXp: u.totalXp || 0,
    courses: (u.courses || []).sort((a, b) => b.xp - a.xp).map((c) => ({ title: c.title, code: c.learningLanguage, xp: c.xp })),
    profileUrl: `https://www.duolingo.com/profile/${encodeURIComponent(username)}`,
  };
}

export async function getFable(profileUrl) {
  if (!profileUrl) return null;
  const slug = profileUrl.replace(/\/+$/, "").split("/").pop();
  const user = await getJSON(`https://api.fable.co/api/usernames/${encodeURIComponent(slug)}`);
  if (!user?.id || user.private_profile) return null;

  const lists = await getJSON(`https://api.fable.co/api/v2/users/${user.id}/book_lists/?media_type=book`);
  const all = lists?.results || (Array.isArray(lists) ? lists : []);
  const current = all.find((l) => /currently reading/i.test(l.name));
  const finished = all.find((l) => /finished/i.test(l.name));

  let reading = [];
  if (current) {
    const books = await getJSON(`https://api.fable.co/api/v2/users/${user.id}/book_lists/${current.id}/books?limit=6&offset=0`);
    reading = (books?.results || []).map(({ book }) => ({
      title: book.title,
      authors: (book.authors || []).map((a) => a.name).join(", "),
      cover: book.cover_image_small || book.cover_image,
    }));
  }

  return {
    reading,
    finishedCount: finished?.count ?? finished?.book_count ?? null,
    profileUrl: user.url || profileUrl,
  };
}

// GitHub contribution calendar. GitHub has no token-free API for this, but every
// profile's calendar is served publicly as an HTML fragment, which we parse here.
export async function getGitHubContributions(username) {
  if (!username) return null;
  let html;
  try {
    const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
      headers: { "User-Agent": "Mozilla/5.0 (personal website)" },
      next: { revalidate: REFRESH_SECONDS },
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  // exact counts come from the tooltips: "4 contributions on August 3rd."
  const counts = {};
  for (const m of html.matchAll(/for="(contribution-day-component-\d+-\d+)"[^>]*>(No|\d+) contributions?/g)) {
    counts[m[1]] = m[2] === "No" ? 0 : Number(m[2]);
  }

  const weeks = [];
  for (const m of html.matchAll(/<td[^>]*?data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="contribution-day-component-(\d+)-(\d+)"[^>]*?data-level="(\d)"/g)) {
    const [, date, row, col, level] = m;
    const c = Number(col), r = Number(row);
    (weeks[c] ||= [])[r] = { date, level: Number(level), count: counts[`contribution-day-component-${row}-${col}`] ?? 0 };
  }
  if (!weeks.length) return null;

  const total = weeks.flat().reduce((sum, d) => sum + (d?.count || 0), 0);
  return { weeks, total, profileUrl: `https://github.com/${username}` };
}
