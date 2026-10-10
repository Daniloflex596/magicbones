# Trasforma i video del cammino in sequenze di immagini per il film d'apertura.
#     python strumenti/film.py                      → dai video in site/assets/video/
#     python strumenti/film.py nuovo-16x9.mp4 nuovo-9x16.mp4
#
# Perché immagini e non video: su iPhone (Safari e Chrome, stesso motore) far
# "saltare" un video a ogni movimento è lento — scorrendo si vedevano solo 3
# immagini (misurato dall'utente su iPhone 17 Pro Max). Una sequenza di
# immagini disegnata su una tela va uguale su ogni browser, non teme il
# risparmio energetico, e parte dopo le prime immagini invece che dopo
# l'intero file (js/path.js le carica a passate: prima 1 ogni 16, poi le altre).
#
# Scrive site/assets/film/computer/000.webp… (16:9) e telefono/000.webp…
# (9:16): una immagine ogni PASSO fotogrammi. In js/config.js (film) vanno
# il numero di immagini (lo stampa alla fine) e la versione +1.
import os
import shutil
import subprocess
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
SITO = os.path.join(QUI, '..', 'site')
PASSO = 2                     # 240 fotogrammi (10 s a 24 fps) → 120 immagini
FORMATI = {
    'computer': {'scala': '1280:720', 'qualita': 30},
    'telefono': {'scala': '540:960', 'qualita': 35},
}


def estrai(video, nome):
    f = FORMATI[nome]
    uscita = os.path.join(SITO, 'assets', 'film', nome)
    shutil.rmtree(uscita, ignore_errors=True)
    os.makedirs(uscita)
    subprocess.run([
        'ffmpeg', '-nostdin', '-v', 'error', '-i', video,
        '-vf', f"select='not(mod(n\\,{PASSO}))',scale={f['scala']}:flags=lanczos",
        '-fps_mode', 'vfr', '-c:v', 'libwebp', '-quality', str(f['qualita']), '-compression_level', '6',
        '-start_number', '0', os.path.join(uscita, '%03d.webp')
    ], check=True)
    file = sorted(os.listdir(uscita))
    peso = sum(os.path.getsize(os.path.join(uscita, x)) for x in file)
    print(f'{nome}: {len(file)} immagini, {peso / 1e6:.1f} MB ({peso / len(file) / 1024:.0f} KB l\'una)')
    return len(file)


def main():
    v = sys.argv[1:] or [os.path.join(SITO, 'assets', 'video', 'bosco.mp4'),
                         os.path.join(SITO, 'assets', 'video', 'bosco-9x16.mp4')]
    n = [estrai(v[0], 'computer'), estrai(v[1], 'telefono')]
    print(f'In js/config.js -> film: computer n={n[0]}, telefono n={n[1]}, e versione +1')


if __name__ == '__main__':
    main()
