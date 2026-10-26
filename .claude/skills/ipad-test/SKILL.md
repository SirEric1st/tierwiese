---
name: ipad-test
description: Startet das Spiel auf dem Mac als lokalen Server, damit Eric es sofort im WLAN auf dem iPad in Safari testen kann. Nutzen, wenn Eric eine Änderung auf dem iPad ausprobieren will („auf dem iPad testen“, „starten“, „ausprobieren“).
---

# Auf dem iPad testen

Ziel: Eric soll eine Änderung in wenigen Sekunden auf dem iPad sehen, ohne
vorher etwas zu GitHub hochzuladen.

## Ablauf

1. **Spielordner finden**: der Ordner mit der `index.html` des Spiels
   (aktuell das Repo-Hauptverzeichnis; falls es später einen Build-Schritt
   gibt, den Ausgabeordner verwenden und vorher bauen).

2. **Prüfen, ob schon ein Server läuft**:
   `lsof -nP -iTCP:8080 -sTCP:LISTEN`
   Läuft schon einer aus diesem Projekt, wiederverwenden statt neu starten.

3. **Server starten** (im Hintergrund, `run_in_background: true`):
   `python3 -m http.server 8080 --bind 0.0.0.0 --directory <spielordner>`

4. **IP-Adresse des Macs im WLAN ermitteln**:
   `ipconfig getifaddr en0 || ipconfig getifaddr en1`

5. **Eric die Adresse nennen**, z. B.:
   „Öffne am iPad Safari und gib ein: `http://192.168.0.42:8080`“

## Hinweise für Eric (bei Bedarf mitgeben)

- Mac und iPad müssen im **selben WLAN** sein.
- Fragt macOS beim ersten Mal, ob Python eingehende Verbindungen annehmen
  darf → **Erlauben**.
- Nach einer Änderung im Code: in Safari **neu laden**. Zeigt das iPad noch
  die alte Version, in den iPad-Einstellungen unter Apps → Safari →
  Erweitert → Website-Daten den Eintrag für die IP-Adresse löschen.
- **Einschränkung**: Über `http://<IP>` funktionieren Offline-Modus
  (Service Worker) und teilweise die Installation als Home-Bildschirm-App
  nicht, weil Safari dafür HTTPS verlangt. Das lokale Testen ist für
  Spielinhalte gedacht. Offline-Modus und Home-Bildschirm-App werden über
  die GitHub-Pages-Version (HTTPS) getestet.
- Spielstände beim lokalen Test liegen getrennt von der GitHub-Pages-
  Version (andere Adresse = anderer Speicher).

## Beenden

Wenn Eric fertig ist oder es verlangt: den Hintergrund-Server stoppen
(Prozess auf Port 8080 beenden, nur wenn er aus diesem Projekt stammt).
