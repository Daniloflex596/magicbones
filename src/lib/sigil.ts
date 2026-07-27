import { pseudo } from './pseudo';
import type { ProductData } from './types';

/** Hash deterministico di una stringa (id prodotto) verso un seed per pseudo(). */
export function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 100000;
}

export const CATEGORY_ACCENT: Record<ProductData['category'], string> = {
  'teschio-dipinto': '#2fb8c4',
  'gioiello-osso': '#3a5a78',
  'arredo-rituale': '#e8452b',
  candele: '#ff8a4d',
  'cristalli-muschio': '#8b5cf6',
  'tarocchi-zodiaco': '#e4d9b8',
};

/**
 * drawSigil(canvas, seed, accentHex): mandala/sigillo generato a runtime su
 * canvas 2D, unico e deterministico per ogni prodotto (seed = seedFromId).
 * Nessuna foto, nessuna texture scaricata — il fronte di ogni carta del
 * "Mazzo del Bosco" nasce da questo generatore invece che da un asset.
 */
export function drawSigil(canvas: HTMLCanvasElement, seed: number, accentHex: string, size = 220): void {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.strokeStyle = accentHex;
  ctx.fillStyle = accentHex;

  const rings = 2 + Math.floor(pseudo(seed) * 3);
  const petals = 6 + Math.floor(pseudo(seed + 1) * 11);
  const rotOffset = pseudo(seed + 2) * Math.PI * 2;
  const hasCross = pseudo(seed + 3) > 0.55;
  const maxR = size * 0.4;

  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.9;
  for (let r = 1; r <= rings; r++) {
    ctx.beginPath();
    ctx.arc(0, 0, (maxR / rings) * r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }

  const petalR = maxR * 0.78;
  for (let i = 0; i < petals; i++) {
    const a = rotOffset + (i / petals) * Math.PI * 2;
    const len = petalR * (0.75 + pseudo(seed + i * 5) * 0.3);
    ctx.save();
    ctx.rotate(a);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, -len, size * 0.028, size * 0.09, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (hasCross) {
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-maxR * 0.55, 0);
    ctx.lineTo(maxR * 0.55, 0);
    ctx.moveTo(0, -maxR * 0.55);
    ctx.lineTo(0, maxR * 0.55);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.028, 0, Math.PI * 2);
  ctx.fill();
}
