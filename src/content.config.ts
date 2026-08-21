import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { INSIGHT_CATEGORY_NAMES, RESOURCE_CATEGORY_NAMES } from './lib/contentArchitecture';

const baseArticleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  seoTitle: z.string().min(1).max(60).optional(),
  seoDescription: z.string().min(1).max(160).optional(),
  date: z.coerce.date(),
  author: z.string().min(1),
  authorProfile: z.string().startsWith('/').optional().default('/authors/dmca-vision-research/'),
  reviewedBy: z.string().min(1).optional(),
  lastUpdated: z.coerce.date().optional(),
  image: z.string().startsWith('/').optional()
});

const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.{md,mdx}' }),
  schema: baseArticleSchema.extend({
    category: z.enum(INSIGHT_CATEGORY_NAMES),
    featured: z.boolean().optional().default(false)
  })
});

const resources = defineCollection({
  loader: glob({ base: './src/content/resources', pattern: '**/*.{md,mdx}' }),
  schema: baseArticleSchema.extend({
    category: z.enum(RESOURCE_CATEGORY_NAMES)
  })
});

export const collections = { insights, resources };
