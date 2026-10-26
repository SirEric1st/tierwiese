// Die Wiese: eine Landschaft, die größer als der Bildschirm ist.
// Tippen → die Figur läuft dorthin. Ziehen → die Ansicht verschiebt sich.
// Aus der Bau-Leiste zieht man Dinge auf die Wiese; Dinge auf der Wiese
// kann man verschieben oder zurück auf die Leiste ziehen (wegräumen).
import { BuildBar } from '../BuildBar.js';
import { getElement } from '../elements.js';
import { say } from '../speech.js';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;
const WALK_SPEED = 260; // Pixel pro Sekunde
const DRAG_THRESHOLD = 12; // ab so vielen Pixeln Bewegung gilt es als Ziehen
const EDGE = 60; // Abstand zum Weltrand, den die Figur nicht überschreitet
const AUTO_SCROLL_ZONE = 70; // beim Ziehen am Bildschirmrand scrollt die Wiese mit
const AUTO_SCROLL_SPEED = 500; // Pixel pro Sekunde

// Ebenen: Blumen und Teiche liegen flach am Boden, alles andere wird nach
// seiner Höhe auf dem Bildschirm sortiert (weiter unten = weiter vorne).
const DEPTH_FLOWERS = 1;
const DEPTH_FLAT = 2;

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  create() {
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'gras').setOrigin(0);
    this.scatterFlowers();

    this.placed = []; // alles, was auf der Wiese steht

    this.shadow = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'schatten');
    this.player = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'figur').setOrigin(0.5, 1);
    this.updatePlayerDepth();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.centerOn(this.player.x, this.player.y - 70);

    this.bar = new BuildBar(this);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));

    this.setupInput();
  }

  onResize() {
    this.bar.layout();
  }

  // Blumen als Deko, immer an denselben Stellen
  scatterFlowers() {
    const rnd = new Phaser.Math.RandomDataGenerator(['wiese']);
    const keys = ['blume-gelb', 'blume-rosa', 'blume-weiss'];
    for (let i = 0; i < 60; i++) {
      const x = rnd.between(30, WORLD_WIDTH - 30);
      const y = rnd.between(40, WORLD_HEIGHT - 20);
      this.add.image(x, y, rnd.pick(keys)).setOrigin(0.5, 1).setDepth(DEPTH_FLOWERS);
    }
  }

  // ---------- Eingabe ----------
  //
  // Ein Fingerdruck wird erst beim Loslassen oder nach etwas Bewegung
  // eingeordnet. `this.touch.mode` sagt, worauf der Finger anfangs lag:
  //   'bar'     – ein Knopf der Bau-Leiste
  //   'element' – ein Ding auf der Wiese
  //   'world'   – freie Wiese
  setupInput() {
    this.touch = null;

    this.input.on('pointerdown', (pointer) => {
      const camera = this.cameras.main;
      const touch = { x: pointer.x, y: pointer.y, dragging: false };

      if (this.bar.contains(pointer.x, pointer.y)) {
        const slot = this.bar.slotAt(pointer.x, pointer.y);
        if (!slot) return; // Leiste zwischen den Knöpfen: nichts tun
        Object.assign(touch, { mode: 'bar', slot });
      } else {
        const item = this.itemAt(pointer.worldX, pointer.worldY);
        if (item) {
          Object.assign(touch, { mode: 'element', item, offsetX: item.x - pointer.worldX, offsetY: item.y - pointer.worldY });
        } else {
          Object.assign(touch, { mode: 'world', scrollX: camera.scrollX, scrollY: camera.scrollY });
        }
      }
      this.touch = touch;
    });

    this.input.on('pointermove', (pointer) => {
      const touch = this.touch;
      if (!touch || !pointer.isDown) return;
      if (!touch.dragging && Math.hypot(pointer.x - touch.x, pointer.y - touch.y) > DRAG_THRESHOLD) {
        this.startDrag(touch, pointer);
      }
      if (touch.dragging) this.continueDrag(touch, pointer);
    });

    this.input.on('pointerup', (pointer) => {
      const touch = this.touch;
      this.touch = null;
      if (!touch) return;
      if (touch.dragging) this.endDrag(touch, pointer);
      else this.tap(touch, pointer);
    });
  }

  tap(touch, pointer) {
    if (touch.mode === 'bar') {
      this.bar.bounce(touch.slot);
      say(touch.slot.element.hint);
    } else if (touch.mode === 'element') {
      this.wiggle(touch.item);
      say(touch.item.element.name);
    } else {
      this.walkTo(pointer.worldX, pointer.worldY);
    }
  }

  startDrag(touch, pointer) {
    touch.dragging = true;
    if (touch.mode === 'bar') {
      // Aus der Leiste wird ein neues Ding „herausgezogen“
      const item = this.createItem(touch.slot.element, pointer.worldX, pointer.worldY);
      item.setAlpha(0.8);
      touch.item = item;
      touch.offsetX = 0;
      touch.offsetY = item.element.flat ? 0 : item.displayHeight / 3;
      touch.isNew = true;
    } else if (touch.mode === 'element') {
      touch.item.setAlpha(0.8);
    }
    if (touch.item) touch.item.setDepth(50000); // beim Ziehen immer ganz vorne
  }

  continueDrag(touch, pointer) {
    if (touch.mode === 'world') {
      this.cameras.main.setScroll(touch.scrollX - (pointer.x - touch.x), touch.scrollY - (pointer.y - touch.y));
      return;
    }
    const item = touch.item;
    item.setPosition(pointer.worldX + touch.offsetX, pointer.worldY + touch.offsetY);

    // Über der Leiste wird das Ding kleiner: Loslassen heißt „wegräumen“
    const overBar = this.bar.contains(pointer.x, pointer.y);
    this.bar.setHighlight(overBar && !touch.isNew);
    item.setScale(overBar ? 0.5 : 1);
  }

  endDrag(touch, pointer) {
    this.bar.setHighlight(false);
    if (touch.mode === 'world') return;

    const item = touch.item;
    if (this.bar.contains(pointer.x, pointer.y)) {
      this.removeItem(item);
      return;
    }
    item.setAlpha(1).setScale(1);
    item.x = Phaser.Math.Clamp(item.x, EDGE, WORLD_WIDTH - EDGE);
    item.y = Phaser.Math.Clamp(item.y, EDGE * 2, WORLD_HEIGHT - 10);
    this.updateItemDepth(item);

    if (touch.isNew) {
      this.placed.push(item);
      say(item.element.name);
      this.pop(item);
    }
  }

  // Zieht man ein Ding an den Bildschirmrand, wandert die Wiese mit
  update(time, delta) {
    const touch = this.touch;
    if (!touch || !touch.dragging || !touch.item) return;

    const pointer = this.input.activePointer;
    const { width } = this.scale;
    let dx = 0;
    let dy = 0;
    if (pointer.x < AUTO_SCROLL_ZONE) dx = -1;
    else if (pointer.x > width - AUTO_SCROLL_ZONE) dx = 1;
    if (pointer.y < AUTO_SCROLL_ZONE) dy = -1;
    if (dx === 0 && dy === 0) return;

    const camera = this.cameras.main;
    const step = (AUTO_SCROLL_SPEED * delta) / 1000;
    camera.setScroll(camera.scrollX + dx * step, camera.scrollY + dy * step);
    // Position des Fingers in der Welt neu berechnen, damit das Ding mitwandert
    touch.item.setPosition(camera.scrollX + pointer.x + touch.offsetX, camera.scrollY + pointer.y + touch.offsetY);
  }

  // ---------- Dinge auf der Wiese ----------

  createItem(element, x, y) {
    const item = this.add.image(x, y, element.type);
    item.setOrigin(0.5, element.flat ? 0.5 : 1);
    item.element = element;
    return item;
  }

  removeItem(item) {
    this.placed = this.placed.filter((other) => other !== item);
    this.tweens.add({
      targets: item,
      scale: 0,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => item.destroy(),
    });
  }

  // Das oberste Ding an dieser Stelle (oder nichts)
  itemAt(worldX, worldY) {
    const hits = this.placed.filter((item) => {
      const bounds = item.getBounds();
      // Ränder der Bilder sind meist durchsichtig, daher etwas kleiner prüfen
      Phaser.Geom.Rectangle.Inflate(bounds, -bounds.width * 0.1, -bounds.height * 0.1);
      return bounds.contains(worldX, worldY);
    });
    hits.sort((a, b) => b.depth - a.depth);
    return hits[0] || null;
  }

  updateItemDepth(item) {
    item.setDepth(item.element.flat ? DEPTH_FLAT : item.y);
  }

  // Kleiner Hüpfer beim Hinstellen
  pop(item) {
    item.setScale(0.6);
    this.tweens.add({ targets: item, scale: 1, duration: 300, ease: 'Back.easeOut' });
  }

  // Wackeln beim Antippen
  wiggle(item) {
    this.tweens.add({ targets: item, angle: { from: -5, to: 5 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => item.setAngle(0) });
  }

  // ---------- Figur ----------

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
      onUpdate: () => this.updatePlayerDepth(),
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
  updatePlayerDepth() {
    this.shadow.setPosition(this.player.x, this.player.y);
    this.shadow.setDepth(this.player.y - 0.5);
    this.player.setDepth(this.player.y);
  }
}
