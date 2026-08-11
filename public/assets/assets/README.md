# Calibr logo assets

Direction 1b — "Dial". Mark: an open ring set to a position. Wordmark: Poppins SemiBold, tracking −0.02em.

## Colors
- Brand blue `#0060FF` — mark arc, app icon fill
- Brand deep `#0A2DC1` — wordmark on light
- Brand ink `#061E81` — mark hub
- Tint `#CFD9FD` — mark track
- Slate `#1F2937` — single-colour version

## SVG (`svg/`)
| File | Use |
|---|---|
| `calibr-mark-color.svg` | Mark, full colour on light |
| `calibr-mark-white.svg` | Mark, reversed on blue or ink |
| `calibr-mark-slate.svg` | Mark, single colour |
| `calibr-mark-16px.svg` | 16px mark — single arc, no hub or track |
| `calibr-appicon.svg` | Rounded-square app icon, blue fill |
| `calibr-lockup-horizontal-color.svg` | Horizontal lockup on light |
| `calibr-lockup-horizontal-white.svg` | Horizontal lockup reversed |
| `calibr-lockup-stacked-color.svg` | Stacked lockup on light |

Lockup SVGs use a live `<text>` element in Poppins. Poppins must be available where the SVG renders. Convert the text to outlines before sending to print or third parties.

## PNG (`png/`)
- `calibr-mark-color-{512,256,128,64}.png` — transparent background
- `calibr-mark-white-{512,256,128,64}.png` — transparent background, for dark surfaces
- `calibr-appicon-{1024,512,192,180,64,32,16}.png` — 1024 for App Store, 180 for iOS home screen, 192 for Android/PWA, 32 and 16 for favicon
- `calibr-lockup-horizontal-color.png`, `-slate.png`, `-white-on-blue.png` — 4× with baked type
- `calibr-lockup-stacked-color.png`, `calibr-wordmark-color.png` — 4× with baked type

## Rules
- Clear space on all sides = two-thirds of the ring height.
- Minimum lockup width 96px; below that use the mark alone (minimum 20px).
- No stretching, recolouring outside the blue family, weight or tracking changes, glows, shadows or outlines.
