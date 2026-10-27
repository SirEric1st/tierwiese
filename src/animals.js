// Die Tiere und was sie brauchen, damit sie einziehen.
// needs: Dinge aus der Bau-Leiste, die auf der Wiese stehen müssen.
//        wish wird vorgelesen, solange das Ding noch fehlt.
// fact:  wird vorgelesen, wenn man ein eingezogenes Tier antippt.
// petted: sagt das Tier, wenn man es streichelt.
// eats:  Futter aus dem Futterkorb, das dem Tier schmeckt (das erste ist das liebste).
// yummy: sagt das Tier, wenn es etwas Leckeres bekommt.
// name, album: Name und Steckbrief für das Tier-Album (wird vorgelesen).
// shore: am Teich sitzt das Tier am Ufer statt zu schwimmen.
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
    petted: 'Oh, das ist schön! Da schnattere ich vor Freude.',
    eats: ['wasserpflanze', 'koerner', 'wurm', 'kaefer'],
    yummy: 'Mmh, lecker! Enten fressen Wasserpflanzen, Körner und kleine Tiere.',
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
  {
    type: 'frosch',
    name: 'Teichfrosch',
    album: [
      'Das ist der Teichfrosch.',
      'Ich fresse Insekten, Würmer und kleine Schnecken.',
      'Ich wohne an Teichen und verstecke mich gern zwischen Steinen.',
      'Aus meinen Eiern schlüpfen Kaulquappen. Die leben im Wasser, bis sie kleine Frösche sind.',
    ],
    shore: true, // sitzt am Teich lieber am Ufer als im Wasser
    hello: 'Hallo, ich bin der Frosch!',
    needs: [
      { type: 'teich', wish: 'Ich hätte so gern einen Teich. Dort lege ich meine Eier!' },
      { type: 'steine', wish: 'Ich hätte so gern einen Steinhaufen. Da verstecke ich mich, wenn es heiß ist!' },
    ],
    fact: 'Ich bin der Frosch. Ich fange Insekten mit meiner langen, klebrigen Zunge.',
    petted: 'Hihi! Meine Haut ist ganz glatt und ein bisschen feucht.',
    eats: ['kaefer', 'wurm'],
    yummy: 'Mmh, lecker! Frösche fressen Insekten, Würmer und Schnecken.',
  },
];
