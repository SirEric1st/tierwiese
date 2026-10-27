// Die Tiere und was sie brauchen, damit sie einziehen.
// needs: Dinge aus der Bau-Leiste, die auf der Wiese stehen müssen.
//        wish wird vorgelesen, solange das Ding noch fehlt.
// fact:  wird vorgelesen, wenn man ein eingezogenes Tier antippt.
// petted: sagt das Tier, wenn man es streichelt.
// eats:  Futter aus dem Futterkorb, das dem Tier schmeckt (das erste ist das liebste).
// yummy: sagt das Tier, wenn es etwas Leckeres bekommt.
// name, album: Name und Steckbrief für das Tier-Album (wird vorgelesen).
// shore: am Teich sitzt das Tier am Ufer statt zu schwimmen.
// flies: das Tier schwebt über dem Boden (Schmetterling, Biene, Fledermaus).
// Wichtig: keine Tierlaute wie „Quak“ in Sprachtexten – die iPad-Stimme
// spricht sie unvorhersehbar aus.
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
  {
    type: 'marienkaefer',
    name: 'Marienkäfer',
    album: [
      'Das ist der Marienkäfer.',
      'Ich fresse Blattläuse. An einem Tag schaffe ich ganz viele davon.',
      'Ich lebe auf Wiesen und in Gärten. Im Winter verstecke ich mich unter Laub.',
      'Meine Punkte zeigen nicht, wie alt ich bin. Ich habe sieben Punkte, mein ganzes Leben lang.',
    ],
    hello: 'Hallo, ich bin der Marienkäfer!',
    needs: [
      { type: 'blumen', wish: 'Ich hätte so gern Blumen. Auf den Pflanzen finde ich Blattläuse!' },
      { type: 'laubhaufen', wish: 'Ich hätte so gern einen Laubhaufen. Darunter schlafe ich im Winter!' },
    ],
    fact: 'Ich bin der Marienkäfer. Wenn ich fliegen will, klappe ich meine roten Flügeldecken auf.',
    petted: 'Hihi, das kitzelt an meinen sechs Beinchen!',
    eats: ['blattlaeuse'],
    yummy: 'Mmh, lecker! Marienkäfer fressen am liebsten Blattläuse.',
  },
  {
    type: 'zitronenfalter',
    name: 'Zitronenfalter',
    album: [
      'Das ist der Zitronenfalter.',
      'Ich trinke süßen Nektar aus Blüten. Dafür habe ich einen langen Rüssel.',
      'Ich fliege über Wiesen und Gärten. Meine Raupen fressen die Blätter von Büschen.',
      'Ich überwintere draußen im Busch. Sogar Frost macht mir nichts aus.',
    ],
    flies: true,
    hello: 'Hallo, ich bin der Zitronenfalter!',
    needs: [
      { type: 'blumen', wish: 'Ich hätte so gern Blumen. Daraus trinke ich Nektar!' },
      { type: 'busch', wish: 'Ich hätte so gern einen Busch. Dort lege ich meine Eier ab!' },
    ],
    fact: 'Ich bin der Zitronenfalter. Mit meinen Füßen schmecke ich, ob eine Blüte lecker ist.',
    petted: 'Oh, ganz sanft bitte! Meine Flügel sind zart.',
    eats: ['bluete'],
    yummy: 'Mmh, süß! Schmetterlinge trinken Nektar aus Blüten.',
  },
  {
    type: 'biene',
    name: 'Wildbiene',
    album: [
      'Das ist die Wildbiene.',
      'Ich trinke Nektar und sammle Blütenstaub für meine Kinder.',
      'Ich wohne allein, zum Beispiel in einem Röhrchen im Insektenhotel.',
      'In Deutschland gibt es über fünfhundert verschiedene Arten von Wildbienen.',
    ],
    flies: true,
    hello: 'Hallo, ich bin die Wildbiene!',
    needs: [
      { type: 'blumen', wish: 'Ich hätte so gern Blumen. Ich brauche Nektar und Blütenstaub!' },
      { type: 'insektenhotel', wish: 'Ich hätte so gern ein Insektenhotel. Da lege ich meine Eier hinein!' },
    ],
    fact: 'Ich bin die Wildbiene. Beim Fliegen summe ich, weil meine Flügel so schnell schlagen.',
    petted: 'Oh, das ist nett! Ich bin ganz friedlich.',
    eats: ['bluete'],
    yummy: 'Mmh, süß! Bienen trinken Nektar aus Blüten.',
  },
  {
    type: 'amsel',
    name: 'Amsel',
    album: [
      'Das ist die Amsel.',
      'Ich fresse Regenwürmer, Insekten, Beeren und Obst.',
      'Ich baue mein Nest gern in Hecken und Büschen.',
      'Das Männchen ist schwarz und hat einen gelben Schnabel. Das Weibchen ist braun.',
    ],
    hello: 'Hallo, ich bin die Amsel!',
    needs: [
      { type: 'hecke', wish: 'Ich hätte so gern eine Hecke. Darin baue ich mein Nest!' },
      { type: 'obstbaum', wish: 'Ich hätte so gern einen Apfelbaum. Ich esse so gern Obst!' },
    ],
    fact: 'Ich bin die Amsel. Morgens ganz früh singe ich mein schönstes Lied.',
    petted: 'Oh, wie schön! Meine Federn sind ganz weich.',
    eats: ['wurm', 'apfel', 'kaefer'],
    yummy: 'Mmh, lecker! Amseln fressen Würmer, Insekten und Obst.',
  },
  {
    type: 'specht',
    name: 'Buntspecht',
    album: [
      'Das ist der Buntspecht.',
      'Ich fresse Käfer und ihre Larven, aber auch Nüsse und Samen.',
      'Ich wohne in einer Höhle, die ich selbst in einen Baumstamm hacke.',
      'Mit meinem Schnabel trommle ich ganz schnell gegen Holz. Das hört man weit!',
    ],
    hello: 'Hallo, ich bin der Specht!',
    needs: [
      { type: 'baum', wish: 'Ich hätte so gern einen großen Baum. Da hacke ich meine Höhle hinein!' },
      { type: 'totholz', wish: 'Ich hätte so gern einen alten Baumstamm. Darin finde ich Käferlarven!' },
    ],
    fact: 'Ich bin der Specht. Mit meiner langen Zunge hole ich Larven aus dem Holz.',
    petted: 'Oh, das ist schön! Aber pass auf, mein Schnabel ist spitz.',
    eats: ['kaefer', 'nuss', 'koerner'],
    yummy: 'Mmh, lecker! Spechte fressen Käfer, Nüsse und Samen.',
  },
  {
    type: 'hase',
    name: 'Feldhase',
    album: [
      'Das ist der Feldhase.',
      'Ich fresse Gräser, Kräuter und Klee.',
      'Ich lebe auf Wiesen und Feldern. Ich schlafe in einer kleinen Mulde im Boden.',
      'Meine Babys kommen mit Fell und offenen Augen auf die Welt.',
    ],
    hello: 'Hallo, ich bin der Hase!',
    needs: [
      { type: 'hecke', wish: 'Ich hätte so gern eine Hecke. Da verstecke ich mich!' },
      { type: 'blumen', wish: 'Ich hätte so gern eine bunte Blumenwiese. Da wachsen leckere Kräuter!' },
    ],
    fact: 'Ich bin der Hase. Ich kann richtig schnell rennen und Haken schlagen.',
    petted: 'Oh, wie schön! Mit meinen langen Ohren höre ich alles.',
    eats: ['klee'],
    yummy: 'Mmh, lecker! Hasen fressen Gräser, Kräuter und Klee.',
  },
  {
    type: 'reh',
    name: 'Reh',
    album: [
      'Das ist das Reh.',
      'Ich fresse Kräuter, Knospen, Blätter und Früchte.',
      'Ich lebe am Waldrand und verstecke mich gern in Hecken.',
      'Rehkinder heißen Kitze. Sie haben weiße Punkte im Fell.',
    ],
    hello: 'Hallo, ich bin das Reh!',
    needs: [
      { type: 'baum', wish: 'Ich hätte so gern Bäume. In ihrem Schatten ruhe ich mich aus!' },
      { type: 'hecke', wish: 'Ich hätte so gern eine Hecke. Da bin ich gut versteckt!' },
    ],
    fact: 'Ich bin das Reh. Nur der Rehbock hat ein Geweih. Er wirft es jedes Jahr ab, dann wächst ein neues.',
    petted: 'Oh, ganz vorsichtig! Ich bin ein bisschen schüchtern.',
    eats: ['klee', 'apfel'],
    yummy: 'Mmh, lecker! Rehe fressen Kräuter, Knospen und Früchte.',
  },
  {
    type: 'fuchs',
    name: 'Rotfuchs',
    album: [
      'Das ist der Fuchs.',
      'Ich fresse Mäuse, Regenwürmer, Käfer und Obst.',
      'Ich wohne in einem Bau unter der Erde.',
      'Ich höre eine Maus sogar unter dem Schnee rascheln.',
    ],
    hello: 'Hallo, ich bin der Fuchs!',
    needs: [
      { type: 'hecke', wish: 'Ich hätte so gern eine Hecke. An ihr schleiche ich entlang!' },
      { type: 'bau', wish: 'Ich hätte so gern einen Erdbau. Darin schlafe ich!' },
    ],
    fact: 'Ich bin der Fuchs. Wenn ich mich zusammenrolle, wärmt mich mein buschiger Schwanz wie eine Decke.',
    petted: 'Oh, wie schön! Mein Fell ist richtig kuschelig.',
    eats: ['wurm', 'kaefer', 'apfel'],
    yummy: 'Mmh, lecker! Füchse fressen Mäuse, Würmer, Käfer und Obst.',
  },
  {
    type: 'dachs',
    name: 'Dachs',
    album: [
      'Das ist der Dachs.',
      'Ich fresse am liebsten Regenwürmer, aber auch Käfer, Obst und Wurzeln.',
      'Ich wohne in einem großen Bau unter der Erde mit vielen Gängen.',
      'Ich bin sehr ordentlich. Mein Bett aus Gras und Laub lüfte ich oft aus.',
    ],
    hello: 'Hallo, ich bin der Dachs!',
    needs: [
      { type: 'bau', wish: 'Ich hätte so gern einen Erdbau. Da wohne ich mit meiner Familie!' },
      { type: 'baum', wish: 'Ich hätte so gern Bäume. Ich wohne am liebsten am Waldrand!' },
    ],
    fact: 'Ich bin der Dachs. Mit meinen starken Krallen kann ich prima graben.',
    petted: 'Oh, das ist schön! Mein Fell ist ein bisschen borstig.',
    eats: ['wurm', 'kaefer', 'apfel'],
    yummy: 'Mmh, lecker! Dachse fressen am liebsten Regenwürmer.',
  },
  {
    type: 'maulwurf',
    name: 'Maulwurf',
    album: [
      'Das ist der Maulwurf.',
      'Ich fresse Regenwürmer, Käferlarven und andere kleine Tiere im Boden.',
      'Ich wohne unter der Wiese in langen Gängen. Die Erde schiebe ich nach oben. Das sind Maulwurfshügel.',
      'Ich sehe fast nichts. Dafür kann ich sehr gut riechen und fühlen.',
    ],
    hello: 'Hallo, ich bin der Maulwurf!',
    needs: [
      { type: 'blumen', wish: 'Ich hätte so gern eine Blumenwiese. Darunter grabe ich meine Gänge!' },
      { type: 'laubhaufen', wish: 'Ich hätte so gern einen Laubhaufen. Darunter gibt es viele Regenwürmer!' },
    ],
    fact: 'Ich bin der Maulwurf. Meine großen Hände sind wie Schaufeln.',
    petted: 'Oh! Mein Fell ist weich wie Samt.',
    eats: ['wurm', 'kaefer'],
    yummy: 'Mmh, lecker! Maulwürfe fressen Regenwürmer und Insekten.',
  },
  {
    type: 'fledermaus',
    name: 'Zwergfledermaus',
    album: [
      'Das ist die Zwergfledermaus.',
      'Ich fange nachts Mücken und andere Insekten, ganz viele in einer Nacht.',
      'Am Tag schlafe ich kopfüber, zum Beispiel in einem alten Baum.',
      'Ich rufe so hoch, dass Menschen es nicht hören. Das Echo zeigt mir den Weg.',
    ],
    flies: true,
    hello: 'Hallo, ich bin die Fledermaus!',
    needs: [
      { type: 'totholz', wish: 'Ich hätte so gern einen alten Baumstamm. In den Spalten schlafe ich am Tag!' },
      { type: 'teich', wish: 'Ich hätte so gern einen Teich. Über dem Wasser fliegen viele Mücken!' },
    ],
    fact: 'Ich bin die Fledermaus. Ich bin das einzige Säugetier, das richtig fliegen kann.',
    petted: 'Oh, wie lieb! Meine Flügel sind aus ganz dünner Haut.',
    eats: ['kaefer'],
    yummy: 'Mmh, lecker! Fledermäuse fressen Mücken, Motten und Käfer.',
  },
  {
    type: 'waldkauz',
    name: 'Waldkauz',
    album: [
      'Das ist der Waldkauz. Er ist eine Eule.',
      'Ich fresse Mäuse, aber auch Käfer und Regenwürmer.',
      'Ich wohne in Baumhöhlen oder in einem großen Nistkasten.',
      'Ich fliege ganz leise, weil meine Federn so weich sind. Und ich kann meinen Kopf weit nach hinten drehen.',
    ],
    hello: 'Hallo, ich bin der Waldkauz, eine Eule!',
    needs: [
      { type: 'baum', wish: 'Ich hätte so gern große Bäume. Da sitze ich am Tag versteckt!' },
      { type: 'nistkasten', wish: 'Ich hätte so gern einen Nistkasten. Darin ziehe ich meine Küken groß!' },
    ],
    fact: 'Ich bin der Waldkauz. Nachts rufe ich laut durch den Wald.',
    petted: 'Oh, das ist schön! Meine Federn sind ganz flauschig.',
    eats: ['wurm', 'kaefer'],
    yummy: 'Mmh, lecker! Waldkäuze fressen Mäuse, Käfer und Würmer.',
  },
  {
    type: 'biber',
    name: 'Biber',
    album: [
      'Das ist der Biber.',
      'Ich fresse Rinde, Zweige, Kräuter und Wasserpflanzen.',
      'Ich baue eine Burg aus Ästen im Wasser. Der Eingang liegt unter Wasser.',
      'Meine Zähne sind orange und wachsen immer weiter.',
    ],
    shore: true,
    hello: 'Hallo, ich bin der Biber!',
    needs: [
      { type: 'teich', wish: 'Ich hätte so gern einen Teich. Darin baue ich meine Burg!' },
      { type: 'baum', wish: 'Ich hätte so gern Bäume. Ich nage Äste ab für meine Burg!' },
    ],
    fact: 'Ich bin der Biber. Mit meinem flachen Schwanz steuere ich beim Schwimmen.',
    petted: 'Oh, wie schön! Mein dichtes Fell hält mich im Wasser warm.',
    eats: ['wasserpflanze', 'klee'],
    yummy: 'Mmh, lecker! Biber fressen Rinde, Kräuter und Wasserpflanzen.',
  },
];
