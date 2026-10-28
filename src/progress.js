// Fortschritt im Spiel: Was gibt es schon in der Leiste, und was steht im Album?
//
// Freischalten: Am Anfang gibt es nur wenige Dinge. Zieht ein Tier zum ersten
// Mal ein, bringt es ein neues Ding als Geschenk mit (gift in animals.js).
// So kommt ein Tier nach dem anderen, und man kann nicht alles auf einmal bauen.
// Im Futterkorb liegt nur Futter, das eingezogene Tiere mögen.
//
// Album-Sticker: Für jedes Tier gibt es drei Sticker. Jeder schaltet einen
// weiteren Satz im Steckbrief frei.
import { ANIMALS } from './animals.js';

export const START_ELEMENTS = ['baum', 'busch', 'laubhaufen'];

// Die drei Sticker: welcher Satz im Steckbrief (album[line]) dazugehört
// und was man tun muss, solange er noch fehlt
export const STICKERS = [
  { key: 'fed', line: 1, hint: 'Füttere mich, dann verrate ich dir, was ich gern fresse.' },
  { key: 'petted', line: 2, hint: 'Streichle mich, dann verrate ich dir, wo ich wohne.' },
  { key: 'favorite', line: 3, hint: 'Gib mir mein Lieblingsfutter, dann verrate ich dir ein Geheimnis.' },
];

// Das Bild für einen Sticker
export function stickerTexture(def, key) {
  if (key === 'fed') return 'korb';
  if (key === 'petted') return 'herz';
  return def.eats[0]; // Lieblingsfutter
}

// animals: Zustand aller Tiere (aus AnimalManager.getState), placedTypes: was auf der Wiese steht
export function unlockedElements(animals, placedTypes) {
  const unlocked = new Set([...START_ELEMENTS, ...placedTypes]);
  animals.forEach((state) => {
    const def = ANIMALS.find((a) => a.type === state.type);
    if (state.hasLivedHere && def?.gift) unlocked.add(def.gift.type);
  });
  return unlocked;
}

export function unlockedFoods(animals) {
  const foods = new Set();
  animals.forEach((state) => {
    const def = ANIMALS.find((a) => a.type === state.type);
    if (state.hasLivedHere && def) def.eats.forEach((food) => foods.add(food));
  });
  return foods;
}

// Steckbrief mit den freigeschalteten Sätzen; für fehlende steht da, was man tun kann
export function albumLines(def, care = {}) {
  const lines = [def.album[0]];
  STICKERS.forEach((sticker) => lines.push(care[sticker.key] ? def.album[sticker.line] : sticker.hint));
  return lines;
}
