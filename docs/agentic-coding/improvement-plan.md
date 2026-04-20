# MVP Improvement Plan

Date: 2026-04-20

This plan continues the professional team workflow after the first playable H5 MVP slice.

## Current Findings

### Asset Gap

The MVP is playable with current art, but result pages reuse too many ending images. The next image generation batch should add:

- `public/assets/chinese-reigns/endings/expectation-revolt.png`
- `public/assets/chinese-reigns/endings/corruption-flood.png`
- `public/assets/chinese-reigns/endings/frontier-collapse.png`
- `public/assets/chinese-reigns/endings/military-takeover.png`
- `public/assets/chinese-reigns/endings/bureaucratic-suffocation.png`
- `public/assets/chinese-reigns/endings/alchemy-death.png`

Generation was attempted through the local imagegen CLI, but the configured OpenAI API key was rejected by the API. No new image files were produced.

### Long-Run Balance

Initial automated simulation results with the 45-card deck before late-reign pressure:

- `random`: max 66 years in 500 runs, average 21.25 years, median 20 years.
- `balance`: max 123 years in 500 runs, average 24.37 years, median 20 years.
- `long-seeking`: reached the 200-year simulation cap in several runs.

Interpretation:

- There is no hard maximum reign length in the current rules.
- A skilled strategy can avoid both death and peaceful abdication by keeping at least one resource outside the `35-75` peaceful range while avoiding `0/100`.
- This is useful for stress testing, but bad for the intended 5-10 minute Reigns-like run length.

Update after engine/rules work:

- Added `data/chinese-reigns/rules.mvp.seed.json`.
- Added `old_age_succession` ending at 60 years.
- `npm run simulate -- 200 1000` now caps all tested strategies at 60 years.
- New `long-seeking` max: 60 years, ending `old_age_succession`.

## Team Recommendations

### Product Owner

Add and tune a designed reign-length pressure system. The player should be able to survive impressively long, but not indefinitely.

Recommended direction:

- Keep rare peaceful abdication at `>= 20` years and all resources stable.
- Late-reign pressure currently starts at 35 years.
- Hard old-age/succession ending currently triggers at 60 years.
- Next tuning pass should decide whether 60 years feels too generous for MVP.

### Business Analyst

Move ending rules out of hard-coded engine maps and into data:

- resource low/high endings;
- chain endings;
- rare good endings;
- old-age/succession endings;
- priority ordering.

This will make balancing and QA easier.

### Senior Developer

Continue extracting gameplay from UI:

- `public/engine.js`: pure state transition engine.
- `public/main.js`: DOM rendering and interaction only.
- future `data/chinese-reigns/rules.mvp.seed.json`: ending thresholds, danger ranges, old-age pressure.

### QA Engineer

Expand automated checks:

- deterministic long-run simulations;
- all ending matrix checks;
- rare chain ending checks;
- peaceful abdication checks;
- max-run stress with a turn cap.

### Code Reviewer

Watch for these risks:

- UI code reintroducing story logic;
- engine functions mutating state unexpectedly;
- rules split between data and code;
- simulation strategy relying on debug-only browser hooks.

## Next Implementation Steps

1. Move all ending priority rules fully into data.
2. Tune the 60-year old-age/succession cap after human playtests.
3. Generate missing ending images after a valid image API key is configured.
4. Update ending seed data to use the new images.
5. Add automated coverage for `alchemy_death`, `peaceful_abdication`, and `old_age_succession`.
