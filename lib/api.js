/* ==========================================================================
   Le funzioni online dell'app Bottega (su Cloudflare: functions/api/).
   Tutto passa da gestisci(request, env): così si prova uguale in Node.

     POST /api/accedi   { pin }                      → tessera (cookie)
     POST /api/esci                                   → tessera cancellata
     GET  /api/io                                     → { ok } se la tessera vale
     GET  /api/pezzi                                  → { dati, commit } dall'archivio
     POST /api/foto     { hash, ext, w, h, grande, porta, mini }   (base64)
                        → la foto salvata come 3 blob, pronta per un pezzo
     POST /api/pezzo    { id?, campi, foto: [...] }   → nuovo pezzo o modifica
     POST /api/venduto  { id, venduto }               → venduto / di nuovo in vendita

   Le foto viaggiano UNA ALLA VOLTA e già rimpicciolite dal telefono: sul piano
   gratuito di Cloudflare ogni chiamata ha poco tempo di calcolo e massimo 50
   richieste verso fuori. Il calcolo pesante (ridimensionare, l'impronta) lo
   fa il telefono; qui si inoltra soltanto.

   Configurazione (variabili d'ambiente su Cloudflare):
     PIN_BOTTEGA, SEGRETO, CHIAVE_GITHUB, ARCHIVIO_GITHUB, RAMO_GITHUB (main)
     API_GITHUB (solo per le prove con il finto GitHub)
   (Cloudflare non accetta segreti che iniziano con GITHUB_: i vecchi nomi
   GITHUB_TOKEN / GITHUB_REPO / GITHUB_BRANCH / GITHUB_API valgono ancora.)
   ========================================================================== */
import { creaGithub, SITO } from './github.js';
import { validaPezzo, applicaPezzo, segnaVenduto, fotoOrfane, fileDellaFoto, CARTELLA_FOTO } from './dati.js';
import { creaTessera, tesseraValida, pinGiusto, leggiCookie, cookieTessera, COOKIE } from './sessione.js';

const MAX_CORPO = 9 * 1024 * 1024;
const MAX_FOTO = 10;
const B64 = { grande: 4 * 1024 * 1024, porta: 2 * 1024 * 1024, mini: 400 * 1024 };
const SHA = /^[0-9a-f]{40}$/;

class Invalido extends Error {
  constructor(errori) { super(errori.join(' · ')); this.errori = errori; }
}

function json(o, status = 200, intestazioni = {}) {
  return new Response(JSON.stringify(o), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...intestazioni }
  });
}
const attendi = ms => new Promise(r => setTimeout(r, ms));

async function corpoJson(request) {
  const n = Number(request.headers.get('Content-Length') || 0);
  if (n > MAX_CORPO) throw new Invalido(['Il file è troppo grande']);
  try { return await request.json(); } catch (e) { throw new Invalido(['Richiesta non leggibile']); }
}

export async function gestisci(request, env, { fetch, ora = () => new Date() } = {}) {
  const url = new URL(request.url);
  const via = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const metodo = request.method;

  // le richieste che cambiano qualcosa devono arrivare dal sito stesso
  const origine = request.headers.get('Origin');
  if (metodo !== 'GET' && origine && origine !== url.origin) return json({ errore: 'Origine non permessa' }, 403);

  try {
    if (via === 'accedi' && metodo === 'POST') {
      if (!env.PIN_BOTTEGA || !env.SEGRETO) return json({ errore: 'L\'app non è ancora configurata (PIN o SEGRETO mancanti)' }, 500);
      const { pin } = await corpoJson(request);
      if (!pinGiusto(pin, env.PIN_BOTTEGA)) {
        await attendi(1000);   // rallenta chi prova i PIN a caso
        return json({ errore: 'PIN sbagliato' }, 401);
      }
      return json({ ok: true }, 200, { 'Set-Cookie': cookieTessera(await creaTessera(env.SEGRETO)) });
    }
    if (via === 'esci' && metodo === 'POST') {
      return json({ ok: true }, 200, { 'Set-Cookie': cookieTessera('', 0) });
    }

    // da qui in poi serve la tessera
    if (!(await tesseraValida(env.SEGRETO, leggiCookie(request, COOKIE)))) {
      return json({ errore: 'Accesso scaduto: inserisci di nuovo il PIN' }, 401);
    }
    if (via === 'io' && metodo === 'GET') return json({ ok: true });

    const gh = creaGithub({
      token: env.CHIAVE_GITHUB || env.GITHUB_TOKEN, repo: env.ARCHIVIO_GITHUB || env.GITHUB_REPO,
      ramo: env.RAMO_GITHUB || env.GITHUB_BRANCH || 'main', api: env.API_GITHUB || env.GITHUB_API || undefined, fetch: fetch || globalThis.fetch.bind(globalThis)
    });
    const iso = ora().toISOString();

    if (via === 'pezzi' && metodo === 'GET') {
      return json(await gh.leggiDatiAttuali());
    }

    if (via === 'foto' && metodo === 'POST') {
      const c = await corpoJson(request);
      const errori = [];
      if (!/^[0-9a-f]{16,64}$/.test(c.hash || '')) errori.push('Impronta della foto non valida');
      if (!['webp', 'jpg'].includes(c.ext)) errori.push('Formato della foto non valido');
      for (const k of ['w', 'h']) if (!Number.isInteger(c[k]) || c[k] < 50 || c[k] > 6000) errori.push('Misure della foto non valide');
      for (const k of ['grande', 'porta', 'mini']) {
        if (typeof c[k] !== 'string' || !c[k].length || c[k].length > B64[k]) errori.push('Foto mancante o troppo grande (' + k + ')');
      }
      if (errori.length) throw new Invalido([...new Set(errori)]);
      const cartella = CARTELLA_FOTO + iso.slice(0, 7) + '/';
      const radice = cartella + c.hash.slice(0, 20);
      const percorsi = { src: radice + '.' + c.ext, porta: radice + '-600.' + c.ext, mini: radice + '-mini.' + c.ext };
      const [a, b, m] = await Promise.all([gh.creaBlob(c.grande), gh.creaBlob(c.porta), gh.creaBlob(c.mini)]);
      return json({ ...percorsi, w: c.w, h: c.h, sha: { src: a, porta: b, mini: m } });
    }

    if (via === 'pezzo' && metodo === 'POST') {
      const c = await corpoJson(request);
      const id = c.id ? String(c.id) : null;
      const foto = Array.isArray(c.foto) ? c.foto : [];
      if (!foto.length) throw new Invalido(['Aggiungi almeno una foto']);
      if (foto.length > MAX_FOTO) throw new Invalido(['Al massimo ' + MAX_FOTO + ' foto per pezzo']);

      // le foto nuove: tre file ciascuna, già caricati con /api/foto
      const voci = [];
      for (const f of foto) {
        if (!f.sha) continue;
        const attesi = fileDellaFoto(f.src);
        if (attesi.length !== 3 || attesi[1] !== f.porta || attesi[2] !== f.mini) throw new Invalido(['Foto non riconosciuta']);
        for (const [k, p] of [['src', f.src], ['porta', f.porta], ['mini', f.mini]]) {
          if (!SHA.test(f.sha[k] || '')) throw new Invalido(['Foto non caricata del tutto: riprova']);
          voci.push({ path: SITO + p, sha: f.sha[k] });
        }
      }

      let nome = '';
      const r = await gh.aggiornaDati(async dati => {
        const v = validaPezzo(c.campi || {}, dati);
        if (!v.ok) throw new Invalido(v.errori);
        // una foto "vecchia" deve essere davvero di questo pezzo
        const sue = new Set(id ? (dati.pezzi.find(p => p.id === id) || { foto: [] }).foto.map(f => f.src) : []);
        for (const f of foto) if (!f.sha && !sue.has(f.src)) throw new Invalido(['Una delle foto non appartiene a questo pezzo']);
        const pulite = foto.map(f => ({ src: f.src, porta: f.porta, mini: f.mini, w: f.w, h: f.h }));
        const esito = applicaPezzo(dati, { id, campi: v.pulito, foto: pulite }, iso);
        nome = v.pulito.nome;
        return { dati: esito.dati, togli: fotoOrfane(dati, esito.dati), id: esito.id, nuovo: esito.nuovo };
      }, { voci, messaggio: (id ? 'Bottega: modifica «' : 'Bottega: nuovo pezzo «') + (c.campi && c.campi.nome || '').toString().slice(0, 60) + '»' });

      return json({ ok: true, id: r.esito.id, nuovo: r.esito.nuovo, commit: r.commit, aggiornato: r.dati.aggiornato, nome, dati: r.dati });
    }

    if (via === 'venduto' && metodo === 'POST') {
      const c = await corpoJson(request);
      if (!c.id) throw new Invalido(['Manca il pezzo']);
      const r = await gh.aggiornaDati(dati => ({ dati: segnaVenduto(dati, String(c.id), !!c.venduto, iso) }), {
        messaggio: 'Bottega: «' + String(c.id) + '» ' + (c.venduto ? 'venduto' : 'di nuovo in vendita')
      });
      return json({ ok: true, commit: r.commit, aggiornato: r.dati.aggiornato, dati: r.dati });
    }

    return json({ errore: 'Non trovato' }, 404);
  } catch (e) {
    // nei registri di Cloudflare (Workers Logs): cosa è andato storto e dove
    console.log(JSON.stringify({ api: via, errore: String(e.message || e).slice(0, 300) }));
    if (e instanceof Invalido) return json({ errore: e.message, errori: e.errori }, 400);
    if (/non trovato/i.test(e.message)) return json({ errore: 'Questo pezzo non esiste più' }, 404);
    return json({ errore: 'Qualcosa non ha funzionato, riprova tra poco', dettaglio: String(e.message || e).slice(0, 300) }, 502);
  }
}
