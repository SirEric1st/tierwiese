# Tierwiese – Spielkonzept

Arbeitstitel. Ein Aufbau- und Tierpflege-Spiel für Kinder ab 5 Jahren,
das als Web-App auf dem iPad läuft (ohne App Store).

## Zielgruppe

- Kinder im Vor- und Grundschulalter, jedes mit eigenem Gerät und eigener
  Spielwelt
- Jüngere Kinder können noch nicht lesen → alles muss ohne Text verständlich
  sein (Bilder, Symbole, Sprachausgabe)
- Kinder, die erste Wörter lesen, dürfen kurze Texte zusätzlich sehen;
  diese werden aber immer auch vorgelesen
- Später eventuell privat für weitere Kinder/Familien

## Kernidee

Die Kinder **erschaffen ihre eigene Landschaft**. Heimische Tiere **ziehen
freiwillig ein**, wenn der Lebensraum zu ihnen passt – keine Gehege, keine
Käfige. Die Tiere bewegen sich frei, kommen und gehen.

Nebenbei lernen die Kinder:
- Wer frisst was?
- Wer braucht welche Umgebung?
- Wer ist tags, wer nachts unterwegs?
- Wer hält Winterschlaf? (spätere Ausbaustufe)

## Spielelemente

### 1. Welt bauen

- Große, frei gestaltbare Landschaft (scrollbar)
- Elemente per Drag & Drop aus einer Bild-Leiste platzieren:
  Wiese, Teich, Bäume (Laub-, Nuss-, Obstbaum), Büsche, Blumen, Steine,
  Laubhaufen, Totholz, Hecke, Schilf, Insektenhotel …
- Elemente lassen sich verschieben und wieder entfernen
- Kein Geld und kein Mangel: alles steht von Anfang an zur Verfügung oder
  wird durch neue Tiere freigeschaltet (Belohnung statt Hürde)

### 2. Tiere kommen zu Besuch

- Jedes Tier hat **Bedürfnisse** (Lebensraum + Futter + ggf. Versteck)
- Sind die Bedürfnisse teilweise erfüllt, schaut das Tier kurz vorbei und
  zeigt per **Gedankenblase** (Bild) + Sprachausgabe, was ihm noch fehlt
  („Ich hätte so gern einen Laubhaufen zum Verstecken!“)
- Sind sie ganz erfüllt, **zieht das Tier ein** – mit einer kleinen Feier
  (Animation, Sound, Konfetti)
- Tiere bleiben frei: sie laufen umher, schlafen, kommen und gehen

### 3. Tiere pflegen (sanftes Tamagotchi)

- Füttern (richtiges Futter → Freude, falsches → Tier schüttelt freundlich
  den Kopf und zeigt, was es lieber mag)
- Streicheln, Wasser auffüllen, Nest bauen helfen
- **Tiere werden nie krank und sterben nicht.** Vernachlässigung führt
  höchstens dazu, dass ein Tier kurz traurig schaut oder eine Weile
  verreist – und dann wiederkommt
- Keine Push-Benachrichtigungen, kein Druck, täglich spielen zu müssen

### 4. Die Kinder kommen selbst vor

- Jedes Kind gestaltet seine **eigene Spielfigur**: Haare, Hautton,
  Kleidung, Farben, Name
- Optional: Foto vom Gesicht direkt auf dem iPad aufnehmen
- Die Figur läuft durch die Welt, Tiere reagieren auf sie (folgen ihr,
  freuen sich)

### 5. Tier-Album

- Für jedes eingezogene Tier eine Album-Seite mit Bild und kurzem,
  vorgelesenem Steckbrief (Was frisst es? Wo wohnt es? Lustige Fakten)
- Noch nicht entdeckte Tiere erscheinen als Schatten → Neugier

## Startpaket: Heimische Tiere

Erste Version mit 3 Tieren, danach schrittweise erweitern:

| Tier | Braucht | Frisst | Besonderheit |
|------|---------|--------|--------------|
| Igel | Laubhaufen, Hecke/Büsche | Insekten, Würmer, Schnecken | nachtaktiv, Winterschlaf |
| Ente | Teich, Schilf | Wasserpflanzen, Samen, Insekten | schwimmt und taucht |
| Eichhörnchen | Bäume, Nussbaum | Nüsse, Samen, Früchte | versteckt Vorräte |

Kandidaten für später: Marienkäfer, Schmetterling, Biene, Frosch, Amsel,
Specht, Hase, Reh, Fuchs, Maulwurf, Fledermaus, Eule, Dachs, Biber.

Spätere Pakete (wenn die Kinder Spaß haben): Bauernhof, Meer, Dschungel,
Savanne, Polargebiet.

## Grafikstil

- Orientierung an Pixar-/Disney-Animationsfilmen: weiche Formen, große
  ausdrucksstarke Augen, warme Farben, freundliche Ausstrahlung
- Umsetzung als 2D-Grafiken mit „3D-Look“ (weiche Schattierung), da echtes
  3D für ältere iPads und Vibe Coding zu aufwendig ist
- **Keine Original-Figuren oder Marken von Pixar/Disney** – nur der Stil
  dient als Inspiration
- Quelle der Grafiken: noch offen (siehe offene Entscheidungen)

## Bedienung (kindgerecht)

- Große Touch-Flächen (mind. 64 × 64 pt)
- Nur einfache Gesten: Tippen, Ziehen, ggf. Wischen zum Scrollen
- Kein Text nötig: Symbole + Sprachausgabe (deutsche iPad-Stimme)
- Kein „Game Over“, keine Zeitlimits, kein Verlieren
- Viel positives Feedback: Sounds, Animationen, Sterne
- Eltern-Bereich (Einstellungen, Zurücksetzen) nur über Eltern-Sperre
  erreichbar (z. B. lang drücken + einfache Rechenaufgabe)

## Technik

- **Web-App** (HTML/JavaScript) mit **Phaser 3**
- Läuft in Safari auf iPad (iOS 17.7), über „Zum Home-Bildschirm“ als
  Vollbild-App mit eigenem Icon
- **Offline-fähig** (PWA mit Service Worker)
- Hosting über **GitHub Pages**
- Spielstand, Figuren und Fotos werden **ausschließlich lokal auf dem iPad**
  gespeichert (IndexedDB/localStorage)
- Sprachausgabe über die Web Speech API (deutsche Stimme)

## Datenschutz

- Das Repo und GitHub Pages sind öffentlich → **keine Namen, Fotos oder
  sonstigen persönlichen Daten der Kinder im Code oder Repo**
- Personalisierung passiert nur im Spiel auf dem Gerät
- Keine Werbung, keine Käufe, keine Tracker, keine externen Links,
  keine Datenübertragung an Server
- Dadurch funktioniert das Spiel auch für weitere Familien ohne Anpassung

## Ausbaustufen

### Version 0.1 – erster spielbarer Prototyp
- Eine Wiesen-Landschaft
- 5–6 platzierbare Elemente (Baum, Nussbaum, Teich, Schilf, Laubhaufen, Busch)
- 3 Tiere (Igel, Ente, Eichhörnchen) mit Bedürfnis-Logik
- Eine einfache, vorgefertigte Spielfigur, die man durch Tippen bewegt
- Speichern auf dem Gerät
- Als Home-Bildschirm-App installierbar, offline spielbar

### Version 0.2
- Figuren-Editor (inkl. optionalem Foto)
- Füttern und Streicheln
- Tier-Album mit vorgelesenen Steckbriefen

### Version 0.3
- Weitere heimische Tiere
- Tag/Nacht-Wechsel (nachtaktive Tiere)
- Jahreszeiten (Winterschlaf, Vorräte)

### Später
- Weitere Tierpakete
- Multiplayer/Koop über zwei iPads (braucht einen kleinen Server)
- Bereitstellung für weitere Familien

## Offene Entscheidungen

- **Grafikquelle**: KI-generierte Bilder im einheitlichen Stil, gekaufte bzw.
  freie Grafikpakete, eigene Zeichnungen – oder Mischung. Für den
  Prototyp reichen Platzhalter.
- **Sounds/Musik**: freie Soundpakete oder eigene Aufnahmen
  (z. B. Tierlaute, Stimmen der Eltern)
- **Endgültiger Spielname**
