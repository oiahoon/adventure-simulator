# Sprint 1/2 Review And QA Notes

Date: 2026-04-20

Scope reviewed:

- `public/index.html`
- `public/styles.css`
- `public/main.js`
- `scripts/validate-content.mjs`
- `scripts/smoke-playwright.mjs`
- `data/chinese-reigns/*.json`

## Product Review

Pass:

- The playable loop is Reigns-like: one card, two choices, resource pressure, one year per choice, quick result/restart.
- MVP still avoids forbidden systems: no map, inventory, battle, building menu, exact number panel, or skill tree.
- UI hides exact numeric resource values from the normal player interface.
- High-resource death is represented and smoke-tested through `expectation_revolt`.

Open:

- Seed deck has only 10 cards. This is enough for internal runtime validation, not enough for public playtest.
- Current result page is functional; share-card polish is still later-sprint work.

## BA Review

Pass:

- Runtime consumes JSON data from `data/chinese-reigns/`.
- Implemented condition support: `resource_gte`, `resource_lte`, `flag_is`, `counter_gte`, `counter_lte`, `not_seen`.
- Implemented effect support used by current seed data: `resource`, `set_flag`, `counter`, `complete_objective`, `force_ending`.
- Implemented `weight`, `once`, `cooldown`, and objective completion.

Open:

- `unlock_card` is validated but not yet meaningfully used by current seed data.
- `nextCards` exists as a queue in runtime, but no seed card currently exercises it.

## QA Results

Commands run:

```bash
npm run validate:content
npm run smoke
```

Results:

- Content validation passed: 10 cards, 6 objectives, 10 endings.
- Browser smoke passed at 390x844 mobile viewport.
- Smoke flow covered start screen, game screen, 8 choices, one forced high-resource ending, result page, local archive update, and console error capture.
- Latest screenshots were inspected:
  - `tmp/smoke/01-start.png`
  - `tmp/smoke/02-game.png`
  - `tmp/smoke/03-after-choices.png`

## Code Review

No blocking issues found for this internal Sprint 1/2 slice.

Risks to address before content expansion:

- `public/main.js` currently contains both UI orchestration and game engine logic. Extract pure functions before adding many more card types.
- More automated ending tests are needed for all low/high resource endings, not just one forced high-resource ending.
- Real mobile Safari testing is still required for pointer/touch behavior.
- Event deck needs actor-repeat tuning once the card count grows.

## Sprint Status

Sprint 1 is functionally complete for an internal playable slice.

Sprint 2 is partially complete:

- Endings exist.
- Result page exists.
- Local archive exists.
- One high-resource ending is smoke-tested.
- Full ending matrix still needs automated coverage.

