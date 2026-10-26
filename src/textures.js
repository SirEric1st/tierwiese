// Alle Grafiken des Spiels. Die Bilder liegen als Vektorgrafiken (SVG) in
// assets/grafik/ und werden beim Start in passender Schärfe geladen.
import { DPR } from './display.js';

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
];

// Im preload() einer Szene aufrufen
export function preloadGraphics(scene) {
  GRAPHICS.forEach((key) => {
    if (!scene.textures.exists(key)) scene.load.svg(key, `assets/grafik/${key}.svg`, { scale: DPR });
  });
}

// Im create() aufrufen: Grafiken, die per Code gezeichnet werden
export function createTextures(scene) {
  if (!scene.textures.exists('konfetti')) drawConfetti(scene);
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
