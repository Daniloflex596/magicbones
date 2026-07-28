/**
 * vola-nel-barattolo.ts — "prendere" un pezzo si vede.
 *
 * Un clone del prodotto parte dal punto in cui l'utente lo ha visto e finisce
 * dentro il barattolo-carrello in alto. Non e decorazione: e la conferma che
 * l'azione ha avuto effetto, e sostituisce il classico "aggiunto ✓" che nessuno
 * legge.
 *
 * Sotto `prefers-reduced-motion` non vola niente. Il risultato nel carrello e
 * identico: la parita di informazione non e negoziabile, sparisce solo il moto.
 */

export interface PuntoPartenza {
  x: number;
  y: number;
}

const DURATA = 720;

export function volaNelBarattolo(da: PuntoPartenza | null, immagine?: string): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!da) return;

  const barattolo = document.querySelector('[data-barattolo]');
  if (!barattolo) return;
  const a = barattolo.getBoundingClientRect();

  const LATO = 64;
  const volante = document.createElement('div');
  volante.setAttribute('aria-hidden', 'true');
  Object.assign(volante.style, {
    position: 'fixed',
    left: `${da.x - LATO / 2}px`,
    top: `${da.y - LATO / 2}px`,
    width: `${LATO}px`,
    height: `${LATO}px`,
    borderRadius: '50%',
    zIndex: '95',
    pointerEvents: 'none',
    background: immagine
      ? `center/cover no-repeat url("${CSS.escape(immagine).replace(/\\/g, '')}")`
      : 'radial-gradient(circle, #f2e0c4, #e8402c)',
    boxShadow: '0 0 24px rgba(255, 217, 160, 0.7)',
  });
  document.body.appendChild(volante);

  const dx = a.left + a.width / 2 - da.x;
  const dy = a.top + a.height / 2 - da.y;

  const anim = volante.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      // Arco verso l'alto a meta strada: una traiettoria dritta legge come
      // "un elemento che scorre", una ad arco come "un oggetto lanciato".
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(0.62)`,
        opacity: 1,
        offset: 0.6,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.3 },
    ],
    { duration: DURATA, easing: 'cubic-bezier(.32,.72,.4,1)' },
  );
  anim.onfinish = () => volante.remove();
  anim.oncancel = () => volante.remove();

  // Il barattolo "incassa" il colpo quando l'oggetto arriva.
  window.setTimeout(() => {
    barattolo.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' },
    );
  }, DURATA - 90);
}
