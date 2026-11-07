import { notFound } from "next/navigation";
import { getEssays, getEssay, formatDate } from "../../../lib/writing";

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
      <h1 className="page-title">{essay.title}</h1>
      {essay.date && <p className="dates">{formatDate(essay.date)}</p>}
      <div className="prose" dangerouslySetInnerHTML={{ __html: essay.html }} />
    </article>
  );
}
