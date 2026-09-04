# -*- coding: utf-8 -*-
import io, os

W = 1080
FONT = "Segoe UI, Roboto, Helvetica, Arial, sans-serif"

DARK_BG   = "#0f3020"
CREAM_BG  = "#f4f1e6"
GOLD      = "#e0a527"
LEAF      = "#4a9c60"
LEAF_LT   = "#7dd39a"
INK       = "#0f3020"

def leaf(x, y, scale, tile=True, light=False):
    """The AgroAI mark, same geometry as the logo files."""
    box = 64 * scale
    out = [f'<g transform="translate({x} {y}) scale({scale})">']
    if tile:
        out.append(f'<rect width="64" height="64" rx="14" fill="{"#ffffff" if light else DARK_BG}" fill-opacity="{0.12 if light else 1}"/>')
    out.append(f'<path d="M18 42c0-14 10-24 26-24 0 16-10 26-26 26z" fill="{LEAF_LT if light else LEAF}"/>')
    out.append(f'<path d="M18 44c8-8 14-14 26-26" stroke="{GOLD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    out.append('</g>')
    return "".join(out), box

def footer(dark):
    """Consistent bottom lockup on every tile — this is what makes the grid read as one brand."""
    col = "#ffffff" if dark else INK
    op  = 0.72 if dark else 0.6
    mark, _ = leaf(90, 938, 0.72, tile=True, light=dark)
    return (mark +
      f'<text x="145" y="962" fill="{col}" fill-opacity="{op}" font-size="27" font-weight="600">AgroAI</text>'
      f'<text x="145" y="994" fill="{col}" fill-opacity="{op*0.75}" font-size="24">agroai-five.vercel.app</text>')

def tile(name, dark, body, accent_blobs=True):
    bg = DARK_BG if dark else CREAM_BG
    blobs = ""
    if dark and accent_blobs:
        blobs = (
          '<defs>'
          '<radialGradient id="ga" cx="15%" cy="12%" r="55%">'
          f'<stop offset="0%" stop-color="{GOLD}" stop-opacity="0.20"/><stop offset="100%" stop-color="{GOLD}" stop-opacity="0"/>'
          '</radialGradient>'
          '<radialGradient id="gb" cx="88%" cy="85%" r="62%">'
          f'<stop offset="0%" stop-color="{LEAF}" stop-opacity="0.34"/><stop offset="100%" stop-color="{LEAF}" stop-opacity="0"/>'
          '</radialGradient>'
          '</defs>'
          f'<rect width="{W}" height="{W}" fill="url(#ga)"/><rect width="{W}" height="{W}" fill="url(#gb)"/>')
    elif accent_blobs:
        blobs = (
          '<defs><radialGradient id="gc" cx="85%" cy="15%" r="55%">'
          f'<stop offset="0%" stop-color="{LEAF}" stop-opacity="0.16"/><stop offset="100%" stop-color="{LEAF}" stop-opacity="0"/>'
          '</radialGradient></defs>'
          f'<rect width="{W}" height="{W}" fill="url(#gc)"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}" font-family="{FONT}">'
           f'<rect width="{W}" height="{W}" fill="{bg}"/>{blobs}{body}{footer(dark)}</svg>')
    io.open(f"instagram/{name}.svg", "w", encoding="utf-8").write(svg)
    return name

def eyebrow(text, dark, y=180):
    col = GOLD if dark else LEAF
    return f'<text x="90" y="{y}" fill="{col}" font-size="30" font-weight="700" letter-spacing="3">{text}</text>'

def lines(items, x, y, size, gap, fill, weight=700, opacity=1):
    return "".join(f'<text x="{x}" y="{y + i*gap}" fill="{fill}" fill-opacity="{opacity}" font-size="{size}" font-weight="{weight}">{s}</text>'
                   for i, s in enumerate(items))

W_ = "#ffffff"

# ── 1 · brand intro (dark) ────────────────────────────────────────────────
mark, _ = leaf(90, 300, 3.4, tile=True)
tile("01-intro", True,
  mark +
  lines(["AgroAI"], 90, 700, 118, 0, W_) +
  lines(["Your smart farming", "companion."], 90, 782, 46, 58, W_, 400, 0.82))

# ── 2 · crop doctor (cream) ───────────────────────────────────────────────
tile("02-crop-doctor", False,
  eyebrow("CROP DOCTOR", False) +
  lines(["Sick leaf?", "Take a", "photo."], 90, 330, 104, 118, INK) +
  f'<rect x="90" y="700" width="500" height="6" rx="3" fill="{GOLD}"/>' +
  lines(["Get the likely problem, the cause,", "and how to treat it — in 30 seconds."],
        90, 772, 38, 52, INK, 400, 0.72))

# ── 3 · languages stat (dark) ─────────────────────────────────────────────
tile("03-languages", True,
  eyebrow("SPEAKS YOUR LANGUAGE", True) +
  f'<text x="90" y="500" fill="{GOLD}" font-size="300" font-weight="700">23</text>' +
  lines(["Indian languages."], 90, 590, 62, 0, W_) +
  lines(["हिंदी में पूछिए, हिंदी में जवाब पाइए।"], 90, 680, 42, 0, W_, 400, 0.8) +
  lines(["Hindi · Bengali · Marathi · Telugu · Tamil", "Gujarati · Kannada · Malayalam · Punjabi +14"],
        90, 762, 32, 44, W_, 400, 0.6))

# ── 4 · mandi prices (cream) ──────────────────────────────────────────────
tile("04-mandi", False,
  eyebrow("MARKET WATCH", False) +
  lines(["Know the rate", "before you load", "the tractor."], 90, 330, 88, 108, INK) +
  f'<rect x="90" y="690" width="500" height="6" rx="3" fill="{GOLD}"/>' +
  lines(["Today's mandi prices, with MSP", "shown right beside them."],
        90, 762, 38, 52, INK, 400, 0.72))

# ── 5 · satellite (dark) ──────────────────────────────────────────────────
tile("05-satellite", True,
  eyebrow("FIELD VIEW", True) +
  lines(["See your", "field from", "space."], 90, 350, 108, 122, W_) +
  lines(["Stand in your field. Tap once.", "The map lands on your land."],
        90, 780, 38, 52, W_, 400, 0.78))

# ── 6 · price stat (cream) ────────────────────────────────────────────────
tile("06-free", False,
  eyebrow("WHAT IT COSTS", False) +
  f'<text x="90" y="520" fill="{INK}" font-size="330" font-weight="700">₹0</text>' +
  lines(["Free. Actually free."], 90, 620, 62, 0, INK) +
  lines(["No subscription. No app to install.", "No account needed to start."],
        90, 706, 38, 52, INK, 400, 0.72))

# ── 7 · proverb (dark) ────────────────────────────────────────────────────
tile("07-proverb", True,
  f'<text x="90" y="300" fill="{GOLD}" font-size="150" font-weight="700">“</text>' +
  lines(["उत्तम खेती,", "मध्यम बान।"], 90, 470, 92, 112, W_) +
  lines(["Farming is the finest work,", "trade comes second."], 90, 700, 40, 54, W_, 400, 0.75) +
  lines(["— traditional Indian proverb"], 90, 800, 30, 0, W_, 400, 0.5))

# ── 8 · soil (cream) ──────────────────────────────────────────────────────
tile("08-soil", False,
  eyebrow("SOIL HEALTH", False) +
  lines(["Your soil report,", "in plain", "language."], 90, 330, 88, 108, INK) +
  f'<rect x="90" y="690" width="500" height="6" rx="3" fill="{GOLD}"/>' +
  lines(["Type your pH and N-P-K values.", "Understand what to actually add."],
        90, 762, 38, 52, INK, 400, 0.72))

# ── 9 · call to action (dark) ─────────────────────────────────────────────
tile("09-cta", True,
  eyebrow("START NOW", True) +
  lines(["No app.", "No account.", "Just ask."], 90, 360, 112, 126, W_) +
  f'<rect x="90" y="760" width="620" height="92" rx="46" fill="{GOLD}"/>' +
  f'<text x="400" y="818" fill="{DARK_BG}" font-size="38" font-weight="700" text-anchor="middle">agroai-five.vercel.app</text>')

print("generated 9 tiles")
