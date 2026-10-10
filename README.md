# Magic Bones — il sito di Claudia Capitani

Sito statico (HTML, CSS, JavaScript) con un piccolo motore online per l'app
**Bottega**, da cui Claudia aggiunge, modifica e vende i pezzi dal telefono.

```
site/            il sito pubblicato (Cloudflare lo serve così com'è)
  data/pezzi.js    i pezzi del catalogo — lo aggiorna l'app Bottega
  bottega/         l'app di Claudia (si installa sull'iPhone: Condividi → Aggiungi a Home)
worker.js        il "portinaio" su Cloudflare: /api/… → lib/api.js, i video a pezzi (206)
lib/             le funzioni online: dati.js, github.js, sessione.js, api.js
test/            le prove automatiche (npm test) e il finto GitHub
strumenti/       server di prova, preparazione foto, prova completa dell'app
```

## Come funziona la Bottega

1. Claudia apre `/bottega/`, mette il PIN (resta valido 6 mesi sul telefono).
2. Fa o sceglie le foto: il telefono le rimpicciolisce (900 px, 600 px, mini
   240×240) e le manda una alla volta a `/api/foto`.
3. `/api/pezzo` salva foto + dati in **un solo commit** su questo archivio.
4. Cloudflare vede il commit e ripubblica il sito da solo (~1 minuto).
   L'app controlla `data/pezzi.js` e dice "✓ È online".

Ogni modifica di Claudia è un commit ("Bottega: nuovo pezzo «…»"): si può
sempre vedere chi ha cambiato cosa e tornare indietro.

## Messa in onda (una volta sola)

Su **Cloudflare** → Workers & Pages → Create → *Import a repository* → questo
archivio. *Project name* `magicbones` (deve essere uguale a `name` in
`wrangler.toml`), *Build command* vuoto, *Deploy command* `npx wrangler deploy`.
Da lì ogni commit su `main` ripubblica il sito da solo (Workers Builds).

Variabili (Settings → Variables and Secrets, tipo **Secret**):

| nome           | cosa                                                                  |
|----------------|-----------------------------------------------------------------------|
| `PIN_BOTTEGA`  | il PIN di Claudia (almeno 6 cifre)                                    |
| `SEGRETO`      | una frase lunga e casuale (firma le "tessere" d'accesso)              |
| `GITHUB_TOKEN` | token GitHub *fine-grained*: solo questo archivio, *Contents: Read and write* |

`GITHUB_REPO` e `GITHUB_BRANCH` sono già in `wrangler.toml`.

## Lavorarci in locale

```bash
npm test                              # 37 prove: dati, accesso, GitHub, funzioni
python strumenti/server.py 8899 rete  # il sito, anche dal telefono sulla stessa Wi-Fi
node strumenti/prova-bottega.mjs      # l'app completa con un finto GitHub (PIN 123456)
# il motore vero di Cloudflare, collegato al finto GitHub (porta 8792):
npx wrangler dev --port 8796 --var PIN_BOTTEGA:123456 --var SEGRETO:una-frase-lunga-qualsiasi \n  --var GITHUB_TOKEN:tok --var GITHUB_REPO:utente/archivio --var GITHUB_API:http://127.0.0.1:8792
```

Dopo una modifica a css/js, aumenta il `?v=` nelle pagine (`index.html`,
`catalogo.html`, `pezzo.html`): quei file restano in memoria nei browser un anno.

Il film d'apertura: `prompt-video-bosco.md` (come rifarlo) e `site/LEGGIMI.md`.
