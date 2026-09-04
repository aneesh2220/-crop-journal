# -*- coding: utf-8 -*-
import io

W, H = 1080, 1920
M = 100                      # left margin
FONT = "Segoe UI, Roboto, Helvetica, Arial, sans-serif"
DARK, CREAM = "#0f3020", "#f4f1e6"
GOLD, LEAF, LEAF_LT, INK, WHT = "#e0a527", "#4a9c60", "#7dd39a", "#0f3020", "#ffffff"

# Instagram overlays its own UI over roughly the top 260px and bottom 320px of a
# 9:16 story/reel. Everything that matters lives between those two lines.
TOP_SAFE, BOT_SAFE = 300, 1640

def mark(x, y, scale, light=False):
    return (f'<g transform="translate({x} {y}) scale({scale})">'
            f'<rect width="64" height="64" rx="14" fill="{"#ffffff" if light else DARK}" fill-opacity="{0.14 if light else 1}"/>'
            f'<path d="M18 42c0-14 10-24 26-24 0 16-10 26-26 26z" fill="{LEAF_LT if light else LEAF}"/>'
            f'<path d="M18 44c8-8 14-14 26-26" stroke="{GOLD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
            '</g>')

def footer(dark):
    col = WHT if dark else INK
    op = 0.75 if dark else 0.62
    return (mark(M, 1508, 0.95, light=dark) +
            f'<text x="{M+82} " y="1538" fill="{col}" fill-opacity="{op}" font-size="34" font-weight="700">AgroAI</text>'
            f'<text x="{M+82}" y="1578" fill="{col}" fill-opacity="{op*0.72}" font-size="30">agroai-five.vercel.app</text>')

def txt(items, y, size, gap, fill, weight=700, op=1, x=M):
    return "".join(f'<text x="{x}" y="{y+i*gap}" fill="{fill}" fill-opacity="{op}" font-size="{size}" font-weight="{weight}">{s}</text>'
                   for i, s in enumerate(items))

def eyebrow(label, dark, y=400):
    return f'<text x="{M}" y="{y}" fill="{GOLD if dark else LEAF}" font-size="34" font-weight="700" letter-spacing="4">{label}</text>'

def rule(y, w=520):
    return f'<rect x="{M}" y="{y}" width="{w}" height="7" rx="3.5" fill="{GOLD}"/>'

def tile(name, dark, body, foot=True):
    bg = DARK if dark else CREAM
    if dark:
        blobs = ('<defs>'
                 f'<radialGradient id="ga" cx="12%" cy="10%" r="52%"><stop offset="0%" stop-color="{GOLD}" stop-opacity="0.20"/><stop offset="100%" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>'
                 f'<radialGradient id="gb" cx="88%" cy="88%" r="58%"><stop offset="0%" stop-color="{LEAF}" stop-opacity="0.34"/><stop offset="100%" stop-color="{LEAF}" stop-opacity="0"/></radialGradient>'
                 '</defs>'
                 f'<rect width="{W}" height="{H}" fill="url(#ga)"/><rect width="{W}" height="{H}" fill="url(#gb)"/>')
    else:
        blobs = ('<defs>'
                 f'<radialGradient id="gc" cx="88%" cy="12%" r="52%"><stop offset="0%" stop-color="{LEAF}" stop-opacity="0.17"/><stop offset="100%" stop-color="{LEAF}" stop-opacity="0"/></radialGradient>'
                 '</defs>'
                 f'<rect width="{W}" height="{H}" fill="url(#gc)"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">'
           f'<rect width="{W}" height="{H}" fill="{bg}"/>{blobs}{body}{footer(dark) if foot else ""}</svg>')
    io.open(f"instagram-9x16/{name}.svg", "w", encoding="utf-8").write(svg)

# ── 1 · intro ─────────────────────────────────────────────────────────────
tile("01-intro", True,
  mark(M, 560, 4.6) +
  txt(["AgroAI"], 1090, 148, 0, WHT) +
  txt(["Your smart farming", "companion."], 1190, 56, 72, WHT, 400, 0.84) +
  txt(["Free · 23 Indian languages · No app"], 1360, 34, 0, GOLD, 600))

# ── 2 · crop doctor ───────────────────────────────────────────────────────
tile("02-crop-doctor", False,
  eyebrow("CROP DOCTOR", False) +
  txt(["Sick leaf?", "Take a", "photo."], 640, 132, 152, INK) +
  rule(1110) +
  txt(["Get the likely problem,", "the cause, and how to treat it", "— in about 30 seconds."], 1210, 44, 62, INK, 400, 0.74))

# ── 3 · languages ─────────────────────────────────────────────────────────
tile("03-languages", True,
  eyebrow("SPEAKS YOUR LANGUAGE", True) +
  f'<text x="{M}" y="880" fill="{GOLD}" font-size="380" font-weight="700">23</text>' +
  txt(["Indian languages."], 990, 74, 0, WHT) +
  txt(["हिंदी में पूछिए,", "हिंदी में जवाब पाइए।"], 1090, 52, 68, WHT, 400, 0.84) +
  txt(["Hindi · Bengali · Marathi · Telugu · Tamil", "Gujarati · Kannada · Malayalam · Punjabi +14"],
      1250, 32, 46, WHT, 400, 0.58))

# ── 4 · mandi ─────────────────────────────────────────────────────────────
tile("04-mandi", False,
  eyebrow("MARKET WATCH", False) +
  txt(["Know the rate", "before you", "load the", "tractor."], 620, 112, 132, INK) +
  rule(1140) +
  txt(["Today's mandi prices, with the", "MSP shown right beside them."], 1240, 44, 62, INK, 400, 0.74))

# ── 5 · satellite ─────────────────────────────────────────────────────────
tile("05-satellite", True,
  eyebrow("FIELD VIEW", True) +
  txt(["See your", "field from", "space."], 660, 132, 152, WHT) +
  txt(["Stand in your field.", "Tap once. The map", "lands on your land."], 1200, 46, 64, WHT, 400, 0.8))

# ── 6 · free ──────────────────────────────────────────────────────────────
tile("06-free", False,
  eyebrow("WHAT IT COSTS", False) +
  f'<text x="{M}" y="900" fill="{INK}" font-size="400" font-weight="700">₹0</text>' +
  txt(["Free. Actually free."], 1010, 74, 0, INK) +
  rule(1080) +
  txt(["No subscription.", "No app to install.", "No account needed to start."], 1180, 44, 62, INK, 400, 0.74))

# ── 7 · proverb ───────────────────────────────────────────────────────────
tile("07-proverb", True,
  f'<text x="{M}" y="520" fill="{GOLD}" font-size="180" font-weight="700">“</text>' +
  txt(["उत्तम खेती,", "मध्यम बान।"], 800, 112, 148, WHT) +
  txt(["Farming is the finest work,", "trade comes second."], 1080, 48, 64, WHT, 400, 0.78) +
  txt(["— traditional Indian proverb"], 1200, 32, 0, WHT, 400, 0.5))

# ── 8 · soil ──────────────────────────────────────────────────────────────
tile("08-soil", False,
  eyebrow("SOIL HEALTH", False) +
  txt(["Your soil", "report, in", "plain", "language."], 620, 118, 140, INK) +
  rule(1170) +
  txt(["Type your pH and N-P-K values.", "Understand what to actually add."], 1270, 42, 60, INK, 400, 0.74))

# ── 9 · cta ───────────────────────────────────────────────────────────────
tile("09-cta", True,
  eyebrow("START NOW", True) +
  txt(["No app.", "No account.", "Just ask."], 680, 136, 158, WHT) +
  f'<rect x="{M}" y="1200" width="700" height="112" rx="56" fill="{GOLD}"/>' +
  f'<text x="{M+350}" y="1272" fill="{DARK}" font-size="44" font-weight="700" text-anchor="middle">agroai-five.vercel.app</text>' +
  mark(M, 1508, 0.95, light=True) +
  f'<text x="{M+82}" y="1552" fill="{WHT}" fill-opacity="0.75" font-size="34" font-weight="700">AgroAI</text>',
  foot=False)

print("9 vertical tiles generated")
