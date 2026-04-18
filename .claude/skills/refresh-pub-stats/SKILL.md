---
name: refresh-pub-stats
description: Refresh every pub.dev-derived number in the dart-jwt.com site (version, downloads, likes, pub points, sparkline, publish age, copyright end year) from the live pub.dev API. Use when the user asks to update/refresh the site's stats, or on a scheduled cadence. The single source of truth is https://pub.dev/packages/dart_jsonwebtoken via its JSON endpoints — never hand-edit these numbers.
---

# Refresh pub.dev stats

Pull fresh data from pub.dev and patch every stats-related literal in the codebase in one pass.

## Data sources

Two JSON endpoints — fetch both, no auth needed:

- **`https://pub.dev/api/packages/dart_jsonwebtoken`** — gives `latest.version` and `latest.published` (ISO-8601).
- **`https://pub.dev/api/packages/dart_jsonwebtoken/metrics`** — gives `score.grantedPoints`, `score.maxPoints`, `score.likeCount`, `score.downloadCount30Days`, and (nested) `scorecard...weeklyVersionDownloads.totalWeeklyDownloads` — **newest-first**, 52 entries.

Fetch with `curl -s -A "Mozilla/5.0" <url>` (pub.dev 403s the default curl UA).

## Derived values

| Field | Formula |
|---|---|
| `downloadsRound` | Round `downloadCount30Days` to the nearest 100K; format as `"{N}K"` (e.g. 799934 → `"800K"`). If ≥ 1M, use `"{N.N}M"`. |
| `momPercent` | Let `latest4 = sum(totalWeeklyDownloads[0..3])`, `prior4 = sum(totalWeeklyDownloads[4..7])`. `mom = (latest4 − prior4) / prior4 × 100`. Format to 1 decimal, e.g. `"↑ 6.3%"` or `"↓ 2.1%"`. |
| `chartData` | `totalWeeklyDownloads` **reversed** to chronological order (oldest → newest). All 52 entries. |
| `chartRange` | `"YYYY.MM → YYYY.MM"` — (today − 52 weeks) to today, zero-padded months. |
| `chartLabels` | Three labels on the x-axis: `[start, middle, end]` — format `"mmm YYYY"` lowercase (e.g. `"apr 2025"`). Middle = today − 26 weeks. |
| `publishedDaysAgo` | Integer days between `latest.published` and today (floor). |
| `copyrightEndYear` | Current year. |

## Files to patch

Exact literal replacements. If a literal no longer exists where listed, Grep for the old value before assuming it moved.

1. **`src/components/Nav.astro`** — brand version
   - `<span class="brand-version">v{OLD}</span>` → `v{latest.version}`

2. **`src/components/Hero.tsx`** — chip + hero-meta stats
   - `<span>v{OLD} · null-safe · all algorithms</span>` → `v{latest.version} · …`
   - `<strong>{OLD}</strong> downloads` → `<strong>{downloadsRound}+</strong> downloads` (the "+" stays)
   - `<strong>{OLD}</strong> likes` → `<strong>{likeCount}</strong> likes`
   - Leave the `14 algorithms` figure alone unless the library genuinely ships a new algorithm.

3. **`src/components/Social.astro`** — chart data, stat cards, range labels
   - Replace the `CHART_DATA` array with `chartData`. Keep the comment block above it current.
   - `<span>{OLD}</span><span class="accent">+</span>` (30-day downloads card) → `{downloadsRound}`
   - `<span class="stat-delta">↑ {OLD}%</span>` → `{momPercent}` (including the `↑`/`↓` glyph)
   - `<span>{OLD}</span>` likes card → `{likeCount}`
   - `<span>{OLD}</span><span class="accent">/ {OLD}</span>` pub points → `{grantedPoints}` / `{maxPoints}`
   - `<div class="chart-range">{OLD}</div>` → `{chartRange}`
   - Three `<span>` x-axis labels → `{chartLabels[0]}`, `{chartLabels[1]}`, `{chartLabels[2]}`

4. **`src/components/Footer.astro`** — publish age + copyright end year
   - `last published {OLD} days ago` → `{publishedDaysAgo} days ago`
   - `© 2020-{OLD}` → `© 2020-{copyrightEndYear}` (leave the start year alone)

## Procedure

1. Fetch both JSON endpoints into memory (single `curl` each or Bash two-in-parallel).
2. Parse, compute the derived values above.
3. Grep each file for the *current* literal before replacing to avoid drift surprises.
4. Apply edits with the Edit tool (not Write) so you touch only the lines that changed.
5. Run `npx prettier --write` on the touched files.
6. Run `npx astro build` and confirm no errors.
7. Report back: one line per changed number, old → new, e.g. `likes: 357 → 362`.

## Guardrails

- **Never invent numbers.** If the API returns something unexpected (missing field, 500, stale data), surface it and stop — don't fall back to old values.
- Do not touch the `14 algorithms` literal or the algorithms table — those reflect what the library supports, not pub.dev stats.
- Do not touch `makeDefaultPayload()` in `Playground.tsx` — its `iat`/`exp` are computed at runtime already.
- This skill only updates numbers. It does not add/remove stats, restructure sections, or change copy.
