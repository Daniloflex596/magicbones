/**
 * ============================================================================
 *  bone-column.js — IL SIGNATURE MOMENT
 * ============================================================================
 *  Il nome della bottega e "Magic Bones". Sulla card di Claudia il sottobosco e
 *  fatto di gambi di amanita: colonne pallide, color osso, striate. Le ossa
 *  vere che lei dipinge hanno la stessa silhouette.
 *
 *  Questo oggetto vive di quell'equivoco. Da lontano e a sguardo obliquo e un
 *  gambo di fungo come gli altri. Quando la camera gli passa accanto e la sua
 *  sezione va al centro, una luce sale dal basso e la PITTURA compare sul
 *  cranio: mandala, pentagrammi, fiori — il lavoro di Claudia.
 *
 *  Regia (skill: "at most two competing animated focal elements", "un gesto
 *  primario per beat"): il gesto primario e UNO SOLO — la pittura che emerge.
 *  La colonna non ruota, non fluttua, non pulsa. Tutto il resto della scena si
 *  placa mentre questo accade.
 * ============================================================================
 */
import * as THREE from 'three';
import { makeMat } from '../engine/material-factory.js';
import { pseudo } from '../engine/canvas-textures.js';

/**
 * Texture della pittura: mandala deterministico su fondo trasparente.
 * Va in `emissiveMap` cosi la pittura si ACCENDE invece di essere solo colorata
 * — e cio che permette la rivelazione senza muovere niente.
 */
function makePaintTexture(seed, palette) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.clearRect(0, 0, S, S);

  const cx = S / 2;
  const cy = S * 0.42;
  const petals = 6 + Math.floor(pseudo(seed * 1.7) * 5);
  const rings = 2 + Math.floor(pseudo(seed * 2.9) * 3);

  x.lineWidth = 2.4;
  x.lineCap = 'round';

  // anelli concentrici
  for (let r = 0; r < rings; r++) {
    const rad = S * (0.1 + r * 0.07);
    x.strokeStyle = palette[r % palette.length];
    x.globalAlpha = 0.85;
    x.beginPath();
    x.arc(cx, cy, rad, 0, Math.PI * 2);
    x.stroke();
  }

  // petali radiali
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + pseudo(seed * 3.3) * 0.5;
    const r0 = S * 0.11;
    const r1 = S * (0.2 + pseudo(seed * 4.1 + i) * 0.1);
    x.strokeStyle = palette[i % palette.length];
    x.globalAlpha = 0.95;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    x.quadraticCurveTo(
      cx + Math.cos(a + 0.22) * r1 * 1.15,
      cy + Math.sin(a + 0.22) * r1 * 1.15,
      cx + Math.cos(a) * r1,
      cy + Math.sin(a) * r1,
    );
    x.stroke();
    // puntino terminale
    x.fillStyle = palette[(i + 1) % palette.length];
    x.beginPath();
    x.arc(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 3.2, 0, Math.PI * 2);
    x.fill();
  }

  // goccia centrale
  x.globalAlpha = 1;
  x.fillStyle = palette[0];
  x.beginPath();
  x.arc(cx, cy, S * 0.045, 0, Math.PI * 2);
  x.fill();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const PALETTES = [
  ['#2d7a9e', '#d8cb2a', '#fdf8ee'], // turchese/oro — il teschio di capra
  ['#e8402c', '#fdf8ee', '#d94ec0'], // rosso/magenta — il toro col pentagramma
  ['#d94ec0', '#8b5fc9', '#f2e0c4'], // viola/magenta — l'uccello con ametista
];

/**
 * Una colonna d'osso.
 * @param seed        deterministico: pittura, inclinazione, proporzioni
 * @param variant     0..2 — quale palette e quale forma di cranio
 * @param withHorns   corna (il teschio di toro/capra)
 */
export function createBoneColumn(seed, { variant = 0, withHorns = false, tier = 'high' } = {}) {
  const g = new THREE.Group();
  const disposables = [];

  const shaftH = 1.25 + pseudo(seed * 1.1) * 0.35;

  // --- Il fusto: identico a un gambo di amanita. E l'inganno. ---------------
  // Sottile di proposito: un fusto grosso legge come tronco d'albero, e il
  // cranio in cima diventa "una pallina su un palo" invece di un teschio
  // montato su un osso lungo.
  const shaftGeo = new THREE.CylinderGeometry(0.072, 0.115, shaftH, tier === 'low' ? 8 : 14, 2);
  const sp = shaftGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const px = sp.getX(i);
    const pz = sp.getZ(i);
    const ang = Math.atan2(pz, px);
    const bump = 1 + Math.sin(ang * 6 + seed * 2) * 0.045;
    sp.setX(i, px * bump);
    sp.setZ(i, pz * bump);
  }
  shaftGeo.computeVertexNormals();
  const boneMat = makeMat(0xdcc59e, { r: 0.8, e: 0xf2e0c4, ei: 0.06 });
  const shaft = new THREE.Mesh(shaftGeo, boneMat);
  shaft.position.y = shaftH / 2;
  g.add(shaft);
  disposables.push(shaftGeo);

  // --- Il cranio: qui vive la rivelazione -----------------------------------
  const paint = makePaintTexture(seed, PALETTES[variant % PALETTES.length]);
  // SOLO emissiveMap, mai `map`: la canvas della pittura e trasparente dove non
  // e dipinta, e i pixel trasparenti hanno RGB (0,0,0). Usata come `map`
  // moltiplicherebbe l'osso per nero e il cranio diventerebbe una pietra scura.
  // Come emissiveMap invece somma soltanto: spento = osso, acceso = osso + pittura.
  const skullMat = makeMat(0xe8d9bc, {
    r: 0.68,
    emissiveMap: paint,
    e: 0xffffff,
    ei: 0, // parte SPENTA: da lontano e solo osso pallido
  });
  disposables.push(paint);

  const skull = new THREE.Group();

  // Calotta cranica: allungata in avanti, schiacciata sopra. La proporzione
  // (1 : 0.86 : 1.35) e cio che fa leggere "cranio animale" invece di "palla".
  const craniumGeo = new THREE.SphereGeometry(0.2, tier === 'low' ? 12 : 20, tier === 'low' ? 9 : 16);
  const cranium = new THREE.Mesh(craniumGeo, skullMat);
  cranium.scale.set(1, 0.86, 1.35);
  skull.add(cranium);
  disposables.push(craniumGeo);

  // Muso: si assottiglia in avanti lungo +Z e scende leggermente.
  const snoutGeo = new THREE.CylinderGeometry(0.062, 0.108, 0.34, tier === 'low' ? 8 : 12, 1);
  const snout = new THREE.Mesh(snoutGeo, skullMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.055, 0.3);
  skull.add(snout);
  disposables.push(snoutGeo);

  // Zigomi: due sporgenze laterali. Senza, il muso sembra un tubo incollato.
  const cheekGeo = new THREE.SphereGeometry(0.062, 8, 6);
  [-1, 1].forEach((sgn) => {
    const c = new THREE.Mesh(cheekGeo, skullMat);
    c.position.set(sgn * 0.115, -0.025, 0.12);
    c.scale.set(0.85, 0.7, 1.25);
    skull.add(c);
  });
  disposables.push(cheekGeo);

  // Orbite: due vuoti scuri e PROFONDI. Sono il tratto che rende riconoscibile
  // un teschio a colpo d'occhio, anche piccolo e in movimento.
  const socketGeo = new THREE.SphereGeometry(0.056, 10, 8);
  const socketMat = makeMat(0x120d22, { r: 1, m: 0 });
  [-1, 1].forEach((sgn) => {
    const s = new THREE.Mesh(socketGeo, socketMat);
    s.position.set(sgn * 0.107, 0.028, 0.135);
    s.scale.set(1.05, 1.25, 0.85);
    skull.add(s);
  });
  disposables.push(socketGeo, socketMat);

  if (withHorns) {
    // Corna che partono dietro le orbite e curvano all'indietro e in fuori.
    const hornGeo = new THREE.TorusGeometry(0.17, 0.03, 7, 16, Math.PI * 1.05);
    const hornMat = makeMat(0xb89a72, { r: 0.72 });
    [-1, 1].forEach((sgn) => {
      const h = new THREE.Mesh(hornGeo, hornMat);
      h.position.set(sgn * 0.15, 0.1, -0.05);
      h.rotation.set(Math.PI * 0.5, sgn * 0.5, sgn * -0.95);
      skull.add(h);
    });
    disposables.push(hornGeo, hornMat);
  }

  skull.position.y = shaftH + 0.17;
  // Il cranio guarda VERSO IL SENTIERO (+X, dove passa la camera), con una
  // piccola variazione per colonna: se guardassero tutti nella stessa direzione
  // si leggerebbero come copie dello stesso oggetto.
  skull.rotation.y = Math.PI * 0.42 + (pseudo(seed * 6.7) - 0.5) * 0.45;
  g.add(skull);

  // --- La luce della rivelazione --------------------------------------------
  // Sale dal basso, come una candela posata ai piedi della colonna. Parte a
  // zero: e lei a "scoprire" il cranio, non un cambio di camera.
  const revealLight = new THREE.PointLight(0xf2e0c4, 0, 2.4, 2);
  revealLight.position.set(0, shaftH * 0.45, 0.35);
  g.add(revealLight);

  g.rotation.z = (pseudo(seed * 8.3) - 0.5) * 0.14;

  return {
    group: g,
    /**
     * `k` 0..1 dalla proximity della sezione.
     * UNICO gesto: la pittura si accende e la luce sale. La colonna non si
     * muove di un millimetro — e questo che rende la rivelazione leggibile.
     */
    setReveal(k) {
      const e = k * k; // curva: resta osso a lungo, poi si accende decisa
      skullMat.emissiveIntensity = e * 1.15;
      revealLight.intensity = e * 3.2;
      boneMat.emissiveIntensity = 0.06 + e * 0.1;
    },
    dispose() {
      disposables.forEach((d) => d.dispose && d.dispose());
      boneMat.dispose();
      skullMat.dispose();
    },
  };
}
