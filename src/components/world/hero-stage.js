/**
 * hero-stage.js — l'UNICA scena firma del sito (principio "hybrid" da
 * immersive-web-director: DOM editoriale ovunque, un solo momento isolato a
 * effetto). Non è un mondo da attraversare scrollando: è una natura morta
 * rituale — teschio dipinto, fungo, candela — che l'utente può far ruotare
 * col dito/mouse. Idle: respiro lentissimo. Reduced motion: posa fissa.
 *
 * Ciclo di vita esplicito (ImmersiveController): ready/pause/resume/destroy,
 * tutti idempotenti — vedi references/webgl-and-effects.md del director.
 */
import * as THREE from 'three';
import { makeEnvTexture } from './engine/canvas-textures.js';
import { pixelRatioFor, tierSettings } from './engine/capability.js';
import { createSkullAltar } from './objects/skull.js';
import { createHeroMushroom, createMushroomCluster } from './objects/mushroom.js';
import { createCandleCluster } from './objects/candle.js';
import { createDustField, createFoliageCluster } from './objects/forest.js';

const BG = '#0c0f1a';

export function initHeroStage(canvas, { tier = 'high', reducedMotion = false } = {}) {
  const settings = tierSettings(tier);
  const scale = settings.instanceScale;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: settings.antialias,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.setPixelRatio(pixelRatioFor(tier));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.05);
  scene.environment = makeEnvTexture(renderer, ['#20232f', '#2f2438', '#05060b']);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
  const target = new THREE.Vector3(0, 0.85, 0);
  const radius = 3.35;
  let azimuth = 0.55; // rotazione orizzontale (rad)
  let polar = 1.25; // inclinazione verticale (rad), clampata
  let renderAzimuth = azimuth;
  let renderPolar = polar;

  function applyCamera(dt) {
    const s = 1 - Math.pow(0.9, Math.min(dt, 0.25) * 60);
    renderAzimuth += (azimuth - renderAzimuth) * s;
    renderPolar += (polar - renderPolar) * s;
    camera.position.set(
      target.x + radius * Math.sin(renderPolar) * Math.sin(renderAzimuth),
      target.y + radius * Math.cos(renderPolar),
      target.z + radius * Math.sin(renderPolar) * Math.cos(renderAzimuth),
    );
    camera.lookAt(target);
  }

  scene.add(new THREE.AmbientLight(0x2a2a3a, 0.5));

  // --- Il teschio: centro della composizione ---------------------------
  const skull = createSkullAltar({
    boneColor: 0xe4d9b8,
    accentColor: 0x2fb8c4,
    browWidth: 1.05,
    snoutLength: 1.05,
    hornCurve: 1.15,
    seed: 3,
  });
  scene.add(skull.group);
  const skullLight = new THREE.PointLight(0xffcf9e, 2.6, 5, 2);
  skullLight.position.set(0.9, 1.7, 1.3);
  scene.add(skullLight);
  const rimLight = new THREE.SpotLight(0xbcd0ff, 1.8, 6, Math.PI / 6, 0.6, 1.4);
  rimLight.position.set(-1.6, 2.4, -1.2);
  rimLight.target.position.set(0, 0.7, 0);
  scene.add(rimLight, rimLight.target);

  // --- Fungo e candela: comprimari a lato -------------------------------
  const mushroom = createHeroMushroom({ capColor: 0xe8452b, scale: 0.6, seed: 11 });
  mushroom.group.position.set(-1.05, 0, 0.55);
  scene.add(mushroom.group);
  const mushroomCluster = createMushroomCluster({ count: Math.round(18 * scale), seed: 21, spread: 0.9 });
  mushroomCluster.position.set(-1.05, 0, 0.55);
  scene.add(mushroomCluster);
  const mushroomLight = new THREE.PointLight(0xff8a4d, 1.6, 2.4, 2);
  mushroomLight.position.set(-1.05, 0.8, 0.8);
  scene.add(mushroomLight);

  const candle = createCandleCluster({ count: 2, seed: 301 });
  candle.group.position.set(1.0, 0, 0.7);
  scene.add(candle.group);

  const dust = createDustField({ count: Math.round(36 * scale), spread: 2.2 });
  scene.add(dust.mesh);
  const foliage = createFoliageCluster({ count: Math.round(18 * scale), spread: 2.6, seed: 940 });
  scene.add(foliage.mesh);

  // --- Interazione: drag per orbitare -----------------------------------
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idleTimer = 0;
  const IDLE_DELAY = 2.2;

  function onPointerDown(e) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    idleTimer = 0;
    canvas.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    azimuth -= dx * 0.006;
    polar = Math.min(1.55, Math.max(0.75, polar - dy * 0.005));
    idleTimer = 0;
  }
  function onPointerUp() {
    dragging = false;
  }
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // --- Loop di render: rAF proprio, damping frame-rate-independent --------
  // (niente da scrollare qui: la scena non ha una narrativeT, quindi non
  // riusiamo createRenderLoop dell'engine — quello serve al percorso camera
  // pilotato dallo scroll, questo è un giroscopio locale sul drag.)
  const clock = new THREE.Clock();
  let running = false;
  let raf = 0;

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;

    const dtRaw = clock.getDelta();
    const dt = Math.min(dtRaw, 0.05);
    const time = clock.elapsedTime;

    if (!dragging && !reducedMotion) {
      idleTimer += dt;
      if (idleTimer > IDLE_DELAY) azimuth += dt * 0.06; // deriva lentissima
    }
    applyCamera(Math.min(dtRaw, 0.25));

    const breathe = reducedMotion ? 0.6 : 0.6 + Math.sin(time * 0.6) * 0.35;
    skull.update(breathe, time);
    mushroom.update(reducedMotion ? 0.5 : 0.4 + Math.sin(time * 0.9) * 0.25);
    if (!reducedMotion) {
      dust.update(time, 1);
      foliage.update(time, 1);
      candle.update(1, time);
    } else {
      candle.update(1, 0);
    }

    renderer.render(scene, camera);
  }

  function resize(w, h) {
    if (w <= 0 || h <= 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Ridimensionare il canvas ne cancella il contenuto (drawing buffer
    // ricreato): se il loop è in pausa (stage fuori schermo, tab nascosta)
    // nessun frame lo riempirebbe più finché non riprende. Un render
    // sincrono qui garantisce che il canvas non resti mai nero.
    if (ready) renderer.render(scene, camera);
  }

  let ready = false;
  const readyPromise = new Promise((resolve) => {
    requestAnimationFrame(() => {
      renderAzimuth = azimuth;
      renderPolar = polar;
      camera.position.set(
        target.x + radius * Math.sin(renderPolar) * Math.sin(renderAzimuth),
        target.y + radius * Math.cos(renderPolar),
        target.z + radius * Math.sin(renderPolar) * Math.cos(renderAzimuth),
      );
      camera.lookAt(target);
      // Pre-warm: un frame reale basta per questa scena compatta (poche
      // centinaia di primitive, non un mondo intero da precompilare).
      renderer.render(scene, camera);
      ready = true;
      resolve();
    });
  });

  return {
    ready: readyPromise,
    resize,
    pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    resume() {
      if (!ready || running) return;
      running = true;
      clock.getDelta();
      frame();
    },
    start() {
      if (running) return;
      running = true;
      clock.getDelta();
      frame();
    },
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      scene.environment?.dispose?.();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m) => {
            m.map?.dispose?.();
            m.dispose?.();
          });
        }
      });
      renderer.dispose();
    },
  };
}
