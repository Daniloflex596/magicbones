// Un finto GitHub in memoria: le stesse risposte dell'API vera per quello che
// usa lib/github.js (ref, commit, contents, blobs, trees, commits, refs).
// Serve ai test e alla prova completa in locale (strumenti/prova-bottega.mjs):
// nessuna prova tocca mai l'archivio vero.
import { createHash } from 'node:crypto';

export function creaFintoGithub({ repo = 'utente/archivio', ramo = 'main', token = 'tok', file = {} } = {}) {
  const blobs = new Map();     // sha → Buffer
  const alberi = new Map();    // sha → Map(percorso → sha blob)
  const commit = new Map();    // sha → { tree, parents, message }
  const ref = {};
  const chiamate = [];
  let primaDiAggiornare = null; // gancio per simulare una modifica concorrente

  const sha = (tipo, dati) => createHash('sha1').update(tipo + ':' + dati).digest('hex');
  function nuovoBlob(buf) { const s = sha('blob', buf.toString('base64')); blobs.set(s, buf); return s; }
  function nuovoAlbero(mappa) { const s = sha('tree', JSON.stringify([...mappa].sort())); alberi.set(s, mappa); return s; }
  function nuovoCommit(tree, parents, message) { const s = sha('commit', tree + parents.join() + message + commit.size); commit.set(s, { tree, parents, message }); return s; }

  // stato iniziale
  const iniziale = new Map(Object.entries(file).map(([p, t]) => [p, nuovoBlob(Buffer.from(t))]));
  ref[ramo] = nuovoCommit(nuovoAlbero(iniziale), [], 'inizio');

  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  const base = `/repos/${repo}/`;

  async function fetchFinto(url, opts = {}) {
    const u = new URL(url);
    const metodo = (opts.method || 'GET').toUpperCase();
    chiamate.push(metodo + ' ' + u.pathname);
    const auth = (opts.headers && (opts.headers.Authorization || opts.headers.authorization)) || '';
    if (auth !== 'Bearer ' + token) return json({ message: 'Bad credentials' }, 401);
    if (!u.pathname.startsWith(base)) return json({ message: 'Not Found' }, 404);
    const p = u.pathname.slice(base.length);
    const corpo = opts.body ? JSON.parse(opts.body) : null;

    if (metodo === 'GET' && p === `git/ref/heads/${ramo}`) return json({ object: { sha: ref[ramo] } });
    if (metodo === 'GET' && p.startsWith('git/commits/')) {
      const c = commit.get(p.slice('git/commits/'.length));
      return c ? json({ sha: p.slice(12), tree: { sha: c.tree }, parents: c.parents.map(s => ({ sha: s })) }) : json({ message: 'Not Found' }, 404);
    }
    if (metodo === 'GET' && p.startsWith('contents/')) {
      const percorso = decodeURIComponent(p.slice('contents/'.length));
      const c = commit.get(u.searchParams.get('ref') || ref[ramo]);
      const b = c && alberi.get(c.tree).get(percorso);
      return b ? new Response(blobs.get(b)) : json({ message: 'Not Found' }, 404);
    }
    if (metodo === 'POST' && p === 'git/blobs') {
      const buf = corpo.encoding === 'base64' ? Buffer.from(corpo.content, 'base64') : Buffer.from(corpo.content, 'utf8');
      return json({ sha: nuovoBlob(buf) }, 201);
    }
    if (metodo === 'POST' && p === 'git/trees') {
      const mappa = new Map(alberi.get(corpo.base_tree) || []);
      for (const v of corpo.tree) {
        if (v.sha === null) {
          if (!mappa.has(v.path)) return json({ message: 'GitRPC::BadObjectState' }, 422);
          mappa.delete(v.path);
        } else {
          if (!blobs.has(v.sha)) return json({ message: 'tree.sha ' + v.sha + ' is not a valid blob' }, 422);
          mappa.set(v.path, v.sha);
        }
      }
      return json({ sha: nuovoAlbero(mappa) }, 201);
    }
    if (metodo === 'POST' && p === 'git/commits') return json({ sha: nuovoCommit(corpo.tree, corpo.parents, corpo.message) }, 201);
    if (metodo === 'PATCH' && p === `git/refs/heads/${ramo}`) {
      if (primaDiAggiornare) { const f = primaDiAggiornare; primaDiAggiornare = null; await f(); }
      const c = commit.get(corpo.sha);
      if (!c) return json({ message: 'Object does not exist' }, 422);
      if (!corpo.force && c.parents[0] !== ref[ramo]) return json({ message: 'Update is not a fast forward' }, 422);
      ref[ramo] = corpo.sha;
      return json({ object: { sha: corpo.sha } });
    }
    return json({ message: 'Not Found (finto)' }, 404);
  }

  const albero = () => alberi.get(commit.get(ref[ramo]).tree);
  return {
    fetch: fetchFinto,
    leggi: percorso => { const b = albero().get(percorso); return b ? blobs.get(b).toString('utf8') : null; },
    binario: percorso => { const b = albero().get(percorso); return b ? blobs.get(b) : null; },
    elenco: () => [...albero().keys()].sort(),
    ultimoMessaggio: () => commit.get(ref[ramo]).message,
    quantiCommit: () => { let n = 0, s = ref[ramo]; while (s) { n++; s = commit.get(s).parents[0]; } return n; },
    chiamate,
    // fa entrare un'altra modifica (es. dal PC) proprio prima che la nostra arrivi
    simulaConcorrenza(percorso, testo) {
      primaDiAggiornare = async () => {
        const m = new Map(albero()); m.set(percorso, nuovoBlob(Buffer.from(testo)));
        ref[ramo] = nuovoCommit(nuovoAlbero(m), [ref[ramo]], 'modifica concorrente');
      };
    }
  };
}
