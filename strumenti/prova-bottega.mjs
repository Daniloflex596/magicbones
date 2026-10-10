// Prova completa dell'app Bottega in locale, SENZA toccare GitHub né Cloudflare.
//     node strumenti/prova-bottega.mjs            → http://localhost:8790/bottega/  (PIN 123456)
//
// Fa girare insieme: il sito (site/), le funzioni online (lib/api.js, come su
// Cloudflare) e un finto GitHub in memoria (test/finto-github.mjs). Simula
// anche la ripubblicazione: quello che l'app salva compare sul sito dopo
// RITARDO_MS, come succede davvero (Cloudflare impiega circa un minuto).
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gestisci } from '../lib/api.js';
import { FILE_DATI } from '../lib/github.js';
import { creaFintoGithub } from '../test/finto-github.mjs';

const PORTA = Number(process.argv[2] || 8790);
const RITARDO_MS = Number(process.env.RITARDO_MS || 8000);
const SITO = fileURLToPath(new URL('../site/', import.meta.url));
const ENV = {
  PIN_BOTTEGA: '123456', SEGRETO: 'segreto-solo-per-la-prova-locale',
  CHIAVE_GITHUB: 'tok', ARCHIVIO_GITHUB: 'utente/archivio', API_GITHUB: 'https://finto'
};
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

const finto = creaFintoGithub({ file: { [FILE_DATI]: readFileSync(join(SITO, 'data/pezzi.js'), 'utf8') } });
// "pubblicazioni": quello che il sito mostra, con il ritardo di Cloudflare
const pubblicato = [{ quando: 0, dati: finto.leggi(FILE_DATI) }];
let ultimoVisto = finto.leggi(FILE_DATI);
setInterval(() => {
  const ora = finto.leggi(FILE_DATI);
  if (ora !== ultimoVisto) { ultimoVisto = ora; pubblicato.push({ quando: Date.now() + RITARDO_MS, dati: ora }); }
}, 250);
const datiOnline = () => pubblicato.filter(p => p.quando <= Date.now()).pop().dati;

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PORTA);
  try {
    if (url.pathname.startsWith('/api/')) {
      const corpo = await new Promise(ok => { const parti = []; req.on('data', c => parti.push(c)); req.on('end', () => ok(Buffer.concat(parti))); });
      const r = await gestisci(new Request(url, {
        method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : corpo
      }), ENV, { fetch: finto.fetch });
      const h = Object.fromEntries(r.headers);
      // in locale (http) un cookie "Secure" non tornerebbe indietro su tutti i browser
      if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].replace('; Secure', '');
      res.writeHead(r.status, h);
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    if (url.pathname === '/data/pezzi.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      return res.end(datiOnline());
    }
    if (url.pathname.startsWith('/assets/img/pezzi/')) {
      const b = finto.binario('site' + decodeURIComponent(url.pathname));
      if (!b) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TIPI[extname(url.pathname)] || 'application/octet-stream' });
      return res.end(b);
    }
    let p = normalize(join(SITO, decodeURIComponent(url.pathname)));
    if (!p.startsWith(normalize(SITO))) { res.writeHead(403); return res.end(); }
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404); return res.end('non trovato'); }
    res.writeHead(200, { 'Content-Type': TIPI[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(readFileSync(p));
  } catch (e) {
    res.writeHead(500); res.end(String(e.stack || e));
  }
}).listen(PORTA, () => {
  console.log(`Prova Bottega: http://localhost:${PORTA}/bottega/  (PIN ${ENV.PIN_BOTTEGA}) — ripubblicazione simulata: ${RITARDO_MS / 1000}s`);
});

// il finto GitHub raggiungibile anche da fuori (porta +2): serve per provare le
// funzioni dentro il vero motore di Cloudflare (wrangler pages dev), con
// API_GITHUB=http://127.0.0.1:<porta+2>
http.createServer(async (req, res) => {
  const corpo = await new Promise(ok => { const parti = []; req.on('data', c => parti.push(c)); req.on('end', () => ok(Buffer.concat(parti))); });
  const r = await finto.fetch('https://finto' + req.url, { method: req.method, headers: req.headers, body: corpo.length ? corpo.toString('utf8') : undefined });
  res.writeHead(r.status, { 'Content-Type': r.headers.get('Content-Type') || 'application/octet-stream' });
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(PORTA + 2);

// per controllare dall'esterno cosa c'è nel finto archivio
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ commit: finto.quantiCommit(), ultimo: finto.ultimoMessaggio(), file: finto.elenco().filter(f => !f.startsWith('site/assets/img/products')) }, null, 1));
}).listen(PORTA + 1);
