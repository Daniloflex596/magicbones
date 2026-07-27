/**
 * forest.js — ambientazione minima per la scena firma (hero-stage): pulviscolo
 * bioluminescente e foglie blu-notte sospese. Nessun asset di rete: geometrie
 * Three primitive, scatter deterministico via pseudo().
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/**
 * createDustField({ count }): pulviscolo/lucciole — piccole sfere emissive
 * sparse nell'aria. Anima con proximity/idle nel chiamante (bob verticale
 * sfasato per particella).
 */
export function createDustField({ count = 40, color = 0xff9d5c, spread = 3 } = {}) {
  const geo = new THREE.IcosahedronGeometry(0.022, 0);
  const mat = makeMat(color, { e: color, ei: 1.6, r: 0.4 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const baseY = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = (pseudo(i * 3) - 0.5) * spread * 2;
    const y = 0.3 + pseudo(i * 5) * 1.8;
    const z = (pseudo(i * 7) - 0.5) * spread;
    baseY[i] = y;
    dummy.position.set(x, y, z);
    const s = 0.6 + pseudo(i * 9) * 1.2;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;

  const dummyFrame = new THREE.Object3D();
  function update(time, amt = 1) {
    for (let i = 0; i < count; i++) {
      const phase = time * 0.5 + i * 0.4;
      const x = (pseudo(i * 3) - 0.5) * spread * 2;
      const z = (pseudo(i * 7) - 0.5) * spread;
      dummyFrame.position.set(x, baseY[i] + Math.sin(phase) * 0.14 * amt, z);
      const s = (0.6 + pseudo(i * 9) * 1.2) * (0.7 + amt * 0.3);
      dummyFrame.scale.setScalar(s);
      dummyFrame.updateMatrix();
      inst.setMatrixAt(i, dummyFrame.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  return { mesh: inst, update };
}

/**
 * createFoliageCluster({ count, color }): foglie blu-notte sospese — fedeltà
 * al biglietto da visita "Magic Bones" (funghi Amanita + foglie blu su fondo
 * notturno). Piani a doppia faccia, leggermente emissivi, oscillano piano.
 */
export function createFoliageCluster({ count = 22, color = 0x3a5a78, spread = 3.4, seed = 900 } = {}) {
  const geo = new THREE.PlaneGeometry(0.14, 0.2);
  const mat = makeMat(color, { r: 0.7, e: color, ei: 0.28, side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const base = [];

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (1.1 + pseudo(seed + i * 3) * spread * 0.5);
    const y = 0.9 + pseudo(seed + i * 5) * 1.6;
    const z = (pseudo(seed + i * 7) - 0.5) * spread;
    base.push([x, y, z, pseudo(seed + i * 11) * Math.PI]);
  }

  function place(time, amt) {
    for (let i = 0; i < count; i++) {
      const [x, y, z, rot] = base[i];
      const sway = Math.sin(time * 0.6 + i * 0.4) * 0.12 * (0.3 + amt * 0.7);
      dummy.position.set(x, y, z);
      dummy.rotation.set(0.2, rot + sway, sway * 0.5);
      const s = 0.8 + pseudo(seed + i * 13) * 0.6;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }
  place(0, 0);

  return { mesh: inst, update: place };
}
