import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: ['DE Map/**/*.{md,mdx}', 'BE Map/**/*.{md,mdx}', 'Project Map/**/*.{md,mdx}', 'Blog/**/*.{md,mdx}'],
    // Separate file identity from the public URL so duplicate slugs can be detected.
    generateId: ({ entry }) => entry.normalize('NFC').replace(/\.(md|mdx)$/, ''),
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1), description: z.string().min(1),
    pubDate: z.coerce.date(), updatedDate: z.coerce.date().optional(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    tags: z.array(z.string().trim().min(1)).default([]),
    draft: z.boolean().default(false), heroImage: image().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.{md,mdx}', generateId: ({ entry }) => entry }),
  schema: ({ image }) => z.object({
    title: z.string().min(1), description: z.string().min(1),
    pubDate: z.coerce.date(), tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false), heroImage: image().optional(),
    sourceName: z.string().min(1),
    sourceUrl: z.url({ protocol: /^https?$/ }),
  }),
});

// Preserve starter URLs without mixing starter posts into the new blog.
const legacy = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '*.{md,mdx}' }),
  schema: ({ image }) => z.object({
    title: z.string(), description: z.string(), pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(), heroImage: image().optional(),
  }),
});

export const collections = { blog, news, legacy };
