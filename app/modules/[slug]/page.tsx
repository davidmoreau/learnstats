import { notFound } from "next/navigation";
import { loadLessonBySlug } from "@/lib/mdx";
import { getModuleBySlug, modules } from "@/lib/modules";

export async function generateStaticParams() {
  return modules.map((module) => ({ slug: module.slug }));
}

export default async function ModulePage({ params }: { params: { slug: string } }) {
  const moduleMeta = getModuleBySlug(params.slug);
  if (!moduleMeta) notFound();

  try {
    const lesson = await loadLessonBySlug(params.slug);

    return (
      <article>
        <h1>{lesson.frontmatter.title ?? moduleMeta.title}</h1>
        <p className="muted">{lesson.frontmatter.description ?? moduleMeta.summary}</p>
        {lesson.content}
      </article>
    );
  } catch {
    notFound();
  }
}
