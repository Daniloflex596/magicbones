/**
 * ============================================================================
 *  stations.js — le inquadrature del Sottobosco
 * ============================================================================
 *  Sette waypoint. Ognuno nasce dalla domanda che impone la skill — "cosa deve
 *  stare in quadro QUI?" — non da coordinate scelte a occhio.
 *
 *  L'arco registico e quello canonico:
 *    0  establishing  — camera alta e arretrata, tutto lo spazio in vista
 *    1-4 soggetto     — camera DI TRE QUARTI, si passa ACCANTO ai pezzi
 *    5  panoramica    — arretra e sale, da la scala del sottobosco
 *    6  contro-campo  — si volta indietro: vedi tutto quello che hai attraversato
 *
 *  REGOLA che governa le stazioni-soggetto: mai frontali. Un waypoint frontale
 *  su oggetti allineati produce esattamente il difetto gia bocciato dalla
 *  committente ("guardo un oggetto in una scatola"): li vedi in colonna, uno
 *  copre l'altro, e li leggi come una vetrina. Di tre quarti invece ci passi
 *  accanto, e la parallasse tra le due curve fa il resto.
 *
 *  Scala del mondo: un cappello di amanita e largo ~1.2 unita, un gambo alto
 *  ~2.4. La camera vive tra y 0.6 e 0.9 — SOTTO il livello dei cappelli. E
 *  questo che da il "sono alto quanto un fungo": non lo si dice, lo si inquadra.
 * ============================================================================
 */

export const STATIONS = [
  // 0 · LA SOGLIA — establishing.
  // In quadro: la volta rossa dei cappelli in lontananza, il muschio che corre
  // via, il buio ai lati. Camera piu alta del resto del percorso: e l'unico
  // momento in cui si guarda il sottobosco dall'esterno, subito prima di
  // entrarci. Vende l'idea nei primi 600 ms.
  { p: [0, 1.9, 10.0], l: [0, 0.9, 3.0] },

  // 1 · IL BOSCO DELLE OSSA — il signature moment.
  // In quadro: TUTTE E TRE le colonne d'osso (z 5.9 / 4.7 / 3.5) piu i gambi
  // veri che le mimetizzano. La camera sta a DESTRA e guarda a SINISTRA in
  // diagonale lungo la fila: e il taglio che le fa scorrere una dopo l'altra
  // invece di allinearle in colonna una davanti all'altra.
  //
  // La z della camera (7.2) sta DIETRO la prima colonna di proposito: a z 5.0
  // la colonna a z 5.9 finiva alle spalle della camera e la fila non si
  // leggeva — si vedeva una colonna sola con una pallina in cima.
  { p: [1.75, 0.95, 7.2], l: [-0.9, 0.95, 4.0] },

  // 2 · I TESCHI DIPINTI — barattoli di vetro tra le radici.
  // Il logo di Claudia e una mano che regge un barattolo con dentro un teschio:
  // il sottobosco e punteggiato di quei barattoli, ognuno illuminato da dentro,
  // ognuno con una sua foto vera. Camera a sinistra, soggetti a destra.
  { p: [-1.5, 0.72, 1.2], l: [1.7, 0.7, -0.8] },

  // 3 · IL FILO D'OSSO — gioielli appesi a un arco di radice.
  // Unica stazione che guarda IN ALTO: la camera passa SOTTO l'arco e i
  // ciondoli pendono nel quadro. Cambiare asse di sguardo qui rompe la
  // monotonia dell'orizzonte senza aggiungere un solo effetto.
  { p: [1.0, 0.62, -2.6], l: [-1.3, 1.45, -4.6] },

  // 4 · IL FUOCO RITUALE — candele e altari.
  // Punto di svolta della luce: fin qui il sottobosco e illuminato dal muschio
  // (freddo, giallo-verde) e dai cappelli (rosso). Qui entra la fiamma, calda.
  // Il cambio di temperatura e la battuta emotiva, non un effetto.
  { p: [-1.7, 0.7, -6.0], l: [1.2, 0.5, -7.8] },

  // 5 · PANORAMICA — respiro e scala.
  // La camera sale sopra i cappelli per un attimo: si capisce quanto e vasto il
  // sottobosco attraversato e quanto si era piccoli. Senza questa stazione la
  // scala non si legge mai.
  { p: [0.3, 2.8, -9.5], l: [0, 0.6, -12.5] },

  // 6 · IL BANCO DI CLAUDIA — contro-campo + chiusura intima.
  // La camera si VOLTA e guarda indietro lungo tutto il percorso, ora acceso.
  // La skill: il contro-campo "e quasi sempre cio che resta impresso", e va
  // progettato dall'inizio. Il banco da lavoro sta in primo piano, la CTA al
  // negozio si posa qui.
  { p: [0.1, 1.15, -12.6], l: [0.2, 1.0, 2.0] },
];

/**
 * Mappatura sezione DOM -> stazione. E il contratto che tiene testo e spazio
 * sulla STESSA timeline: quando una sezione e al centro del viewport, la camera
 * e al suo waypoint.
 *
 * `range: [a, b]` (due ancore) sulle stazioni-soggetto: la camera si POSA e va
 * in travelling per tutta la sezione invece di ripartire a meta lettura — e il
 * "hold leggibile" che la skill impone dopo ogni trasformazione.
 * Ancora singola dove invece si passa e basta.
 */
export const SECTION_MAP = [
  { el: 'atto-soglia', station: 0 },
  { el: 'atto-ossa', range: [1, 1.7] },     // il signature moment vuole tempo
  { el: 'atto-teschi', range: [2, 2.6] },
  { el: 'atto-gioielli', range: [3, 3.5] },
  { el: 'atto-fuoco', range: [4, 4.6] },
  { el: 'atto-panoramica', station: 5 },
  { el: 'atto-banco', station: 6 },
];

export const LAST_STATION = 6;
