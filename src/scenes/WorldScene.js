// Die Wiese: eine Landschaft, die größer als der Bildschirm ist.
// Tippen → die Figur läuft dorthin. Ziehen → die Ansicht verschiebt sich.
// Aus der Bau-Leiste zieht man Dinge auf die Wiese; Dinge auf der Wiese
// kann man verschieben oder zurück auf die Leiste ziehen (wegräumen).
// Eingezogene Tiere kann man streicheln: Finger über dem Tier hin und her bewegen.
// Mit dem Korb-Knopf wird die Leiste zum Futterkorb; Futter zieht man zu den Tieren.
// Der Album-Knopf oben rechts öffnet das Tier-Album. Tippt man auf die eigene
// Figur, öffnet sich der Figuren-Baukasten.
import { AnimalManager } from '../AnimalManager.js';
import { BuildBar } from '../BuildBar.js';
import { DPR, IMAGE_SCALE, screenSize, setupCamera, toScreen, uiOrigin } from '../display.js';
import { getElement } from '../elements.js';
import { makeFigureTexture, normalizeFigure } from '../figure.js';
import { cleanName } from '../parents.js';
import { loadGame, saveGame } from '../save.js';
import { say } from '../speech.js';

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

// Nur Fotos annehmen, die der Eltern-Bereich selbst erzeugt hat (JPEG-Daten)
function validPhoto(photo) {
  return typeof photo === 'string' && photo.startsWith('data:image/jpeg;base64,') ? photo : null;
}

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  create() {
    setupCamera(this);
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'gras').setOrigin(0).setTileScale(IMAGE_SCALE);
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

    this.animals = new AnimalManager(
      this,
      () => this.placed,
      { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      () => this.requestSave(),
      () => this.profile.name
    );
    if (saved) this.animals.restore(saved.animals);
    this.bar = new BuildBar(this);
    this.createAlbumButton();

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
    this.bar.layout();
    this.layoutAlbumButton();
  }

  // ---------- Tier-Album ----------

  createAlbumButton() {
    const circle = this.add.circle(0, 0, ALBUM_RADIUS, 0xffffff, 0.9);
    const icon = this.add.image(0, 0, 'album');
    icon.setScale((ALBUM_RADIUS * 1.4) / Math.max(icon.width, icon.height));
    this.albumButton = this.add.container(0, 0, [circle, icon]).setScrollFactor(0).setDepth(100000);
    this.layoutAlbumButton();
  }

  layoutAlbumButton() {
    const { width } = screenSize(this);
    const origin = uiOrigin(this);
    this.albumButton.setPosition(
      origin.x + width - ALBUM_RADIUS - ALBUM_MARGIN,
      origin.y + ALBUM_RADIUS + ALBUM_MARGIN
    );
  }

  // Liegt diese Bildschirmposition auf dem Album-Knopf?
  isOnAlbumButton(screenX, screenY) {
    const origin = uiOrigin(this);
    const x = this.albumButton.x - origin.x;
    const y = this.albumButton.y - origin.y;
    return Phaser.Math.Distance.Between(screenX, screenY, x, y) <= ALBUM_RADIUS + 10;
  }

  openAlbum() {
    this.tweens.add({ targets: this.albumButton, scale: 1.15, duration: 120, yoyo: true });
    this.save();
    const discovered = this.animals.getState().filter((a) => a.hasLivedHere).map((a) => a.type);
    this.scene.pause();
    this.scene.launch('AlbumScene', { discovered });
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
    });
  }

  // Blumen als Deko, immer an denselben Stellen
  scatterFlowers() {
    const rnd = new Phaser.Math.RandomDataGenerator(['wiese']);
    const keys = ['blume-gelb', 'blume-rosa', 'blume-weiss'];
    for (let i = 0; i < 60; i++) {
      const x = rnd.between(30, WORLD_WIDTH - 30);
      const y = rnd.between(40, WORLD_HEIGHT - 20);
      this.add.image(x, y, rnd.pick(keys)).setOrigin(0.5, 1).setScale(IMAGE_SCALE).setDepth(DEPTH_FLOWERS);
    }
  }

  // ---------- Eingabe ----------
  //
  // Ein Fingerdruck wird erst beim Loslassen oder nach etwas Bewegung
  // eingeordnet. `this.touch.mode` sagt, worauf der Finger anfangs lag:
  //   'album'   – der Album-Knopf
  //   'bar'     – ein Knopf der Leiste (Ding, Futter oder Umschalt-Knopf)
  //   'element' – ein Ding auf der Wiese
  //   'pet'     – ein eingezogenes Tier: antippen oder streicheln
  //   'world'   – freie Wiese (oder ein Tier zu Besuch: das kann man nur antippen)
  setupInput() {
    this.touch = null;

    this.input.on('pointerdown', (pointer) => {
      const camera = this.cameras.main;
      const screen = toScreen(pointer);
      const touch = { x: screen.x, y: screen.y, dragging: false };

      if (this.isOnAlbumButton(screen.x, screen.y)) {
        Object.assign(touch, { mode: 'album' });
      } else if (this.bar.contains(screen.x, screen.y)) {
        const slot = this.bar.slotAt(screen.x, screen.y);
        if (!slot) return; // Leiste zwischen den Knöpfen: nichts tun
        Object.assign(touch, { mode: 'bar', slot });
      } else {
        const animal = this.animals.animalAt(pointer.worldX, pointer.worldY);
        const item = animal ? null : this.itemAt(pointer.worldX, pointer.worldY);
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
      const touch = this.touch;
      if (!touch || !pointer.isDown) return;
      const screen = toScreen(pointer);
      if (!touch.dragging && Math.hypot(screen.x - touch.x, screen.y - touch.y) > DRAG_THRESHOLD) {
        this.startDrag(touch, pointer);
      }
      if (touch.dragging) this.continueDrag(touch, pointer);
    });

    this.input.on('pointerup', (pointer) => {
      const touch = this.touch;
      this.touch = null;
      if (!touch) return;
      if (touch.dragging) this.endDrag(touch, pointer);
      else this.tap(touch, pointer);
    });
  }

  tap(touch, pointer) {
    if (touch.mode === 'album') {
      this.openAlbum();
    } else if (touch.mode === 'bar' && touch.slot.toggle) {
      this.bar.bounce(touch.slot);
      this.bar.toggleMode();
      say(this.bar.mode === 'food' ? 'Futter! Zieh es zu einem Tier.' : 'Bauen! Zieh etwas auf die Wiese.');
    } else if (touch.mode === 'bar') {
      this.bar.bounce(touch.slot);
      say((touch.slot.element ?? touch.slot.food).hint);
    } else if (touch.mode === 'element') {
      this.wiggle(touch.item);
      say(touch.item.element.name);
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
    if (touch.mode === 'album' || (touch.mode === 'bar' && touch.slot.toggle)) {
      touch.mode = 'none'; // Knöpfe kann man nicht herausziehen
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
      const screen = toScreen(pointer);
      this.cameras.main.setScroll(touch.scrollX - (screen.x - touch.x), touch.scrollY - (screen.y - touch.y));
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
      say(item.element.name);
      this.pop(item);
    }
    this.requestSave();
  }

  // Futter beim Tier loslassen → es frisst (oder zeigt, was es lieber mag)
  dropFood(food, image, pointer) {
    const animal =
      this.animals.animalAt(image.x, image.y) || this.animals.animalAt(pointer.worldX, pointer.worldY);
    if (animal?.feed(food, image)) return;
    // Kein Tier da: Das Futter verschwindet einfach wieder
    this.tweens.add({ targets: image, scale: 0, alpha: 0, duration: 300, onComplete: () => image.destroy() });
  }

  // Zieht man ein Ding an den Bildschirmrand, wandert die Wiese mit
  update(time, delta) {
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
    say(anyPond ? 'Schilf wächst am Wasser. Zieh es an den Teich!' : 'Schilf wächst am Wasser. Stell zuerst einen Teich hin!');
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
