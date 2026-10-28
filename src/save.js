// Spielstände speichern und laden – nur lokal auf diesem Gerät (localStorage).
// Jedes Kind hat seinen eigenen Spielstand. Eine Liste merkt sich, welche es
// gibt und wann sie angelegt wurden; jeder Spielstand liegt unter eigenem Namen.
// Klappt das Speichern nicht (z. B. privates Surfen), läuft das Spiel
// trotzdem weiter, es merkt sich dann nur nichts.

const LIST_KEY = 'tierwiese-spielstaende';
const SAVE_PREFIX = 'tierwiese-spielstand-';
const OLD_KEY = 'tierwiese-spielstand'; // so hieß der einzige Spielstand früher
const VERSION = 1;
export const MAX_SAVES = 6;

let currentId = null; // welcher Spielstand gerade gespielt wird

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    console.warn('Konnte nicht gelesen werden:', key, error);
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Konnte nicht gespeichert werden:', key, error);
    return false;
  }
}

// Liste der Spielstände: [{ id, created }] (created = Zeitpunkt des ersten Spiels)
function readList() {
  const list = read(LIST_KEY);
  if (Array.isArray(list)) return list.filter((entry) => entry && typeof entry.id === 'string');
  // Erster Start mit mehreren Spielständen: den alten Spielstand übernehmen
  const old = read(OLD_KEY);
  if (old?.version === VERSION) {
    const entry = { id: String(Date.now()), created: Date.now() };
    if (write(SAVE_PREFIX + entry.id, old) && write(LIST_KEY, [entry])) return [entry];
  }
  return [];
}

// Alle Spielstände mit dem, was der Startbildschirm zeigt (Figur, Name, Foto)
export function listSaves() {
  return readList().map((entry) => {
    const data = read(SAVE_PREFIX + entry.id);
    return { ...entry, figure: data?.figure, profile: data?.profile };
  });
}

// Neuen, leeren Spielstand anlegen und gleich auswählen
export function createSave() {
  const list = readList();
  const entry = { id: String(Date.now()), created: Date.now() };
  write(LIST_KEY, [...list, entry]);
  currentId = entry.id;
  return entry.id;
}

export function deleteSave(id) {
  write(LIST_KEY, readList().filter((entry) => entry.id !== id));
  try {
    localStorage.removeItem(SAVE_PREFIX + id);
  } catch (error) {
    console.warn('Spielstand konnte nicht gelöscht werden', error);
  }
  if (currentId === id) currentId = null;
}

export function chooseSave(id) {
  currentId = id;
}

export function loadGame() {
  if (!currentId) return null;
  const data = read(SAVE_PREFIX + currentId);
  return data?.version === VERSION ? data : null;
}

export function saveGame(data) {
  if (!currentId) return;
  write(SAVE_PREFIX + currentId, { version: VERSION, ...data });
}

// Bittet den Browser, die gespeicherten Daten nicht von selbst zu löschen
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {});
}
