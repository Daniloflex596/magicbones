// Test del collegamento con GitHub (lib/github.js) contro il finto GitHub
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creaGithub, FILE_DATI } from '../lib/github.js';
import { leggiDati, segnaVenduto } from '../lib/dati.js';
import { creaFintoGithub } from './finto-github.mjs';

const DATI = readFileSync(new URL('../site/data/pezzi.js', import.meta.url), 'utf8');
const ORA = '2026-10-10T12:00:00.000Z';

function prepara() {
  const finto = creaFintoGithub({ file: { [FILE_DATI]: DATI, 'site/index.html': '<html>' } });
  const gh = creaGithub({ token: 'tok', repo: 'utente/archivio', api: 'https://finto', fetch: finto.fetch });
  return { finto, gh };
}

test('legge i dati attuali dal ramo', async () => {
  const { gh } = prepara();
  const { dati, commit } = await gh.leggiDatiAttuali();
  assert.equal(dati.pezzi.length, 31);
  assert.match(commit, /^[0-9a-f]{40}$/);
});

test('un aggiornamento è un solo commit con dati e foto insieme', async () => {
  const { finto, gh } = prepara();
  const foto = await gh.creaBlob(Buffer.from('IMMAGINE').toString('base64'));
  const prima = finto.quantiCommit();
  const r = await gh.aggiornaDati(d => ({ dati: segnaVenduto(d, 'mandala', true, ORA) }), {
    voci: [{ path: 'site/assets/img/pezzi/2026-10/abc123.webp', sha: foto }],
    messaggio: 'Bottega: prova'
  });
  assert.equal(finto.quantiCommit(), prima + 1);
  assert.equal(finto.ultimoMessaggio(), 'Bottega: prova');
  assert.equal(leggiDati(finto.leggi(FILE_DATI)).pezzi.find(p => p.id === 'mandala').venduto, true);
  assert.equal(finto.binario('site/assets/img/pezzi/2026-10/abc123.webp').toString(), 'IMMAGINE');
  assert.equal(finto.leggi('site/index.html'), '<html>', 'il resto del sito non si tocca');
  assert.ok(r.commit);
});

test('se nel frattempo arriva un\'altra modifica, si riapplica sopra senza perderla', async () => {
  const { finto, gh } = prepara();
  finto.simulaConcorrenza('site/index.html', '<html>modificato dal PC');
  await gh.aggiornaDati(d => ({ dati: segnaVenduto(d, 'mandala', true, ORA) }), { messaggio: 'Bottega: venduto' });
  assert.equal(finto.leggi('site/index.html'), '<html>modificato dal PC');
  assert.equal(leggiDati(finto.leggi(FILE_DATI)).pezzi.find(p => p.id === 'mandala').venduto, true);
  assert.equal(finto.chiamate.filter(c => c.startsWith('PATCH')).length, 2, 'un rifiuto e un nuovo tentativo');
});

test('le foto tolte vengono cancellate; se una non c\'è già più si salva lo stesso', async () => {
  const { finto, gh } = prepara();
  const b = await gh.creaBlob(Buffer.from('X').toString('base64'));
  await gh.aggiornaDati(d => ({ dati: d }), { voci: [{ path: 'site/assets/img/pezzi/2026-10/aa.webp', sha: b }], messaggio: 'aggiungi' });
  await gh.aggiornaDati(d => ({ dati: d, togli: ['assets/img/pezzi/2026-10/aa.webp'] }), { messaggio: 'togli' });
  assert.equal(finto.binario('site/assets/img/pezzi/2026-10/aa.webp'), null);
  await gh.aggiornaDati(d => ({ dati: segnaVenduto(d, 'mandala', true, ORA), togli: ['assets/img/pezzi/2026-10/non-esiste.webp'] }), { messaggio: 'togli di nuovo' });
  assert.equal(leggiDati(finto.leggi(FILE_DATI)).pezzi.find(p => p.id === 'mandala').venduto, true);
});

test('GitHub in ritardo dopo un salvataggio: due modifiche di fila entrano entrambe', async () => {
  const finto = creaFintoGithub({ file: { [FILE_DATI]: DATI }, ritardoRef: 2 });
  const attese = [];
  const gh = creaGithub({ token: 'tok', repo: 'utente/archivio', api: 'https://finto', fetch: finto.fetch, attendi: ms => { attese.push(ms); } });
  await gh.aggiornaDati(d => ({ dati: segnaVenduto(d, 'mandala', true, ORA) }), { messaggio: 'primo' });
  await gh.aggiornaDati(d => ({ dati: segnaVenduto(d, 'spell-jar', true, ORA) }), { messaggio: 'secondo' });
  const d = leggiDati(finto.leggi(FILE_DATI));
  assert.equal(d.pezzi.find(p => p.id === 'mandala').venduto, true, 'la prima modifica non va persa');
  assert.equal(d.pezzi.find(p => p.id === 'spell-jar').venduto, true);
  assert.ok(attese.length >= 1 && attese.every((ms, i) => i === 0 || ms > attese[i - 1]), 'tra un tentativo e l\'altro si aspetta sempre di più');
});

test('chiave sbagliata: errore chiaro, nessun commit', async () => {
  const finto = creaFintoGithub({ file: { [FILE_DATI]: DATI } });
  const gh = creaGithub({ token: 'sbagliato', repo: 'utente/archivio', api: 'https://finto', fetch: finto.fetch });
  await assert.rejects(() => gh.leggiDatiAttuali(), /401/);
  assert.equal(finto.quantiCommit(), 1);
});

test('senza configurazione non parte', () => {
  assert.throws(() => creaGithub({ token: '', repo: 'a/b' }), /CHIAVE_GITHUB/);
});
