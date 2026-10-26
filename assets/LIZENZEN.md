# Lizenzen und Herkunft

## Grafiken

Alle Spielgrafiken sind eigene Arbeit, Teil dieses Projekts:

- `assets/grafik/*.svg` – Tiere, Spielfigur, Landschaft, Gedankenblase.
  Erzeugt mit dem eigenen Skript `tools/grafik.py`.
- Konfetti und Knöpfe werden beim Start per Code gezeichnet
  (`src/textures.js`, `src/scenes/StartScene.js`, `src/BuildBar.js`).

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
