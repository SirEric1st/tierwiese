# Einfacher Test-Server für das iPad im WLAN.
# Aufruf im Projektordner: python3 tools/testserver.py
#
# Anders als „python3 -m http.server“ sagt dieser Server dem Browser, dass er
# keine Dateien zwischenspeichern soll. So sieht das iPad nach dem Neuladen
# immer den neuesten Stand und nie eine Mischung aus alten und neuen Dateien.
import http.server
import sys
from pathlib import Path

PORT = 8080
FOLDER = Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FOLDER), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    print(f'Test-Server läuft auf Port {port} (Ordner: {FOLDER})', flush=True)
    http.server.ThreadingHTTPServer(('0.0.0.0', port), NoCacheHandler).serve_forever()
