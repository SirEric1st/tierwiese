// Sprachausgabe: Am liebsten mit fertigen Aufnahmen (assets/sprache/, erzeugt
// mit tools/sprache.py). Für Sätze ohne Aufnahme spricht die iPad-Stimme
// (Web Speech API). Ohne beides passiert einfach nichts.
//
// Welche Aufnahmen es gibt, steht in assets/sprache/liste.js (window.SPRACHE).
// Jede Aufnahme heißt wie die Prüfsumme ihres Satzes (clipName), so findet
// das Spiel sie ohne weitere Liste.
//
// Die iPad-Stimme: Das Spiel nimmt die beste installierte deutsche Stimme.
// Im Eltern-Bereich kann man auch selbst eine auswählen; das gilt für das ganze Gerät.
import { audioContext } from './sound.js';

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

// Name für die Auswahl im Eltern-Bereich. Safari nennt mehrere Varianten
// gleich (z. B. zweimal „Anna“), deshalb kommt die Variante dazu.
export function voiceLabel(voice) {
  const variant = ['Roboter', 'einfach', 'normal', 'erweitert', 'Premium'][quality(voice)];
  return `${voice.name} – ${variant}`;
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

// ---------- Aufnahmen ----------

const CLIPS = new Set(window.SPRACHE || []);
const buffers = new Map(); // schon geladene Aufnahmen (zuletzt benutzte zuerst behalten)
const MAX_BUFFERS = 40;
let source = null; // die Aufnahme, die gerade läuft
let speaking = 0; // zählt hoch, damit ein neuer Satz alte Rückrufe ungültig macht

// Prüfsumme eines Satzes (FNV-1a, 8 Hex-Zeichen) – genauso in tools/sprache.py
export function clipName(text) {
  let hash = 0x811c9dc5;
  new TextEncoder().encode(text.trim()).forEach((byte) => {
    hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  });
  return hash.toString(16).padStart(8, '0');
}

async function loadClip(name) {
  if (buffers.has(name)) {
    const buffer = buffers.get(name);
    buffers.delete(name);
    buffers.set(name, buffer);
    return buffer;
  }
  const response = await fetch(`assets/sprache/${name}.mp3`);
  if (!response.ok) throw new Error(`Aufnahme fehlt: ${name}`);
  const data = await response.arrayBuffer();
  const buffer = await new Promise((resolve, reject) => audioContext().decodeAudioData(data, resolve, reject));
  buffers.set(name, buffer);
  if (buffers.size > MAX_BUFFERS) buffers.delete(buffers.keys().next().value);
  return buffer;
}

// Spielt eine Aufnahme; das Versprechen ist erfüllt, wenn sie zu Ende ist
async function playClip(name, id) {
  const buffer = await loadClip(name);
  if (id !== speaking) return;
  const context = audioContext();
  await new Promise((resolve) => {
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = resolve;
    source.start();
  });
}

function stopAll() {
  if (source) {
    source.onended = null;
    try {
      source.stop();
    } catch (error) {
      // war schon zu Ende
    }
    source = null;
  }
  synth?.cancel();
}

// ---------- iPad-Stimme ----------

function speakWithVoice(text, voiceURI) {
  return new Promise((resolve) => {
    if (!synth) {
      resolve();
      return;
    }
    if (!germanVoice) findGermanVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    const voice = (voiceURI && germanVoices().find((v) => v.voiceURI === voiceURI)) || germanVoice;
    if (voice) utterance.voice = voice;
    // Die einfache Stimme klingt etwas höher und langsamer freundlicher; die besseren so, wie sie sind
    const simple = !voice || quality(voice) <= 2;
    utterance.rate = simple ? 0.95 : 1;
    utterance.pitch = simple ? 1.1 : 1;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    synth.speak(utterance);
  });
}

// ---------- Sprechen ----------

// text: ein Satz oder eine Liste von Sätzen (werden nacheinander gesprochen).
//       Leerer Text: verstummen.
// onDone (optional): wird aufgerufen, wenn alles gesagt ist. Hängt die
//       Sprachausgabe, nach einer geschätzten Sprechzeit.
// voiceURI (optional): mit dieser iPad-Stimme sprechen (zum Probehören)
export function say(text, onDone, voiceURI) {
  const parts = (Array.isArray(text) ? text : [text]).map((part) => part.trim()).filter(Boolean);
  const id = ++speaking;
  stopAll();

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };
  if (onDone) setTimeout(finish, 3000 + parts.join(' ').length * 90);

  (async () => {
    for (const part of parts) {
      if (id !== speaking) return;
      const name = clipName(part);
      try {
        if (voiceURI || !CLIPS.has(name) || !audioContext()) throw new Error('keine Aufnahme');
        await playClip(name, id);
      } catch (error) {
        if (id !== speaking) return;
        await speakWithVoice(part, voiceURI);
      }
    }
    if (id === speaking) finish();
  })();
}
