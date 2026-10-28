// Futter zum Einsammeln: Es wächst bei passenden Dingen auf der Wiese nach
// (sources in foods.js), z. B. Nüsse unter dem Nussbaum, Würmer im
// Laubhaufen. Läuft die Spielfigur darüber, sammelt sie es ein und es fliegt
// in den Futterkorb. Es wächst nur Futter, das eingezogene Tiere mögen.
import { FOODS } from './foods.js';

const SPAWN_INTERVAL = 9000; // so oft wächst irgendwo etwas nach
const MAX_TOTAL = 12; // höchstens so viel Futter liegt gleichzeitig herum
const MAX_PER_SOURCE = 2; // bei einem Ding höchstens so viel
const SOURCE_REACH = 150; // so weit gehört Futter noch zu seinem Ding
const PICKUP_SIZE = 50; // so groß liegt das Futter auf der Wiese
const COLLECT_DISTANCE = 55; // so nah muss die Figur herankommen
const POND_X = 70; // Wasserlinsen schwimmen in diesem Bereich des Teichs
const POND_Y = 26;

export class FoodField {
  // getPlaced: alles auf der Wiese; getFoods: Futterarten, die es geben darf
  // world: { width, height }; onCollect(foodType, image): Futter eingesammelt
  // onGrow(image): neues Futter ist gewachsen
  constructor(scene, getPlaced, getFoods, world, onCollect, onGrow) {
    this.onGrow = onGrow;
    this.scene = scene;
    this.getPlaced = getPlaced;
    this.getFoods = getFoods;
    this.world = world;
    this.onCollect = onCollect;
    this.pickups = [];
    scene.time.addEvent({ delay: SPAWN_INTERVAL, loop: true, callback: () => this.spawn() });
  }

  // Beim Start liegt schon ein bisschen Futter herum
  fill(count) {
    for (let i = 0; i < count; i++) this.spawn();
  }

  // Ein neues Futter wachsen lassen – an einem zufälligen passenden Platz
  spawn() {
    if (this.pickups.length >= MAX_TOTAL) return null;
    const foods = this.getFoods();
    const placed = this.getPlaced();
    const options = [];
    FOODS.forEach((food) => {
      if (!foods.has(food.type)) return;
      if (food.sources.length === 0) {
        options.push({ food, source: null });
        return;
      }
      placed
        .filter((item) => food.sources.includes(item.element.type) && this.countNear(item) < MAX_PER_SOURCE)
        .forEach((source) => options.push({ food, source }));
    });
    if (options.length === 0) return null;
    const { food, source } = Phaser.Utils.Array.GetRandom(options);
    const spot = source ? this.spotNear(source) : this.anywhere();
    return this.addPickup(food.type, spot.x, spot.y);
  }

  countNear(item) {
    return this.pickups.filter((p) => Phaser.Math.Distance.Between(p.x, p.y, item.x, item.y) < SOURCE_REACH).length;
  }

  spotNear(item) {
    if (item.element.type === 'teich') {
      // Wasserlinsen schwimmen auf dem Wasser
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.8;
      return { x: item.x + Math.cos(angle) * POND_X * r, y: item.y + 6 + Math.sin(angle) * POND_Y * r };
    }
    return this.clamp({
      x: item.x + Phaser.Math.RND.sign() * Phaser.Math.Between(40, 95),
      y: item.y + Phaser.Math.Between(15, 45),
    });
  }

  anywhere() {
    return this.clamp({ x: Phaser.Math.Between(0, this.world.width), y: Phaser.Math.Between(0, this.world.height) });
  }

  clamp({ x, y }) {
    return { x: Phaser.Math.Clamp(x, 60, this.world.width - 60), y: Phaser.Math.Clamp(y, 140, this.world.height - 30) };
  }

  addPickup(type, x, y) {
    const pickup = this.scene.add.image(x, y, type).setOrigin(0.5, 1).setDepth(y).setScale(0);
    pickup.foodType = type;
    const size = PICKUP_SIZE / Math.max(pickup.width, pickup.height);
    pickup.size = size;
    // Wächst aus dem Boden und wippt dann leicht, damit man es entdeckt
    this.scene.tweens.add({ targets: pickup, scale: size, duration: 400, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: pickup, angle: { from: -8, to: 8 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 900) });
    // Ein sanfter Schimmer darunter: „Hier gibt es etwas!“
    pickup.glow = this.scene.add.image(x, y - 14, 'leuchtpunkt').setDepth(y - 1).setAlpha(0);
    pickup.glow.setScale((PICKUP_SIZE * 1.8) / pickup.glow.width);
    this.scene.tweens.add({ targets: pickup.glow, alpha: { from: 0.25, to: 0.7 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.pickups.push(pickup);
    this.onGrow?.(pickup);
    return pickup;
  }

  // Liegt hier Futter? (zum Antippen)
  pickupAt(worldX, worldY) {
    return this.pickups.find((p) => Phaser.Math.Distance.Between(p.x, p.y - 15, worldX, worldY) < 40) || null;
  }

  // Jedes Bild aufrufen: Was die Figur berührt, wird eingesammelt
  update(player) {
    for (const pickup of [...this.pickups]) {
      if (Phaser.Math.Distance.Between(pickup.x, pickup.y, player.x, player.y) < COLLECT_DISTANCE) this.collect(pickup);
    }
  }

  collect(pickup) {
    this.pickups = this.pickups.filter((p) => p !== pickup);
    this.scene.tweens.killTweensOf(pickup);
    this.scene.tweens.killTweensOf(pickup.glow);
    pickup.glow.destroy();
    pickup.setAngle(0).setDepth(60000);
    this.onCollect(pickup.foodType, pickup);
  }
}
