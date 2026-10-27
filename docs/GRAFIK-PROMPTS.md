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
| `blume-gelb.png` | One small yellow meadow flower on a short stem. |
| `blume-rosa.png` | One small pink meadow flower on a short stem. |
| `blume-weiss.png` | One small daisy with white petals and yellow center on a short stem. |

Gras, Schatten und Gedankenblase bleiben vorerst Vektorgrafiken. Das Gras
muss sich nahtlos wiederholen, und das gelingt KI-Programmen selten gut.

## Wenn ein Bild nicht passt

Schreib im Chat einfach dazu, was anders sein soll, zum Beispiel:
*„Gleiches Bild, aber die Augen etwas größer“* oder *„Ohne Boden darunter“*.
