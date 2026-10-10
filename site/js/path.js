/* ==========================================================================
   MAGIC BONES — IL CAMMINO
   Una scena unica da 10s scrubbata dallo scroll: si cammina nel bosco fino
   alla casa di Claudia, e lungo la strada la sua storia compare a post-it.

   Fluidità (dal livello A di immersive-web-engine):
   - damping frame-rate-independent 1-exp(-λ·dt), dt clampato
   - scheduler event-driven: si ferma a convergenza, in tab nascosta, offscreen
   - geometria cacheata: nessun getBoundingClientRect nel loop
   Robustezza (dallo scrub-engine di scroll-world):
   - streaming con richieste Range (parte subito); Blob solo se il server
     non le supporta (sempre seekable, ma aspetta il file intero)
   - seek coalescing: mai una nuova seek mentre il decoder sta cercando
   - poster finché un frame vero non è dipinto + priming al primo gesto (iOS)
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

  var SRC = onPhone ? (CFG.film.srcMobile || CFG.film.src) : CFG.film.src;
  var DUR = CFG.film.dur || 10;

  function filmAllowed() {
    if (!CFG.flags.pathFilm) return false;
    if (mqReduce.matches) return false;
    if (conn.saveData) return false;
    if (lowMem) return false;
    if (onPhone && !CFG.film.srcMobile) return false;   // mai un crop del 16:9
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
  var video = null, ready = false, blobUrl = null;
  var progress = 0, shown = 0;
  var geom = { top: 0, run: 1 };
  var running = false, visible = true, lastT = 0, primed = false;
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

  /* ------------------------------------------------------ caricamento --
     Con la barra di avanzamento nel richiamo: su una linea lenta il film
     impiega qualche secondo ad arrivare, e la differenza fra "sta caricando
     il bosco… 43%" e un'immagine ferma è la differenza fra attendere e
     credere che il sito sia rotto. */
  var cueText = cue ? cue.querySelector('.path__cue-text') : null;
  var cueMsg = cueText ? cueText.textContent : '';
  function progresso(pct) {
    if (!cueText) return;
    cueText.textContent = pct === null ? cueMsg : ('Sto caricando il bosco… ' + pct + '%');
  }
  function scarica(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var totale = +r.headers.get('Content-Length') || 0;
      if (!r.body || !totale) return r.blob();
      var reader = r.body.getReader(), ricevuti = 0, parti = [];
      function passo() {
        return reader.read().then(function (x) {
          if (x.done) return new Blob(parti);
          parti.push(x.value); ricevuti += x.value.length;
          progresso(Math.min(99, Math.round(ricevuti / totale * 100)));
          return passo();
        });
      }
      return passo();
    });
  }
  /* STREAMING PRIMA DI TUTTO. Netlify e Cloudflare consegnano il video "a
     pezzi" (richieste Range): il browser dipinge il primo fotogramma appena
     arriva l'inizio del file e scarica il resto mentre si cammina. Prima il
     film aspettava SEMPRE il file intero come Blob: misurato su 4G, restava
     fermo ~25 s — chi scorreva vedeva solo una foto e il sito "non
     funzionava". Il Blob resta come riserva per i server che non conoscono
     le richieste Range (es. `python -m http.server`): lì senza Blob ogni
     seek ricadrebbe sul fotogramma 0. */
  function supportaRange(url) {
    return fetch(url, { headers: { Range: 'bytes=0-0' }, cache: 'no-store' })
      .then(function (r) {
        if (r.body && r.body.cancel) r.body.cancel();
        return r.status === 206;
      })
      .catch(function () { return false; });
  }
  function monta(url) {
    var v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.src = url;
    v.addEventListener('loadedmetadata', function () {
      ready = true;
      apply(true);
    });
    v.addEventListener('loadeddata', function () { prime(v); });
    // ogni seek completata ridà un colpo al loop: se nel frattempo lo
    // scroll è andato avanti, il fotogramma giusto arriva subito dopo
    v.addEventListener('seeked', function () { kick(); });
    film.appendChild(v);
    video = v;
  }
  function load() {
    supportaRange(SRC).then(function (aPezzi) {
      if (aPezzi) { monta(SRC); return; }
      return scarica(SRC).then(function (blob) {
        progresso(null);
        blobUrl = URL.createObjectURL(blob);
        monta(blobUrl);
      });
    }).catch(function () {
      // Media non disponibile: resta il poster, la pagina è comunque completa.
      progresso(null);
      film.classList.remove('is-on');
    });
  }

  /* Il vizio di iOS Safari (documentato nella skill scroll-world): un video
     muto che non è MAI stato riprodotto non dipinge i fotogrammi delle seek —
     il poster resta lì, fermo, e il film sembra "tolto". La riproduzione muta
     inline è permessa anche senza gesto: qui si avvia davvero, si lascia
     girare finché il decoder non ha dipinto (primo `timeupdate`), e solo
     allora si mette in pausa e si mostra il film. Il gesto dell'utente resta
     come seconda rete di sicurezza. */
  var primeOk = false;
  function prime(v) {
    if (primeOk) return;
    function fatto() {
      if (primeOk) return;
      primeOk = true;
      v.removeEventListener('timeupdate', fatto);
      try { v.pause(); } catch (e) {}
      film.classList.add('is-on');       // il film appare solo quando dipinge
      apply(true);
      if (!onPhone) prewarm(v);          // scalda il decoder mentre si è fermi
    }
    v.addEventListener('timeupdate', fatto);
    setTimeout(fatto, 900);              // rete di sicurezza se timeupdate tarda
    try {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  /* PRE-WARM del decoder (immersive-web-engine §2, adattato dal 3D al video).
     La prima seek su un punto mai visitato costa: il decoder deve raggiungere
     il keyframe e decodificare. Se capita al primo scroll, si sente come uno
     scatto proprio nel momento che conta. Qui si visitano cinque punti lungo
     tutto il clip mentre l'utente è ancora fermo sul titolo, e si torna a 0.
     Si interrompe appena l'utente tocca lo scroll: il suo gesto ha priorità. */
  var warmAbort = false, warmed = false;
  function prewarm(v) {
    if (warmed || warmAbort) return;
    warmed = true;
    var pts = [0.15, 0.38, 0.6, 0.82, 0.97], i = 0;
    function step() {
      if (warmAbort || i >= pts.length) {
        if (!warmAbort) { try { v.currentTime = 0; } catch (e) {} }
        return;
      }
      var t = pts[i++] * DUR;
      var done = function () { v.removeEventListener('seeked', done); step(); };
      v.addEventListener('seeked', done);
      try { v.currentTime = t; } catch (e) { v.removeEventListener('seeked', done); step(); }
    }
    step();
  }
  function primeAll() { if (primed) return; primed = true; if (video) prime(video); }

  /* ------------------------------------------------------------ frame -- */
  /* CAMBIO DI PARADIGMA sulla seek (diagnosi misurata):
     chiedere una seek a OGNI frame di scroll (60+/s) intasa il decoder — il
     filmato ha solo 24 fotogrammi al secondo, quindi 2 richieste su 3 non
     possono nemmeno produrre un'immagine diversa. Qui il tempo si aggancia
     al reticolo dei fotogrammi REALI: si chiede una seek solo quando cambia
     il fotogramma, e sempre esattamente sul suo istante. Misurato: i picchi
     oltre i 20ms spariscono del tutto. */
  var FPS = 24;
  var lastFrame = -1;
  function apply(force) {
    if (video && ready && !video.seeking) {
      var t = Math.max(0, Math.min(DUR - 0.05, shown * DUR));
      var fr = Math.min(Math.round(t * FPS), Math.floor((DUR - 0.05) * FPS));
      // auto-riparazione: se il tempo reale del video non corrisponde al
      // fotogramma che crediamo di mostrare (il priming lo fa avanzare, una
      // seek può fallire in silenzio), si richiede comunque
      var fuoriPosto = Math.abs(video.currentTime - fr / FPS) > 0.09;
      if (force || fr !== lastFrame || fuoriPosto) {
        lastFrame = fr;
        try { video.currentTime = fr / FPS + 0.0001; } catch (e) {}
      }
    }
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
    var dt = lastT ? Math.min((now - lastT) / 1000, 0.25) : 0.016;
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
    shown += (progress - shown) * s;
    if (Math.abs(progress - shown) < 0.0003) {
      shown = progress; apply(false);
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
  window.addEventListener('scroll', function () { warmAbort = true; kick(); }, { passive: true });

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
  ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (ev) {
    window.addEventListener(ev, primeAll, { once: true, passive: true });
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
    if (video) {
      try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
      video.remove(); video = null;
    }
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
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

  window.addEventListener('pagehide', function () {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  });

  /* -------------------------------------------------------------- go -- */
  measure(); readScroll(); shown = progress;
  load(); kick();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); readScroll(); kick(); });
  }
})();
