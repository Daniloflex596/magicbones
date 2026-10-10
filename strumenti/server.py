# Server locale per provare il sito Magic Bones.
#     python strumenti/server.py          → http://127.0.0.1:8899
#     python strumenti/server.py 9000     → su un'altra porta
#     python strumenti/server.py 8899 rete → anche dal telefono, sulla stessa Wi-Fi
# Rispetto a `python -m http.server`:
# · dice al browser di NON tenere copie in cache, così passando da una
#   pagina all'altra si vede sempre l'ultima versione dei file;
# · dà il tipo giusto a webp, woff2, svg e mp4;
# · consegna i file anche "a pezzi" (richieste Range), come Netlify e
#   Cloudflare: è quello che permette al film di partire subito, senza
#   aspettare di aver scaricato tutto il video.
import functools
import http.server
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
RANGE = re.compile(r'bytes=(\d*)-(\d*)$')


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4', '.js': 'text/javascript', '.css': 'text/css',
    }

    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        m = RANGE.match(rng.strip()) if rng else None
        if not m or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        if a == '':                      # "bytes=-500": gli ultimi 500 byte
            start, end = max(0, size - int(b or 0)), size - 1
        else:
            start, end = int(a), min(int(b) if b else size - 1, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header('Content-Range', 'bytes */%d' % size)
            self.end_headers()
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self._resta = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        resta, self._resta = getattr(self, '_resta', None), None
        if resta is None:
            return super().copyfile(source, outputfile)
        while resta > 0:
            buf = source.read(min(65536, resta))
            if not buf:
                break
            outputfile.write(buf)
            resta -= len(buf)

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        # sulle pagine: il browser butta anche le copie vecchie già salvate
        # (quelle del primo server, che mostravano pagine di versioni passate)
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        if path.endswith('/') or path.endswith('.html'):
            self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()

    def log_message(self, fmt, *args):  # silenzioso
        pass


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        # il browser che interrompe un video a metà non è un errore
        if isinstance(sys.exc_info()[1], (ConnectionAbortedError, ConnectionResetError, BrokenPipeError)):
            return
        super().handle_error(request, client_address)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    # "rete": raggiungibile anche dal telefono sulla stessa Wi-Fi (http://<IP del PC>:porta)
    host = '0.0.0.0' if 'rete' in sys.argv[2:] else '127.0.0.1'
    httpd = Server((host, port), functools.partial(Handler, directory=ROOT))
    print('Magic Bones: http://127.0.0.1:%d' % port + ('  (e dal telefono: http://<IP del PC>:%d)' % port if host == '0.0.0.0' else ''))
    httpd.serve_forever()
