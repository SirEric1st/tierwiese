// Service Worker: sorgt dafür, dass das Spiel auch ohne Internet startet.
//
// So funktioniert es: Jede Datei, die das Spiel lädt, wird zusätzlich im
// Speicher des iPads abgelegt. Mit Internet holt sich das Spiel immer die
// neueste Version (Updates kommen also von selbst). Ohne Internet – oder
// wenn das Netz sehr langsam ist – nimmt es die gespeicherte Kopie.

const CACHE = 'tierwiese';
const NETWORK_TIMEOUT = 3000; // so lange aufs Internet warten, dann die Kopie nehmen

// Diese Dateien werden gleich beim ersten Start gespeichert. Fehlt hier
// eine Datei, ist das nicht schlimm: Sie wird beim ersten Laden trotzdem
// gespeichert.
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'lib/phaser.min.js',
  'assets/grafik/baum.svg',
  'assets/grafik/blume-gelb.svg',
  'assets/grafik/blume-rosa.svg',
  'assets/grafik/blume-weiss.svg',
  'assets/grafik/busch.svg',
  'assets/grafik/eichhoernchen.svg',
  'assets/grafik/ente.svg',
  'assets/grafik/ente-schwimmt.svg',
  'assets/grafik/figur.svg',
  'assets/grafik/gedankenblase.svg',
  'assets/grafik/wurm.svg',
  'assets/grafik/kaefer.svg',
  'assets/grafik/nuss.svg',
  'assets/grafik/koerner.svg',
  'assets/grafik/wasserpflanze.svg',
  'assets/grafik/korb.svg',
  'assets/grafik/schaufel.svg',
  'assets/grafik/album.svg',
  'assets/grafik/symbol-frisur.svg',
  'assets/grafik/symbol-haarfarbe.svg',
  'assets/grafik/symbol-haut.svg',
  'assets/grafik/symbol-shirt.svg',
  'assets/grafik/symbol-hose.svg',
  'assets/grafik/gras.svg',
  'assets/bilder/igel.png',
  'assets/grafik/igel.svg',
  'assets/grafik/laubhaufen.svg',
  'assets/grafik/nussbaum.svg',
  'assets/grafik/schatten.svg',
  'assets/grafik/schilf.svg',
  'assets/grafik/teich.svg',
  'src/main.js',
  'src/display.js',
  'src/speech.js',
  'src/sound.js',
  'src/save.js',
  'src/textures.js',
  'src/elements.js',
  'src/foods.js',
  'src/figure.js',
  'src/parents.js',
  'src/animals.js',
  'src/Animal.js',
  'src/AnimalManager.js',
  'src/BuildBar.js',
  'src/scenes/StartScene.js',
  'src/scenes/WorldScene.js',
  'src/scenes/AlbumScene.js',
  'src/scenes/FigureScene.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Nur eigene Dateien behandeln (das Spiel lädt ohnehin nichts von fremden Servern)
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);

  const fromNetwork = fetch(request, { cache: 'no-cache' }).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  fromNetwork.catch(() => {}); // Fehler wird unten behandelt, hier nur nicht als „unbehandelt“ melden

  // Was zuerst da ist: Antwort aus dem Internet, oder nach der Wartezeit die Kopie
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT));
  const cached = timeout.then(() => cache.match(request, { ignoreSearch: true }));

  try {
    const response = await Promise.race([fromNetwork, cached.then((r) => r || fromNetwork)]);
    if (response) return response;
  } catch (error) {
    // kein Internet → unten die gespeicherte Kopie nehmen
  }
  const copy = await cache.match(request, { ignoreSearch: true });
  return copy || Response.error();
}
