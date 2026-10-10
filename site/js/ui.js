/* ==========================================================================
   MAGIC BONES — UI: reveal, topbar, player dei video, marquee, toast, lucciole
   Nessun loop autonomo se non quelli dichiarati (marquee, lucciole), tutti
   spenti in reduced-motion e fuori dal viewport.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------- WhatsApp -- */
  function waLink(text) {
    return 'https://wa.me/' + window.MB.whatsapp + '?text=' + encodeURIComponent(text);
  }
  window.MB.waLink = waLink;

  /* -------------------------------------------------------------- toast -- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  window.MB.toast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  };

  /* ------------------------------------------------------------- reveal -- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    /* La dissolvenza solo per chi ENTRA PIANO dal basso. Un blocco che compare
       già dentro lo schermo (scorrimento veloce, salto, risalita da sotto)
       si mostra subito: prima restava nero per quasi un secondo, e scorrendo
       veloce su telefono si vedevano schermate intere vuote. */
    var inCorso = [];                      // blocchi che si stanno dissolvendo adesso
    var mostra = function (el, subito) {
      if (el.classList.contains('is-in')) return;
      if (subito) {
        el.style.transition = 'none';
      } else {
        var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(idx, 4) * 70 + 'ms';
        inCorso.push(el);
        setTimeout(function () { var k = inCorso.indexOf(el); if (k > -1) inCorso.splice(k, 1); }, 900);
      }
      el.classList.add('is-in');
    };
    var revObs = new IntersectionObserver(function (entries) {
      var h = window.innerHeight || 800;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        mostra(e.target, e.boundingClientRect.top < h * 0.8);
        revObs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px 12% 0px', threshold: 0 });
    revealables.forEach(function (el) { revObs.observe(el); });

    /* RETE DI SICUREZZA ISTANTANEA. WebKit (Safari e Chrome su iPhone) avvisa
       l'osservatore in ritardo — misurato fino a ~0,6 s dopo un salto — e
       intanto i blocchi restavano neri. Qui le posizioni si misurano una
       volta (e di nuovo quando la pagina cambia misura) e a ogni scorrimento
       basta un confronto con scrollY: nessuna lettura del layout nel frame. */
    var posti = [];
    var misuraPosti = function () {
      var y = window.scrollY;
      posti = [];
      revealables.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var b = el.getBoundingClientRect();
        posti.push([el, b.top + y, b.bottom + y]);
      });
    };
    var attesa = false, ultimoY = window.scrollY, ultimoT = 0;
    var controlla = function () {
      attesa = false;
      var y = window.scrollY, h = window.innerHeight || 800, ora = Date.now();
      // scorrendo VELOCE niente dissolvenze, nemmeno quelle già partite: un
      // blocco a metà dissolvenza in mezzo allo schermo sembra un buco nero.
      // Si dissolve solo chi scorre con calma, quando l'effetto si vede.
      var veloce = ultimoT && Math.abs(y - ultimoY) / Math.max(16, ora - ultimoT) > 1.5;   // > 1500 px/s
      ultimoY = y; ultimoT = ora;
      if (veloce) while (inCorso.length) inCorso.pop().style.transition = 'none';
      for (var i = posti.length - 1; i >= 0; i--) {
        var p = posti[i];
        if (p[1] < y + h * 1.12 && p[2] > y - h * 0.12) {
          mostra(p[0], veloce || p[1] - y < h * 0.8);
          revObs.unobserve(p[0]);
          posti.splice(i, 1);
        }
      }
    };
    window.addEventListener('scroll', function () {
      if (!attesa && posti.length) { attesa = true; requestAnimationFrame(controlla); }
    }, { passive: true });
    var rimisura = function () { misuraPosti(); controlla(); };
    rimisura();
    window.addEventListener('load', rimisura);
    window.addEventListener('resize', function () { clearTimeout(rimisura.t); rimisura.t = setTimeout(rimisura, 200); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rimisura);
  }

  /* ------------------------------------------------------------- topbar -- */
  // La topbar si nasconde solo dove c'è il cammino da non disturbare (la home).
  // Altrove — catalogo — resta sempre visibile.
  var topbar = document.getElementById('topbar');
  var cammino = document.getElementById('cammino');
  if (topbar) {
    if (cammino && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        topbar.classList.toggle('is-on', !en[0].isIntersecting);
      }, { rootMargin: '-88% 0px 0px 0px' }).observe(cammino);
    } else {
      topbar.classList.add('is-on');
    }
  }

  /* -------------------------------------------------- video della striscia -- */
  // Partono da soli, muti e in loop: la striscia si vede viva.
  // Si montano solo quando la sezione entra in vista e si fermano quando esce
  // o quando la scheda si allontana dal centro (niente decoder sprecati).
  var stripVideos = [];

  function mountStripVideo(btn) {
    if (btn.querySelector('video')) return;
    var v = document.createElement('video');
    v.src = btn.getAttribute('data-video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.addEventListener('loadeddata', function () { btn.classList.add('has-video'); });
    v.addEventListener('error', function () { v.remove(); });
    btn.appendChild(v);
    stripVideos.push(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Il nastro è più largo dello schermo: suonano SOLO le schede davvero
  // inquadrate. Con una decina di cloni fuori campo, tenerli tutti in
  // riproduzione manderebbe in affanno i decoder e farebbe scattare lo scorrimento.
  var sectionOn = false;
  function refreshStripPlayback() {
    var w = window.innerWidth;
    stripVideos.forEach(function (v) {
      var r = v.getBoundingClientRect();
      var inFrame = r.right > -120 && r.left < w + 120;
      var vuoi = sectionOn && inFrame && !document.hidden;
      if (vuoi && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (!vuoi && !v.paused) { try { v.pause(); } catch (e) {} }
    });
  }
  function stripPlayAll(on) { sectionOn = on; refreshStripPlayback(); }
  // lo scorrimento orizzontale cambia chi è inquadrato: si ricontrolla di rado
  var refreshTimer = null;
  window.MB.stripTick = function () {
    if (refreshTimer) return;
    refreshTimer = setTimeout(function () { refreshTimer = null; refreshStripPlayback(); }, 500);
  };

  var stripSec = document.getElementById('banco');
  if (stripSec) {
    if (reduce) {
      // Con reduced-motion niente riproduzione automatica: restano le copertine
      // e il click monta e avvia il video richiesto.
      document.querySelectorAll('.strip__btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = btn.querySelector('video');
          if (!v) { mountStripVideo(btn); return; }
          if (v.paused) v.play(); else v.pause();
        });
      });
    } else if ('IntersectionObserver' in window) {
      var mounted = false;
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          if (!mounted) {
            mounted = true;
            // gli originali e i loro cloni: tutti quelli presenti ora
            document.querySelectorAll('.strip__btn').forEach(mountStripVideo);
          }
          stripPlayAll(true);
        } else { stripPlayAll(false); }
      }, { threshold: 0, rootMargin: '200px 0px' }).observe(stripSec);
    } else {
      document.querySelectorAll('.strip__btn').forEach(mountStripVideo);
    }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stripPlayAll(false); });
  window.MB.stripMount = mountStripVideo;   // per i cloni creati dopo

  /* ------------------------------------------------------------ marquee -- */
  var track = document.getElementById('marqueeTrack');
  if (track) {
    var half = 'Magic Bones · Reliquie del bosco · Pezzi unici · '.repeat(4);
    track.textContent = half + half;   // due copie identiche => ciclo perfetto
  }

  /* ------------------------------------------------- link WhatsApp fissi -- */
  var contactWa = document.getElementById('contactWa');
  if (contactWa) contactWa.href = waLink(window.MB.msgIntro + ' ' + window.MB.msgGeneric);
  var commission = document.getElementById('commissionCta');
  if (commission) commission.href = waLink(window.MB.msgIntro + ' ' + window.MB.msgCommission);

  document.querySelectorAll('.js-ask').forEach(function (a) {
    var host = a.closest('[data-nome]') || a;
    var nome = a.getAttribute('data-nome') || host.getAttribute('data-nome');
    var prezzo = a.getAttribute('data-prezzo') || host.getAttribute('data-prezzo');
    var da = a.getAttribute('data-da') === '1' ? 'da ' : '';
    if (!nome) return;
    a.href = waLink(window.MB.msgIntro + ' ' + window.MB.msgSinglePre + '\n• ' + nome + (prezzo ? ' (' + da + '€ ' + window.MB.euro(prezzo) + ')' : ''));
    a.target = '_blank';
  });

  /* ----------------------------------------------------------- lucciole -- */
  // Canvas 2D deterministico (mai Math.random): gira solo mentre il bosco è
  // in vista. Modulo cancellabile: togli questo blocco e il sito resta uguale.
  (function fireflies() {
    if (!window.MB.flags.fireflies || reduce) return;
    // Su telefono niente lucciole: un canvas che ridisegna gradienti a DPR 3
    // ruba GPU proprio allo scroll del film. Il bosco ha già le sue luci.
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
    if ((navigator.deviceMemory || 8) <= 2) return;
    if ((navigator.connection || {}).saveData) return;
    var stage = document.getElementById('pathStage');
    if (!stage || !document.documentElement.classList.contains('js')) return;

    var N = window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 16 : 28;
    var cv = document.createElement('canvas');
    cv.className = 'fireflies'; cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;';
    var intro = stage.querySelector('.path__intro');
    stage.insertBefore(cv, intro || null);

    var ctx = cv.getContext('2d', { alpha: true });
    var w = 0, h = 0, run = false, vis = false, t0 = 0;
    function pseudo(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
    var f = [];
    for (var i = 0; i < N; i++) {
      f.push({ x: pseudo(i * 3 + 1), y: .18 + pseudo(i * 3 + 2) * .74, r: .9 + pseudo(i * 3 + 3) * 1.7,
               sp: .10 + pseudo(i * 5 + 7) * .3, ph: pseudo(i * 7 + 11) * 6.283, am: .02 + pseudo(i * 11 + 13) * .05 });
    }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = stage.clientWidth; h = stage.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      if (!run) return;
      if (!t0) t0 = now;
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < N; i++) {
        var p = f[i];
        var x = ((p.x + t * p.sp * .05) % 1.15 - .075) * w;
        var y = (p.y + Math.sin(t * .5 + p.ph) * p.am) * h;
        var g = .35 + .65 * (.5 + .5 * Math.sin(t * 1.5 + p.ph * 2));
        var r = p.r * (.85 + g * .4);
        var grd = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
        grd.addColorStop(0, 'rgba(242,200,136,' + (.45 * g).toFixed(3) + ')');
        grd.addColorStop(.35, 'rgba(224,168,95,' + (.14 * g).toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(224,168,95,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r * 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,244,214,' + (.7 * g).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, r * .6, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(draw);
    }
    function start() { if (run || !vis || document.hidden) return; run = true; t0 = 0; requestAnimationFrame(draw); }
    function stop() { run = false; ctx.clearRect(0, 0, w, h); }
    size();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 180); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; vis ? start() : stop(); }, { threshold: 0 }).observe(stage);
    } else { vis = true; start(); }
  })();
})();
