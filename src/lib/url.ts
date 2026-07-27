// Astro espone il base path configurato (es. "/magicbones/" su GitHub Pages,
// "/" in locale) tramite questa env var, sia lato server che nelle isole client.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith('mailto:') || path.startsWith('#')) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
