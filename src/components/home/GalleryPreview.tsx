import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { withBase } from '../../lib/url';

interface Slot {
  caption: string;
  /** foto reale già disponibile; se assente, è uno slot in attesa */
  src?: string;
  alt?: string;
  kind: 'foto' | 'video';
  span?: 'wide' | 'tall';
}

/**
 * Il rito della creazione. Gli slot con `src` mostrano le foto vere di
 * Claudia (mercatino dell'Ex Mattatoio, ritratti, banchi); quelli senza
 * restano riquadri d'attesa, già dimensionati, pronti a ricevere i video
 * quando arrivano — stesso layout, zero rifacimenti.
 */
const SLOTS: Slot[] = [
  {
    caption: 'Il banco al mercatino — Ex Mattatoio, Roma',
    src: '/foto/mercatino-cervo-oro.jpg',
    alt: 'Lo stand di Magic Bones al mercatino: teschio di cervo dorato con corna imponenti appeso al centro, banco pieno di teschi dipinti',
    kind: 'foto',
    span: 'wide',
  },
  {
    caption: '"Non cerco, ma trovo"',
    src: '/foto/ritratto-cervo.jpg',
    alt: 'Claudia che tiene davanti al viso un teschio di cervo con corna e piume, nel campo',
    kind: 'foto',
    span: 'tall',
  },
  {
    caption: 'Ossa dipinte a mano, rune e simboli',
    src: '/foto/banco-ossa-dipinte.jpg',
    alt: 'Banco con ossa dipinte a mano, mandibole decorate, rune e piccoli altari',
    kind: 'foto',
  },
  {
    caption: 'Candele rituali sulle ossa dorate',
    src: '/foto/banco-candele-rosse.jpg',
    alt: 'Candele rosse accese su ossa dorate usate come candelieri, con teschio dorato incorniciato',
    kind: 'foto',
  },
  { caption: 'Il teschio dipinto a mano, in lavorazione', kind: 'video' },
  { caption: 'La raccolta nel bosco', kind: 'video' },
];

const PLAY_ICON = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7Z" />
  </svg>
);

export function GalleryPreview() {
  const reducedMotion = useReducedMotion();
  const [lightbox, setLightbox] = useState<Slot | null>(null);

  return (
    <div className="gp-grid">
      {SLOTS.map((slot, i) => (
        <motion.div
          key={i}
          className={`gp-tile ${slot.span === 'wide' ? 'gp-tile--wide' : ''} ${slot.span === 'tall' ? 'gp-tile--tall' : ''} ${slot.src ? 'gp-tile--photo' : ''}`}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: (i % 3) * 0.09, ease: [0.22, 0.85, 0.32, 1] }}
        >
          {slot.src ? (
            <button type="button" className="gp-tile__btn" onClick={() => setLightbox(slot)}>
              <img src={withBase(slot.src)} alt={slot.alt ?? ''} loading="lazy" decoding="async" />
              <span className="gp-tile__caption">{slot.caption}</span>
            </button>
          ) : (
            <div className="gp-tile__inner">
              <span className="gp-tile__play">{PLAY_ICON}</span>
              <span className="gp-tile__kind">Video in arrivo</span>
              <p className="gp-tile__wait">{slot.caption}</p>
            </div>
          )}
        </motion.div>
      ))}

      {lightbox && (
        <div className="gp-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.caption} onClick={() => setLightbox(null)}>
          <button type="button" className="gp-lightbox__close" aria-label="Chiudi" onClick={() => setLightbox(null)}>×</button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={withBase(lightbox.src!)} alt={lightbox.alt ?? ''} />
            <figcaption>{lightbox.caption}</figcaption>
          </figure>
        </div>
      )}

      <style>{`
        .gp-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 10rem;
          gap: 0.875rem;
        }
        @media (max-width: 720px) {
          .gp-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 8rem; }
        }
        .gp-tile {
          border-radius: var(--radius-lg);
          background:
            radial-gradient(circle at 30% 20%, rgba(139,92,246,0.12), transparent 55%),
            linear-gradient(150deg, #171a26, #0c0f1a);
          border: 1px dashed rgba(228, 217, 184, 0.22);
          overflow: hidden;
        }
        .gp-tile--photo { border-style: solid; border-color: rgba(228, 217, 184, 0.12); }
        .gp-tile--wide { grid-column: span 2; }
        .gp-tile--tall { grid-row: span 2; }
        .gp-tile__btn {
          position: relative; display: block; width: 100%; height: 100%;
          padding: 0; border: none; background: none; cursor: zoom-in;
        }
        .gp-tile__btn img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.6s cubic-bezier(0.22, 0.85, 0.32, 1);
        }
        .gp-tile__btn:hover img, .gp-tile__btn:focus-visible img { transform: scale(1.05); }
        .gp-tile__caption {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 1.5rem 0.875rem 0.75rem;
          background: linear-gradient(transparent, rgba(5,6,11,0.85));
          font-family: var(--font-body); font-size: 0.74rem; line-height: 1.35;
          color: rgba(228, 217, 184, 0.92); text-align: left;
        }
        .gp-tile__inner {
          height: 100%; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.375rem;
          padding: 1rem; text-align: center;
        }
        .gp-tile__play {
          width: 2.6rem; height: 2.6rem; border-radius: 999px;
          background: rgba(255, 138, 77, 0.9); color: var(--night-deep);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 26px rgba(255, 138, 77, 0.4);
        }
        .gp-tile__play svg { margin-left: 2px; }
        .gp-tile__kind {
          font-family: var(--font-body); font-size: 0.66rem; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(228, 217, 184, 0.5);
        }
        .gp-tile__wait {
          font-family: var(--font-body); font-size: 0.76rem;
          color: rgba(228, 217, 184, 0.72); line-height: 1.35;
        }

        .gp-lightbox {
          position: fixed; inset: 0; z-index: 120;
          background: rgba(5, 6, 11, 0.92);
          display: flex; align-items: center; justify-content: center;
          padding: 5vmin; cursor: zoom-out;
        }
        .gp-lightbox figure { margin: 0; max-width: min(92vw, 60rem); cursor: default; }
        .gp-lightbox img {
          width: 100%; max-height: 78vh; object-fit: contain;
          border-radius: var(--radius-lg); display: block;
        }
        .gp-lightbox figcaption {
          font-family: var(--font-body); font-size: 0.85rem;
          color: rgba(228, 217, 184, 0.8); margin-top: 0.875rem; text-align: center;
        }
        .gp-lightbox__close {
          position: absolute; top: 1.2rem; right: 1.4rem;
          width: 2.75rem; height: 2.75rem; border-radius: 999px;
          background: rgba(228, 217, 184, 0.12); border: 1px solid rgba(228, 217, 184, 0.3);
          color: var(--bone-cream); font-size: 1.6rem; line-height: 1; cursor: pointer;
        }
        .gp-lightbox__close:hover { background: rgba(228, 217, 184, 0.22); }
      `}</style>
    </div>
  );
}
