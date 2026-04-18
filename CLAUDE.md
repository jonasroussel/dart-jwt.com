# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketing + interactive-playground site for the `dart_jsonwebtoken` Dart package (https://pub.dev/packages/dart_jsonwebtoken). The playground signs/verifies JWTs with the **real** library compiled to JavaScript via `dart compile js`, not a JS reimplementation. All 14 algorithms (HS/RS/PS/ES256/384/512 + ES256K + EdDSA) run in the browser through this pipeline.

## Architecture — two-language build

The repo has **two build chains that must both run**, in order, for a complete output:

1. **`dart_wrapper/`** — a tiny Dart package that depends on `dart_jsonwebtoken` and exposes `sign`/`verify` on `globalThis.dartJwt` via `dart:js_interop`. Compiled with `dart compile js -O2` to `public/jwt.js` (≈500 KB). Entry: `dart_wrapper/web/jwt.dart`.
2. **Astro site** — standard `astro build` producing `dist/`. `public/jwt.js` is served as a static asset.

The `prebuild` npm hook chains these: `[ -f public/jwt.js ] || npm run build:dart`. It only runs the Dart compile if the output is missing — so if you **edit `dart_wrapper/web/jwt.dart`, you must delete `public/jwt.js` or run `npm run build:dart` manually**. `public/jwt.js` is gitignored; the Dart build runs fresh in CI/Docker.

The React playground component (`src/components/Playground.tsx`) **lazy-loads `/jwt.js` on mount** via `src/lib/dart-jwt.ts`'s `loadDartJwt()` — it injects a `<script>` tag, polls `window.__dartJwtReady`, then resolves. The bundle does not load on pages without the playground.

## Component boundaries

- **`.astro` components** are static (Nav, Features, Algorithms, Social, Footer). Server-rendered only.
- **`.tsx` components** are React islands. Hydration directives in `src/pages/index.astro`:
  - `Hero` — `client:load` (above the fold, animated)
  - `Quickstart`, `Playground`, `Faq` — `client:visible`
  - `Tweaks` — `client:idle` (hidden until parent iframe sends an `__activate_edit_mode` postMessage — used only in the Claude Design edit harness)

All islands SSR their wrapping `<section id="...">` so anchor-link navigation (`#quickstart`, `#playground`, etc.) works before hydration.

## Dart/JS interop contract

- `dart_wrapper/web/jwt.dart` — sign/verify take `(payloadJson, alg, keyPem)`, return JSON-encoded `{ok, token|header|payload|error}` strings. Never throw across the interop boundary; catch everything and return `{ok: false, error}`.
- `src/lib/dart-jwt.ts` — TS wrapper that `JSON.parse`s those results, handles loader errors, and presents typed `SignResult`/`VerifyResult` unions to React. All three exported functions (`sign`, `verify`, `loadDartJwt`) are safe to call before the bundle has loaded; they await it.
- `src/lib/example-keys.ts` — hard-coded PEMs taken from `github.com/jonasroussel/dart_jsonwebtoken/tree/main/example`, plus locally-generated P-384/P-521 pairs (the library's example dir only ships P-256). Demo-only; never treat as production keys.

## Common commands

```bash
npm run dev           # astro dev; auto-compiles Dart once if public/jwt.js is missing
npm run build         # prebuild (conditional dart compile) + astro build
npm run build:dart    # force Dart → JS recompile
npm run format        # prettier
npm run format:check  # prettier --check
```

Docker: `docker build -t dart-jwt .` uses a three-stage Dockerfile — `dart:stable` compiles `jwt.js`, `node:22-alpine` builds the Astro site (skips the Dart step because `public/jwt.js` is staged from stage 1), `httpd:alpine` serves `dist/`.

## Styling

Single global stylesheet at `src/styles/global.css` (imported by `BaseLayout.astro`). No CSS-in-JS, no Tailwind. The dark terminal aesthetic uses IBM Plex Mono/Sans + a single `--accent` CSS variable (default `#7dff9e`, overridable per-page via `BaseLayout`'s `accent` prop and runtime via `Tweaks`).

Mobile breakpoints: `@media (max-width: 720px)` (tablet/mobile — 20px gutter, nav collapses) and `@media (max-width: 420px)` (small phones — 16px gutter). Horizontal-overflow guard is `overflow-x: clip` on `<body>` only (never on `<html>`, which breaks anchor-link scrolling). Sticky nav offset is handled by `scroll-padding-top: 72px` on `<html>`.

## Data accuracy

Stats on the Social section (800K downloads, 357 likes, 160/160 pub points, the 52-week sparkline) come from `https://pub.dev/api/packages/dart_jsonwebtoken/metrics` — if you update these, pull from that endpoint and reverse `totalWeeklyDownloads` (API returns newest-first; chart renders oldest-first).
