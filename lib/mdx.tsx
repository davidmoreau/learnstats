import { readFile } from "node:fs/promises";
import path from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import { components } from "@/components/mdx-components";

export type LessonFrontmatter = {
  title: string;
  description: string;
};

export async function loadLessonBySlug(slug: string) {
  const fullPath = path.join(process.cwd(), "content/modules", `${slug}.mdx`);
  const source = await readFile(fullPath, "utf-8");

  const { content, frontmatter } = await compileMDX<LessonFrontmatter>({
    source,
    components,
    options: {
      parseFrontmatter: true
    }
  });

  return { content, frontmatter };
}
