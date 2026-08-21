import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const baseArticleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.date(),
  category: z.string().min(1),
  author: z.string().min(1),
  image: z.string().startsWith('/').optional()
});

const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.{md,mdx}' }),
  schema: baseArticleSchema.extend({
    featured: z.boolean().optional().default(false)
  })
});

const resources = defineCollection({
  loader: glob({ base: './src/content/resources', pattern: '**/*.{md,mdx}' }),
  schema: baseArticleSchema
});

export const collections = { insights, resources };
