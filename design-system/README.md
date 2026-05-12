# NepSaathi Design System

Community marketplace for Nepalese Australians — jobs, rooms, events, businesses, and notices.

---

## Brand in one paragraph

NepSaathi is the trusted digital meeting place for Nepalis living in Australia. The tone is warm, welcoming, and practical — not corporate. Every design decision should feel like help from a friend, not a bureaucracy. The name *Saathi* means "friend" in Nepali; that word shapes everything.

---

## Core Identity

| Element | Value |
|---------|-------|
| **Tagline** | *your Nepali friend, wherever you are* |
| **Personality** | Warm · Trustworthy · Inclusive · Practical |
| **Audience** | Nepali migrants & diaspora in Australia |
| **Tone** | Friendly, clear, community-first |

---

## Logo

The mark is two overlapping circles:
- **Orange circle (left)** — warmth, Nepali heritage, energy
- **Indigo circle (right, 88% opacity)** — Australia, community, trust
- The **overlap** is where both cultures meet — the core NepSaathi idea

The wordmark is Inter 600: **Nep** in saffron `#E87722`, **Saathi** in deep purple `#26215C` (light) or white (on dark).

### Files

| File | Use |
|------|-----|
| `assets/logo.svg` | Light backgrounds (web, print) |
| `assets/logo-dark.svg` | Dark navbar, dark backgrounds |
| `assets/logo-mark.svg` | App icon, favicon source, small contexts |
| `assets/favicon.svg` | Browser favicon (32×32) |

### Rules
- Minimum size: 120px wide for full logo, 32px for mark only
- Never stretch, recolour, or add effects to the mark
- Always maintain clear space equal to the circle diameter on all sides
- On coloured backgrounds: use `logo-dark.svg` for navy/purple, `logo.svg` for orange tints

---

## Color Palette

### Brand
| Token | Hex | Use |
|-------|-----|-----|
| `--color-saffron` | `#E87722` | Primary CTAs, logo, prices, active states |
| `--color-saffron-light` | `#FAC775` | Hover states, illustrations |
| `--color-saffron-tint` | `#FFF1E0` | Backgrounds, badge fills |
| `--color-saffron-dark` | `#C45E0A` | Hover on saffron buttons |
| `--color-purple-deep` | `#26215C` | Navbar, headings, dark surfaces |
| `--color-purple` | `#534AB7` | Links, type chips, secondary buttons |
| `--color-purple-mid` | `#AFA9EC` | Borders, decorative accents |
| `--color-purple-tint` | `#EEEDFE` | Secondary button fill, card accents |

### Gradients
| Name | Value | Use |
|------|-------|-----|
| `--gradient-brand` | `135deg, #E87722, #534AB7` | Featured badge, special CTAs |
| `--gradient-hero` | `160deg, #26215C, #534AB7` | Page hero, ad backgrounds |

---

## Typography

**Font**: Inter (Google Fonts)
**Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

| Role | Size | Weight | Use |
|------|------|--------|-----|
| Hero title | 38px | 700 | Homepage hero, page banners |
| Page heading | 30px | 700 | Section titles |
| Section heading | 24px | 600 | Card groups |
| Card title | 20px | 600 | Listing card names |
| UI label | 15px | 500 | Form labels, nav items |
| Body | 14px | 400 | Descriptions, content |
| Caption | 13px | 400 | Metadata, timestamps |
| Badge / overline | 11px | 600 | Type chips, labels (uppercase) |

---

## Spacing

Base unit: `4px`. All spacing is a multiple of 4.

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

---

## Components (see `ui-kit.html` for live preview)

Open `ui-kit.html` in a browser for visual documentation of:

- **Buttons** — Primary (saffron), Secondary (purple tint), Outline, Danger, Ghost, Gradient (featured)
- **Inputs** — Text, Select, Textarea with focus, error, hint states
- **Listing cards** — Job, Room, Event with featured badge; skeleton loader
- **Badges** — Type chips, status badges (active/expired/under review), featured badge
- **Filter pills** — State/category filter selectors
- **Alerts** — Success, Warning, Error, Info with left-border style
- **Toasts** — Dark, Success, Error
- **Avatars** — SM/MD/LG/XL with initials
- **Tabs** — Underline style for category switching
- **Navbar** — Dark navy with logo, nav links, avatar
- **Shadows** — XS through XL scale
- **Skeleton loaders** — Shimmer animation for async content

---

## Ad Creatives

Pre-built SVG templates in `ads/`. Open in browser or import into Figma/Illustrator.

| File | Dimensions | Platform |
|------|-----------|---------|
| `ads/facebook-post.svg` | 1200×630 | Facebook post / link preview |
| `ads/instagram-post.svg` | 1080×1080 | Instagram square post |
| `ads/instagram-story.svg` | 1080×1920 | Instagram / Facebook story |

To customise: swap the listing card content and headline copy. Keep the gradient background, logo position, and CTA button style consistent.

---

## Design Principles

1. **Warmth first** — Use saffron and rounded corners generously. This is a community, not a dashboard.
2. **Trust through clarity** — Contact info, pricing, and location always visible without extra clicks.
3. **Mobile is primary** — ~70% of users are on phones. Every component is designed mobile-first.
4. **Structured, not cluttered** — White space over decoration. One prominent action per screen.
5. **Inclusive language** — English only in UI (no Nepali script in interface elements — users span many literacy levels).

---

## File Structure

```
design-system/
├── README.md              ← This file
├── tokens.css             ← All CSS custom properties
├── ui-kit.html            ← Visual component showcase (open in browser)
├── assets/
│   ├── logo.svg           ← Full logo, light bg
│   ├── logo-dark.svg      ← Full logo, dark bg
│   ├── logo-mark.svg      ← Mark only
│   └── favicon.svg        ← 32×32 favicon
└── ads/
    ├── facebook-post.svg  ← 1200×630 FB post
    ├── instagram-post.svg ← 1080×1080 IG post
    └── instagram-story.svg← 1080×1920 IG/FB story
```
