import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    image: z.string(),
    imageAlt: z.string(),
    category: z.enum(['Artist Stories', 'Materials', 'Impact', 'Partnerships', 'Tips', 'Innovation', 'Community']),
    tags: z.array(z.string()),
    excerpt: z.string(),
    draft: z.boolean().default(true),
  }),
});

export const collections = {
  blog: blogCollection,
};