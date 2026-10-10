# Prepara le foto dei pezzi per il sito a partire dagli originali di Claudia.
#     python strumenti/prodotti.py
#
# Legge risposte-claudia.json (le schede compilate da Claudia con site/compila/)
# e, per ogni pezzo in PEZZI qui sotto, scrive in site/assets/img/products/:
#   <id>-<n>.webp      900 px di lato corto (3:4 come gli scatti), per la galleria
#   <id>-1-600.webp    la copertina a 600 px, per le porte del catalogo
#   thumb/<id>.webp    240×240, ritaglio centrale della copertina, per la raccolta
# La copertina scelta da Claudia è sempre la foto 1.
# I testi dei pezzi stanno in site/js/pezzi.js (scritti a mano, non generati).
import json
import os

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

QUI = os.path.dirname(os.path.abspath(__file__))
PROGETTO = os.path.join(QUI, '..')
ORIGINALI = os.path.join(PROGETTO, 'foto-cliente')
USCITA = os.path.join(PROGETTO, 'site', 'assets', 'img', 'products')

# scheda di Claudia → id del pezzo sul sito (gli esclusi non ci sono)
PEZZI = {
    'A07': 'mezzo-teschio-serpente', 'A08': 'cinghiale-luxury', 'A11': 'cinghiale-fashion',
    'A01': 'vertebra-ametista', 'A02': 'vertebra-turchese', 'A03': 'vertebra-algiz',
    'A04': 'corno-di-cervo-portapenne', 'A05': 'vertebra-serpe', 'A06': 'vertebra-spell-jar',
    'A09': 'rosa-stregata', 'A18': 'granchio-algiz', 'B01': 'vertebra-cristallo',
    'B07': 'mascella-pentacolo', 'C01': 'corno-di-cervo', 'C02': 'mandala',
    'A14': 'portacandela-runa', 'A20': 'spell-jar', 'B02': 'portacandela-fatato',
    'B03': 'portacandela-romantic', 'B05': 'portacandela-invernale', 'C03': 'portacero-rose',
    'C06': 'candele-artigianali', 'C07': 'mascella-gotica', 'C08': 'candela-vestita',
    'A10': 'cornicetta-crow', 'A12': 'mini-altarino', 'A15': 'mini-altarino-specchiato',
    'A16': 'cesto-gotico', 'A17': 'testa-di-merlo',
    'A19': 'cornicetta-gotica', 'B08': 'cornice-trasformazione',
}
LATO, PORTA, MINI = 900, 600, 240


def main():
    with open(os.path.join(PROGETTO, 'risposte-claudia.json'), encoding='utf-8') as f:
        schede = {p['id']: p for p in json.load(f)['pezzi']}
    os.makedirs(os.path.join(USCITA, 'thumb'), exist_ok=True)

    for scheda, pid in PEZZI.items():
        p = schede[scheda]
        assert not p['escluso'], scheda
        ordine = [p['copertina']] + [f for f in p['foto'] if f != p['copertina']]
        misure = []
        for n, rel in enumerate(ordine, 1):
            img = ImageOps.exif_transpose(Image.open(os.path.join(ORIGINALI, rel))).convert('RGB')
            scala = LATO / min(img.size)
            g = img.resize((round(img.width * scala), round(img.height * scala)), Image.LANCZOS)
            g.save(os.path.join(USCITA, f'{pid}-{n}.webp'), 'WEBP', quality=80, method=6)
            misure.append(f'{g.width}x{g.height}')
            if n == 1:
                # la copertina più leggera per le porte del catalogo (lì si vede ~175 px)
                scala = PORTA / min(img.size)
                img.resize((round(img.width * scala), round(img.height * scala)), Image.LANCZOS).save(
                    os.path.join(USCITA, f'{pid}-1-{PORTA}.webp'), 'WEBP', quality=80, method=6)
                ImageOps.fit(img, (MINI, MINI), Image.LANCZOS).save(
                    os.path.join(USCITA, 'thumb', f'{pid}.webp'), 'WEBP', quality=78, method=6)
        print(f'{scheda} -> {pid}: {len(ordine)} foto {" ".join(misure)}')


if __name__ == '__main__':
    main()
