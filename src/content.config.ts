import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const imageSchema = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1)
});

const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.object({ name: z.string().min(1) }),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    heroImage: imageSchema,
    featured: z.boolean().optional().default(false),
    readingTime: z.string().min(1).optional()
  })
});

const resources = defineCollection({
  loader: glob({ base: './src/content/resources', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    category: z.string().min(1),
    download: z.string().startsWith('/').optional(),
    featured: z.boolean().optional().default(false),
    image: imageSchema.optional()
  })
});

export const collections = { insights, resources };
