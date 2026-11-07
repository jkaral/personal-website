import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const DIR = path.join(process.cwd(), "content", "writing");

function readAll() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title || file,
        date: data.date ? String(data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date) : "",
        summary: data.summary || "",
        draft: Boolean(data.draft),
        content,
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getEssays() {
  return readAll().map(({ content, ...meta }) => meta);
}

export function getEssay(slug) {
  const essay = readAll().find((p) => p.slug === slug);
  if (!essay) return null;
  return { ...essay, html: marked.parse(essay.content) };
}

export function formatDate(d) {
  if (!d) return "";
  // "2026-03" (month only) -> "March 2026"
  if (/^\d{4}-\d{2}$/.test(d)) {
    const m = new Date(d + "-01T00:00:00");
    return m.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }
  const date = new Date(d + "T00:00:00");
  if (isNaN(date)) return d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
