// Cloudflare Workers: il sito sono i file di site/, serviti direttamente.
// Passano da qui solo (vedi run_worker_first in wrangler.toml):
//   · /api/…             l'app Bottega → lib/api.js
//   · /data/pezzi.js     il catalogo, letto DALL'ARCHIVIO GITHUB (ramo main)
//   · /assets/img/pezzi/ le foto caricate dall'app, idem
//     → un pezzo pubblicato da Claudia è online in ~20 s, senza aspettare
//       nessuna ripubblicazione (misurato: la ripubblicazione automatica da
//       GitHub su Cloudflare non partiva). Se GitHub non risponde si serve la
//       copia che il sito ha già: il sito non si rompe mai.
//   · catalogo.html, pezzo.html  il deposito dei file statici risponderebbe
//       con un rinvio (307) all'indirizzo senza .html: un viaggio di rete in
//       più a ogni cambio di pagina (sul telefono 100-300 ms). Qui la pagina
//       si consegna subito.
//   · i video            per consegnarli "a pezzi" (richieste Range, 206): è
//       quello che fa partire subito il film d'apertura (su 4G: 3-6 s invece
//       di 25 s). Il deposito dei file statici non risponde a pezzi (e non
//       sempre dice quanto è grande il file): qui lo si garantisce.
import { gestisci } from './lib/api.js';

const VIDEO = /^\/assets\/(video|reel)\//;
const PAGINE = /^\/(catalogo|pezzo)\.html$/;
const DATI = '/data/pezzi.js';
const FOTO_APP = /^\/assets\/img\/pezzi\/[\w./-]+\.(webp|jpg)$/;
const RESPIRO_DATI = 20 * 1000;          // per 20 s il catalogo si riusa senza richiederlo a GitHub
const TIPI = { js: 'text/javascript; charset=utf-8', webp: 'image/webp', jpg: 'image/jpeg' };

// memoria del "portinaio" (vive finché Cloudflare tiene acceso questo esemplare)
export const memoria = { dati: null, datiQuando: 0 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return gestisci(request, env);
    if (PAGINE.test(url.pathname) && (request.method === 'GET' || request.method === 'HEAD')) {
      const senza = new URL(url);
      senza.pathname = url.pathname.replace(/\.html$/, '');
      return env.ASSETS.fetch(new Request(senza, request));
    }
    if (request.method === 'GET') {
      if (url.pathname === DATI) return catalogo(env);
      if (FOTO_APP.test(url.pathname)) return fotoApp(request, env, url.pathname);
      const range = request.headers.get('Range');
      if (range && VIDEO.test(url.pathname)) return aPezzi(request, env, range);
    }
    return env.ASSETS.fetch(request);
  }
};

/* ------------------------------------------------- dall'archivio GitHub -- */
function dallArchivio(env, percorso) {
  const repo = env.ARCHIVIO_GITHUB || env.GITHUB_REPO;
  const ramo = env.RAMO_GITHUB || env.GITHUB_BRANCH || 'main';
  const token = env.CHIAVE_GITHUB || env.GITHUB_TOKEN;
  const api = (env.API_GITHUB || env.GITHUB_API || 'https://api.github.com').replace(/\/$/, '');
  if (!repo || !token) return Promise.resolve(null);
  return fetch(`${api}/repos/${repo}/contents/site${percorso}?ref=${ramo}`, {
    headers: {
      Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.raw',
      'User-Agent': 'magicbones-sito', 'X-GitHub-Api-Version': '2022-11-28'
    }
  }).then(r => (r.ok ? r : null), () => null);
}

async function catalogo(env) {
  const intestazioni = { 'Content-Type': TIPI.js, 'Cache-Control': 'public, max-age=0, must-revalidate' };
  if (memoria.dati && Date.now() - memoria.datiQuando < RESPIRO_DATI) {
    return new Response(memoria.dati, { headers: intestazioni });
  }
  const r = await dallArchivio(env, DATI);
  if (r) {
    const testo = await r.text();
    if (testo.includes('window.MB_DATI')) {
      memoria.dati = testo; memoria.datiQuando = Date.now();
      return new Response(testo, { headers: intestazioni });
    }
  }
  // GitHub non risponde: l'ultima copia buona, altrimenti quella pubblicata col sito
  if (memoria.dati) return new Response(memoria.dati, { headers: intestazioni });
  return env.ASSETS.fetch(new Request(new URL(DATI, 'https://sito').href));
}

async function fotoApp(request, env, percorso) {
  // se la foto è già tra i file del sito la si serve da lì, altrimenti dall'archivio
  const statica = await env.ASSETS.fetch(request);
  if (statica.ok) return statica;
  const r = await dallArchivio(env, percorso);
  if (!r) return statica;
  return new Response(r.body, {
    headers: {
      'Content-Type': TIPI[percorso.split('.').pop()],
      // il nome è l'impronta della foto: non cambia mai, si tiene per sempre
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}

/* ------------------------------------------------------ video a pezzi -- */
async function aPezzi(request, env, range) {
  // il file intero dal deposito dei file statici (senza Range, senza compressione)
  const intero = await env.ASSETS.fetch(new Request(request.url, { headers: { 'Accept-Encoding': 'identity' } }));
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!intero.ok || intero.status === 206 || !m || (m[1] === '' && m[2] === '')) return intero;

  // la misura la si prende dal file stesso: il deposito non sempre manda
  // Content-Length (misurato in locale: assente), e senza misura niente 206
  const dati = await intero.arrayBuffer();
  const size = dati.byteLength;
  let start, end;
  if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }   // "bytes=-500": gli ultimi 500
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }

  const h = new Headers(intero.headers);
  h.delete('Content-Encoding');
  h.set('Content-Range', `bytes ${start}-${end}/${size}`);
  h.set('Content-Length', String(end - start + 1));
  h.set('Accept-Ranges', 'bytes');
  return new Response(new Uint8Array(dati, start, end - start + 1), { status: 206, headers: h });
}
