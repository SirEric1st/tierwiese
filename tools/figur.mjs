// Schreibt das Ersatzbild der Spielfigur (assets/grafik/figur.svg). Es ist zu
// sehen, bis die selbst gestaltete Figur fertig geladen ist. Gezeichnet wird
// sie in src/figure.js; nach einer Änderung dort neu ausführen:
//   node tools/figur.mjs
import { writeFileSync } from 'node:fs';
import { figureSvg } from '../src/figure.js';

const svg = figureSvg({}).replace('<defs>', '<!-- Spielfigur (Kind). Eigene Zeichnung für das Spiel Tierwiese. -->\n  <defs>');
writeFileSync(new URL('../assets/grafik/figur.svg', import.meta.url), `${svg}\n`);
console.log('assets/grafik/figur.svg geschrieben');
