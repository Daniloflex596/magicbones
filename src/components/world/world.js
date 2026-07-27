/**
 * world.js — costruisce il mondo 3D e lo collega alla timeline di scroll.
 * Entry point per bootImmersive({ loadEngine }): initWorld(canvas,{tier}).
 * Nessun asset di rete: solo geometrie procedurali + texture su canvas.
 */
import * as THREE from 'three';
import Lenis from 'lenis';
import { createCameraRig } from './engine/camera-rig.js';
import { createRenderLoop, prewarm } from './engine/render-loop.js';
import { makeTimeline } from './engine/scroll-timeline.js';
import { makeEnvTexture } from './engine/canvas-textures.js';
import { pixelRatioFor, tierSettings } from './engine/capability.js';
import { makeMat } from './engine/material-factory.js';
import { STATIONS, TIMELINE_SECTIONS, LAST_STATION } from './stations.js';

import { createTrunkField, createDustField, createFoliageCluster } from './objects/forest.js';
import { createHeroMushroom, createMushroomCluster } from './objects/mushroom.js';
import { createSkullAltar } from './objects/skull.js';
import { createPendantBranch } from './objects/pendant.js';
import { createCandleCluster, createZodiacDisc, createDriedFlowerCluster } from './objects/candle.js';
import { createLanternField } from './objects/lantern-field.js';
import { createWorkbenchAltar } from './objects/workbench.js';

const BG = '#0c0f1a';

export function initWorld(canvas, { tier = 'high' } = {}) {
  const settings = tierSettings(tier);
  const scale = settings.instanceScale;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: settings.antialias,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.setPixelRatio(pixelRatioFor(tier));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.024);
  scene.environment = makeEnvTexture(renderer, ['#1c1f2e', '#2f2438', '#05060b']);

  const initialAspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(55, initialAspect, 0.1, 60);
  const rig = createCameraRig({ stations: STATIONS, aspect: initialAspect });
  camera.fov = rig.fovForAspect(initialAspect);
  camera.updateProjectionMatrix();

  const tl = makeTimeline(TIMELINE_SECTIONS, { lastStation: LAST_STATION });
  const { vw, vh } = tl.viewport();
  renderer.setSize(vw, vh);

  // ---------------------------------------------------------------------
  // Luce ambiente minima (l'IBL della PMREM fa il grosso del lavoro).
  // ---------------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0x2a2a3a, 0.4));

  // ---------------------------------------------------------------------
  // Stazione 0 — Soglia del Bosco
  // ---------------------------------------------------------------------
  const trunks = createTrunkField({ count: Math.round(40 * scale) });
  trunks.position.z = 6;
  scene.add(trunks);
  const dust = createDustField({ count: Math.round(90 * scale), spread: 14 });
  dust.mesh.position.z = 5;
  scene.add(dust.mesh);
  const foliage = createFoliageCluster({ count: Math.round(50 * scale), spread: 13, seed: 900 });
  foliage.mesh.position.z = 5;
  scene.add(foliage.mesh);

  // ---------------------------------------------------------------------
  // Stazione 1 — Radura dei Funghi
  // ---------------------------------------------------------------------
  const funghiGroup = new THREE.Group();
  funghiGroup.position.set(-0.5, 0, 2.2);
  const heroA = createHeroMushroom({ capColor: 0xe8452b, scale: 1.0, seed: 10 });
  heroA.group.position.set(-0.7, 0, 0.1);
  const heroB = createHeroMushroom({ capColor: 0x8b5cf6, glowColor: 0xa78bfa, scale: 0.68, seed: 40 });
  heroB.group.position.set(0.55, 0, -0.5);
  const cluster1 = createMushroomCluster({ count: Math.round(60 * scale), seed: 20 });
  cluster1.position.set(0, 0, -0.2);
  funghiGroup.add(heroA.group, heroB.group, cluster1);
  scene.add(funghiGroup);
  const funghiLight = new THREE.PointLight(0xff8a4d, 3.5, 4, 2);
  funghiLight.position.set(-0.5, 1.1, 2.4);
  scene.add(funghiLight);

  // ---------------------------------------------------------------------
  // Stazione 2 — Altare dei Teschi (3 pezzi distinti, in fila)
  // ---------------------------------------------------------------------
  const skullConfigs = [
    { boneColor: 0xe4d9b8, accentColor: 0x2fb8c4, browWidth: 1.1, snoutLength: 1.2, hornCurve: 1.2, seed: 1 },
    { boneColor: 0xdac9a0, accentColor: 0xd4a537, browWidth: 0.85, snoutLength: 0.8, hornCurve: 0.7, seed: 55 },
    { boneColor: 0xece2c8, accentColor: 0x8b5cf6, browWidth: 1.0, snoutLength: 1.0, hornCurve: 1.5, seed: 88 },
  ];
  const skulls = skullConfigs.map((cfg, i) => {
    const s = createSkullAltar(cfg);
    s.group.scale.setScalar(0.75);
    s.group.position.set(2.6 + i * 0.15, 0, -2.0 - i * 1.1);
    scene.add(s.group);
    const light = new THREE.PointLight(0xffcf9e, 2.4, 4, 2);
    light.position.set(2.8, 1.5, -2.0 - i * 1.1 + 0.3);
    scene.add(light);
    return s;
  });

  // ---------------------------------------------------------------------
  // Stazione 3 — Il Filo Nero
  // ---------------------------------------------------------------------
  const pendantBranch = createPendantBranch({ count: 5, seed: 200 });
  pendantBranch.group.position.set(-1.7, 0, -4.0);
  scene.add(pendantBranch.group);
  const moonLight = new THREE.SpotLight(0xbcd0ff, 2.6, 6, Math.PI / 7, 0.5, 1.5);
  moonLight.position.set(-1.7, 3.2, -3.8);
  moonLight.target.position.set(-1.7, 1.0, -4.0);
  scene.add(moonLight, moonLight.target);

  // ---------------------------------------------------------------------
  // Stazione 4 — Il Focolare Rituale
  // ---------------------------------------------------------------------
  const focolareGroup = new THREE.Group();
  focolareGroup.position.set(2.0, 0.55, -8.1);
  const altarSlab = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.06, 0.9),
    makeMat(0x1a1712, { r: 0.85 }),
  );
  altarSlab.position.y = -0.03;
  const candles = createCandleCluster({ count: 5, seed: 300 });
  const zodiac = createZodiacDisc({ radius: 0.42 });
  zodiac.position.set(0.5, 0.02, 0.3);
  const flowers = createDriedFlowerCluster({ count: Math.round(24 * scale), seed: 400 });
  flowers.position.set(-0.3, 0, 0.2);
  focolareGroup.add(altarSlab, candles.group, zodiac, flowers);
  scene.add(focolareGroup);
  const focolareLight = new THREE.PointLight(0xe8452b, 2.8, 3.5, 2);
  focolareLight.position.set(2.0, 1.4, -8.1);
  scene.add(focolareLight);

  // ---------------------------------------------------------------------
  // Stazione 5 — Panoramica del Bosco (riuso lanterne distanti)
  // ---------------------------------------------------------------------
  const panorama = createLanternField({ count: Math.round(26 * scale), spreadX: 5, spreadZ: 13, baseY: 0.8, seed: 500 });
  panorama.mesh.position.z = -2;
  scene.add(panorama.mesh);

  // ---------------------------------------------------------------------
  // Stazione 6 — Contro-campo, l'Altare di Claudia
  // ---------------------------------------------------------------------
  const workbench = createWorkbenchAltar({});
  workbench.group.position.set(0.1, 0, -12.6);
  scene.add(workbench.group);

  // ---------------------------------------------------------------------
  // Stazione 7 — Chiusura: una lanterna finale ravvicinata
  // ---------------------------------------------------------------------
  const closingLantern = createLanternField({ count: 6, spreadX: 0.6, spreadZ: 0.6, baseY: 1.3, seed: 700 });
  closingLantern.mesh.position.set(0, 0, -13.6);
  scene.add(closingLantern.mesh);

  // ---------------------------------------------------------------------
  // Lenis smooth scroll — un solo rAF guida sia lenis.raf che il render
  // (Livello C §5): l'inerzia dello scroll è il "peso" su cui si innesta
  // il damping frame-rate-independent della camera.
  // ---------------------------------------------------------------------
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

  let controAltareLatch = 0;

  const loop = createRenderLoop({
    renderer,
    scene,
    camera,
    applyCamera: rig.applyCamera,
    getTargetT: tl.narrativeT,
    microLife: 0.01,
    onFrame: ({ time }) => {
      lenis.raf(time * 1000);

      dust.update(time, tl.proximity('soglia'));
      foliage.update(time, tl.proximity('soglia'));

      const pFunghi = tl.proximity('funghi');
      heroA.update(pFunghi);
      heroB.update(pFunghi);

      const pTeschi = tl.proximity('teschi');
      skulls.forEach((s) => s.update(pTeschi, time));

      const pFilo = tl.proximity('filoNero');
      pendantBranch.update(pFilo, time);

      candles.update(tl.fillOnce('focolare'), time);

      panorama.update(time, tl.proximity('panoramica'));

      controAltareLatch = Math.max(controAltareLatch, tl.proximity('controAltare'));
      workbench.update(controAltareLatch);

      closingLantern.update(time, tl.fillOnce('chiusura'));
    },
  });

  prewarm(renderer, scene, camera, rig.applyCamera);
  loop.start();

  // ---------------------------------------------------------------------
  // Resize: reagisci solo a cambi VERI (Δaltezza > 150px o cambio larghezza),
  // mai al collasso della barra indirizzi mobile (già filtrato da tl).
  // ---------------------------------------------------------------------
  let lastW = vw;
  let lastH = vh;
  function onResize() {
    const { vw: w, vh: h } = tl.viewport();
    if (w !== lastW || Math.abs(h - lastH) > 150) {
      lastW = w;
      lastH = h;
      renderer.setSize(w, h);
      rig.onResize(camera, w / h);
    }
  }
  window.addEventListener('resize', onResize, { passive: true });

  return {
    async prewarm() {
      // già eseguito in modo sincrono sopra prima di loop.start(); l'harness
      // bootImmersive lo chiama comunque per contratto — no-op qui.
    },
    dispose() {
      loop.dispose();
      window.removeEventListener('resize', onResize);
      tl.dispose();
      scene.environment?.dispose?.();
      lenis.destroy();
    },
  };
}
