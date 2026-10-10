# Genera l'illustrazione SVG della casetta nel bosco (Magic Bones):
#     python strumenti/casetta.py        → scrive site/assets/img/casetta.svg
# I colori sono scritti qui sotto (gradienti in fondo al file, palette del
# muschio, ecc.): per ricolorare la casetta si cambiano qui e si rilancia.
# Tutto calcolato con un seme fisso: il disegno è sempre lo stesso.
import math, random, io, sys, os

R = random.Random(11)
def f(x):
    s = '%.1f' % x
    return s[:-2] if s.endswith('.0') else s
def pt(p): return f(p[0]) + ' ' + f(p[1])

W, H = 640, 520
CK_CSS = '.ck{display:block; width:100%; height:auto; overflow:hidden} .ck-glow-s,.ck-glow-l{fill:url(#ckLantern)} .ck-glow-l{opacity:.45; transition:opacity 900ms var(--ease-out)} .ck-twine{fill:none; stroke:#8C6E46; stroke-width:1} .ck-stems{fill:none; stroke:#6E7A3A; stroke-width:1.2} .ck-tie{stroke:#B08850; stroke-width:2.4} .ck-gold-line{fill:none; stroke:#E5CE8B; stroke-width:1.6} .ck-iron{stroke:#1C1712; stroke-width:2} .ck-iron-fill{fill:#1C1712} .ck-drip{fill:none; stroke:#F6EEDB; stroke-width:1.6; stroke-linecap:round} .ck-smoke{filter:blur(1.6px)} .ck-puff{fill:none; stroke:rgba(206,208,198,.3); stroke-width:11; stroke-linecap:round; transform-box:fill-box; transform-origin:50% 100%; animation:ckSmoke 7s linear infinite} .ck-lantern{animation:ckSway 4.6s ease-in-out infinite alternate} .ck-charm{animation:ckSway 5.4s ease-in-out infinite alternate} .ck-flame{animation:ckFlicker 1.4s ease-in-out infinite alternate} .ck-fly{fill:#FFE9A8; animation:ckFly 8s ease-in-out infinite} .ck-rays{animation:ckRays 9s ease-in-out infinite alternate} .ck-window{filter:brightness(.82) saturate(.9); transition:filter 900ms var(--ease-out)} .ck-win-glow{opacity:.2; transition:opacity 900ms var(--ease-out); animation:ckBreath 3.2s ease-in-out infinite alternate} .ck-door{transition:transform 1s var(--ease-out)} .ck-spill{opacity:0; transition:opacity 1s var(--ease-out)} .ck-pool{transition:opacity 900ms} .ck-rune{transition:stroke 600ms, filter 600ms} @keyframes ckSmoke{0%{transform:translateY(14px) scale(.85); opacity:0} 18%{opacity:.7} 100%{transform:translateY(-46px) scale(1.3); opacity:0}} @keyframes ckSway{from{transform:rotate(-3deg)} to{transform:rotate(3deg)}} @keyframes ckFlicker{0%{transform:scale(1,1)} 45%{transform:scale(.88,1.12)} 100%{transform:scale(1.06,.92)}} @keyframes ckFly{0%{transform:translate(0,0); opacity:0} 20%{opacity:1} 55%{transform:translate(14px,-20px); opacity:.85} 100%{transform:translate(-8px,-40px); opacity:0}} @keyframes ckRays{from{opacity:.55} to{opacity:1}} @keyframes ckBreath{from{opacity:.75} to{opacity:1}} /* il tralcio è arrivato: in casa si accende la luce */ .cel-dolmen.is-lit .ck-window{filter:none} .cel-dolmen.is-lit .ck-win-glow{opacity:.42} .cel-dolmen.is-lit .ck-glow-l{opacity:1} /* bussa e entra: la porta si apre */ .cel-dolmen:hover .ck-door,.cel-dolmen:focus-visible .ck-door{transform:scaleX(.16) skewY(-8deg)} .cel-dolmen:hover .ck-spill,.cel-dolmen:focus-visible .ck-spill{opacity:.85} .cel-dolmen:hover .ck-pool,.cel-dolmen:focus-visible .ck-pool{opacity:.55} .cel-dolmen:hover .ck-rune,.cel-dolmen:focus-visible .ck-rune{stroke:#FFF2C0; filter:drop-shadow(0 0 4px #F2C888)} .cel-dolmen:hover .ck-window,.cel-dolmen:focus-visible .ck-window{filter:brightness(1.12)} @media (prefers-reduced-motion: reduce){ .ck-puff,.ck-lantern,.ck-charm,.ck-flame,.ck-fly,.ck-rays,.ck-win-glow{animation:none} .ck-fly{opacity:.7} .ck-door,.ck-spill,.ck-window,.ck-glow-l{transition:none} }'
GROUND = 446

def qb(p0, p1, p2, t):
    a = (1 - t) ** 2; b = 2 * (1 - t) * t; c = t * t
    return (a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1])
def qd(p0, p1, p2, t):  # derivata
    return (2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]))

# ------------------------------------------------------------------ tetto
P  = (350, 100); L  = (100, 294); RR = (600, 288)
CL = (212, 172); CR = (488, 168)
Pi = (350, 156); Li = (150, 292); Ri = (550, 286)
CLi = (238, 206); CRi = (462, 204)

def outer(t):   # t 0..1 da L a RR passando da P
    return qb(L, CL, P, t * 2) if t <= .5 else qb(P, CR, RR, (t - .5) * 2)
def inner(t):
    return qb(Li, CLi, Pi, t * 2) if t <= .5 else qb(Pi, CRi, Ri, (t - .5) * 2)
def band(t, s):
    o = outer(t); i = inner(t)
    return (o[0] * (1 - s) + i[0] * s, o[1] * (1 - s) + i[1] * s)
def inner_y(x):
    best = None
    for k in range(401):
        t = k / 400; p = inner(t)
        if best is None or abs(p[0] - x) < abs(best[0] - x): best = p
    return best[1]

roof_d = ('M' + pt(L) + 'Q' + pt(CL) + ' ' + pt(P) + 'Q' + pt(CR) + ' ' + pt(RR) +
          'L' + pt(Ri) + 'Q' + pt(CRi) + ' ' + pt(Pi) + 'Q' + pt(CLi) + ' ' + pt(Li) + 'Z')

# ------------------------------------------------------------------ muro
WL, WR = 168, 532
wall = 'M%d %d' % (WL, GROUND)
for k in range(0, 61):
    x = WL + (WR - WL) * k / 60
    wall += 'L' + f(x) + ' ' + f(inner_y(x) + 3)
wall += 'L%d %dZ' % (WR, GROUND)

planks = ''
x = WL + 14
while x < WR - 6:
    y0 = inner_y(x) + 6
    wob = R.uniform(-1.5, 1.5)
    planks += 'M' + f(x) + ' ' + f(y0) + 'Q' + f(x + wob) + ' ' + f((y0 + 404) / 2) + ' ' + f(x + R.uniform(-1, 1)) + ' 404'
    x += R.uniform(19, 24)
grain = ''
for _ in range(70):
    gx = R.uniform(WL + 8, WR - 8); gy = R.uniform(inner_y(gx) + 14, 396); gl = R.uniform(10, 26)
    grain += 'M' + f(gx) + ' ' + f(gy) + 'q' + f(R.uniform(-1.5, 1.5)) + ' ' + f(gl / 2) + ' ' + f(R.uniform(-1, 1)) + ' ' + f(gl)

# pietre del basamento
stones = ''; stone_hi = ''
y = 404
for row in range(3):
    x = WL - 4 + (row % 2) * 10
    while x < WR + 4:
        w = R.uniform(22, 36); h = R.uniform(12, 15)
        rx = min(w, h) * .45
        stones += 'M%s %sh%sa%s %s 0 0 1 %s %sv%sa%s %s 0 0 1 %s %sh%sa%s %s 0 0 1 %s %sv%sa%s %s 0 0 1 %s %sZ' % (
            f(x + rx), f(y), f(w - 2 * rx), f(rx), f(rx), f(rx), f(rx), f(h - 2 * rx), f(rx), f(rx), f(-rx), f(rx),
            f(-(w - 2 * rx)), f(rx), f(rx), f(-rx), f(-rx), f(-(h - 2 * rx)), f(rx), f(rx), f(rx), f(-rx))
        stone_hi += 'M' + f(x + 4) + ' ' + f(y + 3) + 'h' + f(w * .5)
        x += w + 2.5
    y += 14.2

# ------------------------------------------------------------------ comignolo
chim = 'M188 232L192 146h46l4 80Z'
chim_st = ''
for yy in range(150, 232, 11):
    off = 6 if (yy // 11) % 2 else 0
    xx = 191 + off
    while xx < 240:
        ww = R.uniform(13, 19)
        chim_st += 'M' + f(xx) + ' ' + f(yy) + 'h' + f(min(ww, 240 - xx)) + 'v9.5h' + f(-min(ww, 240 - xx)) + 'Z'
        xx += ww + 1.5

# fumo
smoke = []
for k in range(3):
    sx = 215 + k * 4
    d = 'M%s 140' % f(sx)
    yy = 140
    for j in range(5):
        d += 'q%s -14 %s -28' % (f((-1) ** (j + k) * R.uniform(10, 18)), f(R.uniform(-4, 6)))
    smoke.append(d)

# ------------------------------------------------------------------ tegole sulla falda
shingles = ''
for s in (.08, .3, .52, .74, .94):
    n = 46
    for k in range(n + 1):
        t = k / n
        if abs(t - .5) < .012: continue
        c = band(t, s)
        tx, ty = (qd(L, CL, P, t * 2) if t <= .5 else qd(P, CR, RR, (t - .5) * 2))
        a = math.atan2(ty, tx)
        w = 7.5
        p0 = (c[0] - math.cos(a) * w, c[1] - math.sin(a) * w)
        p1 = (c[0] + math.cos(a) * w, c[1] + math.sin(a) * w)
        shingles += 'M' + pt(p0) + 'A' + f(w) + ' ' + f(w * .8) + ' ' + f(math.degrees(a)) + ' 0 0 ' + pt(p1)

# ------------------------------------------------------------------ muschio
MOSS = ['#22320F', '#2C4015', '#364D1A', '#425C20', '#4E6A27', '#5A7830']
moss = {c: '' for c in MOSS}
moss_hi = ''
def blob(cx, cy, r):
    return 'M' + f(cx - r) + ' ' + f(cy) + 'a' + f(r) + ' ' + f(r * .82) + ' 0 1 0 ' + f(2 * r) + ' 0a' + f(r) + ' ' + f(r * .82) + ' 0 1 0 ' + f(-2 * r) + ' 0'
# cuscino lungo il bordo esterno: dal più scuro (sotto) al più chiaro (sopra)
for layer, (cnt, smin, smax, rmin, rmax, cols_) in enumerate((
        (190, -.05, .55, 4.5, 9.5, MOSS[0:3]),
        (220, -.12, .35, 3.2, 7.5, MOSS[2:5]),
        (220, -.16, .18, 2.2, 5, MOSS[3:6]))):
    for k in range(cnt):
        t = R.random()
        if abs(t - .5) < .02 and layer == 0: continue
        sv = R.uniform(smin, smax)
        if sv >= 0:
            c = band(t, sv)
        else:
            o = outer(t); c = (o[0], o[1] + sv * 26)
        moss[R.choice(cols_)] += blob(c[0] + R.uniform(-2, 2), c[1] + R.uniform(-2, 2), R.uniform(rmin, rmax))
        if layer == 2 and R.random() < .25:
            moss_hi += blob(c[0], c[1] - 1.5, R.uniform(.8, 1.6))
# ciuffi alle punte delle gronde
for (ex, ey, dirn) in [(L[0] + 4, L[1] + 2, 1), (RR[0] - 4, RR[1] + 2, -1)]:
    for j in range(16):
        moss[R.choice(MOSS[1:5])] += blob(ex + dirn * R.uniform(0, 46), ey + R.uniform(-6, 10), R.uniform(3, 7))
# barbe di muschio che pendono dal bordo interno del tetto
beards = ''
for k in range(34):
    t = R.uniform(.03, .97)
    if abs(t - .5) < .04: continue
    c = inner(t)
    ln = R.uniform(8, 26)
    beards += 'M' + f(c[0]) + ' ' + f(c[1] - 2) + 'q' + f(R.uniform(-3, 3)) + ' ' + f(ln / 2) + ' ' + f(R.uniform(-2, 2)) + ' ' + f(ln)

# ------------------------------------------------------------------ edera
ivy_stem = ''; ivy_leaf = ''
for (sx, ln) in [(176, 70), (196, 40), (520, 84), (500, 46), (286, 30), (420, 34), (460, 58)]:
    sy = inner_y(sx) + 2
    d = 'M' + f(sx) + ' ' + f(sy)
    x0, y0 = sx, sy
    segs = int(ln / 10)
    for j in range(segs):
        nx = x0 + R.uniform(-4, 4); ny = y0 + 10
        d += 'Q' + f(x0 + R.uniform(-5, 5)) + ' ' + f(y0 + 5) + ' ' + f(nx) + ' ' + f(ny)
        side = 1 if j % 2 else -1
        lx, ly = nx + side * 5, ny - 2
        a = side * R.uniform(20, 50)
        ivy_leaf += ('<path transform="translate(%s %s) rotate(%s)" d="M0 0C-4 -4 -4 -9 0 -8C4 -9 4 -4 0 0Z"/>' % (f(lx), f(ly), f(a)))
        x0, y0 = nx, ny
    ivy_stem += d

# ------------------------------------------------------------------ erbe appese e amuleti
herbs = ''
for hx in (206, 236, 262, 438, 466, 494, 516):
    hy = inner_y(hx) + 1
    ln = R.uniform(30, 44)
    stems = ''
    for j in range(7):
        a = (j - 3) * 3.2
        ex = hx + math.sin(math.radians(a)) * ln; ey = hy + 9 + math.cos(math.radians(a)) * ln
        stems += 'M' + f(hx) + ' ' + f(hy + 9) + 'L' + f(ex) + ' ' + f(ey)
    lav = R.random() < .6
    heads = ''
    for j in range(16):
        a = R.uniform(-10, 10); rr = R.uniform(ln * .55, ln * 1.02)
        cx = hx + math.sin(math.radians(a)) * rr; cy = hy + 9 + math.cos(math.radians(a)) * rr
        heads += 'M' + f(cx - 1.6) + ' ' + f(cy) + 'a1.6 2.4 0 1 0 3.2 0a1.6 2.4 0 1 0 -3.2 0'
    herbs += ('<g class="ck-herb"><path d="M%s %sv9" class="ck-twine"/>' % (f(hx), f(hy)) +
              '<path d="%s" class="ck-stems"/>' % stems +
              '<path d="%s" fill="%s"/>' % (heads, '#8E7CC3' if lav else R.choice(['#D9B26A', '#C9A9D6', '#E8DFC4'])) +
              '<path d="M%s %sh8" class="ck-tie"/></g>' % (f(hx - 4), f(hy + 10)))

def triquetra(cx, cy, r):
    c = [(cx + r * math.cos(-math.pi / 2 + k * 2 * math.pi / 3), cy + r * math.sin(-math.pi / 2 + k * 2 * math.pi / 3)) for k in range(3)]
    d = ''
    for k in range(3):
        a = c[k]; b = c[(k + 1) % 3]
        p = (a[0] + b[0] - cx, a[1] + b[1] - cy)
        d += 'M%s %sA%s %s 0 0 1 %sA%s %s 0 0 1 %s %s' % (f(cx), f(cy), f(r), f(r), pt(p), f(r), f(r), f(cx), f(cy))
    rr = r * .62
    d += 'M%s %sa%s %s 0 1 1 %s 0a%s %s 0 1 1 %s 0' % (f(cx + rr), f(cy), f(rr), f(rr), f(-2 * rr), f(rr), f(rr), f(2 * rr))
    return d

charms = ''
for (hx, ln) in ((290, 34), (410, 34)):
    hy = inner_y(hx) + 1
    charms += ('<g class="ck-charm" style="transform-origin:%spx %spx">' % (f(hx), f(hy)) +
               '<path d="M%s %sv%s" class="ck-twine"/>' % (f(hx), f(hy), f(ln - 9)) +
               '<path d="%s" class="ck-gold-line"/></g>' % triquetra(hx, hy + ln, 7.5))

# ------------------------------------------------------------------ porta e arco di pietra
DX, DW, DTOP, DR = 350, 92, 300, 46     # centro, larghezza, colmo, raggio
DCY = DTOP + DR
door_shape = 'M%s %sV%sA%s %s 0 0 1 %s %sV%sZ' % (f(DX - DR), f(GROUND), f(DCY), f(DR), f(DR), f(DX + DR), f(DCY), f(GROUND))
arch_st = ''
for k in range(11):
    a0 = math.pi + k * math.pi / 11 + .012; a1 = math.pi + (k + 1) * math.pi / 11 - .012
    r0, r1 = DR + 1, DR + 17
    p = lambda r, a: (DX + r * math.cos(a), DCY + r * math.sin(a))
    arch_st += 'M' + pt(p(r0, a0)) + 'L' + pt(p(r1, a0)) + 'A%s %s 0 0 1 %s' % (f(r1), f(r1), pt(p(r1, a1))) + 'L' + pt(p(r0, a1)) + 'A%s %s 0 0 0 %s' % (f(r0), f(r0), pt(p(r0, a0))) + 'Z'
jamb = ''
for side in (-1, 1):
    x0 = DX + side * (DR + 1) if side > 0 else DX - DR - 17
    yy = DCY
    while yy < GROUND - 2:
        hh = R.uniform(15, 21)
        jamb += 'M%s %sh16v%sh-16Z' % (f(x0 + (0 if side > 0 else 0)), f(yy + 1), f(min(hh, GROUND - yy) - 2))
        yy += hh
door_planks = ''
for k in range(1, 5):
    xx = DX - DR + k * DW / 5
    door_planks += 'M%s %sV%s' % (f(xx), f(DTOP), f(GROUND))
door_grain = ''
for _ in range(26):
    gx = R.uniform(DX - DR + 3, DX + DR - 3); gy = R.uniform(DCY - 20, GROUND - 10)
    door_grain += 'M%s %sq%s %s %s %s' % (f(gx), f(gy), f(R.uniform(-1, 1)), f(7), f(R.uniform(-1, 1)), f(R.uniform(10, 20)))
hinges = ''
for hy in (DCY + 6, GROUND - 26):
    hinges += ('M%s %sh50' % (f(DX - DR + 2), f(hy)) +
               'M%s %sc8 0 10 -9 3 -10' % (f(DX - DR + 52), f(hy)))

# interno (si vede quando la porta si apre)
interior_shelves = ''
for sy in (338, 368, 398):
    interior_shelves += 'M%s %sh%s' % (f(DX - DR + 6), f(sy), f(DW - 12))
jars = ''
for (jx, jy, jw, jh) in [(318, 338, 9, 13), (332, 338, 7, 9), (360, 338, 10, 15), (378, 338, 8, 11), (322, 368, 12, 10), (346, 368, 7, 14), (372, 368, 10, 12)]:
    jars += 'M%s %sh%sv-%sq-%s -4 -%s 0Z' % (f(jx), f(jy), f(jw), f(jh), f(jw / 2), f(jw))

# ------------------------------------------------------------------ finestra
WX, WY, WW, WRr = 222, 298, 64, 32      # centro x, colmo, larghezza, raggio
WCY = WY + WRr; WB = 384
win_shape = 'M%s %sV%sA%s %s 0 0 1 %s %sV%sZ' % (f(WX - WRr), f(WB), f(WCY), f(WRr), f(WRr), f(WX + WRr), f(WCY), f(WB))
win_bars = 'M%s %sV%sM%s %sH%sM%s %sH%s' % (f(WX), f(WY), f(WB), f(WX - WRr), f(WCY + 4), f(WX + WRr), f(WX - WRr), f(WCY + 30), f(WX + WRr))
for a in (205, 235, 305, 335):
    ra = math.radians(a)
    win_bars += 'M%s %sL%s %s' % (f(WX), f(WCY + 4), f(WX + WRr * math.cos(ra)), f(WCY + 4 + WRr * math.sin(ra)))
win_frame_out = 'M%s %sV%sA%s %s 0 0 1 %s %sV%sZ' % (f(WX - WRr - 7), f(WB + 3), f(WCY), f(WRr + 7), f(WRr + 7), f(WX + WRr + 7), f(WCY), f(WB + 3))

# ------------------------------------------------------------------ candele
def candle(cx, base, h, w=7, cls='ck-candle'):
    return ('<g class="%s">' % cls +
            '<ellipse class="ck-glow-s" cx="%s" cy="%s" rx="%s" ry="%s"/>' % (f(cx), f(base - h - 6), f(w * 2.6), f(w * 3)) +
            '<path d="M%s %sV%sq%s -2.4 %s 0V%sZ" fill="url(#ckCandle)"/>' % (f(cx - w / 2), f(base), f(base - h), f(w / 2), f(w), f(base)) +
            '<path d="M%s %sq-2 3 -.6 6" class="ck-drip"/>' % (f(cx + w / 2 - 1), f(base - h + 1)) +
            '<path class="ck-flame" style="transform-origin:%spx %spx" d="M%s %sc3 -4 2.2 -8.5 0 -12c-2.2 3.5 -3 8 0 12Z" fill="url(#ckFlame)"/>' % (f(cx), f(base - h - 1), f(cx), f(base - h - 1)) +
            '</g>')
candles = ''

# ------------------------------------------------------------------ teschio di cervo con corna
def antler(side):
    s = side
    bx, by = DX + s * 11, 238
    main = 'M%s %sC%s %s %s %s %s %s' % (f(bx), f(by), f(bx + s * 18), f(by - 6), f(bx + s * 40), f(by - 26), f(bx + s * 46), f(by - 62))
    tines = ('M%s %sC%s %s %s %s %s %s' % (f(bx + s * 22), f(by - 9), f(bx + s * 22), f(by - 24), f(bx + s * 18), f(by - 34), f(bx + s * 12), f(by - 42)) +
             'M%s %sC%s %s %s %s %s %s' % (f(bx + s * 36), f(by - 22), f(bx + s * 44), f(by - 30), f(bx + s * 56), f(by - 32), f(bx + s * 66), f(by - 30)) +
             'M%s %sC%s %s %s %s %s %s' % (f(bx + s * 42), f(by - 40), f(bx + s * 40), f(by - 52), f(bx + s * 34), f(by - 60), f(bx + s * 28), f(by - 66)) +
             'M%s %sC%s %s %s %s %s %s' % (f(bx + s * 45), f(by - 52), f(bx + s * 52), f(by - 60), f(bx + s * 60), f(by - 62), f(bx + s * 66), f(by - 70)))
    return main, tines
am_l, at_l = antler(-1); am_r, at_r = antler(1)
skull = ('M%s 228c-12 0 -20 6 -20 15c0 9 6 14 9 20c3 7 5 18 6 26c.5 4 3 6 5 6s4.5 -2 5 -6c1 -8 3 -19 6 -26c3 -6 9 -11 9 -20c0 -9 -8 -15 -20 -15Z' % f(DX))
skull_holes = ('M%s 244c-3 -4 -9 -4 -10 1c-1 4 4 7 8 6c3 -1 3 -4 2 -7Z' % f(DX - 4) +
               'M%s 244c3 -4 9 -4 10 1c1 4 -4 7 -8 6c-3 -1 -3 -4 -2 -7Z' % f(DX + 4) +
               'M%s 258c-2 6 -2 14 0 20c2 -6 2 -14 0 -20Z' % f(DX) +
               'M%s 286q4 2 8 0' % f(DX - 4))

# teschio d'ariete sul muro di destra
RX, RY = 474, 322
ram = ('M%s %sc-8 0 -13 5 -13 11c0 6 4 9 6 13c2 4 3 10 4 14c.5 2 2 3 3 3s2.5 -1 3 -3c1 -4 2 -10 4 -14c2 -4 6 -7 6 -13c0 -6 -5 -11 -13 -11Z' % (f(RX), f(RY - 2)))
ram_holes = ('M%s %sc-2 -3 -6 -3 -7 1c0 3 3 4 5 4c2 -1 2 -3 2 -5Z' % (f(RX - 3), f(RY + 7)) +
             'M%s %sc2 -3 6 -3 7 1c0 3 -3 4 -5 4c-2 -1 -2 -3 -2 -5Z' % (f(RX + 3), f(RY + 7)))
def horn(side):
    # spirale che parte dalla fronte, sale, gira e si arriccia verso l'interno
    cx = RX + 17; cy = RY + 4; d = ''
    for j in range(41):
        t = j / 40; a = math.radians(-150 + t * 340); r = 16 - t * 11
        x = cx + r * math.cos(a); y = cy + r * math.sin(a)
        if side < 0: x = 2 * RX - x
        d += ('M' if j == 0 else 'L') + f(x) + ' ' + f(y)
    return d
horns = horn(-1) + horn(1)

# ------------------------------------------------------------------ lanterne
def lantern(lx, ly, k):
    return ('<g class="ck-lantern" style="transform-origin:%spx %spx;animation-delay:-%ss">' % (f(lx), f(ly - 22), f(k * 1.7)) +
            '<path d="M%s %sV%s" class="ck-iron"/>' % (f(lx), f(ly - 22), f(ly - 13)) +
            '<circle class="ck-glow-l" cx="%s" cy="%s" r="40"/>' % (f(lx), f(ly + 6)) +
            '<path d="M%s %sh12l3 5h-18Z" class="ck-iron-fill"/>' % (f(lx - 6), f(ly - 13)) +
            '<rect x="%s" y="%s" width="16" height="22" rx="2" fill="url(#ckLanternGlass)" stroke="#2A1C10" stroke-width="2"/>' % (f(lx - 8), f(ly - 8)) +
            '<path d="M%s %sV%sM%s %sV%s" stroke="#2A1C10" stroke-width="1.5"/>' % (f(lx - 3), f(ly - 8), f(ly + 14), f(lx + 3), f(ly - 8), f(ly + 14)) +
            '<path class="ck-flame" style="transform-origin:%spx %spx" d="M%s %sc2.4 -3 1.8 -6.6 0 -9.5c-1.8 2.9 -2.4 6.5 0 9.5Z" fill="url(#ckFlame)"/>' % (f(lx), f(ly + 9), f(lx), f(ly + 9)) +
            '<path d="M%s %sh20l-3 4h-14Z" class="ck-iron-fill"/>' % (f(lx - 10), f(ly + 14)) +
            '</g>')
brackets = ''
for (bx0, bx1, by) in ((262, 278, 268), (438, 422, 268)):
    brackets += 'M%s %sH%sM%s %sq-1 -8 %s -10' % (f(bx0), f(by), f(bx1), f(bx0), f(by + 9), f(bx1 - bx0))

# ------------------------------------------------------------------ alberi ai lati
def trunk(x0, x1, side):
    d = 'M%s 0' % f(x0)
    d += 'C%s 120 %s 300 %s %s' % (f(x0 + side * 6), f(x0 - side * 4), f(x0 - side * 26), f(GROUND + 30))
    d += 'L%s %s' % (f(x1 + side * 30), f(GROUND + 30))
    d += 'C%s 300 %s 120 %s 0Z' % (f(x1 + side * 4), f(x1 - side * 2), f(x1))
    return d
bark = ''
for (xa, xb) in ((0, 54), (588, 640)):
    for _ in range(12):
        bx = R.uniform(xa + 6, xb - 6); by = R.uniform(10, 380)
        bark += 'M%s %sq%s %s %s %s' % (f(bx), f(by), f(R.uniform(-3, 3)), f(20), f(R.uniform(-2, 2)), f(R.uniform(30, 70)))
roots = ('M20 450C50 440 80 446 112 462C82 456 54 458 30 470Z' +
         'M44 438C70 424 96 424 126 436C98 434 76 438 58 448Z' +
         'M618 448C590 440 560 446 528 462C556 456 584 458 608 470Z')
canopy = {'#0F170A': '', '#15200D': '', '#1B2911': '', '#223316': ''}
for (cx0, cx1, cy0, cy1) in ((-30, 210, -30, 96), (430, 670, -30, 96)):
    for _ in range(80):
        col = R.choice(list(canopy.keys()))
        yy = R.uniform(cy0, cy1)
        canopy[col] += blob(R.uniform(cx0, cx1), yy, R.uniform(7, 20) * (1.2 - (yy - cy0) / (cy1 - cy0) * .5))
leaf_hi = ''
for _ in range(60):
    side = R.choice(((0, 190), (450, 640)))
    leaf_hi += blob(R.uniform(*side), R.uniform(30, 100), R.uniform(1.5, 3.5))

# ------------------------------------------------------------------ terra, scalini, funghi, fiori, felci
steps = ''
for k, (w, y0) in enumerate(((112, 446), (132, 458), (156, 470))):
    steps += 'M%s %sh%sq6 0 6 6v4q0 4 -6 4h-%sq-6 0 -6 -4v-4q0 -6 6 -6Z' % (f(DX - w / 2), f(y0), f(w), f(w))
ground = 'M0 %sC120 %s 220 %s 320 %sS540 %s 640 %sV520H0Z' % (f(GROUND + 4), f(GROUND - 6), f(GROUND + 8), f(GROUND + 2), f(GROUND - 4), f(GROUND + 2))

def amanita(cx, base, r, sh):
    stem = 'M%s %sQ%s %s %s %sL%s %sQ%s %s %s %sZ' % (f(cx - r * .3), f(base), f(cx - r * .36), f(base - sh * .5), f(cx - r * .22), f(base - sh), f(cx + r * .22), f(base - sh), f(cx + r * .36), f(base - sh * .5), f(cx + r * .3), f(base))
    top = base - sh
    cap = 'M%s %sQ%s %s %s %sQ%s %s %s %sQ%s %s %s %sZ' % (f(cx - r), f(top + 2), f(cx - r), f(top - r * 1.05), f(cx), f(top - r * 1.02), f(cx + r), f(top - r * 1.05), f(cx + r), f(top + 2), f(cx), f(top + r * .2), f(cx - r), f(top + 2))
    dots = ''
    for _ in range(6):
        dots += blob(cx + R.uniform(-.65, .65) * r, top - R.uniform(.2, .8) * r, R.uniform(.06, .11) * r)
    ring = 'M%s %sq%s 3 %s 0' % (f(cx - r * .3), f(top + sh * .32), f(r * .3), f(r * .6))
    return stem, cap, dots, ring
am_stems = am_caps = am_dots = am_rings = ''
am_glow = ''
for (cx, base, r, sh) in ((70, 468, 30, 40), (122, 474, 20, 28), (100, 488, 13, 18), (574, 480, 15, 20), (600, 486, 10, 14)):
    s1, c1, d1, r1 = amanita(cx, base, r, sh)
    am_stems += s1; am_caps += c1; am_dots += d1; am_rings += r1
    am_glow += '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="url(#ckWarm)" opacity=".35"/>' % (f(cx), f(base), f(r * 2.2), f(r * .5))

flowers = ''
for _ in range(26):
    fx = R.choice([R.uniform(10, 300), R.uniform(400, 630)]); fy = R.uniform(470, 512)
    rr = R.uniform(2.6, 4.2)
    if R.random() < .6:
        petals = ''
        for j in range(8):
            a = j * math.pi / 4
            petals += blob(fx + math.cos(a) * rr, fy + math.sin(a) * rr * .8, rr * .55)
        flowers += '<path d="%s" fill="#F3EEDD"/><circle cx="%s" cy="%s" r="%s" fill="#E5B84A"/>' % (petals, f(fx), f(fy), f(rr * .5))
    else:
        flowers += '<path d="%s" fill="#8E7CC3"/>' % (blob(fx, fy, rr * .8) + blob(fx + 3, fy - 4, rr * .6) + blob(fx - 2, fy - 7, rr * .5))
ferns = ''
def fern(x, y, h, lean):
    tx, ty = x + lean, y - h; mx, my = x + lean * .2, y - h * .6
    d = 'M%s %sQ%s %s %s %s' % (f(x), f(y), f(mx), f(my), f(tx), f(ty))
    for k in range(1, 12):
        t = k / 12; it = 1 - t
        px = it * it * x + 2 * it * t * mx + t * t * tx; py = it * it * y + 2 * it * t * my + t * t * ty
        Ln = (1 - t) * h * .3 + 3
        d += 'M%s %sq%s %s %s %s' % (f(px), f(py), f(-Ln * .5), f(-Ln * .15), f(-Ln), f(-Ln * .5))
        d += 'M%s %sq%s %s %s %s' % (f(px), f(py), f(Ln * .5), f(-Ln * .15), f(Ln), f(-Ln * .5))
    return d
for (x, y, h, lean) in ((150, 500, 70, 26), (178, 506, 54, 10), (24, 512, 80, 30), (480, 506, 60, -14), (520, 510, 74, -24), (630, 512, 70, -30), (256, 516, 40, 8)):
    ferns += fern(x, y, h, lean)

# tavolo a destra con candele, teschietto, cristalli, barattolo
table = ('M486 404h92v7h-92Z' + 'M492 411h7v35h-7Z' + 'M566 411h7v35h-7Z' + 'M494 428h76v4h-76Z')
crystal = ('M548 404l4 -18l4 18Z' + 'M544 404l3 -11l3 11Z' + 'M554 404l2.5 -9l2.5 9Z')
bird = 'M520 404c0 -6 4 -9 9 -9c4 0 7 2 7 5c0 2 -1 3 -3 3l-7 1c-2 0 -2 0 -3 0Z'
bird_eye = 'M528 399a1.6 1.6 0 1 0 .1 0'
jar = 'M500 404v-14q0 -3 3 -3h8q3 0 3 3v14Z'
candles += candle(560, 404, 22, 7) + candle(571, 404, 15, 6) + candle(508, 387, 10, 5)
# candele a terra a sinistra su un sasso
rock = 'M136 470c-4 -14 8 -24 30 -24c22 0 34 8 34 20c0 8 -10 10 -30 10c-20 0 -32 0 -34 -6Z'
candles += candle(152, 452, 26, 8) + candle(166, 452, 18, 7) + candle(180, 454, 12, 6)
# candela sul davanzale
candles += candle(212, 384, 14, 6) + candle(234, 384, 10, 5)

# lucciole
flies = ''
for k in range(16):
    fx = R.uniform(40, 600); fy = R.uniform(120, 470)
    flies += '<circle class="ck-fly" style="animation-delay:-%ss;animation-duration:%ss" cx="%s" cy="%s" r="%s"/>' % (f(R.uniform(0, 8)), f(R.uniform(6, 11)), f(fx), f(fy), f(R.uniform(1.4, 2.4)))

# ------------------------------------------------------------------ montaggio
svg = []
A = svg.append
A('<svg class="ck" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="22 58 596 462" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">')
A('<defs><style>%s</style>' % CK_CSS)
A('<radialGradient id="ckBg" cx="50%" cy="58%" r="60%"><stop offset="0" stop-color="#F2C888" stop-opacity=".42"/><stop offset=".45" stop-color="#E0A85F" stop-opacity=".12"/><stop offset="1" stop-color="#E0A85F" stop-opacity="0"/></radialGradient>')
A('<linearGradient id="ckRay" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".32"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></linearGradient>')
A('<linearGradient id="ckWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E3D22"/><stop offset=".6" stop-color="#4A2F1A"/><stop offset="1" stop-color="#2E1C0F"/></linearGradient>')
A('<linearGradient id="ckRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A4632"/><stop offset="1" stop-color="#2E2318"/></linearGradient>')
A('<linearGradient id="ckStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A766A"/><stop offset="1" stop-color="#45423A"/></linearGradient>')
A('<linearGradient id="ckDoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6E4524"/><stop offset=".5" stop-color="#8E5C30"/><stop offset="1" stop-color="#5E3A1E"/></linearGradient>')
A('<radialGradient id="ckWin" cx="50%" cy="62%" r="70%"><stop offset="0" stop-color="#FFF1C4"/><stop offset=".45" stop-color="#F2C46E"/><stop offset="1" stop-color="#A2561C"/></radialGradient>')
A('<radialGradient id="ckIn" cx="50%" cy="70%" r="80%"><stop offset="0" stop-color="#FFF3CC"/><stop offset=".5" stop-color="#F0B868"/><stop offset="1" stop-color="#7A3E14"/></radialGradient>')
A('<radialGradient id="ckWarm"><stop offset="0" stop-color="#F2C888" stop-opacity=".9"/><stop offset="1" stop-color="#F2C888" stop-opacity="0"/></radialGradient>')
A('<radialGradient id="ckLantern"><stop offset="0" stop-color="#FFE3A6" stop-opacity=".75"/><stop offset=".4" stop-color="#F2C888" stop-opacity=".2"/><stop offset="1" stop-color="#F2C888" stop-opacity="0"/></radialGradient>')
A('<linearGradient id="ckLanternGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE8B0"/><stop offset="1" stop-color="#E9A54E"/></linearGradient>')
A('<linearGradient id="ckCandle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6EEDB"/><stop offset=".6" stop-color="#E8DCC0"/><stop offset="1" stop-color="#B9A988"/></linearGradient>')
A('<radialGradient id="ckFlame" cx="50%" cy="75%" r="70%"><stop offset="0" stop-color="#FFFDF0"/><stop offset=".5" stop-color="#FFD98A"/><stop offset="1" stop-color="#F09A3E"/></radialGradient>')
A('<linearGradient id="ckBone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EEDB"/><stop offset="1" stop-color="#CDBF9F"/></linearGradient>')
A('<radialGradient id="ckCap" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#E05A40"/><stop offset=".6" stop-color="#B23A26"/><stop offset="1" stop-color="#7E2418"/></radialGradient>')
A('<clipPath id="ckRoofClip"><path d="%s"/></clipPath>' % roof_d)
A('<clipPath id="ckWallClip"><path d="%s"/></clipPath>' % wall)
A('<clipPath id="ckDoorClip"><path d="%s"/></clipPath>' % door_shape)
A('<clipPath id="ckWinClip"><path d="%s"/></clipPath>' % win_shape)
A('</defs>')

# sfondo: alone, raggi di luce, alberi
A('<rect class="ck-bg" x="-40" y="-20" width="720" height="560" fill="url(#ckBg)"/>')
A('<g class="ck-rays"><path d="M90 -10L170 -10L380 520L250 520Z" fill="url(#ckRay)"/><path d="M200 -10L240 -10L470 520L400 520Z" fill="url(#ckRay)" opacity=".7"/><path d="M20 -10L60 -10L190 520L130 520Z" fill="url(#ckRay)" opacity=".5"/></g>')
A('<g class="ck-trees">')
for col, d in canopy.items(): A('<path d="%s" fill="%s"/>' % (d, col))
A('<path d="%s" fill="#1F150D"/><path d="%s" fill="#1F150D"/>' % (trunk(0, 54, 1), trunk(640, 588, -1)))
A('<path d="M52 0C58 120 50 300 30 476M590 0C584 120 590 300 610 476" fill="none" stroke="#5A3E22" stroke-width="3" opacity=".55"/>')
A('<path d="%s" fill="#2E4420" opacity=".8"/>' % leaf_hi)
A('<path d="%s" fill="none" stroke="#1A100A" stroke-width="2" opacity=".7"/>' % bark)
A('<path d="%s" fill="#1F150D"/>' % roots)
A('</g>')

# casa: comignolo dietro il tetto, muro, tetto
A('<g class="ck-chimney"><path d="%s" fill="url(#ckStone)"/><path d="%s" fill="none" stroke="#2F2C26" stroke-width="1.6"/><path d="M184 142h60v9h-60Z" fill="#3F3C34"/><path d="%s" fill="#364D1A"/></g>' % (chim, chim_st, blob(196, 142, 6) + blob(206, 140, 5) + blob(232, 141, 4.5)))
A('<g class="ck-smoke">' + ''.join('<path class="ck-puff" style="animation-delay:-%ss" d="%s"/>' % (f(k * 2.2), d) for k, d in enumerate(smoke)) + '</g>')
A('<path d="%s" fill="url(#ckWall)"/>' % wall)
A('<g clip-path="url(#ckWallClip)"><path d="%s" fill="none" stroke="#2A1A0E" stroke-width="2"/><path d="%s" fill="none" stroke="#2A1A0E" stroke-width=".8" opacity=".55"/>' % (planks, grain))
A('<path d="M%d 286H%dM%d 402H%d" stroke="#2A1A0E" stroke-width="7"/>' % (WL, WR, WL, WR))
A('<path d="%s" fill="url(#ckStone)" stroke="#2F2C26" stroke-width="1"/><path d="%s" stroke="#A8A396" stroke-width="1.2" opacity=".5" fill="none"/></g>' % (stones, stone_hi))
A('<path d="M%d 284V446M%d 278V446" stroke="#24160C" stroke-width="10"/>' % (WL + 4, WR - 4))

# finestra
A('<path d="%s" fill="#2A1A0E"/>' % win_frame_out)
A('<g class="ck-window"><path d="%s" fill="url(#ckWin)"/>' % win_shape)
A('<g clip-path="url(#ckWinClip)"><path d="M196 384v-30h10v30ZM238 384v-22h8v22Z" fill="#7A3E14" opacity=".55"/></g>')
A('<path d="%s" fill="none" stroke="#2A1A0E" stroke-width="3.4"/></g>' % win_bars)
A('<rect class="ck-win-glow" x="150" y="270" width="144" height="150" fill="url(#ckWarm)" opacity=".35"/>')
A('<path d="M184 384h76v8h-76Z" fill="#3A2414"/><path d="M188 392h68v9h-68Z" fill="#4A2F1A"/>')
lav = ''
for j in range(11):
    lx = 192 + j * 6; lav += 'M%s 392q%s -8 %s -16' % (f(lx), f(R.uniform(-2, 2)), f(R.uniform(-2, 2)))
A('<path d="%s" stroke="#5F7A2E" stroke-width="1.4" fill="none"/>' % lav)
lavh = ''.join(blob(192 + j * 6 + R.uniform(-1, 1), 376 + R.uniform(-2, 2), 2) for j in range(11))
A('<path d="%s" fill="#8E7CC3"/>' % lavh)

# porta: interno, porta che si apre, arco di pietra
A('<g class="ck-doorway"><path d="%s" fill="url(#ckIn)"/>' % door_shape)
A('<g clip-path="url(#ckDoorClip)" class="ck-interior"><path d="%s" stroke="#5A3214" stroke-width="3"/><path d="%s" fill="#6E3A18" opacity=".7"/>' % (interior_shelves, jars))
A('<path d="M%s 418c0 -6 5 -9 11 -9s11 3 11 9" fill="#4A2A12"/></g>' % f(DX - 11))
A('<g class="ck-door" style="transform-origin:%spx %spx">' % (f(DX - DR), f(DCY + 40)))
A('<path d="%s" fill="url(#ckDoor)"/>' % door_shape)
A('<g clip-path="url(#ckDoorClip)"><path d="%s" stroke="#3E2512" stroke-width="2"/><path d="%s" stroke="#4A2C14" stroke-width=".8" opacity=".6" fill="none"/></g>' % (door_planks, door_grain))
A('<path d="%s" fill="none" stroke="#1C1712" stroke-width="5" stroke-linecap="round"/>' % hinges)
A('<path class="ck-rune" d="%s" fill="none" stroke="#E5CE8B" stroke-width="2.4"/>' % triquetra(DX, DCY - 4, 11))
A('<circle cx="%s" cy="%s" r="6" fill="none" stroke="#1C1712" stroke-width="2.5"/><circle cx="%s" cy="%s" r="2.2" fill="#1C1712"/>' % (f(DX + 30), f(DCY + 52), f(DX + 30), f(DCY + 45)))
A('</g></g>')
A('<path d="%s" fill="url(#ckStone)" stroke="#2F2C26" stroke-width="1.2"/>' % arch_st)
A('<path d="%s" fill="url(#ckStone)" stroke="#2F2C26" stroke-width="1"/>' % jamb)

# teschio d'ariete e mensola
ridges = ''
for side in (-1, 1):
    cx = RX + 17; cy = RY + 4
    for j in range(2, 38, 3):
        t = j / 40; a = math.radians(-150 + t * 340); r0 = 16 - t * 11
        x0 = cx + (r0 - 3) * math.cos(a); y0 = cy + (r0 - 3) * math.sin(a)
        x1 = cx + (r0 + 3) * math.cos(a); y1 = cy + (r0 + 3) * math.sin(a)
        if side < 0: x0 = 2 * RX - x0; x1 = 2 * RX - x1
        ridges += 'M%s %sL%s %s' % (f(x0), f(y0), f(x1), f(y1))
A('<path d="%s" fill="none" stroke="#7C6E52" stroke-width="8.5" stroke-linecap="round"/>' % horns)
A('<path d="%s" fill="none" stroke="url(#ckBone)" stroke-width="6" stroke-linecap="round"/>' % horns)
A('<path d="%s" stroke="#9C8D6E" stroke-width="1" opacity=".8"/>' % ridges)
A('<path d="%s" fill="url(#ckBone)" stroke="#8C7E62" stroke-width="1"/><path d="%s" fill="#2A1A0E"/>' % (ram, ram_holes))

# tetto, tegole, muschio, edera
A('<path d="%s" fill="url(#ckRoof)"/>' % roof_d)
A('<g clip-path="url(#ckRoofClip)"><path d="%s" fill="none" stroke="#2A2016" stroke-width="1.4" opacity=".8"/></g>' % shingles)
for col, d in moss.items(): A('<path d="%s" fill="%s"/>' % (d, col))
A('<path d="%s" fill="#8FAA4A" opacity=".55"/>' % moss_hi)
A('<path d="%s" fill="none" stroke="#3E5A20" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>' % beards)
A('<path d="%s" fill="none" stroke="#3B521E" stroke-width="1.2"/><g fill="#3E6224">%s</g>' % (ivy_stem, ivy_leaf))

# teschio di cervo sopra la porta
A('<g class="ck-stag">')
A('<path d="%s%s" fill="none" stroke="#7C6E52" stroke-width="7.5" stroke-linecap="round"/>' % (am_l, am_r))
A('<path d="%s%s" fill="none" stroke="#7C6E52" stroke-width="5.5" stroke-linecap="round"/>' % (at_l, at_r))
A('<path d="%s%s" fill="none" stroke="url(#ckBone)" stroke-width="5" stroke-linecap="round"/>' % (am_l, am_r))
A('<path d="%s%s" fill="none" stroke="url(#ckBone)" stroke-width="3.4" stroke-linecap="round"/>' % (at_l, at_r))
A('<path d="%s" fill="url(#ckBone)" stroke="#8C7E62" stroke-width="1.2"/><path d="%s" fill="#2A1A0E" stroke="#2A1A0E" stroke-width="1"/>' % (skull, skull_holes))
A('</g>')

# erbe appese, amuleti, mensole delle lanterne, lanterne
A('<g class="ck-herbs">' + herbs + '</g>')
A(charms)
A('<path d="%s" fill="none" stroke="#1C1712" stroke-width="3" stroke-linecap="round"/>' % brackets)
A(lantern(270, 290, 0) + lantern(430, 290, 1))

# terra, scalini, sasso, tavolo
A('<path d="%s" fill="#1C2412"/>' % ground)
A('<ellipse class="ck-pool" cx="%s" cy="490" rx="160" ry="34" fill="url(#ckWarm)" opacity=".28"/>' % f(DX))
A('<path d="%s" fill="url(#ckStone)" stroke="#2F2C26" stroke-width="1"/>' % steps)
A('<path class="ck-spill" d="M%s %sL%s %sL%s 520L%s 520Z" fill="url(#ckWarm)" style="mix-blend-mode:screen"/>' % (f(DX - DR), f(GROUND - 2), f(DX + DR), f(GROUND - 2), f(DX + 120), f(DX - 120)))
A('<path d="%s" fill="#4A4A40"/>' % rock)
A('<path d="%s" fill="#3A2414"/><path d="%s" fill="#C9B6E6" opacity=".85"/><path d="%s" fill="url(#ckBone)"/><path d="%s" fill="#2A1A0E"/><path d="%s" fill="#4E6A3A" opacity=".75"/>' % (table, crystal, bird, bird_eye, jar))
A(candles)

# funghi, fiori, felci in primo piano
A(am_glow)
A('<path d="%s" fill="url(#ckBone)"/><path d="%s" fill="url(#ckCap)"/><path d="%s" fill="#F6EEDB"/><path d="%s" stroke="#B8AA88" stroke-width="1.2" fill="none"/>' % (am_stems, am_caps, am_dots, am_rings))
A('<path d="%s" fill="none" stroke="#2E4A1E" stroke-width="2.2" stroke-linecap="round"/>' % ferns)
A(flowers)
A('<g class="ck-flies">' + flies + '</g>')
A('</svg>')

out = ''.join(svg)
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'assets', 'img', 'casetta.svg')
io.open(dest, 'w', encoding='utf-8').write(out)
print(len(out))
