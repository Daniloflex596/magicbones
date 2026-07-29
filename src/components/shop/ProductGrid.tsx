import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Product, ProductData } from '../../lib/types';
import { CATEGORY_LABELS } from '../../lib/types';
import { ProductCard } from './ProductCard';
import { pseudo } from '../../lib/pseudo';
import { seedFromId } from '../../lib/sigil';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductData['category'][];

export function ProductGrid({ products, initialCategory }: { products: Product[]; initialCategory?: string }) {
  const validInitial = CATEGORIES.includes(initialCategory as ProductData['category'])
    ? (initialCategory as ProductData['category'])
    : null;
  const [active, setActive] = useState<ProductData['category'] | null>(validInitial);
  const reducedMotion = useReducedMotion();

  const filtered = useMemo(
    () => (active ? products.filter((p) => p.data.category === active) : products),
    [active, products],
  );

  function select(cat: ProductData['category'] | null) {
    setActive(cat);
    const url = new URL(window.location.href);
    if (cat) url.searchParams.set('categoria', cat);
    else url.searchParams.delete('categoria');
    window.history.replaceState({}, '', url);
  }

  return (
    <div>
      <div className="filters" role="group" aria-label="Filtra per categoria">
        <button className={`chip ${active === null ? 'is-active' : ''}`} onClick={() => select(null)}>
          Tutto
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} className={`chip ${active === cat ? 'is-active' : ''}`} onClick={() => select(cat)}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <motion.div layout className="grid">
        <AnimatePresence mode="popLayout">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              layout
              initial={reducedMotion ? false : { opacity: 0, y: 42, rotate: (pseudo(seedFromId(product.id)) - 0.5) * 7, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.56), ease: [0.22, 0.85, 0.32, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="empty">Nessun pezzo in questa categoria per ora — torna presto a controllare.</p>
      )}

      <style>{`
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-bottom: 2.5rem;
        }
        .chip {
          font-family: var(--font-body);
          font-size: 0.85rem;
          padding: 0.625rem 1rem;
          border-radius: var(--r-sm);
          border: 1px solid rgba(90, 30, 38, 0.2);
          background: transparent;
          color: var(--bordeaux);
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .chip:hover {
          border-color: var(--turquoise);
        }
        .chip.is-active {
          background: var(--turquoise);
          border-color: var(--turquoise);
          color: var(--night-deep);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .empty {
          font-family: var(--font-body);
          color: rgba(90, 30, 38, 0.7);
          padding: 2rem 0;
        }
      `}</style>
    </div>
  );
}
