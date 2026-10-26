// Die Bau-Leiste am unteren Bildschirmrand. Sie bewegt sich nicht mit,
// wenn man die Wiese verschiebt. Die Leiste zeichnet nur sich selbst –
// was beim Antippen und Ziehen passiert, regelt die WorldScene.
import { screenSize, uiOrigin } from './display.js';
import { ELEMENTS } from './elements.js';

export const BAR_HEIGHT = 130;
const SLOT_SIZE = 104; // runde Knöpfe, deutlich größer als 64 pt
const SLOT_GAP = 14;
const ICON_SIZE = 80;

export class BuildBar {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100000);

    this.background = scene.add.graphics();
    this.container.add(this.background);

    this.slots = ELEMENTS.map((element) => {
      const circle = scene.add.circle(0, 0, SLOT_SIZE / 2, 0xffffff, 0.9);
      const icon = scene.add.image(0, 0, element.type);
      const scale = ICON_SIZE / Math.max(icon.width, icon.height);
      icon.setScale(scale);
      const slot = scene.add.container(0, 0, [circle, icon]);
      slot.element = element;
      slot.iconScale = scale;
      this.container.add(slot);
      return slot;
    });

    this.highlighted = false;
    this.layout();
  }

  layout() {
    const { width, height } = screenSize(this.scene);
    const origin = uiOrigin(this.scene);
    this.container.setPosition(origin.x, origin.y);
    const barWidth = Math.min(width - 20, ELEMENTS.length * (SLOT_SIZE + SLOT_GAP) + SLOT_GAP);
    this.barLeft = (width - barWidth) / 2;
    this.barWidth = barWidth;
    this.top = height - BAR_HEIGHT;
    this.drawBackground();

    // Knöpfe gleichmäßig verteilen; auf schmalen Bildschirmen etwas kleiner
    const step = barWidth / ELEMENTS.length;
    this.step = step;
    this.slotScale = Math.min(1, step / (SLOT_SIZE + SLOT_GAP));
    this.slots.forEach((slot, i) => {
      slot.setPosition(this.barLeft + step * (i + 0.5), this.top + BAR_HEIGHT / 2);
      slot.setScale(this.slotScale);
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
    return this.slots.find(
      (slot) => Phaser.Math.Distance.Between(slot.x, slot.y, screenX, screenY) <= this.step / 2
    );
  }

  bounce(slot) {
    this.scene.tweens.add({ targets: slot, scale: this.slotScale * 1.15, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }
}
