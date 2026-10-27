// Der Figuren-Baukasten: eine Seite über der Wiese. Links steht die Figur,
// rechts wählt man Frisur und Farben aus runden Knöpfen. Jede Änderung
// sieht man sofort. Vorne in jeder Reihe zeigt ein Symbol (mit kurzem Wort),
// was die Reihe ändert; antippen liest es vor. Die WorldScene ist so lange angehalten.
import { DPR, screenSize, setupCamera, toScreen, uiOrigin } from '../display.js';
import {
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_COLORS,
  SHIRT_COLORS,
  SKIN_COLORS,
  makeFigureTexture,
  normalizeFigure,
} from '../figure.js';
import { askParentLock, openParentArea } from '../parents.js';
import { say } from '../speech.js';

const SWATCH_RADIUS = 34; // runde Auswahlknöpfe, 68 pt groß
const SWATCH_GAP = 12;
const ROW_GAP = 14;
const PREVIEW_SCALE = 2.4; // so viel größer als auf der Wiese
const STYLE_PREVIEW_SCALE = 0.62; // Mini-Figuren auf den Frisur-Knöpfen
const BUST = 0.52; // von den Mini-Figuren nur Kopf und Schultern zeigen (oberer Teil)
const BUST_CENTER = BUST / 2;
const CLOSE_RADIUS = 40;
const LOCK_RADIUS = 30; // Schloss zum Eltern-Bereich (oben links)
const LOCK_HOLD = 2000; // so lange muss man das Schloss gedrückt halten
const LABEL_WIDTH = 96; // Spalte mit den Symbolen vor den Reihen
const SYMBOL_SIZE = 50;
const FONT = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

// Die Zeilen des Baukastens: welche Einstellung, welche Auswahl, was gesagt wird
// symbol/label/hint: Symbol vorne in der Reihe, Wort darunter, Satz beim Antippen
const ROWS = [
  { key: 'hair', symbol: 'symbol-frisur', label: 'Frisur', hint: 'Hier suchst du die Frisur aus.', options: HAIR_STYLES, say: (o) => o.say },
  { key: 'hairColor', symbol: 'symbol-haarfarbe', label: 'Haare', hint: 'Hier suchst du die Haarfarbe aus.', options: HAIR_COLORS, say: (o) => `${capitalize(o.word)}e Haare!` },
  { key: 'skin', symbol: 'symbol-haut', label: 'Haut', hint: 'Hier suchst du die Hautfarbe aus.', options: SKIN_COLORS.map((color) => ({ color })), say: () => 'Diese Hautfarbe!' },
  { key: 'shirt', symbol: 'symbol-shirt', label: 'T-Shirt', hint: 'Hier suchst du die Farbe vom T-Shirt aus.', options: SHIRT_COLORS, say: (o) => `Ein ${o.word}es T-Shirt!` },
  { key: 'pants', symbol: 'symbol-hose', label: 'Hose', hint: 'Hier suchst du die Farbe von der Hose aus.', options: PANTS_COLORS, say: (o) => `Eine ${o.word}e Hose!` },
];

function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1);
}

function toNumber(hex) {
  return parseInt(hex.slice(1), 16);
}

export class FigureScene extends Phaser.Scene {
  constructor() {
    super('FigureScene');
  }

  // data.figure: die aktuelle Auswahl; data.profile: Name und Foto
  // data.onDone(figure, profile) wird beim Schließen aufgerufen
  init(data) {
    this.profile = { name: data.profile?.name || '', photo: data.profile?.photo || null };
    this.figure = normalizeFigure(data.figure);
    this.onDone = data.onDone;
    this.ownTextures = [];
  }

  create() {
    setupCamera(this);
    this.ui = this.add.container(0, 0);
    this.dim = this.add.rectangle(0, 0, 10, 10, 0x1d3b14, 0.55).setOrigin(0);
    this.panel = this.add.graphics();
    this.preview = this.add.image(0, 0, 'figur').setOrigin(0.5, 1);
    this.ui.add([this.dim, this.panel, this.preview]);

    this.rows = ROWS.map((row) => ({
      ...row,
      tag: this.createTag(row),
      buttons: row.options.map((option, index) => this.createSwatch(row, option, index)),
    }));
    this.closeButton = this.createCloseButton();
    this.lockButton = this.createLockButton();
    this.ui.add(this.lockButton);
    this.ui.add(this.closeButton);

    this.layout();
    this.refresh();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.ownTextures.forEach((key) => this.textures.remove(key));
    });

    this.input.on('pointerdown', (pointer) => this.onPress(toScreen(pointer)));
    this.input.on('pointerup', (pointer) => this.onTap(toScreen(pointer)));
    const name = this.profile.name ? `, ${this.profile.name}` : '';
    say(`Wie soll deine Figur aussehen${name}? Tipp auf die Farben!`);
  }

  // Symbol und Wort vorne in der Reihe
  createTag(row) {
    const icon = this.add.image(0, -10, row.symbol);
    icon.setScale(SYMBOL_SIZE / Math.max(icon.width, icon.height));
    const style = { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#7a5a2a', resolution: DPR };
    const label = this.add.text(0, 26, row.label, style).setOrigin(0.5);
    const tag = this.add.container(0, 0, [icon, label]);
    this.ui.add(tag);
    return tag;
  }

  createSwatch(row, option, index) {
    const ring = this.add.circle(0, 0, SWATCH_RADIUS + 5, 0xffffff).setStrokeStyle(4, 0xf2b52a);
    const parts = [ring];
    let mini = null;
    if (row.key === 'hair') {
      // Frisur-Knöpfe zeigen eine kleine Figur mit dieser Frisur
      parts.push(this.add.circle(0, 0, SWATCH_RADIUS, 0xfff1d6));
      mini = this.add.image(0, 0, 'figur').setOrigin(0.5, BUST_CENTER).setVisible(false);
      parts.push(mini);
    } else {
      parts.push(this.add.circle(0, 0, SWATCH_RADIUS, toNumber(option.color)).setStrokeStyle(2, 0x00000, 0.25));
    }
    const button = this.add.container(0, 0, parts);
    button.ring = ring;
    button.mini = mini;
    button.row = row;
    button.index = index;
    this.ui.add(button);
    return button;
  }

  createCloseButton() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(0, 4, CLOSE_RADIUS);
    g.fillStyle(0x6cc04a);
    g.fillCircle(0, 0, CLOSE_RADIUS);
    // Ein Haken: „Fertig!“
    g.lineStyle(9, 0xffffff);
    g.beginPath();
    g.moveTo(-16, 1);
    g.lineTo(-5, 13);
    g.lineTo(17, -12);
    g.strokePath();
    return this.add.container(0, 0, [g]);
  }

  layout() {
    const { width, height } = screenSize(this);
    const origin = uiOrigin(this);
    this.ui.setPosition(origin.x, origin.y);
    this.dim.setSize(width, height);

    const step = SWATCH_RADIUS * 2 + SWATCH_GAP + 10;
    const maxButtons = Math.max(...ROWS.map((row) => row.options.length));
    const rowsWidth = LABEL_WIDTH + maxButtons * step;
    const rowsHeight = ROWS.length * (SWATCH_RADIUS * 2 + 10 + ROW_GAP);
    const previewWidth = 100 * PREVIEW_SCALE;
    const previewHeight = 150 * PREVIEW_SCALE;

    // Breit genug: Figur links, Knöpfe rechts. Sonst Figur oben, Knöpfe darunter.
    const side = width >= rowsWidth + previewWidth + 140;
    const contentWidth = side ? previewWidth + 60 + rowsWidth : rowsWidth;
    const contentHeight = side ? Math.max(previewHeight, rowsHeight) : previewHeight * 0.7 + 20 + rowsHeight;
    const fit = Math.min(1, (width - 48) / (contentWidth + 40), (height - 48) / (contentHeight + 60));
    this.fit = fit;

    const panelWidth = (contentWidth + 60) * fit;
    const panelHeight = (contentHeight + 70) * fit;
    const panelLeft = (width - panelWidth) / 2;
    const panelTop = (height - panelHeight) / 2;
    this.panel.clear();
    this.panel.fillStyle(0xfff6e0);
    this.panel.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 36);
    this.panel.lineStyle(4, 0xd9b77a);
    this.panel.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 36);

    const left = panelLeft + 30 * fit;
    const top = panelTop + 40 * fit;
    let rowsLeft;
    let rowsTop;
    if (side) {
      this.previewScale = PREVIEW_SCALE * fit;
      this.preview.setPosition(left + (previewWidth / 2) * fit, top + ((contentHeight + previewHeight) / 2) * fit);
      rowsLeft = left + (previewWidth + 60) * fit;
      rowsTop = top + ((contentHeight - rowsHeight) / 2) * fit;
    } else {
      this.previewScale = PREVIEW_SCALE * 0.7 * fit;
      this.preview.setPosition(width / 2, top + previewHeight * 0.7 * fit);
      rowsLeft = left;
      rowsTop = top + (previewHeight * 0.7 + 20) * fit;
    }
    this.preview.setScale(this.previewScale / DPR / PREVIEW_SCALE);

    this.rows.forEach((row, r) => {
      const y = rowsTop + (r * (SWATCH_RADIUS * 2 + 10 + ROW_GAP) + SWATCH_RADIUS + 5) * fit;
      row.tag.setPosition(rowsLeft + (LABEL_WIDTH / 2) * fit, y).setScale(fit);
      row.buttons.forEach((button, i) => {
        button.setPosition(rowsLeft + (LABEL_WIDTH + i * step + step / 2) * fit, y).setScale(fit);
      });
    });
    this.closeButton.setPosition(panelLeft + panelWidth - 30, panelTop + 30).setScale(Math.max(fit, 0.8));
    this.lockButton.setPosition(panelLeft + 34, panelTop + 34);
  }

  // Figur und Frisur-Knöpfe neu zeichnen und die Auswahl markieren
  async refresh() {
    this.rows.forEach((row) =>
      row.buttons.forEach((button) => button.ring.setStrokeStyle(button.index === this.figure[row.key] ? 6 : 0, 0xf2b52a))
    );
    const version = (this.version = (this.version || 0) + 1);
    const previewKey = await makeFigureTexture(this, this.figure, DPR * PREVIEW_SCALE, this.profile.photo);
    const styleKeys = await Promise.all(
      HAIR_STYLES.map((_, hair) => makeFigureTexture(this, { ...this.figure, hair }, DPR * STYLE_PREVIEW_SCALE))
    );
    const newKeys = [previewKey, ...styleKeys].filter(Boolean);
    // Ist inzwischen schon wieder etwas anderes gewählt, diese Bilder verwerfen
    if (version !== this.version || !this.scene.isActive()) {
      newKeys.forEach((key) => this.textures.remove(key));
      return;
    }
    const oldKeys = this.ownTextures;
    if (previewKey) this.preview.setTexture(previewKey);
    this.rows[0].buttons.forEach((button, i) => {
      if (!styleKeys[i]) return;
      const mini = button.mini.setTexture(styleKeys[i]).setScale(1 / DPR).setVisible(true);
      mini.setCrop(0, 0, mini.frame.width, mini.frame.height * BUST);
    });
    this.ownTextures = newKeys;
    oldKeys.forEach((key) => this.textures.remove(key));
  }

  // ---------- Eltern-Bereich ----------

  // Ein kleines, unauffälliges Schloss. Lange drücken füllt den Ring.
  createLockButton() {
    const g = this.add.graphics();
    g.fillStyle(0xeadfc6);
    g.fillCircle(0, 0, LOCK_RADIUS);
    g.lineStyle(4, 0x9a8462);
    g.strokeRoundedRect(-8, -16, 16, 18, 7);
    g.fillStyle(0x9a8462);
    g.fillRoundedRect(-12, -4, 24, 18, 4);
    this.lockRing = this.add.graphics();
    return this.add.container(0, 0, [g, this.lockRing]);
  }

  isOnLock(x, y) {
    return Phaser.Math.Distance.Between(x, y, this.lockButton.x, this.lockButton.y) <= LOCK_RADIUS + 10;
  }

  onPress({ x, y }) {
    if (!this.isOnLock(x, y)) return;
    const progress = { value: 0 };
    this.lockHold = this.tweens.add({
      targets: progress,
      value: 1,
      duration: LOCK_HOLD,
      onUpdate: () => {
        this.lockRing.clear().lineStyle(6, 0xf2b52a);
        this.lockRing.beginPath();
        this.lockRing.arc(0, 0, LOCK_RADIUS + 4, -Math.PI / 2, -Math.PI / 2 + progress.value * Math.PI * 2);
        this.lockRing.strokePath();
      },
      onComplete: () => {
        this.lockHold = null;
        this.lockRing.clear();
        this.openParents();
      },
    });
  }

  // Losgelassen, bevor der Ring voll war
  cancelLockHold() {
    if (!this.lockHold) return false;
    this.lockHold.stop();
    this.lockHold = null;
    this.lockRing.clear();
    say('Das ist für Erwachsene.');
    return true;
  }

  openParents() {
    say('');
    this.input.enabled = false;
    const back = () => {
      this.input.enabled = true;
    };
    askParentLock(
      () =>
        openParentArea(
          this.profile,
          (profile) => {
            this.profile = profile;
            back();
            this.refresh();
            if (profile.name) say(`Hallo, ${profile.name}!`);
          },
          back
        ),
      back
    );
  }

  // ---------- Antippen ----------

  onTap({ x, y }) {
    if (this.cancelLockHold() || this.isOnLock(x, y)) return;
    if (Phaser.Math.Distance.Between(x, y, this.closeButton.x, this.closeButton.y) <= CLOSE_RADIUS + 16) {
      this.close();
      return;
    }
    for (const row of this.rows) {
      if (Math.abs(x - row.tag.x) <= (LABEL_WIDTH / 2) * this.fit && Math.abs(y - row.tag.y) <= SWATCH_RADIUS * this.fit) {
        this.tweens.add({ targets: row.tag, scale: this.fit * 1.15, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
        say(row.hint);
        return;
      }
      const button = row.buttons.find(
        (b) => Phaser.Math.Distance.Between(x, y, b.x, b.y) <= (SWATCH_RADIUS + SWATCH_GAP / 2) * this.fit
      );
      if (button) {
        this.figure[row.key] = button.index;
        this.tweens.add({ targets: button, scale: this.fit * 1.15, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: this.preview, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => this.preview.setAngle(0) });
        say(row.say(row.options[button.index]));
        this.refresh();
        return;
      }
    }
  }

  close() {
    say('So sehe ich jetzt aus. Toll!');
    this.onDone?.({ ...this.figure }, { ...this.profile });
    this.scene.resume('WorldScene');
    this.scene.stop();
  }
}
