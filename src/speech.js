// Sprachausgabe über die Web Speech API mit deutscher iPad-Stimme.
// Wenn keine Sprachausgabe verfügbar ist, passiert einfach nichts.

const synth = window.speechSynthesis;
let germanVoice = null;

function findGermanVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  germanVoice =
    voices.find((v) => v.lang === 'de-DE') ||
    voices.find((v) => v.lang && v.lang.startsWith('de')) ||
    null;
}

if (synth) {
  findGermanVoice();
  // Safari lädt die Stimmen manchmal erst später
  synth.addEventListener?.('voiceschanged', findGermanVoice);
}

// onDone (optional): wird aufgerufen, wenn der Satz zu Ende gesprochen ist.
// Ohne Sprachausgabe oder wenn sie hängt, nach einer geschätzten Sprechzeit.
export function say(text, onDone) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };
  if (onDone) setTimeout(finish, 1500 + text.length * 80);
  if (!synth) return;
  // Was gerade gesprochen wird, abbrechen, damit sich nichts überlagert
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  if (germanVoice) utterance.voice = germanVoice;
  utterance.rate = 0.95;
  utterance.pitch = 1.1;
  utterance.onend = finish;
  synth.speak(utterance);
}
