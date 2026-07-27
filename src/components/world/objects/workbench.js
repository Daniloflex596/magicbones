/**
 * workbench.js — il Contro-campo, l'Altare di Claudia (stazione 6): il banco
 * da lavoro sotto un raggio di luna. Il raggio "si pianta" e non si ritrae
 * (pattern latch: prog = max(prog, amt) nel chiamante).
 */
import * as THREE from 'three';
import { makeMat } from '../engine/material-factory.js';

/**
 * createWorkbenchAltar(): ritorna { group, moonBeam, update(latchAmt) }.
 * `moonBeam` è un cono traslucido che rappresenta il raggio di luna: la sua
 * scala/opacità sono guidate dal valore di latch passato a update (mai la
 * proximity, che tornerebbe indietro).
 */
export function createWorkbenchAltar({ woodColor = 0x2b1d12, boneColor = 0xe4d9b8 } = {}) {
  const group = new THREE.Group();

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.08, 0.6),
    makeMat(woodColor, { r: 0.85 }),
  );
  bench.position.y = 0.75;
  group.add(bench);

  [-0.55, 0.55].forEach((x) => {
    [-0.24, 0.24].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8), makeMat(woodColor, { r: 0.9 }));
      leg.position.set(x, 0.375, z);
      group.add(leg);
    });
  });

  // Un teschio a metà lavorazione: solo volta + muso, senza corna né dipinto.
  const boneMat = makeMat(boneColor, { r: 0.5 });
  const workDome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), boneMat);
  workDome.scale.set(1, 0.8, 1);
  workDome.position.set(-0.2, 0.87, 0);
  group.add(workDome);
  const workSnout = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.16, 8), boneMat);
  workSnout.rotation.x = Math.PI / 2;
  workSnout.position.set(-0.2, 0.83, 0.13);
  group.add(workSnout);

  // Piccoli attrezzi: pennelli/bulini come cilindri sottili.
  for (let i = 0; i < 3; i++) {
    const tool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.012, 0.16, 6),
      makeMat(0x5a1e26, { r: 0.6 }),
    );
    tool.rotation.z = Math.PI / 2.3;
    tool.position.set(0.2 + i * 0.09, 0.8, -0.1 + i * 0.08);
    group.add(tool);
  }

  // Raggio di luna: cono traslucido verticale, opacità/scala guidate dal latch.
  const moonBeam = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 3.2, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xdfe7ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  moonBeam.position.set(-0.2, 2.4, 0);
  group.add(moonBeam);

  function update(latchAmt = 0) {
    moonBeam.material.opacity = latchAmt * 0.16;
    moonBeam.scale.y = 0.6 + latchAmt * 0.4;
  }

  return { group, moonBeam, update };
}
