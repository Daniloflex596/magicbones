# Prepara le foto e l'elenco dei pezzi per l'app di compilazione (site/compila/).
#     python strumenti/schede.py                     → legge strumenti/gruppi.json
#     python strumenti/schede.py altro-file.json
#
# gruppi.json elenca i pezzi nell'ordine in cui Claudia li vedrà; ogni pezzo
# è la lista delle sue foto (percorsi dentro foto-cliente/):
#     { "pezzi": [
#         { "id": "A01", "gruppo": "4 foto", "foto": ["coppie 4/IMG_0001.HEIC", ...],
#           "nota": "facoltativa: spiegazione per Claudia in cima alla scheda" },
#         ...
#     ] }
#
# Per ogni foto scrive in site/compila/foto/:
#   <id>-<n>.webp    lato lungo 1600 px, per guardarla bene dal telefono
#   <id>-<n>-t.webp  lato lungo 400 px, per la griglia "Tutti i pezzi"
# e poi site/compila/schede.js con l'elenco (i nomi dei file originali restano
# dentro, così dalle risposte si risale alle foto vere per il sito).
import json
import os
import sys

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

QUI = os.path.dirname(os.path.abspath(__file__))
PROGETTO = os.path.join(QUI, '..')
ORIGINALI = os.path.join(PROGETTO, 'foto-cliente')
APP = os.path.join(PROGETTO, 'site', 'compila')
USCITA = os.path.join(APP, 'foto')

GRANDE, PICCOLA = 1600, 400


def riduci(img, lato):
    img = img.copy()
    img.thumbnail((lato, lato), Image.LANCZOS)
    return img


def main():
    elenco = sys.argv[1] if len(sys.argv) > 1 else os.path.join(QUI, 'gruppi.json')
    with open(elenco, encoding='utf-8') as f:
        pezzi = json.load(f)['pezzi']

    os.makedirs(USCITA, exist_ok=True)
    for vecchio in os.listdir(USCITA):
        os.remove(os.path.join(USCITA, vecchio))

    schede = []
    for p in pezzi:
        foto = []
        for n, rel in enumerate(p['foto'], 1):
            img = ImageOps.exif_transpose(Image.open(os.path.join(ORIGINALI, rel))).convert('RGB')
            g = riduci(img, GRANDE)
            nome = f"{p['id']}-{n}"
            g.save(os.path.join(USCITA, nome + '.webp'), 'WEBP', quality=80, method=6)
            riduci(img, PICCOLA).save(os.path.join(USCITA, nome + '-t.webp'), 'WEBP', quality=72, method=6)
            foto.append({'src': f'foto/{nome}.webp', 'thumb': f'foto/{nome}-t.webp',
                         'w': g.width, 'h': g.height, 'orig': rel})
        scheda = {'id': p['id'], 'gruppo': p.get('gruppo', ''), 'foto': foto}
        if p.get('nota'):
            scheda['nota'] = p['nota']  # spiegazione per Claudia in cima alla scheda
        schede.append(scheda)
        print(f"{p['id']}: {len(foto)} foto")

    with open(os.path.join(APP, 'schede.js'), 'w', encoding='utf-8') as f:
        f.write('/* Generato da strumenti/schede.py: non modificare a mano. */\n')
        f.write('window.MB_SCHEDE = ' + json.dumps(schede, ensure_ascii=False, indent=1) + ';\n')
    print(f'{len(schede)} pezzi -> site/compila/schede.js')


if __name__ == '__main__':
    main()
