/**
 * ============================================================================
 *  amanita.js — le amanite giganti: la volta rossa del sottobosco
 * ============================================================================
 *  Sono l'architettura del mondo, non un soggetto: definiscono il soffitto,
 *  danno la scala ("sono alto quanto un fungo") e sono la sorgente di luce
 *  rossa. La camera passa SOTTO i cappelli.
 *
 *  Il cappello e una Lathe: il profilo disegnato a mano da una curva di punti
 *  da la campana con il bordo che ricasca, che una mezza sfera non da. Sotto,
 *  le lamelle sono un cono rovesciato scanalato.
 * ============================================================================
 */
import * as THREE from 'three';
import { makeMat } from '../engine/material-factory.js';
import { pseudo } from '../engine/canvas-textures.js';

/** Profilo del cappello: dal centro in alto giu fino al bordo che ricasca. */
function capProfile(radius, height) {
  const pts = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    // seno smorzato: cupola piena al centro, bordo che scende e rientra appena
    const r = Math.sin(u * Math.PI * 0.52) * radius;
    const y = Math.cos(u * Math.PI * 0.52) * height - (u > 0.86 ? (u - 0.86) * height * 1.7 : 0);
    pts.push(new THREE.Vector2(Math.max(0.01, r), y));
  }
  return pts;
}

/**
 * Una amanita completa.
 * @param seed  intero: decide inclinazione, macchie, striature — deterministico
 */
export function createAmanita(seed, { radius = 0.62, height = 0.46, stemH = 1.9, tier = 'high', conLuce = false } = {}) {
  const g = new THREE.Group();

  // --- Gambo: color OSSO. E il gioco di parole del brand, in geometria. ------
  const stemGeo = new THREE.CylinderGeometry(0.085, 0.15, stemH, tier === 'low' ? 8 : 14, 3);
  // striature verticali: sposto i vertici verso l'esterno a fasce
  const sp = stemGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    const z = sp.getZ(i);
    const ang = Math.atan2(z, x);
    const bump = 1 + Math.sin(ang * 7 + seed) * 0.05;
    sp.setX(i, x * bump);
    sp.setZ(i, z * bump);
  }
  stemGeo.computeVertexNormals();
  const stemMat = makeMat(0xdcc59e, { r: 0.82, e: 0xf2e0c4, ei: 0.07 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = stemH / 2;
  g.add(stem);

  // --- Cappello -------------------------------------------------------------
  const capGeo = new THREE.LatheGeometry(capProfile(radius, height), tier === 'low' ? 16 : 30);
  const capMat = makeMat(0xe8402c, { r: 0.52, e: 0xc0281a, ei: 0.28 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = stemH;
  g.add(cap);

  // --- Lamelle sotto il cappello --------------------------------------------
  const gillGeo = new THREE.ConeGeometry(radius * 0.94, height * 0.5, tier === 'low' ? 16 : 28, 1, true);
  const gillMat = makeMat(0xd4604e, { r: 0.85, e: 0xd4604e, ei: 0.18, side: THREE.DoubleSide });
  const gills = new THREE.Mesh(gillGeo, gillMat);
  gills.position.y = stemH - height * 0.1;
  gills.rotation.x = Math.PI; // punta in giu
  g.add(gills);

  // --- Puntini bianchi (InstancedMesh) --------------------------------------
  const dotCount = tier === 'low' ? 7 : 13;
  const dotGeo = new THREE.SphereGeometry(0.035, 6, 5);
  const dotMat = makeMat(0xfdf8ee, { r: 0.6, e: 0xfdf8ee, ei: 0.5 });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, dotCount);
  const m = new THREE.Matrix4();
  for (let i = 0; i < dotCount; i++) {
    const u = pseudo(seed * 3.3 + i * 1.7) * 0.78;      // 0 centro -> bordo
    const a = pseudo(seed * 5.9 + i * 2.3) * Math.PI * 2;
    const r = Math.sin(u * Math.PI * 0.52) * radius * 0.96;
    const y = Math.cos(u * Math.PI * 0.52) * height;
    const sc = 0.6 + pseudo(seed * 7.1 + i * 3.1) * 0.9;
    m.makeScale(sc, sc, sc);
    m.setPosition(Math.cos(a) * r, stemH + y + 0.01, Math.sin(a) * r);
    dots.setMatrixAt(i, m);
  }
  dots.instanceMatrix.needsUpdate = true;
  g.add(dots);

  // --- Luce del fungo -------------------------------------------------------
  // Solo su POCHE amanite, scelte dal chiamante. Una PointLight per fungo
  // sembrava giusto ("ognuno illumina il terreno sotto di se") ed era il difetto
  // di performance piu grave del mondo: con 14 amanite si arrivava a 20 luci
  // dinamiche, che Three valuta per OGNI pixel. Misurato: 3 frame al secondo,
  // abbastanza da congelare le animazioni JS dell'interfaccia.
  //
  // Le altre restano bioluminescenti lo stesso: l'emissive del cappello non
  // costa nulla, e a distanza la differenza non si vede.
  let light = null;
  if (conLuce) {
    light = new THREE.PointLight(0xe8402c, 2.4, 5.0, 2);
    light.position.y = stemH - 0.25;
    g.add(light);
  }

  // Inclinazione deterministica: nessuna e perpendicolare, come in natura.
  g.rotation.z = (pseudo(seed * 1.3) - 0.5) * 0.26;
  g.rotation.x = (pseudo(seed * 2.7) - 0.5) * 0.2;

  return {
    group: g,
    /** `k` 0..1 dalla proximity: il fungo "respira" quando la sua sezione e centrata. */
    setGlow(k) {
      capMat.emissiveIntensity = 0.28 + k * 0.42;
      gillMat.emissiveIntensity = 0.18 + k * 0.5;
      if (light) light.intensity = 1.5 + k * 2.4;
    },
    dispose() {
      [stemGeo, stemMat, capGeo, capMat, gillGeo, gillMat, dotGeo, dotMat].forEach((d) => d.dispose());
    },
  };
}
