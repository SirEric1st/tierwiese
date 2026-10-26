// Startbildschirm mit großem Spielen-Knopf. Der erste Tipp ist nötig, weil
// Safari Ton und Sprachausgabe erst nach einer Berührung erlaubt.
import { createTextures } from '../textures.js';
import { unlockAudio } from '../sound.js';
import { say } from '../speech.js';

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create() {
    createTextures(this);

    this.background = this.add.tileSprite(0, 0, 10, 10, 'gras').setOrigin(0);
    this.button = this.createPlayButton();

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  createPlayButton() {
    const radius = 90;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(0, 8, radius);
    g.fillStyle(0xffd84a);
    g.fillCircle(0, 0, radius);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(-20, -40, 90, 40);
    g.fillStyle(0xff7a59);
    g.fillTriangle(-25, -40, -25, 40, 45, 0);

    const button = this.add.container(0, 0, [g]);
    button.setSize(radius * 2, radius * 2);
    button.setInteractive({ useHandCursor: true });

    // Sanftes Pulsieren zeigt: Hier tippen!
    this.tweens.add({
      targets: button,
      scale: 1.08,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    button.once('pointerup', () => {
      unlockAudio();
      say('Hallo! Tipp auf die Wiese, dann laufe ich dorthin.');
      this.scene.start('WorldScene');
    });
    return button;
  }

  layout() {
    const { width, height } = this.scale;
    this.background.setSize(width, height);
    this.button.setPosition(width / 2, height / 2);
  }
}
