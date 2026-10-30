// Alle Grafiken des Spiels. Die Bilder liegen als Vektorgrafiken (SVG) in
// assets/grafik/ und werden beim Start in passender Schärfe geladen.
// Nach und nach kommen gemalte KI-Bilder dazu (PNG in assets/bilder/,
// vorbereitet mit tools/ki-bild.py). Sie ersetzen die Vektorgrafik gleichen Namens.
import { ANIMALS } from './animals.js';
import { DPR } from './display.js';
import { ELEMENTS } from './elements.js';
import { FOODS } from './foods.js';

// Für diese Namen gibt es schon ein KI-Bild
const PAINTED = ['igel', 'ente', 'ente-schwimmt', 'eichhoernchen', 'frosch', 'marienkaefer', 'zitronenfalter', 'biene', 'amsel', 'specht', 'hase', 'fuchs', 'dachs', 'maulwurf', 'fledermaus', 'waldkauz', 'biber', 'schilf', 'nistkasten', 'insektenhotel', 'baum', 'nussbaum', 'obstbaum', 'busch', 'teich', 'hecke', 'laubhaufen', 'totholz', 'steine', 'blumen', 'bau'];
const PAINTED_SCALE = 2; // KI-Bilder liegen in doppelter Spielgröße vor

export function isPainted(key) {
  return PAINTED.includes(key);
}

// Tiere, Dinge und Futter kommen aus ihren Listen; hier stehen nur die übrigen Bilder
const GRAPHICS = [
  'gras',
  'blume-gelb',
  'blume-rosa',
  'blume-weiss',
  'schatten',
  'figur',
  'ente-schwimmt',
  'gedankenblase',
  'korb',
  'schaufel',
  'album',
  'sonne',
  'mond',
  'haus',
  'jahreszeit-fruehling',
  'jahreszeit-sommer',
  'jahreszeit-herbst',
  'jahreszeit-winter',
  'symbol-frisur',
  'symbol-haarfarbe',
  'symbol-haut',
  'symbol-shirt',
  'symbol-hose',
  ...ANIMALS.map((a) => a.type),
  ...ELEMENTS.map((e) => e.type),
  ...FOODS.map((f) => f.type),
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
  if (!scene.textures.exists('leuchtpunkt')) drawGlow(scene);
  if (!scene.textures.exists('schneeflocke')) drawSnowflake(scene);
  if (!scene.textures.exists('blatt')) drawLeaves(scene);
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

// Ein weich leuchtender Punkt für die Glühwürmchen in der Nacht (24 × 24 Punkte)
function drawGlow(scene) {
  const s = DPR;
  const g = scene.make.graphics({ add: false });
  [[12, 0.12], [8, 0.25], [5, 0.5]].forEach(([r, alpha]) => {
    g.fillStyle(0xeaff7a, alpha);
    g.fillCircle(12 * s, 12 * s, r * s);
  });
  g.fillStyle(0xfdffd8);
  g.fillCircle(12 * s, 12 * s, 2.5 * s);
  g.generateTexture('leuchtpunkt', 24 * s, 24 * s);
  g.destroy();
}

// Eine weiche Schneeflocke (14 × 14 Punkte)
function drawSnowflake(scene) {
  const s = DPR;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(7 * s, 7 * s, 7 * s);
  g.fillStyle(0xffffff);
  g.fillCircle(7 * s, 7 * s, 4.5 * s);
  g.generateTexture('schneeflocke', 14 * s, 14 * s);
  g.destroy();
}

// Fallende Blätter: Herbstlaub (Frames 0 bis 2) und rosa Blütenblätter (Frame 3)
export const LEAF_COLORS = [0xf07a2a, 0xd9452a, 0xf2b53a, 0xffb3cf];

function drawLeaves(scene) {
  const w = 22 * DPR;
  const h = 14 * DPR;
  const g = scene.make.graphics({ add: false });
  LEAF_COLORS.forEach((color, i) => {
    g.fillStyle(color);
    g.fillEllipse(i * w + w / 2, h / 2, w * 0.9, h * 0.75);
    g.fillStyle(0xffffff, 0.3);
    g.fillEllipse(i * w + w * 0.4, h * 0.38, w * 0.4, h * 0.22);
  });
  g.generateTexture('blatt', LEAF_COLORS.length * w, h);
  g.destroy();
  const texture = scene.textures.get('blatt');
  LEAF_COLORS.forEach((_, i) => texture.add(i, 0, i * w, 0, w, h));
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
