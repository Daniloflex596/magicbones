/* ==========================================================================
   I dati del catalogo: lettura, controllo e modifica di site/data/pezzi.js.
   Lo usano le funzioni online (functions/api) quando Claudia lavora
   dall'app Bottega. Codice puro: niente rete, niente file — si prova con
   `node --test test/`.

   Le foto caricate dall'app vivono in assets/img/pezzi/<id>/ e ognuna ha
   tre file: <hash>.<ext> (900 px), <hash>-600.<ext> (porte del catalogo),
   <hash>-mini.<ext> (240×240, carrello). Le foto dei pezzi di prima
   (assets/img/products/) non vengono mai cancellate da qui.
   ========================================================================== */

const TESTA = '/* I pezzi del catalogo. Lo aggiorna l\'app Bottega (site/bottega/): non modificarlo a mano\n' +
              '   se non sai cosa fai — è JSON puro tra le due righe. */\n';
const INIZIO = 'window.MB_DATI = ';
export const CARTELLA_FOTO = 'assets/img/pezzi/';
export const UNITA = ['pezzo unico', 'a pezzo'];
const LIMITI = { nome: 80, descrizione: 2000, citazione: 300, categoria: 40, prezzoMax: 100000 };

export function leggiDati(testo) {
  const i = testo.indexOf(INIZIO);
  const j = testo.lastIndexOf(';');
  if (i < 0 || j < i) throw new Error('File dati non riconosciuto');
  let d;
  try { d = JSON.parse(testo.slice(i + INIZIO.length, j)); } catch (e) { throw new Error('File dati rovinato: ' + e.message); }
  if (!d || !Array.isArray(d.pezzi) || !Array.isArray(d.categorie)) throw new Error('File dati incompleto');
  return d;
}

export function scriviDati(dati) {
  return TESTA + INIZIO + JSON.stringify(dati, null, 1) + ';\n';
}

export function slug(testo) {
  const s = String(testo || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return s || 'pezzo';
}

function idUnico(base, usati) {
  if (!usati.has(base)) return base;
  for (let n = 2; ; n++) if (!usati.has(base + '-' + n)) return base + '-' + n;
}

function testo(v, max) {
  const s = String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim();
  return s.length > max ? null : s;
}

/* Controlla quello che arriva dall'app. Restituisce { ok, errori, pulito }. */
export function validaPezzo(input, dati) {
  const errori = [];
  const nome = testo(input.nome, LIMITI.nome);
  if (!nome) errori.push(nome === null ? 'Il nome è troppo lungo (max ' + LIMITI.nome + ' caratteri)' : 'Manca il nome');

  const prezzo = Math.round(Number(String(input.prezzo == null ? '' : input.prezzo).replace(',', '.').trim()) * 100) / 100;
  if (!(prezzo > 0) || prezzo > LIMITI.prezzoMax) errori.push('Il prezzo non è valido');

  const unita = UNITA.includes(input.unita) ? input.unita : null;
  if (!unita) errori.push('Scegli se è un pezzo unico o venduto a pezzo');

  let cat = null, nuovaCategoria = null;
  if (input.nuovaCategoria != null && String(input.nuovaCategoria).trim()) {
    nuovaCategoria = testo(input.nuovaCategoria, LIMITI.categoria);
    if (!nuovaCategoria || slug(nuovaCategoria) === 'pezzo' && !/pezzo/i.test(nuovaCategoria)) errori.push('Il nome della categoria non va bene');
  } else {
    cat = dati.categorie.some(c => c.id === input.cat) ? input.cat : null;
    if (!cat) errori.push('Scegli una categoria');
  }

  const descrizione = testo(input.descrizione, LIMITI.descrizione);
  if (descrizione === null) errori.push('La descrizione è troppo lunga');
  const citazione = testo(input.citazione, LIMITI.citazione);
  if (citazione === null) errori.push('La tua frase è troppo lunga');

  const pulito = { nome, prezzo, da: !!input.da, unita, descrizione: descrizione || '', citazione: citazione || '' };
  if (cat) pulito.cat = cat; else pulito.nuovaCategoria = nuovaCategoria;
  return { ok: errori.length === 0, errori, pulito };
}

/* Per una foto caricata dall'app: i suoi tre file. Per le foto di prima: nessuno. */
export function fileDellaFoto(src) {
  const m = new RegExp('^' + CARTELLA_FOTO.replace(/\//g, '\\/') + '(.+)\\/([0-9a-f]+)\\.(webp|jpg)$').exec(src || '');
  if (!m) return [];
  const radice = CARTELLA_FOTO + m[1] + '/' + m[2];
  return [radice + '.' + m[3], radice + '-600.' + m[3], radice + '-mini.' + m[3]];
}
function miniDi(src) { const f = fileDellaFoto(src); return f.length ? f[2] : null; }

function altFoto(nome, descrizione, n) {
  if (n > 0) return nome + ', un\'altra vista.';
  const frase = (descrizione || '').split(/(?<=[.!?])\s/)[0].slice(0, 140);
  return frase ? nome + ': ' + frase : nome;
}

/* Crea (senza id) o modifica (con id) un pezzo. `foto` è la lista in ordine,
   la prima è la copertina: { src, porta?, mini?, w, h } — per una foto già
   presente basta src (descrizione e misure di prima restano). */
export function applicaPezzo(datiIn, { id, campi, foto }, ora) {
  if (!Array.isArray(foto) || foto.length === 0) throw new Error('Serve almeno una foto');
  const dati = structuredClone(datiIn);

  let cat = campi.cat;
  if (campi.nuovaCategoria) {
    const cid = slug(campi.nuovaCategoria);
    if (!dati.categorie.some(c => c.id === cid)) dati.categorie.push({ id: cid, nome: campi.nuovaCategoria.trim() });
    cat = cid;
  }

  let pezzo, nuovo = false;
  if (id) {
    pezzo = dati.pezzi.find(p => p.id === id);
    if (!pezzo) throw new Error('Pezzo non trovato: ' + id);
  } else {
    pezzo = { id: idUnico(slug(campi.nome), new Set(dati.pezzi.map(p => p.id))), creato: ora };
    dati.pezzi.push(pezzo);
    nuovo = true;
  }
  const prima = new Map((pezzo.foto || []).map(f => [f.src, f]));

  pezzo.nome = campi.nome;
  pezzo.prezzo = campi.prezzo;
  if (campi.da) pezzo.da = true; else delete pezzo.da;
  pezzo.cat = cat;
  pezzo.unita = campi.unita;
  if (campi.citazione) pezzo.citazione = campi.citazione; else delete pezzo.citazione;
  pezzo.descrizione = campi.descrizione;

  pezzo.foto = foto.map((f, n) => {
    const vecchia = prima.get(f.src);
    const x = { src: f.src };
    const porta = f.porta || (vecchia && vecchia.porta);
    if (porta) x.porta = porta;
    x.alt = (vecchia && vecchia.alt) || altFoto(campi.nome, campi.descrizione, n);
    x.w = f.w || (vecchia && vecchia.w) || 900;
    x.h = f.h || (vecchia && vecchia.h) || 1200;
    return x;
  });
  const copertina = foto[0];
  pezzo.thumb = copertina.mini || miniDi(copertina.src) || pezzo.thumb || copertina.src;

  pezzo.aggiornato = ora;
  dati.aggiornato = ora;
  return { dati, id: pezzo.id, nuovo };
}

export function segnaVenduto(datiIn, id, venduto, ora) {
  const dati = structuredClone(datiIn);
  const p = dati.pezzi.find(x => x.id === id);
  if (!p) throw new Error('Pezzo non trovato: ' + id);
  if (venduto) p.venduto = true; else delete p.venduto;
  p.aggiornato = ora;
  dati.aggiornato = ora;
  return dati;
}

/* I file delle foto caricate dall'app che dopo la modifica nessuno usa più. */
export function fotoOrfane(prima, dopo) {
  const usati = d => new Set(d.pezzi.flatMap(p => (p.foto || []).flatMap(f => fileDellaFoto(f.src))));
  const dopoSet = usati(dopo);
  return [...usati(prima)].filter(f => !dopoSet.has(f));
}
