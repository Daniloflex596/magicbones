import type { ProductData } from '../../lib/types';

/** Piccola icona lineare per categoria — nessun emoji, solo SVG on-brand. */
export function CategoryGlyph({ category, className }: { category: ProductData['category']; className?: string }) {
  const common = { className, viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (category) {
    case 'teschio-dipinto':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M24 8c-8 0-13 6-13 13 0 5 2 8 4 10v6h4v-4h3v4h4v-4h3v4h4v-6c2-2 4-5 4-10 0-7-5-13-13-13Z" />
          <circle cx="18.5" cy="21" r="2.6" />
          <circle cx="29.5" cy="21" r="2.6" />
          <path d="M22 27h4l-2 3-2-3Z" />
        </svg>
      );
    case 'gioiello-osso':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="18" cy="14" r="4" />
          <path d="M20.8 16.8 27.2 31.2" />
          <circle cx="30" cy="34" r="4" />
        </svg>
      );
    case 'candele':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M24 8c2 3 3 5 3 7a3 3 0 1 1-6 0c0-2 1-4 3-7Z" />
          <rect x="19" y="18" width="10" height="20" rx="1.5" />
        </svg>
      );
    case 'cristalli-muschio':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M24 6 33 18 24 42 15 18Z" />
          <path d="M15 18h18M24 6 19 18M24 6l5 12" />
        </svg>
      );
    case 'tarocchi-zodiaco':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="24" cy="24" r="16" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 24 + Math.cos(a) * 13;
            const y1 = 24 + Math.sin(a) * 13;
            const x2 = 24 + Math.cos(a) * 16;
            const y2 = 24 + Math.sin(a) * 16;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M24 8v32M8 24h32M14 14l20 20M34 14 14 34" />
        </svg>
      );
  }
}
