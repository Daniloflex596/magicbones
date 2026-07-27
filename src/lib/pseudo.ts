/**
 * Unica fonte di pseudo(): re-esporta la stessa funzione usata dal motore 3D
 * (src/components/world/engine/canvas-textures.js) così qualunque jitter
 * deterministico nel layer shop (es. micro-rotazione delle card) condivide
 * la stessa fonte di "casualità" riproducibile — mai due implementazioni
 * che divergono, mai Math.random().
 */
// @ts-expect-error — asset JS della skill, copiato verbatim, senza tipi propri.
export { pseudo } from '../components/world/engine/canvas-textures.js';
