/**
 * pseudo(i): rumore deterministico fract(sin(i · 12.9898) · 43758.5453).
 * Unica fonte di "casualità" riproducibile del sito — mai Math.random() —
 * così ogni layout generato (sigilli delle carte, pulviscolo dell'hero)
 * torna sempre identico a ogni build e ad ogni render.
 */
export function pseudo(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
