# Tierwiese

Aufbau- und Tierpflege-Spiel für Kinder ab 5 Jahren, als Web-App für das
iPad (ohne App Store). Privates Familienprojekt.

Das inhaltliche Spielkonzept steht in `docs/KONZEPT.md`. Diese Datei enthält
die verbindlichen Regeln für die Entwicklung.

## Zielplattform

- iPad mit iOS 17.7 (Safari), Bedienung ausschließlich per Touch
- Läuft als Home-Bildschirm-Web-App im Vollbild, muss offline funktionieren
- Ältere Hardware: auf Performance achten (Texturgrößen, Anzahl gleichzeitig
  animierter Objekte, kein unnötiges Neuzeichnen)

## Technik

- Phaser 3, reines JavaScript/HTML, möglichst wenige weitere Abhängigkeiten
- Hosting über GitHub Pages
- Spielstand nur lokal auf dem Gerät (IndexedDB/localStorage)
- Sprachausgabe über die Web Speech API, Sprache Deutsch (`de-DE`)

## Kindgerechte Regeln (verbindlich)

- Alles muss **ohne Lesen** verständlich sein: Symbole, Animationen,
  Sprachausgabe. Text darf nur zusätzlich erscheinen und wird immer
  auch vorgelesen.
- Touch-Flächen mindestens 64 × 64 pt, nur Tippen und Ziehen (auch Wischen)
  als Gesten; einzige Ausnahme: Zoomen der Wiese mit zwei Fingern (Pinch)
- Kein Verlieren, kein „Game Over“, keine Zeitlimits, keine Strafen
- Tiere werden nie krank, verletzt oder sterben
- Keine Gewalt, keine gruseligen Inhalte
- Keine Werbung, keine Käufe, keine externen Links, keine Push-
  Benachrichtigungen, keine Mechaniken, die Druck zum täglichen Spielen
  erzeugen
- Eltern-Funktionen (Zurücksetzen, Einstellungen) nur hinter Eltern-Sperre
- Tier-Fakten müssen sachlich korrekt sein, aber kindgerecht formuliert
- Spieltexte und Sprachausgabe auf Deutsch

## Datenschutz (verbindlich)

- Repo und GitHub Pages sind öffentlich: **niemals Namen, Fotos, Stimmen
  oder andere persönliche Daten der Kinder ins Repo** aufnehmen
- Personalisierung (Name, Figur, Foto) nur zur Laufzeit auf dem Gerät
- Keine Netzwerkanfragen an fremde Server, keine Analytics, keine Tracker
- Externe Bibliotheken lokal einbinden (nicht per CDN), damit das Spiel
  offline läuft

## Grafik & Assets

- Stil orientiert sich an Pixar-/Disney-Animationen (weich, warm,
  große Augen), aber **keine Original-Figuren oder Marken** nachbilden
- Nur Assets mit klarer Lizenz verwenden (eigene, CC0 oder gekauft);
  Herkunft und Lizenz in `assets/LIZENZEN.md` dokumentieren

## Git-Workflow

- Neue Features auf `feature/<kurzname>`, Bugfixes auf `fix/<kurzname>`,
  nicht direkt auf `main` arbeiten
- Commit-Messages im Conventional-Commits-Format (`feat: …`, `fix: …`,
  `docs: …`), Betreffzeile unter 72 Zeichen
- Merge nach `main` erst nach Durchsicht und Test auf dem iPad durch Eric
- Kein Push ohne explizite Aufforderung

## Arbeitsweise

- Eric ist Einsteiger im Programmieren: Änderungen kurz und verständlich
  erklären, Fachbegriffe vermeiden oder erklären
- In kleinen, spielbaren Schritten vorgehen; nach jedem Schritt sagen, wie
  man es auf dem iPad testet
