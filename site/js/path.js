/* ==========================================================================
   MAGIC BONES — IL CAMMINO
   L'apertura della home: si cammina nel bosco fino alla casa di Claudia.
   È corta e GUIDATA, a fermate (js/config.js → fermate):
     0  il titolo sul bosco
     1  a metà sentiero: la storia, con le foto
     2  la casa: "Benvenuto a casa mia"
   e il gesto dopo porta dentro il sito.

   Ogni gesto (un colpo di rotella o di trackpad, una strisciata di dito, una
   freccia della tastiera) è UN passo: il film va da solo alla fermata dopo
   con un movimento fatto da noi — sempre uguale, a 60 fotogrammi, qualunque
   cosa faccia il dito. Durante il cammino la pagina non scorre davvero: il
   palco è "appiccicato" allo schermo, quindi la posizione si sposta di colpo
   alla fermata (non si vede) e si anima solo il film.

   Il film NON è un video: è una sequenza di immagini disegnata su una tela
   (su iPhone un video guidato dallo scroll mostrava solo 3 immagini).
   Se si scorre col dito "di forza" (barra di scorrimento, risalita veloce
   dal sito) il film segue la posizione, e quando ci si ferma si posa sulla
   fermata più vicina.
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
  var NF = SEQ ? SEQ.n : 0;                              // le immagini nella cartella
  var N = SEQ ? Math.min(NF, SEQ.usa || NF) : 0;         // quelle che il film usa davvero

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

  /* -------------------------------------------------------- fermate -- */
  var FERMATE = (CFG.fermate && CFG.fermate.length > 1) ? CFG.fermate : [0, 0.5, 1];
  var ULTIMA = FERMATE.length - 1;
  // durata di un passo intero (da una fermata alla successiva)
  var PASSO_MS = onPhone ? 1450 : 1650;

  /* ---------------------------------------------------------- stato -- */
  var progress = 0, shown = 0;
  var geom = { top: 0, run: 1, vh: 1, fine: 1 };
  var running = false, lastT = 0, scrollY0 = 0, fuori = false;
  var notes = [];
  var flies = null;
  var corsa = null;        // il passo in corso: { da, a, t0, dur, k }
  var fermata = 0;         // la fermata dove si è (o verso cui si va)
  var fermoFino = 0;       // fino a quando i gesti non contano (discesa nel sito, arrivo dal sito)

  /* ------------------------------------------------------- post-it -- */
  /* Ogni tappa è una SCENA.
     · Su computer: due foto, una a sinistra e una a destra, e il racconto
       in mezzo, centrato, come un titolo sul bosco.
     · Su telefono: un foglio solo, la foto sopra e il racconto sotto (il
       CSS ricompone, il markup è uno solo). */
  // hash deterministico: nessun Math.random, layout riproducibile
  function pseudo(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }

  function foto(cls, src, alt) {
    var f = document.createElement('figure');
    f.className = cls;
    f.innerHTML = '<img alt="" decoding="async">';
    var im = f.querySelector('img');
    im.src = src; im.alt = alt || '';
    return f;
  }

  (CFG.storia || []).forEach(function (s, i) {
    var beat = document.createElement('div');
    beat.className = 'beat';

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

    // le due foto: una a sinistra e una a destra, mai identiche da una tappa
    // all'altra (altezza, misura, rotazione da un hash deterministico)
    var q = [pseudo(i * 3 + 1), pseudo(i * 5 + 2), pseudo(i * 7 + 3),
             pseudo(i * 11 + 4), pseudo(i * 13 + 5), pseudo(i * 17 + 6)];
    beat.style.setProperty('--y1', (-16 + q[0] * 32).toFixed(1) + '%');
    beat.style.setProperty('--y2', (-16 + q[1] * 32).toFixed(1) + '%');
    beat.style.setProperty('--w1', (0.86 + q[2] * 0.26).toFixed(3));
    beat.style.setProperty('--w2', (0.86 + q[3] * 0.26).toFixed(3));
    beat.style.setProperty('--r1', (-4.4 + q[4] * 2.6).toFixed(2) + 'deg');
    beat.style.setProperty('--r2', (1.8 + q[5] * 2.6).toFixed(2) + 'deg');
    beat.style.setProperty('--x1', (q[4] * 3.4).toFixed(1) + 'vw');
    beat.style.setProperty('--x2', (q[5] * 3.4).toFixed(1) + 'vw');

    notesEl.appendChild(beat);
    notes.push({ el: beat, at: s.at, vis: -1, i: i });
  });

  // le foto delle tappe decodificate in anticipo: la prima comparsa non scatta
  function decodificaFoto() {
    notesEl.querySelectorAll('img').forEach(function (img) {
      if (img.decode) img.decode().catch(function () {});
    });
  }
  if ('requestIdleCallback' in window) requestIdleCallback(decodificaFoto, { timeout: 2500 });
  else setTimeout(decodificaFoto, 1200);

  /* -------------------------------------------------------- geometria --
     Su telefono la barra degli indirizzi cambia `innerHeight`: un probe alto
     `100vh` misura l'altezza "grande", che non cambia mai. */
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;pointer-events:none;visibility:hidden';
  document.body.appendChild(probe);
  function vpH() { return probe.offsetHeight || window.innerHeight; }

  function measure() {
    var r = track.getBoundingClientRect();
    geom.top = r.top + window.scrollY;
    geom.vh = vpH();
    geom.run = Math.max(1, track.offsetHeight - geom.vh);
    geom.fine = geom.top + track.offsetHeight;          // dove comincia il sito
  }
  function readScroll() {
    scrollY0 = window.scrollY;
    var p = (scrollY0 - geom.top) / geom.run;
    progress = p < 0 ? 0 : (p > 1 ? 1 : p);
  }
  function yDi(k) { return Math.round(geom.top + geom.run * FERMATE[k]); }
  // dentro il cammino: il palco copre tutto lo schermo
  function nelCammino() { return window.scrollY <= geom.top + geom.run + 2; }
  function piuVicina(p) {
    var k = 0;
    for (var i = 1; i <= ULTIMA; i++) if (Math.abs(FERMATE[i] - p) < Math.abs(FERMATE[k] - p)) k = i;
    return k;
  }

  /* ------------------------------------------------------ la sequenza --
     A passate: prima il tratto fino alla PRIMA fermata (è quello che si
     guarda subito), da rado a fitto; poi il resto. Fra le due immagini già
     arrivate più vicine c'è una dissolvenza: anche con le immagini ancora
     rade il movimento resta continuo. Da fermi, sempre un'immagine pura.

     Ogni immagine si DECODIFICA UNA VOLTA SOLA, appena arriva e fuori dal
     thread principale (ImageBitmap), e resta pronta. Misurato: disegnando
     <img> sulla tela Chrome le ridecodificava al momento, 1 s di lavoro sul
     thread principale per un solo passo su un telefono medio (il film
     andava a scatti). Per la memoria del telefono se ne usa una su due
     (config: film.*.usa): con il passo guidato e la dissolvenza fra
     immagini vicine il movimento resta continuo. */
  var tela = document.createElement('canvas');
  tela.setAttribute('aria-hidden', 'true');
  var ctx = tela.getContext('2d', { alpha: false });
  film.appendChild(tela);

  var quadri = new Array(N);
  var acceso = false, spento = false, disegnato = -1;
  var nitido = 1;                          // 1 = da fermi (immagine pura), 0 = in corsa (dissolvenza piena)
  var ordine = [];
  (function () {
    var visto = {};
    function metti(i) { if (i >= 0 && i < N && !visto[i]) { visto[i] = 1; ordine.push(i); } }
    var tappe = FERMATE.map(function (f) { return Math.round(f * (N - 1)); });
    tappe.forEach(metti);                  // le immagini delle fermate per prime
    for (var t = 0; t < tappe.length - 1; t++) {
      [16, 8, 4, 2, 1].forEach(function (p) { for (var i = tappe[t]; i <= tappe[t + 1]; i += p) metti(i); });
    }
    for (var i = 0; i < N; i++) metti(i);
  })();
  function nome(i) {
    var f = N > 1 ? Math.round(i * (NF - 1) / (N - 1)) : 0;     // dall'immagine usata al file
    return SEQ.cartella + ('00' + f).slice(-3) + '.webp?v=' + (CFG.film.versione || 1);
  }
  function comeImmagine(b) {
    return new Promise(function (ok, ko) {
      var im = new Image();
      im.onload = function () {
        var via = function () { ok(im); };
        if (im.decode) im.decode().then(via, via); else via();
      };
      im.onerror = ko;
      im.src = URL.createObjectURL(b);
    });
  }

  var PARALLELE = 4, prossimo = 0;
  function caricaUna() {
    if (spento || prossimo >= ordine.length) return;
    var i = ordine[prossimo++];
    // con fetch e non con <img>: un'immagine creata da script trattiene
    // l'evento "pagina caricata" finché non arriva
    fetch(nome(i)).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(function (b) {
      if (window.createImageBitmap) return createImageBitmap(b).catch(function () { return comeImmagine(b); });
      return comeImmagine(b);
    }).then(function (im) {
      if (spento) return;
      quadri[i] = im; arrivata(); caricaUna();
    }, function () { caricaUna(); });    // un'immagine persa non ferma le altre
  }
  function arrivata() {
    if (!acceso) {
      if (!quadri[0]) return;
      acceso = true;
      tela.width = quadri[0].naturalWidth || quadri[0].width;
      tela.height = quadri[0].naturalHeight || quadri[0].height;
      disegna(true);
      film.classList.add('is-on');         // la tela appare solo quando ha dipinto
      return;
    }
    if (!running) disegna(true);           // un'immagine in più: il film si affina
  }
  function load() { for (var k = 0; k < PARALLELE; k++) caricaUna(); }

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
    w += ((w < 0.5 ? 0 : 1) - w) * nitido;
    var k = Math.round(w * 32);
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

  // Curva morbida: parte e finisce piatta, niente stacchi.
  function smooth(t) { t = t < 0 ? 0 : (t > 1 ? 1 : t); return t * t * (3 - 2 * t); }
  // il passo: parte piano, cammina, si posa piano
  function passo(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ------------------------------------------------------------ scena -- */
  var SFASA = { e: 0, t: 0.07, b: 0.15, p1: 0.04, p2: 0.12 };
  var W = 0.25;    // semi-finestra di una tappa
  var F = 0.62;    // quanta parte della finestra è dissolvenza invece che tenuta
  var ultimoIntro = -1, ultimoArr = -1, ultimoLand = -1;

  function updateUI() {
    // il titolo se ne va appena si parte
    var out = smooth(shown / 0.13);
    if (out !== ultimoIntro) {
      ultimoIntro = out;
      intro.style.opacity = String(1 - out);
      intro.style.transform = 'translateY(' + (-30 * out).toFixed(1) + 'px)';
      intro.style.visibility = out > 0.995 ? 'hidden' : '';
      if (cue) cue.classList.toggle('anim-ferma', out > 0.5);
      intro.style.pointerEvents = out > 0.5 ? 'none' : '';
    }

    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var d = shown - n.at;
      var x = Math.abs(d) / W;
      var a = x < 1 ? smooth((1 - x) / F) : 0;
      /* fuori finestra le tappe restano "vive" a opacità zero: spegnerle e
         riaccenderle costava un ridisegno (foto, ombre) proprio a metà passo */
      if (a <= 0.002) {
        if (n.vis !== 0) {
          n.vis = 0;
          n.el.style.setProperty('--a', '0'); n.el.style.setProperty('--p1', '0'); n.el.style.setProperty('--p2', '0');
          n.el.style.setProperty('--ae', '0'); n.el.style.setProperty('--at', '0'); n.el.style.setProperty('--ab', '0');
        }
        continue;
      }
      n.vis = 1;
      var st = n.el.style;
      var base = (1 - x) / F;
      st.setProperty('--drift', (d * 90).toFixed(1) + 'px');
      st.setProperty('--a',  a.toFixed(3));
      st.setProperty('--ae', smooth(base - SFASA.e).toFixed(3));
      st.setProperty('--at', smooth(base - SFASA.t).toFixed(3));
      st.setProperty('--ab', smooth(base - SFASA.b).toFixed(3));
      st.setProperty('--p1', smooth(base - SFASA.p1).toFixed(3));
      st.setProperty('--p2', smooth(base - SFASA.p2).toFixed(3));
    }

    // arrivo alla casa
    var arr = shown <= 0.80 ? 0 : Math.min(1, (shown - 0.80) / 0.17);
    var land = shown <= 0.86 ? 0 : Math.min(1, (shown - 0.86) / 0.14) * 0.45;
    if (arr !== ultimoArr) {
      ultimoArr = arr;
      arrival.classList.toggle('is-on', arr > 0.05);
      arrival.style.opacity = String(arr);
      arrival.style.transform = 'translateY(' + (18 * (1 - arr)).toFixed(1) + 'px)';
      arrival.setAttribute('aria-hidden', arr > 0.5 ? 'false' : 'true');
    }
    if (land !== ultimoLand) {
      // raccordo col fondo della pagina: a metà, la casa illuminata resta il premio
      ultimoLand = land;
      landing.style.opacity = String(land);
      if (flies === null) flies = stage.querySelector('.fireflies') || false;
      if (flies) flies.style.opacity = String(1 - land / 0.45 * 0.7);
    }
  }

  function apply(force) {
    disegna(force);
    updateUI();
  }

  /* -------------------------------------------------------- scheduler -- */
  function loop(now) {
    if (!running) return;
    readScroll();
    var dentro = corsa || (scrollY0 > geom.top - geom.vh && scrollY0 < geom.fine + geom.vh);
    if (!dentro) { fuori = true; running = false; lastT = 0; return; }
    if (fuori) { fuori = false; shown = progress; nitido = 1; }
    var dt = lastT ? Math.min(Math.max((now - lastT) / 1000, 0.001), 0.25) : 0.016;
    lastT = now;
    var prima = shown;

    if (corsa) {
      // il passo guidato: la posizione è già alla fermata, si anima il film
      var t = (now - corsa.t0) / corsa.dur;
      if (t >= 1) { shown = corsa.a; corsa = null; finePasso(); }
      else shown = corsa.da + (corsa.a - corsa.da) * passo(t < 0 ? 0 : t);
    } else {
      // lo scorrimento libero (barra, risalita dal sito): il film segue
      var s = 1 - Math.exp(-(onPhone ? 14 : 10) * dt);
      var RITARDO = 0.06;
      if (progress - shown > RITARDO) shown = progress - RITARDO;
      else if (shown - progress > RITARDO) shown = progress + RITARDO;
      shown += (progress - shown) * s;
    }
    // in corsa dissolvenza fra le immagini (si legge come movimento), da
    // fermi l'immagine pura
    var v = Math.abs(shown - prima) * (N - 1) / dt;
    var meta = v >= 4 ? 0 : 1 - v / 4;
    nitido += (meta - nitido) * (1 - Math.exp(-10 * dt));
    if (!corsa && Math.abs(progress - shown) < 0.0003 && nitido > 0.99) {
      shown = progress; nitido = 1; apply(false);
      running = false; lastT = 0; return;
    }
    apply(false);
    requestAnimationFrame(loop);
  }
  function kick() {
    if (document.hidden || running) return;
    running = true; lastT = 0;
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------- il regista -- */
  var dopo = 0;            // un gesto arrivato durante il passo (dito): lo si fa subito dopo

  function vai(k, subito) {
    k = k < 0 ? 0 : (k > ULTIMA ? ULTIMA : k);
    fermata = k;
    var a = FERMATE[k];
    var y = yDi(k);
    if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' });
    readScroll();
    var dist = Math.abs(a - shown);
    if (subito || dist < 0.002) { corsa = null; shown = a; }
    else {
      var lungo = Math.min(1, dist / 0.5);
      corsa = { da: shown, a: a, t0: performance.now(), dur: PASSO_MS * (0.45 + 0.55 * lungo), k: k };
    }
    kick();
  }
  function finePasso() {
    if (dopo) { var d = dopo; dopo = 0; setTimeout(function () { gesto(d); }, 0); }
  }
  // dentro il sito: la fine del cammino scivola via e si vede la casa di Claudia
  function entra() {
    corsa = null; dopo = 0;
    fermoFino = performance.now() + 900;
    frenaInerzia(true);
    window.scrollTo({ top: Math.round(geom.fine), behavior: 'smooth' });
  }
  /* L'inerzia del trackpad continua a mandare eventi per un secondo: durante
     la discesa nel sito spingerebbe la pagina oltre la sezione di Claudia.
     Per quel tratto (e solo per quello) la si frena; il primo gesto NUOVO
     dopo la discesa è di nuovo tutto del browser. */
  var freno = false, tFreno = 0;
  function frena(e) {
    var ora = performance.now(), tEv = e.timeStamp || ora;
    var nuovo = tEv - ultimoEv > 180;
    ultimoEv = tEv;
    if (ora < fermoFino || !nuovo) { e.preventDefault(); return; }
    frenaInerzia(false);
  }
  function frenaInerzia(si) {
    if (si === freno) return;
    freno = si;
    clearTimeout(tFreno);
    if (si) { window.addEventListener('wheel', frena, { passive: false }); tFreno = setTimeout(function () { frenaInerzia(false); }, 5000); }
    else window.removeEventListener('wheel', frena, { passive: false });
  }
  function occupato() { return !!corsa || performance.now() < fermoFino; }
  function gesto(dir) {
    var k = corsa ? corsa.k : (Math.abs(progress - FERMATE[fermata]) < 0.01 ? fermata : piuVicina(progress));
    var nk = k + dir;
    if (nk < 0) { if (!corsa) vai(0); return; }
    if (nk > ULTIMA) { if (!corsa) entra(); return; }
    vai(nk);
  }

  // ROTELLA e TRACKPAD. Un colpo = un passo. L'inerzia del trackpad (eventi
  // che continuano per un secondo dopo il gesto) non deve fare altri passi:
  // un gesto nuovo è un evento dopo una pausa, o uno che riparte deciso.
  /* Gli ascoltatori che possono fermare lo scorrimento si accendono SOLO
     mentre il cammino è sullo schermo (vedi ascolta() più giù): sempre
     accesi, Chrome dovrebbe chiedere il permesso al codice a ogni movimento
     in tutta la pagina (scorrimento meno pronto ovunque). Stanno sulla
     finestra e non sul palco: anche col puntatore sulla barra in alto o sul
     bottone della raccolta il gesto deve contare. */
  var ultimoEv = 0, ultimoDy = 0, ultimoFuori = 0;
  function suRotella(e) {
    if (e.ctrlKey || spento) return;                 // ctrl+rotella = zoom
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? geom.vh : 1);
    if (Math.abs(dy) < 0.5 || Math.abs(e.deltaX) > Math.abs(dy)) return;
    // le pause fra un evento e l'altro si misurano con l'ORARIO DELL'EVENTO
    // (quando la mano l'ha fatto), non con quello in cui la pagina riesce a
    // guardarlo: con la pagina occupata gli eventi arrivano a gruppi e
    // sembrerebbero pause, cioè gesti nuovi
    var ora = performance.now(), tEv = e.timeStamp || ora;
    var dentro = nelCammino();
    var daFuori = ora - ultimoFuori < 300;
    if (!dentro) {
      if (freno) return;                             // ci pensa il freno della discesa
      // anche fuori dal cammino ogni colpo conta nella sequenza: il colpo dopo,
      // dello stesso gesto, non deve sembrare un gesto nuovo
      ultimoEv = tEv; ultimoDy = dy;
      // risalendo dal sito: il colpo che entrerebbe nel cammino (o ne tocca il
      // bordo) atterra esattamente sulla casa, mai a metà film; il resto del
      // gesto finisce lì
      var limite = Math.round(geom.top + geom.run);
      if (dy < 0 && window.scrollY + dy <= limite + 2) {
        e.preventDefault();
        corsa = null; fermata = ULTIMA; shown = Math.max(shown, progress);
        fermoFino = ora + 450;
        window.scrollTo({ top: limite, behavior: 'smooth' });
      }
      return;
    }
    e.preventDefault();
    var nuovo = tEv - ultimoEv > 180 || (Math.abs(dy) > Math.abs(ultimoDy) * 2.5 && Math.abs(dy) > 30);
    ultimoEv = tEv; ultimoDy = dy;
    if (daFuori && dy < 0) {
      // si risale dal sito: ci si ferma sulla casa, il gesto finisce lì
      vai(ULTIMA, true); fermoFino = ora + 350; return;
    }
    if (!nuovo || occupato()) return;
    gesto(dy > 0 ? 1 : -1);
  }

  // DITO. Nel cammino il dito non trascina la pagina: dà il comando.
  var tocco = null;
  function suTocco(e) {
    tocco = null;
    if (spento || e.touches.length !== 1 || !nelCammino()) return;
    tocco = { y: e.touches[0].clientY, x: e.touches[0].clientX, fatto: false };
  }
  function suMossa(e) {
    if (!tocco) return;
    if (e.touches.length !== 1) { tocco = null; return; }      // due dita: zoom, libero
    if (e.cancelable) e.preventDefault();
    var dy = tocco.y - e.touches[0].clientY;
    var dx = tocco.x - e.touches[0].clientX;
    if (tocco.fatto || Math.abs(dy) < 26 || Math.abs(dy) < Math.abs(dx)) return;
    tocco.fatto = true;
    var dir = dy > 0 ? 1 : -1;
    if (corsa) { dopo = dir; return; }                         // il prossimo, appena finisce questo
    if (performance.now() < fermoFino) return;
    gesto(dir);
  }
  function suFineTocco() { tocco = null; }

  var ascoltando = false;
  function ascolta() {
    var si = !spento && window.scrollY < geom.fine + geom.vh * 0.5;
    if (si === ascoltando) return;
    ascoltando = si;
    var f = si ? 'addEventListener' : 'removeEventListener';
    window[f]('wheel', suRotella, { passive: false });
    window[f]('touchstart', suTocco, { passive: true });
    window[f]('touchmove', suMossa, { passive: false });
    window[f]('touchend', suFineTocco, { passive: true });
    window[f]('touchcancel', suFineTocco, { passive: true });
  }

  // TASTIERA: frecce, pagina su/giù, spazio, inizio
  window.addEventListener('keydown', function (e) {
    if (spento || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !nelCammino()) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ' && !(t && /^(BUTTON|A)$/.test(t.tagName))) dir = e.shiftKey ? -1 : 1;
    else if (e.key === 'Home') { e.preventDefault(); vai(0); return; }
    if (!dir) return;
    e.preventDefault();
    if (!occupato()) gesto(dir);
  });

  // RETE DI SICUREZZA: se la pagina si ferma nel cammino a metà fra due
  // fermate (barra di scorrimento, slancio del dito risalendo, ritorno con
  // la pagina già scorsa) il film si posa sulla fermata più vicina.
  var tFermo = 0;
  function assesta() {
    if (spento || corsa || tocco || performance.now() < fermoFino || !nelCammino()) return;
    readScroll();
    var k = piuVicina(progress);
    if (Math.abs(progress - FERMATE[k]) > 0.004) vai(k);
    else fermata = k;
  }

  /* ----------------------------------------------------------- eventi -- */
  window.addEventListener('scroll', function () {
    if (window.scrollY > geom.top + geom.run + 2) ultimoFuori = performance.now();
    ascolta();
    kick();
    clearTimeout(tFermo); tFermo = setTimeout(assesta, 180);
  }, { passive: true });

  var lastW = window.innerWidth, lastH = vpH();
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = vpH();
    if (w === lastW && Math.abs(h - lastH) < 150) return;
    lastW = w; lastH = h;
    measure(); readScroll(); kick();
    clearTimeout(tFermo); tFermo = setTimeout(assesta, 250);
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(function () {
      lastW = window.innerWidth; lastH = vpH();
      measure(); readScroll(); kick(); assesta();
    }, 250);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false;
    else { if (corsa) { shown = corsa.a; corsa = null; } kick(); }
  });

  // Se l'utente accende reduced-motion a pagina aperta: smonta tutto.
  function onPref() {
    if (!mqReduce.matches) return;
    running = false; corsa = null;
    film.classList.remove('is-on');
    spento = true; ascolta(); frenaInerzia(false);
    tela.remove();
    document.documentElement.classList.remove('has-film');
    document.documentElement.classList.add('no-film');
    if (fallback) fallback.hidden = false;
    track.style.height = '100svh';
    intro.style.opacity = '1'; intro.style.transform = 'none'; intro.style.pointerEvents = ''; intro.style.visibility = '';
    notes.forEach(function (n) { n.el.style.setProperty('--a', '0'); n.el.style.visibility = 'hidden'; });
    arrival.classList.remove('is-on');
    landing.style.opacity = '0';
    if (cue) cue.hidden = true;
  }
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onPref);
  else if (mqReduce.addListener) mqReduce.addListener(onPref);

  // il richiamo in basso si può anche toccare: fa il primo passo
  if (cue) {
    cue.addEventListener('click', function () { if (!occupato()) gesto(1); });
  }

  /* -------------------------------------------------------------- go -- */
  measure(); readScroll(); shown = progress; fermata = piuVicina(progress);
  ascolta(); load(); kick();
  if (progress > 0.004) setTimeout(assesta, 300);    // tornati con la pagina già scorsa
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); readScroll(); kick(); });
  }
  // per le prove automatiche (strumenti di controllo): stato del cammino
  window.MB.cammino = { fermata: function () { return fermata; }, inCorsa: function () { return !!corsa; },
    mostrato: function () { return shown; }, fermate: FERMATE };
})();
