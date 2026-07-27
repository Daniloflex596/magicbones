/**
 * reveal.js — piccolo reveal-on-scroll indipendente dal motore 3D (funziona
 * anche se il tier è 'none'/fallback). Aggiunge `is-visible` quando
 * l'elemento entra nel viewport; nessun timer, nessuna dipendenza da Three.
 */
export function setupReveal(selector = '[data-reveal], [data-stagger] > *') {
  const els = document.querySelectorAll(selector);
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
