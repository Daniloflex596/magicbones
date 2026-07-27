/**
 * pendant.js — Il Filo Nero (stazione 3): ciondoli in osso appesi a un ramo
 * e un disco dreamcatcher in pizzo nero (texture procedurale a ragnatela).
 * Oscillazione a pendolo pilotata dalla proximity (mai un timer autonomo).
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/** Texture a ragnatela radiale su canvas 2D — zero asset di rete. */
function makeWebTexture(color = '#0c0f1a', threadColor = 'rgba(228,217,184,0.55)') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = threadColor;
  ctx.lineWidth = 1.4;
  const spokes = 10;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(a) * 120, 128 + Math.sin(a) * 120);
    ctx.stroke();
  }
  for (let ring = 1; ring <= 6; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const r = ring * 18;
      const x = 128 + Math.cos(a) * r;
      const y = 128 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/** Un piccolo ciondolo "osso": due sfere unite da un cilindro sottile. */
function makeBoneCharm(color) {
  const g = new THREE.Group();
  const mat = makeMat(color, { r: 0.5, m: 0.05 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), mat);
  g.add(shaft);
  [-1, 1].forEach((side) => {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat);
    knob.position.y = side * 0.08;
    g.add(knob);
  });
  return g;
}

/**
 * createPendantBranch({ count, boneColor, seed }): ramo con N ciondoli in
 * osso a distanze/fasi diverse + un disco dreamcatcher. Ritorna { group,
 * update(amt, time) } — oscillazione a pendolo sfasata per ciondolo.
 */
export function createPendantBranch({ count = 5, boneColor = 0xe4d9b8, seed = 200 } = {}) {
  const group = new THREE.Group();

  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.045, 1.6, 8),
    makeMat(0x1a1712, { r: 0.95 }),
  );
  branch.rotation.z = Math.PI / 2;
  branch.position.y = 1.1;
  group.add(branch);

  const pendulums = [];
  for (let i = 0; i < count; i++) {
    const pivot = new THREE.Group();
    const x = -0.7 + (i / (count - 1)) * 1.4;
    pivot.position.set(x, 1.1, 0);
    const cordLen = 0.2 + pseudo(seed + i * 3) * 0.28;
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, cordLen, 6),
      makeMat(0x0c0f1a, { r: 0.9 }),
    );
    cord.position.y = -cordLen / 2;
    pivot.add(cord);
    const charm = makeBoneCharm(boneColor);
    charm.position.y = -cordLen;
    pivot.add(charm);
    group.add(pivot);
    pendulums.push({ pivot, phase: i * 0.4 + pseudo(seed + i) * 0.6 });
  }

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 32),
    new THREE.MeshBasicMaterial({ map: makeWebTexture(), transparent: true, side: THREE.DoubleSide }),
  );
  disc.position.set(0.9, 0.75, -0.1);
  group.add(disc);

  function update(amt = 0, time = 0) {
    pendulums.forEach(({ pivot, phase }) => {
      pivot.rotation.z = Math.sin(time * 0.7 + phase) * 0.16 * amt;
    });
    disc.rotation.z = time * 0.05 * amt;
  }

  return { group, update };
}
