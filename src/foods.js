// Das Futter im Futterkorb. Man zieht es aus der Leiste zu einem Tier.
// Welches Tier was mag, steht bei den Tieren (animals.js, eats).
// hint: wird vorgelesen, wenn man in der Leiste nur antippt
// plural: so heißt das Futter, wenn ein Tier sagt, was es lieber mag

export const FOODS = [
  { type: 'wurm', hint: 'Ein Regenwurm. Zieh ihn zu einem Tier!', plural: 'Würmer' },
  { type: 'kaefer', hint: 'Ein Käfer. Zieh ihn zu einem Tier!', plural: 'Käfer' },
  { type: 'nuss', hint: 'Eine Nuss. Zieh sie zu einem Tier!', plural: 'Nüsse' },
  { type: 'koerner', hint: 'Körner. Zieh sie zu einem Tier!', plural: 'Körner' },
  { type: 'wasserpflanze', hint: 'Wasserlinsen. Das sind kleine Pflanzen im Teich. Zieh sie zu einem Tier!', plural: 'Wasserlinsen' },
];

export function getFood(type) {
  return FOODS.find((f) => f.type === type);
}
