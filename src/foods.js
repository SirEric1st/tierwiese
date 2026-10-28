// Das Futter im Futterkorb. Die Spielfigur sammelt es auf der Wiese ein
// (siehe FoodField.js), dann zieht man es aus der Leiste zu einem Tier.
// Welches Tier was mag, steht bei den Tieren (animals.js, eats).
// hint: wird vorgelesen, wenn man in der Leiste nur antippt
// plural: so heißt das Futter, wenn ein Tier sagt, was es lieber mag („Ich mag lieber …“)
// sources: bei diesen Dingen wächst es nach (leer: überall auf der Wiese)
// where: wird vorgelesen, wenn davon nichts mehr im Korb ist

export const FOODS = [
  { type: 'wurm', hint: 'Ein Regenwurm. Zieh ihn zu einem Tier!', plural: 'Würmer', sources: ['laubhaufen'], where: 'Regenwürmer findest du im Laubhaufen.' },
  { type: 'kaefer', hint: 'Ein Käfer. Zieh ihn zu einem Tier!', plural: 'Käfer', sources: ['totholz', 'steine', 'laubhaufen'], where: 'Käfer findest du am alten Baumstamm, unter Steinen und im Laub.' },
  { type: 'nuss', hint: 'Eine Nuss. Zieh sie zu einem Tier!', plural: 'Nüsse', sources: ['nussbaum'], where: 'Nüsse findest du unter dem Nussbaum.' },
  { type: 'koerner', hint: 'Körner. Zieh sie zu einem Tier!', plural: 'Körner', sources: ['blumen'], where: 'Körner findest du beim Blumenbeet. Das sind die Samen der Pflanzen.' },
  { type: 'wasserpflanze', hint: 'Wasserlinsen. Das sind kleine Pflanzen im Teich. Zieh sie zu einem Tier!', plural: 'Wasserlinsen', sources: ['teich'], where: 'Wasserlinsen findest du im Teich.' },
  { type: 'blattlaeuse', hint: 'Blattläuse. Das sind ganz kleine Tiere auf Blättern. Zieh sie zu einem Tier!', plural: 'Blattläuse', sources: ['busch', 'blumen'], where: 'Blattläuse findest du an Büschen und Blumen.' },
  { type: 'bluete', hint: 'Eine Blüte mit süßem Nektar. Zieh sie zu einem Tier!', plural: 'süßen Nektar aus Blüten', sources: ['blumen'], where: 'Blüten findest du im Blumenbeet.' },
  { type: 'apfel', hint: 'Ein Apfel. Zieh ihn zu einem Tier!', plural: 'Äpfel', sources: ['obstbaum'], where: 'Äpfel findest du unter dem Apfelbaum.' },
  { type: 'klee', hint: 'Klee. Das ist eine Wiesenpflanze. Zieh ihn zu einem Tier!', plural: 'Klee und Kräuter', sources: [], where: 'Klee wächst überall auf der Wiese.' },
];

export function getFood(type) {
  return FOODS.find((f) => f.type === type);
}
