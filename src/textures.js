// Platzhalter-Grafiken, die beim Start per Code gezeichnet werden.
// So brauchen wir für den Prototyp noch keine Bilddateien. Jede Grafik wird
// nur einmal gezeichnet und danach als fertiges Bild wiederverwendet.

export function createTextures(scene) {
  if (scene.textures.exists('gras')) return;

  drawGrass(scene);
  drawFlower(scene, 'blume-gelb', 0xffd84a);
  drawFlower(scene, 'blume-rosa', 0xff9fc4);
  drawFlower(scene, 'blume-weiss', 0xffffff);
  drawFigure(scene);
  drawShadow(scene);

  drawTree(scene, 'baum', [0x3f8f3a, 0x52a647, 0x6cc45a], false);
  drawTree(scene, 'nussbaum', [0x5e7f2e, 0x76963a, 0x91b04c], true);
  drawPond(scene);
  drawReed(scene);
  drawLeafPile(scene);
  drawBush(scene);

  drawHedgehog(scene);
  drawDuck(scene, 'ente', false);
  drawDuck(scene, 'ente-schwimmt', true);
  drawSquirrel(scene);
  drawThoughtBubble(scene);
  drawConfetti(scene);
}

// Ein großes Auge mit Glanzpunkt – macht die Tiere freundlich
function drawEye(g, x, y, r) {
  g.fillStyle(0xffffff);
  g.fillCircle(x, y, r);
  g.fillStyle(0x2a1a10);
  g.fillCircle(x + r * 0.2, y + r * 0.1, r * 0.7);
  g.fillStyle(0xffffff);
  g.fillCircle(x + r * 0.4, y - r * 0.25, r * 0.28);
}

// Alle Tiere schauen nach rechts. Ursprung unten in der Mitte (Füße).
function drawHedgehog(scene) {
  const w = 120;
  const h = 84;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(58, h - 6, 96, 14);
  // Füßchen
  g.fillStyle(0x5a3a22);
  g.fillEllipse(35, h - 10, 16, 10);
  g.fillEllipse(78, h - 10, 16, 10);
  // Stacheln: viele kleine Dreiecke rund um den Rücken
  for (let i = 0; i <= 14; i++) {
    const angle = Phaser.Math.DegToRad(170 - i * 11);
    const bx = 52 + Math.cos(angle) * 36;
    const by = 52 - Math.sin(angle) * 28;
    const tx = 52 + Math.cos(angle) * 52;
    const ty = 52 - Math.sin(angle) * 42;
    const px = -Math.sin(angle) * 8;
    const py = -Math.cos(angle) * 8;
    g.fillStyle(i % 2 ? 0x5b3b25 : 0x7a5235);
    g.fillTriangle(bx - px, by - py, bx + px, by + py, tx, ty);
  }
  g.fillStyle(0x6b4529);
  g.fillEllipse(52, 52, 80, 58);
  // Gesicht mit spitzer Schnauze
  g.fillStyle(0xe2bf8f);
  g.fillEllipse(84, 56, 44, 36);
  g.fillTriangle(90, 44, 90, 70, 116, 60);
  g.fillStyle(0x2a1a10);
  g.fillCircle(114, 59, 5);
  g.fillStyle(0xc9a070);
  g.fillCircle(76, 40, 6);
  drawEye(g, 92, 50, 7);
  g.fillStyle(0xff9f9f, 0.6);
  g.fillCircle(90, 64, 4);

  g.generateTexture('igel', w, h);
  g.destroy();
}

// Eine Stockente (Erpel): grüner Kopf, weißer Halsring, gelber Schnabel.
// Beim Schwimmen sitzt die Ente tiefer: Der untere Teil des Körpers liegt
// außerhalb des Bildes (also „unter Wasser“), die Füße sieht man nicht.
const DUCK_SINK = 20;

function drawDuck(scene, key, swimming) {
  const w = 116;
  const h = 96;
  const g = scene.make.graphics({ add: false });

  if (swimming) {
    g.save();
    g.translateCanvas(0, DUCK_SINK);
  } else {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(52, h - 5, 80, 12);
    // Füße
    g.fillStyle(0xf29a2e);
    g.fillEllipse(44, h - 8, 16, 7);
    g.fillEllipse(62, h - 8, 16, 7);
  }
  // Körper und Schwanz
  g.fillStyle(0x9d9a92);
  g.fillTriangle(8, 52, 26, 50, 22, 68);
  g.fillStyle(0xb7b3aa);
  g.fillEllipse(50, 66, 74, 40);
  g.fillStyle(0x7a5a44);
  g.fillEllipse(68, 62, 30, 26);
  // Flügel mit blauem Streifen
  g.fillStyle(0x8e8a80);
  g.fillEllipse(42, 62, 44, 22);
  g.fillStyle(0x3d63c9);
  g.fillRoundedRect(36, 62, 18, 6, 3);
  // Hals, Ring, Kopf
  g.fillStyle(0x2f7d4a);
  g.fillRoundedRect(68, 30, 18, 30, 8);
  g.fillStyle(0xffffff);
  g.fillRect(68, 50, 18, 4);
  g.fillStyle(0x2f7d4a);
  g.fillCircle(80, 28, 18);
  g.fillStyle(0x4aa36b);
  g.fillCircle(76, 22, 8);
  // Schnabel
  g.fillStyle(0xf2c230);
  g.fillEllipse(100, 32, 24, 11);
  drawEye(g, 84, 24, 6);

  if (swimming) {
    g.restore();
    // Kleine Wellen rund um den Körper
    g.lineStyle(3, 0xffffff, 0.7);
    g.strokeEllipse(50, h - 5, 92, 12);
  }

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawSquirrel(scene) {
  const w = 110;
  const h = 120;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(56, h - 5, 80, 12);
  // Buschiger Schwanz, nach oben eingerollt
  g.fillStyle(0xb5531f);
  g.fillEllipse(26, 70, 46, 74);
  g.fillCircle(30, 30, 25);
  g.fillStyle(0xd06a2a);
  g.fillEllipse(28, 68, 30, 58);
  g.fillCircle(32, 32, 16);
  // Körper und heller Bauch
  g.fillStyle(0xc9612a);
  g.fillEllipse(62, 86, 44, 54);
  g.fillStyle(0xf3dcb8);
  g.fillEllipse(70, 90, 24, 38);
  // Füße und Pfötchen
  g.fillStyle(0xa94f1f);
  g.fillEllipse(54, h - 9, 20, 10);
  g.fillEllipse(74, h - 9, 20, 10);
  g.fillCircle(80, 80, 6);
  // Kopf mit Pinsel-Ohren
  g.fillStyle(0xc9612a);
  g.fillTriangle(62, 32, 70, 8, 78, 34);
  g.fillTriangle(78, 30, 90, 6, 94, 34);
  g.fillCircle(80, 48, 22);
  g.fillEllipse(96, 54, 22, 18);
  g.fillStyle(0xf3dcb8);
  g.fillEllipse(94, 60, 16, 10);
  g.fillStyle(0x2a1a10);
  g.fillCircle(106, 52, 4);
  drawEye(g, 88, 44, 7);
  g.fillStyle(0xff9f9f, 0.6);
  g.fillCircle(90, 58, 4);

  g.generateTexture('eichhoernchen', w, h);
  g.destroy();
}

// Gedankenblase: weiße Wolke mit zwei kleinen Kreisen nach unten
function drawThoughtBubble(scene) {
  const w = 130;
  const h = 130;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(66, 54, 120, 98);
  g.fillStyle(0xffffff);
  g.fillCircle(40, 50, 32);
  g.fillCircle(90, 50, 32);
  g.fillCircle(65, 30, 30);
  g.fillCircle(65, 66, 30);
  g.fillCircle(30, 104, 9);
  g.fillCircle(18, 122, 6);

  g.generateTexture('gedankenblase', w, h);
  g.destroy();
}

// Konfetti in fünf Farben, als einzelne Bildausschnitte (Frames 0 bis 4)
export const CONFETTI_COLORS = [0xff7a59, 0xffd84a, 0x5aa9ec, 0x7cd36b, 0xff9fc4];

function drawConfetti(scene) {
  const g = scene.make.graphics({ add: false });
  CONFETTI_COLORS.forEach((color, i) => {
    g.fillStyle(color);
    g.fillRect(i * 12, 0, 12, 7);
  });
  g.generateTexture('konfetti', CONFETTI_COLORS.length * 12, 7);
  g.destroy();
  const texture = scene.textures.get('konfetti');
  CONFETTI_COLORS.forEach((_, i) => texture.add(i, 0, i * 12, 0, 12, 7));
}

// Bäume: Stamm plus Krone aus überlappenden Kreisen, von dunkel nach hell,
// das ergibt den weichen „3D-Look“. Der Nussbaum trägt zusätzlich Walnüsse.
function drawTree(scene, key, greens, withNuts) {
  const w = 180;
  const h = 230;
  const g = scene.make.graphics({ add: false });
  const cx = w / 2;

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, h - 10, 110, 22);
  g.fillStyle(0x7a4a26);
  g.fillRoundedRect(cx - 14, 120, 28, h - 128, 10);
  g.fillStyle(0x93603a);
  g.fillRoundedRect(cx - 8, 124, 8, h - 136, 4);

  const blobs = [
    [cx, 75, 62],
    [cx - 45, 105, 42],
    [cx + 45, 105, 42],
    [cx - 30, 55, 40],
    [cx + 32, 58, 40],
  ];
  greens.forEach((color, i) => {
    g.fillStyle(color);
    const shrink = i * 7;
    blobs.forEach(([x, y, r]) => g.fillCircle(x - i * 3, y - i * 4, r - shrink));
  });

  if (withNuts) {
    const nuts = [[cx - 40, 95], [cx + 20, 110], [cx + 48, 80], [cx - 10, 60], [cx - 55, 120], [cx + 38, 128]];
    nuts.forEach(([x, y]) => {
      g.fillStyle(0x9a6a3c);
      g.fillCircle(x, y, 8);
      g.fillStyle(0xc49260);
      g.fillCircle(x - 2, y - 2, 4);
    });
  }

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawPond(scene) {
  const w = 280;
  const h = 160;
  const g = scene.make.graphics({ add: false });
  const cx = w / 2;
  const cy = h / 2;

  // Steine am Ufer
  g.fillStyle(0xa9a39a);
  g.fillEllipse(cx, cy + 4, w - 4, h - 8);
  g.fillStyle(0x3f8fd8);
  g.fillEllipse(cx, cy, w - 30, h - 34);
  g.fillStyle(0x5aa9ec);
  g.fillEllipse(cx - 6, cy - 6, w - 70, h - 64);
  // Lichtreflexe
  g.fillStyle(0xffffff, 0.45);
  g.fillEllipse(cx - 55, cy - 22, 60, 12);
  g.fillEllipse(cx + 40, cy + 18, 36, 8);
  // Seerosenblatt
  g.fillStyle(0x4f9a45);
  g.slice(cx + 70, cy - 10, 18, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330));
  g.fillPath();

  g.generateTexture('teich', w, h);
  g.destroy();
}

// Schilf mit fedrigen Blütenrispen an der Spitze
function drawReed(scene) {
  const w = 100;
  const h = 150;
  const g = scene.make.graphics({ add: false });

  const stalks = [
    [22, 40, -6],
    [40, 22, 2],
    [58, 30, 8],
    [76, 46, 12],
    [50, 50, -10],
  ];
  stalks.forEach(([x, top, lean]) => {
    g.lineStyle(4, 0x6f9e3c);
    g.lineBetween(x, h - 4, x + lean, top + 16);
    // langes Blatt
    g.lineStyle(5, 0x86b44c);
    g.lineBetween(x, h - 30, x + lean * 2 + 14, top + 60);
    // Rispe
    g.fillStyle(0xb08a5a);
    g.fillEllipse(x + lean, top + 8, 14, 32);
    g.fillStyle(0xd3b386);
    g.fillEllipse(x + lean - 2, top + 4, 7, 20);
  });

  g.generateTexture('schilf', w, h);
  g.destroy();
}

function drawLeafPile(scene) {
  const w = 140;
  const h = 90;
  const g = scene.make.graphics({ add: false });
  const rnd = new Phaser.Math.RandomDataGenerator(['laub']);
  const colors = [0xd9762b, 0xe8a23a, 0xb8502a, 0xf0c04a, 0x9c6b30];

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(w / 2, h - 8, w - 10, 18);
  // Von unten nach oben Blätter stapeln, oben werden es weniger → Hügelform
  for (let row = 0; row < 6; row++) {
    const y = h - 14 - row * 10;
    const halfWidth = 60 - row * 9;
    for (let i = 0; i < 9 - row; i++) {
      const x = w / 2 + rnd.between(-halfWidth, halfWidth);
      g.fillStyle(rnd.pick(colors));
      g.fillEllipse(x, y + rnd.between(-3, 3), 22, 13);
    }
  }

  g.generateTexture('laubhaufen', w, h);
  g.destroy();
}

function drawBush(scene) {
  const w = 140;
  const h = 110;
  const g = scene.make.graphics({ add: false });
  const cx = w / 2;

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, h - 8, 120, 18);
  const blobs = [
    [cx - 35, 70, 30],
    [cx + 35, 70, 30],
    [cx, 52, 38],
    [cx - 18, 78, 28],
    [cx + 18, 78, 28],
  ];
  [0x2f7a34, 0x3f9142, 0x58ad55].forEach((color, i) => {
    g.fillStyle(color);
    blobs.forEach(([x, y, r]) => g.fillCircle(x - i * 2, y - i * 4, r - i * 6));
  });

  g.generateTexture('busch', w, h);
  g.destroy();
}

function drawGrass(scene) {
  const size = 256;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x7cc66b);
  g.fillRect(0, 0, size, size);

  // Ein paar hellere und dunklere Grasbüschel für etwas Struktur
  const rnd = new Phaser.Math.RandomDataGenerator(['gras']);
  for (let i = 0; i < 70; i++) {
    const x = rnd.between(4, size - 4);
    const y = rnd.between(4, size - 4);
    g.fillStyle(rnd.pick([0x6fb85f, 0x89d277, 0x74bf63]));
    g.fillTriangle(x - 3, y + 4, x, y - 6, x + 3, y + 4);
  }
  g.generateTexture('gras', size, size);
  g.destroy();
}

function drawFlower(scene, key, color) {
  const g = scene.make.graphics({ add: false });
  g.lineStyle(3, 0x4f9a45);
  g.lineBetween(16, 18, 16, 34);
  g.fillStyle(color);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    g.fillCircle(16 + Math.cos(angle) * 7, 14 + Math.sin(angle) * 7, 6);
  }
  g.fillStyle(0xffa630);
  g.fillCircle(16, 14, 5);
  g.generateTexture(key, 32, 36);
  g.destroy();
}

function drawShadow(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(40, 12, 80, 24);
  g.generateTexture('schatten', 80, 24);
  g.destroy();
}

// Eine einfache, freundliche Kinderfigur (wird in Version 0.2 durch den
// Figuren-Editor ersetzt). Der Ursprung liegt unten in der Mitte (Füße).
function drawFigure(scene) {
  const w = 100;
  const h = 150;
  const g = scene.make.graphics({ add: false });
  const cx = w / 2;

  // Beine und Schuhe
  g.fillStyle(0x3d5a99);
  g.fillRoundedRect(cx - 18, 110, 14, 30, 6);
  g.fillRoundedRect(cx + 4, 110, 14, 30, 6);
  g.fillStyle(0x8b4a2b);
  g.fillRoundedRect(cx - 22, 136, 20, 12, 6);
  g.fillRoundedRect(cx + 2, 136, 20, 12, 6);

  // Arme
  g.fillStyle(0xf2c39b);
  g.fillCircle(cx - 30, 104, 7);
  g.fillCircle(cx + 30, 104, 7);
  g.fillStyle(0xff7a59);
  g.fillRoundedRect(cx - 36, 74, 13, 30, 6);
  g.fillRoundedRect(cx + 23, 74, 13, 30, 6);

  // Pullover
  g.fillStyle(0xff7a59);
  g.fillRoundedRect(cx - 26, 70, 52, 48, 16);
  g.fillStyle(0xffd84a);
  g.fillCircle(cx, 94, 8);

  // Kopf
  g.fillStyle(0xf2c39b);
  g.fillCircle(cx, 44, 30);

  // Haare
  g.fillStyle(0x7a4a26);
  g.fillEllipse(cx, 22, 64, 30);
  g.fillCircle(cx - 26, 34, 10);
  g.fillCircle(cx + 26, 34, 10);

  // Große Augen mit Glanzpunkt
  g.fillStyle(0xffffff);
  g.fillEllipse(cx - 11, 46, 16, 19);
  g.fillEllipse(cx + 11, 46, 16, 19);
  g.fillStyle(0x3a2a1a);
  g.fillCircle(cx - 10, 48, 6);
  g.fillCircle(cx + 12, 48, 6);
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 8, 45, 2.5);
  g.fillCircle(cx + 14, 45, 2.5);

  // Wangen und Lächeln
  g.fillStyle(0xff9f9f, 0.6);
  g.fillCircle(cx - 20, 58, 5);
  g.fillCircle(cx + 20, 58, 5);
  g.lineStyle(3, 0x8a3b2b);
  g.beginPath();
  g.arc(cx, 56, 8, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
  g.strokePath();

  g.generateTexture('figur', w, h);
  g.destroy();
}
