# Calibr logo assets

Direction 1b — "Dial". Mark: an open ring set to a position. Wordmark: Poppins SemiBold, tracking −0.02em.

Ready to drop into web and mobile builds. Vectors for anything that scales, HD PNGs for anything that can't load a font or an SVG.

## Colours
| Role | Hex |
|---|---|
| Brand blue | `#0060FF` |
| Brand bold (bloom) | `#1D46F3` |
| Brand deep (wordmark on light) | `#0A2DC1` |
| Brand ink (hub, midnight surface) | `#061E81` |
| Tints | `#CFD9FD` `#B4CCF8` `#EAF0FF` |
| Slate 800 (dark surface, mono mark) | `#1F2937` |

## Themes

| Theme | Surface | Logo | Glow |
|---|---|---|---|
| Light | `#FFFFFF` | blue mark, `#0A2DC1` wordmark | none |
| Dark | `#1F2937` | white mark + wordmark | `glow-sm` |
| Midnight | `#061E81` | white mark + wordmark | `glow-lg` |

```css
/* glow-sm — dark theme */
--calibr-glow-sm:
  0 0 1px rgba(255,255,255,.85),
  0 0 7px rgba(0,96,255,.70),
  0 0 20px rgba(0,96,255,.32);

/* glow-lg — midnight theme */
--calibr-glow-lg:
  0 0 1px rgba(255,255,255,.95),
  0 0 8px rgba(29,70,243,.90),
  0 0 24px rgba(0,96,255,.60),
  0 0 56px rgba(29,70,243,.40);
```

Apply to SVG with `filter: drop-shadow(...)` per layer; to live type with `text-shadow`. The glyph itself is never blurred — the halo sits outside a crisp edge. Halve every blur radius below a 24px mark. Light theme carries no glow.

## SVG — `svg/`

Vector, infinitely scalable, no rasterisation at any size.

| File | Use |
|---|---|
| `calibr-mark-color.svg` | Mark on light |
| `calibr-mark-white.svg` | Mark reversed |
| `calibr-mark-slate.svg` | Mark single colour |
| `calibr-mark-glow-dark.svg` | Mark with baked `glow-sm` filter |
| `calibr-mark-glow-midnight.svg` | Mark with baked `glow-lg` filter |
| `calibr-mark-16px.svg` | 16px mark — single arc, no hub or track |
| `calibr-appicon.svg` | App icon tile |
| `calibr-appicon-glow.svg` | App icon, ring lit |
| `calibr-lockup-horizontal-color.svg` | Horizontal lockup on light |
| `calibr-lockup-horizontal-white.svg` | Horizontal lockup reversed |
| `calibr-lockup-horizontal-glow-dark.svg` | Lockup, `glow-sm` |
| `calibr-lockup-horizontal-glow-midnight.svg` | Lockup, `glow-lg` |
| `calibr-lockup-stacked-color.svg` | Stacked lockup on light |

**Mark and app-icon SVGs are pure geometry — nothing to break.** The lockup SVGs use a live `<text>` node in Poppins, so they need Poppins available where they render (fine in any web or React Native build that already loads the brand font). Anywhere the font can't be guaranteed — print, PowerPoint, a client's deck, a third-party vendor — use the matching lockup PNG below, where the type is baked into pixels and cannot reflow or substitute.

## PNG — `png/`

Transparent background unless noted.

**Mark** — `calibr-mark-color-{2048,1024,512,256,128,64}.png`, `calibr-mark-white-{2048,1024,512,256,128,64}.png`, `calibr-mark-slate-{1024,256,128,64}.png`

**Mark, glowing** — `calibr-mark-glow-dark-{1024,512}.png`, `calibr-mark-glow-midnight-{1024,512}.png` (canvas padded 45% so the bloom is never clipped)

**App icon** — `calibr-appicon-{1024,512,192,180,120,64,32,16}.png`
1024 App Store · 512 Play Store · 192 Android/PWA · 180 iOS home screen · 120 iPhone · 64/32/16 favicon

**Lockups, 4× with type baked in**
- `calibr-lockup-horizontal-color.png` — 3196×1184
- `calibr-lockup-horizontal-slate.png` — 3196×1184
- `calibr-lockup-horizontal-white-on-blue.png` — 3196×1184
- `calibr-lockup-glow-dark.png` — 3356×1344
- `calibr-lockup-glow-midnight.png` — 3356×1344
- `calibr-lockup-stacked-color.png` — 2036×1824
- `calibr-wordmark-color.png` / `calibr-wordmark-white.png` — 2284×1024

## Rules
- Clear space on all sides = two-thirds of the ring height.
- Minimum lockup width 96px; below that use the mark alone (minimum 20px).
- The app-icon tile stays flat; only the ring inside it glows.
- Ship the flat lockup as the master asset — the glow is applied in code per theme.
- No stretching, no recolouring outside the blue family, no weight or tracking changes, no outlines.
- No glow on light surfaces.
