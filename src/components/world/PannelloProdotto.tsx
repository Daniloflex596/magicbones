import { useCallback, useEffect, useRef, useState } from 'react';

import type { Product } from '../../lib/types';
import { CATEGORY_LABELS, formatPrice } from '../../lib/types';
import { useCartStore } from '../../stores/cartStore';
import { withBase } from '../../lib/url';
import { volaNelBarattolo, type PuntoPartenza } from '../../lib/vola-nel-barattolo';

/**
 * ============================================================================
 *  PannelloProdotto — comprare dentro il Sottobosco
 * ============================================================================
 *  Due vie, un solo risultato:
 *
 *   1. Nel mondo 3D si tocca un barattolo. `mount.js` non apre niente: emette
 *      un CustomEvent `mondo:prendi` con il productId e il punto sullo schermo.
 *      Questo componente lo ascolta e apre il pannello.
 *
 *   2. In DOM, ogni atto elenca gli stessi prodotti come BOTTONI VERI. Chi
 *      naviga da tastiera, con uno screen reader, senza WebGL o con
 *      reduced-motion apre lo stesso identico pannello e compra lo stesso
 *      identico pezzo.
 *
 *  La regola che governa il file (imposta da entrambe le skill): il DOM e la
 *  fonte di verita, il 3D e progressive enhancement. Il mondo aggiunge il
 *  piacere del gesto, mai la possibilita di compierlo.
 * ============================================================================
 */

export interface EventoPrendi extends CustomEvent {
  detail: { productId: string; punto: PuntoPartenza | null };
}

export function PannelloProdotto({ prodotti }: { prodotti: Product[] }) {
  const [apertoId, setApertoId] = useState<string | null>(null);
  const [partenza, setPartenza] = useState<PuntoPartenza | null>(null);
  const [aggiunto, setAggiunto] = useState(false);
  const pannelloRef = useRef<HTMLDivElement>(null);
  const tornaA = useRef<HTMLElement | null>(null);
  const add = useCartStore((s) => s.add);

  const prodotto = apertoId ? prodotti.find((p) => p.id === apertoId) : undefined;

  const chiudi = useCallback(() => {
    setApertoId(null);
    setAggiunto(false);
  }, []);

  // Apertura dal mondo 3D.
  useEffect(() => {
    function onPrendi(e: Event) {
      const { productId, punto } = (e as EventoPrendi).detail;
      tornaA.current = document.activeElement as HTMLElement | null;
      setPartenza(punto);
      setAggiunto(false);
      setApertoId(productId);
    }
    window.addEventListener('mondo:prendi', onPrendi);
    return () => window.removeEventListener('mondo:prendi', onPrendi);
  }, []);

  // Focus trap + Esc + ritorno del focus. Stesso pattern gia collaudato nel
  // CartDrawer: senza, il Tab esce dal dialogo e si perde dietro la scena 3D.
  useEffect(() => {
    if (!apertoId) {
      tornaA.current?.focus?.();
      return;
    }
    // DOPPIO rAF: con AnimatePresence il nodo non e ancora nel documento al
    // primo frame, e un focus() singolo cadeva nel vuoto — il focus restava sul
    // bottone che aveva aperto il dialogo, quindi il focus trap non partiva mai.
    let raf2 = 0;
    const raf = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => pannelloRef.current?.focus());
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        chiudi();
        return;
      }
      if (e.key !== 'Tab' || !pannelloRef.current) return;
      const focusabili = pannelloRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusabili.length) return;
      const primo = focusabili[0];
      const ultimo = focusabili[focusabili.length - 1];
      if (e.shiftKey && document.activeElement === primo) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primo.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [apertoId, chiudi]);

  // Avvisa il mondo: a pannello aperto il render loop si ferma e lascia il
  // thread all'interfaccia.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mondo:pannello', { detail: { aperto: Boolean(apertoId) } }));
  }, [apertoId]);

  function apriDaDom(p: Product, e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    tornaA.current = e.currentTarget;
    setPartenza({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setAggiunto(false);
    setApertoId(p.id);
  }

  function prendi() {
    if (!prodotto) return;
    const { title, price, priceIsFrom, isCustom, isUnique, images } = prodotto.data;
    const cover = images[0];
    volaNelBarattolo(partenza, cover && !cover.placeholder ? withBase(cover.src) : undefined);
    // `apri: false` — nel mondo la conferma e il pezzo che vola nel barattolo.
    // Spalancare il carrello sopra la scena spezzerebbe l'esperienza a meta.
    add({ id: prodotto.id, title, price, priceIsFrom, isCustom, isUnique }, 1, { apri: false });
    setAggiunto(true);
  }

  return (
    <>
      {/*
        PARITA SENZA WEBGL. Questa lista esiste sempre, anche a motore acceso:
        e la stessa che il mondo 3D "telecomanda". A motore spento diventa
        l'unico modo di comprare, ed e completo.
      */}
      <ul className="pezzi-dom" data-pezzi-mondo>
        {prodotti.map((p) => {
          const cover = p.data.images[0];
          const conFoto = cover && !cover.placeholder;
          return (
            <li key={p.id}>
              <button type="button" className="pezzo" onClick={(e) => apriDaDom(p, e)}>
                {conFoto && (
                  <img className="pezzo__foto" src={withBase(cover.src)} alt="" loading="lazy" decoding="async" />
                )}
                <span className="pezzo__testo">
                  <span className="pezzo__titolo">{p.data.title}</span>
                  <span className="pezzo__prezzo">{formatPrice(p.data.price, p.data.priceIsFrom)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/*
        NIENTE Framer Motion qui, ed e una scelta deliberata.
        Framer anima in JavaScript, dentro il rAF condiviso con il render loop
        3D. Misurato: con il mondo acceso il thread principale scendeva a 3
        frame al secondo e il pannello restava CONGELATO sui valori iniziali —
        presente nel DOM ma con opacity 0, quindi invisibile e non chiudibile.
        Un'interfaccia critica non puo dipendere dal frame budget della scena.

        L'entrata e quindi una `animation` CSS: parte da sola all'inserimento
        del nodo, gira sul compositor e resta fluida anche col main thread
        occupato. L'uscita e immediata (smontaggio diretto): meglio una chiusura
        secca che una dissolvenza che potrebbe non completarsi mai.
      */}
      {prodotto && (
        <>
          <div className="pannello-velo" onClick={chiudi} />
          <div
            className="pannello"
            role="dialog"
            aria-modal="true"
            aria-label={prodotto.data.title}
            tabIndex={-1}
            ref={pannelloRef}
          >
              <button className="pannello__chiudi" onClick={chiudi} aria-label="Chiudi">
                ×
              </button>

              {prodotto.data.images[0] && !prodotto.data.images[0].placeholder && (
                <img
                  className="pannello__foto"
                  src={withBase(prodotto.data.images[0].src)}
                  alt={prodotto.data.images[0].alt}
                />
              )}

              <p className="pannello__categoria">{CATEGORY_LABELS[prodotto.data.category]}</p>
              <h2 className="pannello__titolo">{prodotto.data.title}</h2>
              <p className="pannello__desc">{prodotto.data.description}</p>

              {(prodotto.data.materials.length > 0 || prodotto.data.dimensions) && (
                <dl className="pannello__specifiche">
                  {prodotto.data.materials.length > 0 && (
                    <>
                      <dt>Materiali</dt>
                      <dd>{prodotto.data.materials.join(' · ')}</dd>
                    </>
                  )}
                  {prodotto.data.dimensions && (
                    <>
                      <dt>Misure</dt>
                      <dd>{prodotto.data.dimensions}</dd>
                    </>
                  )}
                  {prodotto.data.isUnique && (
                    <>
                      <dt>Disponibilità</dt>
                      <dd>Pezzo unico — ne esiste uno solo</dd>
                    </>
                  )}
                </dl>
              )}

              <p className="pannello__prezzo">{formatPrice(prodotto.data.price, prodotto.data.priceIsFrom)}</p>

              <div className="pannello__azioni">
                <button className="pannello__prendi" onClick={prendi} disabled={aggiunto}>
                  {aggiunto ? 'È nel tuo barattolo ✓' : 'Prendilo'}
                </button>
                <a className="pannello__scheda" href={withBase(`/negozio/${prodotto.id}`)}>
                  Scheda completa →
                </a>
              </div>
          </div>
        </>
      )}
    </>
  );
}
