/**
 * Smoothing frame-rate-independent.
 *
 * Un coefficiente fisso per frame (`v += (target - v) * 0.04`) NON è
 * accettabile: a 120 Hz risponde il doppio più veloce che a 60 Hz, quindi su
 * un display ProMotion la parallasse "scatta" e su uno a 30 Hz "annega".
 * La forma corretta lega il fattore al tempo reale trascorso:
 *
 *   alpha = 1 - e^(-lambda · dt)
 *
 * `lambda` si sceglie da un tempo di risposta desiderato: il valore copre
 * ~63% della distanza in 1/lambda secondi. lambda 11 ≈ 90 ms di risposta.
 */

/** Fattore di interpolazione per questo frame, dato dt in secondi. */
export function dampFactor(lambda: number, dt: number): number {
  // dt clampato: dopo un freeze del tab (o un tab in background) dt può valere
  // secondi interi e il valore salterebbe di colpo a destinazione.
  return 1 - Math.exp(-lambda * Math.min(dt, 0.05));
}

/** Avvicina `current` a `target` in modo indipendente dal frame rate. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * dampFactor(lambda, dt);
}
