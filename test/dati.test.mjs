// Test della gestione dei dati del catalogo (lib/dati.js)
//     node --test "test/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  leggiDati, scriviDati, slug, validaPezzo, applicaPezzo, segnaVenduto, fotoOrfane
} from '../lib/dati.js';

const VERO = readFileSync(new URL('../site/data/pezzi.js', import.meta.url), 'utf8');
const ORA = '2026-10-10T12:00:00.000Z';

function base() {
  return {
    versione: 1, aggiornato: '2026-01-01T00:00:00.000Z',
    categorie: [{ id: 'teschi', nome: 'Teschi dipinti' }, { id: 'reliquie', nome: 'Piccole reliquie' }],
    pezzi: [{
      id: 'toro', nome: 'Toro', prezzo: 100, cat: 'teschi', unita: 'pezzo unico', descrizione: 'Un toro.',
      thumb: 'assets/img/products/thumb/toro.webp',
      foto: [{ src: 'assets/img/products/toro-1.webp', porta: 'assets/img/products/toro-1-600.webp', alt: 'Toro scritto a mano', w: 900, h: 1200 }]
    }]
  };
}
const FOTO_NUOVA = (h) => ({ src: `assets/img/pezzi/x/${h}.webp`, porta: `assets/img/pezzi/x/${h}-600.webp`, mini: `assets/img/pezzi/x/${h}-mini.webp`, w: 1200, h: 900 });

test('il file vero si legge e si riscrive senza perdere niente', () => {
  const d = leggiDati(VERO);
  assert.equal(d.pezzi.length, 31);
  assert.equal(d.categorie.length, 5);
  assert.deepEqual(leggiDati(scriviDati(d)), d);
});

test('un file rovinato non viene preso per buono', () => {
  assert.throws(() => leggiDati('window.MB_DATI = {rotto'), /dati/i);
  assert.throws(() => leggiDati('niente'), /dati/i);
});

test('slug: minuscole, senza accenti né simboli', () => {
  assert.equal(slug('Cinghiale Luxury'), 'cinghiale-luxury');
  assert.equal(slug('  Più   bello: è "nuovo"!  '), 'piu-bello-e-nuovo');
  assert.equal(slug('Teca d\'Autunno'), 'teca-d-autunno');
  assert.equal(slug('!!!'), 'pezzo');
  assert.ok(slug('a'.repeat(200)).length <= 60);
});

test('validaPezzo: campi obbligatori e prezzo', () => {
  const d = base();
  const r = validaPezzo({ nome: '', prezzo: 'abc', cat: 'teschi', unita: 'pezzo unico' }, d);
  assert.equal(r.ok, false);
  assert.ok(r.errori.some(e => /nome/i.test(e)));
  assert.ok(r.errori.some(e => /prezzo/i.test(e)));
  const ok = validaPezzo({ nome: ' Rosa nera ', prezzo: '25,50', cat: 'teschi', unita: 'a pezzo', descrizione: 'x' }, d);
  assert.equal(ok.ok, true);
  assert.equal(ok.pulito.nome, 'Rosa nera');
  assert.equal(ok.pulito.prezzo, 25.5);
  assert.equal(ok.pulito.unita, 'a pezzo');
});

test('validaPezzo: categoria che non esiste e categoria nuova', () => {
  const d = base();
  assert.equal(validaPezzo({ nome: 'A', prezzo: 1, cat: 'inventata', unita: 'pezzo unico' }, d).ok, false);
  const r = validaPezzo({ nome: 'A', prezzo: 1, nuovaCategoria: 'Candele', unita: 'pezzo unico' }, d);
  assert.equal(r.ok, true);
  assert.equal(r.pulito.nuovaCategoria, 'Candele');
});

test('validaPezzo: limiti di lunghezza e unità sconosciuta', () => {
  const d = base();
  assert.equal(validaPezzo({ nome: 'x'.repeat(200), prezzo: 1, cat: 'teschi', unita: 'pezzo unico' }, d).ok, false);
  assert.equal(validaPezzo({ nome: 'x', prezzo: 1, cat: 'teschi', unita: 'boh' }, d).ok, false);
  assert.equal(validaPezzo({ nome: 'x', prezzo: -3, cat: 'teschi', unita: 'pezzo unico' }, d).ok, false);
});

test('applicaPezzo: un pezzo nuovo entra con id unico, copertina e miniatura', () => {
  const d = base();
  const { dati, id, nuovo } = applicaPezzo(d, {
    campi: { nome: 'Toro', prezzo: 50, cat: 'teschi', unita: 'pezzo unico', descrizione: 'Altro toro.' },
    foto: [FOTO_NUOVA('aaa'), FOTO_NUOVA('bbb')]
  }, ORA);
  assert.equal(nuovo, true);
  assert.equal(id, 'toro-2');
  const p = dati.pezzi.find(x => x.id === 'toro-2');
  assert.equal(p.foto.length, 2);
  assert.equal(p.thumb, 'assets/img/pezzi/x/aaa-mini.webp');
  assert.equal(p.foto[0].mini, undefined, 'la miniatura sta in thumb, non nelle foto');
  assert.match(p.foto[0].alt, /Toro/);
  assert.equal(p.creato, ORA);
  assert.equal(dati.aggiornato, ORA);
  assert.equal(d.pezzi.length, 1, 'i dati di partenza non vengono toccati');
});

test('applicaPezzo: modifica di un pezzo esistente tiene le descrizioni delle foto vecchie', () => {
  const d = base();
  const vecchia = d.pezzi[0].foto[0];
  const { dati, nuovo } = applicaPezzo(d, {
    id: 'toro',
    campi: { nome: 'Toro', prezzo: 120, da: true, cat: 'teschi', unita: 'pezzo unico', descrizione: 'Nuova.' },
    foto: [FOTO_NUOVA('ccc'), { src: vecchia.src, porta: vecchia.porta, w: 900, h: 1200 }]
  }, ORA);
  assert.equal(nuovo, false);
  const p = dati.pezzi[0];
  assert.equal(p.prezzo, 120);
  assert.equal(p.da, true);
  assert.equal(p.foto[1].alt, 'Toro scritto a mano');
  assert.equal(p.thumb, 'assets/img/pezzi/x/ccc-mini.webp', 'la copertina nuova porta la sua miniatura');
  assert.equal(p.aggiornato, ORA);
});

test('applicaPezzo: copertina vecchia senza miniatura nuova tiene il thumb di prima', () => {
  const d = base();
  const f = d.pezzi[0].foto[0];
  const { dati } = applicaPezzo(d, { id: 'toro', campi: { nome: 'Toro', prezzo: 1, cat: 'teschi', unita: 'pezzo unico', descrizione: '' }, foto: [{ src: f.src, porta: f.porta, w: 900, h: 1200 }] }, ORA);
  assert.equal(dati.pezzi[0].thumb, 'assets/img/products/thumb/toro.webp');
});

test('applicaPezzo: categoria nuova creata una volta sola, in fondo', () => {
  let d = base();
  ({ dati: d } = applicaPezzo(d, { campi: { nome: 'A', prezzo: 1, nuovaCategoria: 'Candele magiche', unita: 'pezzo unico', descrizione: '' }, foto: [FOTO_NUOVA('a1')] }, ORA));
  ({ dati: d } = applicaPezzo(d, { campi: { nome: 'B', prezzo: 1, nuovaCategoria: 'candele MAGICHE', unita: 'pezzo unico', descrizione: '' }, foto: [FOTO_NUOVA('b1')] }, ORA));
  assert.deepEqual(d.categorie.map(c => c.id), ['teschi', 'reliquie', 'candele-magiche']);
  assert.ok(d.pezzi.filter(p => p.cat === 'candele-magiche').length === 2);
});

test('applicaPezzo: senza foto non si pubblica', () => {
  assert.throws(() => applicaPezzo(base(), { campi: { nome: 'A', prezzo: 1, cat: 'teschi', unita: 'pezzo unico', descrizione: '' }, foto: [] }, ORA), /foto/i);
});

test('applicaPezzo: id inesistente in modifica è un errore', () => {
  assert.throws(() => applicaPezzo(base(), { id: 'non-c-e', campi: { nome: 'A', prezzo: 1, cat: 'teschi', unita: 'pezzo unico', descrizione: '' }, foto: [FOTO_NUOVA('z')] }, ORA), /non trovato/i);
});

test('segnaVenduto: avanti e indietro', () => {
  let d = segnaVenduto(base(), 'toro', true, ORA);
  assert.equal(d.pezzi[0].venduto, true);
  assert.equal(d.pezzi[0].aggiornato, ORA);
  d = segnaVenduto(d, 'toro', false, ORA);
  assert.equal(d.pezzi[0].venduto, undefined);
  assert.throws(() => segnaVenduto(base(), 'boh', true, ORA), /non trovato/i);
});

test('fotoOrfane: solo i file delle foto nuove non più usati', () => {
  const prima = base();
  const { dati: conFoto } = applicaPezzo(prima, { campi: { nome: 'A', prezzo: 1, cat: 'teschi', unita: 'pezzo unico', descrizione: '' }, foto: [FOTO_NUOVA('d1'), FOTO_NUOVA('d2')] }, ORA);
  const p = conFoto.pezzi.find(x => x.id === 'a');
  const { dati: dopo } = applicaPezzo(conFoto, { id: 'a', campi: { nome: 'A', prezzo: 1, cat: 'teschi', unita: 'pezzo unico', descrizione: '' }, foto: [{ src: p.foto[1].src, porta: p.foto[1].porta, w: 1200, h: 900 }] }, ORA);
  const orfane = fotoOrfane(conFoto, dopo).sort();
  assert.deepEqual(orfane, [
    'assets/img/pezzi/x/d1-600.webp', 'assets/img/pezzi/x/d1-mini.webp', 'assets/img/pezzi/x/d1.webp'
  ].sort());
  // le foto dei pezzi di prima (assets/img/products) non si toccano mai
  const tolto = structuredClone(dopo); tolto.pezzi = tolto.pezzi.filter(x => x.id !== 'toro');
  assert.ok(!fotoOrfane(dopo, tolto).some(f => f.includes('/products/')));
});
