import { ProductCard } from '../shop/ProductCard';
import type { Product } from '../../lib/types';

export function FeaturedStrip({ products }: { products: Product[] }) {
  return (
    <div className="featured-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      <style>{`
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.4rem;
        }
      `}</style>
    </div>
  );
}
