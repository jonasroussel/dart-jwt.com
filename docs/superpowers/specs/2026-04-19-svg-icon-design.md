# SVG icon for dart-jwt.com

Date: 2026-04-19
Status: Design approved, ready for implementation plan

## Context

The dart-jwt.com marketing site currently has **zero icon assets**: no favicon, no apple-touch-icon, no OG image, no logo mark anywhere. Browser tabs show a generic globe, iOS "Add to Home Screen" shows a screenshot, and link previews on Twitter/Slack/LinkedIn are bare text. This spec defines a small, JWT-specific visual mark and wires it into the three places that most matter for a public site: the browser tab, iOS home screen, and social-media link unfurls.

Explicitly **out of scope**: surfacing the mark in the site nav/header, light-mode variants, and a legacy `favicon.ico`. These can be added later without rework because the design settles on a single dark-bg source SVG.

## The mark

A monochrome neon-green mark on a dark rounded-square background. Two JSON-style curly braces flank three rectangular "token" segments separated by dots. Semantically: `{ header · payload · signature }`. The three segments use a deliberate opacity gradient (40% / 100% / 65%) so the middle payload reads as the "important" part and the composition has visual hierarchy instead of flat repetition.

Rationale for this direction (chosen after iterating through a shield/triptych, a terminal `>_` prompt, a key-with-teeth, and pure JSON-braces-with-dots): the curly braces carry the "JWT = JSON Web Token" association and match the site's code-first aesthetic; the three segments carry the JWT-specific `header.payload.signature` structure; together they say something the JWT standard says and no generic token/lock icon would.

### Mark SVG (authoritative)

Single source, viewBox `0 0 64 64`, rounded-square dark background (`#0a0b0d`, rx=12), green (`#7dff9e`) mark:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0a0b0d"/>
  <path fill="none" stroke="#7dff9e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
        d="M12 14 Q6 14 6 20 L6 28 Q6 32 3 32 Q6 32 6 36 L6 44 Q6 50 12 50"/>
  <rect x="14" y="24" width="10" height="16" rx="2" fill="#7dff9e" fill-opacity="0.4"/>
  <circle cx="26" cy="32" r="1.5" fill="#7dff9e"/>
  <rect x="28" y="24" width="10" height="16" rx="2" fill="#7dff9e"/>
  <circle cx="40" cy="32" r="1.5" fill="#7dff9e"/>
  <rect x="42" y="24" width="10" height="16" rx="2" fill="#7dff9e" fill-opacity="0.65"/>
  <path fill="none" stroke="#7dff9e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
        d="M52 14 Q58 14 58 20 L58 28 Q58 32 61 32 Q58 32 58 36 L58 44 Q58 50 52 50"/>
</svg>
```

Colors reuse the site's existing palette: `#0a0b0d` is the site background (from `src/styles/global.css`), `#7dff9e` is the site accent (same variable). No new colors introduced.

### OG image layout

Left mark, right text. The 1200×630 canvas holds:

- **Left (vertically centered)**: the mark, ~320×320, with the same dark rounded-square background removed so it sits flush on the OG canvas (which is already `#0a0b0d`).
- **Right (vertically centered, text-left aligned)**:
  - Wordmark: `$ dart_jsonwebtoken` where `$` is accent-green and the rest is `#e8eaed`, IBM Plex Mono, ~72px.
  - Tagline (IBM Plex Sans, ~28px, `#9aa0a6`, max 640px width): *"The real Dart package, compiled to JS, running in your browser. 14 algorithms. Sign. Verify. Decode."*
- **Corner registration marks** (top-left + bottom-right, `#7dff9e`, 1.5px stroke, ~32px legs, ~32px inset from edges) — matches the hero terminal in `src/components/Hero.tsx`.

## Artifacts

All files land in `public/` (Astro serves it as-is):

| File | Size | Format | How produced |
|---|---|---|---|
| `public/favicon.svg` | 64×64 viewBox | SVG | Hand-authored, committed as-is |
| `public/apple-touch-icon.png` | 180×180 | PNG | Rendered from `favicon.svg` |
| `public/og-image.png` | 1200×630 | PNG | Rendered from `src/assets/og-image.svg` |

Not shipping: `favicon.ico` (every modern browser supports SVG favicons since 2020/2021); dark/light variants (single dark-bg mark works everywhere).

## PNG generation

The site currently has no image-build tooling. We add a one-shot Node script that reads the two SVG sources and writes the two PNG outputs.

- **Script path**: `scripts/gen-icons.mjs`
- **Dependency**: `@resvg/resvg-js` as a `devDependency` (pure-JS, no native bindings — avoids the `sharp`/libvips portability headaches).
- **npm script**: `"icons": "node scripts/gen-icons.mjs"` in `package.json`.
- **Runs manually**, not in `prebuild`. Rationale: the PNGs are committed to `public/`, so CI and Docker don't need the regeneration dep. The script runs only when the mark or OG layout is edited.
- **Inputs**: `public/favicon.svg`, `src/assets/og-image.svg`.
- **Outputs**: `public/apple-touch-icon.png` (180×180, full-bleed — iOS applies its own corner mask), `public/og-image.png` (1200×630).

Apple-touch-icon note: the baked rounded corners in `favicon.svg` (rx=12 at 64px → ~33px at 180px) are **smaller** than iOS's ~22% corner mask (~40px at 180px), so iOS's rounding subsumes ours invisibly. No separate square-cornered source needed.

## `<head>` integration

All changes in `src/layouts/BaseLayout.astro`. Insert after the existing `<meta name="description">`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://dart-jwt.com/" />
<meta property="og:title" content="dart-jwt.com — sign & verify JWTs in Dart" />
<meta property="og:description" content="The real Dart package, compiled to JS, running in your browser. 14 algorithms. Sign. Verify. Decode." />
<meta property="og:image" content="https://dart-jwt.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="dart-jwt.com logo and tagline" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://dart-jwt.com/og-image.png" />
<meta name="twitter:title" content="dart-jwt.com — sign & verify JWTs in Dart" />
<meta name="twitter:description" content="The real Dart package, compiled to JS, running in your browser. 14 algorithms. Sign. Verify. Decode." />
```

The existing `<title>` and `<meta name="description">` in `BaseLayout.astro` drive `og:title` and `og:description` by default when they match the page — but since `BaseLayout` accepts per-page overrides for `title`/`description`, these meta tags should use the same `{title}`/`{description}` props so deep pages (if added later) inherit correctly. Implementation plan will wire this.

## Files to be modified

- `src/layouts/BaseLayout.astro` — add `<head>` tags, ensure `title`/`description` props flow into the new OG/Twitter meta tags
- `package.json` — add `@resvg/resvg-js` devDep and `icons` script

## Files to be created

- `public/favicon.svg` — the mark SVG from above
- `public/apple-touch-icon.png` — generated
- `public/og-image.png` — generated
- `src/assets/og-image.svg` — source SVG for the OG image, following the layout described above
- `scripts/gen-icons.mjs` — regeneration script

## Verification

1. `npm run icons` — regenerates the two PNGs without error; produced files are the expected dimensions.
2. `npm run dev` — load http://localhost:4321. Browser tab shows the favicon. DevTools → Network confirms `/favicon.svg` is served with `Content-Type: image/svg+xml`.
3. View-source in dev confirms the four new `<link>` / `<meta>` blocks are present and URLs are absolute (`https://dart-jwt.com/…`).
4. iOS "Add to Home Screen" preview (use Safari on a physical device or Simulator) shows the mark, not a screenshot.
5. Paste `https://dart-jwt.com/` into the Twitter / LinkedIn / Slack post box (or use the [Twitter Card Validator](https://cards-dev.twitter.com/validator), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/), [OpenGraph.xyz](https://www.opengraph.xyz/)) → the L2 layout renders with no text clipping at 1200×630 and at the small-preview crops (~400×209).
6. `npm run build` completes without invoking the Dart build or the icons script; `dist/` contains all three icon files copied from `public/`.
7. Docker build (`docker build -t dart-jwt .`) succeeds — the resvg devDep is not needed in the build image because PNGs are committed.
