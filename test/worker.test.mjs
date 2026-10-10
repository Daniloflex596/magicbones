// Test del "portinaio" su Cloudflare (worker.js): catalogo e foto dall'archivio
// GitHub con memoria e riserva, video a pezzi, app.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { memoria } from '../worker.js';

const SITO = 'https://magicbones.example';
const ENV_BASE = { ARCHIVIO_GITHUB: 'utente/archivio', RAMO_GITHUB: 'main', CHIAVE_GITHUB: 'tok' };
const DATI_GITHUB = 'window.MB_DATI = {"versione":1,"aggiornato":"NUOVO","categorie":[],"pezzi":[]};\n';
const DATI_STATICI = 'window.MB_DATI = {"versione":1,"aggiornato":"VECCHIO","categorie":[],"pezzi":[]};\n';
const VIDEO = Uint8Array.from({ length: 1000 }, (_, i) => i % 251);

let chiamateGithub = [];
let githubRisponde = true;
const fetchVero = globalThis.fetch;

function assets(statici) {
  return {
    fetch: async (req) => {
      const p = new URL(typeof req === 'string' ? req : req.url).pathname;
      if (p in statici) {
        const v = statici[p];
        return new Response(v, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } });   // niente Content-Length, come in locale
      }
      return new Response('non trovato', { status: 404 });
    }
  };
}
const ENV = () => ({ ...ENV_BASE, ASSETS: assets({ '/data/pezzi.js': DATI_STATICI, '/assets/video/bosco.mp4': VIDEO, '/assets/img/pezzi/2026-10/aaaa.webp': 'STATICA' }) });
const chiedi = (env, percorso, headers = {}) => worker.fetch(new Request(SITO + percorso, { headers }), env);

beforeEach(() => {
  memoria.dati = null; memoria.datiQuando = 0;
  chiamateGithub = []; githubRisponde = true;
  globalThis.fetch = async (url, opts) => {
    chiamateGithub.push({ url: String(url), auth: opts && opts.headers && opts.headers.Authorization });
    if (!githubRisponde) throw new Error('rete giù');
    if (String(url).includes('/contents/site/data/pezzi.js')) return new Response(DATI_GITHUB);
    if (String(url).includes('/contents/site/assets/img/pezzi/2026-10/bbbb.webp')) return new Response('DA-GITHUB');
    return new Response('{"message":"Not Found"}', { status: 404 });
  };
});
process.on('exit', () => { globalThis.fetch = fetchVero; });

test('il catalogo arriva dall\'archivio GitHub (ramo main, con la chiave)', async () => {
  const r = await chiedi(ENV(), '/data/pezzi.js');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), DATI_GITHUB);
  assert.match(r.headers.get('Content-Type'), /javascript/);
  assert.equal(r.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(chiamateGithub.length, 1);
  assert.match(chiamateGithub[0].url, /repos\/utente\/archivio\/contents\/site\/data\/pezzi\.js\?ref=main$/);
  assert.equal(chiamateGithub[0].auth, 'Bearer tok');
});

test('per 20 secondi il catalogo si riusa senza chiederlo di nuovo a GitHub', async () => {
  await chiedi(ENV(), '/data/pezzi.js');
  await chiedi(ENV(), '/data/pezzi.js?t=123');
  assert.equal(chiamateGithub.length, 1);
  memoria.datiQuando -= 21000;
  await chiedi(ENV(), '/data/pezzi.js');
  assert.equal(chiamateGithub.length, 2, 'dopo 20 s si rilegge');
});

test('GitHub giù: l\'ultima copia buona, e se non c\'è quella del sito', async () => {
  githubRisponde = false;
  assert.equal(await (await chiedi(ENV(), '/data/pezzi.js')).text(), DATI_STATICI);
  githubRisponde = true;
  await chiedi(ENV(), '/data/pezzi.js');                 // ora in memoria la copia nuova
  memoria.datiQuando -= 21000; githubRisponde = false;
  assert.equal(await (await chiedi(ENV(), '/data/pezzi.js')).text(), DATI_GITHUB);
});

test('senza chiave GitHub il sito funziona lo stesso (copia del sito)', async () => {
  const env = ENV(); delete env.CHIAVE_GITHUB;
  assert.equal(await (await chiedi(env, '/data/pezzi.js')).text(), DATI_STATICI);
  assert.equal(chiamateGithub.length, 0);
});

test('foto dell\'app: prima tra i file del sito, poi dall\'archivio, sennò 404', async () => {
  const s = await chiedi(ENV(), '/assets/img/pezzi/2026-10/aaaa.webp');
  assert.equal(await s.text(), 'STATICA');
  assert.equal(chiamateGithub.length, 0);
  const g = await chiedi(ENV(), '/assets/img/pezzi/2026-10/bbbb.webp');
  assert.equal(await g.text(), 'DA-GITHUB');
  assert.equal(g.headers.get('Content-Type'), 'image/webp');
  assert.match(g.headers.get('Cache-Control'), /immutable/);
  assert.equal((await chiedi(ENV(), '/assets/img/pezzi/2026-10/cccc.webp')).status, 404);
});

test('video a pezzi: 206 con i byte giusti, 416 fuori dal file, intero senza Range', async () => {
  const r = await chiedi(ENV(), '/assets/video/bosco.mp4', { Range: 'bytes=100-199' });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get('Content-Range'), 'bytes 100-199/1000');
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), VIDEO.slice(100, 200));
  const coda = await chiedi(ENV(), '/assets/video/bosco.mp4', { Range: 'bytes=-10' });
  assert.deepEqual(new Uint8Array(await coda.arrayBuffer()), VIDEO.slice(990));
  assert.equal((await chiedi(ENV(), '/assets/video/bosco.mp4', { Range: 'bytes=5000-' })).status, 416);
  assert.equal((await chiedi(ENV(), '/assets/video/bosco.mp4')).status, 200);
});

test('le richieste /api/ vanno all\'app (senza tessera: 401)', async () => {
  const r = await chiedi({ ...ENV(), PIN_BOTTEGA: '1', SEGRETO: 'x'.repeat(20) }, '/api/pezzi');
  assert.equal(r.status, 401);
});
