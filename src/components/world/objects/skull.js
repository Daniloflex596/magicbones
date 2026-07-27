/**
 * skull.js — l'Altare dei Teschi (stazione 2). Teschio stilizzato
 * (Lathe + Sphere unite) su un ceppo muschiato, con pietre incastonate
 * (InstancedMesh) e un mandala dipinto (texture procedurale su canvas,
 * zero asset di rete — stesso principio di canvas-textures.js).
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/** Texture "dipinta a mano" per la fronte del teschio: mandala radiale su canvas 2D. */
function makeMandalaTexture(accentHex, bgAlpha = 0) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.translate(128, 128);
  ctx.strokeStyle = accentHex;
  ctx.fillStyle = accentHex;
  ctx.lineWidth = 2.5;
  for (let ring = 1; ring <= 3; ring++) {
    ctx.beginPath();
    ctx.arc(0, 0, ring * 24, 0, Math.PI * 2);
    ctx.stroke();
  }
  const petals = 12;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -58, 7, 20, 0, 0, Math.PI * 2);
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.transparent = true;
  return tex;
}

/**
 * createSkullAltar({ boneColor, accentColor, browWidth, snoutLength, seed }):
 * ritorna { group, update(amt) }. `update` guida rotazione lenta + scintillio
 * pietre (chiamare con tl.proximity('teschi'), MAI un timer autonomo).
 */
export function createSkullAltar({
  boneColor = 0xe4d9b8,
  accentColor = 0x2fb8c4,
  browWidth = 1,
  snoutLength = 1,
  hornCurve = 1,
  seed = 0,
} = {}) {
  const group = new THREE.Group();
  const skull = new THREE.Group();
  const boneMat = makeMat(boneColor, { r: 0.55, m: 0.05 });

  // Cranio: profilo a lathe (volta + attacco del muso) ruotato a 360°.
  const profile = [
    new THREE.Vector2(0.0, 0.46),
    new THREE.Vector2(0.24, 0.44),
    new THREE.Vector2(0.34 * browWidth, 0.3),
    new THREE.Vector2(0.3 * browWidth, 0.08),
    new THREE.Vector2(0.16, -0.02),
    new THREE.Vector2(0.1, -0.06 * snoutLength),
    new THREE.Vector2(0.0, -0.08 * snoutLength),
  ];
  const cranium = new THREE.Mesh(new THREE.LatheGeometry(profile, 24), boneMat);
  skull.add(cranium);

  // Volta cranica: sfera che si fonde visivamente con il lathe sopra.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), boneMat);
  dome.position.y = 0.34;
  dome.scale.set(1.05, 0.82, 1.0);
  skull.add(dome);

  // Muso allungato verso +z.
  const snout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.16, 0.34 * snoutLength, 10),
    boneMat,
  );
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.02, 0.24 * snoutLength);
  skull.add(snout);

  // Occhiaie: sfere scure incassate.
  const socketMat = makeMat(0x0c0f1a, { r: 0.9 });
  [-1, 1].forEach((side) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), socketMat);
    socket.position.set(side * 0.16, 0.1, 0.08);
    skull.add(socket);
  });

  // Corna: coni rastremati verso l'esterno.
  [-1, 1].forEach((side, idx) => {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.06, 0.5 * hornCurve, 8), boneMat);
    horn.position.set(side * 0.3, 0.42, -0.06);
    horn.rotation.z = side * 0.6;
    horn.rotation.x = -0.25 - pseudo(seed + idx) * 0.15;
    skull.add(horn);
  });

  // Mandala dipinto sulla fronte.
  const mandala = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 24),
    new THREE.MeshBasicMaterial({
      map: makeMandalaTexture(`#${accentColor.toString(16).padStart(6, '0')}`),
      transparent: true,
      depthWrite: false,
    }),
  );
  mandala.position.set(0, 0.32, 0.27);
  skull.add(mandala);

  // Pietre incastonate: InstancedMesh sulla volta.
  const stoneCount = 14;
  const stoneGeo = new THREE.IcosahedronGeometry(0.024, 0);
  const stoneMat = makeMat(accentColor, { r: 0.25, m: 0.1, e: accentColor, ei: 0.5 });
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, stoneCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < stoneCount; i++) {
    const a = pseudo(seed + i * 3) * Math.PI * 2;
    const h = pseudo(seed + i * 5) * 0.22;
    const r = 0.22 + pseudo(seed + i * 7) * 0.08;
    dummy.position.set(Math.cos(a) * r, 0.4 + h, Math.sin(a) * r * 0.6 + 0.14);
    dummy.updateMatrix();
    stones.setMatrixAt(i, dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate = true;
  skull.add(stones);

  skull.position.y = 0.86;
  group.add(skull);

  // Ceppo-piedistallo.
  const stump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.7, 14),
    makeMat(0x2b1d12, { r: 0.9 }),
  );
  stump.position.y = 0.35;
  group.add(stump);

  const mossCap = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.3, 1),
    makeMat(0x3f5d3a, { r: 0.95 }),
  );
  mossCap.position.y = 0.68;
  mossCap.scale.set(1, 0.3, 1);
  group.add(mossCap);

  function update(amt = 0, time = 0) {
    skull.rotation.y = Math.sin(time * 0.15 + seed) * 0.35 * amt;
    stoneMat.emissiveIntensity = 0.5 + amt * 1.0;
  }

  return { group, update, stoneMat };
}
