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
