// Wie die Wiese in den vier Jahreszeiten aussieht:
// Frühling: alles grün, rosa Blütenblätter fliegen umher
// Sommer:   warmes, sattes Licht
// Herbst:   das Gras wird gelblich, Bäume und Büsche färben sich, Blätter fallen
// Winter:   Schnee liegt auf der Wiese, Blumen sind weg, es schneit
// Was die Tiere im Winter machen, regelt der AnimalManager.
import { screenSize, uiOrigin, uiScale } from './display.js';

export const SEASONS = ['fruehling', 'sommer', 'herbst', 'winter'];

// Färbung (wird mit den Bildfarben multipliziert, Weiß = unverändert)
const GRASS_TINT = { fruehling: 0xffffff, sommer: 0xfff3c8, herbst: 0xf2d28a, winter: 0xffffff };
const PLANT_TINT = { herbst: 0xffb268, winter: 0xe4eef8 }; // Winter: leicht bläulich
const FROST_TINT = 0xe8f0f8; // alles andere im Winter
const PLANTS = ['baum', 'nussbaum', 'obstbaum', 'busch', 'hecke', 'schilf', 'blumen'];
const SNOW_ALPHA = 0.72;
const DEPTH_SNOW_COVER = 0.5; // über dem Gras, unter Blumen und Dingen
const DEPTH_FALLING = 59500; // über der Nacht, unter der Leiste
const CHANGE_TIME = 1500;

export class SeasonView {
  // grass: das Gras-Bild; flowers: die Deko-Blumen; world: { width, height }
  constructor(scene, grass, flowers, world) {
    this.scene = scene;
    this.grass = grass;
    this.flowers = flowers;
    this.snowCover = scene.add
      .rectangle(0, 0, world.width, world.height, 0xf6faff)
      .setOrigin(0)
      .setDepth(DEPTH_SNOW_COVER)
      .setAlpha(0);
    this.emitters = {
      schnee: this.createEmitter('schneeflocke', { speedY: { min: 40, max: 90 }, speedX: { min: -25, max: 25 }, scale: { min: 0.6, max: 1.2 }, frequency: 110 }),
      laub: this.createEmitter('blatt', { speedY: { min: 50, max: 100 }, speedX: { min: -50, max: 30 }, rotate: { start: 0, end: 720 }, frame: [0, 1, 2], frequency: 500 }),
      blueten: this.createEmitter('blatt', { speedY: { min: 30, max: 60 }, speedX: { min: -40, max: 40 }, rotate: { start: 0, end: 360 }, frame: [3], scale: { min: 0.4, max: 0.7 }, frequency: 700 }),
    };
    this.season = null;
    this.layout();
  }

  // Ein Bereich über dem Bildschirm, aus dem es herabrieselt. Er bewegt sich nicht
  // mit der Wiese mit und bleibt beim Zoomen gleich groß (wie die Leiste).
  createEmitter(texture, config) {
    const emitter = this.scene.add.particles(0, 0, texture, {
      x: { min: 0, max: 100 },
      y: -20,
      lifespan: 10000,
      emitting: false,
      ...config,
    });
    return emitter.setScrollFactor(0).setDepth(DEPTH_FALLING);
  }

  layout() {
    const { width, height } = screenSize(this.scene);
    const origin = uiOrigin(this.scene);
    const scale = uiScale(this.scene);
    Object.values(this.emitters).forEach((emitter) => {
      emitter.setPosition(origin.x, origin.y).setScale(scale);
      emitter.updateConfig({ x: { min: -40, max: width + 40 }, lifespan: (height / 40) * 1000 });
    });
  }

  // animate: sanft überblenden (beim Umschalten) statt sofort (beim Laden)
  apply(season, animate) {
    this.season = season;
    const time = animate ? CHANGE_TIME : 0;
    this.grass.setTint(GRASS_TINT[season]);
    this.fade(this.snowCover, season === 'winter' ? SNOW_ALPHA : 0, time);
    this.flowers.forEach((flower, i) => {
      const visible = season === 'fruehling' || season === 'sommer' || (season === 'herbst' && i % 3 === 0);
      this.fade(flower, visible ? 1 : 0, time);
    });
    this.scene.placed.forEach((item) => this.tintItem(item));
    const falling = { fruehling: 'blueten', herbst: 'laub', winter: 'schnee' }[season];
    Object.entries(this.emitters).forEach(([name, emitter]) => {
      if (name === falling) emitter.start();
      else emitter.stop();
    });
  }

  // Auch neu gebaute Dinge bekommen die Farbe der Jahreszeit
  tintItem(item) {
    const season = this.season;
    let tint = 0xffffff;
    if (PLANTS.includes(item.element.type) && PLANT_TINT[season]) tint = PLANT_TINT[season];
    else if (season === 'winter') tint = FROST_TINT;
    item.setTint(tint);
    this.setFrost(item, season === 'winter' && PLANTS.includes(item.element.type));
  }

  // Raureif: Pflanzen werden im Winter blasser und heller. Ein Farbfilter
  // kann aufhellen, die normale Einfärbung nur abdunkeln.
  setFrost(item, on) {
    if (!item.preFX) return; // ohne WebGL gibt es keine Filter
    if (on && !item.frost) {
      item.frost = item.preFX.addColorMatrix();
      item.frost.saturate(-0.55);
      item.frost.brightness(1.35, true);
    } else if (!on && item.frost) {
      item.preFX.remove(item.frost);
      item.frost = null;
    }
  }

  fade(target, alpha, time) {
    this.scene.tweens.killTweensOf(target);
    if (time === 0) target.setAlpha(alpha);
    else this.scene.tweens.add({ targets: target, alpha, duration: time });
  }
}
