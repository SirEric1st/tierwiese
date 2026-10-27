# Lizenzen und Herkunft

## Grafiken

Alle Spielgrafiken sind eigene Arbeit, Teil dieses Projekts:

- `assets/grafik/*.svg` – Tiere, Spielfigur, Landschaft, Futter, Knöpfe,
  Gedankenblase.
  Erzeugt mit dem eigenen Skript `tools/grafik.py`.
- Die eigene Spielfigur (Baukasten) wird im Spiel aus Teilen zusammengesetzt
  (`src/figure.js`), nach dem Vorbild von `assets/grafik/figur.svg`.
- Konfetti und Knöpfe werden beim Start per Code gezeichnet
  (`src/textures.js`, `src/scenes/StartScene.js`, `src/BuildBar.js`).

### KI-Bilder

Gemalte Bilder im Pixar-Stil, erzeugt von Eric mit ChatGPT (OpenAI) nach den
Bildbeschreibungen in `docs/GRAFIK-PROMPTS.md`. Laut den Nutzungsbedingungen
von OpenAI gehören die erzeugten Bilder dem Nutzer und dürfen frei verwendet
werden. Für das Spiel zugeschnitten und verkleinert mit `tools/ki-bild.py`.

| Datei | Erzeugt am | Werkzeug |
|-------|------------|----------|
| `assets/bilder/igel.png` | 27.10.2026 | ChatGPT |

### Weitere

| Datei | Herkunft | Lizenz |
|-------|----------|--------|
| `icons/icon.svg` und `icons/icon-*.png` | App-Symbol (Igel auf der Wiese), eigene Zeichnung; PNGs daraus erzeugt | eigene Arbeit |

## Sounds

Noch keine Sound-Dateien. Die Einzugs-Melodie wird im Browser per Code
erzeugt (`src/sound.js`) – eigene Arbeit, Teil dieses Projekts.

## Bibliotheken

| Datei | Herkunft | Lizenz |
|-------|----------|--------|
| `lib/phaser.min.js` | [Phaser 3.90.0](https://phaser.io), npm-Paket `phaser` | MIT, siehe `lib/phaser-LICENSE.md` |
