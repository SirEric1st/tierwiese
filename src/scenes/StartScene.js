// Startbildschirm mit großem Spielen-Knopf. Der erste Tipp ist nötig, weil
// Safari Ton und Sprachausgabe erst nach einer Berührung erlaubt.
import { IMAGE_SCALE, screenSize, setupCamera, toScreen, uiOrigin } from '../display.js';
import { createTextures, preloadGraphics } from '../textures.js';
import { requestPersistentStorage } from '../save.js';
import { unlockAudio } from '../sound.js';
import { say } from '../speech.js';

const BUTTON_RADIUS = 90;

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  preload() {
    preloadGraphics(this);
  }

  create() {
    createTextures(this);
    setupCamera(this);

    this.ui = this.add.container(0, 0);
    this.background = this.add.tileSprite(0, 0, 10, 10, 'gras').setOrigin(0).setTileScale(IMAGE_SCALE);
    this.ui.add(this.background);

    // Die drei Tiere schauen dem Knopf zu
    this.animals = [
      { key: 'eichhoernchen', dx: -190, dy: 20 },
      { key: 'igel', dx: 170, dy: 70 },
      { key: 'ente', dx: 150, dy: -60 },
    ].map(({ key, dx, dy }) => {
      const image = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(IMAGE_SCALE);
      if (dx > 0) image.setFlipX(true);
      image.offset = { dx, dy };
      this.ui.add(image);
      return image;
    });

    this.button = this.createPlayButton();
    this.ui.add(this.button);

    this.input.once('pointerup', (pointer) => this.onTap(pointer));

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  createPlayButton() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(0, 10, BUTTON_RADIUS);
    g.fillStyle(0xf2b52a);
    g.fillCircle(0, 0, BUTTON_RADIUS);
    g.fillStyle(0xffd84a);
    g.fillCircle(-4, -5, BUTTON_RADIUS - 8);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(-22, -44, 90, 36);
    g.lineStyle(4, 0xd99a1c);
    g.strokeCircle(0, 0, BUTTON_RADIUS);
    g.fillStyle(0xe2553a);
    g.fillTriangle(-22, -38, -22, 42, 48, 2);
    g.fillStyle(0xff7a59);
    g.fillTriangle(-25, -42, -25, 38, 45, -2);

    const button = this.add.container(0, 0, [g]);
    // Sanftes Pulsieren zeigt: Hier tippen!
    this.tweens.add({
      targets: button,
      scale: 1.08,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return button;
  }

  onTap(pointer) {
    const { x, y } = toScreen(pointer);
    // Nur der Knopf startet das Spiel (großzügig gerechnet)
    if (Phaser.Math.Distance.Between(x, y, this.button.x, this.button.y) > BUTTON_RADIUS + 30) {
      this.input.once('pointerup', (p) => this.onTap(p));
      return;
    }
    unlockAudio();
    requestPersistentStorage();
    say('Hallo! Tipp auf die Wiese, dann laufe ich dorthin.');
    this.scene.start('WorldScene');
  }

  layout() {
    const { width, height } = screenSize(this);
    const origin = uiOrigin(this);
    this.ui.setPosition(origin.x, origin.y);
    this.background.setSize(width, height);
    this.button.setPosition(width / 2, height / 2);
    this.animals.forEach((image) => image.setPosition(width / 2 + image.offset.dx, height / 2 + image.offset.dy + 60));
  }
}
