// Cloudflare Workers: il sito sono i file di site/, serviti direttamente.
// Passano da qui solo (vedi run_worker_first in wrangler.toml):
//   · /api/…          l'app Bottega → lib/api.js
//   · i video         per consegnarli "a pezzi" (richieste Range, risposta 206):
//                     è quello che fa partire subito il film d'apertura invece
//                     di aspettare il file intero (su 4G: 3 s invece di 25 s).
//                     Il deposito dei file statici non risponde a pezzi (e non
//                     sempre dice quanto è grande il file): qui lo si garantisce.
import { gestisci } from './lib/api.js';

const VIDEO = /^\/assets\/(video|reel)\//;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return gestisci(request, env);
    const range = request.headers.get('Range');
    if (range && VIDEO.test(url.pathname) && request.method === 'GET') return aPezzi(request, env, range);
    return env.ASSETS.fetch(request);
  }
};

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
