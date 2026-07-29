#!/usr/bin/env node
/**
 * qa-estetica.mjs — audit contro l'"estetica da AI" e per la disciplina di scala.
 *
 * Deriva dalla tabella di `frontend-ui-engineering`: raggi tutti massimi, valori
 * di spaziatura inventati, gradienti sparsi e ombre a strati sono i segnali che
 * un'interfaccia e stata generata invece che progettata.
 *
 * Non giudica il gusto: conta. Se una misura non sta sulla scala, la stampa.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;
const EXTS = new Set(['.css', '.astro', '.tsx']);

/** Scala di spaziatura: multipli di 0.25rem. Tutto il resto e inventato. */
const SCALA = new Set([
  0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875,
  1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 6, 7, 8,
]);
const PROP_SPAZIO = /\b(padding|margin|gap|top|bottom|left|right|inset)(-(top|bottom|left|right|inline|block|x|y))?\s*:\s*([^;{}]+)/g;

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

const raggi = new Map();
const fuoriScala = [];
let gradienti = 0;
let ombre = 0;

for (const file of walk(SRC)) {
  const rel = file.replace(SRC, 'src/');
  const testo = readFileSync(file, 'utf8');

  for (const m of testo.matchAll(/border-radius\s*:\s*([^;{}]+)/g)) {
    const v = m[1].trim();
    raggi.set(v, (raggi.get(v) || 0) + 1);
  }

  for (const m of testo.matchAll(PROP_SPAZIO)) {
    const valori = m[4].trim();
    if (/var\(|calc\(|clamp\(|auto|%|inherit|100|0px|-9999/.test(valori)) continue;
    for (const num of valori.matchAll(/(-?\d*\.?\d+)rem/g)) {
      const v = Math.abs(parseFloat(num[1]));
      if (!SCALA.has(v)) fuoriScala.push({ rel, prop: m[1], v, riga: valori });
    }
  }

  gradienti += [...testo.matchAll(/(linear|radial|conic)-gradient/g)].length;
  ombre += [...testo.matchAll(/box-shadow\s*:\s*[^;]*,[^;]*,/g)].length; // >=3 strati
}

console.log('=== Raggi di bordo usati ===');
const raggiOrdinati = [...raggi.entries()].sort((a, b) => b[1] - a[1]);
for (const [v, n] of raggiOrdinati) console.log(`  ${String(n).padStart(3)}×  ${v}`);
const pillole = raggiOrdinati.filter(([v]) => /999|9999|50%/.test(v)).reduce((s, [, n]) => s + n, 0);
const totRaggi = raggiOrdinati.reduce((s, [, n]) => s + n, 0);
const quotaPillole = totRaggi ? Math.round((pillole / totRaggi) * 100) : 0;
console.log(`  -> ${quotaPillole}% dei raggi e "pillola". Sopra il 40% la gerarchia dei raggi non esiste.`);

console.log(`\n=== Valori di spaziatura fuori scala (0.25rem) : ${fuoriScala.length} ===`);
const perValore = new Map();
for (const f of fuoriScala) perValore.set(f.v, (perValore.get(f.v) || 0) + 1);
for (const [v, n] of [...perValore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) {
  console.log(`  ${String(n).padStart(3)}×  ${v}rem`);
}

console.log(`\n=== Gradienti: ${gradienti}    Ombre a 3+ strati: ${ombre} ===`);

const problemi = (quotaPillole > 40 ? 1 : 0) + (fuoriScala.length > 20 ? 1 : 0);
process.exitCode = problemi ? 1 : 0;
