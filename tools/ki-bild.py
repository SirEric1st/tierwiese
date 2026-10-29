# Bereitet ein KI-Bild (PNG mit durchsichtigem Hintergrund) für das Spiel vor.
# Aufruf im Projektordner:  python3 tools/ki-bild.py <bild.png> <name>
# Beispiel:                 python3 tools/ki-bild.py ~/Downloads/igel.png igel
#
# Sammelbild (Sheet) mit 2 × 2 Motiven: vier Namen angeben, in der Reihenfolge
# oben links, oben rechts, unten links, unten rechts. „-“ überspringt ein Feld.
# Beispiel:  python3 tools/ki-bild.py sheet1.png ente eichhoernchen frosch -
#
# Hat das Bild keinen durchsichtigen Hintergrund, sondern einen hellen
# (weiß oder ein aufgemaltes graues Karomuster), wird dieser entfernt.
# Das Skript schneidet leere Ränder ab, macht das Bild überall ganz deckend
# (KI-Bilder sind oft ein kleines bisschen durchsichtig) und verkleinert es
# auf doppelte Spielgröße für scharfe Retina-Darstellung. Ergebnis:
# assets/bilder/<name>.png
#
# Braucht das Python-Modul Pillow:  python3 -m pip install --user pillow
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

# Größte Breite und Höhe im Spiel (in Punkten), in die das Bild passen muss.
# Steht ein Name nicht hier, gilt die Größe der Vektorgrafik in assets/grafik/.
SIZES = {
    'igel': (130, 100),
    'ente': (120, 100),
    'ente-schwimmt': (120, 100),
    'eichhoernchen': (115, 125),
    'frosch': (90, 75),
    'biber': (115, 110),
}
RETINA = 2
# Schwimmende Tiere: aus dem stehenden Bild wird unten so viel abgeschnitten
# (Anteil der Höhe, der bleibt), dass Beine und Füße „unter Wasser“ sind
CUT_BOTTOM = {'ente-schwimmt': 0.8}
CLEAR = 10  # Pixel, die fast durchsichtig sind, werden ganz durchsichtig
SOLID = 240  # Pixel, die fast deckend sind, werden ganz deckend
MARGIN = 4  # etwas Luft um das Bild lassen
BACKGROUND_LIGHT = 205  # so hell muss der Hintergrund mindestens sein …
BACKGROUND_GRAY = 30  # … und so wenig farbig (Sättigung von 0 bis 255)
# Sammelbilder haben rein weißen Hintergrund: strenger sein, damit weiße
# Stellen am Tier (z. B. das Ohr vom Dachs) nicht verschwinden
SHEET_LIGHT = 238
SHEET_GRAY = 18
# Tiere mit dünnen Fühlern: Kante weniger stark nach innen ziehen, sonst verschwinden sie
THIN = {'zitronenfalter', 'biene', 'marienkaefer'}
# Hier ist Hintergrund eingeschlossen (z. B. zwischen den Beinen) und muss auch weg.
# Die Zahl sagt, ab welcher Höhe gesucht wird (0 = überall, 0.7 = nur im unteren
# Drittel, damit weiße Streifen am Flügel der Ente bleiben)
HOLES = {'amsel': 0, 'hase': 0, 'fuchs': 0, 'ente': 0.7}
HOLE_SIZE = 400  # so groß (Pixel) muss ein eingeschlossener Fleck sein; Lichtpunkte in Augen sind kleiner
EDGE = 6  # so nah am Feldrand gilt ein Teil als Stück vom Nachbarbild
CRUMBS = 0.01  # lose Krümel, kleiner als 1 % des Hauptbilds, werden entfernt


def label_parts(mask, value):
    """Färbt jede zusammenhängende Fläche mit Wert value einzeln ein (1, 2, 3 …).
    Gibt die Flächengrößen zurück: {Farbe: Pixelzahl}."""
    w, h = mask.size
    pixels = mask.load()
    label = 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y] == value and label < 250:
                label += 1
                ImageDraw.floodfill(mask, (x, y), label)
    histogram = mask.histogram()
    return {i: histogram[i] for i in range(1, label + 1)}


def remove_crumbs(alpha, in_sheet):
    """Entfernt kleine lose Teile (z. B. abgerissene Fühlerspitzen). Im Sammelbild
    auch alles, was den Feldrand berührt – das sind Stücke vom Nachbarbild."""
    solid = alpha.point(lambda v: 255 if v > 0 else 0)
    sizes = label_parts(solid, 255)
    if not sizes:
        return alpha
    edge = set()
    if in_sheet:
        w, h = solid.size
        pixels = solid.load()
        near = range(EDGE)  # knapp neben dem Rand zählt auch (die Kante wurde nach innen gezogen)
        edge = {pixels[x, y] for x in range(w) for d in near for y in (d, h - 1 - d)}
        edge |= {pixels[x, y] for y in range(h) for d in near for x in (d, w - 1 - d)}
    biggest = max(sizes.values())  # das Hauptbild bleibt immer, auch wenn es knapp über den Rand ragt
    keep = {i for i, size in sizes.items() if size == biggest or (size >= biggest * CRUMBS and i not in edge)}
    lut = [255 if i in keep or i == 255 else 0 for i in range(256)]
    return Image.composite(alpha, Image.new('L', alpha.size, 0), solid.point(lut))


def remove_background(image, name, in_sheet):
    """Entfernt hellen, grauen Hintergrund, der vom Bildrand aus zusammenhängt."""
    rgb = image.convert('RGB')
    min_light = SHEET_LIGHT if in_sheet else BACKGROUND_LIGHT
    max_gray = SHEET_GRAY if in_sheet else BACKGROUND_GRAY
    light = rgb.convert('L').point(lambda v: 255 if v >= min_light else 0)
    gray = rgb.convert('HSV').getchannel('S').point(lambda v: 255 if v <= max_gray else 0)
    mask = Image.composite(light, Image.new('L', rgb.size, 0), gray)
    # Vom Rand aus füllen: Nur Hintergrund, der den Rand berührt, wird entfernt
    w, h = mask.size
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    border += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for point in border:
        if mask.getpixel(point) == 255:
            ImageDraw.floodfill(mask, point, 128)
    if name in HOLES:
        # Große eingeschlossene helle Flecken sind auch Hintergrund
        sizes = label_parts(mask, 255)
        top = round(mask.height * HOLES[name])
        lower = mask.crop((0, top, mask.width, mask.height)).histogram()
        holes = {i for i, size in sizes.items() if size >= HOLE_SIZE and lower[i] == size}
        mask = mask.point(lambda v: 128 if v in holes else v)
    alpha = Image.eval(mask, lambda v: 0 if v == 128 else 255)
    # Kante etwas nach innen ziehen (kein heller Saum) und weich machen
    alpha = alpha.filter(ImageFilter.MinFilter(3 if name in THIN else 5)).filter(ImageFilter.GaussianBlur(1.2))
    alpha = remove_crumbs(alpha, in_sheet)
    result = rgb.convert('RGBA')
    result.putalpha(alpha)
    return result


ROOT = Path(__file__).resolve().parent.parent


def game_size(name):
    """Größe im Spiel: aus SIZES oder aus der Vektorgrafik gleichen Namens"""
    if name in SIZES:
        return SIZES[name]
    vector = ROOT / 'assets' / 'grafik' / f'{name}.svg'
    if not vector.exists():
        sys.exit(f'Unbekannter Name „{name}“ – es gibt keine Grafik assets/grafik/{name}.svg')
    head = vector.read_text(encoding='utf-8')[:300]
    w, h = re.search(r'width="([\d.]+)" height="([\d.]+)"', head).groups()
    return float(w), float(h)


def prepare(image, name, in_sheet=False):
    max_w, max_h = game_size(name)
    if 'A' not in image.getbands() or image.getchannel('A').getextrema()[0] > CLEAR:
        image = remove_background(image, name, in_sheet)
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

    scale = min(max_w * RETINA / image.width, max_h * RETINA / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    image = image.resize(size, Image.LANCZOS)
    if name in CUT_BOTTOM:
        image = image.crop((0, 0, image.width, round(image.height * CUT_BOTTOM[name])))
        size = image.size

    target = ROOT / 'assets' / 'bilder' / f'{name}.png'
    target.parent.mkdir(exist_ok=True)
    image.save(target, optimize=True)
    print(f'{target.name}: {size[0]} × {size[1]} Pixel, {target.stat().st_size // 1024} KB')


source, names = Path(sys.argv[1]), sys.argv[2:]
sheet = Image.open(source)
if len(names) == 1:
    prepare(sheet, names[0])
elif len(names) == 4:
    half_w, half_h = sheet.width // 2, sheet.height // 2
    for i, name in enumerate(names):
        if name == '-':
            continue
        x, y = (i % 2) * half_w, (i // 2) * half_h
        prepare(sheet.crop((x, y, x + half_w, y + half_h)), name, in_sheet=True)
else:
    sys.exit('Bitte einen Namen (Einzelbild) oder vier Namen (Sammelbild 2 × 2) angeben.')
