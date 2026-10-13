// Test delle funzioni online (lib/api.js): come le chiama l'app, contro il finto GitHub
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gestisci } from '../lib/api.js';
import { leggiDati } from '../lib/dati.js';
import { FILE_DATI } from '../lib/github.js';
import { creaFintoGithub } from './finto-github.mjs';

const DATI = readFileSync(new URL('./dati-prova.js', import.meta.url), 'utf8');
const ENV = { PIN_BOTTEGA: '482915', SEGRETO: 'segreto-di-prova-abbastanza-lungo', CHIAVE_GITHUB: 'tok', ARCHIVIO_GITHUB: 'utente/archivio', API_GITHUB: 'https://finto' };
const SITO = 'https://magicbones.pages.dev';
const ORA = () => new Date('2026-10-10T12:00:00Z');
const b64 = s => Buffer.from(s).toString('base64');

function prepara() {
  const finto = creaFintoGithub({ file: { [FILE_DATI]: DATI } });
  let cookie = '';
  async function chiama(metodo, via, corpo, { senzaTessera = false, origine = SITO } = {}) {
    const h = { 'Content-Type': 'application/json', Origin: origine };
    if (cookie && !senzaTessera) h.Cookie = cookie;
    const r = await gestisci(new Request(SITO + '/api/' + via, { method: metodo, headers: h, body: corpo ? JSON.stringify(corpo) : undefined }), ENV, { fetch: finto.fetch, ora: ORA });
    const sc = r.headers.get('Set-Cookie');
    if (sc) cookie = sc.split(';')[0];
    return { stato: r.status, corpo: await r.json() };
  }
  const dati = () => leggiDati(finto.leggi(FILE_DATI));
  return { finto, chiama, dati };
}
const FOTO = (h) => ({ hash: h.padEnd(16, '0'), ext: 'webp', w: 1200, h: 900, grande: b64('G' + h), porta: b64('P' + h), mini: b64('M' + h) });
const CAMPI = { nome: 'Corvo di Luna', prezzo: '42', cat: 'reliquie', unita: 'pezzo unico', descrizione: 'Un corvo. Bello.', citazione: 'Il mio preferito.' };

test('PIN sbagliato: no; giusto: tessera', async () => {
  const { chiama } = prepara();
  assert.equal((await chiama('POST', 'accedi', { pin: '000000' })).stato, 401);
  assert.equal((await chiama('GET', 'io')).stato, 401);
  assert.equal((await chiama('POST', 'accedi', { pin: '482915' })).stato, 200);
  assert.equal((await chiama('GET', 'io')).stato, 200);
});

test('senza tessera niente lettura né scrittura', async () => {
  const { chiama, finto } = prepara();
  assert.equal((await chiama('GET', 'pezzi', null, { senzaTessera: true })).stato, 401);
  assert.equal((await chiama('POST', 'venduto', { id: 'mandala', venduto: true }, { senzaTessera: true })).stato, 401);
  assert.equal(finto.quantiCommit(), 1);
});

test('da un altro sito non si scrive', async () => {
  const { chiama } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  assert.equal((await chiama('POST', 'venduto', { id: 'mandala', venduto: true }, { origine: 'https://cattivo.example' })).stato, 403);
});

test('pezzo nuovo con due foto: un commit, file giusti, dati giusti', async () => {
  const { chiama, finto, dati } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const f1 = (await chiama('POST', 'foto', FOTO('a1b2'))).corpo;
  const f2 = (await chiama('POST', 'foto', FOTO('c3d4'))).corpo;
  assert.match(f1.src, /^assets\/img\/pezzi\/2026-10\/a1b2/);
  const prima = finto.quantiCommit();
  const r = await chiama('POST', 'pezzo', { campi: CAMPI, foto: [f2, f1] });
  assert.equal(r.stato, 200, JSON.stringify(r.corpo));
  assert.equal(r.corpo.id, 'corvo-di-luna');
  assert.equal(finto.quantiCommit(), prima + 1, 'un solo commit per tutto');
  assert.match(finto.ultimoMessaggio(), /nuovo pezzo «Corvo di Luna»/);
  const p = dati().pezzi.find(x => x.id === 'corvo-di-luna');
  assert.equal(p.prezzo, 42);
  assert.equal(p.citazione, 'Il mio preferito.');
  assert.equal(p.foto[0].src, f2.src, 'la prima foto è la copertina');
  assert.equal(p.thumb, f2.mini);
  for (const k of ['src', 'porta', 'mini']) {
    assert.equal(finto.binario('site/' + f1[k]).toString(), { src: 'G', porta: 'P', mini: 'M' }[k] + 'a1b2');
  }
});

test('modifica: tolgo una foto e cambio il prezzo → i suoi file spariscono', async () => {
  const { chiama, finto, dati } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const f1 = (await chiama('POST', 'foto', FOTO('e5f6'))).corpo;
  const f2 = (await chiama('POST', 'foto', FOTO('a7b8'))).corpo;
  await chiama('POST', 'pezzo', { campi: CAMPI, foto: [f1, f2] });
  const p = dati().pezzi.find(x => x.id === 'corvo-di-luna');
  const r = await chiama('POST', 'pezzo', { id: p.id, campi: { ...CAMPI, prezzo: 55 }, foto: [{ src: p.foto[1].src, porta: p.foto[1].porta, w: 1200, h: 900 }] });
  assert.equal(r.stato, 200, JSON.stringify(r.corpo));
  const q = dati().pezzi.find(x => x.id === 'corvo-di-luna');
  assert.equal(q.prezzo, 55);
  assert.equal(q.foto.length, 1);
  assert.equal(finto.binario('site/' + f1.src), null);
  assert.equal(finto.binario('site/' + f1.mini), null);
  assert.ok(finto.binario('site/' + f2.src));
  assert.equal(q.thumb, f2.mini, 'la nuova copertina porta la sua miniatura');
});

test('modifica di un pezzo di prima: le sue foto restano dove sono', async () => {
  const { chiama, finto, dati } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const p = dati().pezzi.find(x => x.id === 'mandala');
  const r = await chiama('POST', 'pezzo', { id: 'mandala', campi: { ...CAMPI, nome: 'Mandala', prezzo: 18 }, foto: p.foto.map(f => ({ src: f.src, porta: f.porta })) });
  assert.equal(r.stato, 200, JSON.stringify(r.corpo));
  const q = dati().pezzi.find(x => x.id === 'mandala');
  assert.equal(q.prezzo, 18);
  assert.deepEqual(q.foto.map(f => f.alt), p.foto.map(f => f.alt));
  assert.equal(q.thumb, p.thumb);
});

test('foto inventata o di un altro pezzo: rifiutata', async () => {
  const { chiama, finto } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const altro = { src: 'assets/img/products/cinghiale-luxury-1.webp' };
  const r = await chiama('POST', 'pezzo', { id: 'mandala', campi: { ...CAMPI, nome: 'Mandala' }, foto: [altro] });
  assert.equal(r.stato, 400);
  const finta = { src: 'assets/img/pezzi/2026-10/abcdef0123456789.webp', porta: 'x', mini: 'y', sha: { src: 'z' } };
  assert.equal((await chiama('POST', 'pezzo', { campi: CAMPI, foto: [finta] })).stato, 400);
  assert.equal(finto.quantiCommit(), 1);
});

test('dati sbagliati: 400 con le spiegazioni, niente commit', async () => {
  const { chiama, finto } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const f = (await chiama('POST', 'foto', FOTO('beef'))).corpo;
  const r = await chiama('POST', 'pezzo', { campi: { ...CAMPI, nome: '', prezzo: 'tanto' }, foto: [f] });
  assert.equal(r.stato, 400);
  assert.ok(r.corpo.errori.length >= 2);
  assert.equal(finto.quantiCommit(), 1);
  assert.equal((await chiama('POST', 'pezzo', { campi: CAMPI, foto: [] })).stato, 400);
  assert.equal((await chiama('POST', 'foto', { ...FOTO('cafe'), ext: 'exe' })).stato, 400);
});

test('venduto e di nuovo in vendita', async () => {
  const { chiama, dati } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const r1 = await chiama('POST', 'venduto', { id: 'mandala', venduto: true });
  assert.equal(r1.stato, 200);
  assert.equal(r1.corpo.dati.pezzi.find(p => p.id === 'mandala').venduto, true, 'la risposta porta già i dati nuovi');
  assert.equal(dati().pezzi.find(p => p.id === 'mandala').venduto, true);
  assert.equal((await chiama('POST', 'venduto', { id: 'mandala', venduto: false })).stato, 200);
  assert.equal(dati().pezzi.find(p => p.id === 'mandala').venduto, undefined);
  assert.equal((await chiama('POST', 'venduto', { id: 'non-esiste', venduto: true })).stato, 404);
});

test('elenco dei pezzi per l\'app', async () => {
  const { chiama } = prepara();
  await chiama('POST', 'accedi', { pin: '482915' });
  const r = await chiama('GET', 'pezzi');
  assert.equal(r.stato, 200);
  assert.equal(r.corpo.dati.pezzi.length, 31);
});

test('senza PIN configurato non entra nessuno', async () => {
  const r = await gestisci(new Request(SITO + '/api/accedi', { method: 'POST', body: JSON.stringify({ pin: '' }) }), { SEGRETO: 'x'.repeat(20) });
  assert.equal(r.status, 500);
});
