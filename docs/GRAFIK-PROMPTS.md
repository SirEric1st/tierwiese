# Bildbeschreibungen für KI-Grafiken

Mit diesen Beschreibungen (Prompts) erzeugst du die Spielgrafiken im
Pixar-Stil mit einem KI-Bildprogramm, zum Beispiel ChatGPT, Gemini oder
Midjourney. Die Bilder ersetzen später die einfachen Vektorgrafiken aus
`assets/grafik/`.

## So gehst du vor

1. **Alle Bilder im selben Chat erzeugen.** Dann bleibt der Stil einheitlich.
   Fang mit dem Igel an. Wenn er dir gefällt, schreib bei den weiteren
   Bildern dazu: *„Im exakt gleichen Stil wie der Igel.“*
2. Kopiere jeweils den **Grund-Stil** und danach die Zeile für das Bild.
3. Bitte immer um ein **PNG mit durchsichtigem Hintergrund**. Klappt das
   nicht, ist ein einfarbig weißer Hintergrund auch in Ordnung – den
   entferne ich.
4. Schick mir den **Teilen-Link** des Bildes aus ChatGPT und sag dazu, welches
   Bild es ist (Dateiname aus der Tabelle). Oder speichere es unter dem
   Dateinamen im Ordner `assets/ki-bilder/`. Ich schneide die Bilder zu,
   verkleinere sie mit `tools/ki-bild.py` und baue sie ein.
5. Notiere, **mit welchem Programm** du die Bilder gemacht hast. Das kommt in
   `assets/LIZENZEN.md`. Bitte vorher kurz in den Nutzungsbedingungen des
   Programms nachsehen, ob man die Bilder in eigenen Projekten verwenden darf.

Manche Programme lehnen Stil-Angaben wie „Pixar“ ab. Ersetze dann
„Pixar style 3D animation“ durch „3D animated movie style“.

Wichtig: Keine Fotos der Kinder hochladen und keine Namen in die Prompts
schreiben. Das Repo ist öffentlich.

## Grund-Stil (immer zuerst einfügen)

> Cute Pixar style 3D animation illustration for a children's game, soft
> rounded shapes, big friendly expressive eyes, warm sunny colors, soft
> studio lighting from the upper left, gentle shading, slightly glossy,
> clean edges. Single object, centered, full body visible, nothing cut off.
> Seen from the side with a slight view from above. Transparent background,
> no ground, no shadow, no text, no frame. Original character design,
> not resembling any existing Pixar or Disney character.

## Bilder

Tiere schauen immer **nach rechts**. Das Spiel spiegelt sie selbst, wenn sie
nach links laufen.

| Dateiname | Was ins Bild soll (an den Grund-Stil anhängen) |
|-----------|-------------------------------------------------|
| `igel.png` | A small European hedgehog walking, facing right, brown spines, light brown face, tiny black nose, happy smile. |
| `ente.png` | A female mallard duck standing, facing right, brown speckled feathers, blue wing patch, orange bill and feet, cheerful look. |
| `ente-schwimmt.png` | The same mallard duck swimming, facing right, only the body above the water line visible, flat cut-off bottom edge, no water, no feet. |
| `eichhoernchen.png` | A red squirrel sitting upright, facing right, reddish-brown fur, big fluffy tail curled up behind, ear tufts, holding nothing, curious happy look. |
| `figur.png` | A friendly cartoon child standing, facing the viewer, simple t-shirt and trousers, sneakers, short hair, arms relaxed, neutral design (will be customizable later). |
| `baum.png` | A large deciduous tree with a round lush green crown and a sturdy brown trunk. |
| `nussbaum.png` | A hazelnut tree with a round green crown and clusters of brown hazelnuts clearly visible in the leaves. |
| `teich.png` | A small oval pond seen from above at an angle, clear blue water with a light reflection, a ring of round stones and grass at the edge, much wider than tall. |
| `schilf.png` | A clump of reeds: tall thin green stalks with a few brown cattail heads. |
| `laubhaufen.png` | A cozy pile of autumn leaves in orange, red, yellow and brown, wider than tall. |
| `busch.png` | A round dense green bush with a few small flowers, wider than tall. |
| `frosch.png` | A small green pond frog sitting, facing right, darker green spots, pale yellow belly, big round eyes on top of the head, wide friendly smile, four legs visible. |
| `steine.png` | A small pile of round grey stones with a little green moss, wider than tall. |
| `marienkaefer.png` | A seven-spot ladybird walking, facing right, shiny red wing cases with seven black dots, black head with tiny white spots, six little legs. |
| `zitronenfalter.png` | A brimstone butterfly seen from the side with its wings folded up, facing right, lemon yellow leaf-shaped wings with one small orange dot, thin antennae. |
| `biene.png` | A fuzzy wild bee flying, facing right, golden-brown furry body with dark stripes, transparent wings, friendly face. |
| `amsel.png` | A male common blackbird standing, facing right, glossy black feathers, bright orange-yellow beak and yellow eye ring. |
| `specht.png` | A great spotted woodpecker standing upright, facing right, black and white feathers, red patch under the tail and on the back of the head, strong grey beak. |
| `hase.png` | A brown European hare sitting, facing right, very long ears with black tips, white belly, long hind legs. |
| `reh.png` | A female roe deer standing, facing right, reddish-brown coat, white rump patch, big dark eyes, no antlers, four slender legs. |
| `fuchs.png` | A red fox standing, facing right, orange fur, white chest and chin, black legs, bushy tail with a white tip. |
| `dachs.png` | A European badger walking, facing right, grey body, black and white striped face, short dark legs. |
| `maulwurf.png` | A European mole peeking out of a small mound of earth, facing right, black velvet fur, pink nose and big pink digging hands, tiny eyes. |
| `fledermaus.png` | A small common pipistrelle bat flying, facing the viewer, brown furry body, dark thin wings spread out, big ears. |
| `waldkauz.png` | A tawny owl sitting, facing the viewer, round brown body, light facial disc, big dark eyes, small yellow beak. |
| `biber.png` | A Eurasian beaver standing, facing right, brown fur, flat dark scaly tail, orange front teeth. |
| `blumen.png` | A small flower bed with colorful meadow flowers in pink, yellow, purple, white and orange, wider than tall. |
| `hecke.png` | A long dense green hedge with a few red berries, much wider than tall. |
| `obstbaum.png` | An apple tree with a round green crown full of red apples and a brown trunk. |
| `totholz.png` | An old fallen tree log lying on the ground with moss and two small orange mushrooms. |
| `insektenhotel.png` | A small wooden insect hotel on short legs, with a roof, bamboo tubes, drilled wood, pine cones and straw. |
| `nistkasten.png` | A wooden nesting box with a round entrance hole and a green roof, mounted on a tall wooden pole. |
| `bau.png` | A mound of earth with a dark round burrow entrance at the bottom, a few small stones and grass tufts. |
| `blume-gelb.png` | One small yellow meadow flower on a short stem. |
| `blume-rosa.png` | One small pink meadow flower on a short stem. |
| `blume-weiss.png` | One small daisy with white petals and yellow center on a short stem. |

Gras, Schatten und Gedankenblase bleiben vorerst Vektorgrafiken. Das Gras
muss sich nahtlos wiederholen, und das gelingt KI-Programmen selten gut.

## Wenn ein Bild nicht passt

Schreib im Chat einfach dazu, was anders sein soll, zum Beispiel:
*„Gleiches Bild, aber die Augen etwas größer“* oder *„Ohne Boden darunter“*.
