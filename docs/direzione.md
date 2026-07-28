# Magic Bones — DesignBrief · StyleBible · Storyboard

Documento di direzione. Scritto **prima** di qualunque animazione, come impone
`immersive-web-director` ("Direction before effects"). Se il codice e questo
documento divergono, e il codice a essere sbagliato.

---

## 0. Perche il sito precedente e stato buttato

Verdetto della committente: *"piatto"*, *"non un'esperienza immersiva unica"*.
La diagnosi tecnica, non l'impressione:

1. **Metafora spaziale assente.** Il sito era una pagina con delle carte che si
   girano. Le sezioni erano *blocchi di pagina*, non *posti*. La skill
   `immersive-web-engine` e esplicita: «un'unica scena in cui le sezioni di
   contenuto sono **posti reali** nello spazio, e scorrere significa
   **attraversarli**». Non era questo.
2. **Errore di correzione.** Quando la committente aveva bocciato "l'oggetto 3D
   dentro la scatola", il motore 3D e stato rimosso del tutto. La regola d'oro
   della skill dice l'opposto: **"MAI UN PUB"** — si cambia il *tema*, il
   motore resta. Tolto il motore, restava una landing.
3. **Palette desaturata.** I token erano un notturno "di buon gusto"
   (`#0c0f1a` blu-grigio, muschio `#3f5d3a` smorto) inventato a tavolino,
   mentre il biglietto da visita di Claudia e **saturo e illustrato**: rosso
   vermiglio, muschio giallo-acido, viola shocking, petrolio. Il sito non
   somigliava al suo brand.
4. **Effetti senza regia.** Micro-animazioni sparse ovunque, nessun fuoco
   dominante. `immersive-web-director`: «one dominant focus per beat, at most
   two competing animated focal elements». Il risultato era rumoroso *e*
   piatto insieme — che non e una contraddizione: rumore senza gerarchia
   legge come piattezza.

## 1. Cosa si riusa e cosa si butta

**Si butta**: l'intero strato visivo, la home, la meccanica delle flip card,
`sigil.ts`, la palette, i layout.

**Si riusa** (e roba buona, verificata): le 12 schede prodotto in
`src/content/products/`, le 8 foto reali estratte dai suoi post, il modulo
carrello (store Zustand + drawer + form richiesta ordine + messaggio
WhatsApp/email, appena corretto per i pezzi unici), lo scaffolding SEO,
`astro.config.mjs`, il workflow di deploy su `gh-pages`, i contatti verificati.

---

## 2. StyleBible

### Palette — campionata dal biglietto da visita, non inventata

Il biglietto "amanite su fondo notturno" e stato fotografato sotto luce calda.
I valori sono presi **dopo** bilanciamento del bianco sull'etichetta bianca
"MAGIC BONES" e recupero della saturazione persa nello scatto.

| Ruolo | Token | Hex | Dove sta sulla card |
|---|---|---|---|
| Suolo profondo | `--soil-deep` | `#0f0b1e` | il nero tra i gambi |
| Suolo | `--soil` | `#1a1533` | fondo dominante |
| Suolo illuminato | `--soil-lift` | `#241d3d` | dove il fungo illumina il terreno |
| Amanita | `--amanita` | `#e8402c` | cappello in piena luce |
| Amanita profonda | `--amanita-deep` | `#c0281a` | bordo del cappello |
| Lamelle | `--amanita-flesh` | `#d4604e` | sotto il cappello |
| Puntini | `--amanita-spot` | `#fdf8ee` | le macchie bianche |
| Osso chiaro | `--bone-light` | `#f2e0c4` | gambo illuminato |
| Osso | `--bone` | `#dcc59e` | gambo medio |
| Osso in ombra | `--bone-shade` | `#b89a72` | gambo in ombra |
| Magenta | `--shroom-magenta` | `#d94ec0` | funghetti rosa shocking |
| Viola | `--shroom-violet` | `#8b5fc9` | funghetti viola |
| Muschio | `--moss` | `#d8cb2a` | muschio giallo-acido |
| Muschio profondo | `--moss-deep` | `#a89818` | muschio in ombra |
| Petrolio | `--petrol` | `#2d7a9e` | foglie blu |
| Etichetta | `--label` | `#fdfbf6` | la carta bianca del lettering |
| Inchiostro | `--ink` | `#7d1f18` | il rosso scuro di "MAGIC BONES" |

**Regola di controllo**: se un colore sembra "sobrio ma spento", e sbagliato.
La card di Claudia e satura. Il sito deve esserlo.

**Controlli di contrasto** (richiesti esplicitamente dalla committente): ogni
accoppiata testo/fondo usata per contenuto reale deve superare **4.5:1**
(WCAG AA). I colori saturi vanno usati per *superfici e luce*, non per testo
piccolo. Il testo vive su `--bone-light` su `--soil` (rapporto ≈ 12:1) o su
`--ink` su `--label` (≈ 9:1). Verificato in QA, non a occhio.

### Tipografia

- **Display**: `Cormorant Garamond` — serif ad alto contrasto, imparentato con
  il lettering inciso di "MAGIC BONES" sull'etichetta.
- **Corpo**: `Jost` — geometrico caldo, regge bene sopra le superfici scure.
- **Flash**: `Pirata One` — solo per i badge tipo "pezzo unico", mai per corpo
  o prezzi. E la voce del logo tattoo-flash, va dosata.

---

## 3. Experience mode

Modi possibili (`immersive-web-director`): `editorial_dom`, `scroll_film`,
`realtime_webgl`, `hybrid`.

**Scelto: `hybrid`** — DOM semantico per tutto il negozio, piu **una** firma
`realtime_webgl` sulla home.

- `scroll_film` **escluso**: richiede un film pre-renderizzato. Claudia non ha
  ancora girato i video, e la pipeline originale della skill `scroll-world`
  dipende da generazione video AI a pagamento non disponibile qui. Quando i
  video arriveranno diventeranno materiale della galleria, non il motore.
- `realtime_webgl` puro **escluso**: il catalogo e un e-commerce, va indicizzato
  e deve funzionare senza WebGL. Metterlo dentro il mondo 3D sarebbe peso morto
  (la skill lo dice: per e-commerce «il 3D e peso morto e danneggia
  performance e SEO»).
- `hybrid` **vince**: l'esperienza porta il valore percepito sulla home, il
  negozio resta veloce, accessibile e indicizzabile. Il mondo 3D e un'isola
  caricata **solo dopo** capability detection.

**Budget di capacita**: `none` (reduced-motion / saveData / no-WebGL /
deviceMemory ≤ 2) non scarica nemmeno il chunk 3D e riceve un fallback statico
completo. `low` (mobile): dpr ≤ 1.35, meno istanze, meno luci. `high`: dpr ≤ 2,
antialias.

---

## 4. La metafora spaziale — "Il Sottobosco"

Il verbo del viaggio: **addentrarsi**, ma a livello del suolo.

Non un bosco visto da altezza d'uomo: **il visitatore e alto quanto un fungo**.
La camera si muove *dentro* il sottobosco — cappelli di amanita che arcuano in
alto come una volta rossa, gambi color osso che salgono come colonne.

Perche questa e la metafora giusta e non un'invenzione:

1. **E letteralmente il biglietto da visita di Claudia.** Quella card e un
   sottobosco notturno visto da vicino, ad altezza fungo. Il mondo non e stato
   inventato: e stato *letto* dal suo materiale.
2. **Contiene il gioco di parole che E il brand.** I gambi delle amanite sono
   colonne pallide. Le ossa sono colonne pallide. "Magic Bones": man mano che la
   camera avanza, quello che sembrava un gambo si rivela un osso dipinto. La
   rivelazione e il marchio.
3. **Il suo logo e la chiave dell'allestimento.** Il logo e *una mano che regge
   un barattolo con dentro un teschio*. Quindi il sottobosco e punteggiato di
   **barattoli di vetro** posati tra le radici, ognuno con dentro un suo pezzo,
   illuminato da dentro. Non "foto appese": teche votive, che e esattamente il
   suo immaginario.
4. **Non e la meccanica bocciata.** Non si guarda un diorama dentro una scatola:
   ci si sta dentro, all'altezza del terreno, e le cose passano *accanto* alla
   camera. Chi guarda non e mai fuori.

### Le foto vere dentro il mondo

Le 8 fotografie reali del lavoro di Claudia non diventano texture generiche:
sono **il contenuto dei barattoli**. Il mondo 3D e la cornice; quello che c'e
dentro e roba sua, fotografata. Cosi il 3D non compete con il prodotto — lo
mette in teca.

---

## 5. Storyboard — 6 battute

Struttura per battuta come impone la skill:
`purpose -> anchor -> establish -> anticipate -> transform -> proof -> resolve`.
**Un solo fuoco dominante per battuta.** Massimo due elementi animati in
competizione.

### 0 · La soglia del sottobosco
- **Purpose**: dire dove sei in tre secondi.
- **Anchor**: la volta rossa dei cappelli, lontana, contro il buio.
- **Fuoco dominante**: il wordmark che si posa sul muschio.
- **Transform**: la camera scende fino a sfiorare il terreno.
- **Resolve**: l'invito a scendere.

### 1 · Il bosco delle ossa  ← *la rivelazione del brand*
- **Purpose**: consegnare il gioco di parole. E la battuta piu importante.
- **Anchor**: una fila di colonne pallide.
- **Anticipate**: da lontano sembrano tutti gambi di fungo.
- **Transform**: passando accanto, tre di quelle colonne **sono ossa dipinte**.
- **Proof**: il nome della bottega, finalmente spiegato.
- **Fuoco dominante**: la colonna che si rivela. Nient'altro si muove.

### 2 · I teschi dipinti
- **Purpose**: il prodotto principale.
- **Anchor**: tre barattoli di vetro tra le radici, illuminati da dentro.
- **Proof**: dentro ci sono le **foto vere** (toro-pentagramma, uccello-ametista,
  teschio-pitone).
- **Transform** (`proximity`): il barattolo centrato si accende di piu e ruota
  lentissimo.

### 3 · Il filo d'osso — gioielli
- **Purpose**: la seconda categoria.
- **Anchor**: un arco di radice da cui pendono i ciondoli.
- **Transform**: oscillano al passaggio della camera, come mosse dall'aria.
- **Fuoco dominante**: il pendolo. Il resto della scena e fermo.

### 4 · Il fuoco rituale — candele e altari
- **Purpose**: arredo rituale, e il primo calore della corsa.
- **Anchor**: candele rosse su tessuto scuro (foto vera: banco-candele-rosse).
- **Transform** (`fillOnce`): le fiamme si accendono all'ingresso e **restano
  accese** anche continuando a scorrere. La luce dominante passa da fredda
  (muschio) a calda (fiamma): e il punto di svolta emotivo del percorso.

### 5 · Il banco di Claudia — contro-campo
- **Purpose**: chiudere e mandare al negozio.
- **Anchor**: il suo banco da lavoro, e dietro **tutto il sentiero gia percorso,
  acceso**.
- **Transform**: la camera si volta indietro. Vedi da dove sei venuto.
- **Resolve**: CTA al negozio + il ritratto vero (ritratto-cervo).

---

## 6. Fallback obbligatorio (a cascata)

`motore 3D` → `esperienza leggera (canvas 2D)` → `SVG/HTML statico`.

Ogni gradino funziona da solo. `<noscript>` mostra i contenuti. Sotto
reduced-motion si serve **lo stesso contenuto** in forma statica: la parita di
informazione non e negoziabile, solo il movimento sparisce.

---

## 7. Definizione di "fatto"

Nessuna di queste e opzionale.

- [ ] La metafora nasce dal materiale di Claudia (card + logo), non da un tema
      generico. **Non e un pub**, e non e l'oggetto-in-scatola gia bocciato.
- [ ] Damping frame-rate-independent su `renderT`; nessun lerp a fattore fisso.
- [ ] Capability detection **prima** di importare Three.
- [ ] Pre-warm shader su 6 punti prima di togliere il preloader.
- [ ] `document.hidden` guard nel render loop.
- [ ] Viewport stabile su mobile (probe a `100vh`).
- [ ] Zero `Math.random()` nel bundle.
- [ ] Factory materiali corretta (0 warning in console).
- [ ] Oggetti-chiave interamente in quadro a **1440×900 e 390×844**.
- [ ] Contrasto testo ≥ 4.5:1 verificato strumentalmente.
- [ ] Nessun overflow orizzontale.
- [ ] Il negozio funziona identico a 3D spento.
