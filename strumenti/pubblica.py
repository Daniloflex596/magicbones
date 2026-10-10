# Prepara la cartella da caricare su Netlify (trascinandola in Deploys).
#     python strumenti/pubblica.py      → crea/rifà  sito-netlify/
#
# Copia site/ così com'è, tranne quello che online non serve:
#   · compila/            l'app delle schede di Claudia (46 MB, già usata)
#   · LEGGIMI.md          note per chi lavora sul sito
#   · i caratteri Playfair e Jost (non più usati)
#   · le foto dei pezzi che nessuna pagina usa più (i pezzi tolti dal catalogo)
# Le foto dei pezzi usate le ricava da js/pezzi.js (con node) e da tutti i
# percorsi scritti in html/css/js, così non ne resta fuori nessuna.
import json
import os
import re
import shutil
import subprocess

QUI = os.path.dirname(os.path.abspath(__file__))
SITO = os.path.normpath(os.path.join(QUI, '..', 'site'))
USCITA = os.path.normpath(os.path.join(QUI, '..', 'sito-netlify'))

FUORI = {'compila', 'LEGGIMI.md'}
FONT_FUORI = re.compile(r'^(playfair|jost)-')
PRODOTTI = 'assets/img/products/'


def usate():
    """Tutti i file assets/… nominati nel sito, più le foto calcolate da pezzi.js."""
    nomi = set()
    for radice, cartelle, file in os.walk(SITO):
        cartelle[:] = [c for c in cartelle if c not in FUORI]
        for f in file:
            if f.endswith(('.html', '.css', '.js', '.json', '.svg')):
                testo = open(os.path.join(radice, f), encoding='utf-8', errors='ignore').read()
                nomi.update(re.findall(r'assets/[\w./-]+\.\w+', testo))
    js = ("global.window={}; require('./js/pezzi.js');"
          "const out=[]; for (const p of window.MB.pezzi) { out.push(p.thumb);"
          " for (const f of p.foto) { out.push(f.src); if (f.porta) out.push(f.porta); } }"
          "console.log(JSON.stringify(out));")
    nomi.update(json.loads(subprocess.check_output(['node', '-e', js], cwd=SITO, text=True)))
    return nomi


def main():
    servono = usate()
    if os.path.isdir(USCITA):
        shutil.rmtree(USCITA)
    tolte, peso = [], 0
    for radice, cartelle, file in os.walk(SITO):
        rel_dir = os.path.relpath(radice, SITO).replace('\\', '/')
        rel_dir = '' if rel_dir == '.' else rel_dir + '/'
        cartelle[:] = [c for c in cartelle if (rel_dir + c) not in FUORI]
        for f in file:
            rel = rel_dir + f
            if rel in FUORI or (rel_dir == 'assets/fonts/' and FONT_FUORI.match(f)):
                tolte.append(rel)
                continue
            if rel.startswith(PRODOTTI) and rel not in servono:
                tolte.append(rel)
                continue
            dest = os.path.join(USCITA, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy2(os.path.join(radice, f), dest)
            peso += os.path.getsize(dest)
    mancanti = sorted(n for n in servono if not os.path.exists(os.path.join(USCITA, n)))
    print(f'sito-netlify/: {peso / 1e6:.1f} MB')
    print(f'lasciati fuori ({len(tolte)}):', ', '.join(sorted(tolte)))
    print('file nominati ma mancanti:', mancanti or 'nessuno')


if __name__ == '__main__':
    main()
