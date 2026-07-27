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

export interface SigilOptions {
  size?: number;
  /** 0..1: quanto del sigillo è stato "tracciato" (draw-on a fasi: anelli → petali → croce e cuore). */
  progress?: number;
  /** rotazione dell'intero sigillo (deriva lenta in idle). */
  rotation?: number;
  /** alone pulsante attorno al tratto (0 = spento). */
  glow?: number;
}

/**
 * drawSigil: mandala/sigillo generato a runtime su canvas 2D, unico e
 * deterministico per prodotto. Con progress<1 il segno "si disegna da solo"
 * come inciso a mano: prima gli anelli come archi che si chiudono, poi i
 * petali uno a uno, infine croce e cuore.
 */
export function drawSigil(
  canvas: HTMLCanvasElement,
  seed: number,
  accentHex: string,
  { size = 220, progress = 1, rotation = 0, glow = 0 }: SigilOptions = {},
): void {
  if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.rotate(rotation);
  ctx.strokeStyle = accentHex;
  ctx.fillStyle = accentHex;
  if (glow > 0) { ctx.shadowColor = accentHex; ctx.shadowBlur = glow * size * 0.06; }

  const rings = 2 + Math.floor(pseudo(seed) * 3);
  const petals = 6 + Math.floor(pseudo(seed + 1) * 11);
  const rotOffset = pseudo(seed + 2) * Math.PI * 2;
  const hasCross = pseudo(seed + 3) > 0.55;
  const maxR = size * 0.4;

  const ringPhase = Math.min(1, progress / 0.45);
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.9;
  for (let r = 1; r <= rings; r++) {
    const ringT = Math.min(1, Math.max(0, ringPhase * rings - (r - 1)));
    if (ringT <= 0) continue;
    ctx.beginPath();
    ctx.arc(0, 0, (maxR / rings) * r * 0.72, -Math.PI / 2, -Math.PI / 2 + ringT * Math.PI * 2);
    ctx.stroke();
  }

  const petalPhase = Math.min(1, Math.max(0, (progress - 0.35) / 0.55));
  const petalR = maxR * 0.78;
  const petalsShown = petalPhase * petals;
  for (let i = 0; i < petals; i++) {
    const petalT = Math.min(1, Math.max(0, petalsShown - i));
    if (petalT <= 0) continue;
    const a = rotOffset + (i / petals) * Math.PI * 2;
    const len = petalR * (0.75 + pseudo(seed + i * 5) * 0.3);
    ctx.save();
    ctx.rotate(a);
    ctx.globalAlpha = 0.8 * petalT;
    ctx.beginPath();
    ctx.ellipse(0, -len * petalT, size * 0.028 * petalT, size * 0.09 * petalT, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const coreT = Math.min(1, Math.max(0, (progress - 0.8) / 0.2));
  if (hasCross && coreT > 0) {
    ctx.globalAlpha = 0.5 * coreT;
    const arm = maxR * 0.55 * coreT;
    ctx.beginPath();
    ctx.moveTo(-arm, 0); ctx.lineTo(arm, 0);
    ctx.moveTo(0, -arm); ctx.lineTo(0, arm);
    ctx.stroke();
  }
  if (coreT > 0) {
    ctx.globalAlpha = coreT;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.028 * coreT, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Animatore condiviso: un solo rAF per TUTTI i sigilli della pagina.
//
// Ciclo di vita a stati, non un loop perpetuo: ogni sigillo si DISEGNA
// (~1.3s), respira ancora un paio di cicli e poi si POSA — il rAF si spegne
// quando tutti sono posati. Il respiro torna solo quando l'utente mostra
// interesse (hover/focus sulla carta): così il glow diventa una risposta,
// non rumore di fondo, e in idle il costo CPU/batteria è zero.
// ---------------------------------------------------------------------------
type SigilPhase = 'drawing' | 'breathing' | 'settled';

interface SigilState {
  seed: number;
  accent: string;
  size: number;
  start: number;
  visible: boolean;
  phase: SigilPhase;
  /** quanto respiro resta prima di posarsi (secondi di elapsed) */
  breatheUntil: number;
}

const DRAW_SECONDS = 1.3;
const BREATHE_SECONDS = 3.2;

const registry = new Map<HTMLCanvasElement, SigilState>();
let raf = 0;
let io: IntersectionObserver | null = null;

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }

/** Posa statica: sigillo completo, glow fermo. È lo stato di riposo. */
function drawSettled(canvas: HTMLCanvasElement, s: SigilState): void {
  drawSigil(canvas, s.seed, s.accent, { size: s.size, progress: 1, rotation: 0, glow: 0.4 });
}

function frame(now: number): void {
  raf = 0;
  let anyActive = false;
  const rm = reducedMotion();

  registry.forEach((s, canvas) => {
    if (!canvas.isConnected) { registry.delete(canvas); io?.unobserve(canvas); return; }
    if (!s.visible || s.phase === 'settled') return;

    if (rm) { drawSettled(canvas, s); s.phase = 'settled'; return; }

    if (s.start === 0) s.start = now;
    const elapsed = (now - s.start) / 1000;

    if (elapsed < DRAW_SECONDS) {
      const progress = easeOutCubic(elapsed / DRAW_SECONDS);
      drawSigil(canvas, s.seed, s.accent, { size: s.size, progress, rotation: 0, glow: progress * 0.5 });
      anyActive = true;
      return;
    }

    s.phase = 'breathing';
    if (elapsed >= s.breatheUntil) { drawSettled(canvas, s); s.phase = 'settled'; return; }

    const t = elapsed - DRAW_SECONDS;
    drawSigil(canvas, s.seed, s.accent, {
      size: s.size,
      progress: 1,
      rotation: t * 0.08,
      glow: 0.5 + Math.sin(t * 1.4 + s.seed) * 0.35,
    });
    anyActive = true;
  });

  if (anyActive) raf = requestAnimationFrame(frame);
}

function ensureLoop(): void {
  if (!raf) raf = requestAnimationFrame(frame);
}

/** Risveglia un sigillo: torna a respirare per un ciclo (hover/focus). */
export function wakeSigil(canvas: HTMLCanvasElement): void {
  const s = registry.get(canvas);
  if (!s || reducedMotion()) return;
  s.start = performance.now() - DRAW_SECONDS * 1000; // salta il draw-on: è già disegnato
  s.breatheUntil = DRAW_SECONDS + BREATHE_SECONDS;
  s.phase = 'breathing';
  ensureLoop();
}

/**
 * mountSigil: registra un canvas nell'animatore. Ritorna una funzione di
 * unmount (da chiamare nella cleanup di useEffect).
 */
export function mountSigil(canvas: HTMLCanvasElement, seed: number, accent: string, size: number): () => void {
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const s = registry.get(entry.target as HTMLCanvasElement);
        if (s) s.visible = entry.isIntersecting;
      });
      ensureLoop();
    }, { threshold: 0.1 });
  }

  const state: SigilState = {
    seed, accent, size, start: 0, visible: false,
    phase: 'drawing',
    breatheUntil: DRAW_SECONDS + BREATHE_SECONDS,
  };
  registry.set(canvas, state);
  io.observe(canvas);

  if (reducedMotion()) {
    drawSettled(canvas, state);
    state.phase = 'settled';
  } else {
    drawSigil(canvas, seed, accent, { size, progress: 0 });
    ensureLoop();
  }

  // Se la preferenza di movimento cambia a sessione aperta, adeguati subito:
  // reduce → posa immediata; ritorno a no-preference → nessun risveglio forzato
  // (il movimento riparte solo su interazione, com'è giusto).
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const onPrefChange = () => {
    if (mq.matches && canvas.isConnected) {
      drawSettled(canvas, state);
      state.phase = 'settled';
    }
  };
  mq.addEventListener('change', onPrefChange);

  return () => {
    registry.delete(canvas);
    io?.unobserve(canvas);
    mq.removeEventListener('change', onPrefChange);
  };
}
