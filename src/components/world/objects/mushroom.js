/**
 * mushroom.js — la Radura dei Funghi (stazione 1). Un fungo "eroe" (Amanita
 * stilizzata) per primo piano + un cluster minore in InstancedMesh.
 * Geometrie Three primitive, texture zero, scatter deterministico (pseudo()).
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/**
 * createHeroMushroom({ capColor, glowColor, scale, spotCount }):
 * gambo (Cylinder) + cappello (mezza sfera schiacciata) + pallini bianchi
 * (piccola InstancedMesh di sfere) sulla cupola. Ritorna { group, update }:
 * update(amt) pulsa l'emissive del cappello (respiro bioluminescente,
 * pilotato da tl.proximity nel chiamante — MAI un timer autonomo).
 */
export function createHeroMushroom({
  capColor = 0xe8452b,
  glowColor = 0xff8a4d,
  stemColor = 0xe4d9b8,
  scale = 1,
  spotCount = 10,
  seed = 0,
} = {}) {
  const group = new THREE.Group();

  const stemGeo = new THREE.CylinderGeometry(0.09, 0.15, 0.62, 10);
  const stemMat = makeMat(stemColor, { r: 0.85, m: 0 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.31;
  group.add(stem);

  const capGeo = new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const capMat = makeMat(capColor, { r: 0.55, m: 0, e: glowColor, ei: 0.35 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.62;
  cap.scale.set(1, 0.72, 1);
  group.add(cap);

  const spotGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const spotMat = makeMat(0xf6ead1, { r: 0.4, e: 0xf6ead1, ei: 0.4 });
  const spots = new THREE.InstancedMesh(spotGeo, spotMat, spotCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < spotCount; i++) {
    const a = pseudo(seed + i * 3) * Math.PI * 2;
    const r = 0.14 + pseudo(seed + i * 5) * 0.24;
    dummy.position.set(Math.cos(a) * r, 0.68 + pseudo(seed + i * 7) * 0.08, Math.sin(a) * r);
    dummy.updateMatrix();
    spots.setMatrixAt(i, dummy.matrix);
  }
  spots.instanceMatrix.needsUpdate = true;
  group.add(spots);

  group.scale.setScalar(scale);

  function update(amt = 0) {
    capMat.emissiveIntensity = 0.35 + amt * 1.1;
  }

  return { group, update, capMat };
}

/**
 * createMushroomCluster({ count, color }): funghetti minori in un solo
 * draw call (InstancedMesh unica geometria semplificata cappello+gambo
 * fusi in un cono tronco + calotta), sparsi ai piedi degli eroi.
 */
export function createMushroomCluster({
  count = 60,
  color = 0x8b5cf6,
  spread = 2.6,
  seed = 100,
} = {}) {
  const capGeo = new THREE.ConeGeometry(0.09, 0.1, 8);
  const mat = makeMat(color, { r: 0.6, e: color, ei: 0.5 });
  const inst = new THREE.InstancedMesh(capGeo, mat, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const a = pseudo(seed + i * 3) * Math.PI * 2;
    const r = pseudo(seed + i * 5) * spread;
    dummy.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
    dummy.rotation.x = Math.PI; // cappello verso l'alto (cono capovolto)
    const s = 0.6 + pseudo(seed + i * 7) * 0.8;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}
