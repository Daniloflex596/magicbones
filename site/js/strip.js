/* ==========================================================================
   MAGIC BONES — la striscia video
   Scorre da sola in orizzontale, a tutta larghezza. La puoi afferrare e
   trascinare; quando lasci, riprende ad andare — senza scatti, tornando alla
   sua velocità con un rientro morbido invece che con uno stacco netto.

   Nastro infinito: la lista viene duplicata e la posizione avvolge sulla
   larghezza di una copia, quindi non c'è mai un bordo né un salto.
   ========================================================================== */
(function () {
  'use strict';

  var strip = document.getElementById('strip');
  var track = document.getElementById('stripTrack');
  if (!strip || !track) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BASE = 46;              // px/s: abbastanza svelta ma leggibile
  var pos = 0;                // scorrimento corrente in px
  var vel = BASE;             // velocità corrente
  var half = 0;               // larghezza di UNA copia della lista
  var running = false, visible = false, lastT = 0;
  var dragging = false, pointerId = null, lastX = 0, lastMoveT = 0, dragVel = 0;
  var released = 0;           // istante del rilascio, per il rientro morbido

  /* ------------------------------------------------ nastro infinito -- */
  var originals = Array.prototype.slice.call(track.children);
  function duplicate() {
    // rimuove i cloni precedenti e ne rimette abbastanza da coprire 2 schermi
    Array.prototype.slice.call(track.querySelectorAll('[data-clone]')).forEach(function (n) { n.remove(); });
    var oneWidth = originals.reduce(function (s, el) {
      return s + el.getBoundingClientRect().width + gap();
    }, 0);
    // Se gli originali non bastano a riempire lo schermo, li ripete finché ci riescono
    var copies = Math.max(1, Math.ceil((window.innerWidth * 2) / Math.max(1, oneWidth)));
    for (var c = 0; c < copies; c++) {
      originals.forEach(function (el) {
        var clone = el.cloneNode(true);
        clone.setAttribute('data-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        // i cloni non devono essere raggiungibili da tastiera
        var b = clone.querySelector('button');
        if (b) {
          b.tabIndex = -1;
          // un <video> clonato non riparte da solo: si rimonta pulito
          var old = b.querySelector('video');
          if (old) old.remove();
          b.classList.remove('has-video');
          if (window.MB && window.MB.stripMount) window.MB.stripMount(b);
        }
        track.appendChild(clone);
      });
    }
    half = oneWidth * (copies >= 1 ? 1 : 1);
    // la larghezza da avvolgere è quella degli originali una volta
    half = oneWidth;
  }
  function gap() {
    var g = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0');
    return isNaN(g) ? 0 : g;
  }

  function render() {
    // avvolgimento: pos resta sempre dentro [-half, 0)
    if (half > 0) {
      while (pos <= -half) pos += half;
      while (pos > 0) pos -= half;
    }
    track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
  }

  /* ---------------------------------------------------------- loop -- */
  function loop(now) {
    if (!running) return;
    var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
    lastT = now;

    if (!dragging) {
      // Rientro morbido: dopo il rilascio la velocità torna a BASE con un
      // damping frame-rate-independent, non con un cambio secco.
      var k = 1 - Math.exp(-2.6 * dt);
      vel += (BASE - vel) * k;
      pos -= vel * dt;
      render();
    }
    // chi è inquadrato cambia mentre il nastro scorre: si aggiorna a intervalli
    if (window.MB && window.MB.stripTick) window.MB.stripTick();
    requestAnimationFrame(loop);
  }
  function start() {
    if (running || !visible || document.hidden || reduce) return;
    running = true; lastT = 0;
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  /* ----------------------------------------------------- trascinamento -- */
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; pointerId = e.pointerId;
    lastX = e.clientX; lastMoveT = performance.now(); dragVel = 0;
    strip.classList.add('is-dragging');
    strip.setPointerCapture && strip.setPointerCapture(pointerId);
  }
  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    var now = performance.now();
    var dx = e.clientX - lastX;
    var dt = Math.max(1, now - lastMoveT) / 1000;
    pos += dx;
    // velocità del gesto in px/s (positiva = verso sinistra, come l'auto-scroll)
    dragVel = -dx / dt;
    lastX = e.clientX; lastMoveT = now;
    render();
  }
  function onUp(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    strip.classList.remove('is-dragging');
    try { strip.releasePointerCapture && strip.releasePointerCapture(pointerId); } catch (err) {}
    pointerId = null;
    // Riparte dall'inerzia del gesto e rientra dolcemente verso BASE.
    // Limitata perché una sferzata non deve far volare via il nastro.
    var v = Math.max(-900, Math.min(900, dragVel));
    vel = BASE + (v - BASE) * 0.55;
    released = performance.now();
    start();
  }

  strip.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  // Un trascinamento non deve far partire il click sul video
  strip.addEventListener('click', function (e) {
    if (strip.dataset.moved === '1') { e.preventDefault(); e.stopPropagation(); strip.dataset.moved = '0'; }
  }, true);
  strip.addEventListener('pointermove', function () { if (dragging) strip.dataset.moved = '1'; }, { passive: true });
  strip.addEventListener('pointerdown', function () { strip.dataset.moved = '0'; });

  // Rallenta (non si ferma) quando il puntatore è sopra: si legge meglio
  strip.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'mouse') BASE = 16;
  });
  strip.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') BASE = 46;
  });

  /* ------------------------------------------------------------ vita -- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0 }).observe(strip);
  } else { visible = true; start(); }

  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { duplicate(); render(); }, 180);
  });

  // avvio: attende le immagini per misurare bene le larghezze
  function init() { duplicate(); render(); start(); }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  // primo montaggio comunque, così non resta vuota prima del load
  duplicate(); render();
})();
