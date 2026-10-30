// Die eigene Spielfigur als Baukasten: Frisur, Haar-, Haut-, T-Shirt- und
// Hosenfarbe sind wählbar. Die Figur wird im Spiel als Vektorgrafik (SVG)
// zusammengesetzt und als Bild geladen. Was das Kind auswählt, bleibt nur
// auf diesem Gerät (im Spielstand).

// word: Farbwort für die Sprachausgabe („Ein rotes T-Shirt!“)
export const HAIR_STYLES = [
  { id: 'kurz', say: 'Kurze Haare!' },
  { id: 'lang', say: 'Lange Haare!' },
  { id: 'zoepfe', say: 'Zöpfe!' },
  { id: 'locken', say: 'Locken!' },
];
export const HAIR_COLORS = [
  { color: '#f2c55c', word: 'blond' },
  { color: '#a8693a', word: 'hellbraun' },
  { color: '#6b3c1c', word: 'braun' },
  { color: '#2b2422', word: 'schwarz' },
  { color: '#d4602a', word: 'rot' },
];
export const SKIN_COLORS = ['#ffe0c4', '#f3c79f', '#d9a274', '#a8714a', '#7a4a2e'];
export const SHIRT_COLORS = [
  { color: '#e2553a', word: 'rot' },
  { color: '#3f86d9', word: 'blau' },
  { color: '#4cae4f', word: 'grün' },
  { color: '#f2c21c', word: 'gelb' },
  { color: '#ec6fa8', word: 'pink' },
  { color: '#f4f4f0', word: 'weiß' },
];
export const PANTS_COLORS = [
  { color: '#3f5fa8', word: 'blau' },
  { color: '#7a5233', word: 'braun' },
  { color: '#7d8590', word: 'grau' },
  { color: '#2f3238', word: 'schwarz' },
  { color: '#3e8a45', word: 'grün' },
];

// Die Zeilen des Baukastens: welche Einstellung, welche Auswahl, was gesagt wird
// symbol/label/hint: Symbol vorne in der Reihe, Wort darunter, Satz beim Antippen
export const FIGURE_ROWS = [
  { key: 'hair', symbol: 'symbol-frisur', label: 'Frisur', hint: 'Hier suchst du die Frisur aus.', options: HAIR_STYLES, say: (o) => o.say },
  { key: 'hairColor', symbol: 'symbol-haarfarbe', label: 'Haare', hint: 'Hier suchst du die Haarfarbe aus.', options: HAIR_COLORS, say: (o) => `${capitalize(o.word)}e Haare!` },
  { key: 'skin', symbol: 'symbol-haut', label: 'Haut', hint: 'Hier suchst du die Hautfarbe aus.', options: SKIN_COLORS.map((color) => ({ color })), say: () => 'Diese Hautfarbe!' },
  { key: 'shirt', symbol: 'symbol-shirt', label: 'T-Shirt', hint: 'Hier suchst du die Farbe vom T-Shirt aus.', options: SHIRT_COLORS, say: (o) => `Ein ${o.word}es T-Shirt!` },
  { key: 'pants', symbol: 'symbol-hose', label: 'Hose', hint: 'Hier suchst du die Farbe von der Hose aus.', options: PANTS_COLORS, say: (o) => `Eine ${o.word}e Hose!` },
];

function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1);
}

// Gespeichert werden nur die Nummern der Auswahl
export const DEFAULT_FIGURE = { hair: 0, hairColor: 1, skin: 0, shirt: 0, pants: 0 };

export function normalizeFigure(figure) {
  const result = { ...DEFAULT_FIGURE };
  const limits = {
    hair: HAIR_STYLES.length,
    hairColor: HAIR_COLORS.length,
    skin: SKIN_COLORS.length,
    shirt: SHIRT_COLORS.length,
    pants: PANTS_COLORS.length,
  };
  Object.keys(limits).forEach((key) => {
    const value = figure?.[key];
    if (Number.isInteger(value) && value >= 0 && value < limits[key]) result[key] = value;
  });
  return result;
}

// Farbe heller (amount > 0) oder dunkler (amount < 0) machen
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c) => {
    const target = amount > 0 ? 255 : 0;
    return Math.round(c + (target - c) * Math.abs(amount));
  };
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Ein großes, glänzendes Auge mit Lidstrich
function eye(x, y) {
  return `
  <ellipse cx="${x}" cy="${y}" rx="7.4" ry="8.4" fill="url(#augapfel)"/>
  <circle cx="${x + 0.8}" cy="${y + 1}" r="6" fill="url(#iris)"/>
  <circle cx="${x + 0.8}" cy="${y + 1}" r="2.9" fill="#120a05"/>
  <ellipse cx="${x - 1.6}" cy="${y - 2.2}" rx="2.3" ry="2.6" fill="#fff"/>
  <circle cx="${x + 3}" cy="${y + 3.4}" r="1" fill="#fff" opacity="0.85"/>
  <path d="M${x - 7.6},${y - 2} Q${x},${y - 10.4} ${x + 7.6},${y - 2}" stroke="#3a2416" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}

// Haare hinter dem Kopf (lange Haare, Zöpfe)
function hairBack(style, line) {
  if (style === 'lang') {
    return `<path d="M18,46 Q12,9 50,8 Q88,9 82,46 L85,82 Q76,92 65,82 L35,82 Q24,92 15,82 Z" fill="url(#haare)" stroke="${line}" stroke-opacity="0.45" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M20,60 Q19,72 22,82 M80,60 Q81,72 78,82" stroke="#000" stroke-opacity="0.12" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  if (style === 'zoepfe') {
    return [12, 88]
      .map(
        (x) => `
  <ellipse cx="${x}" cy="62" rx="10" ry="16" fill="url(#haare)" stroke="${line}" stroke-opacity="0.45" stroke-width="1.2"/>
  <path d="M${x - 6},56 Q${x},60 ${x + 6},56 M${x - 6},66 Q${x},70 ${x + 6},66" stroke="#000" stroke-opacity="0.13" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <circle cx="${x > 50 ? x - 6 : x + 6}" cy="47" r="4.8" fill="url(#schleife)"/>`
      )
      .join('');
  }
  return '';
}

// Haare vor dem Kopf (Pony, Locken)
function hairFront(style, line, light) {
  if (style === 'locken') {
    const curls = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (1.05 + (i / 10) * 0.9);
      curls.push(
        `<circle cx="${(50 + Math.cos(a) * 30).toFixed(1)}" cy="${(42 + Math.sin(a) * 30).toFixed(1)}" r="10" fill="url(#locke)" stroke="${line}" stroke-opacity="0.35" stroke-width="1"/>`
      );
    }
    curls.push(`<circle cx="40" cy="20" r="10" fill="url(#locke)"/><circle cx="60" cy="20" r="10" fill="url(#locke)"/>`);
    return curls.join('\n  ');
  }
  const bangs =
    style === 'kurz'
      ? 'M19,44 Q16,14 46,11 Q74,9 81,36 Q82,44 80,46 Q74,30 60,27 Q52,34 38,30 Q28,32 22,46 Z'
      : 'M20,46 Q16,12 50,11 Q84,12 80,46 Q76,30 64,26 Q56,33 48,27 Q40,34 30,28 Q24,34 20,46 Z';
  return `<path d="${bangs}" fill="url(#haare)" stroke="${line}" stroke-opacity="0.45" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M30,22 Q44,13 62,16" stroke="${light}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M36,27 Q46,21 56,22" stroke="${light}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.5"/>`;
}

// Der Kopf: gezeichnet mit Frisur – oder das Foto aus dem Eltern-Bereich
function head(style, skinLine, hair, hairLine, photo) {
  if (photo) {
    return `<clipPath id="kopf"><circle cx="50" cy="44" r="30"/></clipPath>
  <image href="${photo}" x="20" y="14" width="60" height="60" clip-path="url(#kopf)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="50" cy="44" r="30" fill="none" stroke="${skinLine}" stroke-width="2.5"/>`;
  }
  return `<circle cx="20.5" cy="48" r="7" fill="url(#haut)"/>
  <circle cx="79.5" cy="48" r="7" fill="url(#haut)"/>
  <circle cx="21.5" cy="48" r="3.2" fill="${skinLine}" opacity="0.35"/>
  <circle cx="78.5" cy="48" r="3.2" fill="${skinLine}" opacity="0.35"/>
  <circle cx="50" cy="44" r="31" fill="url(#gesicht)"/>
  ${hairFront(style, hairLine, shade(hair, 0.45))}
  <path d="M32,34 Q37,31 43,33" stroke="${shade(hair, -0.3)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M57,33 Q63,31 68,34" stroke="${shade(hair, -0.3)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  ${eye(39, 46)}
  ${eye(61, 46)}
  <ellipse cx="28" cy="58" rx="6" ry="4" fill="#ff7f7f" opacity="0.45" filter="url(#weich)"/>
  <ellipse cx="72" cy="58" rx="6" ry="4" fill="#ff7f7f" opacity="0.45" filter="url(#weich)"/>
  <ellipse cx="50" cy="55.5" rx="2.6" ry="1.9" fill="${skinLine}" opacity="0.5"/>
  <ellipse cx="49.3" cy="54.8" rx="1" ry="0.7" fill="#fff" opacity="0.7"/>
  <path d="M43,59.5 Q50,61.5 57,59.5 Q55,67 50,67 Q45,67 43,59.5 Z" fill="#8f3426"/>
  <path d="M46,64.6 Q50,62.6 54,64.6 Q52,67 50,67 Q48,67 46,64.6 Z" fill="#ff8a8a"/>`;
}

// Rund wie ein Zylinder: in der Mitte hell, an den Seiten dunkler
function roundGradient(id, color) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(color, -0.18)}"/><stop offset="0.38" stop-color="${shade(color, 0.16)}"/><stop offset="0.65" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.24)}"/></linearGradient>`;
}

// Die ganze Figur als SVG-Text; scale = wie viele Pixel pro Punkt.
// Weich schattiert ohne harte Umrisse, damit sie zu den gemalten Tieren passt.
// photo (optional): Foto vom Gesicht als Daten-Adresse, ersetzt den Kopf
export function figureSvg(figure, scale = 1, photo = null) {
  const f = normalizeFigure(figure);
  const style = HAIR_STYLES[f.hair].id;
  const hair = HAIR_COLORS[f.hairColor].color;
  const skin = SKIN_COLORS[f.skin];
  const shirt = SHIRT_COLORS[f.shirt].color;
  const pants = PANTS_COLORS[f.pants].color;
  const skinLine = shade(skin, -0.25);
  const hairLine = shade(hair, -0.45);
  const shirtLine = shade(shirt, -0.35);
  const pantsLine = shade(pants, -0.35);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${100 * scale}" height="${150 * scale}" viewBox="0 0 100 150">
  <defs>
    <radialGradient id="haut" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${shade(skin, 0.2)}"/><stop offset="0.7" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.15)}"/></radialGradient>
    <radialGradient id="gesicht" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="${shade(skin, 0.25)}"/><stop offset="0.65" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.2)}"/></radialGradient>
    <radialGradient id="haare" cx="38%" cy="25%" r="80%"><stop offset="0" stop-color="${shade(hair, 0.35)}"/><stop offset="0.5" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, -0.35)}"/></radialGradient>
    <radialGradient id="locke" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="${shade(hair, 0.35)}"/><stop offset="0.6" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, -0.3)}"/></radialGradient>
    <radialGradient id="augapfel" cx="45%" cy="35%" r="70%"><stop offset="0.6" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe3ea"/></radialGradient>
    <radialGradient id="iris" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#a8713c"/><stop offset="0.7" stop-color="#6b4220"/><stop offset="1" stop-color="#3d240f"/></radialGradient>
    <radialGradient id="schleife" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffb3c4"/><stop offset="1" stop-color="#e35a7c"/></radialGradient>
    <radialGradient id="schuh" cx="40%" cy="25%" r="80%"><stop offset="0" stop-color="#c07b4c"/><stop offset="0.6" stop-color="#8a4f2b"/><stop offset="1" stop-color="#5c3118"/></radialGradient>
    <radialGradient id="stern" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#fff2a8"/><stop offset="0.6" stop-color="#ffd84a"/><stop offset="1" stop-color="#e8a91c"/></radialGradient>
    <radialGradient id="licht" cx="38%" cy="20%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    ${roundGradient('pulli', shirt)}
    ${roundGradient('hose', pants)}
    ${roundGradient('arm', skin)}
    <filter id="weich" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
  </defs>
  <path d="M34,108 L48,108 L47,138 Q41,141 35,138 Z" fill="url(#hose)" stroke="${pantsLine}" stroke-opacity="0.4" stroke-width="1"/>
  <path d="M52,108 L66,108 L65,138 Q59,141 53,138 Z" fill="url(#hose)" stroke="${pantsLine}" stroke-opacity="0.4" stroke-width="1"/>
  <path d="M26,145 Q25,134 38,134 Q48,134 48.5,141 L48.5,146 Q38,149.5 26,145 Z" fill="url(#schuh)"/>
  <path d="M74,145 Q75,134 62,134 Q52,134 51.5,141 L51.5,146 Q62,149.5 74,145 Z" fill="url(#schuh)"/>
  <path d="M27,145.5 Q38,148.5 48.5,146 M73,145.5 Q62,148.5 51.5,146" stroke="#f3e6d6" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="34" cy="137.5" rx="4" ry="1.8" fill="#fff" opacity="0.35"/>
  <ellipse cx="66" cy="137.5" rx="4" ry="1.8" fill="#fff" opacity="0.35"/>
  ${photo ? '' : hairBack(style, hairLine)}
  <path d="M24,86 Q17,96 19,106" stroke="url(#arm)" stroke-width="10.5" fill="none" stroke-linecap="round"/>
  <path d="M76,86 Q83,96 81,106" stroke="url(#arm)" stroke-width="10.5" fill="none" stroke-linecap="round"/>
  <circle cx="19.5" cy="108" r="7" fill="url(#haut)"/>
  <circle cx="80.5" cy="108" r="7" fill="url(#haut)"/>
  <path d="M30,73 Q50,65 70,73 Q77,95 73,117 Q50,123 27,117 Q23,95 30,73 Z" fill="url(#pulli)" stroke="${shirtLine}" stroke-opacity="0.4" stroke-width="1.2"/>
  <path d="M30,73 Q50,65 70,73 Q77,95 73,117 Q50,123 27,117 Q23,95 30,73 Z" fill="url(#licht)"/>
  <path d="M31,74 Q20,79 18.5,90 Q24,94 29,91 Z" fill="url(#pulli)" stroke="${shirtLine}" stroke-opacity="0.4" stroke-width="1.2"/>
  <path d="M69,74 Q80,79 81.5,90 Q76,94 71,91 Z" fill="url(#pulli)" stroke="${shirtLine}" stroke-opacity="0.4" stroke-width="1.2"/>
  <path d="M28,112 Q50,119 72,112" stroke="${shirtLine}" stroke-opacity="0.35" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="76" rx="15" ry="4.5" fill="#000" opacity="0.22" filter="url(#weich)"/>
  <path d="M50,86 L53,93 L60.5,93.5 L54.8,98.2 L56.7,105.5 L50,101.5 L43.3,105.5 L45.2,98.2 L39.5,93.5 L47,93 Z" fill="url(#stern)" stroke="#d99a1a" stroke-opacity="0.6" stroke-width="0.8" stroke-linejoin="round"/>
  ${head(style, skinLine, hair, hairLine, photo)}
</svg>`;
}

// Lädt die Figur als Bild unter einem neuen Namen und gibt den Namen zurück.
// Jedes Mal ein neuer Name, damit ein Bild, das gerade angezeigt wird,
// nicht verschwindet, bevor das neue fertig ist.
let counter = 0;
export function makeFigureTexture(scene, figure, scale, photo = null) {
  const key = `spielfigur-${++counter}`;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      scene.textures.addImage(key, image);
      resolve(key);
    };
    image.onerror = () => resolve(null);
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(figureSvg(figure, scale, photo))}`;
  });
}
