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

### Next Recommended Work

1. Export a valid `OPENAI_API_KEY` into the shell environment and rerun `tmp/imagegen/missing-assets.jsonl`.
2. Review and move approved generated files into `public/assets/chinese-reigns/...`, then update `docs/art/asset-quality-review.md`.
3. Tune the 45-card deck and 60-year cap after real play sessions.
4. Add a lightweight engine fixture runner so ending conflicts are verified without browser debug hooks.
5. Continue pressure-system extraction from the single late-reign threshold into configurable bands.
6. Implement local share-card generation/export to close M5.
7. Run full mobile browser QA on real devices, now that automated viewport regression is in place.
