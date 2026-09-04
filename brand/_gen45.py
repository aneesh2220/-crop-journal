# -*- coding: utf-8 -*-
import io
W, H = 1080, 1350          # 4:5 — the tallest ratio Instagram allows in the feed
M = 95
FONT = "Segoe UI, Roboto, Helvetica, Arial, sans-serif"
DARK, CREAM = "#0f3020", "#f4f1e6"
GOLD, LEAF, LEAF_LT, INK, WHT = "#e0a527", "#4a9c60", "#7dd39a", "#0f3020", "#ffffff"

def mark(x, y, s, light=False):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<rect width="64" height="64" rx="14" fill="{"#ffffff" if light else DARK}" fill-opacity="{0.14 if light else 1}"/>'
            f'<path d="M18 42c0-14 10-24 26-24 0 16-10 26-26 26z" fill="{LEAF_LT if light else LEAF}"/>'
            f'<path d="M18 44c8-8 14-14 26-26" stroke="{GOLD}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>')

def footer(dark, url=True):
    c, o = (WHT, 0.75) if dark else (INK, 0.62)
    out = mark(M, 1178, 0.86, light=dark) + \
          f'<text x="{M+74}" y="1206" fill="{c}" fill-opacity="{o}" font-size="31" font-weight="700">AgroAI</text>'
    if url:
        out += f'<text x="{M+74}" y="1242" fill="{c}" fill-opacity="{o*0.72}" font-size="27">agroai-five.vercel.app</text>'
    return out

def txt(items, y, size, gap, fill, w=700, op=1, x=M):
    return "".join(f'<text x="{x}" y="{y+i*gap}" fill="{fill}" fill-opacity="{op}" font-size="{size}" font-weight="{w}">{s}</text>'
                   for i, s in enumerate(items))

def eyebrow(l, dark, y=225):
    return f'<text x="{M}" y="{y}" fill="{GOLD if dark else LEAF}" font-size="31" font-weight="700" letter-spacing="3.5">{l}</text>'

def rule(y, w=500):
    return f'<rect x="{M}" y="{y}" width="{w}" height="6" rx="3" fill="{GOLD}"/>'

def tile(name, dark, body, url=True):
    if dark:
        blobs = ('<defs>'
          f'<radialGradient id="ga" cx="12%" cy="10%" r="54%"><stop offset="0%" stop-color="{GOLD}" stop-opacity="0.20"/><stop offset="100%" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>'
          f'<radialGradient id="gb" cx="88%" cy="88%" r="60%"><stop offset="0%" stop-color="{LEAF}" stop-opacity="0.34"/><stop offset="100%" stop-color="{LEAF}" stop-opacity="0"/></radialGradient>'
          f'</defs><rect width="{W}" height="{H}" fill="url(#ga)"/><rect width="{W}" height="{H}" fill="url(#gb)"/>')
    else:
        blobs = ('<defs>'
          f'<radialGradient id="gc" cx="88%" cy="12%" r="54%"><stop offset="0%" stop-color="{LEAF}" stop-opacity="0.17"/><stop offset="100%" stop-color="{LEAF}" stop-opacity="0"/></radialGradient>'
          f'</defs><rect width="{W}" height="{H}" fill="url(#gc)"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">'
           f'<rect width="{W}" height="{H}" fill="{DARK if dark else CREAM}"/>{blobs}{body}{footer(dark, url)}</svg>')
    io.open(f"instagram-4x5/{name}.svg", "w", encoding="utf-8").write(svg)

tile("01-intro", True,
  mark(M, 300, 3.6) +
  txt(["AgroAI"], 760, 128, 0, WHT) +
  txt(["Your smart farming", "companion."], 850, 50, 64, WHT, 400, 0.84) +
  txt(["Free · 23 Indian languages · No app"], 1010, 31, 0, GOLD, 600))

tile("02-crop-doctor", False,
  eyebrow("CROP DOCTOR", False) +
  txt(["Sick leaf?", "Take a", "photo."], 420, 118, 136, INK) +
  rule(830) +
  txt(["Get the likely problem, the cause,", "and how to treat it — in 30 seconds."], 920, 40, 56, INK, 400, 0.74))

tile("03-languages", True,
  eyebrow("SPEAKS YOUR LANGUAGE", True) +
  f'<text x="{M}" y="600" fill="{GOLD}" font-size="310" font-weight="700">23</text>' +
  txt(["Indian languages."], 700, 66, 0, WHT) +
  txt(["हिंदी में पूछिए, हिंदी में जवाब पाइए।"], 790, 44, 0, WHT, 400, 0.84) +
  txt(["Hindi · Bengali · Marathi · Telugu · Tamil", "Gujarati · Kannada · Malayalam · Punjabi +14"],
      880, 30, 42, WHT, 400, 0.58))

tile("04-mandi", False,
  eyebrow("MARKET WATCH", False) +
  txt(["Know the rate", "before you load", "the tractor."], 420, 98, 118, INK) +
  rule(800) +
  txt(["Today's mandi prices, with the", "MSP shown right beside them."], 890, 40, 56, INK, 400, 0.74))

tile("05-satellite", True,
  eyebrow("FIELD VIEW", True) +
  txt(["See your", "field from", "space."], 440, 120, 140, WHT) +
  txt(["Stand in your field. Tap once.", "The map lands on your land."], 930, 42, 58, WHT, 400, 0.8))

tile("06-free", False,
  eyebrow("WHAT IT COSTS", False) +
  f'<text x="{M}" y="620" fill="{INK}" font-size="330" font-weight="700">₹0</text>' +
  txt(["Free. Actually free."], 720, 66, 0, INK) +
  rule(790) +
  txt(["No subscription. No app to install.", "No account needed to start."], 880, 40, 56, INK, 400, 0.74))

tile("07-proverb", True,
  f'<text x="{M}" y="330" fill="{GOLD}" font-size="160" font-weight="700">“</text>' +
  txt(["उत्तम खेती,", "मध्यम बान।"], 560, 100, 128, WHT) +
  txt(["Farming is the finest work,", "trade comes second."], 800, 44, 60, WHT, 400, 0.78) +
  txt(["— traditional Indian proverb"], 910, 30, 0, WHT, 400, 0.5))

tile("08-soil", False,
  eyebrow("SOIL HEALTH", False) +
  txt(["Your soil report,", "in plain", "language."], 420, 98, 118, INK) +
  rule(800) +
  txt(["Type your pH and N-P-K values.", "Understand what to actually add."], 890, 40, 56, INK, 400, 0.74))

tile("09-cta", True,
  eyebrow("START NOW", True) +
  txt(["No app.", "No account.", "Just ask."], 440, 122, 144, WHT) +
  f'<rect x="{M}" y="900" width="660" height="104" rx="52" fill="{GOLD}"/>' +
  f'<text x="{M+330}" y="967" fill="{DARK}" font-size="41" font-weight="700" text-anchor="middle">agroai-five.vercel.app</text>',
  url=False)

print("9 feed tiles (4:5) generated")
