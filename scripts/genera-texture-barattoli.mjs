#!/usr/bin/env node
/**
 * genera-texture-barattoli.mjs
 *
 * Le foto in public/foto/ pesano 125-247 KB l'una: caricarne sei dentro il
 * mondo 3D aggiungerebbe circa 1 MB al primo caricamento, inaccettabile su
 * telefono. Qui se ne generano varianti quadrate a 512 px per le texture dei
 * barattoli (~35-50 KB), ritagliate al centro perche una texture non quadrata
 * si deforma sul piano.
 *
 * Idempotente: rigenera solo se la sorgente e piu recente della destinazione.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../public/foto/', import.meta.url).pathname;
const OUT = join(SRC, 'jar');
const SIZE = 512;
const QUALITY = 78;

mkdirSync(OUT, { recursive: true });

const sorgenti = readdirSync(SRC).filter((f) => f.endsWith('.jpg'));
let generate = 0;

for (const nome of sorgenti) {
  const src = join(SRC, nome);
  const dst = join(OUT, nome);
  if (existsSync(dst) && statSync(dst).mtimeMs >= statSync(src).mtimeMs) continue;

  execFileSync('python3', [
    '-c',
    `
from PIL import Image
im = Image.open(${JSON.stringify(src)}).convert('RGB')
w, h = im.size
# ritaglio quadrato centrale: una texture non quadrata si deforma sul piano
lato = min(w, h)
im = im.crop(((w - lato) // 2, (h - lato) // 2, (w + lato) // 2, (h + lato) // 2))
im = im.resize((${SIZE}, ${SIZE}), Image.LANCZOS)
im.save(${JSON.stringify(dst)}, 'JPEG', quality=${QUALITY}, optimize=True, progressive=True)
`,
  ]);
  generate++;
}

const totale = readdirSync(OUT)
  .filter((f) => f.endsWith('.jpg'))
  .reduce((s, f) => s + statSync(join(OUT, f)).size, 0);

console.log(
  `✓ texture barattoli: ${generate} generate, ${readdirSync(OUT).filter((f) => f.endsWith('.jpg')).length} totali, ` +
    `${(totale / 1024).toFixed(0)} KB complessivi`,
);
