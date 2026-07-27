import { motion } from 'framer-motion';
import type { Product } from '../../lib/types';
import { CATEGORY_LABELS, formatPrice } from '../../lib/types';
import { CategoryGlyph } from './CategoryGlyph';

const CATEGORY_GRADIENT: Record<string, string> = {
  'teschio-dipinto': 'linear-gradient(135deg, #1c1f2e, #3a2418)',
  'gioiello-osso': 'linear-gradient(135deg, #0c0f1a, #1a2a2c)',
  'arredo-rituale': 'linear-gradient(135deg, #2a1418, #1c1f2e)',
  candele: 'linear-gradient(135deg, #2a1210, #3a1a12)',
  'cristalli-muschio': 'linear-gradient(135deg, #17241a, #0c0f1a)',
  'tarocchi-zodiaco': 'linear-gradient(135deg, #241830, #0c0f1a)',
};

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { title, category, price, priceIsFrom, isUnique, isCustom, images } = product.data;
  const cover = images[0];

  return (
    <motion.a
      href={`/negozio/${product.id}`}
      className="product-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="product-card__media" style={{ background: CATEGORY_GRADIENT[category] }}>
        {cover.placeholder ? (
          <>
            <CategoryGlyph category={category} className="product-card__glyph" />
            <span className="product-card__soon">Foto in arrivo</span>
          </>
        ) : (
          <img src={cover.src} alt={cover.alt} loading="lazy" />
        )}
        {isUnique && <span className="badge badge--unique">pezzo unico</span>}
        {isCustom && <span className="badge badge--custom">personalizzabile</span>}
      </div>
      <div className="product-card__body">
        <p className="product-card__category">{CATEGORY_LABELS[category]}</p>
        <h3 className="product-card__title">{title}</h3>
        <p className="product-card__price">{formatPrice(price, priceIsFrom)}</p>
      </div>

      <style>{`
        .product-card {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #fffdf9;
          border: 1px solid rgba(90, 30, 38, 0.12);
          box-shadow: 0 1px 2px rgba(90, 30, 38, 0.06);
        }
        .product-card__media {
          position: relative;
          aspect-ratio: 4 / 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .product-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-card__glyph {
          width: 2.75rem;
          height: 2.75rem;
          color: var(--bone-cream);
          opacity: 0.55;
        }
        .product-card__soon {
          font-family: var(--font-body);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          color: rgba(228, 217, 184, 0.45);
          text-transform: uppercase;
        }
        .badge {
          position: absolute;
          top: 0.6rem;
          font-family: var(--font-flash);
          font-size: 0.72rem;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: rgba(12, 15, 26, 0.75);
          color: var(--bone-cream);
          border: 1px solid rgba(228, 217, 184, 0.25);
        }
        .badge--unique { left: 0.6rem; }
        .badge--custom { right: 0.6rem; color: var(--turquoise); }
        .product-card__body {
          padding: 1rem 1.1rem 1.25rem;
        }
        .product-card__category {
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--turquoise);
          margin-bottom: 0.25rem;
        }
        .product-card__title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          line-height: 1.25;
          color: var(--bordeaux);
          margin-bottom: 0.4rem;
        }
        .product-card__price {
          font-family: var(--font-body);
          font-weight: 500;
          color: var(--bordeaux-light);
        }
      `}</style>
    </motion.a>
  );
}
