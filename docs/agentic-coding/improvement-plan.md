# MVP Improvement Plan

Date: 2026-04-20

This plan continues the professional team workflow after the first playable H5 MVP slice.

See also:

- `docs/game-design/MVP_Design_Alignment_Report_2026-04-20.md`
- `docs/agentic-coding/post-alignment-improvement-checklist.md`

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
- Added `npm run report:pressure` to compare multiple pressure/old-age variants and emit `tmp/simulations/pressure-tuning-report.{json,md}`.
- Tightened `peaceful_abdication` to `years_ruled >= 24` and all resources between `40-70` so it is rarer than the original `20 years + 35-75` rule.
- Added a new `puppet_emperor` chain ending backed by event content, dedicated art, and explicit rule matching.
- Added an earlier puppet-regency lead-in so the chain is more discoverable in ordinary reign flow.

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

## Expanded Engine Plan

### Phase 1: Finish Data-Driven Endings

Goal:

- Make ending resolution auditable from JSON data instead of split across code constants and special-case checks.

Scope:

- add explicit ending priority order to `data/chinese-reigns/rules.mvp.seed.json`;
- move rare/chain ending definitions into a structured rule list;
- keep `public/engine.js` as a generic resolver over ordered rules;
- document tie-break expectations for:
  - forced ending;
  - alchemy death;
  - low/high resource endings;
  - peaceful abdication;
  - old-age succession.

Deliverables:

- updated rules schema;
- simplified `resolveEndingWithRules`;
- regression coverage for ending order conflicts.

### Phase 2: Extract a Configurable Pressure System

Goal:

- Turn late-reign pacing into a tunable subsystem instead of a single year threshold.

Scope:

- support multiple pressure bands, for example:
  - early reign;
  - stable middle reign;
  - late-reign tension;
  - forced succession window;
- allow per-band effects such as:
  - event weight boosts;
  - resource drift;
  - counter growth;
  - objective pressure;
- keep MVP default behavior simple, but make the structure extensible for future content packs.

Deliverables:

- pressure config in rules data;
- engine helper for yearly pressure updates;
- simulation report comparing different pressure tunings.

Current tuning note:

- The report shows reign-length pressure is functioning, but `peaceful_abdication` still dominates the `balance` strategy.
- This means the next tuning pass should look not only at old-age pressure bands, but also at whether the peaceful window should narrow further or require an extra state condition.
- After the latest rule pass (`26 years`, `44-66`, `taizi_established`, low eunuch / consort-family pressure), the balance strategy now lands `peaceful_abdication` at roughly `20.83%` in automated tuning, which is much closer to the intended rare-good ending profile.

### Phase 3: Event Selection Engine Upgrade

Goal:

- Make event pacing feel closer to Reigns: more readable arcs, less random noise, better thematic clustering.

Scope:

- formalize card buckets:
  - tutorial/early onboarding;
  - common maintenance;
  - pressure response;
  - chain follow-up;
  - rare spike;
- add data-driven weight modifiers based on:
  - current resource danger;
  - active flags;
  - recent card history;
  - reign age band;
- prevent repetitive loops with a clearer recency/cooldown policy.

Deliverables:

- weight modifier rules in data;
- engine utilities for card pool scoring;
- deterministic simulation snapshots for event distribution.

### Phase 4: Test Harness and QA Matrix

Goal:

- Separate browser smoke from engine correctness checks.

Scope:

- keep Playwright smoke for:
  - page load;
  - swipe interaction;
  - result screen transitions;
- add engine-level test cases for:
  - ending priority conflicts;
  - objective completion;
  - card queue/cooldown behavior;
  - archive record creation;
  - max-year cap behavior through state transitions;
- add deterministic fixtures instead of relying only on debug hooks.

Deliverables:

- lightweight engine test runner;
- fixture JSON for scripted reign scenarios;
- QA checklist aligned with ending matrix and asset matrix.

### Phase 5: Content and Asset Integration

Goal:

- Make the engine extensible enough that adding new events/endings is mostly content work.

Scope:

- align all ending/image IDs with asset files;
- reduce image reuse on result pages;
- track which future assets are transparent UI overlays versus full-frame backgrounds;
- define a content checklist for every new card:
  - actor portrait;
  - background;
  - ending linkage if any;
  - objective or chain references;
  - share-text implications.

Deliverables:

- updated asset backlog;
- ending image rollout plan;
- content authoring checklist in docs.

## Suggested Execution Order

1. Phase 1 ending resolver cleanup.
2. Phase 4 engine test harness for resolver confidence.
3. Phase 2 pressure tuning.
4. Phase 3 event selection upgrade.
5. Phase 5 content and image refresh.

## Open Questions

- Should `peaceful_abdication` remain possible after 20 years if resources are stable, or should late reign make it harder over time?
- Should `frontier_collapse` stay as pure `army <= 0` for MVP, with war-state variants postponed to post-MVP chains?
- Should the final MVP target median run length be closer to 10, 15, or 20 in-game years?
- Do we want one generic result background per ending family, or one dedicated image per ending before wider content expansion?
- How much dynasty carryover is enough to create succession feeling without turning the MVP into a meta-progression game?
