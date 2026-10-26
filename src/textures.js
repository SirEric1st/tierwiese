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
