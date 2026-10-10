// Test dell'accesso (lib/sessione.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaTessera, tesseraValida, pinGiusto, leggiCookie, cookieTessera } from '../lib/sessione.js';

const SEGRETO = 'segreto-di-prova-abbastanza-lungo';

test('una tessera appena creata è valida, con un altro segreto no', async () => {
  const t = await creaTessera(SEGRETO);
  assert.equal(await tesseraValida(SEGRETO, t), true);
  assert.equal(await tesseraValida('un-altro-segreto-lungo-1234', t), false);
});

test('una tessera scaduta non vale più', async () => {
  const t = await creaTessera(SEGRETO, Date.now(), 60);
  assert.equal(await tesseraValida(SEGRETO, t, Date.now() + 61000), false);
});

test('una tessera ritoccata non vale', async () => {
  const t = await creaTessera(SEGRETO);
  const [corpo, firma] = t.split('.');
  const falso = btoa(JSON.stringify({ scade: 9999999999 })).replace(/=+$/, '') + '.' + firma;
  assert.equal(await tesseraValida(SEGRETO, falso), false);
  assert.equal(await tesseraValida(SEGRETO, corpo), false);
  assert.equal(await tesseraValida(SEGRETO, 'spazzatura'), false);
  assert.equal(await tesseraValida(SEGRETO, null), false);
});

test('senza segreto non si creano tessere', async () => {
  await assert.rejects(() => creaTessera(''), /SEGRETO/);
});

test('PIN: giusto, sbagliato, vuoto', () => {
  assert.equal(pinGiusto('482915', '482915'), true);
  assert.equal(pinGiusto('482916', '482915'), false);
  assert.equal(pinGiusto('48291', '482915'), false);
  assert.equal(pinGiusto('', '482915'), false);
  assert.equal(pinGiusto('qualcosa', ''), false, 'senza PIN impostato non entra nessuno');
});

test('cookie: si legge e si scrive', () => {
  const r = new Request('https://x/api', { headers: { Cookie: 'a=1; mb_bottega=abc.def; b=2' } });
  assert.equal(leggiCookie(r, 'mb_bottega'), 'abc.def');
  assert.equal(leggiCookie(r, 'nessuno'), null);
  assert.match(cookieTessera('abc'), /HttpOnly; Secure; SameSite=Strict/);
});
