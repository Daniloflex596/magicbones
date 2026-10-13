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

Sito online: **https://magicbones.antoniocioffi.workers.dev** · app: `/bottega/`

1. Claudia apre `/bottega/`, mette il PIN (resta valido 6 mesi sul telefono).
2. Fa o sceglie le foto: il telefono le rimpicciolisce (900 px, 600 px, mini
   240×240) e le manda una alla volta a `/api/foto`.
3. `/api/pezzo` salva foto + dati in **un solo commit** su questo archivio.
4. `worker.js` serve `data/pezzi.js` e le foto dell'app **direttamente dal
   ramo main** (memoria di 20 s): il pezzo è online in ~10-20 s, senza
   ripubblicare niente. Se GitHub non risponde, il sito usa l'ultima copia.

Se qualcosa va storto dall'app: Cloudflare → Workers → `magicbones` → Logs
(ogni errore dell'API è registrato con la chiamata e il motivo).

Ogni modifica di Claudia è un commit ("Bottega: nuovo pezzo «…»"): si può
sempre vedere chi ha cambiato cosa e tornare indietro (`git revert`).

## Pubblicare una modifica al codice o alla grafica

Le modifiche di Claudia NON hanno bisogno di questo. Per il resto (pagine,
css, js, video) va ripubblicato il sito, dalla copia esatta dell'archivio:

```bash
git push                                     # prima si salva su GitHub
git worktree add ../mb-pubblica HEAD         # copia pulita (niente file del PC)
cd ../mb-pubblica && npx wrangler deploy     # serve `npx wrangler login` una volta
cd - && git worktree remove --force ../mb-pubblica
```

(La ripubblicazione automatica GitHub → Cloudflare non partiva: misurato.)

## Configurazione su Cloudflare (Workers, progetto `magicbones`)

Segreti (Settings → Variables and Secrets, tipo **Secret**, oppure
`npx wrangler secret put NOME --name magicbones`):

| nome            | cosa                                                                  |
|-----------------|-----------------------------------------------------------------------|
| `PIN_BOTTEGA`   | il PIN di Claudia                                                     |
| `SEGRETO`       | una frase lunga e casuale (firma le "tessere" d'accesso)              |
| `CHIAVE_GITHUB` | token GitHub *fine-grained*: solo questo archivio, *Contents: Read and write* |

`ARCHIVIO_GITHUB` e `RAMO_GITHUB` sono in `wrangler.toml` (Cloudflare non
accetta segreti che iniziano con `GITHUB_`). Il token ha una scadenza: quando
scade l'app dice "Qualcosa non ha funzionato" → rigenerarlo e rimetterlo.

## Lavorarci in locale

```bash
npm test                              # 46 prove: dati (su una copia fissa, test/dati-prova.js), accesso, GitHub, funzioni
python strumenti/server.py 8899 rete  # il sito, anche dal telefono sulla stessa Wi-Fi
node strumenti/prova-bottega.mjs      # l'app completa con un finto GitHub (PIN 123456)
# il motore vero di Cloudflare, collegato al finto GitHub (porta 8792):
npx wrangler dev --port 8796 --var PIN_BOTTEGA:123456 --var SEGRETO:una-frase-lunga-qualsiasi \
  --var CHIAVE_GITHUB:tok --var ARCHIVIO_GITHUB:utente/archivio --var API_GITHUB:http://127.0.0.1:8792
```

Dopo una modifica a css/js, aumenta il `?v=` nelle pagine (`index.html`,
`catalogo.html`, `pezzo.html`): quei file restano in memoria nei browser un anno.

Il film d'apertura: `prompt-video-bosco.md` (come rifarlo) e `site/LEGGIMI.md`.
