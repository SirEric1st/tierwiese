// Das Tier-Album: eine Seite über der Wiese. Für jedes Tier, das schon
// einmal eingezogen ist, gibt es ein Bild mit Steckbrief zum Vorlesen.
// Noch nicht entdeckte Tiere erscheinen als dunkler Schatten.
// Passen nicht alle Karten auf eine Seite, blättert man mit den Pfeilen.
// Die WorldScene ist so lange angehalten.
import { DPR, screenSize, setupCamera, toScreen, uiOrigin } from '../display.js';
import { ANIMALS } from '../animals.js';
import { say } from '../speech.js';

const CARD_WIDTH = 170;
const CARD_HEIGHT = 180;
const CARD_GAP = 16;
const PICTURE_SIZE = 115; // so groß sind die Tiere auf den Karten (höchstens)
const CLOSE_RADIUS = 40;
const ARROW_RADIUS = 34; // Blätter-Pfeile links und rechts
const ARROW_SPACE = 80; // so viel Platz brauchen die Pfeile am Rand
const INFO_SPACE = 190; // Platz unter den Karten für den Steckbrief
const MAX_COLUMNS = 5;
const FONT = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

export class AlbumScene extends Phaser.Scene {
  constructor() {
    super('AlbumScene');
  }

  // data.discovered: Namen der Tiere, die schon einmal eingezogen sind
  init(data) {
    this.discovered = new Set(data.discovered);
  }

  create() {
    setupCamera(this);
    this.ui = this.add.container(0, 0);

    this.dim = this.add.rectangle(0, 0, 10, 10, 0x1d3b14, 0.55).setOrigin(0);
    this.panel = this.add.graphics();
    this.title = this.text('Mein Tier-Album', 34);
    this.info = this.text('', 22).setOrigin(0.5, 0).setWordWrapWidth(600).setAlign('center');
    this.ui.add([this.dim, this.panel, this.title, this.info]);

    this.cards = ANIMALS.map((def) => this.createCard(def));
    this.closeButton = this.createCloseButton();
    this.prevButton = this.createArrow(-1);
    this.nextButton = this.createArrow(1);
    this.ui.add([this.closeButton, this.prevButton, this.nextButton]);
    this.page = 0;

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    this.input.on('pointerup', (pointer) => this.onTap(toScreen(pointer)));

    const count = this.discovered.size;
    say(
      count === 0
        ? 'Dein Tier-Album. Es ist noch leer. Wenn ein Tier bei dir einzieht, kommt es hier hinein.'
        : 'Dein Tier-Album! Tipp auf ein Tier, dann erzähle ich dir etwas darüber.'
    );
  }

  text(content, size) {
    const style = { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: '#4a3417', resolution: DPR };
    return this.add.text(0, 0, content, style).setOrigin(0.5);
  }

  createCard(def) {
    const found = this.discovered.has(def.type);
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.12);
    background.fillRoundedRect(-CARD_WIDTH / 2 + 4, -CARD_HEIGHT / 2 + 6, CARD_WIDTH, CARD_HEIGHT, 24);
    background.fillStyle(found ? 0xffffff : 0xe8e0cf);
    background.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 24);

    const picture = this.add.image(0, 40, found ? def.type : this.silhouette(def.type)).setOrigin(0.5, 1);
    picture.setScale(PICTURE_SIZE / Math.max(picture.width, picture.height));
    const label = this.text(found ? def.name : '?', found ? 20 : 34).setPosition(0, 64);

    const card = this.add.container(0, 0, [background, picture, label]);
    card.def = def;
    card.found = found;
    this.ui.add(card);
    return card;
  }

  // Ein dunkler Umriss des Tieres – so sieht man, dass hier noch jemand fehlt
  silhouette(key) {
    const shadowKey = `${key}-umriss`;
    if (this.textures.exists(shadowKey)) return shadowKey;
    const source = this.textures.get(key).getSourceImage();
    const canvas = this.textures.createCanvas(shadowKey, source.width, source.height);
    const ctx = canvas.getContext();
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#6b6152';
    ctx.fillRect(0, 0, source.width, source.height);
    canvas.refresh();
    return shadowKey;
  }

  createCloseButton() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(0, 4, CLOSE_RADIUS);
    g.fillStyle(0xff7a59);
    g.fillCircle(0, 0, CLOSE_RADIUS);
    g.lineStyle(8, 0xffffff);
    g.lineBetween(-14, -14, 14, 14);
    g.lineBetween(14, -14, -14, 14);
    return this.add.container(0, 0, [g]);
  }

  createArrow(direction) {
    const g = this.add.graphics();
    g.fillStyle(0xeadfc6);
    g.fillCircle(0, 0, ARROW_RADIUS);
    g.fillStyle(0x7a5a2a);
    g.fillTriangle(direction * 16, 0, -direction * 9, -18, -direction * 9, 18);
    const arrow = this.add.container(0, 0, [g]);
    arrow.direction = direction;
    return arrow;
  }

  layout() {
    const { width, height } = screenSize(this);
    const origin = uiOrigin(this);
    this.ui.setPosition(origin.x, origin.y);
    this.dim.setSize(width, height);

    // Raster: so viele Spalten und Reihen, wie auf den Bildschirm passen
    const panelWidth = width - 32;
    const panelHeight = height - 32;
    const cell = CARD_WIDTH + CARD_GAP;
    const columns = Phaser.Math.Clamp(Math.floor((panelWidth - 2 * ARROW_SPACE) / cell), 1, MAX_COLUMNS);
    const rows = Phaser.Math.Clamp(Math.floor((panelHeight - 100 - INFO_SPACE) / (CARD_HEIGHT + CARD_GAP)), 1, 4);
    const perPage = columns * rows;
    const pages = Math.ceil(this.cards.length / perPage);
    this.pages = pages;
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const cardScale = Math.min(1, (panelWidth - 2 * ARROW_SPACE) / (columns * cell));
    const panelLeft = (width - panelWidth) / 2;
    const panelTop = (height - panelHeight) / 2;

    this.panel.clear();
    this.panel.fillStyle(0xfff6e0);
    this.panel.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 36);
    this.panel.lineStyle(4, 0xd9b77a);
    this.panel.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 36);

    this.title.setPosition(width / 2, panelTop + 48);
    const gridTop = panelTop + 90;
    const rowHeight = (CARD_HEIGHT + CARD_GAP) * cardScale;
    this.cards.forEach((card, i) => {
      const onPage = Math.floor(i / perPage) === this.page;
      card.setVisible(onPage);
      if (!onPage) return;
      const index = i % perPage;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = width / 2 + (column - (columns - 1) / 2) * cell * cardScale;
      card.setPosition(x, gridTop + row * rowHeight + (CARD_HEIGHT * cardScale) / 2).setScale(cardScale);
      card.baseScale = cardScale;
    });
    const gridBottom = gridTop + rows * rowHeight;
    const arrowY = gridTop + (rows * rowHeight) / 2;
    this.prevButton.setPosition(panelLeft + ARROW_SPACE / 2, arrowY).setVisible(pages > 1);
    this.nextButton.setPosition(panelLeft + panelWidth - ARROW_SPACE / 2, arrowY).setVisible(pages > 1);
    this.info.setWordWrapWidth(panelWidth - 60).setPosition(width / 2, gridBottom + 12);
    this.closeButton.setPosition(panelLeft + panelWidth - 30, panelTop + 30);
  }

  onTap({ x, y }) {
    if (Phaser.Math.Distance.Between(x, y, this.closeButton.x, this.closeButton.y) <= CLOSE_RADIUS + 16) {
      this.close();
      return;
    }
    const arrow = [this.prevButton, this.nextButton].find(
      (a) => a.visible && Phaser.Math.Distance.Between(x, y, a.x, a.y) <= ARROW_RADIUS + 12
    );
    if (arrow) {
      // Nach der letzten Seite kommt wieder die erste
      this.page = (this.page + arrow.direction + this.pages) % this.pages;
      this.info.setText('');
      this.layout();
      return;
    }
    const card = this.cards.find(
      (c) =>
        c.visible &&
        Math.abs(x - c.x) <= (CARD_WIDTH * c.baseScale) / 2 && Math.abs(y - c.y) <= (CARD_HEIGHT * c.baseScale) / 2
    );
    if (card) this.showCard(card);
  }

  showCard(card) {
    this.tweens.add({ targets: card, scale: card.baseScale * 1.08, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    if (!card.found) {
      this.info.setText('Dieses Tier hast du noch nicht entdeckt.');
      say('Dieses Tier hast du noch nicht entdeckt. Vielleicht kommt es bald zu Besuch!');
      return;
    }
    this.info.setText(card.def.album.join('\n'));
    say(card.def.album.join(' '));
  }

  close() {
    say('');
    this.scene.resume('WorldScene');
    this.scene.stop();
  }
}
