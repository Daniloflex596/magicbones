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

  /* IL CAMMINO — una scena unica e continua (10 s di bosco).
     Non è un video ma una SEQUENZA DI IMMAGINI disegnata su una tela: su
     iPhone (Safari e Chrome) il video guidato dallo scroll mostrava solo 3
     immagini; le immagini vanno uguali su ogni browser. Le ricava dai video
     strumenti/film.py (che stampa il numero da mettere qui). Il telefono ha
     la sua sequenza verticale 9:16: mai un ritaglio del 16:9. */
  film: {
    versione: 1,   // +1 ogni volta che rigeneri le immagini: chi è già passato le riscarica
    // n = immagini nella cartella; usa = quante ne usa il film (una su due:
    // restano decodificate in memoria, e sul telefono la memoria conta)
    computer: { cartella: 'assets/film/computer/', n: 120, usa: 60 },   // 1280×720
    telefono: { cartella: 'assets/film/telefono/', n: 120, usa: 60 }    // 540×960
  },

  /* IL CAMMINO A FERMATE (js/path.js). Ogni gesto — un colpo di rotella,
     una strisciata, una freccia — porta alla fermata dopo; il gesto oltre
     l'ultima entra nel sito.
     0 = il titolo sul bosco · 0.5 = a metà sentiero, la storia · 1 = la casa */
  fermate: [0, 0.5, 1],

  /* LA MIA STORIA: una scena sola, a metà sentiero (`at` = fermata).
     Il resto del racconto (il colore, chi sono) è nella sezione #claudia
     subito dopo l'arrivo. Su computer due foto ai lati e il testo al
     centro; su telefono la prima foto sopra e il testo sotto. */
  storia: [
    { at: 0.5,
      foto: 'assets/img/story/ossa-erba.webp',
      alt:  'Un cranio e alcune ossa posati nell’erba, tra i fiori gialli.',
      extra: [ { foto: 'assets/img/products/mandala.webp', alt: 'Cranio di cervo con un mandala disegnato a mano libera.' } ],
      eyebrow: 'La mia storia',
      title: 'Non cerco. Trovo.',
      text:  'Cammino fuori Roma, dove il sentiero si chiude, e raccolgo quello che il bosco ha già lasciato andare. Pulisco, aspetto — a volte per settimane — e poi arriva il colore.',
      sign:  'Claudia' }
  ]
};
