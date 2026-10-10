/* ==========================================================================
   MAGIC BONES · celtico — nodi, ogham e simboli generati dal codice
   Niente immagini: ogni intreccio è calcolato.
   · ring    — anello intrecciato: due nastri r = R ± a·sin(nθ) che si
               incrociano 2n volte, sopra/sotto alternati come nei nodi veri
   · ogham   — l'alfabeto delle pietre irlandesi inciso lungo un cerchio
   · band    — fascia intrecciata ripetibile (tile per background)
   · simboli — triquetra, triskele, spirale, albero della vita
   Si montano da soli su [data-knot] e su .knotband.
   ========================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var uid = 0;
  function f(n) { return Math.round(n * 100) / 100; }

  /* ------------------------------------------------------------ nastri -- */
  function strand(R, a, n, sign) {
    return function (t) {
      var r = R + sign * a * Math.sin(n * t);
      return [r * Math.cos(t), r * Math.sin(t)];
    };
  }
  function trace(fn, t0, t1, steps, close) {
    var d = '';
    for (var i = 0; i <= steps; i++) {
      var p = fn(t0 + (t1 - t0) * i / steps);
      d += (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]);
    }
    return close ? d + 'Z' : d;
  }
  // Un nastro = contorno scuro (fa il "buco" sotto l'incrocio) + corpo dorato
  // + filo centrale: l'effetto nastro doppio dei manoscritti.
  function ribbon(d, o) {
    return '<path d="' + d + '" class="k-halo" stroke-width="' + f(o.w + o.gap * 2) + '"/>' +
           '<path d="' + d + '" class="k-body" stroke="url(#' + o.grad + ')" stroke-width="' + o.w + '"/>' +
           (o.line ? '<path d="' + d + '" class="k-line" stroke-width="' + o.line + '"/>' : '');
  }
  function gradient(id) {
    return '<linearGradient id="' + id + '" x1="-100" y1="-100" x2="100" y2="100" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" style="stop-color:var(--k1,#F8E4AE)"/>' +
      '<stop offset=".45" style="stop-color:var(--k2,#EFB15C)"/>' +
      '<stop offset="1" style="stop-color:var(--k3,#EBC97F)"/></linearGradient>';
  }

  function ring(o) {
    o = Object.assign({ R: 72, a: 8, n: 9, w: 4.2, gap: 1.6, line: .8, frame: true, dots: true }, o || {});
    var id = 'kg' + (++uid);
    var opt = { w: o.w, gap: o.gap, line: o.line, grad: id };
    var A = strand(o.R, o.a, o.n, 1), B = strand(o.R, o.a, o.n, -1);
    var steps = Math.max(260, o.n * 56);

    // base: A poi B → B passa sopra a TUTTI gli incroci…
    var g = ribbon(trace(A, 0, TAU, steps, true), opt) + ribbon(trace(B, 0, TAU, steps, true), opt);
    // …poi A viene ridisegnato sopra agli incroci pari: sopra/sotto alternati.
    var half = (Math.PI / o.n) * .5;
    for (var k = 0; k < 2 * o.n; k += 2) {
      var tk = k * Math.PI / o.n;
      g += ribbon(trace(A, tk - half, tk + half, 22, false), opt);
    }

    var extra = '';
    if (o.frame) {
      var ro = o.R + o.a + o.w * 1.7, ri = o.R - o.a - o.w * 1.7;
      extra += '<circle r="' + f(ro) + '" class="k-frame"/><circle r="' + f(ri) + '" class="k-frame"/>';
      if (o.dots) {
        for (var m = 0; m < 2 * o.n; m++) {
          var t = (Math.PI / 2 + m * Math.PI) / o.n;
          extra += '<circle cx="' + f((ro + 3.2) * Math.cos(t)) + '" cy="' + f((ro + 3.2) * Math.sin(t)) + '" r="1.05" class="k-dot"/>';
        }
      }
    }
    return '<svg class="knot-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' +
      '<defs>' + gradient(id) + '</defs>' +
      '<g class="k-strands" fill="none" stroke-linejoin="round">' + g + '</g>' + extra + '</svg>';
  }

  /* -------------------------------------------------------------- ogham -- */
  // aicme: B = tacche da un lato, H = dall'altro, M = diagonali, A = vocali corte
  var OG = {
    B: ['B', 1], L: ['B', 2], F: ['B', 3], V: ['B', 3], S: ['B', 4], N: ['B', 5],
    H: ['H', 1], D: ['H', 2], T: ['H', 3], C: ['H', 4], K: ['H', 4], Q: ['H', 5],
    M: ['M', 1], G: ['M', 2], Z: ['M', 4], R: ['M', 5],
    A: ['A', 1], O: ['A', 2], U: ['A', 3], E: ['A', 4], I: ['A', 5]
  };
  function ogham(text, o) {
    o = Object.assign({ R: 93, L: 5.2 }, o || {});
    var seq = [], pos = 0;
    String(text).toUpperCase().split('').forEach(function (ch) {
      if (OG[ch]) {
        seq.push({ g: OG[ch][0], n: OG[ch][1], at: pos });
        pos += OG[ch][1] - 1 + 1.7;
      } else if (ch === '·') {
        seq.push({ g: '·', at: pos + .8 }); pos += 3.2;
      } else if (ch === ' ') {
        pos += 1.6;
      }
    });
    var total = pos + 1.2;
    var du = TAU / total;               // angolo per unità
    var R = o.R, L = o.L, d = '';
    function radial(t, r0, r1, skew) {
      var t0 = t - (skew || 0), t1 = t + (skew || 0);
      d += 'M' + f(r0 * Math.cos(t0)) + ' ' + f(r0 * Math.sin(t0)) +
           'L' + f(r1 * Math.cos(t1)) + ' ' + f(r1 * Math.sin(t1));
    }
    seq.forEach(function (s) {
      var base = -Math.PI / 2 + s.at * du;
      if (s.g === '·') {                // separatore: piccolo rombo sul fusto
        var c = base, r = R;
        d += 'M' + f((r - 2.4) * Math.cos(c)) + ' ' + f((r - 2.4) * Math.sin(c)) +
             'L' + f(r * Math.cos(c + du * .5)) + ' ' + f(r * Math.sin(c + du * .5)) +
             'L' + f((r + 2.4) * Math.cos(c)) + ' ' + f((r + 2.4) * Math.sin(c)) +
             'L' + f(r * Math.cos(c - du * .5)) + ' ' + f(r * Math.sin(c - du * .5)) + 'Z';
        return;
      }
      for (var i = 0; i < s.n; i++) {
        var t = base + i * du;
        if (s.g === 'B') radial(t, R, R + L);
        else if (s.g === 'H') radial(t, R, R - L);
        else if (s.g === 'M') radial(t, R - L, R + L, du * .32);
        else radial(t, R - L * .45, R + L * .45);
      }
    });
    return '<svg class="ogham-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' +
      '<circle r="' + R + '" class="o-stem"/><path d="' + d + '" class="o-marks"/></svg>';
  }

  /* ------------------------------------------------------------ simboli -- */
  function sym(paths) {
    return '<svg class="sym-svg" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
      paths.map(function (d) { return '<path d="' + d + '" pathLength="1"/>'; }).join('') + '</svg>';
  }
  function dir(a, r) { return [r * Math.cos(a), r * Math.sin(a)]; }

  // triquetra: tre cerchi che passano per il centro, le tre "vesciche"
  // sono le loro intersezioni a due a due; più il cerchio che le lega.
  function triquetra() {
    var r = 30, c = [0, 1, 2].map(function (k) { return dir(-Math.PI / 2 + k * TAU / 3, r); });
    var out = [];
    for (var k = 0; k < 3; k++) {
      var a = c[k], b = c[(k + 1) % 3];
      var p = [a[0] + b[0], a[1] + b[1]];
      out.push('M0 0A' + r + ' ' + r + ' 0 0 1 ' + f(p[0]) + ' ' + f(p[1]) + 'A' + r + ' ' + r + ' 0 0 1 0 0');
    }
    out.push('M' + f(r * .62) + ' 0A' + f(r * .62) + ' ' + f(r * .62) + ' 0 1 1 ' + f(-r * .62) + ' 0A' + f(r * .62) + ' ' + f(r * .62) + ' 0 1 1 ' + f(r * .62) + ' 0');
    return sym(out);
  }
  // triskele: tre spirali che partono dal centro e si avvolgono su se stesse
  function triskele() {
    var out = [];
    for (var k = 0; k < 3; k++) {
      var phi = -Math.PI / 2 + k * TAU / 3, cx = 21 * Math.cos(phi), cy = 21 * Math.sin(phi);
      var d = 'M0 0';
      for (var i = 0; i <= 60; i++) {
        var s = i / 60, ang = phi + Math.PI + s * TAU * 1.6, rr = 21 * (1 - s) + 2.2 * s;
        d += 'L' + f(cx + rr * Math.cos(ang)) + ' ' + f(cy + rr * Math.sin(ang));
      }
      out.push(d);
    }
    out.push('M44 0A44 44 0 1 1 -44 0A44 44 0 1 1 44 0');
    return sym(out);
  }
  function spiral() {
    var d = 'M0 0';
    for (var i = 1; i <= 120; i++) {
      var s = i / 120, ang = s * TAU * 3.1, r = s * 40;
      d += 'L' + f(r * Math.cos(ang)) + ' ' + f(r * Math.sin(ang));
    }
    return sym([d]);
  }
  // albero della vita: rami e radici speculari chiusi nel cerchio
  function tree() {
    var out = ['M0 34L0 -34', 'M42 0A42 42 0 1 1 -42 0A42 42 0 1 1 42 0'];
    [[-6, 16, 26], [-15, 18, 14], [-24, 12, 8]].forEach(function (b) {
      var y = b[0], dx = b[1], h = b[2];
      out.push('M0 ' + y + 'C' + dx * .4 + ' ' + (y - 4) + ' ' + dx + ' ' + (y - h * .4) + ' ' + f(dx * 1.45) + ' ' + f(y - h));
      out.push('M0 ' + y + 'C' + (-dx * .4) + ' ' + (y - 4) + ' ' + (-dx) + ' ' + (y - h * .4) + ' ' + f(-dx * 1.45) + ' ' + f(y - h));
      out.push('M0 ' + (-y) + 'C' + dx * .4 + ' ' + (-y + 4) + ' ' + dx + ' ' + (-y + h * .4) + ' ' + f(dx * 1.45) + ' ' + f(-y + h));
      out.push('M0 ' + (-y) + 'C' + (-dx * .4) + ' ' + (-y + 4) + ' ' + (-dx) + ' ' + (-y + h * .4) + ' ' + f(-dx * 1.45) + ' ' + f(-y + h));
    });
    return sym(out);
  }

  /* --------------------------------------------------- fascia ripetibile -- */
  // Un periodo con due incroci (uno sopra, uno sotto): ripetuto in x il
  // sopra/sotto continua giusto. Colori fissi: è un'immagine di sfondo.
  function bandTile(o) {
    o = Object.assign({ P: 56, H: 26, a: 7.5, w: 3.6, gap: 1.5, gold: '#E2B866', halo: '#13120A', line: '#13120A' }, o || {});
    var cy = o.H / 2;
    function S(sign) { return function (x) { return [x, cy + sign * o.a * Math.sin(TAU * x / o.P)]; }; }
    function tr(fn, x0, x1, n) { var d = ''; for (var i = 0; i <= n; i++) { var p = fn(x0 + (x1 - x0) * i / n); d += (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); } return d; }
    function rib(d) {
      return '<path d="' + d + '" stroke="' + o.halo + '" stroke-width="' + (o.w + o.gap * 2) + '"/>' +
             '<path d="' + d + '" stroke="' + o.gold + '" stroke-width="' + o.w + '"/>' +
             '<path d="' + d + '" stroke="' + o.line + '" stroke-width=".7"/>';
    }
    var A = S(1), B = S(-1), dl = o.P * .16;
    var s = rib(tr(A, -6, o.P + 6, 40)) + rib(tr(B, -6, o.P + 6, 40)) +
            rib(tr(A, -dl, dl, 8)) + rib(tr(A, o.P - dl, o.P + dl, 8));
    var body = '<g fill="none">' + s + '</g>' +
      '<path d="M0 .6H' + o.P + 'M0 ' + (o.H - .6) + 'H' + o.P + '" stroke="' + o.gold + '" stroke-width=".8" opacity=".6"/>';
    // in verticale (colonne): stesso disegno ruotato di 90°, si ripete in y
    var svg = o.vertical
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="' + o.H + '" height="' + o.P + '" viewBox="0 0 ' + o.H + ' ' + o.P + '"><g transform="translate(' + o.H + ' 0) rotate(90)">' + body + '</g></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="' + o.P + '" height="' + o.H + '" viewBox="0 0 ' + o.P + ' ' + o.H + '">' + body + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  /* ------------------------------------------------------------ montaggio -- */
  var api = { ring: ring, ogham: ogham, triquetra: triquetra, triskele: triskele, spiral: spiral, tree: tree, bandTile: bandTile };
  window.MB = window.MB || {};
  window.MB.knots = api;

  function num(el, k, def) { var v = parseFloat(el.getAttribute('data-' + k)); return isNaN(v) ? def : v; }
  document.querySelectorAll('[data-knot]').forEach(function (el) {
    var type = el.getAttribute('data-knot');
    if (type === 'ring') {
      el.innerHTML = ring({ n: num(el, 'lobes', 9), R: num(el, 'r', 72), a: num(el, 'a', 8), w: num(el, 'w', 4.2), frame: el.getAttribute('data-frame') !== 'no' });
    } else if (type === 'ogham') {
      el.innerHTML = ogham(el.getAttribute('data-text') || (window.MB.ogham || 'MAGIC BONES'), { R: num(el, 'r', 93) });
    } else if (api[type]) {
      el.innerHTML = api[type]();
    }
  });
  var tile = null, tileV = null;
  document.querySelectorAll('.knotband').forEach(function (el) {
    if (el.classList.contains('knotband--v')) { tileV = tileV || bandTile({ vertical: true }); el.style.backgroundImage = tileV; }
    else { tile = tile || bandTile(); el.style.backgroundImage = tile; }
  });
})();
