// Alle Dinge, die man auf die Wiese stellen kann.
// name: wird beim Hinstellen vorgelesen
// hint: wird vorgelesen, wenn man in der Bau-Leiste nur antippt
// flat: liegt flach auf dem Boden (wird unter allem anderen gezeichnet)
// shore: wächst nur am Teichufer und wandert mit, wenn der Teich verschoben wird

export const ELEMENTS = [
  { type: 'baum', name: 'Ein Baum!', hint: 'Der Baum. Zieh ihn auf die Wiese!' },
  { type: 'nussbaum', name: 'Ein Nussbaum!', hint: 'Der Nussbaum. Zieh ihn auf die Wiese!' },
  { type: 'teich', name: 'Ein Teich!', hint: 'Der Teich. Zieh ihn auf die Wiese!', flat: true },
  { type: 'schilf', name: 'Schilf!', hint: 'Das Schilf. Zieh es an einen Teich!', shore: true },
  { type: 'laubhaufen', name: 'Ein Laubhaufen!', hint: 'Der Laubhaufen. Zieh ihn auf die Wiese!' },
  { type: 'busch', name: 'Ein Busch!', hint: 'Der Busch. Zieh ihn auf die Wiese!' },
  { type: 'steine', name: 'Ein Steinhaufen!', hint: 'Der Steinhaufen. Zieh ihn auf die Wiese!' },
  { type: 'blumen', name: 'Ein Blumenbeet!', hint: 'Das Blumenbeet. Zieh es auf die Wiese!' },
  { type: 'hecke', name: 'Eine Hecke!', hint: 'Die Hecke. Zieh sie auf die Wiese!' },
  { type: 'obstbaum', name: 'Ein Apfelbaum!', hint: 'Der Apfelbaum. Zieh ihn auf die Wiese!' },
  { type: 'totholz', name: 'Ein alter Baumstamm!', hint: 'Der alte Baumstamm. Zieh ihn auf die Wiese!' },
  { type: 'insektenhotel', name: 'Ein Insektenhotel!', hint: 'Das Insektenhotel. Zieh es auf die Wiese!' },
  { type: 'nistkasten', name: 'Ein Nistkasten!', hint: 'Der Nistkasten. Zieh ihn auf die Wiese!' },
  { type: 'bau', name: 'Ein Erdbau!', hint: 'Der Erdbau. Das ist eine Höhle in der Erde. Zieh ihn auf die Wiese!' },
];

export function getElement(type) {
  return ELEMENTS.find((e) => e.type === type);
}
