// Einstiegspunkt: richtet Phaser ein und startet mit dem Startbildschirm.
import { StartScene } from './scenes/StartScene.js';
import { WorldScene } from './scenes/WorldScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'spiel',
  backgroundColor: '#7cc66b',
  scale: {
    // Das Spielfeld füllt immer den ganzen Bildschirm, auch beim Drehen des iPads
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    activePointers: 1,
  },
  scene: [StartScene, WorldScene],
});

// Offline-Modus einschalten (klappt nur über https, z. B. GitHub Pages)
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch((error) => {
    console.warn('Offline-Modus nicht verfügbar', error);
  });
}
