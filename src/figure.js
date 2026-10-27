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

function eye(x, y, r) {
  return `
  <circle cx="${x}" cy="${y}" r="${r * 1.25}" fill="#fff" stroke="#00000022" stroke-width="1"/>
  <circle cx="${x + r * 0.15}" cy="${y + r * 0.1}" r="${r}" fill="#5a3a1e"/>
  <circle cx="${x + r * 0.15}" cy="${y + r * 0.1}" r="${r * 0.55}" fill="#0d0704"/>
  <circle cx="${x - r * 0.2}" cy="${y - r * 0.35}" r="${r * 0.38}" fill="#fff"/>
  <circle cx="${x + r * 0.5}" cy="${y + r * 0.45}" r="${r * 0.17}" fill="#fff" opacity="0.9"/>`;
}

// Haare hinter dem Kopf (lange Haare, Zöpfe)
function hairBack(style, line) {
  if (style === 'lang') {
    return `<path d="M18,46 Q12,10 50,9 Q88,10 82,46 L86,84 Q74,92 64,80 L36,80 Q26,92 14,84 Z" fill="url(#haare)" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>`;
  }
  if (style === 'zoepfe') {
    return [
      [10, 60],
      [90, 60],
    ]
      .map(
        ([x, y]) => `
  <ellipse cx="${x}" cy="${y}" rx="10" ry="16" fill="url(#haare)" stroke="${line}" stroke-width="1.8"/>
  <circle cx="${x > 50 ? x - 6 : x + 6}" cy="${y - 14}" r="4.5" fill="#ff7a9a" stroke="#c94a6a" stroke-width="1.2"/>`
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
        `<circle cx="${(50 + Math.cos(a) * 30).toFixed(1)}" cy="${(42 + Math.sin(a) * 30).toFixed(1)}" r="10" fill="url(#haare)" stroke="${line}" stroke-width="1.6"/>`
      );
    }
    curls.push(`<circle cx="40" cy="20" r="10" fill="url(#haare)"/><circle cx="60" cy="20" r="10" fill="url(#haare)"/>`);
    return curls.join('\n  ');
  }
  const bangs =
    style === 'kurz'
      ? 'M19,44 Q16,14 46,11 Q74,9 81,36 Q82,44 80,46 Q74,30 60,27 Q52,34 38,30 Q28,32 22,46 Z'
      : 'M20,46 Q16,12 50,11 Q84,12 80,46 Q76,30 64,26 Q56,33 48,27 Q40,34 30,28 Q24,34 20,46 Z';
  return `<path d="${bangs}" fill="url(#haare)" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M34,18 Q46,12 60,16" stroke="${light}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`;
}

// Die ganze Figur als SVG-Text; scale = wie viele Pixel pro Punkt
export function figureSvg(figure, scale = 1) {
  const f = normalizeFigure(figure);
  const style = HAIR_STYLES[f.hair].id;
  const hair = HAIR_COLORS[f.hairColor].color;
  const skin = SKIN_COLORS[f.skin];
  const shirt = SHIRT_COLORS[f.shirt].color;
  const pants = PANTS_COLORS[f.pants].color;
  const skinLine = shade(skin, -0.25);
  const hairLine = shade(hair, -0.45);
  const shirtLine = shade(shirt, -0.3);
  const pantsLine = shade(pants, -0.3);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${100 * scale}" height="${150 * scale}" viewBox="0 0 100 150">
  <defs>
    <radialGradient id="haut" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${shade(skin, 0.15)}"/><stop offset="1" stop-color="${shade(skin, -0.1)}"/></radialGradient>
    <radialGradient id="haare" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${shade(hair, 0.25)}"/><stop offset="0.6" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, -0.25)}"/></radialGradient>
    <linearGradient id="pulli" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(shirt, 0.2)}"/><stop offset="1" stop-color="${shirt}"/></linearGradient>
    <linearGradient id="hose" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(pants, 0.15)}"/><stop offset="1" stop-color="${shade(pants, -0.1)}"/></linearGradient>
    <linearGradient id="schuh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a0603a"/><stop offset="1" stop-color="#6e3a1e"/></linearGradient>
  </defs>
  <rect x="33" y="110" width="15" height="30" rx="6" fill="url(#hose)" stroke="${pantsLine}" stroke-width="1.5"/>
  <rect x="52" y="110" width="15" height="30" rx="6" fill="url(#hose)" stroke="${pantsLine}" stroke-width="1.5"/>
  <path d="M27,146 Q27,135 39,135 Q48,135 48,142 L48,147 Q38,149 27,146 Z" fill="url(#schuh)" stroke="#55301a" stroke-width="1.5"/>
  <path d="M73,146 Q73,135 61,135 Q52,135 52,142 L52,147 Q62,149 73,146 Z" fill="url(#schuh)" stroke="#55301a" stroke-width="1.5"/>
  ${hairBack(style, hairLine)}
  <path d="M26,78 Q14,92 18,106" stroke="${shirt}" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M74,78 Q86,92 82,106" stroke="${shirt}" stroke-width="13" fill="none" stroke-linecap="round"/>
  <circle cx="18.5" cy="108" r="7" fill="url(#haut)" stroke="${skinLine}" stroke-width="1.5"/>
  <circle cx="81.5" cy="108" r="7" fill="url(#haut)" stroke="${skinLine}" stroke-width="1.5"/>
  <path d="M28,74 Q50,64 72,74 Q78,96 74,118 Q50,124 26,118 Q22,96 28,74 Z" fill="url(#pulli)" stroke="${shirtLine}" stroke-width="1.8"/>
  <path d="M30,112 Q50,118 70,112" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M33,80 Q40,76 46,78" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M50,86 L53,93 L60.5,93.5 L54.8,98.2 L56.7,105.5 L50,101.5 L43.3,105.5 L45.2,98.2 L39.5,93.5 L47,93 Z" fill="#ffd84a" stroke="#e0a91f" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="21" cy="47" r="7" fill="url(#haut)" stroke="${skinLine}" stroke-width="1.5"/>
  <circle cx="79" cy="47" r="7" fill="url(#haut)" stroke="${skinLine}" stroke-width="1.5"/>
  <circle cx="50" cy="44" r="30" fill="url(#haut)" stroke="${skinLine}" stroke-width="1.8"/>
  ${hairFront(style, hairLine, shade(hair, 0.35))}
  <path d="M33,35 Q38,32 43,34" stroke="${shade(hair, -0.3)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M57,34 Q62,32 67,35" stroke="${shade(hair, -0.3)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  ${eye(39, 46, 6.4)}
  ${eye(61, 46, 6.4)}
  <ellipse cx="29" cy="57" rx="5.5" ry="3.5" fill="#ff8f8f" opacity="0.5"/>
  <ellipse cx="71" cy="57" rx="5.5" ry="3.5" fill="#ff8f8f" opacity="0.5"/>
  <path d="M43,58 Q50,65 57,58" stroke="#9a3d2b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</svg>`;
}

// Lädt die Figur als Bild unter einem neuen Namen und gibt den Namen zurück.
// Jedes Mal ein neuer Name, damit ein Bild, das gerade angezeigt wird,
// nicht verschwindet, bevor das neue fertig ist.
let counter = 0;
export function makeFigureTexture(scene, figure, scale) {
  const key = `spielfigur-${++counter}`;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      scene.textures.addImage(key, image);
      resolve(key);
    };
    image.onerror = () => resolve(null);
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(figureSvg(figure, scale))}`;
  });
}
