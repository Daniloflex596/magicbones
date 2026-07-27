import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { Product } from '../../lib/types';
import { CATEGORY_LABELS, formatPrice } from '../../lib/types';
import { CATEGORY_ACCENT, drawSigil, mountSigil, seedFromId, wakeSigil } from '../../lib/sigil';
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
  const { title, category, price, priceIsFrom, isUnique, isCustom, description, images } = product.data;
  const [flipped, setFlipped] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLAnchorElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const add = useCartStore((s) => s.add);

  const cover = images[0];
  const hasPhoto = cover && !cover.placeholder;
  const href = withBase(`/negozio/${product.id}`);

  useEffect(() => {
    if (!canvasRef.current || hasPhoto) return;
    return mountSigil(canvasRef.current, seedFromId(product.id), CATEGORY_ACCENT[category], 180);
  }, [product.id, category, hasPhoto]);

  // `inert` sulla faccia nascosta: senza, il Tab atterra su bottoni invisibili
  // (backface-visibility nasconde alla vista, non alla tastiera) e gli screen
  // reader leggono entrambe le facce insieme, titolo compreso.
  useEffect(() => {
    frontRef.current?.toggleAttribute('inert', flipped);
    backRef.current?.toggleAttribute('inert', !flipped);
  }, [flipped]);

  function handleAdd() {
    if (cardRef.current) flySigilToCart(cardRef.current, product.id, CATEGORY_ACCENT[category]);
    add({ id: product.id, title, price, priceIsFrom, isCustom });
  }

  /** Senza JS il fronte è un link vero alla scheda; con JS gira la carta. */
  function handleFrontClick(e: ReactMouseEvent) {
    e.preventDefault();
    setFlipped(true);
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
          <a
            ref={frontRef}
            href={href}
            className="card__face card__face--front sigil-front"
            onClick={handleFrontClick}
            onPointerEnter={() => canvasRef.current && wakeSigil(canvasRef.current)}
            onFocus={() => canvasRef.current && wakeSigil(canvasRef.current)}
            aria-label={`${title} — apri i dettagli`}
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
            {hasPhoto ? (
              <img className="sigil-front__photo" src={withBase(cover.src)} alt={cover.alt} loading="lazy" decoding="async" />
            ) : (
              <div className="sigil-front__canvas-wrap">
                <canvas ref={canvasRef} aria-hidden="true" />
              </div>
            )}
            <div className="sigil-front__meta">
              <p className="sigil-front__category">{CATEGORY_LABELS[category]}</p>
              <p className="sigil-front__title">{title}</p>
              <p className="sigil-front__price">{formatPrice(price, priceIsFrom)}</p>
              <p className="sigil-front__hint">tocca per i dettagli</p>
            </div>
          </a>

          <div className="card__face card__face--back sigil-back" ref={backRef}>
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

    </div>
  );
}
