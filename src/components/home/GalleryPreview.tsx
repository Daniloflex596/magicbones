import { motion } from 'framer-motion';

interface Slot {
  caption: string;
  kind: 'foto' | 'video';
  span?: 'wide' | 'tall';
}

const SLOTS: Slot[] = [
  { caption: 'Il teschio dipinto a mano, in lavorazione', kind: 'video', span: 'wide' },
  { caption: 'Corno e turchesi, dettaglio', kind: 'foto' },
  { caption: 'Il mercatino — Ex Mattatoio, Roma', kind: 'foto', span: 'tall' },
  { caption: 'Claudia al banco di lavoro', kind: 'foto' },
  { caption: 'Ritratto rituale con corna e piume', kind: 'foto' },
  { caption: 'Rito con candele, panoramica', kind: 'video' },
  { caption: 'Cristalli incastonati nelle vertebre', kind: 'foto' },
];

const PLAY_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M8 5v14l11-7Z" />
  </svg>
);

export function GalleryPreview() {
  return (
    <div className="gp-grid">
      {SLOTS.map((slot, i) => (
        <motion.div
          key={i}
          className={`gp-tile ${slot.span === 'wide' ? 'gp-tile--wide' : ''} ${slot.span === 'tall' ? 'gp-tile--tall' : ''}`}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: (i % 4) * 0.08, ease: 'easeOut' }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="gp-tile__inner">
            {slot.kind === 'video' && <span className="gp-tile__play">{PLAY_ICON}</span>}
            <span className="gp-tile__kind">{slot.kind === 'video' ? 'Video in arrivo' : 'Foto in arrivo'}</span>
            <p className="gp-tile__caption">{slot.caption}</p>
          </div>
        </motion.div>
      ))}

      <style>{`
        .gp-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 9rem;
          gap: 0.85rem;
        }
        @media (max-width: 720px) {
          .gp-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 7.5rem; }
        }
        .gp-tile {
          border-radius: var(--radius-lg);
          background:
            radial-gradient(circle at 30% 20%, rgba(139,92,246,0.12), transparent 55%),
            linear-gradient(150deg, #171a26, #0c0f1a);
          border: 1px dashed rgba(228, 217, 184, 0.22);
          overflow: hidden;
        }
        .gp-tile--wide { grid-column: span 2; }
        .gp-tile--tall { grid-row: span 2; }
        .gp-tile__inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 1rem;
          text-align: center;
        }
        .gp-tile__play {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 999px;
          background: rgba(232, 69, 43, 0.18);
          color: var(--amanita-glow);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gp-tile__kind {
          font-family: var(--font-body);
          font-size: 0.68rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(228, 217, 184, 0.45);
        }
        .gp-tile__caption {
          font-family: var(--font-body);
          font-size: 0.78rem;
          color: rgba(228, 217, 184, 0.75);
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
}
