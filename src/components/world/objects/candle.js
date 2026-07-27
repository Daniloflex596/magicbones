/**
 * candle.js — Il Focolare Rituale (stazione 4): candele su tessuto nero,
 * un disco zodiacale in resina, fiori secchi. Le fiamme si accendono e
 * RESTANO accese (fillOnce, mai proximity — altrimenti si spengono a metà
 * sezione, trappola #8 della skill).
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/** Texture radiale per la fiamma: nucleo chiaro → alone caldo → trasparente. */
function makeFlameTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,244,214,1)');
  grad.addColorStop(0.35, 'rgba(255,138,77,0.9)');
  grad.addColorStop(1, 'rgba(232,69,43,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const flameTex = { current: null };
function flameTexture() {
  if (!flameTex.current) flameTex.current = makeFlameTexture();
  return flameTex.current;
}

/** Una candela: cilindro di cera + sprite fiamma (billboard, sempre verso camera). */
function makeCandle({ waxColor = 0xe8452b, height = 0.5, seed = 0 } = {}) {
  const g = new THREE.Group();
  const wax = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.055, height, 12),
    makeMat(waxColor, { r: 0.4, m: 0 }),
  );
  wax.position.y = height / 2;
  g.add(wax);

  const flame = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: flameTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  flame.scale.set(0.14, 0.2, 1);
  flame.position.y = height + 0.08;
  g.add(flame);

  return { group: g, flame, seed };
}

/**
 * createCandleCluster({ count, seed }): N candele in fila irregolare.
 * update(fillAmt, time): fillAmt∈[0,1] da tl.fillOnce — le fiamme "salgono
 * e restano accese"; un flicker deterministico (pseudo+time) le fa vibrare.
 */
export function createCandleCluster({ count = 5, waxColor = 0xe8452b, seed = 300 } = {}) {
  const group = new THREE.Group();
  const candles = [];
  for (let i = 0; i < count; i++) {
    const h = 0.32 + pseudo(seed + i * 3) * 0.3;
    const { group: cg, flame } = makeCandle({ waxColor, height: h, seed: seed + i });
    cg.position.set((i - (count - 1) / 2) * 0.22, 0, pseudo(seed + i * 5) * 0.1);
    group.add(cg);
    candles.push({ flame, phase: seed + i * 7 });
  }

  function update(fillAmt = 0, time = 0) {
    candles.forEach(({ flame, phase }) => {
      const flicker = 1 + Math.sin(time * 6 + phase) * 0.08 * pseudo(phase);
      const s = 0.14 * fillAmt * flicker;
      flame.scale.set(s, s * 1.4, 1);
      flame.material.opacity = fillAmt;
    });
  }

  return { group, update };
}

/** Disco zodiacale piatto con divisioni radiali dipinte su canvas. */
function makeZodiacTexture(fg = '#e4d9b8', bg = '#3a2418') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -240);
    ctx.lineTo(0, -200);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -220, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(256, 256, 60, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

export function createZodiacDisc({ radius = 0.5 } = {}) {
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.03, 32),
    new THREE.MeshStandardMaterial({ map: makeZodiacTexture(), roughness: 0.5 }),
  );
  return disc;
}

/** Fiori secchi: piccoli petali InstancedMesh, tonalità spente. */
export function createDriedFlowerCluster({ count = 24, color = 0xb98aa0, seed = 400 } = {}) {
  const geo = new THREE.ConeGeometry(0.03, 0.09, 5);
  const mat = makeMat(color, { r: 0.9 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = pseudo(seed + i * 3) * Math.PI * 2;
    const r = pseudo(seed + i * 5) * 0.7;
    dummy.position.set(Math.cos(a) * r, 0.045, Math.sin(a) * r);
    dummy.rotation.z = (pseudo(seed + i * 7) - 0.5) * 0.6;
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}
