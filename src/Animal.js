// Ein einzelnes Tier auf der Wiese: laufen, Gedankenblase zeigen, sprechen.
// Wann ein Tier kommt, einzieht oder geht, entscheidet der AnimalManager.
import { DPR, IMAGE_SCALE } from './display.js';
import { getFood } from './foods.js';
import { isPainted } from './textures.js';
import { playHappy } from './sound.js';
import { SAETZE, dislikeText } from './saetze.js';
import { say, sayImportant } from './speech.js';

const WALK_SPEED = 170; // Pixel pro Sekunde
const WANDER_SPEED = 70;
const POND_RADIUS_X = 105; // Bereich im Teich, in dem die Ente schwimmt
const POND_RADIUS_Y = 36;
const SHORE_RADIUS_X = 145; // vorne am Steinufer des Teich-Bilds (knapp außerhalb)
const SHORE_RADIUS_Y = 84;
const HEART_EVERY = 60; // nach so vielen Punkten Streicheln steigt ein Herz auf
const PET_TALK_DISTANCE = 150; // so viel streicheln, bis das Tier etwas sagt
const PET_TALK_PAUSE = 5000; // danach eine Weile nichts mehr sagen
const MIN_TOUCH = 64; // auch kleine Tiere sind mindestens so groß antippbar
const FLY_HEIGHT = 45; // so hoch schweben fliegende Tiere über dem Boden
const DEPTH_GUEST = 40000; // Tiere zu Besuch werden vor allem anderen gezeichnet
const SNORE_EVERY = 1800; // so oft steigt beim Schlafen ein „Z“ auf
const FONT = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

export class Animal {
  // isInWater(x, y): sagt, ob diese Stelle in einem Teich liegt
  constructor(scene, def, world, isInWater) {
    this.scene = scene;
    this.def = def;
    this.world = world; // { width, height }
    this.isInWater = isInWater;
    this.state = 'away'; // away | visiting | resident
    this.care = {}; // Album-Sticker: fed, petted, favorite (siehe progress.js)
    this.onCare = null; // wird aufgerufen, wenn ein Sticker neu dazukommt

    this.sprite = scene.add.image(0, 0, def.type).setOrigin(0.5, 1).setScale(IMAGE_SCALE);
    // Fliegende Tiere schweben: Das Bild hängt in einem eigenen Behälter über dem Boden
    this.lift = def.flies ? FLY_HEIGHT : 0;
    this.body = scene.add.container(0, -this.lift, [this.sprite]);
    if (def.flies) this.startHovering();
    // KI-Bilder und fliegende Tiere bekommen einen Schatten am Boden
    this.shadow = scene.add.image(0, -4, 'schatten').setVisible(isPainted(def.type) || def.flies);
    this.shadow.setScale((this.sprite.displayWidth * 0.8) / this.shadow.width, IMAGE_SCALE * 1.2);
    this.bubble = scene.add.container(0, 0, [
      scene.add.image(0, 0, 'gedankenblase').setOrigin(0.14, 0.95).setScale(IMAGE_SCALE),
    ]);
    this.bubble.setVisible(false);
    this.container = scene.add.container(0, 0, [this.shadow, this.body, this.bubble]);
    this.container.setVisible(false);
  }

  get x() {
    return this.container.x;
  }

  get y() {
    return this.container.y;
  }

  // Oberkante des Tieres (bei fliegenden Tieren über dem Boden)
  get top() {
    return this.y + this.body.y - this.sprite.displayHeight;
  }

  // Liegt dieser Punkt auf dem Tier?
  contains(worldX, worldY) {
    if (!this.container.visible) return false;
    const halfWidth = Math.max(this.sprite.displayWidth, MIN_TOUCH) / 2;
    const top = Math.min(this.top, this.y - MIN_TOUCH);
    return worldX >= this.x - halfWidth && worldX <= this.x + halfWidth && worldY >= top && worldY <= this.y + 10;
  }

  onTap() {
    if (this.hibernating) {
      say(this.def.winter.text);
      return;
    }
    if (this.sleeping) {
      this.squish();
      say(this.sleepText());
      return;
    }
    this.hop();
    if (this.state === 'visiting') this.onGuestTap?.(); // Rätsel noch einmal hören
    else if (this.state === 'resident') say(this.def.fact);
    else if (this.missingNeed) say(this.missingNeed.wish);
  }

  // ---------- Streicheln ----------

  // Finger liegt auf dem Tier und bewegt sich: stehen bleiben und genießen
  startPetting() {
    this.petting = true;
    this.petDistance = 0;
    this.holdStill();
  }

  // distance: wie weit sich der Finger über dem Tier bewegt hat
  pet(distance) {
    if (!this.petting || this.state !== 'resident') return;
    const before = this.petDistance;
    this.petDistance += distance;
    if (Math.floor(this.petDistance / HEART_EVERY) > Math.floor(before / HEART_EVERY)) {
      this.showHeart();
      this.squish();
    }
    // Genug gestreichelt gibt einen Sticker (auch wenn das Tier dabei schläft)
    if (before < PET_TALK_DISTANCE && this.petDistance >= PET_TALK_DISTANCE) this.earnSticker('petted');
    const now = this.scene.time.now;
    if (
      !this.sleeping &&
      before < PET_TALK_DISTANCE &&
      this.petDistance >= PET_TALK_DISTANCE &&
      !(now - this.lastPetTalk < PET_TALK_PAUSE)
    ) {
      this.lastPetTalk = now;
      playHappy();
      say(this.def.petted);
    }
  }

  stopPetting() {
    if (!this.petting) return;
    this.petting = false;
    this.moveOn();
  }

  // Beim Streicheln und Fressen bleibt das Tier stehen …
  holdStill() {
    this.walkTween?.pause();
    this.stopBobbing();
  }

  // … und läuft danach weiter, wenn es nicht gerade noch etwas anderes genießt
  moveOn() {
    if (this.petting || this.eating) return;
    if (this.walkTween?.isPaused()) {
      this.walkTween.resume();
      this.startBobbing();
    }
  }

  // ---------- Füttern ----------

  // image: das Futter-Bild, das gerade beim Tier losgelassen wurde
  // Ergebnis: 'eaten' (gefressen), true (nicht gefressen), false (nicht für dieses Tier)
  feed(food, image) {
    if (this.state !== 'resident' || this.eating) return false;
    if (this.sleeping) {
      // Wer schläft, frisst nicht: Das Futter verschwindet wieder
      this.scene.tweens.add({ targets: image, alpha: 0, scale: 0, duration: 500, onComplete: () => image.destroy() });
      this.squish();
      say(this.sleepText());
      return true;
    }
    this.eating = true;
    this.holdStill();
    if (this.def.eats.includes(food.type)) {
      // Lecker: Das Futter wandert zum Maul und verschwindet
      const mouthX = this.x + (this.sprite.flipX ? -1 : 1) * this.sprite.displayWidth * 0.35;
      this.scene.tweens.add({
        targets: image,
        x: mouthX,
        y: this.y - this.lift - this.sprite.displayHeight * 0.5,
        scale: 0,
        duration: 400,
        ease: 'Quad.easeIn',
        onComplete: () => image.destroy(),
      });
      this.scene.time.delayedCall(400, () => {
        this.squish();
        playHappy();
        say(this.def.yummy);
        this.earnSticker('fed');
        if (food.type === this.def.eats[0]) this.scene.time.delayedCall(700, () => this.earnSticker('favorite'));
      });
      [500, 800, 1100].forEach((delay) => this.scene.time.delayedCall(delay, () => this.showHeart()));
      this.scene.time.delayedCall(1500, () => this.finishEating());
      return 'eaten';
    } else {
      // Mag es nicht: freundlich den Kopf schütteln und zeigen, was es lieber frisst
      const favorite = getFood(this.def.eats[0]);
      this.scene.tweens.add({ targets: image, alpha: 0, y: image.y + 20, duration: 700, onComplete: () => image.destroy() });
      this.shakeHead();
      this.showBubble(favorite.type);
      say(dislikeText(favorite));
      this.scene.time.delayedCall(3000, () => {
        this.hideBubble();
        this.finishEating();
      });
    }
    return true;
  }

  // Freundlich den Kopf schütteln: „Nein, das nicht“
  shakeHead() {
    this.scene.tweens.add({ targets: this.sprite, angle: { from: -10, to: 10 }, duration: 110, yoyo: true, repeat: 3, onComplete: () => this.sprite.setAngle(0) });
  }

  // Ein Album-Sticker: nur beim ersten Mal ein Ereignis
  earnSticker(key) {
    if (this.care[key]) return;
    this.care[key] = true;
    this.onCare?.(this, key);
  }

  finishEating() {
    this.eating = false;
    this.moveOn();
  }

  showHeart() {
    const heart = this.scene.add
      .image(this.x + Phaser.Math.Between(-25, 25), this.top, 'herz')
      .setScale(IMAGE_SCALE)
      .setDepth(60000);
    this.scene.tweens.add({
      targets: heart,
      y: heart.y - 70,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => heart.destroy(),
    });
  }

  // Kurz zusammenkuscheln, wie ein wohliges Zucken
  squish() {
    if (this.squishTween?.isPlaying()) return;
    this.squishTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: this.sprite.scaleY * 0.9,
      scaleX: this.sprite.scaleX * 1.05,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  // ---------- Auftritte ----------

  // Zu Besuch: ins Bild kommen und warten, bis das Rätsel gelöst ist
  // (was das Tier sagt und sucht, regelt der AnimalManager)
  arriveAsGuest(spot, onArrive) {
    this.state = 'visiting';
    this.missingNeed = null;
    this.appearNear(spot);
    this.walkTo(spot.x, spot.y, WALK_SPEED, onArrive);
  }

  // Besuch beenden, ohne einzuziehen (z. B. weil es Winter wird)
  leaveAsGuest(done) {
    this.hideBubble();
    this.leaveScreen(() => {
      this.state = 'away';
      done?.();
    });
  }

  // Einziehen: hinlaufen, feiern, ab jetzt auf der Wiese bleiben
  moveIn(spot, text, onArrive, done) {
    this.state = 'resident';
    this.missingNeed = null;
    this.hideBubble();
    if (!this.container.visible) this.appearNear(spot);
    this.walkTo(spot.x, spot.y, WALK_SPEED, () => {
      onArrive();
      this.hop();
      // Weiter geht es, wenn der Satz zu Ende ist (aber frühestens nach 2 Sekunden)
      const start = this.scene.time.now;
      sayImportant(text, () => this.scene.time.delayedCall(Math.max(0, 2000 - (this.scene.time.now - start)), done));
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
    if (this.hibernating) {
      // Das Versteck ist weg: still aus dem Winterschlaf verschwinden
      this.stopHibernating();
      this.state = 'away';
      this.missingNeed = missingNeed;
      this.container.setVisible(false);
      this.scene.time.delayedCall(0, done);
      return;
    }
    this.setSleeping(false);
    this.stopWandering();
    this.state = 'away';
    this.missingNeed = missingNeed;
    say(SAETZE.leave);
    this.showBubble(missingNeed.type);
    this.scene.time.delayedCall(2500, () => {
      this.hideBubble();
      this.leaveScreen(done);
    });
  }

  // Eingezogene Tiere laufen gemütlich zwischen ihren Lieblingsplätzen umher
  startWandering(pickSpot) {
    this.stopWandering();
    this.pickSpot = pickSpot;
    const next = () => {
      if (this.state !== 'resident') return;
      this.wanderTimer = this.scene.time.delayedCall(Phaser.Math.Between(3000, 7000), () => {
        if (this.petting || this.eating || this.sleeping || this.hibernating) return next(); // dann bleibt es stehen
        if (this.def.stash && this.season === 'herbst' && Math.random() < 0.4) {
          this.stash();
          this.scene.time.delayedCall(1300, () => this.moveOn());
          return next();
        }
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

  // ---------- Schlafen ----------

  // Tagtiere schlafen nachts, Nachttiere am Tag. Schlafende Tiere bleiben
  // stehen, ducken sich etwas, und kleine „Z“ steigen auf.
  setSleeping(on) {
    if (Boolean(this.sleeping) === on) return;
    this.sleeping = on;
    this.squishTween?.stop();
    if (on) {
      this.walkTween?.stop();
      this.stopBobbing();
      this.hideBubble();
      this.sprite.setScale(IMAGE_SCALE * 1.04, IMAGE_SCALE * 0.9);
      if (this.def.flies) this.land();
      this.startSnoring();
    } else {
      this.stopSnoring();
      this.sprite.setScale(IMAGE_SCALE);
      if (this.def.flies) this.startHovering();
    }
  }

  // Aufwachen und wieder umherlaufen
  wakeUp() {
    if (!this.sleeping) return;
    this.setSleeping(false);
    this.hop();
    if (this.state === 'resident' && this.pickSpot) this.startWandering(this.pickSpot);
  }

  sleepText() {
    return this.def.nocturnal ? SAETZE.sleepNocturnal : SAETZE.sleepDiurnal;
  }

  startSnoring() {
    this.stopSnoring();
    this.snoreTimer = this.scene.time.addEvent({
      delay: SNORE_EVERY,
      startAt: Phaser.Math.Between(0, SNORE_EVERY - 1),
      loop: true,
      callback: () => this.snore(),
    });
  }

  stopSnoring() {
    this.snoreTimer?.remove();
    this.snoreTimer = null;
  }

  // Ein „Z“ steigt auf – aber nur, wenn man das Tier (oder sein Winterversteck) gerade sieht
  snore() {
    let x = this.x + 12;
    let y = this.top + 6;
    if (this.hibernating) {
      if (!this.shelter.active) return;
      x = this.shelter.x + 10;
      y = this.shelter.y - this.shelter.displayHeight * (this.shelter.originY === 1 ? 0.7 : 0.2);
    } else if (!this.container.visible) return;
    if (!this.scene.cameras.main.worldView.contains(x, y)) return;
    const z = this.scene.add
      .text(x, y, 'Z', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#4a5aa0',
        strokeThickness: 5,
        resolution: DPR,
      })
      .setOrigin(0.5)
      .setScale(0.8)
      .setDepth(60000);
    this.scene.tweens.add({
      targets: z,
      x: z.x + 30,
      y: z.y - 60,
      scale: 1.3,
      alpha: { value: 0, ease: 'Quad.easeIn' }, // erst am Ende verblassen
      duration: 2000,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }

  // ---------- Winter ----------

  // Zum Versteck laufen und darin verschwinden (Winterschlaf, Winterruhe, Winterstarre)
  hibernate(shelter) {
    if (this.hibernating) return;
    this.setSleeping(false);
    this.stopWandering();
    this.hideBubble();
    this.hibernating = true;
    this.shelter = shelter;
    this.walkTo(shelter.x, shelter.y + 5, WALK_SPEED, () => {
      if (!this.hibernating) return;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        onComplete: () => {
          if (this.hibernating) this.container.setVisible(false);
          this.container.setAlpha(1).setScale(1);
          this.hoverTween?.stop(); // im Versteck wird nicht geschwebt
        },
      });
      this.startSnoring();
    });
  }

  // Beim Laden im Winter: gleich im Versteck sein
  placeHibernating(shelter) {
    this.hibernating = true;
    this.shelter = shelter;
    this.setPosition(shelter.x, shelter.y + 5);
    this.container.setVisible(false);
    this.startSnoring();
  }

  // Im Frühling wieder aus dem Versteck kommen
  wakeFromHibernation() {
    if (!this.hibernating) return;
    this.stopHibernating();
    if (this.shelter?.active) this.setPosition(this.shelter.x, this.shelter.y + 15);
    this.container.setAlpha(0).setScale(0.5).setVisible(true);
    if (this.def.flies) this.startHovering();
    this.scene.tweens.add({ targets: this.container, alpha: 1, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.hop();
  }

  stopHibernating() {
    this.hibernating = false;
    this.stopSnoring();
    this.walkTween?.stop();
    this.stopBobbing();
  }

  // Im Herbst: eine Nuss vergraben
  stash() {
    const front = this.sprite.flipX ? -1 : 1;
    const x = this.x + front * this.sprite.displayWidth * 0.4;
    const nut = this.scene.add.image(x, this.top + this.sprite.displayHeight * 0.4, this.def.stash);
    nut.setScale(36 / Math.max(nut.width, nut.height)).setDepth(this.y + 1);
    this.holdStill();
    this.scene.tweens.add({ targets: nut, y: this.y - 4, duration: 350, ease: 'Bounce.easeOut' });
    this.scene.tweens.add({ targets: this.sprite, angle: { from: -8, to: 8 }, duration: 100, yoyo: true, repeat: 4, delay: 350, onComplete: () => this.sprite.setAngle(0) });
    this.scene.tweens.add({ targets: nut, scale: 0, alpha: 0, duration: 600, delay: 600, onComplete: () => nut.destroy() });
  }

  // Fliegende Tiere schweben auf und ab …
  startHovering() {
    this.hoverTween?.stop();
    this.body.y = -this.lift;
    this.hoverTween = this.scene.tweens.add({ targets: this.body, y: -this.lift - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // … und landen zum Schlafen auf dem Boden
  land() {
    this.hoverTween?.stop();
    this.hoverTween = this.scene.tweens.add({ targets: this.body, y: 0, duration: 600, ease: 'Quad.easeOut' });
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
    // Zu Besuch immer vorne, damit man Tier und Gedankenblase sieht
    this.container.setDepth(this.state === 'visiting' ? DEPTH_GUEST + this.y : this.y);
    // Schwimmende Tiere sehen im Wasser anders aus (z. B. ohne Füße)
    if (this.def.swimTexture) {
      const texture = this.isInWater(this.x, this.y) ? this.def.swimTexture : this.def.type;
      if (this.sprite.texture.key !== texture) this.sprite.setTexture(texture);
      this.shadow.setVisible(isPainted(this.def.type) && texture === this.def.type);
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
    const icon = this.scene.add.image(47, -73, elementType);
    icon.setScale(64 / Math.max(icon.width, icon.height));
    this.popBubble(icon);
  }

  // Ein Fragezeichen in der Wolke: Was suche ich wohl?
  showQuestion() {
    const mark = this.scene.add
      .text(47, -73, '?', { fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: '#e2853a', resolution: DPR })
      .setOrigin(0.5);
    this.popBubble(mark);
  }

  popBubble(content) {
    this.bubble.getAt(1)?.destroy();
    this.bubble.add(content);
    this.bubble.setPosition(10, this.top - this.y + 10).setVisible(true);
    this.bubble.setScale(0);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 300, ease: 'Back.easeOut' });
  }

  hideBubble() {
    this.bubble.setVisible(false);
  }

  // ---------- Lieblingsplätze ----------

  // Ein Platz bei einem der Dinge, die das Tier braucht
  static spotNear(item, world, def) {
    let x;
    let y;
    if (item.element.type === 'teich' && def?.shore) {
      // Vorne auf dem Steinufer sitzen (nicht im Wasser)
      const angle = Math.PI * (0.15 + Math.random() * 0.7);
      x = item.x + Math.cos(angle) * SHORE_RADIUS_X;
      y = item.y + Math.sin(angle) * SHORE_RADIUS_Y;
    } else if (item.element.type === 'teich') {
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
