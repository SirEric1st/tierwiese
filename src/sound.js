// Einfache Töne, direkt im Browser erzeugt (keine Sound-Dateien nötig).
// Safari erlaubt Ton erst nach einer Berührung, darum unlockAudio() beim
// Startknopf aufrufen. Ohne Ton-Unterstützung passiert einfach nichts.

let context = null;

export function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!context) context = new AudioContextClass();
  if (context.state === 'suspended') context.resume();
}

// Für die Sprachaufnahmen (speech.js); null, solange noch nicht berührt wurde
export function audioContext() {
  return context;
}

function tone(frequency, start, duration) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  // Sanft ein- und ausblenden, damit es nicht knackt
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain).connect(context.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// Fröhliche aufsteigende Melodie zum Einziehen eines Tieres
export function playCheer() {
  if (!context) return;
  const now = context.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, now + i * 0.12, 0.4));
}

// Zwei sanfte Töne, wenn ein Tier gestreichelt wird
export function playHappy() {
  if (!context) return;
  const now = context.currentTime;
  tone(659, now, 0.3);
  tone(880, now + 0.15, 0.45);
}
