# Agentic Coding Progress Log

## 2026-04-20

### Completed

- Reset repository scope to `朕的一生`.
- Preserved only project-related documentation, seed data, and generated assets.
- Locked the SBTI-lowpoly art direction.
- Generated and reviewed MVP portraits, backgrounds, endings, share background, and HUD icons.
- Reworked HUD icon requirements to use transparent PNGs for composable UI.
- Added Reigns reference analysis and updated MVP design toward a closer Reigns clone.
- Added seed data for events, objectives, and endings.
- Added root-level agent entry files:
  - `AGENTS.md`
  - `CODEX.md`
  - `CLAUDE.md`
  - `.cursorrules`
- Added agentic coding context:
  - `docs/agentic-coding/project-context.md`
  - `docs/agentic-coding/progress-log.md`
  - `docs/agentic-coding/team-roles.md`
- Prepared a missing-asset image generation batch and guide:
  - `tmp/imagegen/missing-assets.jsonl`
  - `docs/art/missing-assets-imagegen-pack.md`
- Dry-run validated 19 pending asset jobs across portraits, backgrounds, and endings.

### Current State

The project has product/design/art/data foundations and the first playable H5 MVP slice.

The current runtime includes:

- app shell;
- resource HUD;
- Reigns-like swipe/click card;
- event engine;
- objective display;
- ending/result flow;
- local persistence;
- content validation script;
- Playwright smoke script.
- Extracted pure gameplay engine module in `public/engine.js`.
- Added long-run simulation script in `scripts/simulate-reigns.mjs`.

### Known Gaps

- Seed content count is now above the 40-card public-playtest target, but still needs real playtest tuning.
- Some ending-specific art remains in backlog.
- Real share platform integration is out of scope for first MVP.
- Late-reign pressure now caps tested strategies at 60 years through `old_age_succession`.
- Ending priority order now lives in `rules.mvp.seed.json` as ordered `endingRules`, and the resolver reads data instead of hard-coded `if/else`.
- Rules validation now checks ending rule structure, priority, boundary references, and required ending IDs.
- Local and deployed smoke tests cover one real drag interaction, all 8 resource boundary endings, `alchemy_death`, `peaceful_abdication`, and `old_age_succession`.
- Normal weighted draw now avoids a third consecutive card from the same actor when alternative candidates exist.
- Added `npm run check:actor-streak` to validate there are no actor triple-streaks across repeated simulated runs.
- Missing asset image generation is still blocked because `OPENAI_API_KEY` is not present in either the sandboxed shell or the escalated local shell.
- Added mobile viewport regression coverage into `scripts/smoke-playwright.mjs` and verified the gameplay screen across `375x667`, `360x740`, `390x844`, and `412x915`.
- Tightened short-screen gameplay layout so the card, HUD, objectives, and left/right choice buttons all remain visible within one mobile viewport while swipe interaction still advances the year.
- Verified local `.env` loading for image generation and added `.env` to `.gitignore`.
- Image batch retry now reaches the API, but the current `OPENAI_API_KEY` still returns `401 invalid_api_key`, so missing-asset generation remains blocked on a valid key rather than local tooling.
- Added `npm run report:pressure` to compare multiple pressure-band variants and write JSON/Markdown reports under `tmp/simulations/`.
- Tightened `peaceful_abdication` from `20 years + 35-75` to `24 years + 40-70`; automated tuning shows it is less trivial than before, but still common for the balance strategy and should be checked in real playtests.
- Generated and landed a major missing-asset batch without using the broken local API-key flow:
  - 7 new portraits (`alchemist`, `empress-dowager`, `prince`, `regional-lord`, `envoy`, `merchant`, `bandit`);
  - 4 new backgrounds (`alchemy-room`, `ancestral-temple`, `imperial-harem`, `market-tax-office`);
  - 8 new ending illustrations (`expectation-revolt`, `corruption-flood`, `frontier-collapse`, `military-takeover`, `bureaucratic-suffocation`, `alchemy-death`, `old-age-succession`, `puppet-emperor`).
- Updated ending seed data so result pages now use dedicated ending art instead of reusing placeholder images across most high-resource and chain endings.
- Added a formal `puppet_emperor` chain ending:
  - new rule in `rules.mvp.seed.json`;
  - new event chain using `empress-dowager` and `prince`;
  - new `puppet_regency` state flag and fixtures covering rule priority.
- Added an earlier lead-in card, `dowager_visits_heir`, so the puppet-regency path is discoverable before the final lock-in cards.
- Tightened `peaceful_abdication` again to require `26` years, `taizi_established`, resources within `44-66`, and low `eunuch_power` / `consort_family_power`.
- New pressure report result: `balance` strategy peaceful-abdication rate dropped to roughly `20.83%`, with `old_age_succession` now becoming the dominant long safe-run outcome. This is much closer to a rare-good result instead of a default answer.
- Added `docs/game-design/MVP_Design_Alignment_Report_2026-04-20.md`, a three-angle review of current implementation vs original PRD/GDD/Reigns-clone goals from product, UI/UX, and player perspectives.
- Added `docs/agentic-coding/post-alignment-improvement-checklist.md`, turning the alignment review into prioritized follow-up work with owners, acceptance criteria, and QA signoff questions.
- Completed the first post-alignment implementation step, `Dynasty Continuity Pass`:
  - the start screen now surfaces a lightweight "前朝余音" summary when an earlier reign exists;
  - a new emperor now inherits a small, ending-based opening resource nudge plus a short succession note;
  - the in-game header carries a compact continuity line so succession feels distinct from a full reset;
  - mobile smoke regression still passes after the continuity UI was compressed back into a one-screen layout.

### Next Recommended Work

1. Run real-device and human playtests to confirm the new `peaceful_abdication` rarity feels fair rather than frustrating.
2. Decide whether `35/45/55 + 60 years` stays as the default or shifts earlier for MVP.
3. Observe how often players organically discover `puppet_emperor`; if discovery is still too low, add one more court-chain bridge card.
4. If the war layer expands, generate `backgrounds/battle-map.png`; otherwise the current MVP art set is largely complete.
