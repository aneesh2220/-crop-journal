# AgroAI — Instagram grid (9 tiles)

All files are 1080×1080 PNG, ready to upload as-is.

## Post them in this order (bottom-right to top-left of the grid)

Instagram fills the grid right-to-left, so posting 01 → 09 in order gives you an
alternating dark/cream checkerboard once all nine are up.

| # | File | What it says | Caption to pair with it |
|---|---|---|---|
| 1 | `01-intro.png` | Brand intro | Post 1 (launch announcement) |
| 2 | `02-crop-doctor.png` | Sick leaf? Take a photo. | Post 2 (Crop Doctor) |
| 3 | `03-languages.png` | 23 Indian languages | Post 4 (language) |
| 4 | `04-mandi.png` | Know the rate before you load the tractor | Post 3 (mandi prices) |
| 5 | `05-satellite.png` | See your field from space | Post 5 (Field View) |
| 6 | `06-free.png` | ₹0 — actually free | Post 6 (no barriers) |
| 7 | `07-proverb.png` | उत्तम खेती, मध्यम बान। | Post 9 (founder story) |
| 8 | `08-soil.png` | Your soil report in plain language | Post 8 (soil health) |
| 9 | `09-cta.png` | No app. No account. Just ask. | Post 10 (share request) |

Captions are in `../social-posts.md`.

## The design system

- **Alternating tiles** — dark forest green and cream, so the grid has rhythm
- **Same logo lockup bottom-left on every tile** — this is what makes nine separate
  images read as one brand
- **One gold accent** used sparingly: the eyebrow label, the rule, the CTA pill
- **Left-aligned type with a hard left margin** on all nine — the eye tracks straight
  down the grid
- Big type, lots of empty space. Legible as a 150px thumbnail, which is how most
  people will actually see them.

## Editing

The `.svg` files are the sources. Edit text in any editor, then re-export:

```bash
npx sharp-cli --input 01-intro.svg --output . resize 1080 1080 --format png
```

## Honest note

These are typographic graphics, not photographs. They will make your profile look
considered and consistent — but a real photo of a real Indian field, or a 15-second
screen recording of Crop Doctor diagnosing an actual leaf, will out-perform any of
these on reach. Use these as the backbone of the grid and mix real photos in between.
