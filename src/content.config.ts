import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const str = z.string();
const opt = str.nullish();

const boards = defineCollection({
  loader: glob({ pattern: 'board-*.md', base: './src/content/boards' }),
  schema: z.object({
    ch: z.number().int().min(1),
    slug: str.optional(),
    title: str,
    short: str,
    kind: str,
    color: str,
    status: z.enum(['final', 'in-progress']).default('final'),
    progress_note: opt,
    wave: z.enum(['duty60', 'duty67', 'goodbad', 'uart', 'steps']),
    legend: str,
    readout: str,
    layers: z.union([z.number(), str]),
    size: str,
    tool: str,
    assembly: str.default('[assembly]'),
    summary: str,
    target: str,
    measured: str,
    stats: z.array(z.object({ label: str, value: str, note: opt })).default([]),
    layout_svg: opt,
    layout_placeholder: z.boolean().default(false),
    /** Shown in the layout slot until the Gerber line-art exists (e.g. an Altium screenshot). */
    layout_image: opt,
    layout_caption: opt,
    photo: opt,
    photo_alt: opt,
    photo_fallback: opt,
    photo_caption: opt,
    links: z
      .object({ report: opt, schematic: opt, model3d: opt, gerbers: opt })
      .default({}),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    order: z.number().default(99),
    eyebrow: str,
    color: str.default('#4fd1e8'),
    title: str,
    media: opt,
    media_alt: opt,
    link: opt,
    demo: z.enum(['amp', 'vehicle']).optional(),
    role: opt,
    facts: z.array(z.object({ k: str, v: str })).default([]),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/experience' }),
  schema: z.object({
    order: z.number(),
    org: str,
    role: str,
    dates: opt,
    place: opt,
    color: str,
    scene: z.enum(['relay', 'tbm', 'hyperloop', 'circuit']),
    lead: str,
    metric: z.object({ value: z.number(), suffix: str.default(''), label: str }).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  // home.md holds the site-wide copy; about.md / projects.md hold each page's header.
  schema: z.object({
    name: opt,
    nav_tag: opt,
    tagline: opt,
    course_credit: opt,
    contact_label: opt,
    footer: opt,
    eyebrow: opt,
    title: opt,
    skills: z.array(z.object({ group: str, items: z.array(str) })).default([]),
  }),
});

export const collections = { boards, projects, pages, experience };
