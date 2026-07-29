import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../../lib/types';
import { useCartStore } from '../../stores/cartStore';

export function ProductActions({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { isUnique } = product.data;

  function handleAdd() {
    add(
      {
        id: product.id,
        title: product.data.title,
        price: product.data.price,
        priceIsFrom: product.data.priceIsFrom,
        isCustom: product.data.isCustom,
        isUnique,
      },
      qty,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="actions">
      {/* Un pezzo unico non ha selettore di quantità: chiederne due non ha
          senso, e mostrarne uno promette una disponibilità che non esiste. */}
      {isUnique ? (
        <p className="actions__unique">Pezzo unico — ne esiste uno solo</p>
      ) : (
        <div className="actions__qty">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Riduci quantità">
            −
          </button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} aria-label="Aumenta quantità">
            +
          </button>
        </div>
      )}
      <motion.button className="actions__add" onClick={handleAdd} whileTap={{ scale: 0.96 }}>
        {justAdded ? 'Aggiunto ✓' : 'Aggiungi al carrello'}
      </motion.button>
      {product.data.isCustom && <p className="actions__note">Personalizzabile: potrai indicare i dettagli nella richiesta.</p>}

      <style>{`
        .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem; margin-bottom: 1rem; }
        .actions__qty {
          display: flex; align-items: center; gap: 0.625rem;
          font-family: var(--font-body); color: var(--bordeaux);
        }
        .actions__qty button {
          width: 2.75rem; height: 2.75rem; border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.25); background: transparent; color: var(--bordeaux); cursor: pointer;
        }
        .actions__add {
          font-family: var(--font-body); font-weight: 500; font-size: 0.95rem;
          padding: 0.75rem 1.5rem; border-radius: var(--r-sm); border: none;
          background: var(--bordeaux); color: var(--paper-warm); cursor: pointer;
        }
        .actions__note {
          flex-basis: 100%;
          font-family: var(--font-body); font-size: 0.8rem; color: var(--turquoise);
        }
        .actions__unique {
          font-family: var(--font-body); font-size: 0.85rem;
          color: var(--bordeaux); opacity: 0.75; margin: 0;
        }
      `}</style>
    </div>
  );
}
