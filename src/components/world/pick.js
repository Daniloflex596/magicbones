/**
 * ============================================================================
 *  pick.js — toccare un oggetto nel mondo
 * ============================================================================
 *  Traduce un tocco sul canvas in un `productId`. Non apre niente e non tocca
 *  il carrello: chiama una callback, e chi la riceve aziona il DOM. Il mondo
 *  non e mai la fonte di verita dell'acquisto — e solo un telecomando molto
 *  bello per bottoni che esistono gia nella pagina.
 *
 *  IL FILTRO TOCCO/TRASCINAMENTO E IL CUORE DI QUESTO FILE.
 *  Su un telefono ogni scroll comincia con un `pointerdown` sul canvas: senza
 *  filtro, ogni singolo swipe per scendere aprirebbe una scheda prodotto e
 *  l'esperienza diventerebbe inusabile. Un tocco vale solo se il dito si e
 *  spostato di meno di 10 px ed e rimasto giu meno di 400 ms.
 * ============================================================================
 */
import * as THREE from 'three';

const SOGLIA_SPOSTAMENTO = 10; // px
const SOGLIA_DURATA = 400; // ms

export function createPicker({ canvas, camera, getPickables, onPick, onHover }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  let giu = null; // { x, y, t } del pointerdown
  let hoverAttuale = null;
  let ultimoHover = 0;

  function intersecato(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    // Fuori dal canvas: nessun bersaglio (il pointerup puo arrivare altrove).
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const bersagli = getPickables();
    if (!bersagli.length) return null;
    const hit = raycaster.intersectObjects(bersagli, false)[0];
    return hit ? hit.object.userData.productId || null : null;
  }

  function onPointerDown(e) {
    giu = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  }

  function onPointerUp(e) {
    if (!giu) return;
    const dx = e.clientX - giu.x;
    const dy = e.clientY - giu.y;
    const spostamento = Math.hypot(dx, dy);
    const durata = e.timeStamp - giu.t;
    giu = null;

    // Trascinamento (scroll) oppure pressione lunga: non e un tocco.
    if (spostamento > SOGLIA_SPOSTAMENTO || durata > SOGLIA_DURATA) return;

    const id = intersecato(e.clientX, e.clientY);
    if (id) onPick(id);
  }

  function onPointerCancel() {
    giu = null;
  }

  /**
   * Hover: SOLO rinforzo visivo su puntatore preciso. Non e mai l'unica via per
   * scoprire che un oggetto e toccabile — su mobile l'hover non esiste, e la
   * skill lo elenca tra i falsi segnali di interattivita.
   * Limitato a ~15 Hz: un raycast per frame di movimento e spreco puro.
   */
  function onPointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    if (e.timeStamp - ultimoHover < 66) return;
    ultimoHover = e.timeStamp;

    const id = intersecato(e.clientX, e.clientY);
    if (id === hoverAttuale) return;
    hoverAttuale = id;
    canvas.style.cursor = id ? 'pointer' : '';
    onHover?.(id);
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerCancel, { passive: true });
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });

  return {
    dispose() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.style.cursor = '';
    },
  };
}
