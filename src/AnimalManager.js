// Entscheidet, wann welches Tier vorbeischaut, einzieht oder einen
// Ausflug macht. Es passiert immer nur eine Sache gleichzeitig, damit
// sich die Tiere nicht gegenseitig ins Wort fallen.
import { ANIMALS } from './animals.js';
import { Animal } from './Animal.js';
import { playCheer } from './sound.js';
import { IMAGE_SCALE } from './display.js';
import { CONFETTI_COLORS } from './textures.js';

const CHECK_INTERVAL = 2000; // alle 2 Sekunden nachsehen
const REVISIT_DELAY = 120000; // frühestens nach 2 Minuten wieder vorbeischauen
const POND_WATER_X = 120; // halbe Breite und Höhe der Wasserfläche im Teich-Bild
const POND_WATER_Y = 56;

export class AnimalManager {
  // getPlaced: liefert alles, was gerade auf der Wiese steht
  // onChange:  wird aufgerufen, wenn ein Tier ein- oder auszieht (zum Speichern)
  // getName:   Name der Spielfigur (aus dem Eltern-Bereich, kann leer sein)
  // hooks:     isUnlocked(type) – gibt es das Ding schon in der Leiste?
  //            onGift(animal, done) – das Tier überreicht sein Geschenk
  //            onSticker(animal, key) – ein neuer Album-Sticker
  constructor(scene, getPlaced, world, onChange, getName = () => '', hooks = {}) {
    this.getName = getName;
    this.hooks = hooks;
    this.scene = scene;
    this.getPlaced = getPlaced;
    this.world = world;
    this.onChange = onChange;
    this.animals = ANIMALS.map((def) => new Animal(scene, def, world, (x, y) => this.isInWater(x, y)));
    this.animals.forEach((animal) => {
      animal.onCare = (_, key) => {
        this.hooks.onSticker?.(animal, key);
        this.onChange?.();
      };
    });
    this.busy = false;
    this.night = false;
    this.season = 'fruehling';

    scene.time.addEvent({ delay: CHECK_INTERVAL, loop: true, callback: () => this.check() });
  }

  // Für den Spielstand: wer wohnt hier, wer hat schon mal hier gewohnt?
  getState() {
    return this.animals.map((animal) => ({
      type: animal.def.type,
      resident: animal.state === 'resident',
      hasLivedHere: Boolean(animal.hasLivedHere),
      care: { ...animal.care },
    }));
  }

  // Beim Laden: eingezogene Tiere stehen sofort wieder auf der Wiese
  restore(savedAnimals = []) {
    savedAnimals.forEach((saved) => {
      const animal = this.animals.find((a) => a.def.type === saved.type);
      if (!animal) return;
      animal.hasLivedHere = saved.hasLivedHere;
      animal.care = { ...saved.care };
      const shelter = saved.resident && this.sleepsThroughWinter(animal) ? this.shelterFor(animal) : null;
      if (shelter) {
        animal.state = 'resident';
        animal.placeHibernating(shelter);
        return;
      }
      const spot = saved.resident ? this.spotFor(animal) : null;
      if (spot) {
        animal.placeAsResident(spot);
        animal.startWandering(() => this.spotFor(animal));
        if (this.shouldSleep(animal)) animal.setSleeping(true);
      }
    });
  }

  // Liegt diese Stelle im Wasser eines Teichs? (Wasserfläche als Ellipse)
  isInWater(x, y) {
    return this.getPlaced().some(
      (item) =>
        item.element.type === 'teich' && ((x - item.x) / POND_WATER_X) ** 2 + ((y - item.y) / POND_WATER_Y) ** 2 <= 1
    );
  }

  animalAt(worldX, worldY) {
    return this.animals.find((animal) => animal.contains(worldX, worldY)) || null;
  }

  check() {
    const placedTypes = new Set(this.getPlaced().map((item) => item.element.type));
    const status = this.animals.map((animal) => {
      const missing = animal.def.needs.filter((need) => !placedTypes.has(need.type));
      return { animal, missing, fulfilled: animal.def.needs.length - missing.length };
    });

    if (this.busy) {
      // Ist während eines Besuchs alles fertig geworden, bleibt das Tier gleich da
      const visitor = status.find((s) => s.animal === this.visitor);
      if (visitor && visitor.missing.length === 0) {
        this.visitor.cancelVisit();
        this.visitor = null;
        this.startMoveIn(visitor.animal);
      }
      return;
    }

    // Reihenfolge: erst Ausflüge, dann Einzüge, dann Besuche
    const leaving = status.find((s) => s.animal.state === 'resident' && s.missing.length > 0);
    if (leaving) {
      // Beim Ausflug sagt das Tier schon, was fehlt – das zählt wie ein Besuch
      this.rememberHint(leaving.animal, leaving.fulfilled);
      this.start((done) => leaving.animal.leave(leaving.missing[0], done));
      return;
    }

    // Wer im Winter schläft, kommt erst im Frühling wieder. Und zu Besuch kommt
    // nur, wer sich etwas wünscht, das es schon in der Leiste gibt.
    const isUnlocked = this.hooks.isUnlocked ?? (() => true);
    const awake = status.filter(
      (s) => !this.sleepsThroughWinter(s.animal) && s.animal.def.needs.every((need) => isUnlocked(need.type))
    );
    const movingIn = awake.find((s) => s.animal.state === 'away' && s.missing.length === 0);
    if (movingIn) {
      this.startMoveIn(movingIn.animal);
      return;
    }

    const now = this.scene.time.now;
    const visiting = awake.find(
      (s) =>
        s.animal.state === 'away' &&
        s.fulfilled > 0 &&
        (s.fulfilled !== s.animal.lastVisitFulfilled || now - s.animal.lastVisitTime > REVISIT_DELAY)
    );
    if (visiting) {
      const animal = visiting.animal;
      this.rememberHint(animal, visiting.fulfilled);
      this.visitor = animal;
      this.start((done) =>
        animal.visit(this.spotFor(animal), visiting.missing[0], () => {
          this.visitor = null;
          done();
        })
      );
    }
  }

  startMoveIn(animal) {
    const name = this.getName();
    const text = animal.hasLivedHere
      ? `Ich bin wieder da${name ? `, ${name}` : ''}!`
      : `${animal.def.hello} Hurra, hier gefällt es mir! Ich ziehe bei dir ein${name ? `, ${name}` : ''}!`;
    const spot = this.spotFor(animal);
    this.start((done) =>
      animal.moveIn(spot, text, () => this.celebrate(animal), () => {
        const firstTime = !animal.hasLivedHere;
        animal.hasLivedHere = true;
        animal.startWandering(() => this.spotFor(animal));
        if (this.shouldSleep(animal)) animal.setSleeping(true);
        // Beim ersten Einzug bringt das Tier ein Geschenk mit
        const gift = animal.def.gift;
        if (firstTime && gift && this.hooks.onGift && !this.hooks.isUnlocked?.(gift.type)) {
          this.hooks.onGift(animal, done);
        } else done();
      })
    );
  }

  // Tagtiere schlafen nachts, Nachttiere am Tag
  shouldSleep(animal) {
    return Boolean(animal.def.nocturnal) !== this.night;
  }

  // Tag oder Nacht: Die eingezogenen Tiere schlafen ein oder wachen auf,
  // nacheinander, damit es lebendig aussieht
  setNight(night) {
    this.night = night;
    this.animals
      .filter((animal) => animal.state === 'resident' && !animal.hibernating)
      .forEach((animal, i) => {
        this.scene.time.delayedCall(600 + i * 250, () => {
          if (animal.state !== 'resident' || animal.hibernating || this.night !== night) return;
          if (this.shouldSleep(animal)) animal.setSleeping(true);
          else animal.wakeUp();
        });
      });
  }

  // ---------- Jahreszeiten ----------

  sleepsThroughWinter(animal) {
    return this.season === 'winter' && Boolean(animal.def.winter);
  }

  // Das nächstgelegene Winterversteck (z. B. der Laubhaufen für den Igel)
  shelterFor(animal) {
    const shelters = this.getPlaced().filter((item) => item.element.type === animal.def.winter.shelter);
    let best = null;
    shelters.forEach((item) => {
      if (!best || Phaser.Math.Distance.Between(item.x, item.y, animal.x, animal.y) < Phaser.Math.Distance.Between(best.x, best.y, animal.x, animal.y)) best = item;
    });
    return best;
  }

  // Wer schläft gerade in diesem Ding seinen Winterschlaf?
  hibernatingIn(item) {
    return this.animals.filter((animal) => animal.hibernating && animal.shelter === item && !animal.container.visible);
  }

  // Im Winter verkriechen sich manche Tiere, im Frühling kommen sie wieder heraus
  setSeason(season) {
    this.season = season;
    this.animals.forEach((animal) => (animal.season = season));
    const residents = this.animals.filter((animal) => animal.state === 'resident');
    residents.forEach((animal, i) => {
      this.scene.time.delayedCall(800 + i * 300, () => {
        if (animal.state !== 'resident' || this.season !== season) return;
        if (this.sleepsThroughWinter(animal) && !animal.hibernating) {
          const shelter = this.shelterFor(animal);
          if (shelter) animal.hibernate(shelter);
        } else if (!this.sleepsThroughWinter(animal) && animal.hibernating) {
          animal.wakeFromHibernation();
          animal.startWandering(() => this.spotFor(animal));
          if (this.shouldSleep(animal)) this.scene.time.delayedCall(800, () => animal.setSleeping(true));
        }
      });
    });
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
      this.onChange?.();
    });
    this.onChange?.();
  }

  // Ein zufälliger Platz bei einem der Dinge, die das Tier braucht
  spotFor(animal) {
    const needTypes = animal.def.needs.map((need) => need.type);
    const homes = this.getPlaced().filter((item) => needTypes.includes(item.element.type));
    if (homes.length === 0) return null;
    return Animal.spotNear(Phaser.Utils.Array.GetRandom(homes), this.world, animal.def);
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
      scale: IMAGE_SCALE,
      emitting: false,
    });
    emitter.setDepth(60000);
    emitter.explode(40);
    this.scene.time.delayedCall(2000, () => emitter.destroy());
  }
}
