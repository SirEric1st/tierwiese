# Erzeugt die SVG-Grafiken für das Spiel.
# Aufruf im Projektordner: python3 tools/grafik.py assets/grafik
#
# Viele Formen (Stacheln, Blätter, Grashalme, Steine) wiederholen sich, darum
# werden die Bilder hier per Programm gezeichnet statt von Hand. Nach einer
# Änderung einfach neu ausführen; die SVG-Dateien werden überschrieben.
import math
import random
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)


def svg(name, w, h, defs, body, note, size=1):
    """size: Anzeigegröße im Spiel im Verhältnis zur Zeichenfläche (z. B. 0.7 = kleiner)"""
    text = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w * size:g}" height="{h * size:g}" viewBox="0 0 {w} {h}">
  <!-- {note} Eigene Zeichnung für das Spiel Tierwiese. -->
  <defs>
{defs}
  </defs>
{body}
</svg>
'''
    (OUT / f'{name}.svg').write_text(text, encoding='utf-8')


def stop(o, c, a):
    opacity = '' if a is None else ' stop-opacity="%s"' % a
    return '<stop offset="%s" stop-color="%s"%s/>' % (o, c, opacity)


def radial(id_, stops, cx='35%', cy='30%', r='75%', fx=None, fy=None):
    s = ''.join(stop(o, c, a) for o, c, a in stops)
    f = f' fx="{fx}" fy="{fy}"' if fx else ''
    return f'    <radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}"{f}>{s}</radialGradient>'


def linear(id_, stops, x1=0, y1=0, x2=0, y2=1):
    s = ''.join(stop(o, c, a) for o, c, a in stops)
    return f'    <linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def st(*pairs):
    """Gradient-Stopps: ("0", "#fff") oder ("0", "#000", 0.3)"""
    return [(p[0], p[1], p[2] if len(p) > 2 else None) for p in pairs]


SHADOW_DEF = radial('schatten', st(('0', '#1d3b14', 0.35), ('0.7', '#1d3b14', 0.15), ('1', '#1d3b14', 0)), cx='50%', cy='50%', r='50%')


def ground_shadow(cx, cy, rx, ry):
    return f'  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#schatten)"/>'


def eye(x, y, r, iris='#2b1a0e'):
    """Großes, glänzendes Auge mit zwei Lichtpunkten."""
    return (
        f'  <circle cx="{x}" cy="{y}" r="{r * 1.25:.1f}" fill="#fff" stroke="#00000022" stroke-width="1"/>\n'
        f'  <circle cx="{x + r * 0.15:.1f}" cy="{y + r * 0.1:.1f}" r="{r:.1f}" fill="{iris}"/>\n'
        f'  <circle cx="{x + r * 0.15:.1f}" cy="{y + r * 0.1:.1f}" r="{r * 0.55:.1f}" fill="#0d0704"/>\n'
        f'  <circle cx="{x - r * 0.2:.1f}" cy="{y - r * 0.35:.1f}" r="{r * 0.38:.1f}" fill="#fff"/>\n'
        f'  <circle cx="{x + r * 0.5:.1f}" cy="{y + r * 0.45:.1f}" r="{r * 0.17:.1f}" fill="#fff" opacity="0.9"/>'
    )


def blob_path(cx, cy, rx, ry, n, bump, seed, start=0):
    """Wolkige Umrisslinie (für Baumkronen, Büsche, Gedankenblase)."""
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = start + i / n * math.tau
        pts.append((cx + math.cos(a) * rx, cy + math.sin(a) * ry))
    d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        nx, ny = mx - cx, my - cy
        ln = math.hypot(nx, ny) or 1
        b = bump * (0.8 + rnd.random() * 0.4)
        d += f' Q{mx + nx / ln * b:.1f},{my + ny / ln * b:.1f} {x2:.1f},{y2:.1f}'
    return d + ' Z'


# ---------------------------------------------------------------- Gras
def gras():
    rnd = random.Random(7)
    size = 256
    body = [f'  <rect width="{size}" height="{size}" fill="#86c96f"/>']
    # weiche hellere und dunklere Flecken (mit Rand-Kopien, damit es nahtlos kachelt)
    for _ in range(14):
        x, y = rnd.uniform(0, size), rnd.uniform(0, size)
        r = rnd.uniform(25, 55)
        g = rnd.choice(['hell', 'dunkel'])
        for dx in (-size, 0, size):
            for dy in (-size, 0, size):
                body.append(f'  <circle cx="{x + dx:.0f}" cy="{y + dy:.0f}" r="{r:.0f}" fill="url(#{g})"/>')
    for _ in range(110):
        x, y = rnd.uniform(6, size - 6), rnd.uniform(10, size - 4)
        c = rnd.choice(['#6fb75a', '#78bf62', '#97d47d', '#69ad55', '#a3dc88'])
        h = rnd.uniform(6, 11)
        lean = rnd.uniform(-3, 3)
        body.append(f'  <path d="M{x - 2:.1f},{y:.1f} Q{x + lean / 2:.1f},{y - h / 2:.1f} {x + lean:.1f},{y - h:.1f} Q{x + 0.5:.1f},{y - h / 2:.1f} {x + 2:.1f},{y:.1f} Z" fill="{c}"/>')
    defs = '\n'.join([
        radial('hell', st(('0', '#a5dc8a', 0.55), ('1', '#a5dc8a', 0)), cx='50%', cy='50%', r='50%'),
        radial('dunkel', st(('0', '#62a94f', 0.35), ('1', '#62a94f', 0)), cx='50%', cy='50%', r='50%'),
    ])
    svg('gras', size, size, defs, '\n'.join(body), 'Nahtlos kachelbares Gras.')


# ---------------------------------------------------------------- Blumen
def blume(name, light, dark):
    defs = '\n'.join([
        radial('blatt', st(('0', light), ('1', dark)), cx='50%', cy='60%', r='70%'),
        radial('mitte', st(('0', '#ffe27a'), ('1', '#f08a1c')), cx='40%', cy='35%', r='70%'),
        linear('stiel', st(('0', '#6fb05a'), ('1', '#3f7f34')), 0, 0, 1, 0),
    ])
    body = ['  <path d="M15,19 Q14,28 16,35" stroke="url(#stiel)" stroke-width="3" fill="none" stroke-linecap="round"/>',
            '  <path d="M15.5,29 Q21,24 25,27 Q21,31 15.5,29 Z" fill="#5da24a"/>']
    for i in range(5):
        a = i * 72 - 90
        body.append(f'  <ellipse cx="16" cy="7.5" rx="5" ry="7" fill="url(#blatt)" stroke="{dark}" stroke-width="0.8" transform="rotate({a + 90} 16 14)"/>')
    body.append('  <circle cx="16" cy="14" r="4.6" fill="url(#mitte)" stroke="#d07418" stroke-width="0.8"/>')
    body.append('  <circle cx="14.6" cy="12.6" r="1.4" fill="#fff" opacity="0.8"/>')
    svg(name, 32, 36, defs, '\n'.join(body), 'Kleine Wiesenblume.')


# ---------------------------------------------------------------- Schatten
def schatten():
    svg('schatten', 80, 24, SHADOW_DEF, '  <ellipse cx="40" cy="12" rx="40" ry="12" fill="url(#schatten)"/>', 'Weicher Schatten unter der Figur.')


# ---------------------------------------------------------------- Figur
# Die Spielfigur zeichnet src/figure.js; das Ersatzbild erzeugt tools/figur.mjs


def igel():
    cx, cy = 54, 56
    pts = []
    n = 17
    # Stacheln: abwechselnd Spitze und Kerbe; Anfang und Ende liegen als Kerbe im Körper
    for i in range(n * 2 + 1):
        a = math.radians(170 - i * (160 / (n * 2)))
        tip = i % 2 == 1
        rx, ry = (54, 46) if tip else (38, 28)
        pts.append((cx + math.cos(a) * rx, cy - math.sin(a) * ry))
    spikes = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + f' L{cx + 26},{cy + 12} L{cx - 30},{cy + 12} Z'
    hl = []
    for i in range(1, n * 2, 4):
        a = math.radians(170 - i * (160 / (n * 2)))
        x1, y1 = cx + math.cos(a) * 34, cy - math.sin(a) * 26
        x2, y2 = cx + math.cos(a) * 46, cy - math.sin(a) * 37
        hl.append(f'  <path d="M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}" stroke="#c39469" stroke-width="2" stroke-linecap="round" opacity="0.7"/>')
    defs = '\n'.join([
        linear('stacheln', st(('0', '#8a5d3b'), ('1', '#4a2d18'))),
        radial('koerper', st(('0', '#9a6c47'), ('1', '#5e3b22'))),
        radial('gesicht', st(('0', '#f7dcb4'), ('1', '#d6a874')), cx='45%', cy='35%'),
        radial('nase', st(('0', '#5a3a28'), ('1', '#160c06'))),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(60, 78, 52, 7)}
  <ellipse cx="34" cy="76" rx="9" ry="5" fill="#4a2d18"/>
  <ellipse cx="78" cy="76" rx="9" ry="5" fill="#4a2d18"/>
  <path d="{spikes}" fill="url(#stacheln)" stroke="#33200f" stroke-width="1.6" stroke-linejoin="round"/>
{chr(10).join(hl)}
  <ellipse cx="{cx}" cy="{cy + 4}" rx="38" ry="22" fill="url(#koerper)"/>
  <path d="M70,46 Q86,36 100,48 Q108,52 116,57 Q118,62 112,65 Q100,72 86,72 Q68,72 66,60 Q65,51 70,46 Z" fill="url(#gesicht)" stroke="#b5875a" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="76" cy="42" r="6" fill="#e3b989" stroke="#b5875a" stroke-width="1.4"/>
  <circle cx="76.5" cy="42.5" r="3" fill="#c48d63"/>
  <circle cx="114" cy="59" r="5.5" fill="url(#nase)"/>
  <circle cx="112.5" cy="57.3" r="1.6" fill="#fff" opacity="0.8"/>
{eye(92, 52, 5.6)}
  <ellipse cx="93" cy="65" rx="5" ry="3" fill="#ff8f8f" opacity="0.5"/>
  <path d="M100,66 Q104,69 108,66" stroke="#8a5a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'''
    svg('igel', 120, 84, defs, body, 'Igel.')


# ---------------------------------------------------------------- Ente
def ente(name, swimming):
    defs = '\n'.join([
        linear('koerper', st(('0', '#e4e0d8'), ('1', '#a8a398'))),
        radial('brust', st(('0', '#a8714c'), ('1', '#6e4128'))),
        linear('fluegel', st(('0', '#a49d92'), ('1', '#6f6a62'))),
        radial('kopf', st(('0', '#4fbf7e'), ('0.55', '#24784a'), ('1', '#14492c')), cx='40%', cy='30%'),
        linear('schnabel', st(('0', '#ffe066'), ('1', '#e3a21a'))),
        linear('wasser', st(('0', '#ffffff', 0.0), ('1', '#ffffff', 0.0))),
        SHADOW_DEF,
    ])
    feet = '''{shadow}
  <path d="M38,92 L50,92 L46,86 Z" fill="#f29a2e" stroke="#c46f12" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M56,92 L68,92 L64,86 Z" fill="#f29a2e" stroke="#c46f12" stroke-width="1.2" stroke-linejoin="round"/>'''.format(shadow=ground_shadow(54, 91, 42, 6))
    duck = f'''  <!-- Schwanzfedern mit Locke -->
  <path d="M14,56 Q4,50 8,42 Q12,48 20,50 Z" fill="#3a3a38" stroke="#222" stroke-width="1.2"/>
  <path d="M15,45 Q13,37 19,37" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Körper -->
  <path d="M12,58 Q14,46 34,46 L72,46 Q90,50 90,66 Q88,86 56,87 Q24,87 15,72 Q11,64 12,58 Z" fill="url(#koerper)" stroke="#8a857a" stroke-width="1.6"/>
  <ellipse cx="74" cy="62" rx="16" ry="15" fill="url(#brust)" stroke="#5a3420" stroke-width="1.4"/>
  <!-- Flügel mit blauem Spiegel -->
  <path d="M22,58 Q36,50 58,56 Q64,64 54,72 Q36,76 22,66 Z" fill="url(#fluegel)" stroke="#5f5a52" stroke-width="1.4"/>
  <path d="M34,64 L52,63 L50,68 L33,69 Z" fill="#3d5fc9" stroke="#fff" stroke-width="1.2"/>
  <path d="M26,58 Q38,54 50,57" stroke="#fff" stroke-opacity="0.35" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Hals mit weißem Ring, Kopf -->
  <path d="M68,52 Q66,40 72,32 L86,32 Q88,44 84,54 Z" fill="#1f6b41"/>
  <path d="M67.5,47 Q76,50 85,47" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <circle cx="80" cy="27" r="17" fill="url(#kopf)" stroke="#0f3a22" stroke-width="1.6"/>
  <path d="M70,18 Q76,13 84,14" stroke="#9ff0c0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.7"/>
  <!-- Schnabel -->
  <path d="M92,28 Q100,23 112,28 Q113,33 106,35 Q98,36 92,33 Z" fill="url(#schnabel)" stroke="#b77b0e" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M93,31 Q102,32 111,30" stroke="#b77b0e" stroke-width="1" fill="none"/>
  <ellipse cx="110" cy="28.5" rx="2" ry="1.4" fill="#5a4010"/>
{eye(84, 23, 4.6)}'''
    if swimming:
        body = f'''  <g transform="translate(0,20)">
{duck}
  </g>
  <!-- Wellen rund um den Körper -->
  <path d="M6,90 Q18,84 30,90 T54,90 T78,90 T102,90" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.85"/>
  <path d="M14,95 Q24,91 34,95 M60,95 Q72,91 84,95" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>'''
    else:
        body = feet + '\n' + duck
    svg(name, 116, 96, defs, body, 'Stockente (Erpel)' + (' beim Schwimmen.' if swimming else '.'))


# ---------------------------------------------------------------- Eichhörnchen
def eichhoernchen():
    defs = '\n'.join([
        radial('schwanz', st(('0', '#f0954a'), ('0.6', '#c95f25'), ('1', '#9a4316')), cx='45%', cy='40%'),
        radial('fell', st(('0', '#e88545'), ('1', '#a84a1c')), cx='40%', cy='30%'),
        radial('bauch', st(('0', '#fff4e0'), ('1', '#efd2a8'))),
        radial('nuss', st(('0', '#d9a066'), ('1', '#8a5428'))),
        radial('nase', st(('0', '#5a3a28'), ('1', '#160c06'))),
        SHADOW_DEF,
    ])
    tail = blob_path(30, 58, 24, 48, 11, 5, 3)
    body = f'''{ground_shadow(58, 114, 42, 6)}
  <!-- Buschiger Schwanz -->
  <path d="{tail}" fill="url(#schwanz)" stroke="#7a3410" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M24,30 Q34,50 30,88" stroke="#ffb27a" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.45"/>
  <!-- Körper -->
  <path d="M44,104 Q38,80 50,66 Q62,56 76,64 Q86,76 82,100 Q78,112 62,112 Q48,112 44,104 Z" fill="url(#fell)" stroke="#7a3410" stroke-width="1.8"/>
  <path d="M60,74 Q72,72 76,86 Q78,102 66,106 Q56,104 56,90 Q56,78 60,74 Z" fill="url(#bauch)"/>
  <!-- Füße -->
  <ellipse cx="52" cy="111" rx="11" ry="5.5" fill="#b9541f" stroke="#7a3410" stroke-width="1.4"/>
  <ellipse cx="74" cy="111" rx="11" ry="5.5" fill="#b9541f" stroke="#7a3410" stroke-width="1.4"/>
  <!-- Nuss in den Pfoten -->
  <ellipse cx="84" cy="80" rx="8" ry="9" fill="url(#nuss)" stroke="#6a3a14" stroke-width="1.4"/>
  <path d="M78,75 Q84,70 90,75" stroke="#6a3a14" stroke-width="1.2" fill="none"/>
  <circle cx="80" cy="83" r="4.5" fill="#d0682b" stroke="#7a3410" stroke-width="1.2"/>
  <circle cx="88" cy="83" r="4.5" fill="#d0682b" stroke="#7a3410" stroke-width="1.2"/>
  <!-- Ohren mit Pinseln -->
  <path d="M62,34 Q60,14 68,6 Q72,18 76,32 Z" fill="url(#fell)" stroke="#7a3410" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M80,30 Q84,10 94,4 Q95,18 92,32 Z" fill="url(#fell)" stroke="#7a3410" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M68,6 Q66,0 70,-2 M94,4 Q94,-2 98,-3" stroke="#7a3410" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <!-- Kopf -->
  <path d="M58,50 Q56,30 78,28 Q96,28 102,44 Q110,48 108,56 Q104,64 92,66 Q72,70 62,62 Q58,58 58,50 Z" fill="url(#fell)" stroke="#7a3410" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M84,54 Q96,52 106,56 Q102,64 90,64 Q84,62 84,54 Z" fill="url(#bauch)"/>
  <circle cx="107" cy="52" r="3.6" fill="url(#nase)"/>
  <circle cx="106" cy="50.8" r="1.1" fill="#fff" opacity="0.8"/>
{eye(86, 44, 5.6)}
  <ellipse cx="80" cy="58" rx="4.5" ry="2.8" fill="#ff8f8f" opacity="0.5"/>'''
    svg('eichhoernchen', 110, 120, defs, body, 'Eichhörnchen mit Nuss.')


# ---------------------------------------------------------------- Bäume
def baum(name, light, mid, dark, line, nuts):
    rnd = random.Random(name)
    defs = [
        linear('stamm', st(('0', '#7a4a26'), ('0.45', '#a06a3e'), ('1', '#5a3318')), 0, 0, 1, 0),
        radial('blatt', st(('0', light), ('0.6', mid), ('1', dark)), cx='35%', cy='30%', r='80%'),
        radial('blattDunkel', st(('0', mid), ('1', dark)), cx='40%', cy='35%', r='80%'),
        radial('nuss', st(('0', '#e0b27a'), ('1', '#8a5a2c')), cx='35%', cy='30%'),
        radial('apfel', st(('0', '#ff9a8a'), ('0.6', '#e2423a'), ('1', '#a82020')), cx='35%', cy='30%'),
        SHADOW_DEF,
    ]
    body = [ground_shadow(90, 220, 66, 10),
            '  <path d="M74,224 Q80,200 79,150 L101,150 Q100,200 106,224 Q90,228 74,224 Z" fill="url(#stamm)" stroke="#4a2810" stroke-width="1.8" stroke-linejoin="round"/>',
            '  <path d="M86,200 Q84,180 86,160" stroke="#4a2810" stroke-width="1.4" fill="none" opacity="0.6"/>',
            '  <path d="M96,190 Q98,176 95,166" stroke="#4a2810" stroke-width="1.2" fill="none" opacity="0.5"/>',
            '  <path d="M90,160 Q72,146 60,148" stroke="#5a3318" stroke-width="6" fill="none" stroke-linecap="round"/>']
    back = [(50, 118, 40), (130, 118, 40), (90, 128, 44)]
    front = [(90, 70, 56), (44, 96, 40), (136, 96, 40), (62, 54, 36), (118, 56, 36), (90, 108, 42)]
    for x, y, r in back:
        body.append(f'  <path d="{blob_path(x, y, r, r * 0.92, 9, 4, rnd.random())}" fill="url(#blattDunkel)" stroke="{line}" stroke-width="1.8" stroke-linejoin="round"/>')
    for x, y, r in front:
        body.append(f'  <path d="{blob_path(x, y, r, r * 0.92, 10, 4, rnd.random())}" fill="url(#blatt)" stroke="{line}" stroke-width="1.8" stroke-linejoin="round"/>')
    # Lichtkanten oben links
    for x, y, r in front[:4]:
        body.append(f'  <path d="M{x - r * 0.6:.0f},{y - r * 0.35:.0f} Q{x - r * 0.3:.0f},{y - r * 0.75:.0f} {x + r * 0.15:.0f},{y - r * 0.7:.0f}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="4" fill="none" stroke-linecap="round"/>')
    if nuts == 'apfel':
        for x, y in [(52, 100), (110, 116), (140, 88), (80, 60), (40, 124), (126, 132), (98, 90), (66, 128), (120, 70)]:
            body.append(f'  <circle cx="{x}" cy="{y}" r="8.5" fill="url(#apfel)" stroke="#8a1a14" stroke-width="1.3"/>')
            body.append(f'  <circle cx="{x - 3}" cy="{y - 3}" r="2.2" fill="#fff" opacity="0.6"/>')
    elif nuts:
        for x, y in [(52, 100), (110, 116), (140, 88), (80, 60), (40, 124), (126, 132), (98, 90), (66, 128)]:
            body.append(f'  <circle cx="{x}" cy="{y}" r="7.5" fill="url(#nuss)" stroke="#6a3e18" stroke-width="1.3"/>')
            body.append(f'  <path d="M{x},{y - 7} L{x},{y + 7}" stroke="#6a3e18" stroke-width="0.9" opacity="0.6"/>')
            body.append(f'  <circle cx="{x - 2.5}" cy="{y - 2.5}" r="2" fill="#fff" opacity="0.6"/>')
    note = {'apfel': 'Obstbaum (Apfelbaum).', True: 'Nussbaum (Walnuss).'}.get(nuts, 'Laubbaum.')
    svg(name, 180, 230, '\n'.join(defs), '\n'.join(body), note)


# ---------------------------------------------------------------- Teich
def teich():
    rnd = random.Random(11)
    defs = '\n'.join([
        radial('wasser', st(('0', '#8fd6ff'), ('0.55', '#4aa5e8'), ('1', '#2b6fb8')), cx='45%', cy='40%', r='60%'),
        radial('stein', st(('0', '#d8d3ca'), ('1', '#8f897f')), cx='35%', cy='30%'),
        linear('ufer', st(('0', '#a89f8f'), ('1', '#7d7466'))),
        radial('blatt', st(('0', '#7fcf5f'), ('1', '#3c8a34'))),
        radial('bluete', st(('0', '#fff0f6'), ('1', '#ff9ec4'))),
    ])
    body = ['  <ellipse cx="140" cy="84" rx="138" ry="74" fill="url(#ufer)"/>']
    # Steine rund um das Ufer
    for i in range(26):
        a = i / 26 * math.tau + rnd.uniform(-0.05, 0.05)
        x = 140 + math.cos(a) * 130
        y = 82 + math.sin(a) * 68
        r = rnd.uniform(9, 14)
        body.append(f'  <ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r:.1f}" ry="{r * 0.75:.1f}" fill="url(#stein)" stroke="#6e685f" stroke-width="1.2"/>')
    body += [
        '  <ellipse cx="140" cy="80" rx="125" ry="63" fill="url(#wasser)" stroke="#215a96" stroke-width="2"/>',
        '  <ellipse cx="140" cy="80" rx="125" ry="63" fill="none" stroke="#1b4f86" stroke-opacity="0.35" stroke-width="10" transform="translate(0,4)"/>',
        '  <path d="M62,58 Q90,46 120,50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.55"/>',
        '  <path d="M132,48 Q140,47 146,48" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.45"/>',
        '  <path d="M150,104 Q170,110 192,104" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.4"/>',
        '  <!-- Seerose -->',
        '  <path d="M206,74 A18,11 0 1,1 220,86 L208,80 Z" fill="url(#blatt)" stroke="#2f6e28" stroke-width="1.4"/>',
        '  <path d="M80,100 A13,8 0 1,1 92,108 L82,104 Z" fill="url(#blatt)" stroke="#2f6e28" stroke-width="1.2"/>',
    ]
    for i in range(6):
        body.append(f'  <ellipse cx="206" cy="68" rx="3.4" ry="7" fill="url(#bluete)" stroke="#e07aa4" stroke-width="0.8" transform="rotate({i * 60} 206 74)"/>')
    body.append('  <circle cx="206" cy="74" r="3" fill="#ffd84a"/>')
    svg('teich', 280, 160, defs, '\n'.join(body), 'Teich mit Steinufer und Seerose.')


# ---------------------------------------------------------------- Schilf
def schilf():
    defs = '\n'.join([
        linear('halm', st(('0', '#8cc45a'), ('1', '#4e8a35')), 0, 0, 1, 0),
        linear('blatt', st(('0', '#9ed46a'), ('1', '#5a9a3c')), 0, 0, 1, 1),
        radial('rispe', st(('0', '#f0dcb4'), ('0.6', '#c09a68'), ('1', '#8a6440')), cx='40%', cy='30%'),
    ])
    body = []
    stalks = [(20, 34, -8), (38, 18, 0), (56, 26, 7), (76, 40, 12), (48, 46, -6)]
    for x, top, lean in stalks:
        body.append(f'  <path d="M{x},148 Q{x + lean * 0.3:.0f},{(148 + top) / 2:.0f} {x + lean},{top + 18}" stroke="url(#halm)" stroke-width="3.6" fill="none" stroke-linecap="round"/>')
    for x, top, lean in stalks:
        tip_x = x + lean * 2 + (14 if lean >= 0 else -14)
        body.append(f'  <path d="M{x},140 Q{x + lean + 4},{top + 70} {tip_x},{top + 56} Q{x + lean - 2},{top + 76} {x + 3},140 Z" fill="url(#blatt)" stroke="#3f7a2c" stroke-width="1"/>')
    for x, top, lean in stalks:
        px = x + lean
        # fedrige Rispe, leicht überhängend
        body.append(f'  <path d="M{px},{top + 22} Q{px - 9},{top + 10} {px - 3},{top - 2} Q{px + 4},{top - 8} {px + 9},{top + 2} Q{px + 11},{top + 14} {px},{top + 22} Z" fill="url(#rispe)" stroke="#7a5534" stroke-width="1.2"/>')
        body.append(f'  <path d="M{px},{top + 18} Q{px},{top + 6} {px + 3},{top}" stroke="#fff4dc" stroke-width="1.4" fill="none" opacity="0.7"/>')
    svg('schilf', 100, 150, defs, '\n'.join(body), 'Schilf mit Blütenrispen.')


# ---------------------------------------------------------------- Laubhaufen
def laubhaufen():
    rnd = random.Random(5)
    colors = [('#f6b24a', '#d9762b'), ('#f2c94c', '#d89a20'), ('#e2683a', '#b0401e'), ('#c98a4a', '#8a5426'), ('#f08a3a', '#c45a1c')]
    defs = [SHADOW_DEF, radial('huegel', st(('0', '#a0612c'), ('1', '#6a3a18')), cx='50%', cy='30%')]
    for i, (l, d) in enumerate(colors):
        defs.append(radial(f'laub{i}', st(('0', l), ('1', d)), cx='40%', cy='35%'))
    body = [ground_shadow(70, 82, 66, 8),
            '  <path d="M24,78 Q32,38 70,30 Q108,38 116,78 Q70,86 24,78 Z" fill="url(#huegel)" stroke="#5a3010" stroke-width="1.5"/>']
    # Blätter von unten nach oben stapeln; die unterste Reihe ragt über den Rand
    for row in range(7):
        y = 82 - row * 9.5
        half = 56 - row * 8
        for _ in range(16 - row * 2):
            x = 70 + rnd.uniform(-half, half)
            yy = y + rnd.uniform(-3, 3)
            rot = rnd.uniform(-60, 60)
            i = rnd.randrange(len(colors))
            dark = colors[i][1]
            body.append(f'  <g transform="translate({x:.1f},{yy:.1f}) rotate({rot:.0f})"><path d="M-13,0 Q-4,-8 13,0 Q-4,8 -13,0 Z" fill="url(#laub{i})" stroke="{dark}" stroke-width="1"/><path d="M-11,0 L11,0" stroke="{dark}" stroke-width="0.9"/></g>')
    svg('laubhaufen', 140, 90, '\n'.join(defs), '\n'.join(body), 'Laubhaufen aus Herbstblättern.')


# ---------------------------------------------------------------- Busch
def busch():
    rnd = random.Random(9)
    defs = '\n'.join([
        radial('blatt', st(('0', '#7cc96a'), ('0.6', '#3f9142'), ('1', '#28662c')), cx='35%', cy='30%', r='80%'),
        radial('blattDunkel', st(('0', '#3f9142'), ('1', '#1f5523')), cx='40%', cy='35%', r='80%'),
        SHADOW_DEF,
    ])
    body = [ground_shadow(70, 100, 62, 9)]
    for x, y, r in [(36, 76, 28), (104, 76, 28), (70, 82, 30)]:
        body.append(f'  <path d="{blob_path(x, y, r, r * 0.9, 9, 3.5, rnd.random())}" fill="url(#blattDunkel)" stroke="#1a4a1e" stroke-width="1.8" stroke-linejoin="round"/>')
    for x, y, r in [(44, 64, 28), (96, 64, 28), (70, 50, 34), (70, 78, 26)]:
        body.append(f'  <path d="{blob_path(x, y, r, r * 0.9, 9, 3.5, rnd.random())}" fill="url(#blatt)" stroke="#1a4a1e" stroke-width="1.8" stroke-linejoin="round"/>')
    for x, y, r in [(70, 50, 34), (44, 64, 28)]:
        body.append(f'  <path d="M{x - r * 0.6:.0f},{y - r * 0.3:.0f} Q{x - r * 0.3:.0f},{y - r * 0.75:.0f} {x + r * 0.2:.0f},{y - r * 0.7:.0f}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="4" fill="none" stroke-linecap="round"/>')
    svg('busch', 140, 110, defs, '\n'.join(body), 'Busch.')


# ---------------------------------------------------------------- Gedankenblase
def gedankenblase():
    defs = radial('wolke', st(('0', '#ffffff'), ('0.7', '#ffffff'), ('1', '#e2ecf5')), cx='45%', cy='35%', r='70%')
    cloud = blob_path(65, 52, 56, 44, 8, 14, 2, start=0.2)
    body = f'''  <path d="{cloud}" fill="url(#wolke)" stroke="#b9cadb" stroke-width="2.4" stroke-linejoin="round"/>
  <circle cx="30" cy="106" r="9" fill="url(#wolke)" stroke="#b9cadb" stroke-width="2"/>
  <circle cx="18" cy="122" r="6" fill="url(#wolke)" stroke="#b9cadb" stroke-width="1.8"/>'''
    svg('gedankenblase', 130, 130, defs, body, 'Gedankenblase.')


# ---------------------------------------------------------------- Futter
# Futter-Bilder sind 64 × 64 groß und haben keinen Boden-Schatten,
# weil man sie mit dem Finger zu den Tieren trägt.

def wurm():
    defs = linear('wurm', st(('0', '#f7a3a0'), ('1', '#d9675f')))
    path = 'M8,44 C14,30 24,30 28,40 C32,50 42,52 46,40 C49,31 54,26 58,30'
    rings = ''.join(
        f'  <path d="M{x},{y - 4} l0,8" stroke="#c4554e" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>\n'
        for x, y in [(14, 37), (20, 34), (32, 46), (38, 48)]
    )
    body = f'''  <path d="{path}" stroke="#a8433d" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="{path}" stroke="url(#wurm)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M10,40 C15,31 22,31 26,37" stroke="#fff" stroke-opacity="0.45" stroke-width="2.5" fill="none" stroke-linecap="round"/>
{rings}{eye(54, 28, 2.6)}
  <path d="M56,34 Q58,36 60,34" stroke="#8a3530" stroke-width="1.4" fill="none" stroke-linecap="round"/>'''
    svg('wurm', 64, 64, defs, body, 'Regenwurm (Futter).')


def kaefer():
    defs = '\n'.join([
        radial('panzer', st(('0', '#7fd36a'), ('1', '#2c7a2a'))),
        radial('kopf', st(('0', '#4a4a4a'), ('1', '#141414'))),
    ])
    legs = ''.join(
        f'  <path d="M{x},{y} l{dx},{dy}" stroke="#1d1d1d" stroke-width="2.6" stroke-linecap="round"/>\n'
        for x, y, dx, dy in [(24, 30, -10, -4), (24, 38, -11, 2), (26, 46, -9, 8), (40, 30, 10, -4), (40, 38, 11, 2), (38, 46, 9, 8)]
    )
    body = f'''{legs}  <path d="M26,14 Q22,6 18,6 M38,14 Q42,6 46,6" stroke="#1d1d1d" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="32" cy="18" r="9" fill="url(#kopf)"/>
  <ellipse cx="32" cy="38" rx="15" ry="18" fill="url(#panzer)" stroke="#1f5a1e" stroke-width="1.8"/>
  <path d="M32,21 L32,56" stroke="#1f5a1e" stroke-width="1.6"/>
  <ellipse cx="26" cy="31" rx="4" ry="6" fill="#fff" opacity="0.35"/>
{eye(28.5, 17, 2.2)}
{eye(35.5, 17, 2.2)}'''
    svg('kaefer', 64, 64, defs, body, 'Käfer (Futter).')


NUT_DEF = radial('nuss', st(('0', '#d9a066'), ('1', '#8a5326')))


def nuss():
    defs = '\n'.join([NUT_DEF, radial('boden', st(('0', '#f3dfb8'), ('1', '#cfae78')), cx='50%', cy='40%')])
    body = '''  <path d="M32,6 C36,10 52,20 53,36 C54,50 44,59 32,59 C20,59 10,50 11,36 C12,20 28,10 32,6 Z" fill="url(#nuss)" stroke="#5e3615" stroke-width="2" stroke-linejoin="round"/>
  <path d="M30,12 C24,20 18,28 18,38" stroke="#6e4219" stroke-width="1.4" fill="none" opacity="0.5"/>
  <path d="M38,14 C42,22 46,30 46,40" stroke="#6e4219" stroke-width="1.4" fill="none" opacity="0.5"/>
  <ellipse cx="22" cy="28" rx="4" ry="8" transform="rotate(25 22 28)" fill="#fff" opacity="0.35"/>
  <path d="M15,46 C20,54 44,54 49,46 C47,55 40,59 32,59 C24,59 17,55 15,46 Z" fill="url(#boden)" stroke="#5e3615" stroke-width="1.6" stroke-linejoin="round"/>'''
    svg('nuss', 64, 64, defs, body, 'Haselnuss (Futter).')


def koerner():
    defs = radial('korn', st(('0', '#fbe39a'), ('1', '#d2a23c')))
    rnd = random.Random(7)
    grains = []
    for x, y in [(20, 46), (32, 48), (44, 46), (26, 38), (38, 38), (32, 29), (14, 52), (50, 52), (25, 54), (39, 55)]:
        a = rnd.uniform(-40, 40)
        grains.append(
            f'  <ellipse cx="{x}" cy="{y}" rx="5" ry="7.5" transform="rotate({a:.0f} {x} {y})" fill="url(#korn)" stroke="#a87a22" stroke-width="1.4"/>\n'
            f'  <ellipse cx="{x - 1.5}" cy="{y - 2.5}" rx="1.5" ry="2.5" transform="rotate({a:.0f} {x} {y})" fill="#fff" opacity="0.5"/>'
        )
    svg('koerner', 64, 64, defs, '\n'.join(grains), 'Körner (Futter).')


def wasserpflanze():
    defs = '\n'.join([
        linear('wasser', st(('0', '#9fd8f5'), ('1', '#4c9fd6'))),
        radial('linse', st(('0', '#b8ec7a'), ('1', '#4f9e2f'))),
    ])
    pads = []
    for x, y, r in [(22, 34, 9), (40, 30, 10), (32, 46, 9), (46, 46, 7), (16, 48, 6)]:
        pads.append(
            f'  <circle cx="{x}" cy="{y}" r="{r}" fill="url(#linse)" stroke="#3a7a22" stroke-width="1.6"/>\n'
            f'  <path d="M{x},{y} L{x + r * 0.7:.1f},{y - r * 0.7:.1f}" stroke="#3a7a22" stroke-width="1.4"/>\n'
            f'  <circle cx="{x - r * 0.35:.1f}" cy="{y - r * 0.35:.1f}" r="{r * 0.25:.1f}" fill="#fff" opacity="0.5"/>'
        )
    body = '  <ellipse cx="32" cy="42" rx="28" ry="18" fill="url(#wasser)" stroke="#3a86b8" stroke-width="2"/>\n' + '\n'.join(pads)
    svg('wasserpflanze', 64, 64, defs, body, 'Wasserlinsen (Futter für die Ente).')


# ---------------------------------------------------------------- Knöpfe der Leiste

def korb():
    defs = '\n'.join([
        linear('korb', st(('0', '#e8b26a'), ('1', '#a86a2c'))),
        radial('apfel', st(('0', '#ff9a8a'), ('1', '#d23a2a'))),
        NUT_DEF,
    ])
    weave = ''.join(
        f'  <path d="M{x},34 L{x + 3},58" stroke="#8a5420" stroke-width="1.6" opacity="0.7"/>\n' for x in range(14, 52, 7)
    )
    body = f'''  <path d="M14,32 Q14,6 32,6 Q50,6 50,32" stroke="#8a5420" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="24" cy="28" r="8" fill="url(#apfel)" stroke="#9a2a1e" stroke-width="1.4"/>
  <ellipse cx="38" cy="27" rx="7" ry="9" fill="url(#nuss)" stroke="#5e3615" stroke-width="1.4"/>
  <path d="M6,32 L58,32 L52,58 Q32,62 12,58 Z" fill="url(#korb)" stroke="#7a4818" stroke-width="2" stroke-linejoin="round"/>
{weave}  <path d="M10,42 Q32,46 55,42 M12,51 Q32,55 53,51" stroke="#8a5420" stroke-width="1.6" fill="none" opacity="0.7"/>
  <rect x="4" y="29" width="56" height="6" rx="3" fill="#c8894a" stroke="#7a4818" stroke-width="1.6"/>'''
    svg('korb', 64, 64, defs, body, 'Futterkorb (Knopf: Füttern).')


def schaufel():
    defs = '\n'.join([
        linear('stiel', st(('0', '#d9a066'), ('1', '#9a6230')), x2=1, y2=0),
        linear('blatt', st(('0', '#d7e0ea'), ('1', '#7f8fa3'))),
    ])
    body = '''  <rect x="28" y="4" width="8" height="34" rx="4" fill="url(#stiel)" stroke="#6e4219" stroke-width="1.6"/>
  <rect x="21" y="2" width="22" height="7" rx="3.5" fill="#e2553a" stroke="#a83a24" stroke-width="1.6"/>
  <path d="M18,38 L46,38 L46,46 Q46,60 32,62 Q18,60 18,46 Z" fill="url(#blatt)" stroke="#5a6878" stroke-width="2" stroke-linejoin="round"/>
  <path d="M23,42 Q23,54 30,57" stroke="#fff" stroke-opacity="0.6" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    svg('schaufel', 64, 64, defs, body, 'Schaufel (Knopf: Bauen).')


def album():
    defs = '\n'.join([
        linear('einband', st(('0', '#4fb06a'), ('1', '#2c7a44'))),
        linear('seiten', st(('0', '#fffaf0'), ('1', '#efe2c8')), x2=1, y2=0),
    ])
    toes = ''.join(f'  <ellipse cx="{x}" cy="{y}" rx="3.6" ry="4.6" fill="#fff6d8"/>\n' for x, y in [(26, 25), (33, 21), (40, 25), (43, 32)])
    body = f'''  <rect x="12" y="10" width="44" height="48" rx="6" fill="url(#seiten)" stroke="#b9a37a" stroke-width="1.6"/>
  <rect x="8" y="6" width="44" height="50" rx="6" fill="url(#einband)" stroke="#1f5a30" stroke-width="2"/>
  <rect x="8" y="6" width="9" height="50" rx="4" fill="#24683a"/>
  <path d="M14,10 L14,52" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
  <ellipse cx="33" cy="35" rx="8" ry="7" fill="#fff6d8"/>
{toes}  <path d="M22,12 Q36,10 48,14" stroke="#fff" stroke-opacity="0.4" stroke-width="3" fill="none" stroke-linecap="round"/>'''
    svg('album', 64, 64, defs, body, 'Tier-Album (Knopf).')


# ---------------------------------------------------------------- Symbole im Figuren-Baukasten
# Zeigen ohne Lesen, was eine Reihe im Baukasten ändert.

def symbol_frisur():
    defs = '\n'.join([
        radial('haut', st(('0', '#ffe9d6'), ('1', '#eab48c')), cx='40%', cy='35%'),
        radial('haare', st(('0', '#c08550'), ('1', '#6b3c1c'))),
    ])
    body = '''  <circle cx="32" cy="36" r="20" fill="url(#haut)" stroke="#c98e66" stroke-width="1.8"/>
  <path d="M11,36 Q8,10 32,8 Q56,10 53,36 Q50,24 42,22 Q36,28 28,24 Q20,26 15,38 Z" fill="url(#haare)" stroke="#4a2810" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="25" cy="38" r="2.6" fill="#3a2414"/>
  <circle cx="39" cy="38" r="2.6" fill="#3a2414"/>
  <path d="M27,46 Q32,50 37,46" stroke="#9a3d2b" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M48,50 L58,60 M58,50 L48,60" stroke="#7d8590" stroke-width="3" stroke-linecap="round"/>
  <circle cx="47" cy="49" r="3.5" fill="none" stroke="#e2553a" stroke-width="2.4"/>
  <circle cx="47" cy="61" r="3.5" fill="none" stroke="#e2553a" stroke-width="2.4"/>'''
    svg('symbol-frisur', 64, 64, defs, body, 'Symbol: Frisur.')


def symbol_haarfarbe():
    defs = linear('kamm', st(('0', '#ffb36b'), ('1', '#e2853a')))
    teeth = ''.join(f'  <rect x="{x}" y="34" width="3.4" height="18" rx="1.7" fill="url(#kamm)" stroke="#b5622a" stroke-width="1"/>\n' for x in range(10, 54, 6))
    locks = ''.join(
        f'  <path d="M{x},6 Q{x + 8},16 {x},26" stroke="{c}" stroke-width="5" fill="none" stroke-linecap="round"/>\n'
        for x, c in [(14, '#f2c55c'), (24, '#a8693a'), (34, '#2b2422'), (44, '#d4602a')]
    )
    body = f'''{locks}  <rect x="7" y="27" width="50" height="10" rx="5" fill="url(#kamm)" stroke="#b5622a" stroke-width="1.6"/>
{teeth}'''
    svg('symbol-haarfarbe', 64, 64, defs, body, 'Symbol: Haarfarbe.')


def symbol_haut():
    defs = radial('haut', st(('0', '#ffe9d6'), ('1', '#d9a274')), cx='40%', cy='40%')
    fingers = ''.join(
        f'  <rect x="{x}" y="{y}" width="9" height="{h}" rx="4.5" fill="url(#haut)" stroke="#b07a52" stroke-width="1.6"/>\n'
        for x, y, h in [(17, 12, 26), (27, 7, 30), (37, 9, 28), (47, 16, 22)]
    )
    body = f'''{fingers}  <path d="M16,32 L56,32 L56,44 Q56,60 38,60 L30,60 Q16,60 14,46 Z" fill="url(#haut)" stroke="#b07a52" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M15,40 Q6,34 5,26 Q6,22 10,24 Q16,30 20,34" fill="url(#haut)" stroke="#b07a52" stroke-width="1.6" stroke-linejoin="round"/>'''
    svg('symbol-haut', 64, 64, defs, body, 'Symbol: Hautfarbe.')


def symbol_shirt():
    defs = linear('shirt', st(('0', '#ff9c7e'), ('1', '#e2553a')))
    body = '''  <path d="M22,8 Q32,14 42,8 L58,16 L52,30 L46,27 L46,58 L18,58 L18,27 L12,30 L6,16 Z" fill="url(#shirt)" stroke="#b9432c" stroke-width="2" stroke-linejoin="round"/>
  <path d="M24,9 Q32,18 40,9" stroke="#b9432c" stroke-width="2" fill="none"/>
  <path d="M32,30 L34.5,35.5 L40.5,36 L36,40 L37.5,46 L32,42.8 L26.5,46 L28,40 L23.5,36 L29.5,35.5 Z" fill="#ffd84a" stroke="#e0a91f" stroke-width="1" stroke-linejoin="round"/>'''
    svg('symbol-shirt', 64, 64, defs, body, 'Symbol: T-Shirt.')


def symbol_hose():
    defs = linear('hose', st(('0', '#6f8fd6'), ('1', '#33508f')))
    body = '''  <path d="M14,8 L50,8 L54,58 L38,58 L32,26 L26,58 L10,58 Z" fill="url(#hose)" stroke="#2a4074" stroke-width="2" stroke-linejoin="round"/>
  <rect x="14" y="8" width="36" height="7" fill="#2a4074" opacity="0.35"/>
  <path d="M20,20 Q24,24 28,20 M36,20 Q40,24 44,20" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" fill="none"/>'''
    svg('symbol-hose', 64, 64, defs, body, 'Symbol: Hose.')


# ---------------------------------------------------------------- Tag und Nacht (Knopf)
# Der Knopf zeigt, wohin er führt: am Tag der Mond, in der Nacht die Sonne.

def sonne():
    defs = radial('sonne', st(('0', '#fff3a0'), ('0.6', '#ffd23f'), ('1', '#f5a623')), cx='40%', cy='38%')
    rays = ''.join(
        f'  <path d="M{32 + 21 * math.cos(a):.1f},{32 + 21 * math.sin(a):.1f} L{32 + 29 * math.cos(a):.1f},{32 + 29 * math.sin(a):.1f}" '
        f'stroke="#f5a623" stroke-width="5" stroke-linecap="round"/>\n'
        for a in (i * math.pi / 4 for i in range(8))
    )
    body = f'''{rays}  <circle cx="32" cy="32" r="16" fill="url(#sonne)" stroke="#e08a12" stroke-width="2"/>
  <circle cx="26.5" cy="30" r="2.2" fill="#7a4a10"/>
  <circle cx="37.5" cy="30" r="2.2" fill="#7a4a10"/>
  <path d="M26,36 Q32,41 38,36" stroke="#7a4a10" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="23" cy="35" r="2.4" fill="#ff8a5c" opacity="0.5"/>
  <circle cx="41" cy="35" r="2.4" fill="#ff8a5c" opacity="0.5"/>'''
    svg('sonne', 64, 64, defs, body, 'Sonne (Knopf: Tag).')


def mond():
    defs = radial('mond', st(('0', '#fffbe0'), ('0.7', '#f3e08a'), ('1', '#d9b94a')), cx='35%', cy='35%')
    stars = ''.join(
        f'  <path d="M{x},{y - r} L{x + r * 0.3:.1f},{y - r * 0.3:.1f} L{x + r},{y} L{x + r * 0.3:.1f},{y + r * 0.3:.1f} L{x},{y + r} '
        f'L{x - r * 0.3:.1f},{y + r * 0.3:.1f} L{x - r},{y} L{x - r * 0.3:.1f},{y - r * 0.3:.1f} Z" fill="#ffe680"/>\n'
        for x, y, r in [(49, 14, 6), (54, 34, 4), (44, 50, 3.5)]
    )
    body = f'''  <path d="M36,6 A26,26 0 1 0 50,52 A21,21 0 1 1 36,6 Z" fill="url(#mond)" stroke="#b8952e" stroke-width="2" stroke-linejoin="round"/>
  <path d="M20,30 Q23,33 26,30" stroke="#7a5a10" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21,40 Q25,43 29,40" stroke="#7a5a10" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="17" cy="36" r="2.4" fill="#ff9a7a" opacity="0.45"/>
{stars}'''
    svg('mond', 64, 64, defs, body, 'Mond mit Sternen (Knopf: Nacht).')


def haus():
    """Haus-Knopf: zurück zum Startbildschirm (Spielstand wechseln)."""
    defs = '\n'.join([
        linear('dach', st(('0', '#ff8a6a'), ('1', '#d9452a'))),
        linear('wand', st(('0', '#fff3d6'), ('1', '#efd9a8'))),
    ])
    body = '''  <rect x="42" y="12" width="8" height="16" rx="2" fill="#a8533a" stroke="#7a3422" stroke-width="1.6"/>
  <path d="M14,32 L14,58 L50,58 L50,32 Z" fill="url(#wand)" stroke="#b9925a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M6,34 L32,8 L58,34 Q59,38 55,38 L32,16 L9,38 Q5,38 6,34 Z" fill="url(#dach)" stroke="#a8381a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M10,36 L32,14 L54,36" fill="url(#dach)"/>
  <rect x="26" y="40" width="12" height="18" rx="5" fill="#8a5a2c" stroke="#5e3615" stroke-width="1.6"/>
  <circle cx="35" cy="50" r="1.4" fill="#ffd84a"/>
  <rect x="16" y="38" width="8" height="8" rx="1.5" fill="#9fd4f0" stroke="#b9925a" stroke-width="1.4"/>
  <rect x="40" y="38" width="8" height="8" rx="1.5" fill="#9fd4f0" stroke="#b9925a" stroke-width="1.4"/>'''
    svg('haus', 64, 64, defs, body, 'Haus (Knopf: zurück zum Startbildschirm).')


# ---------------------------------------------------------------- Jahreszeiten (Knopf)
# Der Knopf zeigt die Jahreszeit, die als Nächstes kommt.

def jahreszeit_fruehling():
    defs = linear('bluete', st(('0', '#ff9ec4'), ('1', '#e2557f')))
    body = '''  <path d="M32,60 L32,30" stroke="#4f9a3a" stroke-width="4" stroke-linecap="round"/>
  <path d="M32,50 Q18,46 14,32 Q28,34 32,46 Z" fill="#6cc04a" stroke="#3d7a2a" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M32,54 Q46,50 50,38 Q36,40 32,50 Z" fill="#6cc04a" stroke="#3d7a2a" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M20,10 L26,18 L32,6 L38,18 L44,10 L44,24 Q44,34 32,34 Q20,34 20,24 Z" fill="url(#bluete)" stroke="#b83a64" stroke-width="2" stroke-linejoin="round"/>
  <path d="M25,20 Q25,28 30,30" stroke="#fff" stroke-opacity="0.55" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    svg('jahreszeit-fruehling', 64, 64, defs, body, 'Tulpe (Knopf: Frühling).')


def jahreszeit_sommer():
    defs = radial('kern', st(('0', '#a0662a'), ('1', '#5a3412')), cx='45%', cy='40%')
    petals = ''.join(
        f'  <ellipse cx="{32 + 17 * math.cos(a):.1f}" cy="{30 + 17 * math.sin(a):.1f}" rx="8" ry="4.6" '
        f'transform="rotate({math.degrees(a):.0f} {32 + 17 * math.cos(a):.1f} {30 + 17 * math.sin(a):.1f})" fill="#ffd23f" stroke="#e09a12" stroke-width="1.4"/>\n'
        for a in (i * math.pi / 6 for i in range(12))
    )
    body = f'''  <path d="M32,44 L32,62" stroke="#4f9a3a" stroke-width="4" stroke-linecap="round"/>
  <path d="M32,56 Q44,52 48,44 Q38,46 32,52 Z" fill="#6cc04a" stroke="#3d7a2a" stroke-width="1.6"/>
{petals}  <circle cx="32" cy="30" r="11" fill="url(#kern)" stroke="#3e220a" stroke-width="1.6"/>
  <circle cx="29" cy="27" r="1.4" fill="#d9a066"/><circle cx="35" cy="29" r="1.4" fill="#d9a066"/><circle cx="31" cy="33" r="1.4" fill="#d9a066"/>'''
    svg('jahreszeit-sommer', 64, 64, defs, body, 'Sonnenblume (Knopf: Sommer).')


def jahreszeit_herbst():
    defs = linear('blatt', st(('0', '#ffb347'), ('0.6', '#f07a2a'), ('1', '#c8441e')))
    body = '''  <path d="M32,4 L37,18 L49,12 L45,26 L59,28 L48,37 L54,46 L40,44 L36,54 L32,48 L28,54 L24,44 L10,46 L16,37 L5,28 L19,26 L15,12 L27,18 Z" fill="url(#blatt)" stroke="#a8381a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M32,48 L32,62 M32,40 L22,30 M32,40 L42,30 M32,30 L32,14" stroke="#a8381a" stroke-width="2.2" fill="none" stroke-linecap="round"/>'''
    svg('jahreszeit-herbst', 64, 64, defs, body, 'Buntes Herbstblatt (Knopf: Herbst).')


def jahreszeit_winter():
    arms = ''
    for i in range(6):
        a = math.degrees(i * math.pi / 3)
        arms += (f'  <g transform="rotate({a:.0f} 32 32)">'
                 '<path d="M32,32 L32,6 M32,14 L25,8 M32,14 L39,8 M32,22 L26,17 M32,22 L38,17" '
                 'stroke="#5aa9ec" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>\n')
    body = f'''{arms}  <circle cx="32" cy="32" r="5" fill="#ffffff" stroke="#5aa9ec" stroke-width="2.4"/>'''
    svg('jahreszeit-winter', 64, 64, '', body, 'Schneeflocke (Knopf: Winter).')


# ---------------------------------------------------------------- Frosch
def frosch():
    defs = '\n'.join([
        radial('haut', st(('0', '#a6e36a'), ('0.6', '#62b33a'), ('1', '#3d8a26')), cx='40%', cy='30%'),
        radial('bein', st(('0', '#8fd45a'), ('1', '#3d8a26')), cx='40%', cy='35%'),
        radial('bauch', st(('0', '#fbf7d2'), ('1', '#e2dc9a'))),
        SHADOW_DEF,
    ])
    spots = ''.join(
        f'  <ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 0.7:.1f}" fill="#2f7a22" opacity="0.55"/>\n'
        for x, y, r in [(30, 44, 4), (42, 36, 3), (24, 56, 3), (50, 48, 2.5)]
    )
    body = f'''{ground_shadow(52, 74, 42, 6)}
  <!-- Hinterbein (zusammengefaltet) -->
  <path d="M14,62 Q8,44 26,40 Q44,40 46,58 Q46,70 32,72 L12,72 Q6,72 8,68 Z" fill="url(#bein)" stroke="#2b6a1c" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M10,72 Q4,74 2,70 M14,73 Q10,78 6,76 M20,73 Q18,79 14,79" stroke="#2b6a1c" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <!-- Körper -->
  <path d="M18,52 Q20,30 46,26 Q68,22 80,30 Q92,38 90,52 Q86,66 64,70 Q36,74 22,66 Q16,60 18,52 Z" fill="url(#haut)" stroke="#2b6a1c" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M50,62 Q66,60 84,50 Q84,62 66,68 Q54,70 50,62 Z" fill="url(#bauch)"/>
{spots}  <path d="M30,34 Q44,26 60,26" stroke="#ffffff" stroke-opacity="0.45" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Vorderbein -->
  <path d="M66,58 Q70,66 72,72" stroke="#3d8a26" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M66,74 L78,74 M70,72 L72,77 M76,72 L80,76" stroke="#2b6a1c" stroke-width="3" stroke-linecap="round"/>
  <!-- Augenhügel -->
  <circle cx="70" cy="24" r="11" fill="url(#haut)" stroke="#2b6a1c" stroke-width="1.8"/>
{eye(71, 23, 6.2, '#6b4a14')}
  <!-- Lächeln und Wange -->
  <path d="M70,44 Q82,50 94,42" stroke="#2b6a1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="80" cy="38" rx="4.5" ry="2.8" fill="#ff8f8f" opacity="0.45"/>
  <circle cx="90" cy="34" r="1.2" fill="#2b6a1c"/>'''
    svg('frosch', 100, 80, defs, body, 'Teichfrosch.', size=0.72)


# ---------------------------------------------------------------- Steinhaufen
def steine():
    rnd = random.Random(5)
    defs = '\n'.join([
        radial('stein', st(('0', '#e6e1d8'), ('0.6', '#b3ab9f'), ('1', '#857d72')), cx='35%', cy='30%'),
        radial('steinDunkel', st(('0', '#bdb5a8'), ('1', '#6f685e')), cx='35%', cy='30%'),
        radial('moos', st(('0', '#a6d86a'), ('1', '#5a9a32'))),
        SHADOW_DEF,
    ])
    body = [ground_shadow(60, 74, 54, 8)]
    for x, y, rx, ry in [(30, 60, 22, 15), (88, 60, 24, 15), (58, 64, 26, 14)]:
        body.append(f'  <ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#steinDunkel)" stroke="#5e574e" stroke-width="1.6"/>')
    for x, y, rx, ry in [(44, 44, 20, 15), (76, 42, 21, 16), (60, 26, 17, 13)]:
        a = rnd.uniform(-15, 15)
        body.append(f'  <ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" transform="rotate({a:.0f} {x} {y})" fill="url(#stein)" stroke="#5e574e" stroke-width="1.6"/>')
        body.append(f'  <path d="M{x - rx * 0.55:.0f},{y - ry * 0.25:.0f} Q{x - rx * 0.3:.0f},{y - ry * 0.7:.0f} {x + rx * 0.1:.0f},{y - ry * 0.65:.0f}" stroke="#fff" stroke-opacity="0.55" stroke-width="3" fill="none" stroke-linecap="round"/>')
    body.append('  <path d="M48,30 Q54,22 62,24 Q58,30 50,32 Z" fill="url(#moos)" opacity="0.9"/>')
    body.append('  <path d="M80,64 Q90,58 100,62 Q92,68 82,68 Z" fill="url(#moos)" opacity="0.9"/>')
    svg('steine', 120, 80, defs, '\n'.join(body), 'Steinhaufen.')


# ---------------------------------------------------------------- Weitere Dinge für die Wiese

def blumenbeet():
    rnd = random.Random(21)
    defs = '\n'.join([
        radial('erde', st(('0', '#9a6a44'), ('1', '#6a4428')), cx='50%', cy='40%'),
        radial('blatt', st(('0', '#8fd45a'), ('1', '#3d8a26'))),
        SHADOW_DEF,
    ])
    body = [ground_shadow(60, 74, 56, 7), '  <ellipse cx="60" cy="66" rx="54" ry="12" fill="url(#erde)" stroke="#4e3018" stroke-width="1.6"/>']
    colors = [('#ff7a9a', '#c94a6a'), ('#ffd84a', '#d9a51c'), ('#a98bff', '#6e52c9'), ('#ffffff', '#c9c9c9'), ('#ff9a4a', '#cc6a1c')]
    for i in range(11):
        x = 12 + i * 9.6 + rnd.uniform(-2, 2)
        top = rnd.uniform(16, 34)
        body.append(f'  <path d="M{x:.1f},66 Q{x - 2:.1f},{(66 + top) / 2:.1f} {x:.1f},{top:.1f}" stroke="#3d8a26" stroke-width="2.4" fill="none"/>')
        body.append(f'  <ellipse cx="{x + 4:.1f}" cy="{(66 + top) / 2 + 4:.1f}" rx="5" ry="2.4" transform="rotate(-30 {x + 4:.1f} {(66 + top) / 2 + 4:.1f})" fill="url(#blatt)"/>')
        light, dark = colors[i % len(colors)]
        for k in range(5):
            a = k / 5 * math.tau
            body.append(f'  <circle cx="{x + math.cos(a) * 4.5:.1f}" cy="{top + math.sin(a) * 4.5:.1f}" r="3.6" fill="{light}" stroke="{dark}" stroke-width="0.8"/>')
        body.append(f'  <circle cx="{x:.1f}" cy="{top:.1f}" r="2.6" fill="#ffcf3a" stroke="#c99a10" stroke-width="0.6"/>')
    svg('blumen', 120, 80, defs, '\n'.join(body), 'Blumenbeet.')


def insektenhotel():
    defs = '\n'.join([
        linear('holz', st(('0', '#c9905a'), ('1', '#8a5a30')), x2=1, y2=0),
        linear('dach', st(('0', '#b24a2e'), ('1', '#7e2e1a'))),
        radial('scheibe', st(('0', '#f0cf98'), ('1', '#c99a5e'))),
        SHADOW_DEF,
    ])
    body = [ground_shadow(40, 116, 30, 5),
            '  <rect x="16" y="96" width="6" height="20" fill="#7a4a26"/>',
            '  <rect x="58" y="96" width="6" height="20" fill="#7a4a26"/>',
            '  <rect x="10" y="30" width="60" height="68" rx="3" fill="url(#holz)" stroke="#5a3418" stroke-width="2"/>',
            '  <path d="M4,34 L40,8 L76,34 Z" fill="url(#dach)" stroke="#5e2010" stroke-width="2" stroke-linejoin="round"/>',
            '  <path d="M10,56 L70,56 M10,78 L70,78 M40,34 L40,56" stroke="#5a3418" stroke-width="2"/>']
    # Obere Fächer: Bambusröhren und Holzscheiben mit Löchern
    for x in range(16, 38, 6):
        for y in (40, 48):
            body.append(f'  <circle cx="{x}" cy="{y}" r="2.8" fill="#f2dfa8" stroke="#a8823c" stroke-width="1"/><circle cx="{x}" cy="{y}" r="1.3" fill="#3a2414"/>')
    body.append('  <circle cx="55" cy="45" r="9" fill="url(#scheibe)" stroke="#8a5a30" stroke-width="1.4"/>')
    for dx, dy in [(-4, -3), (3, -4), (-2, 4), (4, 3), (0, 0)]:
        body.append(f'  <circle cx="{55 + dx}" cy="{45 + dy}" r="1.3" fill="#3a2414"/>')
    # Mitte: Zapfen, unten: Stroh
    for x in (20, 34, 48, 62):
        body.append(f'  <ellipse cx="{x}" cy="67" rx="5" ry="7" fill="#8a5a2c" stroke="#5a3418" stroke-width="1.2"/>')
        body.append(f'  <path d="M{x - 4},64 L{x + 4},64 M{x - 4},68 L{x + 4},68 M{x - 3},72 L{x + 3},72" stroke="#c9905a" stroke-width="1"/>')
    for x in range(13, 68, 4):
        body.append(f'  <path d="M{x},80 L{x + 2},96" stroke="#e8c96a" stroke-width="2.2"/>')
    svg('insektenhotel', 80, 120, defs, '\n'.join(body), 'Insektenhotel.')


def hecke():
    rnd = random.Random(31)
    defs = '\n'.join([
        radial('blatt', st(('0', '#7ccf5a'), ('0.6', '#3f9a3a'), ('1', '#24662a')), cx='35%', cy='30%', r='80%'),
        radial('blattDunkel', st(('0', '#3f9a3a'), ('1', '#1f5424')), cx='40%', cy='35%', r='80%'),
        SHADOW_DEF,
    ])
    body = [ground_shadow(90, 92, 86, 8)]
    for x in range(30, 152, 24):
        body.append(f'  <path d="{blob_path(x, 66, 26, 24, 9, 3.5, rnd.random())}" fill="url(#blattDunkel)" stroke="#1a4a1e" stroke-width="1.8" stroke-linejoin="round"/>')
    for x in range(36, 148, 22):
        y = rnd.uniform(40, 50)
        body.append(f'  <path d="{blob_path(x, y, 24, 22, 9, 3.5, rnd.random())}" fill="url(#blatt)" stroke="#1a4a1e" stroke-width="1.8" stroke-linejoin="round"/>')
    for x, y in [(40, 40), (90, 34), (140, 42), (66, 60), (118, 62)]:
        body.append(f'  <circle cx="{x}" cy="{y}" r="3.2" fill="#e8455a" stroke="#9a2030" stroke-width="0.8"/>')
    body.append('  <path d="M20,40 Q60,24 100,30" stroke="#ffffff" stroke-opacity="0.3" stroke-width="4" fill="none" stroke-linecap="round"/>')
    svg('hecke', 180, 100, defs, '\n'.join(body), 'Hecke mit Beeren.')


def totholz():
    defs = '\n'.join([
        linear('rinde', st(('0', '#9a7048'), ('0.5', '#6e4a2a'), ('1', '#4a301a'))),
        radial('schnitt', st(('0', '#e6c38e'), ('1', '#b0824e')), cx='50%', cy='50%'),
        radial('pilz', st(('0', '#ffb07a'), ('1', '#c95f25'))),
        radial('moos', st(('0', '#a6d86a'), ('1', '#5a9a32'))),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(64, 64, 60, 6)}
  <path d="M16,26 L108,22 Q124,22 124,42 Q124,60 108,60 L16,62 Z" fill="url(#rinde)" stroke="#3a2412" stroke-width="2" stroke-linejoin="round"/>
  <path d="M30,34 Q60,30 92,32 M26,48 Q64,44 100,48" stroke="#3a2412" stroke-width="1.6" fill="none" opacity="0.6"/>
  <ellipse cx="16" cy="44" rx="11" ry="18" fill="url(#schnitt)" stroke="#3a2412" stroke-width="2"/>
  <ellipse cx="16" cy="44" rx="6" ry="10" fill="none" stroke="#9a6a3a" stroke-width="1.2"/>
  <ellipse cx="16" cy="44" rx="2.5" ry="4" fill="none" stroke="#9a6a3a" stroke-width="1.2"/>
  <ellipse cx="48" cy="26" rx="20" ry="5" fill="url(#moos)"/>
  <path d="M78,24 Q78,14 88,14 Q98,14 98,24 Z" fill="url(#pilz)" stroke="#8a3a12" stroke-width="1.4"/>
  <rect x="86" y="22" width="4" height="4" fill="#f4e6c8"/>
  <circle cx="84" cy="18" r="1.6" fill="#fff" opacity="0.8"/>
  <path d="M96,24 Q96,18 102,18 Q108,18 108,24 Z" fill="url(#pilz)" stroke="#8a3a12" stroke-width="1.2"/>'''
    svg('totholz', 130, 70, defs, body, 'Totholz (alter Baumstamm).')


def erdbau():
    defs = '\n'.join([
        radial('erde', st(('0', '#b5834e'), ('0.6', '#8a5a30'), ('1', '#5e3a1c')), cx='45%', cy='30%'),
        radial('loch', st(('0', '#0e0804'), ('1', '#3a2412')), cx='50%', cy='60%'),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(60, 66, 58, 6)}
  <path d="M4,64 Q14,22 60,16 Q106,22 116,64 Z" fill="url(#erde)" stroke="#4a2c12" stroke-width="2" stroke-linejoin="round"/>
  <path d="M40,64 Q40,36 60,36 Q80,36 80,64 Z" fill="url(#loch)" stroke="#3a2412" stroke-width="2"/>
  <path d="M22,40 Q36,26 56,22" stroke="#d9a670" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
  <circle cx="20" cy="56" r="3" fill="#7a5a3a"/><circle cx="98" cy="52" r="3.5" fill="#7a5a3a"/><circle cx="90" cy="34" r="2.4" fill="#7a5a3a"/>
  <path d="M8,64 l3,-8 l3,8 M104,64 l3,-9 l3,9" stroke="#4cae4f" stroke-width="2" fill="none"/>'''
    svg('bau', 120, 70, defs, body, 'Erdbau mit Eingang.')


def nistkasten():
    defs = '\n'.join([
        linear('holz', st(('0', '#d9a066'), ('1', '#9a6230')), x2=1, y2=0),
        linear('dach', st(('0', '#6e8a5a'), ('1', '#3e5a30'))),
        linear('pfahl', st(('0', '#8a5a30'), ('1', '#5a3418')), x2=1, y2=0),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(30, 136, 16, 4)}
  <rect x="26" y="60" width="8" height="78" fill="url(#pfahl)" stroke="#3a2412" stroke-width="1.4"/>
  <rect x="8" y="20" width="44" height="46" rx="3" fill="url(#holz)" stroke="#5a3418" stroke-width="2"/>
  <path d="M2,24 L30,4 L58,24 Z" fill="url(#dach)" stroke="#2a4020" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="30" cy="38" r="8" fill="#1e120a" stroke="#5a3418" stroke-width="2"/>
  <rect x="28" y="50" width="4" height="8" rx="2" fill="#5a3418"/>
  <path d="M12,28 L12,60" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>'''
    svg('nistkasten', 60, 140, defs, body, 'Nistkasten am Pfahl.')


# ---------------------------------------------------------------- Weiteres Futter

def blattlaeuse():
    defs = '\n'.join([radial('blatt', st(('0', '#a6e36a'), ('1', '#3d8a26'))), radial('laus', st(('0', '#d8f59a'), ('1', '#7cb83a')))])
    body = ['  <path d="M8,50 Q10,18 46,10 Q58,30 50,46 Q38,60 8,50 Z" fill="url(#blatt)" stroke="#2b6a1c" stroke-width="2" stroke-linejoin="round"/>',
            '  <path d="M8,50 Q30,34 46,12" stroke="#2b6a1c" stroke-width="1.6" fill="none"/>']
    for x, y in [(24, 30), (32, 38), (20, 42), (38, 26), (30, 22), (40, 36)]:
        body.append(f'  <ellipse cx="{x}" cy="{y}" rx="3.6" ry="2.8" fill="url(#laus)" stroke="#4e7a1e" stroke-width="0.9"/><circle cx="{x + 3}" cy="{y - 1}" r="1.4" fill="#4e7a1e"/>')
    svg('blattlaeuse', 64, 64, '\n'.join([d for d in defs.split('\n')]), '\n'.join(body), 'Blattläuse auf einem Blatt (Futter).')


def bluete():
    defs = radial('blatt', st(('0', '#ffd6e6'), ('1', '#ec6fa8')))
    body = ['  <path d="M32,40 Q30,52 32,62" stroke="#3d8a26" stroke-width="3" fill="none"/>']
    for k in range(6):
        a = k / 6 * math.tau
        body.append(f'  <ellipse cx="{32 + math.cos(a) * 12:.1f}" cy="{28 + math.sin(a) * 12:.1f}" rx="10" ry="7" transform="rotate({k * 60} {32 + math.cos(a) * 12:.1f} {28 + math.sin(a) * 12:.1f})" fill="url(#blatt)" stroke="#c94a8a" stroke-width="1.2"/>')
    body.append('  <circle cx="32" cy="28" r="7" fill="#ffd84a" stroke="#d9a51c" stroke-width="1.4"/>')
    body.append('  <circle cx="30" cy="26" r="2" fill="#fff" opacity="0.6"/>')
    svg('bluete', 64, 64, defs, '\n'.join(body), 'Blüte mit Nektar (Futter).')


def apfel():
    defs = '\n'.join([radial('apfel', st(('0', '#ff9a8a'), ('0.6', '#e2423a'), ('1', '#a82020'))), radial('blatt', st(('0', '#a6e36a'), ('1', '#3d8a26')))])
    body = '''  <path d="M32,18 C20,10 6,18 8,36 C10,54 24,62 32,56 C40,62 54,54 56,36 C58,18 44,10 32,18 Z" fill="url(#apfel)" stroke="#8a1a14" stroke-width="2"/>
  <path d="M32,18 Q33,10 36,6" stroke="#6e4219" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M36,10 Q46,2 52,8 Q44,16 36,10 Z" fill="url(#blatt)" stroke="#2b6a1c" stroke-width="1.4"/>
  <ellipse cx="20" cy="30" rx="4" ry="7" fill="#fff" opacity="0.4"/>'''
    svg('apfel', 64, 64, defs, body, 'Apfel (Futter).')


def klee():
    defs = radial('blatt', st(('0', '#a6e36a'), ('1', '#3d8a26')))
    body = ['  <path d="M28,36 Q24,50 20,62" stroke="#3d8a26" stroke-width="3" fill="none"/>',
            '  <path d="M46,24 Q44,42 42,60" stroke="#3d8a26" stroke-width="2.6" fill="none"/>']
    for a in (-90, 30, 150):
        r = math.radians(a)
        cx, cy = 28 + math.cos(r) * 10, 36 + math.sin(r) * 10
        body.append(f'  <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="10" ry="8" transform="rotate({a + 90} {cx:.1f} {cy:.1f})" fill="url(#blatt)" stroke="#2b6a1c" stroke-width="1.2"/>')
        body.append(f'  <path d="M28,36 L{cx:.1f},{cy:.1f}" stroke="#2b6a1c" stroke-width="1" opacity="0.6"/>')
    for k in range(10):
        a = k / 10 * math.tau
        body.append(f'  <ellipse cx="{46 + math.cos(a) * 5:.1f}" cy="{16 + math.sin(a) * 6:.1f}" rx="2.6" ry="4" fill="#f29ac4" stroke="#c94a8a" stroke-width="0.6"/>')
    svg('klee', 64, 64, defs, '\n'.join(body), 'Klee mit Blüte (Futter).')


# ---------------------------------------------------------------- Weitere Tiere
# Alle schauen nach rechts. Insekten sind größer als in echt, damit Kinder
# sie gut sehen und antippen können.

def marienkaefer():
    defs = '\n'.join([radial('panzer', st(('0', '#ff7a6a'), ('0.6', '#e2302a'), ('1', '#a81a14'))), SHADOW_DEF])
    dots = ''.join(f'  <circle cx="{x}" cy="{y}" r="{r}" fill="#1a1a1a"/>\n' for x, y, r in [(26, 16, 3.6), (16, 22, 3.2), (30, 26, 3.2), (20, 31, 2.8), (12, 30, 2.4), (34, 18, 2.6), (24, 22, 2.2)])
    body = f'''{ground_shadow(26, 38, 20, 3)}
  <path d="M10,34 l-4,4 M18,36 l-2,4 M30,36 l2,4" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M4,32 Q4,8 24,8 Q40,8 42,30 Q40,36 24,36 Q6,36 4,32 Z" fill="url(#panzer)" stroke="#6e1410" stroke-width="1.8"/>
  <path d="M24,8 L24,36" stroke="#6e1410" stroke-width="1.4"/>
{dots}  <path d="M10,16 Q14,10 22,10" stroke="#fff" stroke-opacity="0.6" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M40,22 Q50,18 50,28 Q50,36 40,34 Z" fill="#1a1a1a"/>
  <path d="M46,20 Q48,12 52,10 M48,22 Q52,16 56,15" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <circle cx="45" cy="25" r="2.6" fill="#fff"/><circle cx="45.6" cy="25.4" r="1.4" fill="#1a1a1a"/>
  <circle cx="44" cy="31" r="1.4" fill="#fff"/>'''
    svg('marienkaefer', 58, 42, defs, body, 'Siebenpunkt-Marienkäfer.')


def zitronenfalter():
    defs = '\n'.join([radial('fluegel', st(('0', '#fffbb0'), ('0.55', '#f5e23a'), ('1', '#cdb41c')), cx='40%', cy='40%'), SHADOW_DEF])
    body = '''  <path d="M30,48 Q12,48 8,32 Q6,14 22,8 Q36,2 46,10 L54,3 Q56,14 50,22 Q48,30 52,36 L58,32 Q58,42 46,48 Z" fill="url(#fluegel)" stroke="#9a8414" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M30,46 Q24,30 28,14 M36,46 Q38,30 46,14 M30,46 Q18,40 12,30" stroke="#b5a01c" stroke-width="1.2" fill="none" opacity="0.7"/>
  <circle cx="34" cy="28" r="3" fill="#e8822a"/>
  <path d="M14,24 Q16,14 26,10" stroke="#fff" stroke-opacity="0.7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="38" cy="50" rx="14" ry="3.6" fill="#6a5a3a" stroke="#3a2a14" stroke-width="1.2"/>
  <path d="M34,53 l-2,6 M40,53 l0,6 M46,53 l2,6" stroke="#3a2a14" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="54" cy="48" r="5" fill="#6a5a3a" stroke="#3a2a14" stroke-width="1.2"/>
  <path d="M56,44 Q60,34 66,32 M57,45 Q64,40 69,40" stroke="#3a2a14" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <circle cx="66" cy="32" r="1.6" fill="#3a2a14"/><circle cx="69" cy="40" r="1.6" fill="#3a2a14"/>
  <circle cx="56" cy="47" r="2" fill="#fff"/><circle cx="56.5" cy="47.3" r="1.1" fill="#1a1a1a"/>'''
    svg('zitronenfalter', 72, 62, defs, body, 'Zitronenfalter (Flügel zusammengeklappt).')


def biene():
    defs = '\n'.join([
        radial('pelz', st(('0', '#ffd77a'), ('0.6', '#e8a63a'), ('1', '#b5741c'))),
        radial('fluegel', st(('0', '#ffffff', 0.9), ('1', '#cfe8ff', 0.6))),
        SHADOW_DEF,
    ])
    body = f'''  <ellipse cx="22" cy="14" rx="14" ry="9" transform="rotate(-25 22 14)" fill="url(#fluegel)" stroke="#9ab4cc" stroke-width="1.2"/>
  <path d="M14,36 l-2,8 M22,38 l0,8 M30,38 l2,8" stroke="#3a2a14" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="22" cy="30" rx="18" ry="12" fill="url(#pelz)" stroke="#7a4a14" stroke-width="1.6"/>
  <path d="M14,19 Q11,30 14,41 M23,18 Q20,30 23,42" stroke="#4a2c12" stroke-width="4" fill="none" opacity="0.75"/>
  <path d="M6,32 L1,33" stroke="#4a2c12" stroke-width="2" stroke-linecap="round"/>
  <circle cx="44" cy="28" r="9" fill="#4a3420" stroke="#2a1a0a" stroke-width="1.4"/>
  <path d="M46,20 Q48,10 54,8 M48,21 Q54,14 58,14" stroke="#2a1a0a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <circle cx="47" cy="26" r="3" fill="#fff"/><circle cx="47.6" cy="26.4" r="1.7" fill="#1a1a1a"/>
  <path d="M46,33 Q49,35 51,33" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="30" cy="14" rx="13" ry="8" transform="rotate(-10 30 14)" fill="url(#fluegel)" stroke="#9ab4cc" stroke-width="1.2"/>'''
    svg('biene', 60, 50, defs, body, 'Wildbiene.')


def amsel():
    defs = '\n'.join([radial('feder', st(('0', '#4a4a50'), ('0.6', '#26262a'), ('1', '#111114')), cx='40%', cy='30%'), SHADOW_DEF])
    body = f'''{ground_shadow(44, 76, 30, 4)}
  <path d="M36,62 L34,74 M46,62 L48,74" stroke="#c9862a" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M30,74 L38,74 M44,74 L52,74" stroke="#c9862a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M4,36 Q14,34 24,40 L22,48 Q10,46 4,36 Z" fill="url(#feder)" stroke="#000" stroke-width="1.2"/>
  <path d="M20,44 Q22,26 44,24 Q64,24 66,40 Q66,60 46,64 Q26,64 20,44 Z" fill="url(#feder)" stroke="#000" stroke-width="1.6"/>
  <path d="M26,40 Q38,34 52,40" stroke="#5a5a64" stroke-width="2" fill="none" opacity="0.8"/>
  <circle cx="64" cy="26" r="13" fill="url(#feder)" stroke="#000" stroke-width="1.6"/>
  <path d="M74,24 L88,28 L74,32 Z" fill="#ffb21c" stroke="#c97a10" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="68" cy="23" r="5" fill="#ffc93a"/>
{eye(68, 23, 3.4)}'''
    svg('amsel', 90, 80, defs, body, 'Amsel (Männchen).')


def specht():
    defs = '\n'.join([radial('schwarz', st(('0', '#3a3a40'), ('1', '#0e0e12'))), radial('weiss', st(('0', '#ffffff'), ('1', '#dcdcd4'))), SHADOW_DEF])
    body = f'''{ground_shadow(40, 106, 22, 4)}
  <path d="M30,84 L20,104 L32,96 Z" fill="url(#schwarz)" stroke="#000" stroke-width="1.2"/>
  <path d="M40,96 L38,106 M48,96 L50,106" stroke="#6a6a70" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M24,50 Q22,30 40,26 Q58,24 60,46 Q62,74 54,92 Q44,100 34,94 Q24,78 24,50 Z" fill="url(#schwarz)" stroke="#000" stroke-width="1.6"/>
  <path d="M44,40 Q58,44 56,70 Q52,88 44,92 Q38,70 44,40 Z" fill="url(#weiss)"/>
  <path d="M42,82 Q48,92 54,90 Q52,96 44,96 Z" fill="#e2302a"/>
  <path d="M28,50 Q32,46 34,56 M28,62 Q32,58 34,68" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="24" r="15" fill="url(#weiss)" stroke="#000" stroke-width="1.6"/>
  <path d="M34,20 Q40,8 52,9 Q60,10 62,18 Q52,16 46,20 Q40,24 34,20 Z" fill="url(#schwarz)"/>
  <path d="M33,22 Q34,14 38,12 Q38,20 33,22 Z" fill="#e2302a"/>
  <path d="M40,30 Q50,34 60,30" stroke="#0e0e12" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M62,22 L80,24 L62,28 Z" fill="#5a5a60" stroke="#2a2a30" stroke-width="1.2" stroke-linejoin="round"/>
{eye(55, 22, 3.4)}'''
    svg('specht', 82, 110, defs, body, 'Buntspecht (Männchen).')


def hase():
    defs = '\n'.join([
        radial('fell', st(('0', '#d9ad7a'), ('0.6', '#b5814e'), ('1', '#8a5a30')), cx='40%', cy='30%'),
        radial('hell', st(('0', '#fff8ec'), ('1', '#efdcc0'))),
        radial('ohr', st(('0', '#f7c3b0'), ('1', '#d9967e'))),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(52, 106, 44, 5)}
  <ellipse cx="14" cy="76" rx="9" ry="8" fill="url(#hell)" stroke="#a88a6a" stroke-width="1.4"/>
  <path d="M14,90 Q12,58 40,52 Q66,48 74,70 Q80,94 62,102 L24,102 Q14,100 14,90 Z" fill="url(#fell)" stroke="#5e3a1c" stroke-width="1.8"/>
  <ellipse cx="34" cy="98" rx="20" ry="7" fill="url(#fell)" stroke="#5e3a1c" stroke-width="1.6"/>
  <path d="M60,74 Q70,80 70,100 L60,102 Q58,88 60,74 Z" fill="url(#hell)"/>
  <path d="M64,102 L76,102" stroke="#5e3a1c" stroke-width="5" stroke-linecap="round"/>
  <path d="M62,30 Q54,2 60,0 Q70,4 70,30 Z" fill="url(#fell)" stroke="#5e3a1c" stroke-width="1.6"/>
  <path d="M63,26 Q58,8 61,4 Q66,8 67,26 Z" fill="url(#ohr)"/>
  <path d="M58,4 Q60,-2 64,0 Q62,4 60,6 Z" fill="#1a1a1a"/>
  <path d="M74,30 Q76,4 84,4 Q90,8 82,32 Z" fill="url(#fell)" stroke="#5e3a1c" stroke-width="1.6"/>
  <path d="M77,28 Q79,10 83,8 Q86,12 80,30 Z" fill="url(#ohr)"/>
  <path d="M82,4 Q86,0 89,4 Q87,8 84,8 Z" fill="#1a1a1a"/>
  <path d="M54,48 Q54,28 74,26 Q94,26 96,46 Q96,62 80,64 Q60,66 54,48 Z" fill="url(#fell)" stroke="#5e3a1c" stroke-width="1.8"/>
  <path d="M80,50 Q92,48 96,52 Q92,62 80,60 Z" fill="url(#hell)"/>
  <circle cx="95" cy="49" r="2.8" fill="#c9706a"/>
  <path d="M94,54 Q100,52 104,50 M94,56 Q100,57 104,58" stroke="#5e3a1c" stroke-width="0.9" fill="none"/>
{eye(78, 42, 5.4, '#6b3a14')}
  <ellipse cx="72" cy="54" rx="4" ry="2.6" fill="#ff8f8f" opacity="0.45"/>'''
    svg('hase', 106, 110, defs, body, 'Feldhase.')


def reh():
    defs = '\n'.join([
        radial('fell', st(('0', '#d99a5e'), ('0.6', '#b5733a'), ('1', '#8a5022')), cx='40%', cy='30%'),
        radial('hell', st(('0', '#fff8ec'), ('1', '#efdcc0'))),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(64, 146, 50, 5)}
  <path d="M30,96 L28,142 M44,98 L46,142 M84,98 L82,142 M96,94 L100,142" stroke="#8a5022" stroke-width="7" stroke-linecap="round"/>
  <path d="M26,142 L32,142 M44,142 L50,142 M80,142 L86,142 M98,142 L104,142" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/>
  <path d="M18,80 Q16,60 40,58 L96,56 Q112,58 110,80 Q108,102 90,104 L40,104 Q20,102 18,80 Z" fill="url(#fell)" stroke="#5e3214" stroke-width="1.8"/>
  <ellipse cx="22" cy="78" rx="9" ry="13" fill="url(#hell)"/>
  <path d="M40,100 Q64,108 92,100" stroke="#efdcc0" stroke-width="4" fill="none" opacity="0.7"/>
  <path d="M96,66 Q100,42 108,30 L122,36 Q114,52 110,74 Z" fill="url(#fell)" stroke="#5e3214" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M104,26 Q96,10 100,6 Q108,12 110,24 Z" fill="url(#fell)" stroke="#5e3214" stroke-width="1.4"/>
  <path d="M116,24 Q120,8 126,8 Q126,18 120,28 Z" fill="url(#fell)" stroke="#5e3214" stroke-width="1.4"/>
  <path d="M104,30 Q104,18 116,18 Q126,18 130,30 L134,40 Q132,46 124,46 Q110,46 104,30 Z" fill="url(#fell)" stroke="#5e3214" stroke-width="1.8" stroke-linejoin="round"/>
  <ellipse cx="128" cy="40" rx="5" ry="4.5" fill="url(#hell)"/>
  <circle cx="132" cy="38" r="3" fill="#1a1a1a"/>
{eye(117, 30, 4.4, '#3a2210')}'''
    svg('reh', 140, 150, defs, body, 'Reh (Ricke).')


def fuchs():
    defs = '\n'.join([
        radial('fell', st(('0', '#ffa65a'), ('0.6', '#e8742a'), ('1', '#b24a14')), cx='40%', cy='30%'),
        radial('hell', st(('0', '#ffffff'), ('1', '#f0e6d8'))),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(66, 88, 54, 5)}
  <path d="M8,56 Q-2,40 14,36 Q30,34 40,52 Q30,66 8,56 Z" fill="url(#fell)" stroke="#8a3410" stroke-width="1.6"/>
  <path d="M8,56 Q0,46 6,40 Q12,48 16,54 Z" fill="url(#hell)"/>
  <path d="M42,66 L40,86 M54,68 L54,86 M88,68 L88,86 M98,64 L102,86" stroke="#2a1a14" stroke-width="7" stroke-linecap="round"/>
  <path d="M30,56 Q30,40 54,40 L92,40 Q108,42 106,58 Q104,72 88,72 L48,72 Q30,70 30,56 Z" fill="url(#fell)" stroke="#8a3410" stroke-width="1.8"/>
  <path d="M92,48 Q104,50 104,64 Q96,72 88,70 Z" fill="url(#hell)"/>
  <path d="M94,22 L96,4 L106,18 Z" fill="url(#fell)" stroke="#8a3410" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M110,18 L118,2 L122,20 Z" fill="url(#fell)" stroke="#8a3410" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M97,18 L97,9 L102,16 Z M113,16 L117,8 L118,18 Z" fill="#2a1a14"/>
  <path d="M90,32 Q92,16 108,16 Q122,16 124,28 L134,36 Q134,42 126,42 L110,44 Q92,44 90,32 Z" fill="url(#fell)" stroke="#8a3410" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M104,38 Q118,44 132,38 Q126,46 112,46 Q104,44 104,38 Z" fill="url(#hell)"/>
  <circle cx="133" cy="37" r="3" fill="#1a1a1a"/>
{eye(112, 28, 4.6, '#7a4a10')}'''
    svg('fuchs', 138, 92, defs, body, 'Rotfuchs.')


def dachs():
    defs = '\n'.join([
        radial('fell', st(('0', '#b5b0a8'), ('0.6', '#8a857c'), ('1', '#5e5a52')), cx='40%', cy='30%'),
        radial('weiss', st(('0', '#ffffff'), ('1', '#e6e2da'))),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(60, 72, 52, 5)}
  <path d="M30,58 L28,70 M44,60 L44,70 M78,60 L78,70 M90,58 L94,70" stroke="#2a2622" stroke-width="8" stroke-linecap="round"/>
  <path d="M6,48 Q2,26 30,24 L82,22 Q100,24 100,44 Q100,62 82,62 L24,62 Q8,60 6,48 Z" fill="url(#fell)" stroke="#3e3a34" stroke-width="1.8"/>
  <path d="M14,30 Q40,22 80,26" stroke="#d6d0c6" stroke-width="3" fill="none" opacity="0.6"/>
  <path d="M86,32 Q90,20 106,22 Q116,24 120,36 L118,42 Q108,48 94,46 Q84,42 86,32 Z" fill="url(#weiss)" stroke="#3e3a34" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M92,26 Q104,30 118,38 L116,42 Q102,36 90,32 Z" fill="#1e1c1a"/>
  <circle cx="88" cy="24" r="5" fill="url(#weiss)" stroke="#3e3a34" stroke-width="1.4"/>
  <circle cx="119" cy="38" r="3" fill="#1a1a1a"/>
  <circle cx="104" cy="33" r="3.2" fill="#fff"/><circle cx="104.6" cy="33.4" r="2" fill="#1a1a1a"/><circle cx="103.6" cy="32.4" r="0.8" fill="#fff"/>'''
    svg('dachs', 124, 76, defs, body, 'Dachs.')


def maulwurf():
    defs = '\n'.join([
        radial('fell', st(('0', '#5a5660'), ('0.6', '#2e2c34'), ('1', '#16141a')), cx='40%', cy='30%'),
        radial('rosa', st(('0', '#ffd0c8'), ('1', '#e89a8e'))),
        radial('erde', st(('0', '#a8784a'), ('1', '#6a4428')), cx='50%', cy='30%'),
        SHADOW_DEF,
    ])
    body = f'''{ground_shadow(46, 60, 42, 4)}
  <path d="M4,60 Q12,38 46,36 Q80,38 88,60 Z" fill="url(#erde)" stroke="#4a2c12" stroke-width="1.8"/>
  <path d="M22,48 Q20,22 44,18 Q68,18 70,42 Q70,52 62,54 L30,54 Q22,54 22,48 Z" fill="url(#fell)" stroke="#0e0c10" stroke-width="1.6"/>
  <path d="M30,26 Q40,18 54,20" stroke="#8a8694" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M64,30 Q76,30 84,34 Q86,38 80,40 Q70,40 64,38 Z" fill="url(#rosa)" stroke="#c97a6e" stroke-width="1.2"/>
  <circle cx="84" cy="36" r="2.6" fill="#c9706a"/>
  <circle cx="62" cy="30" r="1.8" fill="#000"/><circle cx="61.6" cy="29.4" r="0.6" fill="#fff"/>
  <ellipse cx="30" cy="50" rx="10" ry="7" fill="url(#rosa)" stroke="#c97a6e" stroke-width="1.2"/>
  <path d="M22,48 l-4,-2 M22,51 l-5,0 M23,54 l-4,2" stroke="#c97a6e" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="62" cy="50" rx="10" ry="7" fill="url(#rosa)" stroke="#c97a6e" stroke-width="1.2"/>
  <path d="M70,48 l4,-2 M70,51 l5,0 M69,54 l4,2" stroke="#c97a6e" stroke-width="1.6" stroke-linecap="round"/>'''
    svg('maulwurf', 92, 62, defs, body, 'Maulwurf auf seinem Erdhügel.')


def fledermaus():
    defs = '\n'.join([
        radial('fell', st(('0', '#9a7458'), ('1', '#5e4230')), cx='40%', cy='30%'),
        linear('haut', st(('0', '#5a4a52'), ('1', '#2e242a'))),
        SHADOW_DEF,
    ])
    body = '''  <path d="M40,30 Q24,8 4,16 Q10,22 8,30 Q16,28 18,36 Q26,30 30,38 Q34,32 40,36 Z" fill="url(#haut)" stroke="#1a1418" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M50,30 Q66,8 86,16 Q80,22 82,30 Q74,28 72,36 Q64,30 60,38 Q56,32 50,36 Z" fill="url(#haut)" stroke="#1a1418" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M40,30 L10,18 M40,32 L18,34 M50,30 L80,18 M50,32 L72,34" stroke="#7a6a72" stroke-width="1" opacity="0.7"/>
  <ellipse cx="45" cy="36" rx="9" ry="12" fill="url(#fell)" stroke="#3a2a1e" stroke-width="1.6"/>
  <path d="M38,22 L36,8 L44,18 Z M52,22 L56,8 L48,18 Z" fill="url(#fell)" stroke="#3a2a1e" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M39,18 L38,11 L42,17 Z M51,18 L54,11 L50,17 Z" fill="#e8a89a"/>
  <circle cx="45" cy="26" r="9" fill="url(#fell)" stroke="#3a2a1e" stroke-width="1.6"/>
  <circle cx="41.5" cy="24" r="2.6" fill="#fff"/><circle cx="41.8" cy="24.4" r="1.6" fill="#1a1a1a"/>
  <circle cx="48.5" cy="24" r="2.6" fill="#fff"/><circle cx="48.8" cy="24.4" r="1.6" fill="#1a1a1a"/>
  <circle cx="45" cy="29" r="1.4" fill="#3a2a1e"/>
  <path d="M42,31 Q45,33 48,31" stroke="#3a2a1e" stroke-width="1.2" fill="none" stroke-linecap="round"/>'''
    svg('fledermaus', 90, 50, defs, body, 'Zwergfledermaus.')


def waldkauz():
    defs = '\n'.join([
        radial('feder', st(('0', '#c9915e'), ('0.6', '#9a6a3e'), ('1', '#6a4424')), cx='40%', cy='30%'),
        radial('schleier', st(('0', '#efd8b8'), ('1', '#c9a478'))),
        SHADOW_DEF,
    ])
    spots = ''.join(f'  <path d="M{x},{y} q3,4 0,8" stroke="#5a3a1c" stroke-width="2" fill="none" opacity="0.7"/>\n' for x, y in [(30, 60), (40, 66), (50, 60), (36, 76), (46, 78)])
    body = f'''{ground_shadow(40, 98, 26, 4)}
  <path d="M30,92 l-3,6 M34,92 l0,6 M46,92 l0,6 M50,92 l3,6" stroke="#8a6a3a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M14,60 Q12,36 40,34 Q68,36 66,60 Q66,92 40,94 Q14,92 14,60 Z" fill="url(#feder)" stroke="#4a2c12" stroke-width="1.8"/>
  <path d="M14,58 Q8,76 20,90 Q24,74 22,58 Z M66,58 Q72,76 60,90 Q56,74 58,58 Z" fill="#7a5230" stroke="#4a2c12" stroke-width="1.4"/>
{spots}  <circle cx="40" cy="30" r="24" fill="url(#feder)" stroke="#4a2c12" stroke-width="1.8"/>
  <path d="M40,14 Q24,12 20,30 Q22,46 40,44 Q58,46 60,30 Q56,12 40,14 Z" fill="url(#schleier)" stroke="#9a6a3e" stroke-width="1.4"/>
  <path d="M40,16 L40,38" stroke="#9a6a3e" stroke-width="1.6"/>
  <circle cx="31" cy="28" r="7" fill="#1e140c"/><circle cx="49" cy="28" r="7" fill="#1e140c"/>
  <circle cx="29" cy="25.6" r="2.4" fill="#fff"/><circle cx="47" cy="25.6" r="2.4" fill="#fff"/>
  <path d="M37,34 L40,42 L43,34 Z" fill="#e8c95a" stroke="#9a7a2a" stroke-width="1"/>'''
    svg('waldkauz', 80, 100, defs, body, 'Waldkauz.')


def biber():
    defs = '\n'.join([
        radial('fell', st(('0', '#b5804e'), ('0.6', '#8a5a30'), ('1', '#5e3a1c')), cx='40%', cy='30%'),
        radial('kelle', st(('0', '#6a5a52'), ('1', '#3a302a'))),
        SHADOW_DEF,
    ])
    scales = ''.join(f'  <path d="M{x},{y} l6,0" stroke="#8a7a70" stroke-width="1" opacity="0.7"/>\n' for x in range(6, 34, 8) for y in (60, 66, 72))
    body = f'''{ground_shadow(70, 80, 62, 5)}
  <path d="M4,66 Q2,56 16,56 L40,58 L40,74 L16,76 Q2,76 4,66 Z" fill="url(#kelle)" stroke="#221a16" stroke-width="1.6"/>
{scales}  <path d="M54,68 L52,78 M98,68 L100,78" stroke="#3a2412" stroke-width="7" stroke-linecap="round"/>
  <path d="M34,58 Q34,32 70,30 Q100,30 110,46 Q114,64 100,74 Q80,78 52,76 Q34,72 34,58 Z" fill="url(#fell)" stroke="#3a2412" stroke-width="1.8"/>
  <path d="M46,40 Q66,32 90,36" stroke="#d9a670" stroke-width="3" fill="none" opacity="0.5"/>
  <circle cx="104" cy="32" r="5" fill="url(#fell)" stroke="#3a2412" stroke-width="1.4"/>
  <path d="M96,40 Q100,26 116,26 Q128,28 130,42 Q130,52 118,54 Q102,56 96,40 Z" fill="url(#fell)" stroke="#3a2412" stroke-width="1.8"/>
  <circle cx="129" cy="40" r="3" fill="#1a1a1a"/>
  <rect x="120" y="50" width="4" height="7" rx="1" fill="#f28a2a" stroke="#a8541c" stroke-width="0.8"/>
  <rect x="124" y="50" width="4" height="7" rx="1" fill="#f28a2a" stroke="#a8541c" stroke-width="0.8"/>
{eye(114, 36, 3.8)}'''
    svg('biber', 134, 84, defs, body, 'Biber.')


gras()
blume('blume-gelb', '#fff3a0', '#f2c21c')
blume('blume-rosa', '#ffd6e6', '#f27aa8')
blume('blume-weiss', '#ffffff', '#d9dde6')
schatten()
igel()
ente('ente', False)
ente('ente-schwimmt', True)
eichhoernchen()
baum('baum', '#a5e07e', '#57ab47', '#2f7a2e', '#235e24', False)
baum('nussbaum', '#c3d67a', '#7e9a3c', '#4d6a22', '#3a521a', True)
teich()
schilf()
laubhaufen()
busch()
gedankenblase()
wurm()
kaefer()
nuss()
koerner()
wasserpflanze()
korb()
schaufel()
album()
symbol_frisur()
symbol_haarfarbe()
symbol_haut()
symbol_shirt()
symbol_hose()
sonne()
mond()
haus()
jahreszeit_fruehling()
jahreszeit_sommer()
jahreszeit_herbst()
jahreszeit_winter()
frosch()
steine()
baum('obstbaum', '#b5e07e', '#62b04a', '#357a2e', '#285e24', 'apfel')
blumenbeet()
insektenhotel()
hecke()
totholz()
erdbau()
nistkasten()
blattlaeuse()
bluete()
apfel()
klee()
marienkaefer()
zitronenfalter()
biene()
amsel()
specht()
hase()
reh()
fuchs()
dachs()
maulwurf()
fledermaus()
waldkauz()
biber()
print('fertig:', len(list(OUT.glob('*.svg'))), 'Dateien')
