import { compileSync } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import rehypeHeadings from './rehype-headings.mjs';

export interface ContentHeading {id: string; text: string; level: number}

/** Parse MDX instead of matching raw lines: code fences are not headings. */
export function extractContentHeadings(source: string): ContentHeading[] {
  const headings: ContentHeading[] = [];
  compileSync(source, {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeHeadings, {onHeading: (heading: ContentHeading) => headings.push(heading)}]],
  });
  return headings;
}
