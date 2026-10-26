// Spielstand speichern und laden – nur lokal auf diesem Gerät (localStorage).
// Klappt das Speichern nicht (z. B. privates Surfen), läuft das Spiel
// trotzdem weiter, es merkt sich dann nur nichts.

const KEY = 'tierwiese-spielstand';
const VERSION = 1;

export function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data && data.version === VERSION) return data;
  } catch (error) {
    console.warn('Spielstand konnte nicht geladen werden', error);
  }
  return null;
}

export function saveGame(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...data }));
  } catch (error) {
    console.warn('Spielstand konnte nicht gespeichert werden', error);
  }
}

// Bittet den Browser, die gespeicherten Daten nicht von selbst zu löschen
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {});
}
