// Die Leiste am unteren Bildschirmrand. Sie bewegt sich nicht mit,
// wenn man die Wiese verschiebt. Die Leiste zeichnet nur sich selbst –
// was beim Antippen und Ziehen passiert, regelt die WorldScene.
//
// Es gibt zwei Leisten: „Bauen“ (Dinge für die Wiese) und „Füttern“
// (Futter für die Tiere). Der orange Knopf ganz rechts schaltet um.
// Passen nicht alle Knöpfe auf den Bildschirm, wischt man auf der Leiste
// nach links oder rechts zur nächsten Seite. Punkte über der Leiste zeigen,
// wie viele Seiten es gibt und auf welcher man gerade ist.
import { screenSize, uiOrigin, uiScale } from './display.js';
import { ELEMENTS } from './elements.js';
import { FOODS } from './foods.js';

export const BAR_HEIGHT = 130;
const SLOT_SIZE = 104; // runde Knöpfe, deutlich größer als 64 pt
const SLOT_GAP = 14;
const ICON_SIZE = 80;
const MIN_SLOT_SCALE = 0.72; // kleiner werden die Knöpfe nicht (dann wird geblättert)
const DOT_RADIUS = 6; // Seiten-Punkte über der Leiste
const DOT_GAP = 22;
const SLIDE = 120; // so weit gleiten die Knöpfe beim Blättern herein

export class BuildBar {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100000);

    this.background = scene.add.graphics();
    this.dots = scene.add.graphics();
    this.container.add([this.background, this.dots]);

    this.elementSlots = ELEMENTS.map((element) => Object.assign(this.createSlot(element.type), { element }));
    this.foodSlots = FOODS.map((food) => Object.assign(this.createSlot(food.type), { food }));
    // Der Umschalt-Knopf zeigt, wohin er führt: Korb → Füttern, Schaufel → Bauen
    this.toggleSlot = Object.assign(this.createSlot('korb', 0xffc46b), { toggle: true });

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

  get pageCount() {
    return this.pages || 1;
  }

  // Zur nächsten (1) oder vorigen (-1) Seite; die Knöpfe gleiten von der Seite herein
  turnPage(direction) {
    if (this.pageCount < 2) return false;
    this.page += direction;
    this.layout();
    this.slots.forEach((slot) => {
      if (slot.toggle) return;
      const x = slot.x;
      slot.x += direction * SLIDE;
      slot.setAlpha(0);
      this.scene.tweens.add({ targets: slot, x, alpha: 1, duration: 220, ease: 'Quad.easeOut' });
    });
    return true;
  }

  // Die neuen Knöpfe hüpfen kurz herein
  popIn() {
    this.slots.forEach((slot, i) => {
      if (slot.toggle) return;
      slot.setScale(0);
      this.scene.tweens.add({ targets: slot, scale: this.slotScale, duration: 250, delay: i * 40, ease: 'Back.easeOut' });
    });
  }

  layout() {
    const { width, height } = screenSize(this.scene);
    const origin = uiOrigin(this.scene);
    this.container.setPosition(origin.x, origin.y).setScale(uiScale(this.scene));

    // Wie viele Knöpfe passen nebeneinander?
    const fits = Math.max(4, Math.floor((width - 20) / ((SLOT_SIZE + SLOT_GAP) * MIN_SLOT_SCALE)));
    const items = this.items;
    const perPage = fits - 1; // ein Platz bleibt für den Umschalt-Knopf
    const pages = Math.ceil(items.length / perPage);
    this.pages = pages;
    this.page = ((this.page % pages) + pages) % pages; // nach der letzten Seite kommt wieder die erste
    const visible = [...items.slice(this.page * perPage, (this.page + 1) * perPage), this.toggleSlot];
    this.visible = visible;

    // Beim Blättern bleibt die Leiste gleich breit, der Umschalt-Knopf immer ganz rechts
    const places = pages > 1 ? perPage + 1 : visible.length;
    const barWidth = Math.min(width - 20, places * (SLOT_SIZE + SLOT_GAP) + SLOT_GAP);
    this.barLeft = (width - barWidth) / 2;
    this.barWidth = barWidth;
    this.top = height - BAR_HEIGHT;
    this.drawBackground();

    // Knöpfe gleichmäßig verteilen; auf schmalen Bildschirmen etwas kleiner
    const step = barWidth / places;
    this.step = step;
    this.slotScale = Math.min(1, step / (SLOT_SIZE + SLOT_GAP));
    [...this.elementSlots, ...this.foodSlots].forEach((slot) => slot.setVisible(false));
    visible.forEach((slot, i) => {
      const place = slot.toggle ? places - 1 : i;
      slot.setPosition(this.barLeft + step * (place + 0.5), this.top + BAR_HEIGHT / 2);
      slot.setScale(this.slotScale).setAlpha(1).setVisible(true);
    });
    this.drawDots(width);
  }

  // Seiten-Punkte: der volle Punkt ist die aktuelle Seite
  drawDots(width) {
    const g = this.dots;
    g.clear();
    if (this.pages < 2) return;
    const y = this.top - 4;
    const left = width / 2 - ((this.pages - 1) * DOT_GAP) / 2;
    for (let i = 0; i < this.pages; i++) {
      g.fillStyle(0x000000, 0.18);
      g.fillCircle(left + i * DOT_GAP, y + 2, DOT_RADIUS);
      g.fillStyle(0xffffff, i === this.page ? 1 : 0.55);
      g.fillCircle(left + i * DOT_GAP, y, i === this.page ? DOT_RADIUS + 1 : DOT_RADIUS - 1);
    }
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
