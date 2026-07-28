/**
 * ============================================================================
 *  jar.js — il barattolo di vetro: un pezzo di Claudia, in teca
 * ============================================================================
 *  Il logo di Magic Bones e una mano che regge un barattolo con dentro un
 *  teschio. Quindi il sottobosco e punteggiato di barattoli posati tra le
 *  radici: dentro ognuno c'e un pezzo vero, illuminato da dentro.
 *
 *  Perche una FOTO dentro un oggetto 3D e non un modello del prodotto:
 *  il 3D procedurale non puo competere con il lavoro vero di Claudia — e non
 *  deve. Il mondo e la cornice, il contenuto e roba sua, fotografata. Cosi il
 *  3D mette in teca il prodotto invece di sostituirlo con un'approssimazione.
 *
 *  Il barattolo nasce OPACO color osso e la foto compare quando la texture e
 *  pronta: le texture si caricano dopo il pre-warm, per non ritardare il primo
 *  fotogramma.
 * ============================================================================
 */
import * as THREE from 'three';
import { makeMat } from '../engine/material-factory.js';
import { pseudo } from '../engine/canvas-textures.js';

/**
 * @param seed       deterministico: inclinazione, rotazione
 * @param productId  finisce in userData: e cosi che il raycast risale al prodotto
 * @param tier       'high' | 'low' — su low niente vetro con transmission
 */
export function createJar(seed, { productId, tier = 'high', height = 0.62 } = {}) {
  const g = new THREE.Group();
  const disposables = [];
  const R = height * 0.36;

  // --- Il vetro -------------------------------------------------------------
  // `transmission` (rifrazione vera) e bello ma costa: richiede un passaggio di
  // rendering in piu. Su mobile si degrada a un semplice materiale trasparente,
  // che a quella dimensione sullo schermo e indistinguibile.
  const glassGeo = new THREE.CylinderGeometry(R, R * 0.94, height, tier === 'low' ? 12 : 22, 1, true);
  const glassMat =
    tier === 'low'
      ? makeMat(0xbcd8e0, { r: 0.12, m: 0, transparent: true, opacity: 0.26, side: THREE.DoubleSide })
      : new THREE.MeshPhysicalMaterial({
          color: 0xd6ecf2,
          roughness: 0.08,
          metalness: 0,
          transmission: 0.92,
          thickness: 0.14,
          ior: 1.45,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = height / 2;
  g.add(glass);
  disposables.push(glassGeo, glassMat);

  // --- Fondo e tappo di sughero ---------------------------------------------
  const baseGeo = new THREE.CylinderGeometry(R * 0.96, R * 0.9, 0.045, tier === 'low' ? 12 : 20);
  const baseMat = makeMat(0x9c7a4a, { r: 0.88 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.022;
  g.add(base);

  const corkGeo = new THREE.CylinderGeometry(R * 0.82, R * 0.9, 0.1, tier === 'low' ? 12 : 18);
  const cork = new THREE.Mesh(corkGeo, baseMat);
  cork.position.y = height + 0.035;
  g.add(cork);
  disposables.push(baseGeo, corkGeo, baseMat);

  // --- Il contenuto: la foto ------------------------------------------------
  // Piano leggermente incurvato (una PlaneGeometry segmentata, con i lati
  // piegati indietro): dentro un cilindro di vetro una foto perfettamente
  // piatta si legge come un adesivo, curvata sembra posata nel barattolo.
  const photoGeo = new THREE.PlaneGeometry(R * 1.72, R * 1.72, 8, 1);
  const pp = photoGeo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i);
    pp.setZ(i, -Math.abs(x) * 0.28);
  }
  photoGeo.computeVertexNormals();
  const photoMat = makeMat(0xdcc59e, {
    r: 0.85,
    e: 0xdcc59e,
    ei: 0.25, // acceso dal basso: e la luce interna del barattolo
    side: THREE.DoubleSide,
  });
  const photo = new THREE.Mesh(photoGeo, photoMat);
  photo.position.y = height * 0.52;
  g.add(photo);
  disposables.push(photoGeo, photoMat);

  // --- La luce dentro il barattolo ------------------------------------------
  // Senza, il barattolo e un oggetto scuro come tutto il resto e non attira
  // l'occhio. Con, e una piccola lanterna: e lei a dire "qui c'e qualcosa".
  const innerLight = new THREE.PointLight(0xffd9a0, 1.1, 2.2, 2);
  innerLight.position.y = height * 0.45;
  g.add(innerLight);

  // --- Zona sensibile al tocco ----------------------------------------------
  // Un cilindro invisibile piu generoso del barattolo: colpire il vetro sottile
  // con il dito su un telefono e frustrante. Il bersaglio del raycast e questo,
  // non la geometria visibile.
  const hitGeo = new THREE.CylinderGeometry(R * 1.5, R * 1.5, height * 1.5, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.position.y = height * 0.6;
  hit.userData.productId = productId;
  g.add(hit);
  disposables.push(hitGeo, hitMat);

  g.rotation.y = pseudo(seed * 3.1) * Math.PI * 2;
  g.rotation.z = (pseudo(seed * 5.3) - 0.5) * 0.1;

  let hovered = 0;
  let prossimita = 0;

  function applyGlow() {
    const k = Math.max(prossimita, hovered);
    photoMat.emissiveIntensity = 0.25 + k * 0.65;
    innerLight.intensity = 1.1 + k * 2.6;
  }

  return {
    group: g,
    productId,
    /** Bersaglio del raycast: uno solo per barattolo, non tutta la geometria. */
    hitMesh: hit,

    /** Carica la foto DOPO il pre-warm, senza bloccare il primo fotogramma. */
    async loadPhoto(url, loader) {
      try {
        const tex = await loader.loadAsync(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        photoMat.map = tex;
        photoMat.emissiveMap = tex;
        photoMat.color.set(0xffffff);
        photoMat.needsUpdate = true;
        disposables.push(tex);
      } catch {
        // Foto non disponibile: resta il piano color osso, il barattolo
        // funziona lo stesso. Mai un rettangolo nero.
      }
    },

    /** `k` 0..1 dalla proximity della sezione: il barattolo centrato si accende. */
    setHighlight(k) {
      prossimita = k;
      applyGlow();
    },
    /** Rinforzo su desktop. Non e mai l'unica affordance: su mobile non esiste. */
    setHover(on) {
      hovered = on ? 1 : 0;
      applyGlow();
    },

    dispose() {
      disposables.forEach((d) => d.dispose && d.dispose());
    },
  };
}
