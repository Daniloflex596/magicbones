import { motion } from 'framer-motion';
import { useCartStore, cartCount } from '../../stores/cartStore';

/**
 * ============================================================================
 *  Il Barattolo — il carrello di Magic Bones
 * ============================================================================
 *  Il logo di Claudia e una mano che regge un barattolo con dentro un teschio.
 *  Quindi il carrello non e un carrello: e un barattolo che si riempie.
 *
 *  Il livello sale davvero con il numero di pezzi raccolti, e i pezzi presi nel
 *  mondo 3D ci volano dentro (`vola-nel-barattolo.ts` aggancia l'elemento
 *  tramite `data-barattolo`).
 *
 *  Il nome accessibile resta esplicito: chi usa uno screen reader deve sapere
 *  che questo e il carrello e quanti articoli contiene, non che e un barattolo.
 * ============================================================================
 */
export function CartButton() {
  const items = useCartStore((s) => s.items);
  const open = useCartStore((s) => s.open);
  const count = cartCount(items);

  // Il livello satura a 6 pezzi: oltre, il barattolo e "pieno" e continuare a
  // riempirlo non comunicherebbe piu niente.
  const livello = Math.min(count / 6, 1);
  const altezzaLiquido = 2 + livello * 11; // unita SVG

  return (
    <motion.button
      className="barattolo"
      data-barattolo
      onClick={open}
      aria-label={`Il tuo barattolo (${count} ${count === 1 ? 'pezzo' : 'pezzi'})`}
      whileTap={{ scale: 0.92 }}
    >
      <svg viewBox="0 0 20 24" width="22" height="26" aria-hidden="true">
        {/* tappo di sughero */}
        <rect x="5.5" y="1" width="9" height="3" rx="1" className="barattolo__tappo" />
        {/* corpo del vetro */}
        <path
          d="M4 5.5h12a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-14a1 1 0 0 1 1-1z"
          className="barattolo__vetro"
        />
        {/* il livello: sale dal fondo */}
        <motion.rect
          x="4.2"
          width="11.6"
          rx="0.6"
          className="barattolo__livello"
          initial={false}
          animate={{ y: 21.4 - altezzaLiquido, height: altezzaLiquido }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        />
        {/* riflesso sul vetro */}
        <path d="M6 7.5v12" className="barattolo__riflesso" />
      </svg>

      {count > 0 && <span className="barattolo__conta">{count}</span>}

      <style>{`
        .barattolo {
          position: relative;
          display: inline-flex; align-items: center; justify-content: center;
          width: 2.75rem; height: 2.75rem;
          border-radius: 999px;
          border: 1px solid rgba(220, 197, 158, 0.28);
          background: transparent;
          color: var(--bone-light);
          cursor: pointer;
        }
        .barattolo:focus-visible { outline: 2px solid var(--moss); outline-offset: 2px; }
        .barattolo__tappo { fill: #9c7a4a; }
        .barattolo__vetro {
          fill: rgba(214, 236, 242, 0.12);
          stroke: currentColor; stroke-width: 1.1;
        }
        .barattolo__livello { fill: var(--amanita); opacity: 0.88; }
        .barattolo__riflesso {
          stroke: rgba(253, 248, 238, 0.5); stroke-width: 1; stroke-linecap: round; fill: none;
        }
        .barattolo__conta {
          position: absolute; top: -0.35rem; right: -0.35rem;
          min-width: 1.2rem; height: 1.2rem; padding: 0 0.25rem;
          border-radius: 999px;
          background: var(--amanita); color: var(--soil-deep);
          font-family: var(--font-body); font-size: 0.68rem; font-weight: 500;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>
    </motion.button>
  );
}
