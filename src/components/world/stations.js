/**
 * stations.js — "Il Sentiero del Bosco Sacro": le 8 stazioni della camera.
 * Ogni stazione è { id, p:[x,y,z], l:[x,y,z] } — id serve a scroll-timeline
 * (element id nel DOM) e a world.js per sapere quali oggetti animare in
 * quel tratto. Valori indicativi, rifiniti col loop di verifica screenshot.
 */
export const STATIONS = [
  { id: 'soglia', p: [0, 2.2, 8.5], l: [0, 1.3, -2] },
  { id: 'funghi', p: [-2.0, 1.55, 3.9], l: [-0.5, 1.0, 0.6] },
  { id: 'teschi', p: [1.5, 1.35, -0.2], l: [2.4, 1.05, -1.6] },
  { id: 'filoNero', p: [-1.85, 1.6, -3.0], l: [-2.3, 1.15, -4.6] },
  { id: 'focolare', p: [1.3, 1.3, -6.6], l: [2.2, 1.0, -8.0] },
  { id: 'panoramica', p: [0, 2.6, -9.5], l: [0, 1.0, -14] },
  { id: 'controAltare', p: [0.3, 1.6, -12.5], l: [0.3, 1.35, 3.5] },
  { id: 'chiusura', p: [0, 1.5, -13.5], l: [0, 1.3, -15] },
];

/**
 * Ancora singola al CENTRO di ogni sezione (non `range`): con waypoint
 * consecutivi molto diversi in direzione (es. 4→5, dalla radura alla
 * panoramica larga) un hold a due ancore fa "sconfinare" la camera verso la
 * stazione successiva già a metà sezione, portando gli oggetti fuori quadro
 * (variante della trappola #6). L'ancora singola garantisce che, al centro
 * della sezione, la camera sia ESATTAMENTE sul waypoint dichiarato; il
 * costo è un hold più breve — raffinabile in seguito con `range` mirati
 * quando i waypoint verranno rifiniti col loop di screenshot.
 */
export const TIMELINE_SECTIONS = [
  ['soglia', 0],
  ['funghi', 1],
  ['teschi', 2],
  ['filoNero', 3],
  ['focolare', 4],
  ['panoramica', 5],
  ['controAltare', 6],
  ['chiusura', 7],
];

export const LAST_STATION = 7;
