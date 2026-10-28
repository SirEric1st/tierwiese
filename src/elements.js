// Alle Dinge, die man auf die Wiese stellen kann.
// name: wird beim Hinstellen vorgelesen
// hint: wird vorgelesen, wenn man in der Bau-Leiste nur antippt
// flat: liegt flach auf dem Boden (wird unter allem anderen gezeichnet)
// shore: wächst nur am Teichufer und wandert mit, wenn der Teich verschoben wird
// riddle: Rätsel, mit dem ein Tier zu Besuch nach diesem Ding fragt

export const ELEMENTS = [
  { type: 'baum', name: 'Ein Baum!', hint: 'Der Baum. Zieh ihn auf die Wiese!', riddle: 'Ich suche etwas Großes mit einem dicken Stamm und vielen grünen Blättern.' },
  { type: 'nussbaum', name: 'Ein Nussbaum!', hint: 'Der Nussbaum. Zieh ihn auf die Wiese!', riddle: 'Ich suche einen Baum, an dem etwas Leckeres mit harter Schale wächst.' },
  { type: 'teich', name: 'Ein Teich!', hint: 'Der Teich. Zieh ihn auf die Wiese!', flat: true, riddle: 'Ich suche etwas mit ganz viel Wasser.' },
  { type: 'schilf', name: 'Schilf!', hint: 'Das Schilf. Zieh es an einen Teich!', shore: true, riddle: 'Ich suche lange, dünne Halme, die am Wasser wachsen.' },
  { type: 'laubhaufen', name: 'Ein Laubhaufen!', hint: 'Der Laubhaufen. Zieh ihn auf die Wiese!', riddle: 'Ich suche etwas, wo es raschelt und viele bunte Blätter liegen.' },
  { type: 'busch', name: 'Ein Busch!', hint: 'Der Busch. Zieh ihn auf die Wiese!', riddle: 'Ich suche etwas Grünes und Rundes, das kleiner ist als ein Baum.' },
  { type: 'steine', name: 'Ein Steinhaufen!', hint: 'Der Steinhaufen. Zieh ihn auf die Wiese!', riddle: 'Ich suche etwas Hartes und Graues, unter dem man sich verstecken kann.' },
  { type: 'blumen', name: 'Ein Blumenbeet!', hint: 'Das Blumenbeet. Zieh es auf die Wiese!', riddle: 'Ich suche etwas Buntes, das gut duftet.' },
  { type: 'hecke', name: 'Eine Hecke!', hint: 'Die Hecke. Zieh sie auf die Wiese!', riddle: 'Ich suche eine lange grüne Wand aus Sträuchern.' },
  { type: 'obstbaum', name: 'Ein Apfelbaum!', hint: 'Der Apfelbaum. Zieh ihn auf die Wiese!', riddle: 'Ich suche einen Baum mit roten, runden Früchten.' },
  { type: 'totholz', name: 'Ein alter Baumstamm!', hint: 'Der alte Baumstamm. Zieh ihn auf die Wiese!', riddle: 'Ich suche einen alten Stamm, der auf dem Boden liegt.' },
  { type: 'insektenhotel', name: 'Ein Insektenhotel!', hint: 'Das Insektenhotel. Zieh es auf die Wiese!', riddle: 'Ich suche ein kleines Haus aus Holz mit vielen Röhrchen und Löchern.' },
  { type: 'nistkasten', name: 'Ein Nistkasten!', hint: 'Der Nistkasten. Zieh ihn auf die Wiese!', riddle: 'Ich suche ein Häuschen aus Holz mit einem runden Loch, hoch oben auf einem Pfahl.' },
  { type: 'bau', name: 'Ein Erdbau!', hint: 'Der Erdbau. Das ist eine Höhle in der Erde. Zieh ihn auf die Wiese!', riddle: 'Ich suche eine Höhle unter der Erde.' },
];

export function getElement(type) {
  return ELEMENTS.find((e) => e.type === type);
}
