/**
 * ============================================================================
 *  foresta.js — il sottobosco FOLTO
 * ============================================================================
 *  Il mondo era rado: si vedeva il vuoto nero tra un fungo e l'altro, e un
 *  sottobosco con dei buchi dentro non e un sottobosco.
 *
 *  Qui vive tutto cio che riempie: centinaia di amanite di sfondo, felci, fili
 *  d'erba, tronchi lontani. Sono TUTTI InstancedMesh — la regola della skill
 *  per i ripetuti: centinaia di oggetti in un solo draw call. Aggiungere gli
 *  stessi elementi come Mesh separate avrebbe moltiplicato i draw call per
 *  cento e ammazzato il frame rate.
 *
 *  Nessuno di questi oggetti ha una luce propria: la densita si paga in
 *  geometria, mai in luci dinamiche (Three le valuta per ogni pixel).
 *  L'illuminazione arriva dall'emissive e dalle poche luci del primo piano.
 *
 *  Ogni posizione passa da `pseudo()`: il sottobosco si rigenera identico a
 *  ogni build. Mai Math.random.
 * ============================================================================
 */
import * as THREE from 'three';
import { makeMat } from '../engine/material-factory.js';
import { pseudo } from '../engine/canvas-textures.js';
import { pathXAt } from './undergrowth.js';

const Z0 = 13;
const Z1 = -16;

/**
 * Distribuzione a bande ai lati del sentiero.
 *
 * `minOff` e un CORRIDOIO VUOTO: niente puo nascere piu vicino di cosi alla
 * linea che la camera percorre. Senza, un tronco alto 7 unita capitava proprio
 * addosso all'obiettivo e riempiva mezza inquadratura con una lastra nera —
 * si vedeva come un triangolo scuro sopra il testo.
 */
function posizione(i, salt, minOff, maxOff) {
  const z = Z0 - pseudo(i * 1.37 + salt) * (Z0 - Z1);
  const lato = pseudo(i * 2.71 + salt) > 0.5 ? 1 : -1;
  const off = minOff + pseudo(i * 3.91 + salt) * (maxOff - minOff);
  return { x: pathXAt(z) + lato * off, z };
}

export function createForesta(scene, { tier = 'high' } = {}) {
  const group = new THREE.Group();
  const disposables = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  const basso = tier === 'low';

  // ---------------------------------------------------------------------------
  //  1. IL CAMPO DI AMANITE DI SFONDO
  //  Cappelli e gambi sono due InstancedMesh separati: due draw call per
  //  centinaia di funghi. Stanno LONTANO dal sentiero e sono piu piccoli, cosi
  //  leggono come profondita e non competono con le amanite del primo piano.
  // ---------------------------------------------------------------------------
  const nFunghi = basso ? 150 : 420;

  const capGeo = new THREE.SphereGeometry(0.5, basso ? 8 : 12, basso ? 6 : 8, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const capMat = makeMat(0xffffff, { r: 0.6, e: 0x8f2417, ei: 0.34, flatShading: basso });
  const caps = new THREE.InstancedMesh(capGeo, capMat, nFunghi);

  const stemGeo = new THREE.CylinderGeometry(0.07, 0.11, 1, basso ? 5 : 8);
  const stemMat = makeMat(0xc9b18a, { r: 0.85, e: 0xdcc59e, ei: 0.05 });
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, nFunghi);

  // Toni del cappello: dal vermiglio della card a rossi cupi e a qualche
  // viola. La varieta e cio che impedisce alla folla di leggersi come copie.
  const TONI_CAPPELLO = [0xe8402c, 0xc0281a, 0xd4604e, 0x9c2418, 0xb0355c, 0x8b3f8f];

  for (let i = 0; i < nFunghi; i++) {
    const { x, z } = posizione(i, 100, 0.9, 7.0);
    // I piu lontani sono piu piccoli: prospettiva rinforzata a mano.
    const dist = Math.abs(x - pathXAt(z));
    const scalaDist = 1 - Math.min(dist / 14, 0.45);
    const h = (0.7 + pseudo(i * 5.13 + 100) * 1.9) * scalaDist;
    const r = (0.34 + pseudo(i * 7.19 + 100) * 0.5) * scalaDist;
    const inclina = (pseudo(i * 9.7 + 100) - 0.5) * 0.3;

    p.set(x, h / 2, z);
    q.setFromEuler(new THREE.Euler(0, 0, inclina));
    s.set(1, h, 1);
    m.compose(p, q, s);
    stems.setMatrixAt(i, m);

    p.set(x + Math.sin(inclina) * h, h, z);
    s.set(r / 0.5, (r / 0.5) * 0.72, r / 0.5);
    m.compose(p, q, s);
    caps.setMatrixAt(i, m);
    col.setHex(TONI_CAPPELLO[Math.floor(pseudo(i * 11.3 + 100) * TONI_CAPPELLO.length) % TONI_CAPPELLO.length]);
    caps.setColorAt(i, col);
  }
  caps.instanceMatrix.needsUpdate = true;
  stems.instanceMatrix.needsUpdate = true;
  if (caps.instanceColor) caps.instanceColor.needsUpdate = true;
  group.add(caps, stems);
  disposables.push(capGeo, capMat, stemGeo, stemMat);

  // ---------------------------------------------------------------------------
  //  2. FELCI — riempiono l'altezza media, dove prima c'era solo buio.
  //  Un cono molto appiattito e allungato legge come fronda a distanza.
  // ---------------------------------------------------------------------------
  const nFelci = basso ? 200 : 620;
  const felceGeo = new THREE.ConeGeometry(0.2, 0.95, 3, 2);
  felceGeo.scale(1, 1, 0.16);
  const felceMat = makeMat(0xffffff, { r: 0.9, e: 0x2f3a14, ei: 0.2, flatShading: true, side: THREE.DoubleSide });
  const felci = new THREE.InstancedMesh(felceGeo, felceMat, nFelci);
  const TONI_FELCE = [0x5b6b1c, 0x44521a, 0x74812a, 0x2f4a2c, 0x8f8416];
  for (let i = 0; i < nFelci; i++) {
    const { x, z } = posizione(i, 300, 0.65, 5.5);
    p.set(x, 0.3 + pseudo(i * 4.3 + 300) * 0.35, z);
    q.setFromEuler(
      new THREE.Euler(
        (pseudo(i * 6.7 + 300) - 0.5) * 0.8,
        pseudo(i * 8.9 + 300) * Math.PI * 2,
        (pseudo(i * 2.3 + 300) - 0.5) * 1.5,
      ),
    );
    const sc = 0.6 + pseudo(i * 12.7 + 300) * 1.3;
    s.set(sc, sc, sc);
    m.compose(p, q, s);
    felci.setMatrixAt(i, m);
    col.setHex(TONI_FELCE[Math.floor(pseudo(i * 14.1 + 300) * TONI_FELCE.length) % TONI_FELCE.length]);
    felci.setColorAt(i, col);
  }
  felci.instanceMatrix.needsUpdate = true;
  if (felci.instanceColor) felci.instanceColor.needsUpdate = true;
  group.add(felci);
  disposables.push(felceGeo, felceMat);

  // ---------------------------------------------------------------------------
  //  3. FILI D'ERBA — il tappeto. Sono tanti e piccolissimi: e la densita a
  //  livello del suolo che toglie la sensazione di "oggetti posati sul nulla".
  // ---------------------------------------------------------------------------
  const nErba = basso ? 420 : 1500;
  const erbaGeo = new THREE.ConeGeometry(0.028, 0.42, 3, 1);
  const erbaMat = makeMat(0xffffff, { r: 0.95, e: 0x6f6410, ei: 0.16, flatShading: true });
  const erba = new THREE.InstancedMesh(erbaGeo, erbaMat, nErba);
  const TONI_ERBA = [0xa89818, 0x8f8416, 0x6f6410, 0x5b6b1c, 0xd8cb2a];
  for (let i = 0; i < nErba; i++) {
    const { x, z } = posizione(i, 500, 0.42, 5.0);
    p.set(x, 0.16, z);
    q.setFromEuler(new THREE.Euler((pseudo(i * 3.1 + 500) - 0.5) * 0.5, 0, (pseudo(i * 5.9 + 500) - 0.5) * 0.6));
    const sc = 0.6 + pseudo(i * 7.7 + 500) * 1.1;
    s.set(sc, sc, sc);
    m.compose(p, q, s);
    erba.setMatrixAt(i, m);
    col.setHex(TONI_ERBA[Math.floor(pseudo(i * 13.3 + 500) * TONI_ERBA.length) % TONI_ERBA.length]);
    erba.setColorAt(i, col);
  }
  erba.instanceMatrix.needsUpdate = true;
  if (erba.instanceColor) erba.instanceColor.needsUpdate = true;
  group.add(erba);
  disposables.push(erbaGeo, erbaMat);

  // ---------------------------------------------------------------------------
  //  4. TRONCHI LONTANI — la parete del bosco. Chiudono l'orizzonte ai lati
  //  cosi lo sguardo non finisce nel vuoto, e danno la scala del sottobosco.
  // ---------------------------------------------------------------------------
  const nTronchi = basso ? 40 : 95;
  const troncoGeo = new THREE.CylinderGeometry(0.24, 0.42, 7, basso ? 6 : 9, 1);
  // Colore VICINO a quello dell'orizzonte, non quasi-nero. Con 0x241a2e e
  // flatShading un tronco a ~7 unita dalla camera copriva 280 px di lastra
  // uniformemente nera: misurata la luminanza, era piatta a 17 su tutta la
  // larghezza. Un tronco deve leggere come profondita, non come un buco.
  // Niente flatShading: le sfaccettature piatte erano meta del problema.
  const troncoMat = makeMat(0x2e2547, { r: 0.95, e: 0x252048, ei: 0.5 });
  const tronchi = new THREE.InstancedMesh(troncoGeo, troncoMat, nTronchi);
  for (let i = 0; i < nTronchi; i++) {
    const { x, z } = posizione(i, 700, 9.5, 18);
    p.set(x, 3.2, z);
    q.setFromEuler(new THREE.Euler(0, 0, (pseudo(i * 4.7 + 700) - 0.5) * 0.16));
    const sc = 0.7 + pseudo(i * 6.1 + 700) * 0.8;
    s.set(sc, 0.8 + pseudo(i * 8.3 + 700) * 0.7, sc);
    m.compose(p, q, s);
    tronchi.setMatrixAt(i, m);
  }
  tronchi.instanceMatrix.needsUpdate = true;
  group.add(tronchi);
  disposables.push(troncoGeo, troncoMat);

  // ---------------------------------------------------------------------------
  //  5. FUNGHETTI VIOLA — il magenta shocking della card, sparso a terra.
  //  Piccoli e numerosi: sono i punti di colore freddo che spezzano il rosso.
  // ---------------------------------------------------------------------------
  const nViola = basso ? 110 : 300;
  const violaGeo = new THREE.SphereGeometry(0.09, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const violaMat = makeMat(0xffffff, { r: 0.55, e: 0x8b5fc9, ei: 0.45 });
  const viola = new THREE.InstancedMesh(violaGeo, violaMat, nViola);
  const TONI_VIOLA = [0xd94ec0, 0x8b5fc9, 0x7346b0, 0xc23fb0];
  for (let i = 0; i < nViola; i++) {
    const { x, z } = posizione(i, 900, 0.5, 4.5);
    p.set(x, 0.06 + pseudo(i * 5.3 + 900) * 0.16, z);
    q.setFromEuler(new THREE.Euler(0, pseudo(i * 7.1 + 900) * Math.PI * 2, (pseudo(i * 9.3 + 900) - 0.5) * 0.3));
    const sc = 0.7 + pseudo(i * 11.9 + 900) * 1.4;
    s.set(sc, sc, sc);
    m.compose(p, q, s);
    viola.setMatrixAt(i, m);
    col.setHex(TONI_VIOLA[Math.floor(pseudo(i * 15.7 + 900) * TONI_VIOLA.length) % TONI_VIOLA.length]);
    viola.setColorAt(i, col);
  }
  viola.instanceMatrix.needsUpdate = true;
  if (viola.instanceColor) viola.instanceColor.needsUpdate = true;
  group.add(viola);
  disposables.push(violaGeo, violaMat);

  // ---------------------------------------------------------------------------
  //  6. LA VOLTA — cappelli ENORMI sopra la testa.
  //  E il pezzo che mancava di piu: senza qualcosa in alto, la camera guarda
  //  un cielo vuoto e il mondo si legge come "oggetti su una pianura", non come
  //  sottobosco. La camera vive tra y 0.6 e 2.8; questi stanno tra 3.4 e 7, e
  //  ci si passa SOTTO. Sono la ragione per cui si e alti quanto un fungo.
  // ---------------------------------------------------------------------------
  const nVolta = basso ? 18 : 46;
  const voltaGeo = new THREE.SphereGeometry(1, basso ? 10 : 16, basso ? 7 : 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  // Il sottofaccia di un'amanita sono le LAMELLE: color carne, e prendono luce
  // dal basso. Con emissive 0x6b1a12 a 0.4 la volta vista da sotto diventava una
  // lastra quasi nera che copriva mezza inquadratura — misurato: luminanza
  // piatta a 17 su 280 px. Isolato spegnendo lo strato: senza volta il difetto
  // spariva del tutto.
  //
  // Ora e una volta ROSSA ACCESA, che e anche quello che dice lo storyboard.
  const voltaMat = makeMat(0xffffff, {
    r: 0.62, e: 0xd4604e, ei: 0.95, side: THREE.DoubleSide, flatShading: basso,
  });
  const volta = new THREE.InstancedMesh(voltaGeo, voltaMat, nVolta);
  const gamboVoltaGeo = new THREE.CylinderGeometry(0.13, 0.2, 6, basso ? 6 : 9);
  const gamboVoltaMat = makeMat(0xb8a480, { r: 0.86, e: 0xdcc59e, ei: 0.06 });
  const gambiVolta = new THREE.InstancedMesh(gamboVoltaGeo, gamboVoltaMat, nVolta);

  for (let i = 0; i < nVolta; i++) {
    const { x, z } = posizione(i, 1300, 5.0, 10.0);
    const h = 5.6 + pseudo(i * 5.7 + 1300) * 3.4;
    const r = 1.1 + pseudo(i * 7.3 + 1300) * 1.5;
    const inclina = (pseudo(i * 9.1 + 1300) - 0.5) * 0.24;

    p.set(x, h / 2, z);
    q.setFromEuler(new THREE.Euler(0, 0, inclina));
    s.set(1, h / 6, 1);
    m.compose(p, q, s);
    gambiVolta.setMatrixAt(i, m);

    p.set(x + Math.sin(inclina) * h, h, z);
    // Schiacciati: un cappello alto legge come cupola, uno basso e largo come
    // soffitto — ed e un soffitto che serve qui.
    s.set(r, r * 0.42, r);
    m.compose(p, q, s);
    volta.setMatrixAt(i, m);
    col.setHex(TONI_CAPPELLO[Math.floor(pseudo(i * 12.9 + 1300) * TONI_CAPPELLO.length) % TONI_CAPPELLO.length]);
    volta.setColorAt(i, col);
  }
  volta.instanceMatrix.needsUpdate = true;
  gambiVolta.instanceMatrix.needsUpdate = true;
  if (volta.instanceColor) volta.instanceColor.needsUpdate = true;
  group.add(volta, gambiVolta);
  disposables.push(voltaGeo, voltaMat, gamboVoltaGeo, gamboVoltaMat);

  scene.add(group);

  const totale = nFunghi * 2 + nFelci + nErba + nTronchi + nViola + nVolta * 2;

  return {
    group,
    /** Quanti elementi in quante draw call — per il collaudo. */
    statistiche: { elementi: totale, drawCall: 8 },
    dispose() {
      disposables.forEach((d) => d.dispose && d.dispose());
      scene.remove(group);
    },
  };
}
