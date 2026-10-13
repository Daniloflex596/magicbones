/* ==========================================================================
   MAGIC BONES — la vetrina "sentiero" in stile celtico
   · il tralcio: due nastri intrecciati (sopra/sotto veri) con foglie, che
     crescono con lo scroll fino alla chiave di volta della porta di pietra.
     Manipolazione diretta: niente easing né ritardo, si torna indietro uguale.
   · i sigilli delle tappe si disegnano e si accendono quando la punta
     luminosa del tralcio li raggiunge
   · il medaglione del pezzo del mese ruota con lo scroll
   · [data-lantern]: la luce segue il puntatore (solo mouse)
   Tutto gira solo con la sezione in vista; con prefers-reduced-motion il
   tralcio è già intero e i sigilli già accesi. Nodi e ogham: js/knots.js.
   ========================================================================== */
(function () {
  'use strict';

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function f(n) { return Math.round(n * 10) / 10; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* --------------------------------- arrivo da un'altra pagina con #sezione -- */
  // Dal catalogo "I pezzi" porta a index.html#vetrina. Ma appena la home parte
  // il film la allunga di parecchi schermi e il browser perde l'ancora: a
  // pagina pronta si torna sulla sezione giusta.
  var hashTarget = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (hashTarget && hashTarget.id !== 'top' && hashTarget.id !== 'cammino') {
    var userMoved = false, ro = null;
    var goHash = function () { if (!userMoved) hashTarget.scrollIntoView({ behavior: 'instant', block: 'start' }); };
    var stop = function () { userMoved = true; if (ro) ro.disconnect(); };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, stop, { passive: true, once: true });
    });
    // finché la pagina si assesta (film, font, immagini, barre del telefono)
    // si resta sulla sezione; basta un tocco o una rotella per lasciarla
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () { requestAnimationFrame(goHash); });
      ro.observe(document.documentElement);
      setTimeout(function () { if (ro) ro.disconnect(); }, 8000);
    }
    window.addEventListener('load', function () { requestAnimationFrame(goHash); setTimeout(goHash, 450); });
  }

  /* ------------------------------------------------------------ lanterna -- */
  if (finePointer) {
    document.querySelectorAll('[data-lantern]').forEach(function (el) {
      var raf = 0, x = 0, y = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        x = ((e.clientX - r.left) / r.width) * 100;
        y = ((e.clientY - r.top) / r.height) * 100;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          el.style.setProperty('--lx', x.toFixed(1) + '%');
          el.style.setProperty('--ly', y.toFixed(1) + '%');
        });
      });
    });
  }

  /* ------------------------------------------------------------- casetta -- */
  // Nella pagina c'è l'immagine (assets/img/casetta.svg), già animata da sé.
  // Quando la porta di casa si avvicina, il disegno viene inserito "vivo"
  // nel documento: così la porta si apre al passaggio del mouse e le luci si
  // accendono quando arriva il tralcio. Se il caricamento fallisce resta
  // l'immagine, e non manca niente.
  (function () {
    var holder = document.querySelector('.cel-cottage');
    var img = holder && holder.querySelector('img');
    if (!img || !window.fetch || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      fetch(img.getAttribute('src'))
        .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(r.status)); })
        .then(function (txt) {
          var box = document.createElement('div');
          box.innerHTML = txt;
          var svg = box.querySelector('svg');
          if (svg) img.replaceWith(svg);
        })
        .catch(function () {});
    }, { rootMargin: '600px 0px' });
    io.observe(holder);
  })();

  var path = document.getElementById('celPath');
  var vine = document.getElementById('celVine');
  if (!path || !vine) return;
  var section = path.closest('.cel');
  var stops = Array.prototype.slice.call(path.querySelectorAll('.cel-stop'));
  var dolmen = section && section.querySelector('.cel-dolmen');
  var keystone = dolmen && dolmen.querySelector('.cel-dolmen__keystone');
  var feature = document.getElementById('feature');
  var ring = feature && feature.querySelector('.cel-medallion__ring');
  var ogh = feature && feature.querySelector('.cel-medallion__ogham');

  /* -------------------------------------------------------------- tralcio -- */
  var H = 0, tenda = null, dentro = null, tip = null, marks = [], ultimoY = -1;
  var P = 170, A = 13, W = 80, CX = 40;
  function x(sign, y) { return CX + sign * A * Math.sin(Math.PI * 2 * y / P); }
  function trace(sign, y0, y1) {
    var d = '', n = Math.max(2, Math.ceil((y1 - y0) / 6));
    for (var i = 0; i <= n; i++) { var y = y0 + (y1 - y0) * i / n; d += (i ? 'L' : 'M') + f(x(sign, y)) + ' ' + f(y); }
    return d;
  }
  function rib(d) {
    return '<path d="' + d + '" class="v-halo"/><path d="' + d + '" class="v-body"/><path d="' + d + '" class="v-line"/>';
  }

  function build() {
    var top = path.getBoundingClientRect().top;
    // il tralcio scende fino alla chiave di volta della porta, se c'è
    H = keystone ? keystone.getBoundingClientRect().top + keystone.offsetHeight / 2 - top : path.offsetHeight;
    H = Math.max(200, Math.round(H));
    vine.style.bottom = 'auto';
    vine.style.height = H + 'px';

    var g = rib(trace(1, 0, H)) + rib(trace(-1, 0, H));
    for (var k = 0; k * P / 2 <= H; k += 2) {          // sopra/sotto alternati
      var yk = k * P / 2;
      g += rib(trace(1, Math.max(0, yk - P * .1), Math.min(H, yk + P * .1)));
    }
    var leaves = '';
    for (var y = P * .25, i = 0; y < H - 20; y += P * .5, i++) {
      var side = i % 2 ? 1 : -1, bx = x(side, y), lx = bx + side * 22, ly = y - 10;
      leaves += 'M' + f(bx) + ' ' + f(y) + 'Q' + f(bx + side * 14) + ' ' + f(y - 18) + ' ' + f(lx) + ' ' + f(ly) +
                'Q' + f(bx + side * 8) + ' ' + f(y + 2) + ' ' + f(bx) + ' ' + f(y) + 'Z';
    }
    /* Il tralcio "cresce" senza ridisegnarsi: è disegnato intero una volta,
       dentro una tenda che scorre (due spostamenti opposti, lavoro della
       scheda grafica). Prima a ogni fotogramma si ritagliava il disegno:
       un SVG alto migliaia di pixel ridisegnato mentre si scorre. */
    var svg = function (cls, corpo) {
      return '<svg class="' + cls + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true" focusable="false">' + corpo + '</svg>';
    };
    vine.innerHTML =
      svg('v-sotto', '<g class="v-ghost">' + rib(trace(1, 0, H)) + rib(trace(-1, 0, H)) + '</g>') +
      '<div class="v-tenda" style="height:' + H + 'px"><div class="v-dentro">' +
        svg('v-vivo', '<defs><linearGradient id="celVineG" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0" stop-color="#BCD66E"/><stop offset=".5" stop-color="#EBC97F"/><stop offset="1" stop-color="#EFB15C"/></linearGradient></defs>' +
          '<g>' + g + '</g><path class="v-leaf" d="' + leaves + '"/>') +
      '</div></div>' +
      '<span class="v-tip" style="left:' + (CX - 5) + 'px"></span>';
    tenda = vine.querySelector('.v-tenda');
    dentro = vine.querySelector('.v-dentro');
    tip = vine.querySelector('.v-tip');
    ultimoY = -1;

    // dove stanno i sigilli lungo il tralcio (misurato una volta, non a ogni frame)
    marks = stops.map(function (s) {
      var sg = s.querySelector('.cel-stop__sigil');
      var r = sg.getBoundingClientRect();
      return { el: s, y: r.top + r.height / 2 - top };
    });
    if (keystone) marks.push({ el: dolmen, y: H - 2 });
  }

  function set(p) {
    if (!tenda) return;
    var y = Math.round(H * p);
    if (y === ultimoY) return;
    ultimoY = y;
    tenda.style.transform = 'translate3d(0,' + (y - H) + 'px,0)';
    dentro.style.transform = 'translate3d(0,' + (H - y) + 'px,0)';
    tip.style.transform = 'translate3d(0,' + y + 'px,0)';
    tip.style.opacity = p > .002 && p < .998 ? 1 : 0;
    for (var i = 0; i < marks.length; i++) marks[i].el.classList.toggle('is-lit', y >= marks[i].y - 6);
  }

  /* --------------------------------------------------- un solo scheduler -- */
  var raf = 0, onScreen = false;
  function update() {
    raf = 0;
    if (!onScreen || mqReduce.matches) return;
    var vh = window.innerHeight;
    var r = path.getBoundingClientRect();
    set(clamp((vh * .62 - r.top) / H));
    if (ring && feature) {
      var fr = feature.getBoundingClientRect();
      var q = (vh - fr.top) / (vh + fr.height);          // 0 → entra, 1 → esce
      ring.style.transform = 'rotate(' + f(q * 70 - 35) + 'deg)';
      ogh.style.transform = 'rotate(' + f(35 - q * 70) + 'deg)';
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(update); }
  function still() {                                     // stato fermo: tutto visibile
    set(1);
    if (ring) ring.style.transform = '';
    if (ogh) ogh.style.transform = '';
  }
  function refresh() { build(); if (mqReduce.matches) still(); else { set(0); kick(); } }

  build();
  if (mqReduce.matches) still(); else set(0);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; kick(); }, { rootMargin: '10% 0px' }).observe(section || path);
  } else { onScreen = true; }
  window.addEventListener('scroll', kick, { passive: true });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(refresh, 200); });
  // le foto lazy e i font cambiano le altezze: si rimisura il tralcio
  if ('ResizeObserver' in window) {
    var lastH = 0;
    new ResizeObserver(function () {
      var h = section ? section.offsetHeight : path.offsetHeight;
      if (Math.abs(h - lastH) < 4) return;
      lastH = h; refresh();
    }).observe(section || path);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  mqReduce.addEventListener && mqReduce.addEventListener('change', function (e) { e.matches ? still() : refresh(); });
})();
