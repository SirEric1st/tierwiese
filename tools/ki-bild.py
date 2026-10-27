# Bereitet ein KI-Bild (PNG mit durchsichtigem Hintergrund) für das Spiel vor.
# Aufruf im Projektordner:  python3 tools/ki-bild.py <bild.png> <name>
# Beispiel:                 python3 tools/ki-bild.py ~/Downloads/igel.png igel
#
# Hat das Bild keinen durchsichtigen Hintergrund, sondern einen hellen
# (weiß oder ein aufgemaltes graues Karomuster), wird dieser entfernt.
# Das Skript schneidet leere Ränder ab, macht das Bild überall ganz deckend
# (KI-Bilder sind oft ein kleines bisschen durchsichtig) und verkleinert es
# auf doppelte Spielgröße für scharfe Retina-Darstellung. Ergebnis:
# assets/bilder/<name>.png
#
# Braucht das Python-Modul Pillow:  python3 -m pip install --user pillow
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

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
BACKGROUND_LIGHT = 205  # so hell muss der Hintergrund mindestens sein …
BACKGROUND_GRAY = 30  # … und so wenig farbig (Sättigung von 0 bis 255)


def remove_background(image):
    """Entfernt hellen, grauen Hintergrund, der vom Bildrand aus zusammenhängt."""
    rgb = image.convert('RGB')
    light = rgb.convert('L').point(lambda v: 255 if v >= BACKGROUND_LIGHT else 0)
    gray = rgb.convert('HSV').getchannel('S').point(lambda v: 255 if v <= BACKGROUND_GRAY else 0)
    mask = Image.composite(light, Image.new('L', rgb.size, 0), gray)
    # Vom Rand aus füllen: Nur Hintergrund, der den Rand berührt, wird entfernt
    w, h = mask.size
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    border += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for point in border:
        if mask.getpixel(point) == 255:
            ImageDraw.floodfill(mask, point, 128)
    alpha = Image.eval(mask, lambda v: 0 if v == 128 else 255)
    # Kante etwas nach innen ziehen (kein heller Saum) und weich machen
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    result = rgb.convert('RGBA')
    result.putalpha(alpha)
    return result


source, name = Path(sys.argv[1]), sys.argv[2]
if name not in SIZES:
    sys.exit(f'Unbekannter Name „{name}“. Möglich: {", ".join(SIZES)}')

image = Image.open(source)
if 'A' not in image.getbands() or image.getchannel('A').getextrema()[0] > CLEAR:
    image = remove_background(image)
image = image.convert('RGBA')
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
