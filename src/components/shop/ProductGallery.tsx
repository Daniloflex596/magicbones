import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProductData } from '../../lib/types';
import { CategoryGlyph } from './CategoryGlyph';
import { withBase } from '../../lib/url';

export function ProductGallery({
  images,
  category,
}: {
  images: ProductData['images'];
  category: ProductData['category'];
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="gallery">
      <div className="gallery__main">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="gallery__frame"
          >
            {current.placeholder ? (
              <>
                <CategoryGlyph category={category} className="gallery__glyph" />
                <span className="gallery__soon">Foto in arrivo</span>
              </>
            ) : (
              <img src={withBase(current.src)} alt={current.alt} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`gallery__thumb ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Mostra immagine ${i + 1}`}
              aria-current={i === active}
            >
              {img.placeholder ? <CategoryGlyph category={category} className="gallery__thumb-glyph" /> : <img src={withBase(img.src)} alt="" />}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .gallery__main {
          aspect-ratio: 4 / 5;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: linear-gradient(135deg, #1c1f2e, #0c0f1a);
          margin-bottom: 0.75rem;
        }
        .gallery__frame {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
        }
        .gallery__frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery__glyph {
          width: 4rem;
          height: 4rem;
          color: var(--bone-cream);
          opacity: 0.5;
        }
        .gallery__soon {
          font-family: var(--font-body);
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(228, 217, 184, 0.45);
        }
        .gallery__thumbs {
          display: flex;
          gap: 0.625rem;
        }
        .gallery__thumb {
          width: 3.25rem;
          height: 3.25rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(90, 30, 38, 0.15);
          background: #fffdf9;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          padding: 0;
        }
        .gallery__thumb.is-active {
          border-color: var(--turquoise);
        }
        .gallery__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery__thumb-glyph {
          width: 1.4rem;
          height: 1.4rem;
          color: var(--bone-cream);
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
