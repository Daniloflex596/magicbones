#!/usr/bin/env node
/**
 * qa-token.mjs — nessun var(--x) senza definizione.
 *
 * Perche esiste: riscrivendo la palette ho lasciato orfani 8 token usati in 79
 * punti. CSS non segnala nulla — `color: var(--inesistente)` non e un errore,
 * degrada in silenzio a nero ereditato e `background` diventa trasparente. Il
 * risultato era un carrello con testo nero su carte scure, invisibile, e zero
 * warning in console. Questo controllo trasforma quel guasto silenzioso in una
 * build che fallisce.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;
const TOKENS = join(SRC, 'styles/tokens.css');
const EXTS = new Set(['.css', '.astro', '.tsx', '.ts', '.jsx', '.js']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

const defined = new Set(
  [...readFileSync(TOKENS, 'utf8').matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
);

/** token -> file dove viene usato */
const used = new Map();
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
    if (!used.has(m[1])) used.set(m[1], new Set());
    used.get(m[1]).add(file.replace(SRC, 'src/'));
  }
}

const orfani = [...used.keys()].filter((t) => !defined.has(t)).sort();

if (orfani.length) {
  console.error(`\n✗ ${orfani.length} token usati ma NON definiti in src/styles/tokens.css:\n`);
  for (const t of orfani) {
    const files = [...used.get(t)];
    console.error(`  ${t}`);
    console.error(`      ${files.slice(0, 4).join(', ')}${files.length > 4 ? ` (+${files.length - 4})` : ''}`);
  }
  console.error('\nUn var() senza definizione non da errore: degrada in silenzio.\n');
  process.exit(1);
}

// Token definiti e mai usati: solo un avviso, non un errore — la palette puo
// legittimamente contenere colori tenuti in serbo.
const inutilizzati = [...defined].filter((t) => !used.has(t)).sort();
console.log(`✓ ${used.size} token usati, tutti definiti.`);
if (inutilizzati.length) {
  console.log(`  (${inutilizzati.length} definiti e non ancora usati: ${inutilizzati.join(', ')})`);
}
