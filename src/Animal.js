// Ein einzelnes Tier auf der Wiese: laufen, Gedankenblase zeigen, sprechen.
// Wann ein Tier kommt, einzieht oder geht, entscheidet der AnimalManager.
import { IMAGE_SCALE } from './display.js';
import { say } from './speech.js';

const WALK_SPEED = 170; // Pixel pro Sekunde
const WANDER_SPEED = 70;
const POND_RADIUS_X = 85; // Bereich im Teich, in dem die Ente schwimmt
const POND_RADIUS_Y = 28;

export class Animal {
  // isInWater(x, y): sagt, ob diese Stelle in einem Teich liegt
  constructor(scene, def, world, isInWater) {
    this.scene = scene;
    this.def = def;
    this.world = world; // { width, height }
    this.isInWater = isInWater;
    this.state = 'away'; // away | visiting | resident

    this.sprite = scene.add.image(0, 0, def.type).setOrigin(0.5, 1).setScale(IMAGE_SCALE);
    this.bubble = scene.add.container(0, 0, [
      scene.add.image(0, 0, 'gedankenblase').setOrigin(0.14, 0.95).setScale(IMAGE_SCALE),
    ]);
    this.bubble.setVisible(false);
    this.container = scene.add.container(0, 0, [this.sprite, this.bubble]);
    this.container.setVisible(false);
  }

  get x() {
    return this.container.x;
  }

  get y() {
    return this.container.y;
  }

  // Liegt dieser Punkt auf dem Tier?
  contains(worldX, worldY) {
    if (!this.container.visible) return false;
    const halfWidth = this.sprite.displayWidth / 2;
    return (
      worldX >= this.x - halfWidth &&
      worldX <= this.x + halfWidth &&
      worldY >= this.y - this.sprite.displayHeight &&
      worldY <= this.y + 10
    );
  }

  onTap() {
    this.hop();
    if (this.state === 'resident') say(this.def.fact);
    else if (this.missingNeed) say(this.missingNeed.wish);
  }

  // ---------- Auftritte ----------

  // Kurz vorbeischauen und zeigen, was noch fehlt
  visit(spot, missingNeed, done) {
    this.state = 'visiting';
    this.missingNeed = missingNeed;
    this.appearNear(spot);
    this.walkTo(spot.x, spot.y, WALK_SPEED, () => {
      this.showBubble(missingNeed.type);
      say(`${this.def.hello} ${missingNeed.wish}`);
      this.visitTimer = this.scene.time.delayedCall(6000, () => {
        this.hideBubble();
        this.leaveScreen(() => {
          this.state = 'away';
          done();
        });
      });
    });
  }

  // Besuch abbrechen (z. B. weil jetzt alles da ist und das Tier gleich einzieht)
  cancelVisit() {
    this.visitTimer?.remove();
    this.visitTimer = null;
    this.walkTween?.stop();
    this.stopBobbing();
    this.hideBubble();
    this.state = 'away';
  }

  // Einziehen: hinlaufen, feiern, ab jetzt auf der Wiese bleiben
  moveIn(spot, text, onArrive, done) {
    this.state = 'resident';
    this.missingNeed = null;
    this.hideBubble();
    if (!this.container.visible) this.appearNear(spot);
    this.walkTo(spot.x, spot.y, WALK_SPEED, () => {
      onArrive();
      say(text);
      this.hop();
      this.scene.time.delayedCall(3000, done);
    });
  }

  // Ohne Auftritt sofort als eingezogenes Tier dastehen (nach dem Laden)
  placeAsResident(spot) {
    this.state = 'resident';
    this.missingNeed = null;
    this.setPosition(spot.x, spot.y);
    this.container.setAlpha(1).setVisible(true);
  }

  // Ausziehen, weil etwas fehlt – kein Drama, nur ein kleiner Ausflug
  leave(missingNeed, done) {
    this.stopWandering();
    this.state = 'away';
    this.missingNeed = missingNeed;
    say('Oh, mir fehlt etwas. Ich mache einen kleinen Ausflug. Bis bald!');
    this.showBubble(missingNeed.type);
    this.scene.time.delayedCall(2500, () => {
      this.hideBubble();
      this.leaveScreen(done);
    });
  }

  // Eingezogene Tiere laufen gemütlich zwischen ihren Lieblingsplätzen umher
  startWandering(pickSpot) {
    this.stopWandering();
    const next = () => {
      if (this.state !== 'resident') return;
      this.wanderTimer = this.scene.time.delayedCall(Phaser.Math.Between(3000, 7000), () => {
        const spot = pickSpot();
        if (spot) this.walkTo(spot.x, spot.y, WANDER_SPEED, next);
        else next();
      });
    };
    next();
  }

  stopWandering() {
    this.wanderTimer?.remove();
    this.wanderTimer = null;
  }

  // ---------- Bewegung ----------

  // Taucht am Rand des sichtbaren Bereichs auf, auf der Seite, die näher am Ziel liegt
  appearNear(spot) {
    const view = this.scene.cameras.main.worldView;
    const fromLeft = spot.x - view.x < view.right - spot.x;
    const x = Phaser.Math.Clamp(fromLeft ? view.x - 80 : view.right + 80, 40, this.world.width - 40);
    this.setPosition(x, spot.y);
    this.container.setAlpha(0).setVisible(true);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 400 });
  }

  // Läuft aus dem sichtbaren Bereich hinaus und verschwindet
  leaveScreen(done) {
    const view = this.scene.cameras.main.worldView;
    const toLeft = this.x - view.x < view.right - this.x;
    const x = toLeft ? view.x - 120 : view.right + 120;
    this.walkTo(x, this.y, WALK_SPEED, () => {
      this.container.setVisible(false);
      done();
    });
  }

  walkTo(x, y, speed, onArrive) {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (Math.abs(x - this.x) > 5) this.sprite.setFlipX(x < this.x);

    this.walkTween?.stop();
    this.walkTween = this.scene.tweens.add({
      targets: this.container,
      x,
      y,
      duration: Math.max(1, (distance / speed) * 1000),
      onUpdate: () => this.updateDepth(),
      onComplete: () => {
        this.stopBobbing();
        onArrive?.();
      },
    });
    this.startBobbing();
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
    this.updateDepth();
  }

  updateDepth() {
    this.container.setDepth(this.y);
    // Schwimmende Tiere sehen im Wasser anders aus (z. B. ohne Füße)
    if (this.def.swimTexture) {
      const texture = this.isInWater(this.x, this.y) ? this.def.swimTexture : this.def.type;
      if (this.sprite.texture.key !== texture) this.sprite.setTexture(texture);
    }
  }

  startBobbing() {
    if (this.bobTween) return;
    this.bobTween = this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -5, to: 5 },
      duration: 160,
      yoyo: true,
      repeat: -1,
    });
  }

  stopBobbing() {
    this.bobTween?.stop();
    this.bobTween = null;
    this.sprite.setAngle(0);
  }

  hop() {
    this.scene.tweens.add({ targets: this.sprite, y: -30, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
  }

  // ---------- Gedankenblase ----------

  showBubble(elementType) {
    // Das Bild des fehlenden Dings sitzt in der Mitte der Wolke
    this.bubble.getAt(1)?.destroy();
    const icon = this.scene.add.image(47, -73, elementType);
    icon.setScale(64 / Math.max(icon.width, icon.height));
    this.bubble.add(icon);
    this.bubble.setPosition(10, -this.sprite.displayHeight + 10).setVisible(true);
    this.bubble.setScale(0);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 300, ease: 'Back.easeOut' });
  }

  hideBubble() {
    this.bubble.setVisible(false);
  }

  // ---------- Lieblingsplätze ----------

  // Ein Platz bei einem der Dinge, die das Tier braucht
  static spotNear(item, world) {
    let x;
    let y;
    if (item.element.type === 'teich') {
      // Im Teich schwimmen
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random();
      x = item.x + Math.cos(angle) * POND_RADIUS_X * r;
      y = item.y + 10 + Math.sin(angle) * POND_RADIUS_Y * r;
    } else {
      x = item.x + Phaser.Math.Between(-90, 90);
      y = item.y + Phaser.Math.Between(10, 40);
    }
    return {
      x: Phaser.Math.Clamp(x, 60, world.width - 60),
      y: Phaser.Math.Clamp(y, 120, world.height - 20),
    };
  }
}
