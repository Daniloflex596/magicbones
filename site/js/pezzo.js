/* ==========================================================================
   MAGIC BONES — la pagina del pezzo (pezzo.html?id=…)
   Legge il pezzo da js/pezzi.js e costruisce:
   · la galleria dentro la porta-altare: si scorre col dito, con le frecce,
     con le miniature o con ← → da tastiera
   · nome, prezzo, parole di Claudia, descrizione, "Aggiungi alla raccolta"
   · "Altri pezzi dal bosco"
   Gira PRIMA di ui.js / knots.js / cart.js (vedi l'ordine in pezzo.html).
   ========================================================================== */
(function () {
  'use strict';

  var MB = window.MB;
  var root = document.getElementById('celPiece');
  if (!root || !MB.pezzi) return;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var id = new URL(window.location.href).searchParams.get('id');
  var p = id ? MB.pezzo(id) : null;

  /* ------------------------------------------------------------ non trovato -- */
  if (!p) {
    root.innerHTML = '<div class="cel-missing">' +
      '<span class="cel-missing__sigil" data-knot="spiral" aria-hidden="true"></span>' +
      '<h1 class="cel-piece__title">Questo pezzo non c\'è</h1>' +
      '<p class="cel-piece__desc">Forse è già andato via: ogni pezzo esiste una volta sola. Gli altri ti aspettano nel catalogo.</p>' +
      '<a class="cel-go" href="catalogo.html">Torna al catalogo <em aria-hidden="true">→</em></a></div>';
    document.getElementById('crumbName').textContent = 'Non trovato';
    return;
  }

  var cat = MB.categorie[p.cat] || { nome: '' };
  document.title = p.nome + ' — Magic Bones';
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', p.nome + ' — ' + p.descrizione);
  document.getElementById('crumbName').textContent = p.nome;
  var crumbCat = document.getElementById('crumbCat');
  crumbCat.textContent = cat.nome || 'Il catalogo';
  crumbCat.href = 'catalogo.html?cat=' + encodeURIComponent(p.cat);

  /* ------------------------------------------------------------- galleria -- */
  var many = p.foto.length > 1;
  var slides = p.foto.map(function (f, i) {
    return '<figure class="cel-gallery__slide" role="group" aria-roledescription="foto" aria-label="' + (i + 1) + ' di ' + p.foto.length + '">' +
      '<img class="cel-gallery__bg" src="' + esc(f.src) + '" alt="" aria-hidden="true" width="' + f.w + '" height="' + f.h + '"' + (i ? ' loading="lazy"' : '') + ' decoding="async">' +
      '<img class="cel-gallery__img" src="' + esc(f.src) + '" alt="' + esc(f.alt) + '" width="' + f.w + '" height="' + f.h + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">' +
      '</figure>';
  }).join('');
  var thumbs = many ? '<div class="cel-gallery__thumbs" role="group" aria-label="Scegli la foto">' + p.foto.map(function (f, i) {
    return '<button class="cel-gallery__thumb" type="button" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '"' + (i ? '' : ' aria-current="true"') + '>' +
      '<span class="cel-arch"><img src="' + esc(f.src) + '" alt="" width="' + f.w + '" height="' + f.h + '" loading="lazy" decoding="async"></span></button>';
  }).join('') + '</div>' : '';
  var nav = many ? '<div class="cel-gallery__nav">' +
      '<button class="cel-gallery__arrow" type="button" data-dir="-1" aria-label="Foto precedente">‹</button>' +
      '<span class="cel-gallery__count" aria-live="polite"><b id="galNow">1</b> / ' + p.foto.length + '</span>' +
      '<button class="cel-gallery__arrow" type="button" data-dir="1" aria-label="Foto successiva">›</button></div>' : '';

  var gallery =
    '<div class="cel-piece__gallery">' +
      '<div class="cel-shrine cel-shrine--gallery">' +
        '<span class="cel-shrine__halo" aria-hidden="true"></span>' +
        '<span class="cel-shrine__door">' +
          '<span class="cel-arch cel-gallery">' +
            '<span class="cel-gallery__track" id="galTrack" tabindex="0" role="region" aria-roledescription="galleria" aria-label="Foto di ' + esc(p.nome) + (many ? ', scorri per vederle tutte' : '') + '">' + slides + '</span>' +
          '</span>' +
        '</span>' +
      '</div>' + nav + thumbs +
    '</div>';

  /* ---------------------------------------------------------------- testo -- */
  var info =
    '<div class="cel-piece__info">' +
      '<p class="cel-eyebrow">' + esc(cat.nome) + (p.mese ? ' · Pezzo del mese' : '') + '</p>' +
      '<h1 class="cel-piece__title">' + esc(p.nome) + '</h1>' +
      (p.venduto
        ? '<p class="cel-price cel-price--venduto"><span>Venduto</span><em>chiedimi se ne faccio uno simile</em></p>'
        : '<p class="cel-price"><span>' + (p.da ? 'da ' : '') + '€ ' + esc(MB.euro(p.prezzo)) + '</span><em>' + esc(p.unita) + '</em></p>') +
      (p.citazione ? '<blockquote class="cel-quote">«' + esc(p.citazione) + '»</blockquote>' : '') +
      (p.nota ? '<p class="cel-piece__nota">' + esc(p.nota) + '</p>' : '') +
      '<p class="cel-piece__desc cel-illum">' + esc(p.descrizione) + '</p>' +
      '<div class="cel-actions">' +
        (p.venduto ? '' :
        '<button class="btn js-add" type="button" data-id="' + esc(p.id) + '" data-nome="' + esc(p.nome) + '" data-prezzo="' + esc(p.prezzo) + '"' + (p.da ? ' data-da="1"' : '') + ' data-foto="' + esc(p.thumb || p.foto[0].src) + '">Aggiungi alla raccolta</button>') +
        '<a class="btn btn--ghost js-ask" href="#" data-nome="' + esc(p.nome) + '" data-prezzo="' + esc(p.prezzo) + '"' + (p.da ? ' data-da="1"' : '') + ' rel="noopener">Chiedi a Claudia</a>' +
      '</div>' +
      '<ul class="cel-piece__facts">' +
        '<li><span>Fatto a mano</span>Trovato nel bosco e lavorato da me, a mano.</li>' +
        '<li><span>Misure</span>Chiedimele su WhatsApp: ti rispondo io.</li>' +
        '<li><span>Spedizione</span>In tutta Italia, oppure di persona ai mercatini di Roma.</li>' +
      '</ul>' +
      '<p class="cel-piece__small">I prezzi sono indicativi: essendo pezzi unici, misura e lavorazione cambiano da uno all\'altro.</p>' +
    '</div>';

  root.innerHTML = gallery + info;
  root.classList.toggle('is-single', !many);

  /* ------------------------------------------------- comportamento galleria -- */
  var track = document.getElementById('galTrack');
  var now = document.getElementById('galNow');
  var thumbBtns = Array.prototype.slice.call(root.querySelectorAll('.cel-gallery__thumb'));
  var arrows = Array.prototype.slice.call(root.querySelectorAll('.cel-gallery__arrow'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cur = 0;

  function mark(i) {
    cur = i;
    if (now) now.textContent = String(i + 1);
    thumbBtns.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    arrows.forEach(function (a) {
      var d = +a.getAttribute('data-dir');
      a.disabled = (d < 0 && i === 0) || (d > 0 && i === p.foto.length - 1);
    });
  }
  function go(i) {
    i = Math.max(0, Math.min(p.foto.length - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: reduce.matches ? 'auto' : 'smooth' });
    mark(i);
  }
  if (many) {
    arrows.forEach(function (a) { a.addEventListener('click', function () { go(cur + (+a.getAttribute('data-dir'))); }); });
    thumbBtns.forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-i')); }); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    // con lo scorrimento a dito: la foto più visibile è quella corrente
    var st = 0;
    track.addEventListener('scroll', function () {
      clearTimeout(st);
      st = setTimeout(function () { mark(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))); }, 80);
    }, { passive: true });
    mark(0);
  }

  /* --------------------------------------------------- altri pezzi dal bosco -- */
  var more = document.getElementById('celMore');
  var list = document.getElementById('celMoreList');
  if (more && list && MB.doorHTML) {
    var altri = MB.pezzi.filter(function (x) { return x.id !== p.id && x.cat === p.cat; })
      .concat(MB.pezzi.filter(function (x) { return x.id !== p.id && x.cat !== p.cat; }))
      .slice(0, 4);
    list.innerHTML = altri.map(function (x, i) { return '<li class="cel-doors__item reveal">' + MB.doorHTML(x, i + 1) + '</li>'; }).join('');
    more.hidden = !altri.length;
  }
})();
