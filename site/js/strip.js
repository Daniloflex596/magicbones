/* ==========================================================================
   MAGIC BONES — la striscia video
   Una fila di porte ad arco che si scorre col dito (o trascinandola col
   mouse), con lo scorrimento NATIVO del browser: niente nastro che si muove
   da solo, niente copie, niente animazione a ogni fotogramma.

   Prima (misurato): il nastro infinito clonava le schede e ogni clone
   caricava il suo video — fino a 20 video insieme sul computer, 16 MB e
   decodificatori sempre accesi mentre si scorreva la pagina.
   Adesso: 4 video, ognuno si scarica solo quando la sua porta arriva in
   vista e suona solo mentre è inquadrato per più di metà.
   ========================================================================== */
(function () {
  'use strict';

  var strip = document.getElementById('strip');
  if (!strip) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var btns = Array.prototype.slice.call(strip.querySelectorAll('.strip__btn'));

  function monta(btn) {
    var v = btn.querySelector('video');
    if (v) return v;
    v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.addEventListener('playing', function () { btn.classList.add('has-video'); });
    v.addEventListener('error', function () { v.remove(); btn.classList.remove('has-video'); });
    v.src = btn.getAttribute('data-video');
    btn.appendChild(v);
    return v;
  }
  function suona(btn, si) {
    var v = si ? monta(btn) : btn.querySelector('video');
    if (!v) return;
    if (si && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else if (!si && !v.paused) v.pause();
  }

  /* ---------------------------------------------- chi è inquadrato -- */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (e) { suona(e.target, e.isIntersecting && e.intersectionRatio >= 0.55 && !document.hidden); });
    }, { threshold: [0, 0.55] });
    btns.forEach(function (b) { io.observe(b); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) btns.forEach(function (b) { suona(b, false); });
      else btns.forEach(function (b) { io.unobserve(b); io.observe(b); });   // si ricontrolla chi è in vista
    });
  }

  // col tocco (o con reduced-motion): avvia / ferma quel video
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (strip.dataset.moved === '1') return;
      var v = b.querySelector('video');
      suona(b, !v || v.paused);
    });
  });

  /* ------------------------------- trascinare col mouse (computer) -- */
  // col dito e col trackpad lo scorrimento è quello del browser; il mouse
  // non sa scorrere di lato, quindi si afferra la fila e la si trascina
  var giu = false, x0 = 0, s0 = 0;
  strip.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    giu = true; x0 = e.clientX; s0 = strip.scrollLeft; strip.dataset.moved = '0';
  });
  window.addEventListener('pointermove', function (e) {
    if (!giu) return;
    var dx = e.clientX - x0;
    if (Math.abs(dx) > 4 && strip.dataset.moved !== '1') { strip.dataset.moved = '1'; strip.classList.add('is-dragging'); }
    if (strip.dataset.moved === '1') strip.scrollLeft = s0 - dx;
  }, { passive: true });
  window.addEventListener('pointerup', function () {
    if (!giu) return;
    giu = false; strip.classList.remove('is-dragging');
    setTimeout(function () { strip.dataset.moved = '0'; }, 0);   // il click che segue il trascinamento non conta
  });
})();
