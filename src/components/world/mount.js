/**
 * ============================================================================
 *  mount.js — orchestratore del Sottobosco
 * ============================================================================
 *  Ordine di boot canonico della skill, senza scorciatoie:
 *    1. scrollRestoration manuale
 *    2. detectTier() PRIMA di qualunque import 3D
 *    3. tier 'none' -> fallback, e STOP (il chunk Three non viene scaricato)
 *    4. misura geometrie una volta sola (makeTimeline)
 *    5. import() dinamico del motore
 *    6. PRE-WARM su 6 punti -> poi via il preloader
 *    7. loop (hidden guard, dt clamp, damping FRI, micro-vita)
 *    8. resize solo sui cambi VERI del viewport
 * ============================================================================
 */
import { detectTier, pixelRatioFor } from './engine/capability.js';
import { makeTimeline } from './engine/scroll-timeline.js';
import { createRenderLoop, prewarm } from './engine/render-loop.js';
import { setupScrollRestoration, createPreloader } from './engine/boot.js';
import { SECTION_MAP, LAST_STATION } from './stations.js';

export async function mountWorld({ canvas, preloaderEl, stageEl, basePath = '/', onPick }) {
  setupScrollRestoration();
  const preloader = preloaderEl ? createPreloader(preloaderEl) : null;

  // (2) Capability PRIMA dell'import. Su 'none' non paghiamo i ~500 KB di Three.
  const tier = detectTier();
  if (tier === 'none') {
    document.documentElement.dataset.worldMode = 'statico';
    preloader?.done?.();
    return { mode: 'statico' };
  }

  // (4) Timeline: DOM e camera sulla stessa progressione. Misurata una volta.
  const tl = makeTimeline(SECTION_MAP, { lastStation: LAST_STATION });

  let world;
  try {
    // (5) Import dinamico: il chunk pesante parte solo ora.
    const { initWorld } = await import('./world.js');
    world = initWorld(canvas, { tier, dpr: pixelRatioFor(tier), basePath });
  } catch (err) {
    console.warn('[sottobosco] motore non disponibile:', err);
    document.documentElement.dataset.worldMode = 'statico';
    preloader?.done?.();
    tl.dispose();
    return { mode: 'statico', error: err };
  }

  // Viewport STABILE: l'altezza viene dal probe a 100vh della timeline, non da
  // innerHeight — altrimenti il collasso della barra indirizzi su mobile fa
  // saltare la coreografia proprio all'ingresso.
  const vp = () => {
    const { vw, vh } = tl.viewport();
    return { w: vw || window.innerWidth, h: vh || window.innerHeight };
  };
  const first = vp();
  world.resize(first.w, first.h);

  // (6) Pre-warm: shader compilati e texture caricate prima di scoprire la scena.
  prewarm(world.renderer, world.scene, world.camera, world.applyCamera);

  // (7) Loop.
  const loop = createRenderLoop({
    renderer: world.renderer,
    scene: world.scene,
    camera: world.camera,
    applyCamera: world.applyCamera,
    getTargetT: tl.narrativeT,
    damping: 0.94,
    microLife: 0.01, // ±1 cm: toglie la fissita robotica senza farsi notare
    onFrame: ({ time }) => {
      world.update({
        time,
        signals: {
          // Il gesto primario: la rivelazione delle ossa.
          ossa: tl.proximity('atto-ossa'),
          // Respiro ambientale delle amanite: tenuto BASSO di proposito, non
          // deve mai competere col gesto primario.
          // I barattoli si accendono quando il loro atto e centrato.
          teschi: tl.proximity('atto-teschi'),
          ambient: Math.max(
            tl.proximity('atto-soglia'),
            tl.proximity('atto-teschi') * 0.8,
            tl.proximity('atto-panoramica') * 0.6,
          ),
        },
      });
    },
  });
  loop.start();
  document.documentElement.dataset.worldMode = 'motore';
  stageEl?.classList.add('is-live');
  preloader?.done?.();

  // Le foto dei barattoli partono ORA, a preloader gia tolto: ~300 KB di JPEG
  // caricati prima avrebbero ritardato il primo fotogramma senza motivo.
  world.loadPhotos?.();

  // Toccare un oggetto nel mondo. Il picker non apre niente da solo: passa un
  // productId a chi possiede il DOM, che aziona lo stesso bottone gia presente
  // nella pagina. Il mondo e un telecomando, non la fonte di verita.
  let picker = null;
  if (onPick && world.pickables?.length) {
    const { createPicker } = await import('./pick.js');
    picker = createPicker({
      canvas,
      camera: world.camera,
      getPickables: () => world.pickables,
      onPick: (id) => onPick(id, world.projectToScreen(id)),
      onHover: (id) => world.setHover?.(id),
    });
  }

  // Pannello aperto -> il mondo si ferma.
  // Stessa logica della guardia `document.hidden`: se l'utente sta leggendo una
  // scheda prodotto, nessuno guarda la scena, e continuare a renderizzarla ruba
  // il thread principale proprio all'interfaccia con cui sta interagendo.
  const onPannello = (e) => (e.detail?.aperto ? loop.stop() : loop.start());
  window.addEventListener('mondo:pannello', onPannello);

  // (8) Resize solo sui cambi veri.
  let lastW = first.w;
  let lastH = first.h;
  const onResize = () => {
    const { w, h } = vp();
    if (w === lastW && Math.abs(h - lastH) <= 150) return;
    lastW = w;
    lastH = h;
    world.resize(w, h);
    tl.measure();
  };
  window.addEventListener('resize', onResize, { passive: true });

  const destroy = () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mondo:pannello', onPannello);
    picker?.dispose();
    loop.dispose();
    world.dispose();
    tl.dispose();
  };
  document.addEventListener('astro:before-swap', destroy, { once: true });

  return { mode: 'motore', destroy, projectToScreen: world.projectToScreen };
}
