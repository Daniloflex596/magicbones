/**
 * ============================================================================
 *  world.js — Il Sottobosco
 * ============================================================================
 *  Assembla la scena e la restituisce al boot. Nessun timer autonomo: ogni
 *  animazione nasce da un segnale di scroll (proximity / fillOnce) passato
 *  dall'esterno in `update()`.
 *
 *  Atmosfera (regole della skill, tutte e tre insieme o la scena si spegne):
 *    - tone mapping ACES + toneMappingExposure ~1.45
 *    - FogExp2 dello STESSO colore del background (fog di tinta diversa si vede
 *      come un muro di nebbia colorata)
 *    - ambiente PMREM da un gradiente coerente col mood
 * ============================================================================
 */
import * as THREE from 'three';
import { makeEnvTexture } from './engine/canvas-textures.js';
import { STATIONS } from './stations.js';
import { createCameraRig } from './engine/camera-rig.js';
import { createUndergrowth, pathXAt } from './objects/undergrowth.js';
import { createAmanita } from './objects/amanita.js';
import { createBoneColumn } from './objects/bone-column.js';

const SOIL = 0x1a1533;
const SOIL_DEEP = 0x0f0b1e;

export function initWorld(canvas, { tier = 'high', dpr = 2 } = {}) {
  // --- Renderer -------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier === 'high',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // --- Scena ----------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SOIL_DEEP);
  // Stessa tinta del background: la nebbia "mangia" la profondita senza
  // disegnare un muro colorato.
  scene.fog = new THREE.FogExp2(SOIL_DEEP, 0.052);

  // Ambiente: indaco -> violetto -> nero. E la luce diffusa del sottobosco.
  const env = makeEnvTexture(renderer, ['#241d3d', '#3a2a5c', '#0f0b1e']);
  scene.environment = env;

  // --- Camera ---------------------------------------------------------------
  const rig = createCameraRig({ stations: STATIONS, aspect: 1 });
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);

  // --- Luci ambientali ------------------------------------------------------
  // Volutamente scarse: la luce vera viene dai funghi e dalle candele.
  scene.add(new THREE.AmbientLight(0x3a2a5c, 0.55));
  const moon = new THREE.DirectionalLight(0x8b5fc9, 0.4);
  moon.position.set(-3, 8, 2);
  scene.add(moon);

  // --- Il suolo -------------------------------------------------------------
  const undergrowth = createUndergrowth(scene, { tier });

  // --- La volta di amanite --------------------------------------------------
  // Disposte AI LATI del percorso e a quote diverse: la camera ci passa sotto e
  // in mezzo. Sfasamento deterministico, nessuna uguale all'altra.
  const amanitas = [];
  const AMANITA_PLAN = tier === 'low'
    ? [[9.0, -1], [6.0, 1], [2.4, -1], [-1.4, 1], [-5.0, -1], [-8.6, 1]]
    : [[10.2, 1], [9.0, -1], [7.2, 1], [6.0, -1], [4.2, 1], [2.4, -1],
       [0.6, 1], [-1.4, -1], [-3.2, 1], [-5.0, -1], [-7.0, 1], [-8.6, -1],
       [-10.4, 1], [-12.0, -1]];
  AMANITA_PLAN.forEach(([z, side], i) => {
    const seed = i * 3 + 7;
    const big = i % 3 === 0;
    const a = createAmanita(seed, {
      radius: big ? 0.85 : 0.58,
      height: big ? 0.6 : 0.42,
      stemH: big ? 2.5 : 1.7,
      tier,
    });
    a.group.position.set(pathXAt(z) + side * (1.25 + (i % 4) * 0.42), 0, z);
    scene.add(a.group);
    amanitas.push(a);
  });

  // --- IL SIGNATURE MOMENT: le colonne d'osso -------------------------------
  // Stazione 1. Tre colonne DISTINTE (non varianti dello stesso mesh: forme,
  // palette e corna diverse), in FILA lungo il percorso sulla sinistra, cosi la
  // camera — che sta a destra e guarda a sinistra — ci passa accanto una dopo
  // l'altra invece di vederle in colonna.
  const boneColumns = [];
  [
    { z: 5.9, variant: 1, withHorns: true },   // toro col pentagramma
    { z: 4.7, variant: 0, withHorns: true },   // capra, mandala turchese
    { z: 3.5, variant: 2, withHorns: false },  // uccello, ametista
  ].forEach((cfg, i) => {
    const col = createBoneColumn(i * 5 + 11, { variant: cfg.variant, withHorns: cfg.withHorns, tier });
    col.group.position.set(pathXAt(cfg.z) - (1.15 + i * 0.14), 0, cfg.z);
    scene.add(col.group);
    boneColumns.push(col);
  });

  // Fra le colonne d'osso mettiamo dei VERI gambi di fungo senza cappello:
  // sono loro a rendere credibile l'equivoco. Senza, le tre ossa sarebbero
  // ovvie fin dal primo sguardo e la rivelazione non esisterebbe.
  const decoyGeo = new THREE.CylinderGeometry(0.1, 0.16, 1.5, tier === 'low' ? 8 : 12, 2);
  const decoyMat = new THREE.MeshStandardMaterial({
    color: 0xdcc59e, roughness: 0.8, emissive: 0xf2e0c4, emissiveIntensity: 0.06,
  });
  [6.5, 5.3, 4.1, 3.0].forEach((z, i) => {
    const d = new THREE.Mesh(decoyGeo, decoyMat);
    d.position.set(pathXAt(z) - (1.5 + (i % 2) * 0.5), 0.75, z);
    d.rotation.z = (i % 2 ? 1 : -1) * 0.1;
    scene.add(d);
  });

  // --- Resize ---------------------------------------------------------------
  function resize(w, h) {
    renderer.setSize(w, h, false);
    rig.onResize(camera, w / h);
  }

  return {
    renderer,
    scene,
    camera,
    applyCamera: rig.applyCamera,
    resize,

    /**
     * Unico punto di ingresso delle animazioni. `signals` arriva dalla timeline
     * di scroll: nessun timer, nessuna vita autonoma.
     */
    update({ time, signals }) {
      undergrowth.update(time);

      // Le amanite respirano solo dove la sezione corrispondente e centrata.
      // Sfasamento i*0.4: senza, lo sguardo legge un'unica animazione meccanica.
      const ambient = signals.ambient ?? 0;
      amanitas.forEach((a, i) => {
        a.setGlow(ambient * (0.55 + 0.45 * Math.sin(time * 0.6 + i * 0.4)) * 0.5 + ambient * 0.5);
      });

      // Il gesto primario del sito. Sfasato leggermente per colonna cosi si
      // accendono una dopo l'altra mentre ci passi accanto.
      const reveal = signals.ossa ?? 0;
      boneColumns.forEach((c, i) => {
        c.setReveal(Math.max(0, Math.min(1, reveal * 1.35 - i * 0.18)));
      });
    },

    dispose() {
      undergrowth.dispose();
      amanitas.forEach((a) => a.dispose());
      boneColumns.forEach((c) => c.dispose());
      decoyGeo.dispose();
      decoyMat.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
