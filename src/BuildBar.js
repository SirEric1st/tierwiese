// Die Leiste am unteren Bildschirmrand. Sie bewegt sich nicht mit,
// wenn man die Wiese verschiebt. Die Leiste zeichnet nur sich selbst –
// was beim Antippen und Ziehen passiert, regelt die WorldScene.
//
// Es gibt zwei Leisten: „Bauen“ (Dinge für die Wiese) und „Füttern“
// (Futter für die Tiere). Der orange Knopf ganz rechts schaltet um.
// Passen nicht alle Knöpfe auf den Bildschirm, blättert man mit den
// Pfeil-Knöpfen links und rechts weiter.
import { screenSize, uiOrigin } from './display.js';
import { ELEMENTS } from './elements.js';
import { FOODS } from './foods.js';

export const BAR_HEIGHT = 130;
const SLOT_SIZE = 104; // runde Knöpfe, deutlich größer als 64 pt
const SLOT_GAP = 14;
const ICON_SIZE = 80;
const MIN_SLOT_SCALE = 0.72; // kleiner werden die Knöpfe nicht (dann wird geblättert)

export class BuildBar {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100000);

    this.background = scene.add.graphics();
    this.container.add(this.background);

    this.elementSlots = ELEMENTS.map((element) => Object.assign(this.createSlot(element.type), { element }));
    this.foodSlots = FOODS.map((food) => Object.assign(this.createSlot(food.type), { food }));
    // Der Umschalt-Knopf zeigt, wohin er führt: Korb → Füttern, Schaufel → Bauen
    this.toggleSlot = Object.assign(this.createSlot('korb', 0xffc46b), { toggle: true });
    this.prevSlot = Object.assign(this.createArrowSlot(-1), { page: -1 });
    this.nextSlot = Object.assign(this.createArrowSlot(1), { page: 1 });

    this.mode = 'build';
    this.page = 0;
    this.highlighted = false;
    this.layout();
  }

  createSlot(texture, color = 0xffffff) {
    const circle = this.scene.add.circle(0, 0, SLOT_SIZE / 2, color, 0.9);
    const icon = this.scene.add.image(0, 0, texture);
    const slot = this.scene.add.container(0, 0, [circle, icon]);
    slot.icon = icon;
    this.setIcon(slot, texture);
    this.container.add(slot);
    return slot;
  }

  // Ein runder Knopf mit Pfeil zum Weiterblättern (direction: -1 links, 1 rechts)
  createArrowSlot(direction) {
    const g = this.scene.add.graphics();
    g.fillStyle(0xeadfc6, 0.95);
    g.fillCircle(0, 0, SLOT_SIZE / 2 - 8);
    g.fillStyle(0x7a5a2a);
    g.fillTriangle(direction * 22, 0, -direction * 12, -24, -direction * 12, 24);
    const slot = this.scene.add.container(0, 0, [g]);
    this.container.add(slot);
    return slot;
  }

  setIcon(slot, texture) {
    slot.icon.setTexture(texture);
    slot.icon.setScale(ICON_SIZE / Math.max(slot.icon.width, slot.icon.height));
  }

  get items() {
    return this.mode === 'build' ? this.elementSlots : this.foodSlots;
  }

  // Die Knöpfe, die gerade zu sehen sind, von links nach rechts
  get slots() {
    return this.visible || [];
  }

  toggleMode() {
    this.mode = this.mode === 'build' ? 'food' : 'build';
    this.page = 0;
    this.setIcon(this.toggleSlot, this.mode === 'build' ? 'korb' : 'schaufel');
    this.layout();
    this.popIn();
  }

  turnPage(direction) {
    this.page += direction;
    this.layout();
    this.popIn();
  }

  // Die neuen Knöpfe hüpfen kurz herein
  popIn() {
    this.slots.forEach((slot, i) => {
      if (slot.toggle || slot.page) return;
      slot.setScale(0);
      this.scene.tweens.add({ targets: slot, scale: this.slotScale, duration: 250, delay: i * 40, ease: 'Back.easeOut' });
    });
  }

  layout() {
    const { width, height } = screenSize(this.scene);
    const origin = uiOrigin(this.scene);
    this.container.setPosition(origin.x, origin.y);

    // Wie viele Knöpfe passen nebeneinander?
    const fits = Math.max(4, Math.floor((width - 20) / ((SLOT_SIZE + SLOT_GAP) * MIN_SLOT_SCALE)));
    const items = this.items;
    let visible;
    if (items.length + 1 <= fits) {
      visible = [...items, this.toggleSlot];
    } else {
      const perPage = fits - 3; // Platz für zwei Pfeile und den Umschalt-Knopf
      const pages = Math.ceil(items.length / perPage);
      this.page = ((this.page % pages) + pages) % pages; // nach der letzten Seite kommt wieder die erste
      const shown = items.slice(this.page * perPage, (this.page + 1) * perPage);
      visible = [this.prevSlot, ...shown, this.nextSlot, this.toggleSlot];
    }
    this.visible = visible;

    const barWidth = Math.min(width - 20, visible.length * (SLOT_SIZE + SLOT_GAP) + SLOT_GAP);
    this.barLeft = (width - barWidth) / 2;
    this.barWidth = barWidth;
    this.top = height - BAR_HEIGHT;
    this.drawBackground();

    // Knöpfe gleichmäßig verteilen; auf schmalen Bildschirmen etwas kleiner
    const step = barWidth / visible.length;
    this.step = step;
    this.slotScale = Math.min(1, step / (SLOT_SIZE + SLOT_GAP));
    [...this.elementSlots, ...this.foodSlots, this.prevSlot, this.nextSlot].forEach((slot) => slot.setVisible(false));
    visible.forEach((slot, i) => {
      slot.setPosition(this.barLeft + step * (i + 0.5), this.top + BAR_HEIGHT / 2);
      slot.setScale(this.slotScale).setVisible(true);
    });
  }

  drawBackground() {
    const g = this.background;
    g.clear();
    // Beim Wegräumen leuchtet die Leiste orange: „Hier kann es hin“
    g.fillStyle(this.highlighted ? 0xffc46b : 0xffffff, this.highlighted ? 0.85 : 0.45);
    g.fillRoundedRect(this.barLeft, this.top + 8, this.barWidth, BAR_HEIGHT - 16, 30);
  }

  setHighlight(on) {
    if (on === this.highlighted) return;
    this.highlighted = on;
    this.drawBackground();
  }

  // Liegt diese Bildschirmposition (in normalen Punkten) auf der Leiste?
  contains(screenX, screenY) {
    return screenY >= this.top && screenX >= this.barLeft - 20 && screenX <= this.barLeft + this.barWidth + 20;
  }

  // Welcher Knopf liegt unter dieser Bildschirmposition?
  slotAt(screenX, screenY) {
    return this.slots.find((slot) => Phaser.Math.Distance.Between(slot.x, slot.y, screenX, screenY) <= this.step / 2);
  }

  bounce(slot) {
    this.scene.tweens.add({ targets: slot, scale: this.slotScale * 1.15, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }
}
