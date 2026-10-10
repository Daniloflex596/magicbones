/* ==========================================================================
   Il collegamento con l'archivio GitHub (il sito vive lì: ogni modifica di
   Claudia è un commit, e Cloudflare ripubblica da solo).

   Ogni invio diventa UN commit con tutto dentro (foto + dati), così il sito
   non è mai a metà. Se nel frattempo è arrivata un'altra modifica (il ramo
   non è più dove l'avevamo letto), si rilegge e si riapplica: niente va perso.
   ========================================================================== */
import { leggiDati, scriviDati } from './dati.js';

export const FILE_DATI = 'site/data/pezzi.js';
export const SITO = 'site/';

export class Conflitto extends Error {}
export class ErroreGithub extends Error {
  constructor(msg, stato) { super(msg); this.stato = stato; }
}

const dormi = ms => new Promise(r => setTimeout(r, ms));

export function creaGithub({ token, repo, ramo = 'main', api = 'https://api.github.com', fetch: f = globalThis.fetch, attendi = dormi }) {
  if (!token || !repo) throw new Error('Manca la configurazione di GitHub (GITHUB_TOKEN / GITHUB_REPO)');
  const radice = `${api.replace(/\/$/, '')}/repos/${repo}/`;

  async function chiama(metodo, percorso, corpo, accetta = 'application/vnd.github+json') {
    const r = await f(radice + percorso, {
      method: metodo,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: accetta,
        'User-Agent': 'magicbones-bottega',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(corpo ? { 'Content-Type': 'application/json' } : {})
      },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    if (!r.ok) {
      const testo = await r.text().catch(() => '');
      if (r.status === 422 && /fast forward/i.test(testo)) throw new Conflitto('Il ramo è andato avanti');
      throw new ErroreGithub(`GitHub ${metodo} ${percorso}: ${r.status} ${testo.slice(0, 200)}`, r.status);
    }
    return accetta.endsWith('raw') ? r.text() : r.json();
  }

  async function testa() {
    const r = await chiama('GET', `git/ref/heads/${ramo}`);
    const c = await chiama('GET', `git/commits/${r.object.sha}`);
    return { commit: r.object.sha, albero: c.tree.sha };
  }

  async function leggiFile(percorso, ref) {
    return chiama('GET', `contents/${percorso.split('/').map(encodeURIComponent).join('/')}?ref=${ref}`, null, 'application/vnd.github.raw');
  }

  async function creaBlob(base64) {
    return (await chiama('POST', 'git/blobs', { content: base64, encoding: 'base64' })).sha;
  }

  async function committa(base, voci, messaggio) {
    const tree = await chiama('POST', 'git/trees', {
      base_tree: base.albero,
      tree: voci.map(v => ({ path: v.path, mode: '100644', type: 'blob', sha: v.sha }))
    });
    const c = await chiama('POST', 'git/commits', { message: messaggio, tree: tree.sha, parents: [base.commit] });
    await chiama('PATCH', `git/refs/heads/${ramo}`, { sha: c.sha, force: false });
    return c.sha;
  }

  /* Legge i dati, applica `mutazione(dati) → { dati, togli?: [percorsi] }`,
     e salva tutto in un commit insieme a `voci` (le foto nuove: {path, sha}).
     Se il ramo nel frattempo è andato avanti, GitHub rifiuta (niente si
     perde) e si riprova. Misurato sul GitHub vero: subito dopo un salvataggio
     la lettura del ramo può dare ancora il commit di prima per ~1 s, quindi
     fra un tentativo e l'altro si aspetta sempre un po' di più (0,6 s, 1,2 s…). */
  async function aggiornaDati(mutazione, { voci = [], messaggio, tentativi = 6 } = {}) {
    for (let t = 1; ; t++) {
      const base = await testa();
      const dati = leggiDati(await leggiFile(FILE_DATI, base.commit));
      const esito = await mutazione(dati);
      const blobDati = (await chiama('POST', 'git/blobs', { content: scriviDati(esito.dati), encoding: 'utf-8' })).sha;
      const togli = (esito.togli || []).map(p => ({ path: SITO + p, sha: null }));
      const tutte = [...voci, { path: FILE_DATI, sha: blobDati }];
      try {
        try {
          return { commit: await committa(base, [...tutte, ...togli], messaggio), dati: esito.dati, esito };
        } catch (e) {
          // una foto vecchia da togliere che non c'è già più: si salva senza cancellare
          if (togli.length && e instanceof ErroreGithub && e.stato === 422) {
            return { commit: await committa(base, tutte, messaggio), dati: esito.dati, esito };
          }
          throw e;
        }
      } catch (e) {
        if (e instanceof Conflitto && t < tentativi) { await attendi(600 * t); continue; }
        throw e;
      }
    }
  }

  async function leggiDatiAttuali() {
    const base = await testa();
    return { commit: base.commit, dati: leggiDati(await leggiFile(FILE_DATI, base.commit)) };
  }

  return { testa, leggiFile, creaBlob, committa, aggiornaDati, leggiDatiAttuali };
}
