/* ==========================================================================
   MAGIC BONES — catalogo celtico
   Costruisce le porte dai dati di js/pezzi.js: una porta ad arco per pezzo,
   solo foto, nome e prezzo. Cliccando si entra nella pagina del pezzo.
   Filtri a pietre runiche: la scelta resta nell'URL (?cat=teschi), così un
   filtro si può mandare a qualcuno.
   Gira PRIMA di ui.js / knots.js / cart.js: le porte ci sono già quando quei
   moduli cercano .reveal e [data-knot].
   ========================================================================== */
(function () {
  'use strict';

  var MB = window.MB;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // una porta: la usa anche js/pezzo.js per "Altri pezzi dal bosco"
  MB.doorHTML = function (p, i) {
    var f = p.foto[0];
    return '<a class="cel-door" href="pezzo.html?id=' + encodeURIComponent(p.id) + '" data-lantern>' +
      '<span class="cel-door__frame">' +
        '<span class="cel-arch cel-door__arch"><img src="' + esc(f.porta || f.src) + '"' +
          // la porta si vede ~175 px: basta la copertina a 600 px, la 900 solo se lo schermo la chiede
          (f.porta ? ' srcset="' + esc(f.porta) + ' 600w, ' + esc(f.src) + ' ' + f.w + 'w" sizes="(max-width:760px) 46vw, 240px"' : '') +
          ' alt="' + esc(p.nome + ': ' + f.alt) + '" width="' + f.w + '" height="' + f.h + '" loading="lazy" decoding="async"></span>' +
        (p.mese ? '<span class="cel-door__flag">Pezzo del mese</span>' : '') +
        (p.foto.length > 1 ? '<span class="cel-door__more" aria-hidden="true">' + p.foto.length + ' foto</span>' : '') +
      '</span>' +
      '<span class="cel-door__name">' + esc(p.nome) + '</span>' +
      '<span class="cel-door__price">' + (p.da ? 'da ' : '') + '€ ' + esc(MB.euro(p.prezzo)) + (p.unita === 'a pezzo' ? ' <em>a pezzo</em>' : '') + '</span>' +
    '</a>';
  };

  var root = document.getElementById('celCatalog');
  if (!root || !MB.pezzi) return;           // (su pezzo.html serve solo MB.doorHTML)

  /* ------------------------------------------------------------ costruzione -- */
  var cats = MB.categorie, html = '', n = 0, counts = { tutti: 0 };
  Object.keys(cats).forEach(function (key) {
    var list = MB.pezzi.filter(function (p) { return p.cat === key; });
    counts[key] = list.length; counts.tutti += list.length;
    if (!list.length) return;
    html += '<section class="cel-group" data-group="' + key + '" aria-labelledby="g-' + key + '">' +
      '<h2 class="cel-group__title" id="g-' + key + '"><span class="cel-group__num">' + cats[key].num + '</span>' +
      '<span class="cel-group__name">' + esc(cats[key].nome) + '</span></h2>' +
      '<ul class="cel-doors">' +
      list.map(function (p) {
        return '<li class="cel-doors__item reveal" data-cat="' + key + '" id="' + esc(p.id) + '">' + MB.doorHTML(p, n++) + '</li>';
      }).join('') +
      '</ul></section>';
  });
  root.innerHTML = html;

  /* ------------------------------------------------- filtri dai dati -- */
  // Una pietra per ogni categoria con pezzi in vendita, nell'ordine dei dati:
  // una categoria nuova creata da Claudia nell'app compare da sola.
  var RUNE = [
    'data-knot="triskele"', 'data-knot="spiral"', 'data-knot="tree"',
    'data-knot="ring" data-lobes="4" data-r="44" data-a="22" data-w="6" data-frame="no"',
    'data-knot="ring" data-lobes="6" data-r="44" data-a="18" data-w="6" data-frame="no"',
    'data-knot="triquetra"'
  ];
  var barra = document.getElementById('filters');
  if (barra) {
    Object.keys(cats).filter(function (k) { return counts[k] > 0; }).forEach(function (key, i) {
      barra.insertAdjacentHTML('beforeend',
        '<button class="cel-filter" type="button" data-cat="' + esc(key) + '" aria-pressed="false">' +
          '<span class="cel-filter__rune" ' + RUNE[i % RUNE.length] + ' aria-hidden="true"></span>' +
          '<span>' + esc(cats[key].nome) + '</span> <span class="cel-filter__n" data-count="' + esc(key) + '"></span>' +
        '</button>');
    });
  }

  document.querySelectorAll('[data-count]').forEach(function (el) {
    el.textContent = counts[el.getAttribute('data-count')] || 0;
  });

  /* --------------------------------------------------------------- filtri -- */
  var bar = document.getElementById('filters');
  var empty = document.getElementById('filtersEmpty');
  var buttons = bar ? Array.prototype.slice.call(bar.querySelectorAll('.cel-filter')) : [];
  var items = Array.prototype.slice.call(root.querySelectorAll('.cel-doors__item'));
  var groups = Array.prototype.slice.call(root.querySelectorAll('.cel-group'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function apply(cat, push) {
    var visibili = 0;
    items.forEach(function (it) {
      var on = cat === 'tutti' || it.getAttribute('data-cat') === cat;
      it.hidden = !on;
      if (on) visibili++;
    });
    groups.forEach(function (g) { g.hidden = !(cat === 'tutti' || g.getAttribute('data-group') === cat); });
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-cat') === cat;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      // sul telefono la fila di pietre scorre: porta al centro quella accesa
      if (on && bar.scrollWidth > bar.clientWidth) {
        var dx = b.getBoundingClientRect().left - bar.getBoundingClientRect().left;
        bar.scrollTo({ left: bar.scrollLeft + dx - (bar.clientWidth - b.offsetWidth) / 2, behavior: push && !reduce.matches ? 'smooth' : 'auto' });
      }
    });
    if (empty) empty.hidden = visibili > 0;
    if (push) {
      var url = new URL(window.location.href);
      if (cat === 'tutti') url.searchParams.delete('cat'); else url.searchParams.set('cat', cat);
      history.replaceState(null, '', url);
      // le porte rimaste ricompaiono una dopo l'altra, come evocate
      if (!reduce.matches) {
        var i = 0;
        items.forEach(function (it) {
          if (it.hidden) return;
          it.classList.remove('is-summoned'); void it.offsetWidth;
          it.style.setProperty('--summon', Math.min(i++, 8) * 55 + 'ms');
          it.classList.add('is-summoned');
        });
      }
    }
  }
  buttons.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-cat'), true); }); });
  var wanted = new URL(window.location.href).searchParams.get('cat');
  var valid = buttons.some(function (b) { return b.getAttribute('data-cat') === wanted; });
  apply(valid ? wanted : 'tutti', false);
})();
