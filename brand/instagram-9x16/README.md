# AgroAI — 9:16 vertical posts

9 files, **1080 × 1920 PNG**, ready to upload with no editing.

| # | File | Headline |
|---|---|---|
| 1 | `01-intro.png` | AgroAI — your smart farming companion |
| 2 | `02-crop-doctor.png` | Sick leaf? Take a photo. |
| 3 | `03-languages.png` | 23 Indian languages |
| 4 | `04-mandi.png` | Know the rate before you load the tractor |
| 5 | `05-satellite.png` | See your field from space |
| 6 | `06-free.png` | ₹0 — Free. Actually free. |
| 7 | `07-proverb.png` | उत्तम खेती, मध्यम बान। |
| 8 | `08-soil.png` | Your soil report, in plain language |
| 9 | `09-cta.png` | No app. No account. Just ask. |

Captions for each are in `../social-posts.md`.

## Where these belong

9:16 is the **Stories / Reels** shape. All the content sits between y=300 and y=1640,
clear of the Instagram UI that covers the top and bottom of the screen — your profile
name at the top, the reply bar and action buttons at the bottom. Nothing important
gets hidden.

**If you post one of these to the main feed instead, Instagram crops it to 4:5** and
you will lose the top and bottom. For feed posts the correct size is 1080 × 1350.

## Editing

Sources are the `.svg` files. Change the text, then re-export:

```bash
npx sharp-cli --input 01-intro.svg --output . resize 1080 1920 --format png
```
