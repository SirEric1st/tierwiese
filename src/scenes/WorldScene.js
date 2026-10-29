// Die Wiese: eine Landschaft, die größer als der Bildschirm ist.
// Tippen → die Figur läuft dorthin. Ziehen → die Ansicht verschiebt sich.
// Aus der Bau-Leiste zieht man Dinge auf die Wiese; Dinge auf der Wiese
// kann man verschieben oder zurück auf die Leiste ziehen (wegräumen).
// Eingezogene Tiere kann man streicheln: Finger über dem Tier hin und her bewegen.
// Mit dem Korb-Knopf wird die Leiste zum Futterkorb; Futter zieht man zu den Tieren.
// Der Album-Knopf oben rechts öffnet das Tier-Album. Tippt man auf die eigene
// Figur, öffnet sich der Figuren-Baukasten.
// Der Knopf daneben (Mond oder Sonne) macht Nacht oder Tag, der nächste
// wechselt die Jahreszeit (er zeigt die Jahreszeit, die als Nächstes kommt).
// Das Haus oben links führt zurück zum Startbildschirm (anderer Spielstand).
// Neue Dinge für die Leiste bringen die Tiere als Geschenk mit; Füttern und
// Streicheln bringt Sticker fürs Album (siehe progress.js).
// Futter sammelt die Spielfigur auf der Wiese ein (FoodField.js); im Korb
// liegt von jedem Futter höchstens BASKET_MAX Stück.
import { AnimalManager } from '../AnimalManager.js';
import { BuildBar } from '../BuildBar.js';
import { DPR, IMAGE_SCALE, screenSize, setupCamera, toScreen, uiOrigin, uiScale } from '../display.js';
import { getElement } from '../elements.js';
import { FoodField } from '../FoodField.js';
import { getFood } from '../foods.js';
import { makeFigureTexture, normalizeFigure } from '../figure.js';
import { cleanName } from '../parents.js';
import { stickerTexture, unlockedElements, unlockedFoods } from '../progress.js';
import { playHappy } from '../sound.js';
import { loadGame, saveGame } from '../save.js';
import { SAETZE, SEASON_TEXTS } from '../saetze.js';
import { SEASONS, SeasonView } from '../Seasons.js';
import { say, sayImportant } from '../speech.js';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;
const WALK_SPEED = 260; // Pixel pro Sekunde
const DRAG_THRESHOLD = 12; // ab so vielen Punkten Bewegung gilt es als Ziehen
const EDGE = 60; // Abstand zum Weltrand, den die Figur nicht überschreitet
const AUTO_SCROLL_ZONE = 70; // beim Ziehen am Bildschirmrand scrollt die Wiese mit
const AUTO_SCROLL_SPEED = 500; // Pixel pro Sekunde

// Ebenen: Blumen und Teiche liegen flach am Boden, alles andere wird nach
// seiner Höhe auf dem Bildschirm sortiert (weiter unten = weiter vorne).
const DEPTH_FLOWERS = 1;
const DEPTH_FLAT = 2;
const SAVE_DELAY = 500; // kurz warten, damit viele Änderungen auf einmal gespeichert werden
const SHORE_X = 125; // halbe Breite und Höhe des Teichufers (Wasserrand im Teich-Bild)
const SHORE_Y = 62;
const SHORE_REACH = 400; // so nah muss man Schilf an einen Teich ziehen
const FOOD_LIFT = 50; // Futter schwebt beim Ziehen so weit über dem Finger
const ALBUM_RADIUS = 44; // runder Album-Knopf oben rechts
const ALBUM_MARGIN = 20;
const NIGHT_COLOR = 0x081040; // so dunkelblau legt sich die Nacht über die Wiese
const NIGHT_ALPHA = 0.55;
const DUSK_TIME = 2500; // so lange dauert die Dämmerung (Millisekunden)
const FIREFLIES = 40; // Glühwürmchen in der Nacht
const BASKET_MAX = 9;
const DEPTH_NIGHT = 59000; // über der Wiese, aber unter Herzen, Konfetti und der Leiste
const SWIPE_DISTANCE = 40; // so weit muss man auf der Leiste wischen, um zu blättern
const MAX_ZOOM = 1.6; // am weitesten hineinzoomen (1 = normale Größe)
const MIN_ZOOM = 0.4; // am weitesten herauszoomen (nie kleiner als die ganze Wiese)

// Nur Fotos annehmen, die der Eltern-Bereich selbst erzeugt hat (JPEG-Daten)
function validPhoto(photo) {
  return typeof photo === 'string' && photo.startsWith('data:image/jpeg;base64,') ? photo : null;
}

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  create() {
    this.createdAt = this.time.now;
    setupCamera(this);
    this.grass = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'gras').setOrigin(0).setTileScale(IMAGE_SCALE);
    this.scatterFlowers();

    const saved = loadGame();

    this.placed = []; // alles, was auf der Wiese steht
    saved?.items.forEach(({ type, x, y }) => {
      const element = getElement(type);
      if (!element) return;
      const item = this.createItem(element, x, y);
      this.updateItemDepth(item);
      this.placed.push(item);
    });
    this.placed
      .filter((item) => item.element.shore)
      .forEach((reed) => {
        const pond = this.nearestPond(reed.x, reed.y, Infinity);
        if (pond) this.attachToShore(reed, pond);
        else this.removeItem(reed);
      });

    const start = saved?.player ?? { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    this.shadow = this.add.image(start.x, start.y, 'schatten').setScale(IMAGE_SCALE);
    this.player = this.add.image(start.x, start.y, 'figur').setOrigin(0.5, 1).setScale(IMAGE_SCALE);
    this.figure = normalizeFigure(saved?.figure);
    // Name und Foto aus dem Eltern-Bereich (nur auf diesem Gerät gespeichert)
    this.profile = { name: cleanName(saved?.profile?.name), photo: validPhoto(saved?.profile?.photo) };
    this.applyFigure();
    this.updatePlayerDepth();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.centerOn(this.player.x, this.player.y - 70);

    // Freigeschaltete Dinge werden gespeichert, damit nichts wieder verschwindet
    this.unlocked = new Set(saved?.unlocked ?? []);
    this.animals = new AnimalManager(
      this,
      () => this.placed,
      { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      () => {
        this.refreshUnlocks();
        this.requestSave();
      },
      {
        isUnlocked: (type) => this.unlocked.has(type),
        onGift: (animal, done) => this.receiveGift(animal, done),
        onSticker: (animal, key) => this.flySticker(animal, key),
      }
    );
    this.night = Boolean(saved?.night);
    this.animals.night = this.night;
    this.season = SEASONS.includes(saved?.season) ? saved.season : SEASONS[0];
    this.animals.setSeason(this.season);
    if (saved) this.animals.restore(saved.animals);
    this.createNight();
    this.seasons = new SeasonView(this, this.grass, this.flowers, { width: WORLD_WIDTH, height: WORLD_HEIGHT });
    this.seasons.apply(this.season, false);
    this.bar = new BuildBar(this);
    this.createAlbumButton();
    this.refreshUnlocks();
    // Futterkorb: was die Figur schon eingesammelt hat
    this.basket = {};
    Object.entries(saved?.basket ?? {}).forEach(([type, count]) => {
      if (getFood(type)) this.basket[type] = Phaser.Math.Clamp(Math.floor(count) || 0, 0, BASKET_MAX);
    });
    this.foodHintGiven = Boolean(saved?.foodHintGiven);
    this.bar.setCounts(this.basket);
    this.food = new FoodField(
      this,
      () => this.placed,
      () => this.bar.foodTypes ?? new Set(),
      { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      (type, image) => this.collectFood(type, image),
      (pickup) => this.onFoodGrown(pickup)
    );
    this.food.fill(4);

    // Beim Wechsel in eine andere App oder beim Schließen sofort speichern
    this.onHide = () => this.save();
    document.addEventListener('visibilitychange', this.onHide);
    window.addEventListener('pagehide', this.onHide);

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      document.removeEventListener('visibilitychange', this.onHide);
      window.removeEventListener('pagehide', this.onHide);
    });

    this.setupInput();
  }

  onResize() {
    this.setZoom(this.cameras.main.zoom); // Grenzen hängen von der Bildschirmgröße ab
    this.layoutHud();
  }

  // Leiste und Album-Knopf neu ausrichten (z. B. nach dem Zoomen)
  layoutHud() {
    this.bar.layout();
    this.layoutAlbumButton();
    this.seasons.layout();
  }

  // ---------- Zoomen ----------

  // Kamera-Zoom setzen, begrenzt auf sinnvolle Werte. Die Kamera hat schon
  // für die Retina-Schärfe den Zoom DPR – 1 bedeutet hier also „normal“.
  setZoom(zoom) {
    const camera = this.cameras.main;
    const fitWorld = Math.max(camera.width / WORLD_WIDTH, camera.height / WORLD_HEIGHT);
    const min = Math.max(DPR * MIN_ZOOM, fitWorld);
    camera.setZoom(Phaser.Math.Clamp(zoom, min, DPR * MAX_ZOOM));
  }

  // Zoomen, ohne dass der Punkt unter den Fingern wegrutscht.
  // world: Punkt auf der Wiese; screenX/screenY: wo er auf dem Bildschirm bleiben soll (Pixel)
  zoomAround(zoom, world, screenX, screenY) {
    this.setZoom(zoom);
    const camera = this.cameras.main;
    const z = camera.zoom;
    camera.setScroll(
      world.x - (screenX - camera.width / 2) / z - camera.width / 2,
      world.y - (screenY - camera.height / 2) / z - camera.height / 2
    );
    this.layoutHud();
  }

  // Welcher Punkt der Wiese liegt unter dieser Bildschirmstelle (Pixel)?
  worldAt(screenX, screenY) {
    const camera = this.cameras.main;
    return {
      x: camera.scrollX + camera.width / 2 + (screenX - camera.width / 2) / camera.zoom,
      y: camera.scrollY + camera.height / 2 + (screenY - camera.height / 2) / camera.zoom,
    };
  }

  // Zwei Finger liegen auf: ab jetzt wird gezoomt statt gezogen
  startPinch() {
    const pointers = this.input.manager.pointers.filter((p) => p.isDown).slice(0, 2);
    if (pointers.length < 2) return;
    const touch = this.touch;
    if (touch?.mode === 'pet') touch.animal.stopPetting();
    this.touch = null;
    const [a, b] = pointers;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    this.pinch = {
      pointers,
      distance: Math.max(1, Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)),
      zoom: this.cameras.main.zoom,
      world: this.worldAt(mid.x, mid.y),
    };
  }

  continuePinch() {
    const [a, b] = this.pinch.pointers;
    const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    this.zoomAround((this.pinch.zoom * distance) / this.pinch.distance, this.pinch.world, mid.x, mid.y);
  }

  // ---------- Tier-Album ----------

  // Der Knopf liegt in einem eigenen Behälter, der beim Zoomen gleich groß bleibt
  createAlbumButton() {
    const circle = this.add.circle(0, 0, ALBUM_RADIUS, 0xffffff, 0.9);
    const icon = this.add.image(0, 0, 'album');
    icon.setScale((ALBUM_RADIUS * 1.4) / Math.max(icon.width, icon.height));
    // Roter Punkt: Im Album gibt es einen neuen Sticker
    this.albumBadge = this.add.circle(30, -30, 12, 0xe8455a).setStrokeStyle(3, 0xffffff).setVisible(false);
    this.albumButton = this.add.container(0, 0, [circle, icon, this.albumBadge]);
    // Tag/Nacht-Knopf: zeigt, wohin er führt (am Tag den Mond, nachts die Sonne)
    this.skyButton = this.createRoundButton('mond');
    this.updateSkyButton();
    this.seasonButton = this.createRoundButton('jahreszeit-sommer');
    this.updateSeasonButton();
    this.homeButton = this.createRoundButton('haus');
    this.hud = this.add
      .container(0, 0, [this.albumButton, this.skyButton, this.seasonButton, this.homeButton])
      .setScrollFactor(0)
      .setDepth(100000);
    this.layoutAlbumButton();
  }

  layoutAlbumButton() {
    const { width } = screenSize(this);
    const origin = uiOrigin(this);
    this.hud.setPosition(origin.x, origin.y).setScale(uiScale(this));
    this.albumButton.setPosition(width - ALBUM_RADIUS - ALBUM_MARGIN, ALBUM_RADIUS + ALBUM_MARGIN);
    this.skyButton.setPosition(this.albumButton.x - ALBUM_RADIUS * 2 - ALBUM_MARGIN, this.albumButton.y);
    this.seasonButton.setPosition(this.skyButton.x - ALBUM_RADIUS * 2 - ALBUM_MARGIN, this.albumButton.y);
    this.homeButton.setPosition(ALBUM_RADIUS + ALBUM_MARGIN, this.albumButton.y);
  }

  // Weißer runder Knopf mit Bild; button.icon ist das Bild
  createRoundButton(texture) {
    const icon = this.add.image(0, 0, texture);
    icon.setScale((ALBUM_RADIUS * 1.4) / Math.max(icon.width, icon.height));
    const button = this.add.container(0, 0, [this.add.circle(0, 0, ALBUM_RADIUS, 0xffffff, 0.9), icon]);
    button.icon = icon;
    return button;
  }

  // Liegt diese Bildschirmposition auf dem Album-Knopf?
  isOnAlbumButton(screenX, screenY) {
    return this.isOnButton(this.albumButton, screenX, screenY);
  }

  isOnButton(button, screenX, screenY) {
    return Phaser.Math.Distance.Between(screenX, screenY, button.x, button.y) <= ALBUM_RADIUS + 10;
  }

  // ---------- Tag und Nacht ----------

  // Eine dunkelblaue Fläche über der ganzen Wiese und Glühwürmchen
  createNight() {
    this.darkness = this.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, NIGHT_COLOR)
      .setOrigin(0)
      .setDepth(DEPTH_NIGHT)
      .setAlpha(this.night ? NIGHT_ALPHA : 0);
    const rnd = new Phaser.Math.RandomDataGenerator(['gluehwuermchen']);
    this.fireflies = Array.from({ length: FIREFLIES }, () =>
      this.add
        .image(rnd.between(40, WORLD_WIDTH - 40), rnd.between(120, WORLD_HEIGHT - 40), 'leuchtpunkt')
        .setScale(IMAGE_SCALE * 1.3)
        .setDepth(DEPTH_NIGHT + 1)
        .setAlpha(0)
        .setVisible(false)
    );
    if (this.night) this.startFireflies();
  }

  // Glühwürmchen schweben langsam umher und leuchten mal mehr, mal weniger
  startFireflies() {
    this.fireflies.forEach((firefly) => {
      firefly.setVisible(true);
      this.tweens.add({
        targets: firefly,
        alpha: { from: 0.15, to: 1 },
        duration: Phaser.Math.Between(900, 1800),
        delay: Phaser.Math.Between(0, DUSK_TIME),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: firefly,
        x: firefly.x + Phaser.Math.Between(-60, 60),
        y: firefly.y + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  stopFireflies() {
    this.fireflies.forEach((firefly) => {
      this.tweens.killTweensOf(firefly);
      this.tweens.add({ targets: firefly, alpha: 0, duration: 800, onComplete: () => firefly.setVisible(false) });
    });
  }

  updateSkyButton() {
    this.skyButton.icon.setTexture(this.night ? 'sonne' : 'mond');
  }

  // ---------- Jahreszeiten ----------

  get nextSeason() {
    return SEASONS[(SEASONS.indexOf(this.season) + 1) % SEASONS.length];
  }

  updateSeasonButton() {
    this.seasonButton.icon.setTexture(`jahreszeit-${this.nextSeason}`);
  }

  changeSeason() {
    this.season = this.nextSeason;
    this.tweens.add({ targets: this.seasonButton, scale: 1.15, duration: 120, yoyo: true });
    this.updateSeasonButton();
    this.seasons.apply(this.season, true);
    say(SEASON_TEXTS[this.season]);
    this.animals.setSeason(this.season);
    this.requestSave();
  }

  toggleNight() {
    this.night = !this.night;
    this.tweens.add({ targets: this.skyButton, scale: 1.15, duration: 120, yoyo: true });
    this.updateSkyButton();
    this.tweens.killTweensOf(this.darkness);
    this.tweens.add({ targets: this.darkness, alpha: this.night ? NIGHT_ALPHA : 0, duration: DUSK_TIME, ease: 'Sine.easeInOut' });
    if (this.night) this.startFireflies();
    else this.stopFireflies();
    say(this.night ? SAETZE.night : SAETZE.morning);
    this.animals.setNight(this.night);
    this.requestSave();
  }

  openAlbum() {
    this.tweens.add({ targets: this.albumButton, scale: 1.15, duration: 120, yoyo: true });
    this.albumBadge.setVisible(false);
    this.save();
    const state = this.animals.getState();
    const discovered = state.filter((a) => a.hasLivedHere).map((a) => a.type);
    const care = Object.fromEntries(state.map((a) => [a.type, a.care]));
    this.scene.pause();
    this.scene.launch('AlbumScene', { discovered, care });
  }

  // ---------- Futter sammeln ----------

  // Die Figur hat Futter eingesammelt: Es fliegt in den Korb
  collectFood(type, image) {
    this.basket[type] = Math.min(BASKET_MAX, (this.basket[type] || 0) + 1);
    const slot = this.bar.foodTarget(type);
    const target = this.screenToWorld(slot.x, slot.y);
    playHappy();
    this.tweens.add({
      targets: image,
      x: target.x,
      y: target.y,
      scale: image.scale * 0.6,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: () => {
        image.destroy();
        this.bar.setCounts(this.basket);
        this.bar.bounce(slot);
      },
    });
    this.requestSave();
  }

  // Beim ersten Futter, das man sehen kann, erklärt die Figur das Sammeln
  onFoodGrown(pickup) {
    if (this.foodHintGiven || this.animals.busy || this.animals.guest) return;
    if (this.time.now - this.createdAt < 8000) return; // nicht gleich die Begrüßung unterbrechen
    if (!this.cameras.main.worldView.contains(pickup.x, pickup.y)) return;
    this.foodHintGiven = true;
    say(SAETZE.foodFound);
    this.requestSave();
  }

  // ---------- Freischalten und Sticker ----------

  // Was gibt es in der Leiste? Ein Geschenk, das gerade noch fliegt, zählt noch nicht.
  refreshUnlocks() {
    if (!this.bar) return;
    const state = this.animals.getState();
    const elements = unlockedElements(state, this.placed.map((item) => item.element.type));
    elements.forEach((type) => this.unlocked.add(type));
    const shown = new Set(this.unlocked);
    if (this.flyingGift) shown.delete(this.flyingGift);
    this.bar.setAvailable(shown, unlockedFoods(state));
  }

  // Bildschirmpunkt (wie bei der Leiste) → Punkt auf der Wiese
  screenToWorld(x, y) {
    return this.worldAt(x * DPR, y * DPR);
  }

  // Das Tier überreicht sein Geschenk: Das Ding erscheint über ihm und fliegt in die Leiste
  receiveGift(animal, done) {
    const gift = animal.def.gift;
    this.flyingGift = gift.type;
    this.unlocked.add(gift.type);
    this.refreshUnlocks(); // neues Futter ist schon da, das Geschenk noch nicht
    const icon = this.add.image(animal.x, animal.top - 50, gift.type).setDepth(60000).setScale(0);
    const size = 110 / Math.max(icon.width, icon.height);
    this.tweens.add({ targets: icon, scale: size, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icon, angle: { from: -6, to: 6 }, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    let spoken = false;
    let arrived = false;
    const finish = () => {
      if (spoken && arrived) done();
    };
    sayImportant(gift.text, () => {
      spoken = true;
      finish();
    });
    this.time.delayedCall(2500, () => {
      this.flyingGift = null;
      this.refreshUnlocks();
      const slot = this.bar.showElement(gift.type);
      this.tweens.killTweensOf(icon);
      if (!slot) {
        icon.destroy();
        arrived = true;
        finish();
        return;
      }
      slot.setAlpha(0);
      const target = this.screenToWorld(slot.x, slot.y);
      const camera = this.cameras.main;
      this.tweens.add({
        targets: icon,
        x: target.x,
        y: target.y,
        angle: 0,
        scale: (70 / Math.max(icon.width, icon.height)) * (DPR / camera.zoom),
        duration: 800,
        ease: 'Quad.easeIn',
        onComplete: () => {
          icon.destroy();
          slot.setAlpha(1);
          this.bar.bounce(slot);
          playHappy();
          this.requestSave();
          arrived = true;
          finish();
        },
      });
    });
  }

  // Ein Album-Sticker steigt beim Tier auf und fliegt zum Album-Knopf
  flySticker(animal, key) {
    const icon = this.add.image(animal.x, animal.top - 20, stickerTexture(animal.def, key)).setDepth(60001).setScale(0);
    const size = 56 / Math.max(icon.width, icon.height);
    const ring = this.add.circle(icon.x, icon.y, 38, 0xffffff, 0.9).setStrokeStyle(5, 0xffc93a).setDepth(60000).setScale(0);
    this.tweens.add({ targets: [icon, ring], y: icon.y - 60, duration: 500, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: icon, scale: size, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: ring, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.time.delayedCall(1300, () => {
      const target = this.screenToWorld(this.albumButton.x, this.albumButton.y);
      this.tweens.add({
        targets: [icon, ring],
        x: target.x,
        y: target.y,
        scale: 0.2,
        duration: 700,
        ease: 'Quad.easeIn',
        onComplete: () => {
          icon.destroy();
          ring.destroy();
          this.albumBadge.setVisible(true);
          this.tweens.add({ targets: this.albumButton, scale: 1.25, duration: 150, yoyo: true });
        },
      });
    });
  }

  // Speichern und zurück zum Startbildschirm, dort kann ein anderes Kind spielen
  goHome() {
    this.save();
    say(SAETZE.goodbye);
    this.scene.start('StartScene');
  }

  // ---------- Speichern ----------

  requestSave() {
    this.saveTimer?.remove();
    this.saveTimer = this.time.delayedCall(SAVE_DELAY, () => this.save());
  }

  save() {
    this.saveTimer?.remove();
    this.saveTimer = null;
    saveGame({
      items: this.placed.map((item) => ({ type: item.element.type, x: Math.round(item.x), y: Math.round(item.y) })),
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      figure: this.figure,
      profile: this.profile,
      animals: this.animals.getState(),
      night: this.night,
      season: this.season,
      unlocked: [...this.unlocked],
      basket: this.basket,
      foodHintGiven: this.foodHintGiven,
    });
  }

  // Blumen als Deko, immer an denselben Stellen
  scatterFlowers() {
    const rnd = new Phaser.Math.RandomDataGenerator(['wiese']);
    const keys = ['blume-gelb', 'blume-rosa', 'blume-weiss'];
    this.flowers = [];
    for (let i = 0; i < 60; i++) {
      const x = rnd.between(30, WORLD_WIDTH - 30);
      const y = rnd.between(40, WORLD_HEIGHT - 20);
      this.flowers.push(this.add.image(x, y, rnd.pick(keys)).setOrigin(0.5, 1).setScale(IMAGE_SCALE).setDepth(DEPTH_FLOWERS));
    }
  }

  // ---------- Eingabe ----------
  //
  // Ein Fingerdruck wird erst beim Loslassen oder nach etwas Bewegung
  // eingeordnet. `this.touch.mode` sagt, worauf der Finger anfangs lag:
  //   'album'   – der Album-Knopf
  //   'sky'     – der Tag/Nacht-Knopf
  //   'season'  – der Jahreszeiten-Knopf
  //   'home'    – das Haus: zurück zum Startbildschirm
  //   'bar'     – die Leiste: ein Knopf (Ding, Futter, Umschalten) oder Wischen zum Blättern
  //   'element' – ein Ding auf der Wiese
  //   'pet'     – ein eingezogenes Tier: antippen oder streicheln
  //   'world'   – freie Wiese (oder ein Tier zu Besuch: das kann man nur antippen)
  //
  // Kommt ein zweiter Finger dazu, wird gezoomt (Pinch). Danach zählt erst
  // wieder eine neue Berührung, wenn alle Finger losgelassen haben.
  setupInput() {
    this.touch = null;
    this.pinch = null;
    this.waitForRelease = false;

    this.input.on('pointerdown', (pointer) => {
      const camera = this.cameras.main;
      const screen = toScreen(pointer);
      if (this.pinch || this.waitForRelease) return;
      if (this.touch && this.touch.pointerId !== pointer.id) {
        // Zweiter Finger: zoomen – außer man trägt gerade etwas herum
        const carrying = this.touch.dragging && (this.touch.item || this.touch.food);
        if (!carrying) this.startPinch();
        return;
      }
      const touch = { x: screen.x, y: screen.y, dragging: false, pointerId: pointer.id };

      if (this.isOnAlbumButton(screen.x, screen.y)) {
        Object.assign(touch, { mode: 'album' });
      } else if (this.isOnButton(this.skyButton, screen.x, screen.y)) {
        Object.assign(touch, { mode: 'sky' });
      } else if (this.isOnButton(this.seasonButton, screen.x, screen.y)) {
        Object.assign(touch, { mode: 'season' });
      } else if (this.isOnButton(this.homeButton, screen.x, screen.y)) {
        Object.assign(touch, { mode: 'home' });
      } else if (this.bar.contains(screen.x, screen.y)) {
        // Auch zwischen den Knöpfen kann man wischen (dann ist slot leer)
        Object.assign(touch, { mode: 'bar', slot: this.bar.slotAt(screen.x, screen.y) });
      } else {
        // Futter antippen: Die Figur läuft hin (auch wenn es z. B. im Teich liegt)
        const pickup = this.food.pickupAt(pointer.worldX, pointer.worldY);
        const animal = pickup ? null : this.animals.animalAt(pointer.worldX, pointer.worldY);
        const item = animal || pickup ? null : this.itemAt(pointer.worldX, pointer.worldY);
        if (!animal && this.isOnPlayer(pointer.worldX, pointer.worldY)) {
          Object.assign(touch, { mode: 'world', figure: true, scrollX: camera.scrollX, scrollY: camera.scrollY });
        } else if (animal?.state === 'resident') {
          Object.assign(touch, { mode: 'pet', animal, lastX: pointer.worldX, lastY: pointer.worldY });
        } else if (animal) {
          Object.assign(touch, { mode: 'world', animal, scrollX: camera.scrollX, scrollY: camera.scrollY });
        } else if (item) {
          Object.assign(touch, { mode: 'element', item, offsetX: item.x - pointer.worldX, offsetY: item.y - pointer.worldY });
        } else {
          Object.assign(touch, { mode: 'world', scrollX: camera.scrollX, scrollY: camera.scrollY });
        }
      }
      this.touch = touch;
    });

    this.input.on('pointermove', (pointer) => {
      if (this.pinch) {
        this.continuePinch();
        return;
      }
      const touch = this.touch;
      if (!touch || !pointer.isDown || pointer.id !== touch.pointerId) return;
      const screen = toScreen(pointer);
      if (!touch.dragging && touch.mode === 'bar' && this.bar.pageCount > 1) {
        // Auf der Leiste: zur Seite wischen blättert, nach oben ziehen holt etwas heraus
        const dx = Math.abs(screen.x - touch.x);
        const dy = Math.abs(screen.y - touch.y);
        if (dx > dy) {
          if (dx > SWIPE_DISTANCE) {
            touch.dragging = true;
            touch.mode = 'none';
            this.bar.turnPage(screen.x < touch.x ? 1 : -1);
          }
          return;
        }
      }
      if (!touch.dragging && Math.hypot(screen.x - touch.x, screen.y - touch.y) > DRAG_THRESHOLD) {
        this.startDrag(touch, pointer);
      }
      if (touch.dragging) this.continueDrag(touch, pointer);
    });

    this.input.on('pointerup', (pointer) => {
      if (this.pinch || this.waitForRelease) {
        this.pinch = null;
        this.waitForRelease = this.input.manager.pointers.some((p) => p.isDown);
        return;
      }
      const touch = this.touch;
      if (!touch || pointer.id !== touch.pointerId) return;
      this.touch = null;
      if (touch.dragging) this.endDrag(touch, pointer);
      else this.tap(touch, pointer);
    });

    // Am Mac zum Ausprobieren: Mausrad zoomt
    this.input.on('wheel', (pointer, objects, dx, dy) => {
      this.zoomAround(this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1), this.worldAt(pointer.x, pointer.y), pointer.x, pointer.y);
    });
  }


  tap(touch, pointer) {
    if (touch.mode === 'album') {
      this.openAlbum();
    } else if (touch.mode === 'sky') {
      this.toggleNight();
    } else if (touch.mode === 'season') {
      this.changeSeason();
    } else if (touch.mode === 'home') {
      this.goHome();
    } else if (touch.mode === 'bar' && !touch.slot) {
      // zwischen die Knöpfe getippt: nichts tun
    } else if (touch.mode === 'bar' && touch.slot.toggle) {
      this.bar.bounce(touch.slot);
      this.bar.toggleMode();
      say(this.bar.mode === 'food' ? SAETZE.modeFood : SAETZE.modeBuild);
    } else if (touch.mode === 'bar') {
      this.bar.bounce(touch.slot);
      this.bar.setGlow(touch.slot, false);
      const food = touch.slot.food;
      if (food && !this.basket[food.type]) say([SAETZE.noFood, food.where]); // leer: Wo gibt es das?
      else say((touch.slot.element ?? food).hint);
    } else if (touch.mode === 'element') {
      this.wiggle(touch.item);
      // Schläft darin ein Tier seinen Winterschlaf, erzählt es davon
      const sleeper = Phaser.Utils.Array.GetRandom(this.animals.hibernatingIn(touch.item));
      if (sleeper) {
        say(sleeper.def.winter.text);
        sleeper.snore();
      } else say(touch.item.element.name);
    } else if (touch.figure) {
      this.openFigureEditor();
    } else if (touch.animal) {
      touch.animal.onTap();
    } else {
      this.walkTo(pointer.worldX, pointer.worldY);
    }
  }

  startDrag(touch, pointer) {
    touch.dragging = true;
    if (touch.mode === 'pet') {
      touch.animal.startPetting();
      return;
    }
    if (['album', 'sky', 'season', 'home'].includes(touch.mode) || (touch.mode === 'bar' && (!touch.slot || touch.slot.toggle))) {
      touch.mode = 'none'; // Knöpfe kann man nicht herausziehen
      return;
    }
    if (touch.mode === 'bar') this.bar.setGlow(touch.slot, false);
    if (touch.mode === 'bar' && touch.slot.food && !this.basket[touch.slot.food.type]) {
      touch.mode = 'none'; // davon ist nichts mehr im Korb
      return;
    }
    if (touch.mode === 'bar' && touch.slot.food) {
      // Futter schwebt etwas über dem Finger, damit man es sieht
      touch.food = touch.slot.food;
      touch.foodImage = this.add
        .image(pointer.worldX, pointer.worldY - FOOD_LIFT, touch.food.type)
        .setScale(IMAGE_SCALE)
        .setDepth(50000);
      return;
    }
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
    // Schilf am Teich wird mitgezogen
    this.reedsOf(touch.item).forEach((reed) => reed.setDepth(50001).setAlpha(0.8));
  }

  continueDrag(touch, pointer) {
    if (touch.mode === 'none') return;
    if (touch.food) {
      touch.foodImage.setPosition(pointer.worldX, pointer.worldY - FOOD_LIFT);
      return;
    }
    if (touch.mode === 'pet') {
      // Nur Bewegung direkt über dem Tier zählt als Streicheln
      const distance = Math.hypot(pointer.worldX - touch.lastX, pointer.worldY - touch.lastY);
      touch.lastX = pointer.worldX;
      touch.lastY = pointer.worldY;
      if (touch.animal.contains(pointer.worldX, pointer.worldY)) touch.animal.pet(distance);
      return;
    }
    if (touch.mode === 'world') {
      // Beim Hineinzoomen bewegt sich die Wiese entsprechend langsamer unter dem Finger
      const screen = toScreen(pointer);
      const factor = DPR / this.cameras.main.zoom;
      this.cameras.main.setScroll(
        touch.scrollX - (screen.x - touch.x) * factor,
        touch.scrollY - (screen.y - touch.y) * factor
      );
      return;
    }
    const item = touch.item;
    this.moveItem(item, pointer.worldX + touch.offsetX, pointer.worldY + touch.offsetY);

    // Über der Leiste wird das Ding kleiner: Loslassen heißt „wegräumen“
    const screen = toScreen(pointer);
    const overBar = this.bar.contains(screen.x, screen.y);
    this.bar.setHighlight(overBar && !touch.isNew);
    item.setScale(overBar ? IMAGE_SCALE / 2 : IMAGE_SCALE);
  }

  endDrag(touch, pointer) {
    this.bar.setHighlight(false);
    if (touch.mode === 'pet') touch.animal.stopPetting();
    if (touch.mode === 'world' || touch.mode === 'pet' || touch.mode === 'none') return;
    if (touch.food) {
      this.dropFood(touch.food, touch.foodImage, pointer);
      return;
    }

    const item = touch.item;
    const screen = toScreen(pointer);
    if (this.bar.contains(screen.x, screen.y)) {
      this.removeItem(item);
      return;
    }
    item.setAlpha(1).setScale(IMAGE_SCALE);
    this.moveItem(
      item,
      Phaser.Math.Clamp(item.x, EDGE, WORLD_WIDTH - EDGE),
      Phaser.Math.Clamp(item.y, EDGE * 2, WORLD_HEIGHT - 10)
    );
    this.updateItemDepth(item);
    this.reedsOf(item).forEach((reed) => {
      reed.setAlpha(1);
      this.updateItemDepth(reed);
    });

    if (item.element.shore && !this.dropAtShore(item, touch.isNew)) return;

    if (touch.isNew) {
      this.placed.push(item);
      this.pop(item);
    }
    // Steht ein Tier zu Besuch daneben, sagt es, ob es das Gesuchte ist
    const answered = this.animals.itemPlaced(item);
    if (touch.isNew && !answered) say(item.element.name);
    this.requestSave();
  }

  // Futter beim Tier loslassen → es frisst (oder zeigt, was es lieber mag).
  // Nur gefressenes Futter ist danach weg aus dem Korb.
  dropFood(food, image, pointer) {
    const animal =
      this.animals.animalAt(image.x, image.y) || this.animals.animalAt(pointer.worldX, pointer.worldY);
    const result = animal?.feed(food, image);
    if (result === 'eaten') {
      this.basket[food.type] = Math.max(0, (this.basket[food.type] || 0) - 1);
      this.bar.setCounts(this.basket);
      this.requestSave();
    }
    if (result) return;
    // Kein Tier da: Das Futter verschwindet einfach wieder
    this.tweens.add({ targets: image, scale: 0, alpha: 0, duration: 300, onComplete: () => image.destroy() });
  }

  // Jedes Bild: Futter einsammeln, und beim Ziehen am Bildschirmrand die Wiese mitwandern lassen
  update(time, delta) {
    this.food.update(this.player);
    const touch = this.touch;
    if (!touch || !touch.dragging || !touch.item) return;

    const pointer = this.input.activePointer;
    const screen = toScreen(pointer);
    const { width } = screenSize(this);
    let dx = 0;
    let dy = 0;
    if (screen.x < AUTO_SCROLL_ZONE) dx = -1;
    else if (screen.x > width - AUTO_SCROLL_ZONE) dx = 1;
    if (screen.y < AUTO_SCROLL_ZONE) dy = -1;
    if (dx === 0 && dy === 0) return;

    const camera = this.cameras.main;
    const step = (AUTO_SCROLL_SPEED * delta) / 1000;
    camera.setScroll(camera.scrollX + dx * step, camera.scrollY + dy * step);
    // Position des Fingers in der Welt neu berechnen, damit das Ding mitwandert
    const world = camera.getWorldPoint(pointer.x, pointer.y);
    this.moveItem(touch.item, world.x + touch.offsetX, world.y + touch.offsetY);
  }

  // ---------- Dinge auf der Wiese ----------

  createItem(element, x, y) {
    const item = this.add.image(x, y, element.type).setScale(IMAGE_SCALE);
    item.setOrigin(0.5, element.flat ? 0.5 : 1);
    item.element = element;
    this.seasons?.tintItem(item);
    return item;
  }

  removeItem(item) {
    // Mit dem Teich verschwindet auch sein Schilf
    this.reedsOf(item).forEach((reed) => this.removeItem(reed));
    this.placed = this.placed.filter((other) => other !== item);
    this.requestSave();
    this.tweens.add({
      targets: item,
      scale: 0,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => item.destroy(),
    });
  }

  // Verschiebt ein Ding; bei einem Teich wandert das Schilf am Ufer mit
  moveItem(item, x, y) {
    item.setPosition(x, y);
    this.reedsOf(item).forEach((reed) => reed.setPosition(x + reed.shoreOffset.x, y + reed.shoreOffset.y));
  }

  // ---------- Schilf am Teich ----------

  reedsOf(pond) {
    if (!pond || pond.element.type !== 'teich') return [];
    return this.placed.filter((item) => item.pond === pond);
  }

  nearestPond(x, y, maxDistance) {
    let best = null;
    let bestDistance = maxDistance;
    this.placed.forEach((item) => {
      if (item.element.type !== 'teich') return;
      const distance = Phaser.Math.Distance.Between(x, y, item.x, item.y);
      if (distance <= bestDistance) {
        best = item;
        bestDistance = distance;
      }
    });
    return best;
  }

  // Setzt das Schilf auf den Uferrand, an der Seite, wo es hingezogen wurde
  attachToShore(reed, pond) {
    const angle = Math.atan2((reed.y - pond.y) / SHORE_Y, (reed.x - pond.x) / SHORE_X);
    reed.pond = pond;
    reed.shoreOffset = { x: Math.cos(angle) * SHORE_X, y: Math.sin(angle) * SHORE_Y };
    reed.setPosition(pond.x + reed.shoreOffset.x, pond.y + reed.shoreOffset.y);
    this.updateItemDepth(reed);
  }

  // Schilf wurde losgelassen: ans Ufer rutschen lassen. Ist kein Teich in der
  // Nähe, erklärt die Stimme warum, und das Schilf geht zurück.
  // Gibt false zurück, wenn das Schilf nicht hingestellt wurde.
  dropAtShore(reed, isNew) {
    const pond = this.nearestPond(reed.x, reed.y, SHORE_REACH);
    if (pond) {
      const from = { x: reed.x, y: reed.y };
      this.attachToShore(reed, pond);
      // Kurz vom Loslass-Punkt ans Ufer gleiten
      this.tweens.add({ targets: reed, x: { from: from.x, to: reed.x }, y: { from: from.y, to: reed.y }, duration: 200 });
      return true;
    }

    const anyPond = this.placed.some((item) => item.element.type === 'teich');
    say(anyPond ? SAETZE.reedToPond : SAETZE.reedNoPond);
    if (isNew) {
      this.removeItem(reed);
    } else {
      // Zurück an seinen alten Platz am Ufer
      this.tweens.add({
        targets: reed,
        x: reed.pond.x + reed.shoreOffset.x,
        y: reed.pond.y + reed.shoreOffset.y,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => this.updateItemDepth(reed),
      });
    }
    return false;
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
    item.setScale(IMAGE_SCALE * 0.6);
    this.tweens.add({ targets: item, scale: IMAGE_SCALE, duration: 300, ease: 'Back.easeOut' });
  }

  // Wackeln beim Antippen
  wiggle(item) {
    this.tweens.add({ targets: item, angle: { from: -5, to: 5 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => item.setAngle(0) });
  }

  // ---------- Figur ----------

  // Das Bild der Figur aus der Auswahl im Baukasten zusammensetzen
  async applyFigure() {
    const key = await makeFigureTexture(this, this.figure, DPR, this.profile.photo);
    if (!key || !this.player.active) return;
    const old = this.player.texture.key;
    this.player.setTexture(key);
    if (old.startsWith('spielfigur-')) this.textures.remove(old);
  }

  isOnPlayer(worldX, worldY) {
    const p = this.player;
    return (
      Math.abs(worldX - p.x) <= p.displayWidth / 2 && worldY <= p.y + 10 && worldY >= p.y - p.displayHeight
    );
  }

  openFigureEditor() {
    this.walkTween?.stop();
    this.stopBobbing();
    this.scene.pause();
    this.scene.launch('FigureScene', {
      figure: this.figure,
      profile: this.profile,
      onDone: (figure, profile) => {
        this.figure = normalizeFigure(figure);
        this.profile = { name: cleanName(profile.name), photo: validPhoto(profile.photo) };
        this.applyFigure();
        this.save();
      },
    });
  }

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
      onComplete: () => {
        this.stopBobbing();
        this.requestSave();
      },
    });
    this.startBobbing();
  }

  // Leichtes Hüpfen beim Laufen
  startBobbing() {
    if (this.bobTween) return;
    this.bobTween = this.tweens.add({
      targets: this.player,
      scaleY: IMAGE_SCALE * 0.94,
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
    this.player.setScale(IMAGE_SCALE).setAngle(0);
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
