// Die Tiere und was sie brauchen, damit sie einziehen.
// needs: Dinge aus der Bau-Leiste, die auf der Wiese stehen müssen.
//        wish wird vorgelesen, solange das Ding noch fehlt.
// fact:  wird vorgelesen, wenn man ein eingezogenes Tier antippt.
// petted: sagt das Tier, wenn man es streichelt.
// eats:  Futter aus dem Futterkorb, das dem Tier schmeckt (das erste ist das liebste).
// yummy: sagt das Tier, wenn es etwas Leckeres bekommt.
// name, album: Name und Steckbrief für das Tier-Album (wird vorgelesen).
// Futter wie Insekten, Würmer oder Samen gibt es auf der Wiese von selbst.

export const ANIMALS = [
  {
    type: 'igel',
    name: 'Igel',
    album: [
      'Das ist der Igel.',
      'Ich fresse Käfer, Regenwürmer und Schnecken.',
      'Ich wohne unter Büschen, in Hecken und in Laubhaufen.',
      'Ich habe ungefähr siebentausend Stacheln. Im Winter halte ich Winterschlaf.',
    ],
    hello: 'Hallo, ich bin der Igel!',
    needs: [
      { type: 'laubhaufen', wish: 'Ich hätte so gern einen Laubhaufen zum Verstecken!' },
      { type: 'busch', wish: 'Ich hätte so gern einen Busch. Darunter kann ich mein Nest bauen!' },
    ],
    fact: 'Ich bin der Igel. Am Tag schlafe ich. In der Nacht suche ich Käfer, Würmer und Schnecken.',
    petted: 'Hihi, das kitzelt! Aber schön vorsichtig, ich habe Stacheln.',
    eats: ['kaefer', 'wurm'],
    yummy: 'Mmh, lecker! Igel fressen gern Käfer und Würmer.',
  },
  {
    type: 'ente',
    name: 'Stockente',
    album: [
      'Das ist die Stockente.',
      'Ich fresse Wasserpflanzen, Samen und kleine Tiere.',
      'Ich wohne an Teichen, Seen und Flüssen.',
      'Ich fette meine Federn ein. Darum werden sie im Wasser nicht nass.',
    ],
    swimTexture: 'ente-schwimmt', // so sieht die Ente im Wasser aus
    hello: 'Hallo, ich bin die Ente!',
    needs: [
      { type: 'teich', wish: 'Ich hätte so gern einen Teich zum Schwimmen!' },
      { type: 'schilf', wish: 'Ich hätte so gern Schilf. Da kann ich mich verstecken!' },
    ],
    fact: 'Ich bin die Ente. Ich stecke meinen Kopf unter Wasser und suche Pflanzen und kleine Tiere.',
    petted: 'Quak! Das ist schön!',
    eats: ['wasserpflanze', 'koerner', 'wurm', 'kaefer'],
    yummy: 'Quak, lecker! Enten fressen Wasserpflanzen, Körner und kleine Tiere.',
  },
  {
    type: 'eichhoernchen',
    name: 'Eichhörnchen',
    album: [
      'Das ist das Eichhörnchen.',
      'Ich fresse Nüsse, Samen, Knospen und Pilze.',
      'Ich wohne oben in den Bäumen, in einem runden Nest. Das heißt Kobel.',
      'Mein buschiger Schwanz hilft mir beim Springen, das Gleichgewicht zu halten.',
    ],
    hello: 'Hallo, ich bin das Eichhörnchen!',
    needs: [
      { type: 'baum', wish: 'Ich hätte so gern einen großen Baum zum Klettern!' },
      { type: 'nussbaum', wish: 'Ich hätte so gern einen Nussbaum. Ich esse so gern Nüsse!' },
    ],
    fact: 'Ich bin das Eichhörnchen. Im Herbst verstecke ich Nüsse. Die esse ich dann im Winter.',
    petted: 'Oh, wie schön! Fühl mal, mein Schwanz ist ganz flauschig.',
    eats: ['nuss', 'koerner'],
    yummy: 'Mmh, lecker! Eichhörnchen knabbern gern Nüsse und Samen.',
  },
];
