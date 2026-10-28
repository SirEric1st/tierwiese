// Entscheidet, wann welches Tier vorbeischaut, einzieht oder einen
// Ausflug macht. Es passiert immer nur eine Sache gleichzeitig, damit
// sich die Tiere nicht gegenseitig ins Wort fallen.
//
// Tier-Rätsel: Es ist immer nur ein Tier zu Besuch. Es wartet mit einem
// „?“ in der Gedankenblase und beschreibt, was es sucht (riddle in
// elements.js). Man muss das passende Ding zum Tier ziehen. Nach zwei
// falschen Dingen oder einer Weile hilft es: Die Blase zeigt das Bild.
// Hat es beide Dinge bekommen, zieht es ein. Das nächste Tier kommt
// erst nach einer Pause. Wer schon einmal hier gewohnt hat, kommt ohne
// Rätsel zurück, sobald alles wieder da ist.
import { ANIMALS } from './animals.js';
import { SAETZE } from './saetze.js';
import { Animal } from './Animal.js';
import { playCheer } from './sound.js';
import { say } from './speech.js';
import { IMAGE_SCALE } from './display.js';
import { CONFETTI_COLORS } from './textures.js';
import { getElement } from './elements.js';

const CHECK_INTERVAL = 2000; // alle 2 Sekunden nachsehen
const FIRST_GUEST_DELAY = 6000; // nach dem Start kommt bald der erste Besuch
const NEXT_GUEST_DELAY = 30000; // Pause nach einem Einzug bis zum nächsten Besuch
const HELP_DELAY = 25000; // so lange wartet das Tier, dann zeigt es, was es sucht
const WRONG_BEFORE_HELP = 2; // oder nach so vielen falschen Dingen
const GUEST_REACH = 230; // so nah muss man ein Ding zum Tier ziehen
const POND_WATER_X = 120; // halbe Breite und Höhe der Wasserfläche im Teich-Bild
const POND_WATER_Y = 56;

export class AnimalManager {
  // getPlaced: liefert alles, was gerade auf der Wiese steht
  // onChange:  wird aufgerufen, wenn ein Tier ein- oder auszieht (zum Speichern)
  // hooks:     isUnlocked(type) – gibt es das Ding schon in der Leiste?
  //            onGift(animal, done) – das Tier überreicht sein Geschenk
  //            onSticker(animal, key) – ein neuer Album-Sticker
  constructor(scene, getPlaced, world, onChange, hooks = {}) {
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
    this.guest = null; // das Tier, das gerade mit einem Rätsel zu Besuch ist
    this.nextGuestTime = scene.time.now + FIRST_GUEST_DELAY;
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
    if (this.busy) return;
    const placedTypes = new Set(this.getPlaced().map((item) => item.element.type));
    const missingOf = (animal) => animal.def.needs.filter((need) => !placedTypes.has(need.type));

    // Erst Ausflüge: Fehlt einem Tier etwas, geht es kurz weg
    const leaving = this.animals.find((animal) => animal.state === 'resident' && missingOf(animal).length > 0);
    if (leaving) {
      this.start((done) => leaving.leave(missingOf(leaving)[0], done));
      return;
    }

    // Wer schon hier gewohnt hat, kommt zurück, sobald alles wieder da ist
    const returning = this.animals.find(
      (animal) =>
        animal.state === 'away' &&
        animal.hasLivedHere &&
        !this.sleepsThroughWinter(animal) &&
        missingOf(animal).length === 0
    );
    if (returning) {
      this.startMoveIn(returning);
      return;
    }

    // Ein neues Tier kommt mit einem Rätsel zu Besuch – aber nur eins
    // gleichzeitig, nach einer Pause, und nur, wenn es das Gesuchte schon gibt
    if (this.guest || this.scene.time.now < this.nextGuestTime) return;
    const isUnlocked = this.hooks.isUnlocked ?? (() => true);
    const candidates = this.animals.filter(
      (animal) =>
        animal.state === 'away' &&
        !animal.hasLivedHere &&
        !this.sleepsThroughWinter(animal) &&
        animal.def.needs.every((need) => isUnlocked(need.type))
    );
    if (candidates.length > 0) this.startGuest(Phaser.Utils.Array.GetRandom(candidates));
  }

  // ---------- Tier-Rätsel ----------

  startGuest(animal) {
    const guest = { animal, open: [...animal.def.needs], wrong: 0, helped: false, helpTimer: null };
    this.guest = guest;
    animal.onGuestTap = () => this.askRiddle([]);
    this.start((done) =>
      animal.arriveAsGuest(this.guestSpot(), () => {
        this.askRiddle([animal.def.hello]);
        done();
      })
    );
  }

  // Ein freier Platz mitten im Bild, damit man den Besuch auch sieht
  guestSpot() {
    const view = this.scene.cameras.main.worldView;
    let spot;
    for (let i = 0; i < 10; i++) {
      // links oder rechts neben der Mitte, wo meist die Spielfigur steht
      const side = Phaser.Math.RND.sign() * Phaser.Math.FloatBetween(0.15, 0.3);
      spot = {
        x: Phaser.Math.Clamp(view.centerX + side * view.width, 80, this.world.width - 80),
        y: Phaser.Math.Clamp(view.centerY + Phaser.Math.FloatBetween(-0.05, 0.2) * view.height, 160, this.world.height - 60),
      };
      if (!this.isInWater(spot.x, spot.y)) break;
    }
    return spot;
  }

  // Das Tier sagt, was es sucht: als Rätsel – oder nach der Hilfe mit Bild und Namen
  askRiddle(before) {
    const guest = this.guest;
    if (!guest) return;
    const need = guest.open[0];
    if (guest.helped) {
      guest.animal.showBubble(need.type);
      say([...before, need.wish]);
    } else {
      guest.animal.showQuestion();
      say([...before, getElement(need.type).riddle]);
      guest.helpTimer?.remove();
      guest.helpTimer = this.scene.time.delayedCall(HELP_DELAY, () => {
        if (this.guest !== guest || guest.helped) return;
        guest.helped = true;
        this.askRiddle([SAETZE.riddleHelp]);
      });
    }
  }

  // Ein Ding wurde auf der Wiese abgestellt. Steht es nah beim Besuch, schaut
  // das Tier, ob es das gesuchte ist. true: Das Tier hat etwas dazu gesagt.
  itemPlaced(item) {
    const guest = this.guest;
    if (!guest || this.busy || guest.animal.state !== 'visiting') return false;
    const animal = guest.animal;
    if (Phaser.Math.Distance.Between(item.x, item.y, animal.x, animal.y) > GUEST_REACH) return false;
    const name = item.element.name;
    const match = guest.open.find((need) => need.type === item.element.type);
    if (!match) {
      // Falsch – kein Problem, das Ding bleibt einfach stehen
      guest.wrong += 1;
      animal.shakeHead();
      if (guest.wrong >= WRONG_BEFORE_HELP && !guest.helped) {
        guest.helped = true;
        this.askRiddle([name, SAETZE.riddleNo, SAETZE.riddleHelp]);
      } else {
        this.askRiddle([name, SAETZE.riddleNo, SAETZE.riddleListen]);
      }
      return true;
    }
    animal.hop();
    guest.open = guest.open.filter((need) => need !== match);
    guest.wrong = 0;
    guest.helped = false;
    if (guest.open.length > 0) {
      this.askRiddle([name, SAETZE.riddleRight, SAETZE.riddleNext]);
      return true;
    }
    // Alles da: Das Tier freut sich und zieht ein
    this.endGuest();
    this.busy = true;
    say([name, SAETZE.riddleRight], () => {
      this.busy = false;
      this.startMoveIn(animal, true);
    });
    return true;
  }

  endGuest() {
    const guest = this.guest;
    if (!guest) return;
    guest.helpTimer?.remove();
    guest.animal.onGuestTap = null;
    guest.animal.hideBubble();
    this.guest = null;
  }

  // Besuch ohne Einzug beenden (z. B. Winterschlaf); das Tier kommt später wieder
  cancelGuest() {
    const animal = this.guest?.animal;
    if (!animal) return;
    this.endGuest();
    animal.leaveAsGuest();
    this.nextGuestTime = this.scene.time.now + NEXT_GUEST_DELAY;
  }

  // afterRiddle: Das Tier war schon zu Besuch und hat sich schon vorgestellt
  startMoveIn(animal, afterRiddle = false) {
    // Ohne Namen, damit alles aus fertigen Aufnahmen gesprochen werden kann
    let text = [animal.def.hello, SAETZE.moveIn];
    if (animal.hasLivedHere) text = [SAETZE.backAgain];
    else if (afterRiddle) text = [SAETZE.moveIn];
    const spot = this.spotFor(animal);
    this.start((done) =>
      animal.moveIn(spot, text, () => this.celebrate(animal), () => {
        const firstTime = !animal.hasLivedHere;
        animal.hasLivedHere = true;
        if (firstTime) this.nextGuestTime = this.scene.time.now + NEXT_GUEST_DELAY;
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
    if (this.guest && this.sleepsThroughWinter(this.guest.animal)) this.cancelGuest();
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
