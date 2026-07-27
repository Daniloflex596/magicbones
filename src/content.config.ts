import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      'teschio-dipinto',
      'gioiello-osso',
      'arredo-rituale',
      'candele',
      'cristalli-muschio',
      'tarocchi-zodiaco',
    ]),
    animal: z.enum(['mucca', 'capra', 'cervo', 'cavallo', 'uccello']).optional(),
    price: z.number(),
    priceIsFrom: z.boolean().default(false),
    isCustom: z.boolean().default(false),
    isUnique: z.boolean().default(true),
    stock: z.number().default(1),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          placeholder: z.boolean().default(true),
        }),
      )
      .min(1),
    description: z.string(),
    materials: z.array(z.string()).default([]),
    dimensions: z.string().optional(),
    tags: z.array(z.string()).default([]),
    careNotes: z.string().optional(),
    featured: z.boolean().default(false),
    availableSince: z.coerce.date(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = { products };
