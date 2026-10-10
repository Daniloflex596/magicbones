/* ==========================================================================
   MAGIC BONES — IL CAMMINO
   Una scena unica da 10s scrubbata dallo scroll: si cammina nel bosco fino
   alla casa di Claudia, e lungo la strada la sua storia compare a post-it.

   Fluidità (dal livello A di immersive-web-engine):
   - damping frame-rate-independent 1-exp(-λ·dt), dt clampato
   - scheduler event-driven: si ferma a convergenza, in tab nascosta, offscreen
   - geometria cacheata: nessun getBoundingClientRect nel loop
   Il film NON è un video: è una sequenza di immagini disegnata su una tela.
   Su iPhone (Safari e Chrome, stesso motore) un video "saltato" dallo scroll
   mostrava solo 3 immagini (provato su iPhone 17 Pro Max): le immagini vanno
   uguali su ogni browser, anche col risparmio energetico, e il film si muove
   dopo le prime invece che dopo l'intero file (vedi "la sequenza").
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.MB;
  if (!CFG) return;

  var track   = document.getElementById('pathTrack');
  var stage   = document.getElementById('pathStage');
  var film    = document.getElementById('pathFilm');
  var intro   = document.getElementById('pathIntro');
  var cue     = document.getElementById('pathCue');
  var notesEl = document.getElementById('pathNotes');
  var arrival = document.getElementById('pathArrival');
  var landing = document.getElementById('pathLanding');
  var fallback= document.getElementById('pathFallback');
  if (!track || !stage || !film) return;

  /* ------------------------------------------------------ capability -- */
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var coarse   = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var narrow   = window.matchMedia('(max-width: 780px)').matches;
  var onPhone  = coarse || narrow;
  var conn     = navigator.connection || {};
  var lowMem   = (navigator.deviceMemory || 8) <= 2;

  // il telefono ha la sua sequenza verticale 9:16: mai un ritaglio del 16:9
  var SEQ = CFG.film && (onPhone ? CFG.film.telefono : CFG.film.computer);
  var N = SEQ ? SEQ.n : 0;

  function filmAllowed() {
    if (!CFG.flags.pathFilm) return false;
    if (mqReduce.matches) return false;
    if (conn.saveData) return false;
    if (lowMem) return false;
    if (!SEQ || N < 2) return false;
    return true;
  }

  /* Senza film: una sola schermata + la storia in versione leggibile sotto. */
  if (!filmAllowed()) {
    document.documentElement.classList.add('no-film');
    track.style.height = '100svh';
    if (cue) cue.hidden = true;
    if (fallback) fallback.hidden = false;   // la storia resta leggibile
    return;
  }
  document.documentElement.classList.add('has-film');
  if (fallback) fallback.hidden = true;

  /* ---------------------------------------------------------- stato -- */
  var progress = 0, shown = 0;
  var geom = { top: 0, run: 1 };
  var running = false, visible = true, lastT = 0;
  var notes = [];
  var flies = null;

  /* ------------------------------------------------------- post-it -- */
  /* Ogni tappa è una SCENA.
     · Su computer: due sole foto, una a sinistra e una a destra — nient'altro,
       niente scritte sopra — e il racconto scritto in mezzo, centrato, come
       un titolo sul bosco. Composizione simmetrica, non sparsa.
     · Su telefono: le stesse cose diventano un unico foglio di carta, con la
       foto sopra e il testo sotto (il CSS ricompone, il markup è uno solo). */
  // hash deterministico: nessun Math.random, layout riproducibile
  function pseudo(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }

  function foto(cls, src, alt) {
    var f = document.createElement('figure');
    f.className = cls;
    f.innerHTML = '<img alt="" loading="lazy" decoding="async">';
    var im = f.querySelector('img');
    im.src = src; im.alt = alt || '';
    return f;
  }

  (CFG.storia || []).forEach(function (s, i) {
    var beat = document.createElement('div');
    beat.className = 'beat';

    // il "card" esiste come contenitore solo su telefono (desktop: display:contents)
    var card = document.createElement('div');
    card.className = 'beat__card';
    if (s.foto) card.appendChild(foto('beat__ph beat__ph--1', s.foto, s.alt));

    var txt = document.createElement('div');
    txt.className = 'beat__text';
    txt.innerHTML = '<p class="beat__eyebrow"></p><h2 class="beat__title"></h2><p class="beat__body"></p>' +
                    (s.sign ? '<p class="beat__sign"></p>' : '');
    txt.querySelector('.beat__eyebrow').textContent = s.eyebrow || '';
    txt.querySelector('.beat__title').textContent   = s.title || '';
    txt.querySelector('.beat__body').textContent    = s.text || '';
    if (s.sign) txt.querySelector('.beat__sign').textContent = s.sign;
    card.appendChild(txt);
    beat.appendChild(card);

    // la seconda foto vive solo sullo schermo largo
    var ex = (s.extra || [])[0];
    if (ex) beat.appendChild(foto('beat__ph beat__ph--2', ex.foto, ex.alt));

    /* Le due foto restano una a sinistra e una a destra — l'impianto resta
       ordinato — ma NON nella stessa identica posizione a ogni tappa: altezza,
       misura, rotazione e rientro cambiano un po'. I valori vengono da un hash
       deterministico (mai Math.random), così il risultato è sempre lo stesso
       build dopo build e si può ritoccare a ragion veduta. */
    var q = [pseudo(i * 3 + 1), pseudo(i * 5 + 2), pseudo(i * 7 + 3),
             pseudo(i * 11 + 4), pseudo(i * 13 + 5), pseudo(i * 17 + 6)];
    beat.style.setProperty('--y1', (-16 + q[0] * 32).toFixed(1) + '%');   // altezza sx
    beat.style.setProperty('--y2', (-16 + q[1] * 32).toFixed(1) + '%');   // altezza dx
    // moltiplicatori PURI: in calc() una lunghezza si moltiplica per un numero,
    // non per una percentuale (con la percentuale la regola è invalida e la
    // foto tornerebbe alla sua dimensione naturale)
    beat.style.setProperty('--w1', (0.86 + q[2] * 0.26).toFixed(3));      // misura sx
    beat.style.setProperty('--w2', (0.86 + q[3] * 0.26).toFixed(3));      // misura dx
    beat.style.setProperty('--r1', (-4.4 + q[4] * 2.6).toFixed(2) + 'deg');
    beat.style.setProperty('--r2', (1.8 + q[5] * 2.6).toFixed(2) + 'deg');
    beat.style.setProperty('--x1', (q[4] * 3.4).toFixed(1) + 'vw');       // rientro sx
    beat.style.setProperty('--x2', (q[5] * 3.4).toFixed(1) + 'vw');       // rientro dx

    notesEl.appendChild(beat);
    notes.push({ el: beat, at: s.at, vis: -1, i: i });
  });

  // Decodifica le foto delle tappe in anticipo, a pagina tranquilla: senza
  // questo, la PRIMA comparsa di ogni tappa paga la decodifica (misurato
  // come picco di centinaia di ms alla prima passata).
  function decodificaFoto() {
    notesEl.querySelectorAll('img').forEach(function (img) {
      if (img.decode) img.decode().catch(function () {});
    });
  }
  if ('requestIdleCallback' in window) requestIdleCallback(decodificaFoto, { timeout: 3000 });
  else setTimeout(decodificaFoto, 1200);

  /* -------------------------------------------------------- geometria --
     VIEWPORT STABILE (immersive-web-engine §3, "il fix più importante per la
     fluidità reale su telefono"): su Chrome/Safari mobile la barra indirizzi
     collassa al primo scroll e `innerHeight` cambia di colpo di ~60px. Se la
     corsa del film è calcolata su quella, la mappatura scroll→tempo salta
     proprio mentre stai entrando. Un probe alto `100vh` misura invece
     l'altezza "grande", che durante lo scroll non cambia mai. */
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;pointer-events:none;visibility:hidden';
  document.body.appendChild(probe);
  function vpH() { return probe.offsetHeight || window.innerHeight; }

  function measure() {
    var r = track.getBoundingClientRect();
    geom.top = r.top + window.scrollY;
    geom.run = Math.max(1, track.offsetHeight - vpH());
  }
  function readScroll() {
    var p = (window.scrollY - geom.top) / geom.run;
    progress = p < 0 ? 0 : (p > 1 ? 1 : p);
  }

  /* ------------------------------------------------------ la sequenza --
     Si carica a PASSATE: la prima e l'ultima immagine, poi una ogni 16, ogni
     8, 4, 2, tutte. Con le prime 6 il film già si muove, e si fa sempre più
     fine mentre arriva il resto. Fra le due immagini già arrivate più vicine
     alla posizione c'è una dissolvenza proporzionale: anche con le immagini
     ancora rade il movimento resta continuo, mai uno scatto.
     La dissolvenza però vale solo IN MOVIMENTO: a metà fra due immagini il
     bosco si sdoppia (visto: tronchi col doppio contorno), cosa che scorrendo
     si legge come "mosso" ma da fermi no. Rallentando, l'immagine si posa
     dolcemente su quella pura più vicina (vedi `nitido` nel loop).
     La tela ha la misura delle immagini; ad adattarla allo schermo ci pensa
     il CSS (object-fit: cover), come faceva col video. */
  var tela = document.createElement('canvas');
  tela.setAttribute('aria-hidden', 'true');
  var ctx = tela.getContext('2d', { alpha: false });
  film.appendChild(tela);

  var quadri = new Array(N);               // le immagini pronte (scaricate e decodificate)
  var acceso = false, spento = false, disegnato = -1;
  var nitido = 1;                          // 1 = da fermi (immagine pura), 0 = in corsa (dissolvenza piena)
  var ordine = [];
  (function () {
    var visto = {};
    function metti(i) { if (i >= 0 && i < N && !visto[i]) { visto[i] = 1; ordine.push(i); } }
    metti(0); metti(N - 1);
    [16, 8, 4, 2, 1].forEach(function (p) { for (var i = 0; i < N; i += p) metti(i); });
  })();
  function nome(i) { return SEQ.cartella + ('00' + i).slice(-3) + '.webp?v=' + (CFG.film.versione || 1); }

  var PARALLELE = 4, prossimo = 0;
  function caricaUna() {
    if (spento || prossimo >= ordine.length) return;
    var i = ordine[prossimo++];
    // con fetch e non con <img>: un'immagine creata da script trattiene
    // l'evento "pagina caricata" finché non arriva (misurato: ~30 s su 4G per
    // tutto il film), e chi lo aspetta — la striscia dei video — partiva tardi
    fetch(nome(i)).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(function (b) {
      return new Promise(function (ok, ko) {
        var im = new Image();
        im.onload = function () {
          // decodificata PRIMA di disegnarla: il primo disegno non costa uno scatto
          var via = function () { ok(im); };
          if (im.decode) im.decode().then(via, via); else via();
        };
        im.onerror = ko;
        im.src = URL.createObjectURL(b);
      });
    }).then(function (im) {
      if (spento) return;
      quadri[i] = im; arrivata(); caricaUna();
    }, function () { caricaUna(); });    // un'immagine persa non ferma le altre
  }
  function arrivata() {
    if (!acceso) {
      if (!quadri[0]) return;
      acceso = true;
      tela.width = quadri[0].naturalWidth;
      tela.height = quadri[0].naturalHeight;
      disegna(true);
      film.classList.add('is-on');         // la tela appare solo quando ha dipinto
      return;
    }
    disegna(true);                         // un'immagine in più: il film si affina
  }
  function load() { for (var k = 0; k < PARALLELE; k++) caricaUna(); }

  // le due immagini già arrivate più vicine a x: una prima, una dopo
  function vicine(x) {
    var a = Math.floor(x), b = Math.ceil(x);
    while (a > 0 && !quadri[a]) a--;
    while (b < N - 1 && !quadri[b]) b++;
    if (!quadri[b]) b = a;
    return [a, b];
  }
  function disegna(forza) {
    if (!acceso) return;
    var x = (shown < 0 ? 0 : shown > 1 ? 1 : shown) * (N - 1);
    var ab = vicine(x), a = ab[0], b = ab[1];
    var w = b === a ? 0 : (x - a) / (b - a);
    w += ((w < 0.5 ? 0 : 1) - w) * nitido;  // fermandosi: verso l'immagine pura più vicina
    var k = Math.round(w * 32);              // sotto 1/32 di dissolvenza non si vede differenza
    var q = (a * N + b) * 33 + k;
    if (!forza && q === disegnato) return;
    disegnato = q;
    ctx.globalAlpha = 1;
    ctx.drawImage(quadri[k === 32 ? b : a], 0, 0, tela.width, tela.height);
    if (k > 0 && k < 32) {
      ctx.globalAlpha = w;
      ctx.drawImage(quadri[b], 0, 0, tela.width, tela.height);
      ctx.globalAlpha = 1;
    }
  }

  function apply(force) {
    disegna(force);
    updateUI();
  }

  // Curva morbida: parte e finisce piatta, niente stacchi.
  function smooth(t) { t = t < 0 ? 0 : (t > 1 ? 1 : t); return t * t * (3 - 2 * t); }

  // Ogni pezzo della scena entra un filo dopo il precedente: è quello che
  // rende l'arrivo "a scaglioni" invece che tutto insieme di colpo.
  var SFASA = { e: 0, t: 0.07, b: 0.15, p1: 0.04, p2: 0.12 };

  var W = 0.062;   // semi-finestra di una tappa (più stretta della distanza fra due)
  var F = 0.52;    // quanta parte della finestra è dissolvenza invece che tenuta

  function updateUI() {
    // Titolo d'apertura: se ne va con calma, e ha finito PRIMA che il primo
    // foglio cominci a farsi vedere (nessuna sovrapposizione).
    var out = smooth(shown / 0.10);
    intro.style.opacity = String(1 - out);
    intro.style.transform = 'translateY(' + (-30 * out).toFixed(1) + 'px)';
    intro.style.pointerEvents = out > 0.5 ? 'none' : '';

    // Le tappe: opacità e movimento presi DIRETTAMENTE dalla posizione nel
    // cammino, non da una transizione CSS. Così la dissolvenza segue la mano
    // di chi scorre — piano se scorre piano — invece di scattare.
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var d = shown - n.at;
      var x = Math.abs(d) / W;
      var a = x < 1 ? smooth((1 - x) / F) : 0;

      /* Desktop: i layer restano vivi (spegnerli e riaccenderli costava un
         picco di ~100ms di rasterizzazione) e cambia solo l'opacità.
         Telefono: l'opposto — tenere accesi 4 strati a DPR 3 pesa sulla GPU
         e ruba banda proprio allo scroll; le tappe sono solo testo, quindi
         riaccenderle costa nulla: fuori finestra si spengono davvero. */
      var visible = a > 0.002;
      if (!visible) {
        if (n.vis !== 0) {
          n.vis = 0;
          n.el.style.setProperty('--a', '0'); n.el.style.setProperty('--p1', '0'); n.el.style.setProperty('--p2', '0');
          n.el.style.setProperty('--ae', '0'); n.el.style.setProperty('--at', '0'); n.el.style.setProperty('--ab', '0');
          if (onPhone) n.el.style.visibility = 'hidden';
        }
        continue;
      }
      if (n.vis !== 1 && onPhone) n.el.style.visibility = 'visible';
      n.vis = 1;

      var st = n.el.style;
      var base = (1 - x) / F;
      // la scena "sfila" piano mentre cammini
      st.setProperty('--drift', (d * 110).toFixed(1) + 'px');
      st.setProperty('--a',  a.toFixed(3));
      st.setProperty('--ae', smooth(base - SFASA.e).toFixed(3));
      st.setProperty('--at', smooth(base - SFASA.t).toFixed(3));
      st.setProperty('--ab', smooth(base - SFASA.b).toFixed(3));
      st.setProperty('--p1', smooth(base - SFASA.p1).toFixed(3));
      st.setProperty('--p2', smooth(base - SFASA.p2).toFixed(3));
    }

    // Arrivo alla casa
    var arr = shown <= 0.90 ? 0 : (shown - 0.90) / 0.07;
    arr = Math.min(1, arr);
    arrival.classList.toggle('is-on', arr > 0.05);
    arrival.style.opacity = String(arr);
    arrival.style.transform = 'translateY(' + (18 * (1 - arr)).toFixed(1) + 'px)';
    arrival.setAttribute('aria-hidden', arr > 0.5 ? 'false' : 'true');

    // Raccordo col fondo della pagina. Si fermа a metà: la casa illuminata
    // deve restare visibile fino all'ultimo — è il premio del cammino —
    // e il testo d'arrivo ha comunque il contrasto che gli serve.
    var land = shown <= 0.90 ? 0 : (shown - 0.90) / 0.10;
    land = Math.min(1, land) * 0.52;
    landing.style.opacity = String(land);

    if (flies === null) flies = stage.querySelector('.fireflies') || false;
    if (flies) flies.style.opacity = String(1 - land / 0.52 * 0.7);
  }

  /* -------------------------------------------------------- scheduler -- */
  function loop(now) {
    if (!running) return;
    // La posizione si legge QUI, a inizio frame, quando il layout è pulito:
    // leggerla nel gestore di scroll — dopo le scritture di stile del frame
    // prima — forzava un reflow dell'intera pagina (visto nel trace).
    readScroll();
    // mai 0: due frame con lo stesso orario darebbero una velocità infinita
    var dt = lastT ? Math.min(Math.max((now - lastT) / 1000, 0.001), 0.25) : 0.016;
    lastT = now;
    /* Due pesature diverse (playbook §8.3):
       — ROTELLINA (desktop): input a scatti discreti → un'inerzia corta
         (~100 ms) li fonde in un movimento continuo. Quella "steadicam" di
         prima (0.94 a 60fps, ~270 ms) misurata faceva arrivare il bosco
         fino a 1,3 s dopo la rotellina: il film non sembrava legato allo
         scorrimento;
       — DITO (telefono): manipolazione diretta → il video segue QUASI
         LINEARE (~70 ms; misurato: 0,08 s di ritardo). */
    var s = 1 - Math.exp(-(onPhone ? 14 : 10) * dt);
    var prima = shown;
    shown += (progress - shown) * s;
    // velocità in immagini al secondo: da 4 in su dissolvenza piena (si legge
    // come mosso), da ferma immagine pura; la soglia si raggiunge con calma
    var v = Math.abs(shown - prima) * (N - 1) / dt;
    var meta = v >= 4 ? 0 : 1 - v / 4;
    nitido += (meta - nitido) * (1 - Math.exp(-10 * dt));
    if (Math.abs(progress - shown) < 0.0003 && nitido > 0.99) {
      shown = progress; nitido = 1; apply(false);
      running = false; lastT = 0; return;
    }
    apply(false);
    requestAnimationFrame(loop);
  }
  function kick() {
    if (!visible || document.hidden || running) return;
    running = true; lastT = 0;
    requestAnimationFrame(loop);
  }

  /* ----------------------------------------------------------- eventi -- */
  // il gestore di scroll NON legge la posizione (lo fa il loop a inizio
  // frame): qui si segnala soltanto che c'è del lavoro da fare
  window.addEventListener('scroll', kick, { passive: true });

  // RESIZE SOLO SU CAMBI VERI (immersive-web-engine §3): il collasso della
  // barra indirizzi emette un `resize` che cambia solo l'altezza, e di poco.
  // Rimisurare lì farebbe saltare la posizione nel film. Si reagisce solo a
  // un cambio di larghezza o a una variazione d'altezza importante.
  var lastW = window.innerWidth, lastH = vpH();
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = vpH();
    if (w === lastW && Math.abs(h - lastH) < 150) return;
    lastW = w; lastH = h;
    measure(); readScroll(); kick();
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(function () {
      lastW = window.innerWidth; lastH = vpH();
      measure(); readScroll(); kick();
    }, 250);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false; else kick();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) kick(); else running = false;
    }, { threshold: 0 }).observe(stage);
  }

  // Se l'utente accende reduced-motion a pagina aperta: smonta tutto.
  function onPref() {
    if (!mqReduce.matches) return;
    running = false;
    film.classList.remove('is-on');
    spento = true;                       // niente più immagini da scaricare
    tela.remove();
    document.documentElement.classList.remove('has-film');
    document.documentElement.classList.add('no-film');
    if (fallback) fallback.hidden = false;
    track.style.height = '100svh';
    intro.style.opacity = '1'; intro.style.transform = 'none'; intro.style.pointerEvents = '';
    notes.forEach(function (n) { n.el.classList.remove('is-on'); });
    arrival.classList.remove('is-on');
    landing.style.opacity = '0';
    if (cue) cue.hidden = true;
  }
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onPref);
  else if (mqReduce.addListener) mqReduce.addListener(onPref);

  /* -------------------------------------------------------------- go -- */
  measure(); readScroll(); shown = progress;
  load(); kick();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); readScroll(); kick(); });
  }
})();
