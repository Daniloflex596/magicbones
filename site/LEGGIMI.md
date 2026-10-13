# Magic Bones — il sito

> **I pezzi li gestisce Claudia dall'app Bottega** (`/bottega/`, col PIN):
> nuovo pezzo, modifica, venduto. Ogni modifica è un commit sull'archivio
> GitHub e Cloudflare ripubblica da solo. Come funziona e come si configura:
> `../README.md`.

Sito statico: HTML + CSS + JavaScript. **Nessuna build, nessuna dipendenza.**
Direzione: il bosco col film in apertura + uno stile **celtico / fatato**
(onciale, oro dei nodi, verde delle fate) su tutto il resto.

Tre pagine:
- `index.html` — il bosco: cammino filmato con la storia, vetrina dei pezzi
  (il "sentiero"), la casetta che porta al catalogo, video dal laboratorio,
  contatti.
- `catalogo.html` — tutti i pezzi, come porte ad arco.
- `pezzo.html?id=…` — la pagina di un pezzo: galleria di foto, descrizione,
  "Aggiungi alla raccolta".

## Provarlo in locale

Dalla cartella del progetto (quella che contiene `site/`):
```bash
python strumenti/server.py
# poi apri http://127.0.0.1:8899
```
Usa questo server e non `python -m http.server`: dice al browser di non
tenere copie vecchie delle pagine. Con il server semplice, passando da una
pagina all'altra il browser poteva mostrare versioni passate (stili e video
di prima) e il sito sembrava "scoordinato".
Non aprire i file con doppio clic: il film e la casetta si caricano via
`fetch`, che il browser blocca su `file://`.

---

## Le cose che cambierai più spesso

### 1. Il cammino d'apertura — `js/config.js` e `js/path.js`
È corto e GUIDATO, a fermate (`fermate: [0, 0.5, 1]`): il titolo sul bosco →
a metà sentiero la storia con le foto → la casa ("Benvenuto a casa mia").
Ogni gesto (rotella, trackpad, strisciata, frecce) è un passo: il film va da
solo alla fermata dopo, sempre con lo stesso movimento; il gesto dopo la
casa entra nel sito. Nel cammino la pagina non scorre col dito: il palco è
appiccicato allo schermo e si anima solo il film.

Il film NON è un video: 120 immagini WebP per formato in
`assets/film/computer/` (1280×720) e `assets/film/telefono/` (540×960),
disegnate su una tela. Il film ne usa una su due (`film.*.usa: 60`): ognuna
si decodifica UNA volta appena arriva (ImageBitmap) e resta pronta, perché
disegnarle dalla `<img>` faceva ridecodificare a Chrome ogni immagine sul
thread principale (misurato: il film andava a scatti sui telefoni).
Nuovi video → `python strumenti/film.py a16x9.mp4 b9x16.mp4`, poi in
`js/config.js` → `film` aggiorna `n` e `versione +1`.

### 2. Colori e font — `css/tokens.css` (UN SOLO FILE)
Tutto il sito legge colori e caratteri da lì: `--forest` (fondo verde-bruno),
`--gold` (oro miele), `--amber` (luce del sole), `--fae` (verde foglia),
`--violet` (lavanda), `--paper`, `--brand-red` (amanita)…
La palette viene dal bosco dorato del film d'apertura.
`--disp` (titoli), `--caps` (etichette), `--body` (testo).
I font celtici (Uncial Antiqua, Cinzel, Cormorant Garamond) per ora arrivano
da Google Fonts (link in testa a ogni pagina): **prima di pubblicare vanno
ospitati in `assets/fonts/`**. Alcune sfumature d'oro e di luce sono scritte
direttamente nei CSS dei componenti: con la palette nuova vanno ripassate.

La casetta ha i suoi colori dentro il disegno: per ricolorarla si cambiano in
`../strumenti/casetta.py` e si rilancia (vedi sotto).

### 3. I pezzi, i prezzi, le foto — l'app Bottega (`bottega/`)
**I pezzi stanno in `data/pezzi.js`, e li cambia Claudia dall'app**: foto,
nome, prezzo, categoria, descrizione, venduto. Da lì nascono il catalogo, i
filtri (una categoria nuova compare da sola) e la pagina di ogni pezzo
(`pezzo.html?id=…`). `js/pezzi.js` li legge e basta: i venduti spariscono dal
catalogo ma la loro pagina resta, con scritto "Venduto".
- A mano si può ancora: `data/pezzi.js` è JSON puro (vedi la forma in
  `js/pezzi.js`), ma poi va fatto il commit come per il resto del sito.
- Nome e prezzo nel messaggio WhatsApp arrivano da lì.

⚠️ La vetrina della home (`index.html`, sezione `#vetrina`) è scritta a mano
perché è un racconto: se cambi nome o prezzo di quei quattro pezzi, cambialo
anche lì.

### 4. La storia nel bosco — `js/config.js`, blocco `storia`
Una scena sola, alla fermata di metà sentiero (`at: 0.5`). Su computer due
foto ad arco ai lati e il racconto al centro; su telefono la prima foto
sopra e il racconto sotto:
```js
{ at: 0.5,
  foto: 'assets/img/story/ossa-erba.webp', alt: '…',
  extra: [ { foto: '…', alt: '…' } ],     // la seconda foto (solo computer)
  eyebrow: 'La mia storia', title: 'Non cerco. Trovo.', text: '…',
  sign: 'Claudia' }
```
Il seguito del racconto è nella sezione `#claudia` subito dopo l'arrivo.
La storia completa resta nella versione senza JavaScript, in fondo al
cammino in `index.html` (`.path__fallback-list`).

### 5. WhatsApp — `js/config.js`
`whatsapp: '393283632440'` — da lì derivano tutti i pulsanti.

### 6. Dopo aver modificato CSS o JS
In cima alle pagine i file hanno un `?v=61`: alza il numero (`?v=62`…) quando
pubblichi, così i browser non usano la versione vecchia dalla cache.

### 6b. Fluidità sul telefono: le regole misurate
- Niente `backdrop-filter`, `filter` animati o maschere su cose che si
  muovono o scorrono: si rifanno a ogni fotogramma (ombre "normali" sì).
- Le animazioni infinite si fermano fuori dallo schermo (`.anim-fuori` in
  `css/base.css`, gestita da `js/ui.js`).
- Ascoltatori che possono bloccare lo scorrimento (rotella/dito non
  passivi) solo dove servono e solo finché servono (`js/path.js` → ascolta).
- I video della striscia: 4 in tutto, si scaricano quando arrivano in vista
  e suona solo quello inquadrato (`js/strip.js`).

---

### 7. Il menu (uguale su tutte le pagine)
La barra in alto e il piè di pagina hanno gli stessi collegamenti ovunque:
La storia · I pezzi · Il catalogo · Scrivimi (su telefono in un menu a
tendina). Dal catalogo o da un pezzo, "I pezzi" e "Scrivimi" portano dritti
alla sezione della home. Nella home la barra compare finito il film.

## Com'è fatto

```
site/
  index.html        il bosco: cammino + storia, vetrina, casetta, video, contatti
  catalogo.html     tutti i pezzi (porte e filtri costruiti dai dati)
  pezzo.html        la pagina di un pezzo: galleria, descrizione, raccolta
  css/
    tokens.css      COLORI E FONT (l'unico posto da toccare)
    base.css        reset, titoli, occhielli, bottoni, accessibilità
    sections.css    home: cammino col film, striscia video, contatti
    celtic.css      componenti condivisi: nodi, barra, piè di pagina,
                    vetrina "sentiero", casetta
    celtic-pagine.css  catalogo e pagina del pezzo
    cart.css        la raccolta (carrello) e i messaggi
  js/
    config.js       WhatsApp, film, storia, interruttori
    pezzi.js        legge data/pezzi.js (i pezzi: li aggiorna l'app Bottega)
    ui.js           comparse, barra, video della striscia, scritta in fondo
    path.js         il cammino filmato guidato dallo scroll
    knots.js        disegna nodi, ogham, simboli e trecce
    celtic.js       tralcio della vetrina, sigilli, casetta viva, lanterna
    catalogo-cel.js porte e filtri del catalogo
    pezzo.js        pagina del pezzo e galleria
    cart.js         la raccolta → messaggio WhatsApp
    strip.js        la striscia video trascinabile
  assets/
    video/          bosco.mp4 (16:9, PC) · bosco-9x16.mp4 (telefono)
    reel/           i video del laboratorio + copertine
    img/            prodotti, storia, poster, logo, casetta.svg
    fonts/          Caveat (in uso) · Playfair, Jost (non più usati)
```

### La vetrina: il sentiero dei pezzi
Un tralcio intrecciato scende al centro mentre scorri. A ogni tappa c'è un
sigillo che si accende quando la punta luminosa lo raggiunge, con foto e
testo alternati. I. il pezzo del mese (porta più grande, con un alone caldo);
II–IV. i tre più amati. Sui pezzi nessuna decorazione: solo la foto a porta
col filetto d'oro, nome e prezzo. Cliccando si entra nella pagina del pezzo.
Per aggiungere una tappa: copia un `<li class="cel-stop">` e alterna
`data-side="left"` / `"right"`; il tralcio si rimisura da solo.

### La casetta nel bosco (porta al catalogo)
In fondo al sentiero il tralcio arriva alla chiave di volta e la casetta si
accende (finestra e lanterne). Passandoci sopra col mouse (o col tasto Tab)
la porta si apre e la luce di casa esce sugli scalini. Fumo dal comignolo,
lanterne che dondolano, candele, lucciole: tutto animato e fermo con
`prefers-reduced-motion`.
- Il disegno è `assets/img/casetta.svg`, **generato** da
  `../strumenti/casetta.py` (`python strumenti/casetta.py` dalla cartella del
  progetto). Non modificare l'SVG a mano: cambia lo script e rilancia, poi
  alza `casetta.svg?v=…` in `index.html`.
- Nella pagina c'è come immagine; `js/celtic.js` la inserisce "viva" quando
  ci si avvicina, così risponde al mouse e alla luce.

---

## Accessibilità e fallback
- Senza JavaScript: la storia è in versione testo, la casetta è un'immagine
  ferma, il catalogo invita a scrivere su WhatsApp.
- Con `prefers-reduced-motion`: nessun film scaricato, tralcio già intero,
  sigilli già accesi, niente animazioni decorative.
- Tutti i pezzi si raggiungono da tastiera; i bottoni hanno il fuoco visibile.

## Da confermare con Claudia
1. **I testi della home** (storia, vetrina) sono scritti nella sua voce: da far
   leggere e approvare. Anche le tre note della pagina del pezzo.
2. **Il "pezzo del mese"** va cambiato a mano (vetrina in `index.html` e
   `"mese": true` in `data/pezzi.js`).
3. **Il link Vinted** è solo testo: manca l'URL del profilo.

## Fuori dal sito (non si pubblicano)
- `../site-backup-2026-10-07/` — la versione di partenza, intatta.
- `../site-celtico/` — la prova tutta celtica da cui è nata questa direzione.
- `../archivio/` — le due anteprime del catalogo (A e B) e i file non più usati.
- `../strumenti/casetta.py` — il generatore della casetta.
- `../strumenti/server.py` — il server locale per provarlo.
- `../gemini_generated_video_*.mp4` — i video originali da cui sono nati
  `bosco.mp4` e `bosco-9x16.mp4`.
