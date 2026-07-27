import { useCartStore, cartCount } from '../../stores/cartStore';

export function CartButton() {
  const items = useCartStore((s) => s.items);
  const open = useCartStore((s) => s.open);
  const count = cartCount(items);

  return (
    <button className="cart-button" onClick={open} aria-label={`Apri il carrello (${count} articoli)`}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 6h2l1.4 10.2A2 2 0 0 0 9.4 18h7.2a2 2 0 0 0 2-1.8L20 8H7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="21" r="1.2" />
        <circle cx="17" cy="21" r="1.2" />
      </svg>
      {count > 0 && <span className="cart-button__badge">{count}</span>}

      <style>{`
        .cart-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.2);
          background: transparent;
          color: var(--bordeaux);
          cursor: pointer;
        }
        .cart-button__badge {
          position: absolute;
          top: -0.35rem;
          right: -0.35rem;
          min-width: 1.2rem;
          height: 1.2rem;
          padding: 0 0.25rem;
          border-radius: 999px;
          background: var(--bordeaux);
          color: var(--paper-warm);
          font-family: var(--font-body);
          font-size: 0.68rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </button>
  );
}
