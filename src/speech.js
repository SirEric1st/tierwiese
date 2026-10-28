// Sprachausgabe über die Web Speech API mit deutscher iPad-Stimme.
// Wenn keine Sprachausgabe verfügbar ist, passiert einfach nichts.
//
// Das iPad hat einfache und bessere Stimmen. Die besseren („Erweitert“,
// „Premium“) muss man einmal in den Einstellungen laden:
// Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch.
// Das Spiel nimmt automatisch die beste deutsche Stimme. Im Eltern-Bereich
// kann man auch selbst eine auswählen; das gilt für das ganze Gerät.

const synth = window.speechSynthesis;
const VOICE_KEY = 'tierwiese-stimme';
let germanVoice = null;

// Je höher, desto natürlicher klingt die Stimme (nach den Namen der Apple-Stimmen)
function quality(voice) {
  const id = `${voice.voiceURI} ${voice.name}`.toLowerCase();
  if (id.includes('premium')) return 4;
  if (id.includes('enhanced') || id.includes('erweitert')) return 3;
  if (id.includes('siri')) return 3;
  if (id.includes('eloquence')) return 0; // sehr roboterhaft
  if (id.includes('compact') || id.includes('kompakt')) return 1;
  return 2;
}

export function germanVoices() {
  if (!synth) return [];
  return synth
    .getVoices()
    // Nur Stimmen auf dem Gerät: Online-Stimmen würden den Text an fremde Server schicken
    .filter((voice) => voice.localService !== false && voice.lang && voice.lang.replace('_', '-').startsWith('de'))
    .sort((a, b) => quality(b) - quality(a) || (b.lang === 'de-DE') - (a.lang === 'de-DE'));
}

function savedVoiceURI() {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch (error) {
    return null;
  }
}

function findGermanVoice() {
  const voices = germanVoices();
  const saved = savedVoiceURI();
  germanVoice = voices.find((voice) => voice.voiceURI === saved) || voices[0] || null;
}

// Die im Eltern-Bereich gewählte Stimme ('' = automatisch)
export function voiceChoice() {
  return savedVoiceURI() || '';
}

// Im Eltern-Bereich gewählte Stimme merken (leer = automatisch die beste)
export function setVoice(voiceURI) {
  try {
    if (voiceURI) localStorage.setItem(VOICE_KEY, voiceURI);
    else localStorage.removeItem(VOICE_KEY);
  } catch (error) {
    console.warn('Stimme konnte nicht gespeichert werden', error);
  }
  findGermanVoice();
}

if (synth) {
  findGermanVoice();
  // Safari lädt die Stimmen manchmal erst später
  synth.addEventListener?.('voiceschanged', findGermanVoice);
}

// onDone (optional): wird aufgerufen, wenn der Satz zu Ende gesprochen ist.
// Ohne Sprachausgabe oder wenn sie hängt, nach einer geschätzten Sprechzeit.
// voiceURI (optional): mit dieser Stimme sprechen (zum Probehören)
export function say(text, onDone, voiceURI) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };
  if (onDone) setTimeout(finish, 1500 + text.length * 80);
  if (!synth) return;
  if (!germanVoice) findGermanVoice();
  // Was gerade gesprochen wird, abbrechen, damit sich nichts überlagert
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  const voice = (voiceURI && germanVoices().find((v) => v.voiceURI === voiceURI)) || germanVoice;
  if (voice) utterance.voice = voice;
  // Die einfache Stimme klingt etwas höher und langsamer freundlicher; die besseren so, wie sie sind
  const simple = !voice || quality(voice) <= 2;
  utterance.rate = simple ? 0.95 : 1;
  utterance.pitch = simple ? 1.1 : 1;
  utterance.onend = finish;
  synth.speak(utterance);
}
