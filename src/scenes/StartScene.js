// Startbildschirm: Jedes Kind tippt auf die Karte mit seiner Figur und spielt
// seinen eigenen Spielstand weiter. Die Karte mit dem „+“ legt ein neues
// Spiel an. Gibt es noch gar keinen Spielstand, steht dort nur der große
// Spielen-Knopf. Der erste Tipp ist nötig, weil Safari Ton und Sprachausgabe
// erst nach einer Berührung erlaubt.
// Lange auf eine Karte drücken: Eltern-Sperre, danach kann man sie löschen.
import { DPR, IMAGE_SCALE, screenSize, setupCamera, toScreen, uiOrigin } from '../display.js';
import { makeFigureTexture, normalizeFigure } from '../figure.js';
import { createTextures, preloadGraphics } from '../textures.js';
import { MAX_SAVES, chooseSave, createSave, deleteSave, listSaves, requestPersistentStorage } from '../save.js';
import { askParentLock, cleanName, confirmDeleteSave } from '../parents.js';
import { unlockAudio } from '../sound.js';
import { SAETZE } from '../saetze.js';
import { say } from '../speech.js';

const BUTTON_RADIUS = 90;
const CARD_WIDTH = 170;
const CARD_HEIGHT = 230;
const CARD_GAP = 24;
const FIGURE_SCALE = 0.9; // so groß ist die Figur auf der Karte
const DELETE_HOLD = 2000; // so lange drücken, bis die Eltern-Sperre kommt
const HOLD_VISIBLE = 400; // erst dann erscheint der Fortschritt (ein normaler Tipp ist kürzer)
const FONT = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

// Der Name auf der Karte: Name der Figur oder Datum und Uhrzeit des ersten Spiels
function saveLabel(save) {
  const name = cleanName(save.profile?.name);
  if (name) return name;
  const date = new Date(save.created);
  const day = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${day}\n${time} Uhr`;
}

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  preload() {
    preloadGraphics(this);
  }

  create() {
    createTextures(this);
    setupCamera(this);

    this.ui = this.add.container(0, 0);
    this.background = this.add.tileSprite(0, 0, 10, 10, 'gras').setOrigin(0).setTileScale(IMAGE_SCALE);
    this.ui.add(this.background);

    // Drei Tiere schauen zu
    this.animals = [
      { key: 'eichhoernchen', dx: -0.4, flip: false },
      { key: 'igel', dx: 0.36, flip: true },
      { key: 'ente', dx: 0.43, flip: true },
    ].map(({ key, dx, flip }) => {
      const image = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(IMAGE_SCALE).setFlipX(flip);
      image.dx = dx;
      this.ui.add(image);
      return image;
    });

    this.cards = [];
    this.figureKeys = [];
    this.buildCards();

    this.input.on('pointerdown', (pointer) => this.onPress(pointer));
    this.input.on('pointerup', (pointer) => this.onRelease(pointer));

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.removeFigureTextures();
    });
  }

  // ---------- Karten ----------

  buildCards() {
    this.cards.forEach((card) => card.destroy());
    this.removeFigureTextures();
    const saves = listSaves();
    if (saves.length === 0) {
      this.cards = [this.createPlayButton()];
    } else {
      this.cards = saves.map((save) => this.createSaveCard(save));
      if (saves.length < MAX_SAVES) this.cards.push(this.createNewCard());
    }
    this.cards.forEach((card) => this.ui.add(card));
    this.layout();
  }

  createCardBackground(color) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15);
    g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2 + 8, CARD_WIDTH, CARD_HEIGHT, 26);
    g.fillStyle(color, 0.95);
    g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 26);
    g.lineStyle(4, 0xd9b77a);
    g.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 26);
    return g;
  }

  // Karte für einen Spielstand: die eigene Figur (mit Foto) und der Name
  createSaveCard(save) {
    const label = saveLabel(save);
    const figure = this.add.image(0, 40, 'figur').setOrigin(0.5, 1).setScale(IMAGE_SCALE * FIGURE_SCALE);
    const text = this.add
      .text(0, 72, label, {
        fontFamily: FONT,
        fontSize: label.includes('\n') ? '17px' : '22px',
        fontStyle: 'bold',
        color: '#4a3417',
        align: 'center',
        wordWrap: { width: CARD_WIDTH - 20 },
        resolution: DPR,
      })
      .setOrigin(0.5);
    const bar = this.add.graphics();
    const card = this.add.container(0, 0, [this.createCardBackground(0xfff6e0), figure, text, bar]);
    Object.assign(card, { save, label, bar });

    // Die Figur wird wie im Spiel aus Teilen gezeichnet – das dauert einen Moment
    makeFigureTexture(this, normalizeFigure(save.figure), DPR, save.profile?.photo).then((key) => {
      if (!key) return;
      if (!figure.active) {
        this.textures.remove(key);
        return;
      }
      this.figureKeys.push(key);
      figure.setTexture(key).setScale(IMAGE_SCALE * FIGURE_SCALE);
    });
    return card;
  }

  // Karte mit „+“: ein neues Spiel anfangen
  createNewCard() {
    const g = this.add.graphics();
    g.fillStyle(0x6cc04a);
    g.fillCircle(0, 0, 50);
    g.fillStyle(0xffffff);
    g.fillRoundedRect(-30, -8, 60, 16, 8);
    g.fillRoundedRect(-8, -30, 16, 60, 8);
    const card = this.add.container(0, 0, [this.createCardBackground(0xffffff), g]);
    card.isNew = true;
    card.setAlpha(0.9);
    return card;
  }

  // Ganz am Anfang (noch kein Spielstand): der große, pulsierende Spielen-Knopf
  createPlayButton() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(0, 10, BUTTON_RADIUS);
    g.fillStyle(0xf2b52a);
    g.fillCircle(0, 0, BUTTON_RADIUS);
    g.fillStyle(0xffd84a);
    g.fillCircle(-4, -5, BUTTON_RADIUS - 8);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(-22, -44, 90, 36);
    g.lineStyle(4, 0xd99a1c);
    g.strokeCircle(0, 0, BUTTON_RADIUS);
    g.fillStyle(0xe2553a);
    g.fillTriangle(-22, -38, -22, 42, 48, 2);
    g.fillStyle(0xff7a59);
    g.fillTriangle(-25, -42, -25, 38, 45, -2);

    const button = this.add.container(0, 0, [g]);
    button.isNew = true;
    button.round = true;
    // Sanftes Pulsieren zeigt: Hier tippen!
    this.tweens.add({ targets: button, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return button;
  }

  removeFigureTextures() {
    this.figureKeys.forEach((key) => this.textures.remove(key));
    this.figureKeys = [];
  }

  cardAt(x, y) {
    return this.cards.find((card) => {
      if (card.round) return Phaser.Math.Distance.Between(x, y, card.x, card.y) <= BUTTON_RADIUS + 30;
      const halfW = (CARD_WIDTH / 2) * card.scale;
      const halfH = (CARD_HEIGHT / 2) * card.scale;
      return Math.abs(x - card.x) <= halfW && Math.abs(y - card.y) <= halfH;
    });
  }

  // ---------- Tippen und lange Drücken ----------

  onPress(pointer) {
    const { x, y } = toScreen(pointer);
    const card = this.cardAt(x, y);
    this.pressed = card ? { card, shown: false } : null;
    if (!card?.save) return;
    // Lange drücken: Unten auf der Karte füllt sich langsam ein Balken
    const progress = { value: 0 };
    this.pressed.hold = this.tweens.add({
      targets: progress,
      value: 1,
      duration: DELETE_HOLD,
      onUpdate: (tween) => {
        if (tween.elapsed < HOLD_VISIBLE) return;
        this.pressed.shown = true;
        const width = (CARD_WIDTH - 40) * progress.value;
        card.bar.clear().fillStyle(0xf2b52a).fillRoundedRect(-CARD_WIDTH / 2 + 20, CARD_HEIGHT / 2 - 18, width, 8, 4);
      },
      onComplete: () => {
        card.bar.clear();
        this.pressed = null;
        this.askDelete(card);
      },
    });
  }

  onRelease(pointer) {
    const pressed = this.pressed;
    this.pressed = null;
    if (!pressed) return;
    pressed.hold?.stop();
    pressed.card.bar?.clear();
    if (pressed.shown) return; // lange gedrückt, aber zu früh losgelassen: nichts tun
    const { x, y } = toScreen(pointer);
    if (this.cardAt(x, y) === pressed.card) this.startGame(pressed.card);
  }

  startGame(card) {
    unlockAudio();
    requestPersistentStorage();
    if (card.isNew) {
      createSave();
      say([SAETZE.newGame, SAETZE.helloHint]);
    } else {
      chooseSave(card.save.id);
      say([SAETZE.hello, SAETZE.helloHint]);
    }
    this.scene.start('WorldScene');
  }

  // Löschen nur nach der Eltern-Sperre und einer Nachfrage
  askDelete(card) {
    unlockAudio();
    this.input.enabled = false;
    const back = () => {
      this.input.enabled = true;
    };
    askParentLock(
      () =>
        confirmDeleteSave(
          card.label.replace('\n', ', '),
          () => {
            deleteSave(card.save.id);
            back();
            this.buildCards();
          },
          back
        ),
      back
    );
  }

  // ---------- Anordnung ----------

  layout() {
    const { width, height } = screenSize(this);
    const origin = uiOrigin(this);
    this.ui.setPosition(origin.x, origin.y);
    this.background.setSize(width, height);
    this.animals.forEach((image) => image.setPosition(width / 2 + image.dx * width, height - 30));

    if (this.cards.length === 1 && this.cards[0].round) {
      this.cards[0].setPosition(width / 2, height / 2);
      return;
    }
    // Karten in Reihen, so groß wie möglich, aber höchstens normal groß
    const count = this.cards.length;
    const columns = Math.max(1, Math.min(count, Math.floor((width - 40 + CARD_GAP) / (CARD_WIDTH + CARD_GAP))));
    const rows = Math.ceil(count / columns);
    const totalWidth = columns * CARD_WIDTH + (columns - 1) * CARD_GAP;
    const totalHeight = rows * CARD_HEIGHT + (rows - 1) * CARD_GAP;
    const fit = Math.min(1, (width - 40) / totalWidth, (height - 80) / totalHeight);
    this.cards.forEach((card, i) => {
      const row = Math.floor(i / columns);
      const inRow = Math.min(columns, count - row * columns);
      const column = i % columns;
      const rowWidth = (inRow * CARD_WIDTH + (inRow - 1) * CARD_GAP) * fit;
      card.setScale(fit);
      card.setPosition(
        width / 2 - rowWidth / 2 + (column * (CARD_WIDTH + CARD_GAP) + CARD_WIDTH / 2) * fit,
        height / 2 - (totalHeight * fit) / 2 + (row * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2) * fit
      );
    });
  }
}
