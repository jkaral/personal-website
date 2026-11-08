import { notFound } from "next/navigation";
import { getEssays, getEssay, formatDate } from "../../../lib/writing";
import ScrollHighlight from "../../../components/ScrollHighlight";

// wrap the chosen phrases of the title in <mark> so they get the marker highlight
function markTitle(title, phrases) {
  const list = phrases.filter(Boolean).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!list.length) return title;
  return title.split(new RegExp(`(${list.join("|")})`, "gi")).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

export function generateStaticParams() {
  return getEssays().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const essay = getEssay(slug);
  return essay ? { title: essay.title, description: essay.summary } : {};
}

export default async function Essay({ params }) {
  const { slug } = await params;
  const essay = getEssay(slug);
  if (!essay) notFound();

  return (
    <article className="container narrow essay">
      <a className="inline back" href="/#writing">← All writing</a>
      <h1 className="page-title hl-scroll">{markTitle(essay.title, essay.titleHighlights)}</h1>
      {essay.date && <p className="dates">{formatDate(essay.date)}</p>}
      <div className="prose hl-scroll" dangerouslySetInnerHTML={{ __html: essay.html }} />
      <ScrollHighlight />
    </article>
  );
}
