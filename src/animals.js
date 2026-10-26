// Die Tiere und was sie brauchen, damit sie einziehen.
// needs: Dinge aus der Bau-Leiste, die auf der Wiese stehen müssen.
//        wish wird vorgelesen, solange das Ding noch fehlt.
// fact:  wird vorgelesen, wenn man ein eingezogenes Tier antippt.
// Futter wie Insekten, Würmer oder Samen gibt es auf der Wiese von selbst.

export const ANIMALS = [
  {
    type: 'igel',
    hello: 'Hallo, ich bin der Igel!',
    needs: [
      { type: 'laubhaufen', wish: 'Ich hätte so gern einen Laubhaufen zum Verstecken!' },
      { type: 'busch', wish: 'Ich hätte so gern einen Busch. Darunter kann ich mein Nest bauen!' },
    ],
    fact: 'Ich bin der Igel. Am Tag schlafe ich. In der Nacht suche ich Käfer, Würmer und Schnecken.',
  },
  {
    type: 'ente',
    swimTexture: 'ente-schwimmt', // so sieht die Ente im Wasser aus
    hello: 'Hallo, ich bin die Ente!',
    needs: [
      { type: 'teich', wish: 'Ich hätte so gern einen Teich zum Schwimmen!' },
      { type: 'schilf', wish: 'Ich hätte so gern Schilf. Da kann ich mich verstecken!' },
    ],
    fact: 'Ich bin die Ente. Ich stecke meinen Kopf unter Wasser und suche Pflanzen und kleine Tiere.',
  },
  {
    type: 'eichhoernchen',
    hello: 'Hallo, ich bin das Eichhörnchen!',
    needs: [
      { type: 'baum', wish: 'Ich hätte so gern einen großen Baum zum Klettern!' },
      { type: 'nussbaum', wish: 'Ich hätte so gern einen Nussbaum. Ich esse so gern Nüsse!' },
    ],
    fact: 'Ich bin das Eichhörnchen. Im Herbst verstecke ich Nüsse. Die esse ich dann im Winter.',
  },
];
