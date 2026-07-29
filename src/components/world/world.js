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
import { createJar } from './objects/jar.js';
import { createForesta } from './objects/foresta.js';

const SOIL_DEEP = 0x0f0b1e;

/**
 * I barattoli dell'atto 2, in FILA lungo il percorso sulla destra: la camera
 * sta a sinistra e ci passa accanto uno dopo l'altro. Tre soggetti DISTINTI —
 * non varianti dello stesso — come impone la ricetta della skill per ogni tappa.
 */
const BARATTOLI_TESCHI = [
  { productId: 'teschio-toro-pentagramma', foto: 'toro-pentagramma.jpg', z: 0.9, off: 1.05, h: 0.72 },
  { productId: 'teschio-uccello-ametista', foto: 'uccello-ametista.jpg', z: -0.35, off: 1.28, h: 0.58 },
  { productId: 'teschio-serpente-scaglie', foto: 'teschio-pitone.jpg', z: -1.6, off: 1.12, h: 0.66 },
];

export function initWorld(canvas, { tier = 'high', dpr = 2, basePath = '/' } = {}) {
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
  // Il fondo NON e nero: e un indaco appena piu chiaro del suolo. Contro il
  // nero puro ogni sagoma lontana sparisce e il mondo si riduce a pochi oggetti
  // incollati sul vuoto — che era esattamente il difetto.
  const ORIZZONTE = 0x191331;
  scene.background = new THREE.Color(ORIZZONTE);
  // Nebbia della STESSA tinta del fondo (una tinta diversa disegnerebbe un muro
  // colorato), ma molto meno densa: a 0.052 il piano intermedio spariva e la
  // foresta di sfondo non si vedeva proprio. A 0.028 la profondita si legge a
  // strati invece di essere inghiottita.
  scene.fog = new THREE.FogExp2(ORIZZONTE, 0.028);

  // Ambiente: indaco -> violetto -> nero. E la luce diffusa del sottobosco.
  const env = makeEnvTexture(renderer, ['#2c2348', '#453466', '#141029']);
  scene.environment = env;

  // --- Camera ---------------------------------------------------------------
  const rig = createCameraRig({ stations: STATIONS, aspect: 1 });
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);

  // --- Luci ambientali ------------------------------------------------------
  // Poche e a costo fisso: la luce di carattere viene dai funghi e dalle
  // candele, ma senza una base il terreno restava un buco nero e gli oggetti
  // sembravano incollati sul vuoto.
  //
  // HemisphereLight: UNA sola luce, costo trascurabile, e fa il lavoro che
  // dieci PointLight facevano male — cielo violetto dall'alto, rimbalzo verde
  // muschio dal basso. E lei a far leggere la MASSA del sottobosco.
  scene.add(new THREE.HemisphereLight(0x6a4f9e, 0x4a4415, 1.15));
  scene.add(new THREE.AmbientLight(0x3a2a5c, 0.4));
  const moon = new THREE.DirectionalLight(0xb49ae0, 0.55);
  moon.position.set(-3, 8, 2);
  scene.add(moon);

  // --- Il suolo -------------------------------------------------------------
  const undergrowth = createUndergrowth(scene, { tier });

  // --- Il sottobosco folto ---------------------------------------------------
  // Centinaia di funghi, felci, erba e tronchi in 6 draw call (InstancedMesh).
  // Senza questo strato si vedeva il vuoto nero tra un oggetto e l'altro.
  const foresta = createForesta(scene, { tier });

  // --- La volta di amanite --------------------------------------------------
  // Disposte AI LATI del percorso e a quote diverse: la camera ci passa sotto e
  // in mezzo. Sfasamento deterministico, nessuna uguale all'altra.
  const amanitas = [];
  const AMANITA_PLAN = tier === 'low'
    ? [[9.0, -1], [6.0, 1], [2.4, -1], [-1.4, 1], [-5.0, -1], [-8.6, 1]]
    : [[10.2, 1], [9.0, -1], [7.2, 1], [6.0, -1], [4.2, 1], [2.4, -1],
       [0.6, 1], [-1.4, -1], [-3.2, 1], [-5.0, -1], [-7.0, 1], [-8.6, -1],
       [-10.4, 1], [-12.0, -1]];
  // Budget luci: SOLO le amanite grandi ne hanno una. Le altre restano
  // bioluminescenti tramite emissive, che non costa niente. Su mobile nessuna.
  const MAX_LUCI_AMANITA = tier === 'low' ? 0 : 4;
  let luciAssegnate = 0;
  AMANITA_PLAN.forEach(([z, side], i) => {
    const seed = i * 3 + 7;
    const big = i % 3 === 0;
    const conLuce = big && luciAssegnate < MAX_LUCI_AMANITA;
    if (conLuce) luciAssegnate++;
    const a = createAmanita(seed, {
      radius: big ? 0.85 : 0.58,
      height: big ? 0.6 : 0.42,
      stemH: big ? 2.5 : 1.7,
      tier,
      conLuce,
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

  // --- ATTO 2: i barattoli --------------------------------------------------
  // Il logo di Claudia e una mano che regge un barattolo con dentro un teschio.
  // Qui i barattoli stanno tra le radici, ognuno con dentro una sua foto vera.
  const jars = [];
  BARATTOLI_TESCHI.forEach((cfg, i) => {
    const j = createJar(i * 7 + 23, { productId: cfg.productId, tier, height: cfg.h });
    j.group.position.set(pathXAt(cfg.z) + cfg.off, 0, cfg.z);
    scene.add(j.group);
    jars.push({ ...cfg, obj: j });
  });

  /**
   * Le texture partono DOPO il pre-warm: se le caricassimo qui bloccherebbero
   * il primo fotogramma per ~300 KB di JPEG. Fino ad allora ogni barattolo
   * mostra un piano color osso — mai un rettangolo nero.
   */
  function loadPhotos() {
    const loader = new THREE.TextureLoader();
    const base = basePath.endsWith('/') ? basePath : basePath + '/';
    return Promise.all(jars.map(({ obj, foto }) => obj.loadPhoto(`${base}foto/jar/${foto}`, loader)));
  }

  // --- Resize ---------------------------------------------------------------
  function resize(w, h) {
    renderer.setSize(w, h, false);
    rig.onResize(camera, w / h);
  }

  // --- Interazione ----------------------------------------------------------
  /** Bersagli del raycast: solo le zone sensibili, mai l'intera scena. */
  const pickables = jars.map(({ obj }) => obj.hitMesh);

  /**
   * Dove si trova un prodotto sullo schermo, in px. Serve al volo verso il
   * barattolo-carrello: l'animazione parte dal punto esatto in cui l'utente ha
   * visto l'oggetto, non da un angolo qualsiasi.
   */
  function projectToScreen(productId) {
    const voce = jars.find((j) => j.productId === productId);
    if (!voce) return null;
    const v = new THREE.Vector3();
    voce.obj.group.getWorldPosition(v);
    v.y += voce.h * 0.5;
    v.project(camera);
    const r = canvas.getBoundingClientRect();
    return {
      x: r.left + ((v.x + 1) / 2) * r.width,
      y: r.top + ((-v.y + 1) / 2) * r.height,
      visibile: v.z < 1,
    };
  }

  function setHover(productId) {
    jars.forEach(({ obj }) => obj.setHover(obj.productId === productId));
  }

  return {
    renderer,
    scene,
    camera,
    applyCamera: rig.applyCamera,
    resize,
    loadPhotos,
    pickables,
    projectToScreen,
    setHover,

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

      // I barattoli si accendono quando l'atto dei teschi e centrato: e il
      // segnale che dice "questi si possono prendere".
      const teschi = signals.teschi ?? 0;
      jars.forEach(({ obj }, i) => {
        obj.setHighlight(Math.max(0, Math.min(1, teschi * 1.25 - i * 0.12)));
      });
    },

    dispose() {
      undergrowth.dispose();
      foresta.dispose();
      amanitas.forEach((a) => a.dispose());
      boneColumns.forEach((c) => c.dispose());
      jars.forEach(({ obj }) => obj.dispose());
      decoyGeo.dispose();
      decoyMat.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
