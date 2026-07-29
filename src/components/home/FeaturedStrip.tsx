import { motion, useReducedMotion } from 'framer-motion';
import { ProductCard } from '../shop/ProductCard';
import type { Product } from '../../lib/types';
import { pseudo } from '../../lib/pseudo';
import { seedFromId } from '../../lib/sigil';

export function FeaturedStrip({ products }: { products: Product[] }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="featured-grid">
      {products.map((p, i) => (
        <motion.div
          key={p.id}
          initial={reducedMotion ? false : { opacity: 0, y: 42, rotate: (pseudo(seedFromId(p.id)) - 0.5) * 7, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.56), ease: [0.22, 0.85, 0.32, 1] }}
        >
          <ProductCard product={p} />
        </motion.div>
      ))}
      <style>{`
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
        }
      `}</style>
    </div>
  );
}
