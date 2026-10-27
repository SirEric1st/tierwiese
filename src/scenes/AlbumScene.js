// Das Tier-Album: eine Seite über der Wiese. Für jedes Tier, das schon
// einmal eingezogen ist, gibt es ein Bild mit Steckbrief zum Vorlesen.
// Noch nicht entdeckte Tiere erscheinen als dunkler Schatten.
// Die WorldScene ist so lange angehalten.
import { DPR, screenSize, setupCamera, toScreen, uiOrigin } from '../display.js';
import { ANIMALS } from '../animals.js';
import { say } from '../speech.js';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 230;
const CARD_GAP = 24;
const PICTURE_SIZE = 150; // so groß sind die Tiere auf den Karten (höchstens)
const CLOSE_RADIUS = 40;
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
    this.ui.add(this.closeButton);

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
    const label = this.text(found ? def.name : '?', found ? 26 : 40).setPosition(0, 80);

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

  layout() {
    const { width, height } = screenSize(this);
    const origin = uiOrigin(this);
    this.ui.setPosition(origin.x, origin.y);
    this.dim.setSize(width, height);

    // Karten nebeneinander; wenn der Platz nicht reicht, etwas kleiner
    const rowWidth = this.cards.length * CARD_WIDTH + (this.cards.length - 1) * CARD_GAP;
    const panelWidth = Math.min(width - 32, rowWidth + 80);
    const cardScale = Math.min(1, (panelWidth - 40) / rowWidth);
    const panelHeight = Math.min(height - 32, 560);
    const panelLeft = (width - panelWidth) / 2;
    const panelTop = (height - panelHeight) / 2;

    this.panel.clear();
    this.panel.fillStyle(0xfff6e0);
    this.panel.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 36);
    this.panel.lineStyle(4, 0xd9b77a);
    this.panel.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 36);

    this.title.setPosition(width / 2, panelTop + 48);
    const cardY = panelTop + 90 + (CARD_HEIGHT * cardScale) / 2;
    this.cards.forEach((card, i) => {
      const x = width / 2 + (i - (this.cards.length - 1) / 2) * (CARD_WIDTH + CARD_GAP) * cardScale;
      card.setPosition(x, cardY).setScale(cardScale);
      card.baseScale = cardScale;
    });
    this.info.setWordWrapWidth(panelWidth - 60).setPosition(width / 2, cardY + (CARD_HEIGHT * cardScale) / 2 + 24);
    this.closeButton.setPosition(panelLeft + panelWidth - 30, panelTop + 30);
  }

  onTap({ x, y }) {
    if (Phaser.Math.Distance.Between(x, y, this.closeButton.x, this.closeButton.y) <= CLOSE_RADIUS + 16) {
      this.close();
      return;
    }
    const card = this.cards.find(
      (c) =>
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
