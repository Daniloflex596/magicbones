import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Product } from '../../lib/types';
import { CATEGORY_LABELS, formatPrice } from '../../lib/types';
import { CATEGORY_ACCENT, drawSigil, mountSigil, seedFromId } from '../../lib/sigil';
import { useCartStore } from '../../stores/cartStore';
import { withBase } from '../../lib/url';

import { pseudo } from '../../lib/pseudo';

/** Rotazione deterministica dei badge: leggermente "storti", come applicati a mano. */
function pseudoRot(key: string): number {
  return pseudo(seedFromId(key));
}

/** "Il sigillo vola nel carrello": clone del sigillo animato via WAAPI dalla carta al bottone carrello. */
function flySigilToCart(fromEl: HTMLElement, productId: string, accent: string): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cartBtn = document.querySelector('button[aria-label*="carrello"]');
  if (!cartBtn) return;
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = cartBtn.getBoundingClientRect();

  const flyer = document.createElement('canvas');
  const SIZE = 72;
  drawSigil(flyer, seedFromId(productId), accent, { size: SIZE, glow: 0.8 });
  Object.assign(flyer.style, {
    position: 'fixed',
    zIndex: '95',
    pointerEvents: 'none',
    left: `${fromRect.left + fromRect.width / 2 - SIZE / 2}px`,
    top: `${fromRect.top + fromRect.height / 2 - SIZE / 2}px`,
  });
  document.body.appendChild(flyer);

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
  const anim = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.7) rotate(180deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15) rotate(360deg)`, opacity: 0.4 },
    ],
    { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' },
  );
  anim.onfinish = () => flyer.remove();
}

/**
 * Una carta del "Mazzo del Bosco": il fronte è un sigillo generato a runtime
 * su canvas 2D (deterministico, seed = id prodotto — nessuna foto, nessuna
 * texture scaricata), il retro rivela descrizione, prezzo e l'azione
 * "aggiungi al carrello". Sostituisce sia la vecchia card-con-tilt-3D sia la
 * navigazione diretta alla pagina prodotto: quella resta raggiungibile dal
 * link "Scheda completa" sul retro, per chi vuole tutti i dettagli/SEO.
 */
export function ProductCard({ product }: { product: Product }) {
  const { title, category, price, priceIsFrom, isUnique, isCustom, description } = product.data;
  const [flipped, setFlipped] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    if (!canvasRef.current) return;
    return mountSigil(canvasRef.current, seedFromId(product.id), CATEGORY_ACCENT[category], 180);
  }, [product.id, category]);

  function handleAdd() {
    if (cardRef.current) flySigilToCart(cardRef.current, product.id, CATEGORY_ACCENT[category]);
    add({ id: product.id, title, price, priceIsFrom, isCustom });
  }

  // Tilt verso il puntatore (solo pointer preciso): vive sull'elemento .card
  // esterno, il flip su .card__inner — le due rotazioni si compongono.
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || !cardRef.current || !sceneRef.current) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
  }
  function handlePointerLeave() {
    if (cardRef.current) cardRef.current.style.transform = '';
  }

  return (
    <div className="card-scene" ref={sceneRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <div className={`card ${flipped ? 'is-flipped' : ''}`} ref={cardRef}>
        <div className="card__inner">
          <button
            type="button"
            className="card__face card__face--front sigil-front"
            onClick={() => setFlipped(true)}
            aria-label={`Gira per leggere ${title}`}
          >
            <div className="sigil-front__badges">
              {isUnique ? (
                <span className="badge" style={{ transform: `rotate(${((pseudoRot(product.id) - 0.5) * 5).toFixed(2)}deg)` }}>
                  pezzo unico
                </span>
              ) : (
                <span />
              )}
              {isCustom && (
                <span className="badge badge--custom" style={{ transform: `rotate(${((0.5 - pseudoRot(product.id + 'c')) * 5).toFixed(2)}deg)` }}>
                  personalizzabile
                </span>
              )}
            </div>
            <div className="sigil-front__canvas-wrap">
              <canvas ref={canvasRef} aria-hidden="true" />
            </div>
            <div className="sigil-front__meta">
              <p className="sigil-front__category">{CATEGORY_LABELS[category]}</p>
              <p className="sigil-front__title">{title}</p>
              <p className="sigil-front__price">{formatPrice(price, priceIsFrom)}</p>
              <p className="sigil-front__hint">tocca per i dettagli</p>
            </div>
          </button>

          <div className="card__face card__face--back sigil-back">
            <h3 className="sigil-back__title">{title}</h3>
            <p className="sigil-back__desc">{description}</p>
            <p className="sigil-back__price">{formatPrice(price, priceIsFrom)}</p>
            <button type="button" className="sigil-back__add" onClick={handleAdd}>
              Aggiungi al carrello
            </button>
            <div className="sigil-back__row">
              <button type="button" className="sigil-back__unflip" onClick={() => setFlipped(false)}>
                ← Torna al sigillo
              </button>
              <a className="sigil-back__full" href={withBase(`/negozio/${product.id}`)}>
                Scheda completa →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .card-scene { perspective: 1600px; aspect-ratio: 3/3.6; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.35s cubic-bezier(.16,1,.3,1); will-change: transform; }
        .card__inner {
          position: relative; width: 100%; height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(.22,.85,.32,1);
        }
        .card.is-flipped .card__inner { transform: rotateY(180deg); }
        .card__face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex; flex-direction: column;
        }
        .card__face--back { transform: rotateY(180deg); pointer-events: none; }
        .card.is-flipped .card__face--front { pointer-events: none; }
        .card.is-flipped .card__face--back { pointer-events: auto; }

        .sigil-front {
          background: var(--bg-night); color: var(--bone-cream);
          border: none; padding: 1rem; text-align: inherit; font: inherit;
          align-items: center; justify-content: space-between; cursor: pointer;
        }
        .sigil-front__badges { position: absolute; top: 0.7rem; left: 0.7rem; right: 0.7rem; display: flex; justify-content: space-between; z-index: 2; }
        .badge {
          font-family: var(--font-flash); font-size: 0.68rem; padding: 0.2rem 0.55rem;
          border-radius: 999px; background: rgba(12,15,26,.65); color: var(--bone-cream);
          border: 1px solid rgba(228,217,184,.25);
        }
        .badge--custom { color: var(--turquoise); }
        .sigil-front__canvas-wrap { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
        .sigil-front__canvas-wrap canvas { width: 68%; height: auto; }
        .sigil-front__meta { width: 100%; text-align: center; }
        .sigil-front__category { font-size: 0.66rem; letter-spacing: .06em; text-transform: uppercase; opacity: 0.65; margin: 0; }
        .sigil-front__title { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; line-height: 1.25; margin: 0.15rem 0 0.3rem; }
        .sigil-front__price { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--amanita-glow); margin: 0; }
        .sigil-front__hint { font-size: 0.66rem; opacity: 0.4; margin: 0.4rem 0 0; }

        .sigil-back { background: #fffdf9; padding: 1.1rem 1.15rem; color: var(--bordeaux); }
        .sigil-back__title { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; line-height: 1.25; margin: 0 0 0.35rem; }
        .sigil-back__desc { font-size: 0.78rem; line-height: 1.5; color: rgba(90,30,38,.85); flex: 1; overflow-y: auto; margin: 0; }
        .sigil-back__price { font-weight: 500; margin: 0.5rem 0; font-variant-numeric: tabular-nums; }
        .sigil-back__add {
          background: var(--bordeaux); color: var(--paper-warm); border: none; border-radius: 999px;
          padding: 0.55rem 0.8rem; font-size: 0.8rem; font-weight: 500; min-height: 2.4rem; cursor: pointer;
          box-shadow: 3px 3px 0 rgba(42, 14, 18, 0.55);
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        .sigil-back__add:hover { background: var(--bordeaux-light); transform: translate(1.5px, 1.5px); box-shadow: 1.5px 1.5px 0 rgba(42, 14, 18, 0.55); }
        .sigil-back__add:active { transform: translate(3px, 3px); box-shadow: 0 0 0 rgba(42, 14, 18, 0.55); }
        .sigil-back__row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem; gap: 0.5rem; flex-wrap: wrap; }
        .sigil-back__unflip { background: none; border: none; font-size: 0.72rem; text-decoration: underline; opacity: 0.6; padding: 0; cursor: pointer; }
        .sigil-back__full { font-size: 0.72rem; text-decoration: none; opacity: 0.75; color: var(--turquoise); }

        @media (prefers-reduced-motion: reduce) {
          .card__inner { transition: opacity .25s ease; }
          .card.is-flipped .card__inner { transform: none; }
          .card__face--front { transition: opacity .25s ease; }
          .card.is-flipped .card__face--front { opacity: 0; pointer-events: none; }
          .card__face--back { transform: none; opacity: 0; transition: opacity .25s ease; }
          .card.is-flipped .card__face--back { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
