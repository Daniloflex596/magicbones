/* ==========================================================================
   MAGIC BONES — i pezzi (unica porta d'accesso per catalogo, pagina del
   pezzo, carrello)

   I DATI non stanno qui: stanno in data/pezzi.js (window.MB_DATI), che
   aggiorna l'app Bottega (bottega/) quando Claudia aggiunge, modifica o
   vende un pezzo. Questo file li trasforma nella forma che usano le pagine:
   · MB.categorie → { <id>: { nome, num } }  (num = I, II, III… nell'ordine)
   · MB.pezzi     → solo i pezzi IN VENDITA (catalogo, vetrine, "altri pezzi")
   · MB.tutti     → anche i venduti
   · MB.pezzo(id) → cerca fra tutti: un link a un pezzo venduto non si rompe,
                    la pagina dice "Venduto"

   Forma di un pezzo in data/pezzi.js:
     { id, nome, prezzo, da?, cat, unita: 'pezzo unico'|'a pezzo', mese?,
       citazione?, descrizione, thumb, venduto?,
       foto: [ { src, porta?, alt, w, h } ] }   (la prima foto è la copertina)
   ========================================================================== */
window.MB = window.MB || {};

(function () {
  var DATI = window.MB_DATI || { categorie: [], pezzi: [] };
  var ROMANI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

  var categorie = {};
  DATI.categorie.forEach(function (c, i) {
    categorie[c.id] = { nome: c.nome, num: ROMANI[i] || String(i + 1) };
  });

  window.MB.categorie = categorie;
  window.MB.tutti = DATI.pezzi;
  // in catalogo solo i pezzi in vendita e di una categoria che esiste
  window.MB.pezzi = DATI.pezzi.filter(function (p) { return !p.venduto && categorie[p.cat]; });
})();

window.MB.pezzo = function (id) {
  for (var i = 0; i < window.MB.tutti.length; i++) if (window.MB.tutti[i].id === id) return window.MB.tutti[i];
  return null;
};
