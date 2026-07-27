import { useEffect, useRef, useState } from 'react';
import type { Product } from '../../lib/types';
import { CATEGORY_LABELS, formatPrice } from '../../lib/types';
import { CATEGORY_ACCENT, drawSigil, seedFromId } from '../../lib/sigil';
import { useCartStore } from '../../stores/cartStore';
import { withBase } from '../../lib/url';

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
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    if (canvasRef.current) drawSigil(canvasRef.current, seedFromId(product.id), CATEGORY_ACCENT[category], 180);
  }, [product.id, category]);

  function handleAdd() {
    add({ id: product.id, title, price, priceIsFrom, isCustom });
  }

  return (
    <div className="card-scene">
      <div className={`card ${flipped ? 'is-flipped' : ''}`}>
        <div className="card__inner">
          <button
            type="button"
            className="card__face card__face--front sigil-front"
            onClick={() => setFlipped(true)}
            aria-label={`Gira per leggere ${title}`}
          >
            <div className="sigil-front__badges">
              {isUnique ? <span className="badge">pezzo unico</span> : <span />}
              {isCustom && <span className="badge badge--custom">personalizzabile</span>}
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
        .card { position: relative; width: 100%; height: 100%; }
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
        }
        .sigil-back__add:hover { background: var(--bordeaux-light); }
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
