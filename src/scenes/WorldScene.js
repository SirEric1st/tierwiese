// Die Wiese: eine Landschaft, die größer als der Bildschirm ist.
// Tippen → die Figur läuft dorthin. Ziehen → die Ansicht verschiebt sich.

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;
const WALK_SPEED = 260; // Pixel pro Sekunde
const DRAG_THRESHOLD = 12; // ab so vielen Pixeln Bewegung gilt es als Ziehen
const EDGE = 60; // Abstand zum Weltrand, den die Figur nicht überschreitet

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  create() {
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'gras').setOrigin(0);
    this.scatterFlowers();

    this.shadow = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'schatten');
    this.player = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'figur').setOrigin(0.5, 1);
    this.updateDepth();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.centerOn(this.player.x, this.player.y - 70);

    this.setupInput();
  }

  // Blumen als Deko, immer an denselben Stellen
  scatterFlowers() {
    const rnd = new Phaser.Math.RandomDataGenerator(['wiese']);
    const keys = ['blume-gelb', 'blume-rosa', 'blume-weiss'];
    for (let i = 0; i < 60; i++) {
      const x = rnd.between(30, WORLD_WIDTH - 30);
      const y = rnd.between(40, WORLD_HEIGHT - 20);
      this.add.image(x, y, rnd.pick(keys)).setOrigin(0.5, 1).setDepth(y);
    }
  }

  setupInput() {
    let start = null;

    this.input.on('pointerdown', (pointer) => {
      const camera = this.cameras.main;
      start = { x: pointer.x, y: pointer.y, scrollX: camera.scrollX, scrollY: camera.scrollY, dragging: false };
    });

    this.input.on('pointermove', (pointer) => {
      if (!start || !pointer.isDown) return;
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;
      if (!start.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) start.dragging = true;
      if (start.dragging) {
        const camera = this.cameras.main;
        camera.setScroll(start.scrollX - dx, start.scrollY - dy);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (start && !start.dragging) {
        this.walkTo(pointer.worldX, pointer.worldY);
      }
      start = null;
    });
  }

  walkTo(x, y) {
    x = Phaser.Math.Clamp(x, EDGE, WORLD_WIDTH - EDGE);
    y = Phaser.Math.Clamp(y, EDGE * 2, WORLD_HEIGHT - EDGE / 2);
    this.showTapMarker(x, y);

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
    if (distance < 5) return;

    // In Laufrichtung schauen
    if (Math.abs(x - this.player.x) > 5) this.player.setFlipX(x < this.player.x);

    this.walkTween?.stop();
    this.walkTween = this.tweens.add({
      targets: this.player,
      x,
      y,
      duration: (distance / WALK_SPEED) * 1000,
      ease: 'Linear',
      onUpdate: () => this.updateDepth(),
      onComplete: () => this.stopBobbing(),
    });
    this.startBobbing();
  }

  // Leichtes Hüpfen beim Laufen
  startBobbing() {
    if (this.bobTween) return;
    this.bobTween = this.tweens.add({
      targets: this.player,
      scaleY: 0.94,
      angle: { from: -4, to: 4 },
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopBobbing() {
    this.bobTween?.stop();
    this.bobTween = null;
    this.player.setScale(1).setAngle(0);
  }

  // Ein Kreis zeigt kurz an, wohin getippt wurde
  showTapMarker(x, y) {
    const ring = this.add.circle(x, y, 26).setStrokeStyle(5, 0xffffff, 0.9).setDepth(y - 1);
    this.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 450,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // Wer weiter unten steht, wird vor den Dingen weiter oben gezeichnet
  updateDepth() {
    this.shadow.setPosition(this.player.x, this.player.y);
    this.shadow.setDepth(this.player.y - 0.5);
    this.player.setDepth(this.player.y);
  }
}
