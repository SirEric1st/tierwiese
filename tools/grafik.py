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


def svg(name, w, h, defs, body, note):
    text = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
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
def figur():
    defs = '\n'.join([
        radial('haut', st(('0', '#ffe0c4'), ('1', '#eab48c')), cx='40%', cy='35%'),
        radial('haare', st(('0', '#a8693a'), ('0.6', '#7a4520'), ('1', '#5a3015'))),
        linear('pulli', st(('0', '#ff8f6b'), ('1', '#e2553a'))),
        linear('hose', st(('0', '#5476c4'), ('1', '#33508f'))),
        linear('schuh', st(('0', '#a0603a'), ('1', '#6e3a1e'))),
        SHADOW_DEF,
    ])
    body = f'''  <!-- Beine und Schuhe -->
  <rect x="33" y="110" width="15" height="30" rx="6" fill="url(#hose)" stroke="#2a4074" stroke-width="1.5"/>
  <rect x="52" y="110" width="15" height="30" rx="6" fill="url(#hose)" stroke="#2a4074" stroke-width="1.5"/>
  <path d="M27,146 Q27,135 39,135 Q48,135 48,142 L48,147 Q38,149 27,146 Z" fill="url(#schuh)" stroke="#55301a" stroke-width="1.5"/>
  <path d="M73,146 Q73,135 61,135 Q52,135 52,142 L52,147 Q62,149 73,146 Z" fill="url(#schuh)" stroke="#55301a" stroke-width="1.5"/>
  <!-- Arme -->
  <path d="M26,78 Q14,92 18,106" stroke="#e2553a" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M74,78 Q86,92 82,106" stroke="#e2553a" stroke-width="13" fill="none" stroke-linecap="round"/>
  <circle cx="18.5" cy="108" r="7" fill="url(#haut)" stroke="#c98e66" stroke-width="1.5"/>
  <circle cx="81.5" cy="108" r="7" fill="url(#haut)" stroke="#c98e66" stroke-width="1.5"/>
  <!-- Pulli -->
  <path d="M28,74 Q50,64 72,74 Q78,96 74,118 Q50,124 26,118 Q22,96 28,74 Z" fill="url(#pulli)" stroke="#b9432c" stroke-width="1.8"/>
  <path d="M30,112 Q50,118 70,112" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M33,80 Q40,76 46,78" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Stern auf dem Pulli -->
  <path d="M50,86 L53,93 L60.5,93.5 L54.8,98.2 L56.7,105.5 L50,101.5 L43.3,105.5 L45.2,98.2 L39.5,93.5 L47,93 Z" fill="#ffd84a" stroke="#e0a91f" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- Kopf -->
  <circle cx="21" cy="47" r="7" fill="url(#haut)" stroke="#c98e66" stroke-width="1.5"/>
  <circle cx="79" cy="47" r="7" fill="url(#haut)" stroke="#c98e66" stroke-width="1.5"/>
  <circle cx="50" cy="44" r="30" fill="url(#haut)" stroke="#c98e66" stroke-width="1.8"/>
  <!-- Haare -->
  <path d="M19,44 Q16,14 46,11 Q74,9 81,36 Q82,44 80,46 Q74,30 60,27 Q52,34 38,30 Q28,32 22,46 Z" fill="url(#haare)" stroke="#4a2810" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M34,18 Q46,12 60,16" stroke="#c98a55" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
  <!-- Augenbrauen, Augen, Wangen, Mund -->
  <path d="M33,35 Q38,32 43,34" stroke="#5a3015" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M57,34 Q62,32 67,35" stroke="#5a3015" stroke-width="2.4" fill="none" stroke-linecap="round"/>
{eye(39, 46, 6.4, '#5a3a1e')}
{eye(61, 46, 6.4, '#5a3a1e')}
  <ellipse cx="29" cy="57" rx="5.5" ry="3.5" fill="#ff8f8f" opacity="0.5"/>
  <ellipse cx="71" cy="57" rx="5.5" ry="3.5" fill="#ff8f8f" opacity="0.5"/>
  <path d="M43,58 Q50,65 57,58" stroke="#9a3d2b" stroke-width="2.6" fill="none" stroke-linecap="round"/>'''
    svg('figur', 100, 150, defs, body, 'Spielfigur (Kind).')


# ---------------------------------------------------------------- Igel
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
    if nuts:
        for x, y in [(52, 100), (110, 116), (140, 88), (80, 60), (40, 124), (126, 132), (98, 90), (66, 128)]:
            body.append(f'  <circle cx="{x}" cy="{y}" r="7.5" fill="url(#nuss)" stroke="#6a3e18" stroke-width="1.3"/>')
            body.append(f'  <path d="M{x},{y - 7} L{x},{y + 7}" stroke="#6a3e18" stroke-width="0.9" opacity="0.6"/>')
            body.append(f'  <circle cx="{x - 2.5}" cy="{y - 2.5}" r="2" fill="#fff" opacity="0.6"/>')
    svg(name, 180, 230, '\n'.join(defs), '\n'.join(body), 'Nussbaum (Walnuss).' if nuts else 'Laubbaum.')


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


gras()
blume('blume-gelb', '#fff3a0', '#f2c21c')
blume('blume-rosa', '#ffd6e6', '#f27aa8')
blume('blume-weiss', '#ffffff', '#d9dde6')
schatten()
figur()
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
print('fertig:', len(list(OUT.glob('*.svg'))), 'Dateien')
