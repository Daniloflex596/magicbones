/**
 * ============================================================================
 *  undergrowth.js — il suolo del sottobosco
 * ============================================================================
 *  Terreno, cuscini di muschio, foglie petrolio, pulviscolo di spore.
 *  Tutto procedurale, tutto deterministico (`pseudo`, mai Math.random).
 *
 *  Il muschio e giallo-acido come sulla card di Claudia, non verde bosco: e il
 *  colore che, insieme al rosso dei cappelli, rende il mondo "illustrato" invece
 *  che "notturno di buon gusto". Sono centinaia di ciuffi, quindi InstancedMesh:
 *  un solo draw call.
 * ============================================================================
 */
import * as THREE from 'three';
import { makeMat } from '../engine/material-factory.js';
import { pseudo } from '../engine/canvas-textures.js';

const PATH_Z0 = 12;
const PATH_Z1 = -14;

/** Il sentiero non e dritto: serpeggia piano, cosi la camera non va su un righello. */
export function pathXAt(z) {
  const u = (PATH_Z0 - z) / (PATH_Z0 - PATH_Z1);
  return Math.sin(u * Math.PI * 1.6) * 0.55;
}

/**
 * Alone morbido per le spore. Senza una texture, `PointsMaterial` disegna
 * quadrati con gli spigoli vivi: e il singolo dettaglio che piu tradisce una
 * scena WebGL fatta in fretta.
 */
function makeSporeTexture() {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,235,195,0.82)');
  g.addColorStop(0.65, 'rgba(255,220,160,0.18)');
  g.addColorStop(1, 'rgba(255,220,160,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createUndergrowth(scene, { tier = 'high' } = {}) {
  const group = new THREE.Group();
  const dispose = [];

  // --- Terreno ---------------------------------------------------------------
  // Un piano ondulato: le radici e i dislivelli si leggono meglio della
  // superficie piatta, e costano solo qualche vertice.
  // Grande e mosso. Prima era 26x32 e quasi nero: oltre il bordo si vedeva il
  // vuoto, e il terreno stesso leggeva come un buco. Ora arriva oltre la
  // nebbia, cosi il suolo finisce dentro la foschia e non su uno spigolo.
  const groundGeo = new THREE.PlaneGeometry(90, 90, 90, 90);
  const pos = groundGeo.attributes.position;
  const colori = [];
  const terra = new THREE.Color(0x3b2f5e);
  const muschio = new THREE.Color(0x4d4a1e);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Dossi a piu frequenze: radici, avvallamenti, grumi. Un piano liscio si
    // legge come pavimento, non come terreno.
    const h =
      Math.sin(x * 0.55) * 0.16 +
      Math.cos(y * 0.42) * 0.13 +
      Math.sin(x * 1.7 + y * 1.3) * 0.07 +
      (pseudo(i * 1.7) - 0.5) * 0.05;
    pos.setZ(i, h);
    // Chiazze di muschio dipinte nei vertici: variazione di colore a costo
    // zero, ed e cio che toglie l'aspetto "moquette viola uniforme".
    const chiazza = (Math.sin(x * 0.9 + 1.3) * Math.cos(y * 0.7) + 1) / 2;
    const c = terra.clone().lerp(muschio, chiazza * 0.55 + pseudo(i * 3.3) * 0.2);
    colori.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colori, 3));
  groundGeo.computeVertexNormals();
  const groundMat = makeMat(0xffffff, { r: 0.94, m: 0, vertexColors: true });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, -1);
  group.add(ground);
  dispose.push(groundGeo, groundMat);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();

  // --- Cuscini di muschio (InstancedMesh + colori per istanza) ---------------
  // Il muschio e la sorgente di luce fredda del mondo. La variazione di colore
  // PER ISTANZA e cio che lo distingue da coriandoli gialli piatti: senza,
  // trecento blob dello stesso identico giallo si leggono come vernice.
  // I toni vanno dal giallo acido della card al verde oliva quasi spento.
  const MOSS_TONES = [0xd8cb2a, 0xb9ad1e, 0x8f8416, 0x6f6410, 0xa89818];
  const mossCount = tier === 'low' ? 150 : 320;
  const mossGeo = new THREE.IcosahedronGeometry(0.13, 0);
  const mossMat = makeMat(0xffffff, { r: 0.95, e: 0x6f6410, ei: 0.22, flatShading: true });
  const moss = new THREE.InstancedMesh(mossGeo, mossMat, mossCount);
  for (let i = 0; i < mossCount; i++) {
    const z = PATH_Z0 - pseudo(i * 3.1) * (PATH_Z0 - PATH_Z1);
    // I ciuffi stanno AI LATI del sentiero: il percorso si legge come percorso
    // e la camera non attraversa il muschio.
    const side = pseudo(i * 5.7) > 0.5 ? 1 : -1;
    const off = 0.75 + pseudo(i * 7.3) * 3.6;
    // Mezzo interrati: un blob appoggiato sopra il terreno galleggia, uno che
    // affonda si legge come cuscino cresciuto li.
    p.set(pathXAt(z) + side * off, -0.075 + pseudo(i * 2.9) * 0.05, z);
    q.setFromEuler(
      new THREE.Euler(
        (pseudo(i * 15.1) - 0.5) * 0.5,
        pseudo(i * 11.3) * Math.PI * 2,
        (pseudo(i * 17.3) - 0.5) * 0.5,
      ),
    );
    const sc = 0.45 + pseudo(i * 13.7) * 1.35;
    s.set(sc, sc * (0.42 + pseudo(i * 4.1) * 0.34), sc);
    m.compose(p, q, s);
    moss.setMatrixAt(i, m);
    col.setHex(MOSS_TONES[Math.floor(pseudo(i * 19.7) * MOSS_TONES.length) % MOSS_TONES.length]);
    moss.setColorAt(i, col);
  }
  moss.instanceMatrix.needsUpdate = true;
  if (moss.instanceColor) moss.instanceColor.needsUpdate = true;
  group.add(moss);
  dispose.push(mossGeo, mossMat);

  // --- Foglie petrolio (InstancedMesh) ---------------------------------------
  // Il blu della card: raffredda il rosso, altrimenti il mondo diventa una
  // macchia calda uniforme e i cappelli non staccano piu dal fondo.
  // Piatte e inclinate, non coni verticali: un cono in piedi legge come un
  // triangolo blu conficcato nel terreno.
  const leafCount = tier === 'low' ? 34 : 70;
  const leafGeo = new THREE.ConeGeometry(0.17, 0.46, 4, 1);
  leafGeo.scale(1, 1, 0.22); // appiattita: una foglia, non una piramide
  const leafMat = makeMat(0x1b5069, { r: 0.78, e: 0x2d7a9e, ei: 0.07, flatShading: true });
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  for (let i = 0; i < leafCount; i++) {
    const z = PATH_Z0 - pseudo(i * 2.3 + 40) * (PATH_Z0 - PATH_Z1);
    const side = pseudo(i * 6.1 + 40) > 0.5 ? 1 : -1;
    p.set(pathXAt(z) + side * (1.5 + pseudo(i * 8.7 + 40) * 3.2), 0.1, z);
    q.setFromEuler(
      new THREE.Euler(
        Math.PI * 0.5 + (pseudo(i * 9.3 + 40) - 0.5) * 0.9, // coricate
        pseudo(i * 3.7 + 40) * Math.PI * 2,
        (pseudo(i * 5.1 + 40) - 0.5) * 1.1,
      ),
    );
    const sc = 0.7 + pseudo(i * 12.1 + 40) * 0.8;
    s.set(sc, sc, sc);
    m.compose(p, q, s);
    leaves.setMatrixAt(i, m);
  }
  leaves.instanceMatrix.needsUpdate = true;
  group.add(leaves);
  dispose.push(leafGeo, leafMat);

  // --- Spore sospese ---------------------------------------------------------
  // Pulviscolo bioluminescente: da profondita all'aria e rende visibile il
  // movimento della camera anche dove non c'e geometria vicina.
  //
  // La texture NON e un dettaglio: un PointsMaterial senza `map` disegna
  // QUADRATI a spigoli vivi — la cosa che piu di ogni altra fa sembrare una
  // scena WebGL un esperimento. Qui ogni spora e un alone morbido in additive.
  const sporeTex = makeSporeTexture();
  const sporeCount = tier === 'low' ? 110 : 260;
  const sporeGeo = new THREE.BufferGeometry();
  const sporePos = new Float32Array(sporeCount * 3);
  const sporePhase = new Float32Array(sporeCount);
  for (let i = 0; i < sporeCount; i++) {
    const z = PATH_Z0 - pseudo(i * 1.9 + 90) * (PATH_Z0 - PATH_Z1);
    sporePos[i * 3] = pathXAt(z) + (pseudo(i * 4.7 + 90) - 0.5) * 7;
    sporePos[i * 3 + 1] = 0.15 + pseudo(i * 7.9 + 90) * 2.8;
    sporePos[i * 3 + 2] = z;
    sporePhase[i] = pseudo(i * 10.3 + 90) * Math.PI * 2;
  }
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  const sporeMat = new THREE.PointsMaterial({
    color: 0xffe9c0,
    map: sporeTex,
    size: 0.14,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const spores = new THREE.Points(sporeGeo, sporeMat);
  group.add(spores);
  dispose.push(sporeGeo, sporeMat, sporeTex);

  scene.add(group);

  return {
    group,
    /**
     * Le spore respirano. Ampiezza volutamente minima (±3 cm): la skill avverte
     * che il movimento ambientale non deve mai competere col gesto primario.
     */
    update(time) {
      const a = spores.geometry.attributes.position;
      for (let i = 0; i < sporeCount; i++) {
        a.array[i * 3 + 1] += Math.sin(time * 0.5 + sporePhase[i]) * 0.0012;
      }
      a.needsUpdate = true;
    },
    dispose() {
      dispose.forEach((d) => d.dispose && d.dispose());
      scene.remove(group);
    },
  };
}
