// Sammelt alle Sätze, die das Spiel spricht, und gibt sie als JSON-Liste aus.
// Wird von tools/sprache.py benutzt. Aufruf im Projektordner:
//   node tools/saetze.mjs
// Kommt ein neuer Satz ins Spiel, muss er in einer der Quellen unten stehen
// (meist src/saetze.js), sonst spricht ihn die iPad-Stimme.
import { ANIMALS } from '../src/animals.js';
import { ELEMENTS } from '../src/elements.js';
import { FIGURE_ROWS } from '../src/figure.js';
import { FOODS } from '../src/foods.js';
import { STICKERS } from '../src/progress.js';
import { SAETZE, SEASON_TEXTS, dislikeText } from '../src/saetze.js';

const texts = new Set();
const add = (text) => text && texts.add(text.trim());

Object.values(SAETZE).forEach(add);
Object.values(SEASON_TEXTS).forEach(add);
STICKERS.forEach((sticker) => add(sticker.hint));

ANIMALS.forEach((animal) => {
  [animal.hello, animal.fact, animal.petted, animal.yummy, animal.gift?.text, animal.winter?.text].forEach(add);
  animal.album.forEach(add);
  animal.needs.forEach((need) => add(need.wish));
  add(dislikeText(FOODS.find((food) => food.type === animal.eats[0])));
});
ELEMENTS.forEach((element) => {
  add(element.name);
  add(element.hint);
});
FOODS.forEach((food) => add(food.hint));
FIGURE_ROWS.forEach((row) => {
  add(row.hint);
  row.options.forEach((option) => add(row.say(option)));
});

console.log(JSON.stringify([...texts], null, 1));
