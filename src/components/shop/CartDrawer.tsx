import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCartStore, cartTotal } from '../../stores/cartStore';
import { formatEuro } from '../../lib/order-message';
import { RequestOrderForm } from './RequestOrderForm';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const close = useCartStore((s) => s.close);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  const [step, setStep] = useState<'cart' | 'form'>('cart');
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      setStep('cart');
      requestAnimationFrame(() => panelRef.current?.focus());
    } else {
      (triggerRef.current as HTMLElement | null)?.focus?.();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Il tuo carrello"
            tabIndex={-1}
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
          >
            <div className="cart-panel__header">
              <h2>{step === 'cart' ? 'Il tuo carrello' : 'Richiedi il tuo bosco'}</h2>
              <button className="cart-panel__close" onClick={close} aria-label="Chiudi carrello">
                ×
              </button>
            </div>

            {step === 'cart' && (
              <>
                {items.length === 0 ? (
                  <p className="cart-panel__empty">Il carrello è vuoto. Torna nel bosco a scegliere un pezzo.</p>
                ) : (
                  <ul className="cart-panel__items">
                    {items.map((item) => (
                      <li key={item.id}>
                        <div>
                          <p className="item-title">{item.title}</p>
                          <p className="item-price">{formatEuro(item.price)}</p>
                        </div>
                        <div className="item-qty">
                          <button onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Riduci quantità">
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Aumenta quantità">
                            +
                          </button>
                        </div>
                        <button className="item-remove" onClick={() => remove(item.id)} aria-label={`Rimuovi ${item.title}`}>
                          Rimuovi
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {items.length > 0 && (
                  <div className="cart-panel__footer">
                    <div className="cart-panel__total">
                      <span>Totale indicativo</span>
                      <strong>{formatEuro(cartTotal(items))}</strong>
                    </div>
                    <button className="btn btn--primary" onClick={() => setStep('form')}>
                      Richiedi il tuo bosco →
                    </button>
                    <button className="btn btn--text" onClick={clear}>
                      Svuota carrello
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 'form' && (
              <>
                <button className="back-link" onClick={() => setStep('cart')}>
                  ← Torna al carrello
                </button>
                <RequestOrderForm items={items} onSent={() => clear()} />
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>

      <style>{`
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(12, 15, 26, 0.45);
          z-index: 90;
        }
        .cart-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(24rem, 100vw);
          background: var(--paper-warm);
          color: var(--bordeaux);
          z-index: 91;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cart-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cart-panel__header h2 {
          font-family: var(--font-display);
          font-size: 1.4rem;
        }
        .cart-panel__close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          color: var(--bordeaux);
          cursor: pointer;
          padding: 0.25rem 0.6rem;
        }
        .cart-panel__empty {
          font-family: var(--font-body);
          color: rgba(90, 30, 38, 0.7);
        }
        .cart-panel__items {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .cart-panel__items li {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.5rem 1rem;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(90, 30, 38, 0.12);
        }
        .item-title {
          font-family: var(--font-body);
          font-weight: 500;
        }
        .item-price {
          font-family: var(--font-body);
          font-size: 0.85rem;
          opacity: 0.75;
        }
        .item-qty {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-body);
        }
        .item-qty button {
          width: 2.25rem;
          height: 2.25rem;
          flex-shrink: 0;
          border-radius: 999px;
          border: 1px solid rgba(90, 30, 38, 0.25);
          background: transparent;
          color: var(--bordeaux);
          cursor: pointer;
        }
        .item-remove {
          grid-column: 1 / -1;
          justify-self: start;
          background: transparent;
          border: none;
          color: rgba(90, 30, 38, 0.6);
          font-family: var(--font-body);
          font-size: 0.78rem;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }
        .cart-panel__footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-top: 1rem;
        }
        .cart-panel__total {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-body);
        }
        .btn {
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.7rem 1rem;
          border-radius: 999px;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .btn--primary {
          background: var(--bordeaux);
          color: var(--paper-warm);
        }
        .btn--text {
          background: transparent;
          color: rgba(90, 30, 38, 0.6);
          text-decoration: underline;
        }
        .back-link {
          align-self: flex-start;
          background: transparent;
          border: none;
          color: var(--bordeaux);
          font-family: var(--font-body);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </>
  );
}
