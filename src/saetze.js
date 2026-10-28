// Alle festen Sätze, die das Spiel spricht (außer den Tier-, Ding- und
// Futtertexten in animals.js, elements.js, foods.js und progress.js).
// Sie stehen hier gesammelt, damit tools/saetze.mjs alle Sätze findet und
// tools/sprache.py für jeden eine Aufnahme erzeugen kann.
// Wichtig: keine Namen der Kinder in Aufnahmen – Sätze mit Namen gibt es
// nur ohne Namen. Und keine Tierlaute (die iPad-Stimme ist der Ersatz).

export const SAETZE = {
  // Startbildschirm
  hello: 'Hallo!',
  newGame: 'Ein neues Spiel!',
  helloHint: 'Tipp auf die Wiese, dann laufe ich dorthin.',

  // Tiere
  moveIn: 'Hurra, hier gefällt es mir! Ich ziehe bei dir ein!',
  backAgain: 'Ich bin wieder da!',
  leave: 'Oh, mir fehlt etwas. Ich mache einen kleinen Ausflug. Bis bald!',
  sleepNocturnal: 'Leise, ich schlafe gerade. Ich bin in der Nacht wach.',
  sleepDiurnal: 'Leise, ich schlafe gerade. Ich bin am Tag wach.',

  // Wiese
  modeFood: 'Futter! Zieh es zu einem Tier.',
  modeBuild: 'Bauen! Zieh etwas auf die Wiese.',
  reedToPond: 'Schilf wächst am Wasser. Zieh es an den Teich!',
  reedNoPond: 'Schilf wächst am Wasser. Stell zuerst einen Teich hin!',
  night: 'Gute Nacht! Jetzt werden die Nachttiere wach.',
  morning: 'Guten Morgen! Jetzt werden die Tagtiere wach.',
  goodbye: 'Bis bald!',

  // Album
  albumEmpty: 'Dein Tier-Album. Es ist noch leer. Wenn ein Tier bei dir einzieht, kommt es hier hinein.',
  albumIntro: 'Dein Tier-Album! Tipp auf ein Tier, dann erzähle ich dir etwas darüber.',
  albumUnknown: 'Dieses Tier hast du noch nicht entdeckt. Vielleicht kommt es bald zu Besuch!',

  // Figuren-Baukasten
  figureIntro: 'Wie soll deine Figur aussehen? Tipp auf die Farben!',
  figureDone: 'So sehe ich jetzt aus. Toll!',
  forAdults: 'Das ist für Erwachsene.',
};

export const SEASON_TEXTS = {
  fruehling: 'Jetzt ist Frühling! Die Blumen blühen, und die Tiere wachen aus dem Winterschlaf auf.',
  sommer: 'Jetzt ist Sommer! Es ist schön warm.',
  herbst: 'Jetzt ist Herbst! Die Blätter werden bunt, und manche Tiere sammeln Vorräte.',
  winter: 'Jetzt ist Winter! Es schneit. Manche Tiere verkriechen sich und schlafen, bis es Frühling wird.',
};

// Ein Tier mag das Futter nicht und sagt, was es lieber frisst
export function dislikeText(favorite) {
  return `Hm, das mag ich nicht so. Ich mag lieber ${favorite.plural}!`;
}
