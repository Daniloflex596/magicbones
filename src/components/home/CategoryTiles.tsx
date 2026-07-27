import { motion } from 'framer-motion';
import { CATEGORY_LABELS } from '../../lib/types';
import type { ProductData } from '../../lib/types';
import { CategoryGlyph } from '../shop/CategoryGlyph';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductData['category'][];

const TILE_GRADIENT: Record<string, string> = {
  'teschio-dipinto': 'linear-gradient(150deg, #1c1f2e, #3a2418)',
  'gioiello-osso': 'linear-gradient(150deg, #0c0f1a, #1a2a2c)',
  'arredo-rituale': 'linear-gradient(150deg, #2a1418, #1c1f2e)',
  candele: 'linear-gradient(150deg, #2a1210, #3a1a12)',
  'cristalli-muschio': 'linear-gradient(150deg, #17241a, #0c0f1a)',
  'tarocchi-zodiaco': 'linear-gradient(150deg, #241830, #0c0f1a)',
};

export function CategoryTiles() {
  return (
    <div className="tiles">
      {CATEGORIES.map((cat, i) => (
        <motion.a
          key={cat}
          href={`/negozio?categoria=${cat}`}
          data-astro-reload=""
          className="tile"
          style={{ background: TILE_GRADIENT[cat] }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          <CategoryGlyph category={cat} className="tile__glyph" />
          <span className="tile__label">{CATEGORY_LABELS[cat]}</span>
          <span className="tile__arrow">→</span>
        </motion.a>
      ))}

      <style>{`
        .tiles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .tile {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1.5rem 1.25rem;
          border-radius: var(--radius-lg);
          min-height: 9.5rem;
          text-decoration: none;
          border: 1px solid rgba(228, 217, 184, 0.1);
          overflow: hidden;
        }
        .tile__glyph {
          width: 1.9rem;
          height: 1.9rem;
          color: var(--bone-cream);
          opacity: 0.7;
        }
        .tile__label {
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: var(--bone-cream);
          line-height: 1.2;
        }
        .tile__arrow {
          position: absolute;
          top: 1.1rem;
          right: 1.2rem;
          color: var(--turquoise);
          font-size: 0.9rem;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
