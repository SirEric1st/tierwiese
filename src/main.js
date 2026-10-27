// Einstiegspunkt: richtet Phaser ein und startet mit dem Startbildschirm.
import { DPR } from './display.js';
import { AlbumScene } from './scenes/AlbumScene.js';
import { StartScene } from './scenes/StartScene.js';
import { WorldScene } from './scenes/WorldScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'spiel',
  backgroundColor: '#86c96f',
  scale: {
    // Zeichenfläche in voller Retina-Auflösung, angezeigt in normaler Größe
    mode: Phaser.Scale.NONE,
    width: window.innerWidth * DPR,
    height: window.innerHeight * DPR,
    zoom: 1 / DPR,
  },
  input: {
    activePointers: 1,
  },
  scene: [StartScene, WorldScene, AlbumScene],
});

// Das Spielfeld füllt immer den ganzen Bildschirm, auch beim Drehen des iPads
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth * DPR, window.innerHeight * DPR);
});

// Offline-Modus einschalten (klappt nur über https, z. B. GitHub Pages)
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch((error) => {
    console.warn('Offline-Modus nicht verfügbar', error);
  });
}
