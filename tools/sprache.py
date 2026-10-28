# Erzeugt Sprachaufnahmen mit ElevenLabs (einmalig auf dem Mac, nicht im Spiel).
# Das Spiel spielt später nur die fertigen Dateien ab und bleibt offline.
#
# Der Zugangsschlüssel (API-Key) steht nie im Repo. Einmal im Schlüsselbund
# des Macs speichern (im Terminal, fragt nach dem Schlüssel):
#   security add-generic-password -a "$USER" -s tierwiese-elevenlabs -w
#
# Aufrufe im Projektordner:
#   python3 tools/sprache.py stimmen            – Stimmen im eigenen Konto mit ID anzeigen
#   python3 tools/sprache.py probe <Stimmen-ID> – drei Probesätze nach sprachproben/
#   python3 tools/sprache.py alle                – alle Sätze des Spiels aufnehmen
#
# „alle“ holt die Sätze mit node tools/saetze.mjs, nimmt nur fehlende auf
# (jede Datei heißt wie die Prüfsumme ihres Satzes), löscht Aufnahmen von
# Sätzen, die es nicht mehr gibt, und schreibt assets/sprache/liste.js.
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = 'https://api.elevenlabs.io/v1'
MODEL = 'eleven_multilingual_v2'  # spricht gut Deutsch
VOICE = '7Nj1UduP6iY6hWpEDibS'  # „Bibi Blume – Warm and Soft“ aus der Voice Library
FORMAT = 'mp3_22050_32'  # klein, für Sprache reicht das
OUT = ROOT / 'assets' / 'sprache'
PROBE_TEXTE = [
    'Hallo, ich bin der Igel! Hurra, hier gefällt es mir. Ich ziehe bei dir ein!',
    'Mmh, lecker! Igel fressen gern Käfer und Würmer.',
    'Ich hätte so gern einen Teich. Dort lege ich meine Eier!',
]


def api_key():
    try:
        return subprocess.run(
            ['security', 'find-generic-password', '-s', 'tierwiese-elevenlabs', '-w'],
            check=True, capture_output=True, text=True,
        ).stdout.strip()
    except subprocess.CalledProcessError:
        sys.exit('Kein Schlüssel im Schlüsselbund. Bitte zuerst speichern (siehe oben in tools/sprache.py).')


def request(path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method='POST' if body is not None else 'GET')
    req.add_header('xi-api-key', api_key())
    if body is not None:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        sys.exit(f'ElevenLabs meldet Fehler {error.code}: {error.read().decode(errors="replace")[:300]}')


def list_voices():
    voices = json.loads(request('/voices'))['voices']
    for voice in voices:
        labels = ', '.join(f'{v}' for v in (voice.get('labels') or {}).values())
        print(f"{voice['voice_id']}  {voice['name']}  ({labels})")


def clip_name(text):
    """Prüfsumme eines Satzes (FNV-1a, 8 Hex-Zeichen) – genauso in src/speech.js"""
    value = 0x811C9DC5
    for byte in text.strip().encode('utf-8'):
        value = ((value ^ byte) * 0x01000193) & 0xFFFFFFFF
    return f'{value:08x}'


def record_all():
    texts = json.loads(subprocess.run(['node', 'tools/saetze.mjs'], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
    names = {clip_name(text): text for text in texts}
    OUT.mkdir(parents=True, exist_ok=True)
    missing = [(name, text) for name, text in names.items() if not (OUT / f'{name}.mp3').exists()]
    print(f'{len(texts)} Sätze, davon {len(missing)} neu ({sum(len(t) for _, t in missing)} Zeichen).')
    for i, (name, text) in enumerate(missing, 1):
        print(f'[{i}/{len(missing)}] ', end='')
        speak(VOICE, text, OUT / f'{name}.mp3', FORMAT)
    for old in OUT.glob('*.mp3'):
        if old.stem not in names:
            old.unlink()
            print(f'gelöscht (Satz gibt es nicht mehr): {old.name}')
    listed = sorted(name for name in names if (OUT / f'{name}.mp3').exists())
    (OUT / 'liste.js').write_text(
        '// Welche Sprachaufnahmen es gibt (wird von tools/sprache.py geschrieben).\n'
        f'self.SPRACHE = {json.dumps(listed)};\n',
        encoding='utf-8',
    )
    print(f'Fertig: {len(listed)} Aufnahmen in assets/sprache/.')


def speak(voice_id, text, target, output_format='mp3_44100_128'):
    audio = request(
        f'/text-to-speech/{voice_id}?output_format={output_format}',
        {'text': text, 'model_id': MODEL, 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}},
    )
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(audio)
    print(f'{target.relative_to(ROOT)}: {len(audio) // 1024} KB  „{text[:50]}“')


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'stimmen':
        list_voices()
    elif len(sys.argv) >= 2 and sys.argv[1] == 'alle':
        record_all()
    elif len(sys.argv) >= 3 and sys.argv[1] == 'probe':
        voice_id = sys.argv[2]
        for i, text in enumerate(PROBE_TEXTE, 1):
            speak(voice_id, text, ROOT / 'sprachproben' / f'{voice_id}-{i}.mp3')
    else:
        sys.exit('Aufruf: python3 tools/sprache.py stimmen | probe <Stimmen-ID> | alle')
