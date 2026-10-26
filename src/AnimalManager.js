// Entscheidet, wann welches Tier vorbeischaut, einzieht oder einen
// Ausflug macht. Es passiert immer nur eine Sache gleichzeitig, damit
// sich die Tiere nicht gegenseitig ins Wort fallen.
import { ANIMALS } from './animals.js';
import { Animal } from './Animal.js';
import { playCheer } from './sound.js';
import { CONFETTI_COLORS } from './textures.js';

const CHECK_INTERVAL = 2000; // alle 2 Sekunden nachsehen
const REVISIT_DELAY = 120000; // frühestens nach 2 Minuten wieder vorbeischauen

export class AnimalManager {
  // getPlaced: liefert alles, was gerade auf der Wiese steht
  constructor(scene, getPlaced, world) {
    this.scene = scene;
    this.getPlaced = getPlaced;
    this.world = world;
    this.animals = ANIMALS.map((def) => new Animal(scene, def, world));
    this.busy = false;

    scene.time.addEvent({ delay: CHECK_INTERVAL, loop: true, callback: () => this.check() });
  }

  animalAt(worldX, worldY) {
    return this.animals.find((animal) => animal.contains(worldX, worldY)) || null;
  }

  check() {
    if (this.busy) return;
    const placedTypes = new Set(this.getPlaced().map((item) => item.element.type));
    const status = this.animals.map((animal) => {
      const missing = animal.def.needs.filter((need) => !placedTypes.has(need.type));
      return { animal, missing, fulfilled: animal.def.needs.length - missing.length };
    });

    // Reihenfolge: erst Ausflüge, dann Einzüge, dann Besuche
    const leaving = status.find((s) => s.animal.state === 'resident' && s.missing.length > 0);
    if (leaving) {
      // Beim Ausflug sagt das Tier schon, was fehlt – das zählt wie ein Besuch
      this.rememberHint(leaving.animal, leaving.fulfilled);
      this.start((done) => leaving.animal.leave(leaving.missing[0], done));
      return;
    }

    const movingIn = status.find((s) => s.animal.state === 'away' && s.missing.length === 0);
    if (movingIn) {
      const animal = movingIn.animal;
      const text = animal.hasLivedHere
        ? 'Ich bin wieder da!'
        : `${animal.def.hello} Hurra, hier gefällt es mir! Ich ziehe bei dir ein!`;
      const spot = this.spotFor(animal);
      this.start((done) =>
        animal.moveIn(spot, text, () => this.celebrate(animal), () => {
          animal.hasLivedHere = true;
          animal.startWandering(() => this.spotFor(animal));
          done();
        })
      );
      return;
    }

    const now = this.scene.time.now;
    const visiting = status.find(
      (s) =>
        s.animal.state === 'away' &&
        s.fulfilled > 0 &&
        (s.fulfilled !== s.animal.lastVisitFulfilled || now - s.animal.lastVisitTime > REVISIT_DELAY)
    );
    if (visiting) {
      const animal = visiting.animal;
      this.rememberHint(animal, visiting.fulfilled);
      this.start((done) => animal.visit(this.spotFor(animal), visiting.missing[0], done));
    }
  }

  // Merkt sich, wann und bei welchem Stand das Tier zuletzt gesagt hat, was fehlt
  rememberHint(animal, fulfilled) {
    animal.lastVisitFulfilled = fulfilled;
    animal.lastVisitTime = this.scene.time.now;
  }

  start(action) {
    this.busy = true;
    action(() => {
      this.busy = false;
    });
  }

  // Ein zufälliger Platz bei einem der Dinge, die das Tier braucht
  spotFor(animal) {
    const needTypes = animal.def.needs.map((need) => need.type);
    const homes = this.getPlaced().filter((item) => needTypes.includes(item.element.type));
    if (homes.length === 0) return null;
    return Animal.spotNear(Phaser.Utils.Array.GetRandom(homes), this.world);
  }

  // Konfetti und eine fröhliche Melodie
  celebrate(animal) {
    playCheer();
    const emitter = this.scene.add.particles(animal.x, animal.y - 60, 'konfetti', {
      speed: { min: 200, max: 450 },
      angle: { min: 210, max: 330 },
      gravityY: 700,
      lifespan: 1600,
      rotate: { start: 0, end: 540 },
      frame: CONFETTI_COLORS.map((_, i) => i),
      emitting: false,
    });
    emitter.setDepth(60000);
    emitter.explode(40);
    this.scene.time.delayedCall(2000, () => emitter.destroy());
  }
}
