// Das Tier-Album: eine Seite über der Wiese. Für jedes Tier, das schon
// einmal eingezogen ist, gibt es ein Bild mit Steckbrief zum Vorlesen.
// Noch nicht entdeckte Tiere erscheinen als dunkler Schatten.
// Passen nicht alle Karten auf eine Seite, blättert man mit den Pfeilen
// oder wischt über die Karten. Der Steckbrief steht in einem Textfeld,
// das man mit dem Finger nach oben und unten schieben kann.
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
const SWIPE_DISTANCE = 50; // so weit über die Karten wischen, um zu blättern
const MOVE_THRESHOLD = 8; // ab so viel Bewegung ist es kein Antippen mehr
const TEXT_PADDING = 14;
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
    // Textfeld für den Steckbrief: Was nicht hineinpasst, wird ausgeblendet
    this.infoBox = this.add.graphics();
    this.info = this.text('', 22).setOrigin(0.5, 0).setWordWrapWidth(600).setAlign('center');
    this.infoMask = this.make.graphics({ add: false });
    this.info.setMask(this.infoMask.createGeometryMask());
    this.scrollBar = this.add.graphics();
    this.infoScroll = 0;
    this.ui.add([this.dim, this.panel, this.title, this.infoBox, this.info, this.scrollBar]);

    this.cards = ANIMALS.map((def) => this.createCard(def));
    this.closeButton = this.createCloseButton();
    this.prevButton = this.createArrow(-1);
    this.nextButton = this.createArrow(1);
    this.ui.add([this.closeButton, this.prevButton, this.nextButton]);
    this.page = 0;

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    this.input.on('pointerdown', (pointer) => this.onPress(toScreen(pointer)));
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) this.onMove(toScreen(pointer));
    });
    this.input.on('pointerup', (pointer) => {
      const press = this.press;
      this.press = null;
      if (!press?.moved) this.onTap(toScreen(pointer));
    });

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
    this.closeButton.setPosition(panelLeft + panelWidth - 30, panelTop + 30);

    // Textfeld: vom Ende der Karten bis kurz vor den unteren Rand
    const box = {
      left: panelLeft + 24,
      top: gridBottom + 6,
      width: panelWidth - 48,
      height: Math.max(60, panelTop + panelHeight - 20 - (gridBottom + 6)),
    };
    this.infoRect = box;
    this.infoBox.clear().fillStyle(0xffffff, 0.6).fillRoundedRect(box.left, box.top, box.width, box.height, 18);
    this.infoMask.clear().fillStyle(0xffffff).fillRect(origin.x + box.left, origin.y + box.top, box.width, box.height);
    this.info.setWordWrapWidth(box.width - 2 * TEXT_PADDING - 12);
    this.scrollInfo(this.infoScroll);
  }

  // Text im Textfeld verschieben (0 = ganz oben) und die Bildlaufleiste zeichnen
  scrollInfo(scroll) {
    const box = this.infoRect;
    const overflow = Math.max(0, this.info.height + 2 * TEXT_PADDING - box.height);
    this.infoScroll = Phaser.Math.Clamp(scroll, 0, overflow);
    this.info.setPosition(box.left + box.width / 2, box.top + TEXT_PADDING - this.infoScroll);
    this.scrollBar.clear();
    if (overflow === 0) return;
    // Rechts im Feld zeigt ein Balken, wo man gerade ist
    const track = box.height - 16;
    const thumb = Math.max(30, (track * box.height) / (box.height + overflow));
    const y = box.top + 8 + ((track - thumb) * this.infoScroll) / overflow;
    this.scrollBar.fillStyle(0xd9b77a, 0.4).fillRoundedRect(box.left + box.width - 12, box.top + 8, 6, track, 3);
    this.scrollBar.fillStyle(0xb08a4a).fillRoundedRect(box.left + box.width - 12, y, 6, thumb, 3);
  }

  isInInfo(x, y) {
    const box = this.infoRect;
    return x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height;
  }

  onPress({ x, y }) {
    this.press = { x, y, inInfo: this.isInInfo(x, y), scroll: this.infoScroll, moved: false };
  }

  // Im Textfeld: Text schieben. Auf den Karten: waagerecht wischen zum Blättern.
  onMove({ x, y }) {
    const press = this.press;
    if (!press) return;
    const dx = x - press.x;
    const dy = y - press.y;
    if (press.inInfo) {
      if (Math.abs(dy) > MOVE_THRESHOLD) press.moved = true;
      if (press.moved) this.scrollInfo(press.scroll - dy);
    } else if (!press.moved && this.pages > 1 && Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) {
      press.moved = true;
      this.turnPage(dx < 0 ? 1 : -1);
    } else if (Math.hypot(dx, dy) > MOVE_THRESHOLD * 3) {
      press.moved = true;
    }
  }

  // Nach der letzten Seite kommt wieder die erste
  turnPage(direction) {
    this.page = (this.page + direction + this.pages) % this.pages;
    this.setInfo('');
    this.layout();
  }

  setInfo(text) {
    this.info.setText(text);
    this.scrollInfo(0);
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
      this.turnPage(arrow.direction);
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
      this.setInfo('Dieses Tier hast du noch nicht entdeckt.');
      say('Dieses Tier hast du noch nicht entdeckt. Vielleicht kommt es bald zu Besuch!');
      return;
    }
    this.setInfo(card.def.album.join('\n'));
    say(card.def.album.join(' '));
  }

  close() {
    say('');
    this.scene.resume('WorldScene');
    this.scene.stop();
  }
}
