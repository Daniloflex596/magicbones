/**
 * lantern-field.js — bagliori/lanterne distanti, riusate alla Panoramica
 * (stazione 5) e come chiusura (stazione 7). InstancedMesh, scatter
 * deterministico via pseudo(), nessun asset di rete.
 */
import * as THREE from 'three';
import { pseudo } from '../engine/canvas-textures.js';
import { makeMat } from '../engine/material-factory.js';

/**
 * createLanternField({ count, color, spreadX, spreadZ, seed }):
 * ritorna { mesh, update(time, amt) } — pulsazione lieve e sincrona ma
 * sfasata per lanterna (fase i*0.4), mai un timer indipendente dallo scroll:
 * `amt` deve arrivare da tl.proximity nel chiamante.
 */
export function createLanternField({
  count = 26,
  color = 0xff8a4d,
  spreadX = 6,
  spreadZ = 16,
  baseY = 0.5,
  seed = 500,
} = {}) {
  const geo = new THREE.SphereGeometry(0.05, 10, 8);
  const mat = makeMat(color, { r: 0.3, e: color, ei: 1.1 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const base = [];

  for (let i = 0; i < count; i++) {
    const x = (pseudo(seed + i * 3) - 0.5) * spreadX * 2;
    const y = baseY + pseudo(seed + i * 5) * 1.4;
    const z = -pseudo(seed + i * 7) * spreadZ;
    base.push([x, y, z]);
    dummy.position.set(x, y, z);
    const s = 0.5 + pseudo(seed + i * 11) * 1.1;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;

  function update(time = 0, amt = 1) {
    for (let i = 0; i < count; i++) {
      const [x, y, z] = base[i];
      const phase = time * 0.6 + i * 0.4;
      dummy.position.set(x, y + Math.sin(phase) * 0.05 * amt, z);
      const s = (0.5 + pseudo(seed + i * 11) * 1.1) * (0.6 + amt * 0.4);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  return { mesh: inst, update };
}
