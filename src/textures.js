// Alle Grafiken des Spiels. Die Bilder liegen als Vektorgrafiken (SVG) in
// assets/grafik/ und werden beim Start in passender Schärfe geladen.
// Nach und nach kommen gemalte KI-Bilder dazu (PNG in assets/bilder/,
// vorbereitet mit tools/ki-bild.py). Sie ersetzen die Vektorgrafik gleichen Namens.
import { DPR } from './display.js';

// Für diese Namen gibt es schon ein KI-Bild
const PAINTED = ['igel'];
const PAINTED_SCALE = 2; // KI-Bilder liegen in doppelter Spielgröße vor

export function isPainted(key) {
  return PAINTED.includes(key);
}

const GRAPHICS = [
  'gras',
  'blume-gelb',
  'blume-rosa',
  'blume-weiss',
  'schatten',
  'figur',
  'igel',
  'ente',
  'ente-schwimmt',
  'eichhoernchen',
  'baum',
  'nussbaum',
  'teich',
  'schilf',
  'laubhaufen',
  'busch',
  'gedankenblase',
  'wurm',
  'kaefer',
  'nuss',
  'koerner',
  'wasserpflanze',
  'korb',
  'schaufel',
  'album',
  'symbol-frisur',
  'symbol-haarfarbe',
  'symbol-haut',
  'symbol-shirt',
  'symbol-hose',
  'frosch',
  'steine',
];

// Im preload() einer Szene aufrufen
export function preloadGraphics(scene) {
  GRAPHICS.forEach((key) => {
    if (scene.textures.exists(key)) return;
    if (isPainted(key)) scene.load.image(key, `assets/bilder/${key}.png`);
    else scene.load.svg(key, `assets/grafik/${key}.svg`, { scale: DPR });
  });
}

// Im create() aufrufen: Grafiken, die per Code gezeichnet werden
export function createTextures(scene) {
  if (DPR !== PAINTED_SCALE) PAINTED.forEach((key) => resizePainted(scene, key));
  if (!scene.textures.exists('konfetti')) drawConfetti(scene);
  if (!scene.textures.exists('herz')) drawHeart(scene);
}

// Ein rotes Herz, das beim Streicheln aufsteigt (28 × 26 Punkte)
function drawHeart(scene) {
  const s = DPR;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xe8455a);
  g.fillCircle(8 * s, 8 * s, 7.5 * s);
  g.fillCircle(20 * s, 8 * s, 7.5 * s);
  g.fillTriangle(1 * s, 11 * s, 27 * s, 11 * s, 14 * s, 25 * s);
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(6 * s, 6 * s, 2.5 * s);
  g.generateTexture('herz', 28 * s, 26 * s);
  g.destroy();
}

// Auf Bildschirmen ohne Retina die KI-Bilder auf halbe Größe bringen,
// damit sie genauso groß erscheinen wie die Vektorgrafiken
function resizePainted(scene, key) {
  const texture = scene.textures.get(key);
  if (texture.resized) return;
  const source = texture.getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((source.width * DPR) / PAINTED_SCALE);
  canvas.height = Math.round((source.height * DPR) / PAINTED_SCALE);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas).resized = true;
}

// Konfetti in fünf Farben, als einzelne Bildausschnitte (Frames 0 bis 4)
export const CONFETTI_COLORS = [0xff7a59, 0xffd84a, 0x5aa9ec, 0x7cd36b, 0xff9fc4];

function drawConfetti(scene) {
  const w = 12 * DPR;
  const h = 7 * DPR;
  const g = scene.make.graphics({ add: false });
  CONFETTI_COLORS.forEach((color, i) => {
    g.fillStyle(color);
    g.fillRect(i * w, 0, w, h);
  });
  g.generateTexture('konfetti', CONFETTI_COLORS.length * w, h);
  g.destroy();
  const texture = scene.textures.get('konfetti');
  CONFETTI_COLORS.forEach((_, i) => texture.add(i, 0, i * w, 0, w, h));
}
