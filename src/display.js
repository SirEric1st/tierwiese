// Gestochen scharfe Darstellung auf dem Retina-Display des iPads.
//
// Das iPad hat doppelt so viele Bildpunkte in jede Richtung, wie Safari
// „Pixel“ meldet. Damit nichts verwaschen aussieht:
// - Die Zeichenfläche hat die volle Auflösung, die Kamera vergrößert um DPR.
// - Grafiken werden DPR-mal so groß geladen und mit IMAGE_SCALE wieder auf
//   ihre normale Größe gebracht.
// Im übrigen Code rechnen wir weiter in „normalen“ Bildschirm-Punkten.

export const DPR = Math.min(Math.round(window.devicePixelRatio || 1), 2) || 1;
export const IMAGE_SCALE = 1 / DPR;

export function setupCamera(scene) {
  scene.cameras.main.setZoom(DPR);
}

// Bildschirmgröße in normalen Punkten
export function screenSize(scene) {
  return { width: scene.scale.width / DPR, height: scene.scale.height / DPR };
}

// Fingerposition auf dem Bildschirm in normalen Punkten
export function toScreen(pointer) {
  return { x: pointer.x / DPR, y: pointer.y / DPR };
}

// Die Kamera vergrößert von der Bildschirmmitte aus. Dinge, die fest am
// Bildschirm kleben (Bau-Leiste, Startknopf), liegen deshalb in einem
// Behälter an dieser Position – dann landen sie genau an der richtigen Stelle.
export function uiOrigin(scene) {
  const { width, height } = scene.scale;
  return { x: (width / 2) * (1 - 1 / DPR), y: (height / 2) * (1 - 1 / DPR) };
}
