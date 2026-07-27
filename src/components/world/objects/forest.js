/**
 * forest.js — sottobosco della Soglia (stazione 0): tronchi in InstancedMesh
 * e pulviscolo emissivo. Nessun asset di rete: geometrie Three primitive,
 * scatter deterministico via pseudo().
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/**
 * createTrunkField({ count, radius, colorNear, colorFar }): un anello di
 * tronchi sagomati (cilindro rastremato) ai lati del sentiero, che si
 * infittisce verso la nebbia in lontananza.
 */
export function createTrunkField({ count = 40, spread = 14, colorBark = 0x1a1712 } = {}) {
  const geo = new THREE.CylinderGeometry(0.12, 0.22, 4.5, 6, 1);
  const mat = makeMat(colorBark, { r: 0.95, m: 0 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const lane = 2.4 + pseudo(i * 3) * 2.2;
    dummy.position.set(
      side * lane,
      2.0 + pseudo(i * 5) * 0.3,
      -pseudo(i * 7) * spread,
    );
    dummy.rotation.y = pseudo(i * 11) * Math.PI;
    dummy.rotation.z = (pseudo(i * 13) - 0.5) * 0.12;
    const s = 0.7 + pseudo(i * 17) * 0.6;
    dummy.scale.set(s, 0.8 + pseudo(i * 19) * 0.7, s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = false;
  return inst;
}

/**
 * createDustField({ count }): pulviscolo/lucciole — piccole sfere emissive
 * sparse nell'aria. Anima con proximity nel chiamante (bob verticale
 * sfasato per particella).
 */
export function createDustField({ count = 90, color = 0xff9d5c, spread = 12 } = {}) {
  const geo = new THREE.IcosahedronGeometry(0.028, 0);
  const mat = makeMat(color, { e: color, ei: 1.6, r: 0.4 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const baseY = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = (pseudo(i * 3) - 0.5) * 7;
    const y = 0.6 + pseudo(i * 5) * 3.2;
    const z = -pseudo(i * 7) * spread;
    baseY[i] = y;
    dummy.position.set(x, y, z);
    const s = 0.6 + pseudo(i * 9) * 1.2;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;

  const dummyFrame = new THREE.Object3D();
  /** update(time, amt): fa "respirare" il pulviscolo (amt = proximity 0..1). */
  function update(time, amt = 1) {
    for (let i = 0; i < count; i++) {
      const phase = time * 0.5 + i * 0.4;
      const x = (pseudo(i * 3) - 0.5) * 7;
      const z = -pseudo(i * 7) * spread;
      dummyFrame.position.set(x, baseY[i] + Math.sin(phase) * 0.18 * amt, z);
      const s = (0.6 + pseudo(i * 9) * 1.2) * (0.7 + amt * 0.3);
      dummyFrame.scale.setScalar(s);
      dummyFrame.updateMatrix();
      inst.setMatrixAt(i, dummyFrame.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  return { mesh: inst, update };
}
