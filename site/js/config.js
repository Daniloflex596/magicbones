/* ==========================================================================
   MAGIC BONES — configurazione
   Tutti i testi sono la voce di Claudia, in prima persona.
   ========================================================================== */
window.MB = {
  /* Numero dal biglietto da visita (+39 328 363 2440), senza "+" né spazi */
  whatsapp: '393283632440',

  /* I prezzi all'italiana: 35 → "35", 35.5 → "35,50" (catalogo, pezzo, carrello, messaggi) */
  euro: function (n) {
    var x = Number(n);
    if (!isFinite(x)) return String(n);
    return Math.round(x * 100) % 100 === 0 ? String(Math.round(x)) : x.toFixed(2).replace('.', ',');
  },

  msgIntro:      'Ciao Claudia! Ti scrivo dal sito di Magic Bones.',
  msgOrderIntro: 'Vorrei chiederti di questi pezzi:',
  msgSinglePre:  'Vorrei chiederti di questo pezzo:',
  msgCommission: 'Vorrei parlarti di una personalizzazione su misura.',
  msgGeneric:    'Vorrei qualche informazione.',

  flags: {
    pathFilm:  true,
    fireflies: true
  },

  /* IL CAMMINO — una scena unica e continua da 10s.
     `srcMobile` è girata nativamente in verticale: finché c'è, il film parte
     anche su telefono (mai un ritaglio del 16:9). */
  film: {
    src:       'assets/video/bosco.mp4',        // orizzontale 16:9, 10 s (PC)
    srcMobile: 'assets/video/bosco-9x16.mp4',   // verticale 9:16, 10 s (telefono)
    dur: 10
  },

  /* LA MIA STORIA, tappa per tappa lungo il sentiero.
     `at` = punto del cammino (0 = si parte, 1 = si arriva a casa mia).
     Distanza minima fra due tappe: 0,13 (la finestra di comparsa è ±0,062,
     quindi due tappe non si sovrappongono mai). La prima non deve partire
     prima di 0,17: il titolo finisce di dissolversi a 0,10. */
  storia: [
    { at: 0.20, side: 'left',  tilt: -2.2,
      foto: 'assets/img/story/ossa-erba.webp',
      extra: [ { foto: 'assets/img/story/colline.webp', alt: 'Colline verdi sotto un cielo carico di nuvole.' } ],
      alt:  'Un cranio e alcune ossa posati nell’erba, tra i fiori gialli.',
      eyebrow: 'Il ritrovamento',
      title: 'Non cerco. Trovo.',
      text:  'Cammino fuori Roma, dove il sentiero si chiude. Un cranio tra le felci, una vertebra sbiancata dalla pioggia: raccolgo quello che il bosco ha già lasciato andare.',
      sign:  'Claudia' },

    { at: 0.40, side: 'right', tilt: 2.0,
      foto: 'assets/img/products/pitone.webp',
      extra: [ { foto: 'assets/img/products/toro-ombra.webp', alt: 'Un teschio di toro in penombra, prima della lavorazione.' } ],
      alt:  'Un osso in lavorazione, tenuto in mano, con la superficie a squame.',
      eyebrow: 'La parte che nessuno vede',
      title: 'Poi viene l’attesa',
      text:  'Pulisco, sbianco, aspetto. A volte per settimane. Un osso non si affretta: decide lui quando è pronto a farsi guardare.' },

    { at: 0.60, side: 'left',  tilt: -1.5,
      foto: 'assets/img/products/mandala.webp',
      extra: [ { foto: 'assets/img/products/cervo-fiorito.webp', alt: 'Cranio con un giardino di fiori dipinto a mano.' } ],
      alt:  'Cranio di cervo con un mandala disegnato a mano libera.',
      eyebrow: 'La mia mano',
      title: 'E allora arriva il colore',
      text:  'Turchesi cuciti uno a uno, mandala tracciati senza matita, fiori secchi, piccole teche. Comincio la sera e alzo la testa che è mattina.' },

    { at: 0.80, side: 'right', tilt: 2.4,
      foto: 'assets/img/story/claudia.webp',
      extra: [ { foto: 'assets/img/story/mercatino.webp', alt: 'Il banco di Magic Bones a un mercatino.' } ],
      alt:  'Claudia tiene tra le mani un teschio di cervo con le corna.',
      eyebrow: 'Chi sono',
      title: 'Mi chiamo Claudia',
      text:  'Ogni pezzo che esce da qui l’ho tenuto in mano per ore. Mi trovi ai mercatini di Roma — o spedisco in tutta Italia, e su misura facciamo insieme.',
      sign:  'Claudia Capitani' }
  ]
};
