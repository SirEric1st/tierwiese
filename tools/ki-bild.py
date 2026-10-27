# Bereitet ein KI-Bild (PNG mit durchsichtigem Hintergrund) für das Spiel vor.
# Aufruf im Projektordner:  python3 tools/ki-bild.py <bild.png> <name>
# Beispiel:                 python3 tools/ki-bild.py ~/Downloads/igel.png igel
#
# Das Skript schneidet leere Ränder ab, macht das Bild überall ganz deckend
# (KI-Bilder sind oft ein kleines bisschen durchsichtig) und verkleinert es
# auf doppelte Spielgröße für scharfe Retina-Darstellung. Ergebnis:
# assets/bilder/<name>.png
#
# Braucht das Python-Modul Pillow:  python3 -m pip install --user pillow
import sys
from pathlib import Path

from PIL import Image

# Größte Breite und Höhe im Spiel (in Punkten), in die das Bild passen muss
SIZES = {
    'igel': (130, 100),
    'ente': (120, 100),
    'ente-schwimmt': (120, 100),
    'eichhoernchen': (115, 125),
    'figur': (100, 150),
    'baum': (190, 240),
    'nussbaum': (190, 240),
    'teich': (280, 160),
    'schilf': (100, 150),
    'laubhaufen': (140, 90),
    'busch': (140, 110),
    'blume-gelb': (32, 36),
    'blume-rosa': (32, 36),
    'blume-weiss': (32, 36),
}
RETINA = 2
CLEAR = 10  # Pixel, die fast durchsichtig sind, werden ganz durchsichtig
SOLID = 240  # Pixel, die fast deckend sind, werden ganz deckend
MARGIN = 4  # etwas Luft um das Bild lassen

source, name = Path(sys.argv[1]), sys.argv[2]
if name not in SIZES:
    sys.exit(f'Unbekannter Name „{name}“. Möglich: {", ".join(SIZES)}')

image = Image.open(source).convert('RGBA')
alpha = image.getchannel('A').point(
    lambda v: 0 if v <= CLEAR else 255 if v >= SOLID else round((v - CLEAR) * 255 / (SOLID - CLEAR))
)
image.putalpha(alpha)

left, top, right, bottom = alpha.getbbox()
image = image.crop((
    max(0, left - MARGIN),
    max(0, top - MARGIN),
    min(image.width, right + MARGIN),
    min(image.height, bottom + MARGIN),
))

max_w, max_h = SIZES[name]
scale = min(max_w * RETINA / image.width, max_h * RETINA / image.height)
size = (round(image.width * scale), round(image.height * scale))
image = image.resize(size, Image.LANCZOS)

target = Path(__file__).resolve().parent.parent / 'assets' / 'bilder' / f'{name}.png'
target.parent.mkdir(exist_ok=True)
image.save(target, optimize=True)
print(f'{target.name}: {size[0]} × {size[1]} Pixel, {target.stat().st_size // 1024} KB')
